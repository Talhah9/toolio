import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { TOOLS, getToolText } from '../data/catalog';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../hooks/useCurrency';

const ease = [0.25, 0.46, 0.45, 0.94];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const TOOL_POPULARITY = {
  'audit':            1247,
  'compete':           683,
  'legal':            2134,
  'contract':         1891,
  'linkedin-content': 3421,
  'image':             912,
  'devis':            1567,
  'relance':           847,
  'statut':            623,
  'urssaf':            541,
  'linkedin-intel':    489,
  'prospection':       731,
  'mission-finder':    298,
};

const ACTIVITY = {
  en: [
    { name: 'Lucas',  action: 'just generated a contract' },
    { name: 'Marie',  action: 'joined 2 minutes ago' },
    { name: 'Thomas', action: 'sent a quote to his client' },
    { name: 'Sophie', action: 'generated her CGV in 30s' },
    { name: 'Alex',   action: 'just upgraded to Pro' },
  ],
  fr: [
    { name: 'Lucas',  action: 'vient de générer un contrat' },
    { name: 'Marie',  action: 'vient de rejoindre Savvly' },
    { name: 'Thomas', action: 'a envoyé un devis à son client' },
    { name: 'Sophie', action: 'a généré ses CGV en 30s' },
    { name: 'Alex',   action: 'vient de passer en Pro' },
  ],
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
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Animated counter hook ─────────────────────────────────────

function useCountUp(end, duration, inView) {
  const [count, setCount] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setCount(end); return; }
    let startTime = null;
    let rafId;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(easeOut(progress) * end));
      if (progress < 1) rafId = requestAnimationFrame(animate);
      else setCount(end);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [inView, end, duration, reduce]);

  return count;
}

function AnimatedStat({ end, suffix = '', duration = 1.5, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const count = useCountUp(end, duration, inView);
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-value" style={{ color: '#fff' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="stat-label" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</div>
    </div>
  );
}

// ── Live activity feed ────────────────────────────────────────

function ActivityFeed({ lang }) {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let hideTimer;
    let nextTimer;
    let idx = 0;

    const showNext = () => {
      const msgs = lang === 'fr' ? ACTIVITY.fr : ACTIVITY.en;
      setCurrentIdx(idx % msgs.length);
      idx += 1;
      setVisible(true);
      hideTimer = setTimeout(() => {
        setVisible(false);
        nextTimer = setTimeout(showNext, 8000 + Math.random() * 4000);
      }, 4000);
    };

    nextTimer = setTimeout(showNext, 3000);
    return () => { clearTimeout(hideTimer); clearTimeout(nextTimer); };
  }, [lang, reduce]);

  const msgs = lang === 'fr' ? ACTIVITY.fr : ACTIVITY.en;
  const msg = msgs[currentIdx];

  return (
    <div className="activity-feed-wrap" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={currentIdx}
            className="activity-toast"
            initial={{ opacity: 0, y: 16, x: -8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <span className="activity-dot" aria-hidden="true" />
            <div>
              <span className="activity-name">{msg.name}</span>
              <span className="activity-action"> {msg.action}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Early access urgency bar ──────────────────────────────────

function UrgencyBar({ lang }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const spots = 67;

  return (
    <div ref={ref} className="urgency-bar">
      <div className="urgency-inner">
        <span className="urgency-flame" aria-hidden="true">🔥</span>
        <span className="urgency-text">
          {lang === 'fr'
            ? <><strong>{spots}/100 places</strong> d'accès anticipé réservées</>
            : <>Early access pricing — <strong>{spots}/100 spots</strong> taken</>}
        </span>
        <div className="urgency-progress-wrap" role="progressbar" aria-valuenow={spots} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="urgency-progress-fill"
            initial={{ width: 0 }}
            animate={inView ? { width: `${spots}%` } : { width: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          />
        </div>
        <span className="urgency-pct">{spots}%</span>
      </div>
    </div>
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

// ── Testimonial carousel ──────────────────────────────────────

function TestimonialCarousel({ t }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const items = [1, 2, 3, 4, 5, 6].map(i => ({
    quote: t(`landing.testimonial.${i}.quote`),
    name:  t(`landing.testimonial.${i}.name`),
    role:  t(`landing.testimonial.${i}.title`),
  }));

  const n = items.length;
  const prev = () => setActive(i => (i - 1 + n) % n);
  const next = () => setActive(i => (i + 1) % n);

  const getOffset = (i) => {
    let off = i - active;
    if (off >  n / 2) off -= n;
    if (off < -n / 2) off += n;
    return off;
  };

  const xMap    = { '-2': -310, '-1': -175, 0: 0, 1: 175, 2: 310 };
  const scaleMap = { '-2': 0.72, '-1': 0.85, 0: 1, 1: 0.85, 2: 0.72 };
  const rotMap  = { '-2': -6,   '-1': -3,   0: 0, 1: 3,    2: 6   };
  const zMap    = { '-2': 0,    '-1': 1,    0: 3, 1: 1,    2: 0   };
  const opMap   = { '-2': 0.35, '-1': 0.7,  0: 1, 1: 0.7,  2: 0.35 };

  return (
    <div className="tc-wrap">
      <div className="tc-track" aria-live="polite">
        {items.map((item, i) => {
          const off = getOffset(i);
          if (Math.abs(off) > 2) return null;
          const key  = String(off);
          const isActive = off === 0;
          return (
            <motion.div
              key={i}
              className={`tc-card${isActive ? ' tc-card--active' : ''}`}
              animate={reduce ? {} : {
                x: xMap[key], scale: scaleMap[key], rotate: rotMap[key],
                opacity: opMap[key], zIndex: zMap[key],
              }}
              initial={false}
              transition={{ duration: 0.45, ease }}
              onClick={() => !isActive && setActive(i)}
              style={{ cursor: isActive ? 'default' : 'pointer' }}
            >
              <div className="tc-stars" aria-label="5 stars">★★★★★</div>
              <p className="tc-quote">"{item.quote}"</p>
              <div className="tc-author">
                <div className="tc-name">{item.name}</div>
                <div className="tc-role">{item.role}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="tc-nav">
        <button className="tc-btn" onClick={prev} aria-label="Previous testimonial">
          <Glyph name="arrow-left" size={16} />
        </button>
        <div className="tc-dots" role="tablist">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Testimonial ${i + 1}`}
              className={`tc-dot${i === active ? ' tc-dot--active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <button className="tc-btn" onClick={next} aria-label="Next testimonial">
          <Glyph name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Coaching testimonials ─────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Josi GAUDENS',
    role: 'Experte Shopify, Fondatrice @JOSIFY',
    quote: "J'ai eu la chance de me former auprès de Talhah, et je recommande son coaching sans hésitation. Ses explications sont claires, accessibles et vraiment adaptées au niveau de la personne qu'il accompagne. Une communication fluide, une bonne ambiance et une vraie bienveillance.",
  },
  {
    name: 'Romain Sansiquet',
    role: 'Web design | UX/UI | Growth',
    quote: "Avant mon profil manquait de clarté. Grâce à son accompagnement, j'ai pu structurer mes idées, améliorer ma page et créer un profil plus lisible. Clair, efficace et concret. Je recommande.",
  },
  {
    name: 'Mireille Randriamalisoa',
    role: 'Assistante Virtuelle | PME & indépendants',
    quote: "Un accompagnement qui fait vraiment la différence. Grâce à toi, je ne suis plus restée bloquée à réfléchir — je me suis lancée, avec une vraie direction et des actions concrètes. Clair et efficace, c'est exactement ce qu'il faut pour passer au niveau supérieur.",
  },
  {
    name: 'Intissar Ben Yahia',
    role: 'Consultante Sourcing IT | Fondatrice INBY Recrutement',
    quote: "Efficacité, expertise et surtout beaucoup d'humanité. Tu as su mettre le doigt sur les points clés pour ma visibilité avec une justesse impressionnante. Une aide précieuse qui donne une vraie impulsion !",
  },
  {
    name: 'Princia Rajoelisoa',
    role: 'Stratège médias sociaux',
    quote: 'Franchement, très sympa et pro comme accompagnement. Je recommande.',
  },
];

function CoachingTestimonials() {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDir(1);
      setCurrent(c => (c + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const go = (idx) => {
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const variants = {
    enter:  d => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   d => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
  };

  const item = TESTIMONIALS[current];

  return (
    <div>
      <div style={{ overflow: 'hidden', borderRadius: 20 }}>
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={current}
            custom={dir}
            variants={reduce ? {} : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ background: '#fff', borderRadius: 20, padding: '36px 40px', boxShadow: '0 8px 40px rgba(15,15,60,0.08)', minHeight: 260 }}
          >
            <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="17" height="17" viewBox="0 0 16 16" fill="#fad02c"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>
              ))}
            </div>
            <p style={{ fontSize: 15, color: '#1E1E3A', lineHeight: 1.75, margin: '0 0 28px', fontStyle: 'italic' }}>
              "{item.quote}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {item.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F0F1A' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#7B7B9A', marginTop: 2 }}>{item.role}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            style={{ width: i === current ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === current ? '#4F46E5' : '#D1D5DB', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }}
          />
        ))}
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

// ── Torn paper edge ───────────────────────────────────────────

function TornEdge({ topColor = '#0A0A0A', bottomColor = '#fff', flip = false }) {
  const path = "M0,0 L0,32 Q48,52 96,32 Q144,12 192,32 Q240,52 288,32 Q336,12 384,36 Q432,56 480,36 Q528,16 576,36 Q624,56 672,36 Q720,16 768,38 Q816,56 864,38 Q912,20 960,38 Q1008,56 1056,38 Q1104,18 1152,38 Q1200,56 1248,36 Q1296,16 1344,36 Q1392,56 1440,36 L1440,0 Z";
  return (
    <div style={{ position: 'relative', height: 52, overflow: 'hidden', background: bottomColor, flexShrink: 0 }}>
      <svg viewBox="0 0 1440 52" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', transform: flip ? 'scaleY(-1)' : 'none', display: 'block' }}>
        <path d={path} fill={topColor} />
      </svg>
    </div>
  );
}

// ── "L'arme ultime" comparison section ───────────────────────

function UltimateSection({ lang, navigate, reduce }) {
  const { t } = useLang();
  const rows = [
    [t('landing.ultimate.row.1'), false, true],
    [t('landing.ultimate.row.2'), false, true],
    [t('landing.ultimate.row.3'), false, true],
    [t('landing.ultimate.row.4'), false, true],
    [t('landing.ultimate.row.5'), false, true],
    [t('landing.ultimate.row.6'), false, true],
    [t('landing.ultimate.row.7'), false, true],
  ];

  return (
    <section style={{ background: '#FDFCF7', padding: '100px 24px 80px', borderTop: '1px solid #EDE9D8' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            {t('landing.ultimate.badge')}
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {t('landing.ultimate.h2.line1')}<br /><span style={{ color: '#4F46E5' }}>{t('landing.ultimate.h2.line2')}</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start', maxWidth: 1000, margin: '0 auto' }}>
          {/* Comparison table */}
          <FadeUp>
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(15,15,60,0.07)', border: '1px solid #EDE9D8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px', background: '#F7F7FF', padding: '14px 20px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #EDE9D8' }}>
                <span style={{ color: '#6B6B8A' }}>{t('landing.ultimate.col.feature')}</span>
                <span style={{ textAlign: 'center', color: '#9CA3AF' }}>{t('landing.ultimate.col.others')}</span>
                <span style={{ textAlign: 'center', color: '#4F46E5' }}>Savvly</span>
              </div>
              {rows.map(([label, others, savvly], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px', padding: '13px 20px', borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#2D2D4A', fontWeight: 500 }}>{label}</span>
                  <span style={{ textAlign: 'center', fontSize: 16 }}>
                    {others ? '✓' : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </span>
                  <span style={{ textAlign: 'center', fontSize: 16 }}>
                    {savvly ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* CSS Laptop mockup */}
          <FadeUp delay={0.15}>
            <div style={{ position: 'relative' }}>
              {/* Screen */}
              <div style={{ background: '#1E1E3A', borderRadius: '14px 14px 4px 4px', padding: '28px 20px 20px', border: '6px solid #2D2D4A', boxShadow: '0 20px 60px rgba(15,15,60,0.3)', position: 'relative', overflow: 'hidden' }}>
                {/* Browser chrome */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                {/* URL bar */}
                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  app.savvly.fr/tools/devis
                </div>
                {/* Content lines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #4F46E5, #818CF8)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginBottom: 4 }} />
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, width: '65%' }} />
                    </div>
                  </div>
                  {[85, 70, 90, 55, 75].map((w, i) => (
                    <div key={i} style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, width: `${w}%` }} />
                  ))}
                  <div style={{ marginTop: 8, background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'blink 1s step-end infinite' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t('landing.ultimate.generating')}</span>
                  </div>
                </div>
              </div>
              {/* Base */}
              <div style={{ background: '#2D2D4A', height: 10, borderRadius: '0 0 6px 6px', margin: '0 8px' }} />
              <div style={{ background: '#1E1E3A', height: 5, borderRadius: '0 0 12px 12px', width: '60%', margin: '0 auto' }} />

              {/* Floating badge */}
              <motion.div
                animate={reduce ? {} : { y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -16, right: -16, background: '#fad02c', color: '#0F0F1A', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 900, boxShadow: '0 8px 24px rgba(250,208,44,0.4)', zIndex: 2 }}
              >
                30s ⚡
              </motion.div>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.2}>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <motion.button
              onClick={() => navigate('/auth?mode=register')}
              style={{ background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 900, fontSize: 16, cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
              whileHover={reduce ? {} : { scale: 1.03, boxShadow: '0 12px 40px rgba(79,70,229,0.45)' }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              {t('landing.ultimate.cta')}
            </motion.button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── "4 outils qui changent tout" ──────────────────────────────

// ── Bento card illustrations ─────────────────────────────────

const LI_POSTS = [
  "J'ai doublé mon TJM en 6 mois.\n\n→ J'ai arrêté de vendre du temps\n→ J'ai packagé mon offre\n→ J'ai posté 1x/jour\n\n3 nouveaux clients en 30 jours.",
  "On m'a dit que mon tarif était trop élevé.\n\nJ'ai quand même signé.\n\nLa valeur que j'apporte est réelle.",
];

function IlluLinkedIn({ reduce }) {
  const [postIdx, setPostIdx] = useState(0);
  const [text, setText] = useState('');
  const [capped, setCapped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const post = LI_POSTS[postIdx];
    setCapped(false);
    setText('');
    if (reduce) { setText(post); return; }
    let c = 0;
    const tick = setInterval(() => {
      c += 1;
      const next = post.slice(0, c);
      setText(next);
      if (textRef.current && textRef.current.scrollHeight > textRef.current.clientHeight) {
        clearInterval(tick);
        setCapped(true);
        setTimeout(() => {
          setCapped(false);
          setText('');
          setPostIdx(i => (i + 1) % LI_POSTS.length);
        }, 2000);
        return;
      }
      if (c >= post.length) {
        clearInterval(tick);
        setTimeout(() => {
          setText('');
          setPostIdx(i => (i + 1) % LI_POSTS.length);
        }, 2000);
      }
    }, 40);
    return () => clearInterval(tick);
  }, [postIdx, reduce]);

  const post = LI_POSTS[postIdx];
  const typing = text.length < post.length && !capped;

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '14px 16px', fontSize: 12, color: '#1D1D1F', lineHeight: 1.75, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#818CF8)', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#0F0F1A' }}>Talhah Ally</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Freelance & Coach Business</div>
        </div>
      </div>
      <div ref={textRef} style={{ maxHeight: 180, overflowY: 'hidden', whiteSpace: 'pre-line' }}>
        <span>{text}</span>
        {capped && <span>…</span>}
        {typing && <span style={{ color: '#4F46E5', fontWeight: 700, animation: 'blink 1s step-end infinite' }}>|</span>}
      </div>
    </div>
  );
}

function IlluAudit({ reduce }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [score, setScore] = useState(0);
  const R = 38;
  const circ = 2 * Math.PI * R;

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setScore(85); return; }
    let v = 0;
    const id = setInterval(() => { v = Math.min(v + 1, 85); setScore(v); if (v >= 85) clearInterval(id); }, 18);
    return () => clearInterval(id);
  }, [inView, reduce]);

  const filled = (score / 100) * circ;
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round" />
        <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0F0F1A">{score}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 140 }}>
        {[['SEO', 88], ['CRO', 72], ['Perf.', 91]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#6B7280', width: 32 }}>{l}</span>
            <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${v}%`, background: '#4F46E5', borderRadius: 2, transition: 'width 1.2s ease' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', width: 24, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IlluDevis() {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px', fontSize: 10.5, color: '#374151', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, color: '#0F0F1A' }}>DEVIS — 2026-042</div>
          <div style={{ color: '#9CA3AF', marginTop: 2 }}>Valable 30 jours</div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>Gratuit</div>
      </div>
      {[['Refonte UI mobile', '1', '4 500€'], ['Intégration Stripe', '1', '800€']].map(([d, q, p], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 24px 56px', gap: 4, padding: '5px 0', borderBottom: '1px solid #F9FAFB' }}>
          <span>{d}</span><span style={{ textAlign: 'center', color: '#9CA3AF' }}>{q}</span>
          <span style={{ textAlign: 'right', fontWeight: 600 }}>{p}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 900, fontSize: 11.5, borderTop: '2px solid #0F0F1A', paddingTop: 8, color: '#0F0F1A' }}>
        <span>TOTAL HT</span><span>5 300€</span>
      </div>
    </div>
  );
}

function IlluLegal() {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px', fontSize: 10.5, color: '#374151', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', flex: 1, overflow: 'hidden' }}>
      <div style={{ fontWeight: 900, fontSize: 12, color: '#0F0F1A', marginBottom: 10 }}>CONDITIONS GÉNÉRALES</div>
      {[
        { art: 'Art. 1 — Identification', active: true },
        { art: 'Art. 2 — Champ d\'application', active: false },
        { art: 'Art. 3 — Services proposés', active: false },
        { art: 'Art. 4 — Formation du contrat', active: false },
        { art: 'Art. 5 — Tarifs & Paiement', active: false },
      ].map(({ art, active }, i) => (
        <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #F9FAFB', color: active ? '#4F46E5' : '#6B7280', fontWeight: active ? 700 : 400 }}>{art}</div>
      ))}
      <div style={{ marginTop: 10, background: '#F0FDF4', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#065F46', fontWeight: 700 }}>
        ✓ Conforme droit français · RGPD
      </div>
    </div>
  );
}

// ── Bento featured tools grid ─────────────────────────────────

function FeaturedTools({ lang, navigate, reduce }) {
  const { t } = useLang();
  const cards = [
    {
      title: t('landing.featured.li.title'),
      badge: { text: '⭐ BEST SELLER', bg: '#fad02c', color: '#78350F' },
      desc: t('landing.featured.li.desc'),
      uses: '3 421',
      accent: '#4F46E5',
      illu: <IlluLinkedIn reduce={reduce} />,
    },
    {
      title: t('landing.featured.audit.title'),
      badge: { text: 'Pro', bg: 'rgba(79,70,229,0.1)', color: '#4F46E5' },
      desc: t('landing.featured.audit.desc'),
      uses: '1 247',
      accent: '#10B981',
      illu: <IlluAudit reduce={reduce} />,
    },
    {
      title: t('landing.featured.devis.title'),
      badge: { text: t('landing.featured.devis.badge'), bg: '#D1FAE5', color: '#065F46' },
      desc: t('landing.featured.devis.desc'),
      uses: '1 567',
      accent: '#F59E0B',
      illu: <IlluDevis />,
    },
    {
      title: t('landing.featured.legal.title'),
      badge: { text: 'Pro', bg: 'rgba(79,70,229,0.1)', color: '#4F46E5' },
      desc: t('landing.featured.legal.desc'),
      uses: '2 134',
      accent: '#6366F1',
      illu: <IlluLegal />,
    },
  ];

  return (
    <section style={{ background: '#F5F5F7', padding: '100px 24px', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(250,208,44,0.15)', border: '1px solid rgba(250,208,44,0.4)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              {t('landing.featured.badge')}
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {lang === 'fr' ? <>4 outils <span style={{ color: '#4F46E5' }}>indispensables</span></> : <>4 <span style={{ color: '#4F46E5' }}>essential</span> tools</>}
            </h2>
            <p style={{ fontSize: 16, color: '#6B6B8A', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              {t('landing.featured.sub')}
            </p>
          </div>
        </FadeUp>

        <div className="featured-tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 960, margin: '0 auto' }}>
          {cards.map((card, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <motion.div
                onClick={() => navigate('/auth?mode=register')}
                style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,15,60,0.06)', cursor: 'pointer', display: 'grid', gridTemplateColumns: '50% 50%', minHeight: 320, border: '1px solid rgba(0,0,0,0.05)' }}
                whileHover={reduce ? {} : { y: -4, boxShadow: `0 16px 48px ${card.accent}20`, transition: { duration: 0.2 } }}
              >
                {/* Left: text */}
                <div style={{ padding: '32px 28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, overflow: 'hidden' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: card.badge.bg, color: card.badge.color, whiteSpace: 'nowrap' }}>
                        {card.badge.text}
                      </span>
                      <span style={{ fontSize: 11, color: card.accent, fontWeight: 700 }}>{card.uses} {t('landing.featured.uses')}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0F0F1A', marginBottom: 12, lineHeight: 1.2 }}>{card.title}</div>
                    <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                  </div>
                  <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: card.accent }}>
                    {t('landing.featured.try')} →
                  </div>
                </div>
                {/* Right: illustration */}
                <div style={{ background: `${card.accent}08`, padding: '24px 20px', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${card.accent}15`, minWidth: 0, overflow: 'hidden' }}>
                  {card.illu}
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Newsletter lead magnet ────────────────────────────────────

function NewsletterSection({ reduce }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <FadeUp>
      <section style={{ background: '#FFF9F0', borderTop: '1px solid #EDE8E0', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(79,70,229,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
              {t('landing.newsletter.badge')}
            </span>

            <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 18px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {t('landing.newsletter.h2.line1')}<br />
              <span style={{ color: '#4F46E5' }}>
                {t('landing.newsletter.h2.line2')}
              </span>
            </h2>

            <p style={{ fontSize: 16, color: '#6B6B8A', margin: '0 0 44px', lineHeight: 1.65, maxWidth: 500 }}>
              {t('landing.newsletter.sub')}
            </p>

            {status === 'success' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F0F1A', marginBottom: 10 }}>
                  {t('landing.newsletter.success')}
                </div>
                <div style={{ fontSize: 14, color: '#6B6B8A' }}>
                  {t('landing.newsletter.success.sub')}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('landing.newsletter.placeholder')}
                  required
                  disabled={status === 'loading'}
                  style={{ flex: 1, minWidth: 220, background: '#fff', border: '1px solid #D1C9BE', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#0F0F1A', outline: 'none' }}
                />
                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 800, fontSize: 14, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, whiteSpace: 'nowrap' }}
                  whileHover={reduce || status === 'loading' ? {} : { scale: 1.03 }}
                  whileTap={reduce || status === 'loading' ? {} : { scale: 0.97 }}
                >
                  {status === 'loading' ? '...' : t('landing.newsletter.cta')}
                </motion.button>
                {status === 'error' && (
                  <p style={{ width: '100%', textAlign: 'center', fontSize: 13, color: '#DC2626', margin: '6px 0 0' }}>
                    {t('landing.newsletter.error')}
                  </p>
                )}
              </form>
            )}

            {status !== 'success' && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
                {t('landing.newsletter.disclaimer')}
              </p>
            )}
          </div>
        </div>
      </section>
    </FadeUp>
  );
}

// ── New Community section (coral/orange) ──────────────────────

function CommunitySection({ lang, navigate, reduce }) {
  const { t } = useLang();
  const stats = [
    { n: '200+', label: t('landing.community.stat1') },
    { n: '13',   label: t('landing.community.stat2') },
    { n: '1',    label: t('landing.community.stat3') },
  ];
  return (
    <FadeUp>
      <section style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(79,70,229,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,208,44,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
              🚀 {t('landing.community.badge')}
            </span>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {t('landing.community.h2.line1')}<br /><span style={{ color: '#4F46E5' }}>{t('landing.community.h2.line2')}</span>
            </h2>
            <p style={{ fontSize: 17, color: '#6B6B8A', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 540 }}>
              {t('landing.community.sub')}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
              {stats.map(({ n, label }, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: i === 1 ? '#D97706' : '#0F0F1A', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 13, color: '#6B6B8A', marginTop: 6, maxWidth: 130, lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>

            <motion.button
              onClick={() => navigate('/community')}
              style={{ background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 900, fontSize: 16, cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 8px 32px rgba(79,70,229,0.4)' }}
              whileHover={reduce ? {} : { scale: 1.03, boxShadow: '0 12px 40px rgba(79,70,229,0.5)' }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              {t('landing.community.cta')}
            </motion.button>
          </div>
        </div>
      </section>
    </FadeUp>
  );
}

// ── Container scroll — 3D laptop reveal ──────────────────────

const MOCKUP_TOOLS = [
  { label: 'Contenu LinkedIn', badge: '⭐ BEST SELLER', badgeBg: '#fad02c', badgeColor: '#78350F', dot: '#818CF8' },
  { label: 'Générateur de devis', badge: 'Gratuit', badgeBg: '#D1FAE5', badgeColor: '#065F46', dot: '#10B981' },
  { label: 'Relance client', badge: 'Gratuit', badgeBg: '#D1FAE5', badgeColor: '#065F46', dot: '#34D399' },
  { label: 'CGV & mentions légales', badge: 'Pro', badgeBg: 'rgba(79,70,229,0.1)', badgeColor: '#4F46E5', dot: '#6366F1' },
  { label: 'Contrat freelance', badge: 'Pro', badgeBg: 'rgba(79,70,229,0.1)', badgeColor: '#4F46E5', dot: '#A78BFA' },
  { label: 'Audit CRO + SEO', badge: 'Pro', badgeBg: 'rgba(79,70,229,0.1)', badgeColor: '#4F46E5', dot: '#F59E0B' },
];

function ContainerScroll({ lang, navigate, reduce }) {
  const { t } = useLang();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const rotateX    = useTransform(scrollYProgress, [0, 0.45], [25, 0]);
  const scale      = useTransform(scrollYProgress, [0, 0.45], [1.15, 1]);
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const boxShadow  = useTransform(
    scrollYProgress,
    [0, 0.45],
    ['0 60px 120px rgba(0,0,0,0.35)', '0 20px 60px rgba(0,0,0,0.12)'],
  );

  return (
    <section ref={containerRef} style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '100px 24px 80px' }}>
      <div className="container">
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              {t('landing.dash.badge')}
            </span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {t('landing.dash.h2.line1')}<br /><span style={{ color: '#4F46E5' }}>{t('landing.dash.h2.line2')}</span>
            </h2>
            <p style={{ fontSize: 16, color: '#6B6B8A', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              {t('landing.dash.sub')}
            </p>
          </div>
        </FadeUp>

        <div style={{ perspective: '800px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div style={{
            rotateX:         reduce ? 0 : rotateX,
            scale:           reduce ? 1 : scale,
            y:               reduce ? 0 : translateY,
            transformOrigin: 'top center',
            border:          '8px solid #222',
            borderRadius:    20,
            overflow:        'hidden',
            boxShadow:       reduce ? '0 20px 60px rgba(0,0,0,0.12)' : boxShadow,
          }}>
              {/* Browser chrome */}
              <div style={{ background: '#1C1C1E', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', maxWidth: 260, margin: '0 auto', textAlign: 'center' }}>
                  app.savvly.fr/dashboard
                </div>
              </div>
              {/* App shell */}
              <div style={{ display: 'flex', minHeight: 460, background: '#F9FAFB' }}>
                {/* Sidebar */}
                <div style={{ width: 200, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '20px 0', flexShrink: 0 }}>
                  <div style={{ padding: '0 16px 20px', fontWeight: 900, fontSize: 15, color: '#4F46E5' }}>Savvly</div>
                  {['Dashboard', 'Outils', 'Plan & crédits', 'Profil'].map((item, i) => (
                    <div key={i} style={{ padding: '9px 16px', fontSize: 13, color: i === 0 ? '#4F46E5' : '#6B7280', fontWeight: i === 0 ? 700 : 400, background: i === 0 ? 'rgba(79,70,229,0.08)' : 'transparent', borderRight: i === 0 ? '2px solid #4F46E5' : 'none' }}>{item}</div>
                  ))}
                </div>
                {/* Main */}
                <div style={{ flex: 1, padding: '24px 28px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0F0F1A' }}>{t('landing.dash.tools.title')}</div>
                      <div style={{ fontSize: 13, color: '#9CA3AF' }}>{t('landing.dash.tools.sub')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>50 crédits</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: 'rgba(79,70,229,0.1)', color: '#4F46E5' }}>Pro</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {MOCKUP_TOOLS.map((tk, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 14px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${tk.dot}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: tk.dot }} />
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: tk.badgeBg, color: tk.badgeColor, whiteSpace: 'nowrap' }}>{tk.badge}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0F0F1A', lineHeight: 1.4 }}>{tk.label}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8 }}>{t('landing.dash.use')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </motion.div>
        </div>

        <FadeUp delay={0.2}>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <motion.button
              onClick={() => navigate('/auth?mode=register')}
              style={{ background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 900, fontSize: 16, cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
              whileHover={reduce ? {} : { scale: 1.03, boxShadow: '0 12px 40px rgba(79,70,229,0.45)' }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              {t('landing.dash.cta')}
            </motion.button>
          </div>
        </FadeUp>
      </div>
    </section>
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

function HeroOutputCard({ t, lang, startIdx = 0 }) {
  const [idx, setIdx] = useState(startIdx);
  const reduce = useReducedMotion();

  // Reset to startIdx on language switch
  useEffect(() => { setIdx(startIdx); }, [lang, startIdx]);

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
  const { format } = useCurrency();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const freeTools = TOOLS.filter(tool => tool.plan === 'free');
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

        {/* Floating card — desktop only */}
        <motion.div
          className="hero-side-card"
          initial={reduce ? false : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          aria-hidden="true"
        >
          <HeroOutputCard t={t} lang={lang} startIdx={0} />
        </motion.div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
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
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease }}
            >
              {t('landing.hero.title')}
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
        </div>
      </section>

      {/* ── NEW: "L'arme ultime" comparison ──────────────────── */}
      <UltimateSection lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── NEW: 4 outils qui changent tout ──────────────────── */}
      <FeaturedTools lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── NEW: Dashboard scroll animation ──────────────────── */}
      <ContainerScroll lang={lang} navigate={navigate} reduce={reduce} />

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

      {/* ── 3b. NEWSLETTER ───────────────────────────────────── */}
      <NewsletterSection reduce={reduce} />

      {/* ── 4. SOCIAL PROOF — STATS + TESTIMONIALS ────────────── */}
      <section className="section lp-dark">
        <div className="container">
          <FadeUp>
            <div className="stat-bar">
              <AnimatedStat end={1200} suffix="+" duration={1.5} label={t('landing.stats.users.label')} />
              <AnimatedStat end={13}   suffix=""  duration={0.8} label={t('landing.stats.tools.label')} />
              <AnimatedStat end={50}   suffix=""  duration={1.0} label={t('landing.stats.credits.label')} />
              <AnimatedStat end={99}   suffix="%" duration={1.2} label={t('landing.stats.hosting.label')} />
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <TestimonialCarousel t={t} />
          </FadeUp>
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
              const uses = TOOL_POPULARITY[tool.id];
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
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      {uses && <span className="tool-usage-badge">{uses.toLocaleString()} uses</span>}
                      <Glyph name="arrow-right" size={14} />
                    </div>
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
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="tool-pro-badge">Pro ★</span>
                      <Glyph name="arrow-right" size={14} />
                    </div>
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
                <p className="plan-price">{format(0)}<small>/{t('landing.pricing.period')}</small></p>
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
                    <p className="plan-price" style={{ margin: 0 }}>{format(15)}<small style={{ color: 'rgba(255,255,255,0.6)' }}>/{t('landing.pricing.period')}</small></p>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{format(49)}</span>
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

      {/* ── 8. COMMUNITY (coral/orange) ──────────────────────── */}
      <CommunitySection lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── 9. COACHING ──────────────────────────────────────── */}
      <FadeUp>
        <section style={{ background: '#F7F7FF', borderTop: '1px solid #E4E4F0', padding: '96px 24px' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center', maxWidth: 1060, margin: '0 auto' }}>

              {/* LEFT — coach presentation */}
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
                  Coach Business ✦
                </span>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Travaillez avec notre<br />coach business
                </h2>
                <p style={{ fontSize: 16, color: '#4B4B6A', margin: '0 0 28px', lineHeight: 1.7 }}>
                  1h de consultation pour structurer votre activité, débloquer vos points de friction et repartir avec un plan d'action concret.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                  {[
                    'Analyse de votre situation actuelle',
                    'Stratégie claire et adaptée à votre contexte',
                    "Plan d'action concret à mettre en place dès le lendemain",
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span style={{ fontSize: 14, color: '#2D2D4A', lineHeight: 1.6 }}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <motion.button
                    onClick={() => navigate('/coaching')}
                    style={{ background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', letterSpacing: '0.01em' }}
                    whileHover={reduce ? {} : { scale: 1.03 }}
                    whileTap={reduce ? {} : { scale: 0.97 }}
                  >
                    Réserver — 80€
                  </motion.button>
                  <a href="https://talhahally.com/" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                    En savoir plus →
                  </a>
                </div>
              </div>

              {/* RIGHT — testimonials carousel */}
              <CoachingTestimonials />

            </div>
          </div>
        </section>
      </FadeUp>

      {/* ── 11. FAQ ───────────────────────────────────────────── */}
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
            <h2 className="h1" style={{ marginBottom: 16, color: '#0F0F1A' }}>{t('landing.final.title')}</h2>
            <p style={{ marginBottom: 32, color: '#6B6B8A', fontSize: 15 }}>{t('landing.final.sub')}</p>
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
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{t('landing.final.social')}</p>
            </div>
          </div>
        </section>
      </FadeUp>

      <MarketingFooter />

      {/* ── LIVE ACTIVITY FEED (fixed, desktop only) ──────────── */}
      <ActivityFeed lang={lang} />
    </>
  );
}
