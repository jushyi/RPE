export const shareAsync = jest.fn().mockResolvedValue(undefined);
export const isAvailableAsync = jest.fn().mockResolvedValue(true);

export default {
  shareAsync,
  isAvailableAsync,
};
