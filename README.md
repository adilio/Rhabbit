# Rhabbit 🐇

> Take it one hop at a time.

A calm, private habit tracker for a small circle of friends — part of the
[4dl Apps](https://4dl.ca) family. Live at
[rhabbit.4dl.ca](https://rhabbit.4dl.ca).

- **One-tap logging** on a mobile-first Today screen, with undo everywhere
- **Forgiving progress** — skips, pauses, and comebacks instead of guilt
- Boolean, numeric, duration, and avoidance habits with flexible schedules
  (daily, chosen weekdays, or *N* times a week)
- **Spreadsheet import** (.xlsx/.xls/.csv) with layout detection, preview,
  and one-tap undo — plus JSON/CSV export
- Calendar history with backfill, per-habit heatmaps, plain-language insights
- Installable PWA with offline support, dark and light themes

## Stack

React 19 · TypeScript · Vite · Firebase (Google auth + Firestore with offline
persistence) · SheetJS · vite-plugin-pwa · Netlify

## Development

```bash
cp .env.example .env   # fill in Firebase web config
npm install
npm run dev
```

`npm run build` type-checks and produces `dist/`. Deploys run automatically
from `main` via Netlify: a GitHub push webhook fires a Netlify build hook,
and the buildbot clones over SSH with a read-only deploy key. If a deploy is
ever needed by hand: `npm run build && netlify deploy --prod --dir dist
--no-build` (local `.env` supplies the Firebase config).

### Tests

```bash
npm test           # unit tests for dates, schedules, and stats
npm run test:rules # Firestore security rules, against the local emulator
npm run ci:verify  # everything CI runs: typecheck, both suites, build
```

`test:rules` boots the Firestore emulator, which needs a Java runtime on
`PATH`. Homebrew's `openjdk` is keg-only, so it needs to be added explicitly:

```bash
brew install openjdk
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"   # add to ~/.zshrc to persist
```

The rules suite asserts denials as well as grants — cross-user reads,
non-allowlisted accounts, unverified emails, and self-granting an allowlist
entry. Changing `firestore.rules` without updating it should turn CI red.

Production uses `rhabbit.4dl.ca` as Firebase's auth domain and Netlify proxies
`/__/auth/*` to the Firebase Hosting auth helpers. Keep `rhabbit.4dl.ca` in
Firebase Authentication's authorized domains and keep
`https://rhabbit.4dl.ca/__/auth/handler` in the Google OAuth web client's
authorized redirect URIs. Local development continues to use the
`VITE_FIREBASE_AUTH_DOMAIN` value from `.env`.

## Access control

Rhabbit is open to Adil's close friends. Anyone can sign in with Google, but
signing in only gets you as far as a request: server-side Firestore rules
(`firestore.rules`) admit a Google account to the app itself only once its
verified email has a document in the `allowlist` collection.

The loop runs entirely in-app, no console visit required:

1. A new account signs in and lands on the access gate, where it can send one
   request with a short note.
2. An admin sees the request under **Access** (a badge on the nav counts who
   is waiting) and approves or declines it.
3. Approving writes the `allowlist` row and stamps the request, atomically.
   The new member is let in on their next load — no second sign-in.

Admins can also revoke a member, promote a member to admin, and clear a
turned-away record so that person may ask again. Two things are deliberately
impossible, because either would leave the app with no one able to let anyone
in: an admin cannot revoke themselves, and cannot demote themselves.

Revoking removes the `allowlist` row and leaves a `revoked` record behind.
That record is load-bearing — while it exists, the account cannot file a
fresh request, so a declined person can't re-ask every day. Their habit data
is left untouched in case you let them back in.

**Bootstrapping the first admin** is the one manual step, and it has to be:
rules that let you appoint yourself would let anyone appoint themselves. In
the Firebase console, give your own `allowlist/{email}` document a field
`role: "admin"`. Rows added before roles existed keep working as plain
members.

Each person's habit data remains private to their account — admin is a role
for granting access, not a key to anyone's habits, and the rules enforce that.

## Data model

```
users/{uid}                    profile: displayName, timezone, weekStartsOn
users/{uid}/habits/{id}        name, type, target, schedule, timeOfDay, …
users/{uid}/entries/{habitId_date}   status, value, note — one doc per day
users/{uid}/importBatches/{id} filename, counts — enables import undo
allowlist/{email}              presence = access; role: member | admin
accessRequests/{email}         status: pending | approved | revoked, note, …
```

Entries key on a **local date string** (`2026-07-19`), so history never
shifts when the device timezone changes.
