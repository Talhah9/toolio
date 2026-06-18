import { useEffect } from 'react';

const SITE_NAME  = 'Savvly';
const SITE_URL   = 'https://savvly.co';
const OG_IMAGE   = 'https://savvly.co/og-image.png';

/** Update a <meta> tag's content. Returns a cleanup fn. */
function patchMeta(attr, key, value) {
  const sel = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(sel);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content') || '';
  el.setAttribute('content', value);
  return () => {
    if (created) el.remove();
    else el.setAttribute('content', prev);
  };
}

/** Update <link rel="canonical">. Returns a cleanup fn. */
function patchCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('href') || '';
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else el.setAttribute('href', prev);
  };
}

/**
 * Sets document.title, meta description, Open Graph, Twitter Card,
 * and canonical URL. Restores previous values on unmount.
 *
 * @param {object} opts
 * @param {string}  opts.title       — page title (appended with " — Savvly")
 * @param {string}  opts.description — meta description (< 155 chars)
 * @param {string}  opts.path        — canonical path, e.g. "/blog/mon-article"
 * @param {string} [opts.image]      — absolute OG image URL (defaults to og-image.png)
 * @param {string} [opts.type]       — og:type (default "website", use "article" for blog posts)
 */
export function usePageSeo({ title, description, path, image, type = 'website' }) {
  useEffect(() => {
    if (!title || !description) return;

    const fullTitle  = `${title} — ${SITE_NAME}`;
    const canonical  = `${SITE_URL}${path}`;
    const ogImage    = image || OG_IMAGE;

    const prevTitle  = document.title;
    document.title   = fullTitle;

    const restores = [
      patchMeta('name',     'description',        description),
      patchMeta('property', 'og:title',           fullTitle),
      patchMeta('property', 'og:description',     description),
      patchMeta('property', 'og:type',            type),
      patchMeta('property', 'og:url',             canonical),
      patchMeta('property', 'og:image',           ogImage),
      patchMeta('property', 'og:site_name',       SITE_NAME),
      patchMeta('name',     'twitter:card',       'summary_large_image'),
      patchMeta('name',     'twitter:title',      fullTitle),
      patchMeta('name',     'twitter:description', description),
      patchMeta('name',     'twitter:image',      ogImage),
      patchCanonical(canonical),
    ];

    return () => {
      document.title = prevTitle;
      restores.forEach(r => r());
    };
  }, [title, description, path, image, type]);
}
