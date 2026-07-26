import { useState } from "react";
import { useAuth } from "../lib/auth";
import { RabbitMark } from "../components/RabbitMark";
import { BrandFooter } from "../components/BrandFooter";

/**
 * Where a signed-in but unapproved account lands: ask to be let in, then see
 * where that ask stands. Approval flips `membership` on and this screen is
 * replaced without anyone needing to sign in again.
 */
export function AccessGate() {
  const { user, accessRequest, signOut, requestAccess } = useAuth();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await requestAccess(note);
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <RabbitMark className="login-mark" />
        <h1>Rhabbit</h1>
        <p className="login-tagline">Take it one hop at a time.</p>
        <p className="muted access-who">
          Signed in as <strong>{user?.email}</strong>
        </p>

        {accessRequest === null && (
          <form className="access-form" onSubmit={handleRequest}>
            <p className="muted">
              Rhabbit is open to Adil's close friends. Send him a note and he'll
              let you in.
            </p>
            <label className="field-label" htmlFor="access-note">
              How do you know Adil? <span className="faint">(optional)</span>
            </label>
            <textarea
              id="access-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="We worked together at…"
            />
            <button
              className="button button-primary button-block"
              type="submit"
              disabled={sending}
            >
              {sending ? "Sending…" : "Request access"}
            </button>
          </form>
        )}

        {accessRequest?.status === "pending" && (
          <p className="muted access-status">
            Your request is with Adil. You'll come straight in the next time you
            open Rhabbit after he approves it — no need to sign up again.
          </p>
        )}

        {accessRequest?.status === "revoked" && (
          <p className="muted access-status">
            This account doesn't have access to Rhabbit. If you think that's a
            mistake, reach out to Adil directly.
          </p>
        )}

        {accessRequest?.status === "approved" && (
          <p className="muted access-status">
            Access for this account has ended. Reach out to Adil if you'd like
            it back.
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="button button-ghost" onClick={signOut}>
          Sign out and try another account
        </button>
        <BrandFooter />
      </div>
    </div>
  );
}
