/**
 * Python + Job Hunt Workshop — 19 September 2026.
 * Receives registrations from /pyen and /pyma.
 *
 * Paste this whole file into the "Python workshop" Apps Script project,
 * replacing everything in Code.gs.
 */

/* Opened by id rather than SpreadsheetApp.getActiveSpreadsheet(), so this
   works whether the project is bound to the sheet or standalone. A
   standalone script has no active spreadsheet and would fail at run time. */
var SPREADSHEET_ID = '1PZ3pGWVCLeX_qdGHonldxA1OaUSidg_JPJzN5CnmOeA';
var DEFAULT_TAB    = 'Registrations';

function doPost(e) {
  var p  = (e && e.parameter) || {};
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var tabName = (p.sheet || '').toString().trim() || DEFAULT_TAB;
  var sh = ss.getSheetByName(tabName);
  var isNew = false;
  if (!sh) { sh = ss.insertSheet(tabName.slice(0, 90)); isNew = true; }

  // `sheet` is routing, not data — it should not become a column.
  var fields = Object.keys(p).filter(function (k) { return k !== 'sheet'; });

  // Columns come from the sheet's own header row, never a list hardcoded
  // here. Add a column by hand later and rows keep filling it correctly.
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, tab: sh.getName() }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return ContentService.createTextOutput('Python workshop registrations endpoint is live.');
}

/**
 * Run this once from the editor after deploying.
 *
 * It writes a row exactly as the live page does, which proves the sheet id
 * and the permissions together — better than learning they were wrong from
 * a student whose seat was never booked.
 */
function testRegistration() {
  Logger.log(doPost({ parameter: {
    name: 'TEST — delete me', phone: '9999999999', email: 'test@example.com',
    status: 'Polytechnic student', city: 'Parbhani', source: 'Instagram',
    language: 'en', page: 'apps-script-test', sheet: 'Registrations'
  }}).getContent());
}
