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
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          book_id TEXT NOT NULL,
          testament TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          question TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          correct_option TEXT NOT NULL,
          reference TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT trivia_questions_testament_chk CHECK (testament IN ('old','new')),
          CONSTRAINT trivia_questions_difficulty_chk CHECK (difficulty IN ('easy','medium','hard')),
          CONSTRAINT trivia_questions_correct_chk CHECK (correct_option IN ('A','B','C'))
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS trivia_questions_filter_idx
          ON trivia_questions (testament, difficulty, book_id) WHERE active
      `;
      // Singleton (id always 1): the current global shuffle order of
      // active question ids plus how far into it we are. Computed once
      // here server-side -- never per-device -- so every player sees the
      // same Daily Challenge set. See trivia_daily_sets below for the
      // per-day cache this feeds.
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_rotation_state (
          id SMALLINT PRIMARY KEY DEFAULT 1,
          question_order UUID[] NOT NULL,
          cursor_position INT NOT NULL DEFAULT 0,
          shuffled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT trivia_rotation_state_singleton_chk CHECK (id = 1)
        )
      `;
      // One row per calendar date -- first request of a new day computes
      // and inserts it (see server.js's /v1/trivia/daily), every later
      // request that day (any device) just reads this row.
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_daily_sets (
          challenge_date DATE PRIMARY KEY,
          question_ids UUID[] NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS trivia_scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          score INT NOT NULL,
          total INT NOT NULL,
          mode TEXT NOT NULL,
          challenge_date DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT trivia_scores_mode_chk CHECK (mode IN ('practice','daily','group'))
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS trivia_scores_leaderboard_idx
          ON trivia_scores (score DESC, created_at DESC)
      `;
      // Singleton (id always 1): "24/7 Global Praise and Worship"'s
      // radio.co stream config -- station_name/stream_url/schedule are
      // fetched at runtime by JIRadioScreen.tsx (same backend-hosted
      // pattern as trivia_questions above), so swapping stream_url after
      // a radio.co plan upgrade is a single admin API call, never an app
      // release. No seed row here -- stream_url has no sane default;
      // seeded once via POST /v1/admin/radio/config after the station is
      // actually live. GET /v1/radio/config returns 404 (not 500) until
      // then, and the app falls back to its own hardcoded default stream.
      await sql`
        CREATE TABLE IF NOT EXISTS radio_config (
          id SMALLINT PRIMARY KEY DEFAULT 1,
          station_name TEXT NOT NULL DEFAULT '24/7 Global Praise and Worship',
          stream_url TEXT NOT NULL,
          schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT radio_config_singleton_chk CHECK (id = 1)
        )
      `;
      // General-purpose analytics event log -- backs BOTH the specific
      // 10-event trial/paywall funnel (activation, day-2 return, trial
      // completion, trial-to-paid conversion) AND general product events
      // already fired elsewhere in the app (e.g. ChatScreen.tsx's
      // 'question_sent'). No CHECK constraint on event_name: unlike
      // trivia_questions' closed enums, this table's whole point is
      // accepting whatever event name a call site fires, validated only
      // for shape/length at the API layer (server.js's
      // /v1/analytics/event), not a fixed allowlist that would need a
      // schema change every time a new event is added.
      await sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id TEXT NOT NULL,
          event_name TEXT NOT NULL,
          properties JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
          ON analytics_events (event_name, created_at)
      `;
      return true;
    })();
  }
  return schemaReady;
}

module.exports = { sql, ensureSchema, hasDatabase: !!sql };
