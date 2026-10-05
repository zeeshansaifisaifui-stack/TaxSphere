/* ==========================================================================
   TaxSphere — CLIENT REVIEWS
   Renders real, user-submitted reviews only. No sample or placeholder
   entries are seeded: the empty state is shown until genuine reviews exist.
   ========================================================================== */
(function () {
  "use strict";

  var USE_REAL_API = false;      // matches previous login-gate use
  var REVIEWS_KEY = "ts_reviews_v1";
  var SESSION_KEY = "ts_session"; // same key the login gate uses — do not rename
  var APPROVAL_REQUIRED = true;   // toggle for admin-approval workflow

  var MAX_TEXT = 600;
  var MIN_TEXT = 30;
  var NAME_MAX = 80;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* ------------------------------ storage ------------------------------ */
  function readStore() {
    var raw = null;
    try { raw = window.localStorage.getItem(REVIEWS_KEY); } catch (e) { return []; }
    if (!raw) { return []; }
    var list = null;
    try { list = JSON.parse(raw); } catch (e) { return []; }
    return Array.isArray(list) ? list : [];
  }
  function writeStore(list) {
    try { window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // Reads the session the login gate wrote. Never writes it.
  function isLoggedIn() {
    var raw = null;
    try { raw = window.localStorage.getItem(SESSION_KEY); } catch (e) { return false; }
    if (!raw) { return false; }
    var s = null;
    try { s = JSON.parse(raw); } catch (e) { return false; }
    return !!(s && s.token && typeof s.exp === "number" && s.exp > Date.now());
  }

  /* ------------------------------ helpers ------------------------------ */
  function approved() {
    return readStore().filter(function (r) { return r && r.approved; });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ""; }
    var day = d.getDate() < 10 ? "0" + d.getDate() : String(d.getDate());
    return day + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }

  function starsHtml(rating) {
    var wrap = el("div", "rv-stars");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", "Rated " + rating + " out of 5");
    for (var i = 1; i <= 5; i++) {
      var s = el("span", i <= rating ? "on" : "off", "★");
      s.setAttribute("aria-hidden", "true");
      wrap.appendChild(s);
    }
    return wrap;
  }

  /* --------------------------- review cards --------------------------- */
  function buildCard(review, isNew) {
    var card = el("article", "rv-card");
    card.appendChild(starsHtml(review.rating));

    var body = el("p", "rv-text");
    var full = String(review.text || "");
    if (full.length > 240) {
      body.textContent = full.slice(0, 240).replace(/\s+\S*$/, "") + "…";
      var more = el("button", "rv-more", "Read more");
      more.type = "button";
      more.setAttribute("aria-expanded", "false");
      more.addEventListener("click", function () {
        var open = body.textContent !== full;
        body.textContent = open ? full : full.slice(0, 240).replace(/\s+\S*$/, "") + "…";
        more.setAttribute("aria-expanded", open ? "true" : "false");
        more.textContent = open ? "Read less" : "Read more";
      });
      card.appendChild(body);
      card.appendChild(more);
    } else {
      body.textContent = full;
      card.appendChild(body);
    }

    var head = el("div", "rv-head");
    var av = el("span", "rv-av", String(review.name || "?").trim().charAt(0).toUpperCase());
    av.setAttribute("aria-hidden", "true");
    head.appendChild(av);

    var who = el("div");
    who.appendChild(el("span", "rv-who", review.name));
    var bits = [];
    if (review.role) { bits.push(review.role); }
    if (review.city) { bits.push(review.city); }
    var dateStr = formatDate(review.date);
    if (dateStr) { bits.push(dateStr); }
    who.appendChild(el("span", "rv-meta", bits.join(" · ")));
    head.appendChild(who);

    card.appendChild(head);
    if (isNew) { card.setAttribute("data-rv-new", "1"); }
    return card;
  }

  function buildEmpty() {
    var box = el("div", "rv-empty");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.55l-5.9 3.11 1.12-6.57L2.45 9.44l6.6-.96L12 2.5z");
    svg.appendChild(path);
    box.appendChild(svg);
    box.appendChild(el("h3", null, "No reviews yet"));
    box.appendChild(el("p", null, "Be the first to share your experience working with TaxSphere."));
    return box;
  }

  /* ------------------------------ render ------------------------------ */
  var listEl, writeBtn, toastEl;

  function render() {
    if (!listEl) { return; }
    listEl.innerHTML = "";
    var rows = approved();
    if (!rows.length) {
      listEl.appendChild(buildEmpty());
      return;
    }
    var grid = el("div", "rv-list");
    rows.forEach(function (r) { grid.appendChild(buildCard(r)); });
    listEl.appendChild(grid);
  }

  function showToast(msg, isError) {
    if (!toastEl) { return; }
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", !!isError);
    toastEl.classList.add("is-visible");
    if (showToast._t) { clearTimeout(showToast._t); }
    showToast._t = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 5000);
  }

  /* --------------------------- write button --------------------------- */
  function syncButton() {
    if (!writeBtn) { return; }
    if (isLoggedIn()) {
      writeBtn.textContent = "Write a Review";
      writeBtn.removeAttribute("data-locked");
    } else {
      writeBtn.textContent = "Log in to write a review";
      writeBtn.setAttribute("data-locked", "1");
    }
  }

  // Delegates to the login gate if it is present. The gate is not
  // re-implemented here — auth-gate.js / the site owns it.
  function requestLogin() {
    if (typeof window.showGate === "function") { window.showGate(); return; }
    if (typeof window.openAuth === "function") { window.openAuth("login"); return; }
    window.dispatchEvent(new CustomEvent("taxsphere:require-login"));
    var gate = document.getElementById("lgGate") || document.getElementById("authGate");
    if (gate) { gate.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    alert("Please log in to write a review.");
  }

  /* ============================== MODAL ============================== */
  var modal, dialog, form, fName, fCity, fStars, fText, fCount, submitBtn, submitLabel;
  var rating = 0, lastFocused = null, busy = false;

  var FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\"-1\"])";

  function setError(input, msg) {
    var box = document.getElementById(input.id + "Err");
    input.setAttribute("aria-invalid", "true");
    if (box) { box.textContent = msg; }
  }
  function resetError(input) {
    var box = document.getElementById(input.id + "Err");
    input.removeAttribute("aria-invalid");
    if (box) { box.textContent = ""; }
  }

  function paintStars(value) {
    var btns = fStars.querySelectorAll(".rv-star");
    for (var i = 0; i < btns.length; i++) {
      var n = Number(btns[i].getAttribute("data-v"));
      btns[i].classList.toggle("on", n <= value);
      btns[i].setAttribute("aria-checked", n === value ? "true" : "false");
    }
    fStars.setAttribute("aria-label", value ? value + " of 5 stars selected" : "Rating, no stars selected");
  }

  function setRating(v) {
    rating = v;
    paintStars(v);
    resetError(fStars);
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    fName.focus();
  }

  function closeModal() {
    if (busy) { return; }
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && document.contains(lastFocused)) { lastFocused.focus(); }
  }

  function onKeydown(e) {
    if (e.key === "Escape" || e.keyCode === 27) { e.preventDefault(); closeModal(); return; }
    if (e.key === "Tab") {                       // focus trap
      var nodes = [];
      var found = dialog.querySelectorAll(FOCUSABLE);
      for (var i = 0; i < found.length; i++) { nodes.push(found[i]); }
      if (!nodes.length) { return; }
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* --------------------------- submit flow --------------------------- */
  function validate() {
    var ok = true;
    var name = fName.value.trim();
    var text = fText.value.trim();

    if (name.length < 2) { setError(fName, "Name must be at least 2 characters."); ok = false; }
    else if (name.length > NAME_MAX) { setError(fName, "Name must be 80 characters or fewer."); ok = false; }
    else { resetError(fName); }

    if (!rating) { setError(fStars, "Please choose a rating."); ok = false; }

    if (text.length < MIN_TEXT) { setError(fText, "Review must be at least 30 characters."); ok = false; }
    else if (text.length > MAX_TEXT) { setError(fText, "Review must be 600 characters or fewer."); ok = false; }
    else { resetError(fText); }

    return ok;
  }

  function submit() {
    if (busy || !validate()) {
      var bad = dialog.querySelector('[aria-invalid="true"]');
      if (bad && bad.focus) { bad.focus(); }
      return;
    }

    busy = true;
    submitBtn.disabled = true;
    var spin = submitBtn.querySelector(".rv-spin");
    if (spin) { spin.hidden = false; }
    submitLabel.textContent = "Submitting…";

    var entry = {
      id: "rv_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: fName.value.trim(),
      city: fCity.value.trim(),
      role: "",
      rating: rating,
      text: fText.value.trim(),
      date: new Date().toISOString(),
      approved: !APPROVAL_REQUIRED
    };

    var request = USE_REAL_API
      ? fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry)
        }).then(function (r) { if (!r.ok) { throw new Error("bad"); } return r.json(); })
      : new Promise(function (res) { setTimeout(function () { res(entry); }, 600); }); // demo mode

    request.then(function (saved) {
      busy = false;
      submitBtn.disabled = false;
      if (spin) { spin.hidden = true; }
      submitLabel.textContent = "Submit Review";

      var list = readStore();
      list.unshift(saved || entry);
      writeStore(list);

      form.reset();
      setRating(0);
      fCount.textContent = "0/" + MAX_TEXT;
      [fName, fCity, fText].forEach(resetError);
      resetError(fStars);

      modal.hidden = true;
      document.body.style.overflow = "";

      render();
      showToast(APPROVAL_REQUIRED
        ? "Thanks! Your review is pending approval."
        : "Thanks! Your review is live.");
    }).catch(function () {
      busy = false;
      submitBtn.disabled = false;
      if (spin) { spin.hidden = true; }
      submitLabel.textContent = "Submit Review";
      showToast("Couldn't submit. Please retry.", true);
    });
  }

  /* ============================== boot ============================== */
  function init() {
    listEl = document.getElementById("reviewsList");
    writeBtn = document.getElementById("rvWriteBtn");
    toastEl = document.getElementById("rvToast");
    modal = document.getElementById("reviewModal");
    if (!listEl || !modal) { return; }

    dialog = modal.querySelector(".rv-dialog");
    form = document.getElementById("rvForm");
    fName = document.getElementById("rvName");
    fCity = document.getElementById("rvCity");
    fStars = document.getElementById("rvStars");
    fText = document.getElementById("rvText");
    fCount = document.getElementById("rvCount");
    submitBtn = document.getElementById("rvSubmit");
    submitLabel = document.getElementById("rvSubmitLabel");

    render();
    syncButton();

    writeBtn.addEventListener("click", function () {
      if (!isLoggedIn()) { requestLogin(); return; }
      openModal();
    });

    // Rating: mouse, keyboard arrows, and focus.
    fStars.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".rv-star") : null;
      if (btn) { setRating(Number(btn.getAttribute("data-v"))); }
    });
    fStars.addEventListener("keydown", function (e) {
      var step = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { step = 1; }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { step = -1; }
      else if (e.key === "Home") { step = -rating; }
      else if (e.key === "End") { step = 5 - rating; }
      else return;
      e.preventDefault();
      setRating(Math.min(5, Math.max(1, (rating || 1) + step)));
      fStars.focus();
    });
    fStars.addEventListener("mouseover", function (e) {
      var btn = e.target.closest ? e.target.closest(".rv-star") : null;
      if (btn) { paintStars(Number(btn.getAttribute("data-v"))); }   // hover preview
    });
    fStars.addEventListener("mouseleave", function () { paintStars(rating); });
    fStars.addEventListener("blur", function () { paintStars(rating); });
    fStars.addEventListener("focus", function () { paintStars(Math.max(rating, 1)); });

    fText.addEventListener("input", function () {
      fCount.textContent = fText.value.length + "/" + MAX_TEXT;
      if (fText.value.trim().length >= MIN_TEXT) { resetError(fText); }
    });
    [fName, fCity].forEach(function (f) {
      f.addEventListener("input", function () { resetError(f); });
    });

    document.getElementById("rvCancel").addEventListener("click", closeModal);
    document.getElementById("rvClose").addEventListener("click", closeModal);
    modal.addEventListener("mousedown", function (e) { if (e.target === modal) { closeModal(); } });
    document.addEventListener("keydown", function (e) {
      if (modal.hidden) { return; }
      onKeydown(e);
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());