export const TOOLS = [
  { id: 'audit', name: 'Audit CRO + SEO', short: 'Audit', desc: 'Analyse votre site et identifie les leviers de conversion et de référencement.', credits: 15, plan: 'pro', glyph: 'audit' },
  { id: 'products', name: 'Fiches produits en masse', short: 'Fiches produits', desc: 'Génère des fiches produits optimisées pour la conversion à partir d’un CSV.', credits: 5, plan: 'pro', glyph: 'product', unit: 'fiche' },
  { id: 'compete', name: 'Analyse de concurrents', short: 'Concurrents', desc: 'Décortique le positionnement, l’offre et les mots-clés de vos concurrents.', credits: 15, plan: 'pro', glyph: 'compete' },
  { id: 'legal', name: 'CGV & mentions légales', short: 'CGV', desc: 'Génère vos CGV et mentions légales conformes au droit français.', credits: 10, plan: 'pro', glyph: 'legal' },
  { id: 'contract', name: 'Contrat freelance', short: 'Contrat', desc: 'Crée un contrat de prestation freelance personnalisé et sécurisé.', credits: 10, plan: 'pro', glyph: 'contract' },
  { id: 'invoice', name: 'Générateur de facture', short: 'Facture', desc: 'Édite une facture PDF prête à envoyer en moins d’une minute.', credits: 5, plan: 'free', glyph: 'invoice' },
  { id: 'status', name: 'Choix du statut juridique', short: 'Statut', desc: 'Compare les statuts (micro, EI, SASU, EURL) selon votre projet.', credits: 5, plan: 'free', glyph: 'status' },
  { id: 'linkedin-content', name: 'Contenu LinkedIn', short: 'LinkedIn', desc: 'Rédige des posts LinkedIn engageants adaptés à votre niche et votre ton.', credits: 10, plan: 'free', glyph: 'linkedin-content' },
  { id: 'linkedin-profile', name: 'Optimisation profil LinkedIn', short: 'Profil LinkedIn', desc: 'Réécrit titre, à-propos et expériences pour maximiser votre visibilité.', credits: 10, plan: 'pro', glyph: 'linkedin-profile' },
];

export const PACKS = [
  { id: 'small', credits: 100, price: 9, label: 'Small' },
  { id: 'medium', credits: 250, price: 19, label: 'Medium', featured: true },
  { id: 'large', credits: 600, price: 39, label: 'Large' },
];

export const SAMPLE_OUTPUTS = {
  'linkedin-content': [
    `Il y a 18 mois, je facturais 350€ la journée.\n\nAujourd'hui, c'est 1 200€. Et j'ai moins de clients.\n\nVoici ce qui a changé :\n\n→ J'ai arrêté de vendre des heures. Je vends un résultat.\n→ J'ai dit non aux missions floues. Cahier des charges ou rien.\n→ J'ai posé un acompte de 30%. Sans ça, on ne démarre pas.\n→ J'ai documenté chaque livrable. Photo avant/après, métriques, ROI.\n\nLe vrai déclic ? Comprendre que mes clients n'achètent pas mon temps.\nIls achètent la tranquillité d'esprit.\n\nEt ça, ça vaut bien plus que 350€ la journée.\n\nVous en êtes où sur vos tarifs ?`,
    `Trois choses que personne ne vous dit quand vous lancez votre activité freelance :\n\n1. Les premiers clients sont les plus durs. Ensuite ça roule.\n2. Votre réseau pèse plus que votre portfolio.\n3. Le "non" est votre meilleur allié commercial.\n\nJ'ai mis trois ans à comprendre la troisième.\n\nDire non à un projet mal cadré, c'est protéger les bons clients déjà signés.\n\nEt vous, quel "non" vous a fait avancer cette année ?`,
    `Un client m'a écrit ce matin : "Combien pour refaire mon site ?"\n\nMa réponse : "Combien vaut un client supplémentaire pour vous ?"\n\nSilence radio pendant deux heures.\n\nPuis : "Environ 8 000€ par an."\n\n"Ok. Si on en gagne 3 de plus, ça fait 24 000€. Mon devis est à 7 500€."\n\nIl a signé.\n\nLeçon : ne jamais parler prix avant valeur.`,
  ],
  'invoice': [
    `FACTURE N° 2026-042\n\nÉmise le 03/05/2026\nÉchéance : 02/06/2026\n\n— De —\nLéa Marchand — EI\nSIRET : 893 421 002 00012\n\n— À —\nAtelier Marquetin\n12 rue du Faubourg, 75011 Paris\n\nDésignation                   Qté     PU       Total\nRéfonte UI app mobile         1      4 500€   4 500€\nIntégration Stripe             1        800€     800€\n\nTotal HT                                       5 300€\nTVA non applicable, art. 293 B du CGI\nTotal à régler                                 5 300€\n\nMode de paiement : virement IBAN FR76 ...`,
  ],
  'status': [
    `Recommandation : Micro-entreprise (BNC)\n\nPourquoi ce statut\n→ Démarches simplifiées, démarrage en 24h\n→ Charges sociales proportionnelles au CA (~22%)\n→ Comptabilité allégée (livre de recettes)\n\nÀ surveiller\n→ Plafond CA 77 700€/an pour prestations de services\n→ Pas de récupération de TVA\n→ Protection sociale limitée\n\nQuand passer en SASU\n→ Au-delà de 60 000€ de CA\n→ Si vous embauchez ou levez des fonds\n→ Si vous voulez optimiser rémunération/dividendes`,
  ],
};
