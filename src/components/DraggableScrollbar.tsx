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
  style?: StyleProp<ViewStyle>;
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
  style,
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
  scrollOffsetRef.current = scrollOffset;
  maxScrollRef.current = maxScroll;
  trackRangeRef.current = trackRange;
  canScrollRef.current = canScroll;
  onScrollToRef.current = onScrollTo;

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
      onPanResponderGrant: () => {
        dragStartOffsetRef.current = scrollOffsetRef.current;
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
      },
      onPanResponderTerminate: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      },
    })
  );

  if (!canScroll) return null;

  return (
    <View style={[styles.track, { height: viewportHeight }, style]} pointerEvents="box-none">
      <View {...panResponderRef.current.panHandlers} style={[styles.thumb, { height: thumbHeight, top: thumbTop }]} />
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
