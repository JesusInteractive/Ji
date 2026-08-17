import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Plan } from '../types';
import Colors from '../theme/colors';

interface Props {
  plan: Plan;
  selected: boolean;
  onSelect: (planId: Plan['id']) => void;
}

export default function PlanCard({ plan, selected, onSelect }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelect(plan.id)}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {plan.badge && (
        <View style={[styles.badge, plan.id === 'platinum' ? styles.badgePlatinum : styles.badgePro]}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}
      <Text style={styles.name}>{plan.name}</Text>
      <Text style={styles.price}>{plan.priceLabel}</Text>
      {plan.features.map((f) => (
        <View key={f} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.royalBright} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
      {selected && (
        <View style={styles.selectedTick}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: Colors.gold },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePro: { backgroundColor: Colors.royalBright },
  badgePlatinum: { backgroundColor: Colors.gold },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: Colors.royal },
  price: { fontSize: 22, fontWeight: '800', color: Colors.ink, marginTop: 2, marginBottom: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  featureText: { flex: 1, fontSize: 13.5, color: '#4A5568', lineHeight: 18 },
  selectedTick: { position: 'absolute', top: 14, right: 14 },
});
