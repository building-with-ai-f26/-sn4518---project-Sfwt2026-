/*
 * FlexWeek + wger: gets an exercise description from the wger REST API (https://wger.de/api/v2/).
 * wger is a free, public exercise database. Reading it needs no API key, so the browser calls it directly.
 *
 * Works in the browser (window.FlexWeekWger) and in Node (require) for tests.
 */
(function (root) {
  'use strict';

  const API = 'https://wger.de/api/v2/exercise-translation/';
  const ENGLISH = 2; // wger's id for the English language
  const TIMEOUT_MS = 8000; // give up after 8 seconds so "Loading…" can't hang forever

  /**
   * wger descriptions are HTML (<p>, <ul>, <ol>, <li>, <strong>, <em>). This turns one into plain text:
   * paragraphs become blank-line-separated blocks, list items become "• " or "1. " lines, and every
   * tag is removed. The page shows the result with textContent, so nothing from wger can run as code.
   */
  function htmlToText(html) {
    return String(html || '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/<ol\b[^>]*>(.*?)<\/ol\s*>/gi, (_, items) => {
        let n = 0;
        return items.replace(/<li\b[^>]*>/gi, () => '\n' + (++n) + '. ') + '\n\n';
      })
      .replace(/<li\b[^>]*>/gi, '\n• ')
      .replace(/<\/(p|ul|div|h[1-6])\s*>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&')
      .split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Makes the object the page uses to ask wger for descriptions.
   * fetchFn is the browser's fetch; tests pass a fake one so they never touch the network.
   */
  function createWgerClient(fetchFn) {
    // wgerId -> the request for it (a Promise). Kept in memory only, so it lasts until the page is closed.
    const cache = new Map();

    async function load(wgerId) {
      const url = API + '?format=json&language=' + ENGLISH + '&exercise=' + encodeURIComponent(wgerId);
      const response = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error('wger answered ' + response.status);
      const data = await response.json();
      const translation = data.results && data.results[0];
      return htmlToText(translation && translation.description);
    }

    /**
     * The description of one wger exercise as plain text ('' if wger has none in English).
     * Each exercise is requested once: later calls reuse the first request's answer.
     * A failed request is forgotten, so the next call tries again.
     */
    function description(wgerId) {
      if (!cache.has(wgerId)) {
        const request = load(wgerId);
        cache.set(wgerId, request);
        request.catch(() => cache.delete(wgerId));
      }
      return cache.get(wgerId);
    }

    return { description };
  }

  const api = { createWgerClient, htmlToText, API };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeekWger = api;
})(this);
