require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const path    = require('path');
const fs      = require('fs');
const archiver = require('archiver');
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
  console.log('✓ Cloudinary configured — photos will be stored in the cloud');
}

// Extract Cloudinary public_id from secure_url
function cldPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return m ? m[1] : null;
}

// Upload a buffer to Cloudinary, returns secure_url
function cldUploadBuffer(buffer, filename) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filename).toLowerCase();
    const publicId = `brocante-archive/${path.basename(filename, ext)}`;
    cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'image', overwrite: true },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    ).end(buffer);
  });
}

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
  toDelete.forEach(ref => _deletePhotoRef(ref));
  res.json({ ok: true });
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
      const urls = await Promise.all(req.files.map(f =>
        cldUploadBuffer(f.buffer, f.originalname)
      ));
      res.json({ filenames: urls });
    } else {
      res.json({ filenames: req.files.map(f => f.filename) });
    }
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Legacy DELETE endpoint (backward compat, local files only)
app.delete('/api/uploads/:filename', (req, res) => {
  const p = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok: true });
});

// New POST remove-photo — handles both local refs and Cloudinary URLs
app.post('/api/remove-photo', async (req, res) => {
  const { ref } = req.body;
  if (!ref) return res.json({ ok: true });
  await _deletePhotoRef(ref);
  res.json({ ok: true });
});

// ── Photo enhancement (Gemini) ────────────────────────────────────────────────
app.post('/api/enhance-photo', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename requis' });

    let imageData, mimeType;

    if (filename.startsWith('http')) {
      // Cloudinary URL — download it first
      const response = await fetch(filename);
      const arrayBuffer = await response.arrayBuffer();
      imageData = Buffer.from(arrayBuffer);
      mimeType = 'image/jpeg';
    } else {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });
      imageData = fs.readFileSync(filePath);
      mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }

    const base64 = imageData.toString('base64');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Retouch the image to look like a professional studio packshot. Pure white background, pure white even lighting, including the object\'s realistic cast shadows. Strictly respect the object\'s properties (exact colors, textures, materials) and its shape. Do not generate a pedestal, stand, or horizon line. The object should appear to float in the center.' },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      generationConfig: { responseModalities: ['image'] }
    });

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (!imgPart) return res.status(500).json({ error: 'Gemini n\'a pas retourné d\'image. Essayez avec une autre photo.' });

    const imgBuffer = Buffer.from(imgPart.inlineData.data, 'base64');

    if (cloudinary) {
      const ext = filename.startsWith('http') ? '.jpg' : path.extname(filename);
      const base = filename.startsWith('http')
        ? `enhanced-${uuidv4()}`
        : path.basename(filename, ext) + '-enhanced';
      const enhancedUrl = await cldUploadBuffer(imgBuffer, `${base}${ext}`);
      res.json({ enhancedFilename: enhancedUrl });
    } else {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      const enhancedFilename = `${base}-enhanced${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, enhancedFilename), imgBuffer);
      res.json({ enhancedFilename });
    }
  } catch (err) {
    console.error('Enhance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Photo stylization (Gemini) ────────────────────────────────────────────────
app.post('/api/stylize-photo', async (req, res) => {
  try {
    const { filename, hexColor } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename requis' });
    if (!hexColor) return res.status(400).json({ error: 'hexColor requis' });

    let imageData, mimeType;

    if (filename.startsWith('http')) {
      const response = await fetch(filename);
      const arrayBuffer = await response.arrayBuffer();
      imageData = Buffer.from(arrayBuffer);
      mimeType = 'image/jpeg';
    } else {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });
      imageData = fs.readFileSync(filePath);
      mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }

    const base64 = imageData.toString('base64');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Perform an image-to-image transformation based on the provided staged photo. Retain the exact composition, objects, and layout. Apply a fine, realistic film grain texture across the entire image for a nostalgic, analog feel. Apply a light, soft vignette around the edges. Crucially, this vignette must not be black, but must utilize a subtle tint of ${hexColor}, blending smoothly with the warm lighting of the scene. The overall aesthetic should be soft, matte, warm, and resemble a high-quality analog photo. Do not generate new objects; do not alter the shape of existing objects.`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      generationConfig: { responseModalities: ['image'] }
    });

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (!imgPart) return res.status(500).json({ error: 'Gemini n\'a pas retourné d\'image. Essayez avec une autre photo.' });

    const imgBuffer = Buffer.from(imgPart.inlineData.data, 'base64');

    if (cloudinary) {
      const ext = filename.startsWith('http') ? '.jpg' : path.extname(filename);
      const base = filename.startsWith('http')
        ? `stylized-${uuidv4()}`
        : path.basename(filename, ext) + '-stylized';
      const stylizedUrl = await cldUploadBuffer(imgBuffer, `${base}${ext}`);
      res.json({ stylizedFilename: stylizedUrl });
    } else {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      const stylizedFilename = `${base}-stylized${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, stylizedFilename), imgBuffer);
      res.json({ stylizedFilename });
    }
  } catch (err) {
    console.error('Stylize error:', err.message);
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

    // Resolve photo URL for Shopify (Cloudinary = already full URL; local = build full URL)
    const resolvePhotoUrl = (ref) => {
      if (ref && ref.startsWith('http')) return ref;
      return `${baseUrl}/uploads/${ref}`;
    };

    if (!photos.length) {
      rows.push(csvRow(base));
    } else {
      photos.forEach((photo, idx) => {
        const row = idx === 0 ? [...base] : [...emptyBase];
        row[HEADERS.indexOf('URL handle')]       = handle;
        row[HEADERS.indexOf('Product image URL')] = resolvePhotoUrl(photo);
        row[HEADERS.indexOf('Image position')]   = idx + 1;
        row[HEADERS.indexOf('Image alt text')]   = idx === 0 ? (c.name || '') : '';
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
  const collections = readCollections();
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
        if (fs.existsSync(p)) {
          archive.file(p, { name: `${safeName}_${path.basename(ref)}` });
        }
      }
    }
  }

  archive.finalize();
});

app.listen(PORT, () => console.log(`Brocante Archive → http://localhost:${PORT}`));
