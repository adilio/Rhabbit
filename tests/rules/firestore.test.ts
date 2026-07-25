import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const ALLOWED = "adilio@gmail.com";
const ALLOWED_UID = "uid-allowed";
const OTHER_ALLOWED = "marla.dranfield@gmail.com";
const OTHER_ALLOWED_UID = "uid-other";
const STRANGER = "stranger@example.com";
const STRANGER_UID = "uid-stranger";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "rhabbit-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // The allowlist is managed out-of-band in the Firebase console, so seed it
  // with rules disabled the same way a console edit would appear.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "allowlist", ALLOWED), { added: true });
    await setDoc(doc(db, "allowlist", OTHER_ALLOWED), { added: true });
  });
});

/** A signed-in, email-verified user. */
function asUser(uid: string, email: string) {
  return env.authenticatedContext(uid, { email, email_verified: true }).firestore();
}

describe("allowlisted users", () => {
  it("can write and read their own habits", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    const ref = doc(db, `users/${ALLOWED_UID}/habits/h1`);
    await assertSucceeds(setDoc(ref, { name: "Walk" }));
    await assertSucceeds(getDoc(ref));
  });

  it("can write entries and nested documents in their own subtree", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertSucceeds(
      setDoc(doc(db, `users/${ALLOWED_UID}/entries/h1_2026-07-19`), { status: "complete" }),
    );
    await assertSucceeds(
      setDoc(doc(db, `users/${ALLOWED_UID}/importBatches/b1`), { filename: "x.xlsx" }),
    );
  });

  it("can read their own allowlist document", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertSucceeds(getDoc(doc(db, "allowlist", ALLOWED)));
  });
});

describe("cross-user isolation", () => {
  // The rule requires both allowlisting *and* uid ownership. This is the
  // case that would leak one household member's data to the other.
  it("denies an allowlisted user reading another user's subtree", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${OTHER_ALLOWED_UID}/habits/h1`), { name: "Read" });
    });
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertFails(getDoc(doc(db, `users/${OTHER_ALLOWED_UID}/habits/h1`)));
  });

  it("denies an allowlisted user writing into another user's subtree", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertFails(setDoc(doc(db, `users/${OTHER_ALLOWED_UID}/habits/h1`), { name: "Nope" }));
  });
});

describe("users who are not allowlisted", () => {
  it("denies reads of their own subtree", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(getDoc(doc(db, `users/${STRANGER_UID}/habits/h1`)));
  });

  it("denies writes to their own subtree", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(setDoc(doc(db, `users/${STRANGER_UID}/habits/h1`), { name: "Nope" }));
  });

  it("denies reading someone else's allowlist document", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(getDoc(doc(db, "allowlist", ALLOWED)));
  });
});

describe("unverified email", () => {
  // Google sign-in normally implies a verified email, but the rules check it
  // explicitly, so an unverified token must not pass.
  it("denies an otherwise-allowlisted user whose email is unverified", async () => {
    const db = env
      .authenticatedContext(ALLOWED_UID, { email: ALLOWED, email_verified: false })
      .firestore();
    await assertFails(getDoc(doc(db, `users/${ALLOWED_UID}/habits/h1`)));
    await assertFails(setDoc(doc(db, `users/${ALLOWED_UID}/habits/h1`), { name: "Nope" }));
  });
});

describe("unauthenticated access", () => {
  it("denies all reads and writes", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `users/${ALLOWED_UID}/habits/h1`)));
    await assertFails(setDoc(doc(db, `users/${ALLOWED_UID}/habits/h1`), { name: "Nope" }));
    await assertFails(getDoc(doc(db, "allowlist", ALLOWED)));
  });
});

describe("the allowlist itself", () => {
  // Self-promotion is the attack this blocks: writing your own allowlist doc
  // would otherwise grant you the whole app.
  it("cannot be written by an allowlisted user", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertFails(setDoc(doc(db, "allowlist", ALLOWED), { added: true }));
  });

  it("cannot be self-granted by a stranger", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(setDoc(doc(db, "allowlist", STRANGER), { added: true }));
  });
});

describe("collections the rules do not mention", () => {
  it("denies access to any path outside users/ and allowlist/", async () => {
    const db = asUser(ALLOWED_UID, ALLOWED);
    await assertFails(getDoc(doc(db, "config", "global")));
    await assertFails(setDoc(doc(db, "config", "global"), { anything: true }));
  });
});
