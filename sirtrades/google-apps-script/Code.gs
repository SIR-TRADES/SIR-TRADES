const SHEET_NAME = 'Registrations';

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function doGet() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonOutput([]);
  const headers = rows.shift();
  return jsonOutput(rows.map((row) => headers.reduce((record, header, index) => {
    record[header] = row[index];
    return record;
  }, {})));
}

function doPost(event) {
  const payload = JSON.parse(event.postData.contents);
  if (payload.action === 'update') return updateStatus(payload);
  const sheet = getSheet();
  const headers = ['id', 'role', 'name', 'email', 'phone', 'reference', 'group', 'campus', 'status', 'submittedAt'];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  sheet.appendRow(headers.map((header) => payload[header] || ''));
  return jsonOutput(payload);
}

function updateStatus(payload) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const idColumn = values[0].indexOf('id');
  const statusColumn = values[0].indexOf('status');
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][idColumn]) === String(payload.id)) sheet.getRange(row + 1, statusColumn + 1).setValue(payload.status);
  }
  return jsonOutput(payload);
}

function doOptions() {
  return jsonOutput({ ok: true });
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}