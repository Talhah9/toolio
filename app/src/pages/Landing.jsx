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
  const rows = lang === 'fr' ? [
    ['Rédaction de devis',           false, true],
    ['Contrats prêts en 30s',        false, true],
    ['CGV & mentions légales IA',    false, true],
    ['Posts LinkedIn optimisés',     false, true],
    ['Relances clients automatiques',false, true],
    ['Audit de profil freelance',    false, true],
    ['Support & mises à jour',       false, true],
  ] : [
    ['Quote drafting',               false, true],
    ['Contracts in 30s',             false, true],
    ['AI terms & legal notices',     false, true],
    ['Optimised LinkedIn posts',     false, true],
    ['Automated client follow-ups',  false, true],
    ['Freelance profile audit',      false, true],
    ['Support & updates',            false, true],
  ];

  return (
    <section style={{ background: '#FDFCF7', padding: '100px 24px 80px', borderTop: '1px solid #EDE9D8' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            {lang === 'fr' ? 'L\'arme ultime' : 'The ultimate weapon'}
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {lang === 'fr' ? <>Arrêtez de bricoler.<br /><span style={{ color: '#4F46E5' }}>Passez à l'essentiel.</span></> : <>Stop hacking it.<br /><span style={{ color: '#4F46E5' }}>Get to what matters.</span></>}
          </h2>
          <p style={{ fontSize: 16, color: '#6B6B8A', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            {lang === 'fr' ? 'Comparé aux solutions bricolées, Savvly vous fait gagner 10h par semaine — minimum.' : 'Compared to patchwork solutions, Savvly saves you 10h a week — minimum.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start', maxWidth: 1000, margin: '0 auto' }}>
          {/* Comparison table */}
          <FadeUp>
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(15,15,60,0.07)', border: '1px solid #EDE9D8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px', background: '#F7F7FF', padding: '14px 20px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #EDE9D8' }}>
                <span style={{ color: '#6B6B8A' }}>{lang === 'fr' ? 'Fonctionnalité' : 'Feature'}</span>
                <span style={{ textAlign: 'center', color: '#9CA3AF' }}>{lang === 'fr' ? 'Autres' : 'Others'}</span>
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
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{lang === 'fr' ? 'Génération en cours…' : 'Generating…'}</span>
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
              {lang === 'fr' ? 'Essayer gratuitement →' : 'Try for free →'}
            </motion.button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── "4 outils qui changent tout" ──────────────────────────────

const FEATURED_TOOLS = [
  { id: 'linkedin-content', color: '#4F46E5', points: [20,55,35,70,25,80,15,95] },
  { id: 'legal',            color: '#10B981', points: [20,90,35,75,50,80,65,60,80,45,95,20] },
  { id: 'devis',            color: '#F59E0B', points: [20,85,40,70,60,55,80,35,95,15] },
  { id: 'contract',         color: '#EF4444', points: [20,95,40,75,60,60,80,40,95,20] },
];

function MiniChart({ points, color }) {
  const n = points.length;
  const coords = [];
  for (let i = 0; i < n; i += 2) {
    coords.push(`${points[i]},${points[i + 1]}`);
  }
  const polyline = coords.join(' ');
  const fill = `${polyline} ${coords[coords.length - 1].split(',')[0]},100 ${coords[0].split(',')[0]},100`;
  return (
    <svg width="100%" height="48" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={fill} fill={color} fillOpacity={0.15} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].split(',')[0]} cy={coords[coords.length - 1].split(',')[1]} r="4" fill={color} />
    </svg>
  );
}

function FeaturedTools({ lang, navigate, reduce }) {
  const labels = {
    'linkedin-content': { fr: 'LinkedIn Content', en: 'LinkedIn Content', uses: '3 421', fr_desc: 'Rédigez des posts qui engagent votre audience en quelques secondes.', en_desc: 'Write posts that engage your audience in seconds.' },
    'legal':            { fr: 'Docs Juridiques', en: 'Legal Docs', uses: '2 134', fr_desc: 'CGV, mentions légales et politique de confidentialité en 30s.', en_desc: 'Terms, legal notices and privacy policy in 30s.' },
    'devis':            { fr: 'Devis Pro',        en: 'Pro Quotes', uses: '1 567', fr_desc: 'Générez des devis professionnels qui convainquent vos clients.', en_desc: 'Generate professional quotes that win clients.' },
    'contract':         { fr: 'Contrats',         en: 'Contracts', uses: '1 891', fr_desc: 'Contrats freelance prêts à signer, personnalisés à votre activité.', en_desc: 'Sign-ready freelance contracts tailored to your business.' },
  };

  return (
    <section style={{ background: '#fff', padding: '100px 24px', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(250,208,44,0.12)', border: '1px solid rgba(250,208,44,0.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              {lang === 'fr' ? '⭐ Les favoris' : '⭐ Top picks'}
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {lang === 'fr' ? <>4 outils qui <span style={{ color: '#4F46E5' }}>changent tout</span></> : <>4 tools that <span style={{ color: '#4F46E5' }}>change everything</span></>}
            </h2>
            <p style={{ fontSize: 16, color: '#6B6B8A', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              {lang === 'fr' ? 'Les outils les plus utilisés par notre communauté de freelances.' : 'The most used tools by our freelance community.'}
            </p>
          </div>
        </FadeUp>

        <StaggerGrid style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {FEATURED_TOOLS.map(({ id, color, points }) => {
            const info = labels[id];
            return (
              <motion.div
                key={id}
                variants={cardVariants}
                onClick={() => navigate('/auth?mode=register')}
                style={{ background: '#fff', border: '1.5px solid #EDE9D8', borderRadius: 20, padding: '24px 24px 20px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                whileHover={reduce ? {} : { y: -4, boxShadow: `0 12px 40px ${color}22`, borderColor: color + '44', transition: { duration: 0.2 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F0F1A', marginBottom: 4 }}>{lang === 'fr' ? info.fr : info.en}</div>
                    <div style={{ fontSize: 12, color: color, fontWeight: 700 }}>{info.uses} {lang === 'fr' ? 'utilisations' : 'uses'}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 4, boxShadow: `0 0 8px ${color}` }} />
                </div>
                <p style={{ fontSize: 13, color: '#6B6B8A', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {lang === 'fr' ? info.fr_desc : info.en_desc}
                </p>
                <MiniChart points={points} color={color} />
              </motion.div>
            );
          })}
        </StaggerGrid>
      </div>
    </section>
  );
}

// ── New Community section (coral/orange) ──────────────────────

function CommunitySection({ lang, navigate, reduce }) {
  const stats = lang === 'fr'
    ? [{ n: '200+', label: 'membres actifs' }, { n: '13', label: 'outils IA' }, { n: '1', label: 'consultation offerte aux 50 premiers' }]
    : [{ n: '200+', label: 'active members' }, { n: '13', label: 'AI tools' }, { n: '1', label: 'free consultation for first 50' }];
  return (
    <FadeUp>
      <section style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF4757 100%)', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
              🔥 {lang === 'fr' ? 'Communauté' : 'Community'}
            </span>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {lang === 'fr' ? <>Rejoignez les freelances<br />qui passent au niveau sup.</> : <>Join the freelancers<br />levelling up together.</>}
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 540 }}>
              {lang === 'fr' ? 'Trouvez des missions, partagez vos opportunités, échangez avec des pairs qui comprennent vos défis.' : 'Find missions, share opportunities, connect with peers who get your challenges.'}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
              {stats.map(({ n, label }, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, maxWidth: 120, lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>

            <motion.button
              onClick={() => navigate('/community')}
              style={{ background: '#fff', color: '#FF6B35', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 900, fontSize: 16, cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
              whileHover={reduce ? {} : { scale: 1.03, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              {lang === 'fr' ? 'Rejoindre la communauté →' : 'Join the community →'}
            </motion.button>
          </div>
        </div>
      </section>
    </FadeUp>
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
        </div>
      </section>

      {/* ── NEW: "L'arme ultime" comparison ──────────────────── */}
      <UltimateSection lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── NEW: 4 outils qui changent tout ──────────────────── */}
      <FeaturedTools lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── 2. PAIN POINTS ────────────────────────────────────── */}
      <TornEdge topColor="#fff" bottomColor="#0A0A0A" />
      <FadeUp>
        <section className="lp-dark section lp-pain-section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-hd" style={{ marginBottom: 40 }}>
              <span className="eyebrow">{t('landing.pain.eyebrow')}</span>
              <h2 className="h1" style={{ color: '#fff', maxWidth: 680 }}>
                {lang === 'fr' ? (
                  <>Vous êtes devenu freelance pour faire du bon travail.<br />Pas pour passer 3 heures sur un devis.</>
                ) : (
                  <>You became a freelancer to do great work.<br />Not to spend 3 hours on a quote.</>
                )}
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

      <TornEdge topColor="#0A0A0A" bottomColor="var(--bg-soft)" flip />

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
                <p className="plan-price">{format(0)}<small>/{lang === 'fr' ? 'mois' : 'month'}</small></p>
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
                    <p className="plan-price" style={{ margin: 0 }}>{format(15)}<small style={{ color: 'rgba(255,255,255,0.6)' }}>/{lang === 'fr' ? 'mois' : 'month'}</small></p>
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

      {/* ── 10. FAQ ───────────────────────────────────────────── */}
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

      {/* ── LIVE ACTIVITY FEED (fixed, desktop only) ──────────── */}
      <ActivityFeed lang={lang} />
    </>
  );
}
