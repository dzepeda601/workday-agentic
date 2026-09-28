/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Workday site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.workday.com/).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays, tracking and widgets that can interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      '#utag', // <div id="utag"> (Tealium) - first child of body
      '.cmp-consentprompt', // <div class="cmp-consentprompt consent-prompt master"> cookie consent overlay
      '#hb_chatbot-root', // <div id="hb_chatbot-root"> chatbot widget
      '#ClickTaleDiv', // <div id="ClickTaleDiv"> analytics
      '[id^="batBeacon"]', // <div id="batBeacon71348543937"> Bing tracking beacon
      'iframe', // #db-sync, #li_sync_frame, doubleclick iframes (all outside main)
      '#redirectCookieDetails', // <input id="redirectCookieDetails">
    ]);

    // Video.js / Brightcove player chrome (keep <video-js>, video.vjs-tech and .vjs-poster).
    WebImporter.DOMUtils.remove(element, [
      '.vjs-control-bar',
      '.vjs-big-play-button',
      '.vjs-loading-spinner',
      '.vjs-text-track-display',
      '.vjs-title-bar',
      '.vjs-modal-dialog', // error display, player-info modal, text-track settings
    ]);

    // Outline CTAs (<a class="wd-btn btn btn--outline__white">) - mark them so the
    // afterTransform pass can author them as italic links (EDS secondary button).
    element.querySelectorAll('a[class*="btn--outline"]').forEach((a) => {
      a.setAttribute('data-wd-button', 'secondary');
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome: header, footer and the experience fragments that wrap them.
    WebImporter.DOMUtils.remove(element, [
      '.header-wrapper', // <div class="header-wrapper"> global header
      'header.cmp-header-container-v2', // <header class="cmp-header-container-v2">
      '.cmp-page__skiptomaincontent', // skip-to-main-content link
      'footer.cmp-footer-v2', // <footer class="cmp-footer-v2 footer-container__wrapper">
      '.experience-fragment', // 3 header XFs (fixpatch + header) and 1 footer XF; none inside <main>
    ]);

    // Decorative section backgrounds (empty divs inside each .section-v3).
    WebImporter.DOMUtils.remove(element, [
      '.horizon', // <div class="horizon none none horizon--top|--bottom ...">
      '.section-v3 > .section__wrapper:empty',
    ]);

    // Default-content headlines authored as <p><span class="title-N">…</span> …</p>
    // ("Turning AI into ROI.", "Ready to talk? Get in touch."). Promote the span to an
    // <h2> placed before the paragraph; any remaining text stays in the <p>.
    // Block tables are skipped - parsers already emit their own headings.
    const doc = element.ownerDocument;
    element.querySelectorAll('p > span[class^="title-"]').forEach((span) => {
      const p = span.parentElement;
      if (p.closest('table')) return;
      const h2 = doc.createElement('h2');
      h2.innerHTML = span.innerHTML.replace(/(<br\s*\/?>\s*)+$/i, '').trim();
      p.before(h2);
      span.remove();
      if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
    });

    // Outline CTAs marked in beforeTransform: wrap a standalone link in <em>.
    element.querySelectorAll('a[data-wd-button="secondary"]').forEach((a) => {
      a.removeAttribute('data-wd-button');
      const parent = a.parentElement;
      if (!parent || parent.tagName === 'EM') return;
      if (parent.textContent.trim() !== a.textContent.trim()) return;
      const em = doc.createElement('em');
      a.replaceWith(em);
      em.append(a);
    });

    // Safe leftover elements.
    WebImporter.DOMUtils.remove(element, ['link', 'noscript', 'source']);
  }
}
