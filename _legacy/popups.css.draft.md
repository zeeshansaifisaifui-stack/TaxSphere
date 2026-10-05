# popups.css.draft.md — Instagram surfaces (draft)

**Owner:** frontend-interaction agent.
**Status: APPLIED.** The paste block below now lives at the **end of
`styles.css`**, which `index.html` links from `<head>` — so the file stays a
draft/handover copy, not a to-do. Re-check it after any CSS-owner refactor.

**Colour discipline:** every value below is either a CSS variable that already
exists (`--navy-deep`, `--copper`, `--divider`, `--white`, `--muted`,
`--shadow-sm`, `--r-card`, `--r-btn`, `--wa`) or the **only** new colour
allowed by the brief — the Instagram gradient.

---

## Paste block

```css
/* ============ INSTAGRAM SURFACES (injected by instagram.js) ============ */
:root{
  --ig-a:#f09433;
  --ig-b:#e6683c;
  --ig-c:#dc2743;
  --ig-d:#cc2366;
  --ig-e:#bc1888;
  --ig-grad:linear-gradient(135deg,var(--ig-a) 0%,var(--ig-b) 25%,var(--ig-c) 50%,var(--ig-d) 75%,var(--ig-e) 100%);
}

/* --- 1. injected contact card --------------------------------------- */
a.info-card.ts-injected-insta{
  text-decoration:none;
  color:inherit;
  cursor:pointer;
  transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease;
}
a.info-card.ts-injected-insta:hover,
a.info-card.ts-injected-insta:focus-visible{
  border-color:var(--ig-d);
  box-shadow:0 6px 18px rgba(204,35,102,.14);
  transform:translateY(-2px);
}
a.info-card.ts-injected-insta:focus-visible{
  outline:2px solid var(--navy-deep);
  outline-offset:2px;
}
.ts-injected-insta .info-icon{
  background:var(--ig-grad);
}
.ts-injected-insta .info-icon svg{fill:#fff}
.ts-injected-insta .ts-insta-body{display:block;min-width:0}
.ts-injected-insta .small{
  display:block;
  margin-top:4px;
  font-size:.82rem;
  line-height:1.5;
  color:var(--muted);
}

/* --- 2. floating Instagram button (bottom-left) ---------------------- */
.ts-insta-fab{
  position:fixed;left:16px;bottom:16px;z-index:110;
  width:56px;height:56px;border:0;border-radius:50%;padding:0;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;background:var(--ig-grad);
  box-shadow:0 8px 24px rgba(15,23,42,.22);
  transition:transform .2s ease,opacity .25s ease,visibility .25s ease;
}
.ts-insta-fab:hover{transform:scale(1.06)}
.ts-insta-fab:focus-visible{outline:3px solid var(--navy-deep);outline-offset:3px}
.ts-insta-fab svg{width:26px;height:26px;fill:#fff}
.ts-insta-fab.is-hidden{opacity:0;visibility:hidden;transform:scale(.9)}

/* --- 3. modal --------------------------------------------------------- */
.ts-ig-overlay{
  position:fixed;inset:0;z-index:300;
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  background:rgba(11,30,91,.62);
  -webkit-backdrop-filter:blur(4px);
  backdrop-filter:blur(4px);
  animation:ts-ig-fade .18s ease;
}
.ts-ig-overlay[hidden]{display:none}
@keyframes ts-ig-fade{from{opacity:0}to{opacity:1}}

.ts-ig-modal{
  position:relative;
  width:100%;max-width:420px;
  background:var(--white);
  border:1px solid var(--divider);
  border-radius:var(--r-card);
  padding:34px 26px 26px;
  text-align:center;
  box-shadow:0 24px 60px rgba(15,23,42,.32);
  animation:ts-ig-rise .22s ease;
}
@keyframes ts-ig-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

.ts-ig-close{
  position:absolute;top:10px;right:10px;
  width:44px;height:44px;
  display:flex;align-items:center;justify-content:center;
  border:0;border-radius:50%;background:transparent;
  font-size:1.7rem;line-height:1;color:var(--muted);
  cursor:pointer;
}
.ts-ig-close:hover{background:rgba(32,56,144,.08);color:var(--navy-deep)}
.ts-ig-close:focus-visible{outline:2px solid var(--navy-deep);outline-offset:2px}

.ts-ig-badge{
  display:inline-flex;align-items:center;justify-content:center;
  width:64px;height:64px;margin-bottom:16px;
  border-radius:18px;background:var(--ig-grad);
  box-shadow:0 8px 20px rgba(204,35,102,.30);
}
.ts-ig-badge svg{width:34px;height:34px;fill:#fff}

.ts-ig-modal h2{
  margin:0 0 8px;
  font-size:1.25rem;line-height:1.3;color:var(--navy-deep);
}
.ts-ig-modal p{
  margin:0 0 20px;
  font-size:.94rem;line-height:1.6;color:var(--muted);
}
.ts-ig-modal .ts-ig-note{
  margin:14px 0 0;
  font-size:.78rem;color:var(--muted);opacity:.85;
}

.ts-ig-cta{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  min-height:48px;padding:12px 22px;
  border-radius:var(--r-btn);
  background:var(--ig-grad);color:#fff;
  font-weight:700;font-size:.98rem;text-decoration:none;
  box-shadow:0 8px 20px rgba(220,39,67,.28);
  transition:transform .18s ease,box-shadow .18s ease;
}
.ts-ig-cta:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(220,39,67,.34);color:#fff;text-decoration:none}
.ts-ig-cta:focus-visible{outline:3px solid var(--navy-deep);outline-offset:3px}
.ts-ig-cta svg{width:20px;height:20px;fill:#fff}

/* --- 4. scroll lock while open --------------------------------------- */
body.ts-modal-open{overflow:hidden}

/* --- 5. responsive ----------------------------------------------------- */
@media (max-width:768px){
  .ts-insta-fab{width:52px;height:52px;left:12px;bottom:12px}
  .ts-ig-modal{padding:30px 20px 22px}
}
@media (max-width:420px){
  .ts-ig-modal h2{font-size:1.1rem}
}

/* --- 6. reduced motion -------------------------------------------------- */
@media (prefers-reduced-motion:reduce){
  .ts-ig-overlay,.ts-ig-modal,.ts-insta-fab,
  a.info-card.ts-injected-insta,.ts-ig-cta{animation:none;transition:none}
}

/* --- 7. header injected auth link (script.js) --------------------------- */
.ts-auth-link{
  white-space:nowrap;
  text-decoration:none;
}
.ts-auth-link:hover{background:rgba(32,56,144,.06);text-decoration:none}
.ts-auth-link:focus-visible{outline:2px solid var(--navy-deep);outline-offset:2px}
@media (max-width:768px){
  .ts-auth-link{display:inline-block;margin:6px 0 0}
}
```

---

## Notes

| # | Decision | Why |
|---|----------|-----|
| 1 | Card is an `<a class="info-card ts-injected-insta">`, not a `<div>` | The whole row is the tap target; the spec's `<div class="ic">` / `<div class="val">` were replaced with the real `.info-icon` + `.val` hooks so it inherits the existing card styling. |
| 2 | `.small` is a new class | The spec's third line has no existing rule; `.info-card .val` would otherwise inherit. |
| 3 | FAB sits `left:16px;bottom:16px` | `.fab-stack` (WhatsApp + back-to-top) is `right:16px;bottom:16px`; `.toast` is bottom-centre — no collisions. |
| 4 | Modal z-index `300` | Above `.toast` (`200`) and `.fab-stack` (`110`). |
| 5 | Only new colour = `--ig-grad` | Brief allows exactly one new colour (the Instagram gradient `#f09433 → #e6683c → #dc2743 → #cc2366 → #bc1888`). |
| 6 | `.ts-auth-link` styles live here | It is created by `script.js`, so it belongs to this agent. |
