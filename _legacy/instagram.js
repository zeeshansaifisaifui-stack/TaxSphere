/* ==========================================================================
   TaxSphere Consultancy — Instagram surfaces
   --------------------------------------------------------------------------
   Injects (no index.html edit required):
     1. an Instagram row into the Contact "info-list"
     2. the real href on the footer Instagram button (currently href="#")
     3. a follow modal + its opening triggers
     4. a floating Instagram button (bottom-left, opposite .fab-stack)
     5. an 8-second post-enquiry nudge

   Load AFTER SOCIAL-LINKS.js and script.js.
   ========================================================================== */

(function () {
  'use strict';

  var S = window.__TAXSPHERE_SOCIAL__ || {};
  var IG = String(
    S.instagram || window.__TAXSPHERE_INSTAGRAM__ ||
    'https://www.instagram.com/taxsphere11'
  ).replace(/[?#].*$/, '');            // strip any tracking query string
  var HANDLE = 'taxsphere11';

  /* Safety hook: never ship a modal that points at an empty/placeholder URL. */
  var PLACEHOLDER = !/^https:\/\/(www\.)?instagram\.com\//.test(IG) ||
                    IG.replace(/\/$/, '') === 'https://www.instagram.com';

  var GATE_KEY = 'ts_ig_nudge_at';
  var GATE_DAYS = 30;

  /* ---------- storage helpers (private-mode safe) ---------- */
  function readGate() {
    try { return +window.localStorage.getItem(GATE_KEY) || 0; }
    catch (e) { return 0; }
  }
  function writeGate(v) {
    try { window.localStorage.setItem(GATE_KEY, String(v)); }
    catch (e) { /* storage disabled */ }
  }
  /* true => an automatic open is still allowed */
  function dismissGate() {
    if (PLACEHOLDER) { return false; }
    var t = readGate();
    return !t || (Date.now() - t) > GATE_DAYS * 864e5;
  }
  function markSeen() { writeGate(Date.now()); }

  /* ---------- one reusable Instagram glyph ---------- */
  function glyph(color) {
    return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
      '<path fill="' + (color || 'currentColor') + '" d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.55.21.95.47 1.36.88.41.41.67.81.88 1.36.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.21.55-.47.95-.88 1.36-.41.41-.81.67-1.36.88-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.7 3.7 0 0 1-1.36-.88 3.7 3.7 0 0 1-.88-1.36c-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.21-.55.47-.95.88-1.36.41-.41.81-.67 1.36-.88.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.98c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.37a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Zm0 1.98a3.47 3.47 0 1 0 0 6.94 3.47 3.47 0 0 0 0-6.94Zm5.67-3.46a1.27 1.27 0 1 1 0 2.54 1.27 1.27 0 0 1 0-2.54Z"/>' +
      '</svg>';
  }

  /* ======================================================================
     1 — Contact info card
     Real structure: <div class="info-list"> … 4× .info-card … <div class="map-wrap">
     Insert the Instagram row directly before the map.
     ====================================================================== */
  function injectContactCard() {
    if (document.querySelector('.ts-injected-insta')) { return; }

    var list = document.querySelector('.info-list');
    if (!list) { return; }

    var card = document.createElement('a');
    card.className = 'info-card ts-injected-insta';
    card.href = IG;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', 'Follow TaxSphere Consultancy on Instagram (opens in a new tab)');
    card.innerHTML =
      '<span class="info-icon">' + glyph('#cc2366') + '</span>' +
      '<span class="ts-insta-body">' +
        '<h3>Instagram</h3>' +
        '<span class="val">@' + HANDLE + '</span>' +
        '<span class="small">GST / ITR / TDS tips &amp; deadline reminders</span>' +
      '</span>';

    /* Real markup nests .map-wrap OUTSIDE .info-list (both sit in the
       contact column), so fall back to appending as the last row — which
       still lands the card directly above the map. */
    var map = list.querySelector('.map-wrap');
    if (map) {
      list.insertBefore(card, map);
    } else {
      list.appendChild(card);
    }
  }

  /* ======================================================================
     2 — Footer button
     Real markup: <div class="social-row"> <a class="social-btn" href="#"
     aria-label="TaxSphere Consultancy on Instagram">…
     ====================================================================== */
  function upgradeFooter() {
    var el =
      document.querySelector('footer a.social-btn[aria-label*="Instagram"]') ||
      document.querySelector('footer .social-row a[href="#"][aria-label*="Instagram"]') ||
      document.querySelector('footer .social a[aria-label*="Instagram"]') ||
      document.querySelector('footer a[aria-label*="Instagram"]');
    if (!el || el.getAttribute('href') === IG) { return; }
    el.href = IG;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  }

  /* ======================================================================
     3 — Modal
     ====================================================================== */
  var overlay = null;
  var invoker = null;
  var lastNudge = 0;

  function buildModal() {
    if (overlay || PLACEHOLDER) { return overlay; }

    overlay = document.createElement('div');
    overlay.className = 'ts-ig-overlay';
    overlay.id = 'tsIgOverlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ts-ig-modal" role="dialog" aria-modal="true" ' +
           'aria-labelledby="tsIgTitle" aria-describedby="tsIgDesc">' +
        '<button class="ts-ig-close" type="button" aria-label="Close Instagram dialog">&#215;</button>' +
        '<span class="ts-ig-badge">' + glyph('#ffffff') + '</span>' +
        '<h2 id="tsIgTitle">Follow TaxSphere on Instagram</h2>' +
        '<p id="tsIgDesc">GST deadlines, filing checklists and TDS updates — ' +
           'short, practical posts from the Amroha team.</p>' +
        '<a class="ts-ig-cta" href="' + IG + '" target="_blank" rel="noopener noreferrer">' +
          glyph('#ffffff') + '<span>@' + HANDLE + '</span></a>' +
        '<p class="ts-ig-note">Opens instagram.com in a new tab.</p>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { closeModal(); }
    });
    overlay.querySelector('.ts-ig-close').addEventListener('click', closeModal);
    overlay.querySelector('.ts-ig-cta').addEventListener('click', markSeen);

    document.addEventListener('keydown', function (e) {
      if (!overlay || overlay.hidden) { return; }
      if (e.key === 'Escape' || e.keyCode === 27) { closeModal(); return; }
      if (e.key === 'Tab' || e.keyCode === 9) { trapFocus(e); }
    });

    return overlay;
  }

  function focusables() {
    if (!overlay) { return []; }
    return Array.prototype.filter.call(
      overlay.querySelectorAll('a[href], button:not([disabled])'),
      function (n) { return n.offsetParent !== null || n === document.activeElement; }
    );
  }

  function trapFocus(e) {
    var f = focusables();
    if (!f.length) { return; }
    var first = f[0];
    var last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openModal(from) {
    if (PLACEHOLDER) { return; }
    if (!buildModal()) { return; }
    invoker = from || null;
    overlay.hidden = false;
    document.body.classList.add('ts-modal-open');
    document.body.style.overflow = 'hidden';
    var fab = document.querySelector('.ts-insta-fab');
    if (fab) { fab.classList.add('is-hidden'); }
    var closeBtn = overlay.querySelector('.ts-ig-close');
    if (closeBtn) { closeBtn.focus(); }
  }

  function closeModal() {
    if (!overlay || overlay.hidden) { return; }
    overlay.hidden = true;
    document.body.classList.remove('ts-modal-open');
    document.body.style.overflow = '';
    markSeen();
    var fab = document.querySelector('.ts-insta-fab');
    if (fab) { fab.classList.remove('is-hidden'); }
    if (invoker && document.contains(invoker)) { invoker.focus(); }
    invoker = null;
  }

  /* ======================================================================
     4 — Floating Instagram button (bottom-left; .fab-stack is bottom-right)
     ====================================================================== */
  function injectFab() {
    if (PLACEHOLDER) { return; }

    var btn = document.querySelector('.ts-insta-fab');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ts-insta-fab';
      btn.setAttribute('aria-label', 'Follow TaxSphere Consultancy on Instagram');
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.innerHTML = glyph('#ffffff');
      document.body.appendChild(btn);
    }
    if (btn.getAttribute('data-ts-ig') === '1') { return; }
    btn.setAttribute('data-ts-ig', '1');
    btn.addEventListener('click', function () { openModal(btn); });
  }

  /* ======================================================================
     5 — Post-enquiry nudge (8s after a successful submission)
     Listens on BOTH document and window: script.js dispatches with
     bubbles:true on document, so both fire — the 1s de-dupe collapses them.
     ====================================================================== */
  function onFormSuccess() {
    var now = Date.now();
    if (now - lastNudge < 1000) { return; }
    lastNudge = now;
    if (!dismissGate()) { return; }
    window.setTimeout(function () {
      if (document.querySelector('.ts-ig-overlay:not([hidden])')) { return; }
      if (!dismissGate()) { return; }
      markSeen();              // the nudge is spent for this 30-day window
      openModal(null);
    }, 8000);
  }

  function init() {
    injectContactCard();
    upgradeFooter();
    injectFab();
    document.addEventListener('taxsphere:form-success', onFormSuccess);
    window.addEventListener('taxsphere:form-success', onFormSuccess);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Exposed for debugging / other owners. */
  window.__TAXSPHERE_IG__ = {
    url: IG,
    handle: HANDLE,
    placeholder: PLACEHOLDER,
    open: openModal,
    close: closeModal
  };
}());
