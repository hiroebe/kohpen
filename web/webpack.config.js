module.exports = {
    mode: 'development',
    entry: {
        'main': `${__dirname}/src/main.ts`,
        'viewer': `${__dirname}/src/viewer.ts`,
    },
    output: {
        path: `${__dirname}/public`,
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
};
