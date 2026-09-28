/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns.
 * Source: https://www.workday.com/ (.columncontrol in the .lottie section)
 * Content model: 1 row x 2 cells: [H2 headline, paragraph, CTA link] | [poster image + video link]
 * The headline is authored on source as <p><span class="title-2">; it is promoted to <h2>.
 * Video is Brightcove: id on .lottie__wrapper[data-videoid] (or video-js[data-video-id]).
 * Generated: 2026-09-28
 */

const BC_DEFAULT_ACCOUNT = '6415614912001';
const BC_DEFAULT_PLAYER = 'i1mFTzT6O';
// AEM DAM folder holding Brightcove renditions (shared by all Workday homepage videos)
const BC_DAM_FOLDER = '643f0f0978bdbb26dc8f4e61';

function brightcoveUrl(videoId, account, player, embed) {
  return `https://players.brightcove.net/${account || BC_DEFAULT_ACCOUNT}/${player || BC_DEFAULT_PLAYER}_${embed || 'default'}/index.html?videoId=${videoId}`;
}

export default function parse(element, { document }) {
  const cols = [...element.querySelectorAll(':scope > .row > .col, :scope > div > .col')];
  const mediaCol = cols.find((c) => c.querySelector('.lottie, video-js, .video-js, [data-videoid], [data-video-id]'))
    || cols[1];
  const textCol = cols.find((c) => c !== mediaCol) || element;

  // Text cell
  const textCell = [];
  const textRoot = textCol.querySelector('.cmp-text') || textCol;
  let headingDone = false;
  textRoot.querySelectorAll('h1, h2, h3, h4, p').forEach((el) => {
    if (!el.textContent.trim()) return;
    if (/^H[1-4]$/.test(el.tagName)) {
      headingDone = true;
      textCell.push(el);
      return;
    }
    // Promote the first title-styled paragraph to H2
    if (!headingDone && el.querySelector('[class*="title-"]')) {
      const h2 = document.createElement('h2');
      h2.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      headingDone = true;
      textCell.push(h2);
      return;
    }
    textCell.push(el);
  });
  textCol.querySelectorAll('.button a[href], .cmp-button a[href]').forEach((a) => {
    a.querySelectorAll('img[src^="data:image/svg"]').forEach((i) => i.remove());
    if (!a.textContent.trim()) return;
    // Outline CTAs (marked by the cleanup transformer) are authored italic → secondary button
    if (a.getAttribute('data-wd-button') === 'secondary') {
      a.removeAttribute('data-wd-button');
      const em = document.createElement('em');
      em.append(a);
      const p = document.createElement('p');
      p.append(em);
      textCell.push(p);
      return;
    }
    textCell.push(a);
  });

  // Media cell
  const mediaCell = [];
  if (mediaCol) {
    const player = mediaCol.querySelector('video-js, .video-js');
    const wrapper = mediaCol.querySelector('[data-videoid]');
    const videoId = (player && player.getAttribute('data-video-id'))
      || (wrapper && wrapper.getAttribute('data-videoid'));
    const accountId = (player && player.getAttribute('data-account'))
      || (wrapper && wrapper.getAttribute('data-accountid')) || BC_DEFAULT_ACCOUNT;

    // Poster: the Brightcove player only injects a (signed, expiring) poster before autoplay
    // starts, so prefer the stable AEM DAM rendition of the Brightcove asset.
    let posterSrc = player && player.getAttribute('poster');
    if (!posterSrc && videoId) {
      posterSrc = `https://www.workday.com/content/dam/brightcove_assets/${accountId}/${BC_DAM_FOLDER}/${videoId}.mp4/jcr:content/renditions/brc_poster.png`;
    }
    let poster = null;
    if (posterSrc) {
      poster = document.createElement('img');
      poster.src = posterSrc;
      poster.alt = '';
    } else {
      poster = [...mediaCol.querySelectorAll('.vjs-poster img, .fallback img, img')]
        .find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:'));
    }
    if (poster) {
      if (!poster.hasAttribute('alt')) poster.setAttribute('alt', '');
      mediaCell.push(poster);
    }

    if (videoId) {
      const url = brightcoveUrl(
        videoId,
        accountId,
        player && player.getAttribute('data-player'),
        player && player.getAttribute('data-embed'),
      );
      const a = document.createElement('a');
      a.href = url;
      a.textContent = 'Play Video';
      const p = document.createElement('p');
      p.append(a);
      mediaCell.push(p);
    }
  }

  if (!textCell.length && !mediaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', mediaCell.length ? mediaCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
