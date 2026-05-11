import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [credits, setCredits] = useState(320);
  const [plan, setPlan] = useState('free');

  const user = {
    firstName: 'Léa',
    lastName: 'Marchand',
    email: 'lea@marchand.fr',
  };

  const consumeCredits = (n) => setCredits(c => Math.max(0, c - n));

  const upgrade = () => {
    setPlan('pro');
    setCredits(500);
  };

  const cancelPro = () => setPlan('free');

  const addPack = (n) => setCredits(c => c + n);

  return (
    <AppContext.Provider value={{ user, credits, plan, consumeCredits, upgrade, cancelPro, addPack }}>
      {children}
    </AppContext.Provider>
  );
}
