import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import Colors from '../theme/colors';
import { reportTechIssue } from '../services/api';
import { withAuthRetry } from '../services/backendAuth';
import { useI18n } from '../i18n';

// Settings > "Report a technical issue" -- see backend/server.js's
// POST /v1/support/report for where these actually go today (Vercel's
// function logs, not email/Slack yet -- see that route's own comment).
function buildDeviceInfo(): string {
  const parts = [
    `${Platform.OS} ${Platform.Version}`,
    Device.modelName ?? 'unknown device',
    `app ${Constants.expoConfig?.version ?? 'unknown'}`,
  ];
  return parts.join(' · ');
}

export default function ReportIssueScreen() {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await withAuthRetry((token) => reportTechIssue(token, trimmed, buildDeviceInfo()));
      setMessage('');
      Alert.alert(t.reportIssue.successAlertTitle, t.reportIssue.successAlertMessage);
    } catch (e) {
      Alert.alert(
        t.reportIssue.errorAlertTitle,
        e instanceof Error ? e.message : t.reportIssue.errorAlertFallback
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.reportIssue.title}</Text>
      <Text style={styles.helpText}>{t.reportIssue.helpText}</Text>

      <TextInput
        style={styles.input}
        placeholder={t.reportIssue.inputPlaceholder}
        placeholderTextColor="#A0AEC0"
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.submitBtn, (!message.trim() || submitting) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!message.trim() || submitting}
      >
        {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>{t.reportIssue.submitButton}</Text>}
      </TouchableOpacity>

      <View style={styles.deviceInfoBox}>
        <Text style={styles.deviceInfoLabel}>{t.reportIssue.deviceInfoLabel}</Text>
        <Text style={styles.deviceInfoText}>{buildDeviceInfo()}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.royal, marginBottom: 8 },
  helpText: { fontSize: 13.5, lineHeight: 20, color: '#718096', marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.ink,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.royal,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  deviceInfoBox: { marginTop: 24 },
  deviceInfoLabel: { fontSize: 11.5, fontWeight: '700', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  deviceInfoText: { fontSize: 12, color: '#718096' },
});
