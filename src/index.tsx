import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

import {
  GET_MESSAGE_APP_INBOX_LIST,
  GET_COUNT_TOTAL_INBOX,
  GET_ALL_LABELS_INBOX,
  GET_DETAIL_MESSAGE_INBOX,
  RECEIVE_NEW_MESSAGE_INBOX,
  GET_MEDIA_JSON,
  GET_UID,
  GET_PUSH_UID,
  GET_CUSTOMER_ID,
  GET_PROPS_ID,
  GET_PORTAL_ID,
} from './events/events';
import { isNativeModuleLoaded } from './events/helpers';

const AntsomiSDK = NativeModules.AntsomiSDK;
const ReactNativeEventEmitter = NativeModules.ReactNativeEventEmitter;

const callbacksNewMessage: Function[] = [];

// const eventManager = new EventManager(AntsomiSDK);
const eventEmitter = new NativeEventEmitter(AntsomiSDK);
const iosEventEmitter = new NativeEventEmitter(ReactNativeEventEmitter);

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

    return AntsomiSDK.config(portalId, propsId, appId, appGroupId);
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
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getMessages(labels, page);
        resolve(data);
      } else {
        await AntsomiSDK.getMessages(labels, page);

        eventEmitter.addListener(GET_MESSAGE_APP_INBOX_LIST, (messages) =>
          resolve(messages)
        );
      }
    });
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
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getCustomerId();
        resolve(data);
      } else {
        await AntsomiSDK.getCustomerId();

        eventEmitter.addListener(GET_CUSTOMER_ID, (messages) =>
          resolve(messages)
        );
      }
    });
  }

  static async getPropsId() {
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getPropsId();
        resolve(data);
      } else {
        await AntsomiSDK.getPropsId();

        eventEmitter.addListener(GET_PROPS_ID, (messages) => resolve(messages));
      }
    });
  }

  static async getPortalId() {
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getPortalId();
        resolve(data);
      } else {
        await AntsomiSDK.getPortalId();

        eventEmitter.addListener(GET_PORTAL_ID, (messages) =>
          resolve(messages)
        );
      }
    });
  }

  static async getDeviceId() {
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getDeviceId();
        resolve(data);
      } else {
        await AntsomiSDK.getDeviceId();

        eventEmitter.addListener(GET_PORTAL_ID, (messages) =>
          resolve(messages)
        );
      }
    });
  }

  static async getUnreadMessageCount() {
    return await new Promise(async (resolve, _) => {
      AntsomiSDK.getUnreadMessageCount();

      eventEmitter.addListener(GET_COUNT_TOTAL_INBOX, (messages) =>
        resolve(messages)
      );
    });
  }

  static async getAllLabels(callback: Function) {
    if (Platform.OS === 'ios') {
      const data = await AntsomiSDK.getAllLabels();
      callback(data);
    } else {
      AntsomiSDK.getAllLabels();
      eventEmitter.addListener(GET_ALL_LABELS_INBOX, (messages) =>
        callback(messages)
      );
    }
  }

  static async getMessageById(messageId: string) {
    return await new Promise(async (resolve, _) => {
      AntsomiSDK.getMessageById(messageId);

      eventEmitter.addListener(GET_DETAIL_MESSAGE_INBOX, (messages) =>
        resolve(messages)
      );
    });
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
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getPushUid();
        resolve(data);
      } else {
        await AntsomiSDK.getPushUid();

        eventEmitter.addListener(GET_PUSH_UID, (messages) => resolve(messages));
      }
    });
  }

  static async getUid() {
    return await new Promise(async (resolve, _) => {
      if (Platform.OS === 'ios') {
        const data = await AntsomiSDK.getUid();
        resolve(data);
      } else {
        await AntsomiSDK.getUid();

        eventEmitter.addListener(GET_UID, (messages) => resolve(messages));
      }
    });
  }

  static async resetUid(): Promise<void> {
    return await AntsomiSDK.resetUid();
  }

  static async setUid(uid: string): Promise<void> {
    return await AntsomiSDK.setUid(uid);
  }

  static async getMediaJson(event: CDPEvent, storyId: string) {
    return await new Promise(async (resolve, _) => {
      await AntsomiSDK.getMediaJson(event, storyId);

      eventEmitter.addListener(GET_MEDIA_JSON, (message: string) => {
        resolve(message);
      });
    });
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
