/**
 * Devansh Edu-Tech Workshop Registration Receiver
 * Compatible with Data Science, Data Analytics, AI/ML, AI Engineering, and Python.
 *
 * HOW TO ATTACH TO YOUR GOOGLE SHEET:
 * 1. Open your Google Sheet (e.g. "Data science workshop-06-dec-2026")
 * 2. In top menu click: Extensions > Apps Script
 * 3. Delete any text in Code.gs and PASTE ALL OF THIS CODE
 * 4. Click Deploy > New deployment (or Manage deployments > Edit > New version)
 *    - Select type: Web app
 *    - Description: Workshop Registration Webhook
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone  <-- (CRITICAL: Must choose "Anyone", not "Only myself")
 * 5. Click Deploy and copy the Web app URL (ends with /exec)
 * 6. Send the /exec URL or paste it into config-datascience.js as scriptUrl.
 */

/* If standalone script, put your Google Spreadsheet ID here (from the URL of your sheet) */
var SPREADSHEET_ID = '1XP0ORB5psVLo8YIf8mMQlUcAO3fbx9g5p6Hr288J8xI';
var DEFAULT_TAB    = 'Sheet1';

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doPost(e) {
  var p  = (e && e.parameter) || {};
  var ss = getSpreadsheet();

  var tabName = (p.sheet || '').toString().trim() || DEFAULT_TAB;
  var sh = ss.getSheetByName(tabName);
  var isNew = false;
  if (!sh) {
    sh = ss.insertSheet(tabName.slice(0, 90));
    isNew = true;
  }

  // Desired column order
  var standardColumns = [
    'Timestamp',
    'Full Name',
    'Phone',
    'Email',
    'Status / Occupation',
    'Current Year / Semester',
    'Passout Year',
    'City',
    'Source',
    'Language',
    'Landing Page'
  ];

  if (isNew || sh.getLastRow() === 0) {
    sh.appendRow(standardColumns);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, standardColumns.length)
      .setFontWeight('bold')
      .setBackground('#071f42')
      .setFontColor('#ffffff');
  }

  // Map incoming parameters to columns
  var rowData = [
    new Date(),
    p.name || '',
    p.phone || '',
    p.email || '',
    p.status || '',
    p.currentYear || '',
    p.passoutYear || '',
    p.city || '',
    p.source || '',
    p.language || '',
    p.page || ''
  ];

  sh.appendRow(rowData);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, tab: sh.getName() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Devansh Edu-Tech Workshop Registration endpoint is live.');
}

function testRegistration() {
  Logger.log(doPost({ parameter: {
    name: 'Student Name',
    phone: '9876543210',
    email: 'student@example.com',
    status: 'Engineering student',
    currentYear: '3rd Year (Sem 5 / 6)',
    passoutYear: '2026',
    city: 'Parbhani',
    source: 'Instagram',
    language: 'en',
    page: 'test-run',
    sheet: 'Sheet1'
  }}).getContent());
}
