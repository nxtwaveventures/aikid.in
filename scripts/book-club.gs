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
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad-request" });
  }
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
    const all = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), sh.getLastColumn() || 1).getDisplayValues();
    const ids = all.map(function (r) { return r[0]; });
    const rows = all.slice(1).filter(function (r) { return r[0] !== ""; });
    const at = ids.indexOf(String(req.id)); // 0 is the header row
    let logged = req.row || req.id;
    if (req.op === "insert") {
      if (req.tab !== "Books" && req.tab !== "Borrows") return json_({ error: "bad-tab" });
      if (req.tab === "Books") {
        const dup = rows.some(function (r) { return r[3] === req.row[3] && (r[7] === "pending" || r[7] === "listed"); });
        if (dup) return json_({ error: "conflict" });
      } else {
        const busy = rows.some(function (r) {
          return (r[8] === "requested" || r[8] === "out") && (r[1] === req.row[1] || r[2] === req.row[2]);
        });
        if (busy) return json_({ error: "conflict" });
      }
      let max = 0;
      rows.forEach(function (r) {
        if (String(r[0]).indexOf(req.prefix) === 0) max = Math.max(max, parseInt(String(r[0]).slice(req.prefix.length), 10) || 0);
      });
      const id = req.prefix + String(max + 1).padStart(3, "0");
      req.row[0] = id;
      sh.appendRow(req.row);
      logged = req.row;
      logWrite_(ss, req, logged);
      return json_({ ok: true, id: id });
    } else if (req.op === "upsert") {
      if (req.expect) {
        if (at <= 0) return json_({ error: "conflict" });
        const cur = all[at];
        const bad = Object.keys(req.expect).some(function (k) { return String(cur[Number(k)] === undefined ? "" : cur[Number(k)]) !== String(req.expect[k]); });
        if (bad) return json_({ error: "conflict" });
      }
      if (at > 0) sh.getRange(at + 1, 1, 1, req.row.length).setValues([req.row]);
      else sh.appendRow(req.row);
    } else if (req.op === "delete") {
      if (at > 0) sh.deleteRow(at + 1);
    } else {
      return json_({ error: "bad-op" });
    }
    logWrite_(ss, req, logged);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function logWrite_(ss, req, data) {
  if (req.tab === "Sessions") return;
  try {
    ss.getSheetByName("Log").appendRow([new Date().toISOString(), req.op, req.tab, JSON.stringify(data)]);
  } catch (err) {
    // A failed log entry must not fail the write.
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
