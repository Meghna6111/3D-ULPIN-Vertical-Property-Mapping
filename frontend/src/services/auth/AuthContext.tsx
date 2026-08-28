import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { PropertyStore } from '../storage/PropertyStore';

interface AuthContextType {
  user: User | null;
  mockUser: { uid: string; email: string } | null;
  token: string | null;
  loading: boolean;
  isDevAuth: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  loginDevMock: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mockUser, setMockUser] = useState<{ uid: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isDevAuth = import.meta.env.VITE_FIREBASE_API_KEY === 'mock-api-key';

  useEffect(() => {
    if (isDevAuth) {
      const savedMock = localStorage.getItem('ulpin-mock-user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        setMockUser(parsed);
        setToken(parsed.uid);
        PropertyStore.setAuthToken(parsed.uid);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        PropertyStore.setAuthToken(idToken);
      } else {
        setToken(null);
        PropertyStore.setAuthToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevAuth]);

  const loginWithEmail = async (email: string, pass: string) => {
    if (isDevAuth) {
      const u = { uid: `dev-user-${email.split('@')[0]}`, email };
      setMockUser(u);
      setToken(u.uid);
      PropertyStore.setAuthToken(u.uid);
      localStorage.setItem('ulpin-mock-user', JSON.stringify(u));
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (isDevAuth) {
      const u = { uid: `dev-user-${email.split('@')[0]}`, email };
      setMockUser(u);
      setToken(u.uid);
      PropertyStore.setAuthToken(u.uid);
      localStorage.setItem('ulpin-mock-user', JSON.stringify(u));
      return;
    }
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginDevMock = () => {
    const u = { uid: 'dev-admin-user', email: 'admin@ulpin.local' };
    setMockUser(u);
    setToken(u.uid);
    PropertyStore.setAuthToken(u.uid);
    localStorage.setItem('ulpin-mock-user', JSON.stringify(u));
  };

  const logout = async () => {
    if (isDevAuth) {
      setMockUser(null);
      setToken(null);
      PropertyStore.setAuthToken(null);
      localStorage.removeItem('ulpin-mock-user');
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mockUser,
        token,
        loading,
        isDevAuth,
        loginWithEmail,
        signUpWithEmail,
        loginDevMock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
