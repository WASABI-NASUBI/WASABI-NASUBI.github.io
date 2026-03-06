'use strict';
// ============================================================
//  Profile Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  applyProfileConfig();
  setupCursor();
  animateHero();
  setupNavScroll();
  setupMobileNav();
  observeReveal(document.querySelectorAll('.reveal'));
});

// ── CONFIG 適用 ──────────────────────────────────────────────
function applyProfileConfig() {
  if (CONFIG.colors?.accent) {
    document.documentElement.style.setProperty('--red', CONFIG.colors.accent);
  }

  document.title = (CONFIG.siteName || 'Artist') + ' — Profile';
  setText('site-name', CONFIG.siteName);
  setText('p-name',    CONFIG.siteName);
  setText('p-title',   CONFIG.siteName);
  setText('footer-copy', `© ${new Date().getFullYear()} ${CONFIG.siteName}`);

  // bio
  const bioEl = document.getElementById('p-bio');
  if (bioEl) bioEl.innerHTML = CONFIG.about?.bio || '';

  // statement (about.statement があれば使用, なければ bio を流用)
  const stEl = document.getElementById('p-statement');
  if (stEl) {
    const st = CONFIG.about?.statement || CONFIG.about?.bio || '';
    if (st) {
      stEl.innerHTML = st;
    } else {
      stEl.classList.add('profile-statement-empty');
      stEl.textContent = '管理パネルからステートメントを設定してください。';
    }
  }

  // 写真
  const photoEl = document.getElementById('p-photo');
  if (CONFIG.about?.photo) {
    photoEl.src = CONFIG.about.photo;
  } else {
    photoEl.replaceWith(Object.assign(document.createElement('div'), {
      className: 'profile-photo-placeholder',
    }));
  }

  // リンク
  setHref(['nav-shop', 'p-stores', 'footer-stores'], CONFIG.storesUrl);
  if (CONFIG.instagramUrl) {
    setHref(['p-ig', 'footer-ig'], CONFIG.instagramUrl);
  } else {
    hide(['p-ig', 'footer-ig']);
  }
}

// ── ヒーロー アニメーション ──────────────────────────────────
function animateHero() {
  setTimeout(() => document.getElementById('p-label')?.classList.add('visible'), 200);
  setTimeout(() => document.getElementById('p-name') ?.classList.add('visible'), 450);
  setTimeout(() => document.getElementById('p-line') ?.classList.add('visible'), 800);
}

// ── カスタムカーソル + 波紋 ──────────────────────────────────
function setupCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const nav  = document.getElementById('nav');
  let tx = 0, ty = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = tx + 'px';
    dot.style.top  = ty + 'px';
  }, { passive: true });

  (function animateRing() {
    rx += (tx - rx) * 0.11;
    ry += (ty - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // ホバー
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // セクション別カーソル色
  const DARK_SECTIONS = new Set(['profile-statement', 'footer']);
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const isDark = DARK_SECTIONS.has(e.target.id);
      document.body.classList.toggle('cursor-dark', isDark);
      if (nav) nav.classList.toggle('on-dark', isDark);
    });
  }, { threshold: 0.45 });

  ['profile-hero', 'profile-intro', 'profile-statement', 'profile-cta'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  // 波紋
  let lastRipple = 0;
  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastRipple < 85) return;
    lastRipple = now;
    const isDark = document.body.classList.contains('cursor-dark');
    ['r1', 'r2'].forEach((cls, i) => {
      const r = document.createElement('div');
      r.className = 'ripple-ring ' + cls + (isDark ? ' dark-ripple' : '');
      r.style.left = e.clientX + 'px';
      r.style.top  = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), i === 0 ? 1000 : 1150);
    });
  }, { passive: true });
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

// ── スクロール reveal ────────────────────────────────────────
function observeReveal(items) {
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  items.forEach(el => io.observe(el));
}

// ── Utils ─────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id); if (el) el.textContent = val || '';
}
function setHref(ids, href) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.href = href; });
}
function hide(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
}
