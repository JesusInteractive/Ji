import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { AI_DISCLOSURE, PRIVACY_POLICY, USER_AGREEMENT } from '../../constants/legal';
import DraggableScrollbar from '../../components/DraggableScrollbar';

// One long scroll holding all three legal documents, each ending in its
// own required checkbox. "Agree and Continue" stays locked until every box
// is checked; pressing it early scrolls to the next unchecked box. This
// replaced the old three-screen Disclaimer -> UserAgreement ->
// PrivacyAgreement flow.
//
// The checkbox labels, like the documents, are plain English rather than
// t.* strings -- a legal agreement shouldn't depend on an unreviewed
// machine translation. The Terms box doubles as the 13+ age confirmation
// and calls out arbitration, since both deserve an explicit yes.
const DOCUMENTS = [
  {
    key: 'disclosure',
    doc: AI_DISCLOSURE,
    label:
      'I have read and agree to the AI Disclosure & User Acknowledgment. I understand the AI is not Jesus Christ, and I accept the release in Section 8.',
  },
  {
    key: 'terms',
    doc: USER_AGREEMENT,
    label:
      'I am at least 13 years old, and I have read and agree to the Terms of Service, including binding arbitration and the class-action waiver in Section 16.',
  },
  {
    key: 'privacy',
    doc: PRIVACY_POLICY,
    label: 'I have read and agree to the Privacy Policy.',
  },
] as const;

type DocumentKey = (typeof DOCUMENTS)[number]['key'];

interface Props {
  // 'update' is the same screen shown to an existing user after one of the
  // documents changed (see RootNavigator's LegalUpdateRoute).
  mode: 'onboarding' | 'update';
  onAccepted?: () => void;
}

export default function AgreementsScreen({ mode, onAccepted }: Props) {
  const { acceptAllAgreements } = useApp();
  const [checked, setChecked] = useState<Partial<Record<DocumentKey, boolean>>>({});
  const [showError, setShowError] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  // Each document's y inside the scroll content, plus its checkbox's y
  // inside that document -- together, where to scroll to show a box.
  const documentY = useRef<Partial<Record<DocumentKey, number>>>({});
  const checkboxY = useRef<Partial<Record<DocumentKey, number>>>({});
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const agreedCount = DOCUMENTS.filter((d) => checked[d.key]).length;
  const allAgreed = agreedCount === DOCUMENTS.length;

  const toggle = (key: DocumentKey) => {
    setChecked((current) => ({ ...current, [key]: !current[key] }));
    setShowError(false);
  };

  const handleContinue = () => {
    if (!allAgreed) {
      setShowError(true);
      const next = DOCUMENTS.find((d) => !checked[d.key]);
      if (next) {
        const y = (documentY.current[next.key] ?? 0) + (checkboxY.current[next.key] ?? 0);
        scrollRef.current?.scrollTo({ y: Math.max(0, y - viewportHeight / 2), animated: true });
      }
      return;
    }
    acceptAllAgreements();
    onAccepted?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
          onContentSizeChange={(_width, height) => setContentHeight(height)}
          onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          scrollEnabled={!scrollbarDragging}
        >
          <Text style={styles.title}>{mode === 'update' ? 'We’ve updated our terms' : 'Before you begin'}</Text>
          <Text style={styles.lede}>
            {mode === 'update'
              ? 'Please review the updated documents below and check the box at the end of each one to keep using Jesus Interactive. Nothing saved on this device is affected.'
              : 'Please read the three documents below: the AI Disclosure, the Terms of Service, and the Privacy Policy. Check the box at the end of each one. You can continue once all three are checked.'}
          </Text>

          {DOCUMENTS.map(({ key, doc, label }, index) => {
            const isChecked = !!checked[key];
            return (
              <View
                key={key}
                style={styles.document}
                onLayout={({ nativeEvent }) => {
                  documentY.current[key] = nativeEvent.layout.y;
                }}
              >
                <Text style={styles.step}>{`Document ${index + 1} of ${DOCUMENTS.length}`}</Text>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.updated}>{`Last updated ${doc.lastUpdated}`}</Text>
                {doc.intro ? <Text style={styles.body}>{doc.intro}</Text> : null}
                {doc.sections.map((s) => (
                  <View key={s.heading} style={styles.section}>
                    <Text style={styles.heading}>{s.heading}</Text>
                    <Text style={styles.body}>{s.body}</Text>
                  </View>
                ))}
                {doc.closing ? <Text style={styles.body}>{doc.closing}</Text> : null}

                <TouchableOpacity
                  style={[styles.checkCard, isChecked && styles.checkCardChecked, showError && !isChecked && styles.checkCardMissing]}
                  onPress={() => toggle(key)}
                  onLayout={({ nativeEvent }) => {
                    checkboxY.current[key] = nativeEvent.layout.y;
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={label}
                >
                  <Ionicons
                    name={isChecked ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isChecked ? Colors.gold : Colors.muted}
                  />
                  <Text style={styles.checkLabel}>{label}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
      </View>

      <View style={styles.footer}>
        <View style={styles.progressRow} accessibilityLabel={`${agreedCount} of ${DOCUMENTS.length} documents agreed`}>
          {DOCUMENTS.map(({ key }) => (
            <View key={key} style={[styles.dot, checked[key] && styles.dotOn]} />
          ))}
          <Text style={styles.progressText}>{`${agreedCount} of ${DOCUMENTS.length} agreed`}</Text>
        </View>
        {showError && (
          <Text style={styles.error}>Please check all three boxes to continue. We’ve scrolled to the next one.</Text>
        )}
        {/* Deliberately NOT accessibilityState={{ disabled }}: RN touchables
            treat that as a real disabled prop and swallow the press, which
            would kill the "jump to the next unchecked box" behavior. The
            locked state is conveyed by the hint and the greyed style. */}
        <TouchableOpacity
          style={[styles.cta, !allAgreed && styles.ctaLocked]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityHint={allAgreed ? undefined : 'Check all three boxes first. Tapping now takes you to the next one.'}
        >
          <Text style={[styles.ctaText, !allAgreed && styles.ctaTextLocked]}>Agree and Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  // Extra bottom room so a jump to the last checkbox still shows it in full
  // after the error line appears and the footer grows.
  scroll: { padding: 20, paddingBottom: 56 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.royal, marginBottom: 8 },
  lede: { fontSize: 14, lineHeight: 21, color: Colors.ink, marginBottom: 8 },
  document: { paddingTop: 22, marginTop: 14, borderTopWidth: 1, borderTopColor: '#E5DCC3' },
  step: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.muted, marginBottom: 4 },
  docTitle: { fontSize: 20, fontWeight: '800', color: Colors.royal, marginBottom: 2 },
  updated: { fontSize: 12, color: '#8A8474', marginBottom: 14 },
  section: { marginBottom: 6 },
  heading: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  body: { fontSize: 13.5, lineHeight: 20, color: Colors.ink, marginBottom: 12 },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D9CFB4',
    backgroundColor: Colors.white,
  },
  checkCardChecked: { borderColor: Colors.gold, backgroundColor: '#FBF5E3' },
  checkCardMissing: { borderColor: Colors.danger },
  checkLabel: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', color: Colors.ink },
  footer: { padding: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5DCC3', backgroundColor: Colors.ivory },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.muted },
  dotOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  progressText: { marginLeft: 6, fontSize: 13, fontWeight: '700', color: Colors.ink },
  error: { color: Colors.danger, fontSize: 12.5, marginTop: 8 },
  cta: { backgroundColor: Colors.royal, borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  ctaLocked: { backgroundColor: '#C9C3B2' },
  ctaText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  ctaTextLocked: { color: '#F4F1EA' },
});
