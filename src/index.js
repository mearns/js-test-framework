import Promise from 'bluebird'
import 'babel-polyfill'

export class TestFailure extends Error {
  constructor (cause, ...args) {
    super(...args)
    this.cause = cause
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export function test (testDescriptor) {
  const descriptor = new TestDescriptor()
  const methods = [
    'verify',
    'exercise'
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
    this.verifiers = []
    this.exerciserSet = false
    this.exerciser = null
  }

  verify (verifier) {
    this.verifiers.push(Promise.method(verifier))
  }

  exercise (exerciser) {
    if (this.exerciserSet) {
      throw new Error('A test can only have one exercisor ("when" step)')
    }
    this.exerciserSet = true
    this.exerciser = Promise.method(exerciser)
  }

  /**
   * Makes a TestDescriptor into a thennable, which resolves by running the test.
   */
  then (...handlers) {
    const setupVars = {}
    const promiseToExercise = (this.exerciser || (() => Promise.resolve()))(setupVars)
      .catch(error => Promise.reject(new TestFailure(error, 'test failed due to error thrown by exerciser')))
    const promiseToAssert = this.verifiers.reduce((p, assertion) => p.then(result => {
      return assertion(result).then(() => result)
    }), promiseToExercise)
    return promiseToAssert
      .catch(error => Promise.reject(new TestFailure(error, 'Test failed at unknown point')))
      .then(...handlers)
  }
}
