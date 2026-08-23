import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import PlanCard from '../../components/PlanCard';
import DraggableScrollbar from '../../components/DraggableScrollbar';
import { PLANS, TOKEN_PACKS, MONETIZATION_EXPLAINER } from '../../constants/pricing';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { presentProPaywall, purchasePlan } from '../../services/purchases';
import type { PlanId } from '../../types';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Pricing'>;

export default function PricingScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { selectPlan } = useApp();
  const [selected, setSelected] = useState<PlanId>('free');
  const [error, setError] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const recomputeInitialVisibility = (newContentHeight: number, newViewportHeight: number) => {
    if (newContentHeight && newViewportHeight) {
      setShowScrollToBottom(newContentHeight - newViewportHeight > 200);
    }
  };

  // Free just records a local choice -- nothing to purchase. Basic/Pro
  // buy their single monthly product directly via purchasePlan().
  // Platinum has three durations (monthly/yearly/lifetime) bundled into
  // one RevenueCat offering, so it launches the prebuilt paywall instead
  // of a single purchasePlan() call, letting the user pick a duration
  // there. REVENUECAT_PRODUCT_IDS/PRO_PRODUCT_IDS still need real
  // product ids from App Store Connect / Play Console before any of
  // this can charge anyone -- see services/purchases.ts.
  const handleContinue = async () => {
    if (selected === 'free') {
      selectPlan('free');
      return;
    }

    setPurchasing(true);
    if (selected === 'platinum') {
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
      return;
    }

    const result = await purchasePlan(selected);
    setPurchasing(false);
    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert('Something went wrong', result.error ?? 'Could not complete the purchase. Please try again.');
      return;
    }
    selectPlan(selected);
    // Onboarding is complete once a plan is chosen; RootNavigator will
    // switch to the Main tab stack automatically once onboardingComplete
    // flips true in AppContext.
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        onLayout={({ nativeEvent }) => {
          setViewportHeight(nativeEvent.layout.height);
          recomputeInitialVisibility(contentHeight, nativeEvent.layout.height);
        }}
        onContentSizeChange={(_width, height) => {
          setContentHeight(height);
          recomputeInitialVisibility(height, viewportHeight);
        }}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
          setShowScrollToBottom(distanceFromBottom > 200);
          setScrollOffset(contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
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
      <DraggableScrollbar
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
        scrollOffset={scrollOffset}
        onScrollTo={(offset) => {
          scrollRef.current?.scrollTo({ y: offset, animated: false });
          setScrollOffset(offset);
        }}
      />
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomBtn}
          onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          accessibilityLabel="Scroll to bottom"
        >
          <Ionicons name="arrow-down" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
      </View>

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
  scrollToBottomBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
