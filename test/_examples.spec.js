import {expect} from 'chai';

import * as testFramework from '../src';

describe('Examples', () => {

    it('invoking a single passing test', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.itShould('do something', ({then}) => {
                then(() => {});
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.true;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });

    it('invoking a single failing test', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.itShould('do something', ({then}) => {
                then(() => { throw new Error('test-error'); });
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.false;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });
});
