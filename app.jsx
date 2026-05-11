// Toolio — Main app: router + state + Tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "plan": "free",
  "credits": 320
}/*EDITMODE-END*/;

const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState({ page: 'landing', params: {} });
  const [credits, setCredits] = React.useState(tweaks.credits);
  const [plan, setPlan] = React.useState(tweaks.plan);

  // Keep credits/plan in sync when tweaks change
  React.useEffect(() => { setCredits(tweaks.credits); }, [tweaks.credits]);
  React.useEffect(() => { setPlan(tweaks.plan); }, [tweaks.plan]);

  const user = {
    firstName: 'Léa',
    lastName: 'Marchand',
    email: 'lea@marchand.fr',
  };

  const navigate = (page, params = {}) => {
    if (params.scrollTo) window.__pendingScrollTo = params.scrollTo;
    setRoute({ page, params });
    window.scrollTo({ top: 0 });
  };

  const consumeCredits = (n) => {
    setCredits(c => Math.max(0, c - n));
    setTweak('credits', Math.max(0, credits - n));
  };

  const upgrade = () => {
    setPlan('pro');
    setCredits(500);
    setTweak({ plan: 'pro', credits: 500 });
  };
  const cancelPro = () => {
    setPlan('free');
    setTweak('plan', 'free');
  };
  const addPack = (n) => {
    const next = credits + n;
    setCredits(next);
    setTweak('credits', next);
  };
  const logout = () => {
    navigate('landing');
  };

  // Pages that have a sidebar (logged-in product pages)
  const sidebarPages = ['dashboard', 'tool', 'pricing', 'account'];
  const useSidebar = sidebarPages.includes(route.page);

  let pageEl = null;
  switch (route.page) {
    case 'landing':
      pageEl = <Landing navigate={navigate} />;
      break;
    case 'auth':
      pageEl = <Auth navigate={navigate} initialMode={route.params.mode || 'login'} />;
      break;
    case 'dashboard':
      pageEl = <Dashboard navigate={navigate} user={user} credits={credits} plan={plan} />;
      break;
    case 'tool':
      pageEl = <ToolPage navigate={navigate} toolId={route.params.toolId} user={user} credits={credits} plan={plan} onConsume={consumeCredits} />;
      break;
    case 'pricing':
      pageEl = <Pricing navigate={navigate} user={user} credits={credits} plan={plan} onUpgrade={upgrade} onPack={addPack} />;
      break;
    case 'account':
      pageEl = <Account navigate={navigate} user={user} credits={credits} plan={plan} onLogout={logout} onCancelPro={cancelPro} />;
      break;
    default:
      pageEl = <Landing navigate={navigate} />;
  }

  return (
    <>
      {useSidebar ? (
        <div className="app-shell">
          <Sidebar page={route.page} navigate={navigate} user={user} plan={plan} />
          <main>{pageEl}</main>
        </div>
      ) : (
        <main>{pageEl}</main>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection title="État du compte">
          <TweakRadio
            label="Plan"
            value={plan}
            onChange={v => { setPlan(v); setTweak('plan', v); if (v === 'pro' && credits < 100) { setCredits(500); setTweak('credits', 500); } }}
            options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]}
          />
          <TweakSlider
            label="Crédits"
            value={credits}
            min={0}
            max={500}
            step={10}
            onChange={v => { setCredits(v); setTweak('credits', v); }}
          />
          <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Sous 50 crédits → bannière d'alerte sur le dashboard.<br/>
            Plan Free → outils Pro verrouillés, bannière d'upgrade.
          </div>
        </TweakSection>
        <TweakSection title="Navigation rapide">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('landing')}>Landing</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('auth')}>Auth</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('dashboard')}>Dashboard</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('tool', { toolId: 'linkedin-content' })}>Outil</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('pricing')}>Pricing</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('account')}>Compte</button>
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
