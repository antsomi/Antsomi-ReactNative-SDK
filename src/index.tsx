import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

import {
  GET_MESSAGE_APP_INBOX_LIST,
  GET_COUNT_TOTAL_INBOX,
  GET_ALL_LABELS_INBOX,
  GET_DETAIL_MESSAGE_INBOX,
  RECEIVE_NEW_MESSAGE_INBOX,
  GET_UID,
  GET_PUSH_UID,
  GET_CUSTOMER_ID,
  GET_PROPS_ID,
  GET_PORTAL_ID,
  GET_DEVICE_ID,
  PENDING_LINK,
  OPENED_NOTIFICATION,
} from './events/events';
import { isNativeModuleLoaded } from './events/helpers';

const AntsomiSDK = NativeModules.AntsomiSDK;
const ReactNativeEventEmitter = NativeModules.ReactNativeEventEmitter;

const callbacksNewMessage: Function[] = [];

// const eventManager = new EventManager(AntsomiSDK);
const eventEmitter = new NativeEventEmitter(AntsomiSDK);
const iosEventEmitter = new NativeEventEmitter(ReactNativeEventEmitter);

// On Android these getters return their value through a one-shot device event.
// The listener MUST be attached before triggering the native call, otherwise the
// native side can emit before the listener exists and the event is lost (causing
// the promise to hang "sometimes"). The subscription removes itself on the first
// event so listeners never accumulate and cross-resolve later calls.
function awaitNativeEvent<T>(eventName: string, trigger: () => void): Promise<T> {
  return new Promise<T>((resolve) => {
    const subscription = eventEmitter.addListener(eventName, (data: T) => {
      subscription.remove();
      resolve(data);
    });
    trigger();
  });
}

type GamificationErrorCode = 'GAMIFICATION_ERROR' | 'UNAUTHORIZED';

type NativeSdkError = {
  code?: string;
  message?: string;
  statusCode?: number;
  userInfo?: {
    statusCode?: number;
  };
};

export class GamificationError extends Error {
  code: GamificationErrorCode;
  requiresLogin: boolean;
  statusCode?: number;
  cause?: unknown;

  constructor(params: {
    message: string;
    code: GamificationErrorCode;
    requiresLogin: boolean;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'GamificationError';
    this.code = params.code;
    this.requiresLogin = params.requiresLogin;
    this.statusCode = params.statusCode;
    this.cause = params.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function getGamificationErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  const nativeMessage = (error as NativeSdkError | undefined)?.message;
  if (typeof nativeMessage === 'string' && nativeMessage.length > 0) {
    return nativeMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Gamification request failed';
}

function getGamificationErrorText(error: unknown): string {
  const message = getGamificationErrorMessage(error);

  if (message !== 'Gamification request failed') {
    return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch (_) {
    return message;
  }
}

function getGamificationStatusCode(error: unknown): number | undefined {
  const nativeError = error as NativeSdkError | undefined;
  const directStatusCode =
    nativeError?.statusCode ?? nativeError?.userInfo?.statusCode;

  if (typeof directStatusCode === 'number') {
    return directStatusCode;
  }

  const errorText = getGamificationErrorText(error);
  const matchedStatusCode = errorText.match(/\b(\d{3})\b/);

  if (!matchedStatusCode) {
    return undefined;
  }

  return Number(matchedStatusCode[1]);
}

function toGamificationError(error: unknown): GamificationError {
  const statusCode = getGamificationStatusCode(error);
  const requiresLogin = statusCode === 401;
  const message = getGamificationErrorMessage(error);

  return new GamificationError({
    message: requiresLogin
      ? 'Gamification session expired. Please login again.'
      : message,
    code: requiresLogin ? 'UNAUTHORIZED' : 'GAMIFICATION_ERROR',
    requiresLogin,
    statusCode,
    cause: error,
  });
}

export function isGamificationUnauthorizedError(error: unknown): boolean {
  if (error instanceof GamificationError) {
    return error.code === 'UNAUTHORIZED';
  }

  return (
    (error as { code?: unknown } | undefined)?.code === 'UNAUTHORIZED' ||
    (error as { requiresLogin?: unknown } | undefined)?.requiresLogin === true
  );
}

export default class RnAntsomiSdk {
  static async config(
    portalId: string,
    propsId: string,
    appId: string,
    appGroupId: string
  ): Promise<void> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return;
    }

    await AntsomiSDK.config(portalId, propsId, appId, appGroupId);
  }

  static async appInboxInit(
    destinationId: string,
    audienceType: 'visitor' | 'customer'
  ): Promise<void> {
    return await AntsomiSDK.appInboxInit(destinationId, audienceType);
  }

  static async setLogLevel(level: number): Promise<void> {
    await AntsomiSDK.setLogLevel(level);
  }

  static async getListMessage(
    labels: string[],
    page: number
  ): Promise<AppInboxItem[]> {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getMessages(labels, page);
    }
    return await awaitNativeEvent(GET_MESSAGE_APP_INBOX_LIST, () =>
      AntsomiSDK.getMessages(labels, page)
    );
  }

  static async track(event: CDPEvent): Promise<void> {
    await AntsomiSDK.track(event);
  }

  static async trackScreen(
    name: string,
    title: string = '',
    type: string = ''
  ): Promise<void> {
    await AntsomiSDK.trackScreen(name, title, type);
  }

  static async getCustomerId() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getCustomerId();
    }
    return await awaitNativeEvent(GET_CUSTOMER_ID, () =>
      AntsomiSDK.getCustomerId()
    );
  }

  static async getPropsId() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getPropsId();
    }
    return await awaitNativeEvent(GET_PROPS_ID, () => AntsomiSDK.getPropsId());
  }

  static async getPortalId() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getPortalId();
    }
    return await awaitNativeEvent(GET_PORTAL_ID, () => AntsomiSDK.getPortalId());
  }

  static async getDeviceId() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getDeviceId();
    }
    return await awaitNativeEvent(GET_DEVICE_ID, () => AntsomiSDK.getDeviceId());
  }

  static async getUnreadMessageCount() {
    return await awaitNativeEvent(GET_COUNT_TOTAL_INBOX, () =>
      AntsomiSDK.getUnreadMessageCount()
    );
  }

  static async getAllLabels(callback: Function) {
    if (Platform.OS === 'ios') {
      const data = await AntsomiSDK.getAllLabels();
      callback(data);
    } else {
      const subscription = eventEmitter.addListener(
        GET_ALL_LABELS_INBOX,
        (messages) => {
          subscription.remove();
          callback(messages);
        }
      );
      AntsomiSDK.getAllLabels();
    }
  }

  static async getMessageById(messageId: string) {
    return await awaitNativeEvent(GET_DETAIL_MESSAGE_INBOX, () =>
      AntsomiSDK.getMessageById(messageId)
    );
  }

  static async setPageLimit(limit: number) {
    AntsomiSDK.setPageLimit(limit);
  }

  static async setCustomerId(customerId: string) {
    AntsomiSDK.setCustomerId(customerId);
  }

  static async resetCustomer() {
    AntsomiSDK.resetCustomer();
  }

  static async setIsDelivery(isDelivery: boolean) {
    AntsomiSDK.setIsDelivery(isDelivery);
  }

  static async modifyAction(messageIds: string[], action: MessageStatus) {
    AntsomiSDK.modifyAction(messageIds, action);
  }

  static async handleDeeplinkURL(url: string) {
    AntsomiSDK.handleDeeplinkURL(url);
  }

  static async handleTrackingUrl(trackingUrl: string) {
    AntsomiSDK.handleTrackingUrl(trackingUrl);
  }

  static setCallbackNewMessage(callback: Function) {
    callbacksNewMessage.push(callback);
  }

  static async newMessageReceived() {
    if (Platform.OS === 'ios') {
      iosEventEmitter.addListener(
        RECEIVE_NEW_MESSAGE_INBOX,
        (message: AppInboxItem) => {
          if (callbacksNewMessage.length > 0) {
            callbacksNewMessage.forEach((callback) => callback(message));
          }
        }
      );
    } else {
      AntsomiSDK.newMessageReceived();
      eventEmitter.addListener(
        RECEIVE_NEW_MESSAGE_INBOX,
        (message: AppInboxItem) => {
          if (callbacksNewMessage.length > 0) {
            callbacksNewMessage.forEach((callback) => callback(message));
          }
        }
      );
    }
  }

  static async requestNotificationPermission() {
    AntsomiSDK.requestNotificationPermission();
  }

  static async getPushUid() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getPushUid();
    }
    return await awaitNativeEvent(GET_PUSH_UID, () => AntsomiSDK.getPushUid());
  }

  static async getUid() {
    if (Platform.OS === 'ios') {
      return await AntsomiSDK.getUid();
    }
    return await awaitNativeEvent(GET_UID, () => AntsomiSDK.getUid());
  }

  static async resetUid(): Promise<void> {
    return await AntsomiSDK.resetUid();
  }

  static async setUid(uid: string): Promise<void> {
    return await AntsomiSDK.setUid(uid);
  }

  static async getMediaJson(event: CDPEvent, storyId: string) {
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const message = await AntsomiSDK.getMediaJson(event, storyId);
        resolve(message);
      } else {
        try {
          const message = await AntsomiSDK.getMediaJson(event, storyId);
          if (typeof message === 'string') {
            try {
              resolve(JSON.parse(message));
            } catch (error) {
              resolve(null);
            }
          } else {
            resolve(message);
          }
        } catch (e) {
          resolve(null);
        }
      }
    });
  }

  // Deeplink APIs
  static async getPendingLink(): Promise<string | null> {
    try {
      const link = await AntsomiSDK.getPendingDeeplink();
      return link ?? null;
    } catch (e) {
      return null;
    }
  }

  static async onPendingLink(callback: (link: string) => void) {
    if (Platform.OS === 'ios') {
      iosEventEmitter.addListener(PENDING_LINK, (link: string) => {
        if (typeof link === 'string' && link.length > 0) {
          callback(link);
        }
      });
    } else {
      const sub = eventEmitter.addListener(PENDING_LINK, (info) => {
        sub.remove();
        if (info && info.url) {
          callback(info.url);
        }
      });
    }
  }

  // Notification APIs
  static async getPendingNotification(): Promise<any | null> {
    if (Platform.OS === 'ios') {
      try {
        const info = await AntsomiSDK.getPendingNotification();
        return info ?? null;
      } catch (e) {
        return null;
      }
    } else {
      AntsomiSDK.getPendingNotification();
      // return await new Promise(async (resolve, _) => {
      //   const sub = eventEmitter.addListener(OPENED_NOTIFICATION, (info) => {
      //     sub.remove();
      //     resolve(info ?? null);
      //   });
      // });
    }
  }

  static onOpenedNotification(callback: (info: any) => void) {
    if (Platform.OS === 'ios') {
      iosEventEmitter.addListener(OPENED_NOTIFICATION, (info: any) =>
        callback(info)
      );
    } else {
      eventEmitter.addListener(OPENED_NOTIFICATION, (info: any) =>
        callback(info)
      );
    }

    RnAntsomiSdk.getPendingNotification();
  }

  // ==================== GAMIFICATION APIs ====================

  /**
   * Initialize Gamification SDK with access token and environment
   * @param accessToken JWT token for authentication
   * @param env Environment: 'sandbox' or 'production'
   */
  static async initGamification(
    accessToken: string,
    env: 'sandbox' | 'production'
  ): Promise<void> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return;
    }
    await AntsomiSDK.initGamification(accessToken, env);
  }

  /**
   * Get list of available games
   * @returns Promise resolving to array of GamificationGame
   */
  static async getListGame(): Promise<GamificationGame[]> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return [];
    }
    try {
      return await AntsomiSDK.getListGame();
    } catch (error) {
      throw toGamificationError(error);
    }
  }

  /**
   * Get game detail by game ID
   * @param gameId Unique game ID
   * @returns Promise resolving to GamificationGame or null
   */
  static async getGameDetail(gameId: string): Promise<GamificationGame | null> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return null;
    }
    try {
      return await AntsomiSDK.getGameDetail(gameId);
    } catch (error) {
      throw toGamificationError(error);
    }
  }

  /**
   * Get game detail by game code
   * @param gameCode Game code
   * @returns Promise resolving to GamificationGame or null
   */
  static async getGameByCode(
    gameCode: string
  ): Promise<GamificationGame | null> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return null;
    }
    try {
      return await AntsomiSDK.getGameByCode(gameCode);
    } catch (error) {
      throw toGamificationError(error);
    }
  }

  /**
   * Play a game by opening WebView
   * @param gameCode Game code to play
   * @param sourceUrl Source URL for the game
   */
  static async playGame(
    gameCode: string,
    sourceUrl: string = ''
  ): Promise<void> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return;
    }
    try {
      await AntsomiSDK.playGame(gameCode, sourceUrl);
    } catch (error) {
      throw toGamificationError(error);
    }
  }

  /**
   * Play a game by ID (iOS only, Android uses playGame with gameCode)
   * @param gameId Game ID to play
   * @param sourceUrl Source URL for the game
   */
  static async playGameById(
    gameId: string,
    sourceUrl: string = ''
  ): Promise<void> {
    if (!isNativeModuleLoaded(AntsomiSDK)) {
      return;
    }
    if (Platform.OS === 'ios') {
      try {
        await AntsomiSDK.playGameById(gameId, sourceUrl);
      } catch (error) {
        throw toGamificationError(error);
      }
    } else {
      // Android doesn't have playGameById, log warning
      console.warn(
        'playGameById is only available on iOS. Use playGame(gameCode) on Android.'
      );
    }
  }
}

export interface CDPEvent {
  en: string;
  items?: Array<{ [key: string]: any }>;
  objectProps?: { [key: string]: any };
  customerProps?: { [key: string]: any };
  userProps?: { [key: string]: any };
  eventProps?: { [key: string]: any };
}

export enum MessageStatus {
  UNREAD = 1,
  READ = 2,
  DELETE = 3,
}

export interface Catalog {
  catalogId: string;
  catalogName: string;
}

export interface AppInboxItem {
  button_app_url2: string;
  button_app_url1: string;
  content: string;
  last_updated: string;
  app_url: string;
  item_id: string;
  heading: string;
  date_created: string;
  image_url: string;
  button_label1: string;
  catalog_ids: string[];
  button_label2: string;
  launch_url: string;
  button_launch_url_1: string;
  button_launch_url_2: string;
  lookup_type: string;
  template_id: string;
  status: number;
  tracking_url: string;
}

export enum LogLevel {
  NONE = 0,
  DEBUG = 1,
  VERBOSE = 2,
  INFO = 3,
}

/**
 * Gamification Game interface
 */
export interface GamificationGame {
  gameId: string;
  gameCode: string;
  name: string;
  iconUrl: string;
  templateUrl: string;
  status: string;
  startAt: string;
  endAt: string;
}
