module.exports = {
	mode: process.env.NODE_ENV,
	entry: {
		main: "./src/main.ts",
	},
	output: {
		filename: "[name].js",
		path: __dirname + "/views",
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
