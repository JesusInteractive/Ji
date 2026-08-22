// Real, working on-device encryption for local-only content (journal
// entries, private prayer notes) -- see the architecture notes below for
// what this is and isn't a substitute for.
//
// Spec requirement (product spec section 10): zero backdoors, zero hidden
// admin access to private chats, zero ability for anyone -- including the
// developers -- to read private user content after encryption is
// applied. Journal entries and Prayer Wall notes are never sent to the
// model (they're not part of a chat), so the server never needs their
// plaintext -- that's what makes encrypting them fully client-side, with
// a key the server never sees, both possible and sufficient here. Chat
// messages are a different case: the backend needs the plaintext to send
// to the model, so true end-to-end encryption doesn't apply to them the
// same way -- see api.ts's own security notes for that trade-off.
//
// ARCHITECTURE
// - deriveLocalEncryptionKey() generates a random 256-bit key on first
//   use and stores it in expo-secure-store (iOS Keychain / Android
//   Keystore, hardware-backed on most devices, NOT synced to iCloud/
//   Google backups by default). The key never leaves this device and is
//   never sent to the backend.
// - encryptLocalText()/decryptLocalText() wrap expo-crypto's native
//   AES-256-GCM implementation (see node_modules/expo-crypto's aes/
//   module) -- authenticated encryption, not a hand-rolled cipher.
// - Multi-device sync (a spec requirement) needs a real key-exchange step
//   (QR-code device linking, or a passphrase-protected encrypted backup,
//   Signal/iMessage-style) before journal/prayer sync can work across
//   devices without breaking this model -- not implemented yet. Losing
//   this device without that in place means losing access to
//   already-encrypted local content; there is intentionally no backdoor
//   key recovery, since a recoverable key is a backdoor.

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const LOCAL_KEY_STORE_ID = 'ji_local_encryption_key_v1';

export async function deriveLocalEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(LOCAL_KEY_STORE_ID);
  if (existing) return existing;

  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(LOCAL_KEY_STORE_ID, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

// Wipes locally-held secrets. Call this as part of account deletion /
// sign-out-everywhere. The backend deletion request (data + backups) has
// to be a separate, server-side operation -- this only clears the device.
// NOTE: this makes any already-encrypted journal/prayer data
// unrecoverable (by design -- see the module comment above), so it must
// only run alongside actually wiping that data too (see AppContext.tsx's
// wipeAllLocalData(), called together with this in SettingsScreen.tsx).
export async function wipeLocalSecrets(): Promise<void> {
  cachedKey = null;
  await SecureStore.deleteItemAsync(LOCAL_KEY_STORE_ID);
}

// Importing the raw hex key into an AESEncryptionKey is cheap but not
// free -- cached per-process rather than re-imported on every
// encrypt/decrypt call (a journal or prayer list can round-trip many
// entries at once).
let cachedKey: Crypto.AESEncryptionKey | null = null;

async function getEncryptionKey(): Promise<Crypto.AESEncryptionKey> {
  if (cachedKey) return cachedKey;
  const hexKey = await deriveLocalEncryptionKey();
  cachedKey = await Crypto.AESEncryptionKey.import(hexKey, 'hex');
  return cachedKey;
}

// Manual UTF-8 <-> bytes codec -- expo-crypto's AES functions take
// Uint8Array/base64 input, not a raw JS string, and this app ships
// content in scripts (Hebrew, Greek, Arabic, Hindi -- see
// src/i18n/languages.ts) that a naive ASCII-only conversion (btoa/atob,
// String.fromCharCode per UTF-16 unit) would corrupt. This is the
// standard surrogate-pair-aware UTF-8 encoding algorithm, not a
// cryptographic primitive itself.
function utf8Encode(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    if (code > 0xffff) i++; // surrogate pair -- consumed two UTF-16 units
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

function utf8Decode(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      result += String.fromCharCode(b1);
    } else if (b1 < 0xe0) {
      const b2 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if (b1 < 0xf0) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      const codepoint = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
      result += String.fromCodePoint(codepoint);
    }
  }
  return result;
}

// Encrypts arbitrary text with AES-256-GCM under this device's local key.
// Returns a single base64 string (IV + ciphertext + auth tag combined) --
// safe to store directly as an AsyncStorage value in place of plaintext.
export async function encryptLocalText(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const sealed = await Crypto.aesEncryptAsync(utf8Encode(plaintext), key);
  return sealed.combined('base64');
}

// Reverses encryptLocalText(). Throws if `combined` isn't validly-formed
// sealed data for this key (wrong/rotated key, corrupted value, or --
// see AppContext.tsx's read helpers -- plaintext written before
// encryption was wired up here) so callers can fall back appropriately
// rather than silently returning garbage.
export async function decryptLocalText(combined: string): Promise<string> {
  const key = await getEncryptionKey();
  const sealed = Crypto.AESSealedData.fromCombined(combined);
  const bytes = await Crypto.aesDecryptAsync(sealed, key, { output: 'bytes' });
  return utf8Decode(bytes as Uint8Array);
}
