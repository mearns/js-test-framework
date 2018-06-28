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
    return expect(jsTestFramework.test(testDescriptor)).to.be.rejected
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
    itShouldPass('if the assertion function is a noop', ({that}) => {
      that(NOOP)
    })

    itShouldFail('if the assertion function throws an error', ({that}) => {
      that(ERROR_THROWING_ASSERTION)
    })

    itShouldFail('if the assertion function includes a failed chai expectation', ({that}) => {
      that(() => expect(1).to.equal(0))
    })

    itShouldFail('if the assertion function returns a promise that rejects', ({that}) => {
      that(() => Promise.reject(new Error('test-error')))
    })

    itShouldPass('if two chained assertions pass', ({that}) => {
      that(PASSING_ASSERTION)
        .and.that(PASSING_ASSERTION)
    })

    itShouldPass('if two chained assertions pass, using "and" as a method', ({that}) => {
      that(PASSING_ASSERTION).and(PASSING_ASSERTION)
    })

    itShouldFail('if the second chained assertion fails', ({that}) => {
      that(PASSING_ASSERTION).and.that(FAILING_ASSERTION)
    })

    itShouldFail('if the first chained assertion fails', ({that}) => {
      that(FAILING_ASSERTION).and.that(PASSING_ASSERTION)
    })

    itShouldPass('if two unchained assertions pass', ({that}) => {
      that(PASSING_ASSERTION)
      that(PASSING_ASSERTION)
    })

    itShouldFail('if the first unchained assertions fails', ({that}) => {
      that(FAILING_ASSERTION)
      that(PASSING_ASSERTION)
    })

    itShouldFail('if the second unchained assertions fails', ({that}) => {
      that(PASSING_ASSERTION)
      that(FAILING_ASSERTION)
    })
  })
})
