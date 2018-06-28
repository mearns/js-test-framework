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

describe('some example test specs', () => {
  describe('basic assertion rules', () => {
    itShouldPass('if the assertion function is a noop', ({that}) => {
      that(() => {})
    })

    itShouldPass('if two chained assertions are noops', ({that}) => {
      that(() => {})
        .and.that(() => {})
    })

    itShouldPass('if two chained assertions are noops (2)', ({that}) => {
      that(() => {}).and(() => {})
    })

    itShouldFail('if the second chained assertion fails', ({that}) => {
      that(() => {}).and.that(() => { throw new Error('test-error') })
    })

    itShouldFail('if the first chained assertion fails', ({that}) => {
      that(() => { throw new Error('test-error') }).and.that(() => {})
    })

    itShouldFail('if the assertion function throws an error', ({that}) => {
      that(() => {
        throw new Error('test-error')
      })
    })

    itShouldFail('if the assertion function includes a failed chai expectation', ({that}) => {
      that(() => expect(1).to.equal(0))
    })

    itShouldFail('if the assertion function returns a promise that rejects', ({that}) => {
      that(() => Promise.reject(new Error('test-error')))
    })
  })
})
