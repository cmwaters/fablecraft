const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	mode: process.env.NODE_ENV,
	entry: {
		main: "./app/index.ts",
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
			{
				test: /\.styl$/,
				include: [path.resolve(__dirname, '../assets')],
				use: ['css-loader', 'stylus-loader'],
			}
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "assets/html", to: "dist" },
			],
		}),
	],
};
