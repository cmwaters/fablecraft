module.exports = {
    mode: "development",
    entry: {
        index: "./tests/card/client.ts",
    },
    output: {
        filename: "[name].js",
        path: __dirname + "/public",
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