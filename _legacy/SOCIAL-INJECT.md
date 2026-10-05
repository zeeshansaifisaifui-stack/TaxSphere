# SOCIAL-INJECT.md — Part E: footer / contact social block

**Owner:** frontend-interaction agent.
**Target file:** `index.html` — *single shot, paste exactly as written.*

This replaces the footer `.social-row` (currently `href="#"` placeholders).
Every URL below is the canonical, UTM-free link from the contract. Paste the
block **over the existing `<div class="social-row">…</div>`** inside
`.footer-brand`.

---

## Paste block (footer)

```html
<div class="social-row">
  <a class="social-btn"
     href="https://wa.me/918126780246?text=Hi%20TaxSphere%2C%20I%20need%20help%20with%20GST%2FITR%2FTDS%20filing."
     target="_blank" rel="noopener noreferrer"
     aria-label="Chat with TaxSphere Consultancy on WhatsApp (opens in a new tab)">💬 WhatsApp</a>

  <a class="social-btn"
     href="https://www.instagram.com/taxsphere11"
     target="_blank" rel="noopener noreferrer"
     aria-label="TaxSphere Consultancy on Instagram (opens in a new tab)">📷 Instagram</a>

  <a class="social-btn"
     href="https://wa.me/919219481572?text=Hi%20TaxSphere%2C%20I%20need%20help%20with%20GST%2FITR%2FTDS%20filing."
     target="_blank" rel="noopener noreferrer"
     aria-label="Chat with TaxSphere Consultancy on the alternate number (opens in a new tab)">📱 Alternate WA</a>

  <a class="social-btn"
     href="mailto:Taxsphere11@gmail.com"
     aria-label="Email TaxSphere Consultancy">✉️ Email</a>
</div>
```

> **Google Business** has no URL in the contract (it is `#` in
> `SOCIAL-LINKS.js`), so it is deliberately **omitted** rather than shipped as
> a dead link. Add it back the moment a real profile URL exists — set it in
> `SOCIAL-LINKS.js` first, then mirror the value here.

---

## Optional: contact-section WhatsApp chips

Paste **inside** the WhatsApp `.info-card` (the one holding the two
`a.wa` rows) only if you want a direct-call row:

```html
<span class="val">
  <a class="wa" href="tel:+918126780246">Call 8126780246</a><br>
  <a class="wa" href="tel:+919219481572">Call 9219481572</a>
</span>
```

---

## Why this is safe alongside `instagram.js`

`instagram.js` looks for
`footer a.social-btn[aria-label*="Instagram"]` and only rewrites `href`,
`target` and `rel` **if** they are not already the canonical Instagram URL.
After this paste it is a no-op — the two mechanisms never fight.

---

## Verify

```powershell
Select-String -Path index.html -Pattern 'href="#"'   # footer should be empty of social placeholders
```

1. Every footer chip is clickable, opens in a new tab, and carries an
   `aria-label`.
2. No social link contains `?stkn=`, `?utm_`, `fbclid` or any other
   tracking parameter (WhatsApp's `?text=` prefill is intentional).
3. Keyboard tab order through `.social-row` is 4 stops, each with a visible
   focus ring (`popups.css.draft.md` §7 supplies `.ts-auth-link`; the rest
   already have `:focus-visible` rules).

---

## Rollback

Restore the original three-chip row:

```html
<div class="social-row">
  <a class="social-btn" href="https://wa.me/918126780246?text=Hi%20TaxSphere%2C%20I%20need%20help%20with%20GST%2FITR%2FTDS%20filing." target="_blank" rel="noopener" aria-label="Chat with TaxSphere Consultancy on WhatsApp">💬 WhatsApp</a>
  <a class="social-btn" href="#" aria-label="TaxSphere Consultancy on Instagram">📷 Instagram</a>
  <a class="social-btn" href="#" aria-label="TaxSphere Consultancy on Google Business Profile">📍 Google Business</a>
</div>
```
