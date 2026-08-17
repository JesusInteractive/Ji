// Shared-secret auth against backend/server.js's requireAuth -- must
// match BACKEND_SECRET there exactly (see .env / backend/.env). This is
// NOT real per-user auth (there's no user/session system anywhere in
// this app yet -- see AppContext.tsx); it only proves the app knows a
// secret the backend also knows. See EXPO_PUBLIC_BACKEND_SECRET's own
// comment in .env for why that's a stopgap, not a real fix.
//
// Pulled out of ChatScreen.tsx so GlorySplash.tsx (used pre-login, in
// onboarding) can authenticate the same way without duplicating this.
export const BACKEND_AUTH_TOKEN = process.env.EXPO_PUBLIC_BACKEND_SECRET ?? 'demo-auth-token';
