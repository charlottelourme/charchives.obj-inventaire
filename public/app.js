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
    label: 'Origine',
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
  'Disponible': '#22c55e',
  'Réservé':    '#f59e0b',
  'Vendu':      '#9ca3af',
  'Brouillon':  '#d1d5db',
};

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  collections: [],
  keywords:    [],
  settings:    {},
  view: 'grid',
  sortBy: 'chrono-desc',
  categoryFilter: '',
  statusFilter: 'Disponible',
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
  dpYear: new Date().getFullYear(),
  dpSelectedDate: '',
  attrFilters: { subcat: [], matieres: [], origine: [], etat_traces: [], couleurs: [] },
  calDateType: 'createdAt',
  dpAchatYear: new Date().getFullYear(),
  dpAchatSelectedDate: '',
  darkMode: false,
  // settings edit
  settingsDraft: null,
};

const LB = { photos: [], idx: 0 };
const TL = { zoom:1, panX:0, panY:0, isDragging:false, hasDragged:false, startX:0, startY:0, startPanX:0, startPanY:0 };
const _charts = {};
let _kwShowAll = false;

// ── API helpers ────────────────────────────────────────────────────────────────
const api = {
  get:  url => fetch(url).then(r => r.json()),
  post: (url, b) => fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()),
  put:  (url, b) => fetch(url,{method:'PUT', headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()),
  del:  url => fetch(url,{method:'DELETE'}).then(r=>r.json()),
  uploadPhotos: files => { const fd=new FormData(); files.forEach(f=>fd.append('photos',f)); return fetch('/api/upload',{method:'POST',body:fd}).then(r=>r.json()); }
};

// ── Verbes & Typologies helpers ────────────────────────────────────────────────
// Lit 'verbes' en priorité, 'categories' comme fallback rétrocompat
function getVerbes() { return state.settings.verbes || state.settings.categories || []; }
function getCategories() { return getVerbes(); } // alias rétrocompat
function getVerbeBgColor(name) {
  const v = getVerbes().find(v => v.name === name);
  return v?.bgColor || v?.color || '#111111';
}
function getVerbeTextColor(name) {
  const v = getVerbes().find(v => v.name === name);
  return v?.textColor || '#ffffff';
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
  getVerbes().forEach(v => getTypologies(v).forEach(t => { if (!seen.has(t)) { seen.add(t); result.push({ name: t, verbeName: v.name, color: v.bgColor || v.color, textColor: v.textColor || '#ffffff' }); } }));
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
  if (opts.matieres?.length)    ATTRIBUTES_DEF.matieres.options    = opts.matieres;
  if (opts.etat_traces?.length) ATTRIBUTES_DEF.etat_traces.options = opts.etat_traces;
  if (opts.usage?.length)       ATTRIBUTES_DEF.usage.options       = opts.usage;
  if (opts.role?.length)        ATTRIBUTES_DEF.role.options        = opts.role;
}

// ── Init ───────────────────────────────────────────────────────────────────────
async function init() {
  [state.collections, state.keywords, state.settings] = await Promise.all([
    api.get('/api/collections'),
    api.get('/api/keywords'),
    api.get('/api/settings')
  ]);

  // Populate color options from settings
  ATTRIBUTES_DEF.couleurs.options = state.settings.colors || [];
  ATTRIBUTES_DEF.motifs.options = state.settings.motifs || [];
  // Appliquer les labels personnalisés
  syncAttrLabels();
  applyAttributeOptions();
  // Merge custom color hexes into COLOR_MAP
  const _initCustomColors = state.settings.customColorHexes || {};
  Object.entries(_initCustomColors).forEach(([name, hex]) => { COLOR_MAP[name] = hex; });

  // Apply site title
  document.getElementById('siteTitle').textContent = state.settings.siteTitle || 'ARCHIVE';

  // Apply dark mode from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    state.darkMode = true;
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = '◐';
  }

  // Calendar years
  const colYears = state.collections.filter(c=>c.createdAt).map(c=>parseInt(c.createdAt)).filter(y=>!isNaN(y));
  const colYears2 = state.collections.filter(c=>c.date).map(c=>parseInt(c.date)).filter(y=>!isNaN(y));
  const allYears = [...colYears, ...colYears2];
  const minY = Math.min(2020, ...(allYears.length?allYears:[2020]));
  const maxY = Math.max(new Date().getFullYear(), ...(allYears.length?allYears:[new Date().getFullYear()]));
  state.calendarYears = Array.from({length: maxY-minY+1},(_,i)=>minY+i);
  getCategoryOrder().forEach(c => state.calendarActiveCategories.add(c));
  state.calendarActiveCategories.add('');

  buildCategoryFilterBar();
  buildSubcategoryBar();
  render();
  bindEvents();
}

// ── Build dynamic verbes filter bar ───────────────────────────────────────────
function buildCategoryFilterBar() {
  const bar = document.getElementById('categoryFilterBar');
  const verbes = getVerbes();
  bar.innerHTML = '<span class="sfb-label">Intention</span>';
  const all = document.createElement('button');
  all.className = 'sfb-pill' + (state.categoryFilter === '' ? ' active' : '');
  all.dataset.cat = '';
  all.textContent = 'Toutes';
  bar.appendChild(all);
  verbes.forEach(v => {
    const btn = document.createElement('button');
    const isActive = state.categoryFilter === v.name;
    btn.className = 'sfb-pill sfb-pill-verbe' + (isActive ? ' active' : '');
    btn.dataset.cat = v.name;
    btn.dataset.bg = v.bgColor || v.color || '#111';
    btn.dataset.fg = v.textColor || '#fff';
    if (isActive) {
      btn.style.background = v.bgColor || v.color || '#111';
      btn.style.color = v.textColor || '#fff';
      btn.style.borderColor = v.bgColor || v.color || '#111';
    }
    btn.textContent = v.name;
    bar.appendChild(btn);
  });
  bar.querySelectorAll('.sfb-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => {
      if (!pill.classList.contains('active') && pill.dataset.bg) {
        pill.style.background = pill.dataset.bg;
        pill.style.color = pill.dataset.fg;
        pill.style.borderColor = pill.dataset.bg;
      }
    });
    pill.addEventListener('mouseleave', () => {
      if (!pill.classList.contains('active')) {
        pill.style.background = '';
        pill.style.color = '';
        pill.style.borderColor = '';
      }
    });
    pill.addEventListener('click', () => {
      state.categoryFilter = pill.dataset.cat;
      state.attrFilters.subcat = [];
      buildTypologiesBar();
      buildAttrFilterBar();
      render();
    });
  });
  buildTypologiesBar();
  buildAttrFilterBar();
}

// ── Build attribute filter bar ────────────────────────────────────────────────
// ── Multi-select filter dropdowns ──────────────────────────────────────────────
let _openMfId = null; // which dropdown is currently open

function buildAttrFilterBar() {
  const bar = document.getElementById('attrFilterBar');
  if (!bar) return;
  const hasCatFilter = state.categoryFilter !== '';
  bar.style.display = ''; // always visible in grid

  // Sous-catégories — barre de pills dédiée sous les catégories
  buildSubcategoryBar();
  buildMultiFilter('filterMatieresWrap', 'matieres', 'Matière', ATTRIBUTES_DEF.matieres.options);
  buildMultiFilter('filterStylesWrap', 'origine', 'Origine', ATTRIBUTES_DEF.origine.options);
  buildMultiFilter('filterEtatWrap', 'etat_traces', 'État', ATTRIBUTES_DEF.etat_traces.options);
  buildMultiFilter('filterCouleursWrap', 'couleurs', 'Couleur', state.settings.colors||[]);
}

function buildSubcategoryBar() { buildTypologiesBar(); } // alias rétrocompat

function buildTypologiesBar() {
  const bar = document.getElementById('subcategoryFilterBar'); if (!bar) return;

  // Si un verbe est sélectionné : afficher uniquement ses typologies
  // Sinon : afficher TOUTES les typologies (entrée indépendante)
  let typologies;
  if (state.categoryFilter) {
    const verbe = getVerbes().find(v => v.name === state.categoryFilter);
    typologies = verbe ? getTypologies(verbe).map(t => ({ name: t, color: verbe.bgColor || verbe.color, textColor: verbe.textColor || '#ffffff' })) : [];
  } else {
    typologies = getAllTypologies().map(t => ({ name: t.name, color: t.color, textColor: t.textColor }));
  }

  if (!typologies.length) { bar.style.display = 'none'; return; }
  bar.style.display = '';

  const selected = state.attrFilters.subcat;
  bar.innerHTML = '<span class="sfb-label">Objet</span>';
  const allPill = document.createElement('button');
  allPill.className = 'sfb-pill' + (selected.length === 0 ? ' active' : '');
  allPill.textContent = 'Tous';
  allPill.addEventListener('click', () => { state.attrFilters.subcat = []; buildTypologiesBar(); render(); });
  bar.appendChild(allPill);

  typologies.forEach(({ name: sub, color, textColor: fg }) => {
    // Retrouver le textColor du verbe parent si pas passé
    const verbeObj = getVerbes().find(v => (v.bgColor || v.color) === color || (v.typologies||v.subcategories||[]).includes(sub));
    const verbeTextColor = fg || verbeObj?.textColor || '#ffffff';
    const isActive = selected.includes(sub);
    const btn = document.createElement('button');
    btn.className = 'sfb-pill sfb-pill-typo' + (isActive ? ' active' : '');
    btn.dataset.color = color;
    btn.dataset.textColor = verbeTextColor;
    // État par défaut : fond transparent, texte anthracite, bordure colorée
    if (isActive) {
      btn.style.background = color;
      btn.style.color = verbeTextColor;
      btn.style.borderColor = color;
    } else {
      btn.style.borderColor = color;
      btn.style.color = '';
      btn.style.background = '';
    }
    btn.textContent = sub;
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = color;
        btn.style.color = verbeTextColor;
        btn.style.borderColor = color;
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = color;
      }
    });
    btn.addEventListener('click', () => {
      const idx = state.attrFilters.subcat.indexOf(sub);
      if (idx>=0) state.attrFilters.subcat.splice(idx,1);
      else state.attrFilters.subcat.push(sub);
      buildTypologiesBar(); render();
    });
    bar.appendChild(btn);
  });
}

function buildMultiFilter(wrapId, key, label, options) {
  const wrap = document.getElementById(wrapId); if (!wrap) return;
  const selected = state.attrFilters[key] || [];
  const count = selected.length;
  const btnLabel = count > 0 ? `${label} <span class="mf-count">${count}</span>` : label;
  const isOpen = _openMfId === wrapId;

  wrap.innerHTML = `
    <button class="mf-btn${count>0?' mf-active':''}${isOpen?' mf-open':''}" data-wrap="${wrapId}">
      ${btnLabel} <span class="mf-arrow">${isOpen?'▾':'›'}</span>
    </button>
    ${isOpen ? `<div class="mf-panel" data-wrap="${wrapId}">
      ${options.length === 0 ? '<div class="mf-empty">Aucune option</div>' :
        options.map(opt => `
          <label class="mf-item">
            <input type="checkbox" value="${esc(opt)}" data-key="${key}" ${selected.includes(opt)?'checked':''}>
            <span>${esc(opt)}</span>
          </label>`).join('')}
      ${count>0?`<button class="mf-clear" data-key="${key}">Tout effacer</button>`:''}
    </div>` : ''}
  `;

  // Toggle open/close
  wrap.querySelector('.mf-btn').addEventListener('click', e => {
    e.stopPropagation();
    _openMfId = isOpen ? null : wrapId;
    buildAttrFilterBar();
  });

  if (isOpen) {
    // Checkbox changes
    wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const k = cb.dataset.key;
        if (cb.checked) { if (!state.attrFilters[k].includes(cb.value)) state.attrFilters[k].push(cb.value); }
        else { state.attrFilters[k] = state.attrFilters[k].filter(v=>v!==cb.value); }
        buildAttrFilterBar();
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
function setView(v) {
  state.view = v;
  const views = {grid:'gridWrapper',timeline:'timelineView',calendar:'calendarView',catalogue:'catalogueView',stats:'statsView'};
  Object.entries(views).forEach(([k,id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = k===v ? '' : 'none';
  });
  document.querySelectorAll('.view-tab').forEach(btn => btn.classList.remove('active'));
  const tabs = {grid:'viewGrid',timeline:'viewTimeline',calendar:'viewCalendar',catalogue:'viewCatalogue',stats:'viewStats'};
  const tabEl = document.getElementById(tabs[v]);
  if (tabEl) tabEl.classList.add('active');
  render();
}

// ── Filters & sort ─────────────────────────────────────────────────────────────
function getFiltered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const activeKws = [...state.activeKeywordFilters];
  return applySortTo(state.collections.filter(c => {
    if (state.categoryFilter && c.category !== state.categoryFilter) return false;
    if (state.statusFilter  && c.itemStatus !== state.statusFilter)  return false;
    if (activeKws.length && !activeKws.every(kw => (c.keywords||[]).includes(kw))) return false;
    // Attribute filters (multi-select: OR within same filter, must match all active filters)
    const af = state.attrFilters;
    const sub = c.subcategory==='Autre' ? c.subcategoryCustom : c.subcategory;
    if (af.subcat.length && !af.subcat.includes(sub)) return false;
    if (af.matieres.length && !af.matieres.some(v=>(c.attributes?.matieres||[]).includes(v))) return false;
    if (af.origine.length && !af.origine.some(v=>(c.attributes?.origine||[]).includes(v))) return false;
    if (af.etat_traces.length && !af.etat_traces.some(v=>(c.attributes?.etat_traces||[]).includes(v))) return false;
    if (af.couleurs.length && !af.couleurs.some(v=>(c.attributes?.couleurs||[]).includes(v))) return false;
    if (!q) return true;
    const searchStr = [
      c.name, c.description, c.category, c.subcategory, c.subcategoryCustom,
      ...(c.keywords||[]),
      ...(c.univers||[]),
      ...(Object.values(c.attributes||{}).flat()),
      c.itemStatus
    ].filter(Boolean).join(' ').toLowerCase();
    return searchStr.includes(q);
  }));
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

function render() {
  // Update category filter pills (+ réinitialise les inline styles duotone sur les pills inactives)
  document.querySelectorAll('#categoryFilterBar .sfb-pill').forEach(p => {
    const isActive = p.dataset.cat === state.categoryFilter;
    p.classList.toggle('active', isActive);
    if (!isActive) {
      p.style.background = '';
      p.style.color = '';
      p.style.borderColor = '';
    }
  });
  document.querySelectorAll('#statusFilterBar .sfb-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.status === state.statusFilter));

  const filtered = getFiltered();
  state.detailList = filtered;
  document.getElementById('countLabel').textContent =
    `${filtered.length} objet${filtered.length!==1?'s':''}`;

  if (state.view==='grid')      renderGrid(filtered);
  else if (state.view==='timeline') renderTimeline(filtered);
  else if (state.view==='calendar') renderCalendar();
  else if (state.view==='catalogue') renderCatalogue(filtered);
  else if (state.view==='stats')    renderStats();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
  if (!items.length) { el.innerHTML='<div class="empty-state">Aucun objet.</div>'; return; }

  if (state.sortBy==='category') {
    const groups = new Map();
    getCategoryOrder().forEach(c => groups.set(c,[]));
    groups.set('',[]);
    items.forEach(c => { const k=c.category||''; if(!groups.has(k))groups.set(k,[]); groups.get(k).push(c); });
    let html='';
    groups.forEach((cards,cat)=>{
      if (!cards.length) return;
      const bgColor = getVerbeBgColor(cat);
      const txtColor = getVerbeTextColor(cat);
      html+=`<div class="category-header" style="background:${bgColor};color:${txtColor}">
        <span>${esc(cat||'Sans catégorie')}</span>
        <span class="category-count" style="color:${txtColor};opacity:.7">${cards.length}</span>
      </div>`;
      html+=cards.map(c=>cardHTML(c)).join('');
    });
    el.innerHTML=html;
  } else {
    el.innerHTML=items.map(c=>cardHTML(c)).join('');
  }
  bindCardEvents(el);
}

function cardHTML(c) {
  const photos = c.photos||[];
  const idx = Math.min(state.cardPhotoIdx.get(c.id)||0, Math.max(0,photos.length-1));
  const photo = photos[idx];
  const hasMultiple = photos.length>1;
  const bgColor = getVerbeBgColor(c.category);
  const textColor = getVerbeTextColor(c.category);
  const statusColor = STATUS_COLORS[c.itemStatus];
  const statusBadge = statusColor ? `<span class="card-status-badge" style="background:${statusColor}"></span>` : '';
  const typoText = c.subcategory && c.subcategory !== 'Autre' ? c.subcategory : (c.subcategoryCustom || '');
  // Micro-labels dans le body
  const verbeLabel = c.category ? `<span class="card-verbe-label" style="background:${bgColor};color:${textColor}">${esc(c.category)}</span>` : '';
  const typoLabel = typoText ? `<span class="card-typo-label">${esc(typoText)}</span>` : '';
  const metaRow = (verbeLabel || typoLabel) ? `<div class="card-meta-row">${verbeLabel}${typoLabel}</div>` : '';
  const priceBadge = c.price != null && c.price !== '' ? `<span class="card-price">${c.price} €</span>` : '';
  const addedDate = c.createdAt ? `<div class="card-added-date">${formatRelativeDate(c.createdAt)}</div>` : '';

  return `
  <div class="card" data-id="${c.id}">
    <div class="card-thumb-area">
      ${statusBadge}
      ${photo
        ? `<img class="card-thumb" src="/uploads/${photo}" alt="">`
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
      ${c.description ? `<div class="card-desc">${esc(c.description)}</div>` : ''}
      <div class="card-footer-row">
        ${priceBadge}
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

function updateCardThumb(el,id,photos,idx) {
  const card=el.querySelector(`.card[data-id="${id}"]`); if(!card) return;
  const img=card.querySelector('.card-thumb'); if(img) img.src=`/uploads/${photos[idx]}`;
  const counter=card.querySelector('.card-photo-count'); if(counter) counter.textContent=`${idx+1} / ${photos.length}`;
}

// ── Calendar ───────────────────────────────────────────────────────────────────
function renderCalendarFilters() {
  const container=document.getElementById('calCategoryFilters'); if(!container) return;
  const cats=[...getCategoryOrder(),''];
  container.innerHTML=cats.map(cat=>{
    const color=getCategoryColor(cat)||'#a09590';
    const label=cat||'Sans catégorie';
    const active=state.calendarActiveCategories.has(cat);
    return `<button class="cal-cat-pill${active?' active':''}" data-cat="${esc(cat)}" style="--cat-color:${color}">${esc(label)}</button>`;
  }).join('');
  container.querySelectorAll('.cal-cat-pill').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const cat=btn.dataset.cat;
      if(state.calendarActiveCategories.has(cat)){state.calendarActiveCategories.delete(cat);btn.classList.remove('active');}
      else{state.calendarActiveCategories.add(cat);btn.classList.add('active');}
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const years=state.calendarYears;
  const byKey={};
  state.collections.forEach(c=>{
    if(!state.calendarActiveCategories.has(c.category||'')) return;
    let dateVal;
    if (state.calDateType === 'dateAchat') dateVal = c.private?.dateAchat;
    else if (state.calDateType === 'createdAt') dateVal = c.createdAt ? c.createdAt.slice(0,7) : null;
    else dateVal = c.date;
    if (!dateVal) return;
    const key=dateVal.slice(0,7);
    if(!byKey[key]) byKey[key]=[];
    byKey[key].push(c);
  });
  const grid=document.getElementById('calGrid');
  grid.style.gridTemplateColumns=`56px repeat(${years.length},minmax(140px,1fr))`;
  let html='';
  html+=`<div class="cal-head-cell"></div>`;
  years.forEach(y=>{ html+=`<div class="cal-head-cell cal-year-label">${y}</div>`; });
  MONTHS.forEach((mName,mi)=>{
    const mm=String(mi+1).padStart(2,'0');
    html+=`<div class="cal-month-label">${mName}</div>`;
    years.forEach(y=>{
      const key=`${y}-${mm}`;
      const items=byKey[key]||[];
      const shown=items.slice(0,5); const extra=items.length-shown.length;
      html+=`<div class="cal-cell">`;
      shown.forEach(c=>{
        const color=getCategoryColor(c.category);
        const thumb=c.photos?.[0]?`<img class="cal-chip-thumb" src="/uploads/${c.photos[0]}" alt="">`:'' ;
        html+=`<div class="cal-chip" data-id="${c.id}" style="border-left:3px solid ${color}">${thumb}<span class="cal-chip-name">${esc(c.name)}</span></div>`;
      });
      if(extra>0) html+=`<div class="cal-extra">+${extra}</div>`;
      html+=`</div>`;
    });
  });
  grid.innerHTML=html;
  grid.querySelectorAll('.cal-chip').forEach(chip=>chip.addEventListener('click',()=>openDetail(chip.dataset.id)));
}

function bindCalendarEvents() {
  renderCalendarFilters();
  document.getElementById('calYearBefore').addEventListener('click',()=>{ state.calendarYears.unshift(state.calendarYears[0]-1); renderCalendar(); });
  document.getElementById('calYearAfter').addEventListener('click',()=>{ state.calendarYears.push(state.calendarYears[state.calendarYears.length-1]+1); renderCalendar(); });
  const addYear=()=>{ const input=document.getElementById('calManualInput'); const y=parseInt(input.value); if(!y||y<1900||y>2200) return; if(!state.calendarYears.includes(y)){ state.calendarYears.push(y); state.calendarYears.sort((a,b)=>a-b); renderCalendar(); } input.value=''; };
  document.getElementById('calManualAdd').addEventListener('click',addYear);
  document.getElementById('calManualInput').addEventListener('keydown',e=>{ if(e.key==='Enter') addYear(); });
  document.getElementById('calDateTypeSelect').addEventListener('change',e=>{
    state.calDateType = e.target.value;
    renderCalendar();
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
      const thumb=c.photos?.[0]?`<img src="/uploads/${c.photos[0]}" alt="">`:
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
      const thumb=c.photos?.[0]?`<img src="/uploads/${c.photos[0]}" style="width:80px;height:80px;object-fit:cover;border-radius:4px">`:
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
  const sorted=[...items].sort((a,b)=>(a.createdAt||a.date||'').localeCompare(b.createdAt||b.date||''));
  const el=document.getElementById('timelineItems');
  el.innerHTML=sorted.map(c=>{
    const color=getCategoryColor(c.category);
    return `<div class="timeline-item" data-id="${c.id}">
      <div class="timeline-dot" style="background:${color}"></div>
      <div class="timeline-label">${formatRelativeDate(c.createdAt)||formatDate(c.date)||'—'}</div>
      <div class="timeline-name">${esc(c.name)}</div>
      ${c.category?`<div class="timeline-cat" style="color:${color}">${esc(c.category)}</div>`:''}
    </div>`;
  }).join('');
  const float=document.getElementById('timelineFloatPreview');
  el.querySelectorAll('.timeline-item').forEach(item=>{
    const id=item.dataset.id;
    item.addEventListener('click',()=>{ if(!TL.hasDragged) openDetail(id); });
    item.addEventListener('mouseenter',()=>{
      const c=state.collections.find(x=>x.id===id); if(!c) return;
      const color=getCategoryColor(c.category);
      const imgHTML=c.photos?.[0]
        ?`<img src="/uploads/${c.photos[0]}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block">`
        :`<div style="width:100%;aspect-ratio:4/3;background:var(--tag-bg);display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:28px">◻</div>`;
      float.innerHTML=`<div style="border-top:3px solid ${color}">${imgHTML}</div>
        <div style="padding:10px 12px 12px">
          <div style="font-size:13px;font-weight:600">${esc(c.name)}</div>
          ${c.category?`<div style="font-size:11px;color:${color};margin-top:2px">${esc(c.category)}</div>`:''}
          ${c.description?`<div style="font-size:12px;color:var(--text-2);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">${esc(c.description)}</div>`:''}
        </div>`;
      float.style.display='block';
      positionFloatPreview(item);
    });
    item.addEventListener('mouseleave',()=>{ float.style.display='none'; });
    item.addEventListener('mousemove',()=>positionFloatPreview(item));
  });
}

function positionFloatPreview(item) {
  const float=document.getElementById('timelineFloatPreview');
  const rect=item.getBoundingClientRect();
  const W=220,gap=14;
  let left=rect.left+rect.width/2-W/2;
  left=Math.max(8,Math.min(left,window.innerWidth-W-8));
  const floatH=float.offsetHeight||260;
  let top=rect.top-floatH-gap; if(top<8) top=rect.bottom+gap;
  float.style.left=left+'px'; float.style.top=top+'px';
}

function applyTLTransform() {
  const inner=document.getElementById('timelineInner');
  inner.style.transform=`translate(${TL.panX}px,${TL.panY}px) scale(${TL.zoom})`;
  document.getElementById('zoomLabel').textContent=Math.round(TL.zoom*100)+'%';
}

function initTimelineZoom() {
  const wrap=document.getElementById('timelineWrap');
  wrap.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=wrap.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const factor=e.deltaY<0?1.12:1/1.12;
    const newZoom=Math.max(0.15,Math.min(5,TL.zoom*factor));
    TL.panX=mx-(mx-TL.panX)*(newZoom/TL.zoom);
    TL.panY=my-(my-TL.panY)*(newZoom/TL.zoom);
    TL.zoom=newZoom; applyTLTransform();
  },{passive:false});
  wrap.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    TL.isDragging=true; TL.hasDragged=false;
    TL.startX=e.clientX; TL.startY=e.clientY;
    TL.startPanX=TL.panX; TL.startPanY=TL.panY;
    wrap.style.cursor='grabbing'; e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!TL.isDragging) return;
    const dx=e.clientX-TL.startX,dy=e.clientY-TL.startY;
    if(Math.abs(dx)>3||Math.abs(dy)>3) TL.hasDragged=true;
    TL.panX=TL.startPanX+dx; TL.panY=TL.startPanY+dy; applyTLTransform();
  });
  document.addEventListener('mouseup',()=>{
    if(!TL.isDragging) return;
    TL.isDragging=false; wrap.style.cursor='grab';
    setTimeout(()=>{ TL.hasDragged=false; },0);
  });
  document.getElementById('zoomIn').addEventListener('click',()=>{ TL.zoom=Math.min(5,TL.zoom*1.25); applyTLTransform(); });
  document.getElementById('zoomOut').addEventListener('click',()=>{ TL.zoom=Math.max(0.15,TL.zoom/1.25); applyTLTransform(); });
  document.getElementById('zoomReset').addEventListener('click',()=>{ TL.zoom=1; TL.panX=0; TL.panY=0; applyTLTransform(); });
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function openDetail(id) {
  const c=state.collections.find(x=>x.id===id); if(!c) return;
  state.detailCurrentId=id;
  const list=state.detailList.length?state.detailList:state.collections;
  const pos=list.findIndex(x=>x.id===id); const total=list.length;
  document.getElementById('detailNavPos').textContent=`${pos+1} / ${total}`;
  document.getElementById('detailPrev').style.visibility=total>1?'visible':'hidden';
  document.getElementById('detailNext').style.visibility=total>1?'visible':'hidden';
  document.getElementById('detailTitle').textContent=c.name;

  const body=document.getElementById('detailBody');
  const color=getCategoryColor(c.category);
  const statusColor=STATUS_COLORS[c.itemStatus]||'#9ca3af';
  const sub=(c.subcategory&&c.subcategory!=='Autre'?c.subcategory:c.subcategoryCustom)||'';

  // Build attributes summary with labels
  const attrs=c.attributes||{};
  const attrGroups=Object.entries(attrs).filter(([k,v])=>v&&(Array.isArray(v)?v.length>0:v)).map(([k,v])=>{
    const def=ATTRIBUTES_DEF[k];
    const label=def?.label||k;
    const vals=Array.isArray(v)?v:[v];
    return `<div class="detail-attr-group"><span class="detail-attr-label">${esc(label)} :</span> ${vals.filter(Boolean).map(vv=>`<span class="tag">${esc(vv)}</span>`).join(' ')}</div>`;
  }).join('');

  const univers=(c.univers||[]).map(u=>`<span class="tag tag-univers">${esc(u)}</span>`).join('');
  const kwTags=(c.keywords||[]).map(k=>`<span class="tag">${esc(k)}</span>`).join('');

  const photos=c.photos||[];
  let photoHTML='';
  if (photos.length > 0) {
    photoHTML = `<div class="detail-photos-main">
      <img src="/uploads/${photos[0]}" alt="" data-idx="0" class="detail-main-photo" style="cursor:zoom-in">
      ${photos.length > 1 ? `<div class="detail-photos-thumbs">
        ${photos.map((p,i)=>`<img src="/uploads/${p}" alt="" data-idx="${i}" class="detail-thumb-img${i===0?' active':''}">`).join('')}
      </div>` : ''}
    </div>`;
  }

  body.innerHTML=`
    <h2 class="detail-name">${esc(c.name)}</h2>
    <div class="detail-meta">
      ${c.category?`<span class="detail-cat" style="color:${color};border-color:${color}20;background:${color}12">${esc(c.category)}</span>`:''}
      ${sub?`<span class="detail-subcat-badge">${esc(sub)}</span>`:''}
      <span class="detail-status" style="background:${statusColor}20;color:${statusColor};border-color:${statusColor}40">${esc(c.itemStatus||'')}</span>
      ${c.price!=null&&c.price!==''?`<span class="detail-price">${c.price} €</span>`:''}
      ${c.depotVente?`<span class="detail-subcat-badge">Dépôt-vente${c.depotVenteName?' · '+esc(c.depotVenteName):''}</span>`:''}
      ${c.artiste?`<span class="detail-subcat-badge">Artiste contemporain${c.artisteName?' · '+esc(c.artisteName):''}</span>`:''}
    </div>
    ${univers?`<div class="detail-tags" style="margin-bottom:10px">${univers}</div>`:''}
    ${c.description?`<p class="detail-desc">${esc(c.description).replace(/\n/g,'<br>')}</p>`:''}
    ${attrGroups?`<div class="detail-attrs" style="margin-bottom:12px">${attrGroups}</div>`:''}
    ${kwTags?`<div class="detail-tags">${kwTags}</div>`:''}
    ${photoHTML}
  `;

  // Lightbox for main photo
  body.querySelectorAll('.detail-main-photo').forEach(img=>{
    img.addEventListener('click',()=>{
      LB.photos=photos; LB.idx=parseInt(img.dataset.idx)||0; showLightbox();
    });
  });

  // Thumbnail click → update main photo
  body.querySelectorAll('.detail-thumb-img').forEach(thumb=>{
    thumb.addEventListener('click',()=>{
      const idx=parseInt(thumb.dataset.idx)||0;
      const mainPhoto=body.querySelector('.detail-main-photo');
      if(mainPhoto){ mainPhoto.src=`/uploads/${photos[idx]}`; mainPhoto.dataset.idx=idx; }
      body.querySelectorAll('.detail-thumb-img').forEach(t=>t.classList.toggle('active',parseInt(t.dataset.idx)===idx));
    });
  });

  document.getElementById('detailEditBtn').onclick=()=>{ closeDetail(); openEdit(id); };
  document.getElementById('detailModal').style.display='flex';
}

function detailNav(dir) {
  const list=state.detailList.length?state.detailList:state.collections;
  const pos=list.findIndex(x=>x.id===state.detailCurrentId); if(pos===-1) return;
  openDetail(list[(pos+dir+list.length)%list.length].id);
}
function closeDetail() { document.getElementById('detailModal').style.display='none'; }

// ── Lightbox ───────────────────────────────────────────────────────────────────
function showLightbox() { updateLightboxUI(); document.getElementById('lightbox').style.display='flex'; }
function updateLightboxUI() {
  const {photos,idx}=LB;
  document.getElementById('lightboxImg').src=`/uploads/${photos[idx]}`;
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

function populateSubcategoryDropdown(catName) {
  const sel = document.getElementById('fSubcategory');
  sel.innerHTML = '<option value="">— Choisir —</option>';
  const verbe = getVerbes().find(v => v.name === catName);
  if (!verbe) return;
  getTypologies(verbe).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    sel.appendChild(opt);
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
  const allUnivers = [...(state.settings.univers || [])];
  const allItems = [...allUnivers, ...EMOTION_OPTIONS];
  const separator = allUnivers.length;
  container.innerHTML = allItems.map((u, idx) => {
    const active = state.editUnivers.includes(u);
    const isEmotion = idx >= separator;
    return `${idx === separator ? '<div class="univers-separator"></div>' : ''}
      <button type="button" class="attr-chip${active?' selected':''}${isEmotion?' chip-emotion':''}" data-univers="${esc(u)}">${esc(u)}</button>`;
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

function renderAttributeSection(key) {
  const def = ATTRIBUTES_DEF[key];
  if (!def) return;
  if (key==='couleurs') def.options = state.settings.colors||[];
  const container = document.getElementById(`attrChips_${key}`);
  if (!container) return;
  const current = state.editAttributes[key] || (def.single ? '' : []);
  const options = def.options;

  if (key === 'couleurs') {
    // Colorized chips
    container.innerHTML = options.map(opt => {
      const active = def.single ? current===opt : (Array.isArray(current)&&current.includes(opt));
      const bgColor = COLOR_MAP[opt] || 'var(--tag-bg)';
      const isDark = DARK_COLORS.has(opt);
      const textColor = isDark ? '#fff' : '#1a1917';
      return `<button type="button" class="attr-chip color-chip${active?' selected':''}" data-key="${key}" data-val="${esc(opt)}"
        style="background:${bgColor};color:${textColor};border-color:${bgColor === 'rgba(200,200,200,0.15)' ? 'var(--border)' : bgColor}">${esc(opt)}</button>`;
    }).join('');
  } else if (key === 'matieres' && def.families) {
    // Grouped by families
    let html = '';
    def.families.forEach((fam, fi) => {
      if (fi > 0) html += '<div class="attr-family-sep"></div>';
      fam.items.forEach(opt => {
        const active = Array.isArray(current)&&current.includes(opt);
        html += `<button type="button" class="attr-chip${active?' selected':''}" data-key="${key}" data-val="${esc(opt)}">${esc(opt)}</button>`;
      });
    });
    container.innerHTML = html;
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
const ATTR_DEFAULT_OPEN = new Set(['matieres','origine','etat_traces']);

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

  const order = (state.settings.attributeSectionsOrder && state.settings.attributeSectionsOrder.length)
    ? state.settings.attributeSectionsOrder
    : ['origine', 'matieres', ['motifs','couleurs'], ['etat_traces','taille'], 'usage'];

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
}

function openNew() {
  state.editId = null;
  state.editPhotos.length = 0;
  state.editPrivatePhotos = [];
  state.editKeywords.length = 0;
  state.editUnivers = [];
  state.editAttributes = {};
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
  populateSubcategoryDropdown('');
  dateAchatDisplayUpdate();
  renderTagChips();
  renderPhotos();
  renderPrivatePhotos();
  // Reset univers section to collapsed
  const _uBody = document.getElementById('universBody');
  const _uToggle = document.querySelector('#universHeader .attr-toggle');
  if (_uBody) _uBody.style.display = 'none';
  if (_uToggle) _uToggle.textContent = '›';
  renderUniversChips();
  renderAllAttributes();
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

  populateCategoryDropdown();
  document.getElementById('fCategory').value = c.category||'';
  populateSubcategoryDropdown(c.category||'');
  document.getElementById('fSubcategory').value = c.subcategory||'';
  document.getElementById('fSubcategoryCustom').value = c.subcategoryCustom||'';
  document.getElementById('fSubcategoryCustomField').style.display = c.subcategory==='Autre' ? '' : 'none';

  populateLocationDropdown();
  document.getElementById('fLocation').value = priv.location||'';

  dateAchatDisplayUpdate();
  renderTagChips();
  renderPhotos();
  renderPrivatePhotos();
  // Reset univers section to collapsed
  const _uBody = document.getElementById('universBody');
  const _uToggle = document.querySelector('#universHeader .attr-toggle');
  if (_uBody) _uBody.style.display = 'none';
  if (_uToggle) _uToggle.textContent = '›';
  renderUniversChips();
  renderAllAttributes();
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
  const attrs = { ...state.editAttributes };
  attrs.tailleReelle = document.getElementById('fTailleReelle').value.trim() || undefined;
  if (!attrs.tailleReelle) delete attrs.tailleReelle;

  const status = asDraft ? 'Brouillon' : document.getElementById('fItemStatus').value;

  const body = {
    name:        document.getElementById('fName').value.trim()||'Sans titre',
    category:    document.getElementById('fCategory').value,
    subcategory: document.getElementById('fSubcategory').value,
    subcategoryCustom: document.getElementById('fSubcategoryCustom').value.trim(),
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
    state.collections[idx] = updated;
  } else {
    const created = await api.post('/api/collections', body);
    state.collections.unshift(created);
  }
  state.keywords = await api.get('/api/keywords');
  closeEdit(); render();
}

async function deleteCollection() {
  if (!state.editId) return;
  if (!confirm('Supprimer cet objet définitivement ?')) return;
  await api.del(`/api/collections/${state.editId}`);
  state.collections = state.collections.filter(c=>c.id!==state.editId);
  closeEdit(); render();
}

// ── Photos ─────────────────────────────────────────────────────────────────────
function renderPhotos() {
  const el = document.getElementById('photosList'); if (!el) return;
  el.innerHTML = state.editPhotos.map((filename,i) => `
    <div class="photo-thumb-wrap${i===0&&state.editPhotos.length>1?' is-main':''}" draggable="true" data-i="${i}">
      ${i===0&&state.editPhotos.length>1?'<div class="photo-main-badge">Principal</div>':''}
      <img src="/uploads/${filename}" alt="" draggable="false">
      <div class="photo-actions">
        <button class="photo-remove" data-i="${i}" title="Supprimer">✕</button>
        <button class="photo-enhance" data-i="${i}" data-filename="${esc(filename)}" title="Améliorer avec IA">Améliorer</button>
      </div>
    </div>`).join('');

  let dragSrcIdx = null;
  el.querySelectorAll('.photo-thumb-wrap').forEach(wrap=>{
    wrap.addEventListener('dragstart',e=>{ dragSrcIdx=parseInt(wrap.dataset.i); e.dataTransfer.effectAllowed='move'; requestAnimationFrame(()=>wrap.classList.add('dragging')); });
    wrap.addEventListener('dragend',()=>{ wrap.classList.remove('dragging'); el.querySelectorAll('.photo-thumb-wrap').forEach(w=>w.classList.remove('drop-target')); });
    wrap.addEventListener('dragover',e=>{ e.preventDefault(); el.querySelectorAll('.photo-thumb-wrap').forEach(w=>w.classList.remove('drop-target')); if(parseInt(wrap.dataset.i)!==dragSrcIdx) wrap.classList.add('drop-target'); });
    wrap.addEventListener('dragleave',()=>wrap.classList.remove('drop-target'));
    wrap.addEventListener('drop',e=>{ e.preventDefault(); const targetIdx=parseInt(wrap.dataset.i); if(dragSrcIdx===null||dragSrcIdx===targetIdx) return; const [moved]=state.editPhotos.splice(dragSrcIdx,1); state.editPhotos.splice(targetIdx,0,moved); renderPhotos(); });
  });

  el.querySelectorAll('.photo-remove').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      state.editPhotos.splice(i,1);
      await api.del(`/api/uploads/${filename}`);
      renderPhotos();
    });
  });

  el.querySelectorAll('.photo-enhance').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const i = parseInt(btn.dataset.i);
      const filename = state.editPhotos[i];
      btn.textContent = '…';
      btn.disabled = true;
      try {
        const result = await api.post('/api/enhance-photo', { filename });
        if (result.error) { alert('Erreur : ' + result.error); btn.textContent='Améliorer'; btn.disabled=false; return; }
        state.editPhotos.splice(i, 1);
        state.editPhotos.unshift(result.enhancedFilename);
        renderPhotos();
      } catch(err) {
        alert('Erreur lors de la retouche.');
        btn.textContent='Améliorer'; btn.disabled=false;
      }
    });
  });
}

async function handlePhotoFiles(files) {
  if (!files.length) return;
  const {filenames} = await api.uploadPhotos([...files]);
  state.editPhotos.push(...filenames);
  renderPhotos();
}

// ── Private Photos ─────────────────────────────────────────────────────────────
function renderPrivatePhotos() {
  const el = document.getElementById('privatePhotosList'); if (!el) return;
  el.innerHTML = state.editPrivatePhotos.map((filename,i) => `
    <div class="photo-thumb-wrap photo-thumb-sm" data-i="${i}">
      <img src="/uploads/${filename}" alt="">
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
  const thumbs=cols.filter(c=>c.photos?.length).slice(0,5).map(c=>`<img src="/uploads/${c.photos[0]}" style="width:46px;height:46px;object-fit:cover;border-radius:3px;flex-shrink:0">`).join('');
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

function renderStats() {
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

  document.getElementById('kpiTotal').textContent=total||'—';
  document.getElementById('kpiDisponible').textContent=disponibleCount||'—';
  document.getElementById('kpiCat').textContent=topCatEntry?topCatEntry[0]:'—';
  document.getElementById('kpiValeur').textContent=valeurDispo?valeurDispo.toFixed(0)+' €':'—';

  if (!total) return;
  Chart.defaults.font.family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  Chart.defaults.font.size=12; Chart.defaults.color='#6b6760';
  const gridColor='#e5e3df';

  const cats=Object.entries(catFreq).sort((a,b)=>b[1]-a[1]);
  _charts.cat=new Chart(document.getElementById('chartCat'),{
    type:'doughnut',
    data:{
      labels:cats.map(([k])=>k),
      datasets:[{data:cats.map(([,v])=>v),backgroundColor:cats.map(([k])=>getCategoryColor(k)),borderWidth:2,borderColor:'#ffffff',hoverOffset:6}]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{boxWidth:10,padding:10,font:{size:11}}},tooltip:{callbacks:{label:ctx=>{const pct=total?Math.round(ctx.raw/total*100):0;return ` ${ctx.raw} (${pct}%)`;}}}}}
  });

  const statuses=['Disponible','Réservé','Vendu','Brouillon'];
  const statusBg=['#22c55e','#f59e0b','#9ca3af','#d1d5db'];
  _charts.status=new Chart(document.getElementById('chartStatus'),{
    type:'bar',
    data:{labels:statuses,datasets:[{data:statuses.map(s=>statusFreq[s]||0),backgroundColor:statusBg,borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} objet${ctx.raw>1?'s':''}`}}},scales:{x:{grid:{display:false},border:{color:gridColor}},y:{grid:{color:gridColor},border:{display:false},ticks:{stepSize:1,precision:0}}}}
  });

  if (!topKws.length) return;
  document.querySelector('.stats-chart-wrap-kw').style.height=Math.max(280,topKws.length*26+40)+'px';
  const kwCanvas=document.getElementById('chartKw');
  kwCanvas.onmouseleave=hideKwPreview;
  _charts.kw=new Chart(kwCanvas,{
    type:'bar',
    data:{labels:topKws.map(([k])=>k),datasets:[{data:topKws.map(([,v])=>v),backgroundColor:topKws.map((_,i)=>{const t=topKws.length>1?i/(topKws.length-1):0;return `hsl(215,48%,${Math.round(38+t*34)}%)` ;}),borderRadius:0,borderSkipped:false}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      onClick:(event,elements)=>{if(!elements.length)return;const kw=topKws[elements[0].index][0];hideKwPreview();state.activeKeywordFilters.add(kw);renderSearchActiveTags();setView('grid');},
      onHover:(event,elements)=>{const canvas=event.native?.target;if(!canvas)return;if(elements.length){canvas.style.cursor='pointer';showKwPreview(topKws[elements[0].index][0],event.native);}else{canvas.style.cursor='default';hideKwPreview();}},
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{grid:{color:gridColor},border:{display:false},ticks:{stepSize:1,precision:0}},y:{grid:{display:false},border:{color:gridColor}}}}
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
  etat_traces: 'États',
  usage:       'Fonctions & Usages',
  univers:     'Atmosphères',
  locations:   'Emplacements'
};

function smGetCurrentLabel(draft, smKey) {
  const labelKey = SM_LABEL_KEY[smKey] || smKey;
  return (draft.attributeLabels && draft.attributeLabels[labelKey]) || SM_SECTION_DEFAULTS[smKey] || smKey;
}

function openSettingsModal() {
  state.settingsDraft = JSON.parse(JSON.stringify(state.settings));
  if (!state.settingsDraft.attributeOptions) {
    state.settingsDraft.attributeOptions = {
      matieres:    [...ATTRIBUTES_DEF.matieres.options],
      etat_traces: [...ATTRIBUTES_DEF.etat_traces.options],
      usage:       [...ATTRIBUTES_DEF.usage.options],
      role:        [...ATTRIBUTES_DEF.role.options]
    };
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
    case 'motifs':    return draft.motifs    || (draft.motifs = []);
    case 'univers':   return draft.univers   || (draft.univers = []);
    case 'locations': return draft.locations || (draft.locations = []);
    default:
      if (['matieres','etat_traces','usage','role'].includes(key)) {
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

function smListHTML(arr, key) {
  const rows = arr.map((item, i) => `
    <div class="sm-row" data-key="${key}" data-i="${i}">
      <div class="sm-row-btns">
        <button class="sm-btn-order sm-up" data-key="${key}" data-i="${i}"${i === 0 ? ' disabled' : ''}>↑</button>
        <button class="sm-btn-order sm-down" data-key="${key}" data-i="${i}"${i === arr.length-1 ? ' disabled' : ''}>↓</button>
      </div>
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
    return `<div class="sm-row" data-key="colors" data-i="${i}">
      <div class="sm-row-btns">
        <button class="sm-btn-order sm-up" data-key="colors" data-i="${i}"${i === 0 ? ' disabled' : ''}>↑</button>
        <button class="sm-btn-order sm-down" data-key="colors" data-i="${i}"${i === arr.length-1 ? ' disabled' : ''}>↓</button>
      </div>
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
    const bg = v.bgColor || v.color || '#111111';
    const fg = v.textColor || '#ffffff';
    const typoPanel = expanded ? `
      <div class="sm-typos-panel">
        ${typos.map((t, si) => `
          <div class="sm-row sm-typo-row" data-ci="${i}" data-si="${si}">
            <div class="sm-row-btns">
              <button class="sm-btn-order sm-typo-up" data-ci="${i}" data-si="${si}"${si === 0 ? ' disabled' : ''}>↑</button>
              <button class="sm-btn-order sm-typo-down" data-ci="${i}" data-si="${si}"${si === typos.length-1 ? ' disabled' : ''}>↓</button>
            </div>
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
      <input type="color" id="sm-new-verbe-bg" value="#111111" class="sm-color-picker">
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
    ${smAccordion('matieres', smGetCurrentLabel(draft, 'matieres'), smListHTML(opts.matieres || [...ATTRIBUTES_DEF.matieres.options], 'matieres'), false, true)}
    ${smAccordion('colors', smGetCurrentLabel(draft, 'colors'), smColorListHTML(draft.colors || [], draft), false, true)}
    ${smAccordion('motifs', smGetCurrentLabel(draft, 'motifs'), smListHTML(draft.motifs || [], 'motifs'), false, true)}
    ${smAccordion('etat_traces', smGetCurrentLabel(draft, 'etat_traces'), smListHTML(opts.etat_traces || [...ATTRIBUTES_DEF.etat_traces.options], 'etat_traces'), false, true)}
    ${smAccordion('usage', smGetCurrentLabel(draft, 'usage'), smListHTML(opts.usage || [...ATTRIBUTES_DEF.usage.options], 'usage'), false, true)}
    ${smAccordion('univers', smGetCurrentLabel(draft, 'univers'), smListHTML(draft.univers || [], 'univers'), false, true)}
    ${smAccordion('locations', smGetCurrentLabel(draft, 'locations'), smListHTML(draft.locations || [], 'locations'), false, true)}
  </div>`;
  bindSmModal();
}

function bindSmModal() {
  const body = document.getElementById('settingsModalBody');
  if (!body) return;
  const draft = state.settingsDraft;

  // Site title
  body.querySelector('.sm-sitetitle-input')?.addEventListener('input', e => { draft.siteTitle = e.target.value; });

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

  // ── Generic simple list bindings (excludes verbes + typos which have their own) ──
  body.querySelectorAll('.sm-up:not(.sm-typo-up):not(.sm-verbe-up)').forEach(btn => {
    btn.addEventListener('click', () => {
      const arr = smGetArray(draft, btn.dataset.key), i = +btn.dataset.i;
      if (arr && i > 0) { [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; renderSettingsModal(); }
    });
  });
  body.querySelectorAll('.sm-down:not(.sm-typo-down):not(.sm-verbe-down)').forEach(btn => {
    btn.addEventListener('click', () => {
      const arr = smGetArray(draft, btn.dataset.key), i = +btn.dataset.i;
      if (arr && i < arr.length-1) { [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; renderSettingsModal(); }
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
      bgColor: body.querySelector('#sm-new-verbe-bg')?.value || '#111111',
      color:   body.querySelector('#sm-new-verbe-bg')?.value || '#111111',
      textColor: body.querySelector('#sm-new-verbe-fg')?.value || '#ffffff',
      typologies: []
    });
    renderSettingsModal();
  });

  // ── Typologies ──
  body.querySelectorAll('.sm-typo-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = +btn.dataset.ci, si = +btn.dataset.si; if (si === 0) return;
      const typos = draft.verbes[ci].typologies || draft.verbes[ci].subcategories;
      [typos[si-1], typos[si]] = [typos[si], typos[si-1]];
      renderSettingsModal();
    });
  });
  body.querySelectorAll('.sm-typo-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = +btn.dataset.ci, si = +btn.dataset.si;
      const typos = draft.verbes[ci].typologies || draft.verbes[ci].subcategories;
      if (si >= typos.length-1) return;
      [typos[si], typos[si+1]] = [typos[si+1], typos[si]];
      renderSettingsModal();
    });
  });
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
    draft.attributeSectionsOrder = ['origine', 'matieres', ['motifs','couleurs'], ['etat_traces','taille'], 'usage'];
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

  // Build suggestion groups
  const groups = [];

  // ── Catégories ──
  const cats = getCategories().map(c=>c.name).filter(n=>!q||n.toLowerCase().includes(q));
  if (cats.length) groups.push({
    label: 'Catégorie',
    items: cats.slice(0,5).map(n=>({
      text: n, badge: null, color: getCategoryColor(n),
      action: ()=>{ state.categoryFilter=n; state.attrFilters.subcat=[]; input.value=''; buildCategoryFilterBar(); buildSubcategoryBar(); buildAttrFilterBar(); render(); }
    }))
  });

  // ── Sous-catégories ──
  const subcatHits = [];
  getCategories().forEach(cat=>{
    (cat.subcategories||[]).forEach(sub=>{
      if (!q||sub.toLowerCase().includes(q)) subcatHits.push({sub,cat:cat.name,color:cat.color});
    });
  });
  if (subcatHits.length) groups.push({
    label: 'Sous-catégorie',
    items: subcatHits.slice(0,6).map(({sub,cat,color})=>({
      text: sub, badge: cat, color,
      action: ()=>{ state.categoryFilter=cat; state.attrFilters.subcat=[sub]; input.value=''; buildCategoryFilterBar(); buildSubcategoryBar(); buildAttrFilterBar(); render(); }
    }))
  });

  // ── Attributs (Matières, Styles, État…) ──
  const attrGroups = [
    { key:'matieres',   label:'Matière', options: ATTRIBUTES_DEF.matieres.options },
    { key:'origine',    label:'Origine', options: ATTRIBUTES_DEF.origine.options },
    { key:'etat_traces',label:'État',    options: ATTRIBUTES_DEF.etat_traces.options },
    { key:'couleurs',   label:'Couleur', options: state.settings.colors||[] },
  ];
  attrGroups.forEach(({key,label,options})=>{
    const hits = options.filter(o=>q&&o.toLowerCase().includes(q));
    if (!hits.length) return;
    groups.push({
      label,
      items: hits.slice(0,4).map(val=>({
        text: val, badge: null, color: null,
        action: ()=>{ if(!state.attrFilters[key].includes(val)) state.attrFilters[key].push(val); input.value=''; buildAttrFilterBar(); render(); }
      }))
    });
  });

  // ── Mots-clés ──
  const freq = kwFrequency();
  let keywords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
  if (q) keywords = keywords.filter(k=>k.toLowerCase().includes(q));
  if (keywords.length) groups.push({
    label: 'Mots-clés',
    items: keywords.slice(0,8).map(k=>({
      text: k, badge: String(freq[k]), color: null,
      action: ()=>{ if(state.activeKeywordFilters.has(k)) state.activeKeywordFilters.delete(k); else state.activeKeywordFilters.add(k); renderSearchActiveTags(); renderSearchDropdown(); render(); },
      isKw: true, active: state.activeKeywordFilters.has(k)
    }))
  });

  if (!groups.length) {
    list.innerHTML = q ? '<div class="search-kw-empty">Aucun résultat</div>' : '<div class="search-kw-empty">Tapez pour chercher…</div>';
    return;
  }

  list.innerHTML = groups.map(g=>`
    <div class="search-group">
      <div class="search-group-label">${esc(g.label)}</div>
      ${g.items.map((item,i)=>`
        <div class="search-kw-item${item.active?' active':''}" data-gi="${groups.indexOf(g)}" data-ii="${i}">
          ${item.color ? `<span class="search-sug-dot" style="background:${item.color}"></span>` : ''}
          <span class="search-sug-text">${esc(item.text)}</span>
          ${item.badge ? `<span class="search-kw-count">${esc(item.badge)}</span>` : ''}
        </div>`).join('')}
    </div>`).join('');

  list.querySelectorAll('.search-kw-item').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      const g = groups[+el.dataset.gi];
      g.items[+el.dataset.ii].action();
      document.getElementById('searchDropdown').classList.remove('open');
    });
  });
}
function renderSearchActiveTags() {
  const container=document.getElementById('searchActiveTags');
  container.innerHTML=[...state.activeKeywordFilters].map(kw=>`<span class="search-filter-tag">${esc(kw)}<button data-kw="${esc(kw)}">✕</button></span>`).join('');
  container.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); state.activeKeywordFilters.delete(btn.dataset.kw); renderSearchActiveTags(); renderSearchDropdown(); render(); }));
  document.getElementById('searchInput').placeholder=state.activeKeywordFilters.size?'':'Rechercher…';
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
}

// ── Events ─────────────────────────────────────────────────────────────────────
function bindEvents() {
  // Header
  document.getElementById('newBtn').addEventListener('click', openNew);
  document.getElementById('fabBtn').addEventListener('click', openNew);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
  document.getElementById('settingsModalClose').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsModalCancel').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsModalSave').addEventListener('click', saveSettingsModal);
  document.getElementById('settingsModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettingsModal(); });

  // Export buttons (footer)
  document.getElementById('exportJsonBtn').addEventListener('click', ()=>{ window.location.href='/api/export'; });
  document.getElementById('exportShopifyBtn').addEventListener('click', ()=>{ window.location.href='/api/export/shopify'; });

  // Sort & size
  document.getElementById('sortSelect').addEventListener('change',e=>{ state.sortBy=e.target.value; render(); });
  document.getElementById('cardSizeSlider').addEventListener('input',e=>{ document.documentElement.style.setProperty('--card-min',e.target.value+'px'); });

  // Status filter
  document.querySelectorAll('#statusFilterBar .sfb-pill').forEach(pill=>{
    pill.addEventListener('click',()=>{ state.statusFilter=pill.dataset.status; render(); });
  });

  // Attribute filters are now handled by buildMultiFilter() (multi-select dropdowns)
  const clearAttrBtn = document.getElementById('clearAttrFilters');
  if (clearAttrBtn) clearAttrBtn.addEventListener('click',()=>{
    state.attrFilters = {subcat:[],matieres:[],origine:[],etat_traces:[],couleurs:[]};
    buildAttrFilterBar(); render();
  });

  // View tabs
  document.getElementById('viewGrid').addEventListener('click',()=>setView('grid'));
  document.getElementById('viewTimeline').addEventListener('click',()=>setView('timeline'));
  document.getElementById('viewCalendar').addEventListener('click',()=>setView('calendar'));
  document.getElementById('viewCatalogue').addEventListener('click',()=>setView('catalogue'));
  document.getElementById('viewStats').addEventListener('click',()=>setView('stats'));

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

  // Category change → update subcategory dropdown
  document.getElementById('fCategory').addEventListener('change',e=>{
    populateSubcategoryDropdown(e.target.value);
    document.getElementById('fSubcategoryCustomField').style.display='none';
  });
  document.getElementById('fSubcategory').addEventListener('change',e=>{
    document.getElementById('fSubcategoryCustomField').style.display = e.target.value==='Autre' ? '' : 'none';
  });


  // Attribute accordion headers are dynamically rendered — bound in renderAllAttributes()
  // Univers & Atmosphère accordion header
  document.getElementById('universHeader').addEventListener('click', () => {
    const body = document.getElementById('universBody');
    const toggle = document.querySelector('#universHeader .attr-toggle');
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    toggle.textContent = open ? '›' : '▾';
  });

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
  document.getElementById('lightbox').addEventListener('click',e=>{ if(e.target===e.currentTarget||e.target.id==='lightboxImg') document.getElementById('lightbox').style.display='none'; });

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

init();
