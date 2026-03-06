'use strict';
// ============================================================
//  V2 — Experience Design
// ============================================================

let LB_WORKS = [];   // 現在のフィルター適用済み作品配列
let LB_INDEX = 0;    // ライトボックスで表示中のインデックス

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  setupCursor();
  animateHero();
  renderGallery(CONFIG.works);
  setupFilter();
  setupLightbox();
  setupNavScroll();
  setupMobileNav();
});

// ── CONFIG 適用 ──────────────────────────────────────────────
function applyConfig() {
  // アクセントカラー
  if (CONFIG.colors?.accent) {
    document.documentElement.style.setProperty('--red', CONFIG.colors.accent);
  }

  // テキスト
  document.title = CONFIG.siteName;
  setText('page-title',  CONFIG.siteName);
  setText('site-name',   CONFIG.siteName);
  setText('hero-name',   CONFIG.siteName);
  setText('hero-tagline', CONFIG.tagline);
  setText('footer-copy', `© ${new Date().getFullYear()} ${CONFIG.siteName}`);

  // STORES リンク
  setHref(['nav-shop', 'about-shop', 'footer-stores'], CONFIG.storesUrl);

  // Instagram
  if (CONFIG.instagramUrl) {
    setHref(['about-ig', 'footer-ig'], CONFIG.instagramUrl);
  } else {
    hide(['about-ig', 'footer-ig']);
  }

  // About 写真
  const photoEl   = document.getElementById('about-photo');
  const photoWrap = document.getElementById('about-photo-wrap');
  if (CONFIG.about?.photo) {
    photoEl.src = CONFIG.about.photo;
  } else {
    if (photoWrap) photoWrap.style.display = 'none';
    const inner = document.getElementById('about-inner');
    if (inner) inner.style.gridTemplateColumns = '1fr';
  }

  // About bio
  const bioEl = document.getElementById('about-bio');
  if (bioEl) bioEl.innerHTML = CONFIG.about?.bio || '';
}

// ── カスタムカーソル ──────────────────────────────────────────
function setupCursor() {
  // タッチデバイスでは無効
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const nav  = document.getElementById('nav');
  let tx = 0, ty = 0;   // ターゲット座標
  let rx = 0, ry = 0;   // リング座標（lerp）

  // マウス追従
  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = tx + 'px';
    dot.style.top  = ty + 'px';
  }, { passive: true });

  // リングは rAF でスムーズに追いかける
  (function animateRing() {
    rx += (tx - rx) * 0.11;
    ry += (ty - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // ホバー状態
  function bindHover(selector) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  bindHover('a, button, .filter-btn, .work-link, .lb-cta');

  // セクション別カーソル色・ナビ色
  // 白背景セクション(hero, works): デフォルト暗いカーソル
  // 暗いセクション(about): cursor-dark クラスで白カーソル
  const DARK_SECTIONS = new Set(['about']);
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const isDark = DARK_SECTIONS.has(e.target.id);
      document.body.classList.toggle('cursor-dark', isDark);
      if (nav) nav.classList.toggle('on-dark', isDark);
    });
  }, { threshold: 0.45 });

  ['hero', 'works', 'about'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  // 波紋パーティクル
  setupRipple();
}

// ── 水の波紋パーティクル ──────────────────────────────────────
function setupRipple() {
  if (window.matchMedia('(hover: none)').matches) return;

  let lastRipple = 0;
  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastRipple < 85) return;
    lastRipple = now;

    const isDark = document.body.classList.contains('cursor-dark');

    ['r1', 'r2'].forEach((cls, i) => {
      const ring = document.createElement('div');
      ring.className = 'ripple-ring ' + cls + (isDark ? ' dark-ripple' : '');
      ring.style.left = e.clientX + 'px';
      ring.style.top  = e.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), i === 0 ? 1000 : 1150);
    });
  }, { passive: true });
}

// ── ヒーロー アニメーション ──────────────────────────────────
function animateHero() {
  const name    = document.getElementById('hero-name');
  const line    = document.getElementById('hero-line');
  const tagline = document.getElementById('hero-tagline');
  const scroll  = document.getElementById('hero-scroll');

  setTimeout(() => name    ?.classList.add('visible'),  180);
  setTimeout(() => line    ?.classList.add('visible'),  600);
  setTimeout(() => tagline ?.classList.add('visible'), 1120);
  setTimeout(() => scroll  ?.classList.add('visible'), 1700);
}

// ── ギャラリー描画 ────────────────────────────────────────────
function renderGallery(works) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  LB_WORKS = works;

  if (!works || works.length === 0) {
    gallery.innerHTML = '<p class="no-works">作品はまだありません。</p>';
    return;
  }

  works.forEach((work, i) => {
    const item = document.createElement('div');
    item.className = 'work-item' + (work.sold ? ' is-sold' : '');
    item.style.transitionDelay = `${(i % 6) * 70}ms`;

    const imgTag = work.image
      ? `<img src="${work.image}" alt="${esc(work.title)}" loading="lazy">`
      : `<img src="" alt="${esc(work.title)}" style="min-height:260px;background:#e8e8e8">`;

    const priceHtml = work.sold
      ? `<p class="ov-price">SOLD</p>`
      : `<p class="ov-price">${esc(work.price)}</p>`;

    const hintHtml = work.sold ? '' : `<p class="ov-hint">クリックで詳細 →</p>`;

    item.innerHTML = `
      <div class="work-link" role="button" tabindex="0" data-idx="${i}">
        ${imgTag}
        ${work.sold ? '<span class="sold-tag">SOLD</span>' : ''}
        <div class="work-overlay">
          <p class="ov-title">${esc(work.title)}</p>
          <p class="ov-sub">${esc(work.medium)} · ${esc(work.year)}</p>
          ${priceHtml}
          ${hintHtml}
        </div>
      </div>
    `;

    const link = item.querySelector('.work-link');
    link.addEventListener('click', () => openLightbox(i));
    link.addEventListener('keydown', e => { if (e.key === 'Enter') openLightbox(i); });
    link.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    link.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));

    gallery.appendChild(item);
  });

  // スクロール連動フェードイン
  observeReveal(gallery.querySelectorAll('.work-item'));
}

// ── カテゴリフィルター ────────────────────────────────────────
function setupFilter() {
  const categories = ['All', ...new Set(CONFIG.works.map(w => w.category))];
  const bar = document.getElementById('filter-bar');

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filtered = cat === 'All'
        ? CONFIG.works
        : CONFIG.works.filter(w => w.category === cat);
      renderGallery(filtered);
    });
    btn.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    btn.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
    bar.appendChild(btn);
  });
}

// ── ライトボックス ────────────────────────────────────────────
function setupLightbox() {
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => moveLb(-1));
  document.getElementById('lb-next').addEventListener('click', () => moveLb(1));

  // 背景クリックで閉じる
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  // キーボード操作
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   moveLb(-1);
    if (e.key === 'ArrowRight')  moveLb(1);
  });
}

function openLightbox(index) {
  LB_INDEX = index;
  refreshLightbox();
  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function moveLb(dir) {
  LB_INDEX = (LB_INDEX + dir + LB_WORKS.length) % LB_WORKS.length;
  refreshLightbox();
}

function refreshLightbox() {
  const work = LB_WORKS[LB_INDEX];
  if (!work) return;

  // 画像フェード切替
  const img = document.getElementById('lb-img');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = work.image || '';
    img.alt = work.title || '';
    img.style.opacity = '1';
  }, 180);

  setText('lb-title', work.title);
  setText('lb-meta',  [work.medium, work.size, work.year].filter(Boolean).join(' / '));
  setText('lb-price', work.sold ? 'SOLD' : work.price);

  const cta = document.getElementById('lb-cta');
  if (work.sold) {
    cta.textContent = 'SOLD';
    cta.className   = 'lb-cta is-sold';
    cta.href        = '#';
  } else {
    cta.textContent = 'STORESで購入 →';
    cta.className   = 'lb-cta';
    cta.href        = work.storesUrl || '#';
  }
}

// ── ナビ スクロール ───────────────────────────────────────────
function setupNavScroll() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── モバイルナビ ──────────────────────────────────────────────
function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

// ── スクロール reveal (IntersectionObserver) ──────────────────
function observeReveal(items) {
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  items.forEach(el => io.observe(el));
}

// ── Utils ─────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}
function setHref(ids, href) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.href = href; });
}
function hide(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
}
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
