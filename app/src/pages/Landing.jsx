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

// ── PDF Blueprint example section ────────────────────────────

function BlueprintSection({ navigate }) {
  const ff = "'Segoe UI', system-ui, sans-serif";
  return (
    <section style={{ background: '#FAFAFA', padding: '80px 24px', backgroundImage: 'linear-gradient(rgba(79,70,229,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <span style={{ background: '#4F46E5', color: 'white', borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>EXEMPLE RÉEL</span>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, margin: '16px 0 8px' }}>Voici ce que Savvly génère pour vous</h2>
        <p style={{ color: '#666', fontSize: 16 }}>Un rendu professionnel, prêt à envoyer à vos clients.</p>
      </div>

      {/* A4 PDF mockup */}
      <div style={{ maxWidth: 560, margin: '0 auto 52px' }}>
        <svg viewBox="0 0 794 1020" width="100%" style={{ borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)', display: 'block' }} xmlns="http://www.w3.org/2000/svg">

          {/* White page */}
          <rect width="794" height="1020" fill="white"/>

          {/* ── HEADER BAND ── */}
          <rect x="0" y="0" width="794" height="80" fill="#4F46E5"/>
          <text x="50" y="51" fill="white" fontSize="26" fontWeight="bold" fontFamily={ff}>Savvly</text>
          <text x="126" y="51" fill="#fad02c" fontSize="26" fontWeight="bold" fontFamily={ff}>.</text>
          <text x="744" y="44" textAnchor="end" fill="rgba(255,255,255,0.9)" fontSize="10" letterSpacing="0.18em" fontFamily={ff}>CONTRAT DE PRESTATION</text>
          <text x="744" y="61" textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="9" letterSpacing="0.1em" fontFamily={ff}>FREELANCE · 2026</text>

          {/* ── PARTIES ── */}
          <text x="397" y="108" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily={ff}>Paris, le 15 mai 2026</text>
          <text x="397" y="128" textAnchor="middle" fill="#4F46E5" fontSize="12" fontWeight="bold" fontFamily={ff}>N° NOVA-2026-018</text>

          {/* Prestataire box */}
          <rect x="50" y="142" width="310" height="110" fill="white" stroke="#E5E7EB" strokeWidth="1" rx="4"/>
          <rect x="50" y="142" width="310" height="24" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" rx="4"/>
          <rect x="50" y="154" width="310" height="12" fill="#F9FAFB"/>
          <text x="66" y="159" fill="#9CA3AF" fontSize="8" fontWeight="bold" letterSpacing="0.1em" fontFamily={ff}>PRESTATAIRE</text>
          <text x="66" y="180" fill="#111827" fontSize="13" fontWeight="bold" fontFamily={ff}>Alex Martin</text>
          <text x="66" y="197" fill="#6B7280" fontSize="10" fontFamily={ff}>Freelance Designer</text>
          <text x="66" y="212" fill="#6B7280" fontSize="10" fontFamily={ff}>alex@studio-am.fr</text>
          <text x="66" y="227" fill="#6B7280" fontSize="10" fontFamily={ff}>studio-am.fr</text>

          {/* Client box */}
          <rect x="434" y="142" width="310" height="110" fill="white" stroke="#E5E7EB" strokeWidth="1" rx="4"/>
          <rect x="434" y="142" width="310" height="24" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" rx="4"/>
          <rect x="434" y="154" width="310" height="12" fill="#F9FAFB"/>
          <text x="450" y="159" fill="#9CA3AF" fontSize="8" fontWeight="bold" letterSpacing="0.1em" fontFamily={ff}>CLIENT</text>
          <text x="450" y="180" fill="#111827" fontSize="13" fontWeight="bold" fontFamily={ff}>Sophie Leclerc</text>
          <text x="450" y="197" fill="#6B7280" fontSize="10" fontFamily={ff}>Agence Créative Nova</text>
          <text x="450" y="212" fill="#6B7280" fontSize="10" fontFamily={ff}>sophie@nova-agency.fr</text>

          {/* ── PURPLE ACCENT LINE ── */}
          <rect x="0" y="268" width="794" height="3" fill="#4F46E5"/>

          {/* ── ARTICLE 1 ── */}
          <rect x="50" y="288" width="3" height="22" fill="#4F46E5"/>
          <text x="62" y="304" fill="#111827" fontSize="12" fontWeight="bold" fontFamily={ff}>Article 1 — Objet de la mission</text>
          <rect x="62" y="314" width="578" height="7" fill="#E5E7EB" rx="2"/>
          <rect x="62" y="327" width="536" height="7" fill="#E5E7EB" rx="2"/>
          <rect x="62" y="340" width="558" height="7" fill="#E5E7EB" rx="2"/>

          {/* ── ARTICLE 2 ── */}
          <rect x="50" y="366" width="3" height="22" fill="#4F46E5"/>
          <text x="62" y="382" fill="#111827" fontSize="12" fontWeight="bold" fontFamily={ff}>Article 2 — Durée et calendrier</text>
          <rect x="62" y="392" width="560" height="7" fill="#E5E7EB" rx="2"/>
          <rect x="62" y="405" width="504" height="7" fill="#E5E7EB" rx="2"/>

          {/* ── ARTICLE 3 ── */}
          <rect x="50" y="430" width="3" height="22" fill="#4F46E5"/>
          <text x="62" y="446" fill="#111827" fontSize="12" fontWeight="bold" fontFamily={ff}>Article 3 — Rémunération</text>

          {/* Table */}
          <rect x="50" y="458" width="694" height="28" fill="#4F46E5"/>
          <line x1="280" y1="458" x2="280" y2="486" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="410" y1="458" x2="410" y2="486" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="570" y1="458" x2="570" y2="486" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <text x="165" y="476" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily={ff}>PRESTATION</text>
          <text x="345" y="476" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily={ff}>QTÉ</text>
          <text x="490" y="476" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily={ff}>PRIX UNITAIRE</text>
          <text x="632" y="476" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily={ff}>TOTAL</text>

          <rect x="50" y="486" width="694" height="28" fill="white"/>
          <line x1="280" y1="486" x2="280" y2="514" stroke="#E5E7EB" strokeWidth="1"/>
          <line x1="410" y1="486" x2="410" y2="514" stroke="#E5E7EB" strokeWidth="1"/>
          <line x1="570" y1="486" x2="570" y2="514" stroke="#E5E7EB" strokeWidth="1"/>
          <text x="62" y="504" fill="#374151" fontSize="10" fontFamily={ff}>Refonte identité visuelle</text>
          <text x="345" y="504" textAnchor="middle" fill="#374151" fontSize="10" fontFamily={ff}>1</text>
          <text x="490" y="504" textAnchor="middle" fill="#374151" fontSize="10" fontFamily={ff}>2 400 €</text>
          <text x="632" y="504" textAnchor="middle" fill="#111827" fontSize="10" fontWeight="bold" fontFamily={ff}>2 400 €</text>

          <rect x="50" y="514" width="694" height="28" fill="#F9FAFB"/>
          <line x1="280" y1="514" x2="280" y2="542" stroke="#E5E7EB" strokeWidth="1"/>
          <line x1="410" y1="514" x2="410" y2="542" stroke="#E5E7EB" strokeWidth="1"/>
          <line x1="570" y1="514" x2="570" y2="542" stroke="#E5E7EB" strokeWidth="1"/>
          <text x="62" y="532" fill="#374151" fontSize="10" fontFamily={ff}>Acompte (30%)</text>
          <text x="632" y="532" textAnchor="middle" fill="#4F46E5" fontSize="10" fontWeight="bold" fontFamily={ff}>720 €</text>

          <rect x="50" y="458" width="694" height="84" fill="none" stroke="#E5E7EB" strokeWidth="1"/>

          {/* ── ARTICLE 4 ── */}
          <rect x="50" y="562" width="3" height="22" fill="#4F46E5"/>
          <text x="62" y="578" fill="#111827" fontSize="12" fontWeight="bold" fontFamily={ff}>Article 4 — Conditions de paiement</text>
          <rect x="62" y="588" width="558" height="7" fill="#E5E7EB" rx="2"/>
          <rect x="62" y="601" width="496" height="7" fill="#E5E7EB" rx="2"/>

          {/* ── SIGNATURES ── */}
          <rect x="50" y="638" width="694" height="1" fill="#E5E7EB"/>
          <text x="50" y="662" fill="#9CA3AF" fontSize="9" fontWeight="bold" letterSpacing="0.1em" fontFamily={ff}>SIGNATURES</text>

          {/* Left */}
          <text x="62" y="686" fill="#374151" fontSize="10" fontFamily={ff}>Signature du Prestataire</text>
          <rect x="62" y="694" width="220" height="65" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="5,3" rx="2"/>
          <text x="62" y="776" fill="#374151" fontSize="10" fontFamily={ff}>Alex Martin</text>
          <text x="62" y="792" fill="#9CA3AF" fontSize="9" fontFamily={ff}>Date : ___________</text>

          {/* Right */}
          <text x="512" y="686" fill="#374151" fontSize="10" fontFamily={ff}>Signature du Client</text>
          <rect x="512" y="694" width="220" height="65" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="5,3" rx="2"/>
          <text x="512" y="776" fill="#374151" fontSize="10" fontFamily={ff}>Sophie Leclerc</text>
          <text x="512" y="792" fill="#9CA3AF" fontSize="9" fontFamily={ff}>Date : ___________</text>

          {/* ── FOOTER ── */}
          <rect x="50" y="820" width="694" height="1" fill="#E5E7EB"/>
          <text x="397" y="841" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily={ff}>Savvly · contact@savvly.co · SIRET 123 456 789 00012</text>
          <text x="744" y="841" textAnchor="end" fill="#9CA3AF" fontSize="9" fontFamily={ff}>Page 1 sur 3</text>

        </svg>
      </div>

      {/* 3 document preview cards */}
      <div style={{ display: 'flex', gap: 20, maxWidth: 860, margin: '0 auto 52px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'CGV Complètes', sub: '12 articles · Conforme droit FR', color: '#4F46E5' },
          { label: 'Devis Professionnel', sub: 'Lignes détaillées · PDF', color: '#059669' },
          { label: 'Mentions Légales', sub: 'Conformes LCEN · RGPD', color: '#7C3AED' },
        ].map((doc) => (
          <div key={doc.label} style={{ flex: 1, minWidth: 200, maxWidth: 260, background: 'white', borderRadius: 12, padding: '20px 20px 16px', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ height: 4, borderRadius: 2, background: doc.color, marginBottom: 16 }}/>
            {[100, 70, 88, 55, 78, 82, 60].map((w, i) => (
              <div key={i} style={{ background: i === 0 ? '#D1D5DB' : '#F3F4F6', height: i === 0 ? 9 : 6, borderRadius: 3, width: `${w}%`, marginBottom: 9 }}/>
            ))}
            <p style={{ color: '#111827', fontSize: 13, fontWeight: 600, margin: '16px 0 3px' }}>{doc.label}</p>
            <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{doc.sub}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <a href="/auth" style={{ background: '#4F46E5', color: 'white', padding: '14px 32px', borderRadius: 100, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>
          Générer mes documents →
        </a>
      </div>
    </section>
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
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {t('landing.ultimate.h2.line1')}<br /><span style={{ color: '#4F46E5' }}>{t('landing.ultimate.h2.line2')}</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center', maxWidth: 1000, margin: '0 auto' }}>
          {/* Comparison table */}
          <FadeUp>
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(15,15,60,0.07)', border: '1px solid #EDE9D8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px', background: '#F7F7FF', padding: '10px 16px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #EDE9D8' }}>
                <span style={{ color: '#6B6B8A' }}>{t('landing.ultimate.col.feature')}</span>
                <span style={{ textAlign: 'center', color: '#9CA3AF' }}>{t('landing.ultimate.col.others')}</span>
                <span style={{ textAlign: 'center', color: '#4F46E5' }}>Savvly</span>
              </div>
              {rows.map(([label, others, savvly], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 88px 88px', padding: '8px 16px', borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none', alignItems: 'center' }}>
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

          {/* Product video */}
          <FadeUp delay={0.15}>
            <video
              key="savvly-demo"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              poster="/dashboard-preview.png"
              onError={(e) => console.error('Video error:', e)}
              onLoadedData={undefined}
              style={{
                width: '100%',
                maxWidth: 600,
                borderRadius: 16,
                boxShadow: '0 24px 60px rgba(79,70,229,0.2)',
                border: '2px solid rgba(79,70,229,0.3)',
                display: 'block',
                backgroundColor: '#f0f0f0',
              }}
            >
              <source
                src="https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/video/Create_a_second_product_dem.mp4"
                type="video/mp4"
              />
              Votre navigateur ne supporte pas la vidéo.
            </video>
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
  "J'ai doublé mon TJM en 6 mois.\n\n→ J'ai arrêté de vendre du temps\n→ J'ai packagé mon offre\n→ J'ai posté 1x/jour",
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

function IlluImage() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 280, background: 'linear-gradient(160deg, #4F46E5 0%, #7C3AED 55%, #6D28D9 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Cover band with geometric pattern */}
      <div style={{ height: 82, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <svg width="100%" height="82" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <line x1="0" y1="25" x2="300" y2="65" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <line x1="0" y1="55" x2="300" y2="15" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="30" y1="0" x2="30" y2="82" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <line x1="80" y1="0" x2="80" y2="82" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <line x1="130" y1="0" x2="130" y2="82" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <circle cx="220" cy="18" r="32" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" />
          <circle cx="240" cy="68" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="8" y="8" width="28" height="28" rx="5" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1" transform="rotate(18 22 22)" />
        </svg>
      </div>
      {/* Profile content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 22px' }}>
        {/* Avatar overlapping cover */}
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#5B21B6', border: '2.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', marginTop: -27, marginBottom: 10, flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
          BM
        </div>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 3, textAlign: 'center' }}>Baptiste Moreau</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.76)', marginBottom: 14, textAlign: 'center', lineHeight: 1.4 }}>Web Designer Freelance</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#10B981', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: '#fff', fontWeight: 700 }}>Disponible pour missions</span>
        </div>
        <div style={{ border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 8, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center', cursor: 'default' }}>
          Me contacter
        </div>
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
      title: t('landing.featured.image.title'),
      badge: { text: 'Pro', bg: 'rgba(79,70,229,0.1)', color: '#4F46E5' },
      desc: t('landing.featured.image.desc'),
      uses: '892',
      accent: '#7C3AED',
      illu: <IlluImage />,
      link: '/tools/image',
      bleed: true,
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
    <section style={{ background: '#F5F5F7', padding: 'clamp(48px, 8vw, 100px) 24px', borderTop: '1px solid var(--border)' }}>
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
                className="featured-tool-card"
                onClick={() => navigate('/auth?mode=register')}
                style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,15,60,0.06)', cursor: 'pointer', display: 'grid', gridTemplateColumns: '50% 50%', minHeight: 320, border: '1px solid rgba(0,0,0,0.05)' }}
                whileHover={reduce ? {} : { y: -4, boxShadow: `0 16px 48px ${card.accent}20`, transition: { duration: 0.2 } }}
              >
                {/* Left: text */}
                <div className="featured-tool-card-text" style={{ padding: '32px 28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, overflow: 'hidden' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: card.badge.bg, color: card.badge.color, whiteSpace: 'nowrap' }}>
                        {card.badge.text}
                      </span>
                      <span style={{ fontSize: 11, color: card.accent, fontWeight: 700 }}>{card.uses} {t('landing.featured.uses')}</span>
                    </div>
                    <div className="featured-tool-card-title" style={{ fontSize: 22, fontWeight: 700, color: '#0F0F1A', marginBottom: 12, lineHeight: 1.2 }}>{card.title}</div>
                    <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                  </div>
                  <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: card.accent }}>
                    {t('landing.featured.try')} →
                  </div>
                </div>
                {/* Right: illustration */}
                <div className="featured-tool-card-illu" style={card.bleed
                  ? { display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }
                  : { background: `${card.accent}08`, padding: '24px 20px', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${card.accent}15`, minWidth: 0, overflow: 'hidden' }
                }>
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

// ── LinkedIn Content showcase ────────────────────────────────

const LI_POST_SRCS = [
  'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Image/post1.png.png',
  'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Image/post2.png.png',
  'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Image/post3.png.png',
  'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Image/post4.png.png',
];

function LIImageCard({ src, rotate, y, side, inView, delay }) {
  const shadow = side === 'left'
    ? '-8px 12px 32px rgba(0,0,0,0.18)'
    : '8px 12px 32px rgba(0,0,0,0.18)';
  const tx = side === 'left' ? -16 : 16;
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      style={{
        width: 280, maxWidth: 280, borderRadius: 16, overflow: 'hidden',
        boxShadow: shadow, border: '1px solid rgba(255,255,255,0.8)',
        transform: `rotate(${rotate}deg) translateY(${y}px) translateX(${tx}px)`,
        flexShrink: 0, position: 'relative',
      }}
    >
      <img src={src} alt="Post LinkedIn" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)', pointerEvents: 'none' }} />
    </motion.div>
  );
}

function LinkedInShowcaseSection({ navigate, reduce }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ background: '#FAFAFA', padding: 'clamp(60px, 8vw, 100px) 24px', borderTop: '1px solid var(--border)', backgroundImage: 'linear-gradient(rgba(79,70,229,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.045) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      <style>{`
        @media (max-width: 860px) {
          .li-showcase-grid { grid-template-columns: 1fr !important; }
          .li-showcase-side { display: none !important; }
        }
      `}</style>
      <div className="container">
        {/* Header */}
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(250,208,44,0.15)', border: '1px solid rgba(250,208,44,0.4)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
              ⭐ BEST SELLER · #1 outil le plus utilisé
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Générez des posts LinkedIn qui <span style={{ color: '#4F46E5' }}>convertissent</span>
            </h2>
            <p style={{ fontSize: 16, color: '#6B6B8A', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.65 }}>
              Adapté à votre niche, votre style, votre audience. En 30 secondes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
              {["Adapté à votre ton d'écriture", 'Hooks qui accrochent', 'Formats viraux testés'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', fontWeight: 600 }}>
                  <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => navigate('/auth?mode=register')}
              style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 4px 20px rgba(79,70,229,0.35)' }}
              whileHover={reduce ? {} : { scale: 1.03, boxShadow: '0 8px 28px rgba(79,70,229,0.45)' }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              Essayer l'outil →
            </motion.button>
          </div>
        </FadeUp>

        {/* 3-column layout */}
        <div className="li-showcase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px 1fr', gap: 28, alignItems: 'center', maxWidth: 1080, margin: '0 auto' }}>

          {/* Left cards */}
          <div className="li-showcase-side" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-end' }}>
            <LIImageCard src={LI_POST_SRCS[0]} rotate={-3} y={-20} side="left" inView={inView} delay={0.1} />
            <LIImageCard src={LI_POST_SRCS[2]} rotate={-2} y={20}  side="left" inView={inView} delay={0.25} />
          </div>

          {/* Center demo */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0 }}
            style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(15,15,60,0.1)', padding: '24px', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            {/* Tool header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <svg viewBox="0 0 24 24" fill="#0A66C2" width="20" height="20" style={{ flexShrink: 0 }}>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0F0F1A' }}>LinkedIn Content</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: '#fad02c', color: '#78350F', whiteSpace: 'nowrap' }}>⭐ BEST SELLER</span>
            </div>

            {/* Simulated textarea */}
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#9CA3AF', marginBottom: 10, minHeight: 54 }}>
              Décrivez votre idée de post...
            </div>

            {/* Generate button */}
            <div style={{ background: '#4F46E5', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', cursor: 'default' }}>
              Générer →
            </div>

            {/* Result area */}
            <div style={{ background: '#F0F4FF', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 12, padding: '14px 16px', fontSize: 12.5, color: '#1D1D1F', lineHeight: 1.75, minHeight: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 10, color: '#4F46E5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Génération en cours…</span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 12 }}>
                {"Y'a un truc qu'il faut remettre au clair.\n\nLe salaire moyen d'un freelance en France c'est entre 2 500€ et 4 000€ net par mois.\n\nPas 800€.\nPas 1 200€.\n\nCeux qui te disent que le freelance ça paye pas ont juste mal négocié."}
                <span style={{ color: '#4F46E5', fontWeight: 900 }}> ▌</span>
              </p>
            </div>

            {/* Counter */}
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
              3 421 utilisations · <span style={{ color: '#4F46E5', fontWeight: 700 }}>#1 outil le plus utilisé</span>
            </div>
          </motion.div>

          {/* Right cards */}
          <div className="li-showcase-side" style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
            <LIImageCard src={LI_POST_SRCS[1]} rotate={3}  y={-30} side="right" inView={inView} delay={0.15} />
            <LIImageCard src={LI_POST_SRCS[3]} rotate={2}  y={10}  side="right" inView={inView} delay={0.3} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Newsletter lead magnet ────────────────────────────────────

const NL_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=60&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=60&auto=format',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face&q=60&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=60&auto=format',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=60&auto=format',
];

// No external image requests — all icons are inline colored badges.
const NL_TOOLS = [
  { name: 'Claude',     bg: '#FF6B35', color: '#fff', label: 'C',   top: -50,  left: -200,  rotate: -15, delay: 0    },
  { name: 'ChatGPT',    bg: '#10A37F', color: '#fff', label: 'G',   top: -60,  right: -210, rotate:  12, delay: 0.1  },
  { name: 'Zapier',     bg: '#FF4A00', color: '#fff', label: 'Z',   top:  20,  left: -280,  rotate: -20, delay: 0.2  },
  { name: 'Make',       bg: '#6D00A8', color: '#fff', label: 'M',   top: 120,  left: -260,  rotate:  10, delay: 0.3  },
  { name: 'Airtable',   bg: '#18BFFF', color: '#fff', label: 'A',   top:  30,  right: -270, rotate:  15, delay: 0.4  },
  { name: 'Shopify',    bg: '#5A8A3B', color: '#fff', label: 'S',   top: 130,  right: -280, rotate: -10, delay: 0.5  },
  { name: 'LinkedIn',   bg: '#0A66C2', color: '#fff', label: 'in',  top: 230,  left: -220,  rotate:  -8, delay: 0.6  },
  { name: 'Notion',     bg: '#1A1A1A', color: '#fff', label: 'N',   top: 250,  right: -230, rotate:   5, delay: 0.7  },
  { name: 'Apollo',     bg: '#7C3AED', color: '#fff', label: 'A',   top: -30,  left: -130,  rotate:   8, delay: 0.8  },
  { name: 'Gemini',     bg: '#4285F4', color: '#fff', label: 'G',   top: -40,  right: -140, rotate:  -5, delay: 0.9  },
  { name: 'Instagram',  bg: '#E1306C', color: '#fff', label: 'IG',  top: 330,  left: -170,  rotate:  12, delay: 1.0  },
  { name: 'Newsletter', bg: '#F59E0B', color: '#fff', label: '🚀',  top: 340,  right: -180, rotate: -12, delay: 1.1  },
];

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
    <section style={{ background: '#FAFAFA', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'visible', backgroundImage: 'linear-gradient(rgba(79,70,229,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      {/* Flex wrapper — padding provides visual clearance for floating logos */}
      <div className="nl-wrapper" style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '100px 320px', overflow: 'visible' }}>

        {/* Card container — logos are positioned relative to this div */}
        <div style={{ position: 'relative', maxWidth: 480, width: '100%' }}>

          {/* Floating tool logos — hidden on mobile via CSS class */}
          {NL_TOOLS.map((tool, i) => (
            <motion.div
              key={i}
              className="nl-floating-logo"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: reduce ? 0 : tool.delay, ease }}
              style={{
                position: 'absolute',
                top: tool.top,
                ...(tool.left !== undefined ? { left: tool.left } : { right: tool.right }),
                rotate: tool.rotate,
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <motion.div
                animate={reduce ? {} : { y: [0, -4, 0] }}
                transition={{ duration: 2.5 + i * 0.35, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
              >
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 100, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, color: '#374151', minWidth: 100 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: tool.bg, color: tool.color, fontSize: tool.label.length > 1 ? 9 : 11, fontWeight: 800, flexShrink: 0, letterSpacing: '-0.02em' }}>
                    {tool.label}
                  </span>
                  {tool.name}
                </div>
              </motion.div>
            </motion.div>
          ))}

          {/* Card */}
          <FadeUp>
          <div className="newsletter-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', textAlign: 'center', boxShadow: 'var(--shadow-lg)', position: 'relative', zIndex: 2 }}>

            {/* Overlapping avatar photos */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              {NL_AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  width={44}
                  height={44}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -12, position: 'relative', zIndex: NL_AVATARS.length - i, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', flexShrink: 0 }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 4 }}>✅</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F0F1A' }}>{t('landing.newsletter.success')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#4F46E5' }}>{t('landing.newsletter.success.label')}</div>
                  <div style={{ fontSize: 14, color: '#6B6B8A' }}>{t('landing.newsletter.success.sub')}</div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 800, color: '#B45309', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                    {t('landing.newsletter.badge')}
                  </div>

                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F0F1A', margin: '0 0 10px', lineHeight: 1.3 }}>
                    {t('landing.newsletter.title')}
                  </h2>
                  <p style={{ fontSize: 14, color: '#6B6B8A', margin: '0 0 24px', lineHeight: 1.65 }}>
                    {t('landing.newsletter.sub')}
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('landing.newsletter.placeholder')}
                        required
                        disabled={status === 'loading'}
                        style={{ width: '100%', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 100, padding: '12px 16px 12px 40px', fontSize: 14, color: '#0F0F1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={status === 'loading'}
                      style={{ width: '100%', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 100, padding: '13px 24px', fontWeight: 700, fontSize: 14, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
                      whileHover={reduce || status === 'loading' ? {} : { background: '#4338CA' }}
                      whileTap={reduce || status === 'loading' ? {} : { scale: 0.97 }}
                    >
                      {status === 'loading' ? '...' : t('landing.newsletter.cta')}
                    </motion.button>
                    {status === 'error' && (
                      <p style={{ textAlign: 'center', fontSize: 13, color: '#DC2626', margin: 0 }}>
                        {t('landing.newsletter.error')}
                      </p>
                    )}
                  </form>

                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '14px 0 0' }}>
                    {t('landing.newsletter.disclaimer')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ── New Community section (coral/orange) ──────────────────────

function CommunitySection({ lang, navigate, reduce }) {
  const { t } = useLang();
  const stats = [
    { n: '200+', label: t('landing.community.stat1') },
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
            <div className="community-stats" style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
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

            {/* Discord banner */}
            <a
              href="https://discord.gg/8DvYb5uB6X"
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid rgba(88,101,242,0.35)', borderRadius: 14, padding: '16px 22px', background: 'rgba(88,101,242,0.04)', maxWidth: 380, width: '100%', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#5865F2'; e.currentTarget.style.background = 'rgba(88,101,242,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(88,101,242,0.35)'; e.currentTarget.style.background = 'rgba(88,101,242,0.04)'; }}
            >
              <svg viewBox="0 0 24 24" fill="#5865F2" width="30" height="30" style={{ flexShrink: 0 }}>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F0F1A', marginBottom: 2 }}>200 membres actifs sur Discord</div>
                <div style={{ fontSize: 13, color: '#5865F2', fontWeight: 600 }}>Rejoindre la communauté →</div>
              </div>
            </a>
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
    <section ref={containerRef} className="container-scroll-section" style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '100px 24px 80px' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, overflow: 'hidden', gap: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${tk.dot}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: tk.dot }} />
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: 100, background: tk.badgeBg, color: tk.badgeColor, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', minWidth: 0 }}>{tk.badge}</span>
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

      {/* ── 1b. NEWSLETTER ───────────────────────────────────── */}
      <NewsletterSection reduce={reduce} />

      {/* ── NEW: "L'arme ultime" comparison ──────────────────── */}
      <UltimateSection lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── PDF Blueprint example ─────────────────────────────── */}
      <BlueprintSection navigate={navigate} />

      {/* ── NEW: 4 outils qui changent tout ──────────────────── */}
      <FeaturedTools lang={lang} navigate={navigate} reduce={reduce} />

      {/* ── LinkedIn Content showcase ────────────────────────── */}
      <LinkedInShowcaseSection navigate={navigate} reduce={reduce} />

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



      {/* ── 4. SOCIAL PROOF — STATS + TESTIMONIALS ────────────── */}
      <section className="section lp-dark">
        <div className="container">
          <FadeUp>
            <div className="stat-bar">
              <AnimatedStat end={1200} suffix="+" duration={1.5} label={t('landing.stats.users.label')} />
              <AnimatedStat end={14}   suffix=""  duration={0.8} label={t('landing.stats.tools.label')} />
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
                  onClick={() => !tool.disabled && navigate('/auth?mode=register')}
                  whileHover={reduce || tool.disabled ? {} : { y: -2, transition: { duration: 0.15 } }}
                  style={{
                    cursor: tool.disabled ? 'default' : 'pointer',
                    borderColor: tool.disabled ? 'var(--border)' : 'var(--accent-soft)',
                    background: tool.disabled ? 'var(--bg)' : 'var(--accent-soft)',
                    opacity: tool.disabled ? 0.55 : 1,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {tool.disabled && (
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: '#6B7280', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                      Bientôt disponible
                    </div>
                  )}
                  <div className="tool-card-head">
                    <ToolIcon tool={tool} size="lg" />
                    {!tool.disabled && <PlanBadge plan={tool.plan} />}
                  </div>
                  <h3 className="tool-card-title">{name}</h3>
                  <p className="tool-card-desc">{desc}</p>
                  <div className="tool-card-foot">
                    {tool.disabled ? (
                      <span style={{ color: 'var(--fg-4)', fontSize: 13 }}>En développement</span>
                    ) : tool.credits === 0
                      ? <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{t('landing.tools.free')}</span>
                      : <span className="tabular">{tool.credits} {t('landing.tools.credits')}</span>
                    }
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      {!tool.disabled && <span className="tool-pro-badge">Pro ★</span>}
                      {!tool.disabled && <Glyph name="arrow-right" size={14} />}
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
                  <a href="https://www.linkedin.com/in/talhah-ally-75b0b1175/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    Mon LinkedIn
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
                {[
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&q=60&auto=format',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&q=60&auto=format',
                  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&h=80&fit=crop&crop=face&q=60&auto=format',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face&q=60&auto=format',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face&q=60&auto=format',
                ].map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="user"
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -12, objectFit: 'cover', position: 'relative', zIndex: 5 - i }}
                  />
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
