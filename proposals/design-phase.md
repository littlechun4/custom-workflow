# Design 단계 정의서 (How)

> 작성: 2026-03-05
> 목적: Design 단계의 역할, 활동, 템플릿, 경계 규칙 정의
> 기어: 3단 (10+ 파일, 아키텍처급) 기준 최대치 설계
> 문서 보존: git에 영구 보존

---

## 산출물 위치

```
workflow_docs/
├── design/{feature-name}.md    # Design 산출물 (How)
└── adr/ADR-NNN-{title}.md      # 아키텍처 결정 (별도, 해당 시에만)
```

---

## 1. 역할 정의

**"어떻게, 왜 이 방법으로"를 결정한다.**

- Spec을 받아 코드베이스 기반의 구현 경로 설계
- 기존 패턴 활용으로 아키텍처 일관성 유지
- 실행 불가능한 요구사항을 조기에 식별 (Design → Spec 피드백)

## 2. 구체적 활동

| 활동 | 주체 | 설명 |
|------|------|------|
| 코드베이스 탐색 | AI (Plan Mode) | 기존 패턴, 영향 범위, 재사용 모듈 파악 |
| 대안 비교 | AI 초안, 인간 판단 | 2-3개 접근법의 장단점 분석 |
| 아키텍처 결정 | 인간 | 어떤 대안을 선택하고 왜 |
| 변경 계획 수립 | AI 초안, 인간 승인 | 파일별 변경 + 실행 순서 |
| TDD 슬라이스 분해 | AI+인간 | Spec을 구현 가능한 슬라이스로 분해 |
| 테스트 전략 | AI+인간 | 어떤 수준의 테스트가 필요한가 |

### `[OPEN_QUESTION]` 마커 사용법

Design 작성 중 결정이 필요하지만 아직 정해지지 않은 사항에 `[OPEN_QUESTION]` 마커를 사용한다. 이 마커는 Design 문서 어디에든 삽입할 수 있으며, 미결정 사항이 해결될 때까지 유지된다.

**사용 시점:**
- 기술 선택이 2개 이상 남아있고, 인간 또는 추가 조사가 필요할 때
- 외부 의존성(API 사양, 인프라 제약 등)이 아직 확정되지 않았을 때
- Spec에 명시되지 않은 경계 조건이 발견되었을 때

**작성 형식:**
```markdown
[OPEN_QUESTION] Redis Cluster 환경에서 pub/sub 성능이 충분한가? 부하 테스트 결과 필요.
```

**해결 규칙:**
- 결정이 내려지면 마커를 제거하고 결정 내용을 본문에 반영한다
- **체크포인트 2의 auto-gate에서 `[OPEN_QUESTION]` 마커가 1개라도 남아있으면 통과 불가**
- 체크포인트 1 시점에서는 `[OPEN_QUESTION]`이 남아있어도 괜찮다 (방향 확인 단계이므로)

## 3. 리뷰 및 반복 다듬기 (Iterative Refinement)

### 전체 흐름

Design은 산출물이 크므로 **2단계 체크포인트**로 나눈다. 방향이 틀린 채 상세 계획까지 작성하는 낭비를 방지.

- **체크포인트 1 (접근법)**: `in_progress` 내부 마일스톤. phase status 전이 없이 인간 확인만 받는다.
- **체크포인트 2 (전체)**: 정식 `reviewing → approved` 루프로 처리한다.

이 구조는 orchestrator의 `in_progress → reviewing → approved` 단일 루프와 정합한다. 체크포인트 1은 status 전이를 발생시키지 않으므로 orchestrator 관점에서는 `in_progress` 상태가 유지된다.

```
[체크포인트 1: 접근법 확인 — in_progress 내부 마일스톤]

in_progress (접근법 요약 + 대안 검토 작성)
  ──[AI 자동 검증]──→ 대안 검토 테이블 존재, 채택 근거 명시 확인
       → 미충족 → AI가 보완 요청 (status 변경 없음, in_progress 유지)
       → 충족 → 인간에게 방향 확인 요청
         → 인간 거부 → needs_revision → 접근법 재작성 → in_progress (draftCount++)
         → 인간 "방향 확인" → in_progress 유지 (상세 계획 작성 시작)

※ 체크포인트 1은 status 전이를 발생시키지 않는다. (in_progress 내 확인 포인트)
※ 인간이 방향을 거부할 경우에만 needs_revision → in_progress 전이가 발생한다.

[체크포인트 2: 전체 승인 — 정식 reviewing → approved 루프]

in_progress (변경 계획 + 슬라이스 + AC 커버리지 작성)
  ──[/workflow next]──→ reviewing
     AI 자동 검토 (auto-gate + viewpoint)
       → 이슈 → needs_revision → 수정 → in_progress (draftCount++)
       → 통과 → 인간 리뷰
         → human-review 작성 + /workflow next → 수정 → in_progress (draftCount++)
         → 인간 "승인" → approved
           ──[/workflow next]──→ 다음 Phase
```

### 체크포인트 1: 접근법 확인 (in_progress 내부 마일스톤)

AI가 접근법 요약 + 대안 검토까지 작성한 시점에서 인간 확인을 요청한다.
**이 시점에서 `/workflow next`를 호출하지 않는다** — status 전이 없이 인간 확인만 받는다.

- AI 자동 검증: 대안 검토 테이블 존재, 채택 근거 명시
- 인간 확인: 기술 방향에 대한 인라인 코멘트
- 인간이 방향을 거부하면 → `needs_revision` → `in_progress` (접근법 재작성)
- **여기서 방향이 확인되어야** 변경 계획/슬라이스 작성으로 진행
- **orchestrator 관점**: phase status는 `in_progress`가 유지됨

### 체크포인트 2: 전체 승인 (정식 reviewing → approved 루프)

변경 계획 + 슬라이스 + AC 커버리지 + 테스트 전략까지 완성 후 `/workflow next`:
- **이 시점에서만** `in_progress → reviewing` status 전이가 발생한다
- auto-gate: 전체 체크리스트 검증 (§15), `[OPEN_QUESTION]` 마커가 남아있으면 통과 불가
- 인간 리뷰: 슬라이스 분해, 파일 변경 계획에 대한 인라인 코멘트
- **인간 승인 시** `approved` → 다음 Phase

### 인라인 인간 리뷰 형식

**마커:**
```markdown
<!-- human-review: {대상} | {코멘트} -->
```

**대상**은 섹션명, 슬라이스 ID, 또는 자유 텍스트:

```markdown
## 접근법 요약
WebSocket 기반 실시간 알림 시스템 구현.
<!-- human-review: 접근법 | SSE가 인프라 변경 없이 더 적합하지 않나? 양방향이 정말 필요한지 근거 보강 필요 -->

#### Slice A-2: Comment signal 연결
<!-- human-review: A-2 | signal 대신 model save() override가 기존 패턴 아닌가? signals.py 참조 확인 필요 -->

## AC 커버리지
<!-- human-review: 커버리지 | C-1이 어떤 슬라이스에서도 커버 안 됨 -->
```

**AI 처리 규칙:**
1. `/workflow next` 실행 시 `<!-- human-review: -->` (open) 태그를 전수 수집
2. 각 리뷰를 반영하여 문서 수정
3. 반영 완료된 리뷰는 `resolved`로 변환:
   ```markdown
   <!-- human-review-resolved: 접근법 | SSE 검토 → 양방향 필요성 근거 추가 (향후 채팅 기능 계획) -->
   ```
4. 원본 코멘트 보존 + 해결 내용 `→` 뒤에 append
5. `draftCount` 증가 + `status: in_progress`로 전환

**인간 재오픈:** resolved가 불만족이면 `human-review-resolved`를 `human-review`로 되돌리면 됨.

**게이트 규칙:**
- `<!-- human-review: -->` (open)이 1개라도 있으면 → **승인 불가**
- `<!-- human-review-resolved: -->` 만 남아있으면 → 승인 가능

### draftCount 상한

```
draftCount ≤ 2: 정상 범위
draftCount = 3: 경고 — "3회째 초안입니다. 근본 원인을 먼저 파악하세요."
draftCount ≥ 4: 인터럽트 — 다음 중 선택 필요:
  A) /workflow next --force   (현재 상태로 강제 진행, feedback에 기록)
  B) /workflow back           (Specify 재검토 — 문제가 요구사항에 있을 때)
  C) /workflow abort          (기능 범위 축소 후 재시작)
```

### status 전이 요약

**체크포인트 1 (in_progress 내부 마일스톤 — status 전이 없음):**

| 현재 status | 트리거 | 다음 status | 비고 |
|-------------|--------|------------|------|
| `in_progress` | AI 자동 검증 통과 + 인간 확인 요청 | `in_progress` (변경 없음) | 인간에게 방향 확인만 요청 |
| `in_progress` | 인간 "방향 확인" | `in_progress` (상세 계획 작성 시작) | status 전이 아님, 내부 진행 |
| `in_progress` | 인간 방향 거부 | `needs_revision` | 접근법 재작성 필요 |
| `needs_revision` | 접근법 재작성 완료 | `in_progress` (draftCount++) | 체크포인트 1 재시도 |

**체크포인트 2 (정식 reviewing → approved 루프):**

| 현재 status | 트리거 | 다음 status |
|-------------|--------|------------|
| `in_progress` | `/workflow next` | `reviewing` (AI 검토 시작) |
| `reviewing` | AI 이슈 발견 | `needs_revision` |
| `reviewing` | AI 이슈 없음 | `reviewing` (인간 리뷰 대기) |
| `needs_revision` | AI 수정 완료 | `in_progress` (draftCount++) |
| `reviewing` | 인간이 human-review 작성 + `/workflow next` | `in_progress` (AI 반영, draftCount++) |
| `reviewing` | 인간 "승인" (open 리뷰 0개, `[OPEN_QUESTION]` 0개) | `approved` |
| `approved` | `/workflow next` | 다음 Phase 전환 |

---

## 4. 금지사항 (Design 침범 방지)

| 금지 | 이유 | 대처 |
|------|------|------|
| 요구사항 재정의 | Specify 영역 침범 | Design → Spec 피드백으로 돌려보냄 |
| 범위 확장 | 무한 확장 방지 | "비범위로 옮기거나 후속"으로 보고 |
| 실제 코드 작성 | Implement 영역 | "무엇을 할지"만 자연어로 기술 |
| 의사코드 | 코드처럼 보일 위험 | 순서, 파일, 변경 내용을 자연어로 |
| 검증 없는 최적화 선설계 | 과도한 복잡도 | "위험/미결정"에 기록만 |

## 5. 대안 검토

**필수 여부: 기존 패턴 그대로 따르면 불필요, 기술 선택이 필요하면 필수**

```markdown
## 대안 검토

| 대안 | 장점 | 단점 | 판정 |
|------|------|------|------|
| A: Django Channels + WebSocket | 진정한 실시간, 양방향 통신 | ASGI 서버 도입 필요, 개발 복잡도 ↑ | ✅ 채택 |
| B: SSE (Server-Sent Events) | HTTP 기반, 인프라 변경 최소 | 단방향만 가능, 연결 끊김 처리 필요 | ❌ |
| C: Polling (HTMX 5초) | 구현 극단적으로 단순 | 5초 지연, 서버 부하 (6000 req/min) | ❌ |

> **채택 근거**: 요구사항의 "3초 이내 실시간"을 Channels로만 확실히 충족 가능.
> SSE도 가능하지만 향후 양방향 기능 확장을 고려하면 Channels가 장기적으로 이득.
```

## 6. 변경 계획: 핵심 요소

**변경 계획 테이블의 각 열의 의미:**

```markdown
| # | 파일 | 변경 내용 | 참조 패턴 | 관련 AC |
|---|------|----------|----------|---------|
| 1 | `notifications/models.py` | Notification 모델 추가 (recipient, type, message, read, created_at, index) | `comments/models.py:Comment` | R-1~R-5 |
| 2 | `notifications/signals.py` | comment_created, like_created signal handler 작성 | `analytics/signals.py:track_event` | R-1, R-2 |
| 3 | `notifications/views.py` | NotificationListView, mark_read, unread_count 엔드포인트 | `comments/views.py:CommentListView` | R-3, R-4 |
```

- **#**: 실행 순서 (의존성 기반 DAG)
- **파일**: 변경 대상 (프로젝트 루트 기준 상대 경로)
- **변경 내용**: 구체적이되 간결하게 (1-2문장)
- **참조 패턴**: 기존 코드의 어디를 참고했는가 (`파일경로:클래스명`)
  - AI가 "이 코드와 같은 방식으로" 구현할 수 있게 지정
  - **이것이 AI 환각을 줄이는 가장 효과적인 장치**
- **관련 AC**: Spec의 어떤 AC를 충족하는가 ([R-1], [C-2] 등)

## 7. TDD 슬라이스: 분해 단위

**개념**: 한 번의 TDD 사이클(Red→Green→Refactor) = 한 슬라이스 = 한 커밋

```markdown
## 구현 슬라이스

### Group A: 알림 생성 메커니즘 [R-1, R-2]

#### Slice A-1: Notification 모델 + 마이그레이션
- **테스트 의도**: Notification 모델이 생성되고, 필수 필드가 존재하며, 유효성 검증이 작동
- **변경 파일**: `notifications/models.py`, `notifications/migrations/`, `tests/test_models.py`
- **선행 조건**: 없음

#### Slice A-2: Comment signal 연결
- **테스트 의도**: 새 댓글이 생성되면 자동으로 Notification이 생성됨
- **변경 파일**: `notifications/signals.py`, `tests/test_signals.py`
- **선행 조건**: Slice A-1

### Group B: 알림 조회 및 읽음 처리 [R-3, R-4, R-5]

#### Slice B-1: 알림 목록 조회 API
- **테스트 의도**: GET /notifications/ 응답 200, 최신순 정렬, 페이지네이션
- **변경 파일**: `notifications/views.py`, `notifications/serializers.py`, `notifications/urls.py`, `tests/test_views.py`
- **선행 조건**: Slice A-1

#### Slice B-2: 읽음 처리
- **테스트 의도**: PATCH /notifications/{id}/ mark_read=true 시 notification.read 값 변경
- **변경 파일**: `notifications/views.py`, `tests/test_views.py`
- **선행 조건**: Slice B-1
```

**규칙:**
- Slice 1개 = 커밋 1개
- Slice 1개당 변경 파일 1-3개 (5개 초과면 분할)
- "테스트 의도"가 명확해야 Implement AI가 정확한 Red(실패 테스트)를 작성

## 8. AC 매핑 및 커버리지 추적

**목적**: Design이 모든 AC를 다루는지 검증, Implement 진행률 추적

```markdown
## AC 커버리지

| AC | 슬라이스 | 상태 |
|----|---------|------|
| R-1 | Slice A-1, A-2 | ⬜ 미구현 |
| R-2 | Slice A-2 | ⬜ 미구현 |
| R-3 | Slice B-1 | ⬜ 미구현 |
| R-4 | Slice B-2 | ⬜ 미구현 |
| R-5 | Slice B-2 | ⬜ 미구현 |
| C-1 | Slice B-1 | ⬜ 미구현 |
```

**진행:**
- Slice 구현 완료 시: ⬜ → ✅
- Verify 단계: 모든 AC가 ✅인지 확인
- 커밋 메시지: `feat(notifications): implement list view [B-1]`

## 9. 테스트 전략: 전략 수준만

Design에 포함하는 것과 아닌 것:

| 포함 (Design) | 미포함 (Implement) |
|---------------|------------------|
| 어떤 수준의 테스트 필요한가 (단위/통합/E2E) | 구체적 테스트 코드 |
| 각 슬라이스의 테스트 의도 | 테스트 데이터/픽스처 상세 |
| 모킹 전략 (어떤 의존성을 모킹할 것) | pytest fixture 구현 |
| 기존 테스트 인프라 활용법 (Factory Boy 등) | 실제 테스트 실행 결과 |

```markdown
## 테스트 전략

- **단위 테스트**: Notification 모델 생성, 필드 유효성, signal handler 호출
  - 외부 의존성: 이메일 발송 모킹, Redis 모킹 (fakeredis)
- **통합 테스트**: API 엔드포인트 요청/응답, 데이터 정합성
  - Django TestClient, 테스트 DB 사용
- **수동 검증**: 브라우저에서 실시간 알림 도착 (WebSocket 연결 테스트)
```

## 10. ADR: 별도 관리, Design에서 참조

**Decision vs Design 분리:**

- **Design**: "대안 A, B, C가 있고 트레이드오프는..."
- **ADR**: "우리는 A를 선택했고, 그 이유는..."

**관리 방식:**

```
workflow_docs/
├── design/{feature}.md        # 대안 검토 섹션 있음
├── adr/ADR-NNN-title.md       # 최종 결정 기록
```

**Design에서 ADR 참조:**
```markdown
## 접근법 요약
WebSocket 기반 실시간 알림 시스템 구현.
결정 근거: [ADR-012: 실시간 통신 프로토콜 선택](../adr/ADR-012-realtime-protocol.md)
```

**ADR 템플릿 (최소 구조):**
```markdown
# ADR-012: 실시간 통신 프로토콜 선택

> 일자: 2026-03-05
> 상태: 승인
> 관련 기능: 사용자 알림 시스템 (workflow_docs/design/notifications.md)

## 컨텍스트
사용자 알림이 3초 이내에 전달되어야 한다.
현재 서버는 순수 HTTP 요청-응답 방식, 실시간 기능 없음.
기존에 Redis를 Celery 브로커로 사용 중.

## 결정
Django Channels + WebSocket 도입

## 근거
- 요구사항의 "3초 이내"를 확실히 충족
- Redis를 Channel Layer로 재활용 가능
- 향후 양방향 통신 필요 시 기반 인프라로 활용

## 결과
### 긍정적
- 진정한 실시간 양방향 통신 확보
- Redis 재활용으로 운영 비용 최소화

### 부정적
- ASGI 서버(Daphne) 도입 필요 → 배포 파이프라인 수정
- 팀의 Channels 학습 곡선
- WebSocket 연결 관리 코드 추가 (heartbeat, reconnection)
```

---

## 11. 피드백 루프: Design → Spec

**Design에서 Spec의 문제를 발견하는 시나리오:**

### 시나리오 1: 기술적 실현 불가능성
- Spec: "이미지를 즉시(1초) AI로 분류"
- Design 발견: AI 모델 추론 시간 3초, GPU 병렬 처리 불가
- **보고**: "1초 불가능. 대안: (A) 3초로 완화, (B) 경량 모델(정확도 ↓), (C) 비동기 처리(UX 변화)"
- **인간 결정** → Spec 수정 → Design 재실행

### 시나리오 2: 범위 불일치
- Spec: "프로필 수정 API"
- Design 발견: 기존 코드에서 캐시 무효화, 인덱스 업데이트, 알림이 동기적으로 연결됨
- **보고**: "프로필 수정 시 캐시/인덱스/알림 처리가 필수. 이번 범위에 포함할지?"
- **인간 결정** → Spec 범위 조정 → Design 재실행

### 시나리오 3: 기존 패턴과 불일치
- Spec: "offset 기반 페이지네이션"
- Design 발견: 기존 모든 API가 cursor 기반 사용
- **보고**: "기존 코드베이스와 일관성 위해 cursor로 변경 권장"
- **인간 결정** → Spec AC 입출력 예시 수정 → Design 재실행

**규칙:**
- **Design이 Spec을 직접 수정하지 않음**
- 문제 + 대안 2-3개 + 각 트레이드오프 형식으로 인간에게 보고
- 인간이 의사결정 → Spec 수정 → Design 재실행
- **최대 3회 왕복** 초과 시 기능 범위 분할

---

## 12. 문서 업데이트 정책 (구현 중)

### Must Update (반드시 Design 수정)

| 상황 | 이유 | 업데이트 대상 |
|------|------|-------------|
| 파일 구조가 Design과 크게 달라짐 | 이후 유사 기능 구현 시 혼란 | Design의 변경 계획 |

### Skip Update (그냥 진행)

| 상황 | 이유 |
|------|------|
| 함수명/변수명이 다름 | 코드가 진실의 원천, 문서는 방향만 |
| 파일 내 구현 순서가 다름 | 순서는 가이드라인일 뿐 |
| 테스트 케이스 추가/변경 | 테스트 코드 자체가 문서 |
| 리팩토링 | Design 추상화 수준에서 변화 없음 |

---

## 13. 소요 시간

- **기능 복잡도에 비례** (대안 수, 변경 파일 수, 슬라이스 수에 따라 달라짐)
- 체크포인트 1 (접근법 확인): **10~20분** (코드베이스 탐색 + 대안 비교 + 접근법 요약)
- 체크포인트 2 (전체 승인): **20~40분** (변경 계획 + 슬라이스 분해 + AC 커버리지 + 테스트 전략)
- 한 체크포인트에서 **1시간 이상** 막히면 → 범위 분할 또는 에스컬레이션 검토

---

## 14. 템플릿

**status 값 설명:**

| status | 의미 |
|--------|------|
| `in_progress` | 작성 중 또는 리뷰 반영 수정 중 |
| `reviewing` | AI 자동 검토 중 또는 인간 리뷰 대기 |
| `needs_revision` | AI 검토에서 이슈 발견, 수정 필요 |
| `approved` | 인간 승인 완료, 다음 Phase 진행 가능 |

```markdown
# Design: {기능 이름}
<!-- workflow: design | draftCount: 1 | status: in_progress -->

> Spec: @workflow_docs/spec/{feature-name}.md
> 작성: {YYYY-MM-DD}
> 승인: {누가}, {날짜}

---

## 접근법 요약

{1-3문장으로 전체 전략.}
<!-- human-review: 접근법 | {인간 리뷰 코멘트 예시 — 실제 작성 시 이 줄 삭제} -->

## 대안 검토 — 해당 시만

| 대안 | 장점 | 단점 | 판정 |
|------|------|------|------|
| A: {기술/접근법} | {장점} | {단점} | ✅ 채택 / ❌ |
| B: {기술/접근법} | {장점} | {단점} | ❌ |

> **채택 근거**: {1-2문장}

## 변경 계획

| # | 파일 | 변경 내용 | 참조 패턴 | 관련 AC |
|---|------|----------|----------|---------|
| 1 | `path/to/file.py` | {변경 내용} | `path/to/existing.py:ClassName` | R-1 |
| 2 | ... | | | |

## 구현 슬라이스

### Group {A/B/...}: {그룹명} [R-{N}, R-{M}]

#### Slice {N-M}: {슬라이스명}
- **테스트 의도**: {이 슬라이스에서 검증할 것}
- **변경 파일**: {파일 목록}
- **선행 조건**: {없음 / Slice N-M 완료}

## AC 커버리지

| AC | 슬라이스 | 상태 |
|----|---------|------|
| R-1 | Slice A-1 | ⬜ |

## 테스트 전략

- **단위**: {무엇을, 어떤 모킹}
- **통합**: {어떤 경계를 넘는가}
- **수동**: {자동화 불가한 항목}

## 위험/미결정

- [ ] {구현 중 확인 필요}
- [OPEN_QUESTION] {결정이 필요하지만 아직 미정인 사항 — 체크포인트 2 전에 해결 필수}

## ADR 참조 — 해당 시만

- [ADR-NNN: {제목}](../adr/ADR-NNN-{title}.md)

---
## 변경 이력

| 버전 | 날짜 | 변경 내용 | 변경 사유 |
|------|------|----------|----------|
| v1 | {YYYY-MM-DD} | 최초 작성 | — |
```

---

## 15. Design 체크리스트

### 체크포인트 1 — 접근법 확인 (in_progress 내부 마일스톤, auto-gate)

- [ ] 접근법 요약이 1-3문장으로 명확한가?
- [ ] 대안 검토 테이블이 존재하는가? (기존 패턴 답습이면 "기존 패턴 활용, 대안 불필요" 명시)
- [ ] 채택 근거가 명시되어 있는가?
- [ ] (`[OPEN_QUESTION]`은 이 시점에서 남아있어도 통과 가능)

### 체크포인트 2 — 전체 승인 (auto-gate)

- [ ] Spec 참조 링크가 있는가?
- [ ] 변경 계획의 "참조 패턴" 열이 모두 채워졌는가?
- [ ] 모든 요구사항(R/C)이 최소 1개 슬라이스에 매핑되었는가?
- [ ] AC 커버리지 매트릭스에서 매핑 안 된 AC가 있는가?
- [ ] 슬라이스당 테스트 의도가 명확한가? (테스트 코드로 변환 가능한가?)
- [ ] 외부 의존성이 목록화되어 있는가? (3rd-party API, DB, 캐시 등)
- [ ] `[OPEN_QUESTION]` 미해결 항목이 없는가? (1개라도 남아있으면 통과 불가)

### 리뷰 완료 (승인 전)

- [ ] `<!-- human-review: -->` (open) 태그가 0개인가?
- [ ] 인간이 명시적으로 "승인"했는가?

### 피드백 루프 체크

- [ ] Design에서 Spec 문제 발견 시 인간에게 보고했는가?
- [ ] 보고 형식이 "문제 + 대안 + 트레이드오프"인가?
- [ ] 인간의 의사결정 후 Spec/Design 재실행했는가?

---

## 16. Design ↔ 코드 참조 방식

**Design의 "참조 패턴" 열:**
```
참조 패턴: apps/accounts/views.py:UserCreateView
```
- 절대 경로(프로젝트 루트 기준) + 클래스명
- 라인 번호 안 씀 (변경되므로)

**Design에서 Spec 역참조:**
```markdown
## 변경 계획

| # | 파일 | 변경 | 참조 | 관련 AC |
|---|------|------|------|---------|
| 1 | views.py | LoginView 추가 | users/views.py | R-1, R-2 |
| 2 | urls.py | URL 라우팅 | | R-1, R-2, C-1 |

## AC 커버리지

| AC | 슬라이스 | 상태 |
|----|---------|------|
| R-1 | Slice A-1 | ⬜ |
| R-2 | Slice A-2 | ⬜ |
| C-1 | Slice A-3 | ⬜ |
```

---

## 요약

> **Design은 "어떻게, 왜 이 방법으로"를 결정한다.**
> Spec의 AC-ID를 슬라이스에 매핑하고, 커버리지 매트릭스로 누락 없는 구현을 보장한다.
