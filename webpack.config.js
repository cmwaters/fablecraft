const dotenv = require("dotenv");
dotenv.config();

module.exports = {
	mode: process.env.MODE,
	watch: false,
	entry: {
		fablecraft: "./client/fablecraft.ts",
	},
	output: {
		filename: "[name].js",
		path: __dirname + "/dist/client",
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
