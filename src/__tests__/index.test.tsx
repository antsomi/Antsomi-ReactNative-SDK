const fs = require('fs');
const path = require('path');

jest.mock('react-native', () => ({
  NativeModules: {
    AntsomiSDK: {
      getListGame: jest.fn(),
      playGame: jest.fn(),
      playGameById: jest.fn(),
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
  .getListGame as jest.MockedFunction<
  typeof NativeModules.AntsomiSDK.getListGame
>;
const mockPlayGame = NativeModules.AntsomiSDK.playGame as jest.MockedFunction<
  typeof NativeModules.AntsomiSDK.playGame
>;
const mockPlayGameById = NativeModules.AntsomiSDK
  .playGameById as jest.MockedFunction<
  typeof NativeModules.AntsomiSDK.playGameById
>;

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

describe('RnAntsomiSdk.playGame sourceUrl', () => {
  beforeEach(() => {
    mockPlayGame.mockReset();
    mockPlayGameById.mockReset();
  });

  it('forwards sourceUrl through the JS wrapper', async () => {
    mockPlayGame.mockResolvedValueOnce(true);

    await RnAntsomiSdk.playGame('spin-wheel', 'https://app.example/games');

    expect(mockPlayGame).toHaveBeenCalledWith(
      'spin-wheel',
      'https://app.example/games'
    );
  });

  it('forwards sourceUrl to playGameById on iOS', async () => {
    mockPlayGameById.mockResolvedValueOnce(true);

    await RnAntsomiSdk.playGameById('game-123', 'https://app.example/detail');

    expect(mockPlayGameById).toHaveBeenCalledWith(
      'game-123',
      'https://app.example/detail'
    );
  });

  it('keeps the native bridge sourceUrl contract in sync', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const iosBridge = fs.readFileSync(
      path.join(rootDir, 'ios/Antsomirnsdk.mm'),
      'utf8'
    );
    const iosModule = fs.readFileSync(
      path.join(rootDir, 'ios/Antsomirnsdk.swift'),
      'utf8'
    );
    const androidModule = fs.readFileSync(
      path.join(rootDir, 'android/src/main/java/com/antsomirnsdk/Antsomi.java'),
      'utf8'
    );

    expect(iosBridge).toContain('playGame:(NSString *)gameCode');
    expect(iosBridge).toContain('sourceUrl:(NSString *)sourceUrl');
    expect(iosBridge).toContain('playGameById:(NSString *)gameId');
    expect(iosModule).toContain(
      'func playGame(_ gameCode: String, sourceUrl: String'
    );
    expect(iosModule).toContain(
      'Antsomi.shared.playGame(gameCode: gameCode, sourceUrl: sourceUrl)'
    );
    expect(iosModule).toContain(
      'func playGameById(_ gameId: String, sourceUrl: String'
    );
    expect(iosModule).toContain(
      'Antsomi.shared.playGame(gameCode: gameCode, sourceUrl: sourceUrl)'
    );
    expect(androidModule).toContain(
      'public void playGame(String gameCode, String sourceUrl, Promise promise)'
    );
    expect(androidModule).toContain(
      'AntsomiSdk.getInstance().playGame(gameCode, sourceUrl)'
    );
  });
});
