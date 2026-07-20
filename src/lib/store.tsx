import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import type { Entry, Habit, ImportBatch } from "./types";
import { demoEntries, demoHabits, isDemoMode } from "./demo";

interface Store {
  habits: Habit[] | undefined;
  /** Keyed by `${habitId}_${date}` for O(1) day lookups. */
  entriesByKey: Map<string, Entry>;
  entries: Entry[];
  batches: ImportBatch[];
  loading: boolean;
  saveHabit: (h: Omit<Habit, "id"> & { id?: string }) => Promise<string>;
  deleteHabit: (id: string) => Promise<void>;
  setEntry: (habitId: string, date: string, patch: Partial<Entry>) => Promise<void>;
  clearEntry: (habitId: string, date: string) => Promise<void>;
  commitImport: (
    batch: ImportBatch,
    newHabits: Habit[],
    newEntries: Entry[],
  ) => Promise<void>;
  undoImport: (batchId: string) => Promise<void>;
}

const StoreContext = createContext<Store>(null as never);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [habits, setHabits] = useState<Habit[] | undefined>(isDemoMode ? demoHabits : undefined);
  const [entries, setEntries] = useState<Entry[]>(isDemoMode ? demoEntries : []);
  const [entriesLoaded, setEntriesLoaded] = useState(isDemoMode);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  useEffect(() => {
    if (isDemoMode) return;
    if (!uid) {
      setHabits(undefined);
      setEntries([]);
      setEntriesLoaded(false);
      setBatches([]);
      return;
    }
    const unsubs = [
      onSnapshot(
        query(collection(db, "users", uid, "habits"), orderBy("position")),
        (snap) =>
          setHabits(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Habit),
          ),
        () => setHabits([]),
      ),
      onSnapshot(
        collection(db, "users", uid, "entries"),
        (snap) => {
          setEntries(snap.docs.map((d) => d.data() as Entry));
          setEntriesLoaded(true);
        },
        () => setEntriesLoaded(true),
      ),
      onSnapshot(
        query(collection(db, "users", uid, "importBatches"), orderBy("importedAt", "desc")),
        (snap) =>
          setBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ImportBatch)),
        () => setBatches([]),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const entriesByKey = useMemo(
    () => new Map(entries.map((e) => [`${e.habitId}_${e.date}`, e])),
    [entries],
  );

  const saveHabit = async (h: Omit<Habit, "id"> & { id?: string }) => {
    if (isDemoMode) {
      const id = h.id ?? `demo-${Date.now()}`;
      setHabits((current) => [...(current ?? []).filter((item) => item.id !== id), { ...h, id } as Habit].sort((a, b) => a.position - b.position));
      return id;
    }
    if (!uid) throw new Error("not signed in");
    const { id, ...data } = h;
    const ref = id
      ? doc(db, "users", uid, "habits", id)
      : doc(collection(db, "users", uid, "habits"));
    await setDoc(ref, data, { merge: true });
    return ref.id;
  };

  const deleteHabit = async (id: string) => {
    if (isDemoMode) {
      setHabits((current) => (current ?? []).filter((h) => h.id !== id));
      setEntries((current) => current.filter((e) => e.habitId !== id));
      return;
    }
    if (!uid) throw new Error("not signed in");
    await deleteDoc(doc(db, "users", uid, "habits", id));
    const mine = entries.filter((e) => e.habitId === id);
    for (let i = 0; i < mine.length; i += 450) {
      const batch = writeBatch(db);
      for (const e of mine.slice(i, i + 450)) {
        batch.delete(doc(db, "users", uid, "entries", `${e.habitId}_${e.date}`));
      }
      await batch.commit();
    }
  };

  const setEntry = async (habitId: string, date: string, patch: Partial<Entry>) => {
    if (isDemoMode) {
      setEntries((current) => {
        const next: Entry = { habitId, date, status: null, value: null, note: "", completedAt: null, importBatchId: null, ...patch };
        return [...current.filter((e) => !(e.habitId === habitId && e.date === date)), next];
      });
      return;
    }
    if (!uid) throw new Error("not signed in");
    await setDoc(
      doc(db, "users", uid, "entries", `${habitId}_${date}`),
      { habitId, date, importBatchId: null, note: "", ...stripUndefined(patch) },
      { merge: true },
    );
  };

  const clearEntry = async (habitId: string, date: string) => {
    if (isDemoMode) {
      setEntries((current) => current.filter((e) => !(e.habitId === habitId && e.date === date)));
      return;
    }
    if (!uid) throw new Error("not signed in");
    await deleteDoc(doc(db, "users", uid, "entries", `${habitId}_${date}`));
  };

  const commitImport = async (
    meta: ImportBatch,
    newHabits: Habit[],
    newEntries: Entry[],
  ) => {
    if (!uid) throw new Error("not signed in");
    // Habits + batch record first, then entries in chunks (500 op limit)
    const head = writeBatch(db);
    head.set(doc(db, "users", uid, "importBatches", meta.id), meta);
    for (const h of newHabits) {
      const { id, ...data } = h;
      head.set(doc(db, "users", uid, "habits", id), data);
    }
    await head.commit();
    for (let i = 0; i < newEntries.length; i += 450) {
      const batch = writeBatch(db);
      for (const e of newEntries.slice(i, i + 450)) {
        batch.set(doc(db, "users", uid, "entries", `${e.habitId}_${e.date}`), e);
      }
      await batch.commit();
    }
  };

  const undoImport = async (batchId: string) => {
    if (!uid) throw new Error("not signed in");
    const mine = entries.filter((e) => e.importBatchId === batchId);
    for (let i = 0; i < mine.length; i += 450) {
      const batch = writeBatch(db);
      for (const e of mine.slice(i, i + 450)) {
        batch.delete(doc(db, "users", uid, "entries", `${e.habitId}_${e.date}`));
      }
      await batch.commit();
    }
    await deleteDoc(doc(db, "users", uid, "importBatches", batchId));
  };

  return (
    <StoreContext.Provider
      value={{
        habits,
        entries,
        entriesByKey,
        batches,
        loading: habits === undefined || !entriesLoaded,
        saveHabit,
        deleteHabit,
        setEntry,
        clearEntry,
        commitImport,
        undoImport,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

function stripUndefined<T extends object>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

// deleteField re-export spares screens a direct firestore import
export { deleteField };

export const useStore = () => useContext(StoreContext);
