import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '../types';
import Colors from '../theme/colors';
import JesusAvatar from './JesusAvatar';
import { INTERNATIONAL_DIRECTORY_URL } from '../constants/crisisResources';

interface Props {
  message: ChatMessage;
  onLongPressReport?: (message: ChatMessage) => void;
  onFavorite?: (message: ChatMessage) => void;
  // Defaults true. ChatScreen's compact history list passes false since
  // it already shows one large central JesusAvatar above -- a second,
  // small one per bubble would be redundant with that "one talking
  // Jesus" framing.
  showAvatar?: boolean;
}

export default function ChatBubble({ message, onLongPressReport, onFavorite, showAvatar = true }: Props) {
  const isJesus = message.author === 'jesus';
  // Crisis replies mention the IASP international directory by URL --
  // surface it as a real, easy-to-tap button rather than plain text a
  // screen reader/user has to manually retype. See crisisResources.ts.
  const hasCrisisLink = isJesus && message.text.includes(INTERNATIONAL_DIRECTORY_URL);

  return (
    <View style={[styles.row, isJesus ? styles.rowLeft : styles.rowRight]}>
      {isJesus && showAvatar && <JesusAvatar mood={message.mood ?? 'neutral'} size={36} />}
      <View style={{ maxWidth: '78%' }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => onLongPressReport?.(message)}
          style={[styles.bubble, isJesus ? styles.jesusBubble : styles.userBubble]}
        >
          <Text style={[styles.text, isJesus ? styles.jesusText : styles.userText]}>{message.text}</Text>
          {isJesus && onFavorite && (
            <TouchableOpacity style={styles.favoriteBtn} onPress={() => onFavorite(message)} accessibilityRole="button" accessibilityLabel="Save to favorites">
              <Ionicons name="bookmark-outline" size={14} color={Colors.gold} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {hasCrisisLink && (
          <TouchableOpacity
            style={styles.crisisLinkBtn}
            onPress={() => Linking.openURL(INTERNATIONAL_DIRECTORY_URL)}
            accessibilityRole="link"
            accessibilityLabel="Open international crisis help directory"
          >
            <Ionicons name="open-outline" size={14} color={Colors.white} />
            <Text style={styles.crisisLinkText}>Find crisis help near you</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, gap: 8 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  jesusBubble: { backgroundColor: Colors.ivory, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: Colors.royal, borderTopRightRadius: 4 },
  text: { fontSize: 13.5, lineHeight: 17 },
  jesusText: { color: Colors.ink },
  userText: { color: Colors.white },
  favoriteBtn: { marginTop: 6, alignSelf: 'flex-end' },
  crisisLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  crisisLinkText: { color: Colors.white, fontWeight: '700', fontSize: 12.5 },
});
