# Franchise Field OS

프랜차이즈 영업팀이 마이프차 B2B에서 확인한 자료와 상권 후보 매물을 한 곳에서 전략적으로 관리하기 위한 반응형 웹앱 MVP입니다.

## 현재 포함된 것

- 휴대폰과 PC에서 동작하는 정적 MVP 대시보드
- 후보 매물 리스트, 상세 패널, 전략 조건, 자동화 로그, 모바일 검토 카드
- 후보 매물 CSV/엑셀 업로드용 FastAPI 초안
- 후보 매물 엑셀 리포트 생성 API 초안
- VS Code, GitHub, Claude Code, Codex 협업을 위한 문서 구조
- 향후 Next.js, FastAPI, Playwright 자동화로 확장 가능한 저장소 골격

## 바로 실행

`index.html`을 브라우저에서 열면 됩니다.

## 권장 개발 단계

1. 정적 MVP 화면 검토
2. FastAPI 후보 매물 업로드와 리포트 생성 검증
3. Next.js 프론트엔드로 이전
4. PostgreSQL 전환과 점수 계산 고도화
5. Playwright 기반 마이프차 B2B 브라우저 자동화 연결
6. GitHub Actions, Claude Code, Codex 협업 흐름 구축

## API 다음 단계

자세한 실행 방법은 `docs/api-quickstart.md`를 확인하세요.

## 주의사항

마이프차 자동화는 기업용 계정 계약과 이용약관 범위 안에서만 사용해야 합니다. 로그인 우회, 캡차 우회, 차단 회피, 과도한 반복 요청은 구현하지 않습니다.
