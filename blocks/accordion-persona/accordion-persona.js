import { unnestParagraphs } from '../../scripts/shared.js';

let accordionPersonaId = 0;

/**
 * Split a panel body into background image, main content, and promo callout.
 * Background = the first picture authored before any text.
 * Promo = everything authored after the link list (logo + sentence + link).
 */
function buildBody(body) {
  body.className = 'accordion-persona-item-body';
  unnestParagraphs(body);
  const children = [...body.children];

  const bg = document.createElement('div');
  bg.className = 'accordion-persona-item-bg';
  const first = children[0];
  if (first && first.querySelector('picture') && !first.textContent.trim()) {
    bg.append(first.querySelector('picture'));
    first.remove();
  }

  const content = document.createElement('div');
  content.className = 'accordion-persona-item-content';
  const promo = document.createElement('div');
  promo.className = 'accordion-persona-item-promo';

  let afterList = false;
  [...body.children].forEach((el) => {
    if (afterList) {
      promo.append(el);
    } else {
      content.append(el);
      if (el.tagName === 'UL' || el.tagName === 'OL') afterList = true;
    }
  });

  // Links inside the panel are text links, not buttons.
  body.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
  [content, promo].forEach((el) => el.querySelectorAll('.button-container')
    .forEach((p) => p.classList.remove('button-container')));
  content.querySelector('ul, ol')?.classList.add('accordion-persona-item-links');

  body.replaceChildren();
  if (bg.children.length) {
    body.append(bg);
    body.classList.add('has-bg');
  }
  body.append(content);
  if (promo.children.length) body.append(promo);
}

/**
 * Scene7 pads the canvas when `wid` exceeds the native asset width, which letterboxes
 * the card photos and shrinks the promo logos. `fit=constrain,0` caps at native size.
 * @param {Element} block
 */
function constrainScene7Width(block) {
  block.querySelectorAll('picture source[srcset*="scene7.com"], picture img[src*="scene7.com"]').forEach((el) => {
    const attr = el.tagName === 'SOURCE' ? 'srcset' : 'src';
    try {
      const url = new URL(el.getAttribute(attr), window.location.href);
      if (!url.searchParams.has('wid') || url.searchParams.has('fit')) return;
      url.searchParams.set('fit', 'constrain,0');
      el.setAttribute(attr, url.toString());
    } catch (e) {
      // leave malformed URLs untouched
    }
  });
}

/**
 * Persona accordion: rows of [title] | [bg image, description, link list, promo].
 * Panels are mutually exclusive; the first panel opens by default.
 * @param {Element} block
 */
export default function decorate(block) {
  accordionPersonaId += 1;
  const groupName = `accordion-persona-${accordionPersonaId}`;
  constrainScene7Width(block);
  const rows = [...block.children];

  rows.forEach((row, idx) => {
    const [label, body, ...extra] = [...row.children];
    const summary = document.createElement('summary');
    summary.className = 'accordion-persona-item-label';
    if (label) summary.append(...label.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-persona-item';
    details.name = groupName;
    if (idx === 0) details.open = true;
    details.append(summary);

    if (body) {
      extra.forEach((cell) => body.append(...cell.childNodes));
      buildBody(body);
      details.append(body);
    }
    row.replaceWith(details);
  });

  // Fallback for browsers without exclusive <details name> support.
  const items = [...block.querySelectorAll(':scope > details')];
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => { if (other !== item) other.open = false; });
    });
  });
}
