import Promise from 'bluebird';

export function chainPromises(fulfillHandlers, initial) {
    return fulfillHandlers.reduce((promiseChain, handler) => {
        return promiseChain.then(handler);
    }, Promise.resolve(initial));
}
