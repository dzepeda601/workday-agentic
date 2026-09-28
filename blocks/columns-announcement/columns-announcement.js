import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Announcement bar: [logo image] | [paragraph with inline link].
 * Tolerates a missing logo cell or extra cells (extra text cells are merged into the text area).
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const inner = document.createElement('div');
  inner.className = 'columns-announcement-inner';

  const logo = document.createElement('div');
  logo.className = 'columns-announcement-logo';
  const text = document.createElement('div');
  text.className = 'columns-announcement-text';

  cells.forEach((cell) => {
    const pic = cell.querySelector('picture');
    const onlyImage = pic && !cell.textContent.trim();
    if (onlyImage && !logo.children.length) {
      const img = pic.querySelector('img');
      if (img) {
        // Scene7 URLs keep their IS params via the DM renderer (scripts.js)
        const dmPicture = window.__dmRender__?.(img.src, img.alt);
        // above the fold: load the logo eagerly (Scene7 sizing is capped by fit=constrain)
        dmPicture?.querySelector('img')?.setAttribute('loading', 'eager');
        logo.append(dmPicture
          || createOptimizedPicture(img.src, img.alt, true, [{ width: '400' }]));
      } else {
        logo.append(pic);
      }
    } else {
      text.append(...cell.childNodes);
    }
  });

  // Inline links in the announcement should read as text links, not buttons.
  text.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
  text.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));

  if (logo.children.length) inner.append(logo);
  if (text.childNodes.length) inner.append(text);
  block.replaceChildren(inner);
}
