/* eslint-disable */
/* global WebImporter */

/**
 * Import script: Workday global header → /nav fragment (content/nav.plain.html).
 *
 * Builds a flat, semantic nav fragment from the source header on https://www.workday.com/:
 *   section 1  brand       – logo link
 *   section 2  navigation  – nested lists: top-level menu → level-1 items → level-2 details
 *                            (intro = description paragraph + link, overline group = label + list)
 *   section 3  language    – toggle icon, heading, current site, region → country → language links
 *   section 4  sign-in     – toggle icon, help icon + copy + link, product login links
 *   section 5  search      – toggle icon, placeholder/results link, close icon, quick links
 *   section 6  cta         – Contact Sales (bold link → primary button)
 *
 * The Region & Language list is rendered on the source only after clicking the globe, so it is
 * captured once (migration-work/navigation-validation/source-language-tree.json) and embedded here.
 * Logo and UI icons are SVGs served from the code bus (/icons) and referenced with the EDS icon
 * shorthand ":name:" followed by their label (used as alt text / accessible name). SVGs cannot be
 * served from content (Document Authoring / media bus), so they are not referenced as images.
 */

const TOP_LEVEL = ['Products', 'Industries', 'Customers', 'Resources', 'Partners', 'Company'];

const LANGUAGE_TREE = [
  {
    region: "Asia-Pacific & Japan",
    countries: [
      {
        country: "Australia",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-au/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Hong Kong",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-hk/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "India",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-in/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Indonesia",
        languages: [
          {
            label: "Bahasa Indonesia",
            href: "https://www.workday.com/en-sg/company/workday-for-indonesia.html",
            lang: null
          },
          {
            label: "English",
            href: "https://www.workday.com/en-sg/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "日本",
        languages: [
          {
            label: "日本語",
            href: "https://www.workday.com/ja-jp/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "대한민국",
        languages: [
          {
            label: "한국어",
            href: "https://www.workday.com/ko-kr/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Malaysia",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-sg/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "New Zealand",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-au/company/workday-for-new-zealand.html",
            lang: null
          }
        ]
      },
      {
        country: "Singapore",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-sg/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Taiwan",
        languages: [
          {
            label: "繁體中文",
            href: "https://www.workday.com/en-hk/pages/workday-for-taiwan.html",
            lang: null
          },
          {
            label: "English",
            href: "https://www.workday.com/en-hk/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Thailand",
        languages: [
          {
            label: "ประเทศไทย",
            href: "https://www.workday.com/en-sg/company/workday-for-thailand.html",
            lang: null
          },
          {
            label: "English",
            href: "https://www.workday.com/en-sg/homepage.html",
            lang: null
          }
        ]
      }
    ]
  },
  {
    region: "Europe, Middle East & Africa",
    countries: [
      {
        country: "Belgium",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-be/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Denmark",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-se/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Deutschland",
        languages: [
          {
            label: "Deutsch",
            href: "https://www.workday.com/de-de/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "España",
        languages: [
          {
            label: "Español",
            href: "https://www.workday.com/es-es/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Finland",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-se/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "France",
        languages: [
          {
            label: "Français",
            href: "https://www.workday.com/fr-fr/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Ireland",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-gb/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Italia",
        languages: [
          {
            label: "Italiano",
            href: "https://www.workday.com/it-it/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Luxembourg",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-be/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Nederland",
        languages: [
          {
            label: "Nederlands",
            href: "https://www.workday.com/nl-nl/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Norway",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-se/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Österreich",
        languages: [
          {
            label: "Deutsch",
            href: "https://www.workday.com/de-de/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Polska",
        languages: [
          {
            label: "Polski",
            href: "https://www.workday.com/pl-pl/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Saudi Arabia",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-ae/pages/workday-for-saudi-arabia.html",
            lang: null
          }
        ]
      },
      {
        country: "South Africa",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-za/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Sweden",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-se/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "Schweiz",
        languages: [
          {
            label: "Deutsch",
            href: "https://www.workday.com/de-de/homepage.html",
            lang: null
          },
          {
            label: "English",
            href: "https://www.workday.com/en-ch/homepage.html",
            lang: null
          },
          {
            label: "Français",
            href: "https://www.workday.com/fr-fr/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "United Arab Emirates",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-ae/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "United Kingdom",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-gb/homepage.html",
            lang: null
          }
        ]
      }
    ]
  },
  {
    region: "North America",
    countries: [
      {
        country: "Canada",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-ca/homepage.html",
            lang: null
          },
          {
            label: "Français",
            href: "https://www.workday.com/fr-ca/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "México",
        languages: [
          {
            label: "Español",
            href: "https://www.workday.com/es-mx/homepage.html",
            lang: null
          }
        ]
      },
      {
        country: "United States",
        languages: [
          {
            label: "English",
            href: "https://www.workday.com/en-us/homepage.html",
            lang: null
          }
        ]
      }
    ]
  }
];

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function el(document, tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  children.forEach((c) => e.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

function link(document, a) {
  return el(document, 'a', { href: a.getAttribute('href') }, [text(a)]);
}

/** Icon shorthand + label, e.g. ":wd-system-globe:Language and Region Selector". */
function icon(name, label) {
  return `:${name}:${label}`;
}

/** Level-2 details list (inside a level-1 submenu). */
function buildDetails(document, ul) {
  const out = el(document, 'ul');
  [...ul.querySelectorAll(':scope > li')].forEach((li) => {
    const a = li.querySelector(':scope > h3 > a, :scope > h4 > a, :scope > a');
    const desc = li.querySelector(':scope > .cmp-navigation-v2__item-description');
    const group = li.querySelector(':scope > ul');
    if (a && desc) {
      // intro: description + link
      out.append(el(document, 'li', {}, [el(document, 'p', {}, [text(desc)]), el(document, 'p', {}, [link(document, a)])]));
    } else if (a && text(a)) {
      out.append(el(document, 'li', {}, [link(document, a)]));
    } else if (group) {
      const overline = text(li.querySelector(':scope > h4.overline, :scope > .overline'));
      const links = [...group.querySelectorAll(':scope > li')]
        .map((g) => g.querySelector(':scope > h3 > a, :scope > h4 > a, :scope > a'))
        .filter((ga) => ga && text(ga));
      if (overline) {
        const inner = el(document, 'ul', {}, links.map((ga) => el(document, 'li', {}, [link(document, ga)])));
        out.append(el(document, 'li', {}, [overline, inner]));
      } else {
        links.forEach((ga) => out.append(el(document, 'li', {}, [link(document, ga)])));
      }
    }
  });
  return out;
}

/** Level-1 flyout list for one top-level menu. */
function buildFlyout(document, ul) {
  const out = el(document, 'ul');
  [...ul.querySelectorAll(':scope > li')].forEach((li) => {
    const a = li.querySelector(':scope > h3 > a, :scope > h4 > a, :scope > a');
    const btn = li.querySelector(':scope > h3 > button, :scope > button');
    const sub = li.querySelector(':scope > ul, :scope > div > ul');
    if (btn && sub) {
      out.append(el(document, 'li', {}, [text(btn), buildDetails(document, sub)]));
    } else if (a && text(a)) {
      out.append(el(document, 'li', {}, [link(document, a)]));
    } else if (!a && !btn && sub) {
      // secondary link group (e.g. Products → Workday ERP …): unlabelled nested list, smaller links
      const links = [...sub.querySelectorAll(':scope > li')]
        .map((g) => g.querySelector(':scope > h3 > a, :scope > h4 > a, :scope > a'))
        .filter((ga) => ga && text(ga));
      out.append(el(document, 'li', {}, [el(document, 'ul', {}, links.map((ga) => el(document, 'li', {}, [link(document, ga)])))]));
    }
  });
  return out;
}

export default {
  transform: ({ document, params }) => {
    const root = el(document, 'div');
    const hr = () => root.append(el(document, 'hr'));

    // 1. brand
    root.append(el(document, 'p', {}, [el(document, 'a', { href: '/' }, [icon('workday-logo', 'Workday')])]));
    hr();

    // 2. navigation
    const nav = document.querySelector('nav.cmp-navigation-v2');
    const topUl = el(document, 'ul');
    [...nav.querySelectorAll(':scope > ul > li')].forEach((li) => {
      const btn = li.querySelector(':scope > button, :scope > h2 > button, :scope > h3 > button');
      const label = text(btn);
      if (!TOP_LEVEL.includes(label)) return;
      const sub = li.querySelector(':scope > ul');
      topUl.append(el(document, 'li', {}, [label, buildFlyout(document, sub)]));
    });
    root.append(topUl);
    hr();

    // 3. language
    const langBtn = document.querySelector('.language-toggle');
    root.append(el(document, 'p', {}, [icon('wd-system-globe', langBtn.getAttribute('aria-label') || 'Language and Region Selector')]));
    root.append(el(document, 'p', {}, [el(document, 'strong', {}, ['Region & Language'])]));
    root.append(el(document, 'p', {}, ['Current website: ', el(document, 'strong', {}, ['United States (English)'])]));
    root.append(el(document, 'ul', {}, LANGUAGE_TREE.map((r) => el(document, 'li', {}, [
      r.region,
      el(document, 'ul', {}, r.countries.map((c) => el(document, 'li', {}, [
        c.country,
        el(document, 'ul', {}, (c.languages || []).map((l) => el(document, 'li', {}, [el(document, 'a', { href: l.href }, [l.label])]))),
      ]))),
    ]))));
    hr();

    // 4. sign-in
    const signBtn = document.querySelector('.cmp-sign-in-menu__toggle');
    const sign = document.querySelector('.cmp-sign-in-menu');
    // toggle icon + the mobile menu label ("Sign in") from the source's mobile-only nav entry
    const signLabel = text([...nav.querySelectorAll(':scope > ul > li.mobile-only button')].find((b) => b.closest('.cmp-sign-in')));
    root.append(el(document, 'p', {}, [icon('wd-system-user', signLabel || signBtn.getAttribute('aria-label') || 'Sign in')]));
    root.append(el(document, 'p', {}, [icon('wd-accent-life-saver', 'Sign-in help')]));
    root.append(el(document, 'p', {}, [el(document, 'strong', {}, [text(sign.querySelector('strong'))])]));
    const helpP = [...sign.querySelectorAll('p')].find((p) => text(p).startsWith('To access'));
    root.append(el(document, 'p', {}, [text(helpP)]));
    const more = [...sign.querySelectorAll('a')].find((a) => /signin\.html/.test(a.getAttribute('href') || ''));
    root.append(el(document, 'p', {}, [el(document, 'a', { href: more.getAttribute('href') }, [text(more)])]));
    root.append(el(document, 'p', {}, [el(document, 'strong', {}, [text(sign.querySelector('.overline'))])]));
    root.append(el(document, 'ul', {}, [...sign.querySelectorAll('a.cmp-sign-in-menu__sections__section-link')]
      .map((a) => el(document, 'li', {}, [link(document, a)]))));
    hr();

    // 5. search
    const box = document.querySelector('atomic-search-box');
    root.append(el(document, 'p', {}, [icon('wd-system-search-sparkle', document.querySelector('.cmp-search-v2__toggle').getAttribute('aria-label') || 'Search')]));
    root.append(el(document, 'p', {}, [el(document, 'a', { href: box.getAttribute('redirection-url') }, [box.getAttribute('data-placeholder')])]));
    root.append(el(document, 'p', {}, [icon('wd-system-x', 'Close search')]));
    const quick = [...document.querySelectorAll('a.quicklink-link')];
    const quickLabel = text(quick[0].closest('div, section').querySelector('span, h2, h3, h4'));
    root.append(el(document, 'p', {}, [el(document, 'strong', {}, [quickLabel || 'Quick Links'])]));
    const seen = new Set();
    root.append(el(document, 'ul', {}, quick.filter((a) => !seen.has(text(a)) && seen.add(text(a)))
      .map((a) => el(document, 'li', {}, [link(document, a)]))));
    hr();

    // 6. cta
    const cta = document.querySelector('.cmp-getstarted a');
    const ctaHref = cta.getAttribute('href').replace(/^\/\//, 'https://');
    root.append(el(document, 'p', {}, [el(document, 'strong', {}, [el(document, 'a', { href: ctaHref }, [text(cta)])])]));

    document.body.replaceChildren(root);
    return [{
      element: document.body,
      path: '/nav',
      report: { title: 'nav', topLevel: topUl.children.length },
    }];
  },
};
