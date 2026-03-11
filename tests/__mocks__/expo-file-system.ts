export const cacheDirectory = '/mock-cache/';
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export default {
  cacheDirectory,
  writeAsStringAsync,
  EncodingType,
};
