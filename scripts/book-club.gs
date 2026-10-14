/**
 * Story Lab Book Club — the Google Sheet and the small API the Telegram bot uses.
 *
 * Setup (signed in as storylabkid@gmail.com):
 *   1. https://script.google.com/create → paste this file → Save.
 *   2. Select `setupBookClub` → Run → approve. The log prints the sheet link and BOOKCLUB_SCRIPT_SECRET.
 *   3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 *      Copy the Web app URL → that is BOOKCLUB_SCRIPT_URL.
 */

const TABS = {
  Members: ["telegramId", "name", "flat", "phone", "childName", "status", "joinedAt"],
  Books: ["id", "title", "author", "matchKey", "condition", "photoFileId", "ownerId", "status", "addedAt"],
  Borrows: ["id", "bookId", "borrowerId", "requestedAt", "paidAt", "dueAt", "returnedAt", "ownerPaidAt", "state"],
  Sessions: ["telegramId", "flow", "step", "draft"],
  Log: ["at", "op", "tab", "data"],
};
const DATA_TABS = ["Members", "Books", "Borrows", "Sessions"];

function setupBookClub() {
  const ss = SpreadsheetApp.create("Story Lab Book Club");
  Object.keys(TABS).forEach(function (name, i) {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange("A:Z").setNumberFormat("@"); // keep ids and phone numbers as text
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  const secret = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ SHEET_ID: ss.getId(), SECRET: secret });
  Logger.log("Sheet: " + ss.getUrl() + "\nBOOKCLUB_SCRIPT_SECRET=" + secret);
}

function doPost(e) {
  const req = JSON.parse(e.postData.contents);
  const props = PropertiesService.getScriptProperties();
  if (!req.secret || req.secret !== props.getProperty("SECRET")) return json_({ error: "forbidden" });
  const ss = SpreadsheetApp.openById(props.getProperty("SHEET_ID"));

  if (req.op === "read") {
    const out = {};
    DATA_TABS.forEach(function (t) {
      const values = ss.getSheetByName(t).getDataRange().getDisplayValues();
      out[t] = values.slice(1).filter(function (r) { return r[0] !== ""; });
    });
    return json_(out);
  }

  if (DATA_TABS.indexOf(req.tab) === -1) return json_({ error: "bad-tab" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss.getSheetByName(req.tab);
    const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues().map(function (r) { return r[0]; });
    const at = ids.indexOf(String(req.id)); // 0 is the header row
    if (req.op === "upsert") {
      if (at > 0) sh.getRange(at + 1, 1, 1, req.row.length).setValues([req.row]);
      else sh.appendRow(req.row);
    } else if (req.op === "delete") {
      if (at > 0) sh.deleteRow(at + 1);
    } else {
      return json_({ error: "bad-op" });
    }
    if (req.tab !== "Sessions") {
      ss.getSheetByName("Log").appendRow([new Date().toISOString(), req.op, req.tab, JSON.stringify(req.row || req.id)]);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
