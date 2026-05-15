import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { Glyph } from '../components/Glyph';
import { Logo } from '../components/Logo';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { TOOLS, PACKS, getToolText } from '../data/catalog';
import { useLang } from '../context/LanguageContext';

// ── Animation constants ───────────────────────────────────────
const ease = [0.25, 0.46, 0.45, 0.94];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

// ── Shared primitives ─────────────────────────────────────────

function FadeUp({ children, delay = 0, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : 'hidden'}
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Chevron SVG ───────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── FAQ accordion item ────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '18px 0', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontWeight: 500, fontSize: 15, color: 'var(--fg)', gap: 16,
        }}
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          style={{ display: 'flex', color: 'var(--fg-3)', flexShrink: 0 }}
        >
          <ChevronDown />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ans"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.75, paddingBottom: 18, margin: 0 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Landing page ──────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useLang();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const freeTools = TOOLS.filter(tool => tool.plan === 'free' && !tool.franceOnly);
  const proTools  = TOOLS.filter(tool => tool.plan === 'pro');

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
  ];

  const howSteps = [
    { num: '1', title: t('landing.how.step1.title'), desc: t('landing.how.step1.desc'), glyph: 'home' },
    { num: '2', title: t('landing.how.step2.title'), desc: t('landing.how.step2.desc'), glyph: 'lightning' },
    { num: '3', title: t('landing.how.step3.title'), desc: t('landing.how.step3.desc'), glyph: 'check' },
  ];

  return (
    <>
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container-narrow">
          <motion.span
            className="hero-eyebrow"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <span className="pill">{t('landing.eyebrow.badge')}</span>
            <span>{t('landing.eyebrow.text')}</span>
          </motion.span>

          <motion.h1
            className="h-display"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease }}
          >
            {t('landing.hero.title')}
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease }}
          >
            {t('landing.hero.sub')}
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease }}
          >
            <motion.button
              className="btn btn-accent btn-lg"
              onClick={() => navigate('/auth?mode=register')}
              whileHover={reduce ? {} : { scale: 1.025 }}
              whileTap={reduce ? {} : { scale: 0.975 }}
              transition={{ duration: 0.15 }}
              style={{ cursor: 'pointer' }}
            >
              {t('landing.hero.cta.primary')}
            </motion.button>
            <motion.button
              className="btn btn-secondary btn-lg"
              onClick={() => { const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              whileHover={reduce ? {} : { scale: 1.015 }}
              whileTap={reduce ? {} : { scale: 0.985 }}
              transition={{ duration: 0.15 }}
              style={{ cursor: 'pointer' }}
            >
              {t('landing.hero.cta.secondary')}
            </motion.button>
          </motion.div>

          <motion.p
            className="muted"
            style={{ fontSize: 13, marginTop: 20 }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            {t('landing.hero.note')}
          </motion.p>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ──────────────────────────────────── */}
      <FadeUp>
        <div style={{
          padding: '18px 0',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-soft)',
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {['LM', 'JD', 'SR', 'AT', 'KP'].map((initials, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: ['#818CF8', '#34D399', '#F472B6', '#FB923C', '#60A5FA'][i],
                  border: '2px solid var(--bg-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  marginLeft: i > 0 ? -8 : 0,
                  position: 'relative', zIndex: 5 - i,
                }}>
                  {initials}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500, margin: 0 }}>
              {t('landing.social.text')}
            </p>
          </div>
        </div>
      </FadeUp>

      {/* ── DASHBOARD PREVIEW (desktop) ───────────────────────── */}
      <FadeUp delay={0.05} style={{ padding: '0 0 64px', display: 'block' }} className="hidden-mobile">
        <div className="container">
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 8, background: 'var(--bg-soft)' }}>
            <LandingDashboardPreview lang={lang} t={t} />
          </div>
        </div>
      </FadeUp>

      {/* ── TOOLS SHOWCASE ────────────────────────────────────── */}
      <section id="tools" className="section">
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.tools.eyebrow')}</span>
              <h2 className="h1" style={{ maxWidth: 600 }}>{t('landing.tools.title')}</h2>
              <p className="muted" style={{ maxWidth: 560 }}>{t('landing.tools.subtitle')}</p>
            </div>
          </FadeUp>

          {/* Free tools */}
          <FadeUp delay={0.05}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-4)', marginBottom: 12 }}>
              — {t('onboarding.step2.free')}
            </p>
          </FadeUp>
          <StaggerGrid className="tools-grid" style={{ marginBottom: 40 }}>
            {freeTools.map(tool => {
              const { name, desc } = getToolText(tool, lang);
              return (
                <motion.div
                  key={tool.id}
                  className="tool-card"
                  variants={cardVariants}
                  onClick={() => navigate('/auth?mode=register')}
                  whileHover={reduce ? {} : { y: -2, transition: { duration: 0.15 } }}
                  style={{ cursor: 'pointer' }}
                >
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
                      : <span className="tabular">{tool.credits} {t('landing.tools.credits')}</span>
                    }
                    <Glyph name="arrow-right" size={14} />
                  </div>
                </motion.div>
              );
            })}
          </StaggerGrid>

          {/* Pro tools */}
          <FadeUp delay={0.05}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 12 }}>
              — Pro
            </p>
          </FadeUp>
          <StaggerGrid className="tools-grid">
            {proTools.map(tool => {
              const { name, desc } = getToolText(tool, lang);
              return (
                <motion.div
                  key={tool.id}
                  className="tool-card"
                  variants={cardVariants}
                  onClick={() => navigate('/auth?mode=register')}
                  whileHover={reduce ? {} : { y: -2, transition: { duration: 0.15 } }}
                  style={{ cursor: 'pointer', borderColor: 'var(--accent-soft)', background: 'var(--accent-soft)' }}
                >
                  <div className="tool-card-head">
                    <ToolIcon tool={tool} size="lg" />
                    <PlanBadge plan={tool.plan} />
                  </div>
                  <h3 className="tool-card-title">{name}</h3>
                  <p className="tool-card-desc">{desc}</p>
                  <div className="tool-card-foot">
                    {tool.credits === 0
                      ? <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{t('landing.tools.free')}</span>
                      : <span className="tabular">{tool.credits} {t('landing.tools.credits')}</span>
                    }
                    <Glyph name="arrow-right" size={14} />
                  </div>
                </motion.div>
              );
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.how.eyebrow')}</span>
              <h2 className="h1">{t('landing.how.title')}</h2>
            </div>
          </FadeUp>

          <StaggerGrid style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {howSteps.map((step, i) => (
              <motion.div
                key={i}
                variants={cardVariants}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '28px 24px',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, marginBottom: 16,
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: 'var(--fg)' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="section">
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.pricing.eyebrow')}</span>
              <h2 className="h1">{t('landing.pricing.title')}</h2>
              <p className="muted">{t('landing.pricing.subtitle')}</p>
            </div>
          </FadeUp>

          <StaggerGrid className="pricing-grid">
            {/* Free plan */}
            <motion.div className="plan" variants={cardVariants}>
              <div>
                <h3 className="plan-name">Free</h3>
                <p className="muted" style={{ fontSize: 13, margin: '0 0 24px' }}>{t('landing.pricing.free.tagline')}</p>
                <p className="plan-price">€0<small>/ {lang === 'fr' ? 'mois' : 'month'}</small></p>
              </div>
              <ul className="plan-features">
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f1')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f2')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f3')}</span></li>
                <li><Glyph name="check" size={14} /><span>{t('landing.pricing.free.f4')}</span></li>
              </ul>
              <motion.button
                className="btn btn-secondary btn-lg btn-block"
                onClick={() => navigate('/auth?mode=register')}
                whileHover={reduce ? {} : { scale: 1.015 }}
                whileTap={reduce ? {} : { scale: 0.985 }}
                style={{ cursor: 'pointer' }}
              >
                {t('landing.pricing.free.cta')}
              </motion.button>
            </motion.div>

            {/* Pro plan */}
            <motion.div className="plan featured" variants={cardVariants}>
              <div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 className="plan-name">Pro</h3>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                    {t('landing.pricing.pro.recommended')}
                  </span>
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
              <motion.button
                className="btn btn-block btn-lg"
                style={{ background: '#fff', color: 'var(--fg)', cursor: 'pointer' }}
                onClick={() => navigate('/auth?mode=register')}
                whileHover={reduce ? {} : { scale: 1.015 }}
                whileTap={reduce ? {} : { scale: 0.985 }}
              >
                {t('landing.pricing.pro.cta')}
              </motion.button>
            </motion.div>
          </StaggerGrid>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <FadeUp>
            <div className="section-hd" style={{ marginBottom: 0 }}>
              <span className="eyebrow">{t('landing.faq.eyebrow')}</span>
              <h2 className="h1">{t('landing.faq.title')}</h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div style={{ maxWidth: 680, margin: '40px auto 0' }}>
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="section">
        <FadeUp>
          <div className="container-narrow text-center">
            <h2 className="h1" style={{ marginBottom: 16 }}>{t('landing.final.title')}</h2>
            <p className="muted" style={{ marginBottom: 32 }}>{t('landing.final.sub')}</p>
            <motion.button
              className="btn btn-accent btn-lg"
              onClick={() => navigate('/auth?mode=register')}
              whileHover={reduce ? {} : { scale: 1.025 }}
              whileTap={reduce ? {} : { scale: 0.975 }}
              style={{ cursor: 'pointer' }}
            >
              {t('landing.final.cta')}
            </motion.button>
          </div>
        </FadeUp>
      </section>

      <MarketingFooter />
    </>
  );
}

// ── Dashboard preview (desktop only) ─────────────────────────
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
                    <span style={{ width: 24, height: 24 }}><Glyph name={tool.glyph} size={13} /></span>
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
