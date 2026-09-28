/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-carousel. Base: hero.
 * Source: https://www.workday.com/ (first .columncontrol in the .slider section)
 * Content model:
 *   Row 1 (1 cell): H1, intro paragraph(s), CTA link
 *   Rows 2..n (2 cells): [poster image + video link] | [optional logo image, caption paragraph, link]
 * The intro row is padded with an empty second cell so every row has 2 columns;
 * decorate() merges all intro cells.
 * Generated: 2026-09-28
 */

const BC_DEFAULT_ACCOUNT = '6415614912001';
const BC_DEFAULT_PLAYER = 'i1mFTzT6O';

function brightcoveUrl(videoId, account, player, embed) {
  if (!videoId) return null;
  return `https://players.brightcove.net/${account || BC_DEFAULT_ACCOUNT}/${player || BC_DEFAULT_PLAYER}_${embed || 'default'}/index.html?videoId=${videoId}`;
}

function normalizeAlt(img) {
  if (img && /^['"]{2}$/.test((img.getAttribute('alt') || '').trim())) img.setAttribute('alt', '');
}

// Remove decorative inline SVG data-URI icons (arrows / play icons) from links
function stripIcons(root) {
  root.querySelectorAll('img[src^="data:image/svg"]').forEach((i) => i.remove());
}

function makeLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  const p = document.createElement('p');
  p.append(a);
  return p;
}

function buildMediaCell(slide, document) {
  const cell = [];
  const player = slide.querySelector('video-js, .video-js, [data-video-id]');
  // Poster: video poster picture, else the slide's static image
  let poster = null;
  if (player) {
    poster = player.querySelector('.vjs-poster img, picture img, img');
    if (!poster) {
      const posterSrc = player.getAttribute('poster');
      if (posterSrc) {
        poster = document.createElement('img');
        poster.src = posterSrc;
        poster.alt = '';
      }
    }
  }
  if (!poster) {
    poster = slide.querySelector(':scope > img, img.carousel-slide-image, :scope > picture img');
  }
  if (poster) {
    normalizeAlt(poster);
    const pic = poster.closest('picture');
    cell.push(pic && pic.contains(poster) && !pic.closest('.carousel-content') ? pic : poster);
  }

  // Video link: modal "Play Video" overlay takes precedence, else the inline Brightcove player
  const overlay = slide.querySelector('.video-play-overlay a, a.play-video-btn, a[data-video-src]');
  const account = player && player.getAttribute('data-account');
  const bcPlayer = player && player.getAttribute('data-player');
  const embed = player && player.getAttribute('data-embed');
  if (overlay && overlay.getAttribute('data-video-src')) {
    const url = brightcoveUrl(overlay.getAttribute('data-video-src'), account, bcPlayer, embed);
    const label = overlay.textContent.replace(/\s+/g, ' ').trim() || 'Play Video';
    cell.push(makeLink(document, url, label));
  } else if (player && player.getAttribute('data-video-id')) {
    const url = brightcoveUrl(player.getAttribute('data-video-id'), account, bcPlayer, embed);
    cell.push(makeLink(document, url, 'Play Video'));
  }
  return cell;
}

function buildCaptionCell(slide) {
  const cell = [];
  const content = slide.querySelector('.carousel-content, .card-parsys, .validation-component__wrapper') || slide;
  const logo = content.querySelector('.validation-component__wrapper-logo img, .logo-content__wrapper img');
  if (logo) {
    normalizeAlt(logo);
    cell.push(logo);
  }
  const desc = content.querySelector('.validation-component__wrapper-description, .cmp-text');
  if (desc) {
    desc.querySelectorAll('p, h2, h3, h4').forEach((p) => {
      if (p.textContent.trim()) cell.push(p);
    });
  }
  const linkWrap = content.querySelector('.validation-component__wrapper-link');
  const links = linkWrap ? [...linkWrap.querySelectorAll('a[href]')] : [];
  links.forEach((a) => {
    stripIcons(a);
    if (a.textContent.trim()) cell.push(a);
  });
  return cell;
}

export default function parse(element, { document }) {
  const cols = [...element.querySelectorAll(':scope > .row > .col, :scope > div > .col')];
  const introCol = cols.find((c) => c.querySelector('h1')) || cols[0] || element;
  const slidesRoot = element.querySelector('.carousel-slides-wrapper, .carousel-section, .slider') || element;

  // Intro row: H1, non-empty paragraphs, CTA buttons
  const intro = [];
  const introText = introCol.querySelector('.cmp-text') || introCol;
  introText.querySelectorAll('h1, h2, h3, p').forEach((el) => {
    if (el.closest('.carousel-slide')) return;
    if (el.textContent.trim()) intro.push(el);
  });
  // Personalized hero variants author the headline as <p><span class="title-N">;
  // promote the first paragraph to H1 so the page always keeps one.
  if (intro.length && !intro.some((el) => el.tagName === 'H1') && intro[0].tagName === 'P') {
    const h1 = document.createElement('h1');
    h1.innerHTML = intro[0].innerHTML;
    intro[0] = h1;
  }
  introCol.querySelectorAll('.button a[href], .cmp-button a[href]').forEach((a) => {
    if (a.closest('.carousel-slide')) return;
    stripIcons(a);
    if (a.textContent.trim()) intro.push(a);
  });

  const slides = [...slidesRoot.querySelectorAll('.carousel-slide')];

  if (!intro.length && !slides.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([intro, '']);
  slides.forEach((slide) => {
    const media = buildMediaCell(slide, document);
    const caption = buildCaptionCell(slide);
    if (!media.length && !caption.length) return;
    cells.push([media.length ? media : '', caption.length ? caption : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-carousel', cells });
  element.replaceWith(block);
}
