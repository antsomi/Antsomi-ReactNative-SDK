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
    private static let sharedLock = NSLock()
    private static weak var sharedInstance: ReactNativeEventEmitter?
    private let listenerLock = NSLock()
    private var hasListeners = false

    public static var shared: ReactNativeEventEmitter? {
        sharedLock.lock()
        defer { sharedLock.unlock() }
        return sharedInstance
    }
    
    override init() {
        print("init event emitter")
        super.init()
        ReactNativeEventEmitter.sharedLock.lock()
        ReactNativeEventEmitter.sharedInstance = self
        ReactNativeEventEmitter.sharedLock.unlock()
    }
    
    @discardableResult
    @objc
    func emitEvent(_ name: String, data: Any) -> Bool {
        listenerLock.lock()
        let canEmit = hasListeners
        listenerLock.unlock()

        guard canEmit else { return false }
        sendEvent(withName: name, body: data)
        return true
    }

    override open func startObserving() {
        listenerLock.lock()
        hasListeners = true
        listenerLock.unlock()
    }

    override open func stopObserving() {
        listenerLock.lock()
        hasListeners = false
        listenerLock.unlock()
    }

    override open func invalidate() {
        stopObserving()

        ReactNativeEventEmitter.sharedLock.lock()
        if ReactNativeEventEmitter.sharedInstance === self {
            ReactNativeEventEmitter.sharedInstance = nil
        }
        ReactNativeEventEmitter.sharedLock.unlock()

        super.invalidate()
    }
    
    @objc open override func supportedEvents() -> [String] {
        return [
            "ANTSOMI-receivce-new-message-inbox",
            "ANTSOMI-pending-link",
            "ANTSOMI-opened-notification"
        ]
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
