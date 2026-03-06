'use strict';
// ============================================================
//  Admin Panel — JavaScript
// ============================================================

let DATA         = {};    // サーバーから取得したデータ
let editingIndex = null;  // null = 新規, number = 編集中インデックス
let tempImagePath = '';   // 作品フォームの一時画像パス

// ── 初期化 ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupTabs();
  setupSaveBtn();
  setupColorSync();
  setupUploadZone('hero-upload-zone',  'hero-file-input',  'hero-preview',  'hero-upload-hint',  'heroBackgroundImage', 'hero-clear-btn');
  setupUploadZone('about-upload-zone', 'about-file-input', 'about-preview', 'about-upload-hint', 'aboutPhoto',          'about-clear-btn');
  setupWorkForm();
  populateForm();
  renderWorksList();
});

// ── データ読み込み / 保存 ─────────────────────────────────
async function loadData() {
  const res = await fetch('/api/config');
  DATA = await res.json();
}

async function saveAll() {
  collectFormValues();
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('publish-status');

  btn.textContent = '保存中…';
  btn.disabled = true;
  setStatus('', '');

  try {
    // 1) ローカル保存
    const saveRes = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DATA),
    });
    if (!saveRes.ok) {
      showToast('保存に失敗しました。もう一度お試しください。');
      return;
    }

    // 2) GitHub に push
    setStatus('loading', '🔄 GitHubに公開中…');
    const pubRes  = await fetch('/api/publish', { method: 'POST' });
    const pubData = await pubRes.json();

    if (pubData.ok) {
      setStatus('ok', '✓ 公開完了 — wasabi-nasubi.github.io');
      showToast('GitHubに公開しました ✓');
    } else if (pubData.authError) {
      setStatus('error', '⚠ GitHub認証エラー — PAT設定が必要です');
      showToast('認証エラー: ターミナルで git push を手動で実行してください');
    } else {
      setStatus('error', '⚠ 公開に失敗しました');
      showToast('push失敗: ' + (pubData.error || '不明なエラー'));
    }
  } finally {
    btn.textContent = '保存 & 公開';
    btn.disabled = false;
  }
}

function setStatus(type, msg) {
  const el = document.getElementById('publish-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'publish-status' + (type ? ' ps-' + type : '');
}

// ── フォームに値を流し込む ────────────────────────────────
function populateForm() {
  setVal('siteName',            DATA.siteName     || '');
  setVal('tagline',             DATA.tagline      || '');
  setVal('storesUrl',           DATA.storesUrl    || '');
  setVal('instagramUrl',        DATA.instagramUrl || '');
  setVal('accentColor',         DATA.colors?.accent || '#cc0000');
  setVal('accentColorText',     DATA.colors?.accent || '#cc0000');
  setVal('heroBackgroundImage', DATA.hero?.backgroundImage || '');
  setVal('aboutPhoto',          DATA.about?.photo || '');
  setVal('aboutBio',            DATA.about?.bio   || '');

  const heroBg    = DATA.hero?.backgroundImage;
  const aboutPhoto = DATA.about?.photo;
  if (heroBg)    showUploadPreview('hero-preview',  'hero-upload-hint',  heroBg,    'hero-clear-btn');
  if (aboutPhoto) showUploadPreview('about-preview', 'about-upload-hint', aboutPhoto, 'about-clear-btn');
}

// ── フォームから値を収集 ──────────────────────────────────
function collectFormValues() {
  DATA.siteName     = getVal('siteName');
  DATA.tagline      = getVal('tagline');
  DATA.storesUrl    = getVal('storesUrl');
  DATA.instagramUrl = getVal('instagramUrl');
  DATA.colors       = { accent: getVal('accentColorText') || getVal('accentColor') };
  DATA.hero         = { backgroundImage: getVal('heroBackgroundImage') };
  DATA.about        = { photo: getVal('aboutPhoto'), bio: getVal('aboutBio') };
}

// ── タブ切り替え ──────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.a-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.a-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ── 保存ボタン ────────────────────────────────────────────
function setupSaveBtn() {
  document.getElementById('save-btn').addEventListener('click', saveAll);
}

// ── カラー同期 ────────────────────────────────────────────
function setupColorSync() {
  document.getElementById('accentColor').addEventListener('input', function () {
    setVal('accentColorText', this.value);
  });
  document.getElementById('accentColorText').addEventListener('input', function () {
    if (/^#[0-9a-fA-F]{6}$/.test(this.value)) setVal('accentColor', this.value);
  });
}

// ── 画像アップロードゾーン ───────────────────────────────
function setupUploadZone(zoneId, inputId, previewId, hintId, hiddenId, clearBtnId) {
  const zone     = document.getElementById(zoneId);
  const input    = document.getElementById(inputId);
  const clearBtn = document.getElementById(clearBtnId);

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file, previewId, hintId, hiddenId, clearBtnId);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) doUpload(input.files[0], previewId, hintId, hiddenId, clearBtnId);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      setVal(hiddenId, '');
      document.getElementById(previewId).style.display = 'none';
      document.getElementById(hintId).style.display    = 'flex';
      clearBtn.style.display = 'none';
    });
  }
}

async function doUpload(file, previewId, hintId, hiddenId, clearBtnId) {
  const fd = new FormData();
  fd.append('image', file);
  try {
    const res  = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) { showToast('アップロード失敗: ' + data.error); return; }
    setVal(hiddenId, data.path);
    showUploadPreview(previewId, hintId, data.path, clearBtnId);
    return data.path;
  } catch (e) {
    showToast('アップロードに失敗しました');
  }
}

function showUploadPreview(previewId, hintId, src, clearBtnId) {
  const img  = document.getElementById(previewId);
  const hint = document.getElementById(hintId);
  img.src = src.startsWith('http') ? src : '/' + src;
  img.style.display  = 'block';
  hint.style.display = 'none';
  if (clearBtnId) document.getElementById(clearBtnId).style.display = 'block';
}

// ── 作品リスト描画 ────────────────────────────────────────
function renderWorksList() {
  const list  = document.getElementById('works-list');
  const works = DATA.works || [];
  list.innerHTML = '';

  if (works.length === 0) {
    list.innerHTML = '<p class="a-works-empty">まだ作品がありません。「作品を追加」から登録してください。</p>';
    return;
  }

  works.forEach((work, i) => {
    const card = document.createElement('div');
    card.className = 'a-work-card';

    const thumbHtml = work.image
      ? `<img class="a-work-thumb" src="/${work.image}" alt="${esc(work.title)}" onerror="this.style.display='none'">`
      : `<div class="a-work-thumb-placeholder"></div>`;

    card.innerHTML = `
      ${thumbHtml}
      <div class="a-work-card-info">
        <div class="a-work-card-title">${esc(work.title) || '(無題)'}</div>
        <div class="a-work-card-meta">${esc(work.category)} &nbsp;·&nbsp; ${esc(work.price)}</div>
      </div>
      ${work.sold ? '<span class="a-sold-tag">SOLD</span>' : ''}
      <div class="a-work-card-actions">
        <button class="a-btn-icon" title="上へ"   onclick="moveWork(${i}, -1)">↑</button>
        <button class="a-btn-icon" title="下へ"   onclick="moveWork(${i},  1)">↓</button>
        <button class="a-btn-icon" title="編集"   onclick="openEditWork(${i})">✎</button>
        <button class="a-btn-icon danger" title="削除" onclick="deleteWork(${i})">✕</button>
      </div>
    `;

    list.appendChild(card);
  });
}

// ── 作品フォーム ──────────────────────────────────────────
function setupWorkForm() {
  document.getElementById('add-work-btn').addEventListener('click', openNewWork);
  document.getElementById('wf-save-btn').addEventListener('click', saveWork);
  document.getElementById('wf-cancel-btn').addEventListener('click', closeWorkForm);

  const zone  = document.getElementById('work-image-zone');
  const input = document.getElementById('work-file-input');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) uploadWorkImage(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) uploadWorkImage(input.files[0]);
  });
}

async function uploadWorkImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res  = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (data.error) { showToast('アップロード失敗: ' + data.error); return; }
  tempImagePath = data.path;
  const preview = document.getElementById('work-image-preview');
  preview.src = '/' + data.path;
  preview.style.display = 'block';
  document.getElementById('work-image-hint').style.display = 'none';
}

function openNewWork() {
  editingIndex  = null;
  tempImagePath = '';
  clearWorkForm();
  document.getElementById('work-form-title').textContent = '新しい作品';
  showWorkForm();
}

function openEditWork(i) {
  const w = DATA.works[i];
  editingIndex  = i;
  tempImagePath = w.image || '';

  setVal('wf-title',     w.title     || '');
  setVal('wf-category',  w.category  || '原画');
  setVal('wf-medium',    w.medium    || '');
  setVal('wf-size',      w.size      || '');
  setVal('wf-year',      w.year      || '');
  setVal('wf-price',     w.price     || '');
  setVal('wf-storesUrl', w.storesUrl || '');
  document.getElementById('wf-sold').checked = !!w.sold;

  const preview = document.getElementById('work-image-preview');
  if (w.image) {
    preview.src = '/' + w.image;
    preview.style.display = 'block';
    document.getElementById('work-image-hint').style.display = 'none';
  } else {
    preview.style.display = 'none';
    document.getElementById('work-image-hint').style.display = 'flex';
  }

  document.getElementById('work-form-title').textContent = '作品を編集';
  showWorkForm();
}

function showWorkForm() {
  document.getElementById('work-form').style.display = 'block';
  document.getElementById('work-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveWork() {
  const work = {
    id:        editingIndex !== null ? DATA.works[editingIndex].id : Date.now(),
    title:     getVal('wf-title'),
    category:  getVal('wf-category'),
    medium:    getVal('wf-medium'),
    size:      getVal('wf-size'),
    year:      getVal('wf-year'),
    price:     getVal('wf-price'),
    storesUrl: getVal('wf-storesUrl'),
    sold:      document.getElementById('wf-sold').checked,
    image:     tempImagePath,
  };

  if (!DATA.works) DATA.works = [];

  if (editingIndex !== null) {
    DATA.works[editingIndex] = work;
  } else {
    DATA.works.push(work);
  }

  closeWorkForm();
  renderWorksList();
  showToast('作品を更新しました  ／  「保存する」でサイトに反映します');
}

function deleteWork(i) {
  const title = DATA.works[i].title || '(無題)';
  if (!confirm(`「${title}」を削除しますか？`)) return;
  DATA.works.splice(i, 1);
  renderWorksList();
  showToast('削除しました  ／  「保存する」でサイトに反映します');
}

function moveWork(i, dir) {
  const target = i + dir;
  if (target < 0 || target >= DATA.works.length) return;
  [DATA.works[i], DATA.works[target]] = [DATA.works[target], DATA.works[i]];
  renderWorksList();
}

function closeWorkForm() {
  document.getElementById('work-form').style.display = 'none';
  clearWorkForm();
}

function clearWorkForm() {
  ['wf-title', 'wf-medium', 'wf-size', 'wf-year', 'wf-price', 'wf-storesUrl'].forEach(id => setVal(id, ''));
  setVal('wf-category', '原画');
  document.getElementById('wf-sold').checked = false;
  document.getElementById('work-image-preview').style.display = 'none';
  document.getElementById('work-image-hint').style.display = 'flex';
  document.getElementById('work-file-input').value = '';
  tempImagePath = '';
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Utils ─────────────────────────────────────────────────
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
