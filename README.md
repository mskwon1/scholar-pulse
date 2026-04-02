# 📚 Scholar Pulse

**Scholar Pulse**는 사용자가 관심 있는 학술 도메인과 키워드를 설정해두면, 전 세계의 최신 논문(Pre-print 및 출판물)을 자동으로 수집, 필터링, AI 분석하여 매일 아침 개인화된 뉴스레터로 전송해 주는 **지능형 학술 동향 구독 서비스**입니다.

---

## 🎯 프로젝트 목적 (Purpose)
현대의 연구자, 엔지니어, 그리고 학생들은 매일 쏟아지는 수많은 논문 속에서 자신에게 정말 필요한 가치 있는 연구를 찾아내는 데 많은 시간을 낭비합니다.
Scholar Pulse는 이러한 **"정보 과부하(Information Overload)" 문제를 해결**하기 위해 탄생했습니다.

1. **지속적이고 자동화된 모니터링:** 사용자가 일일이 아카이브(arXiv)나 주요 저널을 뒤질 필요 없이 시스템이 알아서 수집합니다.
2. **AI 기반 핵심 요약 (TL;DR):** 단순히 제목과 초록만 전달하는 것이 아니라, Gemini 최신 모델을 통해 논문의 **방향성(Background/Methods/Results), 창의성(Novelty), 기대 효과(Impact)**를 3줄 요약 형태로 가공하여 제공합니다.
3. **스팸 방지 및 고품질 큐레이션:** 저널 랭크(SJR), 랭킹 스코어링 공식(최신성+인용수)을 도입하여 쓰레기 논문을 거르고 반드시 읽어야 할 최상위 논문만 배달합니다.

---

## 🏗️ 시스템 구조 및 설계 (Architecture)

본 프로젝트는 불필요한 API 비용을 줄이고 모듈화를 극대화하기 위해 **Aggregator Pattern** 중심으로 설계되었습니다.

### 1. 기술 스택 (Tech Stack)
*   **Backend (AI Agent):** `Python 3.10+`, `Requests`, `google-genai` (Gemini-3.1-flash-lite)
*   **Frontend (Dashboard):** `Next.js` (App Router), `React`, `Tailwind CSS`, `TypeScript`
*   **Database & Auth:** `Supabase` (PostgreSQL, pg_cron, pg_net)
*   **Mailing:** `Resend API`
*   **Data Source:** `Semantic Scholar API`, `arXiv API`

### 2. 백엔드 핵심 파이프라인 (The Aggregator Pattern)
수십 명의 유저가 동일한 'AI 트렌드' 키워드를 구독하더라도, API 호출 및 AI 요약은 **단 한 번만 수행**된 후 캐시를 공유하는 구조입니다.

1.  **Phase 1: Fetch (수집)**
    *   유저들의 설정(user_config)을 DB에서 불러온 후 검색 키워드의 합집합(Unique Topics)을 만듭니다.
    *   Semantic Scholar와 arXiv 각각에서 논문을 긁어와 중복을 제거합니다. (429 Rate Limit 대비 Exponential Backoff 적용)
2.  **Phase 2: Filter & Selection (여과 및 선별)**
    *   최소 인용수, SJR 저널 등급 통과 여부 등을 판단합니다.
    *   `Score = (인용수 + 1) / (출판후 지난 연수 + 1)^1.5` 공식을 통해 **최신성이 생명이거나 이미 검증된 논문들** 위주로 Top 3를 뽑습니다.
3.  **Phase 3: AI Analysis (AI 분석)**
    *   위의 선별 단계를 통과하여 '누군가에게는 배달될' 논문들만 모아서 Gemini API에 넘깁니다. (1배치 당 10개 논문 동시 분석을 통해 토큰/비용 최적화)
    *   분석된 결과는 `papers_cache` DB 단위에 영구 저장됩니다.
4.  **Phase 4: Distribution (분배 및 발송)**
    *   각 유저의 구독 키워드에 맞게 완성된 AI 분석 논문을 매칭하고, `Resend`를 이용해 가독성 높은 HTML 이메일을 발송합니다.
    *   이미 한 번 발송된 논문은 `user_sent_papers` 테이블에 기록되어 중복 발송을 방지합니다.

### 3. 스케줄링 설계 (Scheduling)
*   기존 범용 GitHub Actions `schedule` 기능의 지연(Delay) 현상을 해결하기 위해, 데이터베이스인 Supabase 내부의 `pg_cron` 및 `pg_net`을 이용해 정각마다 GitHub Actions Workflow를 직접 찌르는(Trigger) 방식으로 1초의 오차도 없는 발송 아키텍처를 구현했습니다.

---

## 📂 디렉토리 구조 (Folder Structure)

```text
scholar-pulse/
├── frontend/                   # Next.js 사용자 Dashboard 웹앱
│   ├── src/                    # FSD(Feature-Sliced Design) 아키텍처 기반의 React 코드
│   ├── public/                 # 정적 리소스 (이미지)
│   └── next.config.ts          # 프론트엔드 환경설정
│
├── src/                        # Python Backend Agent 코어
│   ├── main.py                 # 백엔드 진입점 (Aggregator Pipeline)
│   ├── fetcher.py              # arXiv, Semantic Scholar HTTP 통신 객체
│   ├── analyzer.py             # Gemini 프롬프트 및 JSON 요약 처리기
│   ├── filter.py               # SJR 저널 점수 및 키워드 필터 검증기
│   ├── db.py                   # Supabase 연결 및 캐싱/기록 관리기
│   ├── notifier.py             # HTML 이메일 렌더링 및 Resend 발송기
│   └── models.py               # 데이터 구조체 (Paper, Topic, Dataclass)
│
├── .github/workflows/          # CI/CD 및 자동화 파이프라인 (cron.yml)
├── data/                       # SJR 저널 랭킹 CSV 등 로컬 데이터
└── .env                        # 환경 변수 (API 키 관리)
```

---

## 🚀 기여 및 확장 (Future Scope)
*   프론트엔드 Webhook 기반 실시간 키워드 테스트 (Preview) 지원 예정
*   Slack, Discord 등 이메일 외 부가 채널 알림 연동 확충
*   Gemini 모델 외 타 LLM API 벤더 확장 지원
