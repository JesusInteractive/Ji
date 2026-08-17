import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import PlanCard from '../../components/PlanCard';
import { PLANS, TOKEN_PACKS, MONETIZATION_EXPLAINER } from '../../constants/pricing';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { presentProPaywall } from '../../services/purchases';
import type { PlanId } from '../../types';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Pricing'>;

export default function PricingScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { selectPlan } = useApp();
  const [selected, setSelected] = useState<PlanId>('free');
  const [error, setError] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Free/Basic/Pro just record a local choice (see AppContext.selectPlan
  // -- no real product behind those yet, see constants/pricing.ts).
  // Platinum is the one tier with real RevenueCat products
  // (PRO_PRODUCT_IDS: monthly/yearly/lifetime, all granting
  // PRO_ENTITLEMENT_ID), so selecting it launches the real paywall right
  // here rather than deferring the purchase moment to later.
  const handleContinue = async () => {
    if (selected !== 'platinum') {
      selectPlan(selected);
      return;
    }

    setPurchasing(true);
    const outcome = await presentProPaywall();
    setPurchasing(false);

    switch (outcome) {
      case 'purchased':
      case 'restored':
      case 'not_presented':
        // not_presented covers two real cases: the entitlement is
        // already active (e.g. the founder code already granted it --
        // see services/founderAccess.ts), or this is Expo Go, where
        // purchases.ts no-ops entirely (see its own top comment) --
        // either way, proceeding locally is correct, not a bug.
        selectPlan('platinum');
        break;
      case 'cancelled':
        // Stay on this screen -- they can pick a different tier or try
        // again, no error needed for a plain cancel.
        break;
      case 'error':
        Alert.alert('Something went wrong', 'Could not complete the purchase. Please try again.');
        break;
    }
    // Onboarding is complete once a plan is chosen; RootNavigator will
    // switch to the Main tab stack automatically once onboardingComplete
    // flips true in AppContext.
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t.pricing.title}</Text>
        <Text style={styles.subtitle}>{t.pricing.subtitle}</Text>
        <Text style={styles.explainer}>{MONETIZATION_EXPLAINER.free} {MONETIZATION_EXPLAINER.paid}</Text>

        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} selected={selected === p.id} onSelect={setSelected} />
        ))}

        <View style={styles.tokenSection}>
          <Text style={styles.tokenTitle}>{t.pricing.tokenTitle}</Text>
          <Text style={styles.tokenSubtitle}>{t.pricing.tokenSubtitle}</Text>
          <View style={styles.tokenRow}>
            {TOKEN_PACKS.map((pack) => (
              <View key={pack.id} style={styles.tokenCard}>
                <Text style={styles.tokenCount}>{pack.tokens}</Text>
                <Text style={styles.tokenLabel}>questions</Text>
                <Text style={styles.tokenPrice}>{pack.priceLabel}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>Choose a plan to continue.</Text>}
        <TouchableOpacity style={styles.cta} onPress={handleContinue} disabled={purchasing}>
          {purchasing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.ctaText}>{t.common.continue}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  scroll: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 10 },
  explainer: { fontSize: 12, color: '#A0AEC0', lineHeight: 17, marginBottom: 16 },
  tokenSection: { marginTop: 8, marginBottom: 12 },
  tokenTitle: { fontSize: 16, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  tokenSubtitle: { fontSize: 12.5, color: '#718096', marginBottom: 12 },
  tokenRow: { flexDirection: 'row', gap: 10 },
  tokenCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tokenCount: { fontSize: 20, fontWeight: '800', color: Colors.royal },
  tokenLabel: { fontSize: 11, color: '#718096', marginBottom: 6 },
  tokenPrice: { fontSize: 13, fontWeight: '700', color: Colors.gold },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F4F6FA' },
  error: { color: Colors.danger, fontSize: 12, marginBottom: 8, textAlign: 'center' },
  cta: { backgroundColor: Colors.royal, borderRadius: 26, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
