// Support
import {expect} from 'chai';
import Promise from 'bluebird';

// Module under test
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

    it('invoking a single test that fails with a rejected promise', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.itShould('do something', ({then}) => {
                const DELAY_MS = 10;
                then(() => Promise.delay(DELAY_MS).then(() => Promise.reject(new Error('test-error'))));
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.false;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });

    it('invoking a single test that passed with a fulfilled promise', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.itShould('do something', ({then}) => {
                const DELAY_MS = 10;
                then(() => Promise.delay(DELAY_MS));
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.true;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });

});
