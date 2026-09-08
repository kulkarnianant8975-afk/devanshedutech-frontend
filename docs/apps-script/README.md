# Apps Script — registrations

The landing-page forms POST to a Google Apps Script web app, which appends a
row to a spreadsheet. The scripts live in Google; these copies exist so the
code is reviewable and does not vanish with a Google account.

## Two separate scripts

| Workshop | Pages | Script | Spreadsheet |
|---|---|---|---|
| Python + Job Hunt, 19 Sept | `/pyen`, `/pyma` | "Python workshop" — `python-workshop.gs` | [Python Workshop](https://docs.google.com/spreadsheets/d/1PZ3pGWVCLeX_qdGHonldxA1OaUSidg_JPJzN5CnmOeA/edit) |
| Digital Marketing, 11 Sept | `/dien`, `/dima` | its own, unchanged | the original sheet |

Each page points at its own script through `scriptUrl` in
`public/masterclass-assets/config.js` / `config-python.js`. Nothing is
shared, so a change to one workshop cannot disturb the other.

## Deploying the Python script

1. Paste `python-workshop.gs` into the project's `Code.gs`, replacing all of it.
2. **Deploy → New deployment** → gear icon → **Web app**.
3. Execute as: **Me**. Who has access: **Anyone** — the pages post without
   credentials, and "Anyone with Google account" would reject them.
4. **Deploy**, authorise when asked, and copy the **/exec** URL.
5. Put that URL in `scriptUrl` in `public/masterclass-assets/config-python.js`.

After any later code change: **Deploy → Manage deployments → New version**.
Saving alone changes nothing — the /exec URL keeps serving the last deployed
version.

## Check it before running ads

In the editor pick `testRegistration` and press **Run**. A row reading
"TEST — delete me" should appear on the `Registrations` tab. Delete it.

Then register once on the live page and confirm a second row arrives.
