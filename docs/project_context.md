# Scholar Pulse: Project Context & AI Guidelines

이 문서는 Scholar Pulse 프로젝트를 진행하며 논의된 **핵심 아키텍처 결정사항, 마주쳤던 이슈 및 해결 과정(Lessons Learned), 그리고 주요 작업 방향성**을 기록한 문서입니다. 새로운 AI 에이전트(혹은 개발자)가 이 프로젝트에 투입되었을 때, 기존의 맥락을 빠르게 파악하고 중복된 실수를 방지하기 위해 작성되었습니다.

---

## 1. Project Overview
*   **목적**: 사용자가 설정한 관심 주제(Topic) 및 키워드 맞춤형 학술 논문을 매일 큐레이션하여 이메일로 발송하는 AI 기반 연구 보조 애플리케이션.
*   **Frontend**: Next.js (App Router), React, Jotai (상태 관리), Tailwind CSS, shadcn/ui.
*   **Backend / Data Agent**: Python (Paper Fetching, Filtering, DB 연동, Gemini API 논문 요약, Resend API 이메일 발송).
*   **Base URL**: `https://scholar-pulse.mskwon.in`

---

## 2. 핵심 작업 내역 및 특이사항 (Gotchas)

### 2.1. Frontend: 인증 (Supabase + Jotai) 및 UX 개선
*   **문제점**: 새로고침 시 localStorage(Jotai)가 Client-side에서 Hydration 되기 전까지 로그인 상태를 일시적으로 인지하지 못해 버튼 UI가 깜빡(Flicker)거리는 현상 발생.
*   **해결 및 방향성**:
    *   `app/page.tsx` 등 엔트리 페이지에서 `mounted` 상태를 활용한 지연 렌더링 동기화 도입.
    *   마운트 전(`!mounted`)에는 빈 공간이나 잘못된 UI 대신 **Skeleton UI (`animate-pulse`)**를 노출하여 부드러운 전환과 프리미엄 스러운 사용자 경험(UX) 확보.
*   **인증 토큰 갱신 (Refresh Token)**: 
    *   `@supabase/supabase-js`는 만료 시간이 다가오면 백그라운드에서 알아서 토큰을 갱신합니다. 프론트엔드에서 수동으로 토큰 갱신 로직을 작성할 필요가 없습니다.
    *   대신, Jotai 전역 상태(`userAtom`)가 이러한 무증상 갱신을 실시간으로 캐치할 수 있어야 유지력이 보장됩니다.
    *   이를 위해 `<JotaiProvider>` 내부(`providers.tsx`)에 `AuthListener` 컴포넌트를 글로벌로 주입하여, `supabase.auth.onAuthStateChange` 이벤트(`TOKEN_REFRESHED`, `SIGNED_IN` 등) 발생 시 즉시 Jotai `userAtom`을 동기화하도록 구현했습니다.

### 2.2. Backend: 학술 데이터 수집 한계 돌파
*   **문제점**: 기존 Semantic Scholar의 `/paper/search` API는 복잡한 `OR` 기반 불리언 쿼리를 완벽하게 소화하지 못해 검색 품질이 저하.
*   **해결 및 방향성**:
    *   대규모 / 복잡한 쿼리에 특화된 **`/graph/v1/paper/search/bulk`** 엔드포인트로 전면 교체.
    *   벌크 API 특성상 `token`을 활용한 Pagination 스캔 로직과, 결과물 품질 향상을 위한 `citationCount:desc` 정렬을 하드코딩 필수로 추가했습니다.
    *   API 실패 시 (특히 arXiv 계열) 오류를 디버깅할 수 있도록 GitHub Actions에서도 확인 가능한 구체적인 URL 및 파라미터 에러 로깅 체계를 갖췄습니다.

### 2.3. AI (Gemini 429 Error) 및 Batch Processing
*   **문제점**: 필터를 통과한 논문 10개를 개별적으로 Gemini API에 넘겨 요약하게 했더니, Free Tier(RPM 5~15) 한도를 즉시 초과하여 `429 RESOURCE_EXHAUSTED` 에러 발생.
*   **해결 및 방향성**:
    *   **Batch Prompting 도입**: `analyzer.py`에서 개별 논문을 루프 돌리는 대신, **최대 10개의 논문을 하나의 JSON 배열 묶음으로 프롬프트에 전달**하고 결과 또한 JSON 배열로 반환받도록 구조를 최적화했습니다. (이로써 API 호출 횟수 및 RPD 소모를 90% 이상 드라마틱하게 절감)
    *   AI 모델 역시 텍스트 처리와 JSON 반환에 더 효율적이고 한도(Quota)가 넉넉한 **`gemini-2.5-flash-lite`**로 전격 교체하여 안정성을 높였습니다. 

### 2.4. 비즈니스 로직: 실패 내성(AI Failure Resilience) 메커니즘
*   **문제점**: 일시적 API 에러 등으로 AI 요약에 실패한 논문(`Analysis pending...`)이 이메일에 그대로 빈 값으로 보내지거나, DB에 "발송 완료(sent)"로 체크되어 영원히 누락되는 현상.
*   **해결 및 방향성**: 
    1.  이메일 포매터(`notifier.py`)에서 요약이 누락된 AI 판독 실패작은 메일 리스트에서 제외.
    2.  `main.py`의 **DB 트랜잭션 전처리 단계에서 먼저 이들을 필터링**. 제외된 논문은 DB에 "발송 완료" 도장이 찍히지 않으므로, 다음 날 스케줄러가 돌 때 **재시도(Retry) 대상으로 자동 분류**되는 매우 강건한 파이프라인 완성.

### 2.5. 이메일 템플릿 (Notifier) 주의점
*   논문 원본 저자가 너무 많을 경우 메일 본문이 지저분해집니다. `authors`가 10명을 넘어가면 `[저자1, 저자2, ..., 저자10] (+ 47 more authors)` 형태로 반드시 잘라내어(truncate) 표시하도록 정규화 되어 있습니다.
*   메일 하단에는 유저가 언제든 자신의 구독 키워드나 설정을 바꿀 수 있도록 Base URL(`https://scholar-pulse.mskwon.in/dashboard`)을 연결한 깔끔한 CTA 버튼이 포함되어 있습니다.

---

> **Notice to Future AI Agents:**  
> 이 문서를 읽고 계신다면, 위 규칙들과 해결되었던 이슈 풀(Pool)을 반드시 존중해주시길 바랍니다. API 할당량(Quota) 초과에 매우 민감한 무료 티어 생태계 위에서 돌아가고 있으므로, **어떠한 형태의 Prompt Call이든 반드시 Batch 단위로 묶어서 처리**해야 한다는 사실을 최우선으로 유념해 주세요. 또한 Frontend 에서는 Supabase Client 가 자체적으로 제공하는 Auth 기능을 수동으로 Override 하려 하지 말고 `onAuthStateChange` 를 최대한 활용하시기 바랍니다.
