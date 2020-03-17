module.exports = {
    mode: 'development',
    entry: {
        'room': `${__dirname}/src/room.ts`,
        'viewer': `${__dirname}/src/viewer.ts`,
    },
    output: {
        path: `${__dirname}/public/js`,
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
