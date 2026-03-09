export const useNetInfo = jest.fn().mockReturnValue({
  isConnected: true,
  isInternetReachable: true,
});

export const addEventListener = jest.fn(() => jest.fn());

export const fetch = jest.fn().mockResolvedValue({
  isConnected: true,
});

export default {
  useNetInfo,
  addEventListener,
  fetch,
};
