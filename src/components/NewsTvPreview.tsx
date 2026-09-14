// "Jesus Interactive 24/7 News" -- a look at the TV player planned for the
// bottom of the welcome screen, under a Coming Soon ribbon. It depends on
// an affiliate agreement that isn't signed yet, so for now it's a still
// preview: nothing streams, nothing is tappable, and HomeScreen renders it
// in development builds only, so it never reaches the stores like this.
// Once the agreement is signed, this becomes the real player.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';

export default function NewsTvPreview() {
  return (
    <View style={styles.wrap} accessible accessibilityLabel="Jesus Interactive 24/7 News, coming soon">
      <View style={styles.labelRow}>
        <Ionicons name="tv-outline" size={13} color={Colors.gold} />
        <Text style={styles.label}>Jesus Interactive 24/7 News</Text>
      </View>

      <View style={styles.bezel}>
        <LinearGradient colors={['#1C2F6E', '#0B1638', '#060D26']} locations={[0, 0.6, 1]} style={styles.screen}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.play}>
            <Ionicons name="play" size={30} color={Colors.gold} style={{ marginLeft: 4 }} />
          </View>

          {/* The lower-third the broadcast would carry. */}
          <View style={styles.lowerThird}>
            <View style={styles.lowerThirdAccent} />
            <Text style={styles.lowerThirdText} numberOfLines={1}>
              JESUS INTERACTIVE 24/7 NEWS
            </Text>
          </View>

          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>COMING SOON</Text>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.caption}>Live Christian news, streaming right here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 26, gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.gold, letterSpacing: 1.2, textTransform: 'uppercase' },
  bezel: {
    borderRadius: 16,
    padding: 6,
    backgroundColor: '#050A1F',
    borderWidth: 1,
    borderColor: 'rgba(255,192,0,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  screen: {
    aspectRatio: 16 / 9,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  // Dimmed on purpose -- nothing is live yet.
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E2574C', opacity: 0.45 },
  liveText: { fontSize: 10, fontWeight: '800', color: Colors.ivory, opacity: 0.6, letterSpacing: 1 },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(13,27,76,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowerThird: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 26,
  },
  lowerThirdAccent: { width: 6, backgroundColor: Colors.gold },
  lowerThirdText: {
    flexShrink: 1,
    backgroundColor: 'rgba(13,27,76,0.88)',
    color: Colors.ivory,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  ribbon: {
    position: 'absolute',
    top: 24,
    right: -48,
    width: 190,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  ribbonText: { fontSize: 11, fontWeight: '900', color: Colors.royal, letterSpacing: 1.6 },
  caption: { fontSize: 13, color: 'rgba(251,247,236,0.75)', textAlign: 'center' },
});
