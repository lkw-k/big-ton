# 돌다리 (견적 탐색 브라우저)

AI 에이전트가 브라우저·메일로 견적을 모아 하나의 양식으로 비교하는 서비스. 요구사항 원본은 `spec.md`, 개발 순서는 `docs/dev-flow.md`.

## 워크스페이스 구조

모노레포 1개(`big-ton`)에 서비스 3개가 디렉토리로 들어 있다.

| 경로 | 스택 | 역할 |
| --- | --- | --- |
| `./` | - | spec, 개발 플로우, 공유 JSON Schema(`schema/`), docker-compose |
| `backend/` | Java 21, Spring Boot 4.1, Spring AI 2.0, Gradle(Kotlin DSL), PostgreSQL 17, Flyway | 세션·오케스트레이션·LLM·메일·비교/추천·SSE |
| `agent/` | Python 3.11, uv, FastAPI, Playwright, pydantic | 웹 견적 수집, 폼 채우기(제출 직전까지) |
| `frontend/` | React 19, Vite, TypeScript, Vitest | 비교표, 실시간 로그/진행 바, 순위 재정렬 |

- 공유 스키마 원본: `schema/*.schema.json`. Java record / pydantic / TS 타입은 이 파일에 맞춘다. 서비스 쪽 계약 테스트는 `../schema/` 상대 경로로 읽는다.
- 프롬프트는 사용하는 서비스 안에 둔다: `backend/src/main/resources/prompts/`, `agent/prompts/`.

## 명령어

```bash
# 인프라 (루트)
docker compose up -d postgres

# backend — PATH의 기본 java가 1.8이므로 JAVA_HOME을 21로 지정해야 Gradle이 뜬다
export JAVA_HOME="$HOME/.jdks/ms-21.0.11"
./gradlew test          # Testcontainers 사용 → Docker Desktop 실행 필요
./gradlew bootRun

# agent
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check .
uv run uvicorn app.main:app --reload --port 8000

# frontend
npm install
npm test
npm run lint
npm run build
npm run dev             # /api → localhost:8080 프록시
```

포트: backend 8080, agent 8000, frontend 5173, postgres 5432.

## 브랜치 전략

- `main`: 시연 가능한 안정 버전만. 직접 커밋 금지, `develop`에서 머지.
- `develop`: 통합 브랜치. 기능 브랜치는 여기서 따고 여기로 머지.
- `feat/<서비스>-<기능>`, `fix/<서비스>-<내용>` (예: `feat/backend-interview`): `develop`에서 분기. 머지 전 변경된 서비스의 테스트 통과 필수.
- 커밋 메시지: 한 줄 한글, `feat:` / `fix:` / `chore:` / `test:` / `docs:` 접두사.

## 도메인 규칙 (spec §9 — 위반 금지)

1. **발송·제출 게이트**: 메일은 사용자 승인 API 호출 후에만 발송. 에이전트는 폼 제출 버튼을 절대 클릭하지 않는다.
2. **추측 금지**: 모르는 값은 `null` (0 대체 금지) + `missing_fields`에 기록. LLM이 빈 필드를 채우게 하지 않는다.
3. **출처 필수**: Quote의 모든 값은 `sources`에 근거가 있어야 한다. 없으면 "미확인".
4. **확정/추정 라벨**: `adjustments[].status`는 항상 `confirmed | estimated`.
5. `adjusted_total = total_price + Σ adjustments.amount` (total_price가 null이면 adjusted_total도 null).
6. 네고 메일에 인용하는 타 업체 수치는 저장된 Quote에서만 가져온다.
7. LLM 출력은 항상 스키마 검증 → 실패 시 최대 N회 재시도 → 실패하면 "미확인".
8. 에이전트 제한: 허용 도메인 목록, 최대 스텝 수, 타임아웃, 로그인/결제 페이지 진입 금지.

## LLM

- 서비스 코드는 특정 모델에 의존하지 않는다. backend는 Spring AI `ChatClient`만, agent는 `LLMClient` 인터페이스만 사용.
- 프로토타입 Groq(OpenAI 호환 base-url) → 완성본 Claude. 모델·키는 환경변수(`.env.example` 참고).
- 단위 테스트에서 LLM은 mock/stub. 실제 Groq 호출 테스트는 `GROQ_API_KEY` 있을 때만 도는 별도 태그로.
- agent는 DOM/접근성 트리 기반으로 판단. 스크린샷은 화면 표시용으로만.

## 보안

- `.env`는 커밋 금지 (`.gitignore`에 포함). `.env.example`만 커밋.
- Spring ↔ Python 내부 API는 `INTERNAL_TOKEN` 헤더로 보호.
