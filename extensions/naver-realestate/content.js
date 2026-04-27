(() => {
  const PATTERNS = window.NAVER_REALESTATE_PATTERNS || {};

  const tryMatch = (regex, text) => {
    if (!regex || !text) return "";
    const m = text.match(regex);
    return m ? (m[1] || m[0]).trim() : "";
  };

  const cleanWS = (s) => (s || "").replace(/\s+/g, " ").trim();

  function metaContent(prop) {
    const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }

  function visibleText() {
    const main = document.querySelector("main, #content, .article_main, article") || document.body;
    return cleanWS((main.innerText || "")).slice(0, 20000);
  }

  function cleanTitle(raw) {
    return (raw || "")
      .replace(/\s*[:|]\s*네이버\s*부동산.*$/u, "")
      .replace(/\s*-\s*네이버\s*부동산.*$/u, "")
      .trim();
  }

  function extractDetail() {
    const ogTitle = metaContent("og:title");
    const ogDesc = metaContent("og:description");
    const text = visibleText();
    const haystack = `${ogDesc}\n${text}`;
    const region = tryMatch(PATTERNS.region, haystack);
    const regionShort = region ? region.split(/\s+/).slice(0, 2).join(" ") : "";

    return {
      title: cleanTitle(ogTitle || document.title),
      url: location.href,
      raw_address: region,
      region_guess: regionShort,
      deposit_text: tryMatch(PATTERNS.deposit, haystack),
      rent_text: tryMatch(PATTERNS.monthlyRent, haystack),
      premium_text: tryMatch(PATTERNS.premium, haystack),
      area_text: tryMatch(PATTERNS.area, haystack),
      business_type: tryMatch(PATTERNS.businessType, haystack),
      og_description: ogDesc
    };
  }

  // 매물 카드 리스트 추출. CSS 모듈 해시 클래스 대신 의미 패턴 사용.
  function extractList() {
    const candidates = new Set();

    // 가능한 매물 카드 컨테이너들 — 가장 유망한 후보부터 시도
    const selectors = [
      '[class*="item_link"]',
      '[class*="ItemLink"]',
      'a[href*="/articleList"]',
      'a[href*="/article/"]',
      'li[class*="item"]',
      'li[data-articleno]',
      'div[class*="item_inner"]',
      'div[class*="card"]'
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => candidates.add(el));
    }

    const items = [];
    const seenKeys = new Set();

    for (const el of candidates) {
      if (el.closest("header, nav, footer, .gnb, .header")) continue;

      const text = cleanWS(el.innerText || "");
      if (!text || text.length < 6) continue;

      // 가격 정보 없으면 매물 카드가 아닐 가능성 높음
      if (!/(월세|전세|매매|보증금)/.test(text)) continue;

      const titleEl =
        el.querySelector('strong, h3, h4, [class*="title"], [class*="text_complex"], [class*="text_address"]');
      const titleRaw = (titleEl && titleEl.innerText) || text.split(/[·|\n]/)[0];
      const title = cleanWS(titleRaw).slice(0, 80);
      if (!title) continue;

      const linkEl = el.tagName === "A" ? el : el.querySelector("a[href]");
      const url = linkEl ? linkEl.href : location.href;
      const articleNo = el.dataset && el.dataset.articleno;
      const dedupKey = articleNo ? `no:${articleNo}` : url || `t:${title}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      const region = tryMatch(PATTERNS.region, text);
      const regionShort = region ? region.split(/\s+/).slice(0, 2).join(" ") : "";

      items.push({
        title,
        url,
        article_no: articleNo || "",
        raw_text: text.slice(0, 240),
        raw_address: region,
        region_guess: regionShort,
        deposit_text: tryMatch(PATTERNS.deposit, text),
        rent_text: tryMatch(PATTERNS.monthlyRent, text),
        premium_text: tryMatch(PATTERNS.premium, text),
        area_text: tryMatch(PATTERNS.area, text),
        business_type: tryMatch(PATTERNS.businessType, text)
      });
      if (items.length >= 60) break;
    }
    return items;
  }

  function detectPageKind() {
    if (/\/article\/|articleNo=/.test(location.href)) return "detail";
    if (/\/(offices|complexes|apartments|houses|articleList)/.test(location.href)) return "list";
    return "unknown";
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "EXTRACT_LISTING") return false;
    try {
      const list = extractList();
      const detail = extractDetail();
      const pageKind = detectPageKind();
      sendResponse({
        ok: true,
        data: { page_kind: pageKind, detail, list }
      });
    } catch (error) {
      sendResponse({ ok: false, error: String((error && error.message) || error) });
    }
    return true;
  });
})();
