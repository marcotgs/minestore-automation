'use strict';

const path = require('path');
var nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
		devtool: 'nosources-source-map',
		output: {
			filename: '[name].js',
			sourceMapFilename: '[file].map',
			libraryTarget: 'commonjs',
		},
		optimization: {
			minimize: !isDevelopment,
		},
		performance: {
			hints: false,
		},
		module: {
			rules: [
				{
					test: /\.ts?$/,
					loader: 'ts-loader',
				},
			],
		},
		resolve: {
			extensions: ['.ts'],
			plugins: [new TsconfigPathsPlugin()],
		},
		plugins: [
			new CopyPlugin({
				patterns: [{ from: './package.json', to: '.' }],
			}),
		],
		externalsPresets: { node: true },
		externals: [
			nodeExternals({
				additionalModuleDirs: [path.resolve(__dirname, '../../node_modules')],
			}),
		],
		...(isDevelopment && customStats),
	};
};
