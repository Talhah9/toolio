import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('free');

  // ── Fetch profile + credits via SECURITY DEFINER RPC ─────────
  // Also creates the rows on the fly for users who signed up
  // before the on_auth_user_created trigger existed.
  const fetchUserData = useCallback(async () => {
    const { data, error } = await supabase.rpc('ensure_user_data');
    if (error) {
      console.error('ensure_user_data:', error.message);
      setCredits(50);
      setPlan('free');
      return;
    }
    setCredits(data.balance);
    setPlan(data.plan || 'free');
  }, []);

  // ── Auth bootstrap ────────────────────────────────────────────
  useEffect(() => {
    // 1. Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await fetchUserData();
      setLoading(false);
    });

    // 2. React to future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (event === 'SIGNED_IN') {
          await fetchUserData();
        }

        if (event === 'SIGNED_OUT') {
          setCredits(null);
          setPlan('free');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // ── Auth actions ──────────────────────────────────────────────
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    return !data.session; // true = email confirmation required
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Credit + generation logging ───────────────────────────────
  // Call this after every paid generation instead of consumeCredits().
  // Atomically deducts credits and logs the generation in Supabase,
  // then syncs local state with the returned balance.
  const logGeneration = useCallback(async (toolId, input, output, creditsUsed) => {
    if (!session) return;

    const { data, error } = await supabase.rpc('log_generation', {
      p_tool_id:      toolId,
      p_input:        input,
      p_output:       output,
      p_credits_used: creditsUsed,
    });

    if (error) {
      console.error('log_generation:', error.message);
      // Optimistic fallback so UI stays responsive
      if (creditsUsed > 0) setCredits(c => Math.max(0, (c ?? 0) - creditsUsed));
      return;
    }

    setCredits(data.balance);
  }, [session]);

  // Kept for 0-credit free tools that don't call logGeneration
  const consumeCredits = useCallback((n) => {
    if (n > 0) setCredits(c => Math.max(0, (c ?? 0) - n));
  }, []);

  const upgrade  = () => setPlan('pro');
  const cancelPro = () => setPlan('free');
  const addPack  = (n) => setCredits(c => (c ?? 0) + n);

  // ── Derived user object ───────────────────────────────────────
  const rawUser = session?.user ?? null;
  const user = rawUser
    ? {
        firstName: rawUser.user_metadata?.full_name?.split(' ')[0]
          || rawUser.email.split('@')[0],
        lastName: rawUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email: rawUser.email,
      }
    : null;

  return (
    <AppContext.Provider value={{
      user,
      session,
      loading,
      credits,
      plan,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      logGeneration,
      consumeCredits,
      upgrade,
      cancelPro,
      addPack,
    }}>
      {children}
    </AppContext.Provider>
  );
}
