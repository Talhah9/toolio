import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(50);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const consumeCredits = (n) => setCredits(c => Math.max(0, c - n));
  const upgrade = () => { setPlan('pro'); setCredits(500); };
  const cancelPro = () => setPlan('free');
  const addPack = (n) => setCredits(c => c + n);

  // Derive a display-friendly user object from the Supabase session
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
      consumeCredits,
      upgrade,
      cancelPro,
      addPack,
    }}>
      {children}
    </AppContext.Provider>
  );
}
