import Promise from 'bluebird';
import isFunction from 'lodash.isfunction';
import {chainPromises} from './services/promise-utils';
import * as Ho from './services/higher-order-utils';

function Given(setup) {
    this.ran = false;
    this.taken = new Taken();
    this.chainApi = {};

    if (isFunction(setup)) {
        this.setup = Promise.method(setup);
        this.chainApi.taken = (cleaner) => {
            this.taken = new Taken(cleaner);
        };
    }
    else {
        const resolvedSetup = Promise.resolve(setup);
        this.setup = () => resolvedSetup;
        this.chainApi.taken = () => {
            throw new Error('The "taken" chain is not available for object setups');
        };
    }
}
Given.prototype.run = function (existingVariables) {
    this.ran = true;
    return this.setup(existingVariables)
        .then((newVariables) => {
            this.succeeded = true;
            this.testVariables = Object.assign({}, existingVariables, newVariables);
            return this.testVariables;
        })
        .catch((error) => {
            this.succeeded = false;
            this.error = error;
            throw error;
        });
};
Given.prototype.cleanup = function () {
    if (this.succeeded) {
        return this.taken.run(this.testVariables);
    }
    return Promise.resolve();
};


function Taken(cleaner) {
    this.ran = false;
    this.cleaner = cleaner ? Promise.method(cleaner) : null;
}
Taken.prototype.run = function (testVariables) {
    this.ran = true;
    if (this.cleaner) {
        return this.cleaner(testVariables)
            .then(() => {
                this.succeeded = true;
            })
            .catch((error) => {
                this.succeeded = false;
                this.error = error;
            });
    }
    else {
        return Promise.resolve()
            .then(() => {
                this.suceeded = true;
            });
    }
};

function When(exercisor) {
    this._exercisor = exercisor;
}
When.prototype._fulfilledPromiseResult = function (value) {
    return {
        value,
        promised: true,
        succeeded: true,
        threw: false,
        rejected: false
    };
};
When.prototype._rejectedPromiseResult = function (error) {
    return {
        error,
        succeeded: false,
        threw: false,
        rejected: true
    };
};
When.prototype._successfulSynchronousResult = function (value) {
    return {
        value,
        promised: false,
        succeeded: true,
        threw: false,
        rejected: false
    };
};
When.prototype._synchronousErrorResult = function (error) {
    return {
        succeeded: false,
        threw: true,
        rejected: false,
        error
    };
};
When.prototype.run = function (testVariables) {
    try {
        const rawValue = this._exercisor(testVariables);
        // If it returns a Promise...
        if (rawValue && isFunction(rawValue.then)) {
            // Then chain onto that promise to wrap the result in a Result object.
            return Promise.resolve(rawValue)
                .then(this._fulfilledPromiseResult.bind(this))
                .catch(this._rejectedPromiseResult.bind(this));
        }
        else {
            // Didn't return a promise, so just wrap the value in a Result object.
            return Promise.resolve(this._successfulSynchronousResult(rawValue));
        }
    }
    catch (error) {
        // Error was thrown by exercisor, wrap it in a Result object.
        return Promise.resolve(this._synchronousErrorResult(error));
    }
};

function TestCase(description, subject, spec) {
    const givens = [];
    let when = null;
    const thens = [];

    const api = {
        given: (setup) => {
            const given = new Given(setup);
            givens.push(given);
            return given.chainApi;
        },

        when: (exercisor) => {
            // TODO: Maybe we need an "after" on "when", like the given().taken;
            if (when) {
                throw new Error('Each test case can have at most one "when" invocation');
            }
            else {
                when = new When(exercisor);
            }
        },

        oneMay: (inspector) => {
            thens.push({inspector: Promise.method(inspector)});
        }
    };

    // Return a function that will run a given "then" with the given
    // test variables.
    const createTestRunner = (result, testVariables) => {
        return ({inspector}) => inspector(result, testVariables);
    };

    // Promise to run all givens and fulfill with the object of test-variables, or
    // reject if setup failed.
    const runSetup = () => {
        return chainPromises(givens.map((given) => given.run.bind(given)), {})
            .then((testVariables) => {
                // make sure we don't expose the actual testVariable object from
                // then last given object.
                return Object.assign({}, testVariables);
            });
    };

    // Promise to run our `when` exercisor with the given test variables, and fulfill
    // with a result indicating the results of running the exercisor.
    const runExercisor = (testVariables) => {
        if (when) {
            return when.run(testVariables);
        }
        else {
            return Promise.resolve();
        }
    };

    const runInspectors = (result, testVariables) => {
        return Promise.mapSeries(thens, createTestRunner(result, testVariables));
    };

    const runCleanup = () => {
        return chainPromises(givens.map((given) => given.cleanup.bind(given)).reverse());
    };

    const exerciseAndInspect = (testVariables) => {
        return runExercisor(testVariables)
            .then((result) => runInspectors(result, testVariables));
    };

    const cleanupAndGetResults = (testResult) => {
        // XXX: FIXME: rollup results from everything.
        return runCleanup()
            .then((Ho.returns(testResult)))
            .catch(getFailingTestResult);
    };

    // A promise to define the test case by running the spec.
    // Note that definition is done unconditionally.
    const promiseToDefine = Promise.method(spec)(api, subject);

    const getPassingTestResult = () => ({passed: true});
    const getFailingTestResult = (error) => ({error, passed: false});

    this.run = () => {
        return promiseToDefine
            .then(runSetup)
            .then(exerciseAndInspect)
            .then(getPassingTestResult)
            .catch(getFailingTestResult)
            .then(cleanupAndGetResults);
    };
}


function TestContext(subject, spec) {
    const testCases = [];
    const api = {
        testThat: (description, testSpec) => {
            testCases.push(new TestCase(description, subject, testSpec));
        }
    };
    const promiseToDefine = Promise.method(spec)(api);

    const runTestCase = (testCase) => testCase.run();

    this.run = () => {
        return promiseToDefine.then(() => Promise.mapSeries(testCases, runTestCase))
            .then((results) => {
                return {
                    numberOfTests: results.length,
                    passed: results.every(({passed}) => passed)
                };
            });
    };

    this.defined = () => {
        return promiseToDefine;
    };
}

export function regarding(subject, spec) {
    return new TestContext(subject, spec);
}
