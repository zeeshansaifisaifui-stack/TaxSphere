// /SOCIAL-LINKS.js — load via <script src="SOCIAL-LINKS.js"></script>
// placed BEFORE instagram.js and BEFORE any other consumer.
// Single source of truth. Edit ONE value, every surface updates.

(function () {
  var RAW = {
    whatsapp:       'https://wa.me/918126780246',
    whatsapp2:      'https://wa.me/919219481572',
    call:           'tel:+918126780246',
    call2:          'tel:+919219481572',
    email:          'mailto:Taxsphere11@gmail.com',
    instagram:      'https://www.instagram.com/taxsphere11',
    googleBusiness: '#'
  };

  // Defensive strip of ANY tracking query string (?stkn=, ?utm_=, etc).
  // Production URLs must always be clean.
  Object.keys(RAW).forEach(function (k) {
    if (typeof RAW[k] === 'string' && RAW[k].indexOf('?') !== -1) {
      var parts = RAW[k].split('?');
      RAW[k] = parts[0];
    }
  });

  window.__TAXSPHERE_SOCIAL__    = RAW;
  window.__TAXSPHERE_INSTAGRAM__ = RAW.instagram;  // legacy hook
})();
