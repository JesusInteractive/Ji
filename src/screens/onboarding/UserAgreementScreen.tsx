import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';
import { useI18n } from '../../i18n';
import { useApp } from '../../context/AppContext';
import { USER_AGREEMENT } from '../../constants/legal';
import type { OnboardingStackParamList } from '../../navigation/RootNavigator';
import DraggableScrollbar from '../../components/DraggableScrollbar';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'UserAgreement'>;

// Terms of Service + Indemnity, clearly protecting Jesus Interactive
// (spec section 3). Users must sign off before using or purchasing.
export default function UserAgreementScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { acceptAgreement } = useApp();
  const [checked, setChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleContinue = () => {
    if (!checked) {
      setShowError(true);
      return;
    }
    acceptAgreement();
    navigation.replace('Entrance');
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
        >
          <Text style={styles.title}>{USER_AGREEMENT.title}</Text>
          <Text style={styles.body}>{USER_AGREEMENT.intro}</Text>
          {USER_AGREEMENT.sections.map((s) => (
            <View key={s.heading} style={styles.section}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}
          <Text style={styles.body}>{USER_AGREEMENT.closing}</Text>
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => { setChecked((c) => !c); setShowError(false); }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={t.agreement.checkbox}
        >
          <Ionicons
            name={checked ? 'checkbox' : 'square-outline'}
            size={22}
            color={checked ? Colors.gold : Colors.muted}
          />
          <Text style={styles.checkboxLabel}>{t.agreement.checkbox}</Text>
        </TouchableOpacity>
        {showError && <Text style={styles.error}>Please check the box to continue.</Text>}

        <TouchableOpacity style={styles.cta} onPress={handleContinue}>
          <Text style={styles.ctaText}>{t.common.accept}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  scroll: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.royal, marginBottom: 14 },
  section: { marginBottom: 14 },
  heading: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  body: { fontSize: 13.5, lineHeight: 20, color: Colors.ink, marginBottom: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5DCC3', backgroundColor: Colors.ivory },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxLabel: { flex: 1, fontSize: 13.5, color: Colors.ink, lineHeight: 19 },
  error: { color: Colors.danger, fontSize: 12, marginTop: 8 },
  cta: { backgroundColor: Colors.royal, borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  ctaText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
