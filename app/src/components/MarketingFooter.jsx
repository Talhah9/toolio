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
              <li><a>{t('footer.link.terms')}</a></li>
              <li><a>{t('footer.link.privacy')}</a></li>
              <li><a>{t('footer.link.legal')}</a></li>
            </ul>
          </div>
        </div>
        <div className="mk-footer-bottom">
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.gdpr')}</span>
        </div>
      </div>
    </footer>
  );
}
