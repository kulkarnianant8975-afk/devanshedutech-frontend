# Registrations Apps Script

`registrations.gs` is the script behind the `scriptUrl` in
`public/masterclass-assets/config.js` and `config-python.js`.

It lives in Google, not here — this copy exists so the code is reviewable and
does not vanish with a Google account.

## Where registrations go

| Page | sends `sheet` | lands in |
|---|---|---|
| `/pyen`, `/pyma` | `Python 19 Sept` | **Python + Job Hunt Workshop Registrations** spreadsheet, `Registrations` tab |
| `/dien`, `/dima` | nothing | the spreadsheet the script is bound to, first tab — as before |

Python spreadsheet:
<https://docs.google.com/spreadsheets/d/12DLTTMO74-y-a66cbuUooD9TNIyIOopIY3HVDOXbD-E/edit>

The spreadsheet id is in the script, not on the landing page: the page is
public and anyone can read its config file.

## Updating it

1. Open the **existing** registrations spreadsheet → **Extensions → Apps Script**.
2. Replace the existing `doPost` with everything in `registrations.gs`.
3. **Deploy → Manage deployments** → pencil → **Version: New version** → **Deploy**.
4. Google will ask to re-authorise, because the script now opens a second
   spreadsheet. Accept it. Keep "Who has access" as **Anyone** — the pages post
   without credentials.

The `/exec` URL does not change, so no page needs editing.

## Check it before running ads

In the Apps Script editor, select `testPythonRouting` and press **Run**. Then
open the Python spreadsheet: a row named "TEST — delete me" should be on the
`Registrations` tab. Delete it.

If the `note` field in the log is not empty, the script could not open the
Python spreadsheet — almost always because it was created by a different
Google account. Share that spreadsheet with the account that owns the Apps
Script, as **Editor**, and run the test again.

**Registrations are never dropped on that failure.** The row falls back to the
bound spreadsheet rather than being lost, so a permissions mistake costs you a
tidy sheet, not a student.
