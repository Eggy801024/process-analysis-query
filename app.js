const SHEET_ID = "1uxlACZ3sXNZoTaZjEmixYCosIj-aGViXF5pJ_Z3Z2QM";
const SHEETS = {
  database: "Database",
  reasons: "MES_Cold"
};

const USERS = {
  P1339: "P1339",
  P0949: "P0949"
};

let DB_RECORDS = [];
let MES_REASONS = [];

const $ = (id) => document.getElementById(id);

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function clean(value) {
  return norm(value)
    .replace(/[\s\u3000]/g, "")
    .replace(/[\/\\\-＿_]/g, "")
    .replace(/[()（）【】[\]{}<>《》]/g, "")
    .replace(/[:：;；,，.。|｜+＋&＆]/g, "");
}

function showLogin() {
  $("loginPage").style.display = "flex";
  $("appPage").style.display = "none";
}

function showApp(user) {
  $("loginPage").style.display = "none";
  $("appPage").style.display = "block";
  $("currentUser").textContent = user;
}

function login() {
  const user = String($("loginUser").value || "").trim().toUpperCase();
  const pass = String($("loginPass").value || "").trim().toUpperCase();
  if (USERS[user] && USERS[user].toUpperCase() === pass) {
    sessionStorage.setItem("processAnalysisUser", user);
    $("loginError").style.display = "none";
    showApp(user);
    syncSheets();
    return;
  }
  $("loginError").style.display = "block";
}

function logout() {
  sessionStorage.removeItem("processAnalysisUser");
  showLogin();
}

function checkAuth() {
  const user = sessionStorage.getItem("processAnalysisUser");
  if (user && USERS[user]) {
    showApp(user);
    syncSheets();
  } else {
    showLogin();
  }
}

function gvizUrl(sheetName) {
  const sheet = encodeURIComponent(sheetName);
  const cacheBust = Date.now();
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheet}&headers=1&t=${cacheBust}`;
}

async function fetchSheet(sheetName) {
  const response = await fetch(gvizUrl(sheetName));
  if (!response.ok) throw new Error(`${sheetName} 讀取失敗`);
  const raw = await response.text();
  const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const cols = json.table.cols.map((col) => String(col.label || "").trim());
  const rows = json.table.rows || [];

  return rows.map((row) => {
    const item = {};
    (row.c || []).forEach((cell, index) => {
      const key = cols[index] || `欄位${index + 1}`;
      item[key] = cell ? (cell.f || cell.v || "") : "";
    });
    return item;
  }).filter((item) => Object.values(item).some((value) => String(value).trim()));
}

function setStatus(title, text, state = "") {
  $("syncTitle").textContent = title;
  $("syncText").textContent = text;
  $("syncTitle").className = state;
}

function uniqueValues(rows, keys) {
  const values = new Set();
  rows.forEach((row) => {
    keys.forEach((key) => {
      const value = row[key];
      if (value !== undefined && String(value).trim()) values.add(String(value).trim());
    });
  });
  return [...values].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function fillSelect(id, values, firstLabel) {
  const select = $(id);
  select.innerHTML = `<option value="">${firstLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function reasonLabel(reason) {
  const code = reason.異常代碼 || reason["MES代碼"] || reason["代碼"] || "";
  const zh = reason.中文名稱 || reason.異常名稱 || reason.降規原因 || "";
  const en = reason.英文名稱 || reason.English || "";
  return [code, zh, en].filter(Boolean).join("｜") || Object.values(reason).filter(Boolean).join("｜");
}

function populateControls() {
  fillSelect("line", uniqueValues(DB_RECORDS, ["線別", "Line"]), "全部");
  fillSelect("shift", uniqueValues(DB_RECORDS, ["班別", "Shift"]), "全部");
  fillSelect("grade", uniqueValues(DB_RECORDS, ["模組等級", "等級", "Grade"]), "全部");

  const reasonSelect = $("reason");
  reasonSelect.innerHTML = `<option value="">全部 MES 原因</option>`;
  MES_REASONS.forEach((reason, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = reasonLabel(reason);
    reasonSelect.appendChild(option);
  });
}

async function syncSheets() {
  setStatus("讀取資料中", "正在連線 Google Sheets。");
  try {
    const [database, reasons] = await Promise.all([
      fetchSheet(SHEETS.database),
      fetchSheet(SHEETS.reasons)
    ]);
    DB_RECORDS = database;
    MES_REASONS = reasons;
    populateControls();
    $("total").textContent = DB_RECORDS.length;
    $("reasonCount").textContent = MES_REASONS.length;
    $("matched").textContent = "0";
    $("currentReason").textContent = "全部";

    if (!DB_RECORDS.length && !MES_REASONS.length) {
      setStatus("已同步，表格目前是空的", "Database 與 MES異常代碼 目前沒有可讀資料。", "warn");
      $("results").className = "empty";
      $("results").textContent = "Google Sheets 尚未填入資料。";
    } else {
      setStatus("同步完成", `Database ${DB_RECORDS.length} 筆，MES異常代碼 ${MES_REASONS.length} 筆。`, "ok");
      $("results").className = "empty";
      $("results").textContent = "選擇條件後按查詢。";
    }
  } catch (error) {
    setStatus("同步失敗", error.message || "無法讀取 Google Sheets。", "bad");
    $("results").className = "empty";
    $("results").textContent = "請確認 Google Sheets 分享權限為知道連結的任何人可檢視。";
  }
}

function getField(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim()) return row[key];
  }
  return "";
}

function dateMatch(recordDate, selectedDate) {
  if (!selectedDate) return true;
  if (!recordDate) return false;
  const value = String(recordDate).trim().replaceAll("/", "-");
  return value === selectedDate || value.startsWith(selectedDate);
}

function containsAny(haystack, needles) {
  const target = clean(haystack);
  return needles.some((needle) => {
    const key = clean(needle);
    return key && (target.includes(key) || key.includes(target));
  });
}

function reasonMatch(row, selectedReason) {
  if (!selectedReason) return true;
  const rowReason = getField(row, ["降規原因", "異常名稱", "中文名稱", "原因"]);
  const candidates = [
    selectedReason.異常代碼,
    selectedReason.MES代碼,
    selectedReason.代碼,
    selectedReason.中文名稱,
    selectedReason.異常名稱,
    selectedReason.降規原因,
    selectedReason.英文名稱,
    selectedReason.English
  ].filter(Boolean);
  return containsAny(rowReason, candidates);
}

function searchData() {
  const selectedReason = $("reason").value === "" ? null : MES_REASONS[Number($("reason").value)];
  const filters = {
    line: $("line").value,
    date: $("date").value,
    shift: $("shift").value,
    grade: $("grade").value,
    keyword: clean($("keyword").value)
  };

  const rows = DB_RECORDS.filter((row) => {
    if (filters.line && norm(getField(row, ["線別", "Line"])) !== norm(filters.line)) return false;
    if (!dateMatch(getField(row, ["日期", "Date"]), filters.date)) return false;
    if (filters.shift && norm(getField(row, ["班別", "Shift"])) !== norm(filters.shift)) return false;
    if (filters.grade && !containsAny(getField(row, ["模組等級", "等級", "Grade"]), [filters.grade])) return false;
    if (!reasonMatch(row, selectedReason)) return false;
    if (filters.keyword && !clean(Object.values(row).join(" ")).includes(filters.keyword)) return false;
    return true;
  });

  $("matched").textContent = rows.length;
  $("currentReason").textContent = selectedReason ? reasonLabel(selectedReason) : "全部";
  render(rows);
}

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[match]));
}

function render(rows) {
  const box = $("results");
  if (!rows.length) {
    box.className = "empty";
    box.textContent = DB_RECORDS.length ? "查無符合資料。" : "Google Sheets 尚未填入資料。";
    return;
  }

  box.className = "";
  box.innerHTML = rows.slice(0, 300).map((row, index) => {
    const reason = getField(row, ["降規原因", "異常名稱", "中文名稱", "原因"]);
    const analysis = getField(row, ["異常分析", "分析", "處置", "說明"]);
    const rootCause = getField(row, ["異常root cause", "root cause", "Root Cause", "原因分析"]);
    const phenomenon = getField(row, ["現象描述", "現象", "描述"]);
    return `
      <article class="result">
        <div class="reasonRow">
          <b>#${index + 1} ${esc(reason || "未填降規原因")}</b>
          ${tag(getField(row, ["線別", "Line"]))}
          ${tag(getField(row, ["日期", "Date"]))}
          ${tag(getField(row, ["班別", "Shift"]))}
          ${tag(getField(row, ["模組等級", "等級", "Grade"]))}
        </div>
        <p class="small">模組序號：${esc(getField(row, ["模組序號", "序號", "SN"])) || "-"}</p>
        <p><b>現象描述：</b>${esc(phenomenon) || "-"}</p>
        <p><b>異常 root cause：</b>${esc(rootCause) || "-"}</p>
        <div><b>異常分析：</b><div class="analysis">${esc(analysis) || "-"}</div></div>
      </article>
    `;
  }).join("") + (rows.length > 300 ? `<p class="small">僅顯示前 300 筆，請縮小查詢條件。</p>` : "");
}

function tag(value) {
  return value ? `<span class="tag">${esc(value)}</span>` : "";
}

function resetForm() {
  ["line", "date", "shift", "grade", "reason", "keyword"].forEach((id) => { $(id).value = ""; });
  $("matched").textContent = "0";
  $("currentReason").textContent = "全部";
  $("results").className = "empty";
  $("results").textContent = DB_RECORDS.length ? "選擇條件後按查詢。" : "Google Sheets 尚未填入資料。";
}

document.addEventListener("DOMContentLoaded", () => {
  $("loginBtn").addEventListener("click", login);
  $("logoutBtn").addEventListener("click", logout);
  $("reloadBtn").addEventListener("click", syncSheets);
  $("searchBtn").addEventListener("click", searchData);
  $("resetBtn").addEventListener("click", resetForm);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && $("loginPage").style.display !== "none") login();
  });
  checkAuth();
});
