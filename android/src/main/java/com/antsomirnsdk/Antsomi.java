package com.antsomirnsdk;

import static com.antsomi.Utils.convertHashMapToJson;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;

import com.antsomi.APICallback;
import com.antsomi.AntsomiSdk;
import com.antsomi.AppInbox.AppInbox;
import com.antsomi.AppInbox.Catalog;
import com.antsomi.AppInbox.MessageInbox;
import com.antsomi.AppInbox.OnNewMessageCallback;
import com.antsomi.MediaJson;
import com.antsomi.OSUtils;
import com.antsomi.AntsomiTrackEvent;
import com.antsomi.PermissionUtils;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.content.Intent;
import com.facebook.react.bridge.ActivityEventListener;

public class Antsomi extends ReactContextBaseJavaModule implements ActivityEventListener {
  public static final String NAME = "AntsomiSDK";
  private final String GRANTED = "granted";
  private final String DENIED = "denied";
  private final String UNAVAILABLE = "unavailable";
  private final String BLOCKED = "blocked";

  public static final String EVENT_GET_MESSAGE_APP_INBOX_LIST = "ANTSOMI-getListAppInboxMessage";
  public static final String GET_COUNT_TOTAL_INBOX = "ANTSOMI-count-total-inbox";
  public static final String GET_DETAIL_MESSAGE_INBOX = "ANTSOMI-get-detail-message-inbox";
  public static final String GET_ALL_LABELS_INBOX = "ANTSOMI-get-all-labels-inbox";
  public static final String RECEIVE_NEW_MESSAGE_INBOX = "ANTSOMI-receive-new-message-inbox";
  public static final String GET_MEDIA_JSON = "ANTSOMI-get-media-json";
  public static final String GET_UID = "ANTSOMI-get-uid";
  public static final String GET_PUSH_UID = "ANTSOMI-get-push-uid";
  public static final String GET_CUSTOMER_ID = "ANTSOMI-get-customer-id";
  public static final String GET_PROPS_ID = "ANTSOMI-get-props-id";
  public static final String GET_PORTAL_ID = "ANTSOMI-get-portal-id";
  public static final String ANTSOMI_OPENED_NOTIFICATION = "ANTSOMI-opened-notification";
  public static final String ANTSOMI_PENDING_LINK = "ANTSOMI-pending-link";

  public static final String GET_DEVICE_ID = "ANTSOMI-get-device-id";

  private ReactContext mReactContext;
  private ReactApplicationContext mReactApplicationContext;
  private WritableMap mPendingNotification; // cache opened notification for cold start

  private WritableMap getLegacyNotificationsResponse(String disabledStatus) {
    final boolean enabled = NotificationManagerCompat
        .from(getReactApplicationContext()).areNotificationsEnabled();

    final WritableMap output = Arguments.createMap();
    final WritableMap settings = Arguments.createMap();

    output.putString("status", enabled ? GRANTED : disabledStatus);
    output.putMap("settings", settings);

    return output;
  }

  public Antsomi(ReactApplicationContext reactContext) {
    super(reactContext);

    mReactContext = reactContext;
    mReactApplicationContext = reactContext;

    // Register to receive Activity events (including onNewIntent)
    reactContext.addActivityEventListener(this);
  }

  private void sendEvent(String eventName, Object params) {
    mReactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  private WritableMap cloneMap(ReadableMap src) {
    if (src == null) return null;
    WritableMap copy = Arguments.createMap();
    copy.merge(src);
    return copy;
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  // ActivityEventListener: keep Activity intent updated so apps don't need to override onNewIntent
  @Override
  public void onNewIntent(Intent intent) {
    Activity activity = getCurrentActivity();
    if (activity != null) {
      activity.setIntent(intent);
    }
  }

  // Unused but required by ActivityEventListener
  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    // no-op
  }

  // Required for NativeEventEmitter (RN > 0.65)
  @ReactMethod
  public void addListener(String eventName) {
    // No-op: We don't need to track listeners in Java
  }

  @ReactMethod
  public void removeListeners(double count) {
    // No-op
  }

  @ReactMethod
  public void config(String portalId, String propsId, String appId, String appGroupId) {

    Context context = mReactApplicationContext.getCurrentActivity();

    if (context == null) {
      context = mReactApplicationContext.getApplicationContext();
    }

    Context finalContext = context;
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.Builder builder = new AntsomiSdk.Builder(finalContext, portalId, propsId,
            appId);

        try {
          builder.build();

          AntsomiSdk.getInstance().setTrackingScreenView(false);
          AntsomiSdk.getInstance().setIsShowTemplate(true);

          AntsomiSdk.setOpenedNotificationHandler(null, result -> {
            Log.d("NotificationOpened", "Notification opened: " + result.toString());
            WritableMap payload = convertBundleToWritableMap(result);
            // If React bridge is not ready (cold start), cache and wait for JS to pull it.
            if (mReactContext == null || !mReactContext.hasActiveCatalystInstance()) {
              mPendingNotification = payload;
              return;
            }
            // Warm start: emit immediately and clear pending
            sendEvent(ANTSOMI_OPENED_NOTIFICATION, payload);
            mPendingNotification = null;
          });

        } catch (Exception e) {
          throw new RuntimeException(e);
        }
      }
    });
  }

  @ReactMethod
  public void getCustomerId() {
    sendEvent(GET_CUSTOMER_ID, AntsomiSdk.getInstance().getCustomerId());
  }

  @ReactMethod
  public void getPropsId() {
    sendEvent(GET_PROPS_ID, AntsomiSdk.getInstance().getPropsId());
  }

  @ReactMethod
  public void getPortalId() {
    sendEvent(GET_PORTAL_ID, AntsomiSdk.getInstance().getPortalId());
  }

  @ReactMethod
  public void appInboxInit(String destinationId, String audienceType) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().init(destinationId, audienceType);
      }
    });
  }

  @ReactMethod
  public void setLogLevel(int level) {
    AntsomiSdk.LogLevel logLevel = AntsomiSdk.LogLevel.NONE;
    switch (level) {
      case 0:
        logLevel = AntsomiSdk.LogLevel.NONE;
        break;
      case 1:
        logLevel = AntsomiSdk.LogLevel.DEBUG;
        break;
      case 2:
        logLevel = AntsomiSdk.LogLevel.VERBOSE;
        break;
      case 3:
        logLevel = AntsomiSdk.LogLevel.INFO;
        break;
    }
    AntsomiSdk.LogLevel finalLogLevel = logLevel;
    AntsomiSdk.setLogLevel(finalLogLevel);
  }

  @ReactMethod
  public void getMessages(ReadableArray labels, int page) {
    try {
      List<String> convertLabels = convertReadableArrayToList(labels);

      OSUtils.runOnMainUIThread(new Runnable() {
        @Override
        public void run() {
          AntsomiSdk.getInstanceAppInbox().getListNotification(convertLabels, page,
              new APICallback<List<MessageInbox>>() {
                @Override
                public void onResponse(List<MessageInbox> response) {
                  List<Map<String, String>> messages = new ArrayList<>();

                  for (MessageInbox item : response) {
                    try {
                      messages.add(toJsonInboxItem(item));
                    } catch (JSONException e) {
                      messages = new ArrayList<>();
                    }
                  }

                  sendEvent(EVENT_GET_MESSAGE_APP_INBOX_LIST, convertListOfMapsToReadableArray(messages));
                }

                @Override
                public void onFailure(Throwable t) {
                  List<Map<String, String>> messages = new ArrayList<>();

                  sendEvent(EVENT_GET_MESSAGE_APP_INBOX_LIST, convertListOfMapsToReadableArray(messages));
                }
              });
        }
      });
    } catch (Exception e) {
      Log.d("GetMessageInboxError", e.getMessage());
    }
  }

  @ReactMethod
  public void track(ReadableMap event) {
    // convert event to CDPEvent
    String eventName = event.getString("en");

    if (eventName == null) {
      Log.w("EventName", "Event name cannot be null");
      return;
    }

    AntsomiTrackEvent atEvent = new AntsomiTrackEvent(eventName);

    Object eventProps = event.getMap("eventProps");
    Object customerProps = event.getMap("customerProps");
    Object objectProps = event.getMap("objectProps");
    Object userProps = event.getMap("userProps");
    Object items = event.getArray("items");

    if (eventProps instanceof ReadableNativeMap) {
      ReadableNativeMap eventPropsMap = (ReadableNativeMap) eventProps;

      atEvent.setEventProperties(convertReadableMapToBundle(eventPropsMap));
    }

    if (customerProps instanceof ReadableNativeMap) {
      ReadableNativeMap customerPropsMap = (ReadableNativeMap) customerProps;

      atEvent.setCustomerProperties(convertReadableMapToBundle(customerPropsMap));
    }

    if (userProps instanceof ReadableNativeMap) {

      ReadableNativeMap userPropsMap = (ReadableNativeMap) userProps;

      atEvent.setUserProperties(convertReadableMapToBundle(userPropsMap));

    }

    if (objectProps instanceof ReadableNativeMap) {
      ReadableNativeMap objectPropsMap = (ReadableNativeMap) objectProps;

      atEvent.setObjectProperties(convertReadableMapToBundle(objectPropsMap));
    }

    if (items != null) {
      if (items instanceof ReadableArray) {

        ReadableArray itemsArray = (ReadableArray) items;

        ArrayList<Bundle> itemsEvent = convertReadableArrayToArrayListOfBundles(itemsArray);

        atEvent.setItems(itemsEvent);
      }
    }

    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().track(atEvent);
      }
    });
  }

  @ReactMethod
  public void trackScreen(String screenName, String screenTitle, String screenType) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().trackingScreen(screenName, screenTitle, screenType);
      }
    });
  }

  @ReactMethod
  public void setPageLimit(int limit) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().setPageLimit(limit);
      }
    });
  }

  @ReactMethod
  public void getUnreadMessageCount() {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().getCountNotificationUnread(new APICallback<Integer>() {
          @Override
          public void onResponse(Integer response) {
            sendEvent(GET_COUNT_TOTAL_INBOX, response);
          }

          @Override
          public void onFailure(Throwable t) {
            sendEvent(GET_COUNT_TOTAL_INBOX, 0);
          }
        });
      }
    });
  }

  @ReactMethod
  public void setCustomerId(String customerId) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().setCustomerId(customerId);
      }
    });
  }

  @ReactMethod
  public void resetCustomer() {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().resetCustomer();
      }
    });
  }

  @ReactMethod
  public void getMessageById(String messageId) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().getDetailMessage(messageId, new APICallback<MessageInbox>() {
          @Override
          public void onResponse(MessageInbox response) {
            Map<String, String> jsonMessage = null;
            try {
              jsonMessage = toJsonInboxItem(response);
            } catch (JSONException e) {
              throw new RuntimeException(e);
            }

            sendEvent(GET_DETAIL_MESSAGE_INBOX, convertMapsToReadableMap(jsonMessage));
          }

          @Override
          public void onFailure(Throwable t) {
            Map<String, String> message = new HashMap<>();

            sendEvent(GET_DETAIL_MESSAGE_INBOX, message);
          }
        });
      }
    });
  }

  @ReactMethod
  public void setIsDelivery(boolean isDelivery) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().setIsDelivery(isDelivery);
      }
    });

  }

  @ReactMethod
  public void getAllLabels() {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().getAllLabels(new APICallback<List<Catalog>>() {
          @Override
          public void onResponse(List<Catalog> response) {
            WritableArray catalogs = Arguments.createArray();

            for (Catalog item : response) {
              WritableMap mapEntry = Arguments.createMap();
              mapEntry.putString("catalogId", (String) item.getCatalogId());
              mapEntry.putString("catalogName", (String) item.getCatalogName());
              catalogs.pushMap(mapEntry);
            }

            sendEvent(GET_ALL_LABELS_INBOX, catalogs);
          }

          @Override
          public void onFailure(Throwable t) {
            WritableArray catalogs = Arguments.createArray();
            sendEvent(GET_ALL_LABELS_INBOX, catalogs);
          }
        });
      }
    });
  }

  @ReactMethod
  public void modifyAction(ReadableArray messageIds, int action) {
    List<String> messageFinal = convertReadableArrayToList(messageIds);

    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        if (action == MessageInbox.MessageStatus.READ.getValue()) {
          AntsomiSdk.getInstanceAppInbox().updateMessage(messageFinal, MessageInbox.MessageStatus.READ);
        } else if (action == MessageInbox.MessageStatus.DELETE.getValue()) {
          AntsomiSdk.getInstanceAppInbox().updateMessage(messageFinal, MessageInbox.MessageStatus.DELETE);
        }
      }
    });
  }

  @ReactMethod
  public void handleDeeplinkURL(String url) {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().handleDeeplinkURL(url);
      }
    });
  }

  @ReactMethod
  public void getDeviceId() {
    sendEvent(GET_DEVICE_ID, AntsomiSdk.getDeviceStringId());
  }

  @ReactMethod
  public void handleTrackingUrl(String trackingUrl) {
    AntsomiSdk.handleTrackingUrl(trackingUrl);
  }

  @ReactMethod
  public void getPendingNotification() {
    // If we have a cached payload (likely from cold start), emit once and clear.
    if (mPendingNotification != null) {
      WritableMap openedCopy = cloneMap(mPendingNotification);
      WritableMap linkCopy = cloneMap(mPendingNotification);
      sendEvent(ANTSOMI_OPENED_NOTIFICATION, openedCopy);
      sendEvent(ANTSOMI_PENDING_LINK, linkCopy);
      mPendingNotification = null;
      // Also clear any residual intent data to avoid re-trigger on resume
      Activity activity = getCurrentActivity();
      if (activity != null && activity.getIntent() != null) {
        try {
          activity.getIntent().setData(null);
          activity.getIntent().replaceExtras((Bundle) null);
        } catch (Exception ignored) {}
      }
      return;
    }

    // Fallback: try to read extras from the launch Intent (cold start)
    Activity activity = getCurrentActivity();
    if (activity != null && activity.getIntent() != null && activity.getIntent().getExtras() != null) {
      WritableMap payload = convertBundleToWritableMap(activity.getIntent().getExtras());
      // Only emit if there is at least one key
      if (payload != null && payload.hasKey("android.intent.extra.CHANNEL_ID") == false && payload.toHashMap().size() > 0) {
        // Cache and emit so JS can pick it up
        mPendingNotification = cloneMap(payload);
        WritableMap openedCopy = cloneMap(payload);
        WritableMap linkCopy = cloneMap(payload);
        sendEvent(ANTSOMI_OPENED_NOTIFICATION, openedCopy);
        sendEvent(ANTSOMI_PENDING_LINK, linkCopy);
        mPendingNotification = null; // clear after emitting once
        // Clear intent data/extras so subsequent calls don't re-emit
        try {
          activity.getIntent().setData(null);
          activity.getIntent().replaceExtras((Bundle) null);
        } catch (Exception ignored) {}
        return;
      }
    }

    sendEvent(ANTSOMI_OPENED_NOTIFICATION, null);
  }

  @ReactMethod
  public void newMessageReceived() {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstanceAppInbox().addOnNewMessageCallback(new OnNewMessageCallback() {
          @Override
          public void onNewMessage(MessageInbox message) {
            try {
              sendEvent(RECEIVE_NEW_MESSAGE_INBOX, convertMapsToReadableMap(toJsonInboxItem(message)));
            } catch (JSONException e) {
              throw new RuntimeException(e);
            }
          }

          @Override
          public void run() {

          }
        });
      }
    });
  }

  @ReactMethod
  public void requestNotificationPermission() {
    OSUtils.runOnMainUIThread(new Runnable() {
      @Override
      public void run() {
        AntsomiSdk.getInstance().requestNotificationPermission();
      }
    });
  }

  @ReactMethod
  public void getPushUid() {
    sendEvent(GET_PUSH_UID, AntsomiSdk.getInstance().getUidPush());
  }

  @ReactMethod
  public void getUid() {
    sendEvent(GET_UID, AntsomiSdk.getInstance().getUid());
  }

  @ReactMethod
  public void resetUid() {
    AntsomiSdk.getInstance().resetUid();
  }

  @ReactMethod
  public void setUid(String uid) {
    AntsomiSdk.getInstance().setUid(uid);
  }

  @ReactMethod
  public void getMediaJson(ReadableMap event, String storyId) {
    if (event != null) {
      String eventName = event.getString("en");

      if (eventName == null) {
        Log.w("EventName", "Event name cannot be null");
        return;
      }
      AntsomiTrackEvent atEvent = new AntsomiTrackEvent(eventName);

      Object eventProps = event.getMap("eventProps");
      Object customerProps = event.getMap("customerProps");
      Object objectProps = event.getMap("objectProps");
      Object userProps = event.getMap("userProps");
      ReadableArray items = event.getArray("items");

      if (eventProps instanceof ReadableNativeMap eventPropsMap) {
        atEvent.setEventProperties(convertReadableMapToBundle(eventPropsMap));
      }

      if (customerProps instanceof ReadableNativeMap customerPropsMap) {

        atEvent.setCustomerProperties(convertReadableMapToBundle(customerPropsMap));
      }

      if (userProps instanceof ReadableNativeMap userPropsMap) {
        atEvent.setUserProperties(convertReadableMapToBundle(userPropsMap));

      }

      if (objectProps instanceof ReadableNativeMap objectPropsMap) {

        atEvent.setObjectProperties(convertReadableMapToBundle(objectPropsMap));
      }

      if (items != null) {
        ArrayList<Bundle> itemsEvent = convertReadableArrayToArrayListOfBundles(items);

        atEvent.setItems(itemsEvent);
      }

      if (!TextUtils.isEmpty(storyId)) {
        AntsomiSdk.getInstance().getMediaJson(atEvent, storyId, new APICallback<MediaJson>() {
          @Override
          public void onResponse(MediaJson response) {
            sendEvent(GET_MEDIA_JSON, toJsonStringMediaJson(response));
          }

          @Override
          public void onFailure(Throwable t) {

          }
        });
      } else {
        AntsomiSdk.getInstance().getMediaJson(atEvent, new APICallback<MediaJson>() {
          @Override
          public void onResponse(MediaJson response) {
            sendEvent(GET_MEDIA_JSON, toJsonStringMediaJson(response));
          }

          @Override
          public void onFailure(Throwable t) {

          }
        });
      }

    }
  }

  private String toJsonStringMediaJson(MediaJson mediaJson) {
    Gson gson = new GsonBuilder().create();
    return gson.toJson(mediaJson);
  }

  private List<String> convertReadableArrayToList(ReadableArray readableArray) {
    List<String> stringList = new ArrayList<>();
    for (int i = 0; i < readableArray.size(); i++) {
      String value = readableArray.getString(i);
      stringList.add(value);
    }
    return stringList;
  }

  private ReadableArray convertListOfMapsToReadableArray(List<Map<String, String>> listOfMaps) {
    WritableArray writableArray = Arguments.createArray();
    for (Map<String, String> map : listOfMaps) {
      WritableMap writableMap = Arguments.createMap();
      for (Map.Entry<String, String> entry : map.entrySet()) {
        writableMap.putString(entry.getKey(), entry.getValue());
      }
      writableArray.pushMap(writableMap);
    }
    return writableArray;
  }

  private WritableMap convertMapsToReadableMap(Map<String, String> map) {
    WritableMap writableMap = Arguments.createMap();
    for (Map.Entry<String, String> entry : map.entrySet()) {
      writableMap.putString(entry.getKey(), entry.getValue());
    }
    return writableMap;
  }

  private Map<String, String> toJsonInboxItem(MessageInbox inboxItem) throws JSONException {
    Map<String, String> jsonEncode = new HashMap<>();
    jsonEncode.put("button_app_url_2", inboxItem.getButtonAppUrl2());
    jsonEncode.put("button_app_url_1", inboxItem.getButtonAppUrl1());
    jsonEncode.put("content", inboxItem.getContent());
    jsonEncode.put("last_updated", inboxItem.getLastUpdated());
    jsonEncode.put("app_url", inboxItem.getAppUrl());
    jsonEncode.put("item_id", inboxItem.getItemId());
    jsonEncode.put("heading", inboxItem.getHeading());
    jsonEncode.put("date_created", inboxItem.getDateCreated());
    jsonEncode.put("image_url", inboxItem.getImageUrl());
    jsonEncode.put("button_label_1", inboxItem.getButtonLabel1());

    if (inboxItem.getCatalogIds() != null) {
      jsonEncode.put("catalog_ids", new JSONArray(inboxItem.getCatalogIds()).toString());
    } else {
      jsonEncode.put("catalog_ids", new JSONArray().toString());
    }
    jsonEncode.put("button_label_2", inboxItem.getButtonLabel2());
    jsonEncode.put("launch_url", inboxItem.getLaunchUrl());
    jsonEncode.put("button_launch_url_1", inboxItem.getButtonLaunchUrl1());
    jsonEncode.put("button_launch_url_2", inboxItem.getButtonLaunchUrl2());
    jsonEncode.put("lookup_type", inboxItem.getLookupType());
    jsonEncode.put("template_id", inboxItem.getTemplateId());
    jsonEncode.put("status", inboxItem.getStatus());
    jsonEncode.put("tracking_url", inboxItem.getTrackingUrl());

    return jsonEncode;
  }

  private WritableMap convertBundleToWritableMap(Bundle bundle) {
    WritableMap map = Arguments.createMap();
    if (bundle == null) return map;

    for (String key : bundle.keySet()) {
      Object value = bundle.get(key);
      if (value == null) {
        map.putNull(key);
      } else if (value instanceof String) {
        map.putString(key, (String) value);
      } else if (value instanceof Integer) {
        map.putInt(key, (Integer) value);
      } else if (value instanceof Double) {
        map.putDouble(key, (Double) value);
      } else if (value instanceof Float) {
        map.putDouble(key, ((Float) value).doubleValue());
      } else if (value instanceof Boolean) {
        map.putBoolean(key, (Boolean) value);
      } else if (value instanceof Bundle) {
        map.putMap(key, convertBundleToWritableMap((Bundle) value));
      } else if (value instanceof String[]) {
        WritableArray arr = Arguments.createArray();
        for (String v : (String[]) value) arr.pushString(v);
        map.putArray(key, arr);
      } else {
        // Fallback: stringify
        map.putString(key, String.valueOf(value));
      }
    }
    return map;
  }

  private Bundle convertMapToBundle(Map<String, Object> dataMap) {
    Bundle bundle = new Bundle();

    for (Map.Entry<String, Object> entry : dataMap.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();

      if (value instanceof String) {
        bundle.putString(key, (String) value);
      } else if (value instanceof Integer) {
        bundle.putInt(key, (Integer) value);
      } else if (value instanceof Map) {
        Bundle nestedBundle = convertMapToBundle((Map<String, Object>) value);
        bundle.putBundle(key, nestedBundle);
      }
    }

    return bundle;
  }

  public Bundle convertReadableMapToBundle(ReadableMap readableMap) {
    Bundle bundle = new Bundle();

    ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType readableType = readableMap.getType(key);
      switch (readableType) {
        case Null:
          bundle.putString(key, null); // Handle null values as needed
          break;
        case Boolean:
          bundle.putBoolean(key, readableMap.getBoolean(key));
          break;
        case Number:
          bundle.putDouble(key, readableMap.getDouble(key)); // Assuming numeric values as doubles
          break;
        case String:
          bundle.putString(key, readableMap.getString(key));
          break;
        case Map:
          ReadableMap nestedReadableMap = readableMap.getMap(key);
          Bundle nestedBundle = convertReadableMapToBundle(nestedReadableMap);
          bundle.putBundle(key, nestedBundle);
          break;
        case Array:
          ReadableArray readableArray = readableMap.getArray(key);
          Object[] array = convertReadableArrayToArray(readableArray);
          bundle.putSerializable(key, array);
          break;
        default:
          break;
      }
    }

    return bundle;
  }

  public ArrayList<Bundle> convertReadableArrayToArrayListOfBundles(ReadableArray readableArray) {
    ArrayList<Bundle> bundlesList = new ArrayList<>();

    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);
      Bundle bundle = new Bundle();
      switch (type) {
        case Null:
          // Handle null values as needed
          break;
        case Boolean:
          bundle.putBoolean("value", readableArray.getBoolean(i));
          break;
        case Number:
          bundle.putDouble("value", readableArray.getDouble(i)); // Assuming numeric values as doubles
          break;
        case String:
          bundle.putString("value", readableArray.getString(i));
          break;
        case Map:
          ReadableMap map = readableArray.getMap(i);
          bundle = convertReadableMapToBundle(map);
          break;
        default:
          // Handle cases not covered
          break;
      }
      bundlesList.add(bundle);
    }
    return bundlesList;
  }

  private Object[] convertReadableArrayToArray(ReadableArray readableArray) {
    Object[] array = new Object[readableArray.size()];
    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);
      switch (type) {
        case Null:
          array[i] = null; // Handle null values as needed
          break;
        case Boolean:
          array[i] = readableArray.getBoolean(i);
          break;
        case Number:
          array[i] = readableArray.getDouble(i); // Assuming numeric values as doubles
          break;
        case String:
          array[i] = readableArray.getString(i);
          break;
        case Map:
          ReadableMap nestedMap = readableArray.getMap(i);
          array[i] = convertReadableMapToBundle(nestedMap);
          break;
        case Array:
          ReadableArray nestedArray = readableArray.getArray(i);
          array[i] = convertReadableArrayToArray(nestedArray);
          break;
        // Handle other types as necessary
        default:
          // Handle cases not covered
          break;
      }
    }
    return array;
  }
}
