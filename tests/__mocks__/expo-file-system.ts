// Mock for expo-file-system SDK 55 API (File/Directory/Paths classes)

class MockFile {
  uri: string;
  constructor(...uris: string[]) {
    this.uri = uris.join('/');
  }
  copy = jest.fn();
  move = jest.fn();
  delete = jest.fn();
  text = jest.fn().mockResolvedValue('mock-text');
  arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));
}

class MockDirectory {
  uri: string;
  constructor(...uris: string[]) {
    this.uri = uris.join('/');
  }
  create = jest.fn();
  delete = jest.fn();
  list = jest.fn().mockReturnValue([]);
}

const Paths = {
  cache: new MockDirectory('file:///mock-cache'),
  document: new MockDirectory('file:///mock-documents'),
  bundle: new MockDirectory('file:///mock-bundle'),
};

// Legacy exports for backward compatibility with older test code
const cacheDirectory = '/mock-cache/';
const documentDirectory = '/mock-documents/';
const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
const readAsStringAsync = jest.fn().mockResolvedValue('bW9jay1iYXNlNjQ=');
const copyAsync = jest.fn().mockResolvedValue(undefined);
const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export {
  MockFile as File,
  MockDirectory as Directory,
  Paths,
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  copyAsync,
  EncodingType,
};

export default {
  File: MockFile,
  Directory: MockDirectory,
  Paths,
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  copyAsync,
  EncodingType,
};
