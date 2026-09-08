/**
 * Devansh Edu-Tech — workshop registrations.
 *
 * One deployed script serves every landing page. The page names which
 * workshop it belongs to (the `sheet` field); this decides where that row
 * is written.
 *
 * Replace the existing doPost with this, then Deploy → Manage deployments →
 * New version. Saving alone changes nothing: the /exec URL keeps serving
 * whatever was last deployed.
 */

/**
 * Where each workshop's registrations go.
 *
 * The spreadsheet id lives here rather than on the landing page, because the
 * page is public and its config file can be read by anyone.
 *
 * To add a workshop: create the spreadsheet, put its id here under the same
 * name the page sends in `sheetTab`, and deploy a new version.
 */
var TARGETS = {
  'Python 19 Sept': {
    spreadsheetId: '12DLTTMO74-y-a66cbuUooD9TNIyIOopIY3HVDOXbD-E',
    tab: 'Registrations'
  }
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  var wanted = (p.sheet || '').toString().trim();
  var target = TARGETS[wanted];

  var ss, note = '';

  if (target) {
    try {
      ss = SpreadsheetApp.openById(target.spreadsheetId);
    } catch (err) {
      /* The target exists but this account cannot open it — usually the
         spreadsheet was created by a different Google account and never
         shared with this one.

         The row is NOT dropped. A registration form that silently loses a
         student because of a permissions problem is far worse than one that
         files them in the wrong place, so it falls back to the spreadsheet
         this script is bound to and says so in the response. */
      note = 'could not open ' + target.spreadsheetId + ': ' + err;
      target = null;
    }
  }

  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  // With a target, its named tab. Without one, a tab named after the
  // workshop, or the first tab when the page sent no name at all — which is
  // where the Digital Marketing pages have always gone.
  var tabName = target ? target.tab : wanted;
  var sh = tabName ? ss.getSheetByName(tabName) : ss.getSheets()[0];

  var isNew = false;
  if (!sh) {
    sh = ss.insertSheet(String(tabName).slice(0, 90));
    isNew = true;
  }

  // `sheet` is routing, not data — it should not become a column.
  var fields = Object.keys(p).filter(function (k) { return k !== 'sheet'; });

  // Columns come from the tab's own header row, never a list hardcoded here.
  // An existing sheet keeps whatever order it already has, and a new one is
  // built from the fields the page actually sent. That is what lets a single
  // script serve workshops whose sheets do not match each other.
  var headers;
  if (isNew || sh.getLastRow() === 0) {
    headers = ['timestamp'].concat(fields);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }

  // A field with no column is dropped rather than appended: shifting every
  // later value one cell across is much worse than one blank cell.
  sh.appendRow(headers.map(function (h) {
    var key = String(h).trim();
    if (key === 'timestamp') return new Date();
    return Object.prototype.hasOwnProperty.call(p, key) ? p[key] : '';
  }));

  return ContentService.createTextOutput(JSON.stringify({
    ok: true, spreadsheet: ss.getName(), tab: sh.getName(), created: isNew, note: note
  })).setMimeType(ContentService.MimeType.JSON);
}

/** Open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return ContentService.createTextOutput('Devansh registrations endpoint is live.');
}

/**
 * Run this once from the editor after deploying.
 *
 * It writes a row exactly as the live page would, which proves the routing
 * and the permissions in one go — rather than finding out from a student
 * whose registration went missing.
 */
function testPythonRouting() {
  var out = doPost({ parameter: {
    name: 'TEST — delete me', phone: '9999999999', email: 'test@example.com',
    status: 'Student', city: 'Parbhani', source: 'Test',
    language: 'en', page: 'apps-script-test', sheet: 'Python 19 Sept'
  }});
  Logger.log(out.getContent());
}
