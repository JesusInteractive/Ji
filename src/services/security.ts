// ARCHITECTURE NOTES ONLY -- not a working crypto implementation.
//
// Spec requirement (non-negotiable, per product spec section 10): zero
// backdoors, zero hidden admin access to private chats, zero ability for
// anyone -- including the developers -- to read private user conversations
// after encryption is applied. This is a client scaffold; real end-to-end
// encryption is a full-stack effort (client key generation/storage, a
// backend that only ever sees ciphertext, and a key-exchange/recovery
// design). Below is the architecture this app is built to plug into, plus
// small honest client-side building blocks (expo-crypto, expo-secure-store)
// that a real implementation would use.
//
// RECOMMENDED ARCHITECTURE
// 1. On first launch, generate a device keypair (e.g. X25519) using
//    expo-crypto / a vetted native crypto library -- never a hand-rolled
//    cipher. Store the private key in expo-secure-store (iOS Keychain /
//    Android Keystore), which is hardware-backed on most devices and is
//    NOT synced to iCloud/Google backups by default.
// 2. Multi-device sync (a spec requirement) needs a key-exchange step:
//    either (a) the user manually links a new device via a QR code /
//    one-time code that transfers the key material directly device-to-
//    device, or (b) an encrypted key backup protected by a passphrase only
//    the user knows, following something like the Signal / iMessage
//    "secure backup" model. In both designs, the server only ever stores
//    and relays ciphertext -- it cannot decrypt it, satisfying "no
//    backdoors."
// 3. All chat requests to the model API MUST go through your backend,
//    which means the backend needs the plaintext to send to the model.
//    True end-to-end encryption (server literally cannot read it) is
//    fundamentally in tension with "send this message to an AI model
//    for a response." The honest, achievable version of "no backdoors"
//    for an AI chat product is usually:
//      - Encryption in transit (TLS) and at rest (server-side encryption
//        with keys the application controls, not shared with third
//        parties, and never exposed via an undocumented admin panel).
//      - Strict access controls + audit logging on any internal tooling
//        that can query conversation data, with no standing "read any
//        user's chat" capability for staff.
//      - Minimal retention: store only what's needed for the feature
//        (saved history, cross-device sync) and let users permanently
//        delete everything on demand (see deleteAccountAndAllData below).
//      - Journal entries and Prayer Wall notes that are never sent to
//        the model (i.e. not part of a chat) CAN be end-to-end encrypted
//        client-side today, because the server never needs the plaintext
//        for a private, non-AI-processed note. That's the sensible
//        first thing to actually build E2E-encrypted.
//    Document this trade-off plainly in your real Privacy Policy rather
//    than over-promising "full end-to-end encryption" for AI chat
//    specifically -- overpromising here is a real legal/trust risk.
//
// WHAT'S IMPLEMENTED HERE (client-side, real, usable today)
// - deriveLocalEncryptionKey(): generates/retrieves a per-device key via
//   expo-crypto + expo-secure-store, suitable for encrypting local-only
//   content (e.g. journal entries, private prayer notes) at rest on the
//   device itself, independent of any backend.
// - No plaintext secrets (API keys, persona prompt) ever live in this
//   client codebase -- see services/api.ts.

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
export async function wipeLocalSecrets(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCAL_KEY_STORE_ID);
}
