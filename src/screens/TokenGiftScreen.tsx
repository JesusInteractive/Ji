import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { GIFT_CERTIFICATES, MONETIZATION_EXPLAINER, PLANS } from '../constants/pricing';
import { useApp } from '../context/AppContext';
import { generateGiftCodeLocally, redeemGiftCode } from '../services/tokenGifting';
import { isFounderCode, isFamilyCode } from '../services/founderAccess';
import { purchaseGiftCertificate } from '../services/purchases';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useI18n, interpolate } from '../i18n';

const planName = (planId: string) => PLANS.find((p) => p.id === planId)?.name ?? planId;

// PLANS is ordered lowest-to-highest tier (free, basic, pro, platinum) --
// used to detect a gift certificate that would downgrade whatever the
// user already has, so they can be warned before it silently happens.
const planTier = (planId: string) => PLANS.findIndex((p) => p.id === planId);

// Gift certificates grant a plan for a fixed window, not an ongoing
// subscription -- computes the local expiration AppContext's selectPlan
// checks on every future launch (see its own comment).
function computeExpiresAt(durationMonths: number): string {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + durationMonths);
  return expires.toISOString();
}

// Gift certificate system (spec sections 2 & 7): buy a real plan, gift
// it to someone who can't afford it. Both buy and gift purchase a real
// gift certificate via RevenueCat (see services/purchases.ts) before
// touching local state -- REVENUECAT_GIFT_CERTIFICATE_IDS still needs
// real product ids from App Store Connect / Play Console before this
// can charge anyone.
export default function TokenGiftScreen() {
  const { t } = useI18n();
  const { plan, selectPlan } = useApp();
  const [redeemInput, setRedeemInput] = useState('');
  const [lastGiftCode, setLastGiftCode] = useState<string | null>(null);
  const [purchasingCertId, setPurchasingCertId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleBuyForSelf = async (
    certId: string,
    planId: typeof PLANS[number]['id'],
    durationMonths: number
  ) => {
    // A gift certificate is Basic-only -- if the account already has a
    // higher tier (Pro/Platinum, a real ongoing subscription), applying
    // this certificate would downgrade it. Warn and require explicit
    // confirmation rather than silently overwriting a paid-for plan.
    if (planTier(planId) < planTier(plan)) {
      const months = `${durationMonths} month${durationMonths === 1 ? '' : 's'}`;
      Alert.alert(
        t.tokenGift.downgradeWarningTitle,
        interpolate(t.tokenGift.downgradeWarningMessageCertificate, {
          planName: planName(plan),
          newPlanName: planName(planId),
          months,
        }),
        [
          { text: t.tokenGift.cancelButton, style: 'cancel' },
          { text: t.tokenGift.continueAnywayButton, style: 'destructive', onPress: () => buyForSelf(certId, planId, durationMonths) },
        ]
      );
      return;
    }
    await buyForSelf(certId, planId, durationMonths);
  };

  const buyForSelf = async (certId: string, planId: typeof PLANS[number]['id'], durationMonths: number) => {
    setPurchasingCertId(certId);
    const result = await purchaseGiftCertificate(certId);
    setPurchasingCertId(null);

    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert(t.tokenGift.purchaseFailedTitle, result.error ?? t.tokenGift.purchaseFailedFallback);
      return;
    }
    selectPlan(planId, computeExpiresAt(durationMonths));
    Alert.alert(t.tokenGift.purchaseCompleteTitle, interpolate(t.tokenGift.planActiveMessage, { planName: planName(planId) }));
  };

  const handleGift = async (certId: string, planId: string, durationMonths: number) => {
    setPurchasingCertId(certId);
    const result = await purchaseGiftCertificate(certId);
    setPurchasingCertId(null);

    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert(t.tokenGift.purchaseFailedTitle, result.error ?? t.tokenGift.purchaseFailedFallback);
      return;
    }
    const code = generateGiftCodeLocally();
    setLastGiftCode(code);
    const months = `${durationMonths} month${durationMonths === 1 ? '' : 's'}`;
    Alert.alert(
      t.tokenGift.giftCodeCreatedTitle,
      interpolate(t.tokenGift.giftCodeCreatedMessage, { code, months, planName: planName(planId) })
    );
  };

  const handleRedeem = async () => {
    if (isFounderCode(redeemInput)) {
      selectPlan('platinum');
      Alert.alert(t.tokenGift.founderWelcomeTitle, t.tokenGift.platinumUnlockedMessage);
      setRedeemInput('');
      return;
    }

    if (isFamilyCode(redeemInput)) {
      selectPlan('platinum');
      Alert.alert(t.tokenGift.familyWelcomeTitle, t.tokenGift.platinumUnlockedMessage);
      setRedeemInput('');
      return;
    }

    const result = await redeemGiftCode(redeemInput.trim());
    if (result.success && result.planId) {
      const planId = result.planId;
      const durationMonths = result.durationMonths ?? 1;
      const applyRedemption = () => {
        selectPlan(planId, computeExpiresAt(durationMonths));
        Alert.alert(t.tokenGift.redeemedTitle, interpolate(t.tokenGift.planActiveMessage, { planName: planName(planId) }));
        setRedeemInput('');
      };
      if (planTier(planId) < planTier(plan)) {
        const months = `${durationMonths} month${durationMonths === 1 ? '' : 's'}`;
        Alert.alert(
          t.tokenGift.downgradeWarningTitle,
          interpolate(t.tokenGift.downgradeWarningMessageRedeem, {
            planName: planName(plan),
            newPlanName: planName(planId),
            months,
          }),
          [
            { text: t.tokenGift.cancelButton, style: 'cancel' },
            { text: t.tokenGift.continueAnywayButton, style: 'destructive', onPress: applyRedemption },
          ]
        );
      } else {
        applyRedemption();
      }
    } else {
      Alert.alert(t.tokenGift.redeemFailedTitle, result.error ?? t.tokenGift.redeemFailedFallback);
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setContentHeight(height)}
      onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>{t.tokenGift.title}</Text>
      <Text style={styles.balance}>{interpolate(t.tokenGift.currentPlan, { planName: planName(plan) })}</Text>
      <Text style={styles.explainer}>{MONETIZATION_EXPLAINER.tokens}</Text>
      <Text style={styles.explainer}>{MONETIZATION_EXPLAINER.gifting}</Text>

      <Text style={styles.sectionTitle}>{t.tokenGift.sectionBuyForSelf}</Text>
      {GIFT_CERTIFICATES.map((cert) => (
        <View key={cert.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{cert.description}</Text>
            <Text style={styles.rowSub}>{t.tokenGift.rowSubNoAutoRenewal}</Text>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => handleBuyForSelf(cert.id, cert.planId, cert.durationMonths)}
            disabled={purchasingCertId !== null}
          >
            <Text style={styles.buyBtnText}>
              {purchasingCertId === cert.id ? t.tokenGift.purchasing : cert.priceLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>{t.tokenGift.sectionGiftToSomeoneElse}</Text>
      <Text style={styles.helpText}>{t.tokenGift.giftHelpText}</Text>
      {GIFT_CERTIFICATES.map((cert) => (
        <View key={`gift-${cert.id}`} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{interpolate(t.tokenGift.giftRowTitlePrefix, { description: cert.description })}</Text>
            <Text style={styles.rowSub}>{cert.priceLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.giftBtn}
            onPress={() => handleGift(cert.id, cert.planId, cert.durationMonths)}
            disabled={purchasingCertId !== null}
          >
            <Ionicons name="gift-outline" size={16} color={Colors.white} />
            <Text style={styles.giftBtnText}>
              {purchasingCertId === cert.id ? t.tokenGift.purchasing : t.tokenGift.giftButtonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {lastGiftCode && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>{t.tokenGift.lastGiftCodeLabel}</Text>
          <Text style={styles.codeValue}>{lastGiftCode}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t.tokenGift.sectionRedeemCode}</Text>
      <View style={styles.redeemRow}>
        <TextInput
          style={styles.redeemInput}
          placeholder={t.tokenGift.redeemPlaceholder}
          autoCapitalize="characters"
          value={redeemInput}
          onChangeText={setRedeemInput}
        />
        <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
          <Text style={styles.redeemBtnText}>{t.tokenGift.redeemButton}</Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.royal },
  balance: { fontSize: 13, color: '#718096', marginTop: 4, marginBottom: 8 },
  explainer: { fontSize: 12.5, color: '#718096', lineHeight: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.royal, marginTop: 16, marginBottom: 8 },
  helpText: { fontSize: 12.5, color: '#718096', marginBottom: 10, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.ink },
  rowSub: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  buyBtn: { backgroundColor: Colors.royal, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 16 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  giftBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: Colors.gold, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
  giftBtnText: { color: Colors.goldDark, fontWeight: '700', fontSize: 13 },
  codeBox: { backgroundColor: '#FFF3C4', borderRadius: 10, padding: 14, marginTop: 4, marginBottom: 4 },
  codeLabel: { fontSize: 11, color: '#7A5C00', fontWeight: '600' },
  codeValue: { fontSize: 16, fontWeight: '800', color: Colors.goldDark, marginTop: 4, letterSpacing: 1 },
  redeemRow: { flexDirection: 'row', gap: 10 },
  redeemInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#E2E8F0' },
  redeemBtn: { backgroundColor: Colors.royal, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
});
