# Scholar Pulse Phase-by-Phase Plan

## Phase 1: Search & Filter Logic (Core Data Retrieval)
- **목표**: Semantic Scholar API와 arXiv에서 최신 논문을 검색하고, 필터 조건(연도, 피인용 수, SJR 저널 등급)에 따라 1차 선별하는 백엔드 로직 완성.
- **세부 태스크**:
  1. Python 가상환경(`venv`) 구성 및 의존성(`requests`, `python-dotenv`) 설치.
  2. `user_config.json`의 Boolean Search Query (키워드/토픽) 구조 설계.
  3. `Fetcher`: S2 API 연동 (fallback 로직 포함) 및 arXiv 텍스트 쿼리 연동.
  4. `Filter`: 다운로드한 `data/scimagojr.csv`를 DataFrame/Dict로 메모리에 올려, 저널명 텍스트 매칭(`fuzz` 또는 Exact)을 통한 Q1/Q2 등급 판별 구현.

## Phase 2: LLM Integration (AI Analysis & Summarization)
- **목표**: Google Gemini 1.5 Flash/Pro API 연동을 통해 필터링된 논문의 초록(Abstract)을 3줄 요약하고 Novelty를 검출.
- **세부 태스크**:
  1. `Analyzer`: `google-genai` 라이브러리 연동 및 프롬프트 엔지니어링 수행. (입력: `Title`, `Abstract`, `Authors` -> 출력: `3-line summary`, `Novelty & Impact`)
  2. 에러 핸들링 로직(타임아웃, 토큰 제한 도달 시 재시도) 작성.
  3. 다수 논문을 효율적으로 요약하기 위한 Batch/비동기 또는 순차 처리 최적화.

## Phase 3: Automation & Delivery (Pipeline & Infrastructure)
- **목표**: 개인 알림 파이프라인 완성 (DB 상태 기록, 이메일 발송, Cron 스케줄러 배포).
- **세부 태스크**:
  1. **DB 연동**: `supabase-py`를 이용해 `sent_papers` 테이블 연동. 발송 전에 DB를 조회해 중복 알림을 막고, 발송 후 기록 추가.
  2. **이메일 발송**: `Notifier` 모듈에서 `resend` 파이썬 SDK 이용, HTML/마크다운 형태의 이메일 뉴스레터 포맷 렌더링 후 전송.
  3. **서버리스 배포**: `.github/workflows/cron.yml` 작성. GitHub Actions Secrets 환경변수 주입하여 지정 시간/수동 구동 테스트.

## Phase 4: UI & Onboarding (Web App)
- **목표**: CLI 환경에서 벗어나 Next.js 기반 설정 관리 웹 프론트엔드 구축.
- **세부 태스크**:
  1. Next.js 프로젝트 생성 및 TailwindCSS UI 구현.
  2. Supabase 클라이언트 연동 (유저 인증 및 `user_config` CRUD 인터페이스 구성).
  3. AWS S3 (혹은 Vercel) Static Export 배포.
