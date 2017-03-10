import Promise from 'bluebird';

function TestCase(description, subject, spec) {
    const thens = [];
    const givens = [];
    const api = {
        then: (inspector) => {
            thens.push({inspector: Promise.method(inspector)});
        },

        given: (setup) => {
            givens.push({setup});
        }
    };
    const promiseToDefine = Promise.method(spec)(api, subject);

    const runSetup = (existingVariables, {setup}) => {
        return Object.assign({}, existingVariables, setup);
    };
    const thenRunner = (testVariables) => {
        return ({inspector}) => inspector(testVariables);
    };

    this.run = () => {
        const testVariables = givens.reduce(runSetup, {});
        return promiseToDefine.then(() => Promise.mapSeries(thens, thenRunner(testVariables)))
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
