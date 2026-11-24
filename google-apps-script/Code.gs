/**
 * IServe Testing Workspace - Google Sheets backend (Google Apps Script)
 *
 * SETUP (5 minutes)
 * 1. Create a new Google Sheet (any name).
 * 2. In the sheet: Extensions > Apps Script. Delete the sample code and paste this whole file.
 * 3. Change TOKEN below to your own secret word (the team uses the same word in the site).
 * 4. Click Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy, authorize when asked, then copy the Web app URL (ends with /exec).
 * 5. In the website click "Sync", paste the URL and the same access key, tick "Turn on sync".
 *
 * After you change this code later: Deploy > Manage deployments > edit > New version.
 * Tabs (Projects, Services, Checks, Bugs, Notes) are created automatically.
 */
var TOKEN = "CHANGE-THIS-SECRET";

var TABS = {
  Projects: ["id", "name", "rev", "updated", "deleted", "prefs", "banner"],
  Services: ["projectId", "id", "pos", "name", "desc", "note", "result"],
  Checks: ["projectId", "serviceId", "id", "pos", "text", "done"],
  Bugs: ["projectId", "serviceId", "id", "pos", "text", "severity", "fixed"],
  Notes: ["projectId", "serviceId", "id", "at", "text"]
};

function doGet() { return out_({ ok: true, msg: "IServe Testing Workspace API is running" }); }

function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ error: "Bad request" }); }
  if (b.key !== TOKEN) return out_({ error: "Wrong access key" });
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (x) { return out_({ error: "Server busy, try again" }); }
  try {
    if (b.action === "ping") return out_({ ok: true });
    if (b.action === "load") return out_(load_());
    if (b.action === "save") return out_(save_(b.project, b.baseRev));
    if (b.action === "delete") return out_(del_(String(b.id)));
    return out_({ error: "Unknown action" });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function S_(x) { return String(x == null ? "" : x).slice(0, 49000); }

function sh_(n) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
  if (!s) {
    s = ss.insertSheet(n);
    s.appendRow(TABS[n]);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, TABS[n].length).setFontWeight("bold");
  }
  return s;
}

function read_(n) {
  var s = sh_(n), last = s.getLastRow();
  if (last < 2) return [];
  return s.getRange(2, 1, last - 1, TABS[n].length).getValues();
}

// Replace every row of project `pid` in tab `n` with `rows` (all values stored as plain text).
function replace_(n, pid, rows) {
  var s = sh_(n), w = TABS[n].length;
  var str = function (r) { return r.map(function (x) { return String(x); }); };
  var keep = read_(n).filter(function (r) { return String(r[0]) !== pid; }).map(str).concat(rows.map(str));
  var last = s.getLastRow();
  if (last > 1) s.getRange(2, 1, last - 1, w).clearContent();
  if (keep.length) {
    var r = s.getRange(2, 1, keep.length, w);
    r.setNumberFormat("@");
    r.setValues(keep);
  }
}

function parse_(x) { try { return JSON.parse(x) || {}; } catch (e) { return {}; } }

function load_() {
  var pr = read_("Projects"), sv = read_("Services"), ck = read_("Checks"), bg = read_("Bugs"), nt = read_("Notes");
  var projects = [], deleted = [], pm = {}, sm = {};
  pr.forEach(function (r) {
    if (String(r[4]) === "1") { deleted.push(String(r[0])); return; }
    var p = { id: String(r[0]), name: String(r[1]), rev: Number(r[2]) || 0, prefs: parse_(r[5]), banner: String(r[6] || ""), services: [] };
    projects.push(p); pm[p.id] = p;
  });
  var byPos = function (a, b) { return Number(a[2]) - Number(b[2]); };
  sv.sort(byPos).forEach(function (r) {
    var p = pm[String(r[0])]; if (!p) return;
    var s = { id: String(r[1]), name: String(r[3]), desc: String(r[4]), note: String(r[5]), result: String(r[6]), checks: [], bugs: [], log: [] };
    p.services.push(s); sm[p.id + "|" + s.id] = s;
  });
  ck.sort(function (a, b) { return Number(a[3]) - Number(b[3]); }).forEach(function (r) {
    var s = sm[r[0] + "|" + r[1]]; if (s) s.checks.push({ id: String(r[2]), text: String(r[4]), done: String(r[5]) === "1" });
  });
  bg.sort(function (a, b) { return Number(a[3]) - Number(b[3]); }).forEach(function (r) {
    var s = sm[r[0] + "|" + r[1]]; if (s) s.bugs.push({ id: String(r[2]), text: String(r[4]), sev: String(r[5]) || "Medium", fixed: String(r[6]) === "1" });
  });
  nt.sort(function (a, b) { return Number(b[3]) - Number(a[3]); }).forEach(function (r) {
    var s = sm[r[0] + "|" + r[1]]; if (s) s.log.push({ id: String(r[2]), at: Number(r[3]) || 0, text: String(r[4]) });
  });
  return { projects: projects, deleted: deleted };
}

function save_(p, baseRev) {
  var pid = S_(p.id), cur = null;
  read_("Projects").forEach(function (r) { if (String(r[0]) === pid) cur = r; });
  if (cur && String(cur[4]) === "1") return { deleted: true };
  var rev = 1;
  if (cur) {
    var have = Number(cur[2]) || 0;
    if (have !== (Number(baseRev) || 0)) return { conflict: true, rev: have };
    rev = have + 1;
  }
  var sr = [], cr = [], br = [], nr = [];
  (p.services || []).forEach(function (s, i) {
    var sid = S_(s.id);
    sr.push([pid, sid, i, S_(s.name), S_(s.desc), S_(s.note), S_(s.result)]);
    (s.checks || []).forEach(function (c, j) { cr.push([pid, sid, S_(c.id), j, S_(c.text), c.done ? "1" : "0"]); });
    (s.bugs || []).forEach(function (b, j) { br.push([pid, sid, S_(b.id), j, S_(b.text), S_(b.sev), b.fixed ? "1" : "0"]); });
    (s.log || []).forEach(function (l) { nr.push([pid, sid, S_(l.id), S_(l.at), S_(l.text)]); });
  });
  replace_("Projects", pid, [[pid, S_(p.name), rev, Date.now(), "0", S_(JSON.stringify(p.prefs || {})), S_(p.banner)]]);
  replace_("Services", pid, sr);
  replace_("Checks", pid, cr);
  replace_("Bugs", pid, br);
  replace_("Notes", pid, nr);
  return { rev: rev };
}

function del_(id) {
  replace_("Projects", id, [[id, "", 0, Date.now(), "1", "{}", ""]]);
  ["Services", "Checks", "Bugs", "Notes"].forEach(function (n) { replace_(n, id, []); });
  return { ok: true };
}
