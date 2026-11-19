import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Wallet } from '../types/database';

interface SignUpResult {
  user: User | null;
  session: Session | null;
  error: AuthError | Error | null;
  emailConfirmationRequired: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  wallet: Wallet | null;
  loading: boolean;
  availableCredits: number;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  updateProfileName: (newName: string) => Promise<{ error: Error | null }>;
  refreshWallet: (overrideWallet?: Wallet | null) => Promise<Wallet | null>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or Auto-create Profile in 'profiles' table
  const fetchProfile = useCallback(async (targetUser: User): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .maybeSingle();

      if (data && (data as Profile).full_name) {
        setProfile(data as Profile);
        return data as Profile;
      }

      // Auto-create/heal profile using auth metadata or email prefix
      const fullName =
        (targetUser.user_metadata?.full_name as string) ||
        targetUser.email?.split('@')[0] ||
        'Investigator';

      const { data: upserted } = await (supabase.from('profiles') as any)
        .upsert({
          id: targetUser.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      const resolved = (upserted as Profile) || {
        id: targetUser.id,
        full_name: fullName,
        avatar_url: null,
        created_at: targetUser.created_at,
        updated_at: new Date().toISOString(),
      };

      setProfile(resolved);
      return resolved;
    } catch (err) {
      console.warn('Profile fetch/heal error:', err);
      return null;
    }
  }, []);

  // Fetch or Initialize Wallet with 100 Welcome Credits
  const fetchWallet = useCallback(async (userId: string): Promise<Wallet | null> => {
    try {
      // 1. Fetch genuine wallet record directly from Supabase single source of truth
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setWallet(data as Wallet);
        return data as Wallet;
      }

      // 2. Only if wallet does NOT exist in database, initialize welcome reward once
      if (!data && !error) {
        try {
          await (supabase as any).rpc('initialize_wallet', { p_user_id: userId });
        } catch (_) {}

        const { data: createdWallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (createdWallet) {
          setWallet(createdWallet as Wallet);
          return createdWallet as Wallet;
        }
      }
    } catch (err) {
      console.warn('Wallet fetch error:', err);
    }
    return null;
  }, []);

  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setWallet(null);
      return;
    }
    await Promise.all([fetchProfile(currentUser), fetchWallet(currentUser.id)]);
  }, [fetchProfile, fetchWallet]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          setLoading(false);
          if (currentUser) {
            loadUserData(currentUser);
          }
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
        if (isMounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await loadUserData(currentUser);
      } else {
        setProfile(null);
        setWallet(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Realtime Supabase synchronization for wallet balance changes across all tabs/pages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime_wallet_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).user_id === user.id) {
            setWallet(payload.new as Wallet);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<SignUpResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { user: null, session: null, error, emailConfirmationRequired: false };
      }

      if (data.user) {
        // Automatically create profile record
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        }).catch(() => {});
        // Initialize welcome wallet
        await (supabase as any).rpc('initialize_wallet', { p_user_id: data.user.id }).catch(() => {});
      }

      const emailConfirmationRequired = !data.session && !!data.user && !data.user.confirmed_at;

      return {
        user: data.user,
        session: data.session,
        error: null,
        emailConfirmationRequired,
      };
    } catch (err: any) {
      return { user: null, session: null, error: err, emailConfirmationRequired: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        loadUserData(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setWallet(null);
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateProfileName = async (newName: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User not authenticated') };
    try {
      await (supabase.from('profiles') as any).upsert({
        id: user.id,
        full_name: newName,
        updated_at: new Date().toISOString(),
      });
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: newName },
      });
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        setProfile((prev) => prev ? { ...prev, full_name: newName } : null);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshWallet = async (overrideWallet?: Wallet | null): Promise<Wallet | null> => {
    if (overrideWallet) {
      setWallet(overrideWallet);
      return overrideWallet;
    }
    if (!user) return null;
    return await fetchWallet(user.id);
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfile(user);
  };

  const availableCredits = wallet
    ? Math.max(0, (wallet.free_credits || 0) + (wallet.purchased_credits || 0))
    : 0;

  const value: AuthContextType = {
    user,
    session,
    profile,
    wallet,
    loading,
    availableCredits,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfileName,
    refreshWallet,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
