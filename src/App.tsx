import { lazy, Suspense } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { Login } from "./routes/Login";
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
  IconSettings,
  IconToday,
} from "./components/Icons";
import { RabbitMark } from "./components/RabbitMark";
import { ThemeToggle } from "./components/ThemeToggle";
import { PwaStatus } from "./components/PwaStatus";

export function App() {
  const { user, profile, denied } = useAuth();

  if (user === undefined || (user && profile === undefined)) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!user || denied) return <Login denied={denied} />;
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
      </nav>
      <PwaStatus />
    </div>
  );
}

function Tab({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `tab${isActive ? " active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
