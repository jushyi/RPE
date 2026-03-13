/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-mmkv$': '<rootDir>/tests/__mocks__/react-native-mmkv.ts',
    '^@react-native-community/netinfo$': '<rootDir>/tests/__mocks__/netinfo.ts',
    '^@shopify/react-native-skia$': '<rootDir>/tests/__mocks__/@shopify/react-native-skia.js',
    '^victory-native$': '<rootDir>/tests/__mocks__/victory-native.js',
    '^expo-notifications$': '<rootDir>/tests/__mocks__/expo-notifications.ts',
    '^expo-device$': '<rootDir>/tests/__mocks__/expo-device.ts',
    '^@react-native-community/datetimepicker$': '<rootDir>/tests/__mocks__/@react-native-community/datetimepicker.js',
    '^expo-file-system$': '<rootDir>/tests/__mocks__/expo-file-system.ts',
    '^expo-sharing$': '<rootDir>/tests/__mocks__/expo-sharing.ts',
    '^expo-video-thumbnails$': '<rootDir>/tests/__mocks__/expo-video-thumbnails.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@supabase))',
  ],
};
