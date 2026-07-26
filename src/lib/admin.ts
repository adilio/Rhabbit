import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AccessRequest, AccessRole, AllowlistEntry } from "./types";

/**
 * Access administration. Every write here is also enforced by the Firestore
 * rules — these helpers exist to keep the two documents that describe one
 * person (their allowlist row and their request record) in step.
 */

/** Live roster of everyone who has ever asked for access. */
export function subscribeAccessRequests(
  onChange: (requests: AccessRequest[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "accessRequests"),
    (snap) => onChange(snap.docs.map((d) => d.data() as AccessRequest)),
    onError,
  );
}

/** Live roster of everyone who currently has access. */
export function subscribeMembers(
  onChange: (members: AllowlistEntry[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "allowlist"),
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          // Rows added by hand in the console predate these fields, so fall
          // back to the document id rather than rendering blanks.
          email: d.id,
          role: "member" as AccessRole,
          displayName: "",
          approvedAt: 0,
          approvedBy: "",
          ...(d.data() as Partial<AllowlistEntry>),
        })),
      ),
    onError,
  );
}

/** Grants access and stamps the request as approved, atomically. */
export async function approveRequest(request: AccessRequest, adminEmail: string) {
  const batch = writeBatch(db);
  const entry: AllowlistEntry = {
    email: request.email,
    role: "member",
    displayName: request.displayName,
    approvedAt: Date.now(),
    approvedBy: adminEmail,
  };
  batch.set(doc(db, "allowlist", request.email), entry);
  batch.update(doc(db, "accessRequests", request.email), {
    status: "approved",
    decidedAt: Date.now(),
    decidedBy: adminEmail,
  });
  await batch.commit();
}

/** Turns down a pending request without ever granting access. */
export async function declineRequest(request: AccessRequest, adminEmail: string) {
  await updateDoc(doc(db, "accessRequests", request.email), {
    status: "revoked",
    decidedAt: Date.now(),
    decidedBy: adminEmail,
  });
}

/**
 * Takes access away and leaves a revoked record behind. The record is what
 * stops the account from silently re-requesting the next day.
 */
export async function revokeMember(
  member: AllowlistEntry,
  request: AccessRequest | undefined,
  adminEmail: string,
) {
  const record: AccessRequest = request
    ? { ...request }
    : {
        // Someone added straight to the allowlist has no request to update, so
        // synthesize the record from what the roster knows.
        email: member.email,
        uid: "",
        displayName: member.displayName,
        photoURL: "",
        note: "",
        status: "revoked",
        requestedAt: member.approvedAt,
        decidedAt: null,
        decidedBy: "",
      };
  record.status = "revoked";
  record.decidedAt = Date.now();
  record.decidedBy = adminEmail;

  const batch = writeBatch(db);
  batch.delete(doc(db, "allowlist", member.email));
  batch.set(doc(db, "accessRequests", member.email), record);
  await batch.commit();
}

/** Promotes a member to admin, or demotes one back to member. */
export async function setMemberRole(member: AllowlistEntry, role: AccessRole) {
  await updateDoc(doc(db, "allowlist", member.email), {
    email: member.email,
    role,
  });
}

/**
 * Count of people waiting, for the nav badge. Only admins may list the
 * collection, so `enabled` keeps everyone else from provoking a denied read.
 */
export function usePendingRequestCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    return subscribeAccessRequests(
      (requests) =>
        setCount(requests.filter((r) => r.status === "pending").length),
      () => setCount(0),
    );
  }, [enabled]);
  return count;
}

/** Forgets a decision entirely, which lets that account ask again. */
export async function clearRecord(email: string) {
  await deleteDoc(doc(db, "accessRequests", email));
}
