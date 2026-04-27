# Claude Code Guidelines

이 프로젝트는 프랜차이즈 영업팀을 위한 상권 후보 전략 관리 및 마이프차 B2B 업무 자동화 웹앱입니다.

## 제품 원칙

- 첫 화면은 마케팅 페이지가 아니라 실제 업무 대시보드입니다.
- 모바일에서는 후보 확인, 점수 확인, 메모, 상태 변경을 빠르게 처리합니다.
- PC에서는 전략 조건 설정, 후보 비교, 리포트, 자동화 실행 로그를 관리합니다.
- 데이터 수집은 공식 API, 계약상 허용된 웹 자동화, 또는 CSV/엑셀 업로드 방식만 사용합니다.

## 자동화 원칙

- 사용자가 직접 로그인한 브라우저 세션만 재사용합니다.
- 로그인 우회, 캡차 우회, 차단 회피 코드는 작성하지 않습니다.
- 선택자는 `apps/automation/selectors.py` 또는 동등한 파일에 분리합니다.
- 오류 발생 시 로그와 스크린샷을 남깁니다.

## 추천 스택

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Automation: Python Playwright
- Reports: Pandas, OpenPyXL
- Collaboration: VS Code, GitHub, Codex, Claude Code

## 개발 방식

- 기능 단위로 GitHub Issue를 만들고 브랜치를 분리합니다.
- PR에는 변경 요약, 테스트 결과, 남은 리스크를 적습니다.
- DB 모델 변경 시 migration을 포함합니다.
- UI는 모바일과 데스크톱 모두에서 확인합니다.
