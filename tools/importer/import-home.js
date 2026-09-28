/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsAnnouncementParser from './parsers/columns-announcement.js';
import heroCarouselParser from './parsers/hero-carousel.js';
import accordionPersonaParser from './parsers/accordion-persona.js';
import columnsMediaParser from './parsers/columns-media.js';
import carouselStoriesParser from './parsers/carousel-stories.js';

// TRANSFORMER IMPORTS
import workdayCleanupTransformer from './transformers/workday-cleanup.js';
import workdayDmImagesTransformer from './transformers/workday-dm-images.js';
import workdaySectionsTransformer from './transformers/workday-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-announcement': columnsAnnouncementParser,
  'hero-carousel': heroCarouselParser,
  'accordion-persona': accordionPersonaParser,
  'columns-media': columnsMediaParser,
  'carousel-stories': carouselStoriesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "Workday homepage: announcement bar, split hero with rotating media, persona accordion, AI agents feature, customer stories carousel, closing CTA",
  "urls": [
    "https://www.workday.com/"
  ],
  "blocks": [
    {
      "name": "columns-announcement",
      "instances": [
        ".announcement-carousel-v2 .announcement-bar-v2__wrapper-container"
      ]
    },
    {
      "name": "hero-carousel",
      "instances": [
        "main > .aem-Grid > .section-v3:has(.slider) > .cmp-section-v3 > .aem-Grid > .columncontrol"
      ]
    },
    {
      "name": "accordion-persona",
      "instances": [
        ".persona"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "main > .aem-Grid > .section-v3:has(.lottie) > .cmp-section-v3 > .aem-Grid > .columncontrol"
      ]
    },
    {
      "name": "carousel-stories",
      "instances": [
        ".newCarousel"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc5",
      "name": "announcement-bar",
      "selector": [
        "main > .aem-Grid > .announcement-carousel-v2"
      ],
      "style": null,
      "blocks": [
        "columns-announcement"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "hero",
      "selector": [
        "main > .aem-Grid > .section-v3:has(.slider)",
        "main > .aem-Grid > .section-v3:nth-child(2)"
      ],
      "style": "dark",
      "blocks": [
        "hero-carousel"
      ],
      "defaultContent": []
    },
    {
      "id": "rc7",
      "name": "persona-explorer",
      "selector": [
        "main > .aem-Grid > .section-v3:has(.persona)",
        "main > .aem-Grid > .section-v3:nth-child(3)"
      ],
      "style": "gradient-dark-to-pink",
      "blocks": [
        "accordion-persona"
      ],
      "defaultContent": [
        ".section-v3:has(.persona) .cmp-text"
      ]
    },
    {
      "id": "rc8",
      "name": "ai-agents",
      "selector": [
        "main > .aem-Grid > .section-v3:has(.lottie)",
        "main > .aem-Grid > .section-v3:nth-child(4)"
      ],
      "style": "dark",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "rc9",
      "name": "customer-stories",
      "selector": [
        "main > .aem-Grid > .section-v3:has(.newCarousel)",
        "main > .aem-Grid > .section-v3:nth-child(5)"
      ],
      "style": "gradient-dark-to-pink",
      "blocks": [
        "carousel-stories"
      ],
      "defaultContent": [
        ".section-v3:has(.newCarousel) .cmp-text",
        ".section-v3:has(.newCarousel) .button.align-center"
      ]
    },
    {
      "id": "rc10",
      "name": "closing-cta",
      "selector": [
        "main > .aem-Grid > .section-v3:has(.cta-block)",
        "main > .aem-Grid > .section-v3:last-child"
      ],
      "style": "dark",
      "blocks": [],
      "defaultContent": [
        ".cta-block"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY
// Cleanup first; DM images convert Scene7 <img> to carrier links after parsing;
// sections transformer inserts breaks (before) and Section Metadata (after).
const transformers = [
  workdayCleanupTransformer,
  workdayDmImagesTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [workdaySectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup, DM carrier links, Section Metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
