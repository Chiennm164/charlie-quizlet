// Cấu hình Jest cho Angular, dùng preset của jest-preset-angular để biên dịch .ts/.html qua TS/Angular compiler.
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
