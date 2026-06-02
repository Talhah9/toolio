import { useLang } from '../context/LanguageContext';

const TOOL_SUBTITLES = {
  fr: {
    'linkedin-content': 'Rédaction de votre post LinkedIn...',
    audit:              'Analyse de votre site en cours...',
    compete:            'Analyse du concurrent...',
    legal:              'Rédaction du document juridique...',
    contract:           'Rédaction du contrat...',
    devis:              'Création du devis...',
    relance:            'Rédaction du message de relance...',
    'linkedin-intel':   'Analyse du profil LinkedIn...',
    prospection:        'Création des messages de prospection...',
    'mission-finder':   'Recherche de stratégie...',
  },
  en: {
    'linkedin-content': 'Writing your LinkedIn post...',
    audit:              'Analyzing your website...',
    compete:            'Analyzing competitor...',
    legal:              'Drafting legal document...',
    contract:           'Drafting contract...',
    devis:              'Creating quote...',
    relance:            'Writing follow-up message...',
    'linkedin-intel':   'Analyzing LinkedIn profile...',
    prospection:        'Creating outreach messages...',
    'mission-finder':   'Searching for strategy...',
  },
};

export default function GeneratingIndicator({ toolId }) {
  const { t, lang } = useLang();
  const subtitle = TOOL_SUBTITLES[lang]?.[toolId] || (lang === 'fr' ? 'Traitement en cours...' : 'Processing...');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: '60px 24px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>
          {t('tool.generating.title')}
        </span>
        <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>
          {subtitle}
        </span>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 240,
        height: 3,
        borderRadius: 4,
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 4,
          background: 'linear-gradient(90deg, var(--accent), #818CF8)',
          animation: 'progress-fill 15s ease-out forwards',
        }} />
      </div>
    </div>
  );
}
