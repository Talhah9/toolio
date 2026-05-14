import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

// Wraps a promise so it rejects after `ms` milliseconds.
function withTimeout(promise, ms) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timer]);
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('free');

  // ── Fetch profile + credits ───────────────────────────────────
  // Never throws — always resolves, using fallback values on error.
  // Gives up after 5 s so a hanging RPC can't freeze the app.
  const fetchUserData = useCallback(async () => {
    console.log('[AppContext] fetchUserData: calling ensure_user_data RPC');
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('ensure_user_data'),
        5000
      );

      if (error) {
        console.error('[AppContext] ensure_user_data RPC returned error:', error.message, error);
        throw error;
      }

      console.log('[AppContext] fetchUserData: success —', data);
      setCredits(data.balance);
      setPlan(data.plan || 'free');
    } catch (err) {
      console.error('[AppContext] fetchUserData failed, falling back to defaults:', err.message);
      setCredits(50);
      setPlan('free');
    }
  }, []);

  // ── Auth bootstrap ────────────────────────────────────────────
  useEffect(() => {
    // Restore session on mount, then fetch user data.
    // setLoading(false) is in a finally block — it ALWAYS fires
    // regardless of whether fetchUserData succeeds or times out.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('[AppContext] getSession error:', error.message);
      console.log('[AppContext] getSession: session =', session ? 'exists' : 'none');
      setSession(session);
      if (session) {
        try {
          await fetchUserData();
        } finally {
          // fetchUserData never throws, but belt-and-suspenders:
          // loading must be cleared no matter what.
        }
      }
      setLoading(false);
      console.log('[AppContext] loading set to false');
    });

    // React to future auth events.
    // fetchUserData is fire-and-forget here — don't await it so the
    // auth state machine isn't blocked by a slow or failing RPC.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AppContext] onAuthStateChange:', event);
        setSession(session);

        if (event === 'SIGNED_IN') {
          fetchUserData(); // intentionally not awaited
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
    console.log('[AppContext] signIn: start');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AppContext] signIn error:', error.message);
      throw error;
    }
    console.log('[AppContext] signIn: auth succeeded (fetchUserData will follow via onAuthStateChange)');
    // fetchUserData is triggered by the SIGNED_IN event, not here.
    // signIn() returns as soon as auth resolves so the UI can navigate.
  };

  const signUp = async (email, password, name) => {
    console.log('[AppContext] signUp: start');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      console.error('[AppContext] signUp error:', error.message);
      throw error;
    }
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
  const logGeneration = useCallback(async (toolId, input, output, creditsUsed) => {
    if (!session) return;

    console.log('[AppContext] logGeneration:', toolId, creditsUsed, 'credits');
    const { data, error } = await supabase.rpc('log_generation', {
      p_tool_id:      toolId,
      p_input:        input,
      p_output:       output,
      p_credits_used: creditsUsed,
    });

    if (error) {
      console.error('[AppContext] log_generation error:', error.message);
      if (creditsUsed > 0) setCredits(c => Math.max(0, (c ?? 0) - creditsUsed));
      return;
    }

    console.log('[AppContext] logGeneration: new balance =', data.balance);
    setCredits(data.balance);
  }, [session]);

  // Kept for 0-credit free tools
  const consumeCredits = useCallback((n) => {
    if (n > 0) setCredits(c => Math.max(0, (c ?? 0) - n));
  }, []);

  const upgrade   = () => setPlan('pro');
  const cancelPro = () => setPlan('free');
  const addPack   = (n) => setCredits(c => (c ?? 0) + n);

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
      refreshCredits: fetchUserData,
    }}>
      {children}
    </AppContext.Provider>
  );
}
