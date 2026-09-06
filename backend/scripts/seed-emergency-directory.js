// One-time (re-run-safe) seed script -- NOT part of the running server.
// Loads backend/scripts/emergency-directory-seed-data.json (every ISO
// 3166-1 country/region code, upserted directly into Postgres) and
// upserts it into emergency_directory. Safe to re-run: uses
// ON CONFLICT (country_code) DO UPDATE, so re-running after real numbers
// have been researched and added to the JSON file (the monthly refresh)
// updates existing rows rather than duplicating them.
//
// V1 ships every country with emergency_number/embassy_phone left null
// -- POST /v1/emergency/alert falls back to the State Department's main
// line at read time for any row with a null embassy_phone, so an
// unresearched country is never a broken experience, just the generic
// fallback. Real per-country numbers get filled in over time by editing
// emergency-directory-seed-data.json and re-running this script, or via
// POST /v1/admin/emergency-directory for a single country at a time.
//
// Run:
//   cd backend && node scripts/seed-emergency-directory.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sql, ensureSchema, hasDatabase } = require('../db');

async function main() {
  if (!hasDatabase) {
    console.error('DATABASE_URL is not set -- cannot seed.');
    process.exit(1);
  }
  await ensureSchema();

  const filePath = path.join(__dirname, 'emergency-directory-seed-data.json');
  const countries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(countries) || countries.length === 0) {
    console.error(`No countries found in ${filePath}`);
    process.exit(1);
  }

  let total = 0;
  for (const c of countries) {
    await sql`
      INSERT INTO emergency_directory (country_code, country_name, emergency_number, embassy_phone, updated_at)
      VALUES (${c.countryCode}, ${c.countryName}, ${c.emergencyNumber ?? null}, ${c.embassyPhone ?? null}, now())
      ON CONFLICT (country_code) DO UPDATE SET
        country_name = ${c.countryName},
        emergency_number = COALESCE(${c.emergencyNumber ?? null}, emergency_directory.emergency_number),
        embassy_phone = COALESCE(${c.embassyPhone ?? null}, emergency_directory.embassy_phone),
        updated_at = now()
    `;
    total += 1;
  }
  console.log(`Done -- ${total} countries seeded/updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
