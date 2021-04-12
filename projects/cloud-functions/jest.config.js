const { pathsToModuleNameMapper } = require('ts-jest/utils');
const baseConfig = require('../../jest.config.base');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
	...baseConfig,
	rootDir: '.',
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: '<rootDir>/',
	}),
	setupFilesAfterEnv: ['./src/testing/setupTests.ts'],
};
