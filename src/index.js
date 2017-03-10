import Promise from 'bluebird';

export function regarding(subject, spec) {
    return Promise.method(spec)({subject});
}
