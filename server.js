require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const path    = require('path');
const fs      = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app  = express();
const PORT = process.env.PORT || 3737;

const DATA_DIR        = path.join(__dirname, 'data');
const UPLOADS_DIR     = path.join(__dirname, 'uploads');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const KEYWORDS_FILE   = path.join(DATA_DIR, 'keywords.json');
const SETTINGS_FILE   = path.join(DATA_DIR, 'settings.json');

[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
if (!fs.existsSync(COLLECTIONS_FILE)) fs.writeFileSync(COLLECTIONS_FILE, '[]');
if (!fs.existsSync(KEYWORDS_FILE))    fs.writeFileSync(KEYWORDS_FILE, '[]');

// ── Helpers ──────────────────────────────────────────────────────────────────
const readCollections  = () => JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
const writeCollections = d  => fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(d, null, 2));
const readKeywords     = () => JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf8'));
const writeKeywords    = d  => fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(d, null, 2));
const readSettings     = () => JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
const writeSettings    = d  => fs.writeFileSync(SETTINGS_FILE, JSON.stringify(d, null, 2));

function mergeKeywords(newKws) {
  const existing = new Set(readKeywords());
  newKws.forEach(k => existing.add(k));
  writeKeywords([...existing].sort());
}

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Non-image'))
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Collections ───────────────────────────────────────────────────────────────
app.get('/api/collections', (_, res) => res.json(readCollections()));

app.post('/api/collections', (req, res) => {
  const collections = readCollections();
  const b = req.body;
  const obj = {
    id: uuidv4(),
    name: b.name || 'Sans titre',
    date: b.date || '',
    category: b.category || '',
    subcategory: b.subcategory || '',
    subcategoryCustom: b.subcategoryCustom || '',
    univers: b.univers || [],
    attributes: b.attributes || {},
    price: b.price ?? null,
    itemStatus: b.itemStatus || 'Disponible',
    keywords: b.keywords || [],
    description: b.description || '',
    photos: b.photos || [],
    photoEnhanced: b.photoEnhanced || null,
    private: b.private || {},
    createdAt: new Date().toISOString()
  };
  collections.unshift(obj);
  writeCollections(collections);
  if (obj.keywords.length) mergeKeywords(obj.keywords);
  res.json(obj);
});

app.put('/api/collections/:id', (req, res) => {
  const collections = readCollections();
  const idx = collections.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const updated = { ...collections[idx], ...req.body, id: req.params.id };
  collections[idx] = updated;
  writeCollections(collections);
  if (updated.keywords?.length) mergeKeywords(updated.keywords);
  res.json(updated);
});

app.delete('/api/collections/:id', (req, res) => {
  const collections = readCollections();
  const idx = collections.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = collections.splice(idx, 1);
  writeCollections(collections);
  const toDelete = [...(removed.photos || [])];
  if (removed.photoEnhanced) toDelete.push(removed.photoEnhanced);
  toDelete.forEach(f => { const p = path.join(UPLOADS_DIR, f); if (fs.existsSync(p)) fs.unlinkSync(p); });
  res.json({ ok: true });
});

// ── Photos ────────────────────────────────────────────────────────────────────
app.post('/api/upload', upload.array('photos', 20), (req, res) => {
  res.json({ filenames: req.files.map(f => f.filename) });
});

app.delete('/api/uploads/:filename', (req, res) => {
  const p = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok: true });
});

// ── Photo enhancement (Gemini) ────────────────────────────────────────────────
app.post('/api/enhance-photo', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename requis' });
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });

    const imageData = fs.readFileSync(filePath);
    const base64    = imageData.toString('base64');
    const mimeType  = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Retouche cette photo de produit brocante/antiquité : supprime le fond et remplace-le par un fond blanc pur de studio, améliore la luminosité et la netteté pour un rendu professionnel de fiche produit e-commerce. Conserve fidèlement le produit. Retourne uniquement l\'image retouchée.' },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      generationConfig: { responseModalities: ['image'] }
    });

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (!imgPart) return res.status(500).json({ error: 'Gemini n\'a pas retourné d\'image. Essayez avec une autre photo.' });

    const ext             = path.extname(filename);
    const base64Name      = path.basename(filename, ext);
    const enhancedFilename = `${base64Name}-enhanced${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, enhancedFilename), Buffer.from(imgPart.inlineData.data, 'base64'));

    res.json({ enhancedFilename });
  } catch (err) {
    console.error('Enhance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Keywords ──────────────────────────────────────────────────────────────────
app.get('/api/keywords', (_, res) => res.json(readKeywords()));

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (_, res) => res.json(readSettings()));
app.put('/api/settings', (req, res) => { writeSettings(req.body); res.json(req.body); });

// ── Export JSON ───────────────────────────────────────────────────────────────
app.get('/api/export', (_, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="brocante-archive-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({ exportedAt: new Date().toISOString(), collections: readCollections(), keywords: readKeywords() });
});

// ── Export CSV Shopify ────────────────────────────────────────────────────────
app.get('/api/export/shopify', (req, res) => {
  const collections = readCollections();
  const host = req.headers.host || `localhost:${PORT}`;
  const baseUrl = `http://${host}`;

  const HEADERS = [
    'Title','URL handle','Description','Vendor','Product category','Type',
    'Tags','Published on online store','Status','SKU','Barcode',
    'Option1 name','Option1 value','Option1 Linked To',
    'Option2 name','Option2 value','Option2 Linked To',
    'Option3 name','Option3 value','Option3 Linked To',
    'Price','Compare-at price','Cost per item','Charge tax','Tax code',
    'Unit price total measure','Unit price total measure unit',
    'Unit price base measure','Unit price base measure unit',
    'Inventory tracker','Inventory quantity','Continue selling when out of stock',
    'Weight value (grams)','Weight unit for display','Requires shipping',
    'Fulfillment service','Product image URL','Image position','Image alt text',
    'Variant image URL','Gift card','SEO title','SEO description',
    'Color (product.metafields.shopify.color-pattern)',
    'Google Shopping / Google product category','Google Shopping / Gender',
    'Google Shopping / Age group','Google Shopping / Manufacturer part number (MPN)',
    'Google Shopping / Ad group name','Google Shopping / Ads labels',
    'Google Shopping / Condition','Google Shopping / Custom product',
    'Google Shopping / Custom label 0','Google Shopping / Custom label 1',
    'Google Shopping / Custom label 2','Google Shopping / Custom label 3',
    'Google Shopping / Custom label 4'
  ];

  const csvCell = v => {
    const s = String(v ?? '');
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const csvRow = fields => fields.map(csvCell).join(',');

  const emptyBase = new Array(HEADERS.length).fill('');

  const rows = [csvRow(HEADERS)];

  collections.filter(c => c.itemStatus !== 'Vendu' && c.itemStatus !== 'Brouillon').forEach(c => {
    const handle = (c.name || 'objet')
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

    const attrs = c.attributes || {};
    const attrTags = Object.values(attrs).flat().filter(Boolean);
    const tags = [
      c.category, c.subcategory !== 'Autre' ? c.subcategory : c.subcategoryCustom,
      ...(c.univers || []), ...(c.keywords || []), ...attrTags
    ].filter(Boolean).join(', ');

    const status = c.itemStatus === 'Réservé' ? 'draft' : 'active';
    const photos = c.photos || [];

    const base = [...emptyBase];
    base[HEADERS.indexOf('Title')]                    = c.name || '';
    base[HEADERS.indexOf('URL handle')]               = handle;
    base[HEADERS.indexOf('Description')]              = c.description || '';
    base[HEADERS.indexOf('Vendor')]                   = 'Charlotte Archive';
    base[HEADERS.indexOf('Product category')]         = c.category || '';
    base[HEADERS.indexOf('Type')]                     = c.subcategory || '';
    base[HEADERS.indexOf('Tags')]                     = tags;
    base[HEADERS.indexOf('Published on online store')] = 'TRUE';
    base[HEADERS.indexOf('Status')]                   = status;
    base[HEADERS.indexOf('Price')]                    = c.price ?? '';
    base[HEADERS.indexOf('Charge tax')]               = 'FALSE';
    base[HEADERS.indexOf('Inventory tracker')]        = 'shopify';
    base[HEADERS.indexOf('Inventory quantity')]       = '1';
    base[HEADERS.indexOf('Continue selling when out of stock')] = 'FALSE';
    base[HEADERS.indexOf('Weight unit for display')]  = 'kg';
    base[HEADERS.indexOf('Requires shipping')]        = 'TRUE';
    base[HEADERS.indexOf('Fulfillment service')]      = 'manual';
    base[HEADERS.indexOf('Gift card')]                = 'FALSE';
    base[HEADERS.indexOf('SEO title')]                = c.name || '';
    base[HEADERS.indexOf('SEO description')]          = c.description || '';
    base[HEADERS.indexOf('Google Shopping / Condition')] = 'used';

    if (!photos.length) {
      rows.push(csvRow(base));
    } else {
      photos.forEach((photo, idx) => {
        const row = idx === 0 ? [...base] : [...emptyBase];
        row[HEADERS.indexOf('URL handle')]     = handle;
        row[HEADERS.indexOf('Product image URL')] = `${baseUrl}/uploads/${photo}`;
        row[HEADERS.indexOf('Image position')] = idx + 1;
        row[HEADERS.indexOf('Image alt text')] = idx === 0 ? (c.name || '') : '';
        rows.push(csvRow(row));
      });
    }
  });

  res.setHeader('Content-Disposition', `attachment; filename="shopify-export-${Date.now()}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send('\uFEFF' + rows.join('\n'));
});

app.listen(PORT, () => console.log(`Brocante Archive → http://localhost:${PORT}`));
