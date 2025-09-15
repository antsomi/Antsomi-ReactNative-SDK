#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_REMAP_MODULE(AntsomiSDK, ReactNativeEventEmitter, RCTEventEmitter)
@end

@interface RCT_EXTERN_MODULE(AntsomiSDK, NSObject)

RCT_EXTERN_METHOD(config: (NSString *)portalId
                  propsId:(NSString *)propsId
                  applicationId:(NSString *)applicationId
                  appGroupId:(NSString *)appGroupId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setLogLevel: (NSInteger)level
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setCustomerId: (NSString *)customerId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCustomerId: (RCTPromiseResolveBlock *)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetCustomer: (RCTPromiseResolveBlock *)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPropsId:(RCTPromiseResolveBlock *)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(getPortalId:(RCTPromiseResolveBlock *)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(appInboxInit: (NSString *)destinationId
                  audienceType:(NSString *)audienceType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMessages:(NSArray<NSString *> *)catalogId
                  page:(NSInteger)page
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAllLabels:(RCTPromiseResolveBlock *)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(setPageLimit: (NSInteger)limit
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(track: (NSDictionary *)event
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(trackScreen: (NSString *)screenName
                  screenTitle:(NSString *)screenTitle
                  screenType: (NSString *)screenType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getUid: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestNotificationPermission: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPushUid: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetUid: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setUid: (NSString *)uid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(resetCustomer: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(handleDeepLink: (NSString *)link
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Alias for consistency with Android/JS naming
RCT_EXTERN_METHOD(handleDeeplinkURL: (NSString *)link
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(handleTrackingUrl: (NSString *)trackingLink
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPendingDeeplink: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPendingNotification: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMediaJson: (NSDictionary *)event
                  storyId:(NSString *)storyId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(modifyAction:(NSArray<NSString *> *)messageIds
                  action:(NSInteger)action
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)


@end
