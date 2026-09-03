/* ============================================================
   Registration form -> Google Sheet -> WhatsApp group.
   Shared by index.html and marathi.html. Edit config.js, not this.
   ============================================================ */
(function () {
  "use strict";

  var CFG  = window.DEVANSH_CONFIG || {};
  var form = document.getElementById("regForm");
  if (!form) return;

  var lang    = document.documentElement.lang === "mr" ? "mr" : "en";
  var panel   = document.getElementById("regSuccess");
  var joinBtn = document.getElementById("joinGroupBtn");
  var submit  = document.getElementById("regSubmit");
  var status  = document.getElementById("regStatus");

  var T = {
    en: {
      name:    "Please enter your name",
      phone:   "Enter a valid 10-digit mobile number",
      pick:    "Please choose an option",
      city:    "Please enter your city or area",
      saving:  "Saving your seat…",
      opening: "Opening the WhatsApp group…",
      noGroup: "You're registered — but the group link isn't set up yet. Please message us on WhatsApp.",
      failed:  "Couldn't reach the server, but your seat is noted. Continue to the group."
    },
    mr: {
      name:    "कृपया तुमचं नाव लिहा",
      phone:   "10 अंकी मोबाइल नंबर बरोबर लिहा",
      pick:    "कृपया एक पर्याय निवडा",
      city:    "कृपया तुमचं शहर किंवा भाग लिहा",
      saving:  "तुमची जागा राखून ठेवत आहोत…",
      opening: "WhatsApp ग्रुप उघडत आहोत…",
      noGroup: "तुमची नोंदणी झाली — पण ग्रुप लिंक अजून सेट केलेली नाही. कृपया आम्हाला WhatsApp वर मेसेज करा.",
      failed:  "सर्व्हरशी संपर्क झाला नाही, पण तुमची जागा नोंदवली आहे. ग्रुपमध्ये सामील व्हा."
    }
  }[lang];

  /* ---------- helpers ---------- */
  function fieldError(el, msg) {
    var box = document.getElementById(el.name + "Err");
    if (box) { box.textContent = msg || ""; box.hidden = !msg; }
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    el.classList.toggle("bad", !!msg);
    return !msg;
  }

  /* Accepts 9876543210, +91 98765 43210, 09876543210 -> 9876543210 */
  function cleanPhone(raw) {
    var d = (raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0")   d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : "";
  }

  function validate() {
    var f = form.elements, ok = true;
    ok = fieldError(f.name,   f.name.value.trim().length >= 2 ? "" : T.name) && ok;
    ok = fieldError(f.phone,  cleanPhone(f.phone.value)        ? "" : T.phone) && ok;
    ok = fieldError(f.status, f.status.value                   ? "" : T.pick) && ok;
    ok = fieldError(f.city,   f.city.value.trim().length >= 2  ? "" : T.city) && ok;
    return ok;
  }

  /* Apps Script has no CORS headers, so we post opaquely and cannot read a reply.
     sendBeacon is the right tool: the browser takes ownership of the POST and
     delivers it even after the page navigates away, so the person is not held
     for Apps Script's 302 redirect chain - which measured ~6s on mobile and is
     exactly where paid traffic gives up. fetch stays as the fallback. */
  function save(data) {
    if (!CFG.scriptUrl || CFG.scriptUrl.indexOf("PASTE_") === 0) return Promise.resolve("skipped");
    var body = new URLSearchParams(data);

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body.toString()],
          { type: "application/x-www-form-urlencoded;charset=UTF-8" });
        if (navigator.sendBeacon(CFG.scriptUrl, blob)) return Promise.resolve("queued");
      } catch (ignore) { /* fall through to fetch */ }
    }

    var net = fetch(CFG.scriptUrl, {
      method: "POST", mode: "no-cors", body: body,
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }
    }).then(function () { return "saved"; });
    var cap = new Promise(function (r) { setTimeout(function () { r("timeout"); }, CFG.saveTimeoutMs || 6000); });
    return Promise.race([net, cap]).catch(function () { return "error"; });
  }

  function finish(result) {
    var link  = CFG.groupLink || "";
    var ready = link && link.indexOf("PASTE_") === -1;

    form.hidden = true;
    if (panel) {
      panel.hidden = false;
      panel.setAttribute("tabindex", "-1");
      panel.focus();
      panel.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    if (!ready) {
      if (joinBtn) {
        joinBtn.href = "https://wa.me/" + (CFG.whatsappNumber || "");
        joinBtn.textContent = joinBtn.getAttribute("data-fallback") || joinBtn.textContent;
      }
      if (status) status.textContent = T.noGroup;
      return;
    }

    if (joinBtn) joinBtn.href = link;
    if (status)  status.textContent = result === "error" ? T.failed : T.opening;
    /* Same-tab navigation: never blocked by a pop-up blocker.
       The button above stays as the manual fallback. */
    setTimeout(function () { window.location.href = link; }, 1400);
  }

  /* ---------- wiring ---------- */
  ["name", "phone", "status", "city"].forEach(function (n) {
    var el = form.elements[n];
    if (el) el.addEventListener("input", function () { if (el.classList.contains("bad")) validate(); });
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (form.elements.website && form.elements.website.value) return; /* honeypot */
    if (!validate()) {
      var bad = form.querySelector(".bad");
      if (bad) bad.focus();
      return;
    }

    submit.disabled = true;
    submit.classList.add("busy");
    if (status) status.textContent = T.saving;

    save({
      name:     form.elements.name.value.trim(),
      phone:    cleanPhone(form.elements.phone.value),
      status:   form.elements.status.value,
      city:     form.elements.city.value.trim(),
      source:   form.elements.source ? form.elements.source.value : "",
      language: lang,
      page:     location.href
    }).then(finish);
  });
})();
