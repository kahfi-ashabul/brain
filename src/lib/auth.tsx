import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { ref, onValue, set, update, onDisconnect } from 'firebase/database';
import { auth, db, googleProvider } from './firebase';
import {
  UserProfile,
  defaultProfile,
  AVATARS,
} from './types';

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (nickname: string, avatar: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'kei-user-profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocalProfile = useCallback((): UserProfile | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const saveLocalProfile = useCallback((profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, []);

  const syncProfileFromDB = useCallback(
    (uid: string, fallback: UserProfile) => {
      const profileRef = ref(db, `users/${uid}`);
      onValue(profileRef, (snap) => {
        const dbData = snap.val();
        if (dbData) {
          const merged: UserProfile = { ...fallback, ...dbData, uid };
          setUser(merged);
          saveLocalProfile(merged);
        } else {
          set(profileRef, fallback).catch(() => {});
          setUser(fallback);
          saveLocalProfile(fallback);
        }
      });
    },
    [saveLocalProfile]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const local = loadLocalProfile();
        const nickname =
          local?.nickname || fbUser.displayName || `Player${Math.floor(Math.random() * 9999)}`;
        const avatar = local?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
        const isGuest = fbUser.isAnonymous;
        const fallback = defaultProfile(fbUser.uid, nickname, avatar, isGuest);
        syncProfileFromDB(fbUser.uid, fallback);
        onDisconnect(ref(db, `users/${fbUser.uid}/online`)).set(false);
        update(ref(db, `users/${fbUser.uid}`), { online: true });
        setLoading(false);
      } else {
        const local = loadLocalProfile();
        if (local) {
          setUser(local);
        }
        setFirebaseUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadLocalProfile, syncProfileFromDB]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed, using local fallback:', err);
      const local = loadLocalProfile();
      const uid = local?.uid || `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const nickname = local?.nickname || `Player${Math.floor(Math.random() * 9999)}`;
      const avatar = local?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const profile = defaultProfile(uid, nickname, avatar, true);
      setUser(profile);
      saveLocalProfile(profile);
      setLoading(false);
    }
  }, [loadLocalProfile, saveLocalProfile]);

  const signInAsGuest = useCallback(
    async (nickname: string, avatar: string) => {
      try {
        const cred = await signInAnonymously(auth);
        const profile = defaultProfile(cred.user.uid, nickname, avatar, true);
        set(ref(db, `users/${cred.user.uid}`), { ...profile, online: true });
        setUser(profile);
        saveLocalProfile(profile);
      } catch (err) {
        console.error('Anonymous auth failed, using local fallback:', err);
        const uid = `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const profile = defaultProfile(uid, nickname, avatar, true);
        setUser(profile);
        saveLocalProfile(profile);
      }
    },
    [saveLocalProfile]
  );

  const signOut = useCallback(async () => {
    if (firebaseUser) {
      await update(ref(db, `users/${firebaseUser.uid}`), { online: false });
    }
    try {
      await fbSignOut(auth);
    } catch {
      /* noop */
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setFirebaseUser(null);
  }, [firebaseUser]);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        saveLocalProfile(next);
        if (firebaseUser && !prev.isGuest) {
          update(ref(db, `users/${firebaseUser.uid}`), updates).catch(() => {});
        }
        return next;
      });
    },
    [firebaseUser, saveLocalProfile]
  );

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signInWithGoogle, signInAsGuest, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
