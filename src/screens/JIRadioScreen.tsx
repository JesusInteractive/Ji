// "24/7 Global Praise and Worship" -- this app's own radio.co-hosted
// live stream, played in-app via expo-audio (see
// context/LiveRadioPlaybackContext.tsx). Station name/stream URL/
// schedule are backend-hosted and fetched at runtime (services/radioApi.ts),
// same pattern as Bible Trivia's question bank -- so a radio.co plan
// upgrade (Light plan, 500 listeners, to whatever's next) is a single
// admin API call, never an app release. Falls back to a hardcoded
// default stream (constants/radioStations.ts) if the backend is
// unreachable.
//
// Previously this screen was a station picker linking out to K-LOVE's
// and Air1's own web players via WebView -- that was a deliberate
// licensing choice at the time (see git history), made moot now that
// this app has its own worship radio channel.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import PaywallLockScreen from '../components/PaywallLockScreen';
import { logEvent } from '../services/analytics';
import { useLiveRadioPlayback } from '../context/LiveRadioPlaybackContext';
import { FALLBACK_STATION_NAME } from '../constants/radioStations';
import { fetchRadioConfig } from '../services/radioApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import VolumeSlider from '../components/VolumeSlider';

type Props = NativeStackScreenProps<RootStackParamList, 'JIRadio'>;

export default function JIRadioScreen({ navigation }: Props) {
  const { hasAccess } = useFeatureAccess();
  const {
    isPlaying,
    isBuffering,
    stationName: playingStationName,
    trackTitle,
    trackArtist,
    volume,
    setVolume,
    play,
    pause,
  } = useLiveRadioPlayback();
  const [displayName, setDisplayName] = useState(FALLBACK_STATION_NAME);
  const [loadingConfig, setLoadingConfig] = useState(true);
  // True until GET /v1/radio/config returns a real, seeded stream --
  // radio_config has no seed row until the actual radio.co stream URL is
  // set via the admin route (see backend/db.js's own comment), so a
  // fresh/unconfigured backend always lands here. Drives the "Coming
  // Soon" banner below instead of exposing a play button that would
  // have no stream to play.
  const [comingSoon, setComingSoon] = useState(true);

  useEffect(() => {
    fetchRadioConfig()
      .then((config) => {
        setDisplayName(config.stationName);
        setComingSoon(false);
      })
      .catch(() => {
        // Backend unreachable/unseeded -- keep the fallback name and
        // the "Coming Soon" state.
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  useEffect(() => {
    if (hasAccess) logEvent('feature_used', { feature: 'radio' });
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <PaywallLockScreen
        featureName="24/7 Global Praise and Worship"
        onSubscribe={() => navigation.navigate('Pricing')}
      />
    );
  }

  const nameToShow = isPlaying && playingStationName ? playingStationName : displayName;

  return (
    <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.iconWrap}>
        <Ionicons name="radio" size={64} color={Colors.gold} />
      </View>
      <Text style={styles.stationName}>{nameToShow}</Text>
      <Text style={styles.tagline}>Worship radio, streaming 24/7</Text>

      {!loadingConfig && comingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Ionicons name="time-outline" size={16} color={Colors.royal} />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : (
        <>
          {/* Only rendered while actually playing, per this feature's
              own spec -- a paused/idle screen has no "current track" to
              show. trackTitle/trackArtist are placeholders (station
              name / "Live") until the radio.co Now Playing metadata
              integration is wired up -- see LiveRadioPlaybackContext's
              own comment. */}
          {isPlaying && (
            <View style={styles.nowPlaying}>
              <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{trackTitle ?? nameToShow}</Text>
              {!!trackArtist && <Text style={styles.nowPlayingArtist} numberOfLines={1}>{trackArtist}</Text>}
            </View>
          )}

          <TouchableOpacity
            style={styles.playButton}
            onPress={isPlaying ? pause : play}
            disabled={loadingConfig}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? `Pause ${nameToShow}` : `Play ${nameToShow}`}
          >
            {isBuffering ? (
              <ActivityIndicator color={Colors.royal} />
            ) : (
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color={Colors.royal} />
            )}
          </TouchableOpacity>
          <Text style={styles.playLabel}>{isPlaying ? 'Playing' : 'Tap to listen'}</Text>

          <View style={styles.volumeRow}>
            <VolumeSlider value={volume} onChange={setVolume} />
          </View>
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stationName: { fontSize: 26, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, marginBottom: 40, textAlign: 'center' },
  playButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLabel: { fontSize: 14, fontWeight: '700', color: Colors.gold, marginTop: 16 },
  nowPlaying: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
    width: '100%',
  },
  nowPlayingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  nowPlayingTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, textAlign: 'center' },
  nowPlayingArtist: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center' },
  volumeRow: {
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 8,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  comingSoonText: { fontSize: 14, fontWeight: '800', color: Colors.royal },
});
