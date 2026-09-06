import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

// Pairs with ios/JiJesusInteractive/ArrowKeyScrollModule.swift -- see
// that file's own comment for why this needs real native code at all
// (UIScrollView never responds to a hardware keyboard's arrow keys on
// its own). That module emits a plain 'arrowKeyDown' event with
// { direction: 'up' | 'down' } whenever the up/down arrow is pressed
// and no text field currently has keyboard focus; this hook is the one
// place every screen wires that event to its own scroll call, since a
// ScrollView and a FlatList don't share a scroll API (scrollTo vs
// scrollToOffset).
//
// Android has no equivalent native module (external keyboards are a
// far less common iPad/Mac-adjacent scenario there) -- this hook is a
// silent no-op off iOS rather than every call site needing its own
// Platform.OS check.
const PIXELS_PER_ARROW_PRESS = 60;

const emitter =
  Platform.OS === 'ios' && NativeModules.ArrowKeyScrollModule
    ? new NativeEventEmitter(NativeModules.ArrowKeyScrollModule)
    : null;

interface Options {
  // Current scroll position, kept in sync by the caller's own onScroll
  // handler -- needed because ScrollView.scrollTo() takes an absolute
  // y, not a relative delta.
  getOffset: () => number;
  // ScrollView: (opts) => ref.current?.scrollTo({ y, animated: true })
  // FlatList: (opts) => ref.current?.scrollToOffset({ offset: y, animated: true })
  scrollTo: (y: number) => void;
  // Only screens actually worth arrow-key scrolling opt in -- a screen
  // that's only ever a few hundred px tall doesn't need this.
  enabled?: boolean;
}

// Only screens that are the CURRENTLY FOCUSED tab/stack screen should
// react -- useIsFocused() is what stops every mounted-but-backgrounded
// screen's arrow-key listener from all scrolling at once.
export function useArrowKeyScroll({ getOffset, scrollTo, enabled = true }: Options): void {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!emitter || !isFocused || !enabled) return;
    const sub = emitter.addListener('arrowKeyDown', ({ direction }: { direction: 'up' | 'down' }) => {
      const delta = direction === 'down' ? PIXELS_PER_ARROW_PRESS : -PIXELS_PER_ARROW_PRESS;
      scrollTo(Math.max(0, getOffset() + delta));
    });
    return () => sub.remove();
  }, [isFocused, enabled, getOffset, scrollTo]);
}
