const baseConfig = require('./jest.config.base');

module.exports = {
	...baseConfig,
	projects: ['<rootDir>/projects/*/jest.config.js'],
};
