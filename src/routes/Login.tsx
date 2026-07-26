import { useState } from "react";
import { useAuth } from "../lib/auth";
import { RabbitMark } from "../components/RabbitMark";
import { IconGoogle } from "../components/Icons";
import { BrandFooter } from "../components/BrandFooter";

export function Login() {
  const { signIn } = useAuth();
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
        <p className="login-promise">A subscription-free habit tracker.</p>
        <button className="google-btn" onClick={handleSignIn}>
          <IconGoogle />
          Continue with Google
        </button>
        {error && <p className="form-error">{error}</p>}
        <p className="login-note">
          Your habit data is private. No ads. No selling your data.
        </p>
        <BrandFooter />
      </div>
    </div>
  );
}
