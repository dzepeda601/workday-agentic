/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-announcement. Base: columns.
 * Source: https://www.workday.com/ (.announcement-bar-v2__wrapper-container)
 * Content model: 1 row x 2 cells: [logo image] | [paragraph with inline link]
 * Generated: 2026-09-28
 */
export default function parse(element, { document }) {
  // Logo cell: image inside .announcement-bar-v2__wrapper-logo (fallback: first image in block)
  const logoWrap = element.querySelector('.announcement-bar-v2__wrapper-logo') || element;
  const logo = logoWrap.querySelector('picture') || logoWrap.querySelector('img');
  // Source authors literal quotes as alt ("''") - normalize to empty (decorative logo)
  if (logo) {
    const logoImg = logo.tagName === 'IMG' ? logo : logo.querySelector('img');
    if (logoImg && /^['"]{2}$/.test((logoImg.getAttribute('alt') || '').trim())) logoImg.setAttribute('alt', '');
  }

  // Text cell: non-empty paragraphs from the description wrapper
  const descWrap = element.querySelector('.announcement-bar-v2__wrapper-description, .cmp-text') || element;
  let paragraphs = Array.from(descWrap.querySelectorAll('p'))
    .filter((p) => p.textContent.trim() || p.querySelector('a, img'));

  const textCell = [];
  if (paragraphs.length) {
    textCell.push(...paragraphs);
  } else {
    // Fallback: no <p> wrappers, take links / text directly
    const text = descWrap.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.append(...Array.from(descWrap.childNodes));
      textCell.push(p);
    }
  }

  if (!logo && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[logo || '', textCell.length ? textCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-announcement', cells });
  element.replaceWith(block);
}
