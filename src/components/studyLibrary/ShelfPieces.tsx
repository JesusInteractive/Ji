// What sits on the Study Library's shelves: book spines, the odd stack of
// books lying flat (the only place page edges show from the front), and
// bronze bookends. All plain Views -- a couple hundred of these are on
// screen, so no images or gradients per book.
import React, { memo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voiceFor } from '../../constants/studyLibraryAudio';
import { SERIF, hashKey, type Rect, type ShelfBook, type SpineLook } from './libraryLook';

const GOLD = '#D4B062';
const PLAIN = '#E6DCCB';
const PAGE_EDGE = '#E6D9B8';

interface BookSpineProps {
  book: ShelfBook;
  look: SpineLook;
  // The book currently pulled off the shelf leaves its gap behind.
  hidden?: boolean;
  onPick?: (book: ShelfBook, origin: Rect) => void;
}

export const BookSpine = memo(function BookSpine({ book, look, hidden, onPick }: BookSpineProps) {
  const ref = useRef<View>(null);
  const readAloud = !!book.readAloud;
  // Gold foil and a gold mark: Jesus AI reads it. A plain mark: the Scholar.
  const voice = book.readAloud ? voiceFor(book.readAloud) : null;
  const jesus = voice === 'jesus';
  // Two lines of title wherever the spine is wide enough to hold them.
  const wide = look.width >= 27;
  const titleTop = readAloud ? 22 : 19;
  const titleBottom = readAloud ? 28 : 19;

  const pick = () => {
    ref.current?.measureInWindow((x, y, width, height) => onPick?.(book, { x, y, width, height }));
  };

  return (
    <Pressable
      onPress={pick}
      disabled={!onPick}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.author}${voice ? (jesus ? ', read by Jesus AI' : ', read by the Scholar') : ''}`}
      style={({ pressed }) => ({ opacity: hidden ? 0 : 1, transform: [{ translateY: pressed ? -6 : 0 }] })}
    >
      <View ref={ref} style={[styles.spine, { width: look.width, height: look.height, backgroundColor: look.color }]}>
        <View style={styles.pageTop} />
        {/* Rounded spine, lit by the lamp on the left. */}
        <View style={styles.lampSide} />
        <View style={styles.lampEdge} />
        <View style={styles.shade} />
        <View style={styles.shadeEdge} />

        {jesus ? (
          <>
            <View style={[styles.foil, { top: 9 }]} />
            <View style={[styles.foilLine, { top: 17 }]} />
            <View style={[styles.foilLine, { bottom: 28 }]} />
          </>
        ) : (
          <>
            <View style={[styles.blindLine, { top: 10 }]} />
            <View style={[styles.blindLine, { top: 14 }]} />
            <View style={[styles.blindLine, { bottom: 12 }]} />
            <View style={[styles.blindLine, { bottom: 16 }]} />
          </>
        )}

        <View style={[styles.titleBox, { top: titleTop, bottom: titleBottom }]}>
          <Text
            numberOfLines={wide ? 2 : 1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[styles.title, { width: look.height - titleTop - titleBottom, fontSize: 9.5, lineHeight: 11 }]}
          >
            {book.title}
          </Text>
        </View>

        {readAloud && (
          <View style={[styles.speaker, !jesus && styles.speakerPlain]}>
            <Ionicons name="volume-medium" size={9} color={jesus ? GOLD : PLAIN} />
          </View>
        )}
      </View>
    </Pressable>
  );
});

// Two or three books lying flat at the end of a short shelf -- mostly
// showing their cream fore-edges, one turned spine-out.
export function FlatStack({ seed }: { seed: string }) {
  const hash = hashKey(seed);
  const leathers = ['#4A2E1C', '#5A1E19', '#243A2B', '#1E2A44', '#6E4B2C'];
  const count = 2 + (hash % 2);
  const books = Array.from({ length: count }, (_, i) => ({
    width: 78 + ((hash >>> (i * 4)) % 22),
    height: 13 + ((hash >>> (i * 3 + 2)) % 6),
    color: leathers[(hash >>> (i * 5 + 1)) % leathers.length],
    spineOut: i === (hash >>> 9) % count,
    shift: (((hash >>> (i * 2 + 7)) % 9) - 4),
  }));
  return (
    <View style={styles.stack}>
      {books.map((b, i) =>
        b.spineOut ? (
          <View key={i} style={[styles.flatSpine, { width: b.width, height: b.height, backgroundColor: b.color, marginLeft: b.shift }]}>
            <View style={styles.flatSpineLight} />
            <View style={[styles.flatSpineBand, { left: 8 }]} />
            <View style={[styles.flatSpineBand, { right: 8 }]} />
          </View>
        ) : (
          <View
            key={i}
            style={[styles.foreEdge, { width: b.width, height: b.height, borderColor: b.color, marginLeft: b.shift }]}
          >
            <View style={styles.foreEdgeLine} />
            <View style={[styles.foreEdgeLine, { top: '62%' }]} />
          </View>
        )
      )}
    </View>
  );
}

export function Bookend() {
  return (
    <View style={styles.bookend}>
      <View style={styles.bookendPlate}>
        <View style={styles.bookendLight} />
      </View>
      <View style={styles.bookendFoot} />
    </View>
  );
}

export const BOOKEND_WIDTH = 16;
export const STACK_WIDTH = 104;

const styles = StyleSheet.create({
  spine: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
  },
  pageTop: { position: 'absolute', top: 0, left: 2, right: 2, height: 2, backgroundColor: PAGE_EDGE, opacity: 0.75 },
  lampSide: { position: 'absolute', top: 2, bottom: 0, left: 0, width: '32%', backgroundColor: 'rgba(255,214,160,0.13)' },
  lampEdge: { position: 'absolute', top: 2, bottom: 0, left: 1, width: 1.5, backgroundColor: 'rgba(255,225,180,0.32)' },
  shade: { position: 'absolute', top: 2, bottom: 0, right: 0, width: '36%', backgroundColor: 'rgba(0,0,0,0.3)' },
  shadeEdge: { position: 'absolute', top: 2, bottom: 0, right: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.45)' },
  foil: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: GOLD,
    opacity: 0.85,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,240,190,0.7)',
  },
  foilLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: GOLD, opacity: 0.7 },
  blindLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.35)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,220,170,0.12)' },
  titleBox: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  title: {
    transform: [{ rotate: '90deg' }],
    textAlign: 'center',
    color: '#DDBF74',
    fontFamily: SERIF,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  speaker: {
    position: 'absolute',
    bottom: 9,
    alignSelf: 'center',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  speakerPlain: { borderColor: PLAIN, opacity: 0.85 },
  stack: { alignItems: 'center', width: STACK_WIDTH },
  flatSpine: { borderRadius: 2, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 1.5 },
  flatSpineLight: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(255,214,160,0.14)' },
  flatSpineBand: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: GOLD, opacity: 0.55 },
  foreEdge: {
    backgroundColor: PAGE_EDGE,
    borderTopWidth: 2.5,
    borderBottomWidth: 2.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 1.5,
  },
  foreEdgeLine: { position: 'absolute', left: 2, right: 2, top: '30%', height: 0.5, backgroundColor: 'rgba(110,85,50,0.35)' },
  bookend: { width: BOOKEND_WIDTH, alignItems: 'flex-start' },
  bookendPlate: {
    width: 7,
    height: 64,
    backgroundColor: '#5E4629',
    borderTopRightRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  bookendLight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,210,150,0.35)' },
  bookendFoot: { width: BOOKEND_WIDTH, height: 4, backgroundColor: '#4B3820', borderTopRightRadius: 2 },
});
