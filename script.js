/* File saved as UTF-8 (no BOM), LF line endings */
/* ==========================================================================
   TaxSphere Consultancy — script.js
   --------------------------------------------------------------------------
   [1]  Site chrome : sticky header, mobile menu, smooth scroll, active link
   [2]  Motion      : reveal on scroll, animated counters, footer year
   [3]  Home        : consultation popup, floating WA / call, legal modal
   [4]  Contact     : validation + form-to-email (FormSubmit.co AJAX)
   ========================================================================== */

(function () {
  'use strict';

  /* WhatsApp numbers + pre-filled message live in ONE place: assets/wa-picker.js */
  var WA = window.TS_WA || {};
  var WA_NUMBERS = (WA.numbers || []).map(function (n) { return String(n).replace(/\D/g, ''); });

  function waLink(number) {
    return 'https://wa.me/' + (WA.countryCode || '91') + number;
  }

  var SITE = {
    phones: WA_NUMBERS,
    waPrimary: waLink(WA_NUMBERS[0] || ''),
    waSecondary: waLink(WA_NUMBERS[1] || ''),
    email: 'Taxsphere11@gmail.com',
    formEndpoint: 'https://formsubmit.co/ajax/Taxsphere11@gmail.com'
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var body = document.body;
  var page = body ? (body.getAttribute('data-page') || 'home') : 'home';

  /* ---------------------------------------------------------------- utils */
  function on(el, ev, fn) { if (el) { el.addEventListener(ev, fn); } }

  function toast(message, variant) {
    var el = $('#toast');
    if (!el) { return; }
    el.textContent = message;
    el.classList.toggle('is-info', variant === 'info');
    el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('is-visible'); }, 4200);
  }

  function normalisePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) { digits = digits.slice(2); }
    if (digits.length === 11 && digits.charAt(0) === '0') { digits = digits.slice(1); }
    return digits;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollToY(top) {
    var behaviour = reducedMotion() ? 'auto' : 'smooth';
    if (!('scrollBehavior' in document.documentElement.style)) { window.scrollTo(0, top); return; }
    try { window.scrollTo({ top: top, behavior: behaviour }); }
    catch (e) { window.scrollTo(0, top); }
  }

  function track(event, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event };
    if (extra) { Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; }); }
    window.dataLayer.push(payload);
  }

  /* ------------------------------------------------- [1] header + nav */
  var header = $('[data-header]');
  var mobileMenu = $('#mobileMenu');
  var navToggle = $('#navToggle');

  function setHeaderState() {
    if (!header) { return; }
    header.classList.toggle('is-scrolled', (window.pageYOffset || 0) > 8);
  }

  function closeMenu() {
    if (!mobileMenu || !navToggle) { return; }
    mobileMenu.classList.add('hidden');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    var use = navToggle.querySelector('use');
    if (use) { use.setAttribute('href', '#i-menu'); }
  }

  function openMenu() {
    if (!mobileMenu || !navToggle) { return; }
    mobileMenu.classList.remove('hidden');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation menu');
    var use = navToggle.querySelector('use');
    if (use) { use.setAttribute('href', '#i-close'); }
  }

  on(navToggle, 'click', function () {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    if (open) { closeMenu(); } else { openMenu(); }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.keyCode === 27)) { closeMenu(); }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) { closeMenu(); }
  });

  /* ------------------------------------------------------- smooth scroll */
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || typeof el.closest !== 'function') { return; }
    var link = el.closest('a[href^="#"]');
    if (!link) { return; }
    if (link.hasAttribute('data-legal') || link.hasAttribute('data-consult')) { return; }

    var href = link.getAttribute('href');
    if (!href || href === '#') { return; }

    var target = document.getElementById(href.slice(1));
    if (!target) { return; }

    e.preventDefault();
    closeMenu();

    var offset = (target.id === 'top' || target.id === 'home') ? 0 : (header ? header.offsetHeight : 0);
    var top = (target.id === 'top' || target.id === 'home')
      ? 0
      : Math.max(0, target.getBoundingClientRect().top + (window.pageYOffset || 0) - offset + 12);

    scrollToY(top);
    if (window.history && window.history.replaceState) {
      try { window.history.replaceState(null, '', href); } catch (err) { /* noop */ }
    }
    track('ts_smooth_scroll', { target: href });
  });

  /* --------------------------------------------------- active nav state */
  function initActiveNav() {
    var ids = ['top', 'services', 'gst', 'why', 'about', 'contact'];
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) { return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var id = entry.target.id;
        $$('.nav-link, .mobile-link').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------ [2] reveal + counters */
  function initReveal() {
    var nodes = $$('.reveal');
    if (!nodes.length) { return; }
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function animateCounter(node) {
    var target = parseFloat(node.getAttribute('data-count')) || 0;
    var suffix = node.getAttribute('data-suffix') || '';
    var decimals = parseInt(node.getAttribute('data-decimals') || '0', 10);
    var duration = 1500;
    var start = null;

    function step(ts) {
      if (!start) { start = ts; }
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) { requestAnimationFrame(step); }
      else { node.textContent = target.toFixed(decimals) + suffix; }
    }

    if (reducedMotion()) { node.textContent = target.toFixed(decimals) + suffix; return; }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) { return; }
    if (!('IntersectionObserver' in window)) { nodes.forEach(animateCounter); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function initYear() {
    $$('[data-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); });
  }

  /* ------------------------------- [3] consultation popup (Get Consultation) */
  var consultModal = $('#consultModal');
  var legalModal = $('#legalModal');
  var lastFocused = null;

  function openModal(modal) {
    if (!modal) { return; }
    lastFocused = document.activeElement;
    modal.hidden = false;
    body.classList.add('modal-open');
    var focusable = modal.querySelector('input, select, textarea, button');
    if (focusable) { focusable.focus(); }
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) { return; }
    modal.hidden = true;
    if (!document.querySelector('.modal-overlay:not([hidden])')) {
      body.classList.remove('modal-open');
    }
    if (lastFocused && document.contains(lastFocused)) { lastFocused.focus(); }
    lastFocused = null;
  }

  function trapFocus(modal, e) {
    var nodes = $$('a[href], button:not([disabled]), input, select, textarea', modal)
      .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
    if (!nodes.length) { return; }
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  document.addEventListener('keydown', function (e) {
    var open = document.querySelector('.modal-overlay:not([hidden])');
    if (!open) { return; }
    if (e.key === 'Escape' || e.keyCode === 27) { closeModal(open); return; }
    if (e.key === 'Tab' || e.keyCode === 9) { trapFocus(open, e); }
  });

  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || typeof el.closest !== 'function') { return; }

    var closer = el.closest('[data-modal-close]');
    if (closer) { closeModal(closer.closest('.modal-overlay')); return; }
    if (el.classList && el.classList.contains('modal-overlay')) { closeModal(el); return; }

    var trigger = el.closest('[data-consult]');
    if (trigger) {
      e.preventDefault();
      closeMenu();
      openModal(consultModal);
      track('ts_consult_open', { source: (trigger.textContent || '').trim() });
    }
  });

  /* --------------------------------------------------- [4] form handling */
  function setFieldError(field, message) {
    if (!field) { return; }
    var box = field.parentNode.querySelector('.field-error');
    field.setAttribute('aria-invalid', 'true');
    if (box) { box.textContent = message; box.hidden = false; }
  }

  function clearFieldError(field) {
    if (!field) { return; }
    var box = field.parentNode.querySelector('.field-error');
    field.removeAttribute('aria-invalid');
    if (box) { box.hidden = true; box.textContent = ''; }
  }

  function validateForm(form, rules) {
    var ok = true;
    var firstBad = null;

    rules.forEach(function (rule) {
      var field = form.querySelector(rule.sel);
      if (!field) { return; }
      clearFieldError(field);
      var value = (field.value || '').trim();
      var message = '';

      if (rule.required && !value) {
        message = rule.requiredMsg || 'This field is required.';
      } else if (rule.type === 'phone' && value && normalisePhone(value).length !== 10) {
        message = 'Enter a valid 10-digit mobile number.';
      } else if (rule.type === 'name' && value && value.length < 2) {
        message = 'Please enter a valid name.';
      } else if (rule.type === 'service' && rule.required && !value) {
        message = 'Please select a service.';
      }

      if (message) {
        setFieldError(field, message);
        ok = false;
        if (!firstBad) { firstBad = field; }
      }
    });

    if (firstBad) { firstBad.focus(); }
    return ok;
  }

  function sendToEmail(payload) {
    return fetch(SITE.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) { throw new Error('bad response'); }
      return res.json();
    });
  }

  function setStatus(el, message, kind) {
    if (!el) { return; }
    el.textContent = message;
    el.classList.remove('is-ok', 'is-err', 'is-busy');
    if (kind) { el.classList.add('is-' + kind); }
  }

  function initContactForm() {
    var form = $('#contactForm');
    if (!form) { return; }
    var status = $('#formStatus');
    var btn = form.querySelector('[data-submit-btn]');

    $$('input, select, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () { clearFieldError(field); });
      field.addEventListener('change', function () { clearFieldError(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = validateForm(form, [
        { sel: '#cf-name', required: true, type: 'name', requiredMsg: 'Please enter your name.' },
        { sel: '#cf-phone', required: true, type: 'phone', requiredMsg: 'Please enter your phone number.' },
        { sel: '#cf-service', required: true, type: 'service', requiredMsg: 'Please select a service.' }
      ]);
      if (!valid) {
        setStatus(status, 'Please fix the highlighted fields and try again.', 'err');
        return;
      }

      var payload = {
        _subject: 'New enquiry from TaxSphere Consultancy website',
        Name: form.querySelector('#cf-name').value.trim(),
        Phone: normalisePhone(form.querySelector('#cf-phone').value),
        Service: form.querySelector('#cf-service').value,
        Message: form.querySelector('#cf-message').value.trim() || '-',
        Page: location.href
      };

      var originalLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setStatus(status, 'Sending your message…', 'busy');

      sendToEmail(payload)
        .then(function () {
          setStatus(status, 'Thank you! Your message has been sent — we will reply shortly.', 'ok');
          toast('✅ Message sent! We will contact you shortly.');
          form.reset();
          track('ts_form_submit', { source: 'contact' });
        })
        .catch(function () {
          /* Fallback: native post to FormSubmit (first send needs email confirmation) */
          setStatus(status, 'Opening your request… if nothing happens, call us on 8126780246.', 'busy');
          try { form.submit(); }
          catch (err) {
            setStatus(status, 'Could not send. Please call 8126780246 or WhatsApp us.', 'err');
          }
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
        });
    });
  }

  function initConsultForm() {
    var form = $('#consultForm');
    if (!form) { return; }

    $$('input, select, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () { clearFieldError(field); });
      field.addEventListener('change', function () { clearFieldError(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = validateForm(form, [
        { sel: '#co-name', required: true, type: 'name', requiredMsg: 'Please enter your name.' },
        { sel: '#co-phone', required: true, type: 'phone', requiredMsg: 'Please enter your phone number.' },
        { sel: '#co-service', required: true, type: 'service', requiredMsg: 'Please select a service.' }
      ]);
      if (!valid) { return; }

      var data = {
        name: form.querySelector('#co-name').value.trim(),
        phone: normalisePhone(form.querySelector('#co-phone').value),
        service: form.querySelector('#co-service').value,
        message: form.querySelector('#co-message').value.trim()
      };

      var text = [
        'Hi TaxSphere, I would like a free consultation.',
        '',
        'Name: ' + data.name,
        'Phone: ' + data.phone,
        'Service: ' + data.service,
        'Message: ' + (data.message || '-')
      ].join('\n');

      track('ts_consult_submit', { service: data.service });

      /* keep a copy for the team (silent — WhatsApp is the primary channel) */
      try {
        sendToEmail({
          _subject: 'New consultation request from the website popup',
          Name: data.name, Phone: data.phone, Service: data.service, Message: data.message || '-',
          Source: 'Get Consultation popup'
        }).catch(function () { /* optional */ });
      } catch (err) { /* noop */ }

      var url = SITE.waPrimary + '?text=' + encodeURIComponent(text);
      var win = null;
      try { win = window.open(url, '_blank', 'noopener,noreferrer'); } catch (err) { win = null; }
      if (!win) { window.location.href = url; }

      form.reset();
      closeModal(consultModal);
      toast('✅ Opening WhatsApp — we will reply within minutes.');
    });
  }

  /* ------------------------------------------------------ floating buttons */
  function initFloating() {
    var call = $('.fab-call');
    if (call && 'IntersectionObserver' in window) {
      var visible = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible += entry.isIntersecting ? 1 : -1; });
        if (visible < 0) { visible = 0; }
        call.classList.toggle('is-suppressed', visible > 0);
      }, { threshold: 0.12 });
      ['#contact', 'footer'].forEach(function (sel) {
        var node = sel.charAt(0) === '#' ? $(sel) : document.querySelector(sel);
        if (node) { io.observe(node); }
      });
    }
  }

  /* --------------------------------------------------------- legal modal */
  var LEGAL = {
    privacy: {
      title: 'Privacy Policy',
      body: [
        'TaxSphere Consultancy collects only the information you voluntarily share through our contact and consultation forms — typically your name, phone number, email address and service requirement.',
        'We use these details solely to respond to your enquiry, deliver the services you engage us for, and send compliance reminders relevant to your filings.',
        'We do not sell, rent or trade your personal data. Information is shared only with statutory portals (GST, Income Tax) when required to execute your work, or where the law requires disclosure.',
        'You can request access to, correction of, or deletion of your data at any time by writing to Taxsphere11@gmail.com or calling 8126780246.'
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      body: [
        'By using this website you agree to provide accurate information and to use the content for personal or internal business reference only.',
        'Engagement for any service (GST, ITR, TDS, MSME, accounting) is confirmed only through a separate written mandate or payment confirmation. Website content does not itself constitute professional advice.',
        'While we strive to meet all statutory deadlines, final responsibility for document submission rests with the client once the requested documents and information are shared.',
        'All fees, timelines and deliverables are communicated in writing before work begins. Statutory government fees, if any, are payable separately.'
      ]
    },
    disclaimer: {
      title: 'Disclaimer',
      body: [
        'The information on taxsphereconsultancy.in is general in nature and does not account for your specific facts. It should not be treated as a substitute for personalised professional advice.',
        'Tax rules, rates and procedures change frequently. TaxSphere Consultancy makes reasonable efforts to keep content current, but makes no guarantee of completeness, accuracy or timeliness.',
        'Any links to third-party websites (Google, Instagram, WhatsApp) are provided for convenience; we do not control or endorse their content or privacy practices.'
      ]
    }
  };

  function initLegal() {
    $$('[data-legal]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var key = link.getAttribute('data-legal');
        var data = LEGAL[key];
        if (!data || !legalModal) { return; }
        $('#legalTitle', legalModal).textContent = data.title;
        var holder = $('[data-legal-body]', legalModal);
        holder.innerHTML = '';
        data.body.forEach(function (para) {
          var p = document.createElement('p');
          p.textContent = para;
          holder.appendChild(p);
        });
        openModal(legalModal);
      });
    });
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    setHeaderState();
    window.addEventListener('scroll', setHeaderState, { passive: true });

    initYear();
    initReveal();
    initCounters();
    initActiveNav();

    if (page === 'home') {
      initContactForm();
      initConsultForm();
      initFloating();
      initLegal();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
