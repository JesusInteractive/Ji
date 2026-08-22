// On-device "download my data" export -- the real, working
// implementation behind SettingsScreen.tsx's "Download my data" row.
//
// There's no server-side copy of a user's data to fetch: backend/
// server.js's POST /v1/account/export deliberately returns 501, because
// every real piece of user data (chat messages, journal entries, prayer
// notes, favorites) lives only in this device's AsyncStorage -- see
// AppContext.tsx's STORAGE_KEYS. Building the export here, straight from
// those same keys, is the only version of this feature that can actually
// hand the user a correct, complete copy of their data today.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../context/AppContext';
import { decryptLocalText } from './security';

// journal and prayers are stored AES-256-GCM-encrypted on-device (see
// security.ts) -- reading them for export needs decrypting first, or the
// user would get unreadable ciphertext instead of their actual data.
const ENCRYPTED_KEYS = new Set<keyof typeof STORAGE_KEYS>(['journal', 'prayers']);

// Bundles every AppContext-managed key into one readable JSON file and
// hands it to the OS share sheet (Files, AirDrop, Mail, etc.) so the user
// can actually save or send a copy. No network call is made -- nothing
// leaves the device unless the user explicitly picks a share target that
// sends it somewhere.
export async function exportLocalDataAsFile(): Promise<void> {
  const storageKeyList = Object.values(STORAGE_KEYS);
  const entries = await AsyncStorage.multiGet(storageKeyList);
  const byStorageKey = new Map(entries);

  const data: Record<string, unknown> = {};
  for (const [friendlyName, storageKey] of Object.entries(STORAGE_KEYS)) {
    const raw = byStorageKey.get(storageKey);
    if (raw == null) continue;

    const asPlainText = ENCRYPTED_KEYS.has(friendlyName as keyof typeof STORAGE_KEYS)
      ? await decryptLocalText(raw).catch(() => raw) // pre-encryption plaintext data, or decryption genuinely failing -- fall back to the raw value either way rather than dropping it from the export
      : raw;

    // Every value AppContext writes is either JSON (arrays/objects) or a
    // bare string/number -- try JSON first, fall back to the raw string
    // so nothing silently vanishes from the export if a value ever isn't
    // valid JSON.
    try {
      data[friendlyName] = JSON.parse(asPlainText);
    } catch {
      data[friendlyName] = asPlainText;
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Jesus Interactive',
    data,
  };

  // Imported lazily so merely importing this module (e.g. from
  // SettingsScreen's top level) doesn't crash in environments without
  // these native modules linked (Expo Go) -- only calling this function
  // actually needs them, and real builds resolve them the same either way.
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  const file = new File(Paths.cache, `jesus-interactive-data-export-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save or send your data export',
  });
}
