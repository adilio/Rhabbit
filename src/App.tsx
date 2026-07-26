import { lazy, Suspense } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { usePendingRequestCount } from "./lib/admin";
import { Login } from "./routes/Login";
import { AccessGate } from "./routes/AccessGate";
import { Access } from "./routes/Access";
import { Onboarding } from "./routes/Onboarding";
import { Today } from "./routes/Today";
import { History } from "./routes/History";
import { Insights } from "./routes/Insights";
import { Settings } from "./routes/Settings";

// SheetJS is heavy; only fetch it when the importer is opened
const ImportPage = lazy(() =>
  import("./routes/ImportPage").then((m) => ({ default: m.ImportPage })),
);
import {
  IconCalendar,
  IconInsights,
  IconPeople,
  IconSettings,
  IconToday,
} from "./components/Icons";
import { RabbitMark } from "./components/RabbitMark";
import { ThemeToggle } from "./components/ThemeToggle";
import { PwaStatus } from "./components/PwaStatus";

export function App() {
  const { user, profile, membership, accessRequest, approved, isAdmin } = useAuth();
  const pendingCount = usePendingRequestCount(isAdmin);

  const resolving =
    user === undefined ||
    (user && (membership === undefined || accessRequest === undefined)) ||
    (approved && profile === undefined);

  if (resolving) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return <Login />;
  // Signed in but not on the allowlist: ask to be let in, then wait.
  if (!approved) return <AccessGate />;
  if (!profile) return <Onboarding />;

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main">
        Skip to today's habits
      </a>
      <aside className="sidebar" aria-label="Rhabbit navigation">
        <NavLink to="/" className="sidebar-brand">
          <RabbitMark className="sidebar-mark" />
          <span>
            <strong>Rhabbit</strong>
            <small>Take it one hop at a time</small>
          </span>
        </NavLink>
        <nav className="sidebar-links" aria-label="Main">
          <Tab to="/" label="Today" icon={<IconToday />} />
          <Tab to="/history" label="History" icon={<IconCalendar />} />
          <Tab to="/insights" label="Progress" icon={<IconInsights />} />
          <Tab to="/settings" label="Settings" icon={<IconSettings />} />
          {isAdmin && (
            <Tab
              to="/access"
              label="Access"
              icon={<IconPeople />}
              badge={pendingCount}
            />
          )}
        </nav>
        <div className="sidebar-footer">
          <ThemeToggle />
          <div className="sidebar-signature">A <strong>4dl</strong> App</div>
        </div>
      </aside>
      <main className="app-main" id="main">
        <header className="mobile-header">
          <NavLink to="/" className="brand">
            <RabbitMark className="brand-mark" />
            <span className="brand-name">Rhabbit</span>
          </NavLink>
          <ThemeToggle />
        </header>
        <div className="shell">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/history" element={<History />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/access" element={<Access />} />
          <Route
            path="/import"
            element={
              <Suspense
                fallback={<div className="spinner" role="status" aria-label="Loading" />}
              >
                <ImportPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </main>
      <nav className="tabbar" aria-label="Main">
        <Tab to="/" label="Today" icon={<IconToday />} />
        <Tab to="/history" label="History" icon={<IconCalendar />} />
        <Tab to="/insights" label="Progress" icon={<IconInsights />} />
        <Tab to="/settings" label="Settings" icon={<IconSettings />} />
        {isAdmin && (
          <Tab
            to="/access"
            label="Access"
            icon={<IconPeople />}
            badge={pendingCount}
          />
        )}
      </nav>
      <PwaStatus />
    </div>
  );
}

function Tab({
  to,
  label,
  icon,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Count of things waiting; hidden at zero. */
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `tab${isActive ? " active" : ""}`}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span className="tab-badge">
          {badge}
          <span className="sr-only"> waiting for a decision</span>
        </span>
      )}
    </NavLink>
  );
}
