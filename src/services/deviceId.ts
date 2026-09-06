// A random, locally-generated id -- NOT tied to any hardware identifier,
// Apple/Google account, or personal data. Generated once on first launch
// and persisted in AsyncStorage; reinstalling the app or clearing app
// data produces a new one. This is the only thing that lets the backend
// count distinct users, attribute a testimony's report count, or flag a
// device as abusive (backend/server.js's users/testimonies tables) --
// there is still no real account/login system (see backendAuth.ts's own
// comment), so this is intentionally the lightest identifier that makes
// those features possible.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'ji_device_id_v1';

let cached: string | null = null;
let inFlight: Promise<string> | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = (async () => {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      if (existing) {
        cached = existing;
        return existing;
      }
      const id = Crypto.randomUUID();
      await AsyncStorage.setItem(STORAGE_KEY, id);
      cached = id;
      return id;
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
