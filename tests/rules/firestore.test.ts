import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const ADMIN = "adilio@gmail.com";
const ADMIN_UID = "uid-admin";
const MEMBER = "marla.dranfield@gmail.com";
const MEMBER_UID = "uid-member";
/** Added by hand in the console before roles existed — has no role field. */
const LEGACY = "legacy.friend@gmail.com";
const LEGACY_UID = "uid-legacy";
const STRANGER = "stranger@example.com";
const STRANGER_UID = "uid-stranger";
const DECLINED = "declined@example.com";
const DECLINED_UID = "uid-declined";

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
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "allowlist", ADMIN), { email: ADMIN, role: "admin" });
    await setDoc(doc(db, "allowlist", MEMBER), { email: MEMBER, role: "member" });
    await setDoc(doc(db, "allowlist", LEGACY), { added: true });
    // Someone who was already turned down. The record is what blocks them
    // from quietly asking again.
    await setDoc(doc(db, "accessRequests", DECLINED), {
      email: DECLINED,
      uid: DECLINED_UID,
      status: "revoked",
    });
  });
});

/** A signed-in, email-verified user. */
function asUser(uid: string, email: string) {
  return env.authenticatedContext(uid, { email, email_verified: true }).firestore();
}

const pendingRequest = (email: string, uid: string) => ({
  email,
  uid,
  displayName: "A Person",
  photoURL: "",
  note: "we met at a conference",
  status: "pending",
  requestedAt: 1_700_000_000_000,
  decidedAt: null,
  decidedBy: "",
});

describe("approved users", () => {
  it("can write and read their own habits", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    const ref = doc(db, `users/${MEMBER_UID}/habits/h1`);
    await assertSucceeds(setDoc(ref, { name: "Walk" }));
    await assertSucceeds(getDoc(ref));
  });

  it("can write entries and nested documents in their own subtree", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertSucceeds(
      setDoc(doc(db, `users/${MEMBER_UID}/entries/h1_2026-07-19`), { status: "complete" }),
    );
    await assertSucceeds(
      setDoc(doc(db, `users/${MEMBER_UID}/importBatches/b1`), { filename: "x.xlsx" }),
    );
  });

  it("can read their own allowlist document", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertSucceeds(getDoc(doc(db, "allowlist", MEMBER)));
  });

  // Rows predating the role field must keep working, or deploying these rules
  // would lock out everyone who was added from the console.
  it("still admits a legacy row that has no role field", async () => {
    const db = asUser(LEGACY_UID, LEGACY);
    await assertSucceeds(setDoc(doc(db, `users/${LEGACY_UID}/habits/h1`), { name: "Walk" }));
  });

  it("does not treat a legacy row as an admin", async () => {
    const db = asUser(LEGACY_UID, LEGACY);
    await assertFails(getDocs(collection(db, "accessRequests")));
    await assertFails(
      setDoc(doc(db, "allowlist", STRANGER), { email: STRANGER, role: "member" }),
    );
  });
});

describe("cross-user isolation", () => {
  // The rule requires both approval *and* uid ownership. This is the case
  // that would leak one household member's data to the other.
  it("denies an approved user reading another user's subtree", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${ADMIN_UID}/habits/h1`), { name: "Read" });
    });
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(getDoc(doc(db, `users/${ADMIN_UID}/habits/h1`)));
  });

  it("denies an approved user writing into another user's subtree", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(setDoc(doc(db, `users/${ADMIN_UID}/habits/h1`), { name: "Nope" }));
  });

  // Admin is an access-granting role, not a key to other people's habits.
  it("denies even an admin reading another user's subtree", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${MEMBER_UID}/habits/h1`), { name: "Read" });
    });
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(getDoc(doc(db, `users/${MEMBER_UID}/habits/h1`)));
  });
});

describe("users who are not approved", () => {
  it("denies reads and writes of their own subtree", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(getDoc(doc(db, `users/${STRANGER_UID}/habits/h1`)));
    await assertFails(setDoc(doc(db, `users/${STRANGER_UID}/habits/h1`), { name: "Nope" }));
  });

  it("denies reading someone else's allowlist document", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(getDoc(doc(db, "allowlist", ADMIN)));
  });

  // Reading your own (absent) row is how the app tells "not approved" from
  // "still loading" without a server.
  it("allows reading their own absent allowlist document", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertSucceeds(getDoc(doc(db, "allowlist", STRANGER)));
  });
});

describe("requesting access", () => {
  it("lets a signed-in stranger file a pending request for themselves", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertSucceeds(
      setDoc(doc(db, "accessRequests", STRANGER), pendingRequest(STRANGER, STRANGER_UID)),
    );
    await assertSucceeds(getDoc(doc(db, "accessRequests", STRANGER)));
  });

  // The whole point of the gate: asking must not be the same as being let in.
  it("denies a request that declares itself already approved", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(
      setDoc(doc(db, "accessRequests", STRANGER), {
        ...pendingRequest(STRANGER, STRANGER_UID),
        status: "approved",
      }),
    );
  });

  it("denies filing a request under someone else's address", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(
      setDoc(doc(db, "accessRequests", MEMBER), pendingRequest(MEMBER, STRANGER_UID)),
    );
  });

  it("denies a request whose uid does not match the caller", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(
      setDoc(doc(db, "accessRequests", STRANGER), pendingRequest(STRANGER, ADMIN_UID)),
    );
  });

  it("denies a requester deciding their own request", async () => {
    const db = asUser(DECLINED_UID, DECLINED);
    await assertFails(
      updateDoc(doc(db, "accessRequests", DECLINED), { status: "approved" }),
    );
  });

  // A revoked record already occupies the document, so re-requesting is an
  // update, and updates are admin-only.
  it("denies a turned-away account from asking again", async () => {
    const db = asUser(DECLINED_UID, DECLINED);
    await assertFails(
      setDoc(doc(db, "accessRequests", DECLINED), pendingRequest(DECLINED, DECLINED_UID)),
    );
  });

  it("denies a turned-away account from erasing its own record", async () => {
    const db = asUser(DECLINED_UID, DECLINED);
    await assertFails(deleteDoc(doc(db, "accessRequests", DECLINED)));
  });

  it("denies a non-admin listing everyone's requests", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(getDocs(collection(db, "accessRequests")));
  });

  it("denies reading someone else's request", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(getDoc(doc(db, "accessRequests", DECLINED)));
  });
});

describe("admins", () => {
  it("can list the roster and the requests", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(getDocs(collection(db, "allowlist")));
    await assertSucceeds(getDocs(collection(db, "accessRequests")));
  });

  it("can grant access", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(
      setDoc(doc(db, "allowlist", STRANGER), {
        email: STRANGER,
        role: "member",
        displayName: "A Person",
        approvedAt: 1_700_000_000_000,
        approvedBy: ADMIN,
      }),
    );
  });

  it("can decide a request", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(
      updateDoc(doc(db, "accessRequests", DECLINED), {
        email: DECLINED,
        status: "approved",
        decidedBy: ADMIN,
      }),
    );
  });

  it("can clear a record so the account may ask again", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(deleteDoc(doc(db, "accessRequests", DECLINED)));
  });

  // Revoking someone added straight from the console has no request row to
  // update, so the admin has to be able to create the record outright.
  it("can create a revoked record for someone who never asked", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(
      setDoc(doc(db, "accessRequests", MEMBER), {
        email: MEMBER,
        uid: "",
        status: "revoked",
        decidedBy: ADMIN,
      }),
    );
  });

  it("can revoke another member", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(deleteDoc(doc(db, "allowlist", MEMBER)));
  });

  it("can promote a member to admin", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertSucceeds(
      updateDoc(doc(db, "allowlist", MEMBER), { email: MEMBER, role: "admin" }),
    );
  });

  it("cannot grant a role that does not exist", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(
      setDoc(doc(db, "allowlist", STRANGER), { email: STRANGER, role: "superuser" }),
    );
  });

  it("cannot write a row whose email disagrees with its document id", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(
      setDoc(doc(db, "allowlist", STRANGER), { email: MEMBER, role: "member" }),
    );
  });

  // Both of these would strand the app with no one able to let anyone in.
  it("cannot revoke themselves", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(deleteDoc(doc(db, "allowlist", ADMIN)));
  });

  it("cannot demote themselves", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(
      updateDoc(doc(db, "allowlist", ADMIN), { email: ADMIN, role: "member" }),
    );
  });
});

describe("the allowlist itself", () => {
  // Self-promotion is the attack this blocks: writing your own allowlist row
  // would otherwise grant you the whole app.
  it("cannot be self-granted by a stranger", async () => {
    const db = asUser(STRANGER_UID, STRANGER);
    await assertFails(
      setDoc(doc(db, "allowlist", STRANGER), { email: STRANGER, role: "member" }),
    );
  });

  it("cannot be self-promoted by an ordinary member", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(
      updateDoc(doc(db, "allowlist", MEMBER), { email: MEMBER, role: "admin" }),
    );
  });

  it("cannot be listed by an ordinary member", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(getDocs(collection(db, "allowlist")));
  });

  it("cannot be edited by a member to revoke someone else", async () => {
    const db = asUser(MEMBER_UID, MEMBER);
    await assertFails(deleteDoc(doc(db, "allowlist", ADMIN)));
  });
});

describe("unverified email", () => {
  // Google sign-in normally implies a verified email, but the rules check it
  // explicitly, so an unverified token must not pass.
  it("denies an otherwise-approved user whose email is unverified", async () => {
    const db = env
      .authenticatedContext(MEMBER_UID, { email: MEMBER, email_verified: false })
      .firestore();
    await assertFails(getDoc(doc(db, `users/${MEMBER_UID}/habits/h1`)));
    await assertFails(setDoc(doc(db, `users/${MEMBER_UID}/habits/h1`), { name: "Nope" }));
  });

  it("denies an unverified account from requesting access", async () => {
    const db = env
      .authenticatedContext(STRANGER_UID, { email: STRANGER, email_verified: false })
      .firestore();
    await assertFails(
      setDoc(doc(db, "accessRequests", STRANGER), pendingRequest(STRANGER, STRANGER_UID)),
    );
  });
});

describe("unauthenticated access", () => {
  it("denies all reads and writes", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `users/${MEMBER_UID}/habits/h1`)));
    await assertFails(setDoc(doc(db, `users/${MEMBER_UID}/habits/h1`), { name: "Nope" }));
    await assertFails(getDoc(doc(db, "allowlist", ADMIN)));
    await assertFails(
      setDoc(doc(db, "accessRequests", STRANGER), pendingRequest(STRANGER, STRANGER_UID)),
    );
  });
});

describe("collections the rules do not mention", () => {
  it("denies access to any path outside the three named collections", async () => {
    const db = asUser(ADMIN_UID, ADMIN);
    await assertFails(getDoc(doc(db, "config", "global")));
    await assertFails(setDoc(doc(db, "config", "global"), { anything: true }));
  });
});
