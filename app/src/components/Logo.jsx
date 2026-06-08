const LOGO_URL = 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/logo/Design%20sans%20titre%20(1).svg';

export function Logo({ size = 17 }) {
  return (
    <span className="logo" style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <img src={LOGO_URL} alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
      Savvly<span className="logo-dot" />
    </span>
  );
}
