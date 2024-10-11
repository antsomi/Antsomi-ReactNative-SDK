import Foundation
import AntsomiFramework
import UserNotifications
import React
import UIKit


@objc(AntsomiSDK)
class AntsomiSDK: NSObject, RCTBridgeModule {
    
     public var antsomiUNUserNotificationCenter = AntsomiUNUserNotificationCenter()
     private var _appInbox: AppInbox!
     private var _appInboxMessage: [InboxItem] = []
     private var _socketListener: ((Bool) -> Void)?

    
    var eventReceivedMessage = "ANTSOMI-receivce-new-message-inbox"
    
    var getMessageResolver: RCTPromiseResolveBlock?
    var getLabelResolver: RCTPromiseResolveBlock?
    var getMediaJsonResolver: RCTPromiseResolveBlock?
    
    static func moduleName() -> String! {
            return "AntsomiSDK"
        }
    
    static func requiresMainQueueSetup() -> Bool {
            return true
        }

    override init() {
        super.init();
    }

    @objc func config(_ portalId: String, propsId: String, applicationId: String, appGroupId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let config = Antsomi.Configuration(portalId: portalId, propsId: propsId, appGroupId: appGroupId, applicationId: applicationId)
       
        Antsomi.shared.activate(with: config)
        Antsomi.shared.isDelivery = true
        
        Antsomi.shared.logger = { str in
            DispatchQueue.main.async {
                NSLog("<ANTSOMI> \(str)")
            }
        }
        
        Antsomi.shared.trackAppLaunch();
        
    }
    
    @objc
    func setLogLevel(_ level: Int, resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) {
        // do nothing
      print(level)
      resolve(true)
    }
    
    @objc
    func getCustomerId(_ resolve:RCTPromiseResolveBlock, rejecter:RCTPromiseRejectBlock) {
        resolve(Antsomi.shared.getCustomerId())
    }

    @objc
    func setCustomerId(_ customerId: String, resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        Antsomi.shared.setCustomerProperties(customerId: customerId)
        resolve(true)
    }
    
    @objc
    func resetCustomer(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        Antsomi.shared.resetCustomer()
        resolve(true)
    }
    
    @objc
    func getPropsId(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        resolve(Antsomi.shared.getPropsId())
    }
    
    @objc
    func getPortalId(_ resolve: @escaping RCTPromiseResolveBlock,rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(Antsomi.shared.getPortalId())
    }
    
    @objc
    func appInboxInit(_ destinationId: String, audienceType: String, resolver: @escaping RCTPromiseResolveBlock,rejecter reject: @escaping RCTPromiseRejectBlock) {
        Antsomi.shared.appInboxInit(destinationId: destinationId, audienceType: audienceType)
        _appInbox = Antsomi.appInbox
        _appInbox.delegate = self
        resolver(true)
    }
    
    @objc
    func getMessages(_ catalogId: [String], page: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter:RCTPromiseRejectBlock) {
        self.getMessageResolver = resolver
        if(catalogId.count == 0){
            Antsomi.appInbox.forceFetchInboxItem(page: page, completion: {
                dataDecode in
                if let data = dataDecode as? [InboxItem] {
                    let messageData = self._getMessageMap(message: data)
                    let getMessageResolver = self.getMessageResolver
                    getMessageResolver!(messageData)
                
                } else {
                    let getMessageResolver = self.getMessageResolver
                    getMessageResolver!(nil)
                }})
        }
        else{
            Antsomi.appInbox.forceFetchInboxItem(
                catalogId: catalogId,
                page: page,
                completion:  { dataDecode in
                    if let data = dataDecode as? [InboxItem] {
                        let messageData = self._getMessageMap(message: data)
                        let getMessageResolver = self.getMessageResolver
                        getMessageResolver!(messageData)
                    } else{
                        let getMessageResolver = self.getMessageResolver
                        getMessageResolver!(nil)
                    }})
        }
    }
    
    
    @objc
    func setPageLimit(_ limit: Int, resolver:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) {
        guard Antsomi.appInbox != nil else {return resolver(false)}
        AppInbox.setPageLimit(pageLimit: limit)
        
        resolver(true)
    }
    
    @objc
    func track(_ event: [String: Any], resolver:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) {
        var eventCDP = CDPEvent()
        if let eventName =  event["en"] as? String{
            eventCDP.setEventName(eventName: eventName)
        }
        
        if let items = event["items"] as? [[String:Any]] {
            eventCDP.setItems(items: items)
        }
        
        if let userPropperties = event["userProps"] as? [String : Any]{
            
            eventCDP.setUserPropperties(userPropperties: userPropperties)
        }
        
        if let objectProperties = event["objectProps"] as? [String : Any] {
            eventCDP.setObjectProperties(objectProperties: objectProperties)
        }
        
        if let eventProperties = event["eventProps"] as? [String : Any] {
            eventCDP.setEventProperties(eventProperties: eventProperties)
        }
        
        if let customerProperties = event["customerProps"] as? [String : Any] {
            if customerProperties.count != 0 {
                eventCDP.setCustomerProperties(customerProperties: customerProperties)
            }
        }
        
        
        Antsomi.shared.track(event: eventCDP)
        
        resolver(true)
    }
    
    @objc
    func trackScreen(_ screenName: String, screenTitle: String?, screenType: String?, resolver:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) {
        
        Antsomi.shared.trackScreen(name: screenName,title: screenTitle ?? "", type : screenType ?? "")
        
        resolver(true)
    }
    
    @objc
    func getAllLabels(_ resolver: @escaping RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        self.getLabelResolver = resolver;
        Antsomi.appInbox.fetchAllCatalog { catalogs in
            var result: [[String:String]] = []
            if catalogs.count != 0 {
                catalogs.forEach { item in
                    do {
                        var catalog = [
                            "catalogId": item.catalogId,
                            "catalogName": item.catalogName
                        ]
                        result.append(catalog)
                    }catch{
                        print("DECODE ERROR")
                        return self.getLabelResolver!([])
                    }
                }
                
                self.getLabelResolver!(result)
            } else {
                self.getLabelResolver!(result)
            }
                
        }
    }
  
    @objc
    func requestNotificationPermission(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
      Antsomi.shared.requestNotificationPermission()
      resolve(true)
    }
    
    @objc
    func getPushUid(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        resolve(Antsomi.shared.getPushUid())
    }
    
    @objc
    func getUid(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
        resolve(Antsomi.shared.getUid())
    }
    
    @objc
    func resetUid(_ resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
      Antsomi.shared.resetUid()
      resolve(true)
    }
    
    @objc
    func setUid(_ uid: String, resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
      Antsomi.shared.setUid(uid: uid)
      resolve(true)
    }
    
    
    @objc
    func handleDeepLink(_ link: String, resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
      
        Antsomi.shared.handleDeeplinkURL(URL(string: link)!)
        resolve(true)
    }
  
  @objc
  func handleTrackingUrl(_ trackingLink: String, resolve:RCTPromiseResolveBlock,rejecter:RCTPromiseRejectBlock) {
    
    func completion() -> Void {}
    Antsomi.shared.handleTrackingURL(URL(string: trackingLink)!, completion: completion);
      
    resolve(true)
  }
  
  
  @objc
  func getMediaJson(_ event: [String: Any], storyId: String?, resolver: @escaping RCTPromiseResolveBlock,rejecter reject: @escaping RCTPromiseRejectBlock) {
      self.getMediaJsonResolver = resolver
      var eventCDP = CDPEvent()
      if let eventName =  event["en"] as? String{
          eventCDP.setEventName(eventName: eventName)
      }
      
      if let items = event["items"] as? [[String:Any]] {
          eventCDP.setItems(items: items)
      }
      
      if let userPropperties = event["userProps"] as? [String : Any]{
          
          eventCDP.setUserPropperties(userPropperties: userPropperties)
      }
      
      if let objectProperties = event["objectProps"] as? [String : Any] {
          eventCDP.setObjectProperties(objectProperties: objectProperties)
      }
      
      if let eventProperties = event["eventProps"] as? [String : Any] {
          eventCDP.setEventProperties(eventProperties: eventProperties)
      }
      
      if let customerProperties = event["customerProps"] as? [String : Any] {
          if customerProperties.count != 0 {
              eventCDP.setCustomerProperties(customerProperties: customerProperties)
          }
      }
    
      if (storyId != nil && storyId != "") {
          Antsomi.shared.getMediaJson(event: eventCDP, storyId: storyId!) { mediaJson in
            self.getMediaJsonResolver!(mediaJson)
          }
      } else {
          Antsomi.shared.getMediaJson(event: eventCDP) { mediaJson in
            self.getMediaJsonResolver!(mediaJson)
          }
      }
  }
  
  @objc
  func modifyAction(_ messageIds: [String], action:Int, resolver resolve: @escaping RCTPromiseResolveBlock,rejecter reject: @escaping RCTPromiseRejectBlock) {
      if(action == ModifyAction.read.rawValue){
          _appInbox.modifyMessageStatus(messageIds,action:ModifyAction.read)
      }
      else if (action == ModifyAction.remove.rawValue) {
          _appInbox.modifyMessageStatus(messageIds,action: ModifyAction.remove)
      }
    
      resolve(true)
  }
  
    private func configureNotificationActions() {
          antsomiUNUserNotificationCenter.setActionForUrl { urlStr in
              Antsomi.shared.handleDeeplinkURL(URL(string: urlStr)!)
          }
      }
    
    private func _getMessageMap(message: [InboxItem]) -> [[String:String]] {
            var result: [[String:String]] = []
            for element in message {
                result.append(_toJsonInboxItem(inboxItem: element))
            }
            return result
        }

        private func _toJsonInboxItem(inboxItem: InboxItem) -> [String:String] {
            let encoder = JSONEncoder()
            
            do {
                let catalogs = try encoder.encode(inboxItem.catalogId)
                let catalog_ids: String = String(data: catalogs, encoding: .utf8) ?? "[]"
                
                let jsonEncode : [String:String] = [
                    "button_app_url_2": inboxItem.buttonAppUrl2?.absoluteString ?? "",
                    "button_app_url_1" : inboxItem.buttonAppUrl1?.absoluteString ?? "",
                    "content" : inboxItem.content as String,
                    "last_updated": inboxItem.lastUpdated as String,
                    "app_url" : inboxItem.appUrl?.absoluteString ?? "",
                    "item_id": inboxItem.itemId as String,
                    "heading": inboxItem.heading as String,
                    "date_created" : inboxItem.dateCreated as String,
                    "image_url" : inboxItem.imageUrl?.absoluteString ?? "",
                    "button_label_1" : inboxItem.buttonLabel1 ?? "",
                    "button_label_2" : inboxItem.buttonLabel2 ?? "",
                    "launch_url" : inboxItem.lauchUrl?.absoluteString ?? "",
                    "button_launch_url_1" : inboxItem.buttonLaunchUrl1?.absoluteString ?? "",
                    "button_launch_url_2" : inboxItem.buttonLaunchUrl2?.absoluteString ?? "",
                    "lookup_type" : inboxItem.lookupType as String,
                    "template_id" : inboxItem.templateId as String,
                    "status" : String(inboxItem.status),
                    "tracking_url": inboxItem.trackingUrl?.absoluteString ?? "",
                    "catalog_ids" : catalog_ids
                ]
                return jsonEncode
            }catch{
                print("DECODE ERROR")
            }
            
            return [:]
        }
}

extension AntsomiSDK: AppInboxDelegate {
    public func onNewMessage(_ newMessageReceived: InboxItem) {
        print("ON NEW MESSAGE");
        ReactNativeEventEmitter.shared?.emitEvent(self.eventReceivedMessage, data: _toJsonInboxItem(inboxItem: newMessageReceived))
    }
}

extension Notification.Name {
    static let didReceiveDeviceToken = Notification.Name("didRegisterForRemoteNotificationsWithDeviceToken")
}
