import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { TOOLS, getToolText } from '../data/catalog';
import { useLang } from '../context/LanguageContext';

const ease = [0.25, 0.46, 0.45, 0.94];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

// ── Shared animation primitives ───────────────────────────────

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

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Typewriter text ───────────────────────────────────────────

function TypewriterText({ text, active, speed = 18 }) {
  const [visible, setVisible] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active) { setVisible(0); return; }
    if (reduce) { setVisible(text.length); return; }
    setVisible(0);
    const interval = setInterval(() => {
      setVisible(v => {
        if (v >= text.length) { clearInterval(interval); return v; }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [active, text, speed, reduce]);

  const done = visible >= text.length;
  return (
    <span>
      {text.slice(0, visible)}
      {active && !done && <span className="lp-cursor" aria-hidden="true" />}
    </span>
  );
}

// ── Pain card ─────────────────────────────────────────────────

function PainCard({ icon, title, body }) {
  return (
    <div className="pain-card">
      <div className="pain-card-icon" aria-hidden="true">{icon}</div>
      <h3 style={{ fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{body}</p>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────

function TestimonialCard({ quote, name, title }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-stars" aria-label="5 stars">★★★★★</div>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>"{quote}"</p>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{name}</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>{title}</div>
      </div>
    </div>
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

// ── Animated Demo tabs ────────────────────────────────────────

function getDemoTabs(t) {
  return [
    {
      id: 'linkedin',
      label: t('landing.demo.tab.linkedin'),
      formFields: [
        { label: t('landing.demo.linkedin.f1.label'), value: t('landing.demo.linkedin.f1.value') },
        { label: t('landing.demo.linkedin.f2.label'), value: t('landing.demo.linkedin.f2.value') },
        { label: t('landing.demo.linkedin.f3.label'), value: t('landing.demo.linkedin.f3.value') },
      ],
      output: t('landing.demo.linkedin.output'),
    },
    {
      id: 'contract',
      label: t('landing.demo.tab.contract'),
      formFields: [
        { label: t('landing.demo.contract.f1.label'), value: t('landing.demo.contract.f1.value') },
        { label: t('landing.demo.contract.f2.label'), value: t('landing.demo.contract.f2.value') },
        { label: t('landing.demo.contract.f3.label'), value: t('landing.demo.contract.f3.value') },
      ],
      output: t('landing.demo.contract.output'),
    },
    {
      id: 'quote',
      label: t('landing.demo.tab.quote'),
      formFields: [
        { label: t('landing.demo.quote.f1.label'), value: t('landing.demo.quote.f1.value') },
        { label: t('landing.demo.quote.f2.label'), value: t('landing.demo.quote.f2.value') },
        { label: t('landing.demo.quote.f3.label'), value: t('landing.demo.quote.f3.value') },
      ],
      output: t('landing.demo.quote.output'),
    },
  ];
}

function ToolDemoTabs({ t, lang }) {
  const [activeTab, setActiveTab] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const handleTab = (idx) => {
    setActiveTab(idx);
    setAnimKey(k => k + 1);
  };

  const tabs = getDemoTabs(t);
  const tab  = tabs[activeTab];

  return (
    <div>
      <div className="lp-demo-tabs" role="tablist">
        {tabs.map((demo, i) => (
          <button
            key={demo.id}
            role="tab"
            aria-selected={activeTab === i}
            className={`lp-demo-tab${activeTab === i ? ' active' : ''}`}
            onClick={() => handleTab(i)}
          >
            {demo.label}
          </button>
        ))}
      </div>
      <div className="lp-demo-panel" role="tabpanel">
        <div className="lp-demo-form">
          {tab.formFields.map((field, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-4)', marginBottom: 4 }}>
                {field.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.5 }}>
                {field.value}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a5f3fc', animation: 'blink 1s step-end infinite' }} />
              {t('landing.demo.generating')}
            </div>
          </div>
        </div>
        <div className="lp-demo-output">
          <TypewriterText key={`${animKey}-${lang}`} text={tab.output} active speed={14} />
        </div>
      </div>
    </div>
  );
}

// ── Hero rotating output card ─────────────────────────────────

function HeroOutputCard({ t, lang }) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();

  // Reset to first card on language switch
  useEffect(() => { setIdx(0); }, [lang]);

  // Advance after typing finishes + 2.5s reading pause
  useEffect(() => {
    if (reduce) return;
    const text = [
      t('landing.hero.card.text1'),
      t('landing.hero.card.text2'),
      t('landing.hero.card.text3'),
    ][idx];
    const timer = setTimeout(() => setIdx(i => (i + 1) % 3), text.length * 20 + 2500);
    return () => clearTimeout(timer);
  }, [idx, lang, reduce, t]);

  const badges = [
    t('landing.hero.card.badge1'),
    t('landing.hero.card.badge2'),
    t('landing.hero.card.badge3'),
  ];
  const texts = [
    t('landing.hero.card.text1'),
    t('landing.hero.card.text2'),
    t('landing.hero.card.text3'),
  ];

  return (
    <div className="hero-output-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${idx}-${lang}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {badges[idx]}
            </span>
          </div>
          {reduce
            ? <span>{texts[idx]}</span>
            : <TypewriterText text={texts[idx]} active speed={20} />
          }
        </motion.div>
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
    { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
  ];

  const avatarColors = ['#818CF8', '#34D399', '#F472B6', '#FB923C', '#60A5FA'];

  return (
    <>
      <MarketingNav />

      {/* ── 1. HERO ───────────────────────────────────────────── */}
      <section className="hero" style={{ paddingBottom: 80, position: 'relative' }}>
        {/* Background blobs + dot grid */}
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-blob hero-blob-purple" />
          <div className="hero-blob hero-blob-warm" />
          <div className="hero-dot-grid" />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-two-col">
            {/* Left col */}
            <div>
              <motion.span
                className="hero-eyebrow"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
              >
                <span className="pill">{t('landing.eyebrow.badge')}</span>
              </motion.span>

              <motion.h1
                className="h-display"
                style={{ maxWidth: 580 }}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease }}
              >
                {lang === 'fr' ? (
                  <>
                    <span style={{ display: 'block' }}>Tous les outils</span>
                    <span style={{ display: 'block' }}>dont un freelance</span>
                    <span style={{ display: 'block' }}>a besoin.</span>
                  </>
                ) : (
                  <>
                    <span style={{ display: 'block' }}>Every tool a</span>
                    <span style={{ display: 'block' }}>freelance needs.</span>
                  </>
                )}
              </motion.h1>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.18, ease }}
              >
                <span className="hero-ai-badge" aria-label={t('landing.hero.ai.badge')}>
                  {t('landing.hero.ai.badge')}
                </span>
              </motion.div>

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
                  onClick={() => { const el = document.getElementById('tools'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
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
                style={{ fontSize: 13, marginTop: 16 }}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                {t('landing.hero.note')}
              </motion.p>
            </div>

            {/* Right col — output card (desktop only) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -40 }}
            >
              <HeroOutputCard t={t} lang={lang} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. PAIN POINTS ────────────────────────────────────── */}
      <FadeUp>
        <section className="lp-dark section">
          <div className="container">
            <div className="section-hd" style={{ marginBottom: 40 }}>
              <span className="eyebrow">{t('landing.pain.eyebrow')}</span>
              <h2 className="h1" style={{ whiteSpace: 'pre-line', color: '#fff', maxWidth: 680 }}>
                {t('landing.pain.title')}
              </h2>
            </div>
            <div className="pain-grid">
              <PainCard
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                }
                title={t('landing.pain.card1.title')}
                body={t('landing.pain.card1.body')}
              />
              <PainCard
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                }
                title={t('landing.pain.card2.title')}
                body={t('landing.pain.card2.body')}
              />
              <PainCard
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                }
                title={t('landing.pain.card3.title')}
                body={t('landing.pain.card3.body')}
              />
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ── 3. ANIMATED DEMO ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.demo.eyebrow')}</span>
              <h2 className="h1">{t('landing.demo.title')}</h2>
              <p className="muted">{t('landing.demo.sub')}</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <ToolDemoTabs t={t} lang={lang} />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 4. SOCIAL PROOF — STATS + TESTIMONIALS ────────────── */}
      <section className="section">
        <div className="container">
          <FadeUp>
            <div className="stat-bar">
              {[
                { value: t('landing.stats.users'), label: t('landing.stats.users.label') },
                { value: t('landing.stats.tools'), label: t('landing.stats.tools.label') },
                { value: t('landing.stats.credits'), label: t('landing.stats.credits.label') },
                { value: t('landing.stats.hosting'), label: t('landing.stats.hosting.label') },
              ].map((item, i) => (
                <div key={i} className="stat-item">
                  <div className="stat-value">{item.value}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>

          <StaggerGrid className="testimonials-grid">
            {[
              { q: t('landing.testimonial.1.quote'), n: t('landing.testimonial.1.name'), ti: t('landing.testimonial.1.title') },
              { q: t('landing.testimonial.2.quote'), n: t('landing.testimonial.2.name'), ti: t('landing.testimonial.2.title') },
              { q: t('landing.testimonial.3.quote'), n: t('landing.testimonial.3.name'), ti: t('landing.testimonial.3.title') },
            ].map((item, i) => (
              <motion.div key={i} variants={cardVariants}>
                <TestimonialCard quote={item.q} name={item.n} title={item.ti} />
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── 5. TOOLS SHOWCASE ─────────────────────────────────── */}
      <section id="tools" className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.tools.eyebrow')}</span>
              <h2 className="h1" style={{ maxWidth: 600 }}>{t('landing.tools.title')}</h2>
              <p className="muted" style={{ maxWidth: 560 }}>{t('landing.tools.subtitle')}</p>
            </div>
          </FadeUp>

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

      {/* ── 6. HOW IT WORKS ───────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <FadeUp>
            <div className="section-hd">
              <span className="eyebrow">{t('landing.how.eyebrow')}</span>
              <h2 className="h1">{t('landing.how.title')}</h2>
            </div>
          </FadeUp>

          <StaggerGrid className="how-steps-grid">
            {[
              { num: '1', title: t('landing.how.step1.title'), desc: t('landing.how.step1.desc') },
              { num: '2', title: t('landing.how.step2.title'), desc: t('landing.how.step2.desc') },
              { num: '3', title: t('landing.how.step3.title'), desc: t('landing.how.step3.desc') },
            ].map((step, i) => (
              <motion.div key={i} className="how-step" variants={cardVariants}>
                <div className="how-step-num">{step.num}</div>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: 'var(--fg)' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── 7. PRICING ────────────────────────────────────────── */}
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
                <p className="plan-price">€0<small>/{lang === 'fr' ? 'mois' : 'month'}</small></p>
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

            {/* Pro plan with urgency banner */}
            <motion.div variants={cardVariants}>
              <div className="pricing-urgency">{t('landing.pricing.earlybird')}</div>
              <div className="plan featured plan-with-urgency">
                <div>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="plan-name">Pro</h3>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                      {t('landing.pricing.pro.recommended')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px' }}>{t('landing.pricing.pro.tagline')}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <p className="plan-price" style={{ margin: 0 }}>€49<small style={{ color: 'rgba(255,255,255,0.6)' }}>/{lang === 'fr' ? 'mois' : 'month'}</small></p>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>{t('landing.pricing.pro.original')}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{t('landing.pricing.pro.note')}</p>
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
              </div>
            </motion.div>
          </StaggerGrid>
        </div>
      </section>

      {/* ── 8. FAQ ────────────────────────────────────────────── */}
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

      {/* ── 9. FINAL CTA ──────────────────────────────────────── */}
      <FadeUp>
        <section className="lp-final-dark">
          <div className="container-narrow">
            <h2 className="h1" style={{ marginBottom: 16, color: '#fff' }}>{t('landing.final.title')}</h2>
            <p style={{ marginBottom: 32, color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>{t('landing.final.sub')}</p>
            <motion.button
              className="btn btn-accent btn-lg"
              onClick={() => navigate('/auth?mode=register')}
              whileHover={reduce ? {} : { scale: 1.025 }}
              whileTap={reduce ? {} : { scale: 0.975 }}
              style={{ cursor: 'pointer' }}
            >
              {t('landing.final.cta')}
            </motion.button>

            {/* Social proof */}
            <div className="lp-social-inline">
              <div className="lp-social-avatars">
                {['ML', 'TK', 'SR', 'AB', 'CL'].map((init, i) => (
                  <div
                    key={i}
                    className="lp-avatar"
                    style={{ background: ['#818CF8', '#34D399', '#F472B6', '#FB923C', '#60A5FA'][i] }}
                    aria-hidden="true"
                  >
                    {init}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{t('landing.final.social')}</p>
            </div>
          </div>
        </section>
      </FadeUp>

      <MarketingFooter />
    </>
  );
}
