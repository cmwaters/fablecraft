const { plugin: BundleDTSPlugin } = require('bundle-dts');

module.exports = {
    mode: "development",
    entry: {
        commandline: "./index.ts",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist",
        library: "commandline",
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
        new BundleDTSPlugin({ entry: './index.ts', outFile: './dist/commandline.d.ts' }),
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