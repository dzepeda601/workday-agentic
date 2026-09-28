import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchPlaceholders, unnestParagraphs } from '../../scripts/shared.js';

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'carousel-stories-card';
  [...row.children].forEach((cell) => {
    unnestParagraphs(cell);
    const pic = cell.querySelector('picture');
    if (pic && !cell.textContent.trim()) {
      cell.className = 'carousel-stories-card-image';
      const img = pic.querySelector('img');
      // Scene7 URLs keep their IS params via the DM renderer (scripts.js)
      if (img) {
        pic.replaceWith(window.__dmRender__?.(img.src, img.alt)
          || createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
      }
    } else {
      cell.className = 'carousel-stories-card-body';
      cell.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
      cell.querySelectorAll('.button-container').forEach((p) => {
        p.classList.remove('button-container');
        p.classList.add('carousel-stories-card-link');
      });
    }
    li.append(cell);
  });
  return li;
}

/**
 * Horizontally scrolling story cards: rows of [logo image] | [result text, link].
 * Native scroll-snap track with prev/next buttons and a scroll progress bar.
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const track = document.createElement('ul');
  track.className = 'carousel-stories-track';
  track.setAttribute('tabindex', '0');
  rows.forEach((row) => track.append(buildCard(row)));

  const viewport = document.createElement('div');
  viewport.className = 'carousel-stories-viewport';
  viewport.append(track);
  block.replaceChildren(viewport);

  const placeholders = await fetchPlaceholders();
  const { carousel: carouselLabel = 'Carousel', customerStories } = placeholders;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', carouselLabel);
  track.setAttribute('aria-label', customerStories || carouselLabel);

  if (rows.length < 2) return;

  const makeButton = (cls, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.setAttribute('aria-label', label);
    return btn;
  };
  const prev = makeButton('carousel-stories-prev', placeholders.previousSlide || 'Previous Slide');
  const next = makeButton('carousel-stories-next', placeholders.nextSlide || 'Next Slide');
  viewport.append(prev, next);

  const progress = document.createElement('div');
  progress.className = 'carousel-stories-progress';
  progress.setAttribute('aria-hidden', 'true');
  const bar = document.createElement('div');
  bar.className = 'carousel-stories-progress-bar';
  progress.append(bar);
  block.append(progress);

  const step = () => {
    const card = track.querySelector('.carousel-stories-card');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max > 0 ? track.scrollLeft / max : 1;
    const visible = track.scrollWidth > 0 ? track.clientWidth / track.scrollWidth : 1;
    bar.style.width = `${Math.min(100, visible * 100)}%`;
    bar.style.transform = `translateX(${ratio * ((1 / Math.min(1, visible)) - 1) * 100}%)`;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
    block.classList.toggle('no-overflow', max <= 1);
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  new ResizeObserver(update).observe(track);
  update();
}
