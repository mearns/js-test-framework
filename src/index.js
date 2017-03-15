import Promise from 'bluebird';
import isFunction from 'lodash.isfunction';

function TestCase(description, subject, spec) {
    const givens = [];
    let when = null;
    const thens = [];
    const api = {
        given: (setup) => {
            const given = {};
            if (isFunction(setup)) {
                given.setup = Promise.method(setup);
            }
            else {
                const resolvedSetup = Promise.resolve(setup);
                given.setup = () => resolvedSetup;
            }
            givens.push(given);
            return {
                taken: (cleaner) => {
                    given.cleaner = Promise.method(cleaner);
                }
            };
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

    // A promise to run a single given, merging it in with the existing variables.
    const promiseToRunGiven = (promiseOfExistingVariables, given) => {
        return promiseOfExistingVariables
          .then((existingVariables) => {
              return given.setup(existingVariables)
                  .then((newVariables) => {
                      given.testVariables = Object.assign({}, existingVariables, newVariables);
                      return given.testVariables;
                  });
          });
    };

    // Return a function that will run a given "then" with the given
    // test variables.
    const createTestRunner = (result, testVariables) => {
        return ({inspector}) => inspector(result, testVariables);
    };

    // Promise to run all givens and fulfill with the object of test-variables, or
    // reject if setup failed.
    const runSetup = () => {
        return givens.reduce(promiseToRunGiven, Promise.resolve({}))
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
        let promiseToCleanAll = Promise.resolve();
        for (let i = givens.length - 1; i >= 0; i--) {  // eslint-disable-line no-magic-numbers
            const given = givens[i];
            const {cleaner, testVariables} = given;
            if (cleaner) {
                // TODO: What do we want to do if a cleaner fails? Continue on, doing our best?
                promiseToCleanAll = promiseToCleanAll.then(() => cleaner(testVariables));
            }
        }
        return promiseToCleanAll;
    };

    this.run = () => {
        return promiseToDefine
            .then(runSetup)
            .then((testVariables) => {
                return runExercisor(testVariables)
                    .then((result) => runInspectors(result, testVariables));
            })
            .then(() => ({passed: true}))
            .catch((error) => ({passed: false, error}))
            .then((testResult) => {
                return runCleanup()
                    .then(() => testResult);
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
