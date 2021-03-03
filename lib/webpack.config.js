const { plugin: BundleDTSPlugin } = require('bundle-dts');

module.exports = {
    mode: "development",
    entry: {
        fabletree: "./src/index.ts",
        tests: "./tests/unit.ts",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist",
        library: "FableTree",
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
        new BundleDTSPlugin({ entry: './src/index.ts', outFile: './dist/fabletree.d.ts' }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};