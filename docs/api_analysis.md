# API Analysis & Documentation: Semantic Scholar vs arXiv

해당 문서는 Scholar-Pulse 프로젝트의 핵심 파이프라인에서 학술 논문을 수집(Fetching)하기 위해 사용하는 **Semantic Scholar API**와 **arXiv API**의 사용 매뉴얼, 각 플랫폼의 검색 철학(Boolean vs Relevance), 그리고 이를 기반으로 한 프로젝트 내 검색 최적화 가이드라인을 분석하여 영구적으로 저장하기 위한 기술 문서(Docs)입니다.

---

## 1. Semantic Scholar Academic Graph API
Semantic Scholar의 검색 API는 크게 **Relevance Search(연관도/주제 검색)** 와 **Bulk Search(대용량 추출)** 두 종류의 엔드포인트를 제공하며, 각각 완전히 다른 검색 메커니즘을 가지고 있습니다. 프로젝트에서는 이 두 메커니즘의 차이를 인지하고 사용자 의도(AND vs OR)에 맞춰 적절히 분기하여 사용합니다.

### 1-1. Relevance Search API (관련성 검색)
- **Endpoint:** `GET /graph/v1/paper/search`
- **검색 철학:** 
  - 자연어(Natural Language) 처리에 최적화되어 있습니다.
  - TF-IDF 및 Dense Vector 방식을 기반으로 주어진 `query` 내의 단어들이 전체적으로 얼마나 촘촘하게(연관성 있게) 포함되어 있는지 논문의 주제 적합성을 평가합니다.
- **주요 파라미터 규격:**
  - `query` (필수): 쌍따옴표(`"`) 없는 자연어 형태로 넘기는 것이 가장 이상적입니다. (예: `Electric Vehicle Smart Grid Integration`)
  - `limit`: 호출 1회당 최대 **100건**으로 제한됩니다. 연산 비용이 비싸지만, 양질의 데이터가 반환되므로 상위 데이터만 활용하기 좋습니다.
  - `offset`: 페이징 처리를 위한 커서(숫자 인덱스 위치).
  - `year`: 최신성 필터 적용 (`2021-2024` 또는 `2024-` 등)
- **Scholar-Pulse 적용 (AND 조건 시 사용):** 
  사용자가 프론트엔드에서 수많은 핵심어(키워드)들을 "모든 키워드를 포함(AND)" 조건으로 묶었을 때, 이를 그대로 Strict 매칭(문자열 교집합)으로 던질 경우 검색 결과가 극단적으로 줄어서 0건이 반환되는 문제를 아예 원천 차단합니다. 대신, এই 엔드포인트를 호출하여 "유저가 입력한 일련의 키워드 뭉치들의 개념이 가장 잘 포괄된(관련성 높은) 논문"을 영리하게 수급해 올 수 있습니다.

### 1-2. Bulk Search API (대용량 추출)
- **Endpoint:** `GET /graph/v1/paper/search/bulk`
- **검색 철학:** 
  - 엄격한 토큰 및 구절(Phrase) 단위의 **부분/전체 일치 Boolean 연산**에 최적화되어 있습니다.
  - AI적인 의미 해석(Relevance) 연산 없이 오직 구문 일치 여부만 따지므로, 매우 빠른 속도로 엄청난 양의 데이터를 무지성으로 퍼올릴 때 사용됩니다.
- **주요 파라미터 규격:**
  - `query` (필수): 엄격한 형태의 파이프 문법을 권장합니다.
    - `OR` 매치: `"keyword1" | "keyword2"`
    - `AND` 매치: `"keyword1" "keyword2"` (키워드 사이에 공백, 각각 따옴표로 감쌈)
  - `limit`: Bulk 특성상 수동 조절이 무의미합니다. 한 번의 호출로 기본 **1000건**단위 청크를 내려줍니다.
  - `sort`: 관련성(Relevance) 기능이 없으므로 `citationCount:desc` (인용수 순위순) 지정 등을 통해 인기 논문을 선별합니다.
  - `token`: 페이징은 숫자인덱스(`offset`)가 아닌 커서(Cursor) 기반의 임의 해싱 문자열(`token`)로 제어됩니다.
- **Scholar-Pulse 적용 (OR 조건 시 사용):**
  유저가 입력한 여러 후보 키워드 중 하나라도 겹치는게 있으면 넉넉히 수집하고자 할 때 씁니다. Citation 역순 정렬로 세팅되어 있어 수많은 논문을 빠르게 훑고 가장 유명한 배치를 찾는데 탁월합니다.

### 1-3. 요약 및 주의 사항 (Rate Limits)
- API Key 없이 무료 크레딧으로 호출할 경우 `1 Request / 3 Seconds` 의 가장 자비없는 429 Rate Limit이 걸립니다.
- API Key 발급 후 Header(`x-api-key`)에 적용 시 등급별로 `10 ~ 100 Request / 1 Second`로 대폭 상향 완화됩니다.
- Scholar-Pulse의 `fetcher.py` 에서는 무효화(429 Error) 및 스크립트 중단을 방지하기 위해 페이지네이션 사이에 `time.sleep(1)` 등 Soft Pause를 거는 것이 권장 패턴으로 작성되어 있습니다.

---

## 2. arXiv API 
arXiv는 물리학, 컴퓨터 과학(CS/AI), 퀀텀 등 하드코어한 학문 계열을 총망라하는 초대형 오픈 접속 형태의 프리프린트(Pre-print, 정식 출간 전 논문) 플랫폼입니다. 오픈소스 정신을 지향하기 때문에 최신 논문이 가장 빨리 올라오지만, API가 다소 원시적이라는 특징이 있습니다.

### 2-1. Search Query 구조
- **Endpoint:** `GET http://export.arxiv.org/api/query`
- **검색 철학:**
  - 구글 검색 퀄리티의 '유사도'나 'TF-IDF' 개념이 없고, 아주 원시적인 **문자열 단순 매칭(Boolean Algebra)**으로 검색됩니다.
  - 특정 접두어를 곁들인 단어들을 `AND`, `OR`, `ANDNOT`으로 조합하여 쿼리를 하드코딩해야 합니다.
- **주요 파라미터 규격:**
  - `search_query` (필수): 쌍따옴표로 정확한 구절을 지정합니다.
    - `ti:"keyword"` (논문 제목 안에서만 검사)
    - `abs:"keyword"` (요약문 안에서만 검사)
    - `all:"keyword"` (전체 메타 텍스트 범위, 일반적으로 이 범주를 채택합니다.)
    - 조합 예시: `all:"Electric Vehicle" AND all:"Economics"`
  - `start`: 페이징을 위한 offset 지정 
  - `max_results`: 한 번 호출에 뽑아올 최대 결과 수치. 지나치게 크게 잡으면 arXiv 서버단에서 Timeout 이 나는 경우가 흔하므로 권장값인 20~100 사이를 부여합니다.
  - `sortBy`: `relevance` (단순 단어 출현율), `lastUpdatedDate` (최신수정순), `submittedDate` (최초등록순) 정렬이 가능합니다.

### 2-2. Scholar-Pulse에서 활용시 한계점과 극복 아키텍처
- **동의어 확장 불가:** Semantic Scholar처럼 `Machine Learning` 검색 시 `Deep Learning` 키워드를 아우르지 못합니다. 무조건 정확하게 입력해야 합니다.
- **AND 의 늪:** `AND` 연산자는 모든 키워드를 다 맞추려 하므로 무작정 여러 복잡한 Phrase 구문 키워드를 체이닝 하면 너무 쉽게 `0건 반환`을 마주하게 됩니다.
- **해결 방안 및 반영사항:** 
  - 프론트엔드에서 넘어온 조건이 `OR` 일 때는 거침없이 `OR` 체이닝을 걸어 넓은 탐색망을 확보합니다 (`all:"k1" OR all:"k2"`).
  - 조건이 `AND` 일 때는, 유저가 아무리 5~10개의 수많은 키워드 목록을 주관적으로 적어냈다 하더라도 모두 잇지 않습니다. **arXiv 스크래퍼 단에서는 가장 중요도가 높을 수밖에 없는 첫 3개 앞선 슬라이스(`keywords[:3]`)까지만 한정해서 `AND`로 체이닝**함으로써 검색 결과의 파탄을 막아내는 방어적 유연성을 챙깁니다. 부족한 부분은 훨씬 거대한 S2 API 풀이 메워주어 상호 보완을 이룹니다.

### 2-3. 요약 및 주의 사항 (Rate Limits & Response)
- **데이터 형식 맹점:** 다른 최신 API처럼 가볍고 명료한 JSON 형식을 주지 않습니다. 서버에서 처리하기 복잡한 RSS 스타일의 **Atom XML 데이터 블럭**을 뱉기 때문에, 파이썬에서 `xml.etree.ElementTree`나 `feedparser` 패키지를 통해 깊은 Depth를 우직하게 순회하며 파싱하는 코드가 강제됩니다. 
- **서버 제한:** "3초 이하의 간격으로 연속 호출할 경우 서버 커넥션을 차단한다"는 정책을 가지고 있습니다. 항상 페이징마다 `sleep(3)` 기반의 딜레이가 필요합니다.
- **불안정한 서버 헬스:** 트래픽이 몰리는 시간대엔 arXiv 서버 자체가 자주 누워버리는 경우가 있으므로 통신 블록단에 `Exponential Backoff (3초 -> 6초 -> 12초 순증 대기)` 기반 재시도(Retry) 로직이 삽입되어 있습니다. 이 코드는 시스템의 심혈을 기울인 튼튼한 하부 구조 역할을 합니다.
