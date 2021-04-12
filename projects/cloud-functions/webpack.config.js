'use strict';

var glob = require('glob');
var nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const customStats = {
	stats: {
		colors: true,
		hash: false,
		version: false,
		timings: false,
		assets: false,
		chunks: false,
		modules: false,
		reasons: false,
		children: false,
		source: false,
		errorDetails: false,
		warnings: false,
		publicPath: false,
	},
};

module.exports = (_env, argv) => {
	const isDevelopment = argv.mode === 'development';
	return {
		entry: './src/main.ts',
		target: 'node',
		devtool: 'nosources-source-map',
		output: {
			filename: '[name].js',
			sourceMapFilename: '[file].map',
			libraryTarget: isDevelopment ? 'commonjs2' : 'commonjs',
		},
		optimization: {
			minimize: false,
		},
		performance: {
			hints: false,
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'ts-loader',
					options: {
						transpileOnly: true,
					},
				},
			],
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js'],
			plugins: [new TsconfigPathsPlugin()],
		},
		externals: [nodeExternals(), 'firebase-admin', '@firebase'],
		...(isDevelopment && customStats),
	};
};
