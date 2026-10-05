/* File saved as UTF-8 (no BOM), LF line endings */
/* ==========================================================================
   TaxSphere Consultancy — WhatsApp number picker (assets/wa-picker.js)
   --------------------------------------------------------------------------
   [1] CONFIG  : the two numbers + the pre-filled message.
                 This is the ONLY place the numbers are defined.
   [2] PICKER  : the popup opened by every element marked [data-wa-picker].
   ------------------------------------------------------------------------
   Behaviour: click/tap opens it, clicking outside / Esc / picking a number
   closes it, and each option opens https://wa.me/91XXXXXXXXXX?text=...
   in a new tab. Styles live in styles.css (.wa-pop).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------- [1] CONFIG */
  var CONFIG = {
    countryCode: '91',
    numbers: ['8126780246', '9219481572'],
    message: 'Hello TaxSphere, I need help with GST/ITR services.',
    title: 'Chat on WhatsApp',
    hint: 'Opens WhatsApp in a new tab'
  };

  /* exposed so script.js builds its own links from this same config */
  window.TS_WA = CONFIG;

  /* ---------------------------------------------------------------- helpers */
  var POP_ID = 'waPop';

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.548 4.142 1.588 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.585 0 11.946-5.359 11.949-11.945a11.87 11.87 0 0 0-3.497-8.413"/></svg>';

  function digits(number) {
    return String(number).replace(/\D/g, '');
  }

  function chatUrl(number) {
    return 'https://wa.me/' + CONFIG.countryCode + digits(number) +
      '?text=' + encodeURIComponent(CONFIG.message);
  }

  /* --------------------------------------------------------------- [2] state */
  var pop = null;
  var trigger = null;

  function buildPop() {
    var el = document.createElement('div');
    el.className = 'wa-pop';
    el.id = POP_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', POP_ID + '-title');
    el.setAttribute('aria-modal', 'false');
    el.hidden = true;

    var title = document.createElement('p');
    title.className = 'wa-pop-title';
    title.id = POP_ID + '-title';
    title.textContent = CONFIG.title;
    el.appendChild(title);

    CONFIG.numbers.forEach(function (number) {
      var link = document.createElement('a');
      link.className = 'wa-pop-item';
      link.href = chatUrl(number);
      link.target = '_blank';
      link.rel = 'noopener';
      link.innerHTML = ICON;

      var text = document.createElement('span');
      text.className = 'wa-pop-text';

      var num = document.createElement('span');
      num.className = 'wa-pop-num';
      num.textContent = number;

      var hint = document.createElement('span');
      hint.className = 'wa-pop-hint';
      hint.textContent = CONFIG.hint;

      text.appendChild(num);
      text.appendChild(hint);
      link.appendChild(text);

      link.addEventListener('click', function () { close(true); });
      el.appendChild(link);
    });

    document.body.appendChild(el);
    return el;
  }

  function position() {
    if (!pop || pop.hidden || !trigger) { return; }
    var r = trigger.getBoundingClientRect();

    pop.style.left = '0px';
    pop.style.top = '0px';
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;

    var left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - w - 8));
    var top = r.bottom + 10;
    if (top + h > window.innerHeight - 8) {
      top = r.top - h - 10;
      if (top < 8) { top = Math.max(8, window.innerHeight - h - 8); }
    }

    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  function open(btn) {
    if (!pop) { pop = buildPop(); }
    trigger = btn;
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    position();
    var first = pop.querySelector('.wa-pop-item');
    if (first && typeof first.focus === 'function') { first.focus(); }
  }

  function close(restoreFocus) {
    if (!pop || pop.hidden) { return; }
    pop.hidden = true;
    var btn = trigger;
    trigger = null;
    if (!btn) { return; }
    btn.setAttribute('aria-expanded', 'false');
    if (restoreFocus && document.contains(btn)) { btn.focus(); }
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    var triggers = document.querySelectorAll('[data-wa-picker]');
    if (!triggers.length) { return; }
    if (!pop) { pop = buildPop(); }

    Array.prototype.forEach.call(triggers, function (btn) {
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', POP_ID);

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (trigger === btn && !pop.hidden) { close(false); }
        else { open(btn); }
      });
    });

    /* close when clicking outside the popup and its trigger */
    document.addEventListener('click', function (e) {
      if (!pop || pop.hidden) { return; }
      var el = e.target;
      if (!el || typeof el.closest !== 'function') { return; }
      if (el.closest('#' + POP_ID)) { return; }
      if (trigger && el.closest('[data-wa-picker]') === trigger) { return; }
      close(false);
    });

    /* close on Esc and hand focus back to the button */
    document.addEventListener('keydown', function (e) {
      if (!pop || pop.hidden) { return; }
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (e.stopPropagation) { e.stopImmediatePropagation(); }
        close(true);
      }
    });

    /* keep the popup inside the viewport while it is open */
    window.addEventListener('resize', function () { position(); });
    window.addEventListener('scroll', function () { position(); }, true);

    /* close when keyboard focus leaves the popup */
    pop.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!pop || pop.hidden) { return; }
        var active = document.activeElement;
        if (active && (pop.contains(active) || (trigger && trigger.contains(active)))) { return; }
        close(false);
      }, 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
