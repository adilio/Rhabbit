import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Rules tests need the Firestore emulator; they run via `test:rules`.
    exclude: ["tests/rules/**"],
  },
});
