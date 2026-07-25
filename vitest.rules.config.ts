import { defineConfig } from "vitest/config";

// Rules tests talk to the Firestore emulator, so they run in their own
// project — `npm run test:rules` wraps this in `firebase emulators:exec`.
// They are excluded from the default `npm test` run, which stays offline.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    // One emulator, one shared ruleset: parallel suites would race on the
    // same project's data.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
