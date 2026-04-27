const API_BASE_DEFAULT = "http://127.0.0.1:8000";
const NAVER_HOSTS = ["land.naver.com", "new.land.naver.com", "m.land.naver.com"];

const REGION_LABEL = {
  강남: "강남", 성수: "성수", 성동: "성수/성동", 마포: "홍대/마포",
  성남: "판교/성남", 부산: "부산"
};
const BUSINESS_LABEL = { 카페: "카페/디저트", 외식: "외식", 서비스: "서비스" };

const els = {
  hint: document.getElementById("pageHint"),
  status: document.getElementById("status"),
  form: document.getElementById("listingForm"),
  submit: document.getElementById("submitBtn"),
  extract: document.getElementById("extractAgain"),
  apiBaseInput: document.getElementById("apiBaseInput"),
  apiBaseSave: document.getElementById("apiBaseSave"),
  chipsBox: document.getElementById("strategyChips"),
  chipList: document.getElementById("chipList"),
  modeTabs: document.getElementById("modeTabs"),
  listMode: document.getElementById("listMode"),
  listItems: document.getElementById("listItems"),
  listStatus: document.getElementById("listStatus"),
  listCount: document.getElementById("listCount"),
  selectAll: document.getElementById("selectAll"),
  bulkSubmit: document.getElementById("bulkSubmit"),
  refreshList: document.getElementById("refreshList")
};

let sourceUrl = "";
let strategy = {
  region: "", business_type: "",
  max_rent: null, preferred_area: null, max_deposit: null
};
let extractedList = [];

function setStatus(message, kind = "") {
  els.status.textContent = message || "";
  els.status.classList.toggle("is-error", kind === "error");
  els.status.classList.toggle("is-success", kind === "success");
}

function setListStatus(message, kind = "") {
  els.listStatus.textContent = message || "";
  els.listStatus.classList.toggle("is-error", kind === "error");
  els.listStatus.classList.toggle("is-success", kind === "success");
}

function parseAmountManwon(text) {
  if (!text) return 0;
  const cleaned = String(text).replace(/[\s,]/g, "");
  let total = 0;
  const eok = cleaned.match(/([0-9]+(?:\.[0-9]+)?)억/);
  if (eok) total += parseFloat(eok[1]) * 10000;
  const cheon = cleaned.match(/([0-9]+(?:\.[0-9]+)?)천/);
  if (cheon) total += parseFloat(cheon[1]) * 1000;
  const man = cleaned.match(/([0-9]+(?:\.[0-9]+)?)만/);
  if (man) total += parseFloat(man[1]);
  if (!total) {
    const num = parseFloat(cleaned);
    if (!Number.isNaN(num)) total = num;
  }
  return Math.round(total);
}

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  return apiBase || API_BASE_DEFAULT;
}
async function setApiBase(value) {
  await chrome.storage.local.set({ apiBase: value });
}

async function loadStrategy() {
  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/strategy`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    strategy = await res.json();
    renderStrategyChips();
    return true;
  } catch (error) {
    els.chipsBox.hidden = false;
    const reason = error && error.message ? error.message : "unknown";
    const isNetwork = /Failed to fetch|NetworkError|ERR_/i.test(reason);
    els.chipList.innerHTML = `
      <span class="chip miss">${isNetwork ? "API 서버 미연결" : "전략 로드 실패"}</span>
      <button type="button" class="chip" id="retryStrategy">재시도</button>
    `;
    setStatus(
      isNetwork
        ? `${apiBase} 연결 실패 — FastAPI 서버를 먼저 실행하세요 (run-api.ps1)`
        : `전략 로드 실패: ${reason}`,
      "error"
    );
    const apiDetails = document.querySelector(".api-config");
    if (apiDetails) apiDetails.open = true;
    document.getElementById("retryStrategy")?.addEventListener("click", loadStrategy);
    return false;
  }
}

function renderStrategyChips() {
  const chips = [];
  if (strategy.region) chips.push(`지역: ${REGION_LABEL[strategy.region] || strategy.region}`);
  if (strategy.business_type) chips.push(`업종: ${BUSINESS_LABEL[strategy.business_type] || strategy.business_type}`);
  if (strategy.max_rent) chips.push(`월세 ≤ ${strategy.max_rent}만`);
  if (strategy.preferred_area) chips.push(`면적 ≈ ${strategy.preferred_area}㎡`);
  if (strategy.max_deposit) chips.push(`보증금 ≤ ${(strategy.max_deposit / 10000).toFixed(1).replace(".0", "")}억`);
  if (!chips.length) {
    els.chipsBox.hidden = true;
    return;
  }
  els.chipsBox.hidden = false;
  els.chipList.innerHTML = chips.map((t) => `<span class="chip">${t}</span>`).join("");
}

function evaluateMatches() {
  const region = els.form.region.value || "";
  const business = els.form.business_type.value || "";
  const rent = Number(els.form.monthly_rent.value) || 0;
  const area = Number(els.form.area_m2.value) || 0;
  const deposit = Number(els.form.deposit.value) || 0;
  const result = {};
  if (strategy.region) result.region = region.includes(strategy.region) ? "match" : "miss";
  if (strategy.business_type) result.business_type = business.includes(strategy.business_type) ? "match" : "miss";
  if (strategy.max_rent && rent) result.monthly_rent = rent <= strategy.max_rent ? "match" : "miss";
  if (strategy.preferred_area && area) result.area_m2 = Math.abs(area - strategy.preferred_area) <= 10 ? "match" : "miss";
  if (strategy.max_deposit && deposit) result.deposit = deposit <= strategy.max_deposit ? "match" : "miss";
  return result;
}

function applyMatchClasses() {
  const matches = evaluateMatches();
  for (const field of ["region", "business_type", "monthly_rent", "area_m2", "deposit"]) {
    const input = els.form[field];
    if (!input) continue;
    const label = input.closest("label");
    if (!label) continue;
    label.classList.remove("match", "miss");
    if (matches[field]) label.classList.add(matches[field]);
  }
}

function fillDetailForm(data) {
  if (!data) return;
  els.form.title.value = data.title || "";
  els.form.region.value = data.region_guess || "";
  els.form.address.value = data.raw_address || "";
  els.form.deposit.value = parseAmountManwon(data.deposit_text) || "";
  els.form.monthly_rent.value = parseAmountManwon(data.rent_text) || "";
  els.form.premium.value = parseAmountManwon(data.premium_text) || "";
  els.form.area_m2.value = data.area_text ? parseFloat(data.area_text) : "";
  els.form.business_type.value = data.business_type || "";
  sourceUrl = data.url || "";
  applyMatchClasses();
}

// ── 리스트 모드 렌더링 ──────────────────────────────────────
function itemMatchHint(item) {
  const tags = [];
  if (strategy.max_rent) {
    const rent = parseAmountManwon(item.rent_text);
    if (rent && rent <= strategy.max_rent) tags.push("월세✓");
    else if (rent) tags.push("월세⚠");
  }
  if (strategy.preferred_area) {
    const area = parseFloat(item.area_text || 0);
    if (area && Math.abs(area - strategy.preferred_area) <= 10) tags.push("면적✓");
    else if (area) tags.push("면적⚠");
  }
  if (strategy.region) {
    if ((item.raw_address || "").includes(strategy.region)) tags.push("지역✓");
  }
  return tags.join(" · ");
}

function renderList(items) {
  els.listCount.textContent = `${items.length}건 추출`;
  if (!items.length) {
    els.listItems.innerHTML = `<li><span class="li-meta">매물 카드를 찾지 못했습니다 — 페이지를 스크롤해 카드를 더 로드한 뒤 재추출 해보세요.</span></li>`;
    els.bulkSubmit.disabled = true;
    return;
  }
  els.listItems.innerHTML = items
    .map((item, idx) => {
      const matchTags = itemMatchHint(item);
      const meta = [
        item.region_guess,
        item.deposit_text && `보증금 ${item.deposit_text}`,
        item.rent_text && `월세 ${item.rent_text}만`,
        item.area_text && `${item.area_text}㎡`
      ]
        .filter(Boolean)
        .join(" · ");
      return `
        <li data-idx="${idx}">
          <input type="checkbox" data-idx="${idx}" ${strategy.region && item.raw_address && item.raw_address.includes(strategy.region) ? "checked" : ""} />
          <div class="li-body">
            <span class="li-title">${escapeHtml(item.title)}</span>
            <span class="li-meta">${escapeHtml(meta)}</span>
            ${matchTags ? `<span class="li-meta" style="color:var(--green);font-weight:700">${escapeHtml(matchTags)}</span>` : ""}
          </div>
        </li>
      `;
    })
    .join("");

  els.listItems.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", updateBulkButton);
  });
  els.listItems.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      const cb = li.querySelector('input[type="checkbox"]');
      if (cb) {
        cb.checked = !cb.checked;
        updateBulkButton();
      }
    });
  });
  updateBulkButton();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function getCheckedIndices() {
  return Array.from(els.listItems.querySelectorAll('input[type="checkbox"]:checked'))
    .map((cb) => Number(cb.dataset.idx))
    .filter((n) => !Number.isNaN(n));
}

function updateBulkButton() {
  const n = getCheckedIndices().length;
  els.bulkSubmit.disabled = n === 0;
  els.bulkSubmit.textContent = `선택 ${n}건 등록`;
  els.listItems.querySelectorAll("li").forEach((li) => {
    const cb = li.querySelector('input[type="checkbox"]');
    li.classList.toggle("selected", !!(cb && cb.checked));
  });
  if (els.selectAll) {
    const cbs = els.listItems.querySelectorAll('input[type="checkbox"]');
    els.selectAll.checked = cbs.length > 0 && Array.from(cbs).every((c) => c.checked);
  }
}

function itemToPayload(item) {
  return {
    source: "naver_realestate",
    title: item.title || "",
    region: item.region_guess || item.raw_address || "",
    address: item.raw_address || "",
    deposit: parseAmountManwon(item.deposit_text) || 0,
    monthly_rent: parseAmountManwon(item.rent_text) || 0,
    premium: parseAmountManwon(item.premium_text) || 0,
    area_m2: item.area_text ? parseFloat(item.area_text) : 0,
    business_type: item.business_type || "",
    source_url: item.url || "",
    listed_at: new Date().toISOString().slice(0, 10)
  };
}

async function bulkSubmit() {
  const indices = getCheckedIndices();
  if (!indices.length) return;
  els.bulkSubmit.disabled = true;
  setListStatus(`${indices.length}건 등록 중…`);

  const payload = { items: indices.map((i) => itemToPayload(extractedList[i])) };
  const apiBase = await getApiBase();

  try {
    const res = await fetch(`${apiBase}/candidates/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setListStatus(`등록 실패: HTTP ${res.status} ${JSON.stringify(body)}`, "error");
      els.bulkSubmit.disabled = false;
      return;
    }

    setListStatus(`등록 ${body.imported}건 · 중복/무효 ${body.skipped}건`, "success");

    // 항목별 상태 표시
    const resultMap = new Map();
    body.items.forEach((it, i) => resultMap.set(indices[i], it));
    els.listItems.querySelectorAll("li").forEach((li) => {
      const idx = Number(li.dataset.idx);
      const result = resultMap.get(idx);
      if (!result) return;
      li.classList.add(result.status === "duplicate" ? "is-duplicate" : "");
      const body = li.querySelector(".li-body");
      const tag = document.createElement("span");
      tag.className = `li-status ${result.status}`;
      tag.textContent =
        result.status === "created" ? `등록됨 #${result.id}`
          : result.status === "duplicate" ? `중복${result.id ? ` #${result.id}` : ""}`
          : `무효 ${result.detail || ""}`;
      const old = body.querySelector(".li-status");
      if (old) old.remove();
      body.appendChild(tag);
      const cb = li.querySelector('input[type="checkbox"]');
      if (cb) cb.disabled = true;
    });
    els.bulkSubmit.disabled = true;
  } catch (error) {
    setListStatus(`API 통신 실패: ${error.message}`, "error");
    els.bulkSubmit.disabled = false;
  }
}

// ── 모드 전환 ────────────────────────────────────────────
function switchMode(mode) {
  document.querySelectorAll(".mode-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  els.listMode.hidden = mode !== "list";
  els.form.hidden = mode !== "detail";
}

// ── 추출 ───────────────────────────────────────────────
async function detectAndExtract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    setStatus("탭 정보를 읽을 수 없습니다", "error");
    return;
  }
  const isNaver = NAVER_HOSTS.some((h) => tab.url.includes(h));
  if (!isNaver) {
    els.hint.textContent = "네이버 부동산 페이지가 아닙니다 — 수동 입력 가능";
    els.modeTabs.hidden = true;
    els.form.hidden = false;
    setStatus("URL: " + tab.url);
    return;
  }
  els.hint.textContent = new URL(tab.url).hostname;

  let response;
  try {
    response = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_LISTING" });
  } catch (error) {
    setStatus("콘텐츠 스크립트 미주입 — 페이지 새로고침 후 다시 시도하세요", "error");
    els.form.hidden = false;
    return;
  }
  if (!response || !response.ok) {
    setStatus(`추출 실패: ${response && response.error || "알 수 없음"}`, "error");
    return;
  }

  const { page_kind, detail, list } = response.data;
  extractedList = list || [];

  els.modeTabs.hidden = false;
  if (page_kind === "list" && extractedList.length >= 2) {
    switchMode("list");
    renderList(extractedList);
    setListStatus(`${extractedList.length}건 추출 완료 — 체크 후 일괄 등록`, "success");
  } else {
    switchMode("detail");
    fillDetailForm(detail);
    setStatus("자동 추출 완료 — 필드 확인 후 등록", "success");
    if (extractedList.length) {
      renderList(extractedList);
      setListStatus(`리스트 탭에서 ${extractedList.length}건 일괄 등록 가능`, "");
    }
  }
}

// ── 이벤트 ────────────────────────────────────────────
["region", "business_type", "monthly_rent", "area_m2", "deposit"].forEach((name) => {
  const input = els.form[name];
  if (input) input.addEventListener("input", applyMatchClasses);
});

document.querySelectorAll(".mode-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});

if (els.selectAll) {
  els.selectAll.addEventListener("change", () => {
    els.listItems.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach((cb) => {
      cb.checked = els.selectAll.checked;
    });
    updateBulkButton();
  });
}

if (els.bulkSubmit) els.bulkSubmit.addEventListener("click", bulkSubmit);
if (els.refreshList) els.refreshList.addEventListener("click", () => {
  setListStatus("재추출 중…");
  detectAndExtract();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.submit.disabled = true;
  setStatus("등록 중…");

  const fd = new FormData(els.form);
  const payload = {
    source: "naver_realestate",
    title: String(fd.get("title") || "").trim(),
    region: String(fd.get("region") || "").trim(),
    address: String(fd.get("address") || "").trim(),
    deposit: Number(fd.get("deposit")) || 0,
    monthly_rent: Number(fd.get("monthly_rent")) || 0,
    premium: Number(fd.get("premium")) || 0,
    area_m2: Number(fd.get("area_m2")) || 0,
    business_type: String(fd.get("business_type") || "").trim(),
    source_url: sourceUrl,
    listed_at: new Date().toISOString().slice(0, 10)
  };

  if (!payload.title || !payload.region) {
    setStatus("매물명/지역은 필수입니다", "error");
    els.submit.disabled = false;
    return;
  }
  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 201) {
      setStatus(`등록 완료 (id=${body.id})`, "success");
      els.submit.textContent = "닫기";
      els.submit.disabled = false;
      els.submit.onclick = (e) => { e.preventDefault(); window.close(); };
    } else if (res.status === 409) {
      const existingId = body && body.detail && body.detail.existing_id;
      setStatus(`이미 등록된 매물 (id=${existingId})`, "error");
      els.submit.disabled = false;
    } else {
      setStatus(`등록 실패: HTTP ${res.status} ${JSON.stringify(body)}`, "error");
      els.submit.disabled = false;
    }
  } catch (error) {
    setStatus(`API 통신 실패: ${error.message}`, "error");
    els.submit.disabled = false;
  }
});

els.extract.addEventListener("click", () => {
  setStatus("재추출 중…");
  detectAndExtract();
});
els.apiBaseSave.addEventListener("click", async () => {
  const value = els.apiBaseInput.value.trim();
  if (!value) return;
  await setApiBase(value);
  setStatus(`API 서버 저장됨: ${value}`, "success");
  await loadStrategy();
});

(async () => {
  const apiBase = await getApiBase();
  els.apiBaseInput.value = apiBase;
  await loadStrategy();
  await detectAndExtract();
})();
