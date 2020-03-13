module.exports = {
    mode: 'development',
    entry: `${__dirname}/src/main.ts`,
    output: {
        path: `${__dirname}/public`,
        filename: 'main.js',
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
