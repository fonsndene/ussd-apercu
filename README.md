# Site web USSD — Université des Sciences de la Santé de Dakar

Site institutionnel statique. Aucune étape de build, aucune dépendance à installer :
les fichiers de ce dossier sont directement publiables.

## Lancer en local

```bash
cd site
python -m http.server 8777
# puis ouvrir http://127.0.0.1:8777
```

> Sur cette machine Windows, la commande est `python` (et non `python3`, qui tombe sur le
> raccourci du Microsoft Store).

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : hero, sélecteur « Je suis… », chiffres clés, parcours, gouvernance, formations, actualités |
| `formations.html` | Les deux cursus en détail, année par année, avec débouchés |
| `admissions.html` | Conditions, calendrier, frais, simulateur de coût, formulaire de pré-inscription, FAQ |
| `l-universite.html` | Gouvernance, corps enseignant, partenaires hospitaliers, campus, alumni |
| `actualites.html` | Agenda, à la une, lettre d'information, espace presse |
| `contact.html` | Contacts par service, adresse, formulaire contextuel |
| `portail.html` | Espace numérique : connexion, rails d'accès par profil, services, assistance |
| `mentions-legales.html` · `confidentialite.html` · `accessibilite.html` | Pages légales obligatoires |
| `assets/css/ussd.css` | Design system complet (tokens, composants, responsive, impression) |
| `assets/js/ussd.js` | Navigation mobile, onglets du parcours, simulateur, cookies, révélations au scroll |
| `robots.txt` · `sitemap.xml` | Référencement |

Les trois pages légales sont générées à partir d'un gabarit commun
(`gen_legal.py`, conservé hors du dépôt). Si vous les modifiez, éditez directement le HTML.

## Design system

Les tokens sont regroupés en tête de `assets/css/ussd.css`, dans `:root`.

| Token | Valeur | Usage |
|---|---|---|
| `--oxblood` | `#7B1418` | Couleur institutionnelle dominante, titres d'accent, bandeau d'appel |
| `--vermillon` | `#C1272D` | Liens |
| `--laurel` | `#14532A` | Structure secondaire, cycle Licence, encadrés positifs |
| `--ochre` | `#D98A1F` | Accent chaud sénégalais — **jamais en petit texte** (contraste insuffisant) |
| `--ink` | `#1A1512` | Texte, fonds profonds |
| `--mist` | `#F5F4F2` | Fond de section alternée |

Palette dérivée du blason : le rouge du caducée, le vert de la couronne de laurier.
Le bleu médical générique est volontairement absent, conformément au brief.

**Typographie** : Newsreader (titres, gravité éditoriale) + Inter (corps).
Deux familles seulement, pour tenir la cible de chargement en 3G/4G.

**Rayon de bordure** : 3 px. Registre institutionnel, pas d'arrondi « application ».

## Espace numérique (`portail.html`)

Les liens « Portail étudiant » pointaient vers `portail.ussd.sn`, un service externe.
Ils pointent désormais **tous** vers `portail.html`, page interne à la charte du site
(25 occurrences repointées dans 9 fichiers ; plus aucune référence à `portail.ussd.sn`).

Parti pris visuel : la zone d'accès restreint est posée sur fond `--ink`. Le passage du
site public à l'espace réservé se lit immédiatement, sans changer d'identité — mêmes
couleurs, mêmes polices, mêmes composants.

La page est en `noindex, follow` et **volontairement absente du `sitemap.xml`** :
une page de connexion n'a rien à faire dans les résultats de recherche.

**Le formulaire de connexion n'authentifie personne.** Il valide la saisie, vide le champ
mot de passe, puis renvoie vers la scolarité. Avant de le brancher :

- point d'authentification en HTTPS uniquement, jamais en clair ;
- deuxième facteur obligatoire, comme exigé au brief ;
- limitation du nombre de tentatives et verrouillage temporaire du compte ;
- session en cookie `HttpOnly` + `Secure` + `SameSite=Strict` ;
- message d'erreur identique que l'identifiant existe ou non, pour ne pas révéler
  quels comptes sont valides.

Si l'université dispose déjà d'un ENT à une autre adresse, il suffit de remplacer la valeur
de `href` dans les en-têtes et pieds de page, ou de faire de `portail.html` une page de
redirection.

## Zone hero — accroche + diaporama

Le diaporama occupe **toute la largeur de la zone hero**, et l'accroche est **posée
dessus** : surtitre, titre et deux boutons, sur un voile dégradé. Sous l'image, sur fond
clair, la barre de légende de l'étape en cours.

> Ce choix a été demandé explicitement. Il rapproche structurellement la page du hero de
> `ussd.sn` (photo pleine largeur + titre par-dessus). La différenciation tient au
> traitement : image encadrée sur la grille et non en plein écran, voile dégradé
> latéral plutôt qu'assombrissement uniforme, boutons droits et non en pilule, barre de
> légende numérotée sous l'image, pas de bouton vidéo. **Les deux photographies du hero
> de `ussd.sn` restent bannies du site.**

### Lisibilité du texte sur l'image — mesurée, pas estimée

Le voile (`.diapo__voile`) est un dégradé à 96° dont les opacités ont été **calculées**
et non réglées à l'œil. Un premier profil plus léger donnait 4,28:1 sur la slide 2, la
photographie de laboratoire étant très claire — sous le seuil AA.

| Slide | Pire pixel sous le texte | Ratio blanc / fond |
|---|---|---|
| 01 Arriver | `rgb(110,107,109)` | 5,3:1 |
| 02 Se former | `rgb(124,122,120)` | **5,1:1** (le cas limite) |
| 03 Devenir | `rgb(115,102,80)` | 5,6:1 |

WCAG AA exige 4,5:1 pour le texte normal et 3:1 pour le grand texte. Le profil retenu tient
**5,06:1 au pire pixel des trois images**.

**Si vous changez une photographie, refaites la mesure** : une image claire peut faire
passer le hero sous le seuil sans que cela se voie à l'œil. Le script de contrôle
échantillonne la zone de texte, compose le voile par-dessus et calcule le ratio WCAG.

### Les trois temps

| # | Fichier | Légende |
|---|---|---|
| 01 | `slide-1-*` | **Arriver** — Journée d'intégration : quinze nationalités réunies sur le campus de Point E. |
| 02 | `slide-2-*` | **Se former** — Laboratoires, travaux pratiques et stages hospitaliers dès les premières années. |
| 03 | `slide-3-*` | **Devenir** — Diplôme d'État de docteur en médecine ou en pharmacie, délivré par l'USSD. |

Chaque légende est composée en trois blocs : le numéro d'étape en ocre (police de titre),
le nom de l'étape en capitales espacées, puis la description. Le filet ocre à gauche est
le même que celui de toutes les autres légendes du site.

### Réglages

| Réglage | Valeur | Où |
|---|---|---|
| Durée par image | **4 s** | `DUREE` dans `assets/js/ussd.js`, et les deux `animation` à `4000ms` dans le CSS |
| Fondu | 600 ms | `.diapo__slide { transition }` |
| Dérive | `scale(1)` → `scale(1.035)` | `@keyframes derive` |
| Format | **16:9 obligatoire** | `.diapo__scene { aspect-ratio }` |
| Largeurs générées | 900 / 1400 / 1900 px | `srcset` de chaque slide |

Les trois durées doivent rester alignées : `DUREE` dans le JS, `@keyframes derive` et
`@keyframes remplir` dans le CSS. Si vous changez la vitesse, changez les trois.

**Pour changer une image** : produire les trois largeurs **au format 16:9**, sinon le fondu
fait sauter la hauteur du bloc. Puis mettre à jour le tableau `LEGENDES` dans le JS.
La slide 1 est préchargée (`<link rel="preload">` dans `index.html`) — si vous la
remplacez, corrigez aussi le préchargement.

### Conformité

- **WCAG 2.2.2** — bouton pause/lecture visible et persistant, obligatoire au-delà de 5 s
  de défilement automatique. Il change d'icône et de `aria-label`.
- **WCAG 2.1.1** — flèches ←/→, `Début`, `Fin` ; les six boutons sont atteignables au `Tab`.
- **ARIA APG « carrousel »** — `aria-roledescription` sur la zone et sur chaque diapositive,
  `aria-current` sur les repères. La zone d'images est en `aria-live="off"` pendant le
  défilement automatique et bascule en `"polite"` dès que l'utilisateur prend la main :
  sans cela, un lecteur d'écran serait interrompu toutes les quatre secondes.
- **Suspension** au survol, au focus clavier et quand l'onglet passe en arrière-plan.
- **`prefers-reduced-motion`** — aucun défilement automatique, aucune dérive.

## L'objet « Les deux cursus »

Objet graphique dessiné pour cette université, désormais placé **en tête de la section
« Le parcours »** (il occupait la zone hero avant que le diaporama ne s'y installe).
SVG inline dans `index.html`, styles sous `/* --- 6. Hero */` :

- deux arcs concentriques partant du **BAC**, en haut du cadran, origine commune ;
- **arc extérieur oxblood** = médecine, 8 segments, un par année ;
- **arc intérieur laurier** = pharmacie, 6 segments ;
- **dernier segment de chaque arc en ocre** = l'année de thèse ;
- la différence de longueur entre les deux arcs rend le 8 contre 6 visible sans le lire.

Animation : chaque segment se pose l'un après l'autre (78 ms d'écart, `--i` porte l'index),
le parcours se construit sous les yeux du visiteur. Sous `prefers-reduced-motion`, l'objet
s'affiche d'emblée. Tout est en CSS.

Pour modifier la géométrie : `PAS = 36°` par année, `JEU = 6°` entre deux années. Les
chemins d'arc sont calculés une fois pour toutes et écrits en dur dans le HTML.

## Élément signature

« Le parcours » — l'échelle année par année des deux cursus (`.ladder` / `.year`),
horizontale sur desktop, verticale sur mobile, avec les immersions professionnelles marquées.
Le hero l'annonce en abrégé ; cette section le déplie.

## Choix assumés

### Deux photographies bannies du site

La zone hero de `ussd.sn` repose sur deux photographies — le laboratoire aux microscopes
(`ussd-etudiante-1.jpg`, en fond) et le portail du campus avec la délégation
(`IMG-20250324-WA0089.jpg`). **Ni l'une ni l'autre ne doit apparaître sur ce site**, où que
ce soit : leur présence, même sur une page intérieure, recrée une ressemblance.
Les fichiers correspondants ont été supprimés du projet pour éviter toute reprise par
inadvertance. `presentation-ussd.jpg` montre la même scène que la seconde : à écarter aussi.

### L'annuaire du personnel

21 personnes publiées sur `l-universite.html`, en trois groupes : gouvernance (3),
corps enseignant (8), administration et scolarité (10). Noms et fonctions repris mot pour
mot de `ussd.sn/presentation-ussd` et `ussd.sn/corps-enseignant`.

**Trois points à faire trancher par l'université** — chacun porte un commentaire
`<!-- À CONFIRMER -->` dans le HTML :

1. **Oumar Ndir** — « Professeur » sur la page Mot du recteur, « Dr » sur Présentation.
2. **Awa Dia** — le fichier source dit « Diop », la page publiée dit « Diaw ».
3. **Pr Khadidiatou** — patronyme absent de toutes les pages.

Le portrait de **Pr Moustapha Sarr** est de qualité nettement inférieure aux autres
(image délavée, faible définition) : à remplacer si un meilleur cliché existe.

**Photographies : uniquement des images authentiques de l'USSD.** Elles proviennent du site
officiel `ussd.sn` (bibliothèque média WordPress), ont été redimensionnées et converties en
WebP dans `assets/img/photos/` et `assets/img/logos/`.

Le tri a été fait à la main. La bibliothèque de `ussd.sn` contient aussi les photos de
démonstration livrées avec le thème WordPress — `students-studying-outdoors`,
`arab-male-teacher-standing-near-empty-blackboard`, `western-michigan-university-in-kalamazoo`,
`hospital-of-the-holy-cross`… **Aucune n'a été reprise** : ce sont exactement les banques
d'images que le brief interdit, et deux d'entre elles montrent des établissements américains
et espagnols présentés comme s'ils étaient l'USSD.

Inventaire complet de la médiathèque (117 médias) : 27 photographies authentiques,
21 portraits nommés, 20 logos — et **38 images de banque** livrées avec le thème, toutes
écartées. Deux d'entre elles montrent une université du Michigan et un hôpital espagnol.

Ce qui a été retenu : journées d'intégration (drapeaux du Mali, de Côte d'Ivoire, de
République centrafricaine, de Mauritanie), laboratoires et microscopes, stage en officine,
salle de cours, cérémonie de remise des diplômes, marche Octobre Rose, campagne de santé
publique, bibliothèque, secrétariat, délégations académiques, portraits de l'équipe et de
deux diplômés, logos des accréditations et des structures partenaires.

**Avant mise en ligne, vérifier le droit à l'image.** Ces photographies montrent des personnes
identifiables, et 21 membres du personnel sont nommés. Toutes sont déjà publiées par
l'université sur son propre site, mais la reprise sur un nouveau support doit être validée
par le service communication. C'est un point bloquant.

**Rien d'inventé.** Tous les chiffres, tarifs, dates et coordonnées proviennent de
`presentation_ussd.docx`. Aucun taux de réussite, aucun témoignage, aucune accréditation
n'a été fabriqué. Les zones à documenter portent un encadré ocre visible ou un commentaire
`<!-- À COMPLÉTER -->` dans le HTML.

## Ce qui reste à faire avant la mise en ligne

### Bloquant — juridique

- [ ] Mentions légales : forme juridique, RCCM, NINEA, directeur de publication, hébergeur,
      référence de l'autorisation ministérielle. **Le site ne doit pas être publié sans ces mentions.**
- [ ] Accréditations : la frise datée de l'accueil (2016 autorisation d'ouverture, 2018
      habilitation médecine, 2023 habilitation pharmacie, 2024 accréditation nationale
      pharmacie, 2025 accréditation CAMES pharmacie, CAMES médecine en cours) reprend ce que
      publie `ussd.sn/accreditations`. **Faire confirmer chaque date et récupérer les numéros
      d'arrêté** avant publication — c'est l'information la plus scrutée par les familles.
- [ ] Déclaration du traitement de données auprès de la CDP, et report du numéro de récépissé
      dans `confidentialite.html`.

### Bloquant — technique

- [ ] **Brancher les formulaires.** Les quatre formulaires (pré-inscription, contact, newsletter,
      connexion au portail) valident côté client puis affichent un message expliquant qu'aucun
      back-end n'est connecté.
      Il faut un point de réception qui assure : stockage chiffré des pièces jointes,
      accusé de réception automatique, protection anti-spam (captcha invisible + limitation de débit),
      et journalisation.
- [ ] HTTPS forcé sur 100 % des pages, en-têtes de sécurité (HSTS, CSP, X-Content-Type-Options).
- [ ] Sauvegardes automatiques quotidiennes et procédure de restauration documentée.

### Contenu

- [ ] Photographies manquantes : **stage en milieu hospitalier** (aucune disponible sur
      `ussd.sn` — les images de laboratoire tiennent lieu de substitut), amphithéâtre,
      hébergement étudiant, et le **visuel de la zone hero**, laissé de côté sur votre demande.
- [ ] Vérifier si l'USSD ouvre une **filière chirurgie dentaire** : `ussd.sn` publie une page
      « Études en Chirurgie dentaire », alors que `presentation_ussd.docx` n'annonce que deux
      diplômes. Le site actuel s'en tient à deux — à trancher.
- [ ] Validation du détail année par année des deux cursus par la direction pédagogique.
- [ ] Mot du Président, gouvernance, organigramme.
- [ ] Annuaire du corps enseignant (fiches validées par chaque enseignant).
- [ ] Liste nominative des 15 hôpitaux partenaires, avec leur accord.
- [ ] Horaires d'ouverture du secrétariat.
- [ ] Rythme éditorial : une actualité par semaine — c'est le signal de vitalité le plus
      déterminant pour le référencement d'un site universitaire.

### Hors périmètre de cette livraison

Ces éléments du brief demandent une infrastructure serveur et n'existent pas ici :

- Espace Numérique de Travail (authentification forte, notes, emploi du temps) —
  un portail distinct existe déjà à `portail.ussd.sn`, vers lequel le site renvoie.
- CMS administrable par l'équipe communication.
- Moteur de recherche interne.
- Version anglaise.
- Chatbot.
- Visite virtuelle 360° du campus.

## Si vous passez à un CMS

La structure actuelle se transpose directement : chaque section de `index.html` correspond à
un bloc éditorial, et `assets/css/ussd.css` s'importe tel quel. Le brief recommande une stack
maintenue activement — Next.js avec un CMS headless, ou WordPress/Drupal en dernière version
stable. Dans tous les cas : jamais de version proche de sa fin de vie, mises à jour continues,
2FA sur tous les comptes d'administration.

## Performance

- Deux familles de polices, chargées avec `font-display: swap` et `preconnect`.
- CSS et JS uniques, sans framework ni dépendance externe.
- Aucun traceur, aucun script tiers.
- Avant mise en ligne : convertir les photographies en WebP/AVIF, ajouter `loading="lazy"`
  sur toute image sous la ligne de flottaison, activer la minification et un CDN.
