const API_BASE = "http://127.0.0.1:8000";

const FALLBACK_CANDIDATES = [
  {
    id: -1,
    title: "강남역 2번 출구 코너",
    region: "서울 강남",
    cost: "보증금 1.2억 · 월세 580만",
    area: "46㎡",
    owner: "김지훈",
    status: "검토중",
    score: 92,
    fit: "카페/디저트 최적",
    memo: "점심 유동 강함, 권리금 협상 필요",
    type: "hot"
  },
  {
    id: -2,
    title: "성수 카페거리 1층",
    region: "서울 성동",
    cost: "보증금 8천 · 월세 430만",
    area: "39㎡",
    owner: "박민서",
    status: "대기",
    score: 87,
    fit: "디저트 테이크아웃 적합",
    memo: "주말 유동 우수, 주변 경쟁 밀도 확인 필요",
    type: "hot"
  },
  {
    id: -3,
    title: "판교 테크노밸리 B동",
    region: "경기 성남",
    cost: "보증금 6천 · 월세 360만",
    area: "52㎡",
    owner: "이도윤",
    status: "검토중",
    score: 81,
    fit: "직장인 점심 수요 적합",
    memo: "오피스 피크 시간대 매출형 브랜드에 적합",
    type: "all"
  },
  {
    id: -4,
    title: "홍대입구 대로변",
    region: "서울 마포",
    cost: "보증금 9천 · 월세 510만",
    area: "33㎡",
    owner: "미배정",
    status: "대기",
    score: 78,
    fit: "젊은 고객층 브랜드 적합",
    memo: "면적은 작지만 노출이 좋음",
    type: "pending"
  },
  {
    id: -5,
    title: "부산 서면 중심상권",
    region: "부산 부산진",
    cost: "보증금 7천 · 월세 390만",
    area: "57㎡",
    owner: "정하린",
    status: "협의",
    score: 74,
    fit: "외식 브랜드 적합",
    memo: "지방 핵심 상권 테스트 후보",
    type: "all"
  }
];

const state = {
  candidates: [],
  filter: "all",
  selectedId: null,
  source: "loading",
  strategy: {
    region: "",
    max_rent: null,
    preferred_area: null,
    business_type: ""
  }
};

const rows = document.querySelector("#candidateRows");
const detailTitle = document.querySelector("#detailTitle");
const detailScore = document.querySelector("#detailScore");
const detailFit = document.querySelector("#detailFit");
const detailCost = document.querySelector("#detailCost");
const detailMemo = document.querySelector("#detailMemo");
const logList = document.querySelector("#logList");

const SESSION_LABELS = {
  myfranchise: "마이프차 세션",
  naver_realestate: "네이버 부동산 세션"
};
const SESSION_COUNTED_SOURCES = {
  myfranchise: ["myfranchise"],
  naver_realestate: ["naver_realestate", "naver", "naver_land"]
};

function buildCandidatesUrl() {
  const url = new URL(`${API_BASE}/dashboard/candidates`);
  const { region, max_rent, preferred_area, business_type } = state.strategy;
  if (region) url.searchParams.set("region", region);
  if (max_rent != null) url.searchParams.set("max_rent", String(max_rent));
  if (preferred_area != null) url.searchParams.set("preferred_area", String(preferred_area));
  if (business_type) url.searchParams.set("business_type", business_type);
  return url;
}

async function loadCandidates({ silent = false } = {}) {
  try {
    const response = await fetch(buildCandidatesUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("invalid");
    state.candidates = data;
    state.source = "api";
    if (!silent) appendLog(`FastAPI 동기화 완료 (${data.length}건)`);
  } catch (error) {
    if (state.source !== "api") {
      state.candidates = FALLBACK_CANDIDATES;
      state.source = "fallback";
      appendLog(`API 연결 실패 — 샘플 데이터 표시 (${error.message})`);
    } else {
      appendLog(`재페치 실패: ${error.message}`);
    }
  }
  updateSyncIndicator();
  renderRows();
}

function updateSyncIndicator() {
  // 표시는 /dashboard/sources 응답으로 갱신. 여기서는 API 미연결 폴백만 처리.
  if (state.source === "fallback") {
    document.querySelectorAll(".sync-card").forEach((card) => {
      card.classList.add("is-off");
      const small = card.querySelector("small");
      if (small) small.textContent = "API 미연결";
    });
  }
}

function relativeKorean(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString);
  const diffMs = Date.now() - then.getTime();
  if (Number.isNaN(diffMs)) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return then.toLocaleDateString("ko-KR");
}

async function refreshSessionCards() {
  let sources = {};
  try {
    const res = await fetch(`${API_BASE}/dashboard/sources`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sources = await res.json();
  } catch (error) {
    document.querySelectorAll(".sync-card").forEach((card) => {
      card.classList.add("is-off");
      const small = card.querySelector("small");
      if (small) small.textContent = `API 미연결 (${error.message})`;
    });
    return;
  }

  document.querySelectorAll(".sync-card[data-session]").forEach((card) => {
    const sessionKey = card.dataset.session;
    const sourceKeys = SESSION_COUNTED_SOURCES[sessionKey] || [sessionKey];
    let count = 0;
    let lastSeen = null;
    for (const key of sourceKeys) {
      const stat = sources[key];
      if (!stat) continue;
      count += stat.count || 0;
      if (stat.last_seen && (!lastSeen || stat.last_seen > lastSeen)) {
        lastSeen = stat.last_seen;
      }
    }

    const small = card.querySelector("small");
    card.classList.remove("is-off");
    if (count === 0) {
      card.classList.add("is-idle");
      if (small) {
        small.textContent =
          sessionKey === "naver_realestate"
            ? "확장에서 매물 등록 시 활성화"
            : "자동화 미연동 — 0건";
      }
    } else {
      card.classList.remove("is-idle");
      const rel = relativeKorean(lastSeen);
      if (small) small.textContent = `${count}건${rel ? ` · 최근 ${rel}` : ""}`;
    }
  });
}

function applyFilter(items, filter) {
  if (filter === "all") return items;
  if (filter === "hot") return items.filter((c) => c.score >= 85);
  if (filter === "pending") return items.filter((c) => c.status === "대기");
  return items;
}

function renderRows() {
  const filtered = applyFilter(state.candidates, state.filter);
  if (filtered.length === 0) {
    rows.innerHTML = `<tr><td colspan="7" class="subtle">표시할 후보가 없습니다.</td></tr>`;
    return;
  }

  if (!filtered.some((c) => c.id === state.selectedId)) {
    state.selectedId = filtered[0].id;
  }

  rows.innerHTML = filtered
    .map(
      (candidate) => `
        <tr data-id="${candidate.id}" class="${candidate.id === state.selectedId ? "selected" : ""}">
          <td>
            <div class="candidate-name">${escapeHtml(candidate.title)}</div>
            <div class="subtle">${escapeHtml(candidate.fit)}</div>
          </td>
          <td>${escapeHtml(candidate.region)}</td>
          <td>${escapeHtml(candidate.cost)}</td>
          <td>${escapeHtml(candidate.area)}</td>
          <td>${escapeHtml(candidate.owner)}</td>
          <td><span class="badge">${escapeHtml(candidate.status)}</span></td>
          <td><strong>${candidate.score}</strong></td>
        </tr>
      `
    )
    .join("");

  rows.querySelectorAll("tr[data-id]").forEach((row) => {
    row.addEventListener("click", () => selectCandidate(Number(row.dataset.id)));
  });

  selectCandidate(state.selectedId);
}

function selectCandidate(id) {
  const candidate = state.candidates.find((c) => c.id === id);
  if (!candidate) return;
  state.selectedId = id;
  detailTitle.textContent = candidate.title;
  detailScore.textContent = candidate.score;
  detailFit.textContent = candidate.fit;
  detailCost.textContent = candidate.cost;
  detailMemo.textContent = candidate.memo;

  rows.querySelectorAll("tr[data-id]").forEach((row) => {
    row.classList.toggle("selected", Number(row.dataset.id) === id);
  });
}

function appendLog(message) {
  if (!logList) return;
  const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const item = document.createElement("li");
  item.innerHTML = `<strong>${now}</strong> ${escapeHtml(message)}`;
  logList.prepend(item);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderRows();
  });
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelector("#runAutomationBtn").addEventListener("click", () => {
  appendLog("수동 실행 요청 접수 · 브라우저 세션 확인 대기");
});

async function patchCandidate(id, payload) {
  if (state.source !== "api") {
    appendLog("API 미연결 — 변경사항이 저장되지 않았습니다");
    const local = state.candidates.find((c) => c.id === id);
    if (local) Object.assign(local, payload);
    renderRows();
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/dashboard/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const updated = await response.json();
    const idx = state.candidates.findIndex((c) => c.id === id);
    if (idx >= 0) state.candidates[idx] = updated;
    renderRows();
    appendLog(`#${id} 업데이트 완료`);
  } catch (error) {
    appendLog(`업데이트 실패: ${error.message}`);
  }
}

document.querySelector("#approveBtn").addEventListener("click", () => {
  if (state.selectedId == null) return;
  patchCandidate(state.selectedId, {
    status: "검토완료",
    memo: "검토 완료 — 임대 조건 재확인 및 현장 방문 일정 등록 필요"
  });
});

document.querySelector("#assignBtn").addEventListener("click", () => {
  if (state.selectedId == null) return;
  const name = window.prompt("담당자 이름을 입력하세요");
  if (!name) return;
  patchCandidate(state.selectedId, { assignee: name.trim(), status: "검토중" });
});

document.querySelector("#mobilePreviewBtn").addEventListener("click", () => {
  document.querySelector("#mobilePreview").scrollIntoView({ behavior: "smooth", block: "center" });
});

function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

const reloadStrategy = debounce(() => loadCandidates({ silent: true }), 250);

function formatDeposit(manwon) {
  if (manwon >= 10000) return `${(manwon / 10000).toFixed(1).replace(".0", "")}억`;
  if (manwon >= 1000) return `${manwon / 1000}천`;
  return `${manwon}만`;
}

const strategyEls = {
  region: document.querySelector("#strategyRegion"),
  regionValue: document.querySelector("#strategyRegionValue"),
  deposit: document.querySelector("#strategyDeposit"),
  depositValue: document.querySelector("#strategyDepositValue"),
  rent: document.querySelector("#strategyRent"),
  rentValue: document.querySelector("#strategyRentValue"),
  area: document.querySelector("#strategyArea"),
  areaValue: document.querySelector("#strategyAreaValue"),
  businessType: document.querySelector("#strategyBusinessType"),
  saveStatus: document.querySelector("#strategySaveStatus"),
  searchBtn: document.querySelector("#searchNaverBtn")
};

function setStrategySaveStatus(text) {
  if (strategyEls.saveStatus) strategyEls.saveStatus.textContent = text;
}

const persistStrategy = debounce(async () => {
  setStrategySaveStatus("저장 중…");
  try {
    const res = await fetch(`${API_BASE}/strategy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region: state.strategy.region || "",
        business_type: state.strategy.business_type || "",
        max_deposit: state.strategy.max_deposit ?? null,
        max_rent: state.strategy.max_rent ?? null,
        preferred_area: state.strategy.preferred_area ?? null
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setStrategySaveStatus("저장됨");
  } catch (error) {
    setStrategySaveStatus(`저장 실패 (${error.message})`);
  }
}, 400);

function applyStrategyToUI(strategy) {
  if (!strategy) return;
  state.strategy.region = strategy.region || "";
  state.strategy.business_type = strategy.business_type || "";
  state.strategy.max_rent = strategy.max_rent ?? null;
  state.strategy.preferred_area = strategy.preferred_area ?? null;
  state.strategy.max_deposit = strategy.max_deposit ?? null;

  if (strategyEls.region) {
    strategyEls.region.value = state.strategy.region;
    const opt = strategyEls.region.options[strategyEls.region.selectedIndex];
    if (opt && strategyEls.regionValue) strategyEls.regionValue.textContent = opt.textContent;
  }
  if (strategyEls.businessType) strategyEls.businessType.value = state.strategy.business_type;
  if (strategyEls.rent && state.strategy.max_rent != null) {
    strategyEls.rent.value = state.strategy.max_rent;
    strategyEls.rentValue.textContent = `${state.strategy.max_rent}만`;
  }
  if (strategyEls.area && state.strategy.preferred_area != null) {
    strategyEls.area.value = state.strategy.preferred_area;
    strategyEls.areaValue.textContent = `${state.strategy.preferred_area}㎡`;
  }
  if (strategyEls.deposit && state.strategy.max_deposit != null) {
    strategyEls.deposit.value = state.strategy.max_deposit;
    strategyEls.depositValue.textContent = formatDeposit(Number(state.strategy.max_deposit));
  }
}

async function loadStrategyFromApi() {
  try {
    const res = await fetch(`${API_BASE}/strategy`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const strategy = await res.json();
    applyStrategyToUI(strategy);
    setStrategySaveStatus(strategy.updated_at ? "저장됨" : "기본값");
  } catch (error) {
    setStrategySaveStatus("API 미연결");
  }
}

if (strategyEls.region) {
  strategyEls.region.addEventListener("change", (e) => {
    state.strategy.region = e.target.value;
    strategyEls.regionValue.textContent = e.target.options[e.target.selectedIndex].textContent;
    reloadStrategy();
    persistStrategy();
  });
}

if (strategyEls.deposit) {
  strategyEls.deposit.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    state.strategy.max_deposit = v;
    strategyEls.depositValue.textContent = formatDeposit(v);
    persistStrategy();
  });
}

if (strategyEls.rent) {
  strategyEls.rent.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    state.strategy.max_rent = v;
    strategyEls.rentValue.textContent = `${v}만`;
    reloadStrategy();
    persistStrategy();
  });
}

if (strategyEls.area) {
  strategyEls.area.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    state.strategy.preferred_area = v;
    strategyEls.areaValue.textContent = `${v}㎡`;
    reloadStrategy();
    persistStrategy();
  });
}

if (strategyEls.businessType) {
  strategyEls.businessType.addEventListener("change", (e) => {
    state.strategy.business_type = e.target.value;
    reloadStrategy();
    persistStrategy();
  });
}

const REGION_QUERY_MAP = {
  강남: "서울 강남",
  성수: "서울 성수",
  성동: "서울 성동",
  마포: "서울 마포 홍대",
  성남: "경기 성남 판교",
  부산: "부산 서면"
};
const BUSINESS_QUERY_MAP = {
  카페: "상가 카페",
  외식: "상가 외식",
  서비스: "상가 서비스"
};

// 네이버 부동산 SPA 지도 좌표 (위도,경도). 새 지역 추가 시 여기와 select option만 수정.
const REGION_COORDS = {
  강남: [37.4979, 127.0276],
  성수: [37.5443, 127.0557],
  성동: [37.5634, 127.0367],
  마포: [37.5566, 126.9237],
  성남: [37.4019, 127.1085],
  부산: [35.1572, 129.0596]
};

function buildNaverSearchUrl() {
  const parts = [];
  const regionKey = state.strategy.region;
  parts.push(REGION_QUERY_MAP[regionKey] || regionKey || "상가");
  if (state.strategy.business_type) {
    parts.push(BUSINESS_QUERY_MAP[state.strategy.business_type] || state.strategy.business_type);
  } else if (!regionKey) {
    parts.push("월세");
  }
  if (state.strategy.max_rent) parts.push(`월세 ${state.strategy.max_rent}만원 이하`);
  const query = parts.join(" ").trim();
  return `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(query)}+부동산`;
}

// new.land.naver.com /complexes 매물 지도 페이지 깊은 링크.
// 검증된 파라미터(사용자 제공 URL 기준):
//   - 경로: /complexes  (※ /offices 아님)
//   - e=RETAIL: 상가/업무/공장/토지 메뉴
//   - a=JGC: 상가/사무실/공장/건물 묶음 카테고리 (단일 '상가' 코드는 Naver 비공개 — 페이지 상단 체크박스에서 수동 조정)
//   - ms=lat,lng,zoom (정식은 base62 인코딩이지만 plain 좌표를 SPA가 보통 정규화)
// 가격/면적 필터(rprc/rrent/spc)는 best-effort — Naver SPA 업데이트 시 깨질 수 있음.
// 깨지면 페이지 좌측 필터 패널에서 손으로 적용 (오버레이가 출점 조건 표시).
function buildNaverLandUrl() {
  const { region, max_rent, max_deposit, preferred_area } = state.strategy;
  const coords = REGION_COORDS[region];

  const url = new URL("https://new.land.naver.com/complexes");
  url.searchParams.set("e", "RETAIL");
  url.searchParams.set("a", "JGC");

  if (coords) {
    url.searchParams.set("ms", `${coords[0]},${coords[1]},17`);
  }

  url.searchParams.set("tradTypes", "B1");
  if (max_deposit) url.searchParams.set("rprc", `0:${Math.round(max_deposit)}`);
  if (max_rent) url.searchParams.set("rrent", `0:${Math.round(max_rent)}`);
  if (preferred_area) {
    const lo = Math.max(0, Math.round(preferred_area - 15));
    const hi = Math.round(preferred_area + 15);
    url.searchParams.set("spc", `${lo}:${hi}`);
  }
  return url.toString();
}

if (strategyEls.searchBtn) {
  strategyEls.searchBtn.addEventListener("click", () => {
    const url = buildNaverLandUrl();
    appendLog("네이버 부동산 /complexes 지도(상가 카테고리) 열기");
    window.open(url, "_blank", "noopener");
  });
}

const mobileMemoBtn = document.querySelector("#mobileMemoBtn");
if (mobileMemoBtn) {
  mobileMemoBtn.addEventListener("click", () => {
    if (state.selectedId == null) return;
    const memo = window.prompt("현장 메모를 입력하세요");
    if (!memo) return;
    patchCandidate(state.selectedId, { memo: memo.trim() });
  });
}

(async () => {
  await loadStrategyFromApi();
  await loadCandidates();
  await refreshSessionCards();
})();
setInterval(refreshSessionCards, 60000);
