#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ReactNativeEventEmitter, RCTEventEmitter)
  RCT_EXTERN_METHOD(supportedEvents)
@end
