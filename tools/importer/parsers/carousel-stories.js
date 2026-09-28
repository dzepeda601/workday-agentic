/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-stories. Base: carousel.
 * Source: https://www.workday.com/ (.newCarousel)
 * Content model: N rows x 2 cells: [company logo image] | [result paragraph, 'Read Story' link]
 * Iterates the block-level card wrappers (.cmp-standardcard), never the CTA anchors.
 * Generated: 2026-09-28
 */
export default function parse(element, { document }) {
  let cards = [...element.querySelectorAll('.cmp-standardcard')];
  if (!cards.length) cards = [...element.querySelectorAll('.standardcard')];

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('.standardcard-img img, img.standardcard__container--image')
      || [...card.querySelectorAll('img')].find((i) => !(i.getAttribute('src') || '').startsWith('data:'));
    if (img) {
      const lazy = img.getAttribute('data-src');
      if ((!img.getAttribute('src') || img.getAttribute('src').startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      if (/^['"]{2}$/.test((img.getAttribute('alt') || '').trim())) img.setAttribute('alt', '');
    }

    const body = [];
    const textWrap = card.querySelector('.standardcard__container-content--text') || card.querySelector('.standardcard__container-content');
    if (textWrap) {
      textWrap.querySelectorAll('h2, h3, h4, p').forEach((el) => {
        if (el.textContent.trim()) body.push(el);
      });
    }
    const btnWrap = card.querySelector('.standardcard__container-content--button') || card;
    btnWrap.querySelectorAll('a[href]').forEach((a) => {
      a.querySelectorAll('img[src^="data:image/svg"]').forEach((i) => i.remove());
      if (a.textContent.trim() && !body.includes(a)) body.push(a);
    });

    if (!img && !body.length) return;
    cells.push([img || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-stories', cells });
  element.replaceWith(block);
}
