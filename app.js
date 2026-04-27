const candidates = [
  {
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

const rows = document.querySelector("#candidateRows");
const detailTitle = document.querySelector("#detailTitle");
const detailScore = document.querySelector("#detailScore");
const detailFit = document.querySelector("#detailFit");
const detailCost = document.querySelector("#detailCost");
const detailMemo = document.querySelector("#detailMemo");
const logList = document.querySelector("#logList");

function renderRows(filter = "all") {
  const filtered = candidates.filter((candidate) => {
    if (filter === "all") return true;
    if (filter === "hot") return candidate.score >= 85;
    if (filter === "pending") return candidate.status === "대기";
    return true;
  });

  rows.innerHTML = filtered
    .map(
      (candidate, index) => `
        <tr data-index="${candidates.indexOf(candidate)}" class="${index === 0 ? "selected" : ""}">
          <td>
            <div class="candidate-name">${candidate.title}</div>
            <div class="subtle">${candidate.fit}</div>
          </td>
          <td>${candidate.region}</td>
          <td>${candidate.cost}</td>
          <td>${candidate.area}</td>
          <td>${candidate.owner}</td>
          <td><span class="badge">${candidate.status}</span></td>
          <td><strong>${candidate.score}</strong></td>
        </tr>
      `
    )
    .join("");

  [...rows.querySelectorAll("tr")].forEach((row) => {
    row.addEventListener("click", () => selectCandidate(Number(row.dataset.index)));
  });

  if (filtered.length) selectCandidate(candidates.indexOf(filtered[0]));
}

function selectCandidate(index) {
  const candidate = candidates[index];
  detailTitle.textContent = candidate.title;
  detailScore.textContent = candidate.score;
  detailFit.textContent = candidate.fit;
  detailCost.textContent = candidate.cost;
  detailMemo.textContent = candidate.memo;

  [...rows.querySelectorAll("tr")].forEach((row) => {
    row.classList.toggle("selected", Number(row.dataset.index) === index);
  });
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderRows(button.dataset.filter);
  });
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelector("#runAutomationBtn").addEventListener("click", () => {
  const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const item = document.createElement("li");
  item.innerHTML = `<strong>${now}</strong> 수동 실행 요청 접수 · 브라우저 세션 확인 대기`;
  logList.prepend(item);
});

document.querySelector("#approveBtn").addEventListener("click", () => {
  detailMemo.textContent = "검토 완료 처리됨. 다음 단계: 임대 조건 재확인 및 현장 방문 일정 등록";
});

document.querySelector("#assignBtn").addEventListener("click", () => {
  detailMemo.textContent = "담당자 배정이 필요합니다. GitHub Issue 또는 CRM 태스크로 연결할 수 있습니다.";
});

document.querySelector("#mobilePreviewBtn").addEventListener("click", () => {
  document.querySelector("#mobilePreview").scrollIntoView({ behavior: "smooth", block: "center" });
});

renderRows();
