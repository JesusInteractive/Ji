import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { generateSermon, type SermonLength } from '../services/sermonWriter';
import { presentProPaywall } from '../services/purchases';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { useI18n } from '../i18n';

// Study Tools > Sermon Writer -- a real, on-demand sermon/Bible-study
// generator, not just the "sermon writer for pastors" line in
// constants/pricing.ts's feature list. Gated to Pro/Platinum here (Free/
// Basic see an upsell instead of the form), matching what those plans
// actually promise. "Extended" length is further gated to Platinum only
// ("Advanced sermon writer (longer, more detailed sermons)" in
// pricing.ts) -- Pro gets the standard-length option only.
export default function SermonWriterScreen() {
  const { plan } = useApp();
  const { language, t } = useI18n();
  const hasAccess = plan === 'pro' || plan === 'platinum';
  const canUseExtended = plan === 'platinum';

  const [topic, setTopic] = useState('');
  const [passageReference, setPassageReference] = useState('');
  const [occasion, setOccasion] = useState('');
  const [length, setLength] = useState<SermonLength>('standard');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleUpgrade = async () => {
    setUpgrading(true);
    // The only post-onboarding purchase entry point today -- presents
    // RevenueCat's Platinum paywall (see PricingScreen.tsx's identical
    // use). Basic/Pro have no standalone upgrade flow outside onboarding
    // yet, so Platinum (which also includes this feature) is what's
    // actually offered here.
    const outcome = await presentProPaywall();
    setUpgrading(false);
    if (outcome === 'error') {
      Alert.alert(t.sermonWriter.upgradeErrorTitle, t.sermonWriter.upgradeErrorMessage);
    }
  };

  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    setGenerating(true);
    setResult(null);
    try {
      const content = await generateSermon({
        topic: trimmedTopic,
        passageReference: passageReference.trim() || undefined,
        occasion: occasion.trim() || undefined,
        length,
        languageCode: language,
      });
      setResult(content);
    } catch (e) {
      Alert.alert(
        t.sermonWriter.generateErrorTitle,
        e instanceof Error ? e.message : t.sermonWriter.generateErrorFallback
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!hasAccess) {
    return (
      <View style={styles.upsellContainer}>
        <Ionicons name="create-outline" size={40} color={Colors.gold} />
        <Text style={styles.upsellTitle}>{t.sermonWriter.upsellTitle}</Text>
        <Text style={styles.upsellBody}>
          {t.sermonWriter.upsellBody}
        </Text>
        <TouchableOpacity style={styles.upsellBtn} onPress={handleUpgrade} disabled={upgrading}>
          {upgrading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.upsellBtnText}>{t.sermonWriter.upgradeButton}</Text>}
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.helpText}>
          {t.sermonWriter.helpText}
        </Text>

        <Text style={styles.label}>{t.sermonWriter.topicLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.sermonWriter.topicPlaceholder}
          placeholderTextColor="#A0AEC0"
          value={topic}
          onChangeText={setTopic}
          editable={!generating}
        />

        <Text style={styles.label}>{t.sermonWriter.passageLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.sermonWriter.passagePlaceholder}
          placeholderTextColor="#A0AEC0"
          value={passageReference}
          onChangeText={setPassageReference}
          editable={!generating}
        />

        <Text style={styles.label}>{t.sermonWriter.occasionLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.sermonWriter.occasionPlaceholder}
          placeholderTextColor="#A0AEC0"
          value={occasion}
          onChangeText={setOccasion}
          editable={!generating}
        />

        {canUseExtended && (
          <>
            <Text style={styles.label}>{t.sermonWriter.lengthLabel}</Text>
            <View style={styles.lengthRow}>
              <TouchableOpacity
                style={[styles.lengthOption, length === 'standard' && styles.lengthOptionActive]}
                onPress={() => setLength('standard')}
                disabled={generating}
              >
                <Text style={[styles.lengthOptionText, length === 'standard' && styles.lengthOptionTextActive]}>
                  {t.sermonWriter.lengthStandard}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lengthOption, length === 'extended' && styles.lengthOptionActive]}
                onPress={() => setLength('extended')}
                disabled={generating}
              >
                <Text style={[styles.lengthOptionText, length === 'extended' && styles.lengthOptionTextActive]}>
                  {t.sermonWriter.lengthExtended}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, (!topic.trim() || generating) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!topic.trim() || generating}
        >
          {generating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.generateBtnText}>{result ? t.sermonWriter.regenerateButton : t.sermonWriter.generateButton}</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText} selectable>
              {result}
            </Text>
          </View>
        )}
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
  helpText: { fontSize: 13.5, lineHeight: 20, color: '#718096', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.royal, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  lengthRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  lengthOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lengthOptionActive: { backgroundColor: Colors.royal, borderColor: Colors.royal },
  lengthOptionText: { fontSize: 13, fontWeight: '600', color: '#718096' },
  lengthOptionTextActive: { color: Colors.white },
  generateBtn: {
    backgroundColor: Colors.royal,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  resultBox: {
    marginTop: 22,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultText: { fontSize: 14.5, lineHeight: 22, color: Colors.ink },
  upsellContainer: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  upsellTitle: { fontSize: 19, fontWeight: '800', color: Colors.royal, textAlign: 'center' },
  upsellBody: { fontSize: 14, lineHeight: 21, color: '#718096', textAlign: 'center' },
  upsellBtn: {
    backgroundColor: Colors.royal,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  upsellBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
