# Claude Code Guidelines

이 프로젝트는 프랜차이즈 영업팀을 위한 상권 후보 전략 관리 및 마이프차 B2B 업무 자동화 웹앱입니다. 이 문서는 AI 어시스턴트(Claude Code, Codex 등)와 사람 개발자 모두가 저장소의 구조, 워크플로, 컨벤션을 빠르게 파악하기 위한 단일 진입점입니다.

## 제품 원칙

- 첫 화면은 마케팅 페이지가 아니라 실제 업무 대시보드입니다.
- 모바일에서는 후보 확인, 점수 확인, 메모, 상태 변경을 빠르게 처리합니다.
- PC에서는 전략 조건 설정, 후보 비교, 리포트, 자동화 실행 로그를 관리합니다.
- 데이터 수집은 공식 API, 계약상 허용된 웹 자동화, 또는 CSV/엑셀 업로드 방식만 사용합니다.

## 자동화 원칙

- 사용자가 직접 로그인한 브라우저 세션만 재사용합니다.
- 로그인 우회, 캡차 우회, 차단 회피 코드는 작성하지 않습니다.
- 선택자는 `apps/automation/selectors.py` 또는 동등한 파일에 분리합니다.
- 오류 발생 시 로그와 스크린샷을 `data/screenshots/`에 남깁니다.
- 자세한 허용/금지 범위는 `docs/automation-policy.md` 참고.

## 추천 스택

- Frontend: Next.js, TypeScript, Tailwind CSS (현재는 정적 HTML/CSS/JS MVP)
- Backend: FastAPI, SQLAlchemy 2.0 (Mapped/DeclarativeBase 스타일), Pydantic v2, SQLite → PostgreSQL
- Automation: Python Playwright (`launch_persistent_context` 기반)
- Reports: Pandas, OpenPyXL
- Collaboration: VS Code, GitHub, Codex, Claude Code

## 저장소 구조

```
.
├── index.html / styles.css / app.js   # 정적 MVP 대시보드 (현재 1차 구현체)
├── apps/
│   ├── api/                           # FastAPI 백엔드 골격
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                # FastAPI 진입점, 라우터 등록
│   │       ├── database.py            # SQLAlchemy 엔진/세션, get_db 의존성
│   │       ├── models.py              # PropertyListing, FranchiseBrand, ScoredCandidate, AutomationRun
│   │       ├── schemas.py             # Pydantic 스키마
│   │       ├── routers/               # health, candidates, upload, reports
│   │       └── services/              # import_service, scoring_service, report_service
│   ├── automation/                    # Playwright 자동화 골격
│   │   ├── browser.py                 # 영속 브라우저 컨텍스트 오픈
│   │   ├── config.py                  # 경로/대상 URL 상수
│   │   ├── scraper.py                 # 마이프차 B2B 후보 추출 + 엑셀 저장
│   │   ├── selectors.py               # CSS 셀렉터 분리 보관
│   │   └── main.py                    # 진입점
│   └── web/                           # (예약) Next.js 전환 예정
├── data/
│   ├── uploads/                       # 업로드된 원본 (gitignore, .gitkeep만 추적)
│   ├── reports/                       # 생성된 엑셀 리포트 (gitignore)
│   └── screenshots/                   # 자동화 오류 스크린샷 (gitignore)
├── sample-data/property-listings.csv  # 한글 헤더 샘플 (테스트용)
├── docs/                              # 개발/제품/자동화 문서
├── assets/dashboard-concept.png       # 대시보드 컨셉 이미지
├── .github/workflows/                 # ci.yml, claude.yml
└── .vscode/                           # 권장 확장과 기본 설정
```

## 현재 구현 상태

- **정적 MVP**: `index.html`을 브라우저에서 직접 열어 동작합니다. 후보 데이터는 `app.js`의 `candidates` 배열에 하드코딩되어 있고, 사이드바 네비게이션, KPI, 후보 테이블/상세 패널, 전략 슬라이더, 자동화 로그, 모바일 카드가 한 페이지에 렌더링됩니다.
- **FastAPI 골격**: `apps/api`는 SQLite(`./franchise_field_os.db`)를 사용해 모델을 자동 생성하고, `/health`, `/candidates`(GET/POST), `/upload/listings`(CSV·XLSX), `/reports/candidate-report` 엔드포인트를 제공합니다. 마이그레이션 도구는 아직 없고 `Base.metadata.create_all`로 초기 스키마만 생성합니다.
- **자동화 골격**: `apps/automation`은 `data/browser-profile`을 영속 프로필로 사용해 마이프차 B2B 화면에서 보이는 표를 엑셀로 저장합니다. 셀렉터는 임시값이며 실제 화면에 맞춰 갱신해야 합니다.
- **웹(Next.js)**: 아직 비어 있는 디렉터리이며, 정적 MVP를 검증한 뒤 이전합니다.

## 개발 워크플로

### 정적 MVP 확인
- `index.html`을 브라우저에서 열거나, 간단한 정적 서버(예: `python -m http.server`)로 띄웁니다.
- UI 변경은 `styles.css`/`app.js`에 직접 반영하고 모바일(<= 720px)과 데스크톱 양쪽에서 확인합니다.

### FastAPI
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate     # Windows PowerShell: .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
- Swagger UI: `http://127.0.0.1:8000/docs`
- 검증 순서: `GET /health` → `POST /upload/listings`(`sample-data/property-listings.csv`) → `GET /candidates` → `POST /reports/candidate-report`
- 자세한 절차는 `docs/api-quickstart.md` 참고. (해당 문서의 절대경로 예시는 Windows 기준이라 OS에 맞게 치환)

### Playwright 자동화
```bash
cd apps/automation
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
python main.py
```
- 첫 실행 시 열리는 브라우저에서 사용자가 직접 마이프차에 로그인한 뒤 종료하면 `data/browser-profile`에 세션이 저장되어 다음 실행에서 재사용됩니다.
- 셀렉터는 반드시 `selectors.py`에만 두고, 실패 시 `data/screenshots/error-*.png`가 저장됩니다.

### Git/GitHub
- 브랜치: 기능 단위로 분리 (`feature/...`, `fix/...` 등). Claude Code 자동화 PR은 별도 슬러그 브랜치를 사용합니다.
- 커밋: 변경 의도를 한국어 또는 영어로 간결하게 요약. 다중 변경은 분리 커밋 권장.
- PR 본문: 변경 요약, 테스트 결과, 남은 리스크/후속 작업을 명시. DB 모델 변경 시 마이그레이션 또는 `create_all` 동작 확인 결과 포함.
- CI(`.github/workflows/ci.yml`)는 `index.html`, `styles.css`, `app.js`, `CLAUDE.md`, `docs/product-plan.md`의 존재 여부를 검사합니다. 이 파일들을 삭제·이동할 때는 워크플로도 함께 갱신해야 합니다.
- 이슈/PR 댓글에 `@claude` 멘션이 포함되면 `claude.yml`이 트리거됩니다 (`ANTHROPIC_API_KEY` 시크릿 필요).

## 코드 컨벤션

### Python (apps/api, apps/automation)
- SQLAlchemy 2.0의 `DeclarativeBase` + `Mapped[...]` / `mapped_column(...)` 형식을 유지합니다 (`apps/api/app/models.py` 참조).
- Pydantic v2 (`from_attributes = True`) 사용. ORM → 응답 변환 시 `model_dump()` 사용.
- 새 라우터는 `apps/api/app/routers/<name>.py`에 `APIRouter(prefix=..., tags=[...])`로 정의하고 `app/main.py`에서 `include_router`로 등록.
- 비즈니스 로직은 `app/services/`에 함수 단위로 두고, 라우터는 IO와 검증에 집중.
- 한글 헤더 ↔ 영어 필드 매핑은 `services/import_service.py`의 `COLUMN_MAP`을 단일 소스로 사용 (필드 추가 시 양방향 매핑 모두 갱신).
- 자동화 측 경로 상수는 `apps/automation/config.py`에 모읍니다 (`PROFILE_DIR`, `REPORT_DIR`, `SCREENSHOT_DIR`, `MYFRANCHISE_B2B_URL`).
- 셀렉터는 항상 `apps/automation/selectors.py`의 `SELECTORS` 딕셔너리에만 둡니다. 코드 중간에 인라인 셀렉터를 두지 않습니다.

### Frontend
- 정적 MVP에서는 `data-view`, `data-filter`, `data-index` 속성으로 상호작용을 연결합니다 (`app.js` 참조).
- CSS 컬러/간격은 `styles.css` 상단의 `:root` 변수(`--bg`, `--ink`, `--green` 등)를 재사용합니다.
- 반응형 브레이크포인트: 1100px(사이드바 접힘), 720px(상세 패널이 위로 이동), 480px(KPI 1열).
- Next.js 전환 시 컴포넌트 단위로 같은 데이터 모델을 따르고, 상세 패널은 모바일에서 항상 우선 노출되도록 유지합니다.

### 데이터/문서
- 업로드/리포트/스크린샷 산출물은 `data/` 하위에 저장하며 `.gitignore`에 의해 추적되지 않습니다 (`.gitkeep`만 유지).
- 신규 문서는 `docs/`에 추가하고, 운영/제품 의사결정은 `docs/product-plan.md`를 갱신합니다.
- 줄바꿈은 LF(`.gitattributes` 강제). 파일 끝 개행 유지.

## 보안 및 비밀

- API 키, 마이프차 자격증명, 회사 내부 데이터는 절대 커밋하지 않습니다. `.env`, `.env.local`은 gitignore.
- `ANTHROPIC_API_KEY`는 GitHub Actions Secrets에만 보관합니다.
- 업로드된 원본 CSV/XLSX와 자동화 리포트는 로컬에만 두고, 외부 공유 시 사전에 익명화합니다.

## AI 어시스턴트(이 파일을 읽는 사용자)에게

1. 변경 전에 이 문서, `docs/product-plan.md`, 관련 모듈의 README를 먼저 확인합니다.
2. 작업 단위는 작게 유지하고, 한 PR에 여러 무관한 변경을 섞지 않습니다.
3. 백엔드 변경 시 모델/스키마/서비스/라우터를 모두 점검하고, 한글 컬럼 매핑이 깨지지 않는지 확인합니다.
4. 자동화 코드를 손볼 때는 셀렉터 분리, 오류 스크린샷, 낮은 빈도 실행 원칙을 먼저 충족합니다.
5. UI 작업은 모바일과 데스크톱 양쪽에서 직접 렌더링을 확인합니다.
6. 정적 MVP의 하드코딩 데이터(`app.js`)와 FastAPI 응답 모양이 어긋나지 않도록 동기화합니다.
7. 변경 후에는 PR 본문에 변경 요약/테스트 방법/남은 리스크를 한국어로 정리합니다.
