# 개발 플로우

spec §10 우선순위(MVP → 그다음 → 완성본 전환)를 Phase로 쪼갠 순서. 각 Phase는 **검증 기준을 통과해야 완료**다.

## 작업 사이클 (모든 작업 공통)

```
1. develop 최신화 → feat/<서비스>-<기능> 브랜치 생성
2. 실패하는 테스트 먼저 작성 (수락 기준 = 테스트)
3. 구현 → 테스트 통과
4. 서비스별 검증 명령 전부 통과
   - backend : ./gradlew test
   - agent   : uv run pytest && uv run ruff check . && uv run ruff format --check .
   - frontend: npm test && npm run lint && npm run build
5. develop에 머지 → Phase 완료 시 체크박스 갱신
6. 시연 가능한 묶음이 되면 develop → main 머지
```

서비스 간 계약(스키마, API, SSE 이벤트)이 바뀌면 **루트 `schema/`를 먼저 수정**하고 같은 브랜치에서 각 서비스를 맞춘다.

---

## Phase 0. 기본 세팅 — 완료

- [x] 모노레포(backend / agent / frontend), 브랜치 main·develop
- [x] backend: Spring Boot 4.1.2, Java 21, JPA, Flyway, Mail, Validation, Spring AI OpenAI(Groq), Testcontainers → 검증: `./gradlew test` 통과
- [x] agent: FastAPI + Playwright(Chromium) + pydantic-settings → 검증: `pytest` `/health` 통과, ruff 통과
- [x] frontend: React + Vite + TS + Vitest, `/api` 프록시 → 검증: test·lint·build 통과
- [x] docker-compose(PostgreSQL 17), 서비스별 `.env.example` → 검증: backend 기동 후 `/actuator/health` UP

## Phase 1. 공유 계약 (schema → 전 서비스)

| 단계 | 검증 |
| --- | --- |
| [x] 1-1 `schema/`에 Requirements, Quote, FollowUpQuestion, SSE 이벤트 JSON Schema 작성 (spec §5, §8) | 스키마 예제 JSON이 스키마를 통과 |
| [x] 1-2 backend: Java record + Bean Validation | 계약 테스트: 스키마 예제 역직렬화·검증 통과, null 필드 유지 |
| [x] 1-3 agent: pydantic 모델 | 계약 테스트: 같은 예제로 검증 통과 |
| [x] 1-4 frontend: TS 타입 | `tsc` 통과 |
| [x] 1-5 backend: Flyway V1 (session, quote(JSONB), event_log) | Testcontainers로 마이그레이션 + 저장/조회 테스트 |
| [x] 1-6 `adjusted_total` 계산 로직 | 단위 테스트: null total → null, adjustments 합산 |

## Phase 2. LLM 기반 + 인터뷰 (spec §4.1, §6)

| 단계 | 검증 |
| --- | --- |
| [x] 2-1 backend: `ChatClient` + 프롬프트 파일 로딩 + 스키마 검증·재시도 래퍼 | stub ChatClient로 "잘못된 JSON → 재시도 → 실패 시 미확인" 테스트 |
| [구조 완료, 실측 대기] 2-2 Groq 구조화 출력 실측 (모델 선정, spec §12) | 태그된 통합 테스트로 실제 Groq 응답이 스키마 통과 (`GROQ_API_KEY` 설정 후 `./gradlew groqTest`) |
| [x] 2-3 인터뷰 API: 물품 입력 → 질문(≤5개) → 답변 → Requirements | 질문 5개 초과 시 잘라냄, 미응답 필드 null 테스트 |
| [x] 2-4 agent: `LLMClient` 인터페이스 + `GroqClient` / `ClaudeClient`, `LLM_PROVIDER` 선택 | 설정값에 따라 구현체 선택 테스트 |

## Phase 3. 실시간 표시 뼈대 (spec §8)

| 단계 | 검증 |
| --- | --- |
| [x] 3-1 backend: 세션별 SSE 엔드포인트 + 이벤트 발행기 | MockMvc/WebTestClient로 이벤트 수신 테스트 |
| [x] 3-2 backend: `POST /internal/agent-events` (토큰 검증 → 스키마 검증 → SSE 중계) | 토큰 없음 401, 잘못된 이벤트 400, 정상 시 중계 테스트 |
| 3-3 frontend: SSE 훅 + 진행 바 + 작업 로그 | 가짜 EventSource로 컴포넌트 테스트 |
| 3-4 인터뷰 화면 연결 | 수동 E2E: 입력 → 질문 → Requirements 표시 |

## Phase 4. 견적 수집 — 웹 (spec §4.2)

| 단계 | 검증 |
| --- | --- |
| 4-1 시연용 목업 업체 사이트 (B·C) 정적 페이지 | 로컬 서빙 확인 |
| 4-2 agent: `POST /agent/tasks`(collect), `DELETE /agent/tasks/{id}` | API 테스트 |
| 4-3 agent: 허용 도메인·최대 스텝·타임아웃·로그인/결제 차단 가드 | 가드 단위 테스트 (차단 URL 진입 시 중단) |
| 4-4 agent: Playwright 탐색 → 접근성 트리 기반 판단 → RawQuote + 스크린샷 → 콜백 | 목업 사이트 대상 통합 테스트, 모든 RawQuote에 source ≥ 1 |
| 4-5 backend: agent 작업 시작/취소 클라이언트 | agent mock 서버로 테스트 |

## Phase 5. 견적 수집 — 메일 (spec §4.2)

선행: spec §12 메일 계정 방식·회신 수신 방식 결정.

| 단계 | 검증 |
| --- | --- |
| 5-1 요청 메일 초안 생성 → `approval_required` 이벤트 → 승인 API → 발송 | 승인 없이 발송 경로가 없음을 테스트 (GreenMail 등 로컬 SMTP) |
| 5-2 회신 수신 (IMAP 폴링/수동 새로고침) | GreenMail로 수신 테스트 |
| 5-3 첨부 파싱 (PDF·엑셀 → 텍스트) | 샘플 파일 파싱 테스트 |

## Phase 6. 통일 양식 + 비교표 (spec §4.3, §4.4)

| 단계 | 검증 |
| --- | --- |
| 6-1 RawQuote → Quote LLM 추출, 필드별 source 연결 | 고정 RawQuote 픽스처로: 없는 값 null + missing_fields 기록 |
| 6-2 `quote_update` 이벤트 발행 | SSE 테스트 |
| 6-3 frontend: 비교표, "미확인" 배지, 출처 링크, 정렬 전환(표기 총액 ↔ 보정 총액) | 컴포넌트 테스트 |

## Phase 7. 확인 질문 + 추천 (spec §4.5)

| 단계 | 검증 |
| --- | --- |
| 7-1 missing_fields → FollowUpQuestion 생성 | 필드당 질문 1개 테스트 |
| 7-2 적합도 점수 (총액·납기·설치·A/S 반영) + 추천 이유 | 결정적 점수 함수 단위 테스트 (LLM은 이유 문장만) |
| 7-3 frontend: 질문·추천 패널 | 컴포넌트 테스트 |

## Phase 8. 순위 역전 연출 (spec §4.7)

| 단계 | 검증 |
| --- | --- |
| 8-1 누락 비용 탐색 → `adjustment` 이벤트 (confirmed/estimated) | 이벤트에 status 누락 시 거부 테스트 |
| 8-2 frontend: adjustment 수신 → 행 가산 → FLIP 재정렬 애니메이션 + 확정/추정 라벨 | 컴포넌트 테스트(정렬 결과) + 수동 시연 확인 |
| 8-3 시연 시나리오 데이터 고정: A 1등 → 3등 역전 | spec §11 시나리오 1~5 수동 리허설 |

**→ 여기까지 MVP. develop → main 머지, 시연 리허설.**

## Phase 9. 제출 직전 자동 작성 (spec §4.6)

| 단계 | 검증 |
| --- | --- |
| 9-1 메일: 초안 → 수신자·제목·본문 미리보기 → 승인 → 발송 | 미리보기 단계 생략 불가 테스트 |
| 9-2 agent `fill_form`: 폼 채우고 제출 직전 정지 | 목업 폼 대상: submit 클릭 0회 검증 |

## Phase 10. 빅딜 걸기 (spec §4.8)

| 단계 | 검증 |
| --- | --- |
| 10-1 타 업체 Quote 근거 협상 메일 초안 | 초안의 수치가 저장된 Quote 값과 일치하는지 테스트 |
| 10-2 발송 흐름은 9-1 재사용 | 기존 테스트 통과 |

## Phase 11. 브라우저 화면 스트림 고도화

## Phase 12. Groq → Claude 전환

| 단계 | 검증 |
| --- | --- |
| 12-1 backend: Anthropic starter + `spring.ai.anthropic.*`, 서비스 코드 무변경 | 전체 테스트 통과 |
| 12-2 agent: `LLM_PROVIDER=claude` | 전체 테스트 통과 |
| 12-3 프롬프트 재튜닝 + 회귀 (시연 시나리오 픽스처) | 시나리오 결과 동일 |

---

## backend 재개 시 할 일 (프론트 우선 진행 중 추가된 계약)

- `schema/sse-event.schema.json`에 `follow_up`, `recommendation` 이벤트 추가됨 → backend `SseEvent` record, agent pydantic `SseEvent`에 반영 (7-1, 7-2에서 발행)
- `schema/mail-draft.schema.json` 신규 → backend 메일 초안 API(9-1, 10-1)에서 사용

---

## 미결정 사항 (spec §12) — 해당 Phase 시작 전 결정

| 항목 | 필요 시점 | 결정 |
| --- | --- | --- |
| 프론트 프레임워크 | Phase 0 | React + Vite + TS |
| DB | Phase 0 | PostgreSQL 17 |
| Groq 모델 | Phase 2 | 미정 (기본값 llama-3.3-70b-versatile, 2-2에서 실측) |
| 브라우저 에이전트 구현 방식 | Phase 4 | 미정 |
| 목업 업체 수·데이터 | Phase 4 | 미정 (A·B·C 3곳 가정) |
| 메일 계정 / 회신 수신 방식 | Phase 5 | 미정 |
| 이미지 첨부 OCR | Phase 5 | 미정 |
| 팀명/서비스명 | 시연 전 | 미정 |
| 로그인 필요 여부 | - | 시연 범위에서 생략 |
