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
  groupLink: "PASTE_PYTHON_WHATSAPP_GROUP_LINK_HERE",

  /* 2. Google Apps Script web-app URL that writes to the Sheet.
        Same sheet as the other masterclass: every row carries a
        `page` column, so Python registrations are told apart by
        /pyen and /pyma without needing a second script. */
  scriptUrl: "https://script.google.com/macros/s/AKfycbxfBiKVSQYUcUbSBicP9JHY2LODYidsAn2EC1njBjhi-2b9sHvyggm0vWCIykehE2D1Nw/exec",

  /* 3. Which TAB of that spreadsheet these registrations land in.
        Same sheet as the Digital Marketing masterclass, separate tab, so the
        two workshops do not interleave in one list. The Apps Script creates
        the tab on the first registration if it does not exist yet.
        Leave it out and rows go to the first tab, as they always have. */
  sheetTab: "Python 19 Sept",

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
