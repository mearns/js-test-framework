/* eslint-env mocha */

// module under test
import * as jsTestFramework from '../../src'

// support
import chai, {expect} from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

function itShouldPass (when, testDescriptor) {
  it(`should pass ${when}`, () => {
    return jsTestFramework.test(testDescriptor)
  })
}

function itShouldFail (when, testDescriptor) {
  it(`should fail ${when}`, () => {
    return expect(jsTestFramework.test(testDescriptor)).to.be.rejectedWith(jsTestFramework.TestFailure)
  })
}


const NOOP = () => {}
const ERROR_THROWING_ASSERTION = () => { throw new Error('test-error')}

// This is assumed, and proven in a unit test below.
const PASSING_ASSERTION = NOOP

// This is assumed, and proven in a unit test below.
const FAILING_ASSERTION = ERROR_THROWING_ASSERTION

describe('some example test specs', () => {
  describe('basic assertion rules', () => {
    itShouldPass('if the assertion function is a noop', ({verify}) => {
      verify(NOOP)
    })

    itShouldFail('if the assertion function throws an error', ({verify}) => {
      verify(ERROR_THROWING_ASSERTION)
    })

    itShouldFail('if the assertion function includes a failed chai expectation', ({verify}) => {
      verify(() => expect(1).to.equal(0))
    })

    itShouldFail('if the assertion function returns a promise that rejects', ({verify}) => {
      verify(() => Promise.reject(new Error('test-error')))
    })

    itShouldPass('if two assertions pass', ({verify}) => {
      verify(PASSING_ASSERTION)
      verify(PASSING_ASSERTION)
    })

    itShouldFail('if the first assertions fails', ({verify}) => {
      verify(FAILING_ASSERTION)
      verify(PASSING_ASSERTION)
    })

    itShouldFail('if the second assertions fails', ({verify}) => {
      verify(PASSING_ASSERTION)
      verify(FAILING_ASSERTION)
    })
  })

  describe('The exercise stage', () => {
    itShouldFail('when the exerciser throws an exception', ({exercise}) => {
      exercise(() => { throw new Error('test-error') })
    })
  })
})
