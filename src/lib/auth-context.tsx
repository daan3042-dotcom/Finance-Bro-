import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';
import { toUserMessage } from './networkError';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  loadErrorMessage: string | null;
  retryLoadSession: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    (async () => {
      setIsLoading(true);
      setLoadErrorMessage(null);
      try {
        const { data } = await supabase.auth.getSession();
        if (!isActive) return;
        setSession(data.session);
        setIsLoading(false);
      } catch (error) {
        if (!isActive) return;
        setLoadErrorMessage(toUserMessage(error));
        setIsLoading(false);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isActive) return;
      setSession(newSession);
      setLoadErrorMessage(null);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, [reloadToken]);

  const retryLoadSession = () => setReloadToken((token) => token + 1);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, loadErrorMessage, retryLoadSession, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
