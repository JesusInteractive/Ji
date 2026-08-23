import React, { useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useApp, TEXT_ZOOM_LEVELS } from '../context/AppContext';
import { useI18n } from '../i18n';
import { PLANS } from '../constants/pricing';
import { LANGUAGES } from '../i18n/languages';
import { PRIVACY_POLICY, USER_AGREEMENT, AI_DISCLOSURE } from '../constants/legal';
import { setAnalyticsOptIn } from '../services/analytics';
import { wipeLocalSecrets } from '../services/security';
import { presentCustomerCenter } from '../services/purchases';
import { exportLocalDataAsFile } from '../services/dataExport';
import { deleteAccountAndAllData } from '../services/api';
import { getAuthToken } from '../services/backendAuth';
import { scheduleLocalDailyVerseReminder, cancelLocalDailyVerseReminder } from '../services/notifications';
import LanguagePicker from '../components/LanguagePicker';
import DraggableScrollbar from '../components/DraggableScrollbar';
import type { LanguageCode } from '../types';
import type { SettingsStackParamList } from '../navigation/SettingsStack';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsScreen({ navigation }: Props) {
  const { t, language, setLanguage } = useI18n();
  const {
    plan,
    remainingQuestionsToday,
    tokenBalance,
    ageAppropriateMode,
    setAgeAppropriateMode,
    offlineMode,
    setOfflineMode,
    wipeAllLocalData,
    clearMessages,
    textZoom,
    setTextZoom,
  } = useApp();

  const [notifications, setNotifications] = useState(true);
  const [dailyVerseReminder, setDailyVerseReminder] = useState(true);
  const [analyticsOptIn, setLocalAnalyticsOptIn] = useState(true);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [textSizePickerOpen, setTextSizePickerOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // The Language row previously just showed an Alert telling *us* to wire
  // a picker here -- LanguagePicker already exists (built for onboarding's
  // LanguageSelectScreen) and setLanguage already persists + re-renders
  // the whole app's copy, so this reuses both rather than duplicating.
  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setLanguagePickerOpen(false);
  };

  // Flipping this switch was previously decorative -- it toggled local
  // state but never actually scheduled or cancelled anything (the
  // notifications.ts plumbing existed, nothing called it). Wire it to the
  // real local (on-device) scheduler; if permission is denied, revert the
  // switch rather than showing "on" for a reminder that will never fire.
  const handleDailyVerseReminderChange = async (value: boolean) => {
    setDailyVerseReminder(value);
    if (value) {
      const granted = await scheduleLocalDailyVerseReminder();
      if (!granted) {
        setDailyVerseReminder(false);
        Alert.alert(
          'Notifications disabled',
          'Enable notifications for Jesus Interactive in your device Settings to get a daily verse reminder.'
        );
      }
    } else {
      await cancelLocalDailyVerseReminder();
    }
  };

  const currentPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const currentLanguage = LANGUAGES.find((l) => l.code === language);

  const handleAnalyticsToggle = (value: boolean) => {
    setLocalAnalyticsOptIn(value);
    setAnalyticsOptIn(value);
  };

  const handleDownloadData = async () => {
    try {
      await exportLocalDataAsFile();
    } catch (e) {
      Alert.alert('Couldn\'t export your data', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleClearChatHistory = () => {
    Alert.alert(
      'Clear chat history',
      'This deletes every message in your conversation with Jesus, on this device. Your plan, tokens, journal, favorites, and prayer notes are not affected. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear history',
          style: 'destructive',
          onPress: () => {
            clearMessages();
            Alert.alert('Cleared', 'Your chat history has been cleared.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete my account and all data',
      'This permanently deletes your account, conversations, journal, favorites, prayer notes, plan, and token balance, and returns you to onboarding. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            // Server-side delete first -- see backend/server.js's
            // DELETE /v1/account for why this is currently a no-op (no
            // database yet, nothing server-side to remove). Its failure
            // shouldn't block the on-device wipe below, which is the
            // part that actually does something today; still surfaced
            // to the user afterward so a real future failure isn't
            // silent.
            let serverDeleteFailed = false;
            try {
              const token = await getAuthToken();
              await deleteAccountAndAllData(token);
            } catch (e) {
              serverDeleteFailed = true;
              console.error('Server-side account delete failed:', e);
            }
            await wipeLocalSecrets();
            await wipeAllLocalData();
            Alert.alert(
              'Deleted',
              serverDeleteFailed
                ? 'All local data has been cleared. We couldn\'t reach the server to confirm the server-side delete -- try again later if you\'re on a spotty connection.'
                : 'All local data has been cleared.'
            );
          },
        },
      ]
    );
  };

  const handleOfflineInfo = () => {
    Alert.alert(
      'What works offline',
      'Works without internet: saved chat history, journal entries, favorites/bookmarks, prayer notes you\'ve placed, and cached Bible chapters you\'ve already opened (cached 30 days).\n\n' +
        'Needs internet: sending a new question to Jesus (once your backend is live), loading Bible books/chapters you haven\'t opened before, syncing across devices, purchases and gift codes, and push notifications.'
    );
  };

  // Opens RevenueCat's prebuilt Customer Center (cancel, change plan,
  // refund request, support) once this is running in a real build --
  // presentCustomerCenter() itself no-ops in Expo Go (see
  // services/purchases.ts), so this falls back to explaining that
  // rather than doing nothing silently.
  const handleManagePlan = async () => {
    const presented = await presentCustomerCenter();
    if (!presented) {
      Alert.alert(
        'Manage plan',
        'Full subscription management (cancel, change plan, refunds) requires a real build, not Expo Go -- see services/purchases.ts.'
      );
    }
  };

  const Row = ({
    icon,
    label,
    value,
    onPress,
    switchValue,
    onSwitchChange,
    destructive,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    switchValue?: boolean;
    onSwitchChange?: (v: boolean) => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && onSwitchChange === undefined}
      accessibilityRole={onSwitchChange ? undefined : 'button'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={21} color={destructive ? Colors.danger : Colors.royalBright} />
        <Text style={[styles.rowLabel, destructive && { color: Colors.danger }]}>{label}</Text>
      </View>
      {onSwitchChange ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          accessibilityLabel={label}
          accessibilityRole="switch"
        />
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
    <View style={{ flex: 1 }}>
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setContentHeight(height)}
      onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.account}</Text>
        <Row icon="card-outline" label={t.settings.plan} value={`${currentPlan.name} · ${currentPlan.priceLabel}`} onPress={handleManagePlan} />
        <Row
          icon="chatbox-ellipses-outline"
          label="Questions left today"
          value={remainingQuestionsToday === Infinity ? 'Unlimited' : String(Math.max(remainingQuestionsToday, 0))}
        />
        <Row icon="ticket-outline" label={t.settings.tokens} value={String(tokenBalance)} onPress={() => navigation.navigate('TokenGift')} />
        <Row icon="gift-outline" label={t.settings.giftTokens} onPress={() => navigation.navigate('TokenGift')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.preferences}</Text>
        <Row icon="notifications-outline" label={t.settings.notifications} switchValue={notifications} onSwitchChange={setNotifications} />
        <Row icon="sunny-outline" label={t.settings.dailyVerse} switchValue={dailyVerseReminder} onSwitchChange={handleDailyVerseReminderChange} />
        <Row icon="shield-half-outline" label={t.settings.ageAppropriate} switchValue={ageAppropriateMode} onSwitchChange={setAgeAppropriateMode} />
        <Row icon="cloud-offline-outline" label={t.settings.offlineMode} switchValue={offlineMode} onSwitchChange={setOfflineMode} />
        <Row icon="help-circle-outline" label="What works offline?" onPress={handleOfflineInfo} />
        <Row
          icon="text-outline"
          label="Larger text"
          value={textZoom > 1 ? `${Math.round(textZoom * 100)}%` : 'Off'}
          onPress={() => setTextSizePickerOpen(true)}
        />
        <Row icon="language-outline" label={t.settings.language} value={currentLanguage?.nativeLabel} onPress={() => setLanguagePickerOpen(true)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.privacyData}</Text>
        <Row icon="analytics-outline" label="Anonymous analytics" switchValue={analyticsOptIn} onSwitchChange={handleAnalyticsToggle} />
        <Row icon="download-outline" label={t.settings.downloadData} onPress={handleDownloadData} />
        <Row icon="chatbubbles-outline" label="Clear chat history" onPress={handleClearChatHistory} destructive />
        <Row icon="trash-outline" label={t.settings.deleteAccount} onPress={handleDeleteAccount} destructive />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.support}</Text>
        <Row icon="library-outline" label={t.settings.reportContent} onPress={() => Alert.alert('Report', 'Long-press any message in Chat to report it, or contact us here.')} />
        <Row icon="mail-outline" label={t.settings.contactSupport} onPress={() => Alert.alert('Contact support', 'support@jesusinteractive.com')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.about}</Text>
        <Row icon="information-circle-outline" label={t.settings.version} value="2.0.0" />
        <Row icon="shield-checkmark-outline" label={t.settings.privacyPolicy} onPress={() => navigation.navigate('LegalDoc', PRIVACY_POLICY)} />
        <Row icon="document-text-outline" label={t.settings.terms} onPress={() => navigation.navigate('LegalDoc', USER_AGREEMENT)} />
        <Row icon="alert-circle-outline" label={t.settings.disclosureLink} onPress={() => navigation.navigate('LegalDoc', AI_DISCLOSURE)} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Jesus Interactive</Text>
        <Text style={styles.footerSub}>© 2026 Jesus Interactive</Text>
        {/* Shofar sound (Prayer Wall) is CC BY 4.0 -- this credit line is
            the license's attribution requirement, not decorative. Keep it
            if that asset stays in use. */}
        <Text style={styles.footerSub}>Shofar sound via OrangeFreeSounds.com (CC BY 4.0)</Text>
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

    <Modal
      visible={languagePickerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setLanguagePickerOpen(false)}
    >
      <TouchableOpacity
        style={styles.languageModalOverlay}
        activeOpacity={1}
        onPress={() => setLanguagePickerOpen(false)}
      >
        <View style={styles.languageModalSheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.languageModalTitle}>{t.settings.language}</Text>
          <LanguagePicker selected={language} onSelect={handleSelectLanguage} />
        </View>
      </TouchableOpacity>
    </Modal>

    <Modal
      visible={textSizePickerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setTextSizePickerOpen(false)}
    >
      <TouchableOpacity
        style={styles.languageModalOverlay}
        activeOpacity={1}
        onPress={() => setTextSizePickerOpen(false)}
      >
        <View style={styles.languageModalSheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.languageModalTitle}>Larger text</Text>
          <Text style={styles.textSizeSubtitle}>
            Applies to Ask Jesus, Scripture, and Study Tools -- the same zoom as the magnifying-glass button
            on those screens.
          </Text>
          {TEXT_ZOOM_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.textSizeRow, textZoom === level && styles.textSizeRowSelected]}
              onPress={() => {
                setTextZoom(level);
                setTextSizePickerOpen(false);
              }}
            >
              <Text style={[styles.textSizeRowLabel, { fontSize: 15 * level }]}>Aa</Text>
              <Text style={styles.textSizeRowValue}>{level === 1 ? 'Default' : `${Math.round(level * 100)}%`}</Text>
              {textZoom === level && <Ionicons name="checkmark-circle" size={22} color={Colors.gold} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  section: { backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, borderRadius: 12, paddingVertical: 6 },
  sectionTitle: {
    fontSize: 12.5, fontWeight: '700', color: '#718096', textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EDF2F7',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 12 },
  rowLabel: { fontSize: 14.5, color: '#2D3748', flexShrink: 1 },
  rowValue: { fontSize: 12.5, color: '#718096' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 16, fontWeight: '700', color: Colors.royal },
  footerSub: { fontSize: 12.5, color: '#A0AEC0', marginTop: 4 },
  languageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  languageModalSheet: {
    // Fixed px, not a %, since LanguagePicker's FlatList doesn't take a
    // height/style prop -- 8 languages comfortably fit without needing
    // the list to scroll inside a percentage-height container.
    backgroundColor: Colors.royal, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingTop: 16, paddingBottom: 32, maxHeight: 500,
  },
  languageModalTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.ivory, marginBottom: 10, paddingHorizontal: 20,
  },
  textSizeSubtitle: {
    fontSize: 12.5, color: Colors.muted, marginBottom: 14, paddingHorizontal: 20, lineHeight: 18,
  },
  textSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textSizeRowSelected: { borderColor: Colors.gold },
  textSizeRowLabel: { fontWeight: '700', color: Colors.ivory, width: 40 },
  textSizeRowValue: { flex: 1, fontSize: 14, color: Colors.ivory },
});
