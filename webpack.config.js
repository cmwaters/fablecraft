const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
	mode: process.env.NODE_ENV,
	entry: {
		index: "./app/index.ts",
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
	},
	resolve: {
		extensions: [".styl", ".ts", ".js"],
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
			{
				test: /\.styl$/,
				use: [
					{
						loader: "style-loader", // creates style nodes from JS strings
					},
					{
						loader: "css-loader", // translates CSS into CommonJS
					},
					{
						loader: "stylus-loader", // compiles Stylus to CSS
					},
				],
			}
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "assets/html", to: "" },
			],
		}),
	],
};
