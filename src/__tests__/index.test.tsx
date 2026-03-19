jest.mock('react-native', () => ({
  NativeModules: {
    AntsomiSDK: {
      getListGame: jest.fn(),
    },
    ReactNativeEventEmitter: {},
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
  })),
  Platform: {
    OS: 'ios',
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

import { NativeModules } from 'react-native';
import RnAntsomiSdk from '../index';

const mockGetListGame = NativeModules.AntsomiSDK
  .getListGame as jest.MockedFunction<typeof NativeModules.AntsomiSDK.getListGame>;

describe('RnAntsomiSdk.getListGame', () => {
  beforeEach(() => {
    mockGetListGame.mockReset();
  });

  it('throws a structured unauthorized error when the gamification token is expired', async () => {
    mockGetListGame.mockRejectedValueOnce({
      message: 'Request failed with status code 401',
    });

    await expect(RnAntsomiSdk.getListGame()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      requiresLogin: true,
      statusCode: 401,
    });
  });

  it('throws a structured gamification error for other native failures', async () => {
    mockGetListGame.mockRejectedValueOnce({
      message: 'Internal server error',
    });

    const error = await RnAntsomiSdk.getListGame().catch(
      (caughtError) => caughtError
    );

    expect(error).toMatchObject({
      code: 'GAMIFICATION_ERROR',
      requiresLogin: false,
      statusCode: undefined,
    });
    expect(error).toHaveProperty('message', 'Internal server error');
  });
});
