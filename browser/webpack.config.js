module.exports = {
	entry: {
		main: "./src/main.ts",
		index: "./index.ts"
	},
	output: {
		filename: "[name].js",
		path: __dirname + "dist",
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
