import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { TOOLS, getToolText } from '../data/catalog';
import { Glyph } from './Glyph';

const TOTAL = 4;

export function OnboardingModal() {
  const [step, setStep] = useState(1);
  const { credits, completeOnboarding } = useApp();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const freeTools = TOOLS.filter(tool => tool.plan === 'free' && !tool.franceOnly);
  const proTools  = TOOLS.filter(tool => tool.plan === 'pro');

  const handleClose = () => completeOnboarding();
  const handleNext  = () => setStep(s => s + 1);
  const handleFinish = async () => {
    await completeOnboarding();
    navigate('/dashboard');
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480, width: '92%' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {t('onboarding.step').replace('{n}', step)}
          </span>
          <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', lineHeight: 1 }} onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, padding: '0 24px 20px' }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i < step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{t('onboarding.step1.title')}</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{t('onboarding.step1.body')}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 99,
                background: 'var(--surface-raised, #F5F3FF)',
                color: 'var(--accent)', fontWeight: 600, fontSize: 15,
              }}>
                {credits ?? 50} {t('onboarding.credits')}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="h3" style={{ marginBottom: 16 }}>{t('onboarding.step2.title')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
                    {t('onboarding.step2.free')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {freeTools.map(tool => {
                      const text = getToolText(tool, lang);
                      return (
                        <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                          <Glyph name={tool.glyph} size={16} />
                          <span>{text.short}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
                    {t('onboarding.step2.pro')} ✦
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {proTools.map(tool => {
                      const text = getToolText(tool, lang);
                      return (
                        <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                          <Glyph name={tool.glyph} size={16} />
                          <span>{text.short}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="h3" style={{ marginBottom: 16 }}>{t('onboarding.step3.title')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  t('onboarding.step3.b1'),
                  t('onboarding.step3.b2'),
                  t('onboarding.step3.b3'),
                ].map((bullet, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>→</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{t('onboarding.step4.title')}</h3>
              <p className="muted" style={{ fontSize: 14 }}>{t('onboarding.step4.body')}</p>
            </div>
          )}
        </div>

        <div className="modal-foot" style={{ justifyContent: 'flex-end' }}>
          {step < TOTAL ? (
            <button className="btn btn-primary" onClick={handleNext}>
              {t('onboarding.cta.next')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish}>
              {t('onboarding.cta.dashboard')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
