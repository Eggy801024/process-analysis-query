const SHEET_ID = "1uxlACZ3sXNZoTaZjEmixYCosIj-aGViXF5pJ_Z3Z2QM";
const SHEET_NAME = "Database";

const fallbackData = window.APP_DATA || {};
const rawReasons = fallbackData.reasons || (typeof MES_REASONS !== "undefined" ? MES_REASONS : []);
const rawFallbackRecords = fallbackData.records || (typeof DB_RECORDS !== "undefined" ? DB_RECORDS : []);

const fixed = {
  lines: ["L1", "L2", "L3", "L4", "L5"],
  shifts: ["DA", "NA", "DB", "NB"],
  grades: ["A規", "B規", "C規", "F規", "M規"],
};

const state = {
  line: "",
  date: "",
  shift: "",
  grade: "",
  reasonCode: "",
  analysis: "",
  page: 1,
  searched: false,
};

let records = [];
let reasons = [];

const PAGE_SIZE = 300;

const $ = (id) => document.getElementById(id);
const trim = (value) => String(value ?? "").trim();
const lower = (value) => trim(value).toLowerCase();

function keyText(value) {
  return lower(value)
    .replace(/\s|\u3000/g, "")
    .replace(/[\/\\\-＿_()（）【】[\]{}<>《》:：;；,，.。|｜+＋&＆…]/g, "");
}

function normalizeDate(value) {
  const raw = trim(value);
  if (!raw) return "";
  const match = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]) + 1;
    const d = Number(match[3]);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const parts = raw.replaceAll("/", "-").split(" ")[0].split("-");
  if (parts.length >= 3 && parts[0].length === 4) {
    return `${parts[0]}-${String(Number(parts[1])).padStart(2, "0")}-${String(Number(parts[2])).padStart(2, "0")}`;
  }
  return raw;
}

function normalizeGrade(value) {
  const raw = trim(value).toUpperCase();
  const letter = raw[0] || "";
  return ["A", "B", "C", "F", "M"].includes(letter) ? `${letter}規` : raw;
}

function normalizeReasons(items) {
  return items
    .map((item, index) => ({
      order: Number(item.order || item["序號"] || index + 1),
      code: trim(item.code || item["異常代碼"]),
      zh: trim(item.zh || item["中文名稱"]),
      en: trim(item.en || item["英文名稱"]),
    }))
    .filter((item) => item.code && item.zh)
    .sort((a, b) => a.order - b.order);
}

function buildReasonMatcher(reasonList) {
  const byCode = new Map(reasonList.map((item) => [item.code, item]));
  const byKey = new Map();
  reasonList.forEach((item) => {
    [item.code, item.zh, item.en].forEach((value) => {
      const key = keyText(value);
      if (key) byKey.set(key, item);
    });
  });

  const aliases = {
    隱破裂: "AbnTST0039",
    隱裂: "AbnTST0039",
    透光裂: "AbnTST0039",
    cell隱破裂: "AbnTST0039",
    cell破裂: "AbnTST0039",
    Cell隱破裂: "AbnTST0039",
    Cell破裂: "AbnTST0039",
    缺角: "AbnTST0043",
    Cell缺角: "AbnTST0043",
    cell缺角: "AbnTST0043",
    無效能: "AbnTST0045",
    cell無效能: "AbnTST0045",
    Cell無效能: "AbnTST0045",
    Cell髒污: "AbnTST0047",
    Cell髒汙: "AbnTST0047",
    空焊: "AbnTST0038",
    異物: "AbnTST0040",
    電池區異物: "AbnTST0040",
    非電池區異物: "AbnTST0040",
    背面異物: "AbnTST0133",
    氣泡: "AbnTST0037",
    電池區氣泡: "AbnTST0037",
    非電池區氣泡: "AbnTST0037",
    串間距異常: "AbnTST0050",
    串距異常: "AbnTST0050",
    片間距異常: "AbnTST0044",
    片距過小: "AbnTST0044",
    帶電體到鋁框異常: "AbnTST0052",
    帶電體到框異常: "AbnTST0052",
    玻璃來料異常: "AbnTST0053",
    玻璃異常: "AbnTST0053",
    玻璃刮傷: "AbnTST0054",
    EVA異常: "AbnTST0056",
    EVA來料異常: "AbnTST0057",
    背板來料異常: "AbnTST0059",
    背板髒污: "AbnTST0060",
    背板髒汙: "AbnTST0060",
    背板破裂: "AbnTST0061",
    背板破損: "AbnTST0061",
    背板凹痕: "AbnTST0062",
    背板凹陷: "AbnTST0062",
    背板反向: "AbnTST0063",
    背板刮傷: "AbnTST0064",
    背板氣泡: "AbnTST0065",
    "Cell Ribbon歪斜": "AbnTST0068",
    "Cell Ribbon 歪斜": "AbnTST0068",
    Ribbon歪斜: "AbnTST0068",
    Ribbon偏移: "AbnTST0068",
    匯流條偏移: "AbnTST0072",
    矩陣偏移: "AbnTST0073",
    模組矩陣偏移: "AbnTST0073",
    鋁框異常: "AbnTST0075",
    鋁框凹陷: "AbnTST0076",
    鋁框高低差: "AbnTST0077",
    鋁框刮傷: "AbnTST0078",
    鋁框變形: "AbnTST0079",
    鋁框來料異常: "AbnTST0134",
    鋁框來料刮傷: "AbnTST0134",
    模組破裂: "AbnTST0087",
    模組爆片: "AbnTST0087",
    爆片: "AbnTST0087",
    外觀不良: "AbnTST0088",
    其他: "AbnTST0091",
    其它: "AbnTST0091",
    網印缺陷: "AbnTST0128",
    網印不良: "AbnTST0128",
    焊接未對準: "AbnTST0131",
    背面ribbon歪斜: "AbnTST0132",
  };
  Object.entries(aliases).forEach(([alias, code]) => {
    const item = byCode.get(code);
    if (item) byKey.set(keyText(alias), item);
  });

  return (value) => {
    const key = keyText(value);
    if (!key) return null;
    if (byKey.has(key)) return byKey.get(key);
    const candidates = [];
    reasonList.forEach((item) => {
      const zh = keyText(item.zh);
      const en = keyText(item.en);
      if (zh && (key.includes(zh) || zh.includes(key))) candidates.push([zh.length, item]);
      if (en && (key.includes(en) || en.includes(key))) candidates.push([en.length, item]);
    });
    return candidates.sort((a, b) => b[0] - a[0])[0]?.[1] || null;
  };
}

function gvizUrl(sheetName, callbackName) {
  const tqx = `out:json;responseHandler:${callbackName}`;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=${encodeURIComponent(tqx)}&sheet=${encodeURIComponent(sheetName)}&headers=1&t=${Date.now()}`;
}

function fetchSheet(sheetName) {
  const callbackName = `__sheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("讀取 Google Sheets 逾時"));
    }, 20000);
    function cleanup() {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (payload) => {
      cleanup();
      if (payload.status && payload.status !== "ok") {
        reject(new Error(`Google Sheets 狀態異常：${payload.status}`));
        return;
      }
      const cols = payload.table.cols.map((col) => trim(col.label));
      const rows = (payload.table.rows || [])
        .map((row) => {
          const item = {};
          const cells = row.c || [];
          cols.forEach((key, index) => {
            const cell = cells[index];
            item[key || `欄位${index + 1}`] = cell ? trim(cell.f || cell.v || "") : "";
          });
          return item;
        })
        .filter((item) => Object.values(item).some(Boolean));
      resolve(rows);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("讀取 Google Sheets 失敗"));
    };
    script.src = gvizUrl(sheetName, callbackName);
    document.body.appendChild(script);
  });
}

function renderButtonGroup(id, values, key) {
  const wrap = $(id);
  wrap.innerHTML = "";
  ["全部", ...values].forEach((value) => {
    const actual = value === "全部" ? "" : value;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.className = state[key] === actual ? "active" : "";
    button.addEventListener("click", () => {
      state[key] = state[key] === actual ? "" : actual;
      state.page = 1;
      renderControls();
      runSearch();
    });
    wrap.appendChild(button);
  });
}

function renderControls() {
  renderButtonGroup("lineButtons", fixed.lines, "line");
  renderButtonGroup("shiftButtons", fixed.shifts, "shift");
  renderButtonGroup("gradeButtons", fixed.grades, "grade");

  const reasonSelect = $("reasonFilter");
  const current = reasonSelect.value || state.reasonCode;
  reasonSelect.innerHTML = `<option value="">全部 MES 原因</option>`;
  reasons.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent = `${item.code}｜${item.zh}${item.en ? " / " + item.en : ""}`;
    reasonSelect.appendChild(option);
  });
  reasonSelect.value = current;
}

function normalizeRows(rows) {
  const matchReason = buildReasonMatcher(reasons);
  return rows.map((row, index) => {
    const item = { ...row };
    item["日期"] = normalizeDate(row["日期"]);
    item["等級"] = normalizeGrade(row["等級"] || row["模組等級"]);
    item["異常root cause"] = row["異常root cause"] || row["異常root casue"] || "";
    const reason = matchReason(row["降規原因"]);
    item["MES代碼"] = reason?.code || "";
    item["MES中文"] = reason?.zh || "";
    item["MES英文"] = reason?.en || "";
    item.id = `DB-${String(index + 1).padStart(5, "0")}`;
    return item;
  });
}

function recordMatches(record) {
  if (state.line && record["線別"] !== state.line) return false;
  if (state.date && record["日期"] !== state.date) return false;
  if (state.shift && record["班別"] !== state.shift) return false;
  if (state.grade && record["等級"] !== state.grade) return false;
  if (state.reasonCode && record["MES代碼"] !== state.reasonCode) return false;
  const keyword = lower(state.analysis);
  if (keyword) {
    const haystack = lower([
      record["異常分析"],
      record["模組序號"],
      record["降規原因"],
      record["現象描述"],
      record["異常root cause"],
      record["MES代碼"],
      record["MES中文"],
      record["MES英文"],
    ].join(" "));
    if (!haystack.includes(keyword)) return false;
  }
  return true;
}

function runSearch(page = 1) {
  state.searched = true;
  state.page = page;
  state.date = $("dateFilter").value;
  state.reasonCode = $("reasonFilter").value;
  state.analysis = $("analysisFilter").value;
  renderResults(records.filter(recordMatches));
}

function escapeHtml(value) {
  return trim(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderResults(rows) {
  $("matchedCount").textContent = rows.length.toLocaleString();
  $("currentDate").textContent = state.date || "全部";
  const selectedReason = reasons.find((item) => item.code === state.reasonCode);
  $("currentReason").textContent = selectedReason ? selectedReason.zh : "全部";
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pageCount);
  const start = (state.page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  $("resultNote").textContent = state.searched
    ? `符合 ${rows.length.toLocaleString()} 筆，目前顯示第 ${(start + 1).toLocaleString()}-${end.toLocaleString()} 筆`
    : "請選擇條件後查詢";

  const target = $("results");
  const pager = $("pagination");
  if (!state.searched) {
    target.className = "results empty";
    target.textContent = "尚未查詢";
    pager.innerHTML = "";
    return;
  }
  if (!rows.length) {
    target.className = "results empty";
    target.textContent = "沒有符合條件的異常分析";
    pager.innerHTML = "";
    return;
  }

  target.className = "results";
  target.innerHTML = rows.slice(start, end).map((record) => `
    <article class="result">
      <div class="result-title">
        <strong>${escapeHtml(record["模組序號"] || "無模組序號")}</strong>
        <span>${escapeHtml(record["日期"])} ${escapeHtml(record["班別"])} ${escapeHtml(record["線別"])}</span>
      </div>
      <div class="chips">
        <span>${escapeHtml(record["等級"])}</span>
        <span>${escapeHtml(record["降規原因"])}</span>
        <span>${escapeHtml(record["MES代碼"] || "未對應 MES")}</span>
      </div>
      <dl class="fields">
        <div><dt>MES 名稱</dt><dd>${escapeHtml(record["MES中文"] || "-")}</dd></div>
        <div><dt>STR / LAM</dt><dd>${escapeHtml(record["STR"] || "-")} / ${escapeHtml(record["LAM"] || "-")}</dd></div>
        <div><dt>Root cause</dt><dd>${escapeHtml(record["異常root cause"] || "-")}</dd></div>
        <div><dt>位置</dt><dd>${escapeHtml(record["位置"] || "-")}</dd></div>
      </dl>
      <div class="analysis">${escapeHtml(record["異常分析"] || "無異常分析內容")}</div>
    </article>
  `).join("");
  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  const pager = $("pagination");
  if (pageCount <= 1) {
    pager.innerHTML = "";
    return;
  }

  const visiblePages = getVisiblePages(state.page, pageCount);
  pager.innerHTML = `
    <button type="button" data-page="1" ${state.page === 1 ? "disabled" : ""}>第一頁</button>
    <button type="button" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>上一頁</button>
    ${visiblePages.map((page) => (
      page === "..."
        ? `<span class="page-gap">...</span>`
        : `<button type="button" data-page="${page}" class="${page === state.page ? "active" : ""}">${page}</button>`
    )).join("")}
    <button type="button" data-page="${state.page + 1}" ${state.page === pageCount ? "disabled" : ""}>下一頁</button>
    <button type="button" data-page="${pageCount}" ${state.page === pageCount ? "disabled" : ""}>最後一頁</button>
  `;

  pager.querySelectorAll("button[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page);
      if (!Number.isNaN(nextPage)) {
        runSearch(nextPage);
        document.querySelector(".results-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function getVisiblePages(currentPage, pageCount) {
  const pages = new Set([1, pageCount]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= pageCount) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const visible = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) visible.push("...");
    visible.push(page);
  });
  return visible;
}

function resetAll() {
  Object.assign(state, {
    line: "",
    date: "",
    shift: "",
    grade: "",
    reasonCode: "",
    analysis: "",
    page: 1,
    searched: false,
  });
  $("dateFilter").value = "";
  $("reasonFilter").value = "";
  $("analysisFilter").value = "";
  renderControls();
  renderResults([]);
}

async function init() {
  reasons = normalizeReasons(rawReasons);
  $("totalReasons").textContent = reasons.length.toLocaleString();
  renderControls();
  renderResults([]);

  $("metaText").textContent = "正在讀取 Google Sheets Database";
  try {
    const rows = await fetchSheet(SHEET_NAME);
    records = normalizeRows(rows);
    $("metaText").textContent = `資料已同步：${records.length.toLocaleString()} 筆 Database，${reasons.length} 筆 MES 原因`;
  } catch (error) {
    records = normalizeRows(rawFallbackRecords);
    $("metaText").textContent = `Google Sheets 讀取失敗，使用備援資料：${error.message}`;
  }
  $("totalRecords").textContent = records.length.toLocaleString();

  $("dateFilter").addEventListener("change", () => runSearch(1));
  $("reasonFilter").addEventListener("change", () => runSearch(1));
  $("analysisFilter").addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSearch(1);
  });
  $("searchButton").addEventListener("click", () => runSearch(1));
  $("resetAll").addEventListener("click", resetAll);
}

init();
