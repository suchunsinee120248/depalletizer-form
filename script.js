// ============================================================
//  STATE
// ============================================================
let entries = JSON.parse(localStorage.getItem("dp_entries") || "[]");
let selectedKa = "2";
let selectedBottles = [];
let selectedBottleCond = "";
// let selectedDegree = "";

// INIT
(function init() {
  const today = new Date();
  document.getElementById("hd-date").value = today.toISOString().split("T")[0];

  // set current hour in select
  const hh = String(today.getHours()).padStart(2, "0");
  document.getElementById("f-time").value = `${hh}:00`;
  document.getElementById("cur-time-badge").textContent = `${hh}:00`;

  fetchPrevHour();
  updateSheetBadge();
  const savedUrl = localStorage.getItem("sheet_url_depallet");
  if (savedUrl) document.getElementById("sheet-url-input").value = savedUrl;

  // live clock on badge
  setInterval(() => {
    const n = new Date();
    document.getElementById("cur-time-badge").textContent =
      String(n.getHours()).padStart(2, "0") + ":00";
  }, 60000);
})();

// ============================================================
//  TABS
// ============================================================
function switchTab(name, btn) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  btn.classList.add("active");
  if (name === "log") {
    fetchTodayLog();
  }
}
// ============================================================
//  HEADER SELECTORS
// ============================================================
function selectKa(el, val) {
  document
    .querySelectorAll(".ka-chip")
    .forEach((c) => c.classList.remove("on"));
  el.classList.add("on");
  selectedKa = val;
}
function selectBottle(el) {
  document
    .querySelectorAll("#bottle-select .bottle-chip")
    .forEach((c) => c.classList.remove("on"));
  el.classList.add("on");
  selectedBottles = [el.dataset.val];
}
// function selectDegree(el, val) {
//   document
//     .querySelectorAll("#degree-select .degree-chip")
//     .forEach((c) => c.classList.remove("on"));
//   el.classList.add("on");
//   selectedDegree = val;
// }
function selectCond(el) {
  document
    .querySelectorAll("#bottle-cond .bottle-chip")
    .forEach((c) => c.classList.remove("on"));
  el.classList.add("on");
  selectedBottleCond = el.dataset.val;
}

// ============================================================
//  PREVIOUS HOUR DISPLAY
// ============================================================
// ============================================================
//  PREVIOUS HOUR — ดึงจาก Sheets ก่อน fallback localStorage
// ============================================================
function renderPrev(serverData) {
  const block = document.getElementById("prev-block");

  // ถ้ามีข้อมูลจาก server ให้ใช้ก่อน
  const prev =
    serverData || (entries.length > 0 ? entries[entries.length - 1] : null);

  if (!prev) {
    block.innerHTML =
      '<div class="no-prev">ยังไม่มีข้อมูลก่อนหน้า (ชั่วโมงนี้เป็นชั่วโมงแรก)</div>';
    return;
  }
  // normalize field names (server ใช้ bottleInfo, local ใช้ bottleType)
  const btype = prev.bottleType || prev.bottleInfo || "—";
  block.innerHTML = `
        <div class="prev-row">
          <div class="prev-row-label">📌 ข้อมูลเวลา ${prev.time} น. ${serverData ? '<span style="color:#166534;font-size:10px;">● จาก Sheets</span>' : '<span style="color:#b45309;font-size:10px;">● จากเครื่อง</span>'}</div>
          <div class="prev-row-data">
            <div class="prev-chip">แรงดัน <span>${prev.p1} Bar</span></div>
            <div class="prev-chip">หัวจับ <span>${prev.p2} Bar</span></div>
            <div class="prev-chip">พาเลท <span>${Number(prev.pallets || 0).toLocaleString()}</span></div>
            <div class="prev-chip">จำนวนขวด <span>${Number(prev.bottles || 0).toLocaleString()}</span></div>
            <div class="prev-chip">ประเภท <span>${btype}</span></div>
            ${prev.bottleCond ? `<div class="prev-chip">ชนิด <span>${prev.bottleCond}</span></div>` : ""}
            ${prev.note ? `<div class="prev-chip">บันทึก <span>${prev.note}</span></div>` : ""}
            ${prev.remark ? `<div class="prev-chip">หมายเหตุ <span>${prev.remark}</span></div>` : ""}
          </div>
        </div>`;
}

function fetchPrevHour() {
  const url = localStorage.getItem("sheet_url_depallet");

  const date = document.getElementById("hd-date").value;

  if (!url || !date) {
    renderPrev(null);

    return;
  }

  const getUrl = url + "?action=prevHour&date=" + encodeURIComponent(date);

  fetch(getUrl)
    .then((r) => r.json())

    .then((res) => {
      if (res.status !== "ok") {
        renderPrev(null);

        return;
      }

      renderPrev(res.data);
    })

    .catch(() => renderPrev(null));
}

function fetchTodayLog() {
  const url = localStorage.getItem("sheet_url_depallet");

  const date = document.getElementById("hd-date").value;

  if (!url || !date) {
    renderLog([]);

    return;
  }

  fetch(url + "?action=dailyLog&date=" + encodeURIComponent(date))
    .then((r) => r.json())

    .then((res) => {
      if (res.status !== "ok") {
        renderLog([]);

        return;
      }

      renderLog(res.data || []);
    })

    .catch(() => renderLog([]));
}
// ============================================================
//  SAVE ENTRY
// ============================================================
function saveEntry() {
  // =====================================================
  // GET VALUES
  // =====================================================

  const bottleType = selectedBottles || "";

  const bottleCond = selectedBottleCond || "";

  const degree = document.getElementById("hd-degree").value || "";

  const pallets = document.getElementById("f-layers").value.trim();

  // =====================================================
  // VALIDATE REQUIRED
  // =====================================================
  if (!bottleCond) {
    alert("กรุณาเลือกชนิดขวด");

    return;
  }

  if (!bottleType) {
    alert("กรุณาเลือกประเภทขวด");

    return;
  }

  if (!degree) {
    alert("กรุณาเลือกดีกรีสุรา");

    return;
  }

  if (pallets === "" || Number(pallets) <= 0) {
    alert("กรุณากรอกจำนวนพาเลท");

    document.getElementById("f-layers").focus();

    return;
  }

  // =====================================================
  // BUILD PAYLOAD
  // =====================================================

  const entry = {
    date: document.getElementById("hd-date").value,
    line: document.getElementById("hd-line").value,
    liquor: document.getElementById("hd-liquor").value,
    ka: selectedKa,
    startTime: document.getElementById("hd-start").value,
    stopTime: document.getElementById("hd-stop").value,
    time: document.getElementById("f-time").value || "--:--",
    p1: document.getElementById("f-pressure1").value || "5",
    p2: document.getElementById("f-pressure2").value || "5",
    bottleType: selectedBottles.join(", ") || "—",
    bottleCond: selectedBottleCond || "—",
    bottles: document.getElementById("f-bottles").value || "0",
    degree: document.getElementById("hd-degree").value,
    layers: document.getElementById("f-layers").value || "0",
    note: "",
    remark: document.getElementById("f-remark").value.trim(),
    operator: document.getElementById("sig-operator").value.trim(),
    checker: document.getElementById("sig-checker").value.trim(),
    ts: Date.now(),
  };

  console.log(JSON.stringify(entry));

  // บันทึกใน localStorage เสมอ (offline backup)
  entries.push(entry);
  localStorage.setItem("dp_entries", JSON.stringify(entries));

  // reset fields
  document.getElementById("f-bottles").value = "";
  document.getElementById("f-layers").value = "";
  // document.getElementById("f-note").value = "";
  document.getElementById("f-remark").value = "";
  document
    .querySelectorAll("#bottle-select .bottle-chip")
    .forEach((c) => c.classList.remove("on"));
  document
    .querySelectorAll("#degree-select .degree-chip")
    .forEach((c) => c.classList.remove("on"));
  document
    .querySelectorAll("#bottle-cond .bottle-chip")
    .forEach((c) => c.classList.remove("on"));
  selectedBottles = [];
  selectedBottleCond = "";

  // เลื่อนเวลา +1 ชม.
  const [hh] = entry.time.split(":").map(Number);
  document.getElementById("f-time").value =
    String((hh + 1) % 24).padStart(2, "0") + ":00";

  // ส่งไป Google Sheets
  const url = localStorage.getItem("sheet_url_depallet");
  if (!url) {
    showToast("✅ บันทึกในเครื่องสำเร็จ (ยังไม่ได้ตั้งค่า Sheets)");
    renderPrev();
    return;
  }

  showToast("📤 กำลังส่งข้อมูล...");
  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  })
    .then(() => {
      showToast(`✅ บันทึก ${entry.time} น. เข้า Sheets สำเร็จ!`);
      // ดึงข้อมูลชั่วโมงใหม่จาก Sheets
      setTimeout(fetchPrevHour, 1500);
    })
    .catch(() => {
      showToast("⚠️ ส่งไม่สำเร็จ — บันทึกในเครื่องไว้แล้ว");
      renderPrev();
    });
}
// ============================================================
//  GOOGLE SHEETS URL SETUP
// ============================================================
function toggleSetup() {
  const body = document.getElementById("sheets-setup-body");
  body.style.display = body.style.display === "none" ? "block" : "none";
}
function saveSheetUrl() {
  const url = document.getElementById("sheet-url-input").value.trim();
  if (!url.startsWith("https://script.google.com")) {
    showToast("⚠️ URL ไม่ถูกต้อง — ต้องเริ่มด้วย https://script.google.com");
    return;
  }
  localStorage.setItem("sheet_url_depallet", url);
  updateSheetBadge();
  document.getElementById("sheets-setup-body").style.display = "none";
  showToast("✅ บันทึก URL สำเร็จ!");
}
function clearSheetUrl() {
  localStorage.removeItem("sheet_url_depallet");
  document.getElementById("sheet-url-input").value = "";
  updateSheetBadge();
  showToast("🗑️ ลบ URL แล้ว");
}
function updateSheetBadge() {
  const badge = document.getElementById("sheets-status-badge");
  const url = localStorage.getItem("sheet_url_depallet");
  if (url) {
    badge.textContent = "✅ เชื่อมต่อแล้ว";
    badge.style.background = "rgba(0,200,100,.3)";
  } else {
    badge.textContent = "⚠️ ยังไม่ได้ตั้งค่า";
    badge.style.background = "rgba(255,200,0,.3)";
  }
}

// ============================================================
//  LOG TABLE
// ============================================================
function renderLog(data = []) {
  const tbody = document.getElementById("log-tbody");

  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="color:var(--muted);padding:20px;font-style:italic;">ยังไม่มีข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = "";

  data.forEach((e, i) => {
    const isLast = i === data.length - 1;

    const bg = isLast ? "background:#fff8e6;" : "";

    const condBadge =
      e.bottleCond === "ขวดใหม่"
        ? '<span style="color:#166534;font-weight:700;">🟢 ใหม่</span>'
        : e.bottleCond === "ขวดเก่า"
          ? '<span style="color:#b45309;font-weight:700;">🟡 เก่า</span>'
          : "—";

    tbody.innerHTML += `
            <tr style="${bg}">
              <td class="mono">${e.time}</td>
              <td class="mono">${e.p1}</td>
              <td class="mono">${e.p2}</td>
              <td style="font-size:12px;font-weight:600;">${e.bottleType}</td>
              <td style="font-size:12px;">${condBadge}</td>
              <td class="mono">${e.pallets || e.layers || ""}</td>
              <td class="mono" style="font-weight:700;">${Number(e.bottles || 0).toLocaleString()}</td>
              <td class="td-note">${e.note || "—"}</td>
            </tr>
          `;
  });
}

// ============================================================
//  TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 2200);
}
