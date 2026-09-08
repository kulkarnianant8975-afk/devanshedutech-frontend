/**
 * Devansh Edu-Tech — workshop registrations.
 *
 * Receives a registration from a landing page and appends it to the
 * spreadsheet this script is bound to.
 *
 * Replace the existing doPost with this one. Two things are deliberate:
 *
 *  - A row goes to the tab named in the `sheet` parameter. The Python pages
 *    send "Python 19 Sept"; the Digital Marketing pages send nothing, so
 *    they keep landing on the first tab exactly as they always have.
 *
 *  - Columns are read from the tab's own header row, not hardcoded here.
 *    An existing tab keeps its column order whatever it happens to be, and
 *    a new tab gets headers built from the fields the page actually sent.
 *    That is what lets one script serve both workshops without either
 *    sheet having to match the other.
 */

function doPost(e) {
  var p  = (e && e.parameter) || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // No tab named: the first one, which is where rows went before this change.
  var wanted = (p.sheet || '').toString().trim();
  var sh = wanted ? ss.getSheetByName(wanted) : ss.getSheets()[0];

  var isNew = false;
  if (!sh) {
    sh = ss.insertSheet(wanted.slice(0, 90));
    isNew = true;
  }

  // `sheet` is routing, not data — it should not become a column.
  var fields = Object.keys(p).filter(function (k) { return k !== 'sheet'; });

  var headers;
  if (isNew || sh.getLastRow() === 0) {
    headers = ['timestamp'].concat(fields);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }

  // Built in the sheet's own column order. A field the sheet has no column
  // for is dropped rather than shifting every later value one cell across —
  // a silent column shift is far worse than a missing value.
  var row = headers.map(function (h) {
    var key = String(h).trim();
    if (key === 'timestamp') return new Date();
    return Object.prototype.hasOwnProperty.call(p, key) ? p[key] : '';
  });

  sh.appendRow(row);

  // The page posts opaquely and never reads this, but it makes the script
  // testable from the Apps Script editor.
  return ContentService.createTextOutput(JSON.stringify({
    ok: true, tab: sh.getName(), created: isNew
  })).setMimeType(ContentService.MimeType.JSON);
}

/** Lets you open the /exec URL in a browser to check it is deployed. */
function doGet() {
  return ContentService.createTextOutput('Devansh registrations endpoint is live.');
}
