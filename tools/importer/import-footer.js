/* eslint-disable */
/* global WebImporter */

/**
 * Import script: Workday global footer → /footer fragment (content/footer.plain.html).
 *
 * Flat, semantic fragment built from the source footer on https://www.workday.com/:
 *   section 1  brand + social – logo link, list of social links (icon images)
 *   section 2  link columns   – per column: bold title paragraph + list of links
 *                               (entries without a target on the source stay plain text)
 *   section 3  legal          – list of legal links (privacy icon kept), copyright paragraph
 *
 * Logo and social icons are SVGs served from the code bus (/icons), referenced with the EDS icon
 * shorthand ":name:" followed by their label (SVGs cannot be served from content).
 * Legal entries without a URL on the source are consent-manager controls ("Your Privacy Choices",
 * "Cookie Preferences" open a TrustArc modal). The site has no consent manager, so they are
 * omitted (customer decision).
 */

const ORIGIN = 'https://www.workday.com';

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function el(document, tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  children.forEach((c) => e.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

const abs = (href) => (href && href.startsWith('/') && !href.startsWith('//') ? `${ORIGIN}${href}` : href);
// column titles hold a span and a (mobile) button with the same label — take one of them
const titleOf = (h) => text(h.querySelector(':scope > span')) || text(h.querySelector(':scope > button')) || text(h);
const iconFile = (use) => (use ? use.split('/').pop().split('#')[0] : '');

export default {
  transform: ({ document }) => {
    const footer = document.querySelector('footer.cmp-footer-v2');
    const root = el(document, 'div');
    const hr = () => root.append(el(document, 'hr'));

    // 1. brand + social
    root.append(el(document, 'p', {}, [el(document, 'a', { href: '/' }, [':workday-logo-reversed:Workday'])]));
    const social = [...footer.querySelectorAll('.cmp-socialmedia a')].map((a) => {
      const use = a.querySelector('use');
      const file = iconFile(use && (use.getAttribute('href') || use.getAttribute('xlink:href')));
      return el(document, 'li', {}, [el(document, 'a', { href: a.getAttribute('href') }, [`:${file.replace(/\.svg$/, '')}:${a.getAttribute('aria-label') || ''}`])]);
    });
    root.append(el(document, 'ul', {}, social));
    hr();

    // 2. link columns
    footer.querySelectorAll('.footer-navigation__group').forEach((g) => {
      root.append(el(document, 'p', {}, [el(document, 'strong', {}, [titleOf(g.querySelector('.footer-navigation__group--title'))])]));
      const items = [...g.querySelectorAll('.footer-navigation__group--items')].map((li) => {
        const a = li.querySelector('a');
        const href = a && a.getAttribute('href');
        return el(document, 'li', {}, [href ? el(document, 'a', { href: abs(href) }, [text(a)]) : text(a || li)]);
      });
      root.append(el(document, 'ul', {}, items));
    });
    hr();

    // 3. legal + copyright
    const legal = [...footer.querySelectorAll('.footer-container__wrapper--legal-links a')]
      .filter((a) => text(a) && a.getAttribute('href') && !a.getAttribute('href').startsWith('#'))
      .map((a) => el(document, 'li', {}, [el(document, 'a', { href: abs(a.getAttribute('href')) }, [text(a)])]));
    root.append(el(document, 'ul', {}, legal));
    root.append(el(document, 'p', {}, [text(footer.querySelector('.copyright'))]));

    document.body.replaceChildren(root);
    return [{ element: document.body, path: '/footer', report: { title: 'footer', legalLinks: legal.length } }];
  },
};
