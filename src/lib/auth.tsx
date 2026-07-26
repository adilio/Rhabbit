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
import type { AccessRequest, AllowlistEntry, Profile } from "./types";
import { demoProfile, isDemoMode } from "./demo";

interface AuthState {
  /** undefined = still resolving, null = signed out */
  user: User | null | undefined;
  /** undefined = loading, null = no profile yet (first run) */
  profile: Profile | null | undefined;
  /** undefined = loading, null = not approved (no allowlist row) */
  membership: AllowlistEntry | null | undefined;
  /** undefined = loading, null = never asked for access */
  accessRequest: AccessRequest | null | undefined;
  /** True once the allowlist row exists — the app is unlocked. */
  approved: boolean;
  /** True when that row carries role "admin". */
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (p: Partial<Profile>) => Promise<void>;
  requestAccess: (note: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>(null as never);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [membership, setMembership] = useState<
    AllowlistEntry | null | undefined
  >(undefined);
  const [accessRequest, setAccessRequest] = useState<
    AccessRequest | null | undefined
  >(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Access state. Both documents are keyed by the email in the ID token and
  // are readable by their own owner, so an unapproved visitor can still see
  // exactly where they stand without any server involved.
  useEffect(() => {
    if (isDemoMode) return;
    const email = user?.email;
    if (!email) {
      const settled = user === null ? null : undefined;
      setMembership(settled);
      setAccessRequest(settled);
      return;
    }
    setMembership(undefined);
    setAccessRequest(undefined);
    const unsubMember = onSnapshot(
      doc(db, "allowlist", email),
      (snap) =>
        setMembership(snap.exists() ? (snap.data() as AllowlistEntry) : null),
      () => setMembership(null),
    );
    const unsubRequest = onSnapshot(
      doc(db, "accessRequests", email),
      (snap) =>
        setAccessRequest(snap.exists() ? (snap.data() as AccessRequest) : null),
      () => setAccessRequest(null),
    );
    return () => {
      unsubMember();
      unsubRequest();
    };
  }, [user]);

  // The profile lives inside the user's own subtree, which the rules keep
  // locked until the allowlist row exists — so only subscribe once approved.
  useEffect(() => {
    if (isDemoMode) return;
    if (!user || !membership) {
      setProfile(user === null || membership === null ? null : undefined);
      return;
    }
    setProfile(undefined);
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => setProfile(snap.exists() ? (snap.data() as Profile) : null),
      () => setProfile(null),
    );
  }, [user, membership]);

  if (isDemoMode) {
    return (
      <AuthContext.Provider
        value={{
          user: { uid: "demo", email: demoProfile.email } as User,
          profile: demoProfile,
          membership: {
            email: demoProfile.email,
            role: "member",
            displayName: demoProfile.displayName,
            approvedAt: demoProfile.createdAt,
            approvedBy: demoProfile.email,
          },
          accessRequest: null,
          approved: true,
          isAdmin: false,
          signIn: async () => {},
          signOut: async () => {},
          saveProfile: async () => {},
          requestAccess: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

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

  // Files the request the admin screen will show. The rules only accept a
  // create here, so asking again after a decision fails loudly instead of
  // overwriting the decision that was already made.
  const requestAccess = async (note: string) => {
    if (!user?.email) return;
    const request: AccessRequest = {
      email: user.email,
      uid: user.uid,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      note: note.trim().slice(0, 500),
      status: "pending",
      requestedAt: Date.now(),
      decidedAt: null,
      decidedBy: "",
    };
    await setDoc(doc(db, "accessRequests", user.email), request);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        membership,
        accessRequest,
        approved: !!membership,
        isAdmin: membership?.role === "admin",
        signIn,
        signOut,
        saveProfile,
        requestAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
