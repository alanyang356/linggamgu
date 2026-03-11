import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getProfile, upsertProfile } from './api';
import { User } from '../types';

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  currentUser: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null,
  currentUser: null,
  session: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (user: SupabaseUser) => {
    // 先尝试读取 profile
    let profile = await getProfile(user.id);

    // 如果不存在（触发器没跑成功），就自动创建
    if (!profile) {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || '灵感播种人';
      const avatar = user.user_metadata?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;
      profile = await upsertProfile(user.id, name, avatar);
    }

    setCurrentUser(profile);
  };

  const refreshProfile = async () => {
    if (supabaseUser) {
      await loadProfile(supabaseUser);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const user = session?.user ?? null;
      setSupabaseUser(user);
      if (user) {
        loadProfile(user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const user = session?.user ?? null;
      setSupabaseUser(user);
      if (user) {
        loadProfile(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ supabaseUser, currentUser, session, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
