// Support
import chai, {expect} from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

// Module under test
import * as testFramework from '../src';

chai.use(sinonChai);

describe('Examples', () => {

    it('invoking a single passing test', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({oneMay}) => {
                oneMay(() => {});
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
            regardingSomething.testThat('do something', ({oneMay}) => {
                oneMay(() => { throw new Error('test-error'); });
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
            regardingSomething.testThat('do something', ({oneMay}) => {
                const DELAY_MS = 10;
                oneMay(() => Promise.delay(DELAY_MS).then(() => Promise.reject(new Error('test-error'))));
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.false;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });

    it('invoking a single test that passes with a fulfilled promise', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({oneMay}) => {
                const DELAY_MS = 10;
                oneMay(() => Promise.delay(DELAY_MS));
            });
        })
            .run()
            .then((testResults) => {
                const NUMBER_OF_TESTS = 1;
                expect(testResults.passed).to.be.true;
                expect(testResults.numberOfTests).to.equal(NUMBER_OF_TESTS);
            });
    });

    it('using the subject in a test spec', () => {
        const testSpec = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', testSpec);
        })
            .defined()
            .then(() => {
                expect(testSpec).to.have.been.calledWith(sinon.match.any, 'something');
            });
    });

    it('using "given" to define test variables with an object', () => {
        const inspectorStub = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given({foo: 'bar'});
                oneMay(inspectorStub);
            });
        })
            .run()
            .then(() => {
                expect(inspectorStub).to.have.been.calledWith(sinon.match.any, {foo: 'bar'});
            });
    });

    it('using "given" to define test variables with Promise of an object', () => {
        const inspectorStub = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given(Promise.resolve({foo: 'bar'}));
                oneMay(inspectorStub);
            });
        })
            .run()
            .then(() => {
                expect(inspectorStub).to.have.been.calledWith(sinon.match.any, {foo: 'bar'});
            });
    });

    it('using "given" to define test variables with function that returns an object', () => {
        const inspectorStub = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given(() => ({foo: 'bar'}));
                oneMay(inspectorStub);
            });
        })
            .run()
            .then(() => {
                expect(inspectorStub).to.have.been.calledWith(sinon.match.any, {foo: 'bar'});
            });
    });

    it('using "given" to define test variables with function that returns a Promise of an object', () => {
        const inspectorStub = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given(() => Promise.resolve({foo: 'bar'}));
                oneMay(inspectorStub);
            });
        })
            .run()
            .then(() => {
                expect(inspectorStub).to.have.been.calledWith(sinon.match.any, {foo: 'bar'});
            });
    });

    it('using "given" multiple times, replacing existing test variables', () => {
        const inspectorStub = sinon.stub();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given(Promise.resolve({foo: 'bar', baz: 'trot'}));
                given({foo: 'New Bar', hunger: 'thirst'});
                oneMay(inspectorStub);
            });
        })
            .run()
            .then(() => {
                expect(inspectorStub).to.have.been.calledWith(
                    sinon.match.any, {foo: 'New Bar', baz: 'trot', hunger: 'thirst'});
            });
    });

    it('using "given" multiple times, existing variables should be received by each setup function', () => {
        const setupStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given(Promise.resolve({foo: 'bar', baz: 'trot'}));
                given(({baz}) => ({upperBaz: baz.toUpperCase()}));
                given(setupStub);
            });
        })
            .run()
            .then(() => {
                expect(setupStub).to.have.been.calledWith({foo: 'bar', baz: 'trot', upperBaz: 'TROT'});
            });
    });

    it('when no "oneMay" is used, passes', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given({});
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
            });
    });

    it('when a "given" throws an error, the test case is failed', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given(() => {
                    throw new Error('test-error');
                });
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.false;
            });
    });

    it('when a "given" rejects, the test case is failed', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given(Promise.reject(new Error('test-error')));
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.false;
            });
    });

    it('when a "given" returns a Promise that rejects, the test case is failed', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given(() => Promise.reject(new Error('test-error')));
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.false;
            });
    });

    it('when a "given" returns a Promise that rejects, the test case is failed', () => {
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given}) => {
                given(() => Promise.reject(new Error('test-error')));
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.false;
            });
    });

    it('example: using a "when" call', () => {
        const inspectorStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, when, oneMay}) => {
                given(() => Promise.resolve({foo: 'my-result'}));
                when(({foo}) => `when-${foo}`);
                oneMay(inspectorStub);
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
                expect(inspectorStub).to.have.been.calledWith(sinon.match({
                    value: 'when-my-result',
                    promised: false,
                    succeeded: true,
                    threw: false,
                    rejected: false
                }), {foo: 'my-result'});
            });
    });

    it('example: using a "when" call that throws an error', () => {
        const inspectorStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({when, oneMay}) => {
                when(() => {
                    throw new Error('test-error');
                });
                oneMay(inspectorStub);
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
                expect(inspectorStub).to.have.been.calledWith(sinon.match({
                    error: new Error('test-error'),
                    succeeded: false,
                    threw: true,
                    rejected: false
                }), {});
            });
    });

    it('example: using a "when" call that returns a Promise that fulfills', () => {
        const inspectorStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({when, oneMay}) => {
                when(() => Promise.resolve('my-result'));
                oneMay(inspectorStub);
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
                expect(inspectorStub).to.have.been.calledWith(sinon.match({
                    value: 'my-result',
                    promised: true,
                    succeeded: true,
                    threw: false,
                    rejected: false
                }), {});
            });
    });

    it('example: using a "when" call that returns a Promise that rejects', () => {
        const inspectorStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({when, oneMay}) => {
                when(() => Promise.reject(new Error('test-error')));
                oneMay(inspectorStub);
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
                expect(inspectorStub).to.have.been.calledWith(sinon.match({
                    error: new Error('test-error'),
                    succeeded: false,
                    threw: false,
                    rejected: true
                }), {});
            });
    });

    it('using a "given" and "taken"', () => {
        const cleanerStub = sinon.spy();
        const inspectorStub = sinon.spy();
        return testFramework.regarding('something', (regardingSomething) => {
            regardingSomething.testThat('do something', ({given, oneMay}) => {
                given(() => Promise.resolve({foo: 'bar'}))
                    .taken(cleanerStub);
                oneMay(inspectorStub);
            });
        })
            .run()
            .then((testResults) => {
                expect(testResults.passed).to.be.true;
                expect(cleanerStub).to.have.been.calledOnce;
                expect(cleanerStub).to.have.been.calledAfter(inspectorStub);
                expect(cleanerStub).to.have.been.calledWith(sinon.match({foo: 'bar'}));
            });
    });

    it('should fail at somepoint before run if an error or rejection occurs during definition');
});
