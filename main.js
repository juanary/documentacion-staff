/* ══════════════════════════════════════════
   Shinobi Gaiden — Documentación
   main.js
   ══════════════════════════════════════════ */

// ── Refs ──────────────────────────────────────────────────────────────
const navItems   = document.querySelectorAll('.nav-item');
const sections   = document.querySelectorAll('.section');
const menuToggle = document.getElementById('menuToggle');
const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('overlay');

// ── Helpers ───────────────────────────────────────────────────────────

/** Returns all <details> elements inside a section's .card */
function getSectionDetails(sectionEl) {
  return Array.from(sectionEl.querySelectorAll('.card details'));
}

/** Extracts a clean label from a <details> summary (num + text) */
function getItemLabel(detailEl) {
  const left = detailEl.querySelector('.summary-left');
  if (!left) return detailEl.querySelector('summary')?.textContent?.trim() ?? '';

  const clone = left.cloneNode(true);
  const numEl = clone.querySelector('.summary-num');
  const num   = numEl ? numEl.textContent.trim() : '';
  if (numEl) numEl.remove();

  const title = clone.textContent.trim();
  return num ? `${num}. ${title}` : title;
}

// ── TOC build ─────────────────────────────────────────────────────────

/**
 * Builds (or rebuilds) the TOC for a given section.
 * If a .toc element already exists inside the section it reuses it;
 * otherwise it creates one and inserts it right after .page-header.
 */
function buildToc(sectionEl) {
  let toc = sectionEl.querySelector('.toc');

  if (!toc) {
    toc = document.createElement('div');
    toc.className = 'toc';
    toc.innerHTML = '<div class="toc-title">Contenido</div><ul></ul>';
    const header = sectionEl.querySelector('.page-header');
    if (header) {
      header.insertAdjacentElement('afterend', toc);
    }
  }

  const ul          = toc.querySelector('ul');
  ul.innerHTML      = '';
  const detailsList = getSectionDetails(sectionEl);

  detailsList.forEach((det, i) => {
    // Give each <details> a stable anchor id
    if (!det.id) det.id = `item-${sectionEl.id}-${i}`;

    const li = document.createElement('li');
    li.textContent      = getItemLabel(det);
    li.dataset.target   = det.id;

    li.addEventListener('click', () => {
      // Open the accordion
      det.open = true;

      // Update TOC active state
      ul.querySelectorAll('li').forEach(l => l.classList.remove('toc-active'));
      li.classList.add('toc-active');

      // Smooth scroll
      det.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Flash highlight
      det.classList.remove('toc-highlight');
      void det.offsetWidth; // force reflow so animation restarts
      det.classList.add('toc-highlight');
      det.addEventListener(
        'animationend',
        () => det.classList.remove('toc-highlight'),
        { once: true }
      );
    });

    ul.appendChild(li);
  });

  // Track which item is visible as the user scrolls
  syncScrollHighlight(sectionEl, ul, detailsList);
}

// ── Scroll-sync TOC highlight ─────────────────────────────────────────

/**
 * Uses IntersectionObserver to keep the TOC item highlighted
 * as the user scrolls through the accordion items.
 */
function syncScrollHighlight(sectionEl, ul, detailsList) {
  // Disconnect previous observer for this section if any
  if (sectionEl._tocObserver) {
    sectionEl._tocObserver.disconnect();
  }

  const lis = Array.from(ul.querySelectorAll('li'));
  if (!lis.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = detailsList.indexOf(entry.target);
        if (idx === -1) return;
        lis.forEach(l => l.classList.remove('toc-active'));
        lis[idx]?.classList.add('toc-active');
      });
    },
    // Element is "active" when it crosses the upper third of the viewport
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
  );

  detailsList.forEach(det => observer.observe(det));
  sectionEl._tocObserver = observer;
}

// ── Section switching ─────────────────────────────────────────────────

function activateSection(targetId) {
  // Deactivate all
  navItems.forEach(n => n.classList.remove('active'));
  sections.forEach(s => {
    if (s._tocObserver) {
      s._tocObserver.disconnect();
      s._tocObserver = null;
    }
    s.classList.remove('active');
  });

  // Activate target
  const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
  const targetSec = document.getElementById(targetId);
  if (!targetNav || !targetSec) return;

  targetNav.classList.add('active');
  targetSec.classList.add('active');

  buildToc(targetSec);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Event listeners ───────────────────────────────────────────────────

navItems.forEach(item => {
  item.addEventListener('click', () => {
    activateSection(item.dataset.target);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 700) {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    }
  });
});

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});

// ── Init ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const activeSec = document.querySelector('.section.active');
  if (activeSec) buildToc(activeSec);
});
