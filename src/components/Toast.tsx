import {
  createContext,
  useCallback,
  useContext,
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 260);
  }, []);

  const show = useCallback(
    (text: string, opts?: { hop?: boolean; undo?: () => void }) => {
      const id = nextId++;
      setToasts((ts) => [
        // Keep at most one older toast so logging quickly never stacks a wall
        ...ts.slice(-1),
        { id, text, hop: opts?.hop ?? true, leaving: false, undo: opts?.undo },
      ]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), opts?.undo ? 5000 : 2200),
      );
    },
    [dismiss],
  );

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
