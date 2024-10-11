//
//  ReactNativeEventEmitter.swift
//  antsomirnsdk
//
//  Created by Khánh Huỳnh Văn  on 22/01/2024.
//

import Foundation
import React


@objc(ReactNativeEventEmitter)
open class ReactNativeEventEmitter: RCTEventEmitter {
    public static var shared: ReactNativeEventEmitter?
    
    override init() {
        print("init event emitter")
        super.init()
        ReactNativeEventEmitter.shared = self
    }
    
    @objc
    func emitEvent(_ name: String, data: Any) {
        sendEvent(withName: name, body: data)
    }
    
    @objc open override func supportedEvents() -> [String] {
        return ["ANTSOMI-receivce-new-message-inbox"]
    }

}

@objc
extension ReactNativeEventEmitter {
    public override static func moduleName() -> String! {
        return "ReactNativeEventEmitter"
    }
    
    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
