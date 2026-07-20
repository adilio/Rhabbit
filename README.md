# Rhabbit 🐇

> Take it one hop at a time.

A calm, private habit tracker for two — part of the [4dl Apps](https://4dl.ca)
family. Live at [rhabbit.4dl.ca](https://rhabbit.4dl.ca).

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
from `main` via Netlify.

## Access control

Rhabbit is private. Server-side Firestore rules (`firestore.rules`) only
admit Google accounts whose verified email exists in the `allowlist`
collection — add or remove emails in the Firebase console (doc ID = email,
contents can be empty).

## Data model

```
users/{uid}                    profile: displayName, timezone, weekStartsOn
users/{uid}/habits/{id}        name, type, target, schedule, timeOfDay, …
users/{uid}/entries/{habitId_date}   status, value, note — one doc per day
users/{uid}/importBatches/{id} filename, counts — enables import undo
allowlist/{email}              presence = access (console-managed)
```

Entries key on a **local date string** (`2026-07-19`), so history never
shifts when the device timezone changes.
