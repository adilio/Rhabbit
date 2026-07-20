import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { useTheme, type ThemePref } from "../lib/theme";
import { exportCsv, exportJson } from "../lib/export";
import { useToast } from "../components/Toast";

export function Settings() {
  const { profile, user, saveProfile, signOut } = useAuth();
  const { habits, entries, batches, undoImport, saveHabit } = useStore();
  const { pref, setPref } = useTheme();
  const { show } = useToast();
  const [name, setName] = useState(profile?.displayName ?? "");

  const archived = (habits ?? []).filter((h) => h.archivedAt);

  return (
    <>
      <h1 className="page-title">Settings</h1>

      <div className="card">
        <h2 className="card-title">Profile</h2>
        <label className="field">
          <span className="field-label">Display name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span className="field-label">Week starts on</span>
          <div className="seg">
            {(["sunday", "monday"] as const).map((d) => (
              <button
                key={d}
                className={profile?.weekStartsOn === d ? "on" : ""}
                onClick={() => void saveProfile({ weekStartsOn: d })}
              >
                {d === "sunday" ? "Sunday" : "Monday"}
              </button>
            ))}
          </div>
        </div>
        {name.trim() && name.trim() !== profile?.displayName && (
          <button
            className="button button-primary button-small"
            onClick={() => {
              void saveProfile({ displayName: name.trim() });
              show("Saved.", { hop: false });
            }}
          >
            Save name
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Appearance</h2>
        <div className="seg">
          {(["system", "dark", "light"] as ThemePref[]).map((t) => (
            <button key={t} className={pref === t ? "on" : ""} onClick={() => setPref(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Your data</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Your habit data is private. No ads. No selling your data.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link to="/import" className="button button-ghost button-small">
            Import a spreadsheet
          </Link>
          <button
            className="button button-ghost button-small"
            onClick={() => profile && exportJson(profile, habits ?? [], entries)}
          >
            Export JSON
          </button>
          <button
            className="button button-ghost button-small"
            onClick={() => exportCsv(habits ?? [], entries)}
          >
            Export CSV
          </button>
        </div>
        {batches.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <span className="field-label">Imports</span>
            {batches.map((b) => (
              <div key={b.id} className="settings-row">
                <div>
                  <div className="settings-row-label">{b.filename}</div>
                  <div className="settings-row-sub">
                    {new Date(b.importedAt).toLocaleDateString()} · {b.entryCount} entries
                  </div>
                </div>
                <button
                  className="button button-danger button-small"
                  onClick={() => {
                    void undoImport(b.id);
                    show("Import removed.", { hop: false });
                  }}
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <div className="card">
          <h2 className="card-title">Archived habits</h2>
          <div className="settings-list">
            {archived.map((h) => (
              <div key={h.id} className="settings-row">
                <div className="settings-row-label">
                  {h.emoji && `${h.emoji} `}
                  {h.name}
                </div>
                <button
                  className="button button-ghost button-small"
                  onClick={() => void saveHabit({ ...h, archivedAt: null })}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Account</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Signed in as {user?.email}
        </p>
        <button className="button button-ghost" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>

      <p className="faint small" style={{ textAlign: "center", margin: "24px 0" }}>
        Rhabbit · a{" "}
        <a href="https://4dl.ca" target="_blank" rel="noreferrer">
          4dl app
        </a>{" "}
        · take it one hop at a time 🐇
      </p>
    </>
  );
}
