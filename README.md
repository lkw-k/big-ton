# 돌다리

> 가장 싼 견적이 정말 가장 좋을까?

AI가 업체 웹사이트와 메일에서 견적을 모으고, 견적서에 빠진 **숨은 비용**(설치비·배송비·A/S 등)까지 더해 같은 기준으로 비교해 주는 견적 탐색 서비스입니다. 기업 구매·영업 담당자를 대상으로 합니다.

## 주요 기능

| 단계 | 하는 일 |
| --- | --- |
| 1. 필요한 것 | 챗봇이 예산·납기·설치·수량 등 4~5가지를 하나씩 묻습니다. 모르는 항목은 추측하지 않고 "확인 안 됨"으로 둡니다. |
| 2. 견적 모으기 | AI가 업체 사이트를 탐색하고, 메일 업체에는 사용자가 확인한 요청 메일만 보냅니다. |
| 3. 비교 결과 | 견적서 금액 + 숨은 비용 = 실제 예상 비용을 그래프로 비교합니다. 숨은 비용이 붙을 때마다 순위가 다시 정렬됩니다. 업체별 확인 질문과 추천 업체를 보여 줍니다. |
| 4. 업체에 연락 | 문의 메일이나 **빅딜 걸기**(다른 업체 견적을 근거로 가격 협상) 초안을 써 줍니다. 메일은 사용자가 미리보기 후 보내기를 눌러야만 발송되고, 업체 주문서는 제출 직전까지만 채웁니다. |

이 밖에도 AI가 보고 있는 화면과 작업 기록을 새 창에서 실시간으로 볼 수 있고, 라이트/다크 테마를 지원합니다.

## 구성

모노레포 하나에 서비스 3개가 있습니다.

| 경로 | 스택 | 역할 |
| --- | --- | --- |
| `frontend/` | React 19, Vite, TypeScript, Vitest | 챗봇 인터뷰, 비용 비교 그래프, AI 작업 보기, 발송 확인 화면 |
| `backend/` | Java 21, Spring Boot 4.1, Spring AI 2.0, PostgreSQL 17, Flyway | 세션·인터뷰 API, LLM 호출(검증·재시도), SSE 중계, agent 콜백 |
| `agent/` | Python 3.11, uv, FastAPI, Playwright | 웹 견적 수집, 업체 폼 채우기(제출 직전까지) |
| `schema/` | JSON Schema | 서비스 간 공유 계약(Requirements, Quote, SSE 이벤트 등) 원본 |

- 요구사항 원본: [`spec.md`](spec.md)
- 개발 순서와 진행 상황: [`docs/dev-flow.md`](docs/dev-flow.md)
- 개발 규칙: [`CLAUDE.md`](CLAUDE.md)

## 지켜야 하는 규칙

- **발송·제출 게이트**: 메일은 사용자가 승인한 뒤에만 발송하고, 업체 폼 제출 버튼은 AI가 누르지 않습니다.
- **추측 금지**: 모르는 값은 `null`로 두고 "확인 안 됨"으로 표시합니다. 0으로 대신 채우지 않습니다.
- **출처 필수**: 화면에 보이는 견적 값은 모두 출처(페이지·메일·첨부)가 있어야 합니다.
- **확인됨/추정치 구분**: 숨은 비용에는 항상 확인됨 또는 추정치 표시를 붙입니다.

## 현재 상태

- 프론트엔드: spec §11 시연 시나리오 전체를 **시연 모드**(고정 데이터)로 확인할 수 있습니다.
- backend: 인터뷰 API, SSE, agent 콜백(`/internal/agent-events`)까지 구현했습니다. 견적 추출·추천·메일 발송은 진행 예정입니다.
- agent: LLM 클라이언트(Groq/Claude)까지 구현했습니다. 실제 웹 수집은 진행 예정입니다.

자세한 단계별 상태는 `docs/dev-flow.md`의 체크 표시를 참고하세요.

---

## 로컬에서 실행해 보기

### 준비물

| 도구 | 버전 | 필요한 경우 |
| --- | --- | --- |
| Node.js | 20.19 이상 또는 22.12 이상 (확인한 버전 24.14) | 화면만 볼 때 |
| JDK | 21 | backend까지 띄울 때 |
| Docker Desktop | 최신 | backend DB(PostgreSQL)와 backend 테스트 |
| uv | 최신 | agent를 띄울 때 |

### 1. 화면만 바로 보기 (시연 모드)

backend 없이 고정된 시연 데이터로 전체 흐름을 볼 수 있습니다. 지금 시연하는 화면이 바로 이 모드입니다.

```bash
git clone https://github.com/lkw-k/big-ton.git
cd big-ton/frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173/ 을 엽니다. 상단에 **시연 모드**라고 표시됩니다.

시연 순서:

1. "어떤 견적을 받아볼까요?" 아래의 **주문제작 도어락**을 누릅니다.
2. 챗봇 질문에 추천 답변을 누르거나 직접 입력합니다. 모르면 **잘 모르겠어요**를 누릅니다.
3. 요구 조건 요약을 확인하고 **이대로 견적 모으기**를 누릅니다.
4. 견적 모으기 화면에서 A업체 견적 요청 메일을 확인하고 **보내기**를 누릅니다.
5. 비교 결과 그래프를 봅니다. 처음에는 A업체가 1등이지만, 숨은 비용이 붙으면서 3등으로 내려갑니다.
6. **B업체에 연락하기**를 누른 뒤 업체를 골라 **문의 메일 쓰기** 또는 **빅딜 걸기**를 누릅니다.

오른쪽 아래 **AI 작업 보기** 버튼을 누르면 새 창(`/?view=agent`)에서 AI가 보는 화면과 작업 기록이 실시간으로 나옵니다. 상단의 다크/라이트 버튼으로 테마를 바꿀 수 있고, **처음부터** 버튼으로 다시 시작할 수 있습니다.

### 2. backend와 함께 띄우기 (실서비스 모드)

```bash
# 1) DB (리포 루트에서)
docker compose up -d postgres

# 2) backend — PATH의 기본 java가 21이 아니면 JAVA_HOME을 21로 지정
cd backend
export JAVA_HOME="$HOME/.jdks/ms-21.0.11"   # 본인 JDK 21 경로
cp .env.example .env                         # GROQ_API_KEY, INTERNAL_TOKEN 등 채우기
./gradlew bootRun                            # http://localhost:8080

# 3) agent (새 터미널)
cd agent
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000

# 4) frontend (새 터미널)
cd frontend
npm run dev
```

http://localhost:5173/?live 로 열면 시연 데이터 대신 backend API(`/api` → `localhost:8080` 프록시)를 씁니다. 아직 backend에 없는 기능(견적 추출·메일 발송 등)은 화면에서 "아직 연결되지 않았습니다"로 안내합니다.

`.env`는 커밋하지 마세요. 필요한 변수는 각 서비스의 `.env.example`에 있습니다.

### 3. 테스트

```bash
cd frontend && npm test && npm run lint && npm run build
cd agent && uv run pytest && uv run ruff check . && uv run ruff format --check .
cd backend && ./gradlew test        # Docker Desktop 실행 필요 (Testcontainers)
cd backend && ./gradlew groqTest    # GROQ_API_KEY가 있을 때만 실제 Groq 호출, 없으면 건너뜀
```

포트: frontend 5173, backend 8080, agent 8000, PostgreSQL 5432.
