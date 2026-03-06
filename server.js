'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { exec } = require('child_process');

const app  = express();
const PORT = 3003;
const ROOT = __dirname;

const DATA_FILE  = path.join(ROOT, 'data.json');
const CONFIG_JS  = path.join(ROOT, 'config.js');
const IMAGES_DIR = path.join(ROOT, 'images');

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use('/images',  express.static(IMAGES_DIR));
app.use('/admin',   express.static(path.join(ROOT, 'admin')));
app.use('/preview', express.static(ROOT));   // サイトプレビュー用

// ── Image upload ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `img_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('画像ファイル（JPG/PNG/GIF/WEBP）のみ対応しています'));
  },
});

// ── Default data ──────────────────────────────────────────────
const DEFAULT_DATA = {
  siteName:     'YOUR NAME',
  tagline:      'Art & Photography',
  storesUrl:    'https://yourname.stores.jp',
  instagramUrl: '',
  hero:   { backgroundImage: '' },
  about:  { photo: '', bio: '作家紹介文をここに書いてください。' },
  colors: { accent: '#cc0000' },
  works:  [],
};

// ── Data helpers ──────────────────────────────────────────────
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  regenerateConfigJs(data);
}

function regenerateConfigJs(data) {
  const worksStr = (data.works || []).map(w => `    {
      id: ${Number(w.id) || Date.now()},
      title: ${JSON.stringify(w.title || '')},
      category: ${JSON.stringify(w.category || '')},
      medium: ${JSON.stringify(w.medium || '')},
      size: ${JSON.stringify(w.size || '')},
      year: ${JSON.stringify(w.year || '')},
      price: ${JSON.stringify(w.price || '')},
      image: ${JSON.stringify(w.image || '')},
      storesUrl: ${JSON.stringify(w.storesUrl || '')},
      sold: ${!!w.sold},
    }`).join(',\n');

  const js = `// このファイルはadminサーバーが自動生成します。直接編集しないでください。
// 編集は管理パネルから: http://localhost:${PORT}/admin

const CONFIG = {
  siteName:     ${JSON.stringify(data.siteName || '')},
  tagline:      ${JSON.stringify(data.tagline || '')},
  storesUrl:    ${JSON.stringify(data.storesUrl || '')},
  instagramUrl: ${JSON.stringify(data.instagramUrl || '')},
  hero: {
    backgroundImage: ${JSON.stringify(data.hero?.backgroundImage || '')},
  },
  about: {
    photo: ${JSON.stringify(data.about?.photo || '')},
    bio:   ${JSON.stringify(data.about?.bio || '')},
  },
  colors: {
    accent: ${JSON.stringify(data.colors?.accent || '#cc0000')},
  },
  works: [
${worksStr}
  ],
};
`;
  fs.writeFileSync(CONFIG_JS, js);
}

// ── API routes ────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json(readData());
});

app.post('/api/config', (req, res) => {
  try {
    writeData(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ファイルが見つかりません' });
  res.json({ path: `images/${req.file.filename}` });
});

// ── GitHub publish ────────────────────────────────────────────
app.post('/api/publish', (req, res) => {
  const date = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const files = 'config.js index.html style.css main.js .nojekyll';
  const cmd = [
    `git -C "${ROOT}" add ${files} images/`,
    `git -C "${ROOT}" commit -m "update: ${date}" --allow-empty`,
    `git -C "${ROOT}" push`,
  ].join(' && ');

  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    const output = stdout + stderr;

    // 変更なし（正常系）
    if (!err || /nothing to commit|up-to-date|Everything up-to-date/.test(output)) {
      return res.json({ ok: true, message: 'GitHubに公開しました ✓' });
    }
    // 認証エラー
    if (/Authentication failed|could not read Username|terminal prompts disabled/.test(output)) {
      return res.status(401).json({
        ok: false,
        authError: true,
        error: 'GitHub認証エラー。Personal Access Token (PAT) の設定が必要です。',
      });
    }
    res.status(500).json({ ok: false, error: (stderr || err.message).slice(0, 300) });
  });
});

// エラーハンドラ（multerのエラーなど）
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────
fs.mkdirSync(IMAGES_DIR, { recursive: true });
readData(); // data.json を初回作成

app.get('/', (req, res) => res.redirect('/admin'));

app.listen(PORT, () => {
  console.log('\n  ┌─────────────────────────────────────────┐');
  console.log('  │  Art Portfolio Admin Server             │');
  console.log('  ├─────────────────────────────────────────┤');
  console.log(`  │  管理パネル  → http://localhost:${PORT}/admin   │`);
  console.log(`  │  プレビュー  → http://localhost:${PORT}/preview │`);
  console.log('  └─────────────────────────────────────────┘\n');
});
