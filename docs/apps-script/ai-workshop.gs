/**
 * AI/ML, Data Science, Data Analytics & AI Engineering Workshop — 6 December 2026.
 * Receives registrations from /aien and /aima.
 *
 * Paste this whole file into your Google Apps Script project for the AI workshop,
 * replacing everything in Code.gs.
 */

/* Replace with your Google Spreadsheet ID (found in the URL of your Google Sheet) */
var SPREADSHEET_ID = '1PZ3pGWVCLeX_qdGHonldxA1OaUSidg_JPJzN5CnmOeA';
var DEFAULT_TAB    = 'AI_DS_Workshop';

function doPost(e) {
  var p  = (e && e.parameter) || {};
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var tabName = (p.sheet || '').toString().trim() || DEFAULT_TAB;
  var sh = ss.getSheetByName(tabName);
  var isNew = false;
  if (!sh) { sh = ss.insertSheet(tabName.slice(0, 90)); isNew = true; }

  // `sheet` is routing, not data — it should not become a column.
  var fields = Object.keys(p).filter(function (k) { return k !== 'sheet'; });

  // Columns come from the sheet's own header row.
  var headers;
  if (isNew || sh.getLastRow() === 0) {
    headers = ['timestamp'].concat(fields);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  }

  // Append new row
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
  return ContentService.createTextOutput('AI/ML & Data Science workshop registrations endpoint is live.');
}
