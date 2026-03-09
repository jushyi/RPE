const mockStorage: Record<string, string> = {};

const mockMMKVInstance = {
  set: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  getString: jest.fn((key: string) => mockStorage[key] ?? undefined),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  delete: jest.fn((key: string) => {
    delete mockStorage[key];
  }),
  remove: jest.fn((key: string) => {
    delete mockStorage[key];
  }),
  contains: jest.fn((key: string) => key in mockStorage),
  getAllKeys: jest.fn(() => Object.keys(mockStorage)),
  clearAll: jest.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
};

// v4 API: createMMKV() function
export const createMMKV = jest.fn(() => mockMMKVInstance);

// Legacy v3 API: MMKV class (for backwards compatibility)
export const MMKV = jest.fn(() => mockMMKVInstance);
