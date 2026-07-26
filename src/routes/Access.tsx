import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/Toast";
import {
  approveRequest,
  clearRecord,
  declineRequest,
  revokeMember,
  setMemberRole,
  subscribeAccessRequests,
  subscribeMembers,
} from "../lib/admin";
import type { AccessRequest, AllowlistEntry } from "../lib/types";

/** Admin-only screen: who is waiting, who is in, and who was turned away. */
export function Access() {
  const { user, isAdmin, membership } = useAuth();
  const { show } = useToast();
  const [requests, setRequests] = useState<AccessRequest[] | undefined>(undefined);
  const [members, setMembers] = useState<AllowlistEntry[] | undefined>(undefined);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    const fail = () => show("Couldn't load the access list.", { hop: false });
    const unsubRequests = subscribeAccessRequests(setRequests, fail);
    const unsubMembers = subscribeMembers(setMembers, fail);
    return () => {
      unsubRequests();
      unsubMembers();
    };
  }, [isAdmin, show]);

  const pending = useMemo(
    () =>
      (requests ?? [])
        .filter((r) => r.status === "pending")
        .sort((a, b) => a.requestedAt - b.requestedAt),
    [requests],
  );
  const revoked = useMemo(
    () =>
      (requests ?? [])
        .filter((r) => r.status === "revoked")
        .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0)),
    [requests],
  );
  const roster = useMemo(
    () => [...(members ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [members],
  );

  if (membership === undefined) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  // Every action funnels through here so one failed write can't leave a row
  // looking like it succeeded.
  const run = async (key: string, message: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
      show(message, { hop: false });
    } catch {
      show("That didn't go through. Try again.", { hop: false });
    } finally {
      setBusy("");
    }
  };

  const adminEmail = user?.email ?? "";
  const requestFor = (email: string) => requests?.find((r) => r.email === email);

  return (
    <>
      <h1 className="page-title">Access</h1>

      <div className="card">
        <h2 className="card-title">
          Waiting{pending.length > 0 && <span className="chip">{pending.length}</span>}
        </h2>
        {requests === undefined ? (
          <div className="spinner" role="status" aria-label="Loading" />
        ) : pending.length === 0 ? (
          <p className="muted small">No one is waiting to be let in.</p>
        ) : (
          <ul className="access-list">
            {pending.map((r) => (
              <li key={r.email} className="access-row">
                <div className="access-person">
                  <strong>{r.displayName || r.email}</strong>
                  {r.displayName && <span className="muted small">{r.email}</span>}
                  {r.note && <p className="access-note">“{r.note}”</p>}
                  <span className="faint small">
                    Asked {new Date(r.requestedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="action-row">
                  <button
                    className="button button-primary button-small"
                    disabled={busy === r.email}
                    onClick={() =>
                      run(r.email, `${r.displayName || r.email} is in.`, () =>
                        approveRequest(r, adminEmail),
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="button button-ghost button-small"
                    disabled={busy === r.email}
                    onClick={() =>
                      run(r.email, "Request declined.", () =>
                        declineRequest(r, adminEmail),
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Members</h2>
        {members === undefined ? (
          <div className="spinner" role="status" aria-label="Loading" />
        ) : (
          <ul className="access-list">
            {roster.map((m) => {
              const isSelf = m.email === adminEmail;
              return (
                <li key={m.email} className="access-row">
                  <div className="access-person">
                    <strong>{m.displayName || m.email}</strong>
                    {m.displayName && <span className="muted small">{m.email}</span>}
                    <span className="faint small">
                      {m.role === "admin" ? "Admin" : "Member"}
                      {isSelf && " · you"}
                    </span>
                  </div>
                  {/* You can't revoke or demote yourself — that would lock the
                      last admin out of the app with no way back in. */}
                  {isSelf ? (
                    <span className="faint small">Your account</span>
                  ) : (
                    <div className="action-row">
                      <button
                        className="button button-ghost button-small"
                        disabled={busy === m.email}
                        onClick={() =>
                          run(
                            m.email,
                            m.role === "admin" ? "Now a member." : "Now an admin.",
                            () =>
                              setMemberRole(
                                m,
                                m.role === "admin" ? "member" : "admin",
                              ),
                          )
                        }
                      >
                        {m.role === "admin" ? "Make member" : "Make admin"}
                      </button>
                      <button
                        className="button button-danger button-small"
                        disabled={busy === m.email}
                        onClick={() =>
                          run(m.email, "Access revoked.", () =>
                            revokeMember(m, requestFor(m.email), adminEmail),
                          )
                        }
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="muted small">
          Revoking takes effect immediately — their habit data stays put in case
          you let them back in.
        </p>
      </div>

      {revoked.length > 0 && (
        <div className="card">
          <h2 className="card-title">Turned away</h2>
          <ul className="access-list">
            {revoked.map((r) => (
              <li key={r.email} className="access-row">
                <div className="access-person">
                  <strong>{r.displayName || r.email}</strong>
                  {r.displayName && <span className="muted small">{r.email}</span>}
                  <span className="faint small">
                    {r.decidedAt
                      ? `Decided ${new Date(r.decidedAt).toLocaleDateString()}`
                      : "Decided"}
                  </span>
                </div>
                <button
                  className="button button-ghost button-small"
                  disabled={busy === r.email}
                  onClick={() =>
                    run(r.email, "They can ask again now.", () =>
                      clearRecord(r.email),
                    )
                  }
                >
                  Let them ask again
                </button>
              </li>
            ))}
          </ul>
          <p className="muted small">
            While a record sits here, that account can't send another request.
          </p>
        </div>
      )}
    </>
  );
}
