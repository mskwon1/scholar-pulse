# Project: Scholar-Pulse (AI Research Paper Curation Agent)

## 1. Project Overview
Scholar-Pulse는 사용자가 설정한 관심 주제와 학술적 필터 조건을 바탕으로, 매일(또는 정기적으로) 최신 공신력 있는 논문 3건을 선정하여 요약 보고서를 전달하는 자동화 에이전트 서비스입니다. "Pull(검색)" 방식이 아닌 "Push(뉴스레터)" 방식의 연구 보조 도구를 지향합니다.

## 2. Core Features & Logic
### A. Topic-based Search (Contextual Disambiguation)
- 사용자는 [주제 이름] + [핵심 키워드 5개]를 하나의 그룹으로 설정함.
- 예시: `Topic: EV Grid Impact` / `Keywords: EV, V2G, Demand Response, South Korea, Optimization`
- 시스템은 키워드 간의 관계를 분석하여 중의적 단어(예: EV - Electric Vehicle vs Extracellular Vesicles)를 필터링하고 정확한 도메인 논문을 수집함.

### B. Multi-layered Filtering
1. **Recency**: 최근 3년 이내 출간된 논문.
2. **Quality (Journal Rank)**: SJR 기준 Q1~Q2 저널 또는 사용자가 지정한 특정 저널(Nature, IEEE 등).
3. **Impact**: 인용 수(Citation Count) 하한선 또는 분야 내 상위 % 인용 논문.
4. **Conference**: 특정 분야의 경우 Top-tier 학회 논문 포함.

### C. AI Analysis & Summary (RAG Approach)
- **Anti-Hallucination**: AI가 논문을 생성하지 못하도록 학술 API(Semantic Scholar, arXiv 등)를 통해 실존하는 DOI 기반 메타데이터를 먼저 확보한 후 분석함.
- **Output Structure**:
    - 기본 정보: 저자, 타이틀, 저널/학회명, 출판일, DOI 링크.
    - 핵심 키워드: 논문의 주안점 3~5개.
    - 3줄 요약: 배경, 방법론, 핵심 결과.
    - **Novelty**: 기존 연구 대비 차별점 및 독창성 분석.

## 3. Technical Specifications
### A. Data Sources (APIs)
- **Primary**: [Semantic Scholar API](https://api.semanticscholar.org/) (Citation, Journal Rank, Metadata)
- **Secondary**: [arXiv API](https://arxiv.org/help/api/index) (Pre-prints)
- **Journal Ranking**: [SJR (Scimago Journal Rank)](https://www.scimagojr.com/) 데이터 매칭 로직.

### B. AI Engine (BYOK Model)
- **Model**: Google Gemini (Flash/Pro) 권장 (긴 컨텍스트 처리 및 논리적 요약에 최적화).
- **Mode**: 사용자의 API Key를 등록받아 사용하는 BYOK(Bring Your Own Key) 방식.

### C. Infrastructure
- **Scheduler**: GitHub Actions 또는 CRON 작업을 통한 정기적 에이전트 실행.
- **Delivery**: Email (SendGrid/Mailgun) 또는 Slack/Discord Webhook.

## 4. Development Roadmap

### Phase 1: Search & Filter Logic (Python)
- [ ] Semantic Scholar API 연동 모듈 개발.
- [ ] 사용자 키워드 기반 Boolean Search Query 생성 로직 구현.
- [ ] 발행년도, Q등급, 인용 수 기반 필터링 알고리즘 구현.

### Phase 2: LLM Integration (Prompt Engineering)
- [ ] Gemini API 연동 및 분석 프롬프트 설계.
- [ ] 입력: 논문 Abstract + Metadata / 출력: 3줄 요약 + Novelty.
- [ ] 실제 존재하지 않는 논문 생성을 차단하는 데이터 검증 프로세스 추가.

### Phase 3: Automation & Delivery
- [ ] 사용자 설정 관리 기능 (JSON/DB).
- [ ] 정기 실행을 위한 스케줄러 세팅.
- [ ] HTML 뉴스레터 템플릿 제작 및 발송 모듈 연동.

### Phase 4: UI & Onboarding
- [ ] 사용자 설정 가이드(기술, 방법론, 맥락 키워드 예시)가 포함된 프론트엔드/CLI 제작.
- [ ] API Key 등록 및 알림 주기 설정 인터페이스.

## 5. Metadata & Data Structure (Example)
```json
{
  "user_config": {
    "topics": [
      {
        "name": "EV Grid Impact",
        "keywords": ["EV", "V2G", "Demand Response", "South Korea", "Optimization"],
        "filters": {
          "years_limit": 3,
          "min_journal_rank": "Q2",
          "min_citations": 5
        }
      }
    ],
    "schedule": "daily",
    "delivery": "email"
  }
}