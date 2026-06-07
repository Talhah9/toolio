// Replace {{KEY}} placeholders and handle {{IF_KEY}}...{{/IF_KEY}} conditionals
export function fillTemplate(template, vars) {
  let result = template.replace(/\{\{IF_(\w+)\}\}([\s\S]*?)\{\{\/IF_\1\}\}/g, (_, key, content) => {
    return vars[key] ? content : '';
  });
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

export const CGV_TEMPLATE = `# CONDITIONS GÉNÉRALES DE VENTE

**{{COMPANY_NAME}}** — {{LEGAL_TYPE}}
Dernière mise à jour : {{DATE}}

---

## Article 1 — Identification du prestataire

{{COMPANY_NAME}}, {{LEGAL_TYPE}}{{SIRET_LINE}}, dont le siège social est situé au {{ADDRESS}}, joignable à l'adresse électronique {{EMAIL}}{{WEBSITE_LINE}}.

{{VAT_LINE}}

## Article 2 — Champ d'application

Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l'ensemble des relations commerciales entre {{COMPANY_NAME}} et ses clients, pour toutes les prestations proposées. Toute commande implique l'acceptation pleine et entière des présentes CGV. Ces CGV prévalent sur tout document contraire émanant du client, sauf accord exprès et préalable de {{COMPANY_NAME}}.

{{COMPANY_NAME}} se réserve le droit de modifier les présentes CGV à tout moment ; les nouvelles conditions s'appliquent aux commandes passées après leur entrée en vigueur.

## Article 3 — Services proposés

{{COMPANY_NAME}} propose les prestations suivantes : {{ACTIVITY_DESC}}.

Les caractéristiques essentielles des services sont présentées dans les devis transmis aux clients{{WEBSITE_DESC}}. {{COMPANY_NAME}} se réserve le droit de modifier son offre à tout moment, sans que cela ne puisse donner lieu à indemnisation pour les clients pour les commandes non encore formées.

## Article 4 — Formation du contrat

La commande suit le processus suivant : (1) le client soumet sa demande ; (2) {{COMPANY_NAME}} établit un devis détaillé, valable 30 jours calendaires à compter de son émission ; (3) le contrat est formé à la réception par {{COMPANY_NAME}} du devis signé accompagné, le cas échéant, du paiement de l'acompte prévu à l'Article 6. Aucune prestation ne sera débutée avant la formation du contrat dans ces conditions.

{{IF_RETRACTATION}}
**Droit de rétractation (consommateurs) :** Conformément à l'article L.221-18 du Code de la consommation, le consommateur dispose d'un délai de quatorze (14) jours calendaires à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités. Ce droit ne s'applique pas lorsque l'exécution de la prestation a commencé avec l'accord exprès du consommateur avant l'expiration du délai de rétractation.

{{/IF_RETRACTATION}}
## Article 5 — Tarifs

Les prix des prestations sont ceux figurant dans le devis transmis au client, établis en euros. {{COMPANY_NAME}} se réserve le droit de modifier ses tarifs à tout moment ; les nouvelles grilles tarifaires s'appliquent uniquement aux devis émis postérieurement à leur entrée en vigueur.

{{VAT_MENTION}}

## Article 6 — Modalités de paiement

Un acompte de **{{DEPOSIT_PERCENT}}%** du montant total est exigible à la signature du devis et conditionne le démarrage des travaux. Le solde est exigible à la livraison, dans un délai maximal de **{{PAYMENT_DELAY}} jours** à compter de la date d'émission de la facture.

Les règlements peuvent être effectués par virement bancaire ou tout autre moyen convenu. Tout retard de paiement entraîne de plein droit, sans mise en demeure préalable, l'application de pénalités de retard au taux légal majoré de dix (10) points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de quarante (40) euros, conformément aux articles L.441-10 et L.441-11 du Code de commerce.

## Article 7 — Exécution des prestations

{{COMPANY_NAME}} s'engage à exécuter les prestations commandées avec le soin d'un professionnel compétent, dans les délais convenus au devis. Le client s'engage à collaborer activement en fournissant en temps utile tous les documents, accès et validations requis. Tout retard dû au client libère {{COMPANY_NAME}} de ses engagements de délai dans les mêmes proportions.

Constituent des cas de force majeure exonératoires de responsabilité tout événement imprévisible, irrésistible et extérieur aux parties (catastrophe naturelle, grève générale, interruption de réseau, décision gouvernementale). En cas de force majeure d'une durée supérieure à trente (30) jours, chaque partie pourra résilier le contrat sans indemnité.

## Article 8 — Propriété intellectuelle

Jusqu'au paiement intégral du prix convenu, {{COMPANY_NAME}} conserve l'intégralité des droits de propriété intellectuelle sur les créations et livrables produits. À réception du paiement complet, {{COMPANY_NAME}} cède au client les droits d'utilisation des livrables conformément aux conditions du devis ou de la lettre de mission.

Sauf stipulation contraire, la cession est limitée aux finalités de la commande. Toute reproduction, adaptation, revente ou exploitation commerciale sans accord préalable et écrit de {{COMPANY_NAME}} est interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle. {{COMPANY_NAME}} se réserve le droit de mentionner la réalisation des prestations à titre de référence commerciale, sauf opposition écrite du client.

## Article 9 — Responsabilité et garanties

La responsabilité de {{COMPANY_NAME}} est strictement limitée au montant hors taxe encaissé au titre de la prestation en cause. {{COMPANY_NAME}} ne saurait être tenu responsable de dommages indirects, immatériels, de pertes d'exploitation, de données ou de revenus subis par le client.

{{COMPANY_NAME}} ne peut être tenu responsable des conséquences résultant d'informations erronées ou incomplètes transmises par le client. Le client est seul responsable du respect des réglementations applicables à son secteur d'activité ainsi que de l'utilisation des livrables remis.

## Article 10 — Données personnelles

En tant que responsable du traitement, {{COMPANY_NAME}} collecte et traite les données personnelles du client (coordonnées, données de facturation) aux fins exclusives d'exécution des prestations, de gestion de la relation commerciale et de respect de ses obligations légales, sur la base de l'exécution d'un contrat (Art. 6(1)(b) RGPD) et des obligations légales (Art. 6(1)(c) RGPD).

Ces données sont conservées pendant la durée de la relation contractuelle augmentée des délais légaux de prescription applicables (cinq ans pour les données comptables). Elles ne sont pas transmises à des tiers sans accord préalable du client, sauf obligation légale.

Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, limitation, portabilité et opposition, à exercer par email à {{EMAIL}}. En cas de réclamation non résolue, vous pouvez saisir la CNIL (www.cnil.fr).

## Article 11 — {{CUSTOM_CLAUSE_TITLE}}

{{CUSTOM_CLAUSE_CONTENT}}

## Article 12 — Résiliation

En cas de manquement grave de l'une des parties à ses obligations non remédié dans les quinze (15) jours suivant mise en demeure par lettre recommandée avec accusé de réception, l'autre partie pourra résilier le contrat de plein droit.

En cas de résiliation à l'initiative du client sans faute de {{COMPANY_NAME}}, les prestations déjà réalisées seront facturées prorata temporis et l'acompte versé restera acquis à titre d'indemnité forfaitaire. En cas de résiliation à l'initiative de {{COMPANY_NAME}}, les sommes correspondant aux prestations non encore réalisées seront remboursées au client.

## Article 13 — Droit applicable et règlement des litiges

Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable dans un délai de trente (30) jours à compter de la notification du différend.

{{MEDIATION_CLAUSE}}

À défaut de résolution amiable, le litige sera porté devant les juridictions compétentes du ressort du siège social de {{COMPANY_NAME}}.

---`;

export const MENTIONS_TEMPLATE = `# MENTIONS LÉGALES

*Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)*

Dernière mise à jour : {{DATE}}

---

## 1. Éditeur du site

**{{COMPANY_NAME}}**
Forme juridique : {{LEGAL_TYPE}}
{{SIRET_BLOCK}}Siège social : {{ADDRESS}}
Email : {{EMAIL}}
{{WEBSITE_BLOCK}}
Directeur de la publication : {{DIRECTOR_NAME}}

## 2. Hébergeur

**{{HOSTING_PROVIDER}}**
{{HOSTING_ADDRESS}}

## 3. Activité

{{ACTIVITY_DESC}}

---

## 4. Propriété intellectuelle

L'ensemble du contenu de {{WEBSITE}} (textes, images, logos, graphismes, icônes, vidéos, structure) est la propriété exclusive de {{COMPANY_NAME}} et est protégé par le droit d'auteur, le droit des marques et plus généralement le droit de la propriété intellectuelle français et international.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation préalable et écrite de {{COMPANY_NAME}}.

La mise en place de liens hypertextes vers le site est autorisée sans accord préalable, sous réserve qu'ils ne soient pas utilisés à des fins commerciales ou publicitaires et ne portent pas atteinte à l'image de {{COMPANY_NAME}}.

## 5. Limitation de responsabilité

{{COMPANY_NAME}} s'efforce d'assurer l'exactitude des informations diffusées sur son site, mais se réserve le droit de corriger son contenu à tout moment et sans préavis. La responsabilité de {{COMPANY_NAME}} ne saurait être engagée pour tout dommage direct ou indirect résultant de l'utilisation du site ou de l'impossibilité d'y accéder.

{{COMPANY_NAME}} ne peut être tenu responsable du contenu de sites tiers vers lesquels des liens renvoient depuis son site.

## 6. Données personnelles

Le traitement des données personnelles des utilisateurs est effectué conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. Pour toute question relative au traitement de vos données personnelles, contactez {{EMAIL}}. Pour plus d'informations, consultez notre Politique de Confidentialité disponible sur le site.

## 7. Cookies

Le site peut utiliser des cookies techniques nécessaires à son bon fonctionnement. Ces cookies ne collectent pas de données personnelles à des fins commerciales. Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies, ce qui peut affecter le bon fonctionnement de certaines fonctionnalités.

## 8. Loi applicable et juridiction

Les présentes mentions légales sont régies par le droit français. Tout litige relatif au site et à son utilisation sera soumis à la compétence exclusive des tribunaux français.

---`;

export const PRIVACY_TEMPLATE = `# POLITIQUE DE CONFIDENTIALITÉ

**{{COMPANY_NAME}}** — Protection de vos données personnelles (RGPD)
Dernière mise à jour : {{DATE}}

---

## 1. Responsable du traitement

**{{COMPANY_NAME}}** — {{LEGAL_TYPE}}
{{ADDRESS}}
Email : {{EMAIL}}
{{WEBSITE_BLOCK}}

En tant que responsable du traitement, {{COMPANY_NAME}} s'engage à protéger vos données personnelles conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés modifiée.

---

## 2. Données collectées

Dans le cadre de ses activités ({{ACTIVITY_DESC}}), {{COMPANY_NAME}} peut être amenée à collecter les données suivantes :

- **Données d'identification** : nom, prénom, raison sociale
- **Données de contact** : adresse email, numéro de téléphone, adresse postale
- **Données de navigation** : adresse IP, cookies, pages visitées, durée des visites
- **Données de facturation** : coordonnées bancaires (transmises via un prestataire de paiement sécurisé)
- **Données de communication** : contenu des échanges par email ou formulaire de contact

---

## 3. Finalités et bases légales

| Finalité | Base légale RGPD | Données concernées |
|---|---|---|
| Exécution des prestations | Art. 6(1)(b) — Contrat | Coordonnées, facturation |
| Gestion de la relation commerciale | Art. 6(1)(b) — Contrat | Coordonnées, historique |
| Communications commerciales | Art. 6(1)(a) — Consentement | Email, préférences |
| Obligations légales et comptables | Art. 6(1)(c) — Obligation légale | Données de facturation |
| Amélioration du site et des services | Art. 6(1)(f) — Intérêt légitime | Données de navigation |

---

## 4. Durées de conservation

- **Données clients actifs** : durée de la relation commerciale
- **Données post-relation** : 3 ans (prospection), 5 ans (documents comptables — obligation légale)
- **Données de navigation** : 13 mois maximum (recommandations CNIL)
- **Échanges** : 3 ans à compter du dernier contact

Au-delà de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.

---

## 5. Vos droits

Conformément au RGPD, vous disposez des droits suivants :

- **Droit d'accès** (Art. 15) : obtenir confirmation du traitement et une copie de vos données
- **Droit de rectification** (Art. 16) : corriger des données inexactes ou incomplètes
- **Droit à l'effacement** (Art. 17) : demander la suppression de vos données (« droit à l'oubli »)
- **Droit à la limitation** (Art. 18) : restreindre temporairement l'utilisation de vos données
- **Droit à la portabilité** (Art. 20) : recevoir vos données dans un format structuré et lisible
- **Droit d'opposition** (Art. 21) : vous opposer au traitement, notamment à la prospection

**Pour exercer vos droits :** adressez votre demande à {{EMAIL}} en précisant votre identité. Nous répondrons dans un délai de trente (30) jours.

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la **CNIL** : www.cnil.fr — 3 Place de Fontenoy, 75007 Paris.

---

## 6. Cookies et traceurs

Le site utilise des cookies pour assurer son bon fonctionnement et améliorer l'expérience utilisateur.

| Type | Finalité | Durée |
|---|---|---|
| Cookies techniques | Fonctionnement du site (session, authentification) | Session |
| Cookies analytiques | Mesure d'audience et amélioration du service | 13 mois |
| Cookies marketing | Personnalisation des contenus | 6 mois |

Vous pouvez à tout moment paramétrer votre navigateur pour refuser ou supprimer les cookies. Cette action peut affecter certaines fonctionnalités du site.

---

## 7. Partage et transferts de données

Vos données ne sont pas vendues à des tiers. {{COMPANY_NAME}} peut faire appel à des sous-traitants (hébergement, paiement, emailing) qui agissent exclusivement sur instruction et ne peuvent utiliser vos données à d'autres fins. Aucun transfert hors Union Européenne n'est effectué sans garanties appropriées (décisions d'adéquation ou clauses contractuelles types).

---

## 8. Sécurité des données

{{COMPANY_NAME}} met en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement TLS/HTTPS, contrôle d'accès strict, sauvegardes régulières. En cas de violation susceptible d'engendrer un risque élevé pour vos droits, nous vous en informerons dans les meilleurs délais.

---

## 9. Modifications de cette politique

{{COMPANY_NAME}} se réserve le droit de modifier cette politique à tout moment. Toute modification significative vous sera communiquée par email ou par notification sur le site. La version en vigueur est celle publiée sur le site à la date de votre consultation.

---

## 10. Contact

**{{COMPANY_NAME}}**
{{ADDRESS}}
Email : {{EMAIL}}

---`;

export const CONTRAT_TEMPLATE = `# CONTRAT DE PRESTATION DE SERVICES

---

**Entre les soussignés :**

**LE PRESTATAIRE**
{{PREST_NAME}}{{PREST_COMPANY_LINE}}
{{PREST_ADDRESS}}
Email : {{PREST_EMAIL}}
{{PREST_SIRET_LINE}}

**ET**

**LE CLIENT**
{{CLIENT_NAME}}{{CLIENT_COMPANY_LINE}}
{{CLIENT_ADDRESS_LINE}}

Ci-après désignés ensemble « les Parties » et individuellement « la Partie ».

---

## Article 1 — Objet du contrat

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire réalise pour le compte du Client la prestation suivante :

{{MISSION_DESC}}

## Article 2 — Durée et calendrier

Le présent contrat prend effet à compter du **{{START_DATE}}** et s'exécute sur une durée de **{{DURATION}} {{DURATION_UNIT}}**.

Les étapes clés et jalons de validation seront précisés dans le planning détaillé communiqué au démarrage de la mission. Tout retard imputable au Client dans la fourniture des éléments nécessaires entraîne un report équivalent du délai de livraison.

## Article 3 — Livrables

Le Prestataire s'engage à livrer les éléments suivants :

{{DELIVERABLES_BLOCK}}

Toute prestation supplémentaire non mentionnée ci-dessus fera l'objet d'un avenant signé par les deux Parties avant exécution.

## Article 4 — Rémunération

La rémunération du Prestataire est fixée à :

**{{RATE_DISPLAY}}**

{{VAT_MENTION}}

## Article 5 — Modalités de paiement

Un acompte de **{{DEPOSIT_PERCENT}}%** du montant total est versé à la signature du présent contrat et conditionne le démarrage des travaux. Le solde (**{{BALANCE_PERCENT}}%**) est exigible à la livraison finale et acceptation des livrables par le Client.

Les factures sont payables par virement bancaire dans un délai de **30 jours** à compter de leur émission. Tout retard de paiement entraîne de plein droit l'application de pénalités au taux légal majoré de dix (10) points, ainsi qu'une indemnité forfaitaire de quarante (40) euros pour frais de recouvrement.

## Article 6 — Révisions et modifications

Le présent contrat inclut **{{REVISIONS}} round(s) de révisions** par livrable, correspondant à un ensemble consolidé de retours transmis en une seule fois. Tout round supplémentaire sera facturé au tarif horaire en vigueur du Prestataire.

Toute modification substantielle du périmètre de la mission devra faire l'objet d'un avenant écrit signé par les deux Parties, avec ajustement de la rémunération si nécessaire.

## Article 7 — Propriété intellectuelle

Jusqu'au paiement intégral de la rémunération convenue, le Prestataire conserve la pleine propriété intellectuelle sur l'ensemble des créations et livrables produits. À réception du paiement complet, le Prestataire cède au Client les droits d'exploitation des livrables pour les usages définis dans le présent contrat.

Le Prestataire se réserve le droit de mentionner la réalisation de cette mission dans ses références commerciales, sauf opposition écrite du Client dans un délai de 30 jours après livraison.

## Article 8 — Confidentialité

Chaque Partie s'engage à garder strictement confidentiels tous les documents, informations et données de l'autre Partie dont elle aurait eu connaissance dans le cadre du présent contrat, pendant toute la durée du contrat et pour une période de **cinq (5) ans** après son terme.

Cette obligation ne s'applique pas aux informations tombées dans le domaine public sans faute de la Partie concernée, ni à celles que cette Partie aurait reçues légitimement d'un tiers.

## Article 9 — Responsabilité

La responsabilité du Prestataire est limitée au montant hors taxe encaissé au titre du présent contrat. Le Prestataire ne saurait être tenu responsable de dommages indirects, immatériels, pertes d'exploitation ou manques à gagner subis par le Client.

Le Client est seul responsable du respect des réglementations applicables à son secteur d'activité et de l'utilisation des livrables.

## Article 10 — Résiliation

Chacune des Parties peut résilier le présent contrat en cas de manquement grave de l'autre Partie non remédié dans les quinze (15) jours suivant mise en demeure par lettre recommandée avec accusé de réception.

En cas de résiliation à l'initiative du Client sans faute du Prestataire, les prestations déjà réalisées seront facturées prorata temporis et l'acompte versé restera acquis au Prestataire à titre d'indemnité forfaitaire.

## Article 11 — Indépendance des Parties

Le présent contrat est conclu entre deux parties indépendantes. Le Prestataire exerce son activité en toute autonomie et demeure seul responsable des décisions prises dans le cadre de la réalisation des prestations. Aucun lien de subordination n'est établi entre les Parties ; le présent contrat ne peut être assimilé à un contrat de travail.

## Article 12 — Droit applicable et règlement des litiges

Le présent contrat est soumis au droit français. En cas de litige, les Parties s'engagent à rechercher une solution amiable avant tout recours judiciaire, dans un délai de trente (30) jours. À défaut, le litige sera porté devant les juridictions compétentes du lieu du siège social du Prestataire.

---

**Fait en deux exemplaires originaux, le {{DATE}}.**

| LE PRESTATAIRE | LE CLIENT |
|---|---|
| {{PREST_NAME}} | {{CLIENT_NAME}} |
| | |
| Signature : | Signature : |
| *Lu et approuvé* | *Lu et approuvé* |

---`;
