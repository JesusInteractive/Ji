# Play Pricing CLI

A small command-line tool for reading and updating Jesus Interactive's
Google Play subscription base plan prices via the [Android Publisher
API v3](https://developers.google.com/android-publisher/api-ref/rest/v3).
Not part of the shipped app or the running backend -- a standalone
operator tool you run from your own machine when you need to change a
price, same as `tools/avatar-mocap` and `tools/backend-examples`
elsewhere in this repo.

## What this app's subscriptions actually are

- **Basic** -- base plan `basic_monthly`
- **Pro_monthly** -- has 2 active base plans; the CLI's `--base` flag
  lets you pick which one (e.g. `monthly`)
- **Platinum** -- base plan `platinum_monthly`
- **Platinum_Yearly** -- base plan `platinum_yearly`

Use `npm run prices -- get` with no `--product` to list every
subscription and its exact base plan IDs straight from Play, rather
than trusting this list to stay accurate over time.

## Play Console IAM setup

This tool authenticates as a Google Cloud **service account**, not your
own Google login. One-time setup:

1. In the [Google Cloud Console](https://console.cloud.google.com) for
   the project linked to your Play Console account, create a service
   account (IAM & Admin -> Service Accounts -> Create).
2. Create a JSON key for it (Keys tab -> Add Key -> JSON) and download
   it. Keep this file out of git -- it's a real credential.
3. In **Play Console -> Users and permissions -> Invite new users**,
   paste the service account's email address (looks like
   `name@project-id.iam.gserviceaccount.com`).
4. Grant it these app-level permissions on Jesus Interactive:
   - **View app information (read-only)**
   - **Manage production releases** is NOT required for this tool --
     only the **Monetization** permission group (view and manage
     subscriptions/pricing) is actually needed. Grant the narrowest
     permission set Play Console offers for that, not a broader release
     -management role.
5. Set `GOOGLE_APPLICATION_CREDENTIALS` in your `.env` to the path of
   the downloaded JSON key file (see `.env.example`).

It can take a few minutes for a freshly-granted permission to actually
propagate -- if your first real call 403s, wait a bit and retry before
assuming the setup is wrong.

## Setup

```bash
cd tools/play-pricing
npm install
cp .env.example .env   # then fill in GOOGLE_APPLICATION_CREDENTIALS,
                        # ANDROID_PACKAGE_NAME, REGIONS_VERSION
```

## Usage

```bash
# List every subscription + base plan id
npm run prices -- get

# Full detail (all base plans, all regional prices) for one subscription
npm run prices -- get --product basic_monthly

# Preview a price change without calling Google
npm run prices -- set --product Platinum --base platinum_monthly --region US --amount 19.99 --currency USD --dry-run

# Actually apply it
npm run prices -- set --product Platinum --base platinum_monthly --region US --amount 19.99 --currency USD

# Move EXISTING subscribers in these regions onto the current price
# (separate, explicit command -- see "Play's pricing rules" below)
npm run prices -- migrate --product Platinum --base platinum_monthly --regions US,GB --dry-run
```

## Play's pricing rules (read before you run `set` or `migrate`)

- **New buyers** see a price change within a few hours of `set`
  succeeding.
- **Existing subscribers keep their old price** indefinitely -- `set`
  alone never touches what a current subscriber is charged. Only the
  separate `migrate` command moves them onto the new price, which is
  why it's a distinct command in this tool rather than something `set`
  does automatically.
- **Price increases are usually opt-in** for existing subscribers --
  Play shows them an in-app consent flow, and a subscriber who declines
  can have their subscription cancelled rather than migrated. Running
  `migrate` on a real subscriber base is a real, user-facing event, not
  a quiet backend update.
- Always run `--dry-run` first and read the printed request body before
  running the same command for real.

## One thing in this tool not fully doc-verified

Every endpoint, field name, and resource shape in `src/client.ts` was
checked directly against Google's live API reference before being
written -- except `migratePrices`'s nested `RegionalPriceMigrationConfig`
sub-fields, which time didn't allow fully confirming. That function is
built from the verified parent request shape (`regionalPriceMigrations`
+ `regionsVersion`) plus the most standard reading of Play's own docs.
Before running `migrate` for real (not `--dry-run`) the first time,
confirm the exact sub-fields against the live Discovery document:

```bash
curl -s https://androidpublisher.googleapis.com/\$discovery/rest?version=v3 | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d['schemas']['RegionalPriceMigrationConfig'], indent=2))"
```
