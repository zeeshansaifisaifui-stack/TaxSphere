/* ==========================================================================
   TaxSphere Portal — LOGIN GATE
   Login-first guard for index.html.

   Zero-flash strategy:
     - index.html ships <body class="gated"> and `.gated .site-content{display:none}`
       as static markup/CSS.
     - This file is loaded as a classic (non-async, non-defer) <script> at the top
       of <body>, so it runs BEFORE any site content is parsed.
     - It synchronously validates ts_session and removes `gated` only when valid.

   Session: { token, email, name, exp } in localStorage["ts_session"], 7 day expiry.
   ========================================================================== */
(function () {
  "use strict";

  // DEMO AUTH — replace with real /api/auth endpoints when backend is deployed.
  // Set USE_REAL_API = true to route login/signup through ENDPOINT instead.
  var USE_REAL_API = false;
  var ENDPOINT = "/api/auth";
  var SESSION_KEY = "ts_session";
  var SESSION_DAYS = 7;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var USERNAME_RE = /^[a-z0-9._-]{3,20}$/i;

  /* ============================ session ============================ */
  function readSession() {
    var raw = null;
    try { raw = window.localStorage.getItem(SESSION_KEY); } catch (e) { return null; }
    if (!raw) { return null; }
    var s = null;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (!s || typeof s !== "object" || !s.token || typeof s.exp !== "number") { return null; }
    if (!(s.exp > Date.now())) { return null; }
    return s;
  }

  function saveSession(email, name, token) {
    var s = {
      token: token || ("demo_" + Math.random().toString(36).slice(2) + Date.now().toString(36)),
      email: email,
      name: name || "",
      exp: Date.now() + SESSION_DAYS * 864e5
    };
    try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  function dropSession() {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  /* ====================== gate open / close ====================== */
  function ungate(session) {
    document.body.classList.remove("gated");

    // Replay reveal animations: while gated the IntersectionObserver could not
    // fire, so without this some sections would stay at opacity:0.
    var rs = document.querySelectorAll(".reveal");
    for (var i = 0; i < rs.length; i++) { rs[i].classList.add("is-visible"); }

    var slots = document.querySelectorAll("[data-ts-email]");
    for (var j = 0; j < slots.length; j++) { slots[j].textContent = session.email; }
  }

  function regate() {
    dropSession();
    document.body.classList.add("gated");
    document.body.style.overflow = "";
    window.scrollTo(0, 0);
    var first = document.getElementById("lgLiEmail");
    if (first) { first.focus(); }
  }

  // Synchronous check — runs during initial parse, before content is rendered.
  var existing = readSession();
  if (existing) { ungate(existing); }

  /* ========================= real backend ========================= */
  function apiPost(path, body) {
    return fetch(ENDPOINT + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) { throw new Error("Request failed: " + r.status); }
      return r.json();
    });
  }

  /* ============================ UI wiring ============================ */
  document.addEventListener("DOMContentLoaded", function () {
    var gate = document.getElementById("lgGate");
    if (!gate) { return; }

    var loginView = document.getElementById("lgLoginView");
    var signupView = document.getElementById("lgSignupView");

    /* ---- inline field errors (aria-invalid + aria-describedby) ---- */
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
    function focusFirstInvalid(scope) {
      var bad = scope.querySelector('[aria-invalid="true"]');
      if (bad) { bad.focus(); }
    }

    /* ---- password eye toggles (both sign-up fields have one) ---- */
    gate.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".lg-eye") : null;
      if (!btn) { return; }
      var input = document.getElementById(btn.getAttribute("data-eye"));
      if (!input) { return; }
      var isShown = (input.type === "text");
      input.type = isShown ? "password" : "text";
      btn.setAttribute("aria-pressed", isShown ? "false" : "true");
      btn.setAttribute("aria-label", isShown ? "Show password" : "Hide password");
      var eyeOn = btn.querySelector(".eye-on");
      var eyeOff = btn.querySelector(".eye-off");
      if (eyeOn) { eyeOn.hidden = !isShown; }
      if (eyeOff) { eyeOff.hidden = isShown; }
    });

    /* ---- log in <-> sign up ---- */
    function showView(which) {
      loginView.hidden = (which !== "login");
      signupView.hidden = (which !== "signup");
      var first = document.getElementById(which === "login" ? "lgLiEmail" : "lgSuEmail");
      if (first) { first.focus(); }
    }
    document.getElementById("lgToSignup").addEventListener("click", function () { showView("signup"); });
    document.getElementById("lgToLogin").addEventListener("click", function () { showView("login"); });

    /* ---- loading state ---- */
    function setBusy(btn, on, label) {
      var spin = btn.querySelector(".lg-spin");
      var lb = btn.querySelector(".lb");
      btn.disabled = on;
      if (spin) { spin.hidden = !on; }
      if (lb) { lb.textContent = on ? label : btn.getAttribute("data-idle"); }
    }

    /* ============================= LOG IN ============================= */
    var liEmail = document.getElementById("lgLiEmail");
    var liPass = document.getElementById("lgLiPass");
    var liBtn = document.getElementById("lgLiSubmit");
    [liEmail, liPass].forEach(function (el) {
      el.addEventListener("input", function () { resetError(el); });
    });

    document.getElementById("lgLoginForm").addEventListener("submit", function (e) {
      e.preventDefault();

      var ok = true;
      var mail = liEmail.value.trim();

      if (!mail) { setError(liEmail, "Email is required."); ok = false; }
      else if (!EMAIL_RE.test(mail)) { setError(liEmail, "Enter a valid email address."); ok = false; }

      if (!liPass.value) { setError(liPass, "Password is required."); ok = false; }
      else if (liPass.value.length < 8) { setError(liPass, "Password must be at least 8 characters."); ok = false; }

      if (!ok) { focusFirstInvalid(gate); return; }

      setBusy(liBtn, true, "Signing in\u2026");

      var request = USE_REAL_API
        ? apiPost("/login", { email: mail, password: liPass.value })
        : Promise.resolve({ email: mail });          /* DEMO AUTH — no backend call */

      request.then(function (res) {
        setBusy(liBtn, false);
        ungate(saveSession(mail, (res && res.name) || ""));
        document.getElementById("lgLoginForm").reset();
      }).catch(function () {
        setBusy(liBtn, false);
        setError(liPass, "Could not sign in. Please try again.");
      });
    });

    /* ============================ SIGN UP ============================ */
    var suEmail = document.getElementById("lgSuEmail");
    var suUser = document.getElementById("lgSuUser");
    var suPass = document.getElementById("lgSuPass");
    var suPass2 = document.getElementById("lgSuPass2");
    var suBtn = document.getElementById("lgSuSubmit");

    [suEmail, suUser, suPass, suPass2].forEach(function (el) {
      el.addEventListener("input", function () { resetError(el); });
    });

    document.getElementById("lgSignupForm").addEventListener("submit", function (e) {
      e.preventDefault();

      var ok = true;
      var mail = suEmail.value.trim();
      var user = suUser.value.trim();

      if (!mail) { setError(suEmail, "Email is required."); ok = false; }
      else if (!EMAIL_RE.test(mail)) { setError(suEmail, "Enter a valid email address."); ok = false; }

      if (!user) { setError(suUser, "Username is required."); ok = false; }
      else if (!USERNAME_RE.test(user)) {
        setError(suUser, "Use 3-20 letters, numbers, dot, dash or underscore.");
        ok = false;
      }

      if (!suPass.value) { setError(suPass, "Password is required."); ok = false; }
      else if (suPass.value.length < 8) { setError(suPass, "Password must be at least 8 characters."); ok = false; }

      if (!suPass2.value) { setError(suPass2, "Please confirm your password."); ok = false; }
      else if (suPass.value !== suPass2.value) { setError(suPass2, "Passwords do not match."); ok = false; }

      if (!ok) { focusFirstInvalid(signupView); return; }

      setBusy(suBtn, true, "Creating account\u2026");

      var request = USE_REAL_API
        ? apiPost("/signup", { email: mail, username: user, password: suPass.value })
        : Promise.resolve({ email: mail });          /* DEMO AUTH — no backend call */

      request.then(function (res) {
        setBusy(suBtn, false);
        ungate(saveSession(mail, (res && res.name) || user));
        document.getElementById("lgSignupForm").reset();
      }).catch(function () {
        setBusy(suBtn, false);
        setError(suEmail, "Could not create your account. Please try again.");
      });
    });

    /* ---- visual-only placeholders ---- */
    document.getElementById("lgGoogle").addEventListener("click", function () {
      alert("Google sign-in is coming soon.");
    });
    document.getElementById("lgForgot").addEventListener("click", function () {
      alert("Password reset coming soon.");
    });

    /* ---- logout: header, mobile menu, footer ---- */
    var logoutBtns = document.querySelectorAll("[data-ts-logout]");
    for (var i = 0; i < logoutBtns.length; i++) {
      logoutBtns[i].addEventListener("click", function () { regate(); });
    }
  });
}());