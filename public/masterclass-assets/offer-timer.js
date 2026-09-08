/* ============================================================
   "₹499 — free for the next 10:00" countdown.

   Shared by the workshop landing pages. Reads offerMinutes and
   originalPrice from config.js / config-python.js.
   ============================================================ */
(function () {
  "use strict";

  var CFG   = window.DEVANSH_CONFIG || {};
  var bands = document.querySelectorAll("[data-offer]");
  if (!bands.length || !CFG.offerMinutes) return;

  var lang = document.documentElement.lang === "mr" ? "mr" : "en";
  var T = {
    en: { free: "FREE", forNext: "Offer ends in {t}", last: "Last chance — still free today" },
    mr: { free: "मोफत", forNext: "ही offer {t} मध्ये संपेल", last: "शेवटची संधी — आजही मोफत" }
  }[lang];

  /* The rest of the Marathi page is written in Devanagari numerals, so a clock
     ticking in Latin digits beside "५० जागा" would look like a different page. */
  var DEV = "०१२३४५६७८९";
  function digits(s) {
    return lang === "mr" ? String(s).replace(/[0-9]/g, function (d) { return DEV[+d]; }) : String(s);
  }
  function two(n) { return (n < 10 ? "0" : "") + n; }

  /* Anchored to the visitor's first arrival, not to page load. A countdown that
     restarts on every refresh is one the visitor catches immediately, and a
     claim nobody believes is worse than no claim. Per workshop rather than per
     page, so switching to the Marathi version does not hand out a fresh ten
     minutes. */
  var KEY = "dvt_offer_" + (CFG.eventName || "default").replace(/\W+/g, "_");
  var WINDOW_MS = CFG.offerMinutes * 60 * 1000;

  function startedAt() {
    var now = Date.now();
    try {
      var saved = parseInt(localStorage.getItem(KEY), 10);
      /* A stored time in the future means a clock change; treat it as now. */
      if (saved && saved <= now) return saved;
      localStorage.setItem(KEY, String(now));
    } catch (e) { /* private mode: the timer simply runs for this page view */ }
    return now;
  }

  var began = startedAt();

  function render() {
    var left = WINDOW_MS - (Date.now() - began);

    if (left <= 0) {
      bands.forEach(function (b) {
        b.setAttribute("data-state", "over");
        var cd = b.querySelector("[data-offer-countdown]");
        if (cd) cd.textContent = T.last;
      });
      clearInterval(tick);
      return;
    }

    var total = Math.floor(left / 1000);
    var clock = digits(two(Math.floor(total / 60)) + ":" + two(total % 60));
    var text  = T.forNext.replace("{t}", clock);
    bands.forEach(function (b) {
      var cd = b.querySelector("[data-offer-countdown]");
      if (cd) cd.textContent = text;
    });
  }

  /* Prices and the "FREE" word come from here too, so a page never shows a
     figure that disagrees with the config the form was set up from. */
  bands.forEach(function (b) {
    var was = b.querySelector("[data-offer-was]");
    var now = b.querySelector("[data-offer-now]");
    if (was && CFG.originalPrice) was.textContent = "₹" + digits(CFG.originalPrice);
    if (now) now.textContent = T.free;
  });

  render();
  var tick = setInterval(render, 1000);

  /* A phone that has been asleep for an hour comes back with a stale clock. */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) render();
  });
})();
