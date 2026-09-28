import { unnestParagraphs } from '../../scripts/shared.js';

function isVideoFile(href) {
  try {
    return /\.(mp4|webm)$/i.test(new URL(href, window.location.href).pathname);
  } catch (e) {
    return false;
  }
}

/**
 * Media cell: poster picture + optional video link. Direct video files become an
 * autoplaying, muted, looping <video> (static poster when reduced motion is preferred);
 * other video links stay as an authored link over the poster.
 */
function buildMedia(cell) {
  cell.classList.add('columns-media-media');
  const pic = cell.querySelector('picture');
  const link = cell.querySelector('a[href]');
  if (!link) return;

  link.classList.remove('button', 'primary', 'secondary');
  link.closest('.button-container')?.classList.remove('button-container');

  if (!isVideoFile(link.href)) {
    link.classList.add('columns-media-play');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = !reduceMotion;
  video.preload = reduceMotion ? 'none' : 'metadata';
  video.setAttribute('aria-label', link.textContent.trim());
  const img = pic && pic.querySelector('img');
  if (img) video.poster = img.currentSrc || img.src;
  const source = document.createElement('source');
  source.src = link.href;
  video.append(source);

  cell.replaceChildren(video);
}

/**
 * Two columns: [H2, paragraph, CTA] | [poster image + video link].
 * The cell holding media (picture or video link without heading) is treated as the media side.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    [...row.children].forEach((cell) => {
      unnestParagraphs(cell);
      const hasHeading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      const hasMedia = cell.querySelector('picture, video')
        || [...cell.querySelectorAll('a[href]')].some((a) => isVideoFile(a.href));
      if (hasMedia && !hasHeading) {
        buildMedia(cell);
      } else {
        cell.classList.add('columns-media-text');
      }
    });
  });
}
