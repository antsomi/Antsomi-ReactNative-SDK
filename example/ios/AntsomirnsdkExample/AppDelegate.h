//#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <WebKit/WebKit.h>
#import <React/RCTBridgeDelegate.h>
#import <AntsomiFramework/AntsomiFramework-Swift.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, UNUserNotificationCenterDelegate, RCTBridgeDelegate>
@property (nonatomic, strong) UIWindow *window;
@end
