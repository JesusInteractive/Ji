// Shared full-screen paywall shown by every gated screen once the
// 5-day trial has ended and there's no active subscription (see
// src/hooks/useFeatureAccess.ts). No ad-unlock option -- the only way
// back in is Subscribe.
//
// Deliberately takes `onSubscribe` as a prop rather than doing its own
// navigation.getParent() chain internally: different gated screens sit
// at different depths in the nav tree (a root-level modal screen like
// BibleWordSearchScreen needs zero hops to reach the root stack's
// Pricing route, while a screen nested under a tab stack like
// ChatScreen needs two), so only the calling screen actually knows the
// right number of getParent() hops for itself.
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { logEvent } from '../services/analytics';

interface Props {
  featureName: string;
  onSubscribe: () => void;
}

export default function PaywallLockScreen({ featureName, onSubscribe }: Props) {
  useEffect(() => {
    logEvent('paywall_shown', { feature: featureName });
  }, [featureName]);

  const handleSubscribe = () => {
    logEvent('subscribe_tapped', { feature: featureName });
    onSubscribe();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={40} color={Colors.gold} style={{ marginBottom: 16 }} />
      <Text style={styles.title}>Your free trial has ended</Text>
      <Text style={styles.body}>
        Subscribe to keep using {featureName} and everything else in Jesus Interactive.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleSubscribe} accessibilityRole="button">
        <Text style={styles.buttonText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.ivory },
  title: { fontSize: 20, fontWeight: '800', color: Colors.royal, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14.5, color: Colors.ink, opacity: 0.75, textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  button: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { color: Colors.royal, fontWeight: '800', fontSize: 15 },
});
