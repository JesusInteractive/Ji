import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { generateSermon, exportSermonAsFile, type SermonLength } from '../services/sermonWriter';
import { presentProPaywall } from '../services/purchases';
import DraggableScrollbar from '../components/DraggableScrollbar';
import AiGeneratedLabel from '../components/AiGeneratedLabel';
import { useI18n } from '../i18n';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import PaywallLockScreen from '../components/PaywallLockScreen';
import type { RootStackParamList } from '../navigation/RootNavigator';

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
  // Two levels up: StudyToolsStack -> MainTabs' StudyTools tab ->
  // RootNavigator -- same double-getParent chain SettingsScreen.tsx and
  // StudyLibraryReaderScreen.tsx already use to reach a root-level
  // modal from a screen nested this deep.
  const navigation = useNavigation();
  const { hasAccess } = useFeatureAccess();
  const hasProAccess = plan === 'pro' || plan === 'platinum';
  const canUseExtended = plan === 'platinum';

  const [topic, setTopic] = useState('');
  const [passageReference, setPassageReference] = useState('');
  const [occasion, setOccasion] = useState('');
  const [length, setLength] = useState<SermonLength>('standard');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

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

  const handleDownload = async () => {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      await exportSermonAsFile(result, topic);
    } catch (e) {
      Alert.alert(
        t.sermonWriter.downloadErrorTitle,
        e instanceof Error ? e.message : t.sermonWriter.downloadErrorFallback
      );
    } finally {
      setDownloading(false);
    }
  };

  // Two-layer gate: the broad 5-day-trial/subscription check first
  // (same as every other feature), THEN the existing Pro/Platinum-tier
  // upsell below for trial/Basic users who reach the screen but haven't
  // paid for Pro specifically. Nested StudyToolsStack -> MainTabs ->
  // RootStack -- two getParent() hops, same as this file's own comment
  // on handleUpgrade's paywall.
  if (!hasAccess) {
    return (
      <PaywallLockScreen
        featureName="Sermon & Bible Study Writer"
        onSubscribe={() => navigation.getParent()?.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Pricing')}
      />
    );
  }

  if (!hasProAccess) {
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
      <ImageBackground source={require('../../assets/textures/parchment-navy.jpg')} style={styles.container} resizeMode="cover">
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        scrollEnabled={!scrollbarDragging}
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
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.translateBtn}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.getParent<NativeStackNavigationProp<RootStackParamList>>()
                    ?.navigate('GospelTranslator', {
                      initialText: result,
                      initialLabel: `Sermon: ${topic.trim() || 'Untitled'}`,
                    })
                }
                accessibilityRole="button"
                accessibilityLabel="Read this sermon in Gospel Translator"
              >
                <Ionicons name="language-outline" size={15} color={Colors.gold} />
                <Text style={styles.translateBtnText}>Translate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
                onPress={handleDownload}
                disabled={downloading}
                accessibilityRole="button"
                accessibilityLabel={t.sermonWriter.downloadButton}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={Colors.royal} />
                ) : (
                  <Ionicons name="download-outline" size={16} color={Colors.royal} />
                )}
                <Text style={styles.downloadBtnText}>
                  {downloading ? t.sermonWriter.downloadingButton : t.sermonWriter.downloadButton}
                </Text>
              </TouchableOpacity>
            </View>
            <AiGeneratedLabel text="AI-generated draft. Review it against Scripture before you preach it." style={{ marginBottom: 10 }} />
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
        onDragStart={() => setScrollbarDragging(true)}
        onDragEnd={() => setScrollbarDragging(false)}
      />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // Royal, not the old light-gray '#F4F6FA' -- this is the fallback
  // paint behind the navy parchment image (before it loads, or if it
  // fails), so it should match the image's own tone, not the previous
  // light-parchment background this screen used before.
  container: { flex: 1, backgroundColor: Colors.royal },
  content: { padding: 20, paddingBottom: 40 },
  // Both colors below were tuned for the old light/tan parchment
  // background -- Colors.royal text (label) would be invisible and
  // '#718096' gray (helpText) would read poorly against the navy
  // parchment background now used here. Colors.gold/Colors.muted are
  // this app's own established navy-background text colors (see
  // HomeScreen.tsx/ResourcesScreen.tsx's own card text for the same
  // pairing) -- the white input/result cards below keep their own
  // dark-on-white text untouched, since those aren't sitting directly on
  // the navy background.
  helpText: { fontSize: 13.5, lineHeight: 20, color: Colors.muted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.gold, marginBottom: 6, marginTop: 4 },
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
  resultActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 14 },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.royal,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  translateBtnText: { fontSize: 12.5, fontWeight: '700', color: Colors.gold },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F6FA',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  downloadBtnDisabled: { opacity: 0.6 },
  downloadBtnText: { fontSize: 12.5, fontWeight: '700', color: Colors.royal },
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
