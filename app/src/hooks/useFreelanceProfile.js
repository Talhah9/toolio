const KEY = 'savvly_profile';

export function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored) return stored;
    // Migrate from old per-tool keys (ContratTool + DevisTool used different keys)
    const old1 = JSON.parse(localStorage.getItem('savvly_prestataire_info') || '{}');
    const old2 = JSON.parse(localStorage.getItem('savvly-prestataire') || '{}');
    return {
      nom:       old1.name    || old2.nom    || '',
      entreprise:old1.company || '',
      email:     old1.email   || old2.email  || '',
      tel:       old1.phone   || old2.tel    || '',
      siret:     old1.siret   || '',
      adresse:   old1.address || old2.adresse|| '',
    };
  } catch { return {}; }
}

export function saveProfile(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}
