import React, { useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Colors from '../theme/colors';

interface Props {
  contentHeight: number;
  viewportHeight: number;
  scrollOffset: number;
  // Screens hand this their own ScrollView.scrollTo({y, animated:false}) or
  // FlatList.scrollToOffset({offset, animated:false}) -- kept generic here
  // rather than taking a ref directly, since the two components' scroll
  // APIs don't share a common shape.
  onScrollTo: (offset: number) => void;
  // Fired the instant the thumb is grabbed/released -- every screen using
  // this wires these to its own ScrollView/FlatList's scrollEnabled prop
  // (false while dragging), so the native scroll underneath never fights
  // the thumb drag for the same touch/gesture.
  onDragStart?: () => void;
  onDragEnd?: () => void;
  style?: StyleProp<ViewStyle>;
  // Every other screen using this puts it on a light/cream background,
  // where the default navy thumb reads fine. HomeScreen's background is
  // navy too (Colors.royal) -- the same color at 0.5 opacity on itself
  // is effectively invisible, not just hard to see. Overridable per
  // screen rather than guessing a color that works everywhere.
  thumbColor?: string;
}

const THUMB_MIN_HEIGHT = 32;

// A real draggable scrollbar (track + thumb), not just a jump-to-top/
// bottom button -- lets someone drag straight to an arbitrary position
// (e.g. the middle pricing tier) instead of only the two ends.
//
// Built on react-native-gesture-handler's Gesture.Pan(), not the older
// built-in PanResponder -- PanResponder is a JS-only touch responder and
// was reported flaky specifically for a real laptop trackpad's
// click-and-drag (Mac Catalyst's mouse-to-touch translation doesn't
// reliably fire the same grant/move sequence a finger does). RNGH's
// native gesture recognizers handle mouse/trackpad drag as a first-class
// input, not a touch-event translation, and the app root
// (src/AppRoot.tsx) already wraps everything in GestureHandlerRootView
// (needed for React Navigation's own gestures), so this is a safe,
// zero-new-setup swap.
export default function DraggableScrollbar({
  contentHeight,
  viewportHeight,
  scrollOffset,
  onScrollTo,
  onDragStart,
  onDragEnd,
  style,
  thumbColor,
}: Props) {
  const maxScroll = Math.max(contentHeight - viewportHeight, 0);
  const canScroll = maxScroll > 0 && viewportHeight > 0;

  const thumbHeight = canScroll
    ? Math.min(Math.max((viewportHeight / contentHeight) * viewportHeight, THUMB_MIN_HEIGHT), viewportHeight)
    : viewportHeight;
  const trackRange = Math.max(viewportHeight - thumbHeight, 1);
  const thumbTop = canScroll ? trackRange * (Math.min(Math.max(scrollOffset, 0), maxScroll) / maxScroll) : 0;

  // Read through refs (kept fresh every render) rather than closing over
  // props directly -- Gesture.Pan()'s callbacks are set up once and reused
  // across re-renders (same reasoning the old PanResponder version used:
  // this component's own screen re-renders on every scroll-position
  // update, up to 60fps while dragging, so nothing here should force a
  // gesture object rebuild on every frame).
  const dragStartOffsetRef = useRef(0);
  const scrollOffsetRef = useRef(scrollOffset);
  const maxScrollRef = useRef(maxScroll);
  const trackRangeRef = useRef(trackRange);
  const canScrollRef = useRef(canScroll);
  const onScrollToRef = useRef(onScrollTo);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  scrollOffsetRef.current = scrollOffset;
  maxScrollRef.current = maxScroll;
  trackRangeRef.current = trackRange;
  canScrollRef.current = canScroll;
  onScrollToRef.current = onScrollTo;
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  const handleStart = () => {
    if (!canScrollRef.current) return;
    dragStartOffsetRef.current = scrollOffsetRef.current;
    onDragStartRef.current?.();
  };
  const handleUpdate = (translationY: number) => {
    if (!canScrollRef.current) return;
    const deltaRatio = translationY / trackRangeRef.current;
    const newOffset = Math.min(
      Math.max(dragStartOffsetRef.current + deltaRatio * maxScrollRef.current, 0),
      maxScrollRef.current
    );
    onScrollToRef.current(newOffset);
  };
  const handleEnd = () => {
    onDragEndRef.current?.();
  };

  const panGesture = useRef(
    Gesture.Pan()
      // onBegin, not onStart -- fires the instant a touch/click lands on
      // the thumb, before any movement threshold is met. Disabling the
      // underlying ScrollView (via onDragStart -> scrollEnabled=false on
      // the screen) has to happen at THIS earliest possible moment, or
      // there's a brief window where a touch here could still also be
      // read as the start of the ScrollView's own native scroll --
      // exactly the double-movement this callback exists to prevent.
      .onBegin(() => {
        runOnJS(handleStart)();
      })
      .onUpdate((e) => {
        runOnJS(handleUpdate)(e.translationY);
      })
      .onEnd(() => {
        runOnJS(handleEnd)();
      })
      .onFinalize(() => {
        runOnJS(handleEnd)();
      })
      // Keeps this recognized as a drag even for tiny movements, and lets
      // a mouse-drag (no real "finger" minimum distance) start instantly.
      .minDistance(0)
      .hitSlop({ top: 10, bottom: 10, left: 16, right: 16 })
  ).current;

  if (!canScroll) return null;

  return (
    <View style={[styles.track, { height: viewportHeight }, style]} pointerEvents="box-none">
      <GestureDetector gesture={panGesture}>
        <View
          style={[styles.thumb, { height: thumbHeight, top: thumbTop }, thumbColor ? { backgroundColor: thumbColor } : null]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    right: 2,
    top: 0,
    width: 24,
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 5,
    borderRadius: 3,
    backgroundColor: Colors.royal,
    opacity: 0.5,
  },
});
