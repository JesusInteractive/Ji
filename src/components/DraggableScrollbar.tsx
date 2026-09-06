import React, { useRef } from 'react';
import { PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
  // (false while dragging). Responder-negotiation flags alone
  // (onShouldBlockNativeResponder etc.) turned out not to reliably stop
  // the native ScrollView underneath from ALSO recognizing the same
  // touch as its own scroll gesture -- explicitly disabling it for the
  // duration of the drag is the only fix that's actually deterministic
  // rather than racing two gesture recognizers against each other.
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
// (e.g. the middle pricing tier) instead of only the two ends. Built on
// PanResponder (built into React Native, no extra dependency) rather than
// react-native-gesture-handler, since nothing else in this app pulls that
// library in yet.
//
// The PanResponder is built exactly ONCE (useRef initializer), not
// recreated on every render -- an earlier version rebuilt it every
// render specifically to avoid stale closures, but since this
// component's own screen re-renders on every scroll-position update
// (60fps while dragging), that meant reconstructing the whole
// PanResponder object every single frame, which read as the drag
// sticking/catching up rather than following the finger smoothly. The
// handlers below read maxScroll/trackRange/onScrollTo through refs
// that are kept fresh on every render instead, so there's no stale-
// closure problem without paying for per-frame recreation.
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

  // Raw touch-move events can fire faster than the screen can actually
  // redraw, especially on a FlatList (Scripture's book list and chapter
  // view) where each imperative scrollToOffset also has to recompute
  // which rows are virtualized/visible -- calling onScrollTo for every
  // one of those raw events, faster than frames can render, is what
  // reads as sticking rather than a fluid drag. Coalescing to at most
  // one call per animation frame (dropping/superseding anything in
  // between) keeps the drag following the finger without over-driving
  // the underlying list.
  const pendingDyRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const flushPendingMove = () => {
    rafIdRef.current = null;
    const deltaRatio = pendingDyRef.current / trackRangeRef.current;
    const newOffset = Math.min(
      Math.max(dragStartOffsetRef.current + deltaRatio * maxScrollRef.current, 0),
      maxScrollRef.current
    );
    onScrollToRef.current(newOffset);
  };

  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canScrollRef.current,
      onMoveShouldSetPanResponder: () => canScrollRef.current,
      // Grabbing the thumb also left the ScrollView sitting underneath it
      // (a sibling, not a parent -- see this component's own top-of-file
      // comment) free to recognize the same touch as its own native
      // scroll gesture, so the drag fought between "move the thumb" and
      // "scroll the content" at once -- reading as the whole page
      // dragging along with the thumb. Tried onShouldBlockNativeResponder/
      // onPanResponderTerminationRequest (the documented RN/iOS API for
      // exactly this) first, but the native ScrollView still won the
      // race in practice, ending up on the opposite failure instead: the
      // thumb stopped responding at all. onDragStart/onDragEnd below,
      // which every screen wires to its own ScrollView's scrollEnabled
      // prop, is what actually fixes it deterministically -- there's
      // nothing left to race once the native scroll is flatly disabled
      // for the duration of the drag.
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartOffsetRef.current = scrollOffsetRef.current;
        onDragStartRef.current?.();
      },
      onPanResponderMove: (_evt, gestureState) => {
        pendingDyRef.current = gestureState.dy;
        if (rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(flushPendingMove);
      },
      onPanResponderRelease: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          flushPendingMove();
        }
        onDragEndRef.current?.();
      },
      onPanResponderTerminate: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        onDragEndRef.current?.();
      },
    })
  );

  if (!canScroll) return null;

  return (
    <View style={[styles.track, { height: viewportHeight }, style]} pointerEvents="box-none">
      <View
        {...panResponderRef.current.panHandlers}
        // The thumb is only 5px wide visually (styles.thumb) -- deliberately
        // thin so it doesn't look like a fat scrollbar, but that's a hard
        // target to actually land a finger on. hitSlop extends the actual
        // touch-responder area well past the visible bar without changing
        // how it looks, the same way a small icon button gets a bigger tap
        // target elsewhere in this app.
        hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        style={[styles.thumb, { height: thumbHeight, top: thumbTop }, thumbColor ? { backgroundColor: thumbColor } : null]}
      />
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
