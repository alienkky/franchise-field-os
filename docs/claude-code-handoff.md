# Claude Code Handoff

## 저장소

```text
https://github.com/alienkky/franchise-field-os.git
```

## 다른 컴퓨터에서 시작

```powershell
git clone https://github.com/alienkky/franchise-field-os.git
cd franchise-field-os
code .
```

## VS Code에서 Claude Code 사용

1. VS Code 1.98 이상을 설치합니다.
2. Extensions에서 `Claude Code`를 검색해 설치합니다.
3. 프로젝트 루트에서 `CLAUDE.md`를 확인합니다.
4. Claude Code 패널 또는 터미널에서 작업을 시작합니다.

## Claude Code CLI 사용

Node.js 18 이상이 필요합니다.

```powershell
npm install -g @anthropic-ai/claude-code
cd franchise-field-os
claude
```

## Claude에게 처음 줄 작업 지시 예시

```text
이 저장소는 프랜차이즈 영업팀을 위한 상권 후보 관리 웹앱입니다.
CLAUDE.md와 docs/product-plan.md를 먼저 읽고, 현재 FastAPI 후보 업로드/리포트 API를 정적 index.html 화면과 연결하는 다음 단계를 진행해줘.

우선순위:
1. 현재 구조 파악
2. API 실행 방법 확인
3. 후보 리스트를 API 데이터로 표시하는 계획 작성
4. 필요한 경우 작은 단위로 코드 수정
5. 변경 후 테스트 방법 설명
```

## GitHub Actions에서 Claude 사용

저장소 Settings > Secrets and variables > Actions에서 다음 Secret을 등록합니다.

```text
ANTHROPIC_API_KEY
```

그 후 Issue 또는 Pull Request 댓글에서 다음처럼 요청합니다.

```text
@claude CLAUDE.md 기준으로 후보 리스트 화면을 FastAPI /candidates API와 연결하는 PR을 만들어줘.
```

## 참고 공식 문서

- Claude Code overview: https://code.claude.com/docs/en/overview
- VS Code integration: https://code.claude.com/docs/en/vs-code
- GitHub Actions: https://code.claude.com/docs/en/github-actions
