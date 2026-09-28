import { fetchPlaceholders } from '../../scripts/shared.js';

/*
 * Header: drill-down flyout navigation built from the /nav fragment.
 * Fragment sections (in order): brand | navigation | language | sign-in | search | cta.
 * All copy, links and images come from the fragment; this file only builds controls and behavior.
 */

const DESKTOP = window.matchMedia('(width >= 1200px)');

const labelOf = (li) => {
  const p = li.querySelector(':scope > p');
  if (p && !p.querySelector('a')) return p.textContent.trim();
  return [...li.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim()).join(' ').trim();
};

const linkOf = (li) => li.querySelector(':scope > a, :scope > p > a');

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

function el(tag, className, children = []) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  children.forEach((c) => c && e.append(c));
  return e;
}

function iconButton(img, className) {
  const btn = el('button', className);
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', img.alt);
  const icon = img.cloneNode(true);
  icon.alt = '';
  icon.width = 24;
  icon.height = 24;
  btn.append(icon);
  return btn;
}

/** Menu entries sit in headings (h3 = level 1, h4 = level 2), mirroring the source markup. */
function heading(level, child, className = 'nav-heading') {
  return el(`h${level}`, className, [child]);
}

function cloneLink(a, className) {
  const link = el('a', className, [a.textContent.trim()]);
  link.href = a.getAttribute('href');
  return link;
}

async function loadFragment() {
  // metadata-independent: /content first (local preview), then root (DA/EDS production)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const tpl = document.createElement('template');
  tpl.innerHTML = await resp.text();
  return tpl.content;
}

/* ---------- navigation (level 1 flyout + level 2 details) ---------- */

function buildDetails(ul, id) {
  const details = el('div', 'nav-details');
  details.id = id;
  const list = el('ul', 'nav-details-list');
  [...ul.children].forEach((li) => {
    const a = linkOf(li);
    const paras = [...li.querySelectorAll(':scope > p')];
    const group = li.querySelector(':scope > ul');
    if (a && paras.length > 1) {
      const desc = paras.find((p) => !p.querySelector('a'));
      details.prepend(el('div', 'nav-details-intro', [
        el('p', 'nav-details-description', [desc.textContent.trim()]),
        heading(4, cloneLink(a, 'nav-details-intro-link')),
      ]));
    } else if (group) {
      list.append(el('li', '', [heading(4, labelOf(li), 'nav-details-overline')]));
      [...group.querySelectorAll('a')].forEach((ga) => list.append(el('li', '', [heading(4, cloneLink(ga, 'nav-link'))])));
    } else if (a) {
      list.append(el('li', '', [heading(4, cloneLink(a, 'nav-link'))]));
    }
  });
  details.append(list);
  return details;
}

function buildFlyout(ul, prefix) {
  const flyout = el('div', 'nav-flyout');
  const list = el('ul', 'nav-flyout-list');
  [...ul.children].forEach((li, i) => {
    const sub = li.querySelector(':scope > ul');
    const a = linkOf(li);
    if (sub && !labelOf(li)) {
      // unlabelled nested list = secondary link group (smaller links, separated from the list above)
      [...sub.querySelectorAll('a')].forEach((ga, j) => {
        const item = el('li', 'nav-flyout-item is-secondary', [heading(3, cloneLink(ga, 'nav-link'))]);
        if (j === 0) item.classList.add('starts-group');
        list.append(item);
      });
    } else if (sub) {
      const id = `${prefix}-details-${i}`;
      const btn = el('button', 'nav-sub-trigger', [labelOf(li)]);
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      list.append(el('li', 'nav-flyout-item has-details', [heading(3, btn), buildDetails(sub, id)]));
    } else if (a) {
      list.append(el('li', 'nav-flyout-item', [heading(3, cloneLink(a, 'nav-link nav-link-primary'))]));
    }
  });
  flyout.append(list);
  return flyout;
}

function buildMenu(section, labels) {
  const top = section.querySelector(':scope > ul');
  const menu = el('ul', 'nav-menu');
  [...top.children].forEach((li, i) => {
    const id = `nav-flyout-${i}`;
    const btn = el('button', 'nav-trigger', [labelOf(li)]);
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    const flyout = buildFlyout(li.querySelector(':scope > ul'), id);
    flyout.id = id;
    menu.append(el('li', 'nav-item', [btn, flyout]));
  });
  const wrap = el('nav', 'nav-sections', [menu]);
  wrap.setAttribute('aria-label', labels.mainMenu);
  return wrap;
}

/* ---------- utility panels ---------- */

function buildLanguage(section) {
  const [toggleImg] = section.querySelectorAll('img');
  const paras = [...section.querySelectorAll(':scope > p')].filter((p) => !p.querySelector('img'));
  const [title, current] = paras;
  const currentLabel = current.querySelector('strong')?.textContent.trim() || '';
  const [, curCountry = '', curLang = ''] = currentLabel.match(/^(.*?)\s*\((.*)\)$/) || [];

  const panel = el('div', 'nav-panel nav-language');
  panel.id = 'nav-panel-language';
  panel.dataset.title = title.textContent.trim();
  panel.dataset.level = '0';
  const head = el('div', 'nav-language-head', [
    el('p', 'nav-language-title', [title.textContent.trim()]),
    el('p', 'nav-language-current', [...current.cloneNode(true).childNodes]),
  ]);
  const cols = [el('ul', 'nav-language-col'), el('ul', 'nav-language-col'), el('ul', 'nav-language-col')];

  const select = (col, btn) => {
    cols[col].querySelectorAll('button').forEach((b) => b.setAttribute('aria-expanded', b === btn ? 'true' : 'false'));
  };
  const showLanguages = (countryLi) => {
    cols[2].replaceChildren(...[...countryLi.querySelectorAll(':scope > ul > li')].map((l) => {
      const a = cloneLink(linkOf(l), 'nav-language-link');
      if (a.textContent === curLang && labelOf(countryLi) === curCountry) a.setAttribute('aria-current', 'true');
      return el('li', '', [a]);
    }));
  };
  const showCountries = (regionLi) => {
    cols[1].replaceChildren(...[...regionLi.querySelectorAll(':scope > ul > li')].map((c) => {
      const b = el('button', 'nav-language-option', [labelOf(c)]);
      b.type = 'button';
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => { select(1, b); showLanguages(c); panel.dataset.level = '2'; });
      if (labelOf(c) === curCountry) { b.setAttribute('aria-expanded', 'true'); showLanguages(c); }
      return el('li', '', [b]);
    }));
  };
  [...section.querySelectorAll(':scope > ul > li')].forEach((r) => {
    const b = el('button', 'nav-language-option', [labelOf(r)]);
    b.type = 'button';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => { select(0, b); cols[2].replaceChildren(); showCountries(r); panel.dataset.level = '1'; });
    const hasCurrent = [...r.querySelectorAll(':scope > ul > li')].some((c) => labelOf(c) === curCountry);
    if (hasCurrent) { b.setAttribute('aria-expanded', 'true'); showCountries(r); }
    cols[0].append(el('li', '', [b]));
  });
  panel.append(head, el('div', 'nav-language-cols', cols));
  const toggle = iconButton(toggleImg, 'nav-tool-toggle');
  toggle.setAttribute('aria-controls', panel.id);
  return el('div', 'nav-tool nav-tool-language', [toggle, panel]);
}

function buildSignIn(section) {
  const [toggleImg, helpImg] = section.querySelectorAll('img');
  const panel = el('div', 'nav-panel nav-signin');
  panel.id = 'nav-panel-signin';
  panel.dataset.title = section.querySelector(':scope > p')?.textContent.trim() || toggleImg.alt;
  const help = helpImg.cloneNode(true);
  help.alt = '';
  help.className = 'nav-signin-icon';
  panel.append(help);
  [...section.children].forEach((node) => {
    if (node.querySelector('img')) return;
    const a = node.querySelector(':scope > a');
    if (node.tagName === 'UL') {
      panel.append(el('ul', 'nav-signin-links', [...node.querySelectorAll('a')].map((l) => el('li', '', [cloneLink(l, 'nav-link')]))));
    } else if (node.querySelector(':scope > strong') && !a) {
      panel.append(el('p', 'nav-overline', [node.textContent.trim()]));
    } else if (a) {
      panel.append(cloneLink(a, 'nav-signin-more'));
    } else {
      panel.append(el('p', 'nav-signin-text', [node.textContent.trim()]));
    }
  });
  const toggle = iconButton(toggleImg, 'nav-tool-toggle');
  toggle.setAttribute('aria-controls', panel.id);
  return el('div', 'nav-tool nav-tool-signin', [toggle, panel]);
}

function buildSearch(section, labels) {
  const [toggleImg, closeImg] = section.querySelectorAll('img');
  const action = section.querySelector(':scope > p > a');
  const panel = el('div', 'nav-panel nav-search');
  panel.id = 'nav-panel-search';
  const form = el('form', 'nav-search-form');
  form.action = action.getAttribute('href');
  form.setAttribute('role', 'search');
  const input = el('input', 'nav-search-input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = action.textContent.trim();
  input.setAttribute('aria-label', toggleImg.alt);
  input.autocomplete = 'off';
  const icon = toggleImg.cloneNode(true);
  icon.alt = '';
  icon.className = 'nav-search-icon';
  form.append(icon, input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    window.location.href = `${form.action}${q ? `#q=${encodeURIComponent(q)}` : ''}`;
  });
  const quick = el('div', 'nav-search-quick', [
    el('p', 'nav-overline', [section.querySelector(':scope > p > strong')?.textContent.trim()]),
    el('ul', 'nav-search-links', [...section.querySelectorAll(':scope > ul a')].map((l) => el('li', '', [cloneLink(l, 'nav-link')]))),
  ]);
  const close = iconButton(closeImg, 'nav-search-close');
  close.removeAttribute('aria-expanded');
  close.setAttribute('aria-label', closeImg.alt || labels.close);
  panel.append(el('div', 'nav-search-field', [form, quick]), close);
  const toggle = iconButton(toggleImg, 'nav-tool-toggle');
  toggle.setAttribute('aria-controls', panel.id);
  return el('div', 'nav-tool nav-tool-search', [toggle, panel]);
}

function buildCta(section, home) {
  const a = section.querySelector('a');
  const cta = cloneLink(a, 'button nav-cta');
  if (isExternal(a, home)) {
    cta.target = '_blank';
    cta.rel = 'noopener';
  }
  return el('div', 'nav-tool nav-tool-cta', [cta]);
}

/* ---------- behavior ---------- */

function setupBehavior(nav, overlay, hamburger, context) {
  const [ctxBack, ctxTitle] = context.children;
  const closeDetails = (scope) => {
    scope.querySelectorAll('.nav-sub-trigger[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  };
  const closeAll = (except) => {
    nav.querySelectorAll('.nav-trigger[aria-expanded="true"], .nav-tool-toggle[aria-expanded="true"]').forEach((b) => {
      if (b !== except) b.setAttribute('aria-expanded', 'false');
    });
    closeDetails(nav);
    nav.classList.remove('is-searching');
    nav.querySelectorAll('.nav-language').forEach((l) => { l.dataset.level = '0'; });
  };
  const openTool = () => nav.querySelector('.nav-tool:not(.nav-tool-search) > .nav-tool-toggle[aria-expanded="true"]');
  // mobile context bar: back + title of whatever is drilled into (details > flyout > tool panel)
  const updateContext = () => {
    const sub = nav.querySelector('.nav-sub-trigger[aria-expanded="true"]');
    const trigger = nav.querySelector('.nav-trigger[aria-expanded="true"]');
    const tool = openTool();
    const label = (sub || trigger)?.textContent.trim()
      || (tool && document.getElementById(tool.getAttribute('aria-controls'))?.dataset.title) || '';
    ctxTitle.textContent = label;
    nav.classList.toggle('is-drilled', !!label);
  };
  const sync = () => {
    const open = !!nav.querySelector('.nav-trigger[aria-expanded="true"], .nav-tool-toggle[aria-expanded="true"]')
      || nav.getAttribute('aria-expanded') === 'true';
    nav.closest('.nav-wrapper').classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    overlay.hidden = !open;
    updateContext();
    document.body.classList.toggle('nav-locked', open && !DESKTOP.matches);
  };

  const coverParent = (panel, parent) => {
    if (!panel) return;
    panel.style.minHeight = DESKTOP.matches || !parent ? '' : `${parent.offsetHeight}px`;
    panel.scrollTop = 0;
  };

  nav.querySelectorAll('.nav-trigger').forEach((btn) => {
    btn.addEventListener('click', () => coverParent(btn.nextElementSibling, nav.querySelector('.nav-sections')));
  });

  nav.querySelectorAll('.nav-trigger, .nav-tool-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expand = btn.getAttribute('aria-expanded') !== 'true';
      closeAll(btn);
      btn.setAttribute('aria-expanded', expand ? 'true' : 'false');
      if (btn.closest('.nav-tool-search')) {
        nav.classList.toggle('is-searching', expand);
        if (expand) nav.querySelector('.nav-search-input').focus();
      }
      sync();
    });
  });

  const triggers = [...nav.querySelectorAll('.nav-trigger')];
  new MutationObserver((records) => {
    const changed = records.map((r) => r.target).filter((t) => t.classList.contains('nav-trigger'));
    if (!changed.length) return;
    const current = changed.filter((t) => t.getAttribute('aria-expanded') === 'true').pop();
    if (!current) { sync(); return; }
    triggers.forEach((t) => { if (t !== current && t.getAttribute('aria-expanded') === 'true') t.setAttribute('aria-expanded', 'false'); });
    sync();
  }).observe(nav.querySelector('.nav-menu'), { attributes: true, attributeFilter: ['aria-expanded'], subtree: true });

  nav.querySelectorAll('.nav-sub-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expand = btn.getAttribute('aria-expanded') !== 'true';
      closeDetails(btn.closest('.nav-flyout'));
      btn.setAttribute('aria-expanded', expand ? 'true' : 'false');
      coverParent(btn.closest('.nav-flyout-item').querySelector('.nav-details'), btn.closest('.nav-flyout'));
      updateContext();
    });
  });

  // mobile: back steps out one level (details → flyout → menu; language columns → panel → menu)
  ctxBack.addEventListener('click', () => {
    const sub = nav.querySelector('.nav-sub-trigger[aria-expanded="true"]');
    const trigger = nav.querySelector('.nav-trigger[aria-expanded="true"]');
    const tool = openTool();
    const lang = tool && document.getElementById(tool.getAttribute('aria-controls'));
    if (sub) {
      sub.setAttribute('aria-expanded', 'false');
    } else if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    } else if (lang && Number(lang.dataset.level) > 0) {
      lang.dataset.level = String(Number(lang.dataset.level) - 1);
    } else if (tool) {
      tool.setAttribute('aria-expanded', 'false');
    }
    sync();
  });

  nav.querySelector('.nav-search-close').addEventListener('click', () => { closeAll(); sync(); });
  overlay.addEventListener('click', () => {
    closeAll();
    nav.setAttribute('aria-expanded', 'false');
    sync();
  });

  // hamburger opens the menu; once anything is open it acts as the close (×) button
  hamburger.addEventListener('click', () => {
    const expand = !nav.closest('.nav-wrapper').classList.contains('is-open');
    closeAll();
    nav.setAttribute('aria-expanded', expand ? 'true' : 'false');
    sync();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.closest('.nav-wrapper').classList.contains('is-open')) return;
    closeAll();
    nav.setAttribute('aria-expanded', 'false');
    sync();
  });

  // crossing the desktop breakpoint resets every open panel and the mobile menu
  DESKTOP.addEventListener('change', () => {
    closeAll();
    nav.setAttribute('aria-expanded', 'false');
    sync();
  });
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const [fragment, placeholders] = await Promise.all([loadFragment(), fetchPlaceholders()]);
  if (!fragment) return;
  const labels = {
    mainMenu: placeholders.mainMenu || 'Main Menu',
    menu: placeholders.menu || 'Menu',
    back: placeholders.back || 'Back',
    close: placeholders.close || 'Close',
  };
  const [brand, navigation, language, signin, search, cta] = [...fragment.children]
    .filter((s) => s.tagName === 'DIV');
  const home = primaryHost(fragment);

  const nav = el('div', 'nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const brandLink = brand.querySelector('a');
  const logo = el('a', 'nav-brand', [...brandLink.querySelectorAll('img')].map((i) => {
    i.width = 102;
    i.height = 48;
    return i;
  }));
  logo.href = brandLink.getAttribute('href');
  logo.setAttribute('aria-label', brandLink.querySelector('img')?.alt || '');

  const ctxBack = el('button', 'nav-context-back');
  ctxBack.type = 'button';
  ctxBack.setAttribute('aria-label', labels.back);
  const context = el('div', 'nav-context', [ctxBack, el('p', 'nav-context-title')]);

  const hamburger = el('button', 'nav-hamburger', [el('span', 'nav-hamburger-icon')]);
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', labels.menu);

  const tools = el('div', 'nav-tools', [
    language && buildLanguage(language),
    signin && buildSignIn(signin),
    search && buildSearch(search, labels),
    cta && buildCta(cta, home),
  ]);

  const sections = buildMenu(navigation, labels);
  // mobile-only menu entries (hidden from 1200px): current language, sign in, CTA
  const menu = sections.querySelector('.nav-menu');
  const mobileEntry = (label, toolClass, withIcon) => {
    const toggle = tools.querySelector(`.${toolClass} .nav-tool-toggle`);
    if (!toggle || !label) return;
    const btn = el('button', 'nav-mobile-tool', [withIcon ? toggle.querySelector('img').cloneNode(true) : null, label]);
    btn.type = 'button';
    btn.setAttribute('aria-controls', toggle.getAttribute('aria-controls'));
    btn.addEventListener('click', () => toggle.click());
    menu.append(el('li', 'nav-item nav-item-mobile', [btn]));
  };
  const currentSite = language && [...language.querySelectorAll(':scope > p')].filter((pp) => !pp.querySelector('img'))[1];
  mobileEntry(currentSite?.querySelector('strong')?.textContent.trim(), 'nav-tool-language');
  mobileEntry(signin?.querySelector(':scope > p')?.textContent.trim(), 'nav-tool-signin', true);
  const ctaLink = tools.querySelector('.nav-cta');
  if (ctaLink) menu.append(el('li', 'nav-item nav-item-mobile nav-item-cta', [ctaLink.cloneNode(true)]));

  nav.append(logo, context, sections, tools, hamburger);
  nav.querySelectorAll('.nav-sections .nav-link, .nav-signin .nav-link').forEach((a) => {
    if (isExternal(a, home)) a.classList.add('is-external');
  });

  const overlay = el('div', 'nav-overlay');
  overlay.hidden = true;
  const wrapper = el('div', 'nav-wrapper', [nav, overlay]);
  block.replaceChildren(wrapper);
  setupBehavior(nav, overlay, hamburger, context);
}
