// Neon Postgres client. Uses @neondatabase/serverless's HTTP-based driver
// (not node-postgres/pg) deliberately: this file runs as a Vercel
// serverless function (see vercel.json's api/index.js), where a plain
// TCP connection pool gets re-created on every cold start and can
// exhaust Neon's connection limit under concurrent invocations. The
// HTTP driver makes one fetch per query instead of holding a
// connection open, which is the right shape for that environment.
//
// DATABASE_URL is injected automatically by Vercel's Neon integration
// (Storage tab) into Production and Preview -- nothing to configure by
// hand there. For local dev, run `vercel env pull .env` from this
// directory to fetch it, or copy it from the Vercel dashboard's Neon
// project page into backend/.env yourself.
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

if (!DATABASE_URL) {
  // Not a throw (unlike SESSION_JWT_SECRET) -- every route that touches
  // the database checks `sql` itself and responds 503 rather than
  // crashing the whole process, so the rest of the app (chat/TTS/STT/
  // devotions, none of which need a database) keeps working even if
  // this is ever unset.
  console.warn('[db] DATABASE_URL is not set -- database-backed routes will return 503.');
}

// Idempotent (CREATE TABLE/INDEX IF NOT EXISTS) so it's safe to call on
// every cold start; cached in-process so a warm invocation doesn't
// re-run it. gen_random_uuid() is Postgres core as of v13 (Neon runs
// newer than that) -- no pgcrypto/uuid-ossp extension needed.
let schemaReady = null;
function ensureSchema() {
  if (!sql) return Promise.resolve(false);
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          device_id TEXT PRIMARY KEY,
          plan TEXT NOT NULL DEFAULT 'free',
          plan_expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          is_abusive BOOLEAN NOT NULL DEFAULT false,
          abuse_note TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS testimonies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          status TEXT NOT NULL DEFAULT 'visible',
          report_count INT NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS testimonies_visible_created_at_idx
          ON testimonies (created_at DESC)
          WHERE status = 'visible'
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS testimony_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          testimony_id UUID NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
          reporter_device_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (testimony_id, reporter_device_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS testimony_reactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          testimony_id UUID NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
          device_id TEXT NOT NULL,
          emoji TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (testimony_id, device_id, emoji)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS testimony_reactions_testimony_idx
          ON testimony_reactions (testimony_id)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS subscription_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id TEXT NOT NULL,
          plan TEXT NOT NULL,
          event_type TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      return true;
    })();
  }
  return schemaReady;
}

module.exports = { sql, ensureSchema, hasDatabase: !!sql };
