// Bridges the Swift RCTEventEmitter subclass (ArrowKeyScrollModule.swift)
// into React Native's module registry -- required even for an @objc
// Swift class; RN's module discovery looks for this ObjC macro.
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ArrowKeyScrollModule, RCTEventEmitter)
@end
