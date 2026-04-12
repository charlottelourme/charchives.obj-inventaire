require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const path     = require('path');
const fs       = require('fs');
const archiver = require('archiver');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app  = express();
const PORT = process.env.PORT || 3737;

const DATA_DIR         = path.join(__dirname, 'data');
const UPLOADS_DIR      = path.join(__dirname, 'uploads');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const KEYWORDS_FILE    = path.join(DATA_DIR, 'keywords.json');
const SETTINGS_FILE    = path.join(DATA_DIR, 'settings.json');

[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
if (!fs.existsSync(COLLECTIONS_FILE)) fs.writeFileSync(COLLECTIONS_FILE, '[]');
if (!fs.existsSync(KEYWORDS_FILE))    fs.writeFileSync(KEYWORDS_FILE, '[]');

// ── MongoDB (optional — activé si MONGODB_URI est défini) ─────────────────────
let db = null;

async function connectMongo() {
  if (!process.env.MONGODB_URI) return;
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('charchives');
  console.log('✓ MongoDB connecté');
  await migrateFromJson();
}

// Migration one-shot : si la collection MongoDB est vide, on importe les JSON locaux
async function migrateFromJson() {
  const col = db.collection('collections');
  const count = await col.countDocuments();
  if (count === 0 && fs.existsSync(COLLECTIONS_FILE)) {
    const data = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
    if (data.length) {
      await col.insertMany(data.map(c => ({ ...c, _id: c.id })));
      console.log(`✓ Migration : ${data.length} objets importés dans MongoDB`);
    }
  }
  const store = db.collection('store');
  const kwDoc = await store.findOne({ _id: 'keywords' });
  if (!kwDoc && fs.existsSync(KEYWORDS_FILE)) {
    const kws = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf8'));
    await store.replaceOne({ _id: 'keywords' }, { _id: 'keywords', data: kws }, { upsert: true });
  }
  const sDoc = await store.findOne({ _id: 'settings' });
  if (!sDoc && fs.existsSync(SETTINGS_FILE)) {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    await store.replaceOne({ _id: 'settings' }, { _id: 'settings', ...s }, { upsert: true });
  }
}

// ── Helpers data (MongoDB ou fichiers JSON) ───────────────────────────────────
async function readCollections() {
  if (db) {
    const docs = await db.collection('collections').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(({ _id, ...rest }) => rest);
  }
  return JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
}

async function readKeywords() {
  if (db) {
    const doc = await db.collection('store').findOne({ _id: 'keywords' });
    return doc?.data || [];
  }
  return JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf8'));
}

async function writeKeywords(data) {
  if (db) {
    await db.collection('store').replaceOne({ _id: 'keywords' }, { _id: 'keywords', data }, { upsert: true });
    return;
  }
  fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(data, null, 2));
}

async function readSettings() {
  if (db) {
    const doc = await db.collection('store').findOne({ _id: 'settings' });
    if (!doc) return {};
    const { _id, ...rest } = doc;
    return rest;
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

async function writeSettings(data) {
  if (db) {
    await db.collection('store').replaceOne({ _id: 'settings' }, { _id: 'settings', ...data }, { upsert: true });
    return;
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

async function mergeKeywords(newKws) {
  const existing = new Set(await readKeywords());
  newKws.forEach(k => existing.add(k));
  await writeKeywords([...existing].sort());
}

// ── Cloudinary (optional) ─────────────────────────────────────────────────────
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  const { v2: cld } = require('cloudinary');
  cld.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  cloudinary = cld;
  console.log('✓ Cloudinary configuré');
}

function cldPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return m ? m[1] : null;
}

function cldUploadBuffer(buffer, filename) {
  return new Promise((resolve, reject) => {
    const ext      = path.extname(filename).toLowerCase();
    const publicId = `brocante-archive/${path.basename(filename, ext)}`;
    cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'image', overwrite: true },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    ).end(buffer);
  });
}

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = cloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
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
app.get('/api/collections', async (_, res) => {
  try { res.json(await readCollections()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/collections', async (req, res) => {
  try {
    const b   = req.body;
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
    if (db) {
      await db.collection('collections').insertOne({ ...obj, _id: obj.id });
    } else {
      const all = await readCollections();
      all.unshift(obj);
      fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(all, null, 2));
    }
    if (obj.keywords.length) await mergeKeywords(obj.keywords);
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/collections/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (db) {
      const existing = await db.collection('collections').findOne({ _id: id });
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const updated = { ...existing, ...req.body, id, _id: id };
      await db.collection('collections').replaceOne({ _id: id }, updated);
      const { _id, ...result } = updated;
      if (result.keywords?.length) await mergeKeywords(result.keywords);
      res.json(result);
    } else {
      const all = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const updated = { ...all[idx], ...req.body, id };
      all[idx] = updated;
      fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(all, null, 2));
      if (updated.keywords?.length) await mergeKeywords(updated.keywords);
      res.json(updated);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/collections/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let removed;
    if (db) {
      const doc = await db.collection('collections').findOne({ _id: id });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      await db.collection('collections').deleteOne({ _id: id });
      removed = doc;
    } else {
      const all = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      [removed] = all.splice(idx, 1);
      fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(all, null, 2));
    }
    const toDelete = [...(removed.photos || [])];
    if (removed.photoEnhanced) toDelete.push(removed.photoEnhanced);
    toDelete.forEach(ref => _deletePhotoRef(ref));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Photo ref deletion helper ─────────────────────────────────────────────────
async function _deletePhotoRef(ref) {
  if (!ref) return;
  if (ref.startsWith('http')) {
    if (cloudinary) {
      const pid = cldPublicId(ref);
      if (pid) cloudinary.uploader.destroy(pid).catch(() => {});
    }
  } else {
    const p = path.join(UPLOADS_DIR, ref);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

// ── Photos ────────────────────────────────────────────────────────────────────
app.post('/api/upload', upload.array('photos', 20), async (req, res) => {
  try {
    if (cloudinary) {
      const urls = await Promise.all(req.files.map(f => cldUploadBuffer(f.buffer, f.originalname)));
      res.json({ filenames: urls });
    } else {
      res.json({ filenames: req.files.map(f => f.filename) });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/uploads/:filename', (req, res) => {
  const p = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok: true });
});

app.post('/api/remove-photo', async (req, res) => {
  const { ref } = req.body;
  if (!ref) return res.json({ ok: true });
  await _deletePhotoRef(ref);
  res.json({ ok: true });
});

// ── Gemini helper ─────────────────────────────────────────────────────────────
async function loadImageData(filename) {
  if (filename.startsWith('http')) {
    const response = await fetch(filename);
    if (!response.ok) throw new Error('Impossible de télécharger l\'image');
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: 'image/jpeg' };
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) throw new Error('Fichier introuvable');
  return {
    buffer: fs.readFileSync(filePath),
    mimeType: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  };
}

async function saveGeneratedImage(buffer, baseName, suffix, origFilename) {
  if (cloudinary) {
    const ext = origFilename.startsWith('http') ? '.jpg' : path.extname(origFilename);
    const name = origFilename.startsWith('http') ? `${suffix}-${uuidv4()}` : `${baseName}-${suffix}`;
    return await cldUploadBuffer(buffer, `${name}${ext}`);
  }
  const ext      = path.extname(origFilename);
  const outName  = `${baseName}-${suffix}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);
  return outName;
}

// ── Photo enhancement ─────────────────────────────────────────────────────────
app.post('/api/enhance-photo', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename requis' });
    const { buffer, mimeType } = await loadImageData(filename);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Retouch the image to look like a professional studio packshot. Pure white background, pure white even lighting, including the object\'s realistic cast shadows. Strictly respect the object\'s properties (exact colors, textures, materials) and its shape. Do not generate a pedestal, stand, or horizon line. The object should appear to float in the center.' },
          { inlineData: { mimeType, data: buffer.toString('base64') } }
        ]
      }],
      generationConfig: { responseModalities: ['image'] }
    });
    const imgPart = (result.response.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
    if (!imgPart) return res.status(500).json({ error: 'Gemini n\'a pas retourné d\'image.' });
    const imgBuffer    = Buffer.from(imgPart.inlineData.data, 'base64');
    const baseName     = filename.startsWith('http') ? `img-${uuidv4().slice(0,8)}` : path.basename(filename, path.extname(filename));
    const enhancedFilename = await saveGeneratedImage(imgBuffer, baseName, 'enhanced', filename);
    res.json({ enhancedFilename });
  } catch (err) { console.error('Enhance error:', err.message); res.status(500).json({ error: err.message }); }
});

// ── Photo stylization ─────────────────────────────────────────────────────────
app.post('/api/stylize-photo', async (req, res) => {
  try {
    const { filename, hexColor } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename requis' });
    if (!hexColor) return res.status(400).json({ error: 'hexColor requis' });
    const { buffer, mimeType } = await loadImageData(filename);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
    const prompt = `Perform an image-to-image transformation based on the provided staged photo. Retain the exact composition, objects, and layout. Apply a fine, realistic film grain texture across the entire image for a nostalgic, analog feel. Apply a light, soft vignette around the edges. Crucially, this vignette must not be black, but must utilize a subtle tint of ${hexColor}, blending smoothly with the warm lighting of the scene. The overall aesthetic should be soft, matte, warm, and resemble a high-quality analog photo. Do not generate new objects; do not alter the shape of existing objects.`;
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: buffer.toString('base64') } }
        ]
      }],
      generationConfig: { responseModalities: ['image'] }
    });
    const imgPart = (result.response.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
    if (!imgPart) return res.status(500).json({ error: 'Gemini n\'a pas retourné d\'image.' });
    const imgBuffer     = Buffer.from(imgPart.inlineData.data, 'base64');
    const baseName      = filename.startsWith('http') ? `img-${uuidv4().slice(0,8)}` : path.basename(filename, path.extname(filename));
    const stylizedFilename = await saveGeneratedImage(imgBuffer, baseName, 'stylized', filename);
    res.json({ stylizedFilename });
  } catch (err) { console.error('Stylize error:', err.message); res.status(500).json({ error: err.message }); }
});

// ── Keywords ──────────────────────────────────────────────────────────────────
app.get('/api/keywords', async (_, res) => {
  try { res.json(await readKeywords()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', async (_, res) => {
  try { res.json(await readSettings()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/settings', async (req, res) => {
  try { await writeSettings(req.body); res.json(req.body); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Export JSON ───────────────────────────────────────────────────────────────
app.get('/api/export', async (_, res) => {
  const collections = await readCollections();
  const keywords    = await readKeywords();
  res.setHeader('Content-Disposition', `attachment; filename="brocante-archive-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({ exportedAt: new Date().toISOString(), collections, keywords });
});

// ── Export CSV Shopify ────────────────────────────────────────────────────────
app.get('/api/export/shopify', async (req, res) => {
  const collections = await readCollections();
  const host        = req.headers.host || `localhost:${PORT}`;
  const baseUrl     = `https://${host}`;

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

  const csvCell  = v => { const s = String(v ?? ''); return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csvRow   = fields => fields.map(csvCell).join(',');
  const emptyBase = new Array(HEADERS.length).fill('');
  const rows = [csvRow(HEADERS)];
  const resolvePhotoUrl = ref => (ref?.startsWith('http') ? ref : `${baseUrl}/uploads/${ref}`);

  collections.filter(c => c.itemStatus !== 'Vendu' && c.itemStatus !== 'Brouillon').forEach(c => {
    const handle = (c.name || 'objet').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    const attrs    = c.attributes || {};
    const attrTags = Object.values(attrs).flat().filter(Boolean);
    const tags     = [c.category, c.subcategory !== 'Autre' ? c.subcategory : c.subcategoryCustom,
      ...(c.univers || []), ...(c.keywords || []), ...attrTags].filter(Boolean).join(', ');
    const status   = c.itemStatus === 'Réservé' ? 'draft' : 'active';
    const photos   = c.photos || [];
    const base     = [...emptyBase];
    base[HEADERS.indexOf('Title')]                     = c.name || '';
    base[HEADERS.indexOf('URL handle')]                = handle;
    base[HEADERS.indexOf('Description')]               = c.description || '';
    base[HEADERS.indexOf('Vendor')]                    = 'Charlotte Archive';
    base[HEADERS.indexOf('Product category')]          = c.category || '';
    base[HEADERS.indexOf('Type')]                      = c.subcategory || '';
    base[HEADERS.indexOf('Tags')]                      = tags;
    base[HEADERS.indexOf('Published on online store')] = 'TRUE';
    base[HEADERS.indexOf('Status')]                    = status;
    base[HEADERS.indexOf('Price')]                     = c.price ?? '';
    base[HEADERS.indexOf('Charge tax')]                = 'FALSE';
    base[HEADERS.indexOf('Inventory tracker')]         = 'shopify';
    base[HEADERS.indexOf('Inventory quantity')]        = '1';
    base[HEADERS.indexOf('Continue selling when out of stock')] = 'FALSE';
    base[HEADERS.indexOf('Weight unit for display')]   = 'kg';
    base[HEADERS.indexOf('Requires shipping')]         = 'TRUE';
    base[HEADERS.indexOf('Fulfillment service')]       = 'manual';
    base[HEADERS.indexOf('Gift card')]                 = 'FALSE';
    base[HEADERS.indexOf('SEO title')]                 = c.name || '';
    base[HEADERS.indexOf('SEO description')]           = c.description || '';
    base[HEADERS.indexOf('Google Shopping / Condition')] = 'used';
    if (!photos.length) { rows.push(csvRow(base)); }
    else {
      photos.forEach((photo, idx) => {
        const row = idx === 0 ? [...base] : [...emptyBase];
        row[HEADERS.indexOf('URL handle')]        = handle;
        row[HEADERS.indexOf('Product image URL')] = resolvePhotoUrl(photo);
        row[HEADERS.indexOf('Image position')]    = idx + 1;
        row[HEADERS.indexOf('Image alt text')]    = idx === 0 ? (c.name || '') : '';
        rows.push(csvRow(row));
      });
    }
  });

  res.setHeader('Content-Disposition', `attachment; filename="shopify-export-${Date.now()}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send('\uFEFF' + rows.join('\n'));
});

// ── Export photos ZIP ─────────────────────────────────────────────────────────
app.get('/api/export/photos-zip', async (req, res) => {
  const collections = await readCollections();
  const archive = archiver('zip', { zlib: { level: 6 } });
  res.setHeader('Content-Disposition', `attachment; filename="photos-archive-${Date.now()}.zip"`);
  res.setHeader('Content-Type', 'application/zip');
  archive.pipe(res);
  for (const c of collections) {
    const allPhotos = [...(c.photos || [])];
    if (c.photoEnhanced) allPhotos.push(c.photoEnhanced);
    for (const ref of allPhotos) {
      if (!ref) continue;
      const safeName = (c.name || 'objet').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
      if (ref.startsWith('http')) {
        try {
          const response = await fetch(ref);
          if (response.ok) {
            const buf = Buffer.from(await response.arrayBuffer());
            const ext = ref.split('?')[0].split('.').pop() || 'jpg';
            archive.append(buf, { name: `${safeName}_${uuidv4().slice(0,8)}.${ext}` });
          }
        } catch (e) { /* skip */ }
      } else {
        const p = path.join(UPLOADS_DIR, ref);
        if (fs.existsSync(p)) archive.file(p, { name: `${safeName}_${path.basename(ref)}` });
      }
    }
  }
  archive.finalize();
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
connectMongo()
  .catch(err => console.error('MongoDB non connecté, fallback fichiers JSON :', err.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`Brocante Archive → http://localhost:${PORT}`));
  });
