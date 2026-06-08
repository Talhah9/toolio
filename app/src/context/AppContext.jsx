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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ── Fetch profile + credits ───────────────────────────────────
  // Never throws — always resolves, using fallback values on error.
  // Gives up after 5 s so a hanging RPC can't freeze the app.
  const fetchUserData = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('ensure_user_data'),
        5000
      );

      if (error) {
        console.error('[AppContext] ensure_user_data RPC returned error:', error.message, error);
        throw error;
      }

      setCredits(data.balance);
      setPlan(data.plan || 'free');

      if (data.onboarding_completed === false || data.onboarding_completed === null) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('[AppContext] fetchUserData failed, falling back to defaults:', err.message);
      setCredits(50);
      setPlan('free');
    }
  }, []);

  // ── Notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) setNotifications(data);
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('read', false);
  }, []);

  // ── Auth bootstrap ────────────────────────────────────────────
  useEffect(() => {
    // Restore session on mount, then fetch user data.
    // setLoading(false) is in a finally block — it ALWAYS fires
    // regardless of whether fetchUserData succeeds or times out.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('[AppContext] getSession error:', error.message);
      setSession(session);
      if (session) {
        await fetchUserData();
        fetchNotifications(); // fire-and-forget
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (event === 'SIGNED_IN') {
          fetchUserData();        // intentionally not awaited
          fetchNotifications();   // intentionally not awaited
        }

        if (event === 'SIGNED_OUT') {
          setCredits(null);
          setPlan('free');
          setNotifications([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // ── Auth actions ──────────────────────────────────────────────
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AppContext] signIn error:', error.message);
      throw error;
    }
  };

  const signUp = async (email, password, name, lang = 'en') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      console.error('[AppContext] signUp error:', error.message);
      throw error;
    }
    // Fire welcome email — don't await so signup flow isn't blocked
    console.log('[welcome] Sending welcome email to:', email);
    fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, lang }),
    }).catch(err => console.error('[AppContext] send-welcome-email failed:', err.message));
    return !data.session; // true = email confirmation required
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Credit + generation logging ───────────────────────────────
  // Returns the generation row ID so callers can attach a save button.
  const logGeneration = useCallback(async (toolId, input, output, creditsUsed) => {
    if (!session) return null;

    const { data, error } = await supabase.rpc('log_generation', {
      p_tool_id:      toolId,
      p_input:        input,
      p_output:       output,
      p_credits_used: creditsUsed,
    });

    if (error) {
      console.error('[AppContext] log_generation error:', error.message);
      if (creditsUsed > 0) setCredits(c => Math.max(0, (c ?? 0) - creditsUsed));
      return null;
    }

    setCredits(data.balance);

    // Fetch the ID of the generation we just inserted.
    const { data: gen } = await supabase
      .from('generations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return gen?.id ?? null;
  }, [session]);

  // Kept for 0-credit free tools
  const consumeCredits = useCallback((n) => {
    if (n > 0) setCredits(c => Math.max(0, (c ?? 0) - n));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    if (!session?.user?.id) return;
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', session.user.id);
  }, [session]);

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

  const unreadCount = notifications.filter(n => !n.read).length;

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
      resetPassword,
      updatePassword,
      signOut,
      logGeneration,
      consumeCredits,
      upgrade,
      cancelPro,
      addPack,
      refreshCredits: fetchUserData,
      showOnboarding,
      completeOnboarding,
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      fetchNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}
