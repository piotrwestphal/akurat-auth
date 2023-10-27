module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test', '<rootDir>/int'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '@lambda-types': '<rootDir>/lib/lambda-types',
    },
}
