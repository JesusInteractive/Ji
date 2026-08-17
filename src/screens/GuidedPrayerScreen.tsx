import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';

interface Step {
  title: string;
  prompt: string;
}

const STEPS: Step[] = [
  { title: 'Adoration', prompt: 'Start by simply telling God who He is to you -- His goodness, His power, His love.' },
  { title: 'Confession', prompt: 'Be honest about where you\'ve fallen short. He already knows; He just wants you to bring it to Him.' },
  { title: 'Thanksgiving', prompt: 'Name three things, big or small, that you\'re grateful for right now.' },
  { title: 'Supplication', prompt: 'Ask. Bring your real requests -- for yourself and for others -- without holding back.' },
  { title: 'Listen', prompt: 'Sit quietly for a moment. Prayer isn\'t only talking.' },
];

// Guided prayer mode (spec section 7) -- a simple ACTS-style walkthrough.
export default function GuidedPrayerScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Guided Prayer</Text>
      <View style={styles.card}>
        <Text style={styles.stepLabel}>Step {stepIndex + 1} of {STEPS.length}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepPrompt}>{step.prompt}</Text>
      </View>
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, stepIndex === 0 && styles.navBtnDisabled]}
          disabled={stepIndex === 0}
          onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.royal} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navBtnPrimary}
          onPress={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={stepIndex === STEPS.length - 1}
        >
          <Text style={styles.navBtnPrimaryText}>
            {stepIndex === STEPS.length - 1 ? 'Amen' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F4F6FA', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, marginBottom: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, minHeight: 180 },
  stepLabel: { fontSize: 12, color: '#A0AEC0', fontWeight: '600' },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.gold, marginTop: 6, marginBottom: 10 },
  stepPrompt: { fontSize: 15, lineHeight: 22, color: Colors.ink },
  nav: { flexDirection: 'row', gap: 12, marginTop: 20, alignItems: 'center' },
  navBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnPrimary: {
    flex: 1, backgroundColor: Colors.royal, borderRadius: 22, paddingVertical: 12, alignItems: 'center',
  },
  navBtnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
