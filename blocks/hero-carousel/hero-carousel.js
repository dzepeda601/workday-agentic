import { fetchPlaceholders, unnestParagraphs } from '../../scripts/shared.js';

const ROTATE_INTERVAL = 8000;
let heroCarouselId = 0;

function isVideoFile(href) {
  try {
    return /\.(mp4|webm)$/i.test(new URL(href, window.location.href).pathname);
  } catch (e) {
    return false;
  }
}

/**
 * Turn a media cell (poster picture + optional video link) into a media frame.
 * Direct video files become an inline <video>; other video links (players, hosted
 * pages) stay as an authored link styled as a play control over the poster.
 */
function buildMedia(cell) {
  cell.className = 'hero-carousel-slide-media';
  const pic = cell.querySelector('picture');
  const link = cell.querySelector('a[href]');
  if (!link) return;

  link.classList.remove('button', 'primary', 'secondary');
  link.classList.add('hero-carousel-play');
  const container = link.closest('.button-container');
  if (container) container.classList.remove('button-container');

  // icon + label as separate flex items (label text stays the accessible name)
  const icon = document.createElement('span');
  icon.className = 'hero-carousel-play-icon';
  icon.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'hero-carousel-play-label';
  label.append(...link.childNodes);
  link.append(icon, label);

  if (isVideoFile(link.href)) {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'none';
    const img = pic && pic.querySelector('img');
    if (img) video.poster = img.currentSrc || img.src;
    const source = document.createElement('source');
    source.src = link.href;
    video.append(source);
    video.setAttribute('aria-label', link.textContent.trim());
    cell.prepend(video);
    if (pic) pic.remove();
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (video.paused) video.play();
      else video.pause();
    });
  }
}

/**
 * Logos render at a fixed 24px height. Scene7 pads renditions requested wider than the
 * asset (e.g. wid=2000), so request logo renditions by height (2x for retina) instead.
 */
function sizeLogo(picture) {
  const byHeight = (url) => url.replace(/([?&])wid=\d+/, '$1hei=48');
  picture.querySelectorAll('source[srcset*="/is/image/"]').forEach((source) => {
    source.srcset = byHeight(source.getAttribute('srcset'));
  });
  const img = picture.querySelector('img[src*="/is/image/"]');
  if (img) img.src = byHeight(img.getAttribute('src'));
}

function buildSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'hero-carousel-slide';
  slide.id = `hero-carousel-${id}-slide-${idx}`;
  slide.dataset.slideIndex = idx;
  const cells = [...row.children];
  const [media, caption] = cells;
  if (media) {
    buildMedia(unnestParagraphs(media));
    slide.append(media);
  }
  if (caption) {
    unnestParagraphs(caption);
    caption.className = 'hero-carousel-slide-caption';
    // Caption links are text links, not buttons.
    caption.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    caption.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
    // Logo = a paragraph holding only a picture (optional; the Sana slide is text-only).
    const logo = [...caption.querySelectorAll(':scope > p')]
      .find((p) => p.querySelector('picture') && !p.textContent.trim());
    if (logo) {
      logo.classList.add('hero-carousel-slide-logo');
      sizeLogo(logo.querySelector('picture'));
    }
    slide.append(caption);
  }
  cells.slice(2).forEach((extra) => slide.append(extra));
  return slide;
}

/**
 * Hero with a rotating media panel.
 * Row 1: intro (H1, text, CTA). Rows 2..n: [media: poster + video link] | [logo, caption, link].
 * @param {Element} block
 */
export default async function decorate(block) {
  heroCarouselId += 1;
  const id = heroCarouselId;
  const rows = [...block.children];
  const introRow = rows.find((row) => row.querySelector('h1')) || rows[0];
  const slideRows = rows.filter((row) => row !== introRow);

  const intro = document.createElement('div');
  intro.className = 'hero-carousel-intro';
  if (introRow) [...introRow.children].forEach((cell) => intro.append(...cell.childNodes));

  const panel = document.createElement('div');
  panel.className = 'hero-carousel-stage';
  const slides = document.createElement('ul');
  slides.className = 'hero-carousel-slides';
  slideRows.forEach((row, idx) => slides.append(buildSlide(row, idx, id)));
  panel.append(slides);

  block.replaceChildren(intro);
  if (!slideRows.length) {
    block.classList.add('no-slides');
    return;
  }
  block.append(panel);

  const slideEls = [...slides.children];
  let active = 0;
  let timer;

  const placeholders = await fetchPlaceholders();
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const indicators = document.createElement('ol');
  indicators.className = 'hero-carousel-indicators';

  const show = (index) => {
    active = (index + slideEls.length) % slideEls.length;
    slideEls.forEach((slide, i) => {
      const isActive = i === active;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.querySelectorAll('a, button, video').forEach((el) => {
        if (isActive) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
      if (!isActive) slide.querySelectorAll('video').forEach((v) => v.pause());
    });
    [...indicators.children].forEach((li, i) => {
      const btn = li.querySelector('button');
      if (i === active) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  };

  show(0);
  if (slideEls.length < 2) return;

  slideEls.forEach((slide, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-controls', slide.id);
    btn.setAttribute('aria-label', `${placeholders.showSlide || 'Show Slide'} ${i + 1} ${placeholders.of || 'of'} ${slideEls.length}`);
    btn.addEventListener('click', () => show(i));
    li.append(btn);
    indicators.append(li);
  });
  show(0);

  const controls = document.createElement('div');
  controls.className = 'hero-carousel-controls';
  controls.append(indicators);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    const pauseLabel = placeholders.pauseCarousel || 'Pause';
    const playLabel = placeholders.playCarousel || 'Play';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hero-carousel-toggle';
    toggle.setAttribute('aria-label', pauseLabel);
    toggle.setAttribute('aria-pressed', 'false');

    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => show(active + 1), ROTATE_INTERVAL);
    };
    const stop = () => clearInterval(timer);

    toggle.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') === 'true';
      toggle.setAttribute('aria-pressed', String(!paused));
      toggle.setAttribute('aria-label', paused ? pauseLabel : playLabel);
      block.classList.toggle('is-paused', !paused);
      if (paused) start();
      else stop();
    });
    panel.addEventListener('mouseenter', stop);
    panel.addEventListener('focusin', stop);
    panel.addEventListener('mouseleave', () => { if (!block.classList.contains('is-paused')) start(); });
    panel.addEventListener('focusout', () => { if (!block.classList.contains('is-paused')) start(); });
    controls.append(toggle);
    start();
  }

  indicators.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
  panel.append(controls);
}
