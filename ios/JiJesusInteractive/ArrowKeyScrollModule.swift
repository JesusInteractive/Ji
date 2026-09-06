import Foundation
import UIKit
import React

// Hand-written native module -- arrow-key scrolling isn't something
// Expo/React Native exposes; UIScrollView never responds to a hardware
// keyboard's arrow keys on its own, on iPad or otherwise. This is the
// bare minimum native piece: capture the up/down arrow UIKeyCommands
// globally, then hand them to JS as a plain event so any screen can
// decide what "scroll" means for its own list/ScrollView (see
// src/hooks/useArrowKeyScroll.ts).
//
// NOTE: this file lives in the hand-maintained ios/ project (this repo
// is bare-workflow, not Expo-managed CNG) -- running `expo prebuild
// --clean` would wipe it. It's registered with the Xcode target's
// PBXSourcesBuildPhase, not auto-discovered.

// An invisible, zero-size view whose only job is to sit in the
// responder chain and supply keyCommands. It claims first-responder
// status by default, but a focused UITextField/UITextView always wins
// first-responder status over it automatically (that's just how
// becomeFirstResponder works), so arrow keys move the text cursor while
// typing -- this view only ever sees them when nothing else has
// claimed focus, which is exactly "browsing a screen, not typing."
class ArrowKeyResponderView: UIView {
  static let shared = ArrowKeyResponderView()

  override var canBecomeFirstResponder: Bool { true }

  override var keyCommands: [UIKeyCommand]? {
    [
      UIKeyCommand(input: UIKeyCommand.inputUpArrow, modifierFlags: [], action: #selector(onUp)),
      UIKeyCommand(input: UIKeyCommand.inputDownArrow, modifierFlags: [], action: #selector(onDown)),
    ]
  }

  @objc private func onUp() {
    ArrowKeyScrollModule.emit("up")
  }

  @objc private func onDown() {
    ArrowKeyScrollModule.emit("down")
  }

  func install(in window: UIWindow) {
    isHidden = true
    isUserInteractionEnabled = false
    frame = .zero
    window.addSubview(self)
    reclaimFocus()

    // A focused text field naturally steals first-responder status
    // (correct -- that's what makes typing/cursor-movement work). Once
    // editing ends, nothing reclaims general keyboard focus on its own,
    // so arrow-key scrolling would otherwise stay dead for the rest of
    // that screen visit. Reclaim it every time editing ends.
    NotificationCenter.default.addObserver(
      self, selector: #selector(reclaimFocus),
      name: UITextField.textDidEndEditingNotification, object: nil)
    NotificationCenter.default.addObserver(
      self, selector: #selector(reclaimFocus),
      name: UITextView.textDidEndEditingNotification, object: nil)
  }

  @objc private func reclaimFocus() {
    // A short delay so this runs after the text field has actually
    // finished resigning -- calling becomeFirstResponder() in the same
    // runloop tick as the resign is a reliable no-op.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
      self?.becomeFirstResponder()
    }
  }
}

@objc(ArrowKeyScrollModule)
class ArrowKeyScrollModule: RCTEventEmitter {
  static weak var instance: ArrowKeyScrollModule?

  override init() {
    super.init()
    ArrowKeyScrollModule.instance = self
  }

  static func emit(_ direction: String) {
    instance?.sendEvent(withName: "arrowKeyDown", body: ["direction": direction])
  }

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String]! {
    ["arrowKeyDown"]
  }
}
