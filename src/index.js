import Promise from 'bluebird';
import isFunction from 'lodash.isfunction';
import {chainPromises} from './services/promise-utils';

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

        oneMay: (inspector) => {
            thens.push({inspector: Promise.method(inspector)});
        },

        when: (exercisor) => {
            // TODO: Maybe we need a "after" on "when", like the given().taken;
            if (when) {
                throw new Error('Each test case can only have at most one "when" invocation');
            }
            else {
                when = {exercisor};
            }
        }
    };

    // A promise to define the test case by running the spec.
    const promiseToDefine = Promise.method(spec)(api, subject);

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

    const runExercisor = (testVariables) => {
        if (when) {
            try {
                const rawValue = when.exercisor(testVariables);
                if (rawValue && isFunction(rawValue.then)) {
                    return Promise.resolve(rawValue)
                        .then((value) => ({
                            value,
                            promised: true,
                            succeeded: true,
                            threw: false,
                            rejected: false
                        }))
                        .catch((error) => ({
                            error,
                            succeeded: false,
                            threw: false,
                            rejected: true
                        }));
                }
                else {
                    return Promise.resolve({
                        value: rawValue,
                        promised: false,
                        succeeded: true,
                        threw: false,
                        rejected: false
                    });
                }
            }
            catch (error) {
                return Promise.resolve({
                    succeeded: false,
                    threw: true,
                    rejected: false,
                    error
                });
            }
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

    this.run = () => {
        return promiseToDefine
            .then(runSetup)
            .then((testVariables) => {
                return runExercisor(testVariables)
                    .then((result) => runInspectors(result, testVariables));
            })
            .then(() => ({passed: true}))
            .catch((error) => {
                return {passed: false, error};
            })
            .then((testResult) => {
                return runCleanup()
                    .then(() => testResult)
                    .catch((error) => {
                        // XXX: FIXME: rollup results from everything.
                        return {passed: false, error};
                    });
            });
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
