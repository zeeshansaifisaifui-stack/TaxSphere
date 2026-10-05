# TaxSphere Consultancy — Website

Single-page marketing website for TaxSphere Consultancy, Amroha (Uttar Pradesh).
Plain HTML5 + CSS3 + vanilla JS. No build tools, no frameworks, no jQuery.

```
project/
├── index.html        everything inline (CSS in <style>, JS in <script>)
├── README.md         this file
├── assets/
│   ├── auth-gate.js
│   └── reviews.js
└── tools/
    └── verify-encoding.py
```

Open `index.html` by double-clicking it — the page works fully from `file://`.
All paths are relative, so it also works over FTP, Hostinger, cPanel, or Netlify.

---

## Verified quality checks

| Check | Result |
|---|---|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| Cumulative Layout Shift | 0 |
| Horizontal scroll @ 375px | none |
| Tap targets | all ≥ 44×44px |
| Console errors | none |

Breakpoints tested: 375, 480, 768, 1024, 1366, 1536 px.

---

## Sections (in order)

1. Sticky header — logo, desktop nav, mobile hamburger, "Get Free Consultation" CTA
2. Hero — headline, 3 CTAs, trust line, "What you get with us" card
3. Our Services — 8 main cards + 12-chip "Complete GST Suite"
4. Why TaxSphere Consultancy — 4 pillar cards
5. About — 2 paragraphs, Hindi tagline, stats strip, navy address card
6. Client Reviews — 3 testimonials
7. Contact — info cards, map iframe, enquiry form
8. Footer — brand, 4 link columns, legal row

Floating UI: WhatsApp button (pulse) bottom-right, back-to-top button above it
(appears after 400px scroll).

---

## How to edit contact details

All contact info lives in `index.html`. Find and replace these values everywhere
(use Ctrl+H / Find-and-Replace across the whole file):

| What | Current value | Search for |
|---|---|---|
| Phone 1 | 8126780246 | `8126780246` and `+918126780246` |
| Phone 2 | 9219481572 | `9219481572` and `+919219481572` |
| Email | Taxsphere11@gmail.com | `Taxsphere11@gmail.com` |
| Address | Mohammadi Sarai, Near R.N Inter College, Amroha, Uttar Pradesh | `Mohammadi Sarai` |
| Map | Google Maps embed | `maps.google.com` |
| Default WhatsApp number (form submit) | 918126780246 | `WA_NUMBER` in the `<script>` block |

Keep the international format for links: `tel:+918126780246`,
`https://wa.me/918126780246?text=...` (no `+`, no spaces).

The WhatsApp prefilled text lives inline in each link:
`?text=Hi%20TaxSphere%2C%20I%20need%20help%20with%20GST%2FITR%2FTDS%20filing.`

---

## How to change colours

Edit the `:root` block near the top of the `<style>` section:

```css
--navy:#203890;  --navy-deep:#14246B;
--copper:#B07848;  --copper-light:#C9966A;
--copper-text:#8A5A2B;  /* accessible copper for text on light backgrounds */
--copper-btn:#94602F;   /* accessible copper for white text on filled buttons */
--bg:#FAFAF7;  --text:#0F172A;  --muted:#475569;  --divider:#E5E7EB;  --wa:#25D366;
```

`--copper` is the brand accent (borders, gradients, large display text).
`--copper-text` and `--copper-btn` are slightly darker shades that pass WCAG AA
when used for small text or white text on a filled background. Keep using them
for body-size text so contrast stays accessible.

Fonts are loaded from Google Fonts: Poppins (headings) + Inter (body), both with
`display=swap`.

---

## DIY hosting checklist

1. **Buy a domain** — search `taxsphereconsultancy.in` (or `.com`) on GoDaddy /
   Hostinger / BigRock. `.in` is cheaper and geo-relevant.
2. **Buy hosting** — Hostinger **Business** (≈ ₹199/month) or any cPanel host.
   Pick the nearest data centre (Mumbai / Singapore) for faster India load times.
3. **Upload the site** — Hostinger: *File Manager* → open `public_html` →
   *Upload Files* → select `index.html` and the whole `assets/` folder.
   FTP alternative: FileZilla, host `ftp.yourdomain.com`, user `ftp`, password
   from the hosting panel, port 21, upload into `public_html/`.
4. **Point the domain** — in the hosting panel find the two nameservers
   (e.g. `ns1.dns-parking.com`, `ns2.dns-parking.com`) and set them as the
   domain's nameservers at your domain registrar. DNS propagates in 1–24 hours.
5. **Enable free SSL** — Hostinger: *Security* → *SSL* → install the free
   Let's Encrypt certificate. The site then works on `https://` only.
6. **Get found on Google** —
   - Google Search Console: add the property, verify with DNS, then
     *Sitemaps* → submit `sitemap.xml`.
   - Google Business Profile: create a listing with the name, category
     ("Tax consultant" / "Accountant"), address, phone, hours, and logo. This is
     what drives local map results for Amroha searches.
   - Bing Webmaster Tools (optional, imports from Search Console).

### Optional: send real email
Hostinger mail lets you use `contact@taxsphereconsultancy.in`. To receive
enquiries in Gmail, add the domain to Gmail via *Settings → Accounts → Add
another email address*, then add Hostinger's DKIM/SPF DNS records.

### Optional: real form backend
The form currently validates, shows a success toast, and hands the enquiry to
WhatsApp. To also store submissions, point the `<form>` at Formspree/Basin
(Get a free endpoint URL, then set `action` on the form and remove the
`preventDefault()` line in the script).

---

## Adding Privacy Policy / Terms & Conditions / Disclaimer pages later

The footer currently links **Privacy Policy**, **Terms & Conditions** and
**Disclaimer** to `#contact` and shows a "page coming soon" toast. To publish
real pages:

1. Create `privacy.html`, `terms.html`, `disclaimer.html` in the project root,
   each with the same `<head>` (title, description) and a simple
   `.container` + `<h1>` + `<p>` body. Copy the `<header class="site-header">`
   and `<footer>` blocks from `index.html` so navigation stays consistent.
2. In `index.html`, replace each placeholder link:

   ```html
   <a href="#contact" data-note="placeholder">Privacy Policy</a>
   ```

   with

   ```html
   <a href="privacy.html">Privacy Policy</a>
   ```

   Do this for both the *Support* column and the *footer-bottom* legal row
   (6 links total).
3. Upload the new `.html` files to `public_html` alongside `index.html`.

Suggested page copy: state what personal data the form collects (name, phone,
email, message), that it is used only to respond to the enquiry and is not sold,
and that tax advice is general information, not a formal opinion.

---

## Accessibility & behaviour notes

- All interactive elements are keyboard reachable; mobile menu closes on `Escape`.
- Icon-only buttons (hamburger, back-to-top, WhatsApp) have `aria-label`s.
- Every form field has a `<label>` bound to its `id`; errors are announced
  via `aria-invalid` and an inline message.
- Section animations respect `prefers-reduced-motion`.
- Floating buttons sit above the WhatsApp button, and both are keyboard
  accessible.

## Browser support

Chrome, Edge, Firefox and Safari (desktop and mobile), current versions. The page
uses CSS custom properties, Grid, `IntersectionObserver` and `backdrop-filter`
(with graceful degradation).
