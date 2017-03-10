import Promise from 'bluebird';

function TestCase(description, subject, spec) {
    const thens = [];
    const givens = [];
    const api = {
        then: (inspector) => {
            thens.push({inspector: Promise.method(inspector)});
        },

        given: (setup) => {
            givens.push({setup: Promise.resolve(setup)});
        }
    };

    // A promise to define the test case by running the spec.
    const promiseToDefine = Promise.method(spec)(api, subject);

    // A promise to run a single given, merging it in with the existing variables.
    const promiseToRunGiven = (promiseOfExistingVariables, {setup}) => {
        return promiseOfExistingVariables
          .then((existingVariables) => {
              return setup.then((newVariables) => Object.assign({}, existingVariables, newVariables));
          });
    };

    // Return a function that will run a given "then" with the given
    // test variables.
    const createTestRunner = (testVariables) => {
        return ({inspector}) => inspector(testVariables);
    };

    const runSetup = () => {
        return givens.reduce(promiseToRunGiven, Promise.resolve({}));
    };

    const runThens = (testVariables) => {
        return Promise.mapSeries(thens, createTestRunner(testVariables));
    };

    this.run = () => {
        return promiseToDefine
            .then(runSetup)
            .then(runThens)
            .then(() => ({passed: true}))
            .catch((error) => ({passed: false, error}));
    };
}


function TestContext(subject, spec) {
    const testCases = [];
    const api = {
        itShould: (description, testSpec) => {
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
}

function TestRunner(subject, spec) {
    const rootContext = new TestContext(subject, spec);
    this.run = () => rootContext.run();
}

export function regarding(subject, spec) {
    return new TestRunner(subject, spec);
}
