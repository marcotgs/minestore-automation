module.exports = {
	preset: 'ts-jest',
	// Automatically clear mock calls and instances between every test
	clearMocks: true,

	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.{ts,tsx}'],
	coveragePathIgnorePatterns: ['node_modules', 'index.ts'],

	// The directory where Jest should output its coverage files
	coverageDirectory: '<rootDir>/coverage',

	// Indicates which provider should be used to instrument code for coverage
	coverageProvider: 'babel',

	// An object that configures minimum threshold enforcement for coverage results
	coverageThreshold: {
		global: {
			branches: 85,
			functions: 85,
			lines: 85,
			statements: -10,
		},
	},

	// An array of file extensions your modules use
	moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],

	// The test environment that will be used for testing
	testEnvironment: 'node',
};
