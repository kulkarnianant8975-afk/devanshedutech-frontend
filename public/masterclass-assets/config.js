/* ============================================================
   EDIT THIS FILE — it is the only place these values live.
   Both index.html and marathi.html read from here.
   ============================================================ */
window.DEVANSH_CONFIG = {

  /* 1. WhatsApp GROUP invite link.
        WhatsApp > the seminar group > Group info > Invite via link > Copy link
        Must look like: https://chat.whatsapp.com/AbCdEf123456
        Until you paste it, the form warns instead of redirecting. */
  groupLink: "https://chat.whatsapp.com/Hlu1u0IgS5yEecTfTjHjPd",

  /* 2. Google Apps Script web-app URL that writes to your Sheet.
        Follow SETUP-GOOGLE-SHEET.md, then paste the /exec URL here.
        Leave as-is to skip saving and go straight to the group. */
  scriptUrl: "PASTE_YOUR_APPS_SCRIPT_EXEC_URL",

  /* 3. Your WhatsApp number for direct questions (no +, with country code) */
  whatsappNumber: "917972217407",

  /* 4. Seats — shown in the "x of 40 left" line */
  totalSeats: 40,

  /* 5. How long to wait for the Sheet before sending them to the group anyway.
        The registration is never blocked by a slow network. */
  saveTimeoutMs: 6000
};
