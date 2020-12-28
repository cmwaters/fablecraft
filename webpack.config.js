const dotenv = require("dotenv");
dotenv.config();

module.exports = {
	mode: process.env.NODE_ENV,
	watch: false,
	entry: {
		main: "./client/main.ts"
	},
	output: {
		filename: "[name].js",
		path: __dirname + "/build/client",
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js", ".json"],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.svg$/,
				loader: "svg-inline-loader",
			},
			{
				test: /\.(png|jpg|gif)$/,
				use: ["file-loader"],
			},
		],
	},
};
