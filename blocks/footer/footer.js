/*
 * Footer: brand + social band, link columns (accordion below 1200px), legal row.
 * Fragment sections (in order): brand + social | link columns | legal + copyright.
 * All copy, links and images come from the fragment; this file only builds layout and behavior.
 */

import { resolveFragmentIcons } from '../../scripts/shared.js';

const DESKTOP = window.matchMedia('(width >= 1200px)');
const ICONS = `${window.hlx?.codeBasePath || ''}/icons`;

function el(tag, className, children = []) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  children.forEach((c) => c && e.append(c));
  return e;
}

function icon(name) {
  const img = el('img', 'footer-icon');
  img.src = `${ICONS}/${name}.svg`;
  img.alt = '';
  img.width = 24;
  img.height = 24;
  img.loading = 'lazy';
  return img;
}

async function loadFragment() {
  // metadata-independent: /content first (local preview), then root (DA/EDS production)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const tpl = document.createElement('template');
  tpl.innerHTML = await resp.text();
  resolveFragmentIcons(tpl.content);
  return tpl.content;
}

/** Most common link hostname in the fragment = the site's own domain (links there are not external). */
function primaryHost(root) {
  const counts = {};
  root.querySelectorAll('a[href]').forEach((a) => {
    const { hostname } = new URL(a.getAttribute('href'), window.location.href);
    counts[hostname] = (counts[hostname] || 0) + 1;
  });
  return Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0];
}

function isExternal(a, home) {
  const { hostname } = new URL(a.getAttribute('href'), window.location.href);
  return hostname !== window.location.hostname && hostname !== home;
}

function buildTop(section) {
  const brandLink = section.querySelector(':scope > p a');
  const brandLabel = brandLink.querySelector('img')?.alt || brandLink.textContent.trim();
  const logo = el('a', 'footer-brand', [...brandLink.querySelectorAll('img')].map((img) => {
    img.width = 102;
    img.height = 48;
    img.loading = 'lazy';
    return img;
  }));
  logo.href = brandLink.getAttribute('href');
  if (brandLabel) logo.setAttribute('aria-label', brandLabel);

  const social = el('ul', 'footer-social', [...section.querySelectorAll(':scope > ul > li > a')].map((a) => {
    const link = el('a', 'footer-social-link', [...a.querySelectorAll('img')]);
    link.href = a.getAttribute('href');
    const img = link.querySelector('img');
    if (img) {
      link.setAttribute('aria-label', img.alt);
      img.alt = '';
      img.width = 24;
      img.height = 24;
      img.loading = 'lazy';
    }
    return el('li', '', [link]);
  }));
  return el('div', 'footer-top', [logo, social]);
}

function buildColumns(section, home) {
  const nav = el('nav', 'footer-nav');
  [...section.querySelectorAll(':scope > p')].forEach((title, i) => {
    const list = title.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;
    const id = `footer-group-${i}`;
    const label = title.textContent.trim();
    const toggle = el('button', 'footer-group-toggle', [label, icon('wd-system-chevron-down')]);
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', id);

    const links = el('ul', 'footer-group-links', [...list.children].map((li) => {
      const a = li.querySelector('a');
      if (!a) {
        // entries without a target on the source stay non-navigating (anchor without href)
        return el('li', '', [el('a', 'footer-link footer-link-static', [li.textContent.trim()])]);
      }
      const link = el('a', 'footer-link', [a.textContent.trim()]);
      link.href = a.getAttribute('href');
      if (isExternal(a, home)) {
        link.classList.add('is-external');
        link.append(icon('wd-system-icon-arrow-diagonal-small'));
      }
      return el('li', '', [link]);
    }));
    links.id = id;
    nav.append(el('div', 'footer-group', [
      el('h2', 'footer-group-title', [el('span', 'footer-group-label', [label]), toggle]),
      links,
    ]));
  });
  return nav;
}

function buildLegal(section) {
  const list = section.querySelector(':scope > ul');
  const legal = el('ul', 'footer-legal-links', [...list.querySelectorAll(':scope > li > a')].map((a) => {
    const link = el('a', 'footer-legal-link', [...a.childNodes].map((n) => n.cloneNode(true)));
    link.href = a.getAttribute('href');
    link.querySelectorAll('img').forEach((img) => {
      img.className = 'footer-legal-icon';
      img.alt = '';
      img.loading = 'lazy';
    });
    return el('li', '', [link]);
  }));
  const legalNav = el('nav', 'footer-legal-nav', [legal]);
  const copyright = [...section.querySelectorAll(':scope > p')].map((p) => el('p', 'footer-copyright', [p.textContent.trim()]));
  return el('div', 'footer-legal', [legalNav, ...copyright]);
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const fragment = await loadFragment();
  if (!fragment) return;
  const [brand, columns, legal] = [...fragment.children].filter((s) => s.tagName === 'DIV');
  const home = primaryHost(fragment);

  const wrapper = el('div', 'footer-inner', [
    brand && buildTop(brand),
    columns && buildColumns(columns, home),
    legal && buildLegal(legal),
  ]);
  block.replaceChildren(wrapper);

  // accordion (below 1200px): each group toggles independently, like the source
  block.querySelectorAll('.footer-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });
  DESKTOP.addEventListener('change', () => {
    block.querySelectorAll('.footer-group-toggle').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  });
}
