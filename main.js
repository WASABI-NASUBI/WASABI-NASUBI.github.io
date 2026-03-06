// ============================================================
//  MAIN.JS — 描画ロジック
//  このファイルは編集不要です。カスタマイズは config.js で行ってください。
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  renderGallery(CONFIG.works);
  setupFilter();
  setupMobileNav();
  setupScrollObserver();
  setupNavScroll();
});

// ----------------------------------------------------------
//  config.js の内容を DOM に反映
// ----------------------------------------------------------
function applyConfig() {
  // アクセントカラー
  document.documentElement.style.setProperty('--color-accent', CONFIG.colors.accent);

  // ページタイトル・サイト名
  document.title = CONFIG.siteName;
  setText('site-name',    CONFIG.siteName);
  setText('hero-name',    CONFIG.siteName);
  setText('hero-tagline', CONFIG.tagline);

  // Open Graph タイトル（動的ページには効果なし・参考用）
  setMeta('og:title', CONFIG.siteName);

  // STORES リンク
  setHref(['nav-shop-link', 'hero-shop-link', 'about-stores', 'footer-stores'], CONFIG.storesUrl);

  // Instagram リンク
  if (CONFIG.instagramUrl) {
    setHref(['about-instagram', 'footer-instagram'], CONFIG.instagramUrl);
  } else {
    hide(['about-instagram', 'footer-instagram']);
  }

  // ヒーロー背景画像
  if (CONFIG.hero.backgroundImage) {
    const bg = document.getElementById('hero-bg');
    bg.style.backgroundImage = `url(${CONFIG.hero.backgroundImage})`;
    bg.style.opacity = '0.12';
  }

  // About 写真
  const photoEl   = document.getElementById('about-photo');
  const photoWrap = document.getElementById('about-image-wrap');
  if (CONFIG.about.photo) {
    photoEl.src = CONFIG.about.photo;
  } else {
    photoWrap.style.display = 'none';
    const grid = document.getElementById('about-grid');
    grid.style.gridTemplateColumns = '1fr';
    grid.style.maxWidth = '680px';
  }

  // About 本文
  const bioEl = document.getElementById('about-bio');
  if (bioEl) bioEl.innerHTML = CONFIG.about.bio;

  // Footer コピーライト
  setText('footer-copy', `© ${new Date().getFullYear()} ${CONFIG.siteName}`);
}

// ----------------------------------------------------------
//  ギャラリー描画
// ----------------------------------------------------------
function renderGallery(works) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  if (works.length === 0) {
    gallery.innerHTML = '<p class="no-works">作品はありません。</p>';
    return;
  }

  works.forEach((work, i) => {
    const item = document.createElement('div');
    item.className = 'work-item';
    item.dataset.category = work.category;
    item.style.transitionDelay = `${i * 60}ms`;

    const linkHref  = work.sold ? '#'              : work.storesUrl;
    const linkClass = work.sold ? ' work-sold'     : '';
    const overlayTx = work.sold ? 'SOLD'           : 'View on STORES';
    const priceHtml = work.sold
      ? `<p class="work-price work-price-sold">SOLD</p>`
      : `<p class="work-price">${work.price}</p>`;

    item.innerHTML = `
      <a href="${linkHref}" ${!work.sold ? 'target="_blank" rel="noopener"' : ''} class="work-link${linkClass}">
        <div class="work-image-wrap">
          <img src="${work.image}" alt="${work.title}" loading="lazy">
          ${work.sold ? '<span class="sold-badge">SOLD</span>' : ''}
          <div class="work-overlay"><span>${overlayTx}</span></div>
        </div>
        <div class="work-info">
          <h3 class="work-title">${work.title}</h3>
          <p class="work-meta">${work.medium} &nbsp;/&nbsp; ${work.size} &nbsp;/&nbsp; ${work.year}</p>
          ${priceHtml}
        </div>
      </a>
    `;

    gallery.appendChild(item);
  });

  // 新しく追加した要素にも IntersectionObserver を適用
  observeItems(gallery.querySelectorAll('.work-item'));
}

// ----------------------------------------------------------
//  カテゴリフィルター
// ----------------------------------------------------------
function setupFilter() {
  const categories = ['All', ...new Set(CONFIG.works.map(w => w.category))];
  const filterBar  = document.getElementById('filter-bar');

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
    btn.textContent = cat;

    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filtered = cat === 'All'
        ? CONFIG.works
        : CONFIG.works.filter(w => w.category === cat);

      renderGallery(filtered);
    });

    filterBar.appendChild(btn);
  });
}

// ----------------------------------------------------------
//  モバイルナビ開閉
// ----------------------------------------------------------
function setupMobileNav() {
  const toggle   = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // リンクをタップしたら閉じる
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ----------------------------------------------------------
//  スクロール時のフェードイン (IntersectionObserver)
// ----------------------------------------------------------
function setupScrollObserver() {
  observeItems(document.querySelectorAll('.work-item'));
}

function observeItems(items) {
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  items.forEach(el => observer.observe(el));
}

// ----------------------------------------------------------
//  スクロール時にナビ背景を強調
// ----------------------------------------------------------
function setupNavScroll() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.boxShadow = '0 1px 16px rgba(0,0,0,0.06)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }, { passive: true });
}

// ----------------------------------------------------------
//  ユーティリティ
// ----------------------------------------------------------
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHref(ids, href) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = href;
  });
}

function hide(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function setMeta(property, content) {
  const el = document.querySelector(`meta[property="${property}"]`);
  if (el) el.setAttribute('content', content);
}
