import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useI18n, interpolate } from '../i18n';
import { PLANS } from '../constants/pricing';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { RootStackParamList } from '../navigation/RootNavigator';
import DraggableScrollbar from '../components/DraggableScrollbar';
import { sendEmergencyAlert, type EmergencyContactStatus } from '../services/emergencyApi';

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
    isInTrial,
    daysSinceFirstOpen,
    favorites,
    journalEntries,
    prayerNotes,
    selectPlan,
    familyContactName,
    setFamilyContactName,
    familyContactPhone,
    setFamilyContactPhone,
    ministryContactName,
    setMinistryContactName,
    ministryContactPhone,
    setMinistryContactPhone,
  } = useApp();
  const { t } = useI18n();
  const [nameInput, setNameInput] = useState(displayName);
  const [familyNameInput, setFamilyNameInput] = useState(familyContactName);
  const [familyPhoneInput, setFamilyPhoneInput] = useState(familyContactPhone);
  const [ministryNameInput, setMinistryNameInput] = useState(ministryContactName);
  const [ministryPhoneInput, setMinistryPhoneInput] = useState(ministryContactPhone);
  const [sendingAlert, setSendingAlert] = useState(false);
  // Once both contacts are already saved, showing the full editable form
  // every single visit is just clutter -- collapse to a compact summary
  // with an "Edit" link, keeping the SOS button always visible either
  // way. Computed once from context (not local input state) so a saved
  // pair of contacts starts collapsed; typed-but-unsaved input on a
  // fresh install correctly starts expanded.
  const [editingContacts, setEditingContacts] = useState(
    !(familyContactName.trim() && familyContactPhone.trim() && ministryContactName.trim() && ministryContactPhone.trim())
  );
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const scrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Disabled while dragging the custom scrollbar thumb -- see DraggableScrollbar.tsx's onDragStart/onDragEnd comment.
  const [scrollbarDragging, setScrollbarDragging] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  const handlePickPhoto = async () => {
    // Previously had no try/catch -- any rejection (permission API
    // throwing, the picker module not being available in the current
    // runtime, etc.) failed completely silently, which is exactly what
    // "tapping it does nothing" looks like from the outside.
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.profile.photoAccessNeededTitle, t.profile.photoAccessNeededMessage);
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
        t.profile.photoPickerErrorTitle,
        e instanceof Error ? e.message : t.profile.photoPickerErrorFallback
      );
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(t.profile.removePhotoAlertTitle, t.profile.removePhotoAlertMessage, [
      { text: t.profile.cancelButton, style: 'cancel' },
      { text: t.profile.removeButton, style: 'destructive', onPress: () => setProfilePhotoUri(null) },
    ]);
  };

  const handleNameBlur = () => {
    if (nameInput.trim() !== displayName) setDisplayName(nameInput.trim());
  };

  const handleFamilyNameBlur = () => {
    if (familyNameInput.trim() !== familyContactName) setFamilyContactName(familyNameInput.trim());
  };
  const handleFamilyPhoneBlur = () => {
    if (familyPhoneInput.trim() !== familyContactPhone) setFamilyContactPhone(familyPhoneInput.trim());
  };
  const handleMinistryNameBlur = () => {
    if (ministryNameInput.trim() !== ministryContactName) setMinistryContactName(ministryNameInput.trim());
  };
  const handleMinistryPhoneBlur = () => {
    if (ministryPhoneInput.trim() !== ministryContactPhone) setMinistryContactPhone(ministryPhoneInput.trim());
  };

  const emergencyContactsComplete =
    !!familyContactName.trim() && !!familyContactPhone.trim() &&
    !!ministryContactName.trim() && !!ministryContactPhone.trim();

  // One-shot location snapshot, taken only at the moment SOS is actually
  // pressed -- never in the background, never continuously (per this
  // feature's own design). Permission is requested here, just-in-time,
  // the same way the mic permission is only ever requested when the mic
  // button is tapped, not at launch.
  const captureEmergencyLocation = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
    countryCode: string | null;
  }> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return { latitude: null, longitude: null, countryCode: null };

      let coords: { latitude: number; longitude: number } | null = null;
      try {
        // Manual timeout race, same AbortController-timeout spirit this
        // app already uses for its own third-party calls -- a GPS fix
        // that never resolves must not leave someone stuck on this
        // screen mid-emergency.
        const fresh = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 8000)),
        ]);
        coords = fresh.coords;
      } catch {
        // Fall back to last known location, exactly per spec, rather
        // than failing the whole alert over a slow/unavailable GPS fix.
        const last = await Location.getLastKnownPositionAsync();
        coords = last?.coords ?? null;
      }
      if (!coords) return { latitude: null, longitude: null, countryCode: null };

      let countryCode: string | null = null;
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        countryCode = place?.isoCountryCode ?? null;
      } catch {
        // Country lookup is a nice-to-have for picking the right embassy
        // number -- the backend falls back to the State Department line
        // when it's missing, so this never blocks the alert itself.
      }
      return { latitude: coords.latitude, longitude: coords.longitude, countryCode };
    } catch {
      return { latitude: null, longitude: null, countryCode: null };
    }
  };

  const describeStatus = (label: string, status: EmergencyContactStatus) => {
    if (status === 'ok') return `${label} contact alerted.`;
    if (status === 'not_configured') return `${label} contact could not be reached (SMS not yet configured) — please call them directly.`;
    return `Could not reach the ${label.toLowerCase()} contact — please call them directly.`;
  };

  const handleSendAlert = async () => {
    setSendingAlert(true);
    try {
      const location = await captureEmergencyLocation();
      const result = await sendEmergencyAlert(
        { name: familyContactName, phone: familyContactPhone },
        { name: ministryContactName, phone: ministryContactPhone },
        location
      );
      Alert.alert(
        'Emergency alert sent',
        `${describeStatus('Family', result.familyStatus)}\n${describeStatus('Ministry', result.ministryStatus)}`
      );
    } catch (e) {
      console.error('Emergency alert error:', e);
      Alert.alert(
        'Could not send alert',
        'Check your connection and try again. If this is a real emergency, call your local emergency number directly.'
      );
    } finally {
      setSendingAlert(false);
    }
  };

  const confirmSendAlert = () => {
    Alert.alert('Send emergency alert?', 'Send emergency alert to both contacts?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', style: 'destructive', onPress: handleSendAlert },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
    <ImageBackground source={require('../../assets/textures/parchment.jpg')} style={styles.container} resizeMode="cover">
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
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handlePickPhoto} accessibilityRole="button" accessibilityLabel={t.profile.uploadPhotoA11yLabel}>
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
          <TouchableOpacity onPress={handleRemovePhoto} accessibilityRole="button" accessibilityLabel={t.profile.removePhotoA11yLabel}>
            <Text style={styles.removeText}>{t.profile.removePhotoText}</Text>
          </TouchableOpacity>
        )}
        {/* Same greeting as Home: "Welcome, friend" (t.home.title) until
            a name is saved below, then the first name. */}
        <Text style={styles.photoName}>
          {displayName.trim() ? `Welcome, ${displayName.trim().split(/\s+/)[0]}` : t.home.title}
        </Text>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.label}>{t.profile.nameLabel}</Text>
        <TextInput
          style={styles.nameInput}
          value={nameInput}
          onChangeText={setNameInput}
          onBlur={handleNameBlur}
          placeholder={t.profile.namePlaceholder}
          placeholderTextColor="#A0AEC0"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.profile.accountSectionTitle}</Text>
        <Row
          icon="card-outline"
          label={t.profile.planLabel}
          value={interpolate(t.profile.planValue, { name: currentPlan.name, price: currentPlan.priceLabel })}
          onPress={() => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Pricing')}
        />
        {isInTrial && (
          // Plain English, not run through t. -- new copy for the 5-day
          // trial that replaced the old "questions left" quota; adding
          // it to the i18n system means backfilling all 117 other locale
          // files by hand (see src/screens/trivia's own note on this
          // exact tradeoff), which isn't worth blocking this on.
          <Row icon="hourglass-outline" label="Free trial" value={`${Math.max(5 - daysSinceFirstOpen, 0)} days left`} />
        )}
      </View>

      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.devOnlySectionTitle}</Text>
          <TouchableOpacity
            style={styles.devButton}
            onPress={() => selectPlan('platinum')}
            accessibilityRole="button"
            accessibilityLabel={t.profile.unlockUnlimitedA11yLabel}
          >
            <Ionicons name="infinite-outline" size={18} color={Colors.white} style={styles.rowIcon} />
            <Text style={styles.devButtonText}>{t.profile.unlockUnlimitedButton}</Text>
          </TouchableOpacity>
          <Text style={styles.devNote}>
            {t.profile.devNote}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.profile.savedSectionTitle}</Text>
        <Row
          icon="bookmark-outline"
          label={t.profile.favoritesLabel}
          value={String(favorites.length)}
          onPress={() => navigation.navigate('ChatTab', { screen: 'Favorites' })}
        />
        <Row
          icon="book-outline"
          label={t.profile.journalEntriesLabel}
          value={String(journalEntries.length)}
          onPress={() => navigation.navigate('Journal')}
        />
        <Row
          icon="hand-left-outline"
          iconElement={<MaterialCommunityIcons name="hands-pray" size={18} color={Colors.gold} style={styles.rowIcon} />}
          label={t.profile.prayerNotesLabel}
          value={String(prayerNotes.length)}
          onPress={() => navigation.navigate('PrayerWall')}
        />
      </View>

      {/* Moved to the bottom of the page, below the routine account/saved
          sections -- leading with a red SOS button felt alarming as the
          first thing on the screen. Still its own section, just no
          longer the first impression.

          IMPORTANT: this section must never be gated behind
          useFeatureAccess()/PaywallLockScreen -- Emergency SOS is free on
          every plan (including an expired trial), by explicit decision.
          See pricing.ts's MONETIZATION_EXPLAINER.free for the same
          commitment in the pricing copy. Don't add a paywall check here
          just because most other screens in src/screens/ have one. */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency</Text>

        {editingContacts ? (
          <>
            <Text style={styles.emergencyIntro}>
              Add a family and a ministry contact below. Both are required before the SOS button
              activates. Tapping it sends each contact one SMS with your current location, the local
              emergency number, and the nearest US Embassy line.
            </Text>

            <Text style={styles.label}>Family contact name</Text>
            <TextInput
              style={styles.nameInput}
              value={familyNameInput}
              onChangeText={setFamilyNameInput}
              onBlur={handleFamilyNameBlur}
              placeholder="Full name"
              placeholderTextColor="#A0AEC0"
              textContentType="none"
              autoComplete="off"
            />
            <Text style={[styles.label, styles.labelSpaced]}>Family contact phone</Text>
            <TextInput
              style={styles.nameInput}
              value={familyPhoneInput}
              onChangeText={setFamilyPhoneInput}
              onBlur={handleFamilyPhoneBlur}
              placeholder="+1 555 555 5555"
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
              textContentType="none"
              autoComplete="off"
            />

            <Text style={[styles.label, styles.labelSpaced]}>Ministry contact name</Text>
            <TextInput
              style={styles.nameInput}
              value={ministryNameInput}
              onChangeText={setMinistryNameInput}
              onBlur={handleMinistryNameBlur}
              placeholder="Full name"
              placeholderTextColor="#A0AEC0"
              textContentType="none"
              autoComplete="off"
            />
            <Text style={[styles.label, styles.labelSpaced]}>Ministry contact phone</Text>
            <TextInput
              style={styles.nameInput}
              value={ministryPhoneInput}
              onChangeText={setMinistryPhoneInput}
              onBlur={handleMinistryPhoneBlur}
              placeholder="+1 555 555 5555"
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
              textContentType="none"
              autoComplete="off"
            />

            {emergencyContactsComplete && (
              <TouchableOpacity
                style={styles.doneEditingContactsBtn}
                onPress={() => setEditingContacts(false)}
                accessibilityRole="button"
                accessibilityLabel="Done editing emergency contacts"
              >
                <Text style={styles.doneEditingContactsText}>Done</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emergencySummary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencySummaryText}>Family: {familyContactName}</Text>
              <Text style={styles.emergencySummaryText}>Ministry: {ministryContactName}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingContacts(true)} accessibilityRole="button" accessibilityLabel="Edit emergency contacts">
              <Text style={styles.editContactsLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sosButton, !emergencyContactsComplete && styles.sosButtonDisabled]}
          onPress={confirmSendAlert}
          disabled={!emergencyContactsComplete || sendingAlert}
          accessibilityRole="button"
          accessibilityLabel="Send emergency alert"
        >
          {sendingAlert ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.sosButtonText}>SOS</Text>
          )}
        </TouchableOpacity>
        {!emergencyContactsComplete && (
          <Text style={styles.sosHint}>Fill in both contacts above to enable the SOS button.</Text>
        )}
      </View>

      <Text style={styles.footerNote}>
        {t.profile.footerNote}
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
      onDragStart={() => setScrollbarDragging(true)}
      onDragEnd={() => setScrollbarDragging(false)}
    />
    </ImageBackground>
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
  emergencyIntro: { fontSize: 12.5, color: '#718096', lineHeight: 17, marginBottom: 14 },
  doneEditingContactsBtn: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4, paddingHorizontal: 8 },
  doneEditingContactsText: { color: Colors.royal, fontSize: 13.5, fontWeight: '700' },
  emergencySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emergencySummaryText: { fontSize: 13.5, color: Colors.ink, marginBottom: 2 },
  editContactsLink: { color: Colors.royal, fontSize: 13.5, fontWeight: '700', marginLeft: 12 },
  labelSpaced: { marginTop: 14 },
  sosButton: {
    marginTop: 18,
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sosButtonDisabled: { backgroundColor: '#E2A8A2', shadowOpacity: 0 },
  sosButtonText: { color: Colors.white, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  sosHint: { fontSize: 11.5, color: '#A0AEC0', textAlign: 'center', marginTop: 10 },
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
