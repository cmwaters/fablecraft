module.exports = {
    mode: "development",
    entry: {
        index: "./src/index.ts",
        tests: "./tests/unit.ts",
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
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};