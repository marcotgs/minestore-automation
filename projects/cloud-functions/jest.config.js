const baseConfig = require('../../jest.config.base');
module.exports = {
	...baseConfig,
	setupFilesAfterEnv: ['./src/testing/setupTests.ts'],
};
