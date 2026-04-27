# API Quickstart

## 목표

정적 화면 다음 단계로 후보 매물 CSV/엑셀 업로드, 후보 조회, 엑셀 리포트 생성을 검증합니다.

## 설치

```powershell
cd C:\Users\AlienK\Documents\Codex\2026-04-27\new-chat\apps\api
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## 실행

```powershell
uvicorn app.main:app --reload
```

브라우저에서 확인:

```text
http://127.0.0.1:8000/docs
```

## 테스트 순서

1. `GET /health`로 서버 상태 확인
2. `POST /upload/listings`에서 `sample-data/property-listings.csv` 업로드
3. `GET /candidates`로 후보 매물 확인
4. `POST /reports/candidate-report`로 엑셀 리포트 생성

## 샘플 파일

```text
C:\Users\AlienK\Documents\Codex\2026-04-27\new-chat\sample-data\property-listings.csv
```
