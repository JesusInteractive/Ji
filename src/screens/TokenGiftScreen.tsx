import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { TOKEN_PACKS, MONETIZATION_EXPLAINER } from '../constants/pricing';
import { useApp } from '../context/AppContext';
import { generateGiftCodeLocally, redeemGiftCode } from '../services/tokenGifting';
import { isFounderCode, isFamilyCode } from '../services/founderAccess';
import { purchaseTokenPack } from '../services/purchases';
import DraggableScrollbar from '../components/DraggableScrollbar';

// Token / gift code system (spec sections 2 & 7): buy access, gift it to
// someone who can't afford it. Both buy and gift purchase a real token
// pack via RevenueCat (see services/purchases.ts) before touching local
// state -- REVENUECAT_TOKEN_PACK_IDS still needs real product ids from
// App Store Connect / Play Console before this can charge anyone.
export default function TokenGiftScreen() {
  const { addTokens, tokenBalance, selectPlan } = useApp();
  const [redeemInput, setRedeemInput] = useState('');
  const [lastGiftCode, setLastGiftCode] = useState<string | null>(null);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleBuy = async (packId: string, tokens: number) => {
    setPurchasingPackId(packId);
    const result = await purchaseTokenPack(packId);
    setPurchasingPackId(null);

    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert('Couldn\'t complete purchase', result.error ?? 'Please try again.');
      return;
    }
    addTokens(tokens);
    Alert.alert('Purchase complete', `${tokens} tokens added to your balance.`);
  };

  const handleGift = async (packId: string, tokens: number) => {
    setPurchasingPackId(packId);
    const result = await purchaseTokenPack(packId);
    setPurchasingPackId(null);

    if (result.userCancelled) return;
    if (!result.success) {
      Alert.alert('Couldn\'t complete purchase', result.error ?? 'Please try again.');
      return;
    }
    const code = generateGiftCodeLocally();
    setLastGiftCode(code);
    Alert.alert(
      'Gift code created',
      `Share this code with someone who needs it:\n\n${code}\n\nWorth ${tokens} questions.`
    );
  };

  const handleRedeem = async () => {
    if (isFounderCode(redeemInput)) {
      selectPlan('platinum');
      Alert.alert('Welcome, founder', 'Platinum access unlocked -- no charge, no expiration.');
      setRedeemInput('');
      return;
    }

    if (isFamilyCode(redeemInput)) {
      selectPlan('platinum');
      Alert.alert('Welcome to the family', 'Platinum access unlocked -- no charge, no expiration.');
      setRedeemInput('');
      return;
    }

    const result = await redeemGiftCode(redeemInput.trim());
    if (result.success && result.tokensAdded) {
      addTokens(result.tokensAdded);
      Alert.alert('Redeemed!', `${result.tokensAdded} tokens added to your balance.`);
      setRedeemInput('');
    } else {
      Alert.alert('Couldn\'t redeem', result.error ?? 'Please check the code and try again.');
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
      <Text style={styles.title}>Buy & Gift</Text>
      <Text style={styles.balance}>Your balance: {tokenBalance} tokens</Text>
      <Text style={styles.explainer}>{MONETIZATION_EXPLAINER.tokens}</Text>
      <Text style={styles.explainer}>{MONETIZATION_EXPLAINER.gifting}</Text>

      <Text style={styles.sectionTitle}>Buy for yourself</Text>
      {TOKEN_PACKS.map((pack) => (
        <View key={pack.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{pack.tokens} questions</Text>
            <Text style={styles.rowSub}>{pack.description}</Text>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => handleBuy(pack.id, pack.tokens)}
            disabled={purchasingPackId !== null}
          >
            <Text style={styles.buyBtnText}>
              {purchasingPackId === pack.id ? 'Purchasing...' : pack.priceLabel}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Gift to someone else</Text>
      <Text style={styles.helpText}>
        Buy a pack and generate a redeemable code for someone who can't afford a plan.
      </Text>
      {TOKEN_PACKS.map((pack) => (
        <View key={`gift-${pack.id}`} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Gift {pack.tokens} questions</Text>
            <Text style={styles.rowSub}>{pack.priceLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.giftBtn}
            onPress={() => handleGift(pack.id, pack.tokens)}
            disabled={purchasingPackId !== null}
          >
            <Ionicons name="gift-outline" size={16} color={Colors.white} />
            <Text style={styles.giftBtnText}>
              {purchasingPackId === pack.id ? 'Purchasing...' : 'Gift'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {lastGiftCode && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Last gift code created</Text>
          <Text style={styles.codeValue}>{lastGiftCode}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Redeem a code</Text>
      <View style={styles.redeemRow}>
        <TextInput
          style={styles.redeemInput}
          placeholder="XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          value={redeemInput}
          onChangeText={setRedeemInput}
        />
        <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
          <Text style={styles.redeemBtnText}>Redeem</Text>
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
