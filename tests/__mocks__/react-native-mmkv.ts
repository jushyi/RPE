export const MMKV = jest.fn().mockImplementation(() => ({
  set: jest.fn(),
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  delete: jest.fn(),
  contains: jest.fn(() => false),
  getAllKeys: jest.fn(() => []),
  clearAll: jest.fn(),
}));
