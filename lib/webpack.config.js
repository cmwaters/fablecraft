module.exports = {
    mode: process.env.NODE_ENV,
    entry: {
        index: "./src/index.ts",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/dist",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
};