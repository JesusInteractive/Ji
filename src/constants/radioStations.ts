// Display-name fallback only. There is deliberately no fallback stream
// URL: the old one was a placeholder radio.co id (s0000000) that played
// nothing, so LiveRadioPlaybackContext.tsx now tells the listener the
// radio is offline when GET /v1/radio/config (services/radioApi.ts) is
// unreachable or not yet seeded. The real, live values
// (station name, stream URL, schedule) are backend-hosted and editable
// via POST /v1/admin/radio/config without any app release -- see
// backend/db.js's radio_config table for why (a radio.co plan upgrade
// may or may not keep the same stream URL, unconfirmed by their docs).
export const FALLBACK_STATION_NAME = '24/7 Global Praise and Worship';
