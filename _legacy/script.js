/* File saved as UTF-8 (no BOM), LF line endings */
/* ==========================================================================
   TaxSphere Consultancy — script.js
   --------------------------------------------------------------------------
   Interaction layer loaded from index.html (defer):
     [1] Smooth in-page scrolling (fixed-header offset aware)
     [2] "Get Consultation" popup + validated callback form
     [3] Sticky mobile Call button behaviour
     [4] Floating WhatsApp button helpers (bottom right, 8126780246)
     [5] SEO meta normalisation (canonical / Open Graph / description)
   ========================================================================== */

(function () {
  'use strict';

  var N1 = '8126780246';
  var N2 = '9219481572';
  var WA = 'https://wa.me/91' + N1;
  var EMAIL = 'Taxsphere11@gmail.com';

  var SERVICES = [
    'GST Registration',
    'GST Return Filing',
    'GST Refund',
    'GST Notice & Department Work',
    'ITR Filing',
    'Income Tax Notice Reply',
    'TDS Returns',
    'MSME Registration',
    'Accounting & Bookkeeping',
    'Other'
  ];

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function track(event, extra) {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.dataLayer.push !== 'function') { return; }
    var payload = { event: event };
    if (extra) {
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    }
    window.dataLayer.push(payload);
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) { return; }
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 4200);
  }

  function scrollToY(top) {
    var behaviour = reducedMotion() ? 'auto' : 'smooth';
    if (!('scrollBehavior' in document.documentElement.style)) {
      window.scrollTo(0, top);
      return;
    }
    try {
      window.scrollTo({ top: top, behavior: behaviour });
    } catch (e) {
      window.scrollTo(0, top);
    }
  }

  /* ---------------------------------------------------------------------
     [1] Smooth scroll for every in-page anchor
     --------------------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var el = e.target;
      if (!el || typeof el.closest !== 'function') { return; }
      var link = el.closest('a[href^="#"]');
      if (!link) { return; }
      if (link.hasAttribute('data-auth') ||
          link.hasAttribute('data-note') ||
          link.hasAttribute('data-consult')) { return; }

      var href = link.getAttribute('href');
      if (!href || href === '#') { return; }

      var target = document.getElementById(href.slice(1));
      if (!target) { return; }

      e.preventDefault();

      var header = document.querySelector('.site-header');
      var offset = target.id === 'top' ? 0 : (header ? header.offsetHeight : 0);
      var top = target.id === 'top'
        ? 0
        : Math.max(0, target.getBoundingClientRect().top + (window.pageYOffset || 0) - offset);

      scrollToY(top);

      if (window.history && window.history.replaceState) {
        try { window.history.replaceState(null, '', href); } catch (err) { /* ignore */ }
      }
      track('taxsphere_smooth_scroll', { target: href });
    });
  }

  /* ---------------------------------------------------------------------
     [2] "Get Consultation" popup
     --------------------------------------------------------------------- */
  var overlay = null;
  var popupForm = null;
  var lastFocused = null;

  function serviceOptions() {
    return SERVICES.map(function (s) {
      return '<option>' + s + '</option>';
    }).join('');
  }

  function popupMarkup() {
    return '' +
      '<div class="consult-modal" role="dialog" aria-modal="true" ' +
      'aria-labelledby="consultTitle" aria-describedby="consultDesc">' +
      '<button class="consult-close" type="button" data-consult-close aria-label="Close dialog">&times;</button>' +
      '<span class="consult-badge" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" focusable="false"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>' +
      '<path d="M7 9h10v2H7zm0 4h7v2H7z" fill="#B68A3F"/></svg>' +
      '</span>' +
      '<h2 id="consultTitle">Get Free Consultation</h2>' +
      '<p class="consult-sub" id="consultDesc">' +
      'Tell us what you need - a tax expert from Amroha will reply on WhatsApp, usually within a few minutes.' +
      '</p>' +
      '<form id="consultForm" novalidate>' +
      '<div class="field">' +
      '<label for="co-name">Name <span class="req" aria-hidden="true">*</span></label>' +
      '<input id="co-name" name="name" autocomplete="name" placeholder="Your full name" required>' +
      '</div>' +
      '<div class="field">' +
      '<label for="co-phone">Phone <span class="req" aria-hidden="true">*</span></label>' +
      '<input type="tel" id="co-phone" name="phone" autocomplete="tel" inputmode="tel" ' +
      'pattern="[0-9]{10}" placeholder="10-digit mobile number" required>' +
      '</div>' +
      '<div class="field">' +
      '<label for="co-service">Service <span class="req" aria-hidden="true">*</span></label>' +
      '<select id="co-service" name="service" required>' +
      '<option value="" selected disabled>Select a service&hellip;</option>' +
      serviceOptions() +
      '</select>' +
      '</div>' +
      '<div class="field">' +
      '<label for="co-message">Message</label>' +
      '<textarea id="co-message" name="message" placeholder="Tell us briefly about your requirement&hellip;"></textarea>' +
      '</div>' +
      '<button class="btn consult-submit" type="submit">Request Callback</button>' +
      '<div class="consult-alt">' +
      '<a href="tel:+91' + N1 + '">Call ' + N1 + '</a>' +
      '<a href="tel:+91' + N2 + '">Call ' + N2 + '</a>' +
      '<a href="' + WA + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      '</div>' +
      '<p class="consult-note">Free, no obligation. Prefer email? ' +
      '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a></p>' +
      '</form>' +
      '</div>';
  }

  function setError(field, message) {
    if (!field) { return; }
    var wrap = field.closest('.field');
    if (!wrap) { return; }
    var old = wrap.querySelector('.field-error');
    if (old) { old.parentNode.removeChild(old); }
    field.setAttribute('aria-invalid', 'true');
    var p = document.createElement('p');
    p.className = 'field-error';
    p.textContent = message;
    wrap.appendChild(p);
  }

  function clearError(field) {
    if (!field) { return; }
    var wrap = field.closest('.field');
    if (!wrap) { return; }
    var old = wrap.querySelector('.field-error');
    if (old) { old.parentNode.removeChild(old); }
    field.removeAttribute('aria-invalid');
  }

  function normalisePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.charAt(0) === '0') {
      digits = digits.slice(1);
    }
    return digits;
  }

  function validateConsultForm(form) {
    var name = form.elements.name;
    var phone = form.elements.phone;
    var service = form.elements.service;
    var message = form.elements.message;
    var ok = true;

    [name, phone, service, message].forEach(clearError);

    if (!name.value.trim()) {
      setError(name, 'Please enter your name.');
      ok = false;
    } else if (name.value.trim().length < 2) {
      setError(name, 'Please enter a valid name.');
      ok = false;
    }

    if (normalisePhone(phone.value).length !== 10) {
      setError(phone, 'Enter a valid 10-digit mobile number.');
      ok = false;
    }

    if (!service.value) {
      setError(service, 'Please select a service.');
      ok = false;
    }

    if (!ok) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) { firstBad.focus(); }
    }
    return ok;
  }

  function buildConsultMessage(form) {
    return [
      'Hi TaxSphere, I would like a free consultation.',
      '',
      'Name: ' + form.elements.name.value.trim(),
      'Phone: ' + normalisePhone(form.elements.phone.value),
      'Service: ' + form.elements.service.value,
      'Message: ' + (form.elements.message.value.trim() || '-'),
      '',
      'Please call me back. Thank you.'
    ].join('\n');
  }

  function openConsult(trigger) {
    if (!overlay) { buildConsult(); }
    if (!overlay) { return; }
    lastFocused = trigger || document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('consult-open');
    var closeBtn = overlay.querySelector('[data-consult-close]');
    if (closeBtn) { closeBtn.focus(); }
    track('taxsphere_consult_open', { source: (trigger && trigger.textContent || '').trim() });
  }

  function closeConsult() {
    if (!overlay || overlay.hidden) { return; }
    overlay.hidden = true;
    document.body.classList.remove('consult-open');
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function buildConsult() {
    if (overlay || !document.body) { return; }

    overlay = document.createElement('div');
    overlay.className = 'consult-overlay';
    overlay.id = 'consultOverlay';
    overlay.hidden = true;
    overlay.innerHTML = popupMarkup();
    document.body.appendChild(overlay);

    popupForm = overlay.querySelector('#consultForm');

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || (e.target.closest && e.target.closest('[data-consult-close]'))) {
        closeConsult();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) { return; }
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeConsult();
        return;
      }
      if (e.key === 'Tab' || e.keyCode === 9) {
        trapFocus(e);
      }
    });

    popupForm.addEventListener('input', function (e) {
      if (e.target && e.target.getAttribute('aria-invalid') === 'true') {
        clearError(e.target);
      }
    });

    popupForm.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute('aria-invalid') === 'true') {
        clearError(e.target);
      }
    });

    popupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateConsultForm(popupForm)) { return; }

      var payload = {
        name: popupForm.elements.name.value.trim(),
        phone: normalisePhone(popupForm.elements.phone.value),
        service: popupForm.elements.service.value,
        message: popupForm.elements.message.value.trim()
      };
      var text = buildConsultMessage(popupForm);

      track('taxsphere_consult_submit', payload);

      var win = null;
      try {
        win = window.open(WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
      } catch (err) {
        win = null;
      }
      if (!win) {
        window.location.href = WA + '?text=' + encodeURIComponent(text);
      }

      popupForm.reset();
      closeConsult();
      showToast('Thank you! We will contact you shortly.');
      document.dispatchEvent(new CustomEvent('taxsphere:consult-success', {
        detail: payload,
        bubbles: true
      }));
    });
  }

  function trapFocus(e) {
    var nodes = overlay.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea'
    );
    var list = Array.prototype.filter.call(nodes, function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
    if (!list.length) { return; }
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function initConsultTriggers() {
    var links = document.querySelectorAll('a[href="#contact"], a[data-consult]');
    Array.prototype.forEach.call(links, function (link) {
      if (link.hasAttribute('data-auth')) { return; }
      var text = (link.textContent || '').toLowerCase();
      if (!link.hasAttribute('data-consult') && text.indexOf('consult') === -1) { return; }
      link.setAttribute('data-consult', 'true');
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openConsult(link);
      });
    });
  }

  /* ---------------------------------------------------------------------
     [3] Sticky mobile Call button — hide it while the contact section
         is already on screen so it never covers the form.
     --------------------------------------------------------------------- */
  function initStickyCall() {
    var call = document.querySelector('.fab-call');
    if (!call || !('IntersectionObserver' in window)) { return; }

    var visible = 0;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible += entry.isIntersecting ? 1 : -1;
      });
      if (visible < 0) { visible = 0; }
      call.classList.toggle('is-suppressed', visible > 0);
    }, { threshold: 0.12 });

    var contact = document.getElementById('contact');
    if (contact) { observer.observe(contact); }
    var footer = document.querySelector('.site-footer');
    if (footer) { observer.observe(footer); }
  }

  /* ---------------------------------------------------------------------
     [4] Floating WhatsApp button — number chip + tracking
     --------------------------------------------------------------------- */
  function initFloatingWhatsApp() {
    var fab = document.querySelector('.fab-wa');
    if (!fab) { return; }

    if (!fab.getAttribute('aria-label') || fab.getAttribute('aria-label').indexOf(N1) === -1) {
      fab.setAttribute('aria-label', 'Chat with TaxSphere Consultancy on WhatsApp at ' + N1);
    }
    if (!fab.getAttribute('title')) {
      fab.setAttribute('title', 'WhatsApp ' + N1);
    }
    if (!fab.querySelector('.fab-num')) {
      var chip = document.createElement('span');
      chip.className = 'fab-num';
      chip.setAttribute('aria-hidden', 'true');
      chip.textContent = N1;
      fab.insertBefore(chip, fab.firstChild);
    }
    if (!fab.getAttribute('rel') || fab.getAttribute('rel').indexOf('noopener') === -1) {
      fab.setAttribute('rel', 'noopener noreferrer');
    }
    fab.setAttribute('target', '_blank');
  }

  /* ---------------------------------------------------------------------
     [5] SEO meta normalisation
     --------------------------------------------------------------------- */
  function absolute(url) {
    if (!url) { return url; }
    if (/^https?:\/\//i.test(url)) { return url; }
    if (url.charAt(0) === '/' && window.location.origin) {
      return window.location.origin + url;
    }
    return url;
  }

  function setMeta(selector, attrs, createTag) {
    var el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(createTag);
      Object.keys(attrs).forEach(function (k) {
        if (k !== 'content') { el.setAttribute(k, attrs[k]); }
      });
      document.head.appendChild(el);
    }
    if (attrs.content && !el.getAttribute('content')) {
      el.setAttribute('content', attrs.content);
    }
    return el;
  }

  function enhanceSeo() {
    try {
      var pageUrl = window.location.href.split('#')[0];

      var canonical = document.head.querySelector('link[rel=canonical]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      if (!canonical.getAttribute('href') || canonical.getAttribute('href').charAt(0) === '/') {
        canonical.setAttribute('href', absolute(canonical.getAttribute('href')) || pageUrl);
      }

      setMeta('meta[name=description]', {
        name: 'description',
        content: 'GST Registration, ITR Filing, TDS Returns, Accounting & Business Compliance in Amroha, UP. ' +
          'Call ' + N1 + ', ' + N2 + ' or WhatsApp for quick assistance.'
      }, 'meta');

      setMeta('meta[name=robots]', { name: 'robots', content: 'index, follow' }, 'meta');
      setMeta('meta[name=author]', { name: 'author', content: 'TaxSphere Consultancy' }, 'meta');
      setMeta('meta[name=geo.region]', { name: 'geo.region', content: 'IN-UP' }, 'meta');
      setMeta('meta[name=geo.placename]', { name: 'geo.placename', content: 'Amroha, Uttar Pradesh' }, 'meta');

      var ogUrl = document.head.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        var current = ogUrl.getAttribute('content');
        if (!current || current.charAt(0) === '/') {
          ogUrl.setAttribute('content', absolute(current) || pageUrl);
        }
      }

      var ogImage = document.head.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.getAttribute('content')) {
        ogImage.setAttribute('content', absolute(ogImage.getAttribute('content')));
      }

      if (!document.head.querySelector('meta[name=twitter:card]')) {
        setMeta('meta[name=twitter:card]', {
          name: 'twitter:card',
          content: 'summary_large_image'
        }, 'meta');
      }

      var ld = document.head.querySelector('script[type="application/ld+json"]');
      if (ld && ld.textContent) {
        try {
          var data = JSON.parse(ld.textContent);
          if (data && !data.sameAs) {
            data.sameAs = [
              'https://www.instagram.com/taxsphere11',
              'https://maps.google.com/?q=Mohammadi+Sarai+Amroha'
            ];
            data.priceRange = '₹₹';
            ld.textContent = JSON.stringify(data);
          }
        } catch (err) { /* keep the original JSON-LD untouched */ }
      }
    } catch (err) { /* SEO tweaks are best-effort */ }
  }

  ready(function () {
    initSmoothScroll();
    buildConsult();
    initConsultTriggers();
    initFloatingWhatsApp();
    initStickyCall();
    enhanceSeo();
  });
}());
