import {expect} from 'chai';

import * as testFramework from '../src';

describe('Examples', () => {

    it('should make the given subject available inside the context API', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.itShould('do something', ({then}) => {
                then(() => true);
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
