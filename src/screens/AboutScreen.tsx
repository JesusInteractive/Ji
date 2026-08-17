import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { BIOGRAPHY_PARAGRAPHS, ABOUT_INTRO } from '../constants/about';
import { MATTHEW_LINEAGE, LINEAGE_NOTE, LUKE_LINEAGE_NOTE } from '../constants/lineage';
import { PROPHECIES, PROPHECY_CATEGORIES, prophecyCountLabel } from '../constants/prophecies';
import { useI18n } from '../i18n';

// Biography + Lineage + Prophecies are presented as one unified story of
// who Jesus is (spec: "should feel unified... working together"), not
// three disconnected lists -- each section explicitly hands off to the
// next in its closing line.
export default function AboutScreen() {
  const { t } = useI18n();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{t.about.title}</Text>
      <Text style={styles.intro}>{ABOUT_INTRO}</Text>

      <Text style={styles.sectionTitle}>{t.about.biography}</Text>
      {BIOGRAPHY_PARAGRAPHS.map((p, i) => (
        <Text key={i} style={styles.paragraph}>{p}</Text>
      ))}

      <Text style={styles.sectionTitle}>{t.about.lineage}</Text>
      <Text style={styles.paragraph}>{LINEAGE_NOTE}</Text>
      {MATTHEW_LINEAGE.map((section) => (
        <View key={section.title} style={styles.lineageBlock}>
          <Text style={styles.lineageTitle}>{section.title}</Text>
          {section.note && <Text style={styles.lineageNote}>{section.note}</Text>}
          <Text style={styles.lineageNames}>{section.names.join(' → ')}</Text>
        </View>
      ))}
      <Text style={styles.paragraph}>{LUKE_LINEAGE_NOTE}</Text>
      <Text style={styles.handoff}>
        This royal, prophesied lineage is exactly what the Old Testament said to expect of the Messiah --
        which is where the prophecies below come in.
      </Text>

      <Text style={styles.sectionTitle}>{t.about.prophecies}</Text>
      <Text style={styles.paragraph}>{prophecyCountLabel()}.</Text>

      {PROPHECY_CATEGORIES.map((category) => {
        const items = PROPHECIES.filter((p) => p.category === category);
        if (items.length === 0) return null;
        return (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((p) =>
              p.spotlight ? (
                <View key={p.id} style={styles.spotlightCard}>
                  <View style={styles.spotlightHeader}>
                    <Ionicons name="star" size={14} color={Colors.gold} />
                    <Text style={styles.spotlightTopic}>{p.topic}</Text>
                  </View>
                  <Text style={styles.spotlightReference}>{p.otReference}</Text>
                  <Text style={styles.spotlightQuote}>"{p.otText}"</Text>
                  <Text style={styles.spotlightFulfillment}>
                    Fulfilled: {p.fulfillmentReference} — {p.fulfillmentSummary}
                  </Text>
                  {p.explanation && <Text style={styles.spotlightExplanation}>{p.explanation}</Text>}
                </View>
              ) : (
                <View key={p.id} style={styles.prophecyCard}>
                  <Text style={styles.prophecyTopic}>{p.topic}</Text>
                  <Text style={styles.prophecyOt}>{p.otReference} — "{p.otText}"</Text>
                  <Text style={styles.prophecyFulfillment}>{p.fulfillmentReference}: {p.fulfillmentSummary}</Text>
                </View>
              )
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.royal, marginBottom: 6 },
  intro: { fontSize: 13, color: '#718096', lineHeight: 19, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.gold, marginTop: 10, marginBottom: 10 },
  paragraph: { fontSize: 14, lineHeight: 21, color: Colors.ink, marginBottom: 12 },
  handoff: { fontSize: 13, lineHeight: 20, color: '#718096', fontStyle: 'italic', marginBottom: 4 },
  lineageBlock: { marginBottom: 14, backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  lineageTitle: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  lineageNote: { fontSize: 11.5, color: '#A0AEC0', fontStyle: 'italic', marginBottom: 6 },
  lineageNames: { fontSize: 13, lineHeight: 20, color: Colors.ink },
  categoryBlock: { marginTop: 8, marginBottom: 4 },
  categoryTitle: {
    fontSize: 14, fontWeight: '800', color: Colors.royal, textTransform: 'uppercase',
    letterSpacing: 0.4, marginBottom: 10, marginTop: 6,
  },
  prophecyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  prophecyTopic: { fontSize: 14, fontWeight: '700', color: Colors.royal, marginBottom: 4 },
  prophecyOt: { fontSize: 12.5, color: '#4A5568', fontStyle: 'italic', marginBottom: 4, lineHeight: 18 },
  prophecyFulfillment: { fontSize: 12.5, color: Colors.gold, fontWeight: '600', lineHeight: 18 },
  spotlightCard: {
    backgroundColor: '#FFFBEF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#F0DFA0',
  },
  spotlightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  spotlightTopic: { fontSize: 15.5, fontWeight: '800', color: Colors.royal, flexShrink: 1 },
  spotlightReference: { fontSize: 12, fontWeight: '700', color: Colors.gold, marginBottom: 6 },
  spotlightQuote: { fontSize: 13.5, fontStyle: 'italic', color: '#4A5568', lineHeight: 20, marginBottom: 8 },
  spotlightFulfillment: { fontSize: 13, fontWeight: '600', color: Colors.ink, marginBottom: 8, lineHeight: 19 },
  spotlightExplanation: { fontSize: 12.5, color: '#6B5D2E', lineHeight: 19 },
});
