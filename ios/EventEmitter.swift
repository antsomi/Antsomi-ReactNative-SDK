//
//  EventEmitter.swift
//  antsomirnsdk
//
//  Created by Khánh Huỳnh Văn  on 22/01/2024.
//

import Foundation

class EventEmitter {

    /// Shared Instance.
    public static var sharedInstance = EventEmitter()

    // ReactNativeEventEmitter is instantiated by React Native with the bridge.
    public static var eventEmitter: ReactNativeEventEmitter!

    private init() {}

    // When React Native instantiates the emitter it is registered here.
    func registerEventEmitter(eventEmitter: ReactNativeEventEmitter) {
        EventEmitter.eventEmitter = eventEmitter
    }

    func dispatch(name: String, body: Any?) {
        EventEmitter.eventEmitter.sendEvent(withName: name, body: body)
    }

    /// All Events which must be support by React Native.
    lazy var allEvents: [String] = {
        var allEventNames: [String] = []

        // Append all events here
        allEventNames.append("ANTSOMI-receivce-new-message-inbox")
        allEventNames.append("ANTSOMI-pending-link")
        allEventNames.append("ANTSOMI-opened-notification")
        
        return allEventNames
    }()

}
