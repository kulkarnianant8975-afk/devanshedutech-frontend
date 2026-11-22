/**
 * =========================================================================
 * DEVANSH EDU-TECH — ALL-IN-ONE MASTERCLASS REGISTRATIONS SCRIPT
 * Compatible with: Data Analytics, Data Science, AI/ML, AI Engineering, Python
 * =========================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (e.g., "Data science workshop-06-dec-2026")
 * 2. In the top menu, click: Extensions > Apps Script
 * 3. Delete everything in Code.gs and PASTE ALL OF THIS CODE.
 * 4. Click Deploy > New deployment:
 *    - Click the gear icon ⚙️ and select "Web app"
 *    - Description: Masterclass Registrations Receiver
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone  <-- (CRITICAL: Must choose "Anyone")
 * 5. Click Deploy, Authorize access, and COPY the Web app URL (ends with /exec).
 * 6. Send that /exec URL in chat!
 */

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  // Fallback ID if run standalone
  return SpreadsheetApp.openById('1XP0ORB5psVLo8YIf8mMQlUcAO3fbx9g5p6Hr288J8xI');
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var ss = getSpreadsheet();

  // 1. Determine tab name automatically
  var tabName = (p.sheet || '').toString().trim();
  if (!tabName || tabName === 'Sheet1') {
    var page = (p.page || '').toLowerCase();
    if (page.indexOf('/da') !== -1) tabName = 'DataAnalytics';
    else if (page.indexOf('/ds') !== -1) tabName = 'DataScience';
    else if (page.indexOf('/aiml') !== -1) tabName = 'AIML';
    else if (page.indexOf('/aieng') !== -1) tabName = 'AIEngineering';
    else if (page.indexOf('/py') !== -1) tabName = 'Python';
    else tabName = 'DataScience';
  }

  // 2. Find or create the tab
  var sh = ss.getSheetByName(tabName);
  var isNew = false;
  if (!sh) {
    sh = ss.insertSheet(tabName);
    isNew = true;
  }

  // 3. Master columns list
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

  // 4. If sheet is new or empty, write styled header row
  if (isNew || sh.getLastRow() === 0) {
    sh.appendRow(standardColumns);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, standardColumns.length)
      .setFontWeight('bold')
      .setBackground('#071f42')
      .setFontColor('#ffffff');
  } else {
    // 5. If sheet ALREADY exists, ensure new columns are added!
    var lastCol = Math.max(1, sh.getLastColumn());
    var existingHeaders = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim().toLowerCase();
    });

    var hasCurrentYear = existingHeaders.some(function (h) {
      return h.indexOf('current') !== -1 || h.indexOf('semester') !== -1;
    });
    var hasPassoutYear = existingHeaders.some(function (h) {
      return h.indexOf('passout') !== -1 || h.indexOf('graduation') !== -1;
    });

    if (!hasCurrentYear) {
      var nextCol1 = sh.getLastColumn() + 1;
      sh.getRange(1, nextCol1).setValue('Current Year / Semester').setFontWeight('bold');
    }
    if (!hasPassoutYear) {
      var nextCol2 = sh.getLastColumn() + 1;
      sh.getRange(1, nextCol2).setValue('Passout Year').setFontWeight('bold');
    }
  }

  // 6. Read final headers and map values intelligently
  var finalHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var newRow = finalHeaders.map(function (header) {
    var h = String(header).trim().toLowerCase();
    if (h.indexOf('time') !== -1 || h.indexOf('date') !== -1) return new Date();
    if (h.indexOf('name') !== -1) return p.name || '';
    if (h.indexOf('phone') !== -1 || h.indexOf('mobile') !== -1) return p.phone || '';
    if (h.indexOf('email') !== -1) return p.email || '';
    if (h.indexOf('current') !== -1 || h.indexOf('semester') !== -1) return p.currentYear || '';
    if (h.indexOf('passout') !== -1 || h.indexOf('graduation') !== -1) return p.passoutYear || '';
    if (h.indexOf('status') !== -1 || h.indexOf('occupation') !== -1) return p.status || '';
    if (h.indexOf('city') !== -1 || h.indexOf('area') !== -1) return p.city || '';
    if (h.indexOf('source') !== -1) return p.source || '';
    if (h.indexOf('lang') !== -1) return p.language || '';
    if (h.indexOf('page') !== -1 || h.indexOf('url') !== -1) return p.page || '';
    return p[header] || '';
  });

  sh.appendRow(newRow);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, tab: sh.getName() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Devansh Edu-Tech Registrations Endpoint is active.');
}
