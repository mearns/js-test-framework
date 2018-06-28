import Promise from 'bluebird'

export function test (testDescriptor) {
  const descriptor = new TestDescriptor()
  const methods = [
    'that'
  ]
  const api = methods.reduce((_api, fieldName) => {
    const delegate = descriptor[fieldName].bind(descriptor)
    _api[fieldName] = (...args) => delegate(...args)
    return _api
  }, {})

  return Promise.method(testDescriptor)(api).then(() => descriptor)
}

class TestDescriptor {
  constructor () {
    this.assertions = []
  }

  that (assertion) {
    this.assertions.push(Promise.method(assertion))

    const and = (...args) => this.that(...args)
    and.that = and
    return {and}
  }

  /**
   * Makes a TestDescriptor into a thennable, which resolves by running the test.
   */
  then (...handlers) {
    const promiseToAssert = this.assertions.reduce((p, assertion) => p.then(() => assertion()), Promise.resolve())
    return promiseToAssert.then(...handlers)
  }
}
