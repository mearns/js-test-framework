import Promise from 'bluebird';

function TestCase(description, subject, spec) {
    const thens = [];
    const api = {
        then: (inspector) => {
            thens.push({inspector: Promise.method(inspector)});
        }
    };
    const promiseToDefine = Promise.method(spec)(api, subject);

    const runThen = ({inspector}) => inspector();

    this.run = () => {
        return promiseToDefine.then(() => Promise.mapSeries(thens, runThen))
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
