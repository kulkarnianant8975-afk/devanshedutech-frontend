# Registrations Apps Script

`registrations.gs` is the script behind the `scriptUrl` in
`public/masterclass-assets/config.js` and `config-python.js`.

It lives in Google, not here — this copy exists so the code is reviewable and
does not disappear with a Google account.

## Updating it

1. Open the registrations spreadsheet → **Extensions → Apps Script**.
2. Replace the existing `doPost` with the one in `registrations.gs`.
3. **Deploy → Manage deployments →** edit the active deployment → **Version:
   New version → Deploy**. Editing the code alone changes nothing: the `/exec`
   URL keeps serving the version that was deployed.
4. Keep "Who has access" as **Anyone**. The pages post without credentials.

The `/exec` URL does not change, so no page needs editing.

## How a row is routed

The page sends a `sheet` field naming the tab it belongs in:

| Page | `sheet` sent | Lands in |
|---|---|---|
| `/pyen`, `/pyma` | `Python 19 Sept` | that tab, created on the first registration |
| `/dien`, `/dima` | nothing | the first tab, as before |

Change the tab name in `config-python.js` (`sheetTab`) — not here.

## Checking it works

Open the `/exec` URL in a browser. It should say the endpoint is live. Then
register once on `/pyen` and confirm a row appears on the **Python 19 Sept**
tab with a timestamp.
