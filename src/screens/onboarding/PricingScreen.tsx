import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import PlanCard from '../../components/PlanCard';
import DraggableScrollbar from '../../components/DraggableScrollbar';
import { PLANS, MONETIZATION_EXPLAINER } from '../../constants/pricing';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { purchasePlan } from '../../services/purchases';
import type { PlanId } from '../../types';

// Registered in BOTH OnboardingStackParamList (first-run plan choice)
// and RootStackParamList (reachable later -- see RootNavigator.tsx's own
// comment) as the same component and route name, so this only needs a
// structural navigation type rather than picking one stack's params.
type Props = { navigation: { goBack: () => void } };

export default function PricingScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { selectPlan, hasSelectedPlan } = useApp();
  const [selected, setSelected] = useState<PlanId>('free');
  const [error, setError] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // During first-run onboarding there's nothing to go back TO yet --
  // RootNavigator swaps Onboarding for Main once onboardingComplete
  // flips true (see its own comment), so this screen just needs to call
  // selectPlan() and let that happen. Reached later (upgrade path), it's
  // a modal pushed on top of the already-running app, so it needs to
  // dismiss itself once a plan choice actually lands.
  const finish = () => {
    if (hasSelectedPlan) navigation.goBack();
  };

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

  // Free just records a local choice -- nothing to purchase. Basic, Pro,
  // and Platinum are now all single monthly products (Platinum's old
  // extra yearly/lifetime durations are gone), so all three buy through
  // the same purchasePlan() call. REVENUECAT_PRODUCT_IDS still needs
  // real product ids from App Store Connect / Play Console before any of
  // this can charge anyone -- see services/purchases.ts.
  const handleContinue = async () => {
    if (selected === 'free') {
      selectPlan('free');
      finish();
      return;
    }

    setPurchasing(true);
    const result = await purchasePlan(selected);
    setPurchasing(false);
    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert('Something went wrong', result.error ?? 'Could not complete the purchase. Please try again.');
      return;
    }
    selectPlan(selected);
    // During onboarding, RootNavigator swaps Onboarding for Main
    // automatically once onboardingComplete flips true in AppContext --
    // finish() only needs to act (goBack) for the later upgrade path.
    finish();
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
