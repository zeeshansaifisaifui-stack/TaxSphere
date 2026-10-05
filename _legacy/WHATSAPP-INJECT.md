# WHATSAPP-INJECT.md

**Owner:** frontend-interaction agent.
**Target file:** `index.html` — *single shot, paste exactly as written.*
**Do not touch:** `styles.css`, `server/**`, `NOTIFY-INJECT.md`, `robots.txt`,
`sitemap.xml`, `README.md`, `AGENTS.md`, `SEO-INJECT.md`.

`index.html` currently runs everything from an inline `<script>` near
`</body>` (line ~999). This pass adds three external files **without editing
any existing line**.

---

## Step 1 — load the three files

Either placement works; both preserve the required order
`SOCIAL-LINKS.js` → `script.js` → `instagram.js`.

**Option A (preferred) — inside `<head>`, deferred:**

```html
<!-- TaxSphere: contact/social single source of truth + client behaviour -->
<script src="SOCIAL-LINKS.js" defer></script>
<script src="script.js" defer></script>
<script src="instagram.js" defer></script>
```

**Option B — immediately before `</body>` (current state of `index.html`):**

```html
<script src="SOCIAL-LINKS.js"></script>
<script src="script.js"></script>
<script src="instagram.js" defer></script>
```

Why both are safe:

* `defer` scripts execute in document order **after** the HTML is parsed and
  **before** `DOMContentLoaded`, so `SOCIAL-LINKS.js` always defines
  `window.__TAXSPHERE_SOCIAL__` before `script.js` reads it.
* At the bottom of `<body>` the document is already parsed, so the
  non-deferred pair runs synchronously in the same order, still *after* the
  existing inline script (which only registers listeners).
* `instagram.js` stays `defer`red either way so it runs after both.

---

## Step 2 (OPTIONAL) — make the success hook fire instantly

`script.js` already detects a successful submission by observing the inline
handler's two visible side-effects:

- a `submit` event captured on `document` (capture phase ⇒ field values are
  read **before** the inline handler resets the form), and
- `#toast` switching to `.is-visible` with a `"Thank you"` message.

So **nothing is required** for `taxsphere:form-success` to fire.

If you additionally control the inline handler and want the event to fire the
moment the server accepts the enquiry, add **one line** inside its success
branch (next to `form.reset()` / `showToast(...)`):

```js
window.__ts_dispatch_success && window.__ts_dispatch_success();
```

That helper is defined by `script.js`. It is **idempotent** (1 s de-dupe on
the event, 2 s on the notify POST), so applying both this line *and* the
built-in observer can never double-dispatch or double-POST.

---

## What this installs

| File | Effect |
|------|--------|
| `SOCIAL-LINKS.js` | Single source of truth for `wa.me`, `tel:`, `mailto:`, Instagram. Strips any `?stkn=`/`?utm_` tracking query. |
| `script.js` | Context-aware WhatsApp prefill per service card, `tel:` click analytics + 600 ms pulse, injected header **Login / Forgot Password** link, `taxsphere:form-success` event + fire-and-forget `POST /api/notify/new-enquiry`, and hot-swap of every static `wa.me` link to the SOCIAL value. |
| `instagram.js` | Injects the Instagram contact row before the map, upgrades the footer Instagram button from `href="#"`, adds the follow modal, a bottom-left floating button, and an 8 s post-enquiry nudge (30-day gate via `localStorage`). |
| `popups.css.draft.md` | Draft CSS for the above. **Status: applied** — the block now lives at the end of `styles.css`, which `index.html` links in `<head>`. |

---

## Verify

```powershell
# 1. syntax
node --check script.js
node --check instagram.js
node --check SOCIAL-LINKS.js

# 2. no stray tracking params on canonical links
Select-String -Path index.html -Pattern 'wa\.me/918126780246\?text=' | Measure-Object | % Count
```

In the browser:

1. Service card CTA → WhatsApp opens with
   `Hi TaxSphere, I want help with <Service>. My name is ___, please call back.`
2. Header shows **🔑 Login / Forgot Password** next to *Get Free Consultation*.
3. Footer **📷 Instagram** opens `https://www.instagram.com/taxsphere11`.
4. Contact section shows a 5th row: **Instagram / @taxsphere11** above the map.
5. Submit the form with valid data → toast appears →
   `document.addEventListener('taxsphere:form-success', e => console.log(e))`
   logs once; ~8 s later the Instagram modal appears (first visit only).
6. Submit with an invalid phone → **no** event, **no** modal.

---

## Rollback

Remove the three `<script>` tags from Step 1 (and the optional line from
Step 2). No other file is modified by this pass.
