import React, { useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { PLANS } from '../constants/pricing';
import type { MainTabParamList } from '../navigation/MainTabs';
import DraggableScrollbar from '../components/DraggableScrollbar';

// Profile is purely local -- see AppContext.tsx's own note on
// displayName/profilePhotoUri. There's no user/session system in this
// app (same caveat as backendAuth.ts's shared-secret auth), so "account
// info" here means what's actually tracked on this device: plan, token
// balance, and saved content counts, not a real server-side account.
export default function ProfileScreen() {
  const {
    displayName,
    setDisplayName,
    profilePhotoUri,
    setProfilePhotoUri,
    plan,
    tokenBalance,
    remainingQuestionsToday,
    favorites,
    journalEntries,
    prayerNotes,
    selectPlan,
  } = useApp();
  const [nameInput, setNameInput] = useState(displayName);
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const currentPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  const handlePickPhoto = async () => {
    // Previously had no try/catch -- any rejection (permission API
    // throwing, the picker module not being available in the current
    // runtime, etc.) failed completely silently, which is exactly what
    // "tapping it does nothing" looks like from the outside.
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access needed', 'Enable photo library access in Settings to upload a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setProfilePhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Photo picker error:', e);
      Alert.alert(
        'Couldn\'t open the photo picker',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('Remove photo', 'Remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setProfilePhotoUri(null) },
    ]);
  };

  const handleNameBlur = () => {
    if (nameInput.trim() !== displayName) setDisplayName(nameInput.trim());
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
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handlePickPhoto} accessibilityRole="button" accessibilityLabel="Upload profile photo">
          {profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={84} color={Colors.muted} />
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>
        {profilePhotoUri && (
          <TouchableOpacity onPress={handleRemovePhoto} accessibilityRole="button" accessibilityLabel="Remove profile photo">
            <Text style={styles.removeText}>Remove photo</Text>
          </TouchableOpacity>
        )}
        {!!displayName && <Text style={styles.photoName}>{displayName}</Text>}
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.nameInput}
          value={nameInput}
          onChangeText={setNameInput}
          onBlur={handleNameBlur}
          placeholder="Add your name"
          placeholderTextColor="#A0AEC0"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Row
          icon="card-outline"
          label="Plan"
          value={`${currentPlan.name} · ${currentPlan.priceLabel}`}
          onPress={() => navigation.navigate('SettingsTab', { screen: 'TokenGift' })}
        />
        <Row
          icon="chatbox-ellipses-outline"
          label="Questions left today"
          value={remainingQuestionsToday === Infinity ? 'Unlimited' : String(Math.max(remainingQuestionsToday, 0))}
        />
        <Row
          icon="ticket-outline"
          label="Token balance"
          value={String(tokenBalance)}
          onPress={() => navigation.navigate('SettingsTab', { screen: 'TokenGift' })}
        />
      </View>

      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dev only</Text>
          <TouchableOpacity
            style={styles.devButton}
            onPress={() => selectPlan('platinum')}
            accessibilityRole="button"
            accessibilityLabel="Unlock unlimited questions (dev only)"
          >
            <Ionicons name="infinite-outline" size={18} color={Colors.white} style={styles.rowIcon} />
            <Text style={styles.devButtonText}>Unlock unlimited questions</Text>
          </TouchableOpacity>
          <Text style={styles.devNote}>
            Only visible in dev builds -- sets your plan to Platinum locally, same as redeeming the founder
            code. Won't appear in a real release build.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved on this device</Text>
        <Row
          icon="bookmark-outline"
          label="Favorites"
          value={String(favorites.length)}
          onPress={() => navigation.navigate('ChatTab', { screen: 'Favorites' })}
        />
        <Row
          icon="book-outline"
          label="Journal entries"
          value={String(journalEntries.length)}
          onPress={() => navigation.navigate('Journal')}
        />
        <Row
          icon="hand-left-outline"
          iconElement={<MaterialCommunityIcons name="hands-pray" size={18} color={Colors.gold} style={styles.rowIcon} />}
          label="Prayer notes"
          value={String(prayerNotes.length)}
          onPress={() => navigation.navigate('PrayerWall')}
        />
      </View>

      <Text style={styles.footerNote}>
        Your name and photo are stored only on this device -- there's no account server behind them yet.
      </Text>
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

function Row({
  icon,
  iconElement,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  // Overrides `icon` when the icon isn't from Ionicons (e.g. Prayer
  // Wall's cupped-hands MaterialCommunityIcons glyph) -- `icon` stays
  // required so every other call site is unaffected.
  iconElement?: React.ReactNode;
  label: string;
  value: string;
  // Rows are plain, non-interactive display by default (Favorites,
  // Journal entries, etc.) -- only rows that actually go somewhere
  // (Plan, Token balance) pass this.
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.row} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      {iconElement ?? <Ionicons name={icon} size={18} color={Colors.gold} style={styles.rowIcon} />}
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color="#A0AEC0" style={styles.rowChevron} />}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  content: { padding: 20, paddingBottom: 40 },
  photoSection: { alignItems: 'center', marginBottom: 24 },
  photo: { width: 200, height: 200, borderRadius: 100 },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.royal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4F6FA',
  },
  removeText: { color: Colors.danger, fontSize: 12.5, marginTop: 10, textAlign: 'center' },
  photoName: { fontSize: 20, fontWeight: '800', color: Colors.royal, marginTop: 10 },
  nameSection: { marginBottom: 24 },
  label: { fontSize: 12.5, color: '#718096', marginBottom: 6, fontWeight: '600' },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.royal, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rowIcon: { marginRight: 10 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.ink },
  rowValue: { fontSize: 14, color: '#718096', fontWeight: '600' },
  rowChevron: { marginLeft: 6 },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.royal,
    borderRadius: 10,
    paddingVertical: 13,
  },
  devButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  devNote: { fontSize: 11.5, color: '#A0AEC0', marginTop: 8, lineHeight: 16 },
  footerNote: { fontSize: 11.5, color: '#A0AEC0', textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
