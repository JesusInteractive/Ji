import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { PLANS } from '../constants/pricing';
import { LANGUAGES } from '../i18n/languages';
import { PRIVACY_POLICY_SUMMARY, TERMS_OF_SERVICE_SUMMARY, AI_DISCLOSURE } from '../constants/legal';
import { setAnalyticsOptIn } from '../services/analytics';
import { wipeLocalSecrets } from '../services/security';
import { presentCustomerCenter } from '../services/purchases';
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
  } = useApp();

  const [notifications, setNotifications] = useState(true);
  const [dailyVerseReminder, setDailyVerseReminder] = useState(true);
  const [analyticsOptIn, setLocalAnalyticsOptIn] = useState(true);

  const currentPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const currentLanguage = LANGUAGES.find((l) => l.code === language);

  const handleAnalyticsToggle = (value: boolean) => {
    setLocalAnalyticsOptIn(value);
    setAnalyticsOptIn(value);
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download my data',
      'In production, this calls services/api.ts requestDataExport() and emails you a secure download link.'
    );
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
            // TODO: also call services/api.ts deleteAccountAndAllData(authToken)
            // in production so server-side copies (billing records aside,
            // per your retention policy) are removed too -- this call only
            // guarantees the on-device half is complete.
            await wipeLocalSecrets();
            await wipeAllLocalData();
            Alert.alert('Deleted', 'All local data has been cleared.');
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
    <ScrollView style={styles.container}>
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
        <Row icon="sunny-outline" label={t.settings.dailyVerse} switchValue={dailyVerseReminder} onSwitchChange={setDailyVerseReminder} />
        <Row icon="shield-half-outline" label={t.settings.ageAppropriate} switchValue={ageAppropriateMode} onSwitchChange={setAgeAppropriateMode} />
        <Row icon="cloud-offline-outline" label={t.settings.offlineMode} switchValue={offlineMode} onSwitchChange={setOfflineMode} />
        <Row icon="help-circle-outline" label="What works offline?" onPress={handleOfflineInfo} />
        <Row icon="text-outline" label="Larger text" value="Follows your phone's Accessibility text size" />
        <Row icon="language-outline" label={t.settings.language} value={currentLanguage?.nativeLabel} onPress={() => Alert.alert('Language', 'Change this from the onboarding language screen, or wire a dedicated picker here.')} />
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
        <Row icon="shield-checkmark-outline" label={t.settings.privacyPolicy} onPress={() => Alert.alert(PRIVACY_POLICY_SUMMARY.title, PRIVACY_POLICY_SUMMARY.points.join('\n\n'))} />
        <Row icon="document-text-outline" label={t.settings.terms} onPress={() => Alert.alert(TERMS_OF_SERVICE_SUMMARY.title, TERMS_OF_SERVICE_SUMMARY.points.join('\n\n'))} />
        <Row icon="alert-circle-outline" label={t.settings.disclosureLink} onPress={() => Alert.alert(AI_DISCLOSURE.title, AI_DISCLOSURE.body.join('\n\n'))} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Jesus Interactive</Text>
        <Text style={styles.footerSub}>© 2026 Jesus & Me, Inc.</Text>
      </View>
    </ScrollView>
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
});
