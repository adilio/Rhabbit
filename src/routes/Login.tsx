import { useState } from "react";
import { useAuth } from "../lib/auth";
import { RabbitMark } from "../components/RabbitMark";
import { IconGoogle } from "../components/Icons";

export function Login({ denied }: { denied: boolean }) {
  const { signIn, signOut, user } = useAuth();
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    try {
      await signIn();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (!code.includes("popup-closed") && !code.includes("cancelled")) {
        setError("Sign-in didn't work. Give it another try.");
      }
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <RabbitMark className="login-mark" />
        <h1>Rhabbit</h1>
        <p className="login-tagline">Take it one hop at a time.</p>
        {denied && user ? (
          <>
            <p className="muted login-denied">
              <strong>{user.email}</strong> isn't on the guest list for this
              burrow. Rhabbit is a private app for Adil &amp; Marla.
            </p>
            <button className="button button-ghost" onClick={signOut}>
              Sign out and try another account
            </button>
          </>
        ) : (
          <button className="google-btn" onClick={handleSignIn}>
            <IconGoogle />
            Continue with Google
          </button>
        )}
        {error && <p className="form-error">{error}</p>}
        <p className="login-note">
          Your habit data is private. No ads. No selling your data.
        </p>
      </div>
    </div>
  );
}
