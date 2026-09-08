/* ============================================================
   PYTHON + JOB HUNT WORKSHOP — 19 September 2026
   EDIT THIS FILE — it is the only place these values live.
   Both /pyen and /pyma read from here.

   Separate from config.js on purpose. That one belongs to the
   Digital Marketing masterclass and sends people to its group;
   sharing it would drop Python registrations into the wrong
   WhatsApp group and mix both workshops in one ad report.
   ============================================================ */
window.DEVANSH_CONFIG = {

  /* 1. WhatsApp GROUP invite link for THIS workshop.
        WhatsApp > the Python workshop group > Group info >
        Invite via link > Copy link.
        Must look like: https://chat.whatsapp.com/AbCdEf123456

        Until you replace it, registration still works and still
        saves — the page just shows "message us on WhatsApp"
        instead of sending people to a group that isn't made yet. */
  groupLink: "https://chat.whatsapp.com/KkXKLuJpuK06M4cepNmDmU",

  /* 2. Google Apps Script web-app URL for THIS workshop.
        Its own script and its own spreadsheet ("Python Workshop"), separate
        from the Digital Marketing one, so a change to either cannot disturb
        the other. The script is in docs/apps-script/python-workshop.gs. */
  scriptUrl: "https://script.google.com/macros/s/AKfycbzDOUmbuj2k0UEapHlKr1zgF4eAu-5tM1frmWlnXRLa7KY7lGfssG0MtB_BkPyOp9wJ/exec",

  /* 3. Which TAB of the Python Workshop spreadsheet rows land on. The whole
        spreadsheet belongs to this workshop, so one tab is enough — and it
        must match the tab the script's own test writes to, or live
        registrations and test rows end up on two different tabs. */
  sheetTab: "Registrations",

  /* 4. WhatsApp number for direct questions (no +, with country code) */
  whatsappNumber: "917972217407",

  /* 5. Seats */
  totalSeats: 50,

  /* 6. Name this workshop carries into Meta Pixel and GTM. Without it
        both workshops report as one campaign and you cannot tell which
        ad filled which room. */
  eventName: "Python + Job Hunt Workshop 19 Sept",

  /* 7. The opening offer. The page shows originalPrice struck through beside
        FREE, and counts down offerMinutes from the visitor's first arrival.
        Set offerMinutes to 0 to remove the band entirely. */
  originalPrice: 499,
  offerMinutes: 10,

  /* 8. How long to wait for the Sheet before continuing anyway. */
  saveTimeoutMs: 6000
};
