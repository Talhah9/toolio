import { useSearchParams, Link } from 'react-router-dom';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';

const CONTACT = 'talhahally974@gmail.com';
const UPDATED = '16 mai 2026';

function CGV() {
  return (
    <div className="legal-body">
      <h1>Conditions Générales de Vente</h1>
      <p className="legal-updated">Dernière mise à jour : {UPDATED}</p>

      <h2>1. Préambule</h2>
      <p>
        Les présentes Conditions Générales de Vente (« CGV ») régissent l'accès et l'utilisation du service
        Toolio, édité en tant que micro-entreprise soumise au régime français de la micro-entreprise,
        immatriculée en France (ci-après « Toolio », « nous »).
      </p>
      <p>
        Toute souscription à un abonnement ou tout achat de crédits sur la plateforme{' '}
        <strong>toolio.fr</strong> implique l'acceptation pleine et entière des présentes CGV.
      </p>

      <h2>2. Objet du service</h2>
      <p>
        Toolio est une plateforme SaaS (Software as a Service) fournissant des outils de génération de
        contenu assistée par intelligence artificielle, destinés aux freelances et indépendants. Les
        fonctionnalités incluent notamment : rédaction de contrats, devis, posts LinkedIn, audit de site
        web, génération d'images, et analyses stratégiques.
      </p>
      <p>
        Le service est fourni « en l'état ». Les contenus générés par l'IA sont indicatifs et doivent
        être vérifiés par l'utilisateur avant tout usage commercial ou juridique.
      </p>

      <h2>3. Prix et modalités de paiement</h2>
      <p>
        Toolio propose des abonnements mensuels (offre Free et offre Pro) ainsi que des packs de crédits
        achetables à l'unité. Les prix sont affichés en euros (€) toutes taxes comprises sur la page
        Tarifs.
      </p>
      <p>
        En tant que micro-entreprise, Toolio bénéficie de la franchise en base de TVA en vertu de
        l'article 293 B du Code général des impôts. <strong>TVA non applicable.</strong>
      </p>
      <p>
        Le paiement est effectué via la plateforme sécurisée <strong>Stripe</strong> (Stripe, Inc., certifié
        PCI DSS). Aucune donnée bancaire n'est stockée par Toolio. L'abonnement est débité à la date de
        souscription puis à chaque échéance mensuelle.
      </p>

      <h2>4. Droit de rétractation</h2>
      <p>
        Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un délai de{' '}
        <strong>14 jours calendaires</strong> à compter de la souscription pour exercer votre droit de
        rétractation, sans motif.
      </p>
      <p>
        Toutefois, conformément à l'article L.221-28 12° du Code de la consommation, en accédant
        immédiatement au service après la souscription, vous reconnaissez expressément renoncer à votre
        droit de rétractation pour la partie du service déjà exécutée. Les crédits consommés avant
        l'exercice de la rétractation ne sont pas remboursés.
      </p>
      <p>
        Pour exercer votre droit de rétractation, contactez-nous à{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> en précisant votre adresse email et la date de
        souscription.
      </p>

      <h2>5. Durée et résiliation</h2>
      <p>
        L'abonnement Pro est souscrit pour une durée d'un mois, renouvelé tacitement chaque mois. Vous
        pouvez résilier à tout moment depuis votre <strong>espace compte</strong> ou par email à{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
      <p>
        La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement
        au prorata n'est effectué pour la période restante. Les crédits non consommés sont perdus à
        la résiliation.
      </p>
      <p>
        En cas de résiliation, votre compte repasse automatiquement sur l'offre Free. Vos données et
        historique restent accessibles pendant 30 jours, puis sont supprimés.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        La plateforme Toolio, son code source, son design et ses marques sont la propriété exclusive
        de Toolio. Toute reproduction ou utilisation non autorisée est interdite.
      </p>
      <p>
        Les contenus générés par l'IA appartiennent à l'utilisateur qui les a commandés. Toolio ne
        revendique aucun droit sur les sorties produites.
      </p>

      <h2>7. Limitation de responsabilité</h2>
      <p>
        Les contenus générés par Toolio sont produits par des modèles d'intelligence artificielle et
        peuvent contenir des erreurs, imprécisions ou inexactitudes. Ils ne constituent pas des
        conseils juridiques, fiscaux ou professionnels. L'utilisateur est seul responsable de
        l'usage qu'il en fait.
      </p>
      <p>
        La responsabilité de Toolio est expressément limitée au montant des sommes versées par
        l'utilisateur au cours des trois (3) derniers mois précédant le litige.
      </p>
      <p>
        Toolio ne saurait être tenu responsable des interruptions de service, bugs ou pertes de
        données indépendants de sa volonté (force majeure, défaillance d'un prestataire tiers, etc.).
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est décrit dans notre{' '}
        <Link to="/legal?tab=privacy">Politique de Confidentialité</Link>, conforme au Règlement
        Général sur la Protection des Données (RGPD – Règlement UE 2016/679).
      </p>

      <h2>9. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de résolution
        amiable, les tribunaux français seront seuls compétents. La juridiction compétente est le{' '}
        <strong>Tribunal judiciaire de Paris</strong>.
      </p>
      <p>
        Conformément à l'article L.612-1 du Code de la consommation, tout consommateur peut recourir
        gratuitement à un médiateur de la consommation.
      </p>

      <h2>10. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGV :{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </div>
  );
}

function Privacy() {
  return (
    <div className="legal-body">
      <h1>Politique de Confidentialité</h1>
      <p className="legal-updated">Dernière mise à jour : {UPDATED}</p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement de vos données personnelles est Toolio, micro-entreprise
        établie en France. Contact : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes lors de votre utilisation du service :</p>
      <ul>
        <li><strong>Données d'identification</strong> : adresse email, prénom et nom (optionnels)</li>
        <li><strong>Données de paiement</strong> : gérées exclusivement par Stripe (tokenisées, jamais
        stockées par Toolio)</li>
        <li><strong>Données d'utilisation</strong> : historique des générations, crédits consommés,
        plan souscrit</li>
        <li><strong>Données techniques</strong> : adresse IP (logs serveur, conservation max. 30 jours),
        type de navigateur, pages visitées</li>
      </ul>
      <p>
        Nous ne collectons pas de données sensibles au sens de l'article 9 du RGPD.
      </p>

      <h2>3. Finalités et bases légales</h2>
      <table>
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Base légale (RGPD art. 6)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fourniture du service, gestion du compte</td>
            <td>Exécution du contrat (6.1.b)</td>
          </tr>
          <tr>
            <td>Traitement des paiements</td>
            <td>Exécution du contrat (6.1.b)</td>
          </tr>
          <tr>
            <td>Amélioration du service, statistiques agrégées</td>
            <td>Intérêt légitime (6.1.f)</td>
          </tr>
          <tr>
            <td>Conservation des factures et données comptables</td>
            <td>Obligation légale (6.1.c)</td>
          </tr>
          <tr>
            <td>Envoi d'emails transactionnels (confirmation, reçus)</td>
            <td>Exécution du contrat (6.1.b)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Hébergement et transferts</h2>
      <p>
        Vos données sont hébergées sur <strong>Supabase</strong> (West EU – Irlande, Union Européenne),
        conformément au RGPD. Supabase est soumis au RGPD en tant que sous-traitant (DPA disponible).
      </p>
      <p>
        Les paiements sont traités par <strong>Stripe</strong> (certifié PCI DSS niveau 1). Stripe peut
        transférer certaines données hors UE dans le cadre de ses opérations, sous couvert des clauses
        contractuelles types de la Commission européenne.
      </p>
      <p>
        <strong>Intelligence artificielle :</strong> les contenus que vous saisissez dans les formulaires
        outils sont transmis aux API d'Anthropic et/ou OpenAI pour génération. Aucune donnée personnelle
        identifiable (email, nom, coordonnées bancaires) n'est incluse dans ces requêtes. Les modèles
        d'IA ne sont pas entraînés sur vos données via notre usage de l'API.
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte</strong> : durée de la relation contractuelle + 3 ans après
        fermeture du compte (obligations comptables)</li>
        <li><strong>Historique des générations</strong> : durée de la relation contractuelle ; supprimé
        30 jours après fermeture du compte</li>
        <li><strong>Données de facturation</strong> : 10 ans (obligation légale française)</li>
        <li><strong>Logs serveur</strong> : 30 jours glissants</li>
      </ul>

      <h2>6. Vos droits RGPD</h2>
      <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
        <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
        <li><strong>Droit à l'effacement</strong> : demander la suppression de votre compte et de
        vos données (« droit à l'oubli »)</li>
        <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
        <li><strong>Droit d'opposition</strong> : vous opposer aux traitements fondés sur l'intérêt légitime</li>
        <li><strong>Droit de limitation</strong> : demander la limitation du traitement</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        Nous répondrons dans un délai de <strong>30 jours</strong>. En cas de réponse insatisfaisante,
        vous pouvez saisir la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des
        Libertés) — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Toolio utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
        du service (session d'authentification Supabase). Aucun cookie publicitaire, de suivi
        comportemental ou de réseaux sociaux n'est déposé.
      </p>
      <p>
        Ces cookies ne nécessitent pas votre consentement en vertu de l'article 5.3 de la directive
        ePrivacy, car ils sont essentiels au service.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
        vos données : chiffrement en transit (TLS 1.3), chiffrement au repos (Supabase), authentification
        sécurisée, accès restreint aux données de production.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. En cas de modification substantielle, vous serez
        informé par email. La poursuite de l'utilisation du service après notification vaut
        acceptation.
      </p>

      <h2>10. Contact</h2>
      <p>
        Responsable du traitement : Toolio — <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </div>
  );
}

export function Legal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'cgv';

  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div className="app">
      <MarketingNav />
      <main style={{ flex: 1 }}>
        <div className="container-narrow" style={{ paddingTop: 48, paddingBottom: 96 }}>
          <div className="auth-tabs legal-tabs" style={{ marginBottom: 32 }}>
            <button
              className={`auth-tab ${tab === 'cgv' ? 'active' : ''}`}
              onClick={() => setTab('cgv')}
            >
              Conditions Générales de Vente
            </button>
            <button
              className={`auth-tab ${tab === 'privacy' ? 'active' : ''}`}
              onClick={() => setTab('privacy')}
            >
              Politique de Confidentialité
            </button>
          </div>

          <div className="card card-pad">
            {tab === 'cgv' ? <CGV /> : <Privacy />}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
