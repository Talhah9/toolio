import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { Glyph } from '../components/Glyph';
import { Logo } from '../components/Logo';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { TOOLS, PACKS, getToolText } from '../data/catalog';
import { useLang } from '../context/LanguageContext';

export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useLang();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="hero">
        <div className="container-narrow">
          <span className="hero-eyebrow">
            <span className="pill">{t('landing.eyebrow.badge')}</span>
            <span>{t('landing.eyebrow.text')}</span>
          </span>
          <h1 className="h-display">
            {t('landing.hero.title')}
          </h1>
          <p className="hero-sub">
            {t('landing.hero.sub')}
          </p>
          <div className="hero-cta">
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/auth?mode=register')}>
              {t('landing.hero.cta.primary')}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              const el = document.getElementById('tools');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              {t('landing.hero.cta.secondary')}
            </button>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            {t('landing.hero.note')}
          </p>
        </div>
      </section>

      {/* MOCK SCREENSHOT */}
      <section className="hidden md:block" style={{ padding: '0 0 64px' }}>
        <div className="container">
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 8, background: 'var(--bg-soft)' }}>
            <LandingDashboardPreview lang={lang} t={t} />
          </div>
        </div>
      </section>

      {/* TOOLS GRID */}
      <section id="tools" className="section">
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">{t('landing.tools.eyebrow')}</span>
            <h2 className="h1" style={{ maxWidth: 600 }}>{t('landing.tools.title')}</h2>
            <p className="muted" style={{ maxWidth: 560 }}>{t('landing.tools.subtitle')}</p>
          </div>
          <div className="tools-grid">
            {TOOLS.map(tool => {
              const { name, desc } = getToolText(tool, lang);
              return (
                <div key={tool.id} className="tool-card" onClick={() => navigate('/auth?mode=register')}>
                  <div className="tool-card-head">
                    <ToolIcon tool={tool} size="lg" />
                    <div className="row" style={{ gap: 6 }}>
                      {tool.franceOnly && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8' }}>
                          🇫🇷
                        </span>
                      )}
                      <PlanBadge plan={tool.plan} />
                    </div>
                  </div>
                  <h3 className="tool-card-title">{name}</h3>
                  <p className="tool-card-desc">{desc}</p>
                  <div className="tool-card-foot">
                    {tool.credits === 0
                      ? <span style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>{t('landing.tools.free')}</span>
                      : <span className="tabular">{tool.credits} {t('landing.tools.credits')}{tool.unit ? ` / ${tool.unit}` : ''}</span>
                    }
                    <Glyph name="arrow-right" size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">{t('landing.pricing.eyebrow')}</span>
            <h2 className="h1">{t('landing.pricing.title')}</h2>
            <p className="muted">{t('landing.pricing.subtitle')}</p>
          </div>

          <div className="pricing-grid">
            <div className="plan">
              <div>
                <h3 className="plan-name">Free</h3>
                <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 24 }}>{t('landing.pricing.free.tagline')}</p>
                <p className="plan-price">€0<small>/ {lang === 'fr' ? 'mois' : 'month'}</small></p>
              </div>
              <ul className="plan-features">
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f1')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f2')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f3')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f4')}</span></li>
              </ul>
              <button className="btn btn-secondary btn-lg btn-block" onClick={() => navigate('/auth?mode=register')}>
                {t('landing.pricing.free.cta')}
              </button>
            </div>

            <div className="plan featured">
              <div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 className="plan-name">Pro</h3>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{t('landing.pricing.pro.recommended')}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px' }}>{t('landing.pricing.pro.tagline')}</p>
                <p className="plan-price">€49<small style={{ color: 'rgba(255,255,255,0.6)' }}>/ {lang === 'fr' ? 'mois' : 'month'}</small></p>
              </div>
              <ul className="plan-features" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.pro.f1')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.pro.f2')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.pro.f3')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.pro.f4')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.pro.f5')}</span></li>
              </ul>
              <button className="btn btn-block btn-lg" style={{ background: '#fff', color: 'var(--fg)' }} onClick={() => navigate('/auth?mode=register')}>
                {t('landing.pricing.pro.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIT PACKS */}
      <section className="section">
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">{t('landing.packs.eyebrow')}</span>
            <h2 className="h1">{t('landing.packs.title')}</h2>
            <p className="muted">{t('landing.packs.subtitle')}</p>
          </div>
          <div className="packs-grid" style={{ maxWidth: 880, margin: '0 auto' }}>
            {PACKS.map(p => (
              <div key={p.id} className={`pack ${p.featured ? 'featured' : ''}`}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted" style={{ fontSize: 13 }}>{p.label}</span>
                  {p.featured && <span className="badge badge-outline">{t('landing.packs.popular')}</span>}
                </div>
                <p className="pack-credits tabular">{p.credits}<span className="muted" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>{t('landing.tools.credits')}</span></p>
                <p className="pack-price">{p.price}€ <span className="muted">— {(p.price / p.credits).toFixed(2)}{t('landing.packs.per-credit')}</span></p>
                <p className="pack-meta">{t('landing.packs.no-expiry')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container-narrow text-center">
          <h2 className="h1" style={{ marginBottom: 16 }}>{t('landing.final.title')}</h2>
          <p className="muted" style={{ marginBottom: 32 }}>{t('landing.final.sub')}</p>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('/auth?mode=register')}>
            {t('landing.final.cta')}
          </button>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function LandingDashboardPreview({ lang, t }) {
  const previewTools = TOOLS.slice(0, 6);
  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 12, overflow: 'hidden',
      border: '1px solid var(--border)', display: 'grid',
      gridTemplateColumns: '180px 1fr', height: 420,
    }}>
      <div style={{ padding: 12, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
        <div style={{ padding: '6px 8px 12px' }}><Logo size={14} /></div>
        {[
          { name: t('nav.dashboard'), icon: 'home', active: true },
          ...previewTools.slice(0, 5).map(tool => ({
            name: getToolText(tool, lang).short,
            icon: tool.glyph,
          })),
        ].map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px', borderRadius: 4,
            background: it.active ? 'var(--bg-hover)' : 'transparent',
            color: it.active ? 'var(--fg)' : 'var(--fg-3)',
            fontWeight: it.active ? 500 : 400,
          }}>
            <Glyph name={it.icon} size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 12 }}>
          <span className="muted">{t('header.hello')} Léa</span>
          <span className="row" style={{ gap: 8 }}>
            <span className="credits-pill" style={{ height: 24, fontSize: 11 }}><span className="dot" />320 {t('header.credits')}</span>
            <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>LM</span>
          </span>
        </div>
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>{t('dashboard.title')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {previewTools.map(tool => {
              const { short } = getToolText(tool, lang);
              return (
                <div key={tool.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 96 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="glyph" style={{ width: 24, height: 24 }}><Glyph name={tool.glyph} size={13} /></span>
                    <PlanBadge plan={tool.plan} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{short}</div>
                  <div style={{ color: 'var(--fg-4)', fontSize: 10, marginTop: 'auto' }}>
                    {tool.credits === 0 ? t('tool.free') : `${tool.credits} ${t('header.credits')}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
