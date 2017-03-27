import Promise from 'bluebird';

/**
 * Given an iterable of on-fulfill handlers and an initial value, reduce to a single
 * promise chain whose initial fulfillment value is the given initial value, with each
 * subsequent fulfill handler chained onto the previous one.
 *
 * @signature: [a ~> b, b ~> c, c ~> ... ~> y, y ~> z], a) ~> z
 *
 * @example:
 * ```
 * chainPromises([
 *   (a) => a + '-foo-',
 *   (b) => b + '-bar-',
 *   (c) => c + '-baz'
 *  ], 'init')
 *   .then((result) => console.log(results));   // "init-foo-bar-baz"
 * ```
 */
export function chainPromises(fulfillHandlers, initial) {
    return fulfillHandlers.reduce((promiseChain, handler) => {
        return promiseChain.then(handler);
    }, Promise.resolve(initial));
}
