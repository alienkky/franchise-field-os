// Naver 부동산 페이지에 Field OS 출점 조건을 플로팅 카드로 표시.
// 사용자가 좌측 필터를 수동 적용할 때 참조하도록 — 자동 클릭/자동 폼 채우기 없음.
(async () => {
  if (window.__ffosOverlayInjected__) return;
  window.__ffosOverlayInjected__ = true;

  const API_BASE_DEFAULT = "http://127.0.0.1:8000";
  const REGION_LABEL = {
    강남: "강남", 성수: "성수", 성동: "성수/성동",
    마포: "홍대/마포", 성남: "판교/성남", 부산: "부산"
  };
  const BUSINESS_LABEL = { 카페: "카페/디저트", 외식: "외식", 서비스: "서비스" };

  function getApiBase() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get("apiBase", (r) => resolve((r && r.apiBase) || API_BASE_DEFAULT));
      } catch (_) {
        resolve(API_BASE_DEFAULT);
      }
    });
  }

  async function fetchStrategy() {
    const apiBase = await getApiBase();
    try {
      const res = await fetch(`${apiBase}/strategy`, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  function buildChips(strategy) {
    const chips = [];
    if (strategy.region) chips.push(`지역: ${REGION_LABEL[strategy.region] || strategy.region}`);
    if (strategy.business_type) chips.push(`업종: ${BUSINESS_LABEL[strategy.business_type] || strategy.business_type}`);
    if (strategy.max_rent) chips.push(`월세 ≤ ${strategy.max_rent}만`);
    if (strategy.preferred_area) chips.push(`면적 ≈ ${strategy.preferred_area}㎡`);
    if (strategy.max_deposit) {
      const eok = (strategy.max_deposit / 10000).toFixed(1).replace(".0", "");
      chips.push(`보증금 ≤ ${eok}억`);
    }
    return chips;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  async function render() {
    const strategy = await fetchStrategy();
    if (!strategy) return;
    const chips = buildChips(strategy);
    if (!chips.length) return;

    const existing = document.getElementById("ffos-overlay");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "ffos-overlay";
    panel.innerHTML = `
      <header>
        <strong>📋 Field OS 출점 조건</strong>
        <button type="button" class="ffos-close" aria-label="닫기">×</button>
      </header>
      <div class="ffos-chips">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div>
      <small class="ffos-hint">좌측 필터에서 위 조건에 맞게 적용 → 확장 아이콘으로 매물 등록</small>
    `;
    document.body.appendChild(panel);
    panel.querySelector(".ffos-close").addEventListener("click", () => panel.remove());
    panel.querySelector("header strong").addEventListener("click", () => {
      panel.classList.toggle("is-mini");
    });
  }

  // Naver SPA는 초기 로드 후 DOM이 비어있을 수 있어 약간 지연 후 표시
  setTimeout(render, 600);

  // 사용자가 페이지 내에서 라우팅(예: 다른 매물 클릭)해도 오버레이가 살아있어야 함
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (!document.getElementById("ffos-overlay")) render();
    }
  }, 1500);
})();
