import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import type { Profile } from "./types";

interface AuthState {
  /** undefined = still resolving, null = signed out */
  user: User | null | undefined;
  /** undefined = loading, null = no profile yet (first run) */
  profile: Profile | null | undefined;
  /** True when Firestore rejected reads — the signed-in Google account
      isn't on the allowlist. */
  denied: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (p: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthState>(null as never);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [denied, setDenied] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setProfile(user === null ? null : undefined);
      setDenied(false);
      return;
    }
    setProfile(undefined);
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setDenied(false);
        setProfile(snap.exists() ? (snap.data() as Profile) : null);
      },
      (err) => {
        // permission-denied here means the account is not allowlisted
        if (err.code === "permission-denied") setDenied(true);
        setProfile(null);
      },
    );
    return unsub;
  }, [user]);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const saveProfile = async (p: Partial<Profile>) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email ?? "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...p,
      },
      { merge: true },
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, denied, signIn, signOut, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
