import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { TOOLS, getToolText } from '../data/catalog';
import { usePageSeo } from '../utils/seo';

const SLUG_TO_ID = {
  'contrat-freelance':      'contract',
  'devis-professionnel':    'devis',
  'posts-linkedin':         'linkedin-content',
  'cgv-mentions-legales':   'legal',
  'prospection-outreach':   'prospection',
  'analyse-concurrents':    'compete',
  'audit-seo-cro':          'audit',
  'relance-client':         'relance',
  'calculateur-urssaf':     'urssaf',
  'statut-juridique':       'statut',
  'mission-finder':         'mission-finder',
  'linkedin-intelligence':  'linkedin-intel',
  'generateur-images':      'image',
  'convertisseur-fichiers': 'converter',
  'simulateur-tjm':         'tjm',
  'facture-freelance':      'facture',
};

// ── Long-form editorial guide per tool ──────────────────────────
const GUIDE = {
  contract: {
    h2: 'Rédiger un contrat de prestation freelance : le guide complet 2026',
    sections: [
      { h3: 'Pourquoi tout freelance doit signer un contrat, même pour une petite mission',
        p: 'Nombreux sont les freelances qui démarrent une mission sur une simple promesse verbale ou un email informel. C\'est une erreur aux conséquences souvent coûteuses. Un contrat de prestation de services définit précisément le périmètre de la mission, les livrables attendus, les délais, le tarif et les conditions de paiement. En cas de litige — facture impayée, scope creep, désaccord sur le livrable final — seul un contrat signé vous donne un levier juridique réel. En France, même une relation de confiance peut dégénérer. Un contrat positionne aussi le freelance comme un prestataire sérieux, ce qui rassure les clients professionnels dès le départ.' },
      { h3: 'Les clauses indispensables dans un contrat freelance français',
        p: 'Un contrat de prestation solide en France doit comporter au minimum : les coordonnées complètes des deux parties avec numéro SIRET, la description précise de la mission et des livrables attendus, les jalons et le planning, le tarif HT et les conditions de facturation, les modalités d\'acceptation des livrables, une clause sur la propriété intellectuelle (cession ou licence), une clause de confidentialité si nécessaire, et des pénalités de retard en cas d\'impayé. Sans clause de propriété intellectuelle, vous conservez techniquement les droits sur votre travail — ce que certains clients ignorent et qui peut créer des conflits après livraison.' },
      { h3: 'Signature électronique : valeur légale et outils pratiques',
        p: 'La signature électronique a la même valeur juridique que la signature manuscrite en France depuis la loi du 13 mars 2000, renforcée par le règlement européen eIDAS. Pour vos missions courantes, un échange d\'emails avec « Bon pour accord » du client constitue une preuve de consentement suffisante. Pour les missions importantes (au-delà de 5 000 €), optez pour un outil de signature qualifiée comme Yousign (français) ou DocuSign. Savvly génère votre contrat en PDF prêt à signer en quelques secondes — il ne vous reste qu\'à l\'envoyer à votre client via l\'outil de signature de votre choix.' },
      { h3: 'Adapter le contrat à chaque type de mission',
        p: 'Le contrat d\'une mission de développement de 3 mois ne ressemble pas à celui d\'une prestation rédactionnelle ponctuelle. Pour une mission courte (moins de 2 semaines), un bon de commande signé peut suffire. Pour une mission longue, structurez le contrat avec des jalons de paiement : 30 % à la signature, 40 % à mi-parcours, 30 % à la livraison finale. Pour les missions récurrentes, un accord-cadre + bons de commande mensuels est la solution idéale. L\'outil Savvly adapte automatiquement la structure du contrat selon le type de mission que vous lui décrivez.' },
    ],
  },
  devis: {
    h2: 'Créer un devis freelance professionnel : guide pratique 2026',
    sections: [
      { h3: 'Les mentions obligatoires sur un devis freelance',
        p: 'Un devis freelance bien construit doit mentionner : vos coordonnées complètes et votre numéro SIRET, les coordonnées complètes du client, la date d\'émission et la durée de validité du devis (généralement 30 jours), la description détaillée de chaque prestation, les tarifs unitaires et totaux HT, la TVA applicable ou la mention « TVA non applicable, art. 293B du CGI » si vous êtes en franchise de base, vos conditions de paiement et l\'acompte éventuel. Un devis qui omet la durée de validité expose le freelance à un client qui l\'accepte six mois plus tard à un tarif devenu sous-évalué.' },
      { h3: 'Comment calculer et présenter votre tarif avec confiance',
        p: 'Pour calculer un tarif journalier (TJM) cohérent, additionnez vos charges annuelles réelles (loyer, équipement, logiciels, formation), vos cotisations sociales estimées et l\'impôt sur le revenu. Divisez le total par votre nombre de jours facturables réels — en pratique entre 170 et 200 jours par an après déduction des congés, de la prospection et des tâches administratives. Comparez avec les fourchettes de marché de votre spécialité. Sur le devis, détaillez chaque ligne plutôt que de présenter un forfait global : un client comprend mieux et conteste moins une somme lorsqu\'il en voit la décomposition.' },
      { h3: 'Devis accepté : les étapes pour sécuriser la mission',
        p: 'Une fois votre devis accepté, ne démarrez jamais sans avoir reçu la signature du client et — idéalement — le paiement d\'un acompte de 30 à 50 %. Transformez le devis en bon de commande ou en contrat signé en y ajoutant les clauses de propriété intellectuelle et de pénalités de retard. Archivez le document signé dans un dossier dédié. Sur Savvly, chaque devis est sauvegardé dans votre historique, ce qui vous permet de le retrouver, de le dupliquer pour une mission similaire ou de le transformer en facture en quelques clics.' },
      { h3: 'Les erreurs qui font perdre des missions ou créer des litiges',
        p: 'Les erreurs les plus fréquentes sur un devis freelance : une description trop vague de la prestation (« site web complet » sans préciser le nombre de pages et les fonctionnalités), l\'absence de mention du nombre de révisions incluses, l\'oubli des frais annexes (déplacements, licences de logiciels, hébergement). Autre erreur classique : ne pas indiquer les conditions en cas de modification du périmètre après signature — ce qu\'on appelle le « scope creep ». Un devis précis protège le freelance autant qu\'il rassure le client sur votre professionnalisme.' },
    ],
  },
  'linkedin-content': {
    h2: 'Générer des posts LinkedIn performants avec l\'IA : stratégie complète 2026',
    sections: [
      { h3: 'LinkedIn : le canal d\'acquisition n°1 pour les freelances en 2026',
        p: 'LinkedIn compte plus de 26 millions d\'utilisateurs en France, dont une large majorité de décideurs et de directeurs capables de recruter des freelances. Contrairement aux plateformes comme Malt ou Upwork où vous êtes en concurrence directe sur le prix, LinkedIn vous permet de vous positionner comme expert dans votre domaine et d\'attirer des clients entrants sans démarchage. Un freelance qui publie régulièrement et pertinemment sur LinkedIn génère en moyenne 2 à 4 fois plus de demandes entrantes qu\'un freelance sans présence active. Le problème : trouver quoi écrire et maintenir une cadence régulière de publication.' },
      { h3: 'Les formats de posts qui génèrent le plus d\'engagement',
        p: 'L\'algorithme LinkedIn favorise les posts qui génèrent des réactions rapides dans la première heure de publication. Les formats les plus performants pour un freelance sont : le storytelling personnel (une leçon tirée d\'une expérience client), la liste actionnable (« 5 erreurs que j\'ai faites en débutant »), l\'opinion tranchée sur un sujet de votre domaine, et la question ouverte qui invite au commentaire. Les posts avec images natives génèrent 98 % de commentaires en plus que les liens externes. L\'IA de Savvly génère chacun de ces formats selon votre thématique, votre ton et l\'objectif du post.' },
      { h3: 'Construire une stratégie de contenu LinkedIn sur la durée',
        p: 'La régularité prime sur la fréquence. Publier 3 fois par semaine pendant 3 mois produit de meilleurs résultats qu\'un mois intense suivi d\'un silence. Structurez votre calendrier éditorial autour de 3 piliers : votre expertise technique, votre parcours et vos apprentissages, et vos prises de position sur les tendances de votre secteur. Utilisez Savvly pour préparer en avance un batch de 10 à 20 posts que vous publiez progressivement. L\'outil génère des variantes pour que votre feed reste varié et engageant, sans sonner comme un robot.' },
      { h3: 'Hook, structure et call-to-action : la formule d\'un post qui performe',
        p: 'Sur LinkedIn, les deux premières lignes de votre post (avant le « Voir plus ») sont décisives. Elles doivent créer une rupture de pattern ou promettre une valeur immédiate. Exemples de hooks efficaces : « J\'ai perdu un client à cause d\'une erreur stupide. Voici ce que ça m\'a appris. » ou « 90 % des freelances sous-facturent. Voici comment calculer votre vrai TJM. » Structurez le corps du post en paragraphes courts (1-2 lignes maximum), et terminez par une question ou un appel à l\'action simple. Savvly intègre ces principes dans chaque post généré.' },
    ],
  },
  legal: {
    h2: 'CGV et mentions légales pour freelances : ce que la loi impose vraiment',
    sections: [
      { h3: 'CGV freelance : obligations légales et utilité concrète',
        p: 'Les Conditions Générales de Vente (CGV) sont obligatoires pour tout professionnel qui vend à des consommateurs (BtoC) en France, selon l\'article L441-1 du Code de commerce. Pour les ventes entre professionnels (BtoB), elles ne sont pas légalement imposées mais constituent une protection essentielle. Vos CGV doivent préciser : les caractéristiques des prestations, les tarifs, les conditions de paiement et de livraison, les modalités de réclamation, et les dispositions applicables en matière de responsabilité. Sans CGV, en cas de litige avec un client, c\'est souvent la jurisprudence ou les conditions générales du client qui s\'appliquent — rarement en votre faveur.' },
      { h3: 'Mentions légales de site web : ce que vous devez afficher',
        p: 'Tout site web professionnel en France doit obligatoirement afficher des mentions légales accessibles en un clic. Les éléments obligatoires pour un freelance : nom et prénom ou dénomination sociale, adresse du siège, numéro SIRET, numéro de TVA intracommunautaire si applicable, coordonnées de contact, nom de l\'hébergeur du site. La loi LCEN du 21 juin 2004 encadre ces obligations. L\'absence de mentions légales expose le freelance à une amende de 1 500 €. Savvly génère des mentions légales conformes en tenant compte de votre statut juridique et de votre activité spécifique.' },
      { h3: 'RGPD et freelances : les obligations souvent ignorées',
        p: 'Le Règlement Général sur la Protection des Données s\'applique à tout freelance qui collecte des données personnelles : adresses email via un formulaire de contact, données de facturation clients, statistiques de visiteurs via Google Analytics. Vous devez informer vos utilisateurs des données collectées, leur durée de conservation, leur finalité et leurs droits (accès, rectification, suppression). Si vous utilisez des cookies tiers sur votre site, une bannière de consentement est obligatoire depuis la décision CNIL de 2020. Savvly intègre les clauses RGPD dans les mentions légales et CGV générées pour vous.' },
      { h3: 'Protéger vos droits d\'auteur en tant que freelance créatif',
        p: 'Pour les freelances dans des domaines créatifs (graphisme, rédaction, développement, photographie), les CGV doivent impérativement préciser les conditions de cession des droits d\'auteur. En France, les droits d\'auteur appartiennent par défaut au créateur — le client ne devient propriétaire que si la cession est expressément mentionnée dans le contrat ou les CGV, avec le périmètre exact (durée, territoire, supports). Une CGV claire vous évite de découvrir que votre client a revendu votre travail ou l\'a utilisé à des fins non prévues sans compensation supplémentaire.' },
    ],
  },
  relance: {
    h2: 'Relancer un client impayé efficacement : méthode et modèles 2026',
    sections: [
      { h3: 'Quand et comment envoyer une première relance de facture',
        p: 'En France, le délai de paiement légal entre professionnels est de 30 jours à compter de la date de réception de la facture, ou 60 jours à compter de la date d\'émission si vous l\'avez précisé dans vos CGV. Passé ce délai, vous pouvez envoyer une première relance. Le ton doit rester cordial — il s\'agit souvent d\'un simple oubli ou d\'un problème de traitement en comptabilité. Un simple email rappelant le numéro de facture, le montant et la date d\'échéance dépassée suffit dans la majorité des cas. 80 % des factures impayées sont réglées après une première relance bien formulée.' },
      { h3: 'La séquence de relance : du rappel à la mise en demeure',
        p: 'Une séquence de relance efficace suit une gradation de ton et d\'urgence. Première relance (J+3 à J+7 après échéance) : ton cordial, rappel factuel. Deuxième relance (J+14) : ton plus ferme, mention des pénalités de retard prévues par la loi. Troisième relance (J+21) : ton urgent, annonce d\'une mise en demeure imminente. Mise en demeure (J+30) : courrier recommandé avec accusé de réception, réclamation des pénalités légales (3 fois le taux d\'intérêt légal + 40 € d\'indemnité forfaitaire). Au-delà, vous pouvez saisir l\'injonction de payer sans avocat pour des créances inférieures à 10 000 €.' },
      { h3: 'Préserver la relation client tout en étant ferme',
        p: 'La difficulté de la relance est de récupérer votre argent sans brûler une relation potentiellement profitable sur le long terme. Quelques règles : ne jamais menacer sans passer à l\'acte (vous perdez en crédibilité), toujours laisser une porte de sortie élégante au client (facilité de paiement, paiement partiel immédiat), éviter les relances par téléphone sans trace écrite. Sur Savvly, vous choisissez le ton de chaque relance (cordial, ferme, urgent) et l\'IA génère un message professionnel adapté à l\'étape de la séquence et à votre relation avec le client.' },
      { h3: 'Éviter les impayés en amont : les bonnes pratiques',
        p: 'La meilleure relance est celle que vous n\'avez pas à envoyer. Pour réduire le risque d\'impayé dès le départ : demandez systématiquement un acompte de 30 à 50 % avant de démarrer, précisez vos conditions de paiement et les pénalités de retard dans votre contrat et sur vos factures, choisissez des clients avec une structure juridique vérifiable (SIRET valide, entreprise connue). Pour les nouveaux clients sans historique, l\'acompte est non négociable. Un client sérieux ne refusera jamais de payer un acompte raisonnable.' },
    ],
  },
  compete: {
    h2: 'Analyser ses concurrents en tant que freelance : méthode complète',
    sections: [
      { h3: 'Pourquoi analyser ses concurrents est une stratégie gagnante',
        p: 'Comprendre ce que font vos concurrents n\'est pas une question de copie — c\'est une question de positionnement. En analysant les freelances et agences qui ciblent les mêmes clients que vous, vous identifiez les angles différenciants disponibles : une niche sous-servie, un positionnement tarifaire, un format d\'offre inexistant, ou un contenu qui génère de l\'engagement dans votre secteur. L\'analyse concurrentielle vous permet aussi de valider que votre tarif est cohérent avec le marché et de comprendre pourquoi certains profils attirent plus de clients que d\'autres — indépendamment de leur niveau d\'expérience réel.' },
      { h3: 'Les données concurrentielles les plus utiles pour un freelance',
        p: 'Pour un freelance, l\'analyse concurrentielle pertinente porte sur : le positionnement et le message principal du concurrent (que promet-il ?), sa structure tarifaire si visible, les types de clients qu\'il cible et ceux qu\'il affiche comme références, son contenu LinkedIn et sa fréquence de publication, son site web (vitesse, structure, témoignages, cas clients), et ses avis sur les plateformes comme Malt ou Google. Ces données permettent de cartographier le marché et de trouver les espaces laissés vacants par vos concurrents actuels.' },
      { h3: 'Se différencier plutôt que de s\'aligner',
        p: 'L\'erreur classique après une analyse concurrentielle : copier ce que font les meilleurs. La bonne stratégie est de trouver ce qu\'ils ne font pas. Si tous les développeurs de votre niche communiquent sur la technique, vous pouvez vous différencier sur les résultats business. Si tous les graphistes montrent des portefeuilles visuels, vous pouvez vous différencier sur les témoignages clients et les cas d\'usage. L\'outil Savvly analyse les forces et failles de vos concurrents et vous propose des axes de différenciation concrets adaptés à votre profil et à votre marché cible.' },
    ],
  },
  audit: {
    h2: 'Audit SEO et CRO pour freelances : comment améliorer votre visibilité',
    sections: [
      { h3: 'SEO pour freelances : pourquoi votre site n\'apparaît pas sur Google',
        p: 'La plupart des sites de freelances souffrent des mêmes problèmes SEO : des titres et méta-descriptions manquants ou non optimisés, une vitesse de chargement excessive (particulièrement sur mobile), une architecture de contenu trop plate, l\'absence de blog ou de pages de contenus qui ciblent des requêtes spécifiques. Sans travail SEO, un site freelance n\'attire pratiquement aucun visiteur organique. Or, le SEO est l\'un des rares canaux d\'acquisition qui génère du trafic sans dépense publicitaire en continu — un investissement de départ qui produit des résultats pendant des années si les bases sont bien posées.' },
      { h3: 'CRO : pourquoi votre site reçoit des visites mais pas de demandes',
        p: 'Le taux de conversion moyen d\'un site freelance tourne autour de 1 à 3 %. Cela signifie que 97 à 99 % des visiteurs repartent sans vous contacter. Les raisons les plus fréquentes : une proposition de valeur floue visible en moins de 5 secondes, l\'absence de preuve sociale (témoignages, chiffres, logos clients), un appel à l\'action enterré en bas de page ou inexistant, un formulaire de contact trop long ou peu rassurant, et une navigation mobile non optimisée. L\'audit CRO de Savvly identifie précisément les points de friction et génère des recommandations prioritaires pour chaque section de votre site.' },
      { h3: 'Les 5 actions SEO à fort impact pour un site freelance',
        p: 'Sans rentrer dans une stratégie SEO complète, 5 actions produisent l\'essentiel des résultats pour un site freelance : optimiser les balises title et meta description de chaque page avec les mots-clés que vos clients recherchent, créer une page dédiée à chaque service principal (pas tout sur la page d\'accueil), obtenir des backlinks depuis des annuaires et des partenaires, améliorer la vitesse de chargement (objectif : moins de 2,5 secondes sur mobile), et ajouter votre établissement sur Google Business Profile si vous avez une clientèle locale. Ces 5 actions représentent 80 % de l\'impact SEO pour 20 % de l\'effort.' },
    ],
  },
  prospection: {
    h2: 'Prospection freelance : comment décrocher des clients sans spammer',
    sections: [
      { h3: 'Pourquoi la plupart des messages de prospection ne convertissent pas',
        p: 'Les messages de prospection qui échouent partagent les mêmes défauts : ils parlent du freelance et de ses compétences plutôt que du problème du client, ils sont trop longs et trop formels, ils n\'ont pas de raison précise d\'être envoyés à ce client en particulier, et ils se terminent par un appel à l\'action trop engageant (« pouvez-vous prendre 30 minutes pour un call ? »). Un bon message de prospection est court, ultra-personnalisé, centré sur la valeur apportée au client, et se termine par une question ouverte ou un micro-engagement facile à accepter. Le taux de réponse passe de 2 % à 15-25 % avec cette approche.' },
      { h3: 'LinkedIn ou email : quel canal choisir pour prospecter',
        p: 'LinkedIn offre un avantage majeur : le contexte. Vous pouvez référencer une publication récente du prospect, un changement de poste ou un événement dans son secteur pour personnaliser votre approche. Les InMails LinkedIn ont un taux d\'ouverture de 57 % en moyenne contre 21 % pour l\'email froid. L\'email reste plus efficace pour les décideurs qui reçoivent peu de sollicitations sur LinkedIn (PME, artisans, professions libérales). La stratégie optimale : commencer par un like ou un commentaire sur le contenu du prospect, puis envoyer un message personnalisé qui fait référence à cette interaction. Savvly génère des variantes pour chaque canal.' },
      { h3: 'La cadence de relance idéale pour ne pas être intrusif',
        p: 'Une séquence de prospection efficace et non intrusive suit ce rythme : message initial J0, première relance J5 (si pas de réponse), deuxième relance J14, puis abandon ou mise en veille pour 3 mois. Au-delà de 3 contacts sans réponse, insistez plus nuit qu\'elle n\'aide. Entre chaque message, variez l\'angle d\'attaque : apportez une ressource utile, référencez un contenu récent du prospect, ou mentionnez un changement dans son actualité. L\'objectif n\'est pas de convaincre à tout prix mais d\'être présent au bon moment, lorsque le besoin émerge chez le client.' },
    ],
  },
  urssaf: {
    h2: 'Calculateur URSSAF 2026 : cotisations, charges et revenu net freelance',
    sections: [
      { h3: 'Taux de cotisations URSSAF 2026 par régime',
        p: 'Les taux de cotisations sociales varient significativement selon votre statut. En micro-entreprise, le taux global est de 12,3 % du CA pour les activités de vente, 21,2 % pour les prestations de services BIC, et 23,1 % pour les prestations de services BNC (professions libérales relevant du régime général). En SASU ou EURL à l\'IS avec rémunération de gérant, les cotisations sociales s\'appliquent sur la rémunération nette à hauteur d\'environ 45 à 75 % selon le régime. En EURL à l\'IR, le régime TNS applique des cotisations d\'environ 44 % sur le bénéfice. Ces taux évoluent chaque année — le calculateur Savvly intègre les barèmes 2026 validés.' },
      { h3: 'Simuler votre revenu net selon différents niveaux de CA',
        p: 'Connaître son chiffre d\'affaires brut ne suffit pas pour planifier ses finances. En micro-entreprise, un CA de 60 000 € en prestations de services BNC donne un revenu brut avant IR de 60 000 € - 13 860 € (cotisations 23,1 %) = 46 140 €, duquel vous déduisez encore l\'abattement forfaitaire de 34 % pour le calcul de l\'IR, soit une base imposable de 30 452 €. En SASU, pour 60 000 € de facturation, si vous vous versez 36 000 € de salaire brut, vos charges patronales et salariales représentent environ 50 % du brut. Le simulateur Savvly calcule ces scénarios en temps réel avec le curseur de CA.' },
      { h3: 'Dates d\'échéance URSSAF 2026 et choix de la périodicité',
        p: 'Les micro-entrepreneurs déclarent et paient leurs cotisations soit mensuellement (le 31 de chaque mois pour le CA du mois précédent), soit trimestriellement (le 30 avril, 31 juillet, 31 octobre et 31 janvier). La déclaration mensuelle est recommandée si votre CA est régulier — elle lisse les sorties de trésorerie. La déclaration trimestrielle convient mieux si votre activité est irrégulière ou saisonnière. Attention : l\'option mensuelle ou trimestrielle doit être choisie en début d\'année et ne peut pas être modifiée en cours d\'année. Le calculateur Savvly génère votre calendrier d\'échéances personnalisé selon votre régime.' },
      { h3: 'Les seuils à ne pas dépasser en micro-entreprise',
        p: 'En 2026, les seuils de chiffre d\'affaires pour rester en micro-entreprise sont de 188 700 € pour les activités de vente et d\'hébergement, et de 77 700 € pour les prestations de services. Dépasser ces seuils deux années consécutives entraîne la sortie automatique du régime micro au 1er janvier de l\'année suivante. Si vous approchez de ces seuils, anticipez avec votre expert-comptable le passage au régime réel simplifié (pour les EI) ou la création d\'une société (SASU, EURL). La franchise en base de TVA, quant à elle, s\'arrête à 36 800 € pour les services (seuil 2026).' },
    ],
  },
  statut: {
    h2: 'Quel statut juridique choisir en freelance ? Comparatif complet 2026',
    sections: [
      { h3: 'Micro-entreprise : le statut idéal pour démarrer',
        p: 'La micro-entreprise (anciennement auto-entrepreneur) reste le statut le plus simple et le plus rapide à créer pour un freelance débutant. Création en ligne en 24h, comptabilité ultra-simplifiée, charges sociales payées en pourcentage direct du CA (donc nulles si CA nul), franchise de TVA jusqu\'à 36 800 € de CA. Les inconvénients : impossibilité de déduire les charges réelles (le résultat est calculé par abattement forfaitaire), plafond de CA limité, crédibilité parfois moindre auprès de grands comptes. Le statut micro convient parfaitement pour tester son activité, pour un CA inférieur à 40 000 €/an, ou pour une activité complémentaire à un emploi salarié.' },
      { h3: 'SASU vs EURL : le choix pour un freelance solo en croissance',
        p: 'La SASU (Société par Actions Simplifiée Unipersonnelle) et l\'EURL (Entreprise Unipersonnelle à Responsabilité Limitée) sont les deux formes societales les plus utilisées par les freelances confirmés. La SASU est avantageuse si vous vous versez un salaire de dirigeant : vos cotisations sociales (assimilé-salarié) ouvrent droit à une protection sociale plus complète, notamment le chômage si vous êtes également salarié par ailleurs. L\'EURL est avantageuse si vous préférez vous rémunérer via les bénéfices (dividendes) : le régime TNS du gérant d\'EURL offre des cotisations plus faibles qu\'un salarié, mais une protection sociale moins étendue. Le choix dépend de votre situation fiscale et de vos objectifs de rémunération.' },
      { h3: 'À quel moment quitter la micro-entreprise',
        p: 'Plusieurs signaux indiquent qu\'il est temps de passer à une structure sociale : votre CA approche régulièrement les plafonds micro, vous avez des charges professionnelles importantes que vous ne pouvez pas déduire (matériel, logiciels, loyer de bureau), vos clients grands comptes vous demandent une structure en société pour leurs fournisseurs, ou vous souhaitez vous associer. La transition se planifie avec 3 à 6 mois d\'avance avec un expert-comptable. Les frais de création d\'une SASU ou EURL sont de l\'ordre de 1 500 à 3 000 € avec accompagnement. L\'outil Savvly vous aide à identifier le bon moment selon votre situation.' },
    ],
  },
  'mission-finder': {
    h2: 'Trouver des missions freelance en 2026 : plateformes et stratégies',
    sections: [
      { h3: 'Les meilleures plateformes freelance en France en 2026',
        p: 'Le marché des plateformes freelance s\'est considérablement structuré. Malt reste la référence pour les profils tech, marketing et design avec 700 000 freelances inscrits et des missions moyennes autour de 550 €/jour. Comet cible les profils tech senior avec un processus de sélection plus exigeant et des missions en grandes entreprises et scale-ups. Upwork offre un accès au marché international anglophone mais implique une concurrence mondiale tarifaire. Fiverr convient pour des prestations productisées à tarif fixe. À côté des plateformes, des communautés spécialisées comme Slack de niches ou groupes LinkedIn génèrent souvent des missions de meilleure qualité avec moins de concurrence.' },
      { h3: 'Optimiser son profil pour attirer les bons clients',
        p: 'Un profil freelance qui convertit répond à trois questions en moins de 10 secondes : qui es-tu, pour qui travailles-tu, et quel résultat tu produis. Évitez les titres génériques comme « Développeur web freelance » — préférez « Je construis des apps SaaS qui convertissent pour les startups B2B ». Remplissez votre profil avec des études de cas clients qui mentionnent des résultats mesurables (« +45 % de taux de conversion », « livré en 3 semaines »). Sur Malt, les profils avec photo professionnelle et au moins 3 avis clients reçoivent 8 fois plus de sollicitations que les profils vides. Savvly génère un pitch optimisé pour chaque plateforme selon votre profil.' },
      { h3: 'Au-delà des plateformes : développer son réseau direct',
        p: 'Les missions trouvées via son réseau personnel sont en moyenne 30 % mieux rémunérées et nécessitent moins de temps de vente que les missions sur plateformes. Le réseau direct se construit en : maintenant une présence régulière sur LinkedIn, en recontactant systématiquement les anciens clients après chaque mission (une demande de recommandation et une prise de nouvelles suffisent), en participant à des événements de votre secteur (meetups, conférences, groupes professionnels), et en collaborant avec d\'autres freelances complémentaires qui peuvent vous référencer. Un réseau actif génère 40 à 60 % des missions des freelances établis.' },
    ],
  },
  'linkedin-intel': {
    h2: 'Optimiser son profil LinkedIn freelance et sa stratégie de contenu',
    sections: [
      { h3: 'Les éléments de profil qui font la différence pour un freelance',
        p: 'Le profil LinkedIn d\'un freelance performant se distingue par cinq éléments clés. La photo professionnelle (fond neutre, regard caméra, sourire) : les profils avec photo reçoivent 21 fois plus de vues que les profils sans photo. Le titre personnalisé au-delà du simple intitulé de poste — c\'est ce qui apparaît dans les résultats de recherche et sous votre nom partout sur LinkedIn. La section À propos rédigée en première personne avec une proposition de valeur claire, des résultats concrets et un appel à l\'action. La section Sélection (anciennement En vedette) avec vos meilleurs contenus ou réalisations. Et les recommandations textuelles de clients satisfaits, beaucoup plus impactantes que les simples endorsements de compétences.' },
      { h3: 'Stratégie de contenu LinkedIn : la méthode des 3 piliers',
        p: 'Une stratégie de contenu LinkedIn solide pour un freelance repose sur 3 types de contenus alternés. Pilier 1 (40 %) : contenu d\'expertise — partages de méthodes, analyses, tutoriels, opinions sur votre secteur. Pilier 2 (40 %) : contenu de crédibilité — études de cas, résultats clients, projets récents, témoignages. Pilier 3 (20 %) : contenu de personnalité — apprentissages personnels, erreurs assumées, coulisses de votre activité. Cette alternance maintient l\'intérêt de votre audience tout en construisant simultanément votre expertise perçue et votre sympathie. L\'outil Savvly analyse votre profil existant et vous propose un plan de contenu sur 4 semaines selon ces 3 piliers.' },
      { h3: 'Analyser les profils concurrents pour trouver votre positionnement',
        p: 'L\'analyse des profils LinkedIn de vos concurrents directs révèle des opportunités de différenciation souvent invisibles sans comparaison systématique. Observez : comment ils formulent leur titre et leur proposition de valeur, quels types de contenus génèrent le plus d\'engagement dans leur audience, quels clients et secteurs ils mentionnent, et quelles compétences et certifications ils mettent en avant. Identifiez les angles qu\'ils n\'exploitent pas, les niches qu\'ils négligent, ou les formats de contenu absents de leur stratégie. Ce sont vos opportunités de différenciation. L\'outil d\'analyse LinkedIn de Savvly automatise cette comparaison et génère un rapport actionnable.' },
    ],
  },
  image: {
    h2: 'Générer des visuels professionnels pour LinkedIn avec l\'IA',
    sections: [
      { h3: 'Pourquoi les visuels boostent l\'engagement sur LinkedIn',
        p: 'Les posts LinkedIn avec images natives génèrent en moyenne 98 % de commentaires supplémentaires par rapport aux posts texte seuls, selon les données de LinkedIn lui-même. Plus important encore, une image forte augmente le taux d\'arrêt lors du scroll — ce qu\'on appelle le « thumb-stopping effect ». Pour un freelance, des visuels cohérents et professionnels renforcent la perception de votre expertise et de votre sérieux. Le problème : créer des visuels de qualité demande généralement des compétences en design (Canva, Figma, Photoshop) ou un budget pour déléguer. L\'IA de Savvly génère des visuels optimisés pour LinkedIn en décrivant simplement ce que vous voulez.' },
      { h3: 'Charte graphique minimale pour un freelance cohérent',
        p: 'La cohérence visuelle construit la reconnaissance de votre marque personnelle sur LinkedIn. Vous n\'avez pas besoin d\'un brief de 50 pages — une charte minimale suffit : 2 couleurs primaires (votre couleur principale + une couleur d\'accent), 1 police principale pour les titres et 1 pour le corps, votre logo ou initiales en watermark, et un style de mise en page répétable (fond clair avec texte foncé, ou l\'inverse). Une fois cette charte définie, vos visuels sont immédiatement reconnaissables dans le fil d\'actualité de vos abonnés. Précisez ces éléments à l\'outil Savvly pour des visuels cohérents avec votre identité.' },
      { h3: 'Les types de visuels qui performent le mieux pour un freelance',
        p: 'Tous les visuels ne se valent pas sur LinkedIn. Les formats les plus performants pour les freelances : les carrousels (plusieurs slides swipeables) qui génèrent 3 fois plus d\'engagement que les posts simples, les infographies récapitulatives d\'une méthode ou d\'un processus, les citations mises en forme à partir de témoignages clients, les « before / after » visuels d\'un projet, et les couvertures d\'articles qui donnent envie de cliquer. Le générateur de visuels Savvly propose ces formats pré-structurés — vous n\'avez qu\'à renseigner votre contenu et vos couleurs.' },
    ],
  },
  converter: {
    h2: 'Convertir ses fichiers en PDF : guide pratique pour freelances',
    sections: [
      { h3: 'Pourquoi le PDF est le format incontournable du freelance',
        p: 'Le format PDF (Portable Document Format) est devenu le standard de facto pour l\'échange de documents professionnels, et pour de bonnes raisons. Contrairement à un fichier Word ou Google Docs, un PDF est non modifiable par défaut et s\'affiche identiquement sur tous les appareils — votre mise en page de devis reste impeccable que le client l\'ouvre sur Mac, PC ou mobile. En France, les administrations, les tribunaux et les comptables exigent systématiquement des documents en PDF. Envoyer une facture ou un contrat en format Word expose à des risques de modification accidentelle ou intentionnelle du contenu.' },
      { h3: 'Conversion locale : vos fichiers restent privés',
        p: 'La plupart des outils de conversion en ligne envoient vos fichiers vers leurs serveurs pour les traiter — ce qui pose des problèmes de confidentialité pour des documents contenant des données personnelles (factures clients, contrats, informations bancaires). Le convertisseur de Savvly fonctionne entièrement dans votre navigateur grâce aux API modernes de traitement de fichiers : vos documents ne quittent jamais votre ordinateur. Aucun fichier n\'est transmis, stocké ou analysé par nos serveurs. Cette approche est particulièrement importante pour les freelances qui gèrent des documents sensibles ou qui ont des clients dans des secteurs réglementés.' },
      { h3: 'Bonnes pratiques de gestion documentaire pour un freelance',
        p: 'Un freelance génère en moyenne 5 à 15 documents par client et par mission : devis, contrat, factures d\'acompte, facture finale, livrables. Une organisation documentaire rigoureuse économise des heures chaque année et évite les situations stressantes (retrouver une vieille facture lors d\'un contrôle fiscal). Adoptez une nomenclature de fichiers cohérente : [ANNEE]-[MOIS]-[CLIENT]-[TYPE].pdf (ex : 2026-03-DUPONT-FACTURE-001.pdf). Classez par client puis par année. Archivez vos documents pendant au moins 10 ans pour les factures (délai de prescription fiscale en France). Savvly sauvegarde automatiquement l\'historique de vos documents générés.' },
    ],
  },
};

// ── Tool-specific how-it-works steps ────────────────────────────
const HOW_IT_WORKS = {
  contract: [
    { title: 'Renseignez la mission', desc: 'Décrivez la mission, renseignez les coordonnées des deux parties, le tarif, les délais et le nombre de révisions incluses.' },
    { title: "L'IA génère le contrat", desc: "Le contrat est rédigé avec toutes les clauses essentielles : périmètre, propriété intellectuelle, pénalités de retard et conditions de résiliation." },
    { title: 'Exportez et faites signer', desc: "Téléchargez en PDF et envoyez à votre client via l'outil de signature électronique de votre choix. Archivez dans votre historique Savvly." },
  ],
  devis: [
    { title: 'Décrivez les prestations', desc: 'Entrez chaque ligne de prestation avec son intitulé, sa quantité et son tarif unitaire. Indiquez votre régime TVA et les conditions de paiement.' },
    { title: 'Le devis est généré', desc: "Savvly calcule automatiquement les totaux, applique la TVA correcte et ajoute toutes les mentions légales obligatoires pour votre statut." },
    { title: 'Envoyez et relancez', desc: 'Exportez en PDF, envoyez à votre client et suivez les devis en attente depuis votre historique. Si pas de réponse, générez un email de relance.' },
  ],
  'linkedin-content': [
    { title: 'Choisissez votre angle', desc: "Indiquez le sujet du post, le format souhaité (storytelling, liste, opinion), votre ton habituel et l'objectif : visibilité, engagement ou génération de leads." },
    { title: "L'IA rédige 3 variantes", desc: "Savvly génère 3 versions du post optimisées pour l'algorithme LinkedIn : hook fort, structure aérée, call-to-action clair." },
    { title: 'Sélectionnez et publiez', desc: "Choisissez la variante qui vous correspond, retouchez si besoin et copiez directement dans LinkedIn. Sauvegardez les idées dans votre bibliothèque." },
  ],
  legal: [
    { title: 'Décrivez votre activité', desc: "Indiquez votre statut juridique, le type de clients (BtoB/BtoC), votre secteur d'activité et les spécificités de vos prestations." },
    { title: 'Documents générés en 60s', desc: "Savvly génère vos CGV et mentions légales conformes au droit français et au RGPD, adaptées à votre activité et votre type de clientèle." },
    { title: 'Intégrez à votre site', desc: 'Copiez-collez les textes sur votre site ou téléchargez en PDF. Mettez-les à jour annuellement ou si votre activité évolue.' },
  ],
  relance: [
    { title: 'Sélectionnez le type de relance', desc: "Indiquez s'il s'agit d'une facture impayée ou d'une proposition sans réponse, le délai de retard et votre relation avec le client." },
    { title: "L'IA génère le message adapté", desc: "Savvly rédige un message professionnel avec le bon ton (cordial, ferme ou urgent) selon l'étape de votre séquence de relance." },
    { title: 'Envoyez et suivez', desc: "Copiez le message dans votre messagerie et programmez le suivi. Si la relance reste sans réponse, générez l'étape suivante en un clic." },
  ],
  compete: [
    { title: "Entrez les URLs à analyser", desc: "Renseignez l'URL de votre site et celle de 1 à 3 concurrents. Précisez les angles qui vous intéressent : positionnement, contenu, SEO, offre tarifaire." },
    { title: "L'IA analyse et compare", desc: "Savvly extrait les données publiques, identifie les forces et faiblesses de chaque concurrent et les compare à votre propre positionnement." },
    { title: 'Obtenez vos recommandations', desc: "Recevez un rapport avec les opportunités de différenciation identifiées et un plan d'action priorisé pour vous démarquer sur votre marché." },
  ],
  audit: [
    { title: "Entrez l'URL de votre site", desc: "Renseignez l'URL de la page ou du site à auditer. Précisez votre objectif principal : référencement naturel, taux de conversion ou expérience mobile." },
    { title: "L'audit se lance en 60 secondes", desc: "Savvly analyse votre site sur les critères SEO (balises, vitesse, structure) et CRO (clarté du message, appel à l'action, preuve sociale)." },
    { title: 'Recevez vos actions prioritaires', desc: "Obtenez un rapport avec un score global, une liste d'actions classées par impact et un guide d'implémentation pour chaque recommandation." },
  ],
  prospection: [
    { title: 'Décrivez votre cible', desc: "Renseignez le profil de votre prospect idéal : secteur, taille d'entreprise, rôle du décideur, problème que vous résolvez et canal utilisé (LinkedIn ou email)." },
    { title: "L'IA génère 3 variantes de messages", desc: "Savvly rédige 3 approches différentes : directe, indirecte avec apport de valeur, et référence à l'actualité du prospect. Chaque message inclut une accroche personnalisée." },
    { title: 'Testez et affinez', desc: "Envoyez les variantes à différents segments et revenez saisir les taux de réponse. Savvly apprend de vos résultats pour affiner les prochaines variantes." },
  ],
  urssaf: [
    { title: 'Entrez votre CA et votre statut', desc: "Indiquez votre chiffre d'affaires mensuel ou annuel, votre régime (micro, SASU, EURL) et votre activité (services, vente). Ajoutez les éventuelles options (ACRE, versement libératoire)." },
    { title: 'Simulation instantanée', desc: "Le calculateur applique les taux URSSAF 2026 exacts selon votre régime et génère une ventilation complète : cotisations, charges, revenu net avant IR." },
    { title: 'Obtenez votre calendrier', desc: "Recevez vos dates d'échéance personnalisées selon votre périodicité de déclaration (mensuelle ou trimestrielle) et un récapitulatif annuel à exporter." },
  ],
  statut: [
    { title: 'Répondez au questionnaire', desc: "Indiquez votre CA prévisionnel, votre type d'activité, votre situation personnelle (salarié en parallèle ?), vos objectifs de rémunération et votre appétit pour les formalités administratives." },
    { title: "L'IA analyse votre profil", desc: "Savvly compare les scénarios micro-entreprise, EI, EURL et SASU sur les critères les plus importants pour votre situation spécifique." },
    { title: 'Recevez une recommandation claire', desc: "Obtenez une recommandation de statut argumentée avec le comparatif chiffré des charges, la protection sociale et les contraintes administratives de chaque option." },
  ],
  'mission-finder': [
    { title: 'Décrivez votre profil', desc: "Renseignez vos compétences principales, votre secteur, votre TJM cible, les types de missions recherchées (régie, forfait, remote) et votre niveau d\'expérience." },
    { title: "L'IA génère votre stratégie", desc: "Savvly recommande les plateformes les plus adaptées à votre profil, génère un pitch optimisé pour chacune et identifie les mots-clés à utiliser dans vos titres." },
    { title: 'Déployez et suivez', desc: "Publiez votre profil optimisé sur les plateformes recommandées. Revenez après 30 jours pour ajuster la stratégie en fonction des retours obtenus." },
  ],
  'linkedin-intel': [
    { title: 'Renseignez vos profils', desc: "Entrez l'URL de votre profil LinkedIn et les URLs de 1 à 3 profils de concurrents directs dans votre niche. Précisez vos objectifs : visibilité, leads entrants, recrutement." },
    { title: "L'audit comparatif se lance", desc: "Savvly analyse les profils et identifie les points forts et faibles de chaque élément : titre, résumé, expériences, sélection et stratégie de contenu." },
    { title: 'Plan de contenu 30 jours', desc: "Recevez vos recommandations de profil priorisées et un calendrier éditorial de 30 jours avec 10 idées de posts rédigées et prêtes à adapter." },
  ],
  image: [
    { title: "Décrivez votre visuel", desc: "Indiquez le type de visuel souhaité (post LinkedIn, bannière, infographie), le message principal, vos couleurs et votre ton (professionnel, créatif, minimaliste)." },
    { title: "L'IA génère plusieurs variantes", desc: "Savvly génère plusieurs propositions visuelles selon votre brief. Chaque variante est optimisée pour les dimensions et contraintes du format choisi." },
    { title: 'Téléchargez en haute résolution', desc: "Exportez le visuel en PNG haute résolution directement depuis Savvly. Utilisez-le immédiatement sur LinkedIn, votre site ou vos supports de communication." },
  ],
  converter: [
    { title: 'Importez votre fichier', desc: "Glissez-déposez votre fichier PNG, JPG, JPEG ou DOCX dans la zone de conversion. La taille maximum est de 20 Mo par fichier." },
    { title: 'Conversion instantanée dans le navigateur', desc: "La conversion se fait en quelques secondes directement dans votre navigateur. Aucun fichier n'est transmis à nos serveurs — vos données restent privées." },
    { title: 'Téléchargez votre PDF', desc: "Cliquez sur « Télécharger le PDF » pour récupérer votre fichier converti. Le PDF est immédiatement prêt à être envoyé à votre client ou archivé." },
  ],
};

// ── Expanded FAQs (5-6 per tool) ────────────────────────────────
const FAQS = {
  contract: [
    { q: 'Le contrat est-il légalement valide en France ?', a: 'Le contrat généré s\'appuie sur les standards du droit français des prestations de services (Code civil, articles 1710 et suivants). Il intègre les clauses essentielles reconnues par la jurisprudence. Pour les missions à forts enjeux (>10 000 €) ou dans des secteurs réglementés, faites-le relire par un avocat spécialisé.' },
    { q: 'Puis-je modifier le contrat après génération ?', a: 'Oui, le texte est entièrement éditable. Copiez-le dans Word, Google Docs ou votre éditeur préféré et adaptez-le à votre situation avant de l\'envoyer à votre client.' },
    { q: 'Quelles informations dois-je avoir sous la main ?', a: 'Nom, prénom et SIRET du client (ou dénomination sociale), description précise de la mission, tarif total ou TJM, délais de livraison, nombre de révisions incluses et conditions de paiement (acompte, solde).' },
    { q: 'Le contrat inclut-il une clause de propriété intellectuelle ?', a: 'Oui. Le contrat généré inclut une clause de cession ou de licence des droits d\'auteur selon vos préférences. C\'est une clause indispensable pour tout freelance créatif (développeur, designer, rédacteur).' },
    { q: 'Comment gérer les avenants si la mission évolue ?', a: 'Savvly peut générer des avenants au contrat initial lorsque le périmètre de la mission change en cours de route. L\'avenant fait référence au contrat d\'origine et précise les modifications convenues.' },
    { q: 'Un email suffit-il comme preuve de contrat ?', a: 'Un échange d\'emails avec « Bon pour accord » du client constitue une preuve de consentement recevable en justice, mais un contrat formalisé et signé est toujours plus solide, notamment pour justifier vos droits sur les livrables.' },
  ],
  devis: [
    { q: 'Le devis est-il exportable en PDF ?', a: 'Oui, directement depuis Savvly. Le PDF est mis en page professionnellement avec vos coordonnées, celles du client, le détail des prestations et les totaux calculés automatiquement.' },
    { q: 'Puis-je ajouter plusieurs lignes de prestation ?', a: 'Absolument. Le générateur supporte autant de lignes que nécessaire, avec calcul automatique des totaux HT, TVA et TTC pour chaque ligne et pour le total général.' },
    { q: 'Comment gérer la TVA en micro-entreprise ?', a: 'Cochez « Franchise en base de TVA » et la mention légale obligatoire (art. 293B du CGI) sera ajoutée automatiquement sur votre devis. Si vous avez dépassé les seuils, renseignez votre numéro de TVA intracommunautaire.' },
    { q: 'Comment fixer la durée de validité de mon devis ?', a: 'La durée de validité standard est de 30 jours, mais vous pouvez la modifier. Une durée courte (15 jours) crée un sentiment d\'urgence et vous protège contre les hausses de vos propres coûts. Une durée longue convient pour les grands comptes avec des processus d\'achat lents.' },
    { q: 'Puis-je transformer un devis en facture directement ?', a: 'Oui, depuis votre historique Savvly vous pouvez dupliquer un devis et le convertir en facture en ajoutant la date d\'émission, le numéro de facture et les informations de paiement.' },
    { q: 'Comment mentionner un acompte sur le devis ?', a: 'Dans la section conditions de paiement, précisez le pourcentage d\'acompte demandé (généralement 30 à 50 %) et le délai de règlement du solde. Savvly l\'intègre automatiquement dans les conditions de règlement affichées sur le devis.' },
  ],
  'linkedin-content': [
    { q: 'Le contenu généré sera-t-il original ?', a: 'Oui. Chaque post est généré selon vos paramètres (ton, sujet, format, audience cible) et est unique. Vous pouvez demander plusieurs variantes et affiner avec vos retours pour que l\'IA apprenne votre style.' },
    { q: 'Quels formats de posts sont disponibles ?', a: 'Storytelling personnel, liste actionnable, opinion tranchée, question engageante, étude de cas, citation mise en forme et accroche teaser. Choisissez le format adapté à votre objectif du moment.' },
    { q: "L'IA connaît-elle l'algorithme LinkedIn ?", a: "Oui, les posts sont optimisés pour le taux d'engagement LinkedIn : hook fort sur les deux premières lignes (avant le « Voir plus »), structure aérée avec paragraphes courts, et call-to-action clair en fin de post." },
    { q: 'À quelle fréquence dois-je publier sur LinkedIn ?', a: '3 à 5 fois par semaine est idéal pour une croissance soutenue. Mais la régularité prime sur la fréquence — 2 posts par semaine pendant 6 mois produisent de meilleurs résultats qu\'un mois à 7 posts/semaine suivi d\'un arrêt complet.' },
    { q: 'Le post respecte-t-il ma voix et mon style ?', a: 'Plus vous utilisez Savvly, plus il apprend votre style. Vous pouvez aussi renseigner votre ton habituel (humoristique, direct, pédagogue, provocateur) et des exemples de vos meilleurs posts pour guider la génération.' },
    { q: 'Puis-je générer des posts en anglais ?', a: 'Oui, Savvly génère des posts LinkedIn en français et en anglais. Précisez la langue souhaitée dans vos paramètres. L\'anglais est recommandé si vous ciblez des clients internationaux ou des multinationales.' },
  ],
  legal: [
    { q: 'Mes CGV seront-elles conformes à la loi française ?', a: 'Les documents générés s\'appuient sur le Code de la consommation, le Code de commerce et le RGPD. Pour une conformité maximale dans des secteurs réglementés (santé, finance, données sensibles), faites-les vérifier par un juriste.' },
    { q: 'De quoi ai-je besoin pour générer mes CGV ?', a: 'Votre statut juridique et numéro SIRET, votre activité principale, le type de clients que vous servez (BtoB, BtoC ou les deux), vos conditions de vente habituelles et si vous collectez des données personnelles sur votre site.' },
    { q: 'Puis-je utiliser ces documents directement sur mon site ?', a: 'Oui, les documents sont fournis en texte prêt à intégrer ou en PDF téléchargeable. Pour un site WordPress, copiez le texte dans une page dédiée accessible depuis le footer.' },
    { q: 'Dois-je mettre à jour mes CGV régulièrement ?', a: 'Oui, une mise à jour annuelle est recommandée — ou dès que votre activité ou vos conditions commerciales évoluent. Conservez un historique des versions de vos CGV avec la date de mise en ligne de chaque version.' },
    { q: "Qu'est-ce qu'une politique de confidentialité et est-elle obligatoire ?", a: "La politique de confidentialité est obligatoire dès que vous collectez des données personnelles (formulaire de contact, newsletter, analytics). Elle doit préciser quelles données vous collectez, pourquoi, combien de temps vous les conservez et les droits des personnes. Savvly la génère avec vos CGV." },
  ],
  relance: [
    { q: 'Quand envoyer une première relance ?', a: 'Entre 3 et 7 jours après la date d\'échéance de la facture. N\'attendez pas plus de 2 semaines — plus vous attendez, plus le client considère la dette comme réglable « plus tard ».' },
    { q: 'Le message sera-t-il agressif ?', a: 'Vous choisissez le ton : cordial (première relance), ferme (deuxième relance) ou urgent (troisième relance avant mise en demeure). Le message reste toujours professionnel pour préserver la relation client.' },
    { q: 'Puis-je relancer une proposition commerciale ignorée ?', a: "Oui, l'outil génère des relances pour les factures impayées ET pour les propositions commerciales ou devis sans réponse. Le ton et le contenu sont adaptés à chaque situation." },
    { q: 'Quelles pénalités puis-je réclamer en cas de retard ?', a: 'Entre professionnels, les pénalités de retard légales s\'élèvent à 3 fois le taux d\'intérêt légal (soit environ 12-15 % annuel) + une indemnité forfaitaire de 40 € pour frais de recouvrement. Ces pénalités s\'appliquent dès le premier jour de retard sans mise en demeure préalable.' },
    { q: 'Que faire si le client ne répond toujours pas après 3 relances ?', a: 'Envoyez une mise en demeure par courrier recommandé avec accusé de réception. Si la créance est inférieure à 10 000 €, vous pouvez saisir le tribunal judiciaire via une injonction de payer en ligne sur service-public.fr, sans avocat.' },
  ],
  compete: [
    { q: "Quels concurrents puis-je analyser ?", a: "Tout site web public accessible sans connexion. Entrez l'URL complète et choisissez les angles d'analyse : positionnement, SEO on-page, contenu, offre, tarification visible et preuve sociale." },
    { q: "L'analyse est-elle actualisée en temps réel ?", a: "L'IA analyse les données publiques disponibles au moment de la requête. Pour un suivi régulier de vos concurrents, relancez l'analyse mensuellement et comparez les rapports pour détecter les évolutions de leur stratégie." },
    { q: "Quels secteurs sont couverts ?", a: "Tous les secteurs. L'outil est particulièrement efficace pour les freelances en marketing, design, développement, conseil, rédaction et formation. L'analyse s'adapte aux enjeux spécifiques de chaque secteur." },
    { q: "L'analyse inclut-elle des données SEO ?", a: "Oui, l'analyse couvre les éléments SEO accessibles publiquement : balises title et meta, structure des URLs, densité de mots-clés dans les contenus visibles, et vitesse de chargement perçue." },
    { q: "Puis-je exporter le rapport de l'analyse ?", a: "Oui, le rapport d'analyse concurrentielle est exportable en PDF depuis votre historique Savvly. Vous pouvez le partager avec des partenaires ou l'utiliser comme base pour votre stratégie de positionnement." },
  ],
  audit: [
    { q: "Combien de temps prend un audit ?", a: "Environ 60 secondes. L'IA analyse votre site et génère un rapport structuré avec un score global, des recommandations par catégorie et une liste d'actions classées par impact potentiel." },
    { q: "L'audit remplace-t-il un expert SEO ?", a: "Il vous donne une base solide et des actions prioritaires claires pour les améliorations à fort impact. Pour une stratégie SEO complète sur un marché concurrentiel, combinez-le avec du conseil expert pour les aspects techniques avancés." },
    { q: "Quels éléments sont analysés ?", a: "Vitesse de chargement perçue, structure des URLs, balises méta (title, description, H1-H3), maillage interne, taux de conversion estimé, clarté du message principal, preuve sociale et expérience mobile." },
    { q: "Puis-je auditer plusieurs pages de mon site ?", a: "Oui. Lancez un audit sur votre page d'accueil, votre page de services et votre page de contact séparément pour une vision complète. Les recommandations sont spécifiques à chaque page." },
    { q: "Comment prioriser les recommandations de l'audit ?", a: "Le rapport classe les recommandations selon leur impact SEO/CRO estimé et leur facilité d'implémentation. Commencez par les actions « quick wins » à fort impact et faible effort — elles produisent des résultats dans les 30 à 60 jours." },
  ],
  prospection: [
    { q: "Les messages seront-ils personnalisés ?", a: "Oui, l'IA prend en compte votre niche, votre cible, votre proposition de valeur et le canal de prospection pour générer des messages authentiques et contextualisés — pas des templates génériques." },
    { q: "Combien de variantes reçoit-on ?", a: "3 variantes de messages d'approche + une séquence de 2 relances pour chaque variante. Testez les angles et conservez ce qui génère le meilleur taux de réponse." },
    { q: "Quels canaux sont couverts ?", a: "Email froid, LinkedIn InMail, message LinkedIn après interaction, et message direct Instagram ou Twitter pour certains secteurs. Chaque canal a son style et sa longueur optimale, adaptés par l'IA." },
    { q: "Combien de prospects puis-je contacter par semaine ?", a: "Sur LinkedIn, restez sous 100 messages par semaine pour éviter les restrictions de compte. Par email, la cadence dépend de votre outil d'envoi et de votre réputation de domaine. La qualité prime toujours sur le volume en prospection freelance." },
    { q: "Comment améliorer mes taux de réponse ?", a: "Les facteurs les plus impactants : personnalisation visible dès la première ligne (référence à une publication récente, un changement de poste ou un projet du prospect), proposition de valeur centrée sur le problème du client, et appel à l'action à faible engagement (question ouverte plutôt que demande de RDV immédiate)." },
  ],
  urssaf: [
    { q: "Les taux sont-ils à jour pour 2026 ?", a: "Oui, les taux URSSAF 2026 sont intégrés pour tous les régimes : micro-entreprise (BIC services, BNC, vente), SASU, EURL à l'IS et EI au régime réel. Les barèmes sont vérifiés et mis à jour chaque année." },
    { q: "Puis-je simuler plusieurs niveaux de CA ?", a: "Oui. Utilisez le curseur de CA pour voir instantanément l'impact sur vos cotisations, votre revenu net avant impôt et votre taux de charges effectif. Comparez plusieurs scénarios sur une même simulation." },
    { q: "Les dates d'échéances sont-elles incluses ?", a: "Oui, le rapport inclut un calendrier personnalisé de vos prochaines échéances URSSAF selon votre régime de déclaration (mensuel ou trimestriel) et la date de début de votre activité." },
    { q: "L'ACRE est-elle prise en compte ?", a: "Oui. Si vous bénéficiez de l'ACRE (Aide à la Création ou Reprise d'Entreprise) qui réduit vos cotisations de 50 % la première année, cochez l'option correspondante et le calculateur applique les taux réduits automatiquement." },
    { q: "Quelle est la différence entre le versement libératoire et le prélèvement standard ?", a: "Le versement libératoire de l'IR (impôt sur le revenu) est une option pour les micro-entrepreneurs dont le revenu fiscal N-2 ne dépasse pas un certain seuil. Il vous permet de payer votre IR en même temps que vos cotisations URSSAF, à un taux fixe de 1 % (vente) ou 1,7 % (services BIC) ou 2,2 % (BNC). Le calculateur compare les deux options selon votre situation." },
  ],
  statut: [
    { q: "Comment l'outil choisit-il le bon statut ?", a: "Il analyse votre CA prévisionnel, votre type d'activité, votre situation personnelle (autres revenus, protection sociale souhaitée), vos objectifs de rémunération (salaire vs dividendes) et votre appétit pour la complexité administrative." },
    { q: "La recommandation est-elle définitive ?", a: "C'est une orientation basée sur vos réponses. Consultez un expert-comptable avant de créer votre structure — les implications fiscales et sociales sont trop importantes pour être décidées sur la seule base d'un outil en ligne, aussi précis soit-il." },
    { q: "Puis-je comparer micro-entreprise, SASU et EURL ?", a: "Oui, l'outil présente un comparatif côte à côte avec les avantages, inconvénients, charges estimées et seuils de rentabilité de chaque statut pour votre niveau de CA prévisionnel." },
    { q: "Quand est-il trop tard pour changer de statut ?", a: "Il n'est jamais trop tard, mais changer de statut en cours d'année entraîne des formalités : radiation de la micro-entreprise, création de la nouvelle structure, transfert des contrats clients. Prévoyez 2 à 3 mois pour la transition et anticipez-la idéalement en fin d'année civile." },
    { q: "La SASU est-elle vraiment avantageuse pour un freelance seul ?", a: "La SASU est avantageuse si vous vous versez un salaire de dirigeant significatif (>3 000 €/mois), si vous avez besoin d'une protection assimilé-salarié complète, ou si vous envisagez d'ouvrir le capital à des investisseurs. En dessous, les frais de gestion (expert-comptable obligatoire, dépôt de comptes) pèsent sur la rentabilité." },
  ],
  'mission-finder': [
    { q: "Quelles plateformes sont couvertes ?", a: "Malt, Comet, Upwork, Fiverr, LinkedIn, Toptal et les plateformes spécialisées selon votre secteur (Dribbble pour le design, GitHub Jobs pour le dev, etc.). L'IA recommande les plateformes les plus adaptées à votre profil." },
    { q: "L'outil trouve-t-il des missions directement ?", a: "Non, il génère une stratégie personnalisée, des pitches optimisés et des recommandations de plateformes. Vous postulez vous-même avec les bonnes armes — l'outil vous prépare à convertir, pas à prospecter à votre place." },
    { q: "C'est adapté à tous les secteurs ?", a: "Oui — développement, design, marketing, rédaction, conseil, finance, RH, data science. La stratégie et les pitches sont personnalisés selon votre domaine d'expertise et le type de missions recherchées." },
    { q: "Quel TJM est réaliste pour mon profil ?", a: "L'outil compare votre profil avec les fourchettes de marché de votre spécialité, votre niveau d'expérience et la région cible. Il vous aide à positionner votre TJM de façon compétitive sans vous sous-vendre." },
    { q: "Comment me démarquer sur Malt ou Upwork face à la concurrence ?", a: "Les profils qui convertissent le mieux ont en commun : une spécialisation claire (pas « généraliste »), des résultats chiffrés dans la description, au moins 3 avis clients vérifiés, et un taux de réponse élevé (répondez toujours en moins de 24h)." },
  ],
  'linkedin-intel': [
    { q: "De quoi ai-je besoin pour l'audit ?", a: "Votre URL de profil LinkedIn et l'URL de 1 à 3 profils de concurrents directs dans votre niche. Si possible, précisez vos objectifs prioritaires sur LinkedIn : visibilité, génération de leads, recrutement ou personal branding." },
    { q: "Le plan de contenu est-il prêt à publier ?", a: "Vous recevez 10 idées de posts avec l'angle, le format recommandé et une accroche rédigée pour chacun. Il reste à personnaliser avec vos exemples et anecdotes pour que le contenu soit authentiquement le vôtre." },
    { q: "À quelle fréquence utiliser cet outil ?", a: "Une fois par mois pour recalibrer votre stratégie et identifier les nouvelles opportunités de contenu. Une analyse trimestrielle approfondie suffit pour l'audit de profil comparatif." },
    { q: "L'outil accède-t-il vraiment à LinkedIn ?", a: "L'outil analyse les données de profil publiquement accessibles (sans connexion LinkedIn requise). Il ne collecte pas vos données privées et ne nécessite aucun accès à votre compte." },
    { q: "Comment améliorer mon Score SSI LinkedIn ?", a: "Le Social Selling Index (SSI) de LinkedIn est amélioré par quatre actions : compléter votre profil à 100 %, engager régulièrement avec du contenu pertinent, développer votre réseau cible, et publier du contenu régulièrement. L'audit Savvly identifie votre point de levier prioritaire parmi ces quatre dimensions." },
  ],
  image: [
    { q: "Quels formats d'images sont disponibles ?", a: "Visuels carrés (1080×1080) et portraits (1080×1350) pour posts LinkedIn, bannières de profil LinkedIn (1584×396), images de couverture d'articles LinkedIn (1920×1080) et visuels pour stories (1080×1920)." },
    { q: "Puis-je adapter le style à ma marque ?", a: "Oui. Précisez vos couleurs principales (code hex ou nom), votre police préférée si vous en avez une, votre ton (minimaliste, coloré, corporate, créatif) et votre logo. L'IA génère des visuels cohérents avec votre identité." },
    { q: "Les images sont-elles libres de droits ?", a: "Oui, les images générées par IA via Savvly vous appartiennent et sont libres de droits pour un usage commercial. Aucune attribution n'est requise. Vérifiez les conditions spécifiques si vous les utilisez dans des supports destinés à des tiers." },
    { q: "Quelle résolution pour mes visuels LinkedIn ?", a: "Savvly génère les images en 72 DPI minimum, ce qui est la résolution standard pour l'affichage écran et les réseaux sociaux. Pour des supports imprimés, une résolution 300 DPI est requise — précisez-le dans votre brief." },
    { q: "Puis-je générer des carrousels LinkedIn ?", a: "Oui. Décrivez votre contenu (titre, nombre de slides, messages clés de chaque slide) et Savvly génère un set de slides cohérents avec votre charte visuelle, prêts à être importés comme PDF sur LinkedIn." },
  ],
  converter: [
    { q: "Quels formats sont pris en charge ?", a: "PNG, JPG, JPEG → PDF ; DOCX → PDF. La conversion est 100 % locale dans votre navigateur — aucun fichier n'est envoyé sur nos serveurs. D'autres formats sont en cours d'intégration." },
    { q: "Y a-t-il une limite de taille de fichier ?", a: "Les fichiers jusqu'à 20 Mo sont supportés. Pour les documents Word complexes avec images haute résolution, la conversion peut prendre quelques secondes de plus." },
    { q: "Mes fichiers sont-ils confidentiels ?", a: "Absolument. La conversion se fait entièrement dans votre navigateur grâce aux API Web modernes. Aucune donnée n'est transmise à nos serveurs, aucun fichier n'est stocké ou analysé." },
    { q: "La mise en page de mon Word sera-t-elle respectée ?", a: "La mise en page standard (texte, titres, tableaux simples, images intégrées) est conservée dans la conversion DOCX → PDF. Les macros, formulaires interactifs et mises en page complexes avec textboxes flottantes peuvent perdre en précision." },
    { q: "Puis-je convertir plusieurs fichiers à la fois ?", a: "Actuellement, le convertisseur traite un fichier à la fois. Vous pouvez enchaîner plusieurs conversions successives sans limitation de nombre sur votre session." },
  ],
};

// ── Related tools (internal linking) ────────────────────────────
const RELATED = {
  contract:          ['devis-professionnel', 'relance-client', 'cgv-mentions-legales'],
  devis:             ['contrat-freelance', 'calculateur-urssaf', 'relance-client'],
  'linkedin-content':['linkedin-intelligence', 'prospection-outreach', 'generateur-images'],
  legal:             ['contrat-freelance', 'statut-juridique', 'calculateur-urssaf'],
  relance:           ['contrat-freelance', 'devis-professionnel', 'calculateur-urssaf'],
  compete:           ['audit-seo-cro', 'prospection-outreach', 'linkedin-intelligence'],
  audit:             ['analyse-concurrents', 'posts-linkedin', 'generateur-images'],
  prospection:       ['posts-linkedin', 'mission-finder', 'linkedin-intelligence'],
  urssaf:            ['statut-juridique', 'devis-professionnel', 'contrat-freelance'],
  statut:            ['calculateur-urssaf', 'contrat-freelance', 'devis-professionnel'],
  'mission-finder':  ['prospection-outreach', 'posts-linkedin', 'linkedin-intelligence'],
  'linkedin-intel':  ['posts-linkedin', 'prospection-outreach', 'mission-finder'],
  image:             ['posts-linkedin', 'linkedin-intelligence', 'audit-seo-cro'],
  converter:         ['contrat-freelance', 'devis-professionnel', 'cgv-mentions-legales'],
};

// ── SEO hook with FAQ JSON-LD ────────────────────────────────────
function useSeo(title, description, faqs) {
  useEffect(() => {
    const prev = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta ? meta.getAttribute('content') : '';
    document.title = title;
    if (meta) meta.setAttribute('content', description);

    let script = null;
    if (faqs?.length) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'faq-schema';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
      document.head.appendChild(script);
    }

    return () => {
      document.title = prev;
      if (meta) meta.setAttribute('content', prevDesc);
      if (script) script.remove();
    };
  }, [title, description]);
}

// ── Components ───────────────────────────────────────────────────
function FAQAccordion({ faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {faqs.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 15, color: '#0F0F1A', gap: 16 }}
          >
            <span>{item.q}</span>
            <span style={{ fontSize: 20, color: '#4F46E5', flexShrink: 0, transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block' }}>+</span>
          </button>
          {open === i && (
            <p style={{ color: '#4B4B6A', fontSize: 14, lineHeight: 1.75, paddingBottom: 18, margin: 0 }}>{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function GuideSection({ guide, accent }) {
  if (!guide) return null;
  return (
    <section aria-label="Guide complet" style={{ background: '#F5F5F7', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, color: '#0F0F1A', margin: '0 0 48px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {guide.h2}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {guide.sections.map((s, i) => (
            <div key={i}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F0F1A', margin: '0 0 12px', paddingLeft: 16, borderLeft: `3px solid ${accent}` }}>
                {s.h3}
              </h3>
              <p style={{ fontSize: 15, color: '#4B4B6A', lineHeight: 1.8, margin: 0 }}>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedSection({ slugs, accent }) {
  if (!slugs?.length) return null;
  const ID_TO_SLUG = Object.fromEntries(Object.entries(SLUG_TO_ID).map(([s, id]) => [id, s]));
  const tools = slugs
    .map(slug => {
      const id = SLUG_TO_ID[slug];
      const t = TOOLS.find(t => t.id === id);
      return t ? { slug, t } : null;
    })
    .filter(Boolean);
  if (!tools.length) return null;
  return (
    <section aria-label="Outils similaires" style={{ background: '#fff', borderTop: '1px solid #E5E7EB', padding: 'clamp(48px, 6vw, 72px) 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#0F0F1A', margin: '0 0 32px', textAlign: 'center' }}>
          Outils complémentaires
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {tools.map(({ slug, t }, i) => {
            const tx = getToolText(t, 'fr');
            return (
              <Link key={i} to={`/outils/${slug}`} style={{ display: 'block', textDecoration: 'none', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 22px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 4px 16px ${accent}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t.plan === 'free' ? 'Gratuit' : 'Pro'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F0F1A', marginBottom: 8 }}>{tx.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.55 }}>{tx.intro?.slice(0, 90)}…</div>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: accent }}>Découvrir →</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function ToolLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const toolId = SLUG_TO_ID[slug];
  const tool = toolId ? TOOLS.find(t => t.id === toolId) : null;
  const text = tool ? getToolText(tool, 'fr') : null;
  const faqs = FAQS[toolId] || [];
  const guide = GUIDE[toolId] || null;
  const steps = HOW_IT_WORKS[toolId] || [
    { title: 'Décrivez votre besoin', desc: 'Remplissez le formulaire en 30 secondes avec les informations essentielles de votre mission.' },
    { title: "L'IA génère votre document", desc: "Notre IA produit un résultat professionnel en quelques secondes, adapté à votre contexte exact." },
    { title: 'Exportez ou copiez', desc: "Téléchargez en PDF, copiez le texte ou sauvegardez dans votre historique Savvly." },
  ];
  const relatedSlugs = RELATED[toolId] || [];

  const seoTitle = tool ? `${text.name} IA gratuit — Savvly | Toolkit freelance` : 'Savvly';
  const seoDesc  = tool ? `${text.intro} Essayez gratuitement sur Savvly, le toolkit IA pour freelances.` : '';
  useSeo(seoTitle, seoDesc, faqs);
  usePageSeo({ title: seoTitle, description: seoDesc, path: `/outils/${slug}` });

  if (!tool) return <Navigate to="/" replace />;

  const accent = tool.accent || '#4F46E5';
  const isFree = tool.plan === 'free';

  return (
    <>
      <MarketingNav />

      {/* ── HERO ── */}
      <section aria-label="Présentation de l'outil" style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1E1E3A 100%)', padding: 'clamp(60px, 8vw, 100px) 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: 24 }}>
            <ol style={{ display: 'flex', justifyContent: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              <li><Link to="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Savvly</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/#tools" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Outils</Link></li>
              <li aria-hidden="true">›</li>
              <li style={{ color: 'rgba(255,255,255,0.7)' }}>{text.name}</li>
            </ol>
          </nav>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isFree ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.2)', border: `1px solid ${isFree ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.4)'}`, borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: isFree ? '#10B981' : '#818CF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isFree ? '✓ Gratuit' : 'Pro'}
            </span>
            {tool.franceOnly && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: '#60A5FA', letterSpacing: '0.08em' }}>
                🇫🇷 France
              </span>
            )}
            {!isFree && tool.credits > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                {tool.credits} crédits / utilisation
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {text.name} <span style={{ color: accent }}>IA</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 auto 36px', maxWidth: 580 }}>
            {text.intro}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/auth?mode=register')} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 24px ${accent}55` }}>
              Essayer gratuitement →
            </button>
            <button onClick={() => navigate('/#pricing')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Voir les tarifs
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section aria-label="Fonctionnalités" style={{ background: '#fff', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Ce que vous obtenez</span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
              Tout ce dont vous avez besoin,<br />généré en quelques secondes
            </h2>
          </div>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
            {text.features.map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 22px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 15, color: '#1E1E3A', lineHeight: 1.55, fontWeight: 500 }}>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section aria-label="Comment ça fonctionne" style={{ background: '#F5F5F7', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Simple & rapide</span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
              3 étapes, résultat en 60 secondes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: accent, color: '#fff', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F0F1A', margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUIDE ── */}
      <GuideSection guide={guide} accent={accent} />

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <section aria-label="Questions fréquentes" style={{ background: '#fff', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>FAQ</span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
                Questions fréquentes
              </h2>
            </div>
            <FAQAccordion faqs={faqs} />
          </div>
        </section>
      )}

      {/* ── RELATED TOOLS ── */}
      <RelatedSection slugs={relatedSlugs} accent={accent} />

      {/* ── FINAL CTA ── */}
      <section aria-label="Appel à l'action" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', padding: 'clamp(60px, 8vw, 96px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Prêt à gagner du temps ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 32px', lineHeight: 1.65 }}>
            Rejoignez +1 200 freelances qui utilisent Savvly pour générer leurs documents en quelques secondes.
          </p>
          <button onClick={() => navigate('/auth?mode=register')} style={{ background: '#fff', color: '#4F46E5', border: 'none', borderRadius: 12, padding: '15px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            Commencer gratuitement →
          </button>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>Premier mois à 15€ · Sans engagement</p>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
