module.exports = function (config) {
    config.set({
        files: [
            {
                pattern: 'dist/src/**/*.js',
                mutated: true,
                included: false
            },
            'dist/test/**/*.js'
        ],
        testRunner: 'mocha',
        testFramework: 'mocha',
        coverageAnalysis: 'perTest',
        reporter: ['html', 'progress'],
    });
};
