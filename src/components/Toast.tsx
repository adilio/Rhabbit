import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  id: number;
  text: string;
  hop: boolean;
  leaving: boolean;
  undo?: () => void;
}

const ToastContext = createContext<{
  show: (text: string, opts?: { hop?: boolean; undo?: () => void }) => void;
}>({ show: () => {} });

let nextId = 1;

/** Undo-bearing toasts linger — this is the product's forgiveness mechanism,
    not a notification. Plain confirmations still get out of the way quickly. */
const UNDO_MS = 9000;
const PLAIN_MS = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const lastUndo = useRef<{ id: number; undo: () => void } | null>(null);

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    if (lastUndo.current?.id === id) lastUndo.current = null;
    setToasts((ts) => ts.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 260);
  }, []);

  const show = useCallback(
    (text: string, opts?: { hop?: boolean; undo?: () => void }) => {
      const id = nextId++;
      const item: ToastItem = {
        id,
        text,
        hop: opts?.hop ?? true,
        leaving: false,
        undo: opts?.undo,
      };
      setToasts((ts) => {
        const prev = ts[ts.length - 1];
        // Logging several habits quickly shouldn't stack duplicates of the same
        // sentence — replace an identical live toast instead of piling on.
        if (prev && !prev.leaving && prev.text === text) {
          const old = timers.current.get(prev.id);
          if (old) clearTimeout(old);
          timers.current.delete(prev.id);
          return [...ts.slice(0, -1), item];
        }
        return [...ts.slice(-1), item];
      });
      if (opts?.undo) lastUndo.current = { id, undo: opts.undo };
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), opts?.undo ? UNDO_MS : PLAIN_MS),
      );
    },
    [dismiss],
  );

  // The Undo button is the last focusable element in the document and lives on
  // a timer, so it is effectively unreachable by keyboard. Cmd/Ctrl+Z is the
  // real keyboard path to it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "z" && e.key !== "Z") return;
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      // Never steal undo from a field the user is typing in.
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
      const pending = lastUndo.current;
      if (!pending) return;
      e.preventDefault();
      pending.undo();
      dismiss(pending.id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-zone" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.leaving ? " leaving" : ""}`}>
            {t.hop && (
              <span className="toast-hop" aria-hidden="true">
                🐇
              </span>
            )}
            <span>{t.text}</span>
            {t.undo && (
              <button
                aria-keyshortcuts="Control+Z Meta+Z"
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
