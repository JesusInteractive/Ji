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
// Deliberately NOT memoized with useRef -- PanResponder.create() is cheap,
// and recreating it each render is what lets onPanResponderMove close over
// the current scrollOffset/contentHeight/viewportHeight props instead of
// stale ones captured at first mount (a real bug if this were memoized).
export default function DraggableScrollbar({
  contentHeight,
  viewportHeight,
  scrollOffset,
  onScrollTo,
  style,
}: Props) {
  const dragStartOffsetRef = useRef(0);

  const maxScroll = Math.max(contentHeight - viewportHeight, 0);
  const canScroll = maxScroll > 0 && viewportHeight > 0;

  const thumbHeight = canScroll
    ? Math.min(Math.max((viewportHeight / contentHeight) * viewportHeight, THUMB_MIN_HEIGHT), viewportHeight)
    : viewportHeight;
  const trackRange = Math.max(viewportHeight - thumbHeight, 1);
  const thumbTop = canScroll ? trackRange * (Math.min(Math.max(scrollOffset, 0), maxScroll) / maxScroll) : 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => canScroll,
    onMoveShouldSetPanResponder: () => canScroll,
    onPanResponderGrant: () => {
      dragStartOffsetRef.current = scrollOffset;
    },
    onPanResponderMove: (_evt, gestureState) => {
      const deltaRatio = gestureState.dy / trackRange;
      const newOffset = Math.min(Math.max(dragStartOffsetRef.current + deltaRatio * maxScroll, 0), maxScroll);
      onScrollTo(newOffset);
    },
  });

  if (!canScroll) return null;

  return (
    <View style={[styles.track, { height: viewportHeight }, style]} pointerEvents="box-none">
      <View {...panResponder.panHandlers} style={[styles.thumb, { height: thumbHeight, top: thumbTop }]} />
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
