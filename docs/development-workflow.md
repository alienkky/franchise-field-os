# Development Workflow

## 로컬 개발

1. VS Code에서 이 폴더를 엽니다.
2. 정적 MVP는 `index.html`을 브라우저에서 열어 확인합니다.
3. Next.js 전환 후에는 `apps/web`에서 개발 서버를 실행합니다.
4. FastAPI 전환 후에는 `apps/api`에서 API 서버를 실행합니다.

## GitHub 협업

1. GitHub 저장소를 생성합니다.
2. 로컬에서 `git init`을 실행합니다.
3. 원격 저장소를 연결합니다.
4. 기능별 브랜치를 만듭니다.
5. Pull Request로 리뷰합니다.

예시:

```powershell
git init
git add .
git commit -m "Initial franchise field OS MVP"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

## Codex와 Claude Code 역할

- Codex: 로컬 구현, 파일 수정, 테스트, 구조화 작업
- Claude Code: GitHub Issue/PR 기반 보조 구현, 리뷰, 리팩터링 제안
- VS Code: 사람이 최종 확인하고 실행하는 작업 공간

## Claude Code 연결

VS Code에서는 Claude Code 확장을 설치하고 프로젝트 루트의 `CLAUDE.md`를 기준 문서로 사용합니다.

GitHub Actions로 연결할 경우 저장소 Secrets에 `ANTHROPIC_API_KEY`를 등록하고 `.github/workflows/claude.yml`을 사용합니다.
