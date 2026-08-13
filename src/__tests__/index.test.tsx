const fs = require('fs');
const path = require('path');

jest.mock('react-native', () => ({
  NativeModules: {
    AntsomiSDK: {
      config: jest.fn(),
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
const mockConfig = NativeModules.AntsomiSDK.config as jest.MockedFunction<
  typeof NativeModules.AntsomiSDK.config
>;

describe('RnAntsomiSdk.config', () => {
  beforeEach(() => {
    mockConfig.mockReset();
  });

  it('does not resolve until native activation has completed', async () => {
    let resolveNativeConfig: ((value?: unknown) => void) | undefined;
    mockConfig.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNativeConfig = resolve;
        })
    );

    let didResolve = false;
    const configPromise = RnAntsomiSdk.config(
      'portal',
      'props',
      'app',
      'group'
    ).then(() => {
      didResolve = true;
    });

    await Promise.resolve();

    expect(mockConfig).toHaveBeenCalledWith('portal', 'props', 'app', 'group');
    expect(didResolve).toBe(false);

    resolveNativeConfig?.(true);
    await configPromise;

    expect(didResolve).toBe(true);
  });
});

describe('iOS tracking bridge queue contract', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const iosModule = fs.readFileSync(
    path.join(rootDir, 'ios/Antsomirnsdk.swift'),
    'utf8'
  );

  const nativeMethod = (start: string, end: string) => {
    const startIndex = iosModule.indexOf(start);
    const endIndex = iosModule.indexOf(end, startIndex);

    return iosModule.slice(startIndex, endIndex);
  };

  it('finishes config only after main-thread activation', () => {
    const configMethod = nativeMethod(
      'func config(_ portalId:',
      'func setLogLevel('
    );

    expect(configMethod).toContain('DispatchQueue.main.async');
    expect(configMethod).toContain('Antsomi.shared.activate(with: config)');
    expect(configMethod).toContain('resolver(true)');
  });

  it('creates CDP events on the main queue before calling the framework', () => {
    const trackMethod = nativeMethod(
      'func track(_ event:',
      'func trackScreen('
    );

    expect(trackMethod).toContain('DispatchQueue.main.async');
    expect(trackMethod).toContain('var eventCDP = CDPEvent()');
    expect(trackMethod).toContain('Antsomi.shared.track(event: eventCDP)');
  });

  it('keeps trackScreen and getMediaJson on the main queue', () => {
    const trackScreenMethod = nativeMethod(
      'func trackScreen(',
      'func getAllLabels('
    );
    const getMediaJsonMethod = nativeMethod(
      'func getMediaJson(',
      'func modifyAction('
    );

    expect(trackScreenMethod).toContain('DispatchQueue.main.async');
    expect(getMediaJsonMethod).toContain('DispatchQueue.main.async');
  });
});

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
