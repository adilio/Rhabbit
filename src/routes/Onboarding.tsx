import { useState } from "react";
import { useAuth } from "../lib/auth";
import { RabbitMark } from "../components/RabbitMark";

export function Onboarding() {
  const { user, saveProfile } = useAuth();
  const [name, setName] = useState(user?.displayName?.split(" ")[0] ?? "");
  const [weekStartsOn, setWeekStartsOn] = useState<"sunday" | "monday">("sunday");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveProfile({
        displayName: name.trim(),
        weekStartsOn,
        createdAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login">
      <RabbitMark className="login-mark" />
      <h1>Welcome</h1>
      <p className="login-tagline">Let's set up your burrow.</p>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 340, textAlign: "left" }}>
        <label className="field">
          <span className="field-label">What should Rhabbit call you?</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            required
          />
        </label>
        <div className="field">
          <span className="field-label">Week starts on</span>
          <div className="seg">
            {(["sunday", "monday"] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={weekStartsOn === d ? "on" : ""}
                onClick={() => setWeekStartsOn(d)}
              >
                {d === "sunday" ? "Sunday" : "Monday"}
              </button>
            ))}
          </div>
        </div>
        <button
          className="button button-primary button-block"
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving…" : "Hop in"}
        </button>
      </form>
    </div>
  );
}
