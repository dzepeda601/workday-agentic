/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-persona. Base: accordion.
 * Source: https://www.workday.com/ (.persona)
 * Content model: N rows x 2 cells:
 *   [title] | [background image, description paragraph, list of links, promo: logo image + sentence + link]
 * Iterates .persona-card (5 on source; first also has .expanded).
 * Generated: 2026-09-28
 */

function normalizeAlt(img) {
  if (img && /^['"]{2}$/.test((img.getAttribute('alt') || '').trim())) img.setAttribute('alt', '');
}

function resolveLazySrc(img) {
  if (!img) return;
  const src = img.getAttribute('src');
  const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
  if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
}

export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.persona-card')];

  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    // Title cell
    const heading = card.querySelector('.card-headline h1, .card-headline h2, .card-headline h3, .card-headline h4')
      || card.querySelector('h3, h2, h4');
    if (!heading) return;

    // Body cell
    const body = [];

    // Background image (lazy-loaded: src only set on the expanded card)
    const bg = card.querySelector(':scope > img.card-background-image, :scope > img');
    if (bg) {
      resolveLazySrc(bg);
      if (bg.getAttribute('src')) {
        if (!bg.hasAttribute('alt')) bg.setAttribute('alt', '');
        const p = document.createElement('p');
        p.append(bg);
        body.push(p);
      }
    }

    const info = card.querySelector('.persona-card-content-info') || card;

    // Description: non-empty paragraphs from the first text component (outside the promo)
    [...info.querySelectorAll('.cmp-text p')]
      .filter((p) => !p.closest('.validation-block, .validation-component__wrapper'))
      .forEach((p) => { if (p.textContent.trim()) body.push(p); });

    // Link list
    const links = [...info.querySelectorAll('.button .cmp-button a[href], .cmp-button a[href]')]
      .filter((a) => !a.closest('.validation-block, .validation-component__wrapper'));
    const uniqueLinks = [...new Set(links)];
    if (uniqueLinks.length) {
      const ul = document.createElement('ul');
      uniqueLinks.forEach((a) => {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        const label = a.querySelector('.cmp-button__text');
        link.textContent = (label ? label.textContent : a.textContent).replace(/\s+/g, ' ').trim();
        const li = document.createElement('li');
        li.append(link);
        ul.append(li);
      });
      body.push(ul);
    }

    // Promo callout: logo + sentence with inline link
    const promo = info.querySelector('.validation-component__wrapper, .validation-block');
    if (promo) {
      const logo = promo.querySelector('.validation-component__wrapper-logo img, .logo-content__wrapper img');
      if (logo) {
        resolveLazySrc(logo);
        normalizeAlt(logo);
        const p = document.createElement('p');
        p.append(logo);
        body.push(p);
      }
      promo.querySelectorAll('.validation-component__wrapper-description p, .cmp-text p').forEach((p) => {
        if (p.textContent.trim()) body.push(p);
      });
      promo.querySelectorAll('.validation-component__wrapper-link a[href]').forEach((a) => {
        a.querySelectorAll('img[src^="data:image/svg"]').forEach((i) => i.remove());
        if (a.textContent.trim()) body.push(a);
      });
    }

    cells.push([heading, body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-persona', cells });
  element.replaceWith(block);
}
