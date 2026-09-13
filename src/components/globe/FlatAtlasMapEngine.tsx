// v1 map engine for the Global Map ("Journeys Through the Bible") --
// a REAL map (react-native-maps on Apple's native MapKit provider, no
// API key/billing account needed on iOS), not an illustration. Hybrid
// (satellite + labels) or pure satellite tiles, native pinch-zoom/pan
// plus explicit on-screen zoom +/- and a satellite toggle (map chrome
// lives entirely in this file, not plumbed through MapEngineProps --
// GlobalMapScreen doesn't need to know about it), gold pins at each
// site's real lat/lng, a gold polyline for the active journey, and the
// camera animates to each journey stop in turn.
//
// Implements the shared MapEngineProps contract (src/types/globe.ts) so
// a future upgrade (Mapbox terrain styling, a 3D globe view, etc.) can
// replace this file without GlobalMapScreen, the era filters, the
// journey picker, or the site dossier sheet changing at all.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, type MapType } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import type { MapEngineProps } from '../../types/globe';

const INITIAL_REGION = {
  latitude: 31,
  longitude: 36,
  latitudeDelta: 22,
  longitudeDelta: 30,
};

const MIN_ZOOM = 2;
const MAX_ZOOM = 18;

export default function FlatAtlasMapEngine({ sites, activeJourney, onSitePress }: MapEngineProps) {
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<MapType>('hybrid');

  const journeyStops = useMemo(() => {
    if (!activeJourney) return [];
    return activeJourney.journey.siteIds
      .map((id) => sites.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [activeJourney, sites]);

  const activeStopSiteId = activeJourney ? journeyStops[activeJourney.stopIndex]?.id : undefined;

  useEffect(() => {
    if (!activeJourney) return;
    const stop = journeyStops[activeJourney.stopIndex];
    if (!stop) return;
    mapRef.current?.animateToRegion(
      {
        latitude: stop.coordinates.lat,
        longitude: stop.coordinates.lng,
        latitudeDelta: 6,
        longitudeDelta: 6,
      },
      850
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJourney?.stopIndex, activeJourney?.journey.id]);

  const adjustZoom = async (delta: number) => {
    const camera = await mapRef.current?.getCamera();
    if (!camera) return;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (camera.zoom ?? 8) + delta));
    mapRef.current?.animateCamera({ ...camera, zoom: nextZoom }, { duration: 220 });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        initialRegion={INITIAL_REGION}
        showsCompass={false}
      >
        {journeyStops.length > 1 && (
          <Polyline
            coordinates={journeyStops.map((s) => ({ latitude: s.coordinates.lat, longitude: s.coordinates.lng }))}
            strokeColor={Colors.gold}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {sites
          .filter((site) => !site.nonGeographic)
          .map((site) => (
            <Marker
              key={site.id}
              coordinate={{ latitude: site.coordinates.lat, longitude: site.coordinates.lng }}
              title={site.name}
              description={site.summary}
              pinColor={site.id === activeStopSiteId ? Colors.white : Colors.gold}
              onPress={() => onSitePress(site.id)}
            />
          ))}
      </MapView>

      <View style={styles.mapTypeGroup}>
        {(['standard', 'satellite', 'hybrid'] as MapType[]).map((type) => (
          <Pressable
            key={type}
            style={[styles.mapTypeButton, mapType === type && styles.mapTypeButtonActive]}
            onPress={() => setMapType(type)}
            accessibilityLabel={`${type} view`}
          >
            <Text style={[styles.mapTypeText, mapType === type && styles.mapTypeTextActive]}>
              {type === 'standard' ? 'Map' : type === 'satellite' ? 'Satellite' : 'Hybrid'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        <View style={styles.zoomGroup}>
          <Pressable style={styles.controlButton} onPress={() => adjustZoom(1)} accessibilityLabel="Zoom in">
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.controlButton} onPress={() => adjustZoom(-1)} accessibilityLabel="Zoom out">
            <Text style={styles.zoomText}>−</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { position: 'absolute', top: 12, right: 12, gap: 8, alignItems: 'flex-end' },
  controlButton: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(13,27,76,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlButtonActive: { backgroundColor: Colors.gold },
  zoomGroup: { borderRadius: 10, overflow: 'hidden' },
  zoomDivider: { height: 1, backgroundColor: 'rgba(251,247,236,0.2)' },
  zoomText: { color: Colors.ivory, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  mapTypeGroup: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row',
    backgroundColor: 'rgba(13,27,76,0.85)', borderRadius: 10, overflow: 'hidden',
  },
  mapTypeButton: { paddingHorizontal: 10, paddingVertical: 8 },
  mapTypeButtonActive: { backgroundColor: Colors.gold },
  mapTypeText: { color: Colors.ivory, fontSize: 11.5, fontWeight: '700' },
  mapTypeTextActive: { color: Colors.royal },
});
