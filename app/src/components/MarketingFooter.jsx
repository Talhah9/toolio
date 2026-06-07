import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useLang } from '../context/LanguageContext';

export function MarketingFooter() {
  const { t } = useLang();

  return (
    <footer className="mk-footer">
      <div className="container">
        <div className="mk-footer-grid">
          <div>
            <Logo />
            <p className="muted" style={{ fontSize: 13, marginTop: 12, maxWidth: 280 }}>
              {t('footer.tagline')}
            </p>
          </div>
          <div className="mk-footer-col">
            <h4>{t('footer.col.product')}</h4>
            <ul>
              <li><a>{t('footer.link.tools')}</a></li>
              <li><a>{t('footer.link.pricing')}</a></li>
              <li><a>{t('footer.link.changelog')}</a></li>
              <li><a>{t('footer.link.roadmap')}</a></li>
            </ul>
          </div>
          <div className="mk-footer-col">
            <h4>{t('footer.col.resources')}</h4>
            <ul>
              <li><a>{t('footer.link.docs')}</a></li>
              <li><a>{t('footer.link.guides')}</a></li>
              <li><a>{t('footer.link.support')}</a></li>
            </ul>
          </div>
          <div className="mk-footer-col">
            <h4>{t('footer.col.legal')}</h4>
            <ul>
              <li><Link to="/legal?tab=cgv">{t('footer.link.terms')}</Link></li>
              <li><Link to="/legal?tab=privacy">{t('footer.link.privacy')}</Link></li>
              <li><Link to="/legal?tab=cgv">{t('footer.link.legal')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mk-footer-bottom">
          <span>{t('footer.copyright')}</span>
          <a
            href="https://www.linkedin.com/in/talhah-ally-75b0b1175/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'none', opacity: 0.7 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
          <a
            href="https://discord.gg/8DvYb5uB6X"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', textDecoration: 'none', opacity: 0.7 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Discord
          </a>
          <span>{t('footer.gdpr')}</span>
        </div>
      </div>
    </footer>
  );
}
