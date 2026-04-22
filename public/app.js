// ══════════════════════════════════════════════════════════════════════════════
// PAGE_DESCRIPTIONS — textes par défaut des bandeaux de chaque page.
// L'utilisateur peut surcharger ces valeurs depuis la vue Paramètres ; les
// overrides sont stockés dans localStorage (clé : "charchives_pageDescriptions")
// et surchargent les défauts via pageDesc(key).
// ══════════════════════════════════════════════════════════════════════════════
const PAGE_DESCRIPTIONS_DEFAULTS = {
  inventaire:    'Exploration des gisements et du patrimoine archivé.',
  derive:        'Navigation cinétique et exploration des liens entre les objets.',
  nuee:          'Les objets dérivent en apesanteur. Survolez pour les accélérer.',
  constellation: 'Vos objets reliés par leurs intentions, matières ou identités.',
  triptyque:     'Sélection et composition de trois objets en regard.',
  diorama:       'Mise en scène d\'objets dans des intérieurs d\'archives.',
  parametres:    'Gérez vos catégories, typologies et duotones.',
};
// Proxy rétrocompat : PAGE_DESCRIPTIONS.xxx retourne l'override utilisateur si défini
const PAGE_DESCRIPTIONS = new Proxy({}, {
  get(_, key) { return pageDesc(key); }
});
function pageDesc(key) {
  const overrides = _loadPageDescOverrides();
  // Si l'utilisateur a posé un override (même vide), on le respecte strictement.
  // Seule absence de clé = fallback sur le défaut.
  if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key] || '';
  return PAGE_DESCRIPTIONS_DEFAULTS[key] || '';
}
function _loadPageDescOverrides() {
  try { return JSON.parse(localStorage.getItem('charchives_pageDescriptions') || '{}'); }
  catch(e) { return {}; }
}
function _savePageDescOverrides(overrides) {
  try { localStorage.setItem('charchives_pageDescriptions', JSON.stringify(overrides)); }
  catch(e) { /* ignore */ }
}
function updatePageDescription(key, newText) {
  const overrides = _loadPageDescOverrides();
  // Garde toujours la valeur saisie (même vide = description masquée explicite)
  overrides[key] = (newText || '').trim();
  _savePageDescOverrides(overrides);
  _refreshAllSectionHeaders();
}
function resetPageDescription(key) {
  const overrides = _loadPageDescOverrides();
  delete overrides[key];   // retire l'override → fallback sur le défaut
  _savePageDescOverrides(overrides);
  _refreshAllSectionHeaders();
}
function _refreshAllSectionHeaders() {
  const invDesc  = document.getElementById('inventaireDesc');
  const derDesc  = document.getElementById('deriveDesc');
  const triDesc  = document.getElementById('triosDesc');
  const dioDesc  = document.getElementById('dioramaDesc');
  if (invDesc) invDesc.textContent = pageDesc('inventaire');
  if (derDesc) derDesc.textContent = pageDesc(state.deriveMode === 'reseau' ? 'constellation' : 'nuee');
  if (triDesc) triDesc.textContent = pageDesc('triptyque');
  if (dioDesc) dioDesc.textContent = pageDesc('diorama');
}

// ── Static attribute definitions ──────────────────────────────────────────────
const ATTRIBUTES_DEF = {
  matieres: {
    label: 'Matières',
    options: [
      // Céramiques & verre
      'porcelaine','faïence','céramique','barbotine','majolique','émaux de Longwy',
      'verre','verre soufflé','cristal','cristal taillé','opaline',
      // Bois & végétal
      'bois','bois doré','loupe d\'orme','osier','rotin',
      // Métaux
      'métal','laiton','bronze','étain','argent','vermeil',
      // Minéraux & naturel
      'marbre','pierre','coquillage',
      // Textiles & papier
      'textile','cuir','papier'
    ],
    families: [
      { label: null, items: ['porcelaine','faïence','céramique','barbotine','majolique','émaux de Longwy'] },
      { label: null, items: ['verre','verre soufflé','cristal','cristal taillé','opaline'] },
      { label: null, items: ['bois','bois doré','loupe d\'orme','osier','rotin'] },
      { label: null, items: ['métal','laiton','bronze','étain','argent','vermeil'] },
      { label: null, items: ['marbre','pierre','coquillage'] },
      { label: null, items: ['textile','cuir','papier'] }
    ]
  },
  origine: {
    label: 'Identité',
    options: [
      'Moyen Âge','Renaissance','XVIIe siècle','XVIIIe siècle','XIXe siècle',
      'Empire','Napoléon III','Belle Époque','Art nouveau','Art déco','Bauhaus',
      'Mid-century','Années 50','Années 60','Années 70','Années 80','Contemporain',
      'gothique','baroque','rocaille','troubadour','romantique',
      'art populaire','naïf','minimaliste','géométrique','organique'
    ]
  },
  motifs: {
    label: 'Motifs',
    options: [] // chargé depuis settings.motifs
  },
  usage: {
    label: 'Fonctions & Usages',
    options: ['décoratif','décor de table','rangement','contenant','mural','vitrine','rituel','service']
  },
  etat_traces: {
    label: 'États',
    options: [
      'patiné','usé','fissuré','restauré','fragment','incomplet','dans son jus','ancien','neuf','rare','unique','signé'
    ]
  },
  role: {
    label: 'Rôle & Symbole',
    options: [
      'rituel','offrande','souvenir','transmission','contemplation',
      'accumulation','protection','symbole','mémoire','médiation',
      'deuil','célébration','talisman','héritage'
    ]
  },
  couleurs: { label: 'Teintes', options: [] }, // loaded from settings
  taille: {
    label: 'Taille',
    options: ['Miniature (<5cm)','Très petit (5-15cm)','Petit (15-30cm)',
      'Moyen (30-60cm)','Grand (60-100cm)','Très grand (>100cm)'],
    single: true
  }
};

// Format groupé par défaut pour Matières
const MATIERES_GROUPS_DEFAULT = [
  { famille: 'Céramiques & Verre',  tags: ['porcelaine','faïence','céramique','barbotine','majolique','émaux de Longwy','verre','verre soufflé','cristal','cristal taillé','opaline'] },
  { famille: 'Bois & Végétal',      tags: ['bois','bois doré',"loupe d'orme",'osier','rotin'] },
  { famille: 'Métaux',              tags: ['métal','laiton','bronze','étain','argent','vermeil'] },
  { famille: 'Minéraux & Naturel',  tags: ['marbre','pierre','coquillage'] },
  { famille: 'Textiles & Papier',   tags: ['textile','cuir','papier'] }
];
const MOTIFS_GROUPS_DEFAULT = [
  { famille: 'Botanique',    tags: ['floral','feuillage','végétal','herbier'] },
  { famille: 'Figuratif',    tags: ['portrait','scène de genre','paysage','animalier'] },
  { famille: 'Géométrique',  tags: ['rayures','damier','losange','chevron','treillis'] },
  { famille: 'Ornements',    tags: ['arabesque','rinceaux','cartouche','médaillon','rocaille'] }
];

// Détection format groupé vs flat
function isGrouped(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr[0] !== null && typeof arr[0] === 'object' && 'famille' in arr[0];
}
// Aplatir un tableau groupé en tableau de strings
function flattenGroups(arr) {
  return isGrouped(arr) ? arr.flatMap(g => g.tags || []) : (arr || []);
}
// Convertir [{famille, tags}] → [{label, items}] pour ATTRIBUTES_DEF.families
function toAttrFamilies(groups) {
  return groups.map(g => ({ label: g.famille, items: g.tags || [] }));
}

const COLOR_MAP = {
  'transparent': 'rgba(200,200,200,0.15)',
  'blanc': '#ffffff', 'écru': '#f5f0e8', 'beige': '#d4bc94',
  'doré': '#c9a227', 'argenté': '#b0b8c1', 'noir': '#1a1917',
  'bleu': '#3b6fd4', 'vert': '#2d7d46', 'rouge': '#c0392b',
  'rose': '#e88fa0', 'violet': '#7b4ea8', 'jaune': '#d4a017',
  'orange': '#d4621a', 'brun': '#7c5c3b', 'gris': '#9ca3af',
  'turquoise': '#0ea5a0', 'bordeaux': '#7c1d2b', 'marine': '#1a3a5c',
  'kaki': '#6b7c4e', 'ivoire': '#f8f4eb'
};

const DARK_COLORS = new Set(['noir','bleu','vert','rouge','violet','brun','marine','bordeaux']);

const EMOTION_OPTIONS = ['poétique','mélancolie','nostalgie','étrange','mystérieux',
  'fragile','précieux','désuet','silencieux','intime','chargé'];

const STATUS_COLORS = {
  'Disponible':   '#22c55e',
  'Vendu':        '#9ca3af',
  'Pas à vendre': '#7c3aed',
  'Brouillon':    '#d1d5db',
};

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const CAL_MIN_YEAR = 2025;
const CAL_MIN_MONTH = 0; // janvier

// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  collections: [],
  keywords:    [],
  settings:    {},
  view: 'grid',
  sortBy: 'chrono-desc',
  categoryFilter: '',
  statusFilter: '',
  bookmarkFilter: false,
  activeKeywordFilters: new Set(),
  detailList: [],
  detailCurrentId: null,
  calendarYears: [],
  calendarActiveCategories: new Set(),
  cardPhotoIdx: new Map(),
  // edit state
  editId: null,
  editPhotos: [],
  editPrivatePhotos: [],
  editKeywords: [],
  editAttributes: {},
  editUnivers: [],
  editSubcategories: [],
  dpYear: new Date().getFullYear(),
  dpSelectedDate: '',
  typoFilter: '',          // filtre primaire par Typologie (barre Typologies)
  attrFilters: { subcat: [], matieres: [], origine: [], etat_traces: [], couleurs: [] },
  calDateType: 'dateAchat',
  calYear: 2025,
  calMonth: 0,
  dpAchatYear: new Date().getFullYear(),
  dpAchatSelectedDate: '',
  darkMode: false,
  tlMode: 'chrono',     // 'chrono' | 'origine'
  // settings edit
  settingsDraft: null,
  // Are.na
  expositions: [],
  editExpositions: [],
  breadcrumb: [],      // [{label, action}]
  activeExpoFilter: null,
  _formType: 'item',
  editFragmentBg: '#1a1a1a',
  deriveMode: 'nuee',   // 'nuee' | 'reseau'
  galleryShuffled: false,
  _shuffleOrder: null,  // tableau d'ids mélangés
  gravityMode: false,   // true quand un verbe est actif → canvas orbital
  // Diorama — canvas interactif (collage façon "Les Sims")
  diorama: { backdrop: '', items: [], nextZ: 1 },
};

// ══ THÉSAURUS SÉMANTIQUE — dictionnaire de synonymes / alias ════════════════
// Clé = terme tapé par l'utilisateur (minuscules)
// Valeur = nom exact de la typologie ou de la catégorie à rechercher
const SEARCH_THESAURUS = {
  // ── Thé & Café ──
  'tasse':'Thé & Café','mug':'Thé & Café','théière':'Thé & Café','thé':'Thé & Café',
  'cafetière':'Thé & Café','café':'Thé & Café','expresso':'Thé & Café','bol':'Thé & Café',
  'tasse à thé':'Thé & Café','tasse à café':'Thé & Café','sous-tasse':'Thé & Café',
  'cappuccino':'Thé & Café','infusion':'Thé & Café','tisane':'Thé & Café',
  // ── Assiettes & Plats ──
  'assiette':'Assiettes & Plats','plat':'Assiettes & Plats','faïence':'Assiettes & Plats',
  'service':'Assiettes & Plats','assiette creuse':'Assiettes & Plats',
  'assiette plate':'Assiettes & Plats','terrine':'Assiettes & Plats','soupière':'Assiettes & Plats',
  'saladier':'Assiettes & Plats','bol salade':'Assiettes & Plats',
  // ── Couverts ──
  'couvert':'Couverts','fourchette':'Couverts','couteau':'Couverts',
  'cuillère':'Couverts','cuiller':'Couverts','argenterie':'Couverts',
  'louche':'Couverts','spatule':'Couverts','pince':'Couverts',
  // ── Verres ──
  'verre':'Verres','carafe':'Verres','flûte':'Verres','gobelet':'Verres',
  'pichet':'Verres','cruche':'Verres','décanteur':'Verres','carafon':'Verres',
  'shot':'Verres','verre à vin':'Verres','verre à eau':'Verres',
  // ── Plateaux ──
  'plateau':'Plateaux','plateau de service':'Plateaux','plateau décoratif':'Plateaux',
  // ── Autour de la table ──
  'nappe':'Autour de la table','serviette':'Autour de la table','set':'Autour de la table',
  'set de table':'Autour de la table','chemin de table':'Autour de la table',
  'rond de serviette':'Autour de la table','sous-verre':'Autour de la table',
  // ── Art de la table (terme parent) ──
  'art de la table':'Art de la table','table':'Art de la table',
  'vaisselle':'Art de la table','dîner':'Art de la table','repas':'Art de la table',
  // ── Bougeoirs & Chandeliers ──
  'bougeoir':'Bougeoirs & Chandeliers','chandelier':'Bougeoirs & Chandeliers',
  'candélabre':'Bougeoirs & Chandeliers','chandelle':'Bougeoirs & Chandeliers',
  'photophore':'Bougeoirs & Chandeliers','porte-bougie':'Bougeoirs & Chandeliers',
  // ── Bougies ──
  'bougie':'Bougies','cierge':'Bougies','bougie parfumée':'Bougies',
  // ── Lampes ──
  'lampe':'Lampes','luminaire':'Lampes','abat-jour':'Lampes','lumière':'Lampes',
  'suspension':'Lampes','applique':'Lampes','lampe de chevet':'Lampes',
  // ── Vases ──
  'vase':'Vases','soliflore':'Vases','potiche':'Vases','amphore':'Vases',
  'urne':'Vases','cache-pot':'Vases','jardinière':'Vases',
  // ── Sculptures & Figurines ──
  'sculpture':'Sculptures & Figurines','figurine':'Sculptures & Figurines',
  'statuette':'Sculptures & Figurines','statue':'Sculptures & Figurines',
  'buste':'Sculptures & Figurines','tête':'Sculptures & Figurines',
  'bronze':'Sculptures & Figurines','céramique':'Sculptures & Figurines',
  // ── Objets muraux ──
  'tableau':'Objets muraux','miroir':'Objets muraux','affiche':'Objets muraux',
  'gravure':'Objets muraux','estampe':'Objets muraux','photo':'Objets muraux',
  'photographie':'Objets muraux','plaque':'Objets muraux',
  // ── Tapisseries & Coussins ──
  'tapisserie':'Tapisseries & Coussins','coussin':'Tapisseries & Coussins',
  'tissu':'Tapisseries & Coussins','broderie':'Tapisseries & Coussins',
  'textile':'Tapisseries & Coussins','jeté':'Tapisseries & Coussins',
  'plaid':'Tapisseries & Coussins','housse':'Tapisseries & Coussins',
  // ── Boîtes & Coffrets ──
  'boîte':'Boîtes & coffrets','boite':'Boîtes & coffrets','coffret':'Boîtes & coffrets',
  'étui':'Boîtes & coffrets','cassette':'Boîtes & coffrets','trousse':'Boîtes & coffrets',
  'nécessaire':'Boîtes & coffrets',
  // ── Bonbonnières & Bocaux ──
  'bocal':'Bonbonnières & Bocaux','bonbonnière':'Bonbonnières & Bocaux',
  'pot':'Bonbonnières & Bocaux','jarre':'Bonbonnières & Bocaux',
  'boîte à sucre':'Bonbonnières & Bocaux','boîte à thé':'Bonbonnières & Bocaux',
  // ── Flacons ──
  'flacon':'Flacons','bouteille':'Flacons','fiole':'Flacons','parfum':'Flacons',
  'vaporisateur':'Flacons','atomiseur':'Flacons','ampoule':'Flacons',
  // ── Rangements ──
  'rangement':'Rangements','panier':'Rangements','corbeille':'Rangements',
  'tiroir':'Rangements','organisateur':'Rangements','vide-poche':'Rangements',
  // ── Bijoux ──
  'bijou':'Bijoux','collier':'Bijoux','bracelet':'Bijoux','bague':'Bijoux',
  'anneau':'Bijoux','pendentif':'Bijoux','boucle':'Bijoux','médaille':'Bijoux',
  'broche':'Bijoux','épingle':'Bijoux','barrette':'Bijoux','chaîne':'Bijoux',
  // ── Foulards ──
  'foulard':'Foulards','écharpe':'Foulards','châle':'Foulards','soie':'Foulards',
  'bandana':'Foulards','carré':'Foulards',
  // ── Accessoires ──
  'accessoire':'Accessoires','sac':'Accessoires','pochette':'Accessoires','ceinture':'Accessoires',
  'porte-monnaie':'Accessoires','gant':'Accessoires','chapeau':'Accessoires',
  // ── Livres ──
  'livre':'Livres','roman':'Livres','ouvrage':'Livres','encyclopédie':'Livres',
  'catalogue':'Livres','atlas':'Livres','dictionnaire':'Livres',
  'livre d\'art':'Livres','beau livre':'Livres',
  // ── Revues & Cartes postales ──
  'revue':'Revues & Cartes postales','magazine':'Revues & Cartes postales',
  'carte postale':'Revues & Cartes postales','carte':'Revues & Cartes postales',
  'journal':'Revues & Cartes postales','presse':'Revues & Cartes postales',
  // ── Cadres ──
  'cadre':'Cadres','encadrement':'Cadres','cadre photo':'Cadres',
  // ── Beaux arts & Arts graphiques ──
  'peinture':'Beaux arts & Arts graphiques','dessin':'Beaux arts & Arts graphiques',
  'lithographie':'Beaux arts & Arts graphiques','sérigraphie':'Beaux arts & Arts graphiques',
  'art':'Beaux arts & Arts graphiques','aquarelle':'Beaux arts & Arts graphiques',
  'huile':'Beaux arts & Arts graphiques','impression':'Beaux arts & Arts graphiques',
  // ── Minéraux & Fossiles ──
  'fossile':'Minéraux & Fossiles','minéral':'Minéraux & Fossiles','mineral':'Minéraux & Fossiles',
  'cristal':'Minéraux & Fossiles','pierre':'Minéraux & Fossiles','roche':'Minéraux & Fossiles',
  'caillou':'Minéraux & Fossiles','coquillage':'Minéraux & Fossiles','géode':'Minéraux & Fossiles',
  'ammonite':'Minéraux & Fossiles','silex':'Minéraux & Fossiles',
  // ── Objets scientifiques ──
  'instrument':'Objets scientifiques','loupe':'Objets scientifiques','compas':'Objets scientifiques',
  'mesure':'Objets scientifiques','scientifique':'Objets scientifiques',
  'thermomètre':'Objets scientifiques','baromètre':'Objets scientifiques',
  'balance':'Objets scientifiques','sablier':'Objets scientifiques',
  // ── Outils anciens ──
  'outil':'Outils anciens','clé':'Outils anciens','clef':'Outils anciens',
  'serrure':'Outils anciens','ancien':'Outils anciens','verrou':'Outils anciens',
  'cadenas':'Outils anciens','marteau':'Outils anciens',
  // ── Curiosités & Fragments ──
  'curiosité':'Curiosités & Fragments','fragment':'Curiosités & Fragments',
  'bizarre':'Curiosités & Fragments','rare':'Curiosités & Fragments','étrange':'Curiosités & Fragments',
  'trouvaille':'Curiosités & Fragments','morceau':'Curiosités & Fragments',
  // ── Coupes & Vide-poche ──
  'coupe':'Coupes & Vide-poche','coupelle':'Coupes & Vide-poche',
  'coupole':'Coupes & Vide-poche','vasque':'Coupes & Vide-poche',
  // ── Petits objets ──
  'miniature':'Petits objets','petit objet':'Petits objets','bibelot':'Petits objets',
  'breloque':'Petits objets','charm':'Petits objets',
  // ── Usages oubliés ──
  'mystère':'Usages oubliés','inconnu':'Usages oubliés','antique':'Usages oubliés',
  'objet non identifié':'Usages oubliés',
};

// ── Groupes parents de typologies — pour l'expansion intelligente ─────────────
// Quand une recherche aboutit à une typologie fille, on inclut aussi la catégorie
// parente afin de remonter les objets classés directement sous le groupe.
const PARENT_TYPOLOGIES = {
  'Thé & Café':              'Art de la table',
  'Assiettes & Plats':       'Art de la table',
  'Couverts':                'Art de la table',
  'Verres':                  'Art de la table',
  'Plateaux':                'Art de la table',
  'Autour de la table':      'Art de la table',
  'Bougeoirs & Chandeliers': 'Lumière',
  'Bougies':                 'Lumière',
  'Lampes':                  'Lumière',
  'Vases':                   'Décor végétal',
  'Boîtes & coffrets':       'Contenants',
  'Bonbonnières & Bocaux':   'Contenants',
  'Flacons':                 'Contenants',
  'Rangements':              'Contenants',
  'Coupes & Vide-poche':     'Contenants',
  'Bijoux':                  'Parure',
  'Foulards':                'Parure',
  'Accessoires':             'Parure',
  'Livres':                  'Papier & Imprimé',
  'Revues & Cartes postales':'Papier & Imprimé',
  'Cadres':                  'Papier & Imprimé',
  'Beaux arts & Arts graphiques': 'Art',
  'Sculptures & Figurines':  'Art',
  'Objets muraux':           'Art',
  'Minéraux & Fossiles':     'Cabinet de curiosités',
  'Objets scientifiques':    'Cabinet de curiosités',
  'Curiosités & Fragments':  'Cabinet de curiosités',
  'Outils anciens':          'Cabinet de curiosités',
  'Tapisseries & Coussins':  'Textile',
  'Petits objets':           'Objets du quotidien',
  'Usages oubliés':          'Cabinet de curiosités',
};

// ── Normalisation robuste (accents + casse) ──────────────────────────────────
function _normalize(s) {
  return (s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // "Thé & Café" → "the & cafe" ; "tasse" → "tasse"
}

// ── Thésaurus personnalisé — stocké en localStorage ───────────────────────────
// Format : { "mot-clé": "Nom Typologie", ... }
let _customThesaurus = {};
try { _customThesaurus = JSON.parse(localStorage.getItem('charchives_thesaurus') || '{}'); } catch(e) {}

function _saveCustomThesaurus() {
  localStorage.setItem('charchives_thesaurus', JSON.stringify(_customThesaurus));
}

// Thésaurus runtime = base statique + entrées personnalisées
function _getRuntimeThesaurus() {
  return { ...SEARCH_THESAURUS, ..._customThesaurus };
}

// ── Lookup : retourne la liste des typologies mappées pour un terme ──────────
function _thesaurusLookup(q) {
  if (!q || q.length < 2) return [];
  const qn = _normalize(q);
  const thesaurus = _getRuntimeThesaurus();
  const cats = new Set();

  // 1. Correspondance exacte normalisée : "tasse" → "Thé & Café"
  Object.entries(thesaurus).forEach(([alias, target]) => {
    if (_normalize(alias) === qn) cats.add(target);
  });

  // 2. Préfixe (min 3 chars) : "bou" → "bougeoir"…
  if (qn.length >= 3) {
    Object.entries(thesaurus).forEach(([alias, target]) => {
      if (_normalize(alias).startsWith(qn)) cats.add(target);
    });
  }

  // 3. L'alias est un préfixe de q : "tasses" → alias "tasse"
  Object.entries(thesaurus).forEach(([alias, target]) => {
    const an = _normalize(alias);
    if (an.length >= 3 && qn.startsWith(an)) cats.add(target);
  });

  return [...cats];
}

// Rétrocompat pour l'index overlay
function _smartSearchExpand(q) {
  if (!q) return [q];
  return [q, ..._thesaurusLookup(q).map(t => t.toLowerCase())];
}

const LB = { photos: [], idx: 0 };
const TL = { zoom:1, panX:0, panY:0, isDragging:false, hasDragged:false, startX:0, startY:0, startPanX:0, startPanY:0 };
const _charts = {};
let _kwShowAll = false;
let _breadcrumbByView = {};    // breadcrumb persistant par vue
let _currentTrio     = null;  // dernier trio généré (modes 1 & 2)
let _triosActiveTab  = 'hasard'; // 'hasard' | 'regles' | 'manuel'
let _triosManualSlots = [null, null, null]; // objets placés en mode manuel
let _triosDragItem   = null; // objet en cours de drag
// Compositions sauvegardées — localStorage
let _savedTrios = JSON.parse(localStorage.getItem('charchives_saved_trios') || '[]');
// Panier constellation
let _conPanier = []; // IDs des objets mis de côté dans la constellation

// ── API helpers ────────────────────────────────────────────────────────────────
// _apiFetch : wrapper commun qui parse la réponse et lance une erreur typée
async function _apiFetch(url, opts = {}) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    // Erreur réseau pure (serveur down, cold start…)
    const e = new Error('network');
    e.type = 'network';
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || data.error || `HTTP ${res.status}`);
    e.status = res.status;
    e.type   = data.error === 'starting' ? 'starting' : 'http';
    throw e;
  }
  return data;
}

const api = {
  get:  url        => _apiFetch(url),
  post: (url, b)   => _apiFetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) }),
  put:  (url, b)   => _apiFetch(url, { method:'PUT',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) }),
  del:  url        => _apiFetch(url, { method:'DELETE' }),
  uploadPhotos: files => {
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    return _apiFetch('/api/upload', { method:'POST', body: fd });
  }
};

// ── Photo URL helper — handles both local refs and Cloudinary URLs ─────────────
function photoUrl(ref) {
  if (!ref) return '';
  if (ref.startsWith('http')) return ref;
  return `/uploads/${ref}`;
}

// ── Verbes & Typologies helpers ────────────────────────────────────────────────
// Lit 'verbes' en priorité, 'categories' comme fallback rétrocompat
function getVerbes() { return state.settings.verbes || state.settings.categories || []; }
function getCategories() { return getVerbes(); } // alias rétrocompat
function getVerbeBgColor(name) {
  const v = getVerbes().find(v => v.name === name);
  return v?.bgColor || v?.color || '#2D2D2D';
}
function getVerbeTextColor(name) {
  const v = getVerbes().find(v => v.name === name);
  return v?.textColor || '#F5F5F0';
}
// Garder getCategoryColor pour rétrocompat (utilisé dans quelques endroits)
function getCategoryColor(name) { return getVerbeBgColor(name); }
function getCategoryOrder() { return getVerbes().map(v => v.name); }
// Retourne les typologies d'un verbe (support ancien champ subcategories)
function getTypologies(verbe) { return verbe?.typologies || verbe?.subcategories || []; }
// Toutes les typologies à plat (toutes couleurs, toutes uniques)
function getAllTypologies() {
  const seen = new Set();
  const result = [];
  getVerbes().forEach(v => getTypologies(v).forEach(t => { if (!seen.has(t)) { seen.add(t); result.push({ name: t, verbeName: v.name, color: v.bgColor || v.color, textColor: v.textColor || '#F5F5F0' }); } }));
  return result;
}

// ── Sync labels personnalisés vers ATTRIBUTES_DEF ─────────────────────────────
function syncAttrLabels() {
  const labels = state.settings.attributeLabels || {};
  Object.entries(labels).forEach(([k, v]) => {
    if (ATTRIBUTES_DEF[k] && v) ATTRIBUTES_DEF[k].label = v;
  });
}

function applyAttributeOptions() {
  const opts = state.settings.attributeOptions || {};
  // matieres — supporte flat et groupé
  if (opts.matieres) {
    const flat = flattenGroups(opts.matieres);
    if (flat.length) ATTRIBUTES_DEF.matieres.options = flat;
    if (isGrouped(opts.matieres)) ATTRIBUTES_DEF.matieres.families = toAttrFamilies(opts.matieres);
  }
  // motifs — supporte flat et groupé
  const motifData = opts.motifs || (state.settings.motifs?.length ? state.settings.motifs : null);
  if (motifData) {
    const flat = flattenGroups(motifData);
    if (flat.length) ATTRIBUTES_DEF.motifs.options = flat;
    if (isGrouped(motifData)) ATTRIBUTES_DEF.motifs.families = toAttrFamilies(motifData);
  }
  if (opts.origine?.length)     ATTRIBUTES_DEF.origine.options     = flattenGroups(opts.origine);
  if (opts.etat_traces?.length) ATTRIBUTES_DEF.etat_traces.options = flattenGroups(opts.etat_traces);
  if (opts.usage?.length)       ATTRIBUTES_DEF.usage.options       = flattenGroups(opts.usage);
  if (opts.role?.length)        ATTRIBUTES_DEF.role.options        = flattenGroups(opts.role);
}

// ── Cold-start banner ─────────────────────────────────────────────────────────
function _getOrCreateStartBanner() {
  let el = document.getElementById('startingBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'startingBanner';
    el.className = 'starting-banner';
    document.body.appendChild(el);
  }
  return el;
}

function showStartingBanner(isRetry = false, attempt = 0) {
  const el = _getOrCreateStartBanner();
  const dots = '<span class="starting-dots"><span>.</span><span>.</span><span>.</span></span>';
  if (isRetry) {
    const remaining = Math.max(0, 12 - attempt);
    el.innerHTML = `
      <div class="starting-icon">◎</div>
      <div class="starting-title">Serveur en cours de démarrage${dots}</div>
      <div class="starting-sub">Le serveur se réveille, merci de patienter. (${attempt}/12)</div>
      <div class="starting-bar"><div class="starting-progress" style="width:${Math.min(100,(attempt/12)*100)}%"></div></div>`;
  } else {
    el.innerHTML = `
      <div class="starting-icon">◎</div>
      <div class="starting-title">Chargement${dots}</div>
      <div class="starting-sub">Connexion à la base de données…</div>`;
  }
  el.style.display = 'flex';
}

function hideStartingBanner() {
  const el = document.getElementById('startingBanner');
  if (el) el.style.display = 'none';
}

function showFatalBanner(msg) {
  const el = _getOrCreateStartBanner();
  el.innerHTML = `
    <div class="starting-icon" style="color:#D13F13">✕</div>
    <div class="starting-title" style="color:#D13F13">Connexion impossible</div>
    <div class="starting-sub">${msg}</div>
    <button class="starting-retry-btn" onclick="location.reload()">Réessayer</button>`;
  el.style.display = 'flex';
}

// ── Init ───────────────────────────────────────────────────────────────────────
const _INIT_MAX_RETRIES = 14;   // ~70 secondes (cold start Render ~30-60s)
const _INIT_RETRY_DELAY = 5000; // 5 secondes entre chaque tentative

async function _loadAppData() {
  const [collections, keywords, settings, expositions] = await Promise.all([
    api.get('/api/collections'),
    api.get('/api/keywords'),
    api.get('/api/settings'),
    api.get('/api/expositions').catch(()=>[])
  ]);
  return { collections, keywords, settings, expositions };
}

async function init(attempt = 0) {
  if (attempt === 0) showStartingBanner(false, 0);

  try {
    const { collections, keywords, settings, expositions } = await _loadAppData();

    hideStartingBanner();
    state.collections = collections;
    state.keywords    = keywords;
    state.settings    = settings;
    state.expositions = expositions || [];

    // Populate color options from settings
    ATTRIBUTES_DEF.couleurs.options = state.settings.colors || [];
    ATTRIBUTES_DEF.motifs.options   = state.settings.motifs || [];
    syncAttrLabels();
    applyAttributeOptions();

    // Merge custom color hexes into COLOR_MAP
    const _initCustomColors = state.settings.customColorHexes || {};
    Object.entries(_initCustomColors).forEach(([name, hex]) => { COLOR_MAP[name] = hex; });

    // Apply site title
    document.getElementById('siteTitle').textContent = state.settings.siteTitle || 'ARCHIVE';

    // Load Diorama state from localStorage
    _dioLoad();

    // Apply dark mode from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
      state.darkMode = true;
      document.body.classList.add('dark-mode');
      document.getElementById('darkModeBtn').textContent = '◐';
    }

    // Calendar years
    const colYears  = state.collections.filter(c=>c.createdAt).map(c=>parseInt(c.createdAt)).filter(y=>!isNaN(y));
    const colYears2 = state.collections.filter(c=>c.date).map(c=>parseInt(c.date)).filter(y=>!isNaN(y));
    const allYears  = [...colYears, ...colYears2];
    const minY = Math.min(2020, ...(allYears.length ? allYears : [2020]));
    const maxY = Math.max(new Date().getFullYear(), ...(allYears.length ? allYears : [new Date().getFullYear()]));
    state.calendarYears = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);
    getCategoryOrder().forEach(c => state.calendarActiveCategories.add(c));
    state.calendarActiveCategories.add('');

    buildTypologyFilterBar();
    buildCategoryFilterBar();
    buildSubcategoryBar();
    render();
    bindEvents();
    _syncTriosTabLabels();
    renderMobileFooterNav();

  } catch (err) {
    const isRetryable = err.type === 'starting' || err.type === 'network' || err.status === 503 || err.status === 502;
    if (isRetryable && attempt < _INIT_MAX_RETRIES) {
      console.warn(`Init attempt ${attempt + 1}/${_INIT_MAX_RETRIES} — ${err.message} — retry in ${_INIT_RETRY_DELAY}ms`);
      showStartingBanner(true, attempt + 1);
      setTimeout(() => init(attempt + 1), _INIT_RETRY_DELAY);
    } else {
      console.error('Init fatal:', err);
      showFatalBanner('Impossible de joindre le serveur. Vérifiez votre connexion puis rechargez la page.');
    }
  }
}

// ── Build dynamic verbes filter bar ───────────────────────────────────────────
function buildCategoryFilterBar() {
  const bar = document.getElementById('categoryFilterBar');
  const verbes = getVerbes();
  // Label dynamique : "Intention" ou "Intention : Porter" si un verbe est sélectionné
  const activeLbl = state.categoryFilter
    ? `Intention : <em style="font-style:italic;color:var(--text);text-transform:none;letter-spacing:0;">${esc(state.categoryFilter)}</em>`
    : 'Intention';
  bar.innerHTML = `<span class="sfb-label" data-accordion-trigger="1">${activeLbl}</span>`;
  // Par défaut, sur mobile, la barre est "collapsed" si aucune intention active,
  // et "expanded" si une intention est déjà sélectionnée (pour que l'utilisateur
  // puisse voir quelle est son choix et le changer). Le toggle au clic est géré plus bas.
  if (window.matchMedia && window.matchMedia('(max-width: 520px)').matches) {
    if (!state.categoryFilter && !bar.dataset.userOpened) {
      bar.classList.add('collapsed');
    } else {
      bar.classList.remove('collapsed');
    }
  } else {
    bar.classList.remove('collapsed');
  }
  const all = document.createElement('button');
  all.className = 'sfb-pill' + (state.categoryFilter === '' ? ' active' : '');
  all.dataset.cat = '';
  all.textContent = 'Toutes';
  bar.appendChild(all);
  verbes.forEach(v => {
    const btn = document.createElement('button');
    const isActive = state.categoryFilter === v.name;
    const verbeColor  = v.bgColor || v.color || '#2D2D2D';
    const activeColor = _verbeActiveColor(v); // version sombre/saturée du duotone
    btn.className = 'sfb-pill sfb-pill-verbe' + (isActive ? ' active' : '');
    btn.dataset.cat = v.name;
    btn.dataset.bg = verbeColor;
    btn.dataset.active = activeColor;
    btn.dataset.fg = v.textColor || '#fff';
    if (isActive) {
      // Actif : typo = couleur saturée/sombre du duo (jamais le ton pastel)
      btn.style.color = activeColor;
      btn.style.fontWeight = '';
    }
    btn.textContent = v.name;
    bar.appendChild(btn);
  });
  bar.querySelectorAll('.sfb-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => {
      if (!pill.classList.contains('active')) {
        pill.style.color = '';  // monochrome — pas de tint couleur au survol
        pill.style.background = '';
        pill.style.borderColor = '';
      }
    });
    pill.addEventListener('mouseleave', () => {
      if (!pill.classList.contains('active')) {
        pill.style.color = '';
        pill.style.background = '';
        pill.style.borderColor = '';
      }
    });
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      state.categoryFilter = cat;
      state.gravityMode = false;
      state.attrFilters.subcat = [];
      buildIndexTrigger();
      buildAttrFilterBar();
      // Fil d'Ariane : ajouter la catégorie sans effacer l'historique précédent
      if (cat) {
        pushBreadcrumb(cat, () => {
          if (state.view !== 'grid') setView('grid', true);
          state.categoryFilter = cat;
          state.attrFilters.subcat = [];
          buildCategoryFilterBar();
          buildIndexTrigger();
          buildAttrFilterBar();
          render();
        });
      } else {
        renderBreadcrumbBar();
      }
      render();
    });
  });
  // ── Accordion toggle (mobile) : clic sur le label "Intention" ouvre/ferme les pills
  const labelEl = bar.querySelector('.sfb-label[data-accordion-trigger]');
  if (labelEl) {
    labelEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!window.matchMedia || !window.matchMedia('(max-width: 520px)').matches) return;
      bar.classList.toggle('collapsed');
      bar.dataset.userOpened = bar.classList.contains('collapsed') ? '' : '1';
    });
  }
  buildIndexTrigger();
  buildAttrFilterBar();
}

// ── Barre Typologies — filtre primaire ────────────────────────────────────────
function buildTypologyFilterBar() {
  const bar = document.getElementById('typologyFilterBar');
  if (!bar) return;

  const typologies = getAllTypologies(); // [{name, verbeName, color, textColor}]
  // Tri alphabétique
  typologies.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  let html = `<button class="tfb-all${!state.typoFilter ? ' active' : ''}" data-typo="">Tout</button>`;
  typologies.forEach(t => {
    const isActive = state.typoFilter === t.name;
    html += `<button class="tfb-pill${isActive ? ' active' : ''}" data-typo="${esc(t.name)}">${esc(t.name)}</button>`;
  });
  bar.innerHTML = html;

  bar.querySelectorAll('[data-typo]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.typoFilter    = btn.dataset.typo;
      state.categoryFilter = '';      // les deux filtres sont mutuellement exclusifs
      state.attrFilters.subcat = [];
      buildTypologyFilterBar();
      buildCategoryFilterBar();
      buildSubcategoryBar();
      buildAttrFilterBar();
      render();
    });
  });
}

// ── Build attribute filter bar ────────────────────────────────────────────────
// ── Multi-select filter dropdowns ──────────────────────────────────────────────
let _openMfId = null; // which dropdown is currently open
let _mfSearchTerms = {}; // persists search text per filter key

function buildAttrFilterBar() {
  const bar = document.getElementById('attrFilterBar');
  if (!bar) return;

  if (state.categoryFilter) {
    // Verbe actif : masquer la barre Matière/Origine/État/Couleur
    bar.style.display = 'none';
  } else {
    bar.style.display = '';
    buildMultiFilter('filterStylesWrap',   'origine',  'Identité', ATTRIBUTES_DEF.origine.options);
    buildMultiFilter('filterMatieresWrap', 'matieres', 'Matière', ATTRIBUTES_DEF.matieres.options);
    // État supprimé de l'interface
    buildMultiFilter('filterCouleursWrap', 'couleurs', 'Couleur', state.settings.colors||[]);
  }
  buildSubcategoryBar();
}

function buildSubcategoryBar() { buildIndexTrigger(); } // alias rétrocompat

// ══ INDEX "DIGGER" — barre typologies avec pills inline ══════════════════════
function buildIndexTrigger() {
  const bar = document.getElementById('subcategoryFilterBar');
  if (!bar) return;
  bar.style.background = '';

  const activeTypos = state.attrFilters.subcat;
  bar.style.display = '';

  // Typologies : uniquement si un verbe est sélectionné
  let typologies = [];
  if (state.categoryFilter) {
    const verbe = getVerbes().find(v => v.name === state.categoryFilter);
    if (verbe) typologies = getTypologies(verbe).map(t => ({
      name: t, color: verbe.bgColor || verbe.color || '#2D2D2D', fg: verbe.textColor || '#fff'
    }));
    typologies.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  // Pills de typologies
  const pillsHtml = typologies.map(({ name: t, color, fg }) => {
    const isActive = activeTypos.includes(t);
    return `<button class="sfb-pill sfb-pill-typo${isActive ? ' active' : ''}" data-typo="${esc(t)}"
      style="${isActive ? `background:${color};color:${fg};border-color:${color}` : `border:1.5px solid ${color}40`}">${esc(t)}</button>`;
  }).join('');

  // Verbe actif : masquer toute la barre (recherche + pills dans le titre grid suffisent)
  if (state.categoryFilter) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';

  // Chip pour le filtre typo actif (sélectionné depuis l'overlay)
  const typoChip = state.typoFilter
    ? `<button class="idx-active-chip" id="idxClearTypoBtn">${esc(state.typoFilter)} ×</button>`
    : '';

  bar.innerHTML = `
    <span class="sfb-label sfb-label-clickable" id="sfbObjetsLabel" role="button" tabindex="0" style="cursor:pointer;">Objets</span>
    <button class="idx-trigger-btn" id="idxTriggerBtn">
      <em class="idx-trigger-hint">Typologies</em>
    </button>
    ${typoChip}
    <div class="idx-inline-wrap">
      <input type="text" class="idx-inline-input" id="idxInlineInput" placeholder="Rechercher" autocomplete="off" spellcheck="false">
      <div class="idx-inline-drop" id="idxInlineDrop" style="display:none"></div>
    </div>
  `;

  document.getElementById('idxTriggerBtn')?.addEventListener('click', openIndexOverlay);
  // ── Clic sur le mot "Objets" = ouvre l'index complet des catégories ──
  const objetsLabel = document.getElementById('sfbObjetsLabel');
  if (objetsLabel) {
    objetsLabel.addEventListener('click', openIndexOverlay);
    objetsLabel.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIndexOverlay(); }
    });
  }
  // Effacer le filtre typo actif
  document.getElementById('idxClearTypoBtn')?.addEventListener('click', () => {
    state.typoFilter = '';
    buildTypologyFilterBar();
    buildIndexTrigger();
    render();
  });

  // ── Recherche inline avec autocomplete ──
  const inp = document.getElementById('idxInlineInput');
  const drop = document.getElementById('idxInlineDrop');
  if (inp && drop) {
    // Construit et affiche les suggestions (toutes si q vide, filtrées sinon)
    const showSuggestions = () => {
      const q = inp.value.toLowerCase().trim();
      // Toutes les typologies triées alphabétiquement, filtrées si requête
      const all = getAllTypologies()
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      const matches = q
        ? all.filter(m => m.name.toLowerCase().includes(q))
        : all;
      const footerHTML = `<div class="search-index-footer">
        <button class="search-index-link idx-dd-footer-btn">+ Parcourir les typologies</button>
      </div>`;
      if (!matches.length) {
        drop.innerHTML = '<div class="idx-dd-empty">Aucune typologie</div>' + footerHTML;
        drop.style.display = 'block';
        drop.querySelector('.idx-dd-footer-btn')?.addEventListener('mousedown', e => {
          e.preventDefault(); drop.style.display = 'none'; openIndexOverlay();
        });
        return;
      }
      drop.innerHTML = matches.slice(0, 14).map(m => {
        const verbe = getVerbes().find(v => v.name === m.verbeName);
        const darkColor = _verbeActiveColor(verbe);
        return `<button class="idx-dd-item" data-typo="${esc(m.name)}" style="--dd-dark:${darkColor}">
          <span class="idx-dd-name"><span class="idx-dd-dot" style="background:${darkColor}"></span>${esc(m.name)}</span>
          <em class="idx-dd-verbe">${esc(m.verbeName)}</em>
        </button>`;
      }).join('') + footerHTML;
      drop.style.display = 'block';
      drop.querySelectorAll('.idx-dd-item').forEach(btn => {
        btn.addEventListener('mousedown', e => {
          e.preventDefault();
          const t = btn.dataset.typo;
          state.typoFilter = t;
          state.categoryFilter = '';
          state.attrFilters.subcat = [];
          inp.value = '';
          drop.style.display = 'none';
          buildTypologyFilterBar();
          buildCategoryFilterBar();
          buildIndexTrigger();
          render();
        });
      });
      drop.querySelector('.idx-dd-footer-btn')?.addEventListener('mousedown', e => {
        e.preventDefault(); drop.style.display = 'none'; openIndexOverlay();
      });
    };

    inp.addEventListener('focus', showSuggestions);
    inp.addEventListener('input', showSuggestions);
    inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 160));
    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { inp.value = ''; drop.style.display = 'none'; inp.blur(); }
    });
  }

  // Pills inline — toggle sélection
  bar.querySelectorAll('.sfb-pill-typo').forEach(pill => {
    const t = pill.dataset.typo;
    const vParent = getVerbes().find(v => getTypologies(v).includes(t));
    const col = vParent ? (vParent.bgColor || vParent.color || '#2D2D2D') : '#2D2D2D';
    const fg  = vParent?.textColor || '#fff';
    pill.addEventListener('mouseenter', () => {
      if (!pill.classList.contains('active')) {
        pill.style.background = col + '22';
        pill.style.color = col;
        pill.style.borderColor = col + '55';
      }
    });
    pill.addEventListener('mouseleave', () => {
      if (!pill.classList.contains('active')) {
        pill.style.background = '';
        pill.style.color = '';
        pill.style.borderColor = col + '40';
      }
    });
    pill.addEventListener('click', () => {
      const idx = state.attrFilters.subcat.indexOf(t);
      if (idx >= 0) state.attrFilters.subcat.splice(idx, 1);
      else state.attrFilters.subcat.push(t);
      buildIndexTrigger(); render();
    });
  });
}

// ── Index Overlay ─────────────────────────────────────────────────────────────
function openIndexOverlay() {
  const overlay = document.getElementById('indexOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('idx-overlay-open'));
  const inp = document.getElementById('idxSearchInput');
  if (inp) { inp.value = ''; inp.addEventListener('input', _buildIndexGroups); inp.focus(); }
  document.getElementById('idxCloseBtn')?.addEventListener('click', closeIndexOverlay);
  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) closeIndexOverlay(); });
  _buildIndexGroups();
}

function closeIndexOverlay() {
  const overlay = document.getElementById('indexOverlay');
  if (!overlay) return;
  overlay.classList.remove('idx-overlay-open');
  setTimeout(() => { overlay.style.display = 'none'; }, 280);
}

function _buildIndexGroups() {
  const q = (document.getElementById('idxSearchInput')?.value || '').toLowerCase().trim();
  const groups = document.getElementById('idxGroups');
  if (!groups) return;
  const selected = state.attrFilters.subcat;

  // Collecter toutes les typologies avec leurs métadonnées verbe
  let allTypos = [];
  getVerbes().forEach(verbe => {
    // Couleur foncée du duotone (textColor des Paramètres) pour les pastilles
    const color = _verbeActiveColor(verbe);
    getTypologies(verbe).forEach(t => {
      if (!q || t.toLowerCase().includes(q) || verbe.name.toLowerCase().includes(q)
             || _smartSearchExpand(q).some(term => t.toLowerCase().includes(term))) {
        allTypos.push({ t, color, verbeName: verbe.name });
      }
    });
  });

  if (!allTypos.length) {
    groups.innerHTML = '<p class="idx-empty">Aucune typologie trouvée.</p>';
    return;
  }

  // Trier alphabétiquement et grouper par première lettre
  allTypos.sort((a, b) => a.t.localeCompare(b.t, 'fr'));
  const byLetter = {};
  allTypos.forEach(item => {
    const letter = item.t[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if (!byLetter[letter]) byLetter[letter] = [];
    byLetter[letter].push(item);
  });

  let html = '<div class="idx-alpha-grid">';
  Object.entries(byLetter).sort(([a],[b]) => a.localeCompare(b,'fr')).forEach(([letter, items]) => {
    html += `<div class="idx-alpha-section">
      <div class="idx-alpha-letter">${letter}</div>
      <div class="idx-alpha-pills">
        ${items.map(({ t, color, verbeName }) => {
          const isActive = selected.includes(t);
          // textColor pour la fg : blanc si couleur sombre, texte sinon
          const fg = '#fff';
          return `<button class="idx-alpha-pill${isActive ? ' active' : ''}" data-typo="${esc(t)}"
            title="${esc(verbeName)}"
            style="--pill-col:${color};--pill-fg:${fg}">${esc(t)}</button>`;
        }).join('')}
      </div>
    </div>`;
  });
  html += '</div>';
  groups.innerHTML = html;

  groups.querySelectorAll('.idx-alpha-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.typo;
      const idx = state.attrFilters.subcat.indexOf(t);
      if (idx >= 0) state.attrFilters.subcat.splice(idx, 1);
      else state.attrFilters.subcat.push(t);
      buildIndexTrigger();
      render();
      closeIndexOverlay();
    });
  });
}

// ══ MODE GRAVITÉ — canvas D3 orbital ═════════════════════════════════════════
let _gravSim = null;

function exitGravityMode() {
  if (_gravSim) { _gravSim.stop(); _gravSim = null; }
  const pane = document.getElementById('gravityPane');
  const grid = document.getElementById('gridView');
  const footer = document.getElementById('gridExportFooter');
  if (pane) { pane.classList.remove('gravity-active'); pane.innerHTML = ''; }
  if (grid) grid.classList.remove('gravity-hidden');
  if (footer) footer.classList.remove('gravity-hidden');
}

function renderGravity(items) {
  if (!window.d3) { exitGravityMode(); renderGrid(items); return; }
  if (_gravSim) { _gravSim.stop(); _gravSim = null; }

  const pane = document.getElementById('gravityPane');
  const grid = document.getElementById('gridView');
  const footer = document.getElementById('gridExportFooter');
  if (!pane) return;

  grid.classList.add('gravity-hidden');
  if (footer) footer.classList.add('gravity-hidden');
  pane.innerHTML = '';
  // Déclencher le reflow pour l'animation
  pane.classList.remove('gravity-active');
  requestAnimationFrame(() => pane.classList.add('gravity-active'));

  const W = pane.clientWidth  || 900;
  const H = pane.clientHeight || 640;
  const cx = W / 2, cy = H / 2;
  const R = 38;
  const orbitR = Math.min(W, H) * 0.30;

  const verbe = getVerbes().find(v => v.name === state.categoryFilter);
  const bgColor = verbe ? (verbe.bgColor || verbe.color || '#2D2D2D') : '#2D2D2D';

  const svg = d3.select(pane).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%').style('height', '100%');

  // Defs : clipPaths photo
  const defs = svg.append('defs');
  items.forEach(item => {
    defs.append('clipPath').attr('id', `grav-clip-${item.id}`)
      .append('circle').attr('r', R);
  });

  // Aura centrale
  svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 80)
    .attr('fill', bgColor).attr('fill-opacity', 0.07);

  // Label verbe central — Spectral italic
  svg.append('text')
    .attr('class', 'grav-verb-label')
    .attr('x', cx).attr('y', cy)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('fill', bgColor)
    .text(state.categoryFilter);

  // Sous-label : nombre d'objets
  svg.append('text')
    .attr('class', 'grav-verb-count')
    .attr('x', cx).attr('y', cy + 34)
    .attr('text-anchor', 'middle')
    .attr('fill', bgColor)
    .text(`${items.length} objet${items.length !== 1 ? 's' : ''}`);

  // Nodes data
  const nodes = items.map(item => ({
    id: item.id, name: item.name,
    photo: item.photos?.[0] ? photoUrl(item.photos[0]) : null,
    x: cx + (Math.random() - 0.5) * 160,
    y: cy + (Math.random() - 0.5) * 160,
  }));

  // Fils du centre
  const linksG = svg.append('g');
  const lineEls = linksG.selectAll('line').data(nodes).join('line')
    .attr('stroke', bgColor).attr('stroke-opacity', 0.10)
    .attr('stroke-width', 1).attr('stroke-dasharray', '2 6');

  // Groupes de nœuds
  const nodesG = svg.append('g');
  const nodeEls = nodesG.selectAll('g.grav-node').data(nodes).join('g')
    .attr('class', 'grav-node').style('cursor', 'pointer');

  nodeEls.each(function(d) {
    const g = d3.select(this);
    g.append('circle').attr('r', R)
      .attr('fill', 'var(--bg)').attr('stroke', bgColor)
      .attr('stroke-width', 2).attr('stroke-opacity', 0.65);
    if (d.photo) {
      g.append('image')
        .attr('href', d.photo).attr('x', -R).attr('y', -R)
        .attr('width', R * 2).attr('height', R * 2)
        .attr('clip-path', `url(#grav-clip-${d.id})`)
        .attr('preserveAspectRatio', 'xMidYMid slice');
    }
    g.append('circle').attr('r', R).attr('fill', 'none')
      .attr('stroke', bgColor).attr('stroke-width', 1.5).attr('stroke-opacity', 0.4);
    g.append('text').attr('class', 'grav-node-label')
      .attr('y', R + 14).attr('text-anchor', 'middle')
      .text(d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name);
  });

  // Drag + click
  const drag = d3.drag()
    .on('start', (ev, d) => { if (!ev.active) _gravSim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
    .on('end',   (ev, d) => { if (!ev.active) _gravSim.alphaTarget(0); d.fx = null; d.fy = null; });
  nodeEls.call(drag).on('click', (ev, d) => { ev.stopPropagation(); openDetail(d.id); });

  // Simulation orbitale
  _gravSim = d3.forceSimulation(nodes)
    .force('radial',  d3.forceRadial(orbitR, cx, cy).strength(0.55))
    .force('collide', d3.forceCollide(R + 16).strength(0.9))
    .force('charge',  d3.forceManyBody().strength(-50))
    .alphaDecay(0.016)
    .velocityDecay(0.38)
    .on('tick', () => {
      const pad = R + 6;
      nodes.forEach(n => {
        n.x = Math.max(pad, Math.min(W - pad, n.x));
        n.y = Math.max(pad, Math.min(H - pad, n.y));
      });
      lineEls.attr('x1', cx).attr('y1', cy).attr('x2', d => d.x).attr('y2', d => d.y);
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });
}

function buildMultiFilter(wrapId, key, label, options) {
  const wrap = document.getElementById(wrapId); if (!wrap) return;
  const selected = state.attrFilters[key] || [];
  const count = selected.length;
  const btnLabel = count > 0 ? `${label} <span class="mf-count">${count}</span>` : label;
  const isOpen = _openMfId === wrapId;
  const hasSearch = key === 'matieres' || key === 'origine';
  const searchTerm = hasSearch ? (_mfSearchTerms[key] || '').toLowerCase() : '';

  // Build panel items
  let panelItems = '';
  if (isOpen) {
    if (options.length === 0) {
      panelItems = '<div class="mf-empty">Aucune option</div>';
    } else if (key === 'matieres' && !searchTerm) {
      // Family-grouped display
      const families = ATTRIBUTES_DEF.matieres.families || [];
      families.forEach((fam, fi) => {
        if (fi > 0) panelItems += '<div class="mf-family-sep"></div>';
        fam.items.forEach(opt => {
          panelItems += `<label class="mf-item">
            <input type="checkbox" value="${esc(opt)}" data-key="${key}" ${selected.includes(opt)?'checked':''}>
            <span>${esc(opt)}</span>
          </label>`;
        });
      });
    } else {
      // Flat list (optionally filtered by search)
      const filtered = searchTerm ? options.filter(o => o.toLowerCase().includes(searchTerm)) : options;
      if (filtered.length === 0) {
        panelItems = '<div class="mf-empty">Aucun résultat</div>';
      } else {
        panelItems = filtered.map(opt => `
          <label class="mf-item">
            <input type="checkbox" value="${esc(opt)}" data-key="${key}" ${selected.includes(opt)?'checked':''}>
            <span>${esc(opt)}</span>
          </label>`).join('');
      }
    }
  }

  wrap.innerHTML = `
    <button class="mf-btn${count>0?' mf-active':''}${isOpen?' mf-open':''}" data-wrap="${wrapId}">
      ${btnLabel} <span class="mf-arrow">${isOpen?'▾':'›'}</span>
    </button>
    ${isOpen ? `<div class="mf-panel" data-wrap="${wrapId}">
      ${hasSearch ? `<div class="mf-search-wrap"><input type="search" class="mf-search" placeholder="Rechercher…" value="${esc(searchTerm)}"></div>` : ''}
      <div class="mf-items-list">${panelItems}</div>
      ${count>0?`<button class="mf-clear" data-key="${key}">Tout effacer</button>`:''}
    </div>` : ''}
  `;

  // Toggle open/close
  wrap.querySelector('.mf-btn').addEventListener('click', e => {
    e.stopPropagation();
    _openMfId = isOpen ? null : wrapId;
    if (!isOpen) delete _mfSearchTerms[key]; // reset search on open
    buildAttrFilterBar();
  });

  if (isOpen) {
    // Search input
    if (hasSearch) {
      const searchInput = wrap.querySelector('.mf-search');
      if (searchInput) {
        searchInput.addEventListener('click', e => e.stopPropagation());
        searchInput.addEventListener('input', e => {
          _mfSearchTerms[key] = e.target.value;
          buildMultiFilter(wrapId, key, label, options);
        });
        // Focus search input
        setTimeout(() => searchInput.focus(), 0);
      }
    }
    // Checkbox changes
    wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const k = cb.dataset.key;
        if (cb.checked) { if (!state.attrFilters[k].includes(cb.value)) state.attrFilters[k].push(cb.value); }
        else { state.attrFilters[k] = state.attrFilters[k].filter(v=>v!==cb.value); }
        buildMultiFilter(wrapId, key, label, options);
        render();
      });
    });
    // Clear button
    const clearBtn = wrap.querySelector('.mf-clear');
    if (clearBtn) clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      state.attrFilters[clearBtn.dataset.key] = [];
      buildAttrFilterBar(); render();
    });
  }
}

// Close open dropdown when clicking outside
document.addEventListener('click', e => {
  if (_openMfId && !document.getElementById(_openMfId)?.contains(e.target)) {
    _openMfId = null;
    buildAttrFilterBar();
  }
});

// ── View switching ─────────────────────────────────────────────────────────────
const VIEW_LABELS = {
  grid: 'Inventaire', derive: 'Dérive',
  trios: 'Triptyque',  diorama: 'Diorama',
  calendar: 'Calendrier', catalogue: 'Catalogue', stats: 'Stats'
};

function setView(v, _silent = false) {
  if (v === 'timeline')       v = 'calendar';   // frise fusionnée
  if (v === 'gallery')        { v = 'derive'; state.deriveMode = 'nuee'; }
  if (v === 'constellation')  { v = 'derive'; state.deriveMode = 'reseau'; }
  state.view = v;

  const views = {
    grid: 'gridWrapper', derive: 'deriveView',
    trios: 'triosView',  diorama: 'dioramaView',
    calendar: 'calendarView', catalogue: 'catalogueView', stats: 'statsView'
  };
  Object.entries(views).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = k === v ? '' : 'none';
  });

  document.querySelectorAll('.view-tab').forEach(btn => btn.classList.remove('active'));
  const tabs = {
    grid: 'viewInventaire', derive: 'viewDerive',
    trios: 'viewAtelier',   diorama: 'viewDiorama',
    calendar: 'viewCalendar', catalogue: 'viewCatalogue', stats: 'viewStats'
  };
  const tabEl = document.getElementById(tabs[v]);
  if (tabEl) tabEl.classList.add('active');

  // Si on entre dans Dérive → réinitialiser tous les filtres Inventaire
  if (v === 'derive') {
    state.categoryFilter    = '';
    state.typoFilter        = '';
    state.attrFilters       = { subcat: [], matieres: [], origine: [], etat_traces: [], couleurs: [], motifs: [], usage: [], role: [] };
    state.statusFilter      = '';
    state.searchQuery       = '';
    state.activeKeywordFilters = new Set();
    state.detailList        = [];
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    document.body.classList.remove('verbe-active');
    document.body.style.removeProperty('--page-verbe-bg');
    document.body.style.removeProperty('--page-verbe-text');
    buildTypologyFilterBar();
    buildCategoryFilterBar();
    buildAttrFilterBar();
    renderSearchActiveTags();
    _applyDeriveMode(state.deriveMode, true);
  }

  // Breadcrumb — historique persistant cross-vues (jamais réinitialisé)
  if (!_silent && VIEW_LABELS[v]) {
    pushBreadcrumb(VIEW_LABELS[v], () => setView(v, true));
  }
  render();
}

// ── La Dérive : sub-mode Nuée / Constellation ──────────────────────────────
function _applyDeriveMode(mode, skipRender = false) {
  state.deriveMode = mode;
  // Mise à jour de la description selon le sous-mode
  const descEl = document.getElementById('deriveDesc');
  if (descEl) descEl.textContent = pageDesc(mode === 'reseau' ? 'constellation' : 'nuee');
  // Toggle panes with fade
  const nuee   = document.getElementById('deriveNueePane');
  const reseau = document.getElementById('deriveReseauPane');
  if (nuee)   nuee.classList.toggle('derive-pane-hidden',   mode !== 'nuee');
  if (reseau) reseau.classList.toggle('derive-pane-hidden', mode !== 'reseau');
  // Shuffle + zoom slider Nuée: visibles uniquement en Nuée
  const shuffleBtn = document.getElementById('deriveShuffleBtn');
  if (shuffleBtn) shuffleBtn.classList.toggle('hidden', mode !== 'nuee');
  const zoomWrap = document.getElementById('nueeZoomWrap');
  if (zoomWrap) zoomWrap.style.display = mode === 'nuee' ? '' : 'none';
  // Zoom slider Constellation: visible uniquement en réseau
  const conZoomWrap = document.getElementById('conZoomWrap');
  if (conZoomWrap) conZoomWrap.style.display = mode === 'reseau' ? '' : 'none';
  // Active button
  document.querySelectorAll('.derive-seg-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
  // Animate thumb
  _updateDeriveThumb();
  if (!skipRender) render();
}

function _updateDeriveThumb() {
  const seg    = document.getElementById('deriveSegmented');
  const thumb  = document.getElementById('deriveSegThumb');
  const active = seg?.querySelector('.derive-seg-btn.active');
  if (!seg || !thumb || !active) return;
  const segRect = seg.getBoundingClientRect();
  const btnRect = active.getBoundingClientRect();
  thumb.style.width     = btnRect.width + 'px';
  thumb.style.transform = `translateX(${btnRect.left - segRect.left - 3}px)`;
}

// ── Filters & sort ─────────────────────────────────────────────────────────────
// ── Score de pertinence pour le tri des résultats de recherche ──────────────
// Hiérarchie : Typologie exacte > Thésaurus→Typo > Matière > Nom > Verbe > reste
function _searchScore(c, q) {
  if (!q || q.length < 2) return 0;
  const qn = _normalize(q);

  const objTypos = [
    c.subcategory, c.subcategoryCustom,
    ...(Array.isArray(c.subcategories) ? c.subcategories : [])
  ].filter(Boolean);

  // 1 — Typologie : correspondance exacte normalisée → priorité maximale
  if (objTypos.some(t => _normalize(t) === qn)) return 100;
  // 1b — Début de mot : "assise" → "Assises"
  if (objTypos.some(t => _normalize(t).startsWith(qn) || qn.startsWith(_normalize(t)))) return 88;

  // 2 — Thésaurus → Typologie (ex: "tasse" → "Thé & Café")
  const mappedTypos = _thesaurusLookup(q);
  if (mappedTypos.length) {
    const expandedTypos = new Set(mappedTypos.map(_normalize));
    mappedTypos.forEach(typo => {
      const parent = PARENT_TYPOLOGIES[typo];
      if (parent) expandedTypos.add(_normalize(parent));
    });
    if ([...expandedTypos].some(m =>
      objTypos.some(t => _normalize(t) === m) || _normalize(c.category || '') === m
    )) return 80;
  }

  // 3 — Matière exacte (ex: "porcelaine", "laiton")
  const matieres = c.attributes?.matieres || [];
  if (matieres.some(m => _normalize(m) === qn)) return 72;
  if (matieres.some(m => _normalize(m).includes(qn))) return 60;

  // 4 — Nom de l'objet
  const nameN = _normalize(c.name || '');
  if (nameN === qn)               return 55;
  if (nameN.startsWith(qn))       return 48;
  if (nameN.includes(qn))         return 40;

  // 5 — Verbe/catégorie
  const catN = _normalize(c.category || '');
  if (catN === qn || catN.includes(qn)) return 32;

  // 6 — Autres champs (description, mots-clés, etc.)
  return 10;
}

function getFiltered() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const activeKws = [...state.activeKeywordFilters];

  const filtered = state.collections.filter(c => {
    // Les notes intercalaires ne sont jamais filtrées — gérées séparément
    if (c.type === 'note') return false;
    // ── Filtre primaire : Typologie sélectionnée dans la barre Typologies ──
    if (state.typoFilter) {
      const objTypos = [
        c.subcategory, c.subcategoryCustom,
        ...(Array.isArray(c.subcategories) ? c.subcategories : [])
      ].filter(Boolean);
      if (!objTypos.includes(state.typoFilter)) return false;
    }
    // ── Filtres classiques ──
    if (state.categoryFilter && c.category !== state.categoryFilter) return false;
    if (state.statusFilter   && c.itemStatus !== state.statusFilter)  return false;
    if (state.bookmarkFilter && !c.bookmarked) return false;
    if (state.activeExpoFilter && !(c.expositions||[]).includes(state.activeExpoFilter)) return false;
    if (activeKws.length && !activeKws.every(kw => (c.keywords||[]).includes(kw))) return false;
    const af = state.attrFilters;
    const subcatList = Array.isArray(c.subcategories) && c.subcategories.length
      ? c.subcategories
      : (c.subcategory && c.subcategory !== 'Autre' ? [c.subcategory] : (c.subcategoryCustom ? [c.subcategoryCustom] : []));
    if (af.subcat.length && !af.subcat.some(s => subcatList.includes(s))) return false;
    if (af.matieres.length && !af.matieres.some(v=>(c.attributes?.matieres||[]).includes(v))) return false;
    if (af.origine.length && !af.origine.some(v=>(c.attributes?.origine||[]).includes(v))) return false;
    if (af.etat_traces.length && !af.etat_traces.some(v=>(c.attributes?.etat_traces||[]).includes(v))) return false;
    if (af.couleurs.length && !af.couleurs.some(v=>(c.attributes?.couleurs||[]).includes(v))) return false;
    if (!q) return true;

    // ── PASSE A : correspondance textuelle directe ──────────────────────────
    const textStr = [
      c.name, c.description, c.category, c.subcategory, c.subcategoryCustom,
      ...(Array.isArray(c.subcategories) ? c.subcategories : []),
      ...(c.keywords||[]), ...(c.univers||[]),
      ...(Object.values(c.attributes||{}).flat()), c.itemStatus
    ].filter(Boolean).join(' ').toLowerCase();
    if (textStr.includes(q)) return true;

    // ── PASSE B : thésaurus → expansion typologique ─────────────────────────
    const mappedTypos = _thesaurusLookup(q);
    if (mappedTypos.length) {
      const expandedTypos = new Set(mappedTypos.map(_normalize));
      mappedTypos.forEach(typo => {
        const parent = PARENT_TYPOLOGIES[typo];
        if (parent) expandedTypos.add(_normalize(parent));
      });
      const objTypos = [c.subcategory, c.subcategoryCustom,
        ...(Array.isArray(c.subcategories) ? c.subcategories : [])].filter(Boolean);
      if ([...expandedTypos].some(mapped =>
        objTypos.some(t => _normalize(t) === mapped) || _normalize(c.category||'') === mapped
      )) return true;
    }
    return false;
  });

  // ── Tri sémantique quand une requête est active ─────────────────────────
  // Remplace le tri utilisateur : la Typologie exacte remonte en premier
  if (q.length >= 2) {
    return filtered.sort((a, b) => _searchScore(b, q) - _searchScore(a, q));
  }
  return applySortTo(filtered);
}

function applySortTo(items) {
  return [...items].sort((a,b) => {
    switch(state.sortBy) {
      case 'chrono':      return (a.date||'').localeCompare(b.date||'');
      case 'chrono-desc': return (b.date||'').localeCompare(a.date||'');
      case 'alpha':       return a.name.localeCompare(b.name,'fr');
      case 'price-asc':   return (a.price||0)-(b.price||0);
      case 'price-desc':  return (b.price||0)-(a.price||0);
      case 'date-ajout-desc': return (b.createdAt||'').localeCompare(a.createdAt||'');
      case 'date-ajout-asc':  return (a.createdAt||'').localeCompare(b.createdAt||'');
      case 'date-achat-desc': return (b.private?.dateAchat||'').localeCompare(a.private?.dateAchat||'');
      case 'date-achat-asc':  return (a.private?.dateAchat||'').localeCompare(b.private?.dateAchat||'');
      case 'category': {
        const order = getCategoryOrder();
        const ia = order.indexOf(a.category||''), ib = order.indexOf(b.category||'');
        if (ia!==ib) return (ia===-1?99:ia)-(ib===-1?99:ib);
        return (b.createdAt||b.date||'').localeCompare(a.createdAt||a.date||'');
      }
      default: return 0;
    }
  });
}

// Convertit un hex en RGB pour composer des rgba() avec alpha dynamique
function _hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace('#','');
  if (h.length < 6) return null;
  return {
    r: parseInt(h.slice(0,2),16),
    g: parseInt(h.slice(2,4),16),
    b: parseInt(h.slice(4,6),16)
  };
}
function _toRgbaStr(hex, alpha) {
  const c = _hexToRgb(hex);
  if (!c) return `rgba(45,45,45,${alpha})`;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

function applyVerbePageTheme() {
  const root = document.documentElement;
  if (state.view === 'grid' && state.categoryFilter) {
    const verbe = getVerbes().find(v => v.name === state.categoryFilter);
    if (verbe) {
      // Duotone : bgColor = couleur CLAIRE (fond), textColor = couleur FONCÉE (texte)
      const lightColor = verbe.bgColor   || '#E8E4DE';   // couleur "FOND" du duotone
      const darkColor  = verbe.textColor || _verbeActiveColor(verbe); // couleur "TEXTE"
      // Variantes pour le dégradé RADIAL (vignette) — opacités plus délicates
      // pour préserver la douceur éditoriale (réf. Journal d'Aligre)
      const bgStrong = _toRgbaStr(lightColor, 0.68);   // centre de la vignette
      const bgMid    = _toRgbaStr(lightColor, 0.30);   // zone intermédiaire
      root.style.setProperty('--page-verbe-bg',      lightColor + '2E');
      root.style.setProperty('--page-verbe-text',    darkColor);
      root.style.setProperty('--page-verbe-main',    lightColor);
      root.style.setProperty('--page-verbe-strong', bgStrong);
      root.style.setProperty('--page-verbe-mid',    bgMid);
      root.style.setProperty('--page-verbe-soft',    _toRgbaStr(lightColor, 0.12));
      root.style.setProperty('--page-verbe-soft-dk', _toRgbaStr(lightColor, 0.45));
      root.style.setProperty('--page-verbe-typo',    darkColor);
      document.body.classList.add('verbe-active');
      return;
    }
  }
  document.body.classList.remove('verbe-active');
  ['--page-verbe-bg','--page-verbe-text','--page-verbe-main',
   '--page-verbe-strong','--page-verbe-mid',
   '--page-verbe-soft','--page-verbe-soft-dk','--page-verbe-typo']
    .forEach(k => root.style.removeProperty(k));
}

// ── Applique le bon layout sur chaque .grid selon le nombre d'objets ──
// Peu d'objets (≤ nbCols) → CSS Grid (colonnes fiables)
// Beaucoup d'objets → CSS colonnes (effet masonry)
function _applyGridCols() {
  const slider = document.getElementById('cardSizeSlider');
  if (!slider) return;
  const min   = parseFloat(slider.min)   || 140;
  const max   = parseFloat(slider.max)   || 480;
  const ratio = (parseFloat(slider.value) - min) / (max - min);
  // Sur mobile (< 520px), forcer 2 colonnes max pour la lisibilité
  const isMobile = window.innerWidth < 520;
  const cols  = isMobile ? 2 : Math.max(2, Math.round(6 - ratio * 4));
  document.documentElement.style.setProperty('--grid-cols', String(cols));
  document.querySelectorAll('#gridView .grid').forEach(g => {
    const cardCount = g.querySelectorAll(':scope > .card').length;
    if (cardCount > 0 && cardCount <= cols) {
      // Peu d'objets : CSS Grid — utilise le nb de colonnes du slider pour que le zoom fonctionne
      g.classList.add('grid-css');
      g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      g.style.columnCount = '';
      g.style.webkitColumnCount = '';
    } else {
      // Beaucoup d'objets : CSS colonnes masonry
      g.classList.remove('grid-css');
      g.style.gridTemplateColumns = '';
      g.style.columnCount = String(cols);
      g.style.webkitColumnCount = String(cols);
    }
  });
}

function render() {
  _applyGridCols();
  // Update category filter pills — typo sombre/saturée à l'actif (data-active set par buildCategoryFilterBar)
  document.querySelectorAll('#categoryFilterBar .sfb-pill').forEach(p => {
    const isActive = p.dataset.cat === state.categoryFilter;
    p.classList.toggle('active', isActive);
    if (isActive && p.classList.contains('sfb-pill-verbe')) {
      p.style.color = p.dataset.active || p.dataset.bg || '';
      p.style.fontWeight = '';
      p.style.background = '';
      p.style.borderColor = '';
    } else if (!isActive) {
      p.style.background = '';
      p.style.color = '';
      p.style.borderColor = '';
      p.style.borderBottomColor = '';
    }
  });
  document.querySelectorAll('#statusFilterBar .sfb-pill').forEach(p => {
    if (p.dataset.bookmark) p.classList.toggle('active', state.bookmarkFilter);
    else p.classList.toggle('active', p.dataset.status === state.statusFilter);
  });

  applyVerbePageTheme();

  const filtered = getFiltered();
  state.detailList = filtered;
  const countText = `${filtered.length} objet${filtered.length!==1?'s':''}`;
  document.getElementById('countLabel').textContent = countText;
  // Cartouche Inventaire : description fixe (pas le compteur — il est déjà dans la toolbar)
  const invDesc = document.getElementById('inventaireDesc');
  if (invDesc && !invDesc.textContent) invDesc.textContent = PAGE_DESCRIPTIONS.inventaire;

  if (state.view==='grid') {
    exitGravityMode();
    renderGrid(filtered);
  } else if (state.view==='derive') {
    if (state.deriveMode==='nuee')    renderGallery(filtered);
    else                              renderConstellation(filtered);
  }
  else if (state.view==='diorama')     renderDiorama();
  else if (state.view==='trios')      renderTrios();
  else if (state.view==='calendar')   renderCalendar(filtered);
  else if (state.view==='catalogue')  renderCatalogue(filtered);
  else if (state.view==='stats')      renderStats();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
// Returns perceived luminance 0–1 for a hex color string
function _luminance(hex) {
  const h = hex.replace('#','');
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0,2),16)/255;
  const g = parseInt(h.slice(2,4),16)/255;
  const b = parseInt(h.slice(4,6),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
// Darken a hex color by scaling RGB channels — utilisé pour obtenir la version
// saturée/sombre d'une couleur pastel (Intention active plus contrastée)
function _darken(hex, factor = 0.5) {
  if (!hex) return '#2D2D2D';
  const h = hex.replace('#','');
  if (h.length < 6) return hex;
  const r = Math.round(parseInt(h.slice(0,2),16) * factor);
  const g = Math.round(parseInt(h.slice(2,4),16) * factor);
  const b = Math.round(parseInt(h.slice(4,6),16) * factor);
  return '#' + [r,g,b].map(x => Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join('');
}
// Retourne la couleur "TEXTE" définie dans Paramètres (la plus foncée du duotone
// renseigné par l'utilisateur). Fallback : dérive une version sombre de bgColor.
function _verbeActiveColor(verbe) {
  if (!verbe) return '#2D2D2D';
  // Priorité absolue à textColor s'il est défini (c'est la couleur "TEXTE" des Paramètres)
  if (verbe.textColor) return verbe.textColor;
  const bg = verbe.bgColor || verbe.color;
  if (!bg) return '#2D2D2D';
  // Pas de textColor → dériver une version sombre/saturée de bgColor
  return _darken(bg, 0.48);
}
function formatDate(d) {
  if (!d) return '';
  const [y,m]=d.split('-');
  return m ? `${MONTHS[parseInt(m)-1]||m} ${y}` : y;
}
function formatRelativeDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return 'aujourd\'hui';
  if (days === 1) return 'hier';
  if (days < 7)  return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days/7)}sem`;
  return d.toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'});
}

// ── Grid ───────────────────────────────────────────────────────────────────────
function renderGrid(items) {
  const el = document.getElementById('gridView');

  // Notes visibles uniquement si aucun filtre actif (vue globale)
  const notesVisible = !state.categoryFilter
    && !state.typoFilter
    && !state.bookmarkFilter;
  const notes = notesVisible
    ? state.collections.filter(c => c.type === 'note')
    : [];

  if (!items.length && !notes.length) {
    el.innerHTML='<div class="empty-state grid-empty">Aucun objet.</div>'; return;
  }

  if (state.sortBy==='category') {
    // Tri par catégorie : notes en tête (si visibles), puis groupes
    const groups = new Map();
    getCategoryOrder().forEach(c => groups.set(c,[]));
    groups.set('',[]);
    items.forEach(c => { const k=c.category||''; if(!groups.has(k))groups.set(k,[]); groups.get(k).push(c); });
    let html = notes.length
      ? `<div class="grid">${notes.map(c=>cardHTML(c)).join('')}</div>`
      : '';
    groups.forEach((cards,cat)=>{
      if (!cards.length) return;
      const bgColor = getVerbeBgColor(cat);
      const txtColor = getVerbeTextColor(cat);
      html += `<div class="cat-group">
        <div class="category-header" style="background:${bgColor};color:${txtColor}">
          <div class="cat-hdr-inner">
            <span class="cat-hdr-name">${esc(cat||'Sans catégorie')}</span>
          </div>
          <span class="cat-hdr-count">${cards.length} objet${cards.length>1?'s':''}</span>
        </div>
        <div class="grid">${cards.map(c=>cardHTML(c)).join('')}</div>
      </div>`;
    });
    el.innerHTML=html;
    _applyGridCols();
  } else {
    // Titre verbe — nom en grand + pills typologies interactives en dessous
    let titleHTML = '';
    if (state.categoryFilter) {
      const verbe = getVerbes().find(v => v.name === state.categoryFilter);
      if (verbe) {
        const typos = getTypologies(verbe);
        const col         = verbe.bgColor || verbe.color || '#2D2D2D';
        const fg          = verbe.textColor || '#fff';
        const activeColor = _verbeActiveColor(verbe);
        const pillsHTML = typos.map(t => {
          const isActive = state.attrFilters.subcat.includes(t);
          return `<button class="vpt-pill${isActive ? ' active' : ''}" data-typo="${esc(t)}"
            style="--vpt-col:${activeColor};--vpt-fg:${fg}">${esc(t)}</button>`;
        }).join('');
        titleHTML = `<div class="verbe-page-title">
          <div class="vpt-top">
            <h1 class="vpt-name" style="color:${activeColor}">${esc(verbe.name)}</h1>
            <span class="vpt-count">${items.length}&nbsp;objet${items.length!==1?'s':''}</span>
          </div>
          ${typos.length ? `<div class="vpt-pills">${pillsHTML}</div>` : ''}
        </div>`;
      }
    }
    // Intercaler les notes parmi les objets
    const combined = _intercalateNotes(items, notesVisible);
    el.innerHTML = titleHTML + `<div class="grid">${combined.map(c=>cardHTML(c)).join('')}</div>`;
    // Pills typologies dans le titre — toggle filtre
    el.querySelectorAll('.vpt-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        const t = pill.dataset.typo;
        const idx = state.attrFilters.subcat.indexOf(t);
        if (idx >= 0) state.attrFilters.subcat.splice(idx, 1);
        else state.attrFilters.subcat.push(t);
        buildIndexTrigger();
        render();
      });
    });
  }
  bindCardEvents(el);
  _initNoteDragDrop(el, items);
  // Applique column-count inline après injection du DOM — contourne tout problème de cascade
  _applyGridCols();
}

function cardHTML(c) {
  // ── Note intercalaire ──
  if (c.type === 'note') {
    const bg       = c.backgroundColor || '#F5E6D3';
    const lum      = _luminance(bg);
    const fg       = lum > 0.35 ? '#1a1a1a' : '#f5f5f0';
    const fontCls  = c.noteFont  === 'terrain'  ? 'font-terrain'  : 'font-poetic';
    const wideCls  = c.noteWidth === 'wide'      ? ' note-wide'    : '';
    const sizeCls  = c.noteSize  === 'small'     ? ' note-size-sm'
                   : c.noteSize  === 'large'      ? ' note-size-lg' : '';
    return `<div class="card-note${wideCls}" data-id="${c.id}"
      style="--note-bg:${bg};color:${fg}" draggable="true">
      <div class="card-note-drag-handle" title="Déplacer">⠿</div>
      <div class="card-note-inner">
        <div class="card-note-text ${fontCls}${sizeCls}">${esc(c.content || '')}</div>
      </div>
      <button class="card-note-menu-btn" title="Modifier la note">···</button>
    </div>`;
  }

  // ── Fragment card ──
  if (c.type === 'fragment') {
    const bg  = c.backgroundColor || '#1a1a1a';
    const lum = _luminance(bg);
    const fg  = lum > 0.35 ? '#1a1a1a' : '#f5f5f0';
    const verbeLabel = c.category ? `<span class="card-verbe-label">${esc(c.category)}</span>` : '';
    return `<div class="card card-fragment" data-id="${c.id}" style="background:${bg};color:${fg}">
      <div class="card-top-badges"><span>${verbeLabel}</span></div>
      <div class="frag-text">${esc(c.textContent||'')}</div>
    </div>`;
  }

  const photos = c.photos||[];
  const idx = Math.min(state.cardPhotoIdx.get(c.id)||0, Math.max(0,photos.length-1));
  const photo = photos[idx];
  const hasMultiple = photos.length>1;
  const bgColor = getVerbeBgColor(c.category);
  const textColor = getVerbeTextColor(c.category);
  const statusColor = STATUS_COLORS[c.itemStatus];
  const statusBadge = statusColor ? `<span class="card-status-badge" style="background:${statusColor}"></span>` : '';
  // Support both new subcategories[] array and legacy subcategory string
  const subcats = Array.isArray(c.subcategories) && c.subcategories.length
    ? c.subcategories
    : (c.subcategory && c.subcategory !== 'Autre' ? [c.subcategory] : (c.subcategoryCustom ? [c.subcategoryCustom] : []));
  const typoText = subcats.join(' · ');
  // Micro-labels dans le body
  // Verbe : première lettre maj, reste minuscule — italic via CSS
  const verbeName = c.category
    ? c.category.charAt(0).toUpperCase() + c.category.slice(1).toLowerCase()
    : '';
  const verbeLabel = verbeName ? `<span class="card-verbe-label">${esc(verbeName)}</span>` : '';
  const typoLabel = typoText ? `<span class="card-typo-label">${esc(typoText)}</span>` : '';
  const metaRow = (verbeLabel || typoLabel) ? `<div class="card-meta-row">${verbeLabel}${typoLabel}</div>` : '';
  const priceBadge = c.price != null && c.price !== '' ? `<span class="card-price">${c.price} €</span>` : '';
  const addedDate = c.createdAt ? `<div class="card-added-date">${formatRelativeDate(c.createdAt)}</div>` : '';
  // Halo Directionnel — couleur du verbe pour le blob ::before
  // Si l'objet a une catégorie mappée à un verbe avec couleur propre, on l'utilise.
  // Sinon, fallback chaud neutre (évite un halo anthracite sur fond blanc).
  const verbeHasColor = c.category && getVerbes().some(v => v.name === c.category && (v.bgColor || v.color));
  const haloAccent = verbeHasColor ? bgColor : 'rgba(198,188,175,0.8)';
  const haloColor = verbeHasColor ? bgColor + '55' : 'rgba(45,45,45,0.08)';
  const accentStyle = ` style="--verbe-accent:${haloAccent};--card-halo:${haloColor}"`;

  // ── imageMode : portrait (3:4) | landscape (4:3) | cutout (auto) ──
  const _isDetoured = photo && (photo.toLowerCase().endsWith('.png') || photo.includes('detour'));
  const imageMode = c.imageMode || (_isDetoured ? 'cutout' : 'portrait');
  const thumbAreaMod = imageMode === 'cutout'    ? ' card-thumb-area--cutout'
                     : imageMode === 'landscape' ? ' card-thumb-area--landscape'
                     : ''; // portrait par défaut

  return `
  <div class="card" data-id="${c.id}"${accentStyle}>
    <div class="card-thumb-area${thumbAreaMod}">
      <button class="card-bookmark-btn${c.bookmarked ? ' bookmarked' : ''}" data-id="${c.id}" title="${c.bookmarked ? 'Retirer des favoris' : 'Coup de cœur'}" onclick="event.stopPropagation();toggleBookmark('${c.id}')">${_asteriskSVG()}</button>
      ${photo
        ? `<img class="card-thumb" src="${photoUrl(photo)}" alt="">`
        : `<div class="card-thumb-placeholder">◻</div>`}
      ${hasMultiple ? `<div class="card-nav">
        <button class="card-prev" data-id="${c.id}">‹</button>
        <span class="card-photo-count">${idx+1} / ${photos.length}</span>
        <button class="card-next" data-id="${c.id}">›</button>
      </div>` : ''}
      <div class="card-drop-hint">Déposer les photos ici</div>
    </div>
    <div class="card-body">
      ${metaRow}
      <div class="card-name">${esc(c.name)}</div>
      <div class="card-footer-row">
        <div class="card-price-status">
          ${statusColor ? `<span class="card-status-dot" style="background:${statusColor}"></span>` : ''}
          ${priceBadge}
        </div>
        ${addedDate}
      </div>
    </div>
  </div>`;
}

function bindCardEvents(el) {
  el.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.addEventListener('dragover', e=>{ e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', ()=>card.classList.remove('drag-over'));
    card.addEventListener('drop', async e=>{
      e.preventDefault(); card.classList.remove('drag-over');
      const files=[...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'));
      if (!files.length) return;
      const {filenames}=await api.uploadPhotos(files);
      const col=state.collections.find(c=>c.id===id);
      const updated=await api.put(`/api/collections/${id}`,{...col,photos:[...col.photos,...filenames]});
      Object.assign(col,updated); render();
    });
    card.addEventListener('click', ()=>openDetail(id));
  });
  el.querySelectorAll('.card-prev').forEach(btn=>{
    btn.addEventListener('click',e=>{ e.stopPropagation();
      const c=state.collections.find(x=>x.id===btn.dataset.id); if(!c?.photos.length) return;
      const cur=state.cardPhotoIdx.get(btn.dataset.id)||0;
      const next=(cur-1+c.photos.length)%c.photos.length;
      state.cardPhotoIdx.set(btn.dataset.id,next); updateCardThumb(el,btn.dataset.id,c.photos,next);
    });
  });
  el.querySelectorAll('.card-next').forEach(btn=>{
    btn.addEventListener('click',e=>{ e.stopPropagation();
      const c=state.collections.find(x=>x.id===btn.dataset.id); if(!c?.photos.length) return;
      const cur=state.cardPhotoIdx.get(btn.dataset.id)||0;
      const next=(cur+1)%c.photos.length;
      state.cardPhotoIdx.set(btn.dataset.id,next); updateCardThumb(el,btn.dataset.id,c.photos,next);
    });
  });
}

// ══════════════════════════════════════════════════════════════
// NOTES INTERCALAIRES — Blocs de texte narratifs
// ══════════════════════════════════════════════════════════════

// ── Intercalation des notes dans la liste d'objets ────────────
function _intercalateNotes(items, includeNotes = true) {
  if (!includeNotes) return items;
  const notes = state.collections
    .filter(c => c.type === 'note')
    .sort((a, b) => (a.notePos ?? 9999) - (b.notePos ?? 9999));
  if (!notes.length) return items;
  const result = [...items];
  // Insère depuis la fin pour préserver les indices
  [...notes].reverse().forEach(note => {
    const pos = Math.min(Math.max(0, Math.round(note.notePos ?? result.length)), result.length);
    result.splice(pos, 0, note);
  });
  return result;
}

// ── Drag & drop — repositionner une note dans la grille ───────
function _initNoteDragDrop(el, items) {
  let _dragNoteId = null;

  el.querySelectorAll('.card-note').forEach(noteEl => {
    noteEl.addEventListener('dragstart', e => {
      _dragNoteId = noteEl.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-note-id', _dragNoteId);
      // Defer class add — adding it synchronously in dragstart cancels the drag in Chrome
      requestAnimationFrame(() => noteEl.classList.add('note-dragging'));
    });
    noteEl.addEventListener('dragend', () => {
      noteEl.classList.remove('note-dragging');
      el.querySelectorAll('.note-drop-after').forEach(t => t.classList.remove('note-drop-after'));
      _dragNoteId = null;
    });
    noteEl.addEventListener('click', e => {
      if (!e.defaultPrevented) openNoteModal(noteEl.dataset.id);
    });
    noteEl.querySelector('.card-note-menu-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      openNoteModal(noteEl.dataset.id);
    });
  });

  // Drop targets : tous les cards (objets + autres notes)
  // Indicateur : ligne horizontale au-dessus ou en-dessous selon la position de la souris
  el.querySelectorAll('.card, .card-note').forEach(card => {
    card.addEventListener('dragover', e => {
      if (!_dragNoteId) return;
      if (card.dataset.id === _dragNoteId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = card.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;
      el.querySelectorAll('.note-drop-above, .note-drop-below')
        .forEach(t => t.classList.remove('note-drop-above', 'note-drop-below'));
      card.classList.add(isAbove ? 'note-drop-above' : 'note-drop-below');
      card.dataset.dropPos = isAbove ? 'above' : 'below';
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('note-drop-above', 'note-drop-below');
      delete card.dataset.dropPos;
    });
    card.addEventListener('drop', async e => {
      if (!_dragNoteId) return;
      if (!e.dataTransfer.types.includes('application/x-note-id')) return;
      e.preventDefault();
      const dropPos = card.dataset.dropPos || 'below';
      card.classList.remove('note-drop-above', 'note-drop-below');
      delete card.dataset.dropPos;

      const dropTargetId = card.dataset.id;
      const itemIdx = items.findIndex(c => c.id === dropTargetId);
      let newPos;
      if (itemIdx >= 0) {
        // Déposé sur un objet — au-dessus = notePos=idx, en-dessous = notePos=idx+1
        newPos = dropPos === 'above' ? itemIdx : itemIdx + 1;
      } else {
        // Déposé sur une autre note — ±0.5 autour de sa position
        const targetNote = state.collections.find(c => c.id === dropTargetId && c.type === 'note');
        const pos = targetNote?.notePos ?? 0;
        newPos = dropPos === 'above' ? pos - 0.5 : pos + 0.5;
      }

      const note = state.collections.find(c => c.id === _dragNoteId);
      if (note) {
        note.notePos = newPos;
        try { await api.put(`/api/collections/${_dragNoteId}`, { notePos: newPos }); }
        catch(err) { console.warn('Note drag save failed:', err); }
        render();
      }
    });
  });
}

// ── Couleurs disponibles pour les notes ──────────────────────
function _noteColors() {
  const verbeColors = getVerbes()
    .filter(v => v.bgColor || v.color)
    .map(v => ({ hex: v.bgColor || v.color, label: v.name }));
  return [
    { hex: '#FAFAF8', label: 'Blanc chaud' },
    { hex: '#F5E6D3', label: 'Parchemin' },
    { hex: '#EDE8E0', label: 'Lin' },
    { hex: '#D9D0C7', label: 'Pierre' },
    { hex: '#E8EEF4', label: 'Ciel' },
    { hex: '#E8F4EF', label: 'Menthe' },
    { hex: '#2D2D2D', label: 'Anthracite' },
    ...verbeColors,
  ];
}

// ── État de la modale note ────────────────────────────────────
let _noteEditId        = null;
let _noteSelectedColor = '#F5E6D3';
let _noteSelectedFont  = 'poetic';
let _noteSelectedWidth = 'single';
let _noteSelectedSize  = 'standard';

function openNoteModal(id) {
  _noteEditId = id || null;
  const titleEl   = document.getElementById('noteModalTitle');
  const contentEl = document.getElementById('nContent');
  const deleteBtn = document.getElementById('noteDeleteBtn');

  if (id) {
    const note = state.collections.find(c => c.id === id);
    if (!note) return;
    titleEl.textContent  = 'Modifier la note';
    contentEl.value      = note.content || '';
    _noteSelectedColor   = note.backgroundColor || '#F5E6D3';
    _noteSelectedFont    = note.noteFont  || 'poetic';
    _noteSelectedWidth   = note.noteWidth || 'single';
    _noteSelectedSize    = note.noteSize  || 'standard';
    deleteBtn.style.display = '';
  } else {
    titleEl.textContent  = 'Nouvelle note';
    contentEl.value      = '';
    _noteSelectedColor   = '#F5E6D3';
    _noteSelectedFont    = 'poetic';
    _noteSelectedWidth   = 'single';
    _noteSelectedSize    = 'standard';
    deleteBtn.style.display = 'none';
  }
  _renderNoteColorSwatches();
  _syncNoteOptBtns();
  _updateNotePreview();
  document.getElementById('noteModal').style.display = 'flex';
  setTimeout(() => contentEl.focus(), 60);
}

function closeNoteModal() {
  document.getElementById('noteModal').style.display = 'none';
}

function _renderNoteColorSwatches() {
  const wrap   = document.getElementById('noteColorSwatches');
  const colors = _noteColors();
  wrap.innerHTML = colors.map(c => {
    const isLight = c.hex === '#FAFAF8' || c.hex === '#F5E6D3' || c.hex === '#EDE8E0'
                  || c.hex === '#E8EEF4' || c.hex === '#E8F4EF' || _luminance(c.hex) > 0.75;
    return `<button class="note-swatch${c.hex === _noteSelectedColor ? ' selected' : ''}"
      style="background:${c.hex};${isLight ? 'border-color:var(--border)' : ''}"
      data-hex="${c.hex}" title="${esc(c.label)}"></button>`;
  }).join('');
  wrap.querySelectorAll('.note-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      _noteSelectedColor = btn.dataset.hex;
      wrap.querySelectorAll('.note-swatch').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      _updateNotePreview();
    });
  });
}

function _syncNoteOptBtns() {
  document.querySelectorAll('#noteFontGroup [data-font]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === _noteSelectedFont);
  });
  document.querySelectorAll('#noteWidthGroup [data-width]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.width === _noteSelectedWidth);
  });
  document.querySelectorAll('#noteSizeGroup [data-size]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === _noteSelectedSize);
  });
}

function _updateNotePreview() {
  const preview = document.getElementById('notePreview');
  const textEl  = document.getElementById('notePreviewText');
  if (!preview || !textEl) return;
  const bg  = _noteSelectedColor;
  const lum = _luminance(bg);
  const fg  = lum > 0.35 ? '#1a1a1a' : '#f5f5f0';
  preview.style.background = bg;
  preview.style.color      = fg;
  const sizeCls = _noteSelectedSize === 'small' ? ' note-size-sm' : _noteSelectedSize === 'large' ? ' note-size-lg' : '';
  textEl.className = 'note-preview-text ' + (_noteSelectedFont === 'terrain' ? 'font-terrain' : 'font-poetic') + sizeCls;
  const content = document.getElementById('nContent')?.value || '';
  textEl.textContent = content || '—';
}

async function saveNote() {
  const content = (document.getElementById('nContent')?.value || '').trim();
  if (!content) { document.getElementById('nContent')?.focus(); return; }

  const payload = {
    type: 'note',
    content,
    backgroundColor: _noteSelectedColor,
    noteFont:  _noteSelectedFont,
    noteWidth: _noteSelectedWidth,
    noteSize:  _noteSelectedSize,
  };

  try {
    if (_noteEditId) {
      const updated = await api.put(`/api/collections/${_noteEditId}`, payload);
      const idx = state.collections.findIndex(c => c.id === _noteEditId);
      if (idx >= 0) state.collections[idx] = { ...state.collections[idx], ...updated };
    } else {
      // notePos = fin de la liste d'objets courante
      payload.notePos = getFiltered().length;
      const created = await api.post('/api/collections', payload);
      state.collections.unshift(created);
    }
    closeNoteModal();
    render();
  } catch(err) {
    alert('Erreur lors de l\'enregistrement\u00a0: ' + err.message);
  }
}

async function deleteNote(id) {
  if (!confirm('Supprimer cette note définitivement\u00a0?')) return;
  try {
    await api.del(`/api/collections/${id}`);
    state.collections = state.collections.filter(c => c.id !== id);
    closeNoteModal();
    render();
  } catch(err) {
    alert('Erreur\u00a0: ' + err.message);
  }
}

function updateCardThumb(el,id,photos,idx) {
  const card=el.querySelector(`.card[data-id="${id}"]`); if(!card) return;
  const img=card.querySelector('.card-thumb'); if(img) img.src=photoUrl(photos[idx]);
  const counter=card.querySelector('.card-photo-count'); if(counter) counter.textContent=`${idx+1} / ${photos.length}`;
}

// ── Calendar ───────────────────────────────────────────────────────────────────
// ══ CONSTELLATION — Graphe de connexions D3 ══════════════════════════════════

let _conSim         = null;   // d3 simulation instance
let _conZoom        = null;   // d3 zoom behavior
let _conSvgSel      = null;   // d3 selection de l'élément SVG (pour zoom.scaleTo)
let _conAffinityType = 'intention'; // 'intention' | 'matiere' | 'identite'

// ── Graph data builder ────────────────────────────────────────────────────────
function _buildConGraph(items, affinityType) {
  // Deep-copy so D3 can mutate positions
  const nodes = items.map(c => ({
    id: c.id, name: c.name || '—', category: c.category || '',
    photos: c.photos || [], attributes: c.attributes || {}
  }));

  const links = [];
  const seen  = new Set();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      let strength = 0;

      if (affinityType === 'intention') {
        if (a.category && a.category === b.category) strength = 1;
      } else if (affinityType === 'matiere') {
        const mA = a.attributes?.matieres || [];
        const mB = b.attributes?.matieres || [];
        strength = mA.filter(m => mB.includes(m)).length;
      } else { // identite (ex-époque) — même origine / même période
        const oA = (a.attributes?.origine || [])[0];
        const oB = (b.attributes?.origine || [])[0];
        if (oA && oA === oB) strength = 1;
      }

      if (strength > 0) {
        const key = `${a.id}__${b.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          links.push({ source: a.id, target: b.id, strength });
        }
      }
    }
  }

  return { nodes, links };
}

// ── Main render ───────────────────────────────────────────────────────────────
// ── Design System helpers ────────────────────────────────────────────────────
function _sectionHeaderHTML(title, desc) {
  return `<div class="section-header">
    <h2 class="section-header-title">${esc(title)}</h2>
    ${desc ? `<p class="section-header-desc">${esc(desc)}</p>` : ''}
  </div>`;
}

function renderConstellation(filtered) {
  const canvas = document.getElementById('conCanvas');
  if (!canvas) return;

  // Stop & clear previous simulation
  if (_conSim) { _conSim.stop(); _conSim = null; }
  canvas.innerHTML = '';

  const items = filtered || state.collections;
  if (!items.length) {
    canvas.innerHTML = '<div class="con-empty">Aucun objet à afficher.</div>';
    return;
  }

  const { nodes, links } = _buildConGraph(items, _conAffinityType);
  _drawConGraph(canvas, nodes, links);

  // Affinity pill bindings
  document.querySelectorAll('.con-aff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.aff === _conAffinityType);
    btn.onclick = () => {
      _conAffinityType = btn.dataset.aff;
      renderConstellation(state.detailList.length ? state.detailList : state.collections);
    };
  });
}

// ── D3 drawing — zoom/pan natif ───────────────────────────────────────────────
function _drawConGraph(canvas, nodes, links) {
  if (!window.d3) { canvas.innerHTML = '<div class="con-empty">D3.js non chargé.</div>'; return; }

  const W = canvas.clientWidth  || 800;
  const H = canvas.clientHeight || 600;

  // ── Taille image : moodboard flottant ──
  const IMG  = 72;
  const HALF = IMG / 2;

  // SVG remplit entièrement le canvas — D3 zoom gère le pan et le zoom
  const svg = d3.select(canvas).append('svg')
    .attr('width',  W)
    .attr('height', H)
    .style('display', 'block')
    .style('opacity', '0')
    .style('transition', 'opacity .42s ease');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.style('opacity', '1')));

  // Calque transformé par d3.zoom — tout le contenu est ici
  const zoomLayer = svg.append('g').attr('class', 'con-zoom-layer');

  // ── Couleur des liens ──
  function linkColor(d) {
    const src = nodes.find(n => n.id === (d.source.id || d.source));
    if (!src) return '#9ca3af';
    if (_conAffinityType === 'intention') return getVerbeBgColor(src.category) || '#9ca3af';
    return '#9ca3af';
  }

  // ── Liens ──
  const linksG = zoomLayer.append('g').attr('class', 'con-links-group');
  const linkEl = linksG.selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'con-link')
    .attr('stroke', linkColor)
    .attr('stroke-width', d => Math.max(1.5, Math.sqrt(d.strength) * 1.5))
    .attr('stroke-opacity', 0.38);

  // ── Halos Soft Block conditionnels (affinité = intention uniquement) ──
  const halosG = zoomLayer.append('g').attr('class', 'con-halos-group');
  const showHalos = _conAffinityType === 'intention';
  const haloEl = showHalos ? halosG.selectAll('circle.con-halo')
    .data(nodes)
    .join('circle')
    .attr('class', 'con-halo')
    .attr('r', HALF + 22)
    .attr('fill', d => getVerbeBgColor(d.category) || '#e5e7eb')
    .attr('fill-opacity', 0.55)
    .attr('filter', 'url(#con-halo-blur)')
    .attr('pointer-events', 'none')
    : d3.select(null);
  // Filtre blur SVG (une seule instance)
  if (showHalos && svg.select('#con-halo-blur').empty()) {
    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'con-halo-blur')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      .append('feGaussianBlur').attr('stdDeviation', 16);
  }

  // ── Nœuds — images brutes, sans cercles ──
  const nodesG = zoomLayer.append('g').attr('class', 'con-nodes-group');
  const nodeEl = nodesG.selectAll('g.con-node')
    .data(nodes)
    .join('g')
    .attr('class', 'con-node');

  nodeEl.each(function(d) {
    const g   = d3.select(this);
    const bg  = getVerbeBgColor(d.category) || '#9ca3af';
    const src = d.photos[0] ? photoUrl(d.photos[0]) : null;

    if (src) {
      g.append('image')
        .attr('class', 'con-node-photo')
        .attr('href', src)
        .attr('x', -HALF).attr('y', -HALF)
        .attr('width', IMG).attr('height', IMG)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    } else {
      g.append('rect')
        .attr('x', -HALF * 0.6).attr('y', -HALF * 0.6)
        .attr('width', IMG * 0.6).attr('height', IMG * 0.6)
        .attr('fill', bg).attr('fill-opacity', 0.28)
        .attr('stroke', bg).attr('stroke-width', 1);
    }

    // Bouton "Coup de cœur" — unifié avec la Sélection (favoris bookmarks)
    // Design : fond blanc + "+" foncé par défaut ; inversé (fond noir + "+" blanc) à l'actif
    const isBookmarked = !!d.bookmarked;
    const addG = g.append('g')
      .attr('class', 'con-add-btn')
      .attr('transform', `translate(${Math.round(HALF * 0.72)},${Math.round(-HALF * 0.72)})`)
      .style('opacity', isBookmarked ? 1 : 0)
      .style('cursor', 'pointer');
    addG.append('circle').attr('r', 8.5)
      .attr('fill', isBookmarked ? '#18181b' : '#ffffff')
      .attr('stroke', '#18181b')
      .attr('stroke-width', 1);
    // Croix "+" — 2 branches verticale + horizontale (viewBox 24×24 rendu à 10×10 centré)
    const astColor = isBookmarked ? '#ffffff' : '#18181b'; // actif = inversé
    const astG = addG.append('g').attr('class', 'con-ast-icon').attr('transform', 'scale(0.4167)');
    const astLines = [
      [12, 4, 12, 20],   // verticale
      [4, 12, 20, 12]    // horizontale
    ];
    astLines.forEach(([x1, y1, x2, y2]) => {
      astG.append('line')
        .attr('x1', x1 - 12).attr('y1', y1 - 12)
        .attr('x2', x2 - 12).attr('y2', y2 - 12)
        .attr('stroke', astColor)
        .attr('stroke-width', 1.4 / 0.4167)
        .attr('stroke-linecap', 'round');
    });
    addG.on('click', async (event) => {
      event.stopPropagation();
      await toggleBookmark(d.id);
      const nowBookmarked = !!d.bookmarked;
      // Actif = inversé : fond noir, "+" blanc
      addG.select('circle').attr('fill', nowBookmarked ? '#18181b' : '#ffffff');
      astG.selectAll('line').attr('stroke', nowBookmarked ? '#ffffff' : '#18181b');
      addG.style('opacity', nowBookmarked ? 1 : 0);
    });

    g.append('text')
      .attr('class', 'con-label')
      .attr('y', HALF + 12)
      .text(d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name);
  });

  // ── Interactions hover ──
  nodeEl
    .on('mouseenter', function(event, d) {
      const neighbors  = new Set();
      const connLinks  = new Set();
      links.forEach((l, i) => {
        const sid = l.source.id ?? l.source;
        const tid = l.target.id ?? l.target;
        if (sid === d.id || tid === d.id) {
          neighbors.add(sid === d.id ? tid : sid);
          connLinks.add(i);
        }
      });
      linksG.classed('con-has-hover', true);
      linkEl
        .classed('con-link-lit', (l, i) => connLinks.has(i))
        .attr('stroke-opacity', (l, i) => connLinks.has(i) ? 0.85 : 0.06);
      nodesG.classed('con-has-hover', true);
      nodeEl
        .classed('con-node-focus',    nd => nd.id === d.id)
        .classed('con-node-neighbor', nd => neighbors.has(nd.id));
      const haloColor = getVerbeBgColor(d.category) || '#9ca3af';
      nodeEl.style('filter', function(nd) {
        if (nd.id === d.id) return `drop-shadow(0 0 10px ${haloColor})`;
        if (neighbors.has(nd.id)) return `drop-shadow(0 0 5px ${haloColor}88)`;
        return null;
      });
      nodeEl.selectAll('text.con-label')
        .attr('opacity', function() {
          const nd = d3.select(this.parentNode).datum();
          return (neighbors.has(nd.id) || nd.id === d.id) ? 1 : 0;
        });
      nodeEl.selectAll('g.con-add-btn').style('opacity', function() {
        const nd = d3.select(this.parentNode).datum();
        // Visible au survol du nœud OU si l'objet est favori (reste fixe)
        return (nd.id === d.id || nd.bookmarked) ? 1 : 0;
      });
    })
    .on('mouseleave', function() {
      linksG.classed('con-has-hover', false);
      linkEl.classed('con-link-lit', false).attr('stroke-opacity', 0.38);
      nodesG.classed('con-has-hover', false);
      nodeEl.classed('con-node-focus', false).classed('con-node-neighbor', false);
      nodeEl.style('filter', null);
      nodeEl.selectAll('text.con-label').attr('opacity', 0);
      // Les favoris gardent leur bouton visible ; les autres le cachent
      nodeEl.selectAll('g.con-add-btn').style('opacity', function() {
        const nd = d3.select(this.parentNode).datum();
        return nd.bookmarked ? 1 : 0;
      });
    })
    .on('click', (event, d) => openDetail(d.id));

  // ── Labels de cluster (titre verbe en majuscules) ──
  // CRÉÉ EN DERNIER → rendu AU-DESSUS de tout (liens, halos, images)
  const labelsG = zoomLayer.append('g').attr('class', 'con-labels-group');

  // ── Drag nœuds — repositionner sans déclencher le pan ──
  const drag = d3.drag()
    // Filtre standard : bouton gauche, pas de Ctrl
    .filter(event => !event.ctrlKey && !event.button)
    .on('start', (event, d) => {
      // stopImmediatePropagation empêche d3.zoom de recevoir le même mousedown
      event.sourceEvent?.stopImmediatePropagation();
      if (!event.active) _conSim.alphaTarget(0.25).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on('end',   (event, d) => { if (!event.active) _conSim.alphaTarget(0); d.fx = null; d.fy = null; });
  nodeEl.call(drag);

  // ── D3 zoom — pan (glisser), zoom (molette / trackpad / slider) ──
  const INITIAL_SCALE = 1.15;  // plus zoomé au chargement (avant 0.75)
  const zoom = d3.zoom()
    .scaleExtent([0.08, 4])
    // Filtre : toujours accepter wheel ; pour mousedown, refuser les nœuds
    .filter(event => {
      if (event.type === 'wheel')      return true;
      if (event.type === 'touchstart') return true;
      if (event.type === 'mousedown') {
        if (event.button !== 0)       return false;
        if (event.target?.closest?.('.con-node')) return false; // nœud → drag
      }
      return !event.ctrlKey;
    })
    .on('start', (event) => {
      // Appliquer le curseur "main fermée" seulement pour un pan (pas wheel)
      if (event.sourceEvent?.type === 'mousedown') {
        canvas.classList.add('is-panning');
      }
    })
    .on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform);
      // Sync slider ↔ zoom (bidirectionnel)
      const slider = document.getElementById('conZoomSlider');
      if (slider) slider.value = Math.round(event.transform.k * 100);
    })
    .on('end', () => {
      canvas.classList.remove('is-panning');
    });

  svg.call(zoom)
     .on('dblclick.zoom', null); // désactiver le double-clic pour zoomer

  // Centrage initial : scale 0.75 centré sur le milieu du canvas
  // d3.zoomIdentity.translate(tx, ty).scale(k) satisfait :
  //   screen_x = tx + k * svg_x  →  pour (W/2, H/2) fixe : tx = W/2*(1-k)
  const INIT_K = INITIAL_SCALE;
  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(W / 2 * (1 - INIT_K), H / 2 * (1 - INIT_K)).scale(INIT_K)
  );

  // Stocker les références pour le slider externe
  _conZoom   = zoom;
  _conSvgSel = svg;

  // ── Simulation — grappes serrées ──
  const R_collide = HALF + 6;

  nodes.forEach(n => {
    if (n.x === undefined) n.x = W / 2 + (Math.random() - 0.5) * 200;
    if (n.y === undefined) n.y = H / 2 + (Math.random() - 0.5) * 200;
  });

  // Nœud-aimant répulsif invisible à la position de chaque titre de cluster
  // → les images s'écartent naturellement pour laisser le titre respirer.
  const TITLE_OFFSET = 90;
  const TITLE_SHIELD_X = 120; // demi-largeur de la zone protégée (label peut être long)
  const TITLE_SHIELD_Y = 55;  // demi-hauteur (label fait ~22px de haut)
  function titleRepulsion() {
    if (_conAffinityType !== 'intention') return;
    const clusterTitles = new Map();
    const groups = new Map();
    for (const n of nodes) {
      if (!n.category) continue;
      if (!groups.has(n.category)) groups.set(n.category, []);
      groups.get(n.category).push(n);
    }
    for (const [name, arr] of groups) {
      const cx = arr.reduce((s, n) => s + (n.x || 0), 0) / arr.length;
      const minY = arr.reduce((m, n) => Math.min(m, n.y || 0), Infinity);
      clusterTitles.set(name, { x: cx, y: minY - TITLE_OFFSET });
    }
    // Shield elliptique autour de chaque titre : les nœuds à l'intérieur sont éjectés
    for (const n of nodes) {
      for (const [, t] of clusterTitles) {
        const dx = n.x - t.x, dy = n.y - t.y;
        // Distance normalisée dans l'ellipse (≤ 1 = dans la zone protégée)
        const ndx = dx / TITLE_SHIELD_X;
        const ndy = dy / TITLE_SHIELD_Y;
        const nd = Math.hypot(ndx, ndy);
        if (nd < 1 && nd > 0) {
          // Pousse radialement hors de l'ellipse, force proportionnelle à la pénétration
          const push = (1 - nd) * 12;
          const len = Math.hypot(dx, dy) || 1;
          n.vx += (dx / len) * push;
          n.vy += (dy / len) * push;
        }
      }
    }
  }

  _conSim = d3.forceSimulation(nodes)
    // Liens courts (80) et forts (0.85) → les objets liés se collent
    .force('link',    d3.forceLink(links).id(d => d.id).distance(80).strength(0.85))
    // Répulsion faible (−80) + portée limitée → les nœuds acceptent la proximité
    .force('charge',  d3.forceManyBody().strength(-80).distanceMax(260))
    .force('center',  d3.forceCenter(W / 2, H / 2).strength(0.05))
    // Collision stricte — jamais de superposition totale des images
    .force('collide', d3.forceCollide(R_collide).strength(1))
    // Protection des titres de cluster (mode "intention")
    .force('titleShield', titleRepulsion)
    .alphaDecay(0.022)
    .velocityDecay(0.35)
    .on('tick', () => {
      linkEl.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeEl.attr('transform', d => `translate(${d.x},${d.y})`);
      // Halos + labels : uniquement quand l'affinité est "intention"
      if (_conAffinityType === 'intention') {
        haloEl.attr('cx', d => d.x).attr('cy', d => d.y);
        _updateClusterLabels(labelsG, nodes);
      }
    });
}

// ── Labels de cluster Constellation — Cormorant italique MAJUSCULES
//    Double rendu SVG pour effet halo : <text stroke="white" stroke-width="6"> sous
//    <text fill="darkVerbe">. Les lignes passant derrière semblent s'interrompre autour
//    des lettres sans rectangle de fond. Clic → bascule sur le verbe.
function _updateClusterLabels(labelsG, nodes) {
  const groups = new Map();
  for (const n of nodes) {
    if (!n.category) continue;
    if (!groups.has(n.category)) groups.set(n.category, []);
    groups.get(n.category).push(n);
  }
  const TITLE_OFFSET = 90;
  const clusters = Array.from(groups.entries())
    .filter(([_, arr]) => arr.length >= 1)
    .map(([name, arr]) => {
      const cx   = arr.reduce((s, n) => s + (n.x || 0), 0) / arr.length;
      const minY = arr.reduce((m, n) => Math.min(m, n.y || 0), Infinity);
      return { name, x: cx, y: minY - TITLE_OFFSET };
    });

  // Style typo commun aux deux couches (halo + fill)
  const applyTypo = (sel) => sel
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-family', "'Cormorant Garamond', Georgia, serif")
    .style('font-style', 'italic')
    .style('font-size', '22px')
    .style('font-weight', '400')
    .style('letter-spacing', '.02em')
    .style('text-transform', 'none')     // casse normale (première lettre maj)
    .style('paint-order', 'stroke fill');

  // Couche 1 : HALO — texte blanc épais qui découpe les liens passant derrière.
  // Unique <text> avec stroke blanc + fill blanc = forme pleine de la lettre épaissie.
  const bgColor = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#fafaf8';
  const haloSel = labelsG.selectAll('text.con-cluster-halo').data(clusters, d => d.name);
  const haloEnter = haloSel.enter().append('text').attr('class', 'con-cluster-halo')
    .attr('aria-hidden', 'true')
    .style('pointer-events', 'none');
  applyTypo(haloEnter);
  haloEnter.merge(haloSel)
    .attr('x', d => d.x).attr('y', d => d.y)
    .attr('stroke', bgColor)
    .attr('stroke-width', 8)
    .attr('stroke-linejoin', 'round')
    .attr('fill', bgColor)
    .text(d => d.name);
  haloSel.exit().remove();

  // Couche 2 : FILL — texte sombre couleur verbe, cliquable
  const fillSel = labelsG.selectAll('text.con-cluster-label').data(clusters, d => d.name);
  const fillEnter = fillSel.enter().append('text').attr('class', 'con-cluster-label')
    .style('cursor', 'pointer')
    .style('pointer-events', 'all');
  applyTypo(fillEnter);
  fillEnter.on('click', (e, d) => {
    e.stopPropagation();
    state.categoryFilter = d.name;
    state.attrFilters.subcat = [];
    if (state.view !== 'grid') setView('grid');
    buildCategoryFilterBar();
    buildIndexTrigger();
    pushBreadcrumb(d.name, () => {
      state.categoryFilter = d.name;
      buildCategoryFilterBar();
      render();
    });
    render();
  });
  fillEnter.merge(fillSel)
    .attr('x', d => d.x).attr('y', d => d.y)
    .style('fill', d => {
      const verbe = getVerbes().find(v => v.name === d.name);
      return _verbeActiveColor(verbe);
    })
    .text(d => d.name);
  fillSel.exit().remove();
}

// ══ NUÉE — Installation cinétique ═══════════════════════════════════════════
// Fond blanc, objets flottants avec vélocité, collisions murs + entre eux.
// Hover = boost de vitesse (x3), relâche = retour fluide.
// Moteur : requestAnimationFrame + element.style.transform (aucun state React).
// Pause automatique quand la fiche produit est ouverte.
// ══════════════════════════════════════════════════════════════════════════════

let _galleryItems = [];
let _galleryRafId = null;
let _nueeBodies = [];      // [{ el, x, y, vx, vy, w, h, rot, scale, boost }]
let _nueeViewport = null;
let _nueeZoom = 1;         // zoom visuel global (piloté par le slider) — appliqué à chaque carte

// Pose déterministe (rotation + scale stables par id, pour look varié)
function _galleryPose(id) {
  const hash = (seed) => [...(id || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, seed);
  const norm = (h) => (Math.abs(h) % 100000) / 100000;
  const rot = (norm(hash(97)) - 0.5) * 10;      // −5° à +5°
  const scale = 0.82 + norm(hash(173)) * 0.28;  // 0.82 à 1.10
  return { rot, scale };
}

function _gallerySize() { return 'g-md'; }

function _shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderGallery(filtered) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  // Stop previous parallax loop
  _galleryItems = [];
  if (_galleryRafId) { cancelAnimationFrame(_galleryRafId); _galleryRafId = null; }

  // Les notes ne sont plus affichées dans la Dérive — exclusivement des objets
  let items = (filtered || state.collections).filter(c => c.type !== 'note');

  // Shuffle si actif — réordonner selon l'ordre mémorisé ou en créer un nouveau
  if (state.galleryShuffled) {
    if (state._shuffleOrder && state._shuffleOrder.length) {
      // Réappliquer l'ordre mémorisé (filtre peut réduire le tableau)
      const idxMap = new Map(state._shuffleOrder.map((id, i) => [id, i]));
      items = [...items].sort((a, b) => (idxMap.get(a.id) ?? 9999) - (idxMap.get(b.id) ?? 9999));
    } else {
      items = _shuffleArray(items);
      state._shuffleOrder = items.map(c => c.id);
    }
  }

  // Mettre à jour le bouton shuffle
  const shuffleBtn = document.getElementById('deriveShuffleBtn');
  if (shuffleBtn) shuffleBtn.classList.toggle('active', state.galleryShuffled);
  if (!items.length) {
    grid.innerHTML = '<div class="gallery-empty">Aucun objet à afficher.</div>';
    return;
  }

  grid.classList.remove('g-has-hover');
  grid.innerHTML = '';

  items.forEach(c => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.id = c.id;
    item.dataset.cat = c.category || '';

    const pose = _galleryPose(c.id);
    item.style.setProperty('--nr', `${pose.rot}deg`);
    item.style.setProperty('--ns', pose.scale);

    const src = c.photos?.[0] ? photoUrl(c.photos[0]) : null;
    const bookmarkBtn = `<button class="card-bookmark-btn gallery-bookmark-btn${c.bookmarked ? ' bookmarked' : ''}" data-id="${c.id}" title="${c.bookmarked ? 'Retirer des favoris' : 'Coup de cœur'}">${_asteriskSVG()}</button>`;
    if (src) {
      const isPng = c.photos[0].toLowerCase().endsWith('.png') || c.photos[0].includes('detour');
      if (isPng) item.classList.add('g-detoured');
      item.innerHTML = `${bookmarkBtn}<img src="${src}" alt="${esc(c.name||'')}" draggable="false">`;
    } else {
      const bg = getVerbeBgColor(c.category);
      item.innerHTML = `${bookmarkBtn}<div class="gallery-ph" style="background:${bg}18">◻</div>`;
    }

    grid.appendChild(item);
    _galleryItems.push({ el: item, id: c.id, category: c.category || '', rot: pose.rot });
  });

  _bindGalleryEvents();
  // Démarre immédiatement la physique — les dimensions seront re-mesurées via les img.onload
  _initNueePhysics();
}

// ══ Moteur physique Nuée ═══════════════════════════════════════════════════
// Accès DOM direct via style.transform, aucun state React, ~60fps.
// Pause automatique quand #detailModal est ouvert.
// ═══════════════════════════════════════════════════════════════════════════
function _initNueePhysics() {
  const viewport = document.getElementById('galleryScroll');
  const surface  = document.getElementById('galleryGrid');
  if (!viewport || !surface) return;
  _nueeViewport = viewport;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  // Construire les corps physiques à partir des .gallery-item (hors notes)
  _nueeBodies = [];
  const nodes = surface.querySelectorAll('.gallery-item:not(.g-note)');
  nodes.forEach((el) => {
    // Taille réduite de moitié sur mobile pour que la nuée fonctionne dans un petit viewport
    const isMobile = window.innerWidth < 520;
    const w = isMobile ? 100 : 200, h = isMobile ? 100 : 200;
    const x = Math.random() * Math.max(10, vw - w);
    const y = Math.random() * Math.max(10, vh - h);
    // Vélocité de base augmentée avec plancher — aucun objet ne reste figé
    const MIN_V = 0.35;
    const rawVx = (Math.random() - 0.5) * 2.0;
    const rawVy = (Math.random() - 0.5) * 2.0;
    const vx = Math.abs(rawVx) < MIN_V ? (rawVx >= 0 ? MIN_V : -MIN_V) : rawVx;
    const vy = Math.abs(rawVy) < MIN_V ? (rawVy >= 0 ? MIN_V : -MIN_V) : rawVy;
    const rot   = parseFloat(el.style.getPropertyValue('--nr')) || 0;
    const scale = parseFloat(el.style.getPropertyValue('--ns')) || 1;
    const body = { el, x, y, vx, vy, w, h, rot, scale, boost: 1 };
    _nueeBodies.push(body);
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale * _nueeZoom})`;

    // Hover = boost ; mouseleave géré par le decay du tick
    el.addEventListener('mouseenter', () => { body.boost = 3.5; });
  });

  // Mesure la taille réelle de chaque body après que les images sont chargées
  const measureAll = () => {
    _nueeBodies.forEach((b) => {
      const r = b.el.getBoundingClientRect();
      if (r.width && r.height) { b.w = r.width; b.h = r.height; }
    });
  };
  // Deux passes : maintenant + après chargement des images
  measureAll();
  surface.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', measureAll, { once: true });
  });

  // Démarrer la boucle
  if (_galleryRafId) cancelAnimationFrame(_galleryRafId);
  _galleryRafId = requestAnimationFrame(_nueeTick);
}

function _nueeTick() {
  _galleryRafId = requestAnimationFrame(_nueeTick);
  if (!_nueeViewport || !_nueeBodies.length) return;
  // Pause quand la fiche produit est ouverte
  const detail = document.getElementById('detailModal');
  if (detail && detail.style.display !== 'none' && detail.style.display !== '') return;

  const vw = _nueeViewport.clientWidth  || window.innerWidth;
  const vh = _nueeViewport.clientHeight || window.innerHeight;
  const M  = 150;

  // 1. Avance chaque corps + wrap-around hors-champ (stable, simple)
  for (const b of _nueeBodies) {
    if (b.boost > 1) b.boost = Math.max(1, 1 + (b.boost - 1) * 0.94);

    b.x += b.vx * b.boost;
    b.y += b.vy * b.boost;

    // Wrap-around : sort d'un côté → réapparaît de l'autre
    if (b.x > vw + M)       b.x = -M;
    else if (b.x < -M)      b.x = vw + M;
    if (b.y > vh + M)       b.y = -M;
    else if (b.y < -M)      b.y = vh + M;
  }

  // 2. Collisions AABB entre paires — échange des vélocités
  const n = _nueeBodies.length;
  for (let i = 0; i < n; i++) {
    const a = _nueeBodies[i];
    for (let j = i + 1; j < n; j++) {
      const b = _nueeBodies[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x &&
          a.y < b.y + b.h && a.y + a.h > b.y) {
        // Échange des vélocités (rebond élastique simplifié)
        const tvx = a.vx, tvy = a.vy;
        a.vx = b.vx; a.vy = b.vy;
        b.vx = tvx;  b.vy = tvy;
        // Sépare légèrement pour éviter le collage
        const cxA = a.x + a.w / 2, cyA = a.y + a.h / 2;
        const cxB = b.x + b.w / 2, cyB = b.y + b.h / 2;
        const dx = cxA - cxB, dy = cyA - cyB;
        const mag = Math.hypot(dx, dy) || 1;
        const push = 0.6;
        a.x += (dx / mag) * push; a.y += (dy / mag) * push;
        b.x -= (dx / mag) * push; b.y -= (dy / mag) * push;
      }
    }
  }

  // 3. Applique au DOM (une seule écriture par corps) — scale = pose × zoom global
  for (const b of _nueeBodies) {
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rot}deg) scale(${b.scale * _nueeZoom})`;
  }
}

function _stopNueePhysics() {
  if (_galleryRafId) { cancelAnimationFrame(_galleryRafId); _galleryRafId = null; }
  _nueeBodies = [];
}

function _bindGalleryEvents() {
  _galleryItems.forEach(({ el, id }) => {
    el.addEventListener('click', (e) => {
      // Ignorer les clics sur le bouton bookmark (géré séparément)
      if (e.target.closest('.gallery-bookmark-btn')) return;
      openDetail(id);
    });
    const bmBtn = el.querySelector('.gallery-bookmark-btn');
    if (bmBtn) {
      bmBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleBookmark(id);
        // Mise à jour visuelle immédiate
        const col = state.collections.find(c => c.id === id);
        if (col) {
          bmBtn.classList.toggle('bookmarked', !!col.bookmarked);
          bmBtn.title = col.bookmarked ? 'Retirer des favoris' : 'Coup de cœur';
        }
      });
    }
  });
}

// ── Notes dans la Dérive Nuée : Drag & Drop + Édition + Suppression ──
// Réutilise les mêmes fonctions (openNoteModal, saveNote, deleteNote) que l'Inventaire
// → state partagé, sync automatique via render()
function _initGalleryNoteInteractions(grid, items) {
  let _dragNoteId = null;

  grid.querySelectorAll('.gallery-item.g-note').forEach(noteEl => {
    // Drag start — marquer la note comme en cours de drag
    noteEl.addEventListener('dragstart', e => {
      _dragNoteId = noteEl.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-note-id', _dragNoteId);
      requestAnimationFrame(() => noteEl.classList.add('note-dragging'));
    });
    noteEl.addEventListener('dragend', () => {
      noteEl.classList.remove('note-dragging');
      grid.querySelectorAll('.note-drop-after').forEach(t => t.classList.remove('note-drop-after'));
      _dragNoteId = null;
    });
    // Clic sur la note = ouvre la modale d'édition (comme en Inventaire)
    noteEl.addEventListener('click', e => {
      if (e.target.closest('.card-note-drag-handle')) return; // ignorer clic sur poignée
      if (!e.defaultPrevented) openNoteModal(noteEl.dataset.id);
    });
    // Bouton ··· = ouvre la modale
    noteEl.querySelector('.card-note-menu-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      openNoteModal(noteEl.dataset.id);
    });
  });

  // Drop targets : tous les gallery-item (objets + autres notes)
  // Indicateur unifié : ligne horizontale au-dessus ou en-dessous de la cible
  grid.querySelectorAll('.gallery-item').forEach(galItem => {
    galItem.addEventListener('dragover', e => {
      if (!_dragNoteId) return;
      if (galItem.dataset.id === _dragNoteId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = galItem.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;
      grid.querySelectorAll('.note-drop-above, .note-drop-below')
        .forEach(t => t.classList.remove('note-drop-above', 'note-drop-below'));
      galItem.classList.add(isAbove ? 'note-drop-above' : 'note-drop-below');
      galItem.dataset.dropPos = isAbove ? 'above' : 'below';
    });
    galItem.addEventListener('dragleave', () => {
      galItem.classList.remove('note-drop-above', 'note-drop-below');
      delete galItem.dataset.dropPos;
    });
    galItem.addEventListener('drop', async e => {
      if (!_dragNoteId) return;
      if (!e.dataTransfer.types.includes('application/x-note-id')) return;
      e.preventDefault();
      const dropPos = galItem.dataset.dropPos || 'below';
      galItem.classList.remove('note-drop-above', 'note-drop-below');
      delete galItem.dataset.dropPos;

      const dropTargetId = galItem.dataset.id;
      const itemIdx = items.findIndex(c => c.id === dropTargetId);
      let newPos;
      if (itemIdx >= 0 && items[itemIdx]?.type !== 'note') {
        newPos = dropPos === 'above' ? itemIdx : itemIdx + 1;
      } else {
        const targetNote = state.collections.find(c => c.id === dropTargetId && c.type === 'note');
        const pos = targetNote?.notePos ?? 0;
        newPos = dropPos === 'above' ? pos - 0.5 : pos + 0.5;
      }

      const note = state.collections.find(c => c.id === _dragNoteId);
      if (note) {
        note.notePos = newPos;
        try { await api.put(`/api/collections/${_dragNoteId}`, { notePos: newPos }); }
        catch(err) { console.warn('Gallery note drag save failed:', err); }
        render();
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// DIORAMA — Canvas interactif façon "Les Sims"
// L'utilisateur glisse des PNG détourés de sa bibliothèque sur des décors
// d'intérieurs historiques. Manipulation : move, resize, rotate, z-index.
// Pan+Zoom via D3 (même pattern que Constellation). Persistance localStorage.
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════
// DIORAMA — Gestionnaire de collection persistante (IndexedDB)
// 20 slots sauvegardés + 1 fond temporaire (URL.createObjectURL, non persisté).
// ══════════════════════════════════════════════════════════════════════════
const DIO_SLOT_COUNT = 20;
const DIO_DB_NAME = 'charchives_diorama_db';
const DIO_DB_VERSION = 1;
const DIO_STORE = 'slots';
let _dioDB = null;
const _dioSlotURLs = new Map();   // id → objectURL (libéré au déchargement)
let _dioTempURL = null;            // URL du fond temporaire courant

function _dioOpenDB() {
  if (_dioDB) return Promise.resolve(_dioDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DIO_DB_NAME, DIO_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DIO_STORE)) {
        db.createObjectStore(DIO_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { _dioDB = req.result; resolve(_dioDB); };
    req.onerror = () => reject(req.error);
  });
}
async function _dioSlotPut(id, blob) {
  const db = await _dioOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIO_STORE, 'readwrite');
    tx.objectStore(DIO_STORE).put({ id, blob, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function _dioSlotGet(id) {
  const db = await _dioOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIO_STORE, 'readonly');
    const req = tx.objectStore(DIO_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function _dioSlotDelete(id) {
  const db = await _dioOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIO_STORE, 'readwrite');
    tx.objectStore(DIO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function _dioSlotsAll() {
  const db = await _dioOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIO_STORE, 'readonly');
    const req = tx.objectStore(DIO_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Fabrique un objectURL pour un blob stocké, en le cachant le temps de la session
function _dioSlotURL(id, blob) {
  if (_dioSlotURLs.has(id)) return _dioSlotURLs.get(id);
  const url = URL.createObjectURL(blob);
  _dioSlotURLs.set(id, url);
  return url;
}

// Petite notification toast (design brutalisme, éphémère)
function _dioToast(msg) {
  let t = document.getElementById('dioToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'dioToast';
    t.className = 'dio-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Compat : legacy code référencait DIORAMA_DECORS (sélecteur statique). Conservé vide.
const DIORAMA_DECORS = [];

let _dioZoom = null;
let _dioSelectedItem = null;

function _dioLoad() {
  try { const s = localStorage.getItem('charchives_diorama'); if (s) state.diorama = JSON.parse(s); }
  catch(e) { /* ignore */ }
}
function _dioSave() {
  try { localStorage.setItem('charchives_diorama', JSON.stringify(state.diorama)); }
  catch(e) { /* ignore */ }
}

function renderDiorama() {
  // Injecte la description éditable
  const dioDescEl = document.getElementById('dioramaDesc');
  if (dioDescEl) dioDescEl.textContent = PAGE_DESCRIPTIONS.diorama || '';
  const decBar  = document.getElementById('dioDecorBar');
  const libList = document.getElementById('dioLibList');
  const scene   = document.getElementById('dioScene');
  const backdrop = document.getElementById('dioBackdrop');
  if (!decBar || !scene) return;

  // ── Gestionnaire de collection (20 slots persistés IndexedDB) ──
  if (!decBar.children.length) {
    _dioRenderDecorBar(decBar, backdrop);
  }

  // ── Sidebar bibliothèque (objets avec PNG) ──
  const pngItems = state.collections.filter(c =>
    c.type !== 'note' && c.type !== 'fragment' &&
    c.photos?.[0] && (c.photos[0].toLowerCase().endsWith('.png') || c.imageMode === 'cutout')
  );
  libList.innerHTML = '';
  const searchQ = (document.getElementById('dioSearch')?.value || '').toLowerCase().trim();
  const filtered = searchQ ? pngItems.filter(c => (c.name||'').toLowerCase().includes(searchQ)) : pngItems;
  filtered.forEach(c => {
    const el = document.createElement('div');
    el.className = 'diorama-lib-item';
    el.draggable = true;
    el.innerHTML = `<img src="${photoUrl(c.photos[0])}" alt="${esc(c.name||'')}"><div class="dio-lib-name">${esc(c.name||'')}</div>`;
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', c.id);
      e.dataTransfer.effectAllowed = 'copy';
      requestAnimationFrame(() => el.classList.add('dragging'));
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    libList.appendChild(el);
  });

  // Recherche live
  const searchInput = document.getElementById('dioSearch');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = '1';
    searchInput.addEventListener('input', () => renderDiorama());
  }

  // ── Rendu items placés ──
  _dioRenderItems(scene);

  // ── Drop zone ──
  const wrap = document.getElementById('dioSceneWrap');
  if (wrap && !wrap.dataset.dropBound) {
    wrap.dataset.dropBound = '1';
    wrap.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; wrap.classList.add('drag-over'); });
    wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
    wrap.addEventListener('drop', e => {
      e.preventDefault();
      wrap.classList.remove('drag-over');
      const colId = e.dataTransfer.getData('text/plain');
      if (!colId) return;
      // Convert screen coords → scene-local (D3 zoom inverse transform)
      const rect = wrap.getBoundingClientRect();
      let sx = e.clientX - rect.left;
      let sy = e.clientY - rect.top;
      if (_dioZoom) {
        const t = d3.zoomTransform(wrap);
        const inv = t.invert([sx, sy]);
        sx = inv[0]; sy = inv[1];
      }
      state.diorama.items.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        collectionId: colId,
        x: sx - 60, y: sy - 60,
        scale: 1, rotation: 0,
        zIndex: state.diorama.nextZ++
      });
      _dioSave();
      _dioRenderItems(scene);
    });
    // Deselect on scene click
    wrap.addEventListener('pointerdown', e => {
      if (!e.target.closest('.diorama-item')) {
        _dioDeselectAll(scene);
      }
    });
  }

  // ── D3 zoom ──
  _dioInitZoom(wrap);
}

async function _dioRenderDecorBar(decBar, backdrop /*, _unused */) {
  // Charge tous les slots depuis IndexedDB
  let slots = [];
  try { slots = await _dioSlotsAll(); } catch (e) { console.warn('IDB load failed:', e); }
  const slotMap = new Map(slots.map(s => [s.id, s]));

  // Construit la grille 20 slots + bouton "Tester un fond (temporaire)"
  decBar.innerHTML = '';
  decBar.classList.add('diorama-slot-grid');

  let firstFilledUrl = null, firstFilledId = null;

  for (let i = 0; i < DIO_SLOT_COUNT; i++) {
    const id = `slot${i + 1}`;
    const slot = slotMap.get(id);
    const cell = document.createElement('div');
    cell.className = 'dio-slot' + (slot ? ' filled' : ' empty');
    cell.dataset.slotId = id;

    if (slot && slot.blob) {
      const url = _dioSlotURL(id, slot.blob);
      if (!firstFilledUrl) { firstFilledUrl = url; firstFilledId = id; }
      const isActive = state.diorama.backdropSlotId === id;
      if (isActive) cell.classList.add('active');
      cell.innerHTML = `
        <img class="dio-slot-thumb" src="${url}" alt="${id}">
        <span class="dio-slot-label">SLOT ${i + 1}</span>
        <button class="dio-slot-del" title="Supprimer ce fond">×</button>`;
      cell.querySelector('.dio-slot-thumb').addEventListener('click', () => {
        state.diorama.backdropSlotId = id;
        _dioApplyBackdrop(url, `Slot ${i + 1}`, backdrop);
        decBar.querySelectorAll('.dio-slot, .dio-temp-btn').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
      });
      // Supprime le slot
      cell.querySelector('.dio-slot-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Supprimer le fond du slot ${i + 1} ?`)) return;
        await _dioSlotDelete(id);
        if (_dioSlotURLs.has(id)) { URL.revokeObjectURL(_dioSlotURLs.get(id)); _dioSlotURLs.delete(id); }
        _dioToast(`Slot ${i + 1} vidé`);
        _dioRenderDecorBar(decBar, backdrop);
      });
    } else {
      cell.innerHTML = `
        <label class="dio-slot-add" title="Ajouter un fond à ce slot">
          <span class="dio-slot-plus">+</span>
          <span class="dio-slot-label">SLOT ${i + 1}</span>
          <input type="file" accept="image/*" class="dio-slot-input" hidden>
        </label>`;
      const input = cell.querySelector('.dio-slot-input');
      input.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          await _dioSlotPut(id, file);
          _dioToast(`Image sauvegardée dans le slot ${i + 1}`);
          _dioRenderDecorBar(decBar, backdrop);
        } catch (err) {
          console.warn('IDB save failed:', err);
          alert('Impossible de sauvegarder : ' + err.message);
        }
      });
    }
    decBar.appendChild(cell);
  }

  // Bouton "Tester un fond (temporaire)" — séparé, design inversé
  const tempLabel = document.createElement('label');
  tempLabel.className = 'dio-temp-btn';
  tempLabel.innerHTML = `
    <span>TESTER UN FOND (TEMPORAIRE)</span>
    <input type="file" accept="image/*" class="dio-temp-input" hidden>`;
  tempLabel.querySelector('.dio-temp-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Révoque l'ancienne URL temporaire si existante
    if (_dioTempURL) URL.revokeObjectURL(_dioTempURL);
    _dioTempURL = URL.createObjectURL(file);
    state.diorama.backdropSlotId = null;  // fond temporaire = pas de slot
    _dioApplyBackdrop(_dioTempURL, 'Fond temporaire', backdrop);
    decBar.querySelectorAll('.dio-slot').forEach(c => c.classList.remove('active'));
    tempLabel.classList.add('active');
    _dioToast('Fond temporaire appliqué (non sauvegardé)');
  });
  decBar.appendChild(tempLabel);

  // Applique le fond initial : slot actif précédent > premier slot rempli > rien
  const activeSlot = state.diorama.backdropSlotId;
  if (activeSlot && slotMap.has(activeSlot)) {
    const url = _dioSlotURL(activeSlot, slotMap.get(activeSlot).blob);
    _dioApplyBackdrop(url, `Slot ${activeSlot.replace('slot', '')}`, backdrop);
  } else if (firstFilledUrl) {
    state.diorama.backdropSlotId = firstFilledId;
    _dioApplyBackdrop(firstFilledUrl, `Slot ${firstFilledId.replace('slot', '')}`, backdrop);
    decBar.querySelector(`[data-slot-id="${firstFilledId}"]`)?.classList.add('active');
  } else {
    // Aucun slot rempli — fond vide, message dans le canvas
    state.diorama.backdropSlotId = null;
    backdrop.removeAttribute('src');
    _dioUpdateCredits('');
  }
}

// Applique une URL comme fond du Diorama + persiste la sélection (pas le fichier)
function _dioApplyBackdrop(url, credit, backdropEl) {
  state.diorama.backdrop = url;
  state.diorama.backdropCredit = credit || '';
  if (backdropEl) backdropEl.src = url;
  _dioUpdateCredits(credit || '');
  _dioSave();
}

function _dioUpdateCredits(text) {
  const scene = document.getElementById('dioScene');
  if (!scene) return;
  let el = scene.querySelector('.diorama-credit');
  if (!el) {
    el = document.createElement('div');
    el.className = 'diorama-credit';
    scene.appendChild(el);
  }
  el.textContent = text || '';
  el.style.display = text ? '' : 'none';
}

function _dioRenderItems(scene) {
  // Diff-based: add missing, remove stale, update positions
  const existing = new Map();
  scene.querySelectorAll('.diorama-item').forEach(el => existing.set(el.dataset.dioId, el));

  state.diorama.items.forEach(item => {
    const col = state.collections.find(c => c.id === item.collectionId);
    if (!col || !col.photos?.[0]) return;
    let el = existing.get(item.id);
    if (!el) {
      // Create new
      el = document.createElement('div');
      el.className = 'diorama-item';
      el.dataset.dioId = item.id;
      el.innerHTML = `
        <img src="${photoUrl(col.photos[0])}" alt="${esc(col.name||'')}" draggable="false">
        <div class="dio-handle dio-handle-nw"></div>
        <div class="dio-handle dio-handle-ne"></div>
        <div class="dio-handle dio-handle-sw"></div>
        <div class="dio-handle dio-handle-se"></div>
        <div class="dio-handle-rot"></div>`;
      scene.appendChild(el);
      _dioMakeMovable(el, item);
      _dioMakeResizable(el, item);
      _dioMakeRotatable(el, item);
      el.addEventListener('pointerdown', e => {
        if (e.target.closest('.dio-handle, .dio-handle-rot')) return;
        item.zIndex = state.diorama.nextZ++;
        el.style.zIndex = item.zIndex;
        _dioSelectItem(scene, el);
        _dioSave();
      });
      // Double-click = remove
      el.addEventListener('dblclick', e => {
        e.stopPropagation();
        state.diorama.items = state.diorama.items.filter(i => i.id !== item.id);
        el.remove();
        _dioSave();
      });
    }
    // Update transform
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = Math.round(120 * item.scale) + 'px';
    el.style.transform = `rotate(${item.rotation}deg)`;
    el.style.zIndex = item.zIndex;
    existing.delete(item.id);
  });
  // Remove stale
  existing.forEach(el => el.remove());
}

function _dioSelectItem(scene, el) {
  scene.querySelectorAll('.diorama-item').forEach(i => i.classList.remove('dio-selected'));
  el.classList.add('dio-selected');
  _dioSelectedItem = el;
}
function _dioDeselectAll(scene) {
  scene.querySelectorAll('.diorama-item').forEach(i => i.classList.remove('dio-selected'));
  _dioSelectedItem = null;
}

function _dioMakeMovable(el, item) {
  let startX, startY, origX, origY;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.dio-handle, .dio-handle-rot')) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY;
    origX = item.x; origY = item.y;
    const zoomK = _dioZoom ? d3.zoomTransform(document.getElementById('dioSceneWrap')).k : 1;
    const onMove = ev => {
      item.x = origX + (ev.clientX - startX) / zoomK;
      item.y = origY + (ev.clientY - startY) / zoomK;
      el.style.left = item.x + 'px';
      el.style.top = item.y + 'px';
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      _dioSave();
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  });
}

function _dioMakeResizable(el, item) {
  el.querySelectorAll('.dio-handle').forEach(handle => {
    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const startDist = _dioDistFromCenter(el, e);
      const origScale = item.scale;
      const onMove = ev => {
        const dist = _dioDistFromCenter(el, ev);
        item.scale = Math.max(0.15, Math.min(5, origScale * (dist / startDist)));
        el.style.width = Math.round(120 * item.scale) + 'px';
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        _dioSave();
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  });
}

function _dioMakeRotatable(el, item) {
  const rotHandle = el.querySelector('.dio-handle-rot');
  if (!rotHandle) return;
  rotHandle.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    rotHandle.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const origRot = item.rotation;
    const onMove = ev => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
      item.rotation = origRot + (angle - startAngle);
      el.style.transform = `rotate(${item.rotation}deg)`;
    };
    const onUp = () => {
      rotHandle.removeEventListener('pointermove', onMove);
      rotHandle.removeEventListener('pointerup', onUp);
      _dioSave();
    };
    rotHandle.addEventListener('pointermove', onMove);
    rotHandle.addEventListener('pointerup', onUp);
  });
}

function _dioDistFromCenter(el, e) {
  const r = el.getBoundingClientRect();
  return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
}

function _dioInitZoom(wrap) {
  if (!window.d3 || _dioZoom) return;
  const scene   = document.getElementById('dioScene');
  const bdrop   = document.getElementById('dioBackdrop');

  // Calcule le zoom minimum pour que le décor couvre 100% du viewport (style cover)
  function minScale() {
    const vw = wrap.clientWidth  || 800;
    const vh = wrap.clientHeight || 600;
    const iw = bdrop?.naturalWidth  || 1200;
    const ih = bdrop?.naturalHeight || 800;
    // cover = max(vw/iw, vh/ih) → le plus petit zoom autorisé
    return Math.max(vw / iw, vh / ih, 0.3);
  }

  _dioZoom = d3.zoom()
    .scaleExtent([0.3, 4])  // sera contraint dynamiquement dans on('zoom')
    .filter(event => {
      if (event.type === 'wheel') return true;
      if (event.type === 'touchstart') return true;
      if (event.type === 'mousedown') {
        if (event.button !== 0) return false;
        if (event.target.closest('.diorama-item')) return false;
      }
      return !event.ctrlKey;
    })
    .on('zoom', event => {
      let { x, y, k } = event.transform;
      const ms = minScale();
      k = Math.max(k, ms);

      // Contraintes de pan : le décor ne sort jamais du viewport
      const vw = wrap.clientWidth;
      const vh = wrap.clientHeight;
      const iw = (bdrop?.naturalWidth  || 1200) * k;
      const ih = (bdrop?.naturalHeight || 800)  * k;
      // x doit rester entre -(iw - vw) et 0 (le décor couvre toujours le viewport)
      x = Math.min(0, Math.max(x, vw - iw));
      y = Math.min(0, Math.max(y, vh - ih));

      scene.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
      // Synchronise le transform D3 réel pour que le prochain événement parte du bon état
      event.transform.x = x;
      event.transform.y = y;
      event.transform.k = k;
    });
  d3.select(wrap).call(_dioZoom);

  // Quand le décor change d'image, recalcule et applique le minScale initial
  bdrop?.addEventListener('load', () => {
    const ms = minScale();
    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    d3.select(wrap).call(_dioZoom.transform, d3.zoomIdentity.translate(0, 0).scale(ms));
  });
  // Applique le zoom initial si l'image est déjà chargée
  if (bdrop?.complete && bdrop.naturalWidth) {
    const ms = minScale();
    d3.select(wrap).call(_dioZoom.transform, d3.zoomIdentity.translate(0, 0).scale(ms));
  }
}

function _initGalleryParallax() {
  // Parallax désactivé en mode colonnes masonry — translateY crée des marges visibles
  return;
  _galleryScrollEl = document.getElementById('galleryScroll');
  if (!_galleryScrollEl) return;
  // Remove any previous listener then re-attach
  _galleryScrollEl.removeEventListener('scroll', _onGalleryScroll);
  _galleryScrollEl.addEventListener('scroll', _onGalleryScroll, { passive: true });
  // Run once to position images at load
  _onGalleryScroll();
}

function _onGalleryScroll() {
  if (_galleryRafId) return;
  _galleryRafId = requestAnimationFrame(() => {
    _galleryRafId = null;
    if (!_galleryScrollEl) return;
    const scrollTop  = _galleryScrollEl.scrollTop;
    const vpH        = _galleryScrollEl.clientHeight;
    const vpMid      = scrollTop + vpH / 2;

    _galleryItems.forEach(({ el, span }) => {
      const img = el.firstElementChild;
      if (!img) return;
      // Distance of item center from viewport center (in px)
      const itemMid = el.offsetTop + el.offsetHeight / 2;
      const dist    = itemMid - vpMid;
      // Large items (span 3) = slow (depth illusion), small = slightly faster
      const speed   = span === 3 ? 0.012 : span === 2 ? 0.020 : 0.030;
      const offset  = dist * speed; // subtle drift: ±4–10px max
      img.style.transform = `translateY(${offset}px)`;
    });
  });
}

// ── Mini calendar state ─────────────────────────────────────────────────────
let _calMiniYear = new Date().getFullYear();
let _calMiniData = {}; // { 'YYYY-MM': count }

// ── Calendrier : frise horizontale ────────────────────────────────────────────
function renderCalendar(filtered) {
  const track = document.getElementById('calHorizTrack');
  if (!track) return;

  const items = filtered || state.collections;

  // Group by YYYY-MM
  const byMonth = {};
  items.forEach(c => {
    const raw = state.calDateType === 'dateAchat'
      ? (c.private?.dateAchat || '')
      : (c.createdAt || c.date || '');
    if (!raw || raw.length < 7) return;
    const key = raw.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(c);
  });

  // Update mini-calendar data
  _calMiniData = {};
  Object.entries(byMonth).forEach(([k, v]) => { _calMiniData[k] = v.length; });
  const popup = document.getElementById('calMiniPopup');
  if (popup && popup.style.display !== 'none') renderCalMiniPopup();

  const monthKeys = Object.keys(byMonth).sort();
  if (!monthKeys.length) {
    const hint = state.calDateType === 'dateAchat'
      ? 'Renseignez une <strong>date d\'acquisition</strong> (onglet Privé) dans les fiches pour les faire apparaître ici.'
      : 'Renseignez une <strong>date d\'ajout</strong> dans les fiches pour les faire apparaître ici.';
    track.innerHTML = `<div class="cal-h-empty">Aucun objet avec une date valide.<br>${hint}</div>`;
    return;
  }

  // Generate all months from first to last (including empty months)
  let [fy, fm] = monthKeys[0].split('-').map(Number);
  const [ly, lm] = monthKeys[monthKeys.length - 1].split('-').map(Number);
  const allMonths = [];
  while (fy < ly || (fy === ly && fm <= lm)) {
    allMonths.push(`${fy}-${String(fm).padStart(2, '0')}`);
    fm++;
    if (fm > 12) { fm = 1; fy++; }
  }

  track.innerHTML = allMonths.map(key => {
    const [y, m] = key.split('-');
    const monthLabel = `${MONTHS[parseInt(m) - 1]} ${y}`;
    const monthItems = byMonth[key] || [];

    const thumbsHTML = monthItems.map(c => {
      const src = c.photos?.[0] ? photoUrl(c.photos[0]) : null;
      if (src) {
        return `<img class="cal-h-thumb" src="${src}" alt="${esc(c.name || '')}" data-id="${c.id}" title="${esc(c.name || '')}">`;
      }
      return `<div class="cal-h-placeholder" data-id="${c.id}" title="${esc(c.name || '')}">◻</div>`;
    }).join('');

    return `<div class="cal-h-col" id="cal-h-col-${key}">
      <div class="cal-h-col-items">${thumbsHTML}</div>
      <div class="cal-h-col-label">${monthLabel}</div>
    </div>`;
  }).join('');

  track.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
  });
}

function renderCalMiniPopup() {
  const yearLabel = document.getElementById('calMiniYearLabel');
  if (yearLabel) yearLabel.textContent = _calMiniYear;

  const allYears = [...new Set(Object.keys(_calMiniData).map(k => parseInt(k.slice(0, 4))))].sort((a, b) => a - b);
  const minYear = allYears[0] ?? _calMiniYear;
  const maxYear = allYears[allYears.length - 1] ?? _calMiniYear;
  const prevBtn = document.getElementById('calMiniPrevYear');
  const nextBtn = document.getElementById('calMiniNextYear');
  if (prevBtn) prevBtn.disabled = _calMiniYear <= minYear;
  if (nextBtn) nextBtn.disabled = _calMiniYear >= maxYear;

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthsEl = document.getElementById('calMiniMonths');
  if (!monthsEl) return;
  monthsEl.innerHTML = MONTHS.map((name, i) => {
    const key = `${_calMiniYear}-${String(i + 1).padStart(2, '0')}`;
    const count = _calMiniData[key] || 0;
    const hasItems = count > 0;
    const isCurrent = key === currentKey;
    return `<button class="cal-mini-month-btn${hasItems ? ' has-items' : ''}${isCurrent ? ' current-month' : ''}" data-key="${key}">
      ${name}${hasItems ? `<span class="cal-mini-month-count">${count}</span>` : ''}
    </button>`;
  }).join('');

  monthsEl.querySelectorAll('.cal-mini-month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = document.getElementById(`cal-h-col-${btn.dataset.key}`);
      if (col) {
        const scroll = document.getElementById('calHorizScroll');
        if (scroll) scroll.scrollTo({ left: col.offsetLeft - 56, behavior: 'smooth' });
        else col.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }
      document.getElementById('calMiniPopup').style.display = 'none';
      document.getElementById('calJumpBtn')?.classList.remove('active');
    });
  });
}

function bindCalendarEvents() {
  const sel = document.getElementById('calDateTypeSelect');
  if (sel) sel.addEventListener('change', e => { state.calDateType = e.target.value; render(); });

  const jumpBtn = document.getElementById('calJumpBtn');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', e => {
      e.stopPropagation();
      const popup = document.getElementById('calMiniPopup');
      if (!popup) return;
      const isVisible = popup.style.display !== 'none';
      popup.style.display = isVisible ? 'none' : '';
      jumpBtn.classList.toggle('active', !isVisible);
      if (!isVisible) {
        const dataYears = Object.keys(_calMiniData).map(k => parseInt(k.slice(0, 4)));
        _calMiniYear = dataYears.length ? Math.min(...dataYears) : new Date().getFullYear();
        renderCalMiniPopup();
      }
    });
  }

  document.getElementById('calMiniPrevYear')?.addEventListener('click', e => {
    e.stopPropagation(); _calMiniYear--; renderCalMiniPopup();
  });
  document.getElementById('calMiniNextYear')?.addEventListener('click', e => {
    e.stopPropagation(); _calMiniYear++; renderCalMiniPopup();
  });

  // Close popup on outside click
  document.addEventListener('click', e => {
    const popup = document.getElementById('calMiniPopup');
    const btn = document.getElementById('calJumpBtn');
    if (popup && popup.style.display !== 'none' && !popup.contains(e.target) && e.target !== btn) {
      popup.style.display = 'none';
      btn?.classList.remove('active');
    }
  });
}

// ── Catalogue view ─────────────────────────────────────────────────────────────
function renderCatalogue(items) {
  const el = document.getElementById('catalogueContent');
  const count = document.getElementById('catalogueCountLabel');
  count.textContent = `${items.length} objet${items.length!==1?'s':''}`;
  if (!items.length) { el.innerHTML='<div class="empty-state">Aucun objet.</div>'; return; }

  const groups = new Map();
  getCategoryOrder().forEach(c=>groups.set(c,[]));
  groups.set('',[]);
  items.forEach(c=>{ const k=c.category||''; if(!groups.has(k))groups.set(k,[]); groups.get(k).push(c); });

  let html='';
  groups.forEach((cards,cat)=>{
    if (!cards.length) return;
    const color=getCategoryColor(cat)||'var(--border-strong)';
    html+=`<div class="cat-group" data-cat="${esc(cat)}">
      <div class="cat-group-header" style="border-left:4px solid ${color}">
        <label class="cat-group-check-label">
          <input type="checkbox" class="cat-group-checkbox" data-cat="${esc(cat)}">
          ${esc(cat||'Sans catégorie')}
        </label>
        <span class="category-count">${cards.length}</span>
      </div>
      <div class="catalogue-rows">`;
    cards.forEach(c=>{
      const thumb=c.photos?.[0]?`<img src="${photoUrl(c.photos[0])}" alt="">`:
        `<div class="cat-row-placeholder">◻</div>`;
      const statusColor=STATUS_COLORS[c.itemStatus]||'#9ca3af';
      const sub=(c.subcategory&&c.subcategory!=='Autre'?c.subcategory:c.subcategoryCustom)||'';
      html+=`<div class="cat-row" data-id="${c.id}">
        <input type="checkbox" class="cat-row-check" data-id="${c.id}">
        <div class="cat-row-thumb">${thumb}</div>
        <div class="cat-row-info">
          <div class="cat-row-name">${esc(c.name)}</div>
          ${sub?`<div class="cat-row-sub">${esc(sub)}</div>`:''}
        </div>
        <div class="cat-row-right">
          ${c.price!=null&&c.price!==''?`<div class="cat-row-price">${c.price} €</div>`:''}
          <div class="cat-row-status" style="color:${statusColor}">${esc(c.itemStatus||'—')}</div>
        </div>
      </div>`;
    });
    html+='</div></div>';
  });
  el.innerHTML=html;

  el.querySelectorAll('.cat-row').forEach(row=>{
    row.addEventListener('click',e=>{
      if(e.target.type==='checkbox') return;
      openDetail(row.dataset.id);
    });
  });

  el.querySelectorAll('.cat-group-checkbox').forEach(cb=>{
    cb.addEventListener('change',()=>{
      const group=cb.closest('.cat-group');
      group.querySelectorAll('.cat-row-check').forEach(c=>c.checked=cb.checked);
    });
  });
}

function catalogueSelectAll(checked) {
  document.querySelectorAll('.cat-row-check,.cat-group-checkbox').forEach(c=>c.checked=checked);
}

function cataloguePrint() {
  const selected=new Set([...document.querySelectorAll('.cat-row-check:checked')].map(c=>c.dataset.id));
  if (!selected.size) { alert('Sélectionnez au moins un objet.'); return; }
  const items=state.collections.filter(c=>selected.has(c.id));
  const groups=new Map();
  getCategoryOrder().forEach(c=>groups.set(c,[]));
  groups.set('',[]);
  items.forEach(c=>{ const k=c.category||''; if(!groups.has(k))groups.set(k,[]); groups.get(k).push(c); });

  let body='';
  groups.forEach((cards,cat)=>{
    if(!cards.length) return;
    const color=getCategoryColor(cat)||'#333';
    body+=`<h2 style="border-left:4px solid ${color};padding-left:10px;margin:24px 0 12px;font-size:15px">${esc(cat||'Sans catégorie')}</h2>`;
    cards.forEach(c=>{
      const thumb=c.photos?.[0]?`<img src="${photoUrl(c.photos[0])}" style="width:80px;height:80px;object-fit:cover;border-radius:4px">`:
        `<div style="width:80px;height:80px;background:#f0ede8;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#aaa">◻</div>`;
      const sub=(c.subcategory&&c.subcategory!=='Autre'?c.subcategory:c.subcategoryCustom)||'';
      const attrs=Object.values(c.attributes||{}).flat().filter(Boolean).join(', ');
      body+=`<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #e5e3df;break-inside:avoid">
        ${thumb}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px">${esc(c.name)}</div>
          ${sub?`<div style="font-size:11px;color:#6b6760">${esc(sub)}</div>`:''}
          ${c.description?`<div style="font-size:12px;color:#6b6760;margin-top:4px">${esc(c.description).replace(/\n/g,'<br>')}</div>`:''}
          ${attrs?`<div style="font-size:11px;color:#9e9b96;margin-top:4px">${esc(attrs)}</div>`:''}
        </div>
        <div style="text-align:right;white-space:nowrap">
          ${c.price!=null&&c.price!==''?`<div style="font-weight:600;font-size:13px">${c.price} €</div>`:''}
          <div style="font-size:11px;color:#6b6760;margin-top:4px">${esc(c.itemStatus||'')}</div>
        </div>
      </div>`;
    });
  });

  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Catalogue Brocante</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1917;padding:24px;max-width:800px;margin:auto}@page{margin:1.5cm}</style>
    </head><body>
    <h1 style="font-size:18px;margin-bottom:4px">Catalogue</h1>
    <p style="font-size:11px;color:#9e9b96;margin-bottom:24px">${new Date().toLocaleDateString('fr-FR')} · ${items.length} objet${items.length!==1?'s':''}</p>
    ${body}</body></html>`);
  win.document.close();
  setTimeout(()=>win.print(),400);
}

// ── Timeline ───────────────────────────────────────────────────────────────────
function renderTimeline(items) {
  const mode = state.tlMode || 'chrono';
  document.querySelectorAll('.tl-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

  const chronoScroll = document.getElementById('tlChronoScroll');
  const wrap = document.getElementById('timelineWrap');
  let origineView = document.getElementById('tlOrigineView');

  if (mode === 'origine') {
    chronoScroll.style.display = 'none';
    wrap.style.display = 'none';
    if (!origineView) {
      origineView = document.createElement('div');
      origineView.id = 'tlOrigineView';
      origineView.className = 'tl-origine-view';
      document.getElementById('timelineView').appendChild(origineView);
    }
    origineView.style.display = '';
    _renderTimelineOrigine(items, origineView);
    return;
  }

  if (origineView) origineView.style.display = 'none';
  wrap.style.display = 'none';
  chronoScroll.style.display = '';

  // ── Chrono mode : axe vertical alterné ──────────────────────────────────────
  const sorted = [...items].sort((a,b) => (a.createdAt||a.date||'').localeCompare(b.createdAt||b.date||''));
  const el = document.getElementById('tlChronoItems');

  if (!sorted.length) {
    el.innerHTML = `<div class="tl-none-label">Aucun objet à afficher sur cette frise.</div>`;
    return;
  }

  // Group by month (YYYY-MM)
  const groups = [];
  let lastKey = null;
  sorted.forEach(c => {
    const raw = c.createdAt || c.date || '';
    const key = raw.slice(0, 7); // YYYY-MM
    if (key !== lastKey) {
      groups.push({ key, items: [] });
      lastKey = key;
    }
    groups[groups.length - 1].items.push(c);
  });

  // Populate jump select
  const jumpSel = document.getElementById('tlJumpSelect');
  if (jumpSel) {
    jumpSel.innerHTML = '<option value="">Aller à…</option>';
    groups.forEach(({ key }) => {
      let label = key;
      if (key && key.length >= 7) {
        const [y, m] = key.split('-');
        label = `${MONTHS_FULL[parseInt(m) - 1] || m} ${y}`;
      }
      const opt = document.createElement('option');
      opt.value = `tl-sep-${key}`;
      opt.textContent = label;
      jumpSel.appendChild(opt);
    });
    jumpSel.onchange = () => {
      if (!jumpSel.value) return;
      const target = document.getElementById(jumpSel.value);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      jumpSel.value = '';
    };
  }

  let html = '';
  let globalIdx = 0; // for left/right alternation across months

  groups.forEach(({ key, items: groupItems }) => {
    // Month/year separator
    let sepLabel = '—';
    if (key && key.length >= 7) {
      const [y, m] = key.split('-');
      const mNum = parseInt(m) - 1;
      sepLabel = `${MONTHS_FULL[mNum] || m} ${y}`;
    }
    html += `<div class="tl-sep" id="tl-sep-${key}"><span class="tl-sep-label">${sepLabel}</span></div>`;

    groupItems.forEach(c => {
      const isLeft = (globalIdx % 2 === 0);
      globalIdx++;
      const bg = getVerbeBgColor(c.category);
      const fg = getVerbeTextColor(c.category);
      const imgHTML = c.photos?.[0]
        ? `<img class="tl-card-img" src="${photoUrl(c.photos[0])}" alt="">`
        : `<div class="tl-card-img-placeholder">◻</div>`;
      const pillHTML = c.category
        ? `<span class="tl-card-pill" style="background:${bg};color:${fg}">${esc(c.category)}</span>`
        : '';
      const card = `<div class="tl-card" data-id="${c.id}">
        ${imgHTML}
        <div class="tl-card-body">
          <div class="tl-card-name">${esc(c.name)}</div>
          ${pillHTML}
        </div>
      </div>`;

      html += `<div class="tl-card-row">
        <div class="tl-card-slot-left">${isLeft ? card : ''}</div>
        <div class="tl-card-center">
          <div class="tl-card-dot" style="background:${bg}"></div>
        </div>
        <div class="tl-card-slot-right">${!isLeft ? card : ''}</div>
      </div>`;
    });
  });

  el.innerHTML = html;
  el.querySelectorAll('.tl-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

function _renderTimelineOrigine(items, container) {
  // Période = première valeur de attributes.origine (sinon "Sans période")
  const PERIODE_ORDER = [
    'Antiquité','Moyen Âge','Renaissance','XVIe siècle','XVIIe siècle','XVIIIe siècle',
    'XIXe siècle','Empire','Napoléon III','Belle Époque','Art nouveau','Art déco','Bauhaus',
    'Années 40-50','Années 60-70','Années 80-90','Contemporain','Création','Sans période'
  ];
  const groups = {};
  items.forEach(c => {
    const orig = (c.attributes?.origine || []);
    const période = orig.length > 0 ? orig[0] : 'Sans période';
    if (!groups[période]) groups[période] = [];
    groups[période].push(c);
  });
  // Sort groups by canonical period order
  const sorted = Object.keys(groups).sort((a, b) => {
    const ia = PERIODE_ORDER.indexOf(a), ib = PERIODE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });
  if (sorted.length === 0) {
    container.innerHTML = `<div class="tl-none-label">Aucun objet à afficher sur cette frise.</div>`; return;
  }
  container.innerHTML = sorted.map(période => {
    const chips = groups[période].map(c => {
      const bg = getVerbeBgColor(c.category);
      return `<span class="tl-origine-chip" data-id="${c.id}">
        <span class="tl-origine-chip-dot" style="background:${bg}"></span>
        ${esc(c.name)}
      </span>`;
    }).join('');
    return `<div class="tl-origine-group">
      <div class="tl-origine-axis"><span class="tl-origine-label">${esc(période)}</span></div>
      <div class="tl-origine-items">${chips}</div>
    </div>`;
  }).join('');
  container.querySelectorAll('.tl-origine-chip').forEach(chip =>
    chip.addEventListener('click', () => openDetail(chip.dataset.id)));
}

function positionFloatPreview() {} // plus utilisé

function applyTLTransform() {
  const inner = document.getElementById('timelineInner'); if (!inner) return;
  inner.style.transform = `translate(${TL.panX}px,${TL.panY}px) scale(${TL.zoom})`;
}

function initTimelineZoom() {
  // Zoom/pan désactivé — nouvelle frise verticale avec scroll natif
}

// ── Detail Modal — Vue Portrait éditoriale ────────────────────────────────────
function openDetail(id) {
  const c = state.collections.find(x => x.id === id); if (!c) return;
  state.detailCurrentId = id;
  const list = state.detailList.length ? state.detailList : state.collections;
  const pos  = list.findIndex(x => x.id === id);
  const total = list.length;
  document.getElementById('detailNavPos').textContent = `${pos+1} / ${total}`;
  document.getElementById('detailPrev').style.visibility = total > 1 ? 'visible' : 'hidden';
  document.getElementById('detailNext').style.visibility = total > 1 ? 'visible' : 'hidden';
  document.getElementById('detailTitle').textContent = c.name;

  const body      = document.getElementById('detailBody');
  const bgColor   = getVerbeBgColor(c.category);
  const fgColor   = getVerbeTextColor(c.category);
  const statusColor = STATUS_COLORS[c.itemStatus] || '#9ca3af';
  const sub = (c.subcategory && c.subcategory !== 'Autre' ? c.subcategory : c.subcategoryCustom) || '';
  const photos = c.photos || [];

  // ── Photo column ──
  const mainPhotoHTML = photos.length > 0
    ? `<img src="${photoUrl(photos[0])}" alt="" data-idx="0" class="portrait-main-img" style="cursor:zoom-in">`
    : `<div class="portrait-no-photo">◻</div>`;
  const thumbsHTML = photos.length > 1
    ? `<div class="portrait-thumbs">${photos.map((p,i) =>
        `<img src="${photoUrl(p)}" alt="" data-idx="${i}" class="portrait-thumb${i===0?' active':''}">`).join('')}</div>`
    : '';

  // ── Attributes — respect attributeSectionsOrder ──
  const order = (state.settings.attributeSectionsOrder?.length)
    ? state.settings.attributeSectionsOrder
    : ['origine', ['etat_traces','taille'], 'usage', {group:'Matière & Apparence'}, 'matieres', ['couleurs','motifs']];
  const attrKeys = [];
  order.forEach(entry => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && entry.group) return;
    if (Array.isArray(entry)) entry.forEach(k => attrKeys.push(k));
    else attrKeys.push(entry);
  });
  const attrs = c.attributes || {};
  const attrRowsHTML = attrKeys.map(k => {
    const vals = attrs[k];
    if (!vals || (Array.isArray(vals) ? vals.length === 0 : !vals)) return '';
    const label = ATTRIBUTES_DEF[k]?.label || k;
    const arr = Array.isArray(vals) ? vals : [vals];
    return `<div class="portrait-attr-row">
      <span class="portrait-attr-label">${esc(label)}</span>
      <div class="portrait-attr-pills">${arr.filter(Boolean).map(v=>`<span class="portrait-attr-pill">${esc(v)}</span>`).join('')}</div>
    </div>`;
  }).filter(Boolean).join('');

  // Label dynamique depuis Paramètres (tombe sur "Atmosphère" par défaut si non défini)
  const universLabel = state.settings.attributeLabels?.univers || 'Atmosphère';
  const universHTML = (c.univers||[]).length
    ? `<div class="portrait-attr-row"><span class="portrait-attr-label">${esc(universLabel)}</span>
        <div class="portrait-attr-pills">${(c.univers||[]).map(u=>`<span class="portrait-attr-pill portrait-pill-univers">${esc(u)}</span>`).join('')}</div>
       </div>` : '';
  const kwHTML = (c.keywords||[]).length
    ? `<div class="portrait-attr-row"><span class="portrait-attr-label">Tags</span>
        <div class="portrait-attr-pills">${(c.keywords||[]).map(k=>`<span class="portrait-attr-pill">${esc(k)}</span>`).join('')}</div>
       </div>` : '';

  // ── Header pills ──
  // Verbe : italique flottant, sans fond — cohérent avec les cartes
  const verbePill = c.category
    ? `<span class="portrait-verbe-pill">${esc(c.category)}</span>` : '';
  const typoPill = sub
    ? `<span class="portrait-typo-pill">${esc(sub)}</span>` : '';

  // ── Meta line ── statut dynamique filtré sur valeurs réelles (exclut "Tous" et vide)
  const isValidStatus = c.itemStatus && ['Disponible','Vendu','Pas à vendre','Brouillon'].includes(c.itemStatus);
  const metaHTML = [
    isValidStatus ? `<span class="portrait-status-dot" style="background:${statusColor}"></span><span class="portrait-status-text">${esc(c.itemStatus)}</span>` : '',
    (c.price != null && c.price !== '') ? `<span class="portrait-price">${c.price} €</span>` : '',
    c.depotVente ? `<span class="portrait-meta-tag">Dépôt-vente${c.depotVenteName?' · '+esc(c.depotVenteName):''}</span>` : '',
    c.artiste    ? `<span class="portrait-meta-tag">Création${c.artisteName?' · '+esc(c.artisteName):''}</span>` : ''
  ].filter(Boolean).join('');

  const expoChipsHTML = ''; // section Expositions supprimée

  // Couleur du halo : couleur du verbe ou warm-neutral si non défini
  const verbeHasHaloColor = c.category && getVerbes().some(v => v.name === c.category && (v.bgColor || v.color));
  const portraitHaloColor = verbeHasHaloColor ? bgColor : 'rgba(195,185,170,0.8)';
  // Propager la couleur au modal pour le box-shadow (bords fondus)
  document.getElementById('detailModal').style.setProperty('--portrait-verbe-accent', portraitHaloColor);

  // Fragment modal variant
  if (c.type === 'fragment') {
    const bg  = c.backgroundColor || '#1a1a1a';
    const lum = _luminance(bg);
    const fg  = lum > 0.35 ? '#1a1a1a' : '#f5f5f0';
    body.innerHTML = `
      <div class="portrait-split" style="--portrait-verbe-accent:${portraitHaloColor}">
        <div class="portrait-halo"></div>
        <div class="portrait-photo-col" style="display:flex;align-items:center;justify-content:center;min-height:200px;padding:32px">
          <p style="font-family:'Spectral',Georgia,serif;font-style:italic;font-size:20px;line-height:1.7;color:${lum > 0.35 ? '#1a1816' : '#f5f5f0'};text-align:center;max-width:360px">${esc(c.textContent||'')}</p>
        </div>
        <div class="portrait-info-col">
          ${(verbePill||typoPill) ? `<div class="portrait-pills-row">${verbePill}${typoPill}</div>` : ''}
          <h2 class="portrait-title">${esc(c.name||'Fragment')}</h2>
          ${metaHTML ? `<div class="portrait-meta">${metaHTML}</div>` : ''}
          ${expoChipsHTML}
        </div>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="portrait-split" style="--portrait-verbe-accent:${portraitHaloColor}">
        <div class="portrait-halo"></div>
        <div class="portrait-photo-col">
          <div class="portrait-main-wrap">${mainPhotoHTML}</div>
          ${thumbsHTML}
        </div>
        <div class="portrait-info-col">
          ${(verbePill||typoPill) ? `<div class="portrait-pills-row">${verbePill}${typoPill}</div>` : ''}
          <h2 class="portrait-title">${esc(c.name)}</h2>
          ${metaHTML ? `<div class="portrait-meta">${metaHTML}</div>` : ''}
          <div class="portrait-sep"></div>
          ${c.description ? `<p class="portrait-desc">${esc(c.description).replace(/\n/g,'<br>')}</p><div class="portrait-sep"></div>` : ''}
          <div class="portrait-attrs">
            ${attrRowsHTML}
            ${universHTML}
            ${kwHTML}
          </div>
          ${expoChipsHTML}
        </div>
      </div>`;
  }

  // Lightbox
  body.querySelectorAll('.portrait-main-img').forEach(img => {
    img.addEventListener('click', () => { LB.photos = photos; LB.idx = parseInt(img.dataset.idx)||0; showLightbox(); });
  });
  // Thumbnails
  body.querySelectorAll('.portrait-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.idx)||0;
      const main = body.querySelector('.portrait-main-img');
      if (main) { main.src = photoUrl(photos[idx]); main.dataset.idx = idx; }
      body.querySelectorAll('.portrait-thumb').forEach(t => t.classList.toggle('active', parseInt(t.dataset.idx)===idx));
    });
  });

  // Breadcrumb: push item name
  pushBreadcrumb(c.name || 'Détail', () => {
    closeDetail();
  });
  renderBreadcrumbBar();

  document.getElementById('detailEditBtn').onclick = () => { closeDetail(); openEdit(id); };
  document.getElementById('detailModal').style.display = 'flex';
}

function detailNav(dir) {
  const list=state.detailList.length?state.detailList:state.collections;
  const pos=list.findIndex(x=>x.id===state.detailCurrentId); if(pos===-1) return;
  openDetail(list[(pos+dir+list.length)%list.length].id);
}
function closeDetail() { document.getElementById('detailModal').style.display='none'; }

// ── Trios Generator ────────────────────────────────────────────────────────────
function _fingerprint(c) {
  const tags = new Set();
  (c.univers||[]).forEach(u => tags.add('u:'+u));
  (c.keywords||[]).forEach(k => tags.add('k:'+k));
  if (c.category) tags.add('v:'+c.category);
  const attrs = c.attributes || {};
  Object.entries(attrs).forEach(([key, vals]) => {
    (Array.isArray(vals)?vals:[vals]).filter(Boolean).forEach(v => tags.add(`a:${key}:${v}`));
  });
  return tags;
}
function _sharedTags(fpA, fpB) { return [...fpA].filter(t => fpB.has(t)); }
function _tagLabel(t) {
  // 'u:mélancolique' → 'mélancolique', 'a:matieres:laiton' → 'laiton', 'v:Raconter' → 'Raconter'
  const parts = t.split(':');
  return parts[parts.length-1];
}

function _generateTrio() {
  const cols = state.collections;
  if (cols.length < 3) return null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const seed = cols[Math.floor(Math.random() * cols.length)];
    const seedFp = _fingerprint(seed);
    if (seedFp.size === 0) continue;
    const candidates = cols
      .filter(c => c.id !== seed.id)
      .map(c => ({ obj: c, shared: _sharedTags(seedFp, _fingerprint(c)) }))
      .filter(x => x.shared.length > 0);
    if (candidates.length < 2) continue;
    const pool = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.min(10, candidates.length));
    pool.sort((a, b) => b.shared.length - a.shared.length);
    const [c2, c3] = pool;
    const fp2 = _fingerprint(c2.obj), fp3 = _fingerprint(c3.obj);
    const triCommon = [...seedFp].filter(t => fp2.has(t) && fp3.has(t));
    const linkTags = (triCommon.length > 0 ? triCommon : c2.shared).slice(0, 3).map(_tagLabel);
    return { objects: [seed, c2.obj, c3.obj], linkTags: [...new Set(linkTags)].filter(Boolean) };
  }
  // Fallback aléatoire
  const shuffled = [...cols].sort(() => Math.random() - 0.5);
  return { objects: shuffled.slice(0, 3), linkTags: [] };
}

// ── Trios helpers ─────────────────────────────────────────────────────────────

// Mode 1 : filtres aléatoires
function _generateTrioFiltered(matiere, teinte, intention) {
  const pool = state.collections.filter(c => {
    if (matiere   && !(c.attributes?.matieres||[]).includes(matiere))   return false;
    if (teinte    && !(c.attributes?.couleurs||[]).includes(teinte))     return false;
    if (intention && c.category !== intention)                           return false;
    return true;
  });
  if (pool.length < 3) return null;
  const objects = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  const fp = objects.map(_fingerprint);
  const common = [...fp[0]].filter(t => fp[1].has(t) && fp[2].has(t));
  return { objects, linkTags: common.slice(0, 3).map(_tagLabel).filter(Boolean) };
}

// Mode 2 : règles d'art
function _generateTrioByRule(rule) {
  const cols = state.collections;
  const _buildMap = getter => {
    const map = {};
    cols.forEach(c => (getter(c)||[]).forEach(v => { if (!map[v]) map[v]=[]; map[v].push(c); }));
    return map;
  };
  const _pickFromMap = (map, label) => {
    const keys = Object.keys(map).filter(k => map[k].length >= 3).sort(() => Math.random() - 0.5);
    if (!keys.length) return null;
    const key = keys[0];
    const objects = [...map[key]].sort(() => Math.random() - 0.5).slice(0, 3);
    return { objects, linkTags: [key], ruleLabel: `${label} — ${key}` };
  };
  switch (rule) {
    case 'monochrome': return _pickFromMap(_buildMap(c => c.attributes?.couleurs), 'Monochrome');
    case 'epoque':     return _pickFromMap(_buildMap(c => c.attributes?.origine),  'Même Époque');
    case 'matiere':    return _pickFromMap(_buildMap(c => c.attributes?.matieres), 'Même Matière');
    case 'clash': {
      const byVerbe = {};
      cols.forEach(c => { if (c.category) { if (!byVerbe[c.category]) byVerbe[c.category]=[]; byVerbe[c.category].push(c); } });
      const cats = Object.keys(byVerbe).sort(() => Math.random() - 0.5);
      if (cats.length < 3) { // fallback: 3 objets aléatoires
        const objects = [...cols].sort(() => Math.random() - 0.5).slice(0, 3);
        return { objects, linkTags: ['contraste'], ruleLabel: 'Clash Visuel' };
      }
      const objects = cats.slice(0, 3).map(cat => byVerbe[cat][Math.floor(Math.random()*byVerbe[cat].length)]);
      return { objects, linkTags: ['contraste', 'dialogue'], ruleLabel: 'Clash Visuel' };
    }
    default: return null;
  }
}

// Peupler les filtres du mode 1
function _populateTriosFilters() {
  const mSet = new Set(), tSet = new Set(), iSet = new Set();
  state.collections.forEach(c => {
    (c.attributes?.matieres||[]).forEach(m => mSet.add(m));
    (c.attributes?.couleurs||[]).forEach(t => tSet.add(t));
    if (c.category) iSet.add(c.category);
  });
  const fill = (id, placeholder, set) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` +
      [...set].sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };
  fill('trioFiltMatiere', 'Matière', mSet);
  fill('trioFiltTeinte', 'Teinte', tSet);
  fill('trioFiltIntention', 'Intention', iSet);
}

/// Rendu des 3 cartes — utilise cardHTML() (composant universel de la Grille)
function _renderTriosCards(objects) {
  const grid = document.getElementById('triosGrid');
  if (!grid) return;

  // Slot vide — même ratio que la carte (aspect-ratio 1:1 image + body)
  const emptySlotHTML = i => `
    <div class="trios-slot-wrap trios-drop-zone empty" data-slot="${i}">
      <div class="trios-empty-slot">
        <span class="trios-empty-icon">＋</span>
        <span class="trios-empty-label">Emplacement libre</span>
        <span class="trios-empty-hint">Glisser un objet</span>
      </div>
    </div>`;

  if (_triosActiveTab === 'manuel') {
    grid.innerHTML = _triosManualSlots.map((obj, i) => {
      if (obj) {
        // Carte pleine avec bouton retirer superposé
        return `<div class="trios-slot-wrap filled" data-slot="${i}">
          ${cardHTML(obj)}
          <button class="trios-slot-remove" data-slot="${i}" title="Retirer">×</button>
        </div>`;
      }
      return emptySlotHTML(i);
    }).join('');

    // Drop sur toute la slot-wrap (vide ou remplie)
    grid.querySelectorAll('.trios-slot-wrap').forEach(wrap => {
      wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drag-over'); });
      wrap.addEventListener('dragleave', e => { if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('drag-over'); });
      wrap.addEventListener('drop', e => {
        e.preventDefault(); wrap.classList.remove('drag-over');
        if (_triosDragItem) { _triosManualSlots[+wrap.dataset.slot] = _triosDragItem; _renderTriosManualState(); }
      });
    });
    // Boutons retirer
    grid.querySelectorAll('.trios-slot-remove').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _triosManualSlots[+btn.dataset.slot] = null; _renderTriosManualState(); });
    });
    // Clic sur carte remplie → fiche détail
    grid.querySelectorAll('.trios-slot-wrap.filled .card').forEach(card => {
      card.addEventListener('click', e => { if (!e.target.closest('.trios-slot-remove')) openDetail(card.dataset.id); });
    });
  } else {
    // Modes Hasard et Règles — cartes identiques à la Grille
    grid.innerHTML = objects.map(c => cardHTML(c)).join('');
    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openDetail(card.dataset.id));
    });
  }
}

// Inventaire miniature (mode 3)
function _renderInventoryStrip() {
  const strip = document.getElementById('triosInventoryStrip');
  if (!strip) return;
  const q = (document.getElementById('triosInvSearch')?.value || '').toLowerCase().trim();
  const items = state.collections.filter(c =>
    !q || (c.name||'').toLowerCase().includes(q) || (c.category||'').toLowerCase().includes(q)
  );
  strip.innerHTML = items.map(c => {
    const img = c.photos?.[0] ? photoUrl(c.photos[0]) : null;
    const inSlot = _triosManualSlots.some(s => s?.id === c.id);
    return `<div class="trios-inv-item${inSlot?' in-slot':''}" draggable="true" data-id="${c.id}" title="${esc(c.name)}">
      ${img ? `<img src="${img}" alt="">` : `<div class="trios-inv-placeholder"></div>`}
      <span class="trios-inv-name">${esc(c.name)}</span>
    </div>`;
  }).join('');
  strip.querySelectorAll('.trios-inv-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      _triosDragItem = state.collections.find(c => c.id === item.dataset.id) || null;
      e.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => { _triosDragItem = null; item.classList.remove('dragging'); });
  });
}

// Lien narratif helper
function _setTriosLinkBar(trio) {
  const bar = document.getElementById('triosLinkBar');
  if (!bar) return;
  if (trio?.ruleLabel) {
    bar.innerHTML = `<span class="trios-link-pre">${esc(trio.ruleLabel)}</span>`;
  } else if (trio?.linkTags?.length) {
    bar.innerHTML = `<span class="trios-link-pre">Triptyque lié par</span>${trio.linkTags.map(t=>`<span class="trios-link-tag">${esc(t)}</span>`).join('<span class="trios-link-amp"> &amp; </span>')}`;
  } else {
    bar.innerHTML = `<span class="trios-link-pre">Triptyque aléatoire</span>`;
  }
}

// Re-render complet du mode manuel
function _renderTriosManualState() {
  document.getElementById('triosResult').style.display = '';
  _renderTriosCards(null);
  _renderInventoryStrip();
  const filled = _triosManualSlots.filter(Boolean);
  const bar = document.getElementById('triosLinkBar');
  bar.innerHTML = filled.length === 3
    ? `<span class="trios-link-pre">Composition manuelle</span>`
    : `<span class="trios-link-pre" style="color:var(--text-3)">${filled.length}/3 objets placés</span>`;
}

function renderTrios() {
  // Injecte la description éditable
  const triosDescEl = document.getElementById('triosDesc');
  if (triosDescEl) triosDescEl.textContent = PAGE_DESCRIPTIONS.triptyque || '';
  // Applique la visibilité des onglets (Paramètres > Onglets Triptyque > Masquer)
  _syncTriosTabLabels();
  // Si l'onglet actif est masqué, bascule sur le premier visible
  const tabIdxMap = { hasard: 0, regles: 1, manuel: 2 };
  const activeIdx = tabIdxMap[_triosActiveTab];
  if (activeIdx != null && isTriosTabHidden(activeIdx)) {
    const firstVisible = ['hasard', 'regles', 'manuel'].find((t, i) => !isTriosTabHidden(i));
    if (firstVisible) {
      _triosActiveTab = firstVisible;
      document.querySelectorAll('.trios-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === firstVisible));
      document.getElementById('triosPanelHashard').style.display = firstVisible === 'hasard' ? '' : 'none';
      document.getElementById('triosPanelRegles').style.display  = firstVisible === 'regles' ? '' : 'none';
      document.getElementById('triosPanelManuel').style.display  = firstVisible === 'manuel' ? '' : 'none';
    }
  }
  const result  = document.getElementById('triosResult');
  const empty   = document.getElementById('triosEmpty');
  if (state.collections.length < 3) {
    result.style.display = 'none'; empty.style.display = ''; return;
  }
  empty.style.display = 'none';
  _populateTriosFilters();

  if (_triosActiveTab === 'hasard') {
    if (!_currentTrio) _currentTrio = _generateTrio();
    if (_currentTrio) { _setTriosLinkBar(_currentTrio); _renderTriosCards(_currentTrio.objects); result.style.display = ''; }
  } else if (_triosActiveTab === 'regles') {
    if (_currentTrio) { _setTriosLinkBar(_currentTrio); _renderTriosCards(_currentTrio.objects); result.style.display = ''; }
    else result.style.display = 'none';
  } else {
    _renderTriosManualState();
  }
  _renderSavedTrios();
}

// ── Icône "+" "Coup de cœur" — cross unifiée (identique à .sel-ast) ──────
// 2 branches (vertical + horizontal), taille 10×10, stroke 1.4 round
// Partagée entre la pill Sélection, les cartes, la Dérive et la Constellation
function _asteriskSVG() {
  return `<svg class="ast-icon sel-ast" viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true">
    <line class="ast-s" x1="12" y1="4" x2="12" y2="20"/>
    <line class="ast-s" x1="4" y1="12" x2="20" y2="12"/>
  </svg>`;
}

// ══ MARQUE-PAGES — "Mettre de côté" ══════════════════════════════════════════
async function toggleBookmark(id) {
  const col = state.collections.find(c => c.id === id);
  if (!col) return;
  col.bookmarked = !col.bookmarked;
  try {
    await api.put(`/api/collections/${id}`, { ...col });
  } catch(e) {
    col.bookmarked = !col.bookmarked; // rollback
    console.error('toggleBookmark error', e);
  }
  render();
}

// ══ TRIOS — Compositions sauvegardées (localStorage) ═══════════════════════
function _persistSavedTrios() {
  localStorage.setItem('charchives_saved_trios', JSON.stringify(_savedTrios));
}

function _renderSavedTrios() {
  const section = document.getElementById('triosSavedSection');
  const list    = document.getElementById('triosSavedList');
  const count   = document.getElementById('triosSavedCount');
  if (!section || !list) return;
  if (!_savedTrios.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  if (count) count.textContent = `${_savedTrios.length} composition${_savedTrios.length > 1 ? 's' : ''}`;

  list.innerHTML = _savedTrios.map(trio => {
    const objects = trio.objectIds.map(id => state.collections.find(c => c.id === id)).filter(Boolean);
    const thumbs = objects.map(obj => {
      const photo = obj.photos?.[0];
      const bg = getVerbeBgColor(obj.category) || '#ccc';
      return `<div class="ts-thumb" style="--ts-col:${bg}">
        ${photo ? `<img src="${photoUrl(photo)}" alt="">` : `<div class="ts-thumb-placeholder"></div>`}
      </div>`;
    }).join('');
    const displayName = trio.name || new Date(trio.savedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
    return `<div class="ts-item" data-trio-id="${esc(trio.id)}">
      <div class="ts-thumbs">${thumbs}</div>
      <div class="ts-meta">
        <span class="ts-name" data-trio-id="${esc(trio.id)}">${esc(displayName)}</span>
        <button class="ts-rename-btn" data-trio-id="${esc(trio.id)}" title="Renommer">✎</button>
        <div class="ts-actions">
          <button class="ts-show-btn" data-trio-id="${esc(trio.id)}" title="Afficher en grand">Afficher</button>
          <button class="ts-restore-btn" data-trio-id="${esc(trio.id)}" title="Charger dans l'éditeur">Éditer</button>
          <button class="ts-delete-btn" data-trio-id="${esc(trio.id)}" title="Supprimer">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Afficher → ouvre une modale grand format avec les 3 images
  list.querySelectorAll('.ts-show-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const trio = _savedTrios.find(t => t.id === btn.dataset.trioId);
      if (!trio) return;
      const objects = trio.objectIds.map(id => state.collections.find(c => c.id === id)).filter(Boolean);
      const html = objects.map(obj => {
        const photo = obj.photos?.[0];
        return photo ? `<img src="${photoUrl(photo)}" alt="${esc(obj.name||'')}" style="max-height:80vh;max-width:30vw;object-fit:contain">` : '';
      }).join('');
      // Simple modale overlay
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.display = 'flex';
      overlay.innerHTML = `<div style="display:flex;gap:24px;align-items:center;justify-content:center;padding:32px;cursor:pointer">${html}</div>`;
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });

  // Éditer → charge dans l'éditeur manuel
  list.querySelectorAll('.ts-restore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const trio = _savedTrios.find(t => t.id === btn.dataset.trioId);
      if (!trio) return;
      const objects = trio.objectIds.map(id => state.collections.find(c => c.id === id)).filter(Boolean);
      _triosManualSlots = [objects[0]||null, objects[1]||null, objects[2]||null];
      _triosActiveTab = 'manuel';
      document.querySelectorAll('.trios-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'manuel'));
      document.querySelectorAll('.trios-tab-panel').forEach(p => p.style.display = p.id === 'triosPanelManuel' ? '' : 'none');
      _renderTriosManualState();
    });
  });

  // Renommer — transforme le label en input
  list.querySelectorAll('.ts-rename-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const trio = _savedTrios.find(t => t.id === btn.dataset.trioId);
      if (!trio) return;
      const nameEl = btn.parentElement.querySelector('.ts-name');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ts-rename-input';
      input.value = trio.name || '';
      input.placeholder = 'Nom de la sélection…';
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      const save = () => {
        trio.name = input.value.trim() || '';
        _persistSavedTrios();
        _renderSavedTrios();
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    });
  });

  list.querySelectorAll('.ts-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _savedTrios = _savedTrios.filter(t => t.id !== btn.dataset.trioId);
      _persistSavedTrios();
      _renderSavedTrios();
    });
  });
}

// ══ CONSTELLATION — Panier de sélection ══════════════════════════════════════
function _toggleConPanier(id) {
  const idx = _conPanier.indexOf(id);
  if (idx >= 0) _conPanier.splice(idx, 1);
  else _conPanier.push(id);
  _renderConPanier();
}

function _renderConPanier() {
  const panel = document.getElementById('conPanier');
  const items = document.getElementById('conPanierItems');
  if (!panel || !items) return;
  if (!_conPanier.length) { panel.style.display = 'none'; return; }
  panel.style.display = '';
  items.innerHTML = _conPanier.map(id => {
    const obj = state.collections.find(c => c.id === id);
    if (!obj) return '';
    const photo = obj.photos?.[0];
    const bg    = getVerbeBgColor(obj.category) || '#ccc';
    return `<div class="cp-item" data-id="${esc(id)}" title="${esc(obj.name)}">
      <div class="cp-thumb" style="border-color:${bg}">
        ${photo ? `<img src="${photoUrl(photo)}" alt="">` : `<div class="cp-placeholder" style="background:${bg}20"></div>`}
      </div>
      <button class="cp-remove" data-id="${esc(id)}">✕</button>
    </div>`;
  }).filter(Boolean).join('');
  items.querySelectorAll('.cp-remove').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); _toggleConPanier(btn.dataset.id); });
  });
  items.querySelectorAll('.cp-item').forEach(item => {
    item.addEventListener('click', () => openDetail(item.dataset.id));
  });
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
let _lbPreZoomRect = null; // stored pre-zoom bounding rect of the image
function showLightbox() { updateLightboxUI(); document.getElementById('lightbox').style.display='flex'; }
function updateLightboxUI() {
  const {photos,idx}=LB;
  const img = document.getElementById('lightboxImg');
  img.src=photoUrl(photos[idx]);
  // Reset zoom on photo change
  img.classList.remove('lb-zoomed');
  img.style.cursor='';
  _lbPreZoomRect = null;
  document.getElementById('lbCounter').textContent=photos.length>1?`${idx+1} / ${photos.length}`:'';
  document.getElementById('lbPrev').style.display=photos.length>1?'flex':'none';
  document.getElementById('lbNext').style.display=photos.length>1?'flex':'none';
}
function lbNav(dir) { if(!LB.photos.length) return; LB.idx=(LB.idx+dir+LB.photos.length)%LB.photos.length; updateLightboxUI(); }

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function populateCategoryDropdown() {
  const sel = document.getElementById('fCategory');
  sel.innerHTML = '<option value="">— Choisir —</option>';
  getCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

const TYPES_OBJETS = ['vase','vide-poche','coupe','bol','assiette','plat','plateau',
  'carreau','bougeoir','chandelier','cadre','boîte','coffret','figurine',
  'sculpture','panier','flacon','bouteille','lampe','lustre','statuette','pot','jardinière'];

function renderSubcategoryChips(catName) {
  const container = document.getElementById('subcatChipsContainer');
  if (!container) return;
  const verbe = getVerbes().find(v => v.name === catName);
  if (!verbe) { container.innerHTML = '<span class="subcat-placeholder">— Choisir une intention d\'abord —</span>'; return; }
  const typologies = getTypologies(verbe);
  container.innerHTML = typologies.map(t => {
    const active = state.editSubcategories.includes(t);
    return `<button type="button" class="subcat-chip${active ? ' selected' : ''}" data-typo="${esc(t)}">${esc(t)}</button>`;
  }).join('');
  container.querySelectorAll('.subcat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.typo;
      if (state.editSubcategories.includes(t)) {
        state.editSubcategories = state.editSubcategories.filter(x => x !== t);
      } else {
        if (state.editSubcategories.length >= 2) state.editSubcategories.shift();
        state.editSubcategories.push(t);
      }
      renderSubcategoryChips(catName);
    });
  });
}

function populateLocationDropdown() {
  const sel = document.getElementById('fLocation');
  sel.innerHTML = '<option value="">— Choisir —</option>';
  (state.settings.locations||[]).forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    sel.appendChild(opt);
  });
}

function renderUniversChips() {
  const container = document.getElementById('universChips');
  if (!container) return;
  // Fusionner custom + EMOTION_OPTIONS sans doublons
  const merged = [...new Set([...(state.settings.univers || []), ...EMOTION_OPTIONS])];
  container.innerHTML = merged.map(u => {
    const active = state.editUnivers.includes(u);
    return `<button type="button" class="attr-chip${active?' selected':''}" data-univers="${esc(u)}">${esc(u)}</button>`;
  }).join('');
  container.querySelectorAll('.attr-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const u = btn.dataset.univers;
      if (state.editUnivers.includes(u)) state.editUnivers = state.editUnivers.filter(x=>x!==u);
      else state.editUnivers.push(u);
      renderUniversChips();
    });
  });
}

function _renderFamilyChips(key, def, container) {
  const current = state.editAttributes[key] || [];
  const families = def.families || [];
  let html = '';
  families.forEach((fam, fi) => {
    if (fi > 0) html += '<div class="attr-family-sep"></div>';
    if (fam.label) html += `<div class="attr-family-label">${esc(fam.label)}</div>`;
    html += (fam.items || []).map(opt => {
      const active = current.includes(opt);
      return `<button type="button" class="attr-chip${active ? ' selected' : ''}" data-key="${esc(key)}" data-val="${esc(opt)}">${esc(opt)}</button>`;
    }).join('');
  });
  // Show any custom values not in any family
  const allFamilyItems = new Set(families.flatMap(f => f.items || []));
  const customVals = current.filter(v => !allFamilyItems.has(v));
  if (customVals.length) {
    html += '<div class="attr-family-sep"></div>';
    html += customVals.map(opt => `<button type="button" class="attr-chip selected" data-key="${esc(key)}" data-val="${esc(opt)}">${esc(opt)}</button>`).join('');
  }
  container.innerHTML = html;
  container.querySelectorAll('.attr-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (!state.editAttributes[key]) state.editAttributes[key] = [];
      const idx = state.editAttributes[key].indexOf(val);
      if (idx >= 0) state.editAttributes[key].splice(idx, 1);
      else state.editAttributes[key].push(val);
      _renderFamilyChips(key, def, container);
    });
  });
}

function _renderGroupedSelect(key, def, container) {
  const current = state.editAttributes[key] || [];
  const families = def.families || [];

  // Render the wrapper (only once — after first render, update in-place)
  if (!container.querySelector('.gs-trigger')) {
    container.innerHTML = `
      <div class="gs-wrapper" id="gsWrap_${key}">
        <div class="gs-trigger" id="gsTrigger_${key}">
          <span class="gs-placeholder">${key === 'matieres' ? 'Sélectionner des matières…' : 'Sélectionner des motifs…'}</span>
          <input type="text" class="gs-search-input" id="gsSearch_${key}" placeholder="Rechercher…" autocomplete="off">
        </div>
        <div class="gs-dropdown" id="gsDropdown_${key}"></div>
      </div>`;
    // Bind open/close
    const trigger = container.querySelector('.gs-trigger');
    const dropdown = container.querySelector('.gs-dropdown');
    const searchInp = container.querySelector('.gs-search-input');
    trigger.addEventListener('click', e => {
      if (e.target.classList.contains('gs-chip-remove')) return;
      dropdown.classList.toggle('open');
      if (dropdown.classList.contains('open')) { searchInp.focus(); _updateGsDropdown(key, def, container, ''); }
    });
    searchInp.addEventListener('input', () => _updateGsDropdown(key, def, container, searchInp.value));
    document.addEventListener('click', e => {
      if (!container.contains(e.target)) { dropdown.classList.remove('open'); }
    }, { capture: true });
  }

  // Update selected chips
  const trigger = container.querySelector('.gs-trigger');
  const placeholder = trigger.querySelector('.gs-placeholder');
  const searchInp = trigger.querySelector('.gs-search-input');
  // Remove old chips
  trigger.querySelectorAll('.gs-selected-chip').forEach(c => c.remove());
  // Re-add chips for selected
  current.forEach(val => {
    const chip = document.createElement('span');
    chip.className = 'gs-selected-chip';
    chip.innerHTML = `${esc(val)}<button type="button" class="gs-chip-remove" data-key="${key}" data-val="${esc(val)}" title="Retirer">×</button>`;
    chip.querySelector('.gs-chip-remove').addEventListener('click', e => {
      e.stopPropagation();
      const idx = (state.editAttributes[key]||[]).indexOf(val);
      if (idx >= 0) state.editAttributes[key].splice(idx, 1);
      _renderGroupedSelect(key, def, container);
    });
    trigger.insertBefore(chip, searchInp);
  });
  if (placeholder) placeholder.style.display = current.length ? 'none' : '';
  // Update dropdown if open
  const dropdown = container.querySelector('.gs-dropdown');
  if (dropdown?.classList.contains('open')) _updateGsDropdown(key, def, container, searchInp?.value || '');
}

function _updateGsDropdown(key, def, container, searchTerm) {
  const dropdown = container.querySelector('.gs-dropdown');
  if (!dropdown) return;
  const term = (searchTerm || '').toLowerCase().trim();
  const current = state.editAttributes[key] || [];
  const families = def.families || [];

  let html = '';
  families.forEach(fam => {
    const items = (fam.items || []).filter(opt => !term || opt.toLowerCase().includes(term));
    if (!items.length) return;
    html += `<div class="gs-family-label">${esc(fam.label || 'Autres')}</div>`;
    items.forEach(opt => {
      const sel = current.includes(opt);
      html += `<div class="gs-option${sel ? ' selected' : ''}" data-key="${key}" data-val="${esc(opt)}">${esc(opt)}${sel ? ' ✓' : ''}</div>`;
    });
  });
  if (!html) html = '<div class="gs-empty">Aucun résultat</div>';
  dropdown.innerHTML = html;

  dropdown.querySelectorAll('.gs-option').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      const val = opt.dataset.val;
      if (!state.editAttributes[key]) state.editAttributes[key] = [];
      const idx = state.editAttributes[key].indexOf(val);
      if (idx >= 0) state.editAttributes[key].splice(idx, 1);
      else state.editAttributes[key].push(val);
      const searchInp = container.querySelector('.gs-search-input');
      _renderGroupedSelect(key, def, container);
      if (searchInp) { searchInp.focus(); _updateGsDropdown(key, def, container, searchInp.value); }
    });
  });
}

function renderAttributeSection(key) {
  const def = ATTRIBUTES_DEF[key];
  if (!def) return;
  if (key==='couleurs') def.options = state.settings.colors||[];
  const container = document.getElementById(`attrChips_${key}`);
  if (!container) return;
  const current = state.editAttributes[key] || (def.single ? '' : []);
  const options = def.options;

  // Matieres: inline grouped chips (more discoverable)
  if (key === 'matieres' && def.families?.length) {
    _renderFamilyChips(key, def, container);
    return;
  }
  // Motifs: grouped search dropdown
  if (key === 'motifs' && def.families?.length) {
    _renderGroupedSelect(key, def, container);
    return;
  }

  if (key === 'couleurs') {
    // Visual color swatches — round circles with ring on selected
    container.innerHTML = options.map(opt => {
      const active = Array.isArray(current) && current.includes(opt);
      const bgColor = COLOR_MAP[opt] || '#ccc';
      const needsBorder = (opt === 'blanc' || opt === 'transparent' || opt === 'écru' || opt === 'ivoire');
      const borderColor = needsBorder ? 'rgba(45,45,45,.2)' : bgColor;
      return `<button type="button"
        class="attr-chip color-swatch${active ? ' selected' : ''}"
        data-key="${key}" data-val="${esc(opt)}"
        title="${esc(opt)}"
        style="--swatch-color:${bgColor};background:${bgColor};border-color:${borderColor}"></button>`;
    }).join('');
  } else {
    container.innerHTML = options.map(opt => {
      const active = def.single ? current===opt : (Array.isArray(current)&&current.includes(opt));
      return `<button type="button" class="attr-chip${active?' selected':''}" data-key="${key}" data-val="${esc(opt)}">${esc(opt)}</button>`;
    }).join('');
  }

  container.querySelectorAll('.attr-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (def.single) {
        state.editAttributes[key] = (state.editAttributes[key]===val) ? '' : val;
      } else {
        if (!state.editAttributes[key]) state.editAttributes[key] = [];
        const idx = state.editAttributes[key].indexOf(val);
        if (idx>=0) state.editAttributes[key].splice(idx,1);
        else state.editAttributes[key].push(val);
      }
      renderAttributeSection(key);
    });
  });
}

// Migration rétrocompatible des anciennes clés d'attributs
const ATTR_KEY_MIGRATION = {
  stylesPeriodes: 'origine',
  iconographie:   'motifs',
  etat:           'etat_traces',
  usages:         'usage'
};
function migrateAttrs(attrs) {
  if (!attrs) return attrs;
  Object.entries(ATTR_KEY_MIGRATION).forEach(([oldKey, newKey]) => {
    if (attrs[oldKey] !== undefined && attrs[newKey] === undefined) {
      attrs[newKey] = attrs[oldKey];
    }
    delete attrs[oldKey];
  });
  return attrs;
}

// Default open sections when modal first renders
const ATTR_DEFAULT_OPEN = new Set(['matieres','origine','etat_traces','couleurs','motifs','taille','usage']);

// Build the HTML for a single attr section block
function _buildAttrSectionHTML(key, half = false) {
  const def = ATTRIBUTES_DEF[key];
  if (!def) return '';
  const isOpen = ATTR_DEFAULT_OPEN.has(key);
  const chipsClass = key === 'matieres' ? 'attr-chips attr-chips-families'
                   : key === 'couleurs'  ? 'attr-chips attr-chips-color'
                   : 'attr-chips';
  let extra = '';
  if (key === 'matieres') {
    extra = `<div class="attr-add-custom">
      <input type="text" class="attr-custom-input" id="customMatiereInput" placeholder="Autre matière…">
      <button class="btn btn-ghost btn-xs" id="addCustomMatiereBtn">+ Ajouter</button>
    </div>`;
  } else if (key === 'origine') {
    extra = `<div class="attr-add-custom">
      <input type="text" class="attr-custom-input" id="customStyleInput" placeholder="Autre style…">
      <button class="btn btn-ghost btn-xs" id="addCustomStyleBtn">+ Ajouter</button>
    </div>`;
  } else if (key === 'motifs') {
    extra = `<div class="attr-add-custom">
      <input type="text" class="attr-custom-input" id="customMotifsInput" placeholder="Autre motif…">
      <button class="btn btn-ghost btn-xs" id="addCustomMotifsBtn">+ Ajouter</button>
    </div>`;
  } else if (key === 'couleurs') {
    extra = `<div class="attr-add-custom">
      <input type="text" class="attr-custom-input" id="customCouleursInput" placeholder="Autre teinte…">
      <button class="btn btn-ghost btn-xs" id="addCustomCouleursBtn">+ Ajouter</button>
    </div>`;
  } else if (key === 'usage') {
    extra = `<div class="attr-add-custom">
      <input type="text" class="attr-custom-input" id="customUsageInput" placeholder="Autre usage…">
      <button class="btn btn-ghost btn-xs" id="addCustomUsageBtn">+ Ajouter</button>
    </div>`;
  } else if (key === 'taille') {
    extra = `<div class="field" style="margin-top:8px">
      <label style="font-size:11px;color:var(--text-3)">Dimensions réelles (optionnel)</label>
      <input type="text" id="fTailleReelle" placeholder="ex. H: 24cm / L: 12cm">
    </div>`;
  }
  return `<div class="attr-section${half ? ' attr-section-half' : ''}">
    <div class="attr-section-header" data-section="${key}">
      <span>${def.label}</span><span class="attr-toggle">${isOpen ? '▾' : '›'}</span>
    </div>
    <div class="attr-section-body" id="attrBody_${key}"${isOpen ? '' : ' style="display:none"'}>
      <div class="${chipsClass}" id="attrChips_${key}"></div>
      ${extra}
    </div>
  </div>`;
}

function renderAllAttributes() {
  const accordion = document.getElementById('attrsAccordion');
  if (!accordion) return;
  // Prevent Atmosphère section duplication on re-render
  const existingAtmos = document.getElementById('universSection');
  if (existingAtmos) existingAtmos.remove();

  const order = (state.settings.attributeSectionsOrder && state.settings.attributeSectionsOrder.length)
    ? state.settings.attributeSectionsOrder
    : ['matieres', 'origine', ['etat_traces','taille'], ['usage', 'motifs'], 'couleurs'];

  accordion.innerHTML = order.map(entry => {
    // Group-marker: {"group": "NOM"}
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && entry.group) {
      return `<div class="attr-group-header"><span>${esc(entry.group)}</span></div>`;
    }
    if (Array.isArray(entry)) {
      // Pair: two sections side by side
      return `<div class="attr-pair">${entry.map(k => _buildAttrSectionHTML(k, true)).join('')}</div>`;
    }
    return _buildAttrSectionHTML(entry, false);
  }).join('');

  // Re-bind accordion toggle headers
  accordion.querySelectorAll('.attr-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const toggle = header.querySelector('.attr-toggle');
      const isVisible = body.style.display !== 'none';
      body.style.display = isVisible ? 'none' : '';
      toggle.textContent = isVisible ? '›' : '▾';
    });
  });

  // Re-bind custom matière add button
  const matBtn = document.getElementById('addCustomMatiereBtn');
  if (matBtn) matBtn.addEventListener('click', () => {
    const v = document.getElementById('customMatiereInput').value.trim();
    if (!v) return;
    if (!ATTRIBUTES_DEF.matieres.options.includes(v)) ATTRIBUTES_DEF.matieres.options.push(v);
    if (!state.editAttributes.matieres) state.editAttributes.matieres = [];
    if (!state.editAttributes.matieres.includes(v)) state.editAttributes.matieres.push(v);
    document.getElementById('customMatiereInput').value = '';
    renderAttributeSection('matieres');
  });

  // Re-bind custom style add button
  const styleBtn = document.getElementById('addCustomStyleBtn');
  if (styleBtn) styleBtn.addEventListener('click', () => {
    const v = document.getElementById('customStyleInput').value.trim();
    if (!v) return;
    if (!ATTRIBUTES_DEF.origine.options.includes(v)) ATTRIBUTES_DEF.origine.options.push(v);
    if (!state.editAttributes.origine) state.editAttributes.origine = [];
    if (!state.editAttributes.origine.includes(v)) state.editAttributes.origine.push(v);
    document.getElementById('customStyleInput').value = '';
    renderAttributeSection('origine');
  });

  // Re-bind custom motifs add button
  const motifsBtn = document.getElementById('addCustomMotifsBtn');
  if (motifsBtn) motifsBtn.addEventListener('click', () => {
    const v = document.getElementById('customMotifsInput').value.trim();
    if (!v) return;
    if (!ATTRIBUTES_DEF.motifs.options.includes(v)) ATTRIBUTES_DEF.motifs.options.push(v);
    if (!state.editAttributes.motifs) state.editAttributes.motifs = [];
    if (!state.editAttributes.motifs.includes(v)) state.editAttributes.motifs.push(v);
    document.getElementById('customMotifsInput').value = '';
    renderAttributeSection('motifs');
  });

  // Re-bind custom couleurs add button
  const couleursBtn = document.getElementById('addCustomCouleursBtn');
  if (couleursBtn) couleursBtn.addEventListener('click', () => {
    const v = document.getElementById('customCouleursInput').value.trim();
    if (!v) return;
    if (!state.settings.colors) state.settings.colors = [];
    if (!state.settings.colors.includes(v)) state.settings.colors.push(v);
    if (!ATTRIBUTES_DEF.couleurs.options.includes(v)) ATTRIBUTES_DEF.couleurs.options.push(v);
    if (!state.editAttributes.couleurs) state.editAttributes.couleurs = [];
    if (!state.editAttributes.couleurs.includes(v)) state.editAttributes.couleurs.push(v);
    document.getElementById('customCouleursInput').value = '';
    renderAttributeSection('couleurs');
  });

  // Re-bind custom usage add button
  const usageBtn = document.getElementById('addCustomUsageBtn');
  if (usageBtn) usageBtn.addEventListener('click', () => {
    const v = document.getElementById('customUsageInput').value.trim();
    if (!v) return;
    if (!ATTRIBUTES_DEF.usage.options.includes(v)) ATTRIBUTES_DEF.usage.options.push(v);
    if (!state.editAttributes.usage) state.editAttributes.usage = [];
    if (!state.editAttributes.usage.includes(v)) state.editAttributes.usage.push(v);
    document.getElementById('customUsageInput').value = '';
    renderAttributeSection('usage');
  });

  // Set fTailleReelle value
  const trInput = document.getElementById('fTailleReelle');
  if (trInput) {
    if (state.editId) {
      const col = state.collections.find(c => c.id === state.editId);
      trInput.value = col?.attributes?.tailleReelle || '';
    } else {
      trInput.value = '';
    }
  }

  // Render chips for each section (flatten pairs, ignore group-markers)
  order.forEach(entry => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && entry.group) return;
    if (Array.isArray(entry)) entry.forEach(k => renderAttributeSection(k));
    else renderAttributeSection(entry);
  });

  // ── Atmosphère section — construite entièrement en JS, jamais dupliquée ──
  const atmosLabel = (state.settings.attributeLabels?.univers) || 'Atmosphère';
  const atmosSection = document.createElement('div');
  atmosSection.className = 'attr-section';
  atmosSection.id = 'universSection';
  atmosSection.innerHTML = `
    <div class="attr-section-header" id="universHeader">
      <span>${esc(atmosLabel)}</span><span class="attr-toggle">›</span>
    </div>
    <div class="attr-section-body" id="universBody">
      <div class="attr-chips" id="universChips"></div>
    </div>`;
  accordion.appendChild(atmosSection);

  // Atmosphère ouverte par défaut — toggle au clic
  document.querySelector('#universHeader .attr-toggle').textContent = '▾';
  document.getElementById('universHeader').addEventListener('click', () => {
    const body = document.getElementById('universBody');
    const toggle = document.querySelector('#universHeader .attr-toggle');
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    toggle.textContent = open ? '›' : '▾';
  });

  renderUniversChips();
}

function openNew() {
  state.editId = null;
  state.editPhotos.length = 0;
  state.editPrivatePhotos = [];
  state.editKeywords.length = 0;
  state.editUnivers = [];
  state.editAttributes = {};
  state.editSubcategories = [];
  state.dpAchatSelectedDate = '';
  state.dpAchatYear = new Date().getFullYear();
  document.getElementById('modalTitle').textContent = 'Nouvel objet';
  document.getElementById('deleteBtn').style.display = 'none';
  document.getElementById('fName').value = '';
  document.getElementById('fDesc').value = '';
  document.getElementById('fPrice').value = '';
  document.getElementById('fItemStatus').value = 'Disponible';
  document.getElementById('fPrixAchat').value = '';
  document.getElementById('fDateAchat').value = '';
  document.getElementById('fLieuAchat').value = '';
  document.getElementById('fNotes').value = '';
  document.getElementById('fSubcategoryCustom').value = '';
  document.getElementById('fSubcategoryCustomField').style.display = 'none';
  document.getElementById('fDepotVente').checked = false;
  document.getElementById('fArtiste').checked = false;
  document.getElementById('fDepotVenteName').value = '';
  document.getElementById('fArtisteName').value = '';
  populateCategoryDropdown();
  populateLocationDropdown();
  document.getElementById('fCategory').value = '';
  renderSubcategoryChips('');
  dateAchatDisplayUpdate();
  renderTagChips();
  renderPhotos();
  renderPrivatePhotos();
  renderAllAttributes(); // includes renderUniversChips() + universSection consolidation
  // Are.na
  state.editExpositions = [];
  renderExpoChipsPicker();
  switchModalTab('public');
  document.getElementById('editModal').style.display = 'flex';
  setTimeout(()=>document.getElementById('fName').focus(),50);
}

function openEdit(id) {
  const c = state.collections.find(x=>x.id===id); if(!c) return;
  state.editId = id;
  state.editPhotos.length = 0;
  state.editPhotos.push(...(c.photos||[]));
  state.editPrivatePhotos = [...(c.private?.photos||[])];
  state.editKeywords.length = 0;
  state.editKeywords.push(...(c.keywords||[]));
  state.editUnivers = [...(c.univers||[])];
  state.editAttributes = JSON.parse(JSON.stringify(c.attributes||{}));
  state.editAttributes = migrateAttrs(state.editAttributes);
  if (!state.editAttributes.couleurs) state.editAttributes.couleurs = c.attributes?.couleurs || [];
  state.dpAchatSelectedDate = c.private?.dateAchat||'';
  if (state.dpAchatSelectedDate) {
    const [y]=state.dpAchatSelectedDate.split('-');
    state.dpAchatYear = parseInt(y)||new Date().getFullYear();
  } else {
    state.dpAchatYear = new Date().getFullYear();
  }

  document.getElementById('modalTitle').textContent = 'Modifier l\'objet';
  document.getElementById('deleteBtn').style.display = '';
  document.getElementById('fName').value = c.name||'';
  document.getElementById('fDesc').value = c.description||'';
  document.getElementById('fPrice').value = c.price!=null?c.price:'';
  document.getElementById('fItemStatus').value = c.itemStatus||'Disponible';
  document.getElementById('fDepotVente').checked = !!c.depotVente;
  document.getElementById('fArtiste').checked = !!c.artiste;
  document.getElementById('fDepotVenteName').value = c.depotVenteName||'';
  document.getElementById('fArtisteName').value = c.artisteName||'';

  const priv = c.private||{};
  document.getElementById('fPrixAchat').value = priv.prixAchat!=null?priv.prixAchat:'';
  document.getElementById('fDateAchat').value = priv.dateAchat||'';
  document.getElementById('fLieuAchat').value = priv.lieuAchat||'';
  document.getElementById('fNotes').value = priv.notes||'';

  // Subcategories: migrate string→array for backward compat
  state.editSubcategories = Array.isArray(c.subcategories) && c.subcategories.length
    ? [...c.subcategories]
    : (c.subcategory ? [c.subcategory] : []);
  document.getElementById('fSubcategoryCustom').value = c.subcategoryCustom||'';
  document.getElementById('fSubcategoryCustomField').style.display = 'none';

  populateCategoryDropdown();
  document.getElementById('fCategory').value = c.category||'';
  renderSubcategoryChips(c.category||'');

  populateLocationDropdown();
  document.getElementById('fLocation').value = priv.location||'';

  dateAchatDisplayUpdate();
  renderTagChips();
  renderPhotos();
  renderPrivatePhotos();
  renderAllAttributes(); // includes renderUniversChips() + universSection consolidation
  // Are.na
  state.editExpositions = [...(c.expositions||[])];
  renderExpoChipsPicker();
  switchModalTab('public');
  document.getElementById('editModal').style.display = 'flex';
}

function closeEdit() { document.getElementById('editModal').style.display = 'none'; }

function switchModalTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('tabPublic').style.display   = tab === 'public'   ? '' : 'none';
  document.getElementById('tabPrivate').style.display  = tab === 'private'  ? '' : 'none';
  document.getElementById('tabSettings').style.display = tab === 'settings' ? '' : 'none';
  // Toggle footer
  document.getElementById('footerFiche').style.display    = tab === 'settings' ? 'none' : '';
  document.getElementById('footerSettings').style.display = tab === 'settings' ? ''     : 'none';
}

async function saveCollection(asDraft = false) {
  const saveBtn  = document.getElementById('saveBtn');
  const draftBtn = document.getElementById('draftBtn');
  if (saveBtn)  saveBtn.disabled  = true;
  if (draftBtn) draftBtn.disabled = true;

  try {
    const attrs = { ...state.editAttributes };
    const fTailleReelle = document.getElementById('fTailleReelle');
    if (fTailleReelle) {
      attrs.tailleReelle = fTailleReelle.value.trim() || undefined;
      if (!attrs.tailleReelle) delete attrs.tailleReelle;
    }

    const status = asDraft ? 'Brouillon' : document.getElementById('fItemStatus').value;

    const body = {
      type:            'item',
      textContent:     '',
      backgroundColor: '',
      expositions:     [...(state.editExpositions||[])],
      name:           document.getElementById('fName').value.trim()||'Sans titre',
      category:       document.getElementById('fCategory').value,
      subcategories:  [...state.editSubcategories],
      subcategory:    state.editSubcategories[0] || '',
      subcategoryCustom: (document.getElementById('fSubcategoryCustom')?.value||'').trim(),
      depotVente:  document.getElementById('fDepotVente').checked,
      depotVenteName: document.getElementById('fDepotVenteName').value.trim(),
      artiste:     document.getElementById('fArtiste').checked,
      artisteName: document.getElementById('fArtisteName').value.trim(),
      univers:     [...state.editUnivers],
      attributes:  attrs,
      price:       document.getElementById('fPrice').value!=='' ? parseFloat(document.getElementById('fPrice').value) : null,
      itemStatus:  status,
      keywords:    [...state.editKeywords],
      description: document.getElementById('fDesc').value.trim(),
      photos:      [...state.editPhotos],
      private: {
        photos:     [...state.editPrivatePhotos],
        prixAchat:  document.getElementById('fPrixAchat').value!=='' ? parseFloat(document.getElementById('fPrixAchat').value) : null,
        dateAchat:  state.dpAchatSelectedDate,
        lieuAchat:  document.getElementById('fLieuAchat').value.trim(),
        location:   document.getElementById('fLocation').value,
        notes:      document.getElementById('fNotes').value.trim()
      }
    };

    if (state.editId) {
      const updated = await api.put(`/api/collections/${state.editId}`, body);
      const idx = state.collections.findIndex(c=>c.id===state.editId);
      if (idx >= 0) state.collections[idx] = updated;
    } else {
      const created = await api.post('/api/collections', body);
      state.collections.unshift(created);
    }
    state.keywords = await api.get('/api/keywords');
    closeEdit(); render();

  } catch (err) {
    console.error('Erreur sauvegarde:', err);
    alert(`Impossible d'enregistrer : ${err.message}`);
  } finally {
    if (saveBtn)  saveBtn.disabled  = false;
    if (draftBtn) draftBtn.disabled = false;
  }
}

async function deleteCollection() {
  if (!state.editId) return;
  if (!confirm('Supprimer cet objet définitivement ?')) return;
  await api.del(`/api/collections/${state.editId}`);
  state.collections = state.collections.filter(c=>c.id!==state.editId);
  closeEdit(); render();
}

// ── Photo helpers ─────────────────────────────────────────────────────────────
// Returns the textColor hex of the currently selected Intention verbe, or null
function _getSelectedVerbeTextColor() {
  const sel = document.getElementById('fCategory');
  if (!sel) return null;
  const verbeName = sel.value;
  if (!verbeName) return null;
  const verbe = getVerbes().find(v => v.name === verbeName);
  return verbe ? (verbe.textColor || null) : null;
}

// ── IA : analyse photo → pré-remplissage automatique de la fiche ──────────────
async function _analyzeAndFillForm(filename) {
  // Affiche le bandeau de chargement
  const banner = document.getElementById('aiAnalyzeBanner');
  const bannerLabel = document.getElementById('aiAnalyzeLabel');
  if (banner) { banner.style.display = 'flex'; banner.dataset.state = 'loading'; }
  if (bannerLabel) bannerLabel.textContent = 'Analyse de l\'objet en cours…';

  try {
    const data = await api.post('/api/analyze-photo', { filename });
    if (data.error) throw new Error(data.error);

    // Nom
    const fName = document.getElementById('fName');
    if (fName && !fName.value.trim()) fName.value = data.name || '';

    // Description
    const fDesc = document.getElementById('fDesc');
    if (fDesc && !fDesc.value.trim()) fDesc.value = data.description || '';

    // Prix
    const fPrice = document.getElementById('fPrice');
    if (fPrice && !fPrice.value && data.price) fPrice.value = data.price;

    // Catégorie (Intention)
    const fCat = document.getElementById('fCategory');
    if (fCat && !fCat.value && data.category) {
      const opt = [...fCat.options].find(o => o.value === data.category);
      if (opt) {
        fCat.value = data.category;
        fCat.dispatchEvent(new Event('change'));
      }
    }

    // Sous-catégorie (chips)
    if (data.subcategory) {
      setTimeout(() => {
        const catName = document.getElementById('fCategory').value;
        const verbe = getVerbes().find(v => v.name === catName);
        if (verbe) {
          const typologies = getTypologies(verbe);
          const match = typologies.find(t => t.toLowerCase() === data.subcategory.toLowerCase());
          if (match && !state.editSubcategories.includes(match)) {
            state.editSubcategories.push(match);
            renderSubcategoryChips(catName);
          }
        }
      }, 150);
    }

    // Attributs
    if (data.attributes && typeof data.attributes === 'object') {
      const attrMap = {
        matieres: 'matieres',
        couleurs: 'couleurs',
        etat_traces: 'etat_traces',
        usage: 'usage',
        origine: 'origine',
        taille: 'taille',
        motifs: 'motifs'
      };
      Object.entries(attrMap).forEach(([aiKey, stateKey]) => {
        const vals = data.attributes[aiKey];
        if (!vals || !vals.length) return;
        const def = ATTRIBUTES_DEF[stateKey];
        if (!def) return;
        const available = def.options || [];
        // Match fuzzy sur les options disponibles
        const matched = vals
          .map(v => available.find(opt =>
            opt.toLowerCase() === v.toLowerCase() ||
            opt.toLowerCase().includes(v.toLowerCase()) ||
            v.toLowerCase().includes(opt.toLowerCase())
          ))
          .filter(Boolean);
        if (matched.length) {
          state.editAttributes[stateKey] = matched;
        }
      });
      renderAllAttributes();
    }

    // Mots-clés
    if (data.keywords?.length) {
      const existing = new Set(state.editKeywords || []);
      data.keywords.forEach(k => existing.add(k));
      state.editKeywords = [...existing];
      renderTagChips();
    }

    // Univers / Ambiance
    if (data.univers?.length) {
      const existing = new Set(state.editUnivers || []);
      data.univers.forEach(u => existing.add(u));
      state.editUnivers = [...existing];
      renderUniversChips?.();
    }

    // Bandeau succès
    if (banner) banner.dataset.state = 'done';
    if (bannerLabel) bannerLabel.textContent = 'Fiche pré-remplie — vérifie et ajuste !';
    setTimeout(() => {
      if (banner) banner.style.display = 'none';
    }, 4000);

  } catch (err) {
    console.error('Analyze error:', err);
    if (banner) banner.dataset.state = 'error';
    if (bannerLabel) bannerLabel.textContent = `Erreur : ${err.message}`;
    setTimeout(() => { if (banner) banner.style.display = 'none'; }, 8000);
  }
}

function _updateStylizeButtonsState() { /* no-op — ambiance toujours disponible */ }

// ── Ambiance : post-traitement Canvas (grain film + vignette blanche) ──────────
async function _applyAmbianceCanvas(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = img.naturalWidth, H = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 1. Image de base
        ctx.drawImage(img, 0, 0);

        // 2. Grain film léger (bruit aléatoire sur chaque pixel)
        const imgData = ctx.getImageData(0, 0, W, H);
        const d = imgData.data;
        const grainStrength = 18;
        for (let i = 0; i < d.length; i += 4) {
          const g = (Math.random() - 0.5) * grainStrength;
          d[i]   = Math.min(255, Math.max(0, d[i]   + g));
          d[i+1] = Math.min(255, Math.max(0, d[i+1] + g));
          d[i+2] = Math.min(255, Math.max(0, d[i+2] + g));
        }
        ctx.putImageData(imgData, 0, 0);

        // 3. Vignette blanche radiale sur les contours
        const cx = W / 2, cy = H / 2;
        const innerR = Math.min(W, H) * 0.28;
        const outerR = Math.max(W, H) * 0.78;
        const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
        grad.addColorStop(0,    'rgba(255,255,255,0)');
        grad.addColorStop(0.55, 'rgba(255,255,255,0.04)');
        grad.addColorStop(0.82, 'rgba(255,255,255,0.28)');
        grad.addColorStop(1,    'rgba(255,255,255,0.60)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // 4. Upload du résultat
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const file = new File([blob], `ambiance_${Date.now()}.jpg`, { type: 'image/jpeg' });
          api.uploadPhotos([file])
            .then(({ filenames }) => resolve(filenames[0]))
            .catch(reject);
        }, 'image/jpeg', 0.90);

      } catch(err) { reject(err); }
    };
    img.onerror = () => reject(new Error('Chargement image CORS échoué'));
    // Cache-bust pour éviter les problèmes CORS avec les URLs Cloudinary déjà en cache
    img.src = imgUrl.includes('?') ? imgUrl + '&_t=' + Date.now() : imgUrl + '?_t=' + Date.now();
  });
}

// ── Photos ─────────────────────────────────────────────────────────────────────
function _showPhotoToast(msg) {
  let toast = document.getElementById('photoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'photoToast';
    toast.className = 'photo-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// ══════════════════════════════════════════════════════════════
// IMAGE CROPPER — Recadrage avant upload
// ══════════════════════════════════════════════════════════════
const _crop = {
  overlay: null, canvas: null, ctx: null,
  img: null,           // Image source
  isPng: false,        // true si la source est un PNG (préserve la transparence)
  ratio: 'free',       // 'free' | nombre
  // Position de l'image dans le canvas (letterbox)
  imgX: 0, imgY: 0, imgW: 0, imgH: 0,
  // Zone de sélection (coordonnées canvas)
  selX: 0, selY: 0, selW: 0, selH: 0,
  dragging: false, resizing: false, creating: false,
  dragOx: 0, dragOy: 0,    // offset drag
  resizeHandle: null,
  _onCrop: null,           // callback(blob)
};
const HANDLE_R = 6; // rayon poignées

function _cropInit() {
  _crop.overlay = document.getElementById('cropperOverlay');
  _crop.canvas  = document.getElementById('cropperCanvas');
  _crop.ctx     = _crop.canvas.getContext('2d');

  // Ratio buttons
  document.querySelectorAll('[data-ratio]').forEach(btn => {
    btn.addEventListener('click', () => {
      _crop.ratio = btn.dataset.ratio === 'free' ? 'free' : +btn.dataset.ratio;
      document.querySelectorAll('[data-ratio]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (_crop.ratio !== 'free') _cropApplyRatio();
      _cropDraw();
    });
  });

  // Mouse
  _crop.canvas.addEventListener('mousedown',  _cropDown);
  _crop.canvas.addEventListener('mousemove',  _cropMove);
  _crop.canvas.addEventListener('mouseup',    _cropUp);
  _crop.canvas.addEventListener('mouseleave', _cropUp);
  // Touch
  _crop.canvas.addEventListener('touchstart',  e => { e.preventDefault(); _cropDown(_cropT(e)); },  { passive: false });
  _crop.canvas.addEventListener('touchmove',   e => { e.preventDefault(); _cropMove(_cropT(e)); },  { passive: false });
  _crop.canvas.addEventListener('touchend',    e => { e.preventDefault(); _cropUp(); },              { passive: false });

  document.getElementById('cropperClose').addEventListener('click',   _cropClose);
  document.getElementById('cropperCancel').addEventListener('click',  _cropClose);
  document.getElementById('cropperValidate').addEventListener('click', _cropValidate);
}

function _cropT(e) {
  const t = e.touches[0] || e.changedTouches[0];
  return { clientX: t.clientX, clientY: t.clientY };
}

function _cropXY(e) {
  const r = _crop.canvas.getBoundingClientRect();
  const sx = _crop.canvas.width  / r.width;
  const sy = _crop.canvas.height / r.height;
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
}

// Détecte la poignée la plus proche (ou null)
function _cropHandleAt(x, y) {
  const { selX: sx, selY: sy, selW: sw, selH: sh } = _crop;
  const handles = {
    tl: [sx,      sy     ], tr: [sx+sw,   sy     ],
    bl: [sx,      sy+sh  ], br: [sx+sw,   sy+sh  ],
    tm: [sx+sw/2, sy     ], bm: [sx+sw/2, sy+sh  ],
    lm: [sx,      sy+sh/2], rm: [sx+sw,   sy+sh/2],
  };
  for (const [k,[hx,hy]] of Object.entries(handles)) {
    if (Math.hypot(x-hx, y-hy) < HANDLE_R*2) return k;
  }
  return null;
}

function _cropInsideSel(x, y) {
  const { selX, selY, selW, selH } = _crop;
  return x >= selX && x <= selX+selW && y >= selY && y <= selY+selH;
}

function _cropApplyRatio() {
  if (_crop.ratio === 'free') return;
  const r = _crop.ratio;
  let { selX, selY, selW, selH } = _crop;
  // Ajuste la hauteur à partir de la largeur actuelle
  const newH = selW / r;
  // Si dépasse le canvas, réduit la largeur
  if (selY + newH > _crop.imgY + _crop.imgH) {
    selH = _crop.imgY + _crop.imgH - selY;
    selW = selH * r;
  } else {
    selH = newH;
  }
  _crop.selW = Math.max(20, selW);
  _crop.selH = Math.max(20, selH);
}

function _cropDown(e) {
  const { x, y } = _cropXY(e);
  const handle = _cropHandleAt(x, y);
  if (handle) {
    _crop.resizing = true;
    _crop.resizeHandle = handle;
    return;
  }
  if (_cropInsideSel(x, y)) {
    _crop.dragging = true;
    _crop.dragOx = x - _crop.selX;
    _crop.dragOy = y - _crop.selY;
    return;
  }
  // Nouvelle sélection
  _crop.creating = true;
  _crop.selX = x; _crop.selY = y;
  _crop.selW = 0; _crop.selH = 0;
}

function _cropMove(e) {
  const { x, y } = _cropXY(e);
  const { imgX, imgY, imgW, imgH } = _crop;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  if (_crop.creating) {
    _crop.selW = x - _crop.selX;
    _crop.selH = y - _crop.selY;
    if (_crop.ratio !== 'free') _crop.selH = _crop.selW / _crop.ratio;
    _cropDraw(); return;
  }

  if (_crop.dragging) {
    _crop.selX = clamp(x - _crop.dragOx, imgX, imgX + imgW - _crop.selW);
    _crop.selY = clamp(y - _crop.dragOy, imgY, imgY + imgH - _crop.selH);
    _cropDraw(); return;
  }

  if (_crop.resizing) {
    const h = _crop.resizeHandle;
    let { selX, selY, selW, selH } = _crop;
    if (h.includes('r')) selW = clamp(x - selX, 20, imgX + imgW - selX);
    if (h.includes('l')) { const r = selX + selW; selX = clamp(x, imgX, r-20); selW = r - selX; }
    if (h.includes('b')) selH = clamp(y - selY, 20, imgY + imgH - selY);
    if (h.includes('t')) { const b = selY + selH; selY = clamp(y, imgY, b-20); selH = b - selY; }
    if (_crop.ratio !== 'free' && (h.includes('r') || h.includes('l'))) selH = selW / _crop.ratio;
    _crop.selX=selX; _crop.selY=selY; _crop.selW=selW; _crop.selH=selH;
    _cropDraw(); return;
  }

  // Curseur adaptatif
  const handle = _cropHandleAt(x, y);
  const cursors = { tl:'nwse-resize', tr:'nesw-resize', bl:'nesw-resize', br:'nwse-resize',
                    tm:'ns-resize', bm:'ns-resize', lm:'ew-resize', rm:'ew-resize' };
  _crop.canvas.style.cursor = handle ? cursors[handle] : (_cropInsideSel(x,y) ? 'move' : 'crosshair');
}

function _cropUp() {
  if (_crop.creating && _crop.selW < 0) { _crop.selX += _crop.selW; _crop.selW = -_crop.selW; }
  if (_crop.creating && _crop.selH < 0) { _crop.selY += _crop.selH; _crop.selH = -_crop.selH; }
  _crop.creating = false; _crop.dragging = false; _crop.resizing = false;
  _cropDraw();
}

function _cropDraw() {
  const { canvas, ctx, img, imgX, imgY, imgW, imgH, selX, selY, selW, selH } = _crop;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Image
  ctx.drawImage(img, imgX, imgY, imgW, imgH);
  // Assombrissement hors sélection
  if (selW > 0 && selH > 0) {
    ctx.fillStyle = 'rgba(0,0,0,.52)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(selX, selY, selW, selH);
    // Redessine l'image dans la sélection (retrouve la clarté)
    ctx.save();
    ctx.beginPath();
    ctx.rect(selX, selY, selW, selH);
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgW, imgH);
    ctx.restore();
    // Cadre de sélection
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(selX, selY, selW, selH);
    // Règle des tiers
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.lineWidth   = .8;
    for (let i=1;i<3;i++) {
      ctx.beginPath(); ctx.moveTo(selX + selW*i/3, selY); ctx.lineTo(selX + selW*i/3, selY+selH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selX, selY + selH*i/3); ctx.lineTo(selX+selW, selY + selH*i/3); ctx.stroke();
    }
    // Poignées
    const handles = [
      [selX,      selY     ],[selX+selW,   selY     ],[selX,      selY+selH  ],[selX+selW,   selY+selH  ],
      [selX+selW/2, selY   ],[selX+selW/2, selY+selH],[selX,      selY+selH/2],[selX+selW,   selY+selH/2],
    ];
    handles.forEach(([hx,hy]) => {
      ctx.beginPath(); ctx.arc(hx, hy, HANDLE_R, 0, Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1; ctx.stroke();
    });
  }
}

function _cropClose() {
  _crop.overlay.style.display = 'none';
}

async function _cropValidate() {
  const { img, imgX, imgY, imgW, imgH, selX, selY, selW, selH, isPng } = _crop;
  const mime    = isPng ? 'image/png' : 'image/jpeg';
  const quality = isPng ? undefined   : .92;
  if (selW < 4 || selH < 4) {
    // Pas de sélection → prend l'image entière
    const out = document.createElement('canvas');
    out.width = img.naturalWidth; out.height = img.naturalHeight;
    const ctx = out.getContext('2d');
    ctx.clearRect(0, 0, out.width, out.height); // préserve transparence PNG
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise(r => out.toBlob(r, mime, quality));
    _cropClose();
    _crop._onCrop(blob); return;
  }
  // Calcul coordonnées image réelles à partir des coordonnées canvas
  const scaleX = img.naturalWidth  / imgW;
  const scaleY = img.naturalHeight / imgH;
  const rx = (selX - imgX) * scaleX;
  const ry = (selY - imgY) * scaleY;
  const rw = selW * scaleX;
  const rh = selH * scaleY;
  const out = document.createElement('canvas');
  out.width = Math.round(rw); out.height = Math.round(rh);
  const ctx = out.getContext('2d');
  ctx.clearRect(0, 0, out.width, out.height); // préserve transparence PNG
  ctx.drawImage(img, rx, ry, rw, rh, 0, 0, out.width, out.height);
  const blob = await new Promise(r => out.toBlob(r, mime, quality));
  _cropClose();
  _crop._onCrop(blob);
}

// Ouvre le cropper sur un File ou une URL
// onCrop(blob) est appelé avec le JPEG recadré
function openCropper(source, onCrop) {
  if (!_crop.overlay) _cropInit();
  _crop._onCrop = onCrop;
  _crop.ratio   = 'free';
  _crop.selW = 0; _crop.selH = 0;
  // Détecte si la source est un PNG pour préserver la transparence
  _crop.isPng = typeof source === 'string'
    ? /\.png(\?|#|$)/i.test(source)
    : (source instanceof File && source.type === 'image/png');
  document.querySelectorAll('[data-ratio]').forEach(b => b.classList.toggle('active', b.dataset.ratio === 'free'));

  const img  = new Image();
  img.onload = () => {
    _crop.img = img;
    // Taille canvas = taille stage CSS (max 800×600)
    const stage  = document.getElementById('cropperStage');
    const maxW   = stage.clientWidth  || 800;
    const maxH   = stage.clientHeight || 540;
    const scale  = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const cW     = Math.round(img.naturalWidth  * scale);
    const cH     = Math.round(img.naturalHeight * scale);
    _crop.canvas.width  = cW;
    _crop.canvas.height = cH;
    // Image centrée (letterbox)
    _crop.imgX = 0; _crop.imgY = 0; _crop.imgW = cW; _crop.imgH = cH;
    // Sélection initiale = 80% de l'image
    const margin = Math.min(cW, cH) * .1;
    _crop.selX = margin; _crop.selY = margin;
    _crop.selW = cW - margin*2; _crop.selH = cH - margin*2;
    _cropDraw();
    _crop.overlay.style.display = 'flex';
  };
  if (typeof source === 'string') { img.crossOrigin = 'anonymous'; img.src = source; }
  else { img.src = URL.createObjectURL(source); }
}

// ══════════════════════════════════════════════════════════════
// CANVAS BRUSH EDITOR — Retouche manuelle du détourage IA
// ══════════════════════════════════════════════════════════════
const _ce = {
  overlay:   null, canvas: null, ctx: null,
  origCanvas: null, // canvas caché avec l'image originale (pour mode Restaurer)
  mode:      'erase',   // 'erase' | 'restore'
  brushSize: 24,
  painting:  false,
  history:   [],        // snapshots ImageData pour undo
  _onValidate: null,    // callback(blob)
  cursor:    null,
};

function _ceInit() {
  _ce.overlay   = document.getElementById('canvasEditorOverlay');
  _ce.canvas    = document.getElementById('ceCanvas');
  _ce.ctx       = _ce.canvas.getContext('2d');
  _ce.cursor    = document.getElementById('ceCursor');

  // Toolbar
  document.getElementById('ceBrushErase').addEventListener('click', () => _ceSetMode('erase'));
  document.getElementById('ceBrushRestore').addEventListener('click', () => _ceSetMode('restore'));
  document.getElementById('ceBrushSize').addEventListener('input', e => {
    _ce.brushSize = +e.target.value;
    document.getElementById('ceSizeVal').textContent = e.target.value;
    _ceCursorSize();
  });
  document.getElementById('ceUndo').addEventListener('click', _ceUndo);

  // Canvas mouse
  _ce.canvas.addEventListener('mousedown',  _cePointerDown);
  _ce.canvas.addEventListener('mousemove',  _cePointerMove);
  _ce.canvas.addEventListener('mouseup',    _cePointerUp);
  _ce.canvas.addEventListener('mouseleave', _cePointerUp);

  // Canvas touch (mobile)
  _ce.canvas.addEventListener('touchstart',  e => { e.preventDefault(); _cePointerDown(_ceTouchToMouse(e)); }, { passive: false });
  _ce.canvas.addEventListener('touchmove',   e => { e.preventDefault(); _cePointerMove(_ceTouchToMouse(e)); }, { passive: false });
  _ce.canvas.addEventListener('touchend',    e => { e.preventDefault(); _cePointerUp(); }, { passive: false });

  // Cursor follow (desktop)
  const stage = document.getElementById('canvasEditorStage');
  stage.addEventListener('mousemove', e => {
    _ce.cursor.style.display = 'block';
    _ce.cursor.style.left = e.clientX + 'px';
    _ce.cursor.style.top  = e.clientY + 'px';
  });
  stage.addEventListener('mouseleave', () => { _ce.cursor.style.display = 'none'; });

  // Close / cancel
  document.getElementById('canvasEditorClose').addEventListener('click',  _ceClose);
  document.getElementById('canvasEditorCancel').addEventListener('click', _ceClose);
  document.getElementById('canvasEditorValidate').addEventListener('click', _ceValidate);
}

function _ceSetMode(mode) {
  _ce.mode = mode;
  document.getElementById('ceBrushErase').classList.toggle('active',   mode === 'erase');
  document.getElementById('ceBrushRestore').classList.toggle('active', mode === 'restore');
}

function _ceCursorSize() {
  const s = _ce.brushSize;
  _ce.cursor.style.width  = s + 'px';
  _ce.cursor.style.height = s + 'px';
}

function _ceTouchToMouse(e) {
  const t = e.touches[0] || e.changedTouches[0];
  return { clientX: t.clientX, clientY: t.clientY };
}

function _ceCanvasXY(e) {
  const rect = _ce.canvas.getBoundingClientRect();
  const scaleX = _ce.canvas.width  / rect.width;
  const scaleY = _ce.canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

function _ceSnapshotForUndo() {
  if (_ce.history.length >= 20) _ce.history.shift(); // garde 20 étapes max
  _ce.history.push(_ce.ctx.getImageData(0, 0, _ce.canvas.width, _ce.canvas.height));
}

function _ceUndo() {
  if (!_ce.history.length) return;
  _ce.ctx.putImageData(_ce.history.pop(), 0, 0);
}

function _cePaint(x, y) {
  const ctx = _ce.ctx;
  const r   = _ce.brushSize / 2;
  ctx.save();
  if (_ce.mode === 'erase') {
    // Efface les pixels de l'image détourée
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
  } else {
    // Restaure les pixels de l'image originale
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(_ce.origCanvas, 0, 0);
  }
  ctx.restore();
}

function _cePointerDown(e) {
  _ceSnapshotForUndo();
  _ce.painting = true;
  const {x, y} = _ceCanvasXY(e);
  _cePaint(x, y);
}
function _cePointerMove(e) {
  if (!_ce.painting) return;
  const {x, y} = _ceCanvasXY(e);
  _cePaint(x, y);
}
function _cePointerUp() { _ce.painting = false; }

async function _ceValidate() {
  const btn = document.getElementById('canvasEditorValidate');
  const lbl = document.getElementById('ceValidateLabel');
  btn.disabled = true;
  lbl.textContent = 'Envoi…';
  try {
    const blob = await new Promise(r => _ce.canvas.toBlob(r, 'image/png'));
    await _ce._onValidate(blob);
    _ceClose();
  } catch(err) {
    lbl.textContent = 'Erreur — réessaie';
    btn.disabled = false;
    setTimeout(() => { lbl.textContent = 'Valider la retouche'; }, 2500);
  }
}

function _ceClose() {
  _ce.overlay.style.display = 'none';
  _ce.history = [];
  _ce.cursor.style.display = 'none';
}

// Ouvre l'éditeur avec originalUrl et enhancedUrl
// onValidate(blob) est appelé avec le PNG retouché
function openCanvasEditor(originalUrl, enhancedUrl, onValidate) {
  if (!_ce.overlay) _ceInit();
  _ce._onValidate = onValidate;
  _ce.history = [];
  _ceSetMode('erase');

  const btnSize   = document.getElementById('ceBrushSize');
  _ce.brushSize   = +btnSize.value;
  document.getElementById('ceSizeVal').textContent = btnSize.value;
  _ceCursorSize();
  document.getElementById('ceValidateLabel').textContent = 'Valider la retouche';
  document.getElementById('canvasEditorValidate').disabled = false;

  // Charger les deux images
  const imgOriginal  = new Image(); imgOriginal.crossOrigin  = 'anonymous';
  const imgEnhanced  = new Image(); imgEnhanced.crossOrigin  = 'anonymous';
  let loadedCount = 0;
  const onLoad = () => {
    loadedCount++;
    if (loadedCount < 2) return;
    const W = imgEnhanced.naturalWidth;
    const H = imgEnhanced.naturalHeight;

    // Canvas principal = image détourée par IA
    _ce.canvas.width  = W;
    _ce.canvas.height = H;
    _ce.ctx.clearRect(0, 0, W, H);
    _ce.ctx.drawImage(imgEnhanced, 0, 0);

    // Canvas caché = image originale (pour mode Restaurer)
    _ce.origCanvas        = document.createElement('canvas');
    _ce.origCanvas.width  = W;
    _ce.origCanvas.height = H;
    _ce.origCanvas.getContext('2d').drawImage(imgOriginal, 0, 0, W, H);

    _ce.overlay.style.display = 'flex';
  };
  imgOriginal.onload = imgEnhanced.onload = onLoad;
  imgOriginal.src    = originalUrl;
  imgEnhanced.src    = enhancedUrl;
}

function renderPhotos() {
  const el = document.getElementById('photosList'); if (!el) return;
  const hasIntention = !!_getSelectedVerbeTextColor();
  el.innerHTML = state.editPhotos.map((filename,i) => `
    <div class="photo-card${i===0&&state.editPhotos.length>1?' is-main':''}" draggable="true" data-i="${i}">
      <div class="photo-thumb-wrap">
        ${i===0&&state.editPhotos.length>1?'<div class="photo-main-badge">⊙ Principale</div>':''}
        <img src="${photoUrl(filename)}" alt="" draggable="false">
        <button class="photo-remove" data-i="${i}" title="Supprimer">✕</button>
      </div>
      <div class="photo-ai-bar">
        <div class="photo-edit-row">
          ${i>0 ? `<button class="photo-btn photo-set-main" data-i="${i}" title="Afficher cette photo en premier sur la carte">
            <span class="photo-btn-label">☆ Principale</span>
          </button>` : '<div class="photo-btn-spacer"></div>'}
          <button class="photo-btn photo-crop" data-i="${i}" title="Recadrer l'image">
            <span class="photo-btn-label">Recadrer</span>
          </button>
          <button class="photo-btn photo-enhance" data-i="${i}" data-filename="${esc(filename)}" title="Supprimer le fond — PNG transparent">
            <span class="photo-btn-label">Détourage</span>
          </button>
        </div>
        <div class="photo-ai-row">
          ${i===0 ? `<button class="photo-btn photo-analyze" data-i="0" title="Analyser l'objet et pré-remplir la fiche">
            <span class="photo-btn-label">Analyser</span>
          </button>` : ''}
          <button class="photo-btn photo-stylize" data-i="${i}" data-filename="${esc(filename)}"
            title="Générer une mise en scène colorée">
            <span class="photo-btn-label">Ambiance</span>
          </button>
        </div>
      </div>
    </div>`).join('');

  let dragSrcIdx = null;
  el.querySelectorAll('.photo-card').forEach(card=>{
    card.addEventListener('dragstart',e=>{ dragSrcIdx=parseInt(card.dataset.i); e.dataTransfer.effectAllowed='move'; requestAnimationFrame(()=>card.classList.add('dragging')); });
    card.addEventListener('dragend',()=>{ card.classList.remove('dragging'); el.querySelectorAll('.photo-card').forEach(w=>w.classList.remove('drop-target')); });
    card.addEventListener('dragover',e=>{ e.preventDefault(); el.querySelectorAll('.photo-card').forEach(w=>w.classList.remove('drop-target')); if(parseInt(card.dataset.i)!==dragSrcIdx) card.classList.add('drop-target'); });
    card.addEventListener('dragleave',()=>card.classList.remove('drop-target'));
    card.addEventListener('drop',e=>{ e.preventDefault(); const targetIdx=parseInt(card.dataset.i); if(dragSrcIdx===null||dragSrcIdx===targetIdx) return; const [moved]=state.editPhotos.splice(dragSrcIdx,1); state.editPhotos.splice(targetIdx,0,moved); renderPhotos(); });
  });

  el.querySelectorAll('.photo-remove').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      state.editPhotos.splice(i,1);
      await api.post('/api/remove-photo', { ref: filename });
      renderPhotos();
    });
  });

  // ── Mettre en 1ère position (photo principale de la carte) ────────────────────
  el.querySelectorAll('.photo-set-main').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const [moved] = state.editPhotos.splice(i, 1);
      state.editPhotos.unshift(moved);
      renderPhotos();
    });
  });

  el.querySelectorAll('.photo-enhance').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      const wrap = btn.closest('.photo-card');

      // ── Skeleton loading state ──
      const skeleton = document.createElement('div');
      skeleton.className = 'photo-skeleton';
      skeleton.innerHTML = `<div class="photo-skeleton-spinner"></div><div class="photo-skeleton-label">Retouche AI<br>en cours…</div>`;
      wrap.querySelector(".photo-thumb-wrap").appendChild(skeleton);
      btn.disabled = true;

      try {
        const result = await api.post('/api/enhance-photo', { filename });
        if (result.error) {
          skeleton.remove();
          btn.disabled = false;
          _showPhotoToast('Erreur lors de la retouche AI. Veuillez réessayer.');
          return;
        }

        // ── Remove skeleton, show before/after comparison ──
        skeleton.remove();

        // Build compare block spanning 2 columns, inserted after current wrap
        const compareEl = document.createElement('div');
        compareEl.className = 'photo-compare-wrap';
        compareEl.innerHTML = `
          <div class="photo-compare-images">
            <div class="photo-compare-side">
              <img src="${photoUrl(filename)}" alt="Avant">
              <div class="photo-compare-label">Avant</div>
            </div>
            <div class="photo-compare-sep"></div>
            <div class="photo-compare-side">
              <img src="${photoUrl(result.enhancedFilename)}" alt="Après · Retouche AI" id="cePreviewImg">
              <div class="photo-compare-label">Après · Retouche AI</div>
            </div>
          </div>
          <div class="photo-compare-actions">
            <button class="photo-compare-cancel">Annuler</button>
            <button class="photo-compare-refine">✎ Retoucher</button>
            <button class="photo-compare-apply">Appliquer</button>
          </div>`;

        // Insert after the wrap, or append at end
        if (wrap.nextSibling) {
          el.insertBefore(compareEl, wrap.nextSibling);
        } else {
          el.appendChild(compareEl);
        }

        // Hide the original thumbnail during comparison
        wrap.style.opacity = '.35';
        wrap.style.pointerEvents = 'none';

        // Helper : applique un filename final dans le state (conserve l'originale)
        const _applyFilename = (finalFilename) => {
          // Insère la version traitée juste après l'originale — l'originale est conservée
          state.editPhotos.splice(i + 1, 0, finalFilename);
          // Déplace en première position (photo principale de la carte)
          const [moved] = state.editPhotos.splice(state.editPhotos.indexOf(finalFilename), 1);
          state.editPhotos.unshift(moved);
          compareEl.remove();
          renderPhotos();
        };

        compareEl.querySelector('.photo-compare-apply').addEventListener('click', () => {
          _applyFilename(result.enhancedFilename);
        });

        // Bouton Retoucher → ouvre le canvas editor
        compareEl.querySelector('.photo-compare-refine').addEventListener('click', () => {
          openCanvasEditor(
            photoUrl(filename),               // image originale (pour Restaurer)
            photoUrl(result.enhancedFilename), // image détourée par l'IA
            async (blob) => {
              // Upload le PNG retouché vers Cloudinary
              const file = new File([blob], 'retouche.png', { type: 'image/png' });
              const { filenames } = await api.uploadPhotos([file]);
              const refinedFilename = filenames[0];
              // Supprimer l'ancienne image enhanced de Cloudinary (silencieux)
              api.post('/api/remove-photo', { ref: result.enhancedFilename }).catch(() => {});
              _applyFilename(refinedFilename);
            }
          );
        });

        compareEl.querySelector('.photo-compare-cancel').addEventListener('click', () => {
          // Delete the enhanced file from server silently, restore UI
          api.post('/api/remove-photo', { ref: result.enhancedFilename }).catch(()=>{});
          compareEl.remove();
          wrap.style.opacity = '';
          wrap.style.pointerEvents = '';
          btn.disabled = false;
        });

      } catch(err) {
        skeleton.remove();
        btn.disabled = false;
        _showPhotoToast('Erreur lors de la retouche AI. Veuillez réessayer.');
      }
    });
  });

  // ── Stylize (ambiance) buttons ──────────────────────────────────────────────
  el.querySelectorAll('.photo-stylize').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();

      // Couleur du verbe sélectionné, ou neutre chaud par défaut
      const hexColor = _getSelectedVerbeTextColor() || '#8B7355';

      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      const wrap = btn.closest('.photo-card');

      // ── Skeleton loading ──
      const skeleton = document.createElement('div');
      skeleton.className = 'photo-skeleton';
      skeleton.innerHTML = `<div class="photo-skeleton-spinner"></div><div class="photo-skeleton-label">Ambiance AI<br>en cours…</div>`;
      wrap.querySelector(".photo-thumb-wrap").appendChild(skeleton);
      btn.disabled = true;
      // also disable enhance on same thumb
      /* détourage désactivé pendant ambiance */

      try {
        // Phase 1 — Cloudinary : couleur + contraste + teinte
        const result = await api.post('/api/stylize-photo', { filename, hexColor });
        if (result.error) {
          skeleton.remove();
          btn.disabled = false;
          _showPhotoToast(`Erreur ambiance : ${result.error}`);
          return;
        }

        // Phase 2 — Canvas : grain film + vignette blanche
        const skLabel = skeleton.querySelector('.photo-skeleton-label');
        if (skLabel) skLabel.innerHTML = 'Grain &amp; vignette…';
        let finalFilename = result.stylizedFilename;
        try {
          const canvasFilename = await _applyAmbianceCanvas(result.stylizedFilename);
          // Supprimer l'intermédiaire Cloudinary
          api.post('/api/remove-photo', { ref: result.stylizedFilename }).catch(() => {});
          finalFilename = canvasFilename;
        } catch (canvasErr) {
          console.warn('Canvas ambiance fallback:', canvasErr.message);
          // Garde la version Cloudinary sans grain/vignette
        }

        skeleton.remove();

        // Build before/after compare block
        const compareEl = document.createElement('div');
        compareEl.className = 'photo-compare-wrap';
        compareEl.innerHTML = `
          <div class="photo-compare-images">
            <div class="photo-compare-side">
              <img src="${photoUrl(filename)}" alt="Avant">
              <div class="photo-compare-label">Original</div>
            </div>
            <div class="photo-compare-sep"></div>
            <div class="photo-compare-side">
              <img src="${photoUrl(finalFilename)}" alt="Après">
              <div class="photo-compare-label">Ambiance AI</div>
            </div>
          </div>
          <div class="photo-compare-actions">
            <button class="photo-compare-cancel">Annuler</button>
            <button class="photo-compare-apply">Appliquer l'ambiance</button>
          </div>`;

        if (wrap.nextSibling) {
          el.insertBefore(compareEl, wrap.nextSibling);
        } else {
          el.appendChild(compareEl);
        }

        wrap.style.opacity = '.35';
        wrap.style.pointerEvents = 'none';

        compareEl.querySelector('.photo-compare-apply').addEventListener('click', () => {
          state.editPhotos.push(finalFilename);
          compareEl.remove();
          renderPhotos();
        });

        compareEl.querySelector('.photo-compare-cancel').addEventListener('click', () => {
          api.post('/api/remove-photo', { ref: finalFilename }).catch(() => {});
          compareEl.remove();
          wrap.style.opacity = '';
          wrap.style.pointerEvents = '';
          btn.disabled = false;
        });

      } catch (err) {
        skeleton.remove();
        btn.disabled = false;
        _showPhotoToast(`Erreur ambiance : ${err.message}`);
      }
    });
  });

  // Bouton "Re-analyser" sur la première photo
  // ── Recadrer : ouvre le cropper canvas sur la photo existante ──
  el.querySelectorAll('.photo-crop').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      openCropper(photoUrl(filename), async (croppedBlob) => {
        const isPng      = croppedBlob.type === 'image/png';
        const ext        = isPng ? 'png' : 'jpg';
        const croppedFile = new File([croppedBlob], `crop_${Date.now()}.${ext}`, { type: croppedBlob.type });
        const { filenames } = await api.uploadPhotos([croppedFile]);
        if (filenames?.[0]) {
          const old = state.editPhotos[i];
          state.editPhotos.splice(i, 1, filenames[0]);
          await api.post('/api/remove-photo', { ref: old });
          renderPhotos();
        }
      });
    });
  });

  // ── Détourer : ouvre l'éditeur de gomme pour détourage manuel ──
  el.querySelectorAll('.photo-detour').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      const url = photoUrl(filename);
      // Titre spécifique pour le mode détourage
      const labelEl = document.getElementById('ceValidateLabel');
      if (labelEl) labelEl.textContent = 'Valider le détourage';
      openCanvasEditor(url, url, async (detourBlob) => {
        const detourFile = new File([detourBlob], `detour_${Date.now()}.png`, { type: 'image/png' });
        const { filenames } = await api.uploadPhotos([detourFile]);
        if (filenames?.[0]) {
          const old = state.editPhotos[i];
          state.editPhotos.splice(i, 1, filenames[0]);
          await api.post('/api/remove-photo', { ref: old });
          renderPhotos();
        }
      });
    });
  });

  el.querySelectorAll('.photo-analyze').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      _analyzeAndFillForm(filename);
    });
  });
}

async function handlePhotoFiles(files) {
  if (!files.length) return;
  // Recadrage séquentiel : une image à la fois
  for (const file of files) {
    await new Promise(resolve => {
      openCropper(file, async (croppedBlob) => {
        const isPng      = croppedBlob.type === 'image/png';
        const ext        = isPng ? 'png' : 'jpg';
        const baseName   = file.name.replace(/\.\w+$/, '');
        const croppedFile = new File([croppedBlob], `${baseName}.${ext}`, { type: croppedBlob.type });
        const { filenames } = await api.uploadPhotos([croppedFile]);
        state.editPhotos.push(...filenames);
        renderPhotos();
        resolve();
      });
    });
  }

  // Auto-analyse IA si c'est la première photo et que le nom est vide
  if (state.editPhotos.length > 0 && !document.getElementById('fName')?.value.trim()) {
    _analyzeAndFillForm(state.editPhotos[0]);
  }
}

// ── Private Photos ─────────────────────────────────────────────────────────────
function renderPrivatePhotos() {
  const el = document.getElementById('privatePhotosList'); if (!el) return;
  el.innerHTML = state.editPrivatePhotos.map((filename,i) => `
    <div class="photo-thumb-wrap photo-thumb-sm" data-i="${i}">
      <img src="${photoUrl(filename)}" alt="">
      <button class="photo-remove photo-remove-priv" data-i="${i}" title="Supprimer">✕</button>
    </div>`).join('');
  el.querySelectorAll('.photo-remove-priv').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      state.editPrivatePhotos.splice(parseInt(btn.dataset.i),1);
      renderPrivatePhotos();
    });
  });
}

async function handlePrivatePhotoFiles(files) {
  if (!files.length) return;
  const {filenames} = await api.uploadPhotos([...files]);
  state.editPrivatePhotos.push(...filenames);
  renderPrivatePhotos();
}

// ── Date Picker (achat) ────────────────────────────────────────────────────────
function dateAchatDisplayUpdate() {
  const el = document.getElementById('dateAchatDisplayText');
  if (el) el.textContent = state.dpAchatSelectedDate ? formatDate(state.dpAchatSelectedDate) : 'Choisir une date';
  renderDpAchatMonths();
}

function renderDpAchatMonths() {
  const yearEl = document.getElementById('dpAchatYear');
  if (yearEl) yearEl.textContent = state.dpAchatYear;
  const [selY,selM] = (state.dpAchatSelectedDate||'').split('-');
  const container = document.getElementById('dpAchatMonths');
  if (!container) return;
  container.innerHTML = MONTHS.map((m,i)=>{
    const mm=String(i+1).padStart(2,'0');
    const sel=String(state.dpAchatYear)===selY&&mm===selM?'selected':'';
    return `<div class="dp-month ${sel}" data-m="${mm}">${m}</div>`;
  }).join('');
  container.querySelectorAll('.dp-month').forEach(el=>{
    el.addEventListener('click',e=>{
      e.stopPropagation();
      state.dpAchatSelectedDate=`${state.dpAchatYear}-${el.dataset.m}`;
      document.getElementById('fDateAchat').value=state.dpAchatSelectedDate;
      dateAchatDisplayUpdate();
      document.getElementById('dateAchatPickerPanel').classList.remove('open');
    });
  });
}

// ── Keywords ───────────────────────────────────────────────────────────────────
function renderTagChips() {
  const wrap=document.getElementById('keywordsWrap');
  const input=document.getElementById('keywordsInput');
  wrap.querySelectorAll('.tag-chip').forEach(el=>el.remove());
  state.editKeywords.forEach((tag,i)=>{
    const chip=document.createElement('span');
    chip.className='tag-chip';
    chip.innerHTML=`${esc(tag)}<button data-i="${i}">✕</button>`;
    chip.querySelector('button').addEventListener('click',e=>{ e.stopPropagation(); state.editKeywords.splice(i,1); renderTagChips(); });
    wrap.insertBefore(chip,input);
  });
}
function addKeyword(val) {
  const v=val.trim();
  if (v&&!state.editKeywords.includes(v)) { state.editKeywords.push(v); renderTagChips(); }
  const input=document.getElementById('keywordsInput');
  input.value=''; input.dispatchEvent(new Event('input'));
}
function setupKeywordInput() {
  const input=document.getElementById('keywordsInput');
  const sugEl=document.getElementById('keywordsSuggestions');
  let activeIdx=-1;
  const showSuggestions=q=>{
    const pool=q?state.keywords.filter(k=>k.toLowerCase().includes(q)&&!state.editKeywords.includes(k)):state.keywords.filter(k=>!state.editKeywords.includes(k));
    if (!pool.length) { sugEl.classList.remove('open'); return; }
    activeIdx=-1;
    sugEl.innerHTML=pool.slice(0,12).map(k=>`<div class="suggestion-item" data-val="${esc(k)}">${esc(k)}</div>`).join('');
    sugEl.querySelectorAll('.suggestion-item').forEach(item=>item.addEventListener('mousedown',e=>{ e.preventDefault(); addKeyword(item.dataset.val); }));
    sugEl.classList.add('open');
  };
  input.addEventListener('keydown',e=>{
    const items=sugEl.querySelectorAll('.suggestion-item');
    if (e.key==='Enter'||e.key===',') { e.preventDefault(); addKeyword(items[activeIdx]?.dataset.val||input.value); activeIdx=-1; }
    else if (e.key==='Backspace'&&!input.value&&state.editKeywords.length) { state.editKeywords.pop(); renderTagChips(); input.dispatchEvent(new Event('input')); }
    else if (e.key==='ArrowDown') { e.preventDefault(); activeIdx=Math.min(activeIdx+1,items.length-1); items.forEach((it,i)=>it.classList.toggle('active',i===activeIdx)); }
    else if (e.key==='ArrowUp')   { e.preventDefault(); activeIdx=Math.max(activeIdx-1,0); items.forEach((it,i)=>it.classList.toggle('active',i===activeIdx)); }
    else if (e.key==='Escape') sugEl.classList.remove('open');
  });
  input.addEventListener('input',()=>showSuggestions(input.value.toLowerCase().trim()));
  input.addEventListener('focus',()=>showSuggestions(input.value.toLowerCase().trim()));
  input.addEventListener('blur',()=>setTimeout(()=>sugEl.classList.remove('open'),150));
}

// ── Dark Mode ──────────────────────────────────────────────────────────────────
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark-mode', state.darkMode);
  document.getElementById('darkModeBtn').textContent = state.darkMode ? '◐' : '◑';
  localStorage.setItem('darkMode', state.darkMode);
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function showKwPreview(kw,mouseEvent) {
  const preview=document.getElementById('kwFloatPreview');
  const cols=state.collections.filter(c=>(c.keywords||[]).includes(kw));
  const thumbs=cols.filter(c=>c.photos?.length).slice(0,5).map(c=>`<img src="${photoUrl(c.photos[0])}" style="width:46px;height:46px;object-fit:cover;border-radius:3px;flex-shrink:0">`).join('');
  preview.innerHTML=`<div style="padding:10px 12px"><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:${thumbs?8:0}px">${esc(kw)} <span style="font-weight:400;color:var(--text-3)">· ${cols.length}</span></div>${thumbs?`<div style="display:flex;gap:4px">${thumbs}</div>`:''}</div>`;
  preview.style.display='block';
  const W=264,gap=12;
  let left=mouseEvent.clientX+gap;
  if(left+W>window.innerWidth-8) left=mouseEvent.clientX-W-gap;
  const h=preview.offsetHeight||80;
  const top=Math.max(8,Math.min(mouseEvent.clientY-h/2,window.innerHeight-h-8));
  preview.style.left=left+'px'; preview.style.top=top+'px';
}
function hideKwPreview() { document.getElementById('kwFloatPreview').style.display='none'; }

// ── Stats helpers ──────────────────────────────────────────────────────────────
function _hexToRgb(hex) {
  const h = (hex||'#2D2D2D').replace('#','');
  const n = parseInt(h.length === 3 ? h.split('').map(x=>x+x).join('') : h, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

let _statsBubbleSim = null;

function _renderStatsBubbles(verbeDist) {
  if (_statsBubbleSim) { _statsBubbleSim.stop(); _statsBubbleSim = null; }
  const el = document.getElementById('statsBubbles');
  if (!el) return;
  el.innerHTML = '';

  if (!verbeDist.length) {
    el.innerHTML = '<span style="color:var(--text-3);font-size:13px;font-style:italic">Aucune intention assignée</span>';
    return;
  }

  // Fallback statique si D3 absent
  if (!window.d3) {
    const maxCount = Math.max(...verbeDist.map(v => v.count));
    el.innerHTML = verbeDist.map(v => {
      const size = Math.round(72 + (v.count / maxCount) * 128);
      const [r,g,b] = _hexToRgb(v.bg);
      const luma = 0.299*r + 0.587*g + 0.114*b;
      const tc = luma > 160 ? `rgba(${r},${g},${b},1)` : `rgba(255,255,255,.9)`;
      return `<div class="stats-bubble" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 32% 32%,rgba(${r},${g},${b},.28),rgba(${r},${g},${b},.75));border:1px solid rgba(${r},${g},${b},.22)" title="${v.name}">
        <span class="stats-bubble-count" style="color:${tc}">${v.count}</span>
        <span class="stats-bubble-name" style="color:${tc}">${v.name}</span>
      </div>`;
    }).join('');
    return;
  }

  // ── D3 force — bulles orbitales ────────────────────────────────────────────
  const W = el.clientWidth || 720;
  const H = 340;
  const maxCount = Math.max(...verbeDist.map(v => v.count));
  const minR = 38, maxR = 88;

  const nodes = verbeDist.map(v => ({
    ...v,
    r: Math.round(minR + (v.count / maxCount) * (maxR - minR)),
    x: W / 2 + (Math.random() - 0.5) * 260,
    y: H / 2 + (Math.random() - 0.5) * 120,
  }));

  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%').style('height', `${H}px`).style('overflow', 'visible');

  const nodeEls = svg.selectAll('g.sgn').data(nodes).join('g')
    .attr('class', 'sgn').style('cursor', 'pointer');

  nodeEls.each(function(d) {
    const g = d3.select(this);
    const [r, gv, b] = _hexToRgb(d.bg);
    const luma = 0.299 * r + 0.587 * gv + 0.114 * b;
    const textFill = luma > 160 ? d.bg : '#fff';

    // Aura de fond
    g.append('circle').attr('r', d.r)
      .attr('fill', d.bg).attr('fill-opacity', 0.13)
      .attr('stroke', d.bg).attr('stroke-width', 1.5).attr('stroke-opacity', 0.45);

    // Nombre — grand, centré
    g.append('text')
      .attr('class', 'sgn-count')
      .attr('y', d.r < 55 ? -2 : -6)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', d.bg)
      .text(d.count);

    // Nom — Spectral italic, dessous
    g.append('text')
      .attr('class', 'sgn-name')
      .attr('y', d.r < 55 ? 14 : 18)
      .attr('text-anchor', 'middle')
      .attr('fill', d.bg)
      .text(d.name);
  });

  // Drag + click → filtrer l'inventaire
  const drag = d3.drag()
    .on('start', (ev, d) => { if (!ev.active) _statsBubbleSim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
    .on('end',   (ev, d) => { if (!ev.active) _statsBubbleSim.alphaTarget(0); d.fx = null; d.fy = null; });

  nodeEls.call(drag).on('click', (ev, d) => {
    ev.stopPropagation();
    state.categoryFilter = d.name;
    state.gravityMode = false;
    state.attrFilters.subcat = [];
    setView('grid');
    buildCategoryFilterBar();
    render();
  });

  // Simulation — bulles qui se repoussent et restent dans le cadre
  _statsBubbleSim = d3.forceSimulation(nodes)
    .force('center',  d3.forceCenter(W / 2, H / 2).strength(0.06))
    .force('collide', d3.forceCollide(d => d.r + 12).strength(0.88))
    .force('charge',  d3.forceManyBody().strength(-30))
    .alphaDecay(0.018)
    .velocityDecay(0.42)
    .on('tick', () => {
      nodes.forEach(n => {
        n.x = Math.max(n.r + 6, Math.min(W - n.r - 6, n.x));
        n.y = Math.max(n.r + 6, Math.min(H - n.r - 6, n.y));
      });
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });
}

function _renderStatusBars(statusFreq, total) {
  const el = document.getElementById('statsStatusBars');
  if (!el) return;
  const statuses = [
    { key: 'Disponible',   color: '#22c55e' },
    { key: 'Vendu',        color: '#9ca3af' },
    { key: 'Pas à vendre', color: '#7c3aed' },
    { key: 'Brouillon',    color: '#d1d5db' }
  ];
  const withData = statuses.filter(s => (statusFreq[s.key]||0) > 0);
  if (!withData.length) { el.innerHTML = ''; return; }
  el.innerHTML = withData.map(s => {
    const count = statusFreq[s.key] || 0;
    const pct = total ? Math.round(count / total * 100) : 0;
    const [r,g,b] = _hexToRgb(s.color);
    return `<div class="stats-grad-bar-row">
      <div class="stats-grad-bar-meta">
        <span class="stats-grad-bar-name">${s.key}</span>
        <span class="stats-grad-bar-count">${count}<span class="stats-grad-bar-pct">${pct}%</span></span>
      </div>
      <div class="stats-grad-bar-track">
        <div class="stats-grad-bar-fill" style="width:${pct}%;background:linear-gradient(to right, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},.08) 100%);"></div>
      </div>
    </div>`;
  }).join('');
}

function renderStats() {
  if (_statsBubbleSim) { _statsBubbleSim.stop(); _statsBubbleSim = null; }
  Object.entries(_charts).forEach(([k,c])=>{ try{c.destroy();}catch(e){} delete _charts[k]; });
  const cols=state.collections;
  const total=cols.length;
  const freq=arr=>arr.reduce((m,k)=>{ m[k]=(m[k]||0)+1; return m; },{});
  const catFreq=freq(cols.map(c=>c.category||'Sans catégorie'));
  const topCatEntry=Object.entries(catFreq).sort((a,b)=>b[1]-a[1])[0];
  const statusFreq=freq(cols.map(c=>c.itemStatus||'—'));
  const disponibleCount=cols.filter(c=>c.itemStatus==='Disponible').length;
  const valeurDispo=cols.filter(c=>c.itemStatus==='Disponible'&&c.price!=null).reduce((s,c)=>s+(c.price||0),0);
  const kwFreq=freq(cols.flatMap(c=>c.keywords||[]));
  const allKws=Object.entries(kwFreq).sort((a,b)=>b[1]-a[1]);
  const topKws=_kwShowAll?allKws:allKws.slice(0,30);

  // KPIs
  document.getElementById('kpiTotal').textContent=total||'—';
  document.getElementById('kpiDisponible').textContent=disponibleCount||'—';
  document.getElementById('kpiCat').textContent=topCatEntry?topCatEntry[0]:'—';
  document.getElementById('kpiValeur').textContent=valeurDispo?valeurDispo.toFixed(0)+' €':'—';

  // Intentions — bulles
  const verbeDist = getVerbes().map(v => ({
    name: v.name,
    count: cols.filter(c => c.category === v.name).length,
    bg: v.bgColor || v.color || '#2D2D2D'
  })).filter(v => v.count > 0).sort((a,b) => b.count - a.count);
  _renderStatsBubbles(verbeDist);

  // Statuts — barres dégradé
  _renderStatusBars(statusFreq, total);

  if (!total || !topKws.length) return;

  // Mots-clés — Chart.js horizontal bar (épuré)
  Chart.defaults.font.family="'Inter',-apple-system,BlinkMacSystemFont,sans-serif";
  Chart.defaults.font.size=11; Chart.defaults.color='#a8a49e';
  const gridColor='#edeae5';

  document.querySelector('.stats-chart-wrap-kw').style.height=Math.max(280,topKws.length*26+40)+'px';
  const kwCanvas=document.getElementById('chartKw');
  kwCanvas.onmouseleave=hideKwPreview;
  _charts.kw=new Chart(kwCanvas,{
    type:'bar',
    data:{
      labels:topKws.map(([k])=>k),
      datasets:[{
        data:topKws.map(([,v])=>v),
        backgroundColor:topKws.map((_,i)=>{
          const t=topKws.length>1?i/(topKws.length-1):0;
          return `rgba(45,45,45,${Math.round((1-t*.62)*100)/100})`;
        }),
        borderRadius:0, borderSkipped:false
      }]
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      onClick:(event,elements)=>{if(!elements.length)return;const kw=topKws[elements[0].index][0];hideKwPreview();state.activeKeywordFilters.add(kw);renderSearchActiveTags();setView('grid');},
      onHover:(event,elements)=>{const canvas=event.native?.target;if(!canvas)return;if(elements.length){canvas.style.cursor='pointer';showKwPreview(topKws[elements[0].index][0],event.native);}else{canvas.style.cursor='default';hideKwPreview();}},
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{
        x:{grid:{color:gridColor},border:{display:false},ticks:{stepSize:1,precision:0,color:'#c4c0b8'}},
        y:{grid:{display:false},border:{display:false},ticks:{color:'#6b6762'}}
      }
    }
  });
  const kwBtn=document.getElementById('kwShowAllBtn');
  if(allKws.length>30){kwBtn.style.display='';kwBtn.textContent=_kwShowAll?'− Réduire':`+ ${allKws.length-30} de plus`;kwBtn.onclick=()=>{_kwShowAll=!_kwShowAll;renderStats();};}
  else kwBtn.style.display='none';
}

// ── Standalone Settings Modal (gear icon) ─────────────────────────────────────
const _smExpandedVerbes = new Set();
const _smExpandedSections = new Set(['verbes']); // sections accordion ouvertes

// Mapping: clé accordéon SM → clé dans attributeLabels
const SM_LABEL_KEY = { colors: 'couleurs' }; // tous les autres: même clé

// Titres par défaut de chaque section
const SM_SECTION_DEFAULTS = {
  verbes:      'Verbes & Intentions',
  matieres:    'Matières',
  colors:      'Teintes',
  motifs:      'Motifs',
  origine:     'Identité',
  etat_traces: 'États',
  usage:       'Fonctions & Usages',
  univers:     'Atmosphères',
  locations:   'Emplacements',
  trios:       'Triptyques'
};

// Labels par défaut des onglets Trios
const TRIOS_TAB_DEFAULTS = ['Hasard Contrôlé', 'Règles d\'Art', 'Éditeur Manuel'];
const TRIOS_TAB_KEYS     = ['triosTab0', 'triosTab1', 'triosTab2'];

function getTriosTabLabel(idx) {
  const key = TRIOS_TAB_KEYS[idx];
  return (state.settings.triosTabLabels?.[key]) || TRIOS_TAB_DEFAULTS[idx];
}

function isTriosTabHidden(idx) {
  const key = TRIOS_TAB_KEYS[idx];
  return !!(state.settings.triosTabHidden?.[key]);
}

function _syncTriosTabLabels() {
  document.querySelectorAll('.trios-tab-btn').forEach((btn, i) => {
    btn.textContent = getTriosTabLabel(i);
    // Masquer l'onglet si marqué hidden dans Paramètres
    btn.style.display = isTriosTabHidden(i) ? 'none' : '';
  });
}

function smGetCurrentLabel(draft, smKey) {
  const labelKey = SM_LABEL_KEY[smKey] || smKey;
  return (draft.attributeLabels && draft.attributeLabels[labelKey]) || SM_SECTION_DEFAULTS[smKey] || smKey;
}

function openSettingsModal() {
  state.settingsDraft = JSON.parse(JSON.stringify(state.settings));
  if (!state.settingsDraft.attributeOptions) {
    state.settingsDraft.attributeOptions = {
      matieres:    [...ATTRIBUTES_DEF.matieres.options],
      origine:     [...ATTRIBUTES_DEF.origine.options],
      etat_traces: [...ATTRIBUTES_DEF.etat_traces.options],
      usage:       [...ATTRIBUTES_DEF.usage.options],
      role:        [...ATTRIBUTES_DEF.role.options]
    };
  }
  // S'assurer que origine est toujours initialisé même sur ancien draft
  if (!state.settingsDraft.attributeOptions.origine) {
    state.settingsDraft.attributeOptions.origine = [...ATTRIBUTES_DEF.origine.options];
  }
  // Initialiser le format groupé si absent ou flat
  const ao = state.settingsDraft.attributeOptions;
  if (!isGrouped(ao.matieres)) {
    ao.matieres = JSON.parse(JSON.stringify(MATIERES_GROUPS_DEFAULT));
  }
  if (!isGrouped(ao.motifs)) {
    // Migrer draft.motifs (flat) vers groupé si présent
    const legacyMotifs = state.settingsDraft.motifs;
    if (legacyMotifs?.length) {
      ao.motifs = [{ famille: 'Motifs', tags: [...legacyMotifs] }];
    } else {
      ao.motifs = JSON.parse(JSON.stringify(MOTIFS_GROUPS_DEFAULT));
    }
  }
  if (!state.settingsDraft.attributeLabels) state.settingsDraft.attributeLabels = {};
  _smExpandedVerbes.clear();
  _smExpandedSections.clear();
  _smExpandedSections.add('verbes');
  renderSettingsModal();
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

async function saveSettingsModal() {
  const d = state.settingsDraft;
  if (!d.verbes) d.verbes = [];
  const titleInput = document.querySelector('#settingsModalBody .sm-sitetitle-input');
  if (titleInput) d.siteTitle = titleInput.value.trim() || 'ARCHIVE';
  // Lecture directe des labels Trios depuis le DOM (plus fiable que l'événement input)
  document.querySelectorAll('#settingsModalBody .sm-trios-input').forEach(inp => {
    if (!d.triosTabLabels) d.triosTabLabels = {};
    const val = inp.value.trim();
    d.triosTabLabels[inp.dataset.triosKey] = val || '';
  });
  const saveBtn = document.getElementById('settingsModalSave');
  const origText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Enregistrement…';
  try {
    state.settings = await api.put('/api/settings', d);
    try { localStorage.setItem('charlottearchive_settings', JSON.stringify(state.settings)); } catch(_) {}
    ATTRIBUTES_DEF.couleurs.options = state.settings.colors || [];
    ATTRIBUTES_DEF.motifs.options   = state.settings.motifs || [];
    applyAttributeOptions();
    syncAttrLabels();
    const custom = state.settings.customColorHexes || {};
    Object.entries(custom).forEach(([name, hex]) => { COLOR_MAP[name] = hex; });
    document.getElementById('siteTitle').textContent = state.settings.siteTitle || 'ARCHIVE';
    buildCategoryFilterBar();
    populateCategoryDropdown();
    populateLocationDropdown();
    renderAllAttributes();
    renderUniversChips();
    render();
    _syncTriosTabLabels();
    closeSettingsModal();
  } catch(err) {
    try { localStorage.setItem('charlottearchive_settings_draft', JSON.stringify(d)); } catch(_) {}
    saveBtn.textContent = 'Erreur — réessayer';
    saveBtn.disabled = false;
    return;
  }
  saveBtn.disabled = false;
  saveBtn.textContent = origText;
}

function smGetArray(draft, key) {
  switch(key) {
    case 'colors':    return draft.colors    || (draft.colors = []);
    case 'motifs': {
      // motifs maintenant en format groupé dans attributeOptions
      if (!draft.attributeOptions) draft.attributeOptions = {};
      if (!draft.attributeOptions.motifs) draft.attributeOptions.motifs = JSON.parse(JSON.stringify(MOTIFS_GROUPS_DEFAULT));
      return null; // groupé, pas un flat array
    }
    case 'univers':   return draft.univers   || (draft.univers = []);
    case 'locations': return draft.locations || (draft.locations = []);
    default:
      if (['matieres','origine','etat_traces','usage','role'].includes(key)) {
        if (!draft.attributeOptions) draft.attributeOptions = {};
        if (!draft.attributeOptions[key]) draft.attributeOptions[key] = [...(ATTRIBUTES_DEF[key]?.options || [])];
        return draft.attributeOptions[key];
      }
      return null;
  }
}

function smAccordion(key, title, content, defaultOpen, editable = false) {
  const isOpen = _smExpandedSections.has(key);
  const titleHTML = editable
    ? `<input type="text" class="sm-section-label-input" value="${esc(title)}" data-sm-label-key="${key}" placeholder="Nom de la section…">`
    : `<span>${title}</span>`;
  return `<div class="sm-accordion" data-sm-key="${key}">
    <div class="sm-accordion-header">
      ${titleHTML}
      <span class="sm-toggle">${isOpen ? '▾' : '›'}</span>
    </div>
    <div class="sm-accordion-body"${isOpen ? '' : ' style="display:none"'}>${content}</div>
  </div>`;
}

function smTriosTabsHTML(draft) {
  const labels = draft.triosTabLabels || {};
  const hidden = draft.triosTabHidden || {};
  return `<div class="sm-trios-tabs">
    <p class="sm-trios-hint">Renomme, masque ou supprime les 3 onglets de la vue Triptyque.</p>
    ${TRIOS_TAB_KEYS.map((key, i) => `
      <div class="sm-field-row sm-trios-row">
        <label class="sm-trios-tab-label">Onglet ${i+1}</label>
        <input type="text" class="sm-input sm-trios-input"
          data-trios-key="${key}"
          value="${esc(labels[key] || TRIOS_TAB_DEFAULTS[i])}"
          placeholder="${esc(TRIOS_TAB_DEFAULTS[i])}">
        <label class="sm-trios-toggle">
          <input type="checkbox" class="sm-trios-hide" data-trios-hide="${key}" ${hidden[key] ? 'checked' : ''}>
          <span>Masquer</span>
        </label>
      </div>`).join('')}
  </div>`;
}

function smThesaurusHTML() {
  // Collecte toutes les typologies disponibles pour le <select>
  const allTypos = [];
  getVerbes().forEach(v => getTypologies(v).forEach(t => {
    if (!allTypos.includes(t)) allTypos.push(t);
  }));
  allTypos.sort((a, b) => a.localeCompare(b, 'fr'));

  const entries = Object.entries(_customThesaurus).sort(([a], [b]) => a.localeCompare(b, 'fr'));

  const entriesHTML = entries.length
    ? entries.map(([alias, typo]) => `
      <div class="sm-thes-row" data-alias="${esc(alias)}">
        <span class="sm-thes-alias">${esc(alias)}</span>
        <span class="sm-thes-arrow">→</span>
        <span class="sm-thes-typo">${esc(typo)}</span>
        <button class="sm-thes-del" data-alias="${esc(alias)}" title="Supprimer">✕</button>
      </div>`).join('')
    : '<p class="sm-thes-empty">Aucun synonyme personnalisé encore.</p>';

  const optionsHTML = allTypos.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');

  return `<div class="sm-thesaurus">
    <p class="sm-thes-hint">Associe un mot-clé à une typologie pour l'entraîner dans la barre de recherche.</p>
    <div class="sm-thes-entries" id="smThesEntries">${entriesHTML}</div>
    <div class="sm-thes-add">
      <input type="text" class="sm-thes-input" id="smThesAliasInput" placeholder="Mot-clé (ex: tasse, lampe…)">
      <span class="sm-thes-sep">→</span>
      <select class="sm-thes-select" id="smThesTypoSelect">
        <option value="">— Choisir une typologie —</option>
        ${optionsHTML}
      </select>
      <button class="btn btn-ghost btn-sm sm-thes-add-btn" id="smThesAddBtn">+ Ajouter</button>
    </div>
  </div>`;
}

function smGroupedListHTML(groups, key) {
  const safeGroups = isGrouped(groups) ? groups : [];
  return `<div class="sm-groups" data-key="${key}">
    ${safeGroups.map((g, gi) => `
      <div class="sm-group" data-key="${key}" data-gi="${gi}">
        <div class="sm-group-header">
          <input type="text" class="sm-group-name-input" data-key="${key}" data-gi="${gi}"
            value="${esc(g.famille)}" placeholder="Nom de la famille…">
          <button class="sm-group-del-btn" data-key="${key}" data-gi="${gi}" title="Supprimer cette famille">×</button>
        </div>
        <div class="sm-group-tags" data-key="${key}" data-gi="${gi}">
          ${(g.tags||[]).map((tag, ti) => `
            <span class="sm-group-tag">
              ${esc(tag)}<button type="button" class="sm-tag-del-btn" data-key="${key}" data-gi="${gi}" data-ti="${ti}" title="Supprimer">×</button>
            </span>`).join('')}
          <input type="text" class="sm-group-tag-input" data-key="${key}" data-gi="${gi}" placeholder="+ tag…">
        </div>
      </div>`).join('')}
    <div class="sm-add-group-row">
      <input type="text" class="sm-new-group-input" data-key="${key}" placeholder="Nouvelle famille…">
      <button class="btn btn-ghost btn-sm sm-add-group-btn" data-key="${key}">+ Famille</button>
    </div>
  </div>`;
}

function smListHTML(arr, key) {
  const rows = arr.map((item, i) => `
    <div class="sm-row" data-key="${key}" data-i="${i}" draggable="true">
      <span class="sm-drag-handle" title="Déplacer">⠿</span>
      <input type="text" class="sm-item-input" value="${esc(item)}" data-key="${key}" data-i="${i}">
      <button class="sm-btn-delete" data-key="${key}" data-i="${i}" title="Supprimer">🗑</button>
    </div>`).join('');
  return `<div class="sm-list">${rows}</div>
    <div class="sm-add-row">
      <input type="text" class="sm-new-input" data-key="${key}" placeholder="Nouvel élément…">
      <button class="btn btn-ghost btn-sm sm-add-btn" data-key="${key}">+ Ajouter</button>
    </div>`;
}

function smColorListHTML(arr, draft) {
  const rows = arr.map((item, i) => {
    const hex = getColorHex(item) || '#888888';
    return `<div class="sm-row" data-key="colors" data-i="${i}" draggable="true">
      <span class="sm-drag-handle" title="Déplacer">⠿</span>
      <input type="color" class="sm-color-picker sm-color-swatch" value="${esc(hex)}" data-color-name="${esc(item)}" data-i="${i}">
      <input type="text" class="sm-item-input" value="${esc(item)}" data-key="colors" data-i="${i}">
      <button class="sm-btn-delete" data-key="colors" data-i="${i}" title="Supprimer">🗑</button>
    </div>`;
  }).join('');
  return `<div class="sm-list">${rows}</div>
    <div class="sm-add-row">
      <input type="color" id="sm-new-color-hex" value="#888888" class="sm-color-picker">
      <input type="text" class="sm-new-input" data-key="colors" placeholder="Nom (blanc, bleu foncé…)">
      <button class="btn btn-ghost btn-sm sm-add-btn" data-key="colors">+ Ajouter</button>
    </div>`;
}

function smVerbesHTML(draft) {
  const verbes = draft.verbes || [];
  const blocks = verbes.map((v, i) => {
    const expanded = _smExpandedVerbes.has(i);
    const typos = getTypologies(v);
    const bg = v.bgColor || v.color || '#2D2D2D';
    const fg = v.textColor || '#F5F5F0';
    const typoPanel = expanded ? `
      <div class="sm-typos-panel">
        ${typos.map((t, si) => `
          <div class="sm-row sm-typo-row" data-ci="${i}" data-si="${si}" draggable="true">
            <span class="sm-drag-handle sm-typo-drag-handle" title="Déplacer" data-ci="${i}" data-si="${si}">⠿</span>
            <input type="text" class="sm-item-input sm-typo-input" value="${esc(t)}" data-ci="${i}" data-si="${si}">
            <button class="sm-btn-delete sm-typo-del" data-ci="${i}" data-si="${si}" title="Supprimer">🗑</button>
          </div>`).join('')}
        <div class="sm-add-row">
          <input type="text" class="sm-new-input sm-new-typo" data-ci="${i}" placeholder="Nouvelle typologie…">
          <button class="btn btn-ghost btn-sm sm-typo-add-btn" data-ci="${i}">+ Ajouter</button>
        </div>
      </div>` : '';
    return `<div class="sm-verbe-block" data-i="${i}">
      <div class="sm-row sm-verbe-row" style="background:${bg};color:${fg}">
        <div class="sm-row-btns">
          <button class="sm-btn-order sm-verbe-up" data-i="${i}"${i === 0 ? ' disabled' : ''} style="border-color:rgba(255,255,255,.3);color:${fg}">↑</button>
          <button class="sm-btn-order sm-verbe-down" data-i="${i}"${i === verbes.length-1 ? ' disabled' : ''} style="border-color:rgba(255,255,255,.3);color:${fg}">↓</button>
        </div>
        <input type="text" class="sm-item-input sm-verbe-name" value="${esc(v.name)}" data-i="${i}" style="color:${fg};font-family:'Spectral',serif;background:transparent;font-size:14px;border-color:rgba(255,255,255,.2)">
        <span class="sm-color-label" style="color:${fg};opacity:.65">Fond</span>
        <input type="color" class="sm-color-picker sm-verbe-bg" value="${bg}" data-i="${i}">
        <span class="sm-color-label" style="color:${fg};opacity:.65">Texte</span>
        <input type="color" class="sm-color-picker sm-verbe-fg" value="${fg}" data-i="${i}">
        <button class="sm-typo-toggle btn btn-ghost btn-xs" data-i="${i}" style="color:${fg};border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.12);flex-shrink:0">
          ${typos.length} typo${typos.length !== 1 ? 's' : ''} ${expanded ? '▾' : '›'}
        </button>
        <button class="sm-btn-delete sm-verbe-del" data-i="${i}" title="Supprimer" style="color:${fg};opacity:.8">🗑</button>
      </div>
      ${typoPanel}
    </div>`;
  }).join('');
  return `<div id="sm-verbes-list">${blocks}</div>
    <div class="sm-add-row">
      <input type="text" id="sm-new-verbe-name" placeholder="Nom du verbe…" style="flex:1;height:28px;padding:3px 8px;font-size:13px;border:1px solid var(--border-light);border-radius:0">
      <span class="sm-color-label">Fond</span>
      <input type="color" id="sm-new-verbe-bg" value="#2D2D2D" class="sm-color-picker">
      <span class="sm-color-label">Texte</span>
      <input type="color" id="sm-new-verbe-fg" value="#ffffff" class="sm-color-picker">
      <button class="btn btn-ghost btn-sm" id="sm-add-verbe-btn">+ Ajouter</button>
    </div>`;
}

function renderSettingsModal() {
  const draft = state.settingsDraft;
  if (!draft.verbes) draft.verbes = draft.categories || [];
  const body = document.getElementById('settingsModalBody');
  if (!body) return;
  const opts = draft.attributeOptions || {};
  body.innerHTML = `<div class="sm-body">
    <div class="sm-site-title-field">
      <label>Titre du site</label>
      <input type="text" class="sm-sitetitle-input" value="${esc(draft.siteTitle || '')}" placeholder="ARCHIVE">
    </div>
    ${smAccordion('verbes', smGetCurrentLabel(draft, 'verbes'), smVerbesHTML(draft), true, false)}
    ${smAccordion('matieres', smGetCurrentLabel(draft, 'matieres'), smGroupedListHTML(opts.matieres || MATIERES_GROUPS_DEFAULT, 'matieres'), false, true)}
    ${smAccordion('origine', smGetCurrentLabel(draft, 'origine'), smListHTML(opts.origine || [...ATTRIBUTES_DEF.origine.options], 'origine'), false, true)}
    ${smAccordion('colors', smGetCurrentLabel(draft, 'colors'), smColorListHTML(draft.colors || [], draft), false, true)}
    ${smAccordion('motifs', smGetCurrentLabel(draft, 'motifs'), smGroupedListHTML(opts.motifs || MOTIFS_GROUPS_DEFAULT, 'motifs'), false, true)}
    ${smAccordion('etat_traces', smGetCurrentLabel(draft, 'etat_traces'), smListHTML(opts.etat_traces || [...ATTRIBUTES_DEF.etat_traces.options], 'etat_traces'), false, true)}
    ${smAccordion('usage', smGetCurrentLabel(draft, 'usage'), smListHTML(opts.usage || [...ATTRIBUTES_DEF.usage.options], 'usage'), false, true)}
    ${smAccordion('univers', smGetCurrentLabel(draft, 'univers'), smListHTML(draft.univers || [], 'univers'), false, true)}
    ${smAccordion('locations', smGetCurrentLabel(draft, 'locations'), smListHTML(draft.locations || [], 'locations'), false, true)}
    ${smAccordion('trios', 'Onglets Triptyque', smTriosTabsHTML(draft), false, false)}
    ${smAccordion('pagedescs', 'Textes de l\'interface', smPageDescsHTML(), false, false)}
    ${smAccordion('thesaurus', 'Dictionnaire de recherche', smThesaurusHTML(), false, false)}
  </div>`;
  bindSmModal();
  bindSmPageDescs();
}

// ── Textes des bandeaux — éditeur dans les paramètres ─────────────────────
function smPageDescsHTML() {
  const overrides = _loadPageDescOverrides();
  const fields = [
    { key: 'inventaire',    label: 'Inventaire' },
    { key: 'nuee',          label: 'Dérive — Nuée' },
    { key: 'constellation', label: 'Dérive — Constellation' },
    { key: 'triptyque',     label: 'Triptyque' },
    { key: 'diorama',       label: 'Diorama' },
  ];
  return `<div class="sm-pagedescs">
    <p class="sm-pagedescs-hint">Personnalisez les descriptions qui apparaissent sous chaque titre de page. Laissez vide pour masquer complètement la description. Utilisez <em>Réinitialiser</em> pour restaurer le texte par défaut.</p>
    ${fields.map(({ key, label }) => {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key);
      const value = hasOverride ? overrides[key] : '';
      return `<div class="sm-pagedesc-row">
        <div class="sm-pagedesc-head">
          <label class="sm-pagedesc-label">${esc(label)}</label>
          <button type="button" class="sm-pagedesc-reset" data-pd-reset="${key}" ${hasOverride ? '' : 'disabled'} title="Restaurer le texte par défaut">↺ Réinitialiser</button>
        </div>
        <textarea class="sm-pagedesc-input" data-pd-key="${key}" rows="2" placeholder="${esc(PAGE_DESCRIPTIONS_DEFAULTS[key] || '')}">${esc(value)}</textarea>
      </div>`;
    }).join('')}
  </div>`;
}

function bindSmPageDescs() {
  document.querySelectorAll('.sm-pagedesc-input').forEach(input => {
    input.addEventListener('input', e => {
      updatePageDescription(e.target.dataset.pdKey, e.target.value);
      // Active le bouton reset dès qu'on tape
      const resetBtn = e.target.closest('.sm-pagedesc-row')?.querySelector('.sm-pagedesc-reset');
      if (resetBtn) resetBtn.disabled = false;
    });
  });
  document.querySelectorAll('.sm-pagedesc-reset').forEach(btn => {
    btn.addEventListener('click', e => {
      const key = e.target.dataset.pdReset;
      resetPageDescription(key);
      const row = e.target.closest('.sm-pagedesc-row');
      const input = row?.querySelector('.sm-pagedesc-input');
      if (input) input.value = '';
      btn.disabled = true;
    });
  });
}

function _bindThesDelBtns(container) {
  container.querySelectorAll('.sm-thes-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const alias = btn.dataset.alias;
      delete _customThesaurus[alias];
      _saveCustomThesaurus();
      btn.closest('.sm-thes-row')?.remove();
      const entries = document.getElementById('smThesEntries');
      if (entries && !entries.querySelector('.sm-thes-row')) {
        entries.innerHTML = '<p class="sm-thes-empty">Aucun synonyme personnalisé encore.</p>';
      }
    });
  });
}

function bindSmModal() {
  const body = document.getElementById('settingsModalBody');
  if (!body) return;
  const draft = state.settingsDraft;

  // Site title
  body.querySelector('.sm-sitetitle-input')?.addEventListener('input', e => { draft.siteTitle = e.target.value; });

  // ── Dictionnaire de recherche ──────────────────────────────────────────────
  // Ajouter une entrée
  body.querySelector('#smThesAddBtn')?.addEventListener('click', () => {
    const aliasInput = body.querySelector('#smThesAliasInput');
    const typoSelect = body.querySelector('#smThesTypoSelect');
    const alias = (aliasInput?.value || '').trim().toLowerCase();
    const typo  = typoSelect?.value || '';
    if (!alias || !typo) return;
    _customThesaurus[alias] = typo;
    _saveCustomThesaurus();
    aliasInput.value = '';
    typoSelect.value = '';
    // Re-render uniquement la zone dictionnaire
    const entries = body.querySelector('#smThesEntries');
    if (entries) {
      const rows = Object.entries(_customThesaurus).sort(([a],[b]) => a.localeCompare(b,'fr'));
      entries.innerHTML = rows.length
        ? rows.map(([al, tp]) => `
          <div class="sm-thes-row" data-alias="${esc(al)}">
            <span class="sm-thes-alias">${esc(al)}</span>
            <span class="sm-thes-arrow">→</span>
            <span class="sm-thes-typo">${esc(tp)}</span>
            <button class="sm-thes-del" data-alias="${esc(al)}" title="Supprimer">✕</button>
          </div>`).join('')
        : '<p class="sm-thes-empty">Aucun synonyme personnalisé encore.</p>';
      _bindThesDelBtns(entries);
    }
  });
  // Enter dans le champ alias → même effet
  body.querySelector('#smThesAliasInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') body.querySelector('#smThesAddBtn')?.click();
  });
  _bindThesDelBtns(body);

  // Accordion toggles (persist state via _smExpandedSections)
  body.querySelectorAll('.sm-accordion-header').forEach(h => {
    h.addEventListener('click', e => {
      if (e.target.classList.contains('sm-section-label-input')) return;
      const key = h.closest('.sm-accordion').dataset.smKey;
      const b = h.nextElementSibling;
      const t = h.querySelector('.sm-toggle');
      const open = b.style.display !== 'none';
      b.style.display = open ? 'none' : '';
      t.textContent = open ? '›' : '▾';
      if (open) _smExpandedSections.delete(key); else _smExpandedSections.add(key);
    });
  });

  // Section label rename bindings
  body.querySelectorAll('.sm-section-label-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const smKey = inp.dataset.smLabelKey;
      const labelKey = SM_LABEL_KEY[smKey] || smKey;
      if (!draft.attributeLabels) draft.attributeLabels = {};
      draft.attributeLabels[labelKey] = inp.value;
    });
  });

  // Trios tab label bindings
  body.querySelectorAll('.sm-trios-input').forEach(inp => {
    inp.addEventListener('input', () => {
      if (!draft.triosTabLabels) draft.triosTabLabels = {};
      draft.triosTabLabels[inp.dataset.triosKey] = inp.value;
    });
  });
  // Masquer un onglet Triptyque
  body.querySelectorAll('.sm-trios-hide').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!draft.triosTabHidden) draft.triosTabHidden = {};
      draft.triosTabHidden[cb.dataset.triosHide] = cb.checked;
    });
  });

  // ── Drag & Drop pour listes simples (sm-list rows) ──
  let _smDragSrc = null, _smDragKey = null, _smDragI = null;
  body.querySelectorAll('.sm-list .sm-row[draggable]').forEach(row => {
    row.addEventListener('dragstart', e => {
      _smDragKey = row.dataset.key; _smDragI = +row.dataset.i; _smDragSrc = row;
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => row.classList.add('sm-dragging'));
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('sm-dragging');
      body.querySelectorAll('.sm-row').forEach(r => r.classList.remove('sm-drop-target'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      body.querySelectorAll('.sm-list .sm-row').forEach(r => r.classList.remove('sm-drop-target'));
      if (row !== _smDragSrc && row.dataset.key === _smDragKey) row.classList.add('sm-drop-target');
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('sm-drop-target');
      const targetI = +row.dataset.i;
      if (_smDragI === null || _smDragI === targetI || row.dataset.key !== _smDragKey) return;
      const arr = smGetArray(draft, _smDragKey);
      if (!arr) return;
      const [moved] = arr.splice(_smDragI, 1);
      arr.splice(targetI, 0, moved);
      renderSettingsModal();
    });
  });

  // ── Drag & Drop pour typos de verbes ──
  let _smTDragCI = null, _smTDragSI = null, _smTDragSrc = null;
  body.querySelectorAll('.sm-typo-row[draggable]').forEach(row => {
    row.addEventListener('dragstart', e => {
      _smTDragCI = +row.dataset.ci; _smTDragSI = +row.dataset.si; _smTDragSrc = row;
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => row.classList.add('sm-dragging'));
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('sm-dragging');
      body.querySelectorAll('.sm-typo-row').forEach(r => r.classList.remove('sm-drop-target'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (row !== _smTDragSrc && +row.dataset.ci === _smTDragCI) {
        body.querySelectorAll('.sm-typo-row').forEach(r => r.classList.remove('sm-drop-target'));
        row.classList.add('sm-drop-target');
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('sm-drop-target');
      const tSI = +row.dataset.si;
      if (_smTDragSI === null || _smTDragSI === tSI || +row.dataset.ci !== _smTDragCI) return;
      const typos = getTypologies(draft.verbes[_smTDragCI]);
      const [moved] = typos.splice(_smTDragSI, 1);
      typos.splice(tSI, 0, moved);
      draft.verbes[_smTDragCI].typologies = typos;
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-item-input:not(.sm-verbe-name):not(.sm-typo-input)').forEach(inp => {
    inp.addEventListener('input', () => {
      const arr = smGetArray(draft, inp.dataset.key);
      if (arr) arr[+inp.dataset.i] = inp.value;
    });
  });
  body.querySelectorAll('.sm-btn-delete:not(.sm-verbe-del):not(.sm-typo-del)').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key, i = +btn.dataset.i;
      const arr = smGetArray(draft, key);
      if (!arr) return;
      if (key === 'colors') {
        const removed = arr[i]; arr.splice(i, 1);
        if (draft.customColorHexes) delete draft.customColorHexes[removed];
      } else { arr.splice(i, 1); }
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const inp = body.querySelector(`.sm-new-input[data-key="${key}"]`);
      if (!inp || !inp.value.trim()) return;
      const val = inp.value.trim();
      const arr = smGetArray(draft, key);
      if (!arr) return;
      if (key === 'colors') {
        if (!arr.includes(val)) {
          arr.push(val);
          const hexInp = body.querySelector('#sm-new-color-hex');
          if (hexInp) { if (!draft.customColorHexes) draft.customColorHexes = {}; draft.customColorHexes[val] = hexInp.value; }
        }
      } else if (!arr.includes(val)) { arr.push(val); }
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-new-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); body.querySelector(`.sm-add-btn[data-key="${inp.dataset.key}"]`)?.click(); }
    });
  });
  body.querySelectorAll('.sm-color-swatch').forEach(picker => {
    picker.addEventListener('input', () => {
      const name = picker.dataset.colorName;
      if (!draft.customColorHexes) draft.customColorHexes = {};
      draft.customColorHexes[name] = picker.value;
      COLOR_MAP[name] = picker.value;
    });
  });

  // ── Verbes ──
  body.querySelectorAll('.sm-verbe-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i; if (i === 0) return;
      [draft.verbes[i-1], draft.verbes[i]] = [draft.verbes[i], draft.verbes[i-1]];
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-verbe-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i; if (i >= draft.verbes.length-1) return;
      [draft.verbes[i], draft.verbes[i+1]] = [draft.verbes[i+1], draft.verbes[i]];
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-verbe-name').forEach(inp => {
    inp.addEventListener('input', () => { draft.verbes[+inp.dataset.i].name = inp.value; });
  });
  body.querySelectorAll('.sm-verbe-bg').forEach(picker => {
    picker.addEventListener('input', () => {
      const v = draft.verbes[+picker.dataset.i];
      v.bgColor = picker.value; v.color = picker.value;
    });
  });
  body.querySelectorAll('.sm-verbe-fg').forEach(picker => {
    picker.addEventListener('input', () => { draft.verbes[+picker.dataset.i].textColor = picker.value; });
  });
  body.querySelectorAll('.sm-verbe-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i;
      draft.verbes.splice(i, 1);
      const newSet = new Set([..._smExpandedVerbes].filter(x => x !== i).map(x => x > i ? x-1 : x));
      _smExpandedVerbes.clear(); newSet.forEach(x => _smExpandedVerbes.add(x));
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-typo-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i;
      if (_smExpandedVerbes.has(i)) _smExpandedVerbes.delete(i); else _smExpandedVerbes.add(i);
      renderSettingsModal();
    });
  });
  body.querySelector('#sm-add-verbe-btn')?.addEventListener('click', () => {
    const nameInp = body.querySelector('#sm-new-verbe-name');
    if (!nameInp?.value.trim()) return;
    draft.verbes.push({
      name: nameInp.value.trim(),
      bgColor: body.querySelector('#sm-new-verbe-bg')?.value || '#2D2D2D',
      color:   body.querySelector('#sm-new-verbe-bg')?.value || '#2D2D2D',
      textColor: body.querySelector('#sm-new-verbe-fg')?.value || '#F5F5F0',
      typologies: []
    });
    renderSettingsModal();
  });

  // ── Typologies ──
  body.querySelectorAll('.sm-typo-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const ci = +inp.dataset.ci, si = +inp.dataset.si;
      const typos = draft.verbes[ci].typologies || draft.verbes[ci].subcategories;
      typos[si] = inp.value;
    });
  });
  body.querySelectorAll('.sm-typo-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = +btn.dataset.ci, si = +btn.dataset.si;
      const typos = draft.verbes[ci].typologies || draft.verbes[ci].subcategories;
      typos.splice(si, 1);
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-typo-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = +btn.dataset.ci;
      const inp = body.querySelector(`.sm-new-typo[data-ci="${ci}"]`);
      if (!inp?.value.trim()) return;
      if (!draft.verbes[ci].typologies) draft.verbes[ci].typologies = draft.verbes[ci].subcategories || [];
      draft.verbes[ci].typologies.push(inp.value.trim());
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-new-typo').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); body.querySelector(`.sm-typo-add-btn[data-ci="${inp.dataset.ci}"]`)?.click(); }
    });
  });

  // ── Grouped list bindings (matieres + motifs) ──
  function getGroupedArr(key) {
    if (!draft.attributeOptions) draft.attributeOptions = {};
    if (!draft.attributeOptions[key]) draft.attributeOptions[key] = JSON.parse(JSON.stringify(key === 'motifs' ? MOTIFS_GROUPS_DEFAULT : MATIERES_GROUPS_DEFAULT));
    return draft.attributeOptions[key];
  }

  // Rename famille
  body.querySelectorAll('.sm-group-name-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const arr = getGroupedArr(inp.dataset.key);
      const gi = +inp.dataset.gi;
      if (arr[gi]) arr[gi].famille = inp.value;
    });
  });

  // Delete tag
  body.querySelectorAll('.sm-tag-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const arr = getGroupedArr(btn.dataset.key);
      const gi = +btn.dataset.gi, ti = +btn.dataset.ti;
      if (arr[gi]) { arr[gi].tags.splice(ti, 1); renderSettingsModal(); }
    });
  });

  // Add tag (Enter or blur)
  body.querySelectorAll('.sm-group-tag-input').forEach(inp => {
    const doAdd = () => {
      const val = inp.value.trim(); if (!val) return;
      const arr = getGroupedArr(inp.dataset.key);
      const gi = +inp.dataset.gi;
      if (arr[gi] && !arr[gi].tags.includes(val)) { arr[gi].tags.push(val); renderSettingsModal(); }
      else inp.value = '';
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
    inp.addEventListener('blur', doAdd);
  });

  // Delete famille
  body.querySelectorAll('.sm-group-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const arr = getGroupedArr(btn.dataset.key);
      arr.splice(+btn.dataset.gi, 1);
      renderSettingsModal();
    });
  });

  // Add famille
  body.querySelectorAll('.sm-add-group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const inp = body.querySelector(`.sm-new-group-input[data-key="${key}"]`);
      const val = inp?.value.trim(); if (!val) return;
      const arr = getGroupedArr(key);
      arr.push({ famille: val, tags: [] });
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-new-group-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); body.querySelector(`.sm-add-group-btn[data-key="${inp.dataset.key}"]`)?.click(); }
    });
  });
}

// ── Settings (onglet dans le modal d'édition) ──────────────────────────────────
function openSettings() {
  // Ouvrir le modal d'édition si pas déjà ouvert
  const modal = document.getElementById('editModal');
  if (modal.style.display === 'none' || !modal.style.display) {
    // Pas de fiche en cours — ouvrir modal vide sans créer d'objet
    document.getElementById('modalTitle').textContent = 'Paramètres';
    document.getElementById('deleteBtn').style.display = 'none';
    modal.style.display = 'flex';
  }
  state.settingsDraft = JSON.parse(JSON.stringify(state.settings));
  renderSettingsPanel();
  const titleEl = document.getElementById('settingsSiteTitle');
  if (titleEl) titleEl.value = state.settings.siteTitle || 'ARCHIVE';
  switchModalTab('settings');
}
function closeSettings() {
  // Retour à l'onglet public
  switchModalTab('public');
}

// Track which categories have their subcategory panel open
const _settingsExpandedCats = new Set();

function renderSettingsPanel() {
  const draft = state.settingsDraft;
  // Normaliser : utilise 'verbes', fallback sur 'categories' pour rétrocompat
  if (!draft.verbes) draft.verbes = draft.categories || [];
  const verbes = draft.verbes;

  // ── Verbes & Typologies ──
  const catsEl = document.getElementById('settingsCats');
  catsEl.innerHTML = verbes.map((v, i) => {
    const expanded = _settingsExpandedCats.has(i);
    const typos = getTypologies(v);
    const subPanel = expanded ? `
      <div class="settings-subcat-panel">
        ${typos.map((t, si) => `
          <div class="settings-subcat-row">
            <div class="settings-order-btns">
              <button class="settings-order-btn settings-sub-up" data-ci="${i}" data-si="${si}" ${si===0?'disabled':''}>↑</button>
              <button class="settings-order-btn settings-sub-down" data-ci="${i}" data-si="${si}" ${si===typos.length-1?'disabled':''}>↓</button>
            </div>
            <input type="text" class="settings-subcat-name" value="${esc(t)}" data-ci="${i}" data-si="${si}">
            <button class="settings-remove-btn settings-subcat-remove" data-ci="${i}" data-si="${si}">✕</button>
          </div>`).join('')}
        <div class="settings-add-row settings-subcat-add">
          <input type="text" class="settings-subcat-new" placeholder="Nouvelle typologie…" data-ci="${i}">
          <button class="btn btn-ghost btn-xs settings-subcat-add-btn" data-ci="${i}">+ Ajouter</button>
        </div>
      </div>` : '';
    return `
    <div class="settings-cat-block" data-i="${i}">
      <div class="settings-cat-row">
        <div class="settings-order-btns">
          <button class="settings-order-btn settings-cat-up" data-i="${i}" ${i===0?'disabled':''}>↑</button>
          <button class="settings-order-btn settings-cat-down" data-i="${i}" ${i===verbes.length-1?'disabled':''}>↓</button>
        </div>
        <input type="text" class="settings-cat-name" value="${esc(v.name)}" data-i="${i}">
        <input type="color" class="settings-cat-color" value="${v.color||'#888888'}" data-i="${i}">
        <button class="settings-subcat-toggle btn btn-ghost btn-xs" data-i="${i}">
          ${typos.length} typo.${expanded ? ' ▾' : ' ›'}
        </button>
        <button class="settings-remove-btn" data-i="${i}" data-type="cat">✕</button>
      </div>
      ${subPanel}
    </div>`;
  }).join('');

  // ↑↓ verbes
  catsEl.querySelectorAll('.settings-cat-up').forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.i; if (i === 0) return;
    [verbes[i-1], verbes[i]] = [verbes[i], verbes[i-1]];
    renderSettingsPanel();
  }));
  catsEl.querySelectorAll('.settings-cat-down').forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.i; if (i >= verbes.length-1) return;
    [verbes[i], verbes[i+1]] = [verbes[i+1], verbes[i]];
    renderSettingsPanel();
  }));

  // Nom / couleur / suppression verbe
  catsEl.querySelectorAll('.settings-cat-name').forEach(el => el.addEventListener('input', () => { verbes[el.dataset.i].name = el.value; }));
  catsEl.querySelectorAll('.settings-cat-color').forEach(el => el.addEventListener('input', () => { verbes[el.dataset.i].color = el.value; }));
  catsEl.querySelectorAll('.settings-remove-btn[data-type="cat"]').forEach(btn => btn.addEventListener('click', () => {
    verbes.splice(+btn.dataset.i, 1);
    _settingsExpandedCats.delete(+btn.dataset.i);
    renderSettingsPanel();
  }));

  // Toggle typologies
  catsEl.querySelectorAll('.settings-subcat-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i;
      if (_settingsExpandedCats.has(i)) _settingsExpandedCats.delete(i);
      else _settingsExpandedCats.add(i);
      renderSettingsPanel();
    });
  });

  // ↑↓ typologies
  catsEl.querySelectorAll('.settings-sub-up').forEach(btn => btn.addEventListener('click', () => {
    const ci = +btn.dataset.ci, si = +btn.dataset.si; if (si === 0) return;
    const typos = verbes[ci].typologies || verbes[ci].subcategories;
    [typos[si-1], typos[si]] = [typos[si], typos[si-1]];
    renderSettingsPanel();
  }));
  catsEl.querySelectorAll('.settings-sub-down').forEach(btn => btn.addEventListener('click', () => {
    const ci = +btn.dataset.ci, si = +btn.dataset.si;
    const typos = verbes[ci].typologies || verbes[ci].subcategories; if (si >= typos.length-1) return;
    [typos[si], typos[si+1]] = [typos[si+1], typos[si]];
    renderSettingsPanel();
  }));

  // Modifier nom typologie
  catsEl.querySelectorAll('.settings-subcat-name').forEach(el => {
    el.addEventListener('input', () => {
      const typos = verbes[el.dataset.ci].typologies || verbes[el.dataset.ci].subcategories;
      typos[el.dataset.si] = el.value;
    });
  });

  // Supprimer typologie
  catsEl.querySelectorAll('.settings-subcat-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const typos = verbes[btn.dataset.ci].typologies || verbes[btn.dataset.ci].subcategories;
      typos.splice(+btn.dataset.si, 1);
      renderSettingsPanel();
    });
  });

  // Ajouter typologie
  const addTypoHandler = (inp) => {
    const ci = +inp.dataset.ci;
    const val = inp.value.trim(); if (!val) return;
    if (!verbes[ci].typologies) verbes[ci].typologies = verbes[ci].subcategories || [];
    verbes[ci].typologies.push(val);
    inp.value = '';
    renderSettingsPanel();
  };
  catsEl.querySelectorAll('.settings-subcat-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = catsEl.querySelector(`.settings-subcat-new[data-ci="${btn.dataset.ci}"]`);
      if (inp) addTypoHandler(inp);
    });
  });
  catsEl.querySelectorAll('.settings-subcat-new').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTypoHandler(inp); } });
  });

  // Locations
  renderSettingsList('settingsLocations', draft.locations||[], 'location');
  // Colors
  renderSettingsChips('settingsColors', draft.colors||[], 'color');
  // Motifs
  renderSettingsChips('settingsMotifs', draft.motifs||[], 'motif');
  // Univers
  renderSettingsChips('settingsUnivers', draft.univers||[], 'univers');
  // Attribute sections order
  renderAttrOrderSection();

  // Drag & drop pour les blocs de sections
  initSettingsSectionsDnD();
}

function renderAttrOrderSection() {
  const el = document.getElementById('settingsAttrOrder');
  if (!el) return;
  const draft = state.settingsDraft;
  if (!draft.attributeSectionsOrder || !draft.attributeSectionsOrder.length) {
    draft.attributeSectionsOrder = ['origine', ['etat_traces','taille'], 'usage', {'group':'Matière & Apparence'}, 'matieres', ['couleurs','motifs']];
  }
  if (!draft.attributeLabels) draft.attributeLabels = {};
  const order = draft.attributeSectionsOrder;

  // Helper: label courant d'une clé (override draft > défaut ATTRIBUTES_DEF)
  function getLabel(key) {
    return (draft.attributeLabels[key] !== undefined && draft.attributeLabels[key] !== '')
      ? draft.attributeLabels[key]
      : (ATTRIBUTES_DEF[key]?.label || key);
  }

  el.innerHTML = order.map((entry, i) => {
    // En-tête de groupe — éditables
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && entry.group) {
      return `<div class="settings-attr-group" data-i="${i}" data-group="true">
        <span class="settings-attr-group-icon">▬</span>
        <input type="text" class="settings-attr-group-input" value="${esc(entry.group)}" data-i="${i}" placeholder="Titre du groupe…">
      </div>`;
    }
    // Paire côte à côte
    if (Array.isArray(entry)) {
      return `<div class="settings-attr-row settings-attr-row-pair" data-i="${i}" draggable="true">
        <span class="settings-drag-handle" title="Déplacer">⠿</span>
        <div class="settings-attr-pair-labels">
          <input type="text" class="settings-attr-label-input" value="${esc(getLabel(entry[0]))}" data-key="${entry[0]}" placeholder="${entry[0]}">
          <span class="settings-attr-pair-sep">+</span>
          <input type="text" class="settings-attr-label-input" value="${esc(getLabel(entry[1]))}" data-key="${entry[1]}" placeholder="${entry[1]}">
        </div>
        <span class="settings-attr-badge">côte à côte</span>
      </div>`;
    }
    // Section simple
    return `<div class="settings-attr-row" data-i="${i}" draggable="true">
      <span class="settings-drag-handle" title="Déplacer">⠿</span>
      <input type="text" class="settings-attr-label-input" value="${esc(getLabel(entry))}" data-key="${entry}" placeholder="${entry}">
    </div>`;
  }).join('');

  // Bind: modification du titre d'un groupe
  el.querySelectorAll('.settings-attr-group-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = +inp.dataset.i;
      if (order[i] && typeof order[i] === 'object' && !Array.isArray(order[i])) {
        order[i].group = inp.value;
      }
    });
  });

  // Bind: modification du label d'une section attribut
  el.querySelectorAll('.settings-attr-label-input').forEach(inp => {
    inp.addEventListener('input', () => {
      draft.attributeLabels[inp.dataset.key] = inp.value;
    });
  });

  // Drag & drop pour réordonner (exclut les groupe-markers)
  // — le drag ne démarre que depuis le handle, jamais depuis un input
  let attrDragSrc = null;
  let attrDragFromHandle = false;
  el.querySelectorAll('.settings-attr-row').forEach(row => {
    const handle = row.querySelector('.settings-drag-handle');
    if (handle) handle.addEventListener('mousedown', () => { attrDragFromHandle = true; });
    row.addEventListener('dragstart', e => {
      if (!attrDragFromHandle) { e.preventDefault(); return; }
      attrDragSrc = +row.dataset.i;
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => row.classList.add('dragging'));
    });
    row.addEventListener('dragend', () => {
      attrDragFromHandle = false;
      row.classList.remove('dragging');
      el.querySelectorAll('.settings-attr-row').forEach(r => r.classList.remove('drop-target'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      el.querySelectorAll('.settings-attr-row').forEach(r => r.classList.remove('drop-target'));
      if (+row.dataset.i !== attrDragSrc) row.classList.add('drop-target');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('drop-target');
      const targetI = +row.dataset.i;
      if (attrDragSrc === null || attrDragSrc === targetI) return;
      const [moved] = draft.attributeSectionsOrder.splice(attrDragSrc, 1);
      draft.attributeSectionsOrder.splice(targetI, 0, moved);
      attrDragSrc = null;
      renderAttrOrderSection();
    });
  });
}

function initSettingsSectionsDnD() {
  const container = document.getElementById('settingsSections'); if (!container) return;
  const sections = ()=>[...container.querySelectorAll('.settings-section-draggable')];
  let secDragSrc = null;
  let dragFromHandle = false;

  sections().forEach(sec=>{
    const handle = sec.querySelector('.settings-sec-handle');
    const header = sec.querySelector('.settings-sec-header');
    const body   = sec.querySelector('.settings-sec-body');
    const toggle = sec.querySelector('.attr-toggle');

    // Toggle accordion on header click (but not on handle)
    if (header) {
      header.addEventListener('click', e => {
        if (e.target.closest('.settings-sec-handle')) return;
        if (!body || !toggle) return;
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : '';
        toggle.textContent = open ? '›' : '▾';
      });
    }

    // Drag only from handle
    if (handle) handle.addEventListener('mousedown', ()=>{ dragFromHandle = true; });
    sec.setAttribute('draggable','true');

    sec.addEventListener('dragstart', e=>{
      if (!dragFromHandle) { e.preventDefault(); return; }
      secDragSrc = sec;
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(()=>sec.classList.add('sec-dragging'));
    });
    sec.addEventListener('dragend', ()=>{
      dragFromHandle = false;
      sec.classList.remove('sec-dragging');
      sections().forEach(s=>s.classList.remove('sec-drop-target'));
      secDragSrc = null;
    });
    sec.addEventListener('dragover', e=>{
      e.preventDefault();
      if (sec === secDragSrc) return;
      sections().forEach(s=>s.classList.remove('sec-drop-target'));
      sec.classList.add('sec-drop-target');
    });
    sec.addEventListener('dragleave', e=>{
      if (!sec.contains(e.relatedTarget)) sec.classList.remove('sec-drop-target');
    });
    sec.addEventListener('drop', e=>{
      e.preventDefault();
      sec.classList.remove('sec-drop-target');
      if (!secDragSrc || secDragSrc === sec) return;
      const srcRect = secDragSrc.getBoundingClientRect();
      const tgtRect = sec.getBoundingClientRect();
      if (tgtRect.top > srcRect.top) container.insertBefore(secDragSrc, sec.nextSibling);
      else container.insertBefore(secDragSrc, sec);
    });
  });
}

function renderSettingsList(elId, arr, type) {
  const el=document.getElementById(elId);
  el.innerHTML=arr.map((item,i)=>`
    <div class="settings-list-row">
      <input type="text" value="${esc(item)}" data-i="${i}" data-type="${type}">
      <button class="settings-remove-btn" data-i="${i}" data-type="${type}">✕</button>
    </div>`).join('');
  el.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{
    const d=state.settingsDraft;
    if(type==='location') d.locations[inp.dataset.i]=inp.value;
  }));
  el.querySelectorAll('.settings-remove-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const d=state.settingsDraft;
    if(type==='location') d.locations.splice(+btn.dataset.i,1);
    renderSettingsPanel();
  }));
}

function getColorHex(name) {
  // First check static COLOR_MAP, then custom map in settings
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  const custom = state.settingsDraft?.customColorHexes || state.settings?.customColorHexes || {};
  return custom[name] || null;
}

function renderSettingsChips(elId, arr, type) {
  const el = document.getElementById(elId);
  el.innerHTML = arr.map((item, i) => {
    if (type === 'color') {
      const hex = getColorHex(item);
      const isDark = hex ? DARK_COLORS.has(item) || _isHexDark(hex) : false;
      const textColor = isDark ? '#fff' : '#1a1917';
      const bgStyle = hex ? `background:${hex};color:${textColor};border-color:${hex === 'rgba(200,200,200,0.15)' ? 'var(--border)' : hex}` : '';
      return `<span class="settings-chip settings-chip-color" style="${bgStyle}" data-i="${i}">
        ${esc(item)}<button data-i="${i}" data-type="${type}" style="color:${isDark?'rgba(255,255,255,.6)':'var(--text-3)'}">✕</button>
      </span>`;
    }
    return `<span class="settings-chip">${esc(item)}<button data-i="${i}" data-type="${type}">✕</button></span>`;
  }).join('');
  el.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    const d = state.settingsDraft;
    const idx = +btn.dataset.i;
    if (type === 'color') {
      const removed = d.colors[idx];
      d.colors.splice(idx, 1);
      if (d.customColorHexes) delete d.customColorHexes[removed];
    }
    if (type === 'motif')   d.motifs.splice(idx, 1);
    if (type === 'univers') d.univers.splice(idx, 1);
    renderSettingsPanel();
  }));
}

function _isHexDark(hex) {
  // Returns true if hex color is perceived as dark
  if (!hex || hex.startsWith('rgba')) return false;
  const h = hex.replace('#','');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return (r*299 + g*587 + b*114) / 1000 < 128;
}

async function saveSettings() {
  const d = state.settingsDraft;
  const titleEl = document.getElementById('settingsSiteTitle');
  d.siteTitle = titleEl ? (titleEl.value.trim() || 'ARCHIVE') : 'ARCHIVE';
  state.settings = await api.put('/api/settings', d);
  ATTRIBUTES_DEF.couleurs.options = state.settings.colors || [];
  ATTRIBUTES_DEF.motifs.options = state.settings.motifs || [];
  // Ré-appliquer les labels personnalisés
  syncAttrLabels();
  // Merge custom color hexes into COLOR_MAP
  const custom = state.settings.customColorHexes || {};
  Object.entries(custom).forEach(([name, hex]) => { COLOR_MAP[name] = hex; });
  document.getElementById('siteTitle').textContent = state.settings.siteTitle || 'ARCHIVE';
  buildCategoryFilterBar();
  // Refresh form fields now that settings changed
  populateCategoryDropdown();
  populateLocationDropdown();
  renderAllAttributes();
  renderUniversChips();
  // Retour à la fiche
  switchModalTab('public');
  render();
}

// ── Search ─────────────────────────────────────────────────────────────────────
function kwFrequency() {
  const freq={};
  state.collections.forEach(c=>{ (c.keywords||[]).forEach(k=>{ freq[k]=(freq[k]||0)+1; }); });
  return freq;
}
function renderSearchDropdown() {
  const input = document.getElementById('searchInput');
  const list  = document.getElementById('searchKwList');
  const q = input.value.toLowerCase().trim();

  // Build suggestion groups — ordre : Typologies > Intentions > Matières > Mots-clés
  const groups = [];

  // ── 1. Typologies (priorité absolue) — alphabétique ──
  const allTypos = getAllTypologies()
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const typoHits = q
    ? allTypos.filter(t => t.name.toLowerCase().includes(q))
    : allTypos;
  if (typoHits.length) groups.push({
    label: 'Typologies',
    // Limite étendue pour afficher un éventail large dès l'ouverture
    items: typoHits.slice(0, 14).map(t => {
      const verbe = getVerbes().find(v => v.name === t.verbeName);
      const dotColor = _verbeActiveColor(verbe);
      return {
        text: t.name, badge: t.verbeName,
        color: t.color, darkColor: dotColor,
        action: () => {
          state.typoFilter = t.name;
          state.categoryFilter = '';
          state.attrFilters.subcat = [];
          input.value = '';
          buildTypologyFilterBar();
          buildCategoryFilterBar();
          buildIndexTrigger();
          document.getElementById('searchDropdown').classList.remove('open');
          render();
        }
      };
    })
  });

  // ── 2. Intentions / Verbes — seulement si requête active ──
  if (q) {
    const cats = getCategories().map(c => c.name).filter(n => n.toLowerCase().includes(q));
    if (cats.length) groups.push({
      label: 'Intentions',
      items: cats.slice(0, 4).map(n => ({
        text: n, badge: null, color: getCategoryColor(n),
        action: () => { state.categoryFilter=n; state.attrFilters.subcat=[]; input.value=''; buildCategoryFilterBar(); buildSubcategoryBar(); buildAttrFilterBar(); pushBreadcrumb(n, ()=>{ state.categoryFilter=n; buildCategoryFilterBar(); render(); }); document.getElementById('searchDropdown').classList.remove('open'); render(); }
      }))
    });
  }

  // ── 3. Attributs (Matières, Origine, État…) — seulement si requête active ──
  if (q) {
    const attrGroups = [
      { key:'matieres',    label:'Matière', options: ATTRIBUTES_DEF.matieres.options },
      { key:'origine',     label:'Identité', options: ATTRIBUTES_DEF.origine.options },
      { key:'etat_traces', label:'État',    options: ATTRIBUTES_DEF.etat_traces.options },
      { key:'couleurs',    label:'Couleur', options: state.settings.colors||[] },
    ];
    attrGroups.forEach(({key,label,options})=>{
      const hits = options.filter(o => o.toLowerCase().includes(q));
      if (!hits.length) return;
      groups.push({
        label,
        items: hits.slice(0,4).map(val=>({
          text: val, badge: null, color: null,
          action: ()=>{ if(!state.attrFilters[key].includes(val)) state.attrFilters[key].push(val); input.value=''; buildAttrFilterBar(); document.getElementById('searchDropdown').classList.remove('open'); render(); }
        }))
      });
    });
  }

  // ── 4. Mots-clés — seulement si requête active ──
  if (q) {
    const freq = kwFrequency();
    let keywords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k])=>k)
      .filter(k => k.toLowerCase().includes(q));
    if (keywords.length) groups.push({
      label: 'Mots-clés',
      items: keywords.slice(0,6).map(k=>({
        text: k, badge: String(freq[k]), color: null,
        action: ()=>{ if(state.activeKeywordFilters.has(k)) state.activeKeywordFilters.delete(k); else state.activeKeywordFilters.add(k); renderSearchActiveTags(); renderSearchDropdown(); render(); },
        isKw: true, active: state.activeKeywordFilters.has(k)
      }))
    });
  }

  if (!groups.length) {
    list.innerHTML = q ? '<div class="search-kw-empty">Aucun résultat</div>' : '<div class="search-kw-empty">Tapez pour chercher…</div>';
    return;
  }

  // Aplatir les groupes — même rendu que le dropdown inline (idx-dd-item)
  const flatItems = groups.flatMap(g => g.items.map(item => ({ ...item, groupLabel: g.label })));

  list.innerHTML = flatItems.map((item, i) => {
    // Point de typologie : couleur sombre du duotone (hover sombre et saturé)
    const dot = item.darkColor
      ? `<span class="idx-dd-dot" style="background:${item.darkColor}"></span>`
      : '';
    const darkAttr = item.darkColor ? ` style="--dd-dark:${item.darkColor}"` : '';
    return `<button class="idx-dd-item${item.active ? ' active' : ''}" data-idx="${i}"${darkAttr}>
      <span class="idx-dd-name">${dot}${esc(item.text)}</span>
      <em class="idx-dd-verbe">${esc(item.badge || item.groupLabel)}</em>
    </button>`;
  }).join('');

  list.querySelectorAll('.idx-dd-item').forEach((el, i) => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      flatItems[i].action();
      document.getElementById('searchDropdown').classList.remove('open');
    });
  });
}
// ── Cmd+K / Ctrl+K — ouvre la barre de recherche principale ────────────────
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const input = document.getElementById('searchInput');
    if (!input) return;
    // Si on est dans une autre vue, revenir à l'inventaire
    if (state.view !== 'grid') setView('grid');
    // Focus + sélectionner le texte existant
    setTimeout(() => { input.focus(); input.select(); }, 50);
  }
});

function renderSearchActiveTags() {
  const container=document.getElementById('searchActiveTags');
  container.innerHTML=[...state.activeKeywordFilters].map(kw=>`<span class="search-filter-tag">${esc(kw)}<button data-kw="${esc(kw)}">✕</button></span>`).join('');
  container.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); state.activeKeywordFilters.delete(btn.dataset.kw); renderSearchActiveTags(); renderSearchDropdown(); render(); }));
  document.getElementById('searchInput').placeholder=state.activeKeywordFilters.size?'':'Rechercher';
}
function setupSearch() {
  const wrap=document.getElementById('searchWrap');
  const bar=document.getElementById('searchBar');
  const input=document.getElementById('searchInput');
  const dropdown=document.getElementById('searchDropdown');
  const open=()=>{ renderSearchDropdown(); dropdown.classList.add('open'); };
  const close=()=>dropdown.classList.remove('open');
  bar.addEventListener('click',()=>input.focus());
  input.addEventListener('focus',open);
  input.addEventListener('input',()=>{ renderSearchDropdown(); render(); });
  dropdown.addEventListener('mousedown',e=>e.preventDefault());
  document.addEventListener('click',e=>{ if(!wrap.contains(e.target)) close(); });
  // Lien "Parcourir l'index complet" → ouvre l'Index Overlay
  document.getElementById('searchIndexLink')?.addEventListener('click', () => {
    close();
    openIndexOverlay();
  });
}

// ── Events ─────────────────────────────────────────────────────────────────────
function bindEvents() {
  // Header
  document.getElementById('newBtn').addEventListener('click', openNew);
  document.getElementById('fabBtn')?.addEventListener('click', openNew);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);

  // ── Mobile Footer : bouton Retour → remonte d'un cran dans le breadcrumb ──
  document.getElementById('mfnBackBtn')?.addEventListener('click', () => {
    const crumbs = state.breadcrumb || [];
    if (crumbs.length < 2) {
      // Aucun historique → retour à l'Inventaire par défaut
      state.categoryFilter = '';
      setView('grid', true);
      return;
    }
    // Retirer l'élément courant et exécuter l'action du précédent
    crumbs.pop();
    const prev = crumbs[crumbs.length - 1];
    if (prev && typeof prev.backAction === 'function') prev.backAction();
    renderBreadcrumbBar();
    renderMobileFooterNav();
  });

  // ── Note Modal — Intercalaires narratifs ──
  document.getElementById('noteBtn').addEventListener('click', () => openNoteModal(null));
  document.getElementById('noteModalClose').addEventListener('click', closeNoteModal);
  document.getElementById('noteModalCancel').addEventListener('click', closeNoteModal);
  document.getElementById('noteModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeNoteModal(); });
  document.getElementById('noteModalSave').addEventListener('click', saveNote);
  document.getElementById('noteDeleteBtn').addEventListener('click', () => { if (_noteEditId) deleteNote(_noteEditId); });
  // Font selector
  document.querySelectorAll('#noteFontGroup [data-font]').forEach(btn => {
    btn.addEventListener('click', () => {
      _noteSelectedFont = btn.dataset.font;
      _syncNoteOptBtns();
      _updateNotePreview();
    });
  });
  // Width selector
  document.querySelectorAll('#noteWidthGroup [data-width]').forEach(btn => {
    btn.addEventListener('click', () => {
      _noteSelectedWidth = btn.dataset.width;
      _syncNoteOptBtns();
    });
  });
  // Size selector
  document.querySelectorAll('#noteSizeGroup [data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      _noteSelectedSize = btn.dataset.size;
      _syncNoteOptBtns();
      _updateNotePreview();
    });
  });
  // Aperçu live sur frappe
  document.getElementById('nContent').addEventListener('input', _updateNotePreview);
  document.getElementById('settingsModalClose').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsModalCancel').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsModalSave').addEventListener('click', saveSettingsModal);
  document.getElementById('settingsModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettingsModal(); });

  // Export buttons — bottom-nav uniquement (footer dupliqué supprimé)
  document.getElementById('exportJsonBtn').addEventListener('click', ()=>{ window.location.href='/api/export'; });
  document.getElementById('exportShopifyBtn').addEventListener('click', ()=>{ window.location.href='/api/export/shopify'; });

  // Sort & size
  document.getElementById('sortSelect').addEventListener('change',e=>{ state.sortBy=e.target.value; render(); });
  // ── Dropdown Statut (remplace la barre de pills) ───────────────────────
  const statusSel = document.getElementById('statusSelect');
  if (statusSel) {
    statusSel.addEventListener('change', e => {
      const v = e.target.value;
      if (v === '__selection__') {
        state.bookmarkFilter = true;
        state.statusFilter = '';
      } else {
        state.bookmarkFilter = false;
        state.statusFilter = v;
      }
      render();
    });
  }
  (() => {
    const slider = document.getElementById('cardSizeSlider');
    if (!slider) return;

    // Convertit la valeur slider (140→480) en nombre de colonnes (6→2)
    // Plus le slider est vers la droite (grande valeur = grand zoom) → moins de colonnes
    const sliderToColumns = v => {
      const min = parseFloat(slider.min) || 140;
      const max = parseFloat(slider.max) || 480;
      const ratio = (parseFloat(v) - min) / (max - min); // 0 (petit) → 1 (grand)
      // 6 colonnes (zoom out max) → 2 colonnes (zoom in max)
      return Math.max(1, Math.round(6 - ratio * 4));
    };

    const apply = v => {
      const cols = sliderToColumns(v);
      document.documentElement.style.setProperty('--grid-cols', cols);
      document.documentElement.style.setProperty('--card-min', v + 'px');
      // --card-zoom : lie la taille du bouton * au zoom de la grille
      // cols 6 (petites cartes) → scale 0.62 | cols 2 (grandes cartes) → scale 1.20
      const min = parseFloat(slider.min) || 140;
      const max = parseFloat(slider.max) || 480;
      const ratio = (parseFloat(v) - min) / (max - min); // 0→1
      const zoomScale = (0.62 + ratio * 0.58).toFixed(3); // 0.62→1.20
      document.documentElement.style.setProperty('--card-zoom', zoomScale);
    };

    // Appliquer la valeur initiale
    apply(slider.value);

    slider.addEventListener('input', e => { apply(e.target.value); _applyGridCols(); });

    // Mobile touch fix: stop parent from intercepting horizontal swipe
    slider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    slider.addEventListener('touchmove',  e => {
      e.stopPropagation();
      const rect  = slider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.touches[0].clientX - rect.left) / rect.width));
      const min   = parseFloat(slider.min) || 140;
      const max   = parseFloat(slider.max) || 480;
      const val   = Math.round(min + ratio * (max - min));
      slider.value = val;
      apply(val);
    }, { passive: true });
  })();

  // ── Nuée : slider = zoom visuel global (échelle des cartes) ───────────────
  (() => {
    const slider = document.getElementById('nueeZoomSlider');
    if (!slider) return;
    const sliderToZoom = v => {
      const min = parseFloat(slider.min) || 80;
      const max = parseFloat(slider.max) || 480;
      const ratio = (parseFloat(v) - min) / (max - min);
      return 0.35 + ratio * 1.9; // 0.35× (dézoom large) → 2.25× (zoom serré)
    };
    const apply = v => { _nueeZoom = sliderToZoom(v); };
    apply(slider.value);
    slider.addEventListener('input', e => apply(e.target.value));
    slider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    slider.addEventListener('touchmove', e => {
      e.stopPropagation();
      const rect  = slider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.touches[0].clientX - rect.left) / rect.width));
      const min   = parseFloat(slider.min) || 80;
      const max   = parseFloat(slider.max) || 480;
      const val   = Math.round(min + ratio * (max - min));
      slider.value = val;
      apply(val);
    }, { passive: true });
  })();

  // ── Constellation zoom slider ──────────────────────────────────────────────
  (() => {
    const slider = document.getElementById('conZoomSlider');
    if (!slider) return;
    const applyScale = v => {
      if (!_conZoom || !_conSvgSel) return;
      const scale = Math.max(0.08, Math.min(4, parseFloat(v) / 100));
      _conSvgSel.transition().duration(180).call(_conZoom.scaleTo, scale);
    };
    slider.addEventListener('input', e => applyScale(e.target.value));
    slider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    slider.addEventListener('touchmove', e => {
      e.stopPropagation();
      const rect  = slider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.touches[0].clientX - rect.left) / rect.width));
      const min   = parseFloat(slider.min) || 10;
      const max   = parseFloat(slider.max) || 200;
      const val   = Math.round(min + ratio * (max - min));
      slider.value = val;
      applyScale(val);
    }, { passive: true });
  })();

  // Status filter
  document.querySelectorAll('#statusFilterBar .sfb-pill').forEach(pill=>{
    pill.addEventListener('click',()=>{
      if (pill.dataset.bookmark) {
        state.bookmarkFilter = !state.bookmarkFilter;
        if (state.bookmarkFilter) state.statusFilter = ''; // exclusif
      } else {
        state.statusFilter = pill.dataset.status;
        state.bookmarkFilter = false; // désactive "mis de côté"
      }
      render();
    });
  });

  // Attribute filters are now handled by buildMultiFilter() (multi-select dropdowns)
  const clearAttrBtn = document.getElementById('clearAttrFilters');
  if (clearAttrBtn) clearAttrBtn.addEventListener('click',()=>{
    state.attrFilters = {subcat:[],matieres:[],origine:[],etat_traces:[],couleurs:[]};
    buildAttrFilterBar(); render();
  });

  // View tabs
  document.getElementById('viewInventaire').addEventListener('click', () => {
    // Retour à l'état initial : Toutes (intentions) / Tous (objets)
    state.categoryFilter        = '';
    state.typoFilter            = '';
    state.statusFilter          = '';
    state.bookmarkFilter        = false;
    state.attrFilters           = { subcat: [], matieres: [], origine: [], etat_traces: [], couleurs: [], motifs: [], usage: [], role: [] };
    state.searchQuery           = '';
    state.activeKeywordFilters  = new Set();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    document.body.classList.remove('verbe-active');
    document.body.style.removeProperty('--page-verbe-bg');
    document.body.style.removeProperty('--page-verbe-text');
    buildCategoryFilterBar();
    buildTypologyFilterBar();
    buildIndexTrigger();
    buildAttrFilterBar();
    renderSearchActiveTags();
    setView('grid');
  });
  document.getElementById('viewDerive').addEventListener('click', () => setView('derive'));
  document.getElementById('viewAtelier').addEventListener('click', () => { _currentTrio = null; setView('trios'); });
  document.getElementById('viewDiorama').addEventListener('click', () => setView('diorama'));
  document.getElementById('viewCalendar').addEventListener('click', () => setView('calendar'));
  document.getElementById('viewCatalogue').addEventListener('click', () => setView('catalogue'));
  document.getElementById('viewStats').addEventListener('click', () => setView('stats'));

  // Derive segmented control
  document.querySelectorAll('.derive-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => _applyDeriveMode(btn.dataset.mode));
  });
  // Bouton mélanger
  document.getElementById('deriveShuffleBtn')?.addEventListener('click', () => {
    state.galleryShuffled = !state.galleryShuffled;
    if (state.galleryShuffled) {
      // Générer un nouvel ordre aléatoire à chaque activation
      state._shuffleOrder = null;
    }
    render();
  });
  // Init thumb position once fonts are loaded (needs layout)
  requestAnimationFrame(() => requestAnimationFrame(_updateDeriveThumb));

  // Trios — tab switching
  document.querySelectorAll('.trios-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _triosActiveTab = btn.dataset.tab;
      _currentTrio = null;
      document.querySelectorAll('.trios-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('triosPanelHashard').style.display = _triosActiveTab === 'hasard'  ? '' : 'none';
      document.getElementById('triosPanelRegles').style.display  = _triosActiveTab === 'regles'  ? '' : 'none';
      document.getElementById('triosPanelManuel').style.display  = _triosActiveTab === 'manuel'  ? '' : 'none';
      if (_triosActiveTab !== 'manuel') {
        document.getElementById('triosResult').style.display = 'none';
        document.getElementById('triosLinkBar').innerHTML = '';
      }
      renderTrios();
    });
  });

  // Mode 1 — Composer
  document.getElementById('triosComposeBtn').addEventListener('click', () => {
    const matiere   = document.getElementById('trioFiltMatiere').value;
    const teinte    = document.getElementById('trioFiltTeinte').value;
    const intention = document.getElementById('trioFiltIntention').value;
    const trio = _generateTrioFiltered(matiere, teinte, intention);
    if (!trio) {
      alert('Pas assez d\'objets correspondant à ces critères. Essaie avec moins de filtres.');
      return;
    }
    _currentTrio = trio;
    renderTrios();
  });

  // Mode 2 — Règles d'Art
  document.querySelectorAll('.trios-rule-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.trios-rule-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const trio = _generateTrioByRule(pill.dataset.rule);
      if (!trio) {
        document.getElementById('triosRuleDesc').textContent = 'Pas assez d\'objets pour cette règle.';
        document.getElementById('triosResult').style.display = 'none';
        return;
      }
      document.getElementById('triosRuleDesc').textContent = '';
      _currentTrio = trio;
      renderTrios();
    });
  });

  // Mode 3 — Recherche inventaire
  document.getElementById('triosInvSearch').addEventListener('input', _renderInventoryStrip);

  // Mode 3 — Sauvegarder composition (localStorage)
  document.getElementById('triosSaveBtn').addEventListener('click', () => {
    const filled = _triosManualSlots.filter(Boolean);
    if (filled.length < 3) { alert('Place 3 objets pour sauvegarder la composition.'); return; }
    _savedTrios.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      savedAt: new Date().toISOString(),
      objectIds: filled.map(o => o.id)
    });
    _persistSavedTrios();
    const btn = document.getElementById('triosSaveBtn');
    btn.textContent = '✓ Sauvegardée !';
    setTimeout(() => { btn.textContent = 'Sauvegarder la composition'; }, 2200);
    _renderSavedTrios();
  });

  // Panier constellation — vider
  document.getElementById('conPanierClear')?.addEventListener('click', () => {
    _conPanier = [];
    _renderConPanier();
  });

  // Timeline — mode buttons
  document.querySelectorAll('.tl-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tlMode = btn.dataset.mode;
      render();
    });
  });

  // Edit modal — no close on outside click
  document.getElementById('editModalClose').addEventListener('click', closeEdit);
  document.getElementById('cancelBtn').addEventListener('click', closeEdit);
  document.getElementById('saveBtn').addEventListener('click', ()=>saveCollection(false));
  document.getElementById('draftBtn').addEventListener('click', ()=>saveCollection(true));
  document.getElementById('deleteBtn').addEventListener('click', deleteCollection);

  // Modal tabs
  document.querySelectorAll('.modal-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>switchModalTab(tab.dataset.tab));
  });

  // Category change → update subcategory chips + stylize buttons state
  document.getElementById('fCategory').addEventListener('change',e=>{
    state.editSubcategories = [];
    renderSubcategoryChips(e.target.value);
    document.getElementById('fSubcategoryCustomField').style.display='none';
    _updateStylizeButtonsState();
  });
  // (fSubcategoryCustomField is now shown only via renderSubcategoryChips if needed)

  // Univers/Atmosphère header binding is handled inside renderAllAttributes()

  // Detail modal
  document.getElementById('detailModalClose').addEventListener('click', closeDetail);
  document.getElementById('detailCloseBtn').addEventListener('click', closeDetail);
  document.getElementById('detailPrev').addEventListener('click', ()=>detailNav(-1));
  document.getElementById('detailNext').addEventListener('click', ()=>detailNav(1));
  document.getElementById('detailModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeDetail(); });

  // Settings (onglet dans le modal d'édition)
  document.getElementById('settingsCancelBtn').addEventListener('click', closeSettings);
  document.getElementById('settingsSaveBtn').addEventListener('click', saveSettings);
  // Onglet Paramètres — déclenché via le tab
  document.querySelector('.modal-tab-settings').addEventListener('click', () => {
    state.settingsDraft = JSON.parse(JSON.stringify(state.settings));
    renderSettingsPanel();
    const titleEl = document.getElementById('settingsSiteTitle');
    if (titleEl) titleEl.value = state.settings.siteTitle || 'ARCHIVE';
  });

  // Settings add buttons
  document.getElementById('addCatBtn').addEventListener('click',()=>{
    const name=document.getElementById('newCatName').value.trim(); if(!name) return;
    if (!state.settingsDraft.verbes) state.settingsDraft.verbes = [];
    state.settingsDraft.verbes.push({name, color:'#888888', typologies:[]});
    document.getElementById('newCatName').value=''; renderSettingsPanel();
  });
  document.getElementById('addLocationBtn').addEventListener('click',()=>{
    const v=document.getElementById('newLocationName').value.trim(); if(!v) return;
    state.settingsDraft.locations.push(v); document.getElementById('newLocationName').value=''; renderSettingsPanel();
  });
  document.getElementById('addColorBtn').addEventListener('click',()=>{
    const v = document.getElementById('newColorName').value.trim(); if (!v) return;
    const hex = document.getElementById('newColorHex').value;
    const d = state.settingsDraft;
    if (!d.colors.includes(v)) {
      d.colors.push(v);
      if (!d.customColorHexes) d.customColorHexes = {};
      d.customColorHexes[v] = hex;
    }
    document.getElementById('newColorName').value = '';
    document.getElementById('newColorHex').value = '#888888';
    renderSettingsPanel();
  });
  document.getElementById('addMotifBtn').addEventListener('click',()=>{
    const v=document.getElementById('newMotifName').value.trim(); if(!v) return;
    state.settingsDraft.motifs.push(v); document.getElementById('newMotifName').value=''; renderSettingsPanel();
  });
  document.getElementById('addUniversBtn').addEventListener('click',()=>{
    const v=document.getElementById('newUniversName').value.trim(); if(!v) return;
    state.settingsDraft.univers.push(v); document.getElementById('newUniversName').value=''; renderSettingsPanel();
  });

  // Lightbox
  document.getElementById('lbClose').addEventListener('click',()=>{ document.getElementById('lightbox').style.display='none'; });
  document.getElementById('lbPrev').addEventListener('click',e=>{ e.stopPropagation(); lbNav(-1); });
  document.getElementById('lbNext').addEventListener('click',e=>{ e.stopPropagation(); lbNav(1); });
  // Click overlay → close; click image → toggle zoom
  document.getElementById('lightbox').addEventListener('click',e=>{
    if(e.target===e.currentTarget) document.getElementById('lightbox').style.display='none';
  });
  document.getElementById('lightboxImg').addEventListener('click',e=>{
    e.stopPropagation();
    const img = e.currentTarget;
    if(img.classList.contains('lb-zoomed')){
      img.classList.remove('lb-zoomed');
      img.style.cursor='';
      _lbPreZoomRect=null;
    } else {
      _lbPreZoomRect = img.getBoundingClientRect();
      const ox = ((e.clientX - _lbPreZoomRect.left) / _lbPreZoomRect.width * 100).toFixed(1)+'%';
      const oy = ((e.clientY - _lbPreZoomRect.top) / _lbPreZoomRect.height * 100).toFixed(1)+'%';
      img.style.setProperty('--lb-ox', ox);
      img.style.setProperty('--lb-oy', oy);
      img.classList.add('lb-zoomed');
      img.style.cursor='crosshair';
    }
  });
  // Mousemove → pan when zoomed
  document.getElementById('lightbox').addEventListener('mousemove',e=>{
    const img = document.getElementById('lightboxImg');
    if(!img.classList.contains('lb-zoomed') || !_lbPreZoomRect) return;
    const ox = ((e.clientX - _lbPreZoomRect.left) / _lbPreZoomRect.width * 100).toFixed(1)+'%';
    const oy = ((e.clientY - _lbPreZoomRect.top) / _lbPreZoomRect.height * 100).toFixed(1)+'%';
    img.style.setProperty('--lb-ox', ox);
    img.style.setProperty('--lb-oy', oy);
  });

  // Catalogue
  document.getElementById('catalogueSelectAll').addEventListener('click',()=>{
    const anyUnchecked=[...document.querySelectorAll('.cat-row-check')].some(c=>!c.checked);
    catalogueSelectAll(anyUnchecked);
    document.getElementById('catalogueSelectAll').textContent=anyUnchecked?'Tout désélectionner':'Tout sélectionner';
  });
  document.getElementById('cataloguePrintBtn').addEventListener('click', cataloguePrint);

  // Keyboard
  document.addEventListener('keydown',e=>{
    const lb=document.getElementById('lightbox');
    const dm=document.getElementById('detailModal');
    if(lb.style.display!=='none'){ if(e.key==='ArrowLeft')lbNav(-1); if(e.key==='ArrowRight')lbNav(1); if(e.key==='Escape')lb.style.display='none'; }
    else if(dm.style.display!=='none'){ if(e.key==='ArrowLeft')detailNav(-1); if(e.key==='ArrowRight')detailNav(1); if(e.key==='Escape')closeDetail(); }
  });

  // Date picker (achat)
  document.getElementById('dateAchatDisplay').addEventListener('click',e=>{
    e.stopPropagation();
    document.getElementById('dateAchatPickerPanel').classList.toggle('open');
    renderDpAchatMonths();
  });
  document.getElementById('dpAchatPrev').addEventListener('click',e=>{ e.stopPropagation(); state.dpAchatYear--; renderDpAchatMonths(); });
  document.getElementById('dpAchatNext').addEventListener('click',e=>{ e.stopPropagation(); state.dpAchatYear++; renderDpAchatMonths(); });
  document.getElementById('dpAchatClear').addEventListener('click',e=>{
    e.stopPropagation();
    state.dpAchatSelectedDate='';
    document.getElementById('fDateAchat').value='';
    dateAchatDisplayUpdate();
    document.getElementById('dateAchatPickerPanel').classList.remove('open');
  });
  document.addEventListener('click',e=>{
    const picker = document.getElementById('dateAchatPicker');
    if (picker && !picker.contains(e.target)) document.getElementById('dateAchatPickerPanel').classList.remove('open');
    if(!document.getElementById('keywordsWrap').contains(e.target)) document.getElementById('keywordsSuggestions').classList.remove('open');
  });

  // Keywords & photos
  setupKeywordInput();
  const dropZone=document.getElementById('photosDropZone');
  dropZone.addEventListener('click',()=>document.getElementById('photosInput').click());
  dropZone.addEventListener('dragover',e=>{ e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',async e=>{ e.preventDefault(); dropZone.classList.remove('drag-over'); await handlePhotoFiles([...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'))); });
  document.getElementById('photosInput').addEventListener('change',async e=>{ await handlePhotoFiles([...e.target.files]); e.target.value=''; });

  // Private photos
  document.getElementById('privatePhotosDropZone').addEventListener('click',()=>document.getElementById('privatePhotosInput').click());
  document.getElementById('privatePhotosInput').addEventListener('change',async e=>{ await handlePrivatePhotoFiles([...e.target.files]); e.target.value=''; });
  document.getElementById('privatePhotosDropZone').addEventListener('dragover',e=>{e.preventDefault();e.currentTarget.classList.add('drag-over');});
  document.getElementById('privatePhotosDropZone').addEventListener('dragleave',e=>e.currentTarget.classList.remove('drag-over'));
  document.getElementById('privatePhotosDropZone').addEventListener('drop',async e=>{e.preventDefault();e.currentTarget.classList.remove('drag-over');await handlePrivatePhotoFiles([...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')));});

  // Custom matière/style buttons are bound dynamically in renderAllAttributes()

  // Timeline & calendar
  initTimelineZoom();
  bindCalendarEvents();

  // Search
  setupSearch();

}

// ── ARE.NA : Fragment form toggle ────────────────────────────────────────────
function _setFormType(type) {
  state._formType = type;
  document.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const isFragment = type === 'fragment';
  const photosZone = document.getElementById('photosZone');
  const fragZone   = document.getElementById('fragmentZone');
  const nameField  = document.getElementById('fName')?.closest('.field');
  if (photosZone) photosZone.style.display = isFragment ? 'none' : '';
  if (fragZone)   fragZone.style.display   = isFragment ? ''     : 'none';
  if (nameField) nameField.style.opacity = isFragment ? '0.5' : '';
  if (isFragment) {
    renderFragmentBgPicker();
    _updateFragmentPreview();
  }
}

// ── ARE.NA : Fragment background palette ────────────────────────────────────
function renderFragmentBgPicker() {
  const container = document.getElementById('fragmentBgPicker');
  if (!container) return;
  container.innerHTML = '';

  const selected = state.editFragmentBg || '#1a1a1a';

  // 1. Couleurs des verbes
  getVerbes().forEach(v => {
    const hex = v.bgColor || v.color || '#1a1a1a';
    _addFragBgSwatch(container, hex, hex === selected, v.name);
  });

  // 2. Couleurs custom (settings.customColorHexes)
  const customHexes = state.settings.customColorHexes || {};
  Object.entries(customHexes).forEach(([name, hex]) => {
    _addFragBgSwatch(container, hex, hex === selected, name);
  });

  // 3. Couleurs neutres toujours présentes (blanc, noir, écru)
  const basics = [
    { hex: '#F5F5F0', label: 'Écru' },
    { hex: '#FFFFFF', label: 'Blanc' },
    { hex: '#1a1a1a', label: 'Noir' },
  ];
  basics.forEach(({ hex, label }) => {
    if (!getVerbes().some(v => (v.bgColor||v.color) === hex))
      _addFragBgSwatch(container, hex, hex.toUpperCase() === selected.toUpperCase(), label);
  });

  // 4. Bouton "+" pour couleur custom
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'frag-bg-swatch-add';
  addBtn.title = 'Couleur personnalisée';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => {
    const native = document.getElementById('fFragmentBgNative');
    if (!native) return;
    native.value = state.editFragmentBg || '#1a1a1a';
    native.click();
  });
  container.appendChild(addBtn);

  // Listener on native picker
  const native = document.getElementById('fFragmentBgNative');
  if (native) {
    native.oninput = e => {
      state.editFragmentBg = e.target.value;
      renderFragmentBgPicker();
      _updateFragmentPreview();
    };
  }
}

function _addFragBgSwatch(container, hex, isSelected, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'frag-bg-swatch' + (isSelected ? ' selected' : '');
  btn.style.background = hex;
  btn.title = label || hex;
  // White swatches: add a subtle border
  if (hex === '#FFFFFF' || hex === '#F5F5F0' || hex === '#ffffff') {
    btn.style.outline = '1px solid var(--border-light)';
  }
  btn.addEventListener('click', () => {
    state.editFragmentBg = hex;
    renderFragmentBgPicker();
    _updateFragmentPreview();
  });
  container.appendChild(btn);
}

function _updateFragmentPreview() {
  const preview = document.getElementById('fragmentPreview');
  const previewText = document.getElementById('fragmentPreviewText');
  const textarea = document.getElementById('fFragmentText');
  if (!preview) return;
  const bg = state.editFragmentBg || '#1a1a1a';
  const lum = _luminance(bg);
  const fg = lum > 0.35 ? '#1a1a1a' : '#f5f5f0';
  preview.style.background = bg;
  if (previewText) {
    previewText.style.color = fg;
    previewText.textContent = textarea?.value || '…';
  }
}

// ── ARE.NA : Exposition chips in form ────────────────────────────────────────
function renderExpoChipsPicker() {
  const container = document.getElementById('expoChipsPicker');
  if (!container) return;
  container.innerHTML = '';
  state.expositions.forEach(e => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'expo-chip' + (state.editExpositions.includes(e.id) ? ' selected' : '');
    btn.textContent = e.title;
    btn.dataset.id = e.id;
    btn.addEventListener('click', () => {
      const i = state.editExpositions.indexOf(e.id);
      if (i >= 0) state.editExpositions.splice(i, 1);
      else state.editExpositions.push(e.id);
      renderExpoChipsPicker();
    });
    container.appendChild(btn);
  });
  // "+" button to create a new exposition inline
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'expo-chip expo-chip-add';
  addBtn.textContent = '+ Nouvelle…';
  addBtn.addEventListener('click', async () => {
    const title = prompt('Nom de l\'exposition / collection :');
    if (!title?.trim()) return;
    const expo = await api.post('/api/expositions', { title: title.trim() });
    state.expositions.push(expo);
    state.editExpositions.push(expo.id);
    renderExpoChipsPicker();
  });
  container.appendChild(addBtn);
}

// ── Historique de navigation — Fil d'Ariane persistant ───────────────────────
const BC_MAX_HISTORY = 12;  // entrées conservées en mémoire
const BC_MAX_VISIBLE = 3;   // étapes visibles — si dépassement, préfixe "…"

function pushBreadcrumb(label, backAction) {
  const tail = state.breadcrumb[state.breadcrumb.length - 1];
  if (tail && tail.label === label) return; // pas de doublon en queue
  state.breadcrumb.push({ label, backAction });
  if (state.breadcrumb.length > BC_MAX_HISTORY) state.breadcrumb.shift();
  renderBreadcrumbBar();
  renderMobileFooterNav();
}

// ── Footer mobile : fil d'Ariane compact + bouton Retour ─────────────────
function renderMobileFooterNav() {
  const bc = document.getElementById('mfnBreadcrumb');
  if (!bc) return;
  const crumbs = state.breadcrumb || [];
  if (crumbs.length === 0) {
    bc.innerHTML = '<span class="mfn-item">Inventaire</span>';
    return;
  }
  // Derniers 3 items, séparés par ›
  const visible = crumbs.slice(-3);
  bc.innerHTML = visible.map((c, i) =>
    (i > 0 ? '<span class="mfn-sep">›</span>' : '') +
    `<span class="mfn-item">${esc(c.label)}</span>`
  ).join('');
}

function renderBreadcrumbBar() {
  const bar = document.getElementById('breadcrumbBar');
  if (!bar) return;
  if (state.breadcrumb.length <= 1) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  const crumbs = state.breadcrumb;
  const total  = crumbs.length;
  // Afficher au plus BC_MAX_VISIBLE items en partant de la fin
  const hasEllipsis = total > BC_MAX_VISIBLE;
  const offset      = hasEllipsis ? total - BC_MAX_VISIBLE : 0;
  const visible     = crumbs.slice(offset);

  let html = hasEllipsis
    ? `<span class="bc-ellipsis" title="Historique tronqué">…</span><span class="bc-sep">›</span>`
    : '';

  visible.forEach((item, i) => {
    const realIdx  = offset + i;
    const isCurrent = realIdx === total - 1;
    const cls = 'bc-item' + (isCurrent ? ' bc-current' : '');
    if (i > 0) html += `<span class="bc-sep">›</span>`;
    html += `<span class="${cls}" data-bc-idx="${realIdx}">${esc(item.label)}</span>`;
  });

  bar.innerHTML = html;
  bar.querySelectorAll('.bc-item:not(.bc-current)').forEach(el => {
    el.addEventListener('click', () => {
      const idx  = parseInt(el.dataset.bcIdx);
      const item = state.breadcrumb[idx];
      state.breadcrumb = state.breadcrumb.slice(0, idx + 1);
      renderBreadcrumbBar();
      if (item.backAction) item.backAction();
    });
  });
}

init();
