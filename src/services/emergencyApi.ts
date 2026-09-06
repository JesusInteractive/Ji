// Client for backend/server.js's POST /v1/emergency/alert -- same shape
// as services/triviaApi.ts (request<T> + withAuthRetry + getDeviceId),
// no new networking pattern.
import { withAuthRetry } from './backendAuth';
import { getDeviceId } from './deviceId';

const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.jesusinteractive.com';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface EmergencyAlertLocation {
  latitude: number | null;
  longitude: number | null;
  countryCode: string | null;
}

// 'ok' | 'failed' | 'not_configured' -- distinguished so the UI can tell
// the user exactly what happened (a silently-swallowed failure is not
// acceptable for a safety feature -- see ProfileScreen.tsx's own note).
export type EmergencyContactStatus = 'ok' | 'failed' | 'not_configured';

export interface EmergencyAlertResult {
  familyStatus: EmergencyContactStatus;
  ministryStatus: EmergencyContactStatus;
}

export async function sendEmergencyAlert(
  familyContact: EmergencyContact,
  ministryContact: EmergencyContact,
  location: EmergencyAlertLocation
): Promise<EmergencyAlertResult> {
  const deviceId = await getDeviceId();
  return withAuthRetry(async (token) => {
    const res = await fetch(`${API_BASE_URL}/v1/emergency/alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId,
        familyContact,
        ministryContact,
        latitude: location.latitude,
        longitude: location.longitude,
        countryCode: location.countryCode,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Emergency alert request failed (${res.status}): ${body}`);
    }
    return res.json() as Promise<EmergencyAlertResult>;
  });
}
