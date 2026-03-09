# 추천 오케스트레이터: 프래그머틱 하이브리드

> **기반**: Proposal A (Skill-Chain) + Proposal B (헌법+Hooks) + Proposal C (하이브리드)의 최선 요소 통합
> **작성일**: 2026-03-05
> **상태**: draft

---

## 1. 핵심 원칙

```
Skills는 전환(상태 변경), Hooks는 보호(차단) + 추적(자동 갱신), state.json은 기관 기억
```

다섯 가지 구성 요소가 각자 명확한 역할을 가진다:

| 메커니즘                     | 역할                                       | 비유               |
| ------------------------ | ---------------------------------------- | ---------------- |
| **CLAUDE.md**            | 워크플로우 규칙 선언 (기어 판단, Phase 순서, 금지사항)      | 헌법               |
| **Skills** (`/workflow`) | 상태 전환 (Phase 변경, 기어 설정 등 사용자 의도 기반 쓰기)  | 행정부 — 사용자 명령을 실행 |
| **Hooks**                | 보호 (phase guard 차단, 컨텍스트 주입) + 추적 (이벤트 기반 자동 갱신) | 사법부 — 위반 차단 + 자동 추적 |
| **state.json**           | 단일 진실의 원천 (Single Source of Truth)       | 기관 기억            |
| **workflow_docs/**       | 각 Phase의 산출물 (git 커밋)                    | 영구 기록            |

### 1-1 용어 정의

| 용어 | 정의 |
|------|------|
| **Phase** | 워크플로우의 단계. Specify → Design → Implement → Verify → Ship 순서로 진행 |
| **기어 (Gear)** | 작업 규모에 따른 워크플로우 강도 수준. 기어 1(즉시 구현), 기어 2(전체 Phase), 기어 3(전체+확장) |
| **AC** (Acceptance Criteria) | 인수 기준. 요구사항이 충족되었는지 판단하는 조건. 입출력 예시 형태로 작성 |
| **슬라이스** (Slice) | TDD의 Red-Green-Refactor-Commit 한 사이클에 해당하는 구현 단위. 최초 구현 시 1 슬라이스 = 1 커밋 (Verify 재작업 시 추가 fix 커밋 허용) |
| **Viewpoint** | 특정 관점(예: 보안, 성능, 명확성)에서 수행하는 독립적 질적 검토. 자동 게이트와 달리 리뷰 렌즈 역할 (상세: §8-0) |
| **자동 게이트** (Auto Gate) | Phase 전환 전 구조/형식을 기계적으로 검증하는 체크리스트. 미충족 시 차단 |
| **인간 게이트** (Human Gate) | 기어 3 전용. 비즈니스/아키텍처 수준의 인간 승인 단계 |
| **Plan Mode** | Claude Code의 탐색 전용 모드. 코드 수정 없이 코드베이스를 분석하는 기능 |

### 1-2 각 Proposal에서 가져온 것

| 요소 | 출처 | 이유 |
|------|------|------|
| 사용자 주도 전환 (`/workflow next`) | A | 사용자 통제권 보장, 예측 가능한 전환 |
| `state.json` 단일 상태 파일 | C | 세션 연속성, 디버깅 투명성 |
| 기어 1 무마찰 (상태 파일 없음, 워크플로우 미진입) | B | 간단한 작업에 오버헤드 제거 |
| Hooks로 phase guard + 자동 추적 | B+C | "Skills는 전환, Hooks는 보호+추적" 원칙 |
| 슬라이스 + AC 매핑 in state.json | C | Implement 단계 진행률 추적 |
| 피드백 루프 기록 | C | Design-Specify 반복 이력 보존 |
| 커맨드 수 축소 (6개 핵심) | A | 실용적 복잡도 수준 |
| `context.loadOnResume` | C | 세션 복구의 핵심 메커니즘 |
| 점진적 도입 로드맵 | B | CLAUDE.md부터 시작, 순차 추가 |
| Phase 내부 draft→review 루프 | bkit Evaluator-Optimizer + Boris Cherny Plan 왕복 | Phase 산출물 품질 보장 |
| Slice 단위 부분 재작업 | bkit 갭 분석 + Roo Code sub-task 재위임 | 전체 Phase 재작업 방지 |
| 장거리 에스컬레이션 | bkit PDCA 사이클 + Roo Code Orchestrator 재라우팅 | Implement→Specify 직행 등 |
| Viewpoint 기반 독립 리뷰 | Roo Code 모드별 권한 분리 + Amp 병렬 스레드 | 관점 간 오염 방지, 선택적 활성화 |

---

## 2. 기어 시스템

### 2-1 기어별 분기

```
판별 후 기어별 흐름:

기어 1: 바로 구현 → lint → 커밋 (state.json 없음, 마찰 제로)
기어 2: /workflow start → Specify → Design → Implement(TDD) → Verify → Ship
기어 3: 기어 2 + ADR 필수 + 전체 viewpoint 카탈로그 활성화
```

### 2-2 기어 판단 기준

```
판별 기준:
+---------------------------------------------------------+
| "이 변경을 한 문장으로 설명할 수 있는가?"                    |
|                                                         |
|  Yes --- 1-2개 파일, 단순 수정 ---------------> 기어 1    |
|                                                         |
|  No  --- 3-10 파일, 신규 기능 ----------------> 기어 2   |
|       \- 10+ 파일, 아키텍처 변경 -------------> 기어 3    |
+---------------------------------------------------------+
```

| 기어 | 워크플로우 | 포함되는 Phase | 판단 기준 |
|------|----------|--------------|----------|
| 1단 | 미진입 | 즉시 구현 → 커밋 | 1-2 파일, 단순 수정/버그 (작업 중 규모 증가 시 `/workflow start`로 기어 2 전환 가능. 이미 커밋된 변경은 유지) |
| 2단 | 전체 | 전체 5 Phase | 3-10 파일, 신규 기능 |
| 3단 | 전체+확장 | 전체 5 Phase (ADR 필수, 전체 viewpoint) | 10+ 파일, 아키텍처급 |

### 2-3 기어에 따른 산출물

| 항목            | 기어 1 | 기어 2                    | 기어 3                         |
| ------------- | ---- | ----------------------- | ---------------------------- |
| state.json 생성 | X    | 전체                      | 전체+확장                        |
| Specify 문서    | X    | workflow_docs/spec/     | workflow_docs/spec/            |
| Design 문서     | X    | workflow_docs/design/   | workflow_docs/design/ + ADR  |
| 슬라이스          | X    | 3-5개                    | 5-15개                        |
| 대안 검토         | X    | 해당 시에만                  | 필수                           |
| Viewpoint        | X    | 컨텍스트에 해당하는 viewpoint  | 전체 viewpoint 카탈로그          |
| Viewpoint 실행   | X    | 서브에이전트 (2개+ 시 분리)  | 서브에이전트 또는 에이전트 팀 (실행 상세는 skill reference에서 정의) |

---

## 3. 슬래시 커맨드 체계

### 3-1 커맨드 목록

**핵심 커맨드 (일상적으로 사용):**

| 커맨드                                    | 역할                            | state.json 영향                    |
| -------------------------------------- | ----------------------------- | -------------------------------- |
| `/workflow start {feature}`            | 새 워크플로우 시작 + 기어 감지              | 생성                               |
| `/workflow next [--force]`             | Phase 내 검토 → 다음 Phase 전환 (2-step 동작 — §3-2). `--force`로 blocking 이슈 무시 가능 | status 전환 또는 phase 전환            |
| `/workflow back [target-phase] [reason]` | 이전/지정 Phase로 + 피드백 기록          | phase 전환 + feedback 추가           |
| `/workflow back --slice {id} [reason]` | 특정 Slice만 재작업 (예: `--slice B-2`) | slice.status → needs_rework       |
| `/workflow status`                     | 현재 상태 대시보드 출력                 | 읽기만                              |
| `/workflow gear [N]`                   | 기어 수동 오버라이드                   | gear.override 설정                 |
| `/workflow abort [reason]`             | 워크플로우 중단 + 아카이브               | history/ 이동                      |

**`/workflow gear [N]` 상세 동작**:
- 기어를 수동으로 오버라이드. `gear.override` 필드에 기록.
- **올리기 (예: 2→3)**: ADR 필수 등 추가 요건이 소급 적용됨. 현재 Phase에서 미충족 항목은 다음 `/workflow next` 검토 시 확인.
- **내리기 (예: 3→2)**: 이미 생성된 산출물(spec, design)은 유지. 이후 Phase에서 해당 기어의 요건만 적용.
- 기어 변경 사유는 `gear.reason`에 기록.
- `phase.status`가 `reviewing` 또는 `needs_revision`일 때 기어를 변경하면, status를 `in_progress`로 리셋하고 다음 `/workflow next`에서 새 기어 기준으로 재검토.

**`/workflow abort [reason]` 상세 동작**:
- `state.json` → `.workflow/history/`로 아카이브 (중단 사유 포함).
- `workflow_docs/` 파일은 **삭제하지 않음** — git에 남아 추후 참고 가능.
- 진행 중인 브랜치/커밋은 그대로 유지 (git 조작 없음).

**제약**: 동시에 하나의 워크플로우만 활성 가능. `/workflow start` 실행 시 `.workflow/state.json`이 이미 존재하면 다음 세 가지 중 선택을 안내한다:
- `a) /workflow resume` — 기존 워크플로우 이어서 진행
- `b) /workflow abort` — 기존 워크플로우 아카이브 후 새로 시작
- `c) 현황 확인 후 결정` — `/workflow status`로 기존 상태 확인

이 처리는 세션 충돌(이전 세션이 비정상 종료로 state.json 잔존)과 의도적 병렬 시작 시도 모두를 커버한다.

**보조 커맨드 (필요할 때만):**

| 커맨드 | 역할 |
|--------|------|
| `/workflow resume` | 세션 복원 (state.json + workflow_docs/ 로드) |
| `/workflow history` | 완료/중단된 워크플로우 목록 |

### 3-2 `/workflow next` — 2단계 동작

`/workflow next`는 Phase 내부 검토와 Phase 전환을 모두 담당한다. 커맨드를 늘리지 않고 `phase.status`로 단계를 구분한다.

```
1번째 /workflow next (status: in_progress 또는 partial_rework → reviewing):
  AI가 현재 Phase의 skill reference를 기준으로 산출물을 검토:
    1. 자동 게이트 — 구조/형식 체크리스트 검증
    2. Viewpoint 리뷰 — 활성화된 관점별 질적 검토
    3. 발견 사항 보고 + 사용자 수정 또는 승인 요청

  수정 필요 → status: needs_revision
    → 사용자가 수정을 지시하면 AI가 문서 업데이트 + status를 in_progress로 전환
    → 사용자가 직접 수정하는 것도 가능 (이후 /workflow next로 재검토)
  승인       → status: approved

2번째 /workflow next (status: approved → 다음 Phase):
  다음 Phase로 전환
```

출력 예시 A — 자동 게이트 실패 시 (Viewpoint 미실행):
```
[workflow] SPECIFY 자체 검토 중...

■ 자동 게이트 (미충족 시 차단):
  [v] 요구사항 R-1~R-4 존재
  [v] In Scope / Out of Scope 섹션 존재
  [✗] R-3에 AC 없음                            ← 차단
  [v] 비기능 요건 존재 (응답 시간 200ms)

차단 항목이 있습니다. R-3에 AC를 추가한 후 /workflow next 를 다시 실행하세요.
(자동 게이트 미통과 → Viewpoint 검토 생략)
```

출력 예시 B — 자동 게이트 통과 후 Viewpoint 검토:
```
[workflow] SPECIFY 자체 검토 중...

■ 자동 게이트 (미충족 시 차단):
  [v] 요구사항 R-1~R-4 존재
  [v] In Scope / Out of Scope 섹션 존재
  [v] 모든 R-xxx에 AC 존재
  [v] 비기능 요건 존재 (응답 시간 200ms)

자동 게이트 통과 ✓ — Viewpoint 검토를 실행합니다.

■ Viewpoint 검토 (활성: 명확성/측정 가능성):
  [!] R-2의 "빠른 응답" — 수치 없음           (blocking)
  [!] 에러 시나리오 (네트워크 실패) 미명시     (non-blocking)

blocking 이슈가 있습니다. 해결 후 /workflow next 를 다시 실행하세요.
non-blocking 이슈는 /workflow next --force 로 override 가능합니다.
```

출력 예시 — 검토 통과 후 next (Phase 전환):
```
[workflow] SPECIFY 검토 완료 (draftCount: 2)
  모든 항목 충족. DESIGN으로 진행할까요? [Y/n]
```

**`--force` 옵션**: 검토 결과를 무시하고 강제 진행. 의도적으로 불완전한 상태로 넘어가야 할 때 사용. `feedback`에 "force-skipped" 기록. force-skipped 이슈는 다음 Phase 리뷰 시작 시 경고로 표시되어 후속 확인을 유도한다.

### 3-3 `/workflow back` — 확장된 역방향 전환

**공통 규칙**:
- `phase.status`가 `reviewing`일 때 `back`을 호출하면 진행 중인 리뷰를 취소하고 대상 Phase로 전환한다 (§4-5 적용).
- `partial_rework` 상태에서 `back --slice`를 반복 호출하여 추가 슬라이스를 `needs_rework`로 표시할 수 있다 (복수 슬라이스 동시 재작업).

#### 인접 Phase 복귀 (기존 동작)

```
/workflow back "reason"
→ 이전 Phase로 복귀, reason을 feedback에 기록
```

#### 장거리 에스컬레이션 (신규)

```
/workflow back specify "reason"   → Specify로 직행 (어느 Phase에서든)
/workflow back design "reason"    → Design으로 직행
```

중간 Phase 처리:
- 에스컬레이션 시 중간 Phase 문서에 `designStale: true` 표시 (상세: §4-4)

```
/workflow back specify "R-3 요구사항 자체가 기술적으로 불가능"

[workflow] IMPLEMENT → SPECIFY 에스컬레이션
  feedback 기록: {fromPhase: implement, toPhase: specify, type: infeasibility}
  Design 문서: stale 표시 (Specify 수정 후 갱신 필요)
  state.json {phase: specify, status: in_progress}
  "Spec R-3 수정을 시작합니다..."
```

#### Slice 단위 부분 재작업 (신규)

```
/workflow back --slice B-2 "경계값 0, -1 미처리"
→ B-2만 needs_rework 표시, Phase는 Implement로 전환
→ 나머지 완료된 슬라이스는 그대로 유지
```

```
[workflow] Slice B-2 재작업 시작
  B-2: needs_rework (경계값 0, -1 미처리)
  완료된 슬라이스: A-1, A-2, B-1 (유지)

  B-2 재작업 후 /workflow next 로 Verify 재진입합니다.
```

#### Implement → Design back 시 슬라이스 처리

완료된 슬라이스는 **보존**한다. Design 재승인 후 Implement 재진입 시:
1. AI가 Design 변경 범위(diff)를 분석
2. 영향 받는 슬라이스만 `needs_rework`로 표시
3. 영향 없는 슬라이스는 `completed` 유지
4. 새로 추가된 슬라이스는 `pending`으로 생성

이 방식은 Design 변경이 부분적일 때(슬라이스 순서 변경, 1-2개 슬라이스 수정) 전체 재구현을 방지한다.

### 3-4 `/workflow back` 타겟 매핑

| 현재 Phase | back (인수 없음) | back specify | back design | back implement | back verify | back --slice N |
|-----------|----------------|-------------|-------------|---------------|------------|---------------|
| design | specify | specify | — | — | — | — |
| implement | design | specify | design | — | — | implement |
| verify | implement | specify | design | implement | — | implement |
| ship | verify | specify | design | implement | verify | — |

`back (인수 없음)`은 직전 Phase로 복귀. 명시적 타겟은 해당 Phase 이전이면 어디든 지정 가능. `—`는 현재 Phase이거나 이후 Phase여서 불가능한 경우.

> Ship에서의 `back`은 확장(PR, CI 등) 활성화 시 주로 사용된다. 확장 없는 기본 흐름에서는 Ship이 자동 완료되므로 back이 발생하지 않는다.

---

## 4. 상태 파일 스키마

### 4-1 기어 2-3 전체 스키마 (`.workflow/state.json`)

```json
{
  "$schema": "workflow-state-v1",
  "feature": {
    "name": "user-notifications",
    "slug": "user-notifications",
    "jira": null,
    "branch": null,
    "pr": null
  },
  "gear": {
    "detected": 2,
    "override": null,
    "reason": "신규 기능, 영향 파일 7개 예상"
  },
  "phase": {
    "current": "design",
    "status": "reviewing",
    "draftCount": 2,
    "history": [
      {
        "phase": "specify",
        "status": "approved",
        "draftCount": 2,
        "startedAt": "2026-03-05T09:00:00Z",
        "completedAt": "2026-03-05T09:25:00Z"
      }
    ]
  },
  "artifacts": {
    "spec": "workflow_docs/spec/user-notifications.md",
    "design": "workflow_docs/design/user-notifications.md",
    "designStale": false,
    "adr": []
  },
  "slices": [
    {
      "id": "A-1",
      "name": "Notification 모델 + 마이그레이션",
      "status": "completed",
      "acs": ["R-1"],
      "dependencies": [],
      "commit": "abc1234"
    },
    {
      "id": "A-2",
      "name": "Signal handler 연결",
      "status": "in_progress",
      "acs": ["R-1", "R-2"],
      "dependencies": ["A-1"],
      "commit": null
    },
    {
      "id": "B-1",
      "name": "알림 목록 API",
      "status": "needs_rework",
      "reworkReason": "경계값 0, -1 미처리",
      "acs": ["R-3", "R-4"],
      "dependencies": ["A-1"],
      "commit": "def5678"
    }
  ],
  "feedback": [
    {
      "id": "FB-1",
      "fromPhase": "design",
      "toPhase": "specify",
      "type": "infeasibility",
      "description": "R-3의 '1초 이내 AI 분류' 불가능. 모델 추론 3초.",
      "alternatives": [
        {"option": "A", "description": "3초로 완화", "tradeoff": "UX 저하"},
        {"option": "B", "description": "비동기 처리", "tradeoff": "UX 패턴 변경"}
      ],
      "resolution": "A",
      "resolvedAt": "2026-03-05T09:20:00Z"
    },
    {
      "id": "FB-2",
      "fromPhase": "implement",
      "toPhase": "implement",
      "type": "slice_rework",
      "sliceId": "B-1",
      "description": "경계값 0, -1 미처리",
      "resolution": null,
      "resolvedAt": null
    }
  ],
  "context": {
    "loadOnResume": [
      "workflow_docs/spec/user-notifications.md",
      "workflow_docs/design/user-notifications.md"
    ],
    "referencePatterns": [
      "apps/comments/models.py:Comment",
      "apps/analytics/signals.py:track_event"
    ]
  },
  "meta": {
    "createdAt": "2026-03-05T09:00:00Z",
    "updatedAt": "2026-03-05T10:15:00Z",
    "designSpecIterations": 1,
    "workflowVersion": "1.0"
  }
}
```

**`feature` 필드 상세**:

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | O | feature 이름 (`/workflow start`의 인수) |
| `slug` | O | 파일명/브랜치명용 slug |
| `jira` | X | 이슈 트래커 티켓 ID. 확장 활성화 + `--jira` 옵션 사용 시 설정 (§12-4) |
| `branch` | X | 생성된 브랜치명. 브랜치 확장 활성화 시 설정 (§12-6) |
| `pr` | X | PR URL. PR 확장 활성화 + Ship Phase에서 설정 (§12-5) |

**`context` 필드 상세**:

| 필드 | 설명 |
|------|------|
| `loadOnResume` | 세션 복원 시 로드할 파일 경로 목록. Phase 진행에 따라 추가 (§8-0-1) |
| `referencePatterns` | 코드베이스 참조 패턴 (기존 코드와의 연관 파일:심볼) |

**`meta` 필드 상세**:

| 필드 | 설명 |
|------|------|
| `createdAt` | 워크플로우 생성 시각 |
| `updatedAt` | 마지막 상태 변경 시각 |
| `designSpecIterations` | Design↔Specify 왕복 횟수 (최대 3회 초과 시 범위 분할 권고) |
| `workflowVersion` | 스키마 버전 |

### 4-2 Phase status 값 정의

| status | 의미 | 전환 트리거 |
|--------|------|------------|
| `in_progress` | Phase 작업 진행 중 | Phase 진입 시 초기값 |
| `reviewing` | AI 자체 검토 중 | 1번째 `/workflow next` |
| `needs_revision` | 검토 결과 수정 필요 | 검토에서 문제 발견 |
| `approved` | 검토 통과, 다음 Phase 준비 | 검토 통과 또는 사용자 승인 |
| `partial_rework` | Slice 일부 재작업 중 (Verify에서 `back --slice`로 Implement 재진입 시 적용) | `/workflow back --slice N` |

### 4-3 Slice status 값 정의

| status         | 의미                   |
| -------------- | -------------------- |
| `pending`      | 미시작                  |
| `in_progress`  | 진행 중                 |
| `completed`    | 완료 (커밋됨)             |
| `needs_rework` | 재작업 필요 (Verify에서 발견 또는 Design 변경으로 영향받은 슬라이스) |

#### 4-3-1 feedback.type 값 정의

| type | 의미 | 발생 시점 |
|------|------|----------|
| `infeasibility` | 기술적 실현 불가능 | Design/Implement/Verify/Ship → Specify back |
| `scope_mismatch` | 범위 불일치 | Design/Implement/Verify/Ship → Specify back |
| `pattern_conflict` | 기존 패턴과 충돌 | Design/Implement/Verify/Ship → Specify back |
| `design_flaw` | 설계 결함 발견 | Implement/Verify/Ship → Design back |
| `requirement_gap` | 요구사항 갭 발견 | Implement/Verify/Ship → Specify back |
| `slice_rework` | 슬라이스 재작업 | Verify/Implement → Implement back --slice |
| `force_skipped` | --force로 이슈 건너뜀 | 모든 Phase |

> Phase 내부 리뷰 이슈(`needs_revision` 루프)는 `.review.md` 사이드카에 기록하며, `feedback` 배열은 inter-Phase 전환 전용이다.

### 4-4 artifacts.designStale

```json
"artifacts": {
  "spec": "workflow_docs/spec/...",
  "design": "workflow_docs/design/...",
  "designStale": true   // Specify 변경으로 Design도 검토/갱신 필요
}
```

- Implement, Verify, 또는 Ship에서 `back specify` 에스컬레이션 시 자동으로 `true` 설정
- Design Phase 재진입 시 "Design 문서가 Specify 변경으로 stale 상태입니다. 갱신이 필요합니다" 안내
- Design 갱신 완료 후 `false`로 복원

### 4-5 Phase 전환 시 스키마 필드 동작

| 필드 | Phase 전환 시 동작 |
|------|-------------------|
| `phase.current` | 새 Phase 값으로 교체 |
| `phase.status` | `in_progress`로 초기화 |
| `phase.draftCount` | `0`으로 초기화 |
| `phase.history` | 이전 Phase 기록 append |

위 동작은 `/workflow next`(정방향)와 `/workflow back`(역방향) 모두에 적용된다. `back` 전환 시 이전 Phase는 현재 status 그대로 history에 기록되고(approved가 아닐 수 있음), 대상 Phase는 새 history entry로 `in_progress` 진입한다.

리뷰 이슈는 `.review.md` 사이드카에 기록한다 (§9-3). state.json은 Phase 상태(`status`, `draftCount`)만 추적하고, 이슈 내용은 담지 않는다.

### 4-6 스키마 설계 원칙

| 원칙 | 설명 |
|------|------|
| **인간 가독성** | 의미가 자명한 필드명. jq나 에디터로 직접 확인 가능 |
| **AI 파서블** | 구조화된 JSON으로 AI가 정확히 파싱. 자연어 해석 불필요 |
| **최소 충분** | 각 단계에 필요한 정보만 포함. 문서 내용은 파일 경로로 참조 |
| **추적 가능** | history + feedback으로 모든 전환과 반복 이력 기록 |
| **세션 독립** | 어떤 세션이든 state.json만 읽으면 재개 가능 |

---

## 5. 상태 전이도

```
                     ┌──────────────────────────────────────┐
                     │         .workflow/state.json          │
                     └──────────────────────────────────────┘

SPECIFY ──next──> DESIGN ──next──> IMPLEMENT ──next──> VERIFY ──next──> SHIP ──> 완료
   ↑                ↑                  ↑                  │                │
   │                │                  │ back --slice N   │ back           │ back (확장 시)
   │ back specify   │ back design      │ (slice만 재작업)  │ back implement │ back verify
   │                │                  │                  │ back design    │ back design
   │                │                  │                  │ back specify   │ back implement
   │                │                  │ back --slice N ◄─┤               │ back specify
   │                │                  │ (Verify에서)     │                │
   │◄───────────────┴──────────────────┴──────────────────┴────────────────┘
              (장거리 에스컬레이션 — §3-4 타겟 매핑 참조)

Ship은 진입 시 자동 실행 → 완료 (§8-5). 확장(PR/CI) 실패 시에만 back 발생.

Phase 내부 루프 (각 Phase, Ship 제외 — 상세: §3-2):
  in_progress ──next──> reviewing ──(통과)──> approved ──next──> 다음 Phase
                             └──(이슈)──> needs_revision ──(수정)──> in_progress
  partial_rework ──next──> reviewing (needs_rework 슬라이스 모두 completed 시)
```

---

## 6. Hooks 설정

**Hook 통신 규약**:
- `exit 0` = 통과 (도구 실행 허용)
- `exit 1` = 차단 (PreToolUse에서만 유효 — 해당 도구 실행을 막음)
- `stdout` = 사용자에게 표시되는 메시지 (context-inject는 AI 컨텍스트에 주입)
- `stderr` = 사용자에게 표시되는 안내/경고 메시지
- 환경 변수: `CLAUDE_TOOL_INPUT` (도구 입력값), `CLAUDE_TOOL_INPUT_file_path` (파일 경로) 등 Claude Code가 제공

Hooks의 state.json 쓰기 범위:
- **허용**: 이벤트 기반 자동 추적 (예: 커밋 감지 → 슬라이스 완료 기록). 결정적이고 추적 가능한 셸 스크립트.
- **금지**: 상태 전환 (Phase 변경, 기어 설정 등 사용자 의도가 필요한 쓰기). 이는 Skills의 영역.

### 6-1 전체 Hooks 구성 (`.claude/settings.json`)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "name": "gear-detect",
        "command": ".claude/hooks/gear-detect.sh",
        "description": "기어 자동 감지. Phase guard 적용 여부 결정."
      },
      {
        "name": "context-inject",
        "command": ".claude/hooks/context-inject.sh",
        "description": "state.json의 loadOnResume 파일을 컨텍스트에 주입."
      }
    ],
    "PreToolUse": [
      {
        "name": "phase-guard",
        "command": ".claude/hooks/phase-guard.sh",
        "tool_name": "Write,Edit",
        "description": "기어 2-3에서 Specify/Design 미완료 시 코드 작성 차단."
      }
    ],
    "PostToolUse": [
      {
        "name": "slice-tracker",
        "command": ".claude/hooks/slice-tracker.sh",
        "tool_name": "Bash",
        "description": "git commit 감지 시 state.json의 슬라이스 상태 자동 갱신."
      }
    ]
  }
}
```

### 6-2 Hook별 핵심 로직

#### `gear-detect.sh` (UserPromptSubmit)

> **Hook과 Skill의 역할 분담**: 이 Hook은 키워드 기반의 **안내용 추천**(soft guidance)이다. 기어 최종 결정은 `/workflow start` Skill이 코드베이스 분석을 기반으로 수행한다. Hook과 Skill의 판단이 다를 경우 **Skill 판단이 우선**한다.

```bash
#!/usr/bin/env bash
# gear-detect.sh: 기어 자동 감지 (안내용) + Phase guard 적용 여부 결정
# 참고 구현 — 실제 프로젝트에서는 LLM 기반 판단으로 대체 가능

STATE_FILE=".workflow/state.json"

# 이미 워크플로우 진행 중이면 스킵
if [ -f "$STATE_FILE" ]; then
  exit 0
fi

PROMPT="${CLAUDE_TOOL_INPUT}"

if echo "$PROMPT" | grep -qiE "오타|typo|로그|print|주석|상수|버그|fix|수정|고쳐"; then
  echo "기어 1(즉시) 작업으로 판단. Phase 문서 불필요." >&2
  exit 0
fi

if echo "$PROMPT" | grep -qiE "기능|feature|추가|만들어|구현|API|모듈"; then
  echo "이 작업은 기어 2 이상으로 판단됩니다. /workflow start {feature-name} 으로 시작하세요." >&2
fi

exit 0
```

#### `phase-guard.sh` (PreToolUse — Write/Edit)

```bash
#!/usr/bin/env bash
# phase-guard.sh: Specify/Design 단계에서 src/ 코드 수정 차단

STATE_FILE=".workflow/state.json"
TOOL_FILE_PATH="${CLAUDE_TOOL_INPUT_file_path:-}"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

CURRENT_PHASE=$(jq -r '.phase.current' "$STATE_FILE" 2>/dev/null)
GEAR=$(jq -r '.gear.override // .gear.detected' "$STATE_FILE" 2>/dev/null)

if [ "$GEAR" -le 1 ]; then
  exit 0
fi

if [[ "$CURRENT_PHASE" == "specify" || "$CURRENT_PHASE" == "design" ]]; then
  # 경로 패턴은 프로젝트에 맞게 수정 필요 (예: packages/, modules/, internal/ 등)
  if echo "$TOOL_FILE_PATH" | grep -qE "^(src|app|apps|lib)/"; then
    echo "현재 ${CURRENT_PHASE} 단계입니다. 코드 작성은 Implement 단계에서 가능합니다." >&2
    echo "/workflow next 로 ${CURRENT_PHASE}를 완료한 후 진행하세요." >&2
    exit 1
  fi
fi

exit 0
```

#### `context-inject.sh` (UserPromptSubmit)

```bash
#!/usr/bin/env bash
# context-inject.sh: 세션 시작 시 state.json 기반 컨텍스트 자동 주입
# 참고 구현 — 프로젝트별 커스터마이즈 필요

STATE_FILE=".workflow/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# 세션당 1회만 실행 (매 프롬프트 중복 방지)
# 락 파일은 /workflow start (새 워크플로우) 또는 /workflow resume (세션 복원) 시 삭제됨
LOCK_FILE=".workflow/.context-injected"
if [ -f "$LOCK_FILE" ]; then
  exit 0
fi

FEATURE=$(jq -r '.feature.name' "$STATE_FILE")
PHASE=$(jq -r '.phase.current' "$STATE_FILE")
STATUS=$(jq -r '.phase.status' "$STATE_FILE")
GEAR=$(jq -r '.gear.override // .gear.detected' "$STATE_FILE")
FILES=$(jq -r '.context.loadOnResume[]' "$STATE_FILE" 2>/dev/null | tr '\n' ', ')
STALE=$(jq -r '.artifacts.designStale // false' "$STATE_FILE")

touch "$LOCK_FILE"

cat << EOF
[워크플로우 컨텍스트]
현재 기능: $FEATURE (기어 ${GEAR}단, Phase: $PHASE / $STATUS)
참고 문서: $FILES
$([ "$STALE" = "true" ] && echo "주의: Design 문서가 stale 상태입니다 (Specify 변경으로 갱신 필요)")
(/workflow status 로 상세 진행률 확인)
EOF
```

#### `slice-tracker.sh` (PostToolUse — Bash)

```bash
#!/usr/bin/env bash
# slice-tracker.sh: git commit 후 슬라이스 상태 자동 갱신

STATE_FILE=".workflow/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

if echo "$CLAUDE_TOOL_INPUT" | grep -q "git commit"; then
  COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null)
  COMMIT_MSG=$(git log -1 --format="%s" 2>/dev/null)
  # Slice ID 패턴: [A-1], [B-2] (단일 대문자 그룹 + 번호). Jira ID([SAAS-42])와 구분.
  SLICE_ID=$(echo "$COMMIT_MSG" | grep -oE '\[([A-Z]-[0-9]+)\]' | tr -d '[]')

  if [ -n "$SLICE_ID" ]; then
    jq --arg id "$SLICE_ID" --arg commit "$COMMIT_HASH" \
      '(.slices[] | select(.id == $id)) |= . + {status: "completed", commit: $commit, reworkReason: null}' \
      "$STATE_FILE" > /tmp/state.tmp && mv /tmp/state.tmp "$STATE_FILE"
    echo "Slice $SLICE_ID 완료 기록: $COMMIT_HASH" >&2
  fi
fi

exit 0
```

---

## 7. 디렉토리 구조

```
project-root/
├── CLAUDE.md                           # 워크플로우 헌법 (기어 규칙, Phase 순서, 금지사항)
│
├── .claude/
│   ├── settings.json                   # Hooks 설정
│   │
│   ├── hooks/
│   │   ├── gear-detect.sh              # 기어 자동 감지 + Phase guard 적용 여부
│   │   ├── phase-guard.sh              # Specify/Design 단계 코드 수정 차단
│   │   ├── context-inject.sh           # 세션 시작 시 state.json 컨텍스트 주입
│   │   └── slice-tracker.sh            # git commit 감지 → 슬라이스 상태 갱신
│   │
│   └── skills/
│       └── workflow/
│           ├── SKILL.md                # /workflow 커맨드 디스패처 (커맨드 파싱 → Phase reference 로드 → 상태 전환)
│           └── references/
│               ├── phase-specify.md    # Specify 상세 지침 + 전환 조건 (자동 게이트 체크리스트, Viewpoint 카탈로그)
│               ├── phase-design.md     # Design 상세 지침 + 전환 조건
│               ├── phase-implement.md  # Implement 상세 지침 + TDD 슬라이스 + 전환 조건
│               ├── phase-verify.md     # Verify 상세 지침 + 전환 조건
│               └── phase-ship.md       # Ship 상세 지침
│
├── .workflow/                          # 런타임 상태 (state.json gitignored, history/ 선택적)
│   ├── state.json                      # 현재 워크플로우 상태 (SSoT)
│   └── history/                        # 완료/중단된 워크플로우 아카이브
│       └── user-notifications.json
│
└── workflow_docs/                      # 워크플로우 산출물 (git 커밋, 일반 docs/와 구분)
    ├── spec/
    │   ├── {feature-name}.md           # Specify 산출물 (항상 최신 버전)
    │   └── {feature-name}.review.md   # 리뷰 이슈 누적 추적 (사이드카)
    ├── design/
    │   ├── {feature-name}.md           # Design 산출물 (항상 최신 버전)
    │   └── {feature-name}.review.md   # 리뷰 이슈 누적 추적 (사이드카)
    └── adr/
        └── ADR-NNN-{title}.md          # 아키텍처 결정 기록 (기어 3)
```

### 7-1 `.gitignore` 정책

```gitignore
# 런타임 상태 (세션 간 복원용이지만 팀 공유 불필요)
.workflow/state.json

# 선택적 보존 (팀 작업 시 공유 유용)
# .workflow/history/

# 항상 커밋
# workflow_docs/
```

---

## 8. Phase별 지침 (Skills references)

### 8-0 리뷰 구조

`/workflow next` 실행 시 Skill이 해당 Phase의 reference를 기준으로 리뷰를 수행한다. 리뷰는 3단계로 구성되며, **검증 규칙은 Skill reference에 정의**되고 state.json에는 저장하지 않는다.

**리뷰 파이프라인**:
```
1. 자동 게이트 (기계적 검증)
   → 구조/형식 체크리스트. 관점 무관. 미충족 시 차단.
   → 실패 시 viewpoint 검토를 실행하지 않음 (불필요한 비용 방지)

2. Viewpoint 리뷰 (자동 게이트 통과 후)
   → 활성화된 viewpoint별 독립 세션(서브에이전트)에서 질적 검토
   → 각 viewpoint가 발견한 이슈를 blocking / non-blocking으로 분류
   → blocking 이슈 존재 시 차단, non-blocking은 --force로 override 가능

3. 인간 게이트 (기어 3 전용, viewpoint 완료 후)
   → 비즈니스/아키텍처 수준 인간 sign-off
```

**원칙**:
1. **자동 게이트와 viewpoint는 역할이 다르다** — 자동 게이트는 "형식이 갖춰졌는가" (조건), viewpoint는 "내용이 충분한가" (리뷰 렌즈)
2. **선택적 활성화** — feature 특성과 기어에 따라 해당하는 viewpoint만 활성화
3. **독립 실행** — 활성화된 viewpoint가 2개 이상이면 각각 독립된 세션(서브에이전트)으로 분리 실행. 단일 세션에서 순차 적용하지 않음

순차 적용 시 관점 간 오염·편향이 발생하므로 독립 실행한다.

**선택 흐름**:
```
Phase 전체 viewpoint 카탈로그
       │
       ▼
 컨텍스트 필터링 (feature 특성에 해당하는 것만)
 예: 프론트 없는 기능 → UI/접근성 viewpoint 제외
       │
       ▼
 기어 필터링 (기어 2: 컨텍스트에 해당하는 것만 / 기어 3: 전체 카탈로그)
       │
       ▼
 활성 viewpoint 수 → 1개: 단일 세션 / 2개+: 분리 실행
```

각 Phase의 viewpoint 카탈로그는 아래 Phase별 지침에서 정의한다. **상세한 viewpoint 실행 방법(서브에이전트 설정, 에이전트 팀 구성 등)은 각 Phase의 skill reference 구현 시 정의**한다.

#### 8-0-1 Phase별 산출물 문서 개요

각 Phase가 어떤 문서를 소비하고 산출하는지의 전체 매핑.

| Phase | 입력 | 산출물 | .review.md | loadOnResume 변경 |
|-------|------|--------|-----------|------------------|
| Specify | (사용자 요청) | `spec/{feature}.md` | O | spec 파일 추가 |
| Design | `spec/{feature}.md` | `design/{feature}.md`, ADR(기어 3) | O | design 파일 추가 |
| Implement | `spec/` + `design/` | 소스 코드 + 커밋 | X | 변경 없음 |
| Verify | `spec/`(AC 추적) + `design/`(설계 대조) | (state.json에 검증 결과) | X | 변경 없음 |
| Ship | `design/`(PR 링크용) | PR, CLAUDE.md 업데이트 | X | 초기화 (아카이브) |

모든 산출물 문서는 `workflow_docs/` 하위에 위치하며 git 커밋 대상이다. `.review.md` 사이드카는 문서 산출물이 있는 Phase(Specify, Design)에만 적용된다.

**loadOnResume 업데이트 타이밍**: 해당 Phase에서 문서 초안을 최초 생성한 시점에 경로를 추가한다 (Phase 진입 시가 아님). 예: Design Phase 진입 시에는 아직 design 파일이 없으므로, 초안 작성 후 loadOnResume에 추가.

#### Spec 문서 (`workflow_docs/spec/{feature}.md`)

**역할**: "무엇을, 왜, 어디까지"의 확정본. 기능의 범위·요구사항·인수 기준을 코드 0줄 상태에서 정의한다.

**필수 섹션**:

| 섹션                      | 내용                            |
| ----------------------- | ----------------------------- |
| 문제 (Problem)            | 왜 필요한가 (1-3문장)                |
| 요구사항 (Requirements)     | `R-xxx` ID, 각각 AC 최소 1개 포함    |
| 인수 기준 (AC)              | 입출력 예시 형태 — 테스트 데이터로 직접 변환 가능 |
| 엣지 케이스                  | 경계 조건, 예외 상황                  |
| In Scope / Out of Scope | 범위 경계 명시                      |
| 제약사항 (Constraints)      | 성능·보안·외부 계약 등 비기능 요건 (해당 시)   |
| 변경 이력                   | Living Document 패턴 (§9-2)     |

> 상세 템플릿과 작성 지침은 Specify skill proposal에서 정의한다.

#### Design 문서 (`workflow_docs/design/{feature}.md`)

**역할**: "어떻게, 왜 이 방법으로"의 확정본. Spec을 코드베이스 기반 구현 경로로 변환한다.

**필수 섹션**:

| 섹션 | 내용 |
|------|------|
| 접근법 요약 | 전체 전략 (1-3문장) |
| 대안 검토 | 장단점 비교 (기어 3 필수, 기어 2 해당 시) |
| 변경 계획 | 파일 × 변경 × 참조 패턴 × AC 매핑 |
| 구현 슬라이스 | TDD 단위 분해 — ID(`{그룹}-{번호}`, 예: A-1, B-2), 테스트 의도, 변경 파일, 선행 조건 |
| AC 커버리지 | 모든 `R-xxx` → 슬라이스 매핑 (100% 커버리지) |
| 테스트 전략 | 테스트 수준(단위/통합/E2E), 모킹 전략 |
| 위험/미결정 | 구현 중 확인 필요 사항 |
| ADR 참조 | 아키텍처 결정 링크 (해당 시) |

> 상세 템플릿과 작성 지침은 Design skill proposal에서 정의한다.

#### ADR (`workflow_docs/adr/ADR-NNN-{title}.md`)

**역할**: 아키텍처 결정의 이유와 결과를 독립 추적. Design의 "대안 검토"에서 **결정** 자체만 분리한 것.
**적용**: 기어 3 필수, 기어 2 해당 시.
**필수 섹션**: 컨텍스트, 결정, 근거, 결과(긍정/부정).

#### .review.md 사이드카

**역할**: Phase 내 리뷰 이슈 누적 추적 (append only). 문서 본문과 분리하여 검토 이력 보존.
**적용**: Specify, Design Phase — 문서 산출물이 있는 Phase에만.
**상세**: §9-3 참조.

### 8-1 Specify Phase

**목적**: "무엇을, 왜, 어디까지"를 확정한다. 코드 0줄 상태에서 진행.

**진입 조건**: 기어 2-3으로 판단됨
**산출물**: `workflow_docs/spec/{feature}.md` + `.review.md` (문서 구조: §8-0-1)

**프로세스**:
1. 문제 정의 확인 — "이 기능이 왜 필요한가"
2. 5개 항목 인터뷰:
   - 핵심 사용자 행동 (누가, 무엇을)
   - 입출력 (구체적 데이터 예시)
   - 엣지 케이스 (경계 조건, 예외)
   - 비범위 ("이번에 하지 않을 것")
   - 제약사항 (성능, 외부 계약)
3. `workflow_docs/spec/{feature}.md` 초안 작성
4. `/workflow next` → 자체 검토 (reviewing)
5. 검토 통과 또는 수정 완료 → `/workflow next` → Design 진입

**금지사항**:
- 기술 스택/라이브러리 결정 (Design 영역)
- 파일명/함수명 지정 (Design 영역)
- 코드/의사코드 작성 (Implement 영역)
- "Redis로 캐시" 같은 구현 수단 → "응답 200ms 이내" (제약사항)으로 전환

**전환 조건 (Skill이 reviewing 단계에서 검증)**:

**자동 게이트** (미충족 시 차단):
- [ ] `workflow_docs/spec/{feature}.md` 파일 존재
- [ ] 모든 요구사항에 `R-xxx` ID 부여
- [ ] 모든 `R-xxx`에 AC 최소 1개 이상
- [ ] `[TBD]`, `[미정]`, `[TODO]` 문자열 없음
- [ ] "In Scope / Out of Scope" 섹션 존재
- [ ] 비기능 요건 최소 1개 (성능, 보안, 가용성 중)

**인간 게이트** (기어 3 전용):
- [ ] 비즈니스 가치 대비 구현 복잡도 적절한가
- [ ] 제품 방향 및 이해관계자 합의와 일치하는가

**Viewpoint 카탈로그** (자동 게이트 통과 후 활성화):

| Viewpoint  | 적용 조건                  | 주요 검토 내용                                |
| ---------- | ---------------------- | --------------------------------------- |
| 명확성/측정 가능성 | 항상                     | 모호어 제거, 수치 기준, GIVEN/WHEN/THEN, 행위자 명시  |
| 기술 실현성     | 신기술·레거시 연동·외부 API 의존 시 | 현 코드베이스 기반 실현 가능 여부, 기술 제약, 구현 수단 혼입 여부 |
| 사용자 시나리오   | UX 변경이 있는 기능           | 빈 상태, 에러 상태, 접근성, 사용 흐름                 |
| 비즈니스 정합성   | 이해관계자 다수 또는 전략적 기능     | 제품 방향, ROI, 이해관계자 합의                    |

### 8-2 Design Phase

**목적**: "어떻게, 왜 이 방법으로"를 결정한다. Spec을 받아 코드베이스 기반으로 구현 경로 설계.

**진입 조건**: `workflow_docs/spec/{feature}.md` 존재 + Specify approved (기어 2-3)
**산출물**: `workflow_docs/design/{feature}.md` + `.review.md`, ADR(기어 3) (문서 구조: §8-0-1)
- `artifacts.designStale: true` 인 경우: 진입 후 **프로세스 1단계로** 기존 Design 문서를 Spec 변경사항에 맞춰 갱신한 뒤 정상 흐름 진행 (차단 조건이 아닌 작업 단계)

**프로세스**:
1. Spec 로드 — 요구사항/AC 파악
2. Plan Mode로 코드베이스 탐색 — 기존 패턴, 영향 범위, 재사용 모듈
3. 대안 검토 (기존 패턴 그대로면 생략 — 기어 3은 필수)
4. 변경 계획 수립:
   ```
   | # | 파일 | 변경 내용 | 참조 패턴 | 관련 AC |
   ```
5. TDD 슬라이스 분해 — Slice = 1 Red-Green-Refactor-Commit 사이클
6. AC 커버리지 매트릭스 — 모든 R-xxx가 최소 1개 Slice에 매핑
7. `/workflow next` → 자체 검토 (reviewing)
8. 검토 통과 → `/workflow next` → Implement 진입

**Design → Specify 피드백**:
- 기술적 실현 불가능, 범위 불일치, 기존 패턴과 충돌 발견 시
- 문제 + 대안 2-3개 + 트레이드오프 형식으로 보고
- `/workflow back specify [reason]` → Spec 수정 → Design 재진입
- 최대 3회 왕복 초과 시 기능 범위 분할 권고

**금지사항**:
- 요구사항 재정의 (Specify 영역)
- 범위 확장 (비범위로 이동 또는 별도 feature로 제안)
- 실제 코드/의사코드 작성 (Implement 영역)

**전환 조건 (Skill이 reviewing 단계에서 검증)**:

**자동 게이트** (미충족 시 차단):
- [ ] `workflow_docs/design/{feature}.md` 파일 존재
- [ ] 모든 `R-xxx`가 최소 1개 슬라이스에 매핑됨 (AC 커버리지 100%)
- [ ] 슬라이스 목록 존재 (ID, 이름, 연결 AC 포함)
- [ ] 외부 의존성 목록화 (3rd-party API, DB, 캐시 등)
- [ ] `[OPEN_QUESTION]` 미해결 항목 없음

**인간 게이트** (기어 3 전용):
- [ ] 아키텍처 결정이 팀 패턴과 일관성 있는가
- [ ] 기술 부채를 의도적으로 만드는 경우 명시됐는가

**Viewpoint 카탈로그** (자동 게이트 통과 후 활성화):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| 패턴 일관성 | 항상 | 기존 코드베이스 컨벤션, 참조 패턴 존재, 대안 검토 흔적 |
| 테스트 가능성 | 외부 의존성·비동기·복잡 상태 시 | 슬라이스당 테스트 의도 명확, 독립 테스트 가능 여부, 모킹 전략 |
| 성능/확장성 | DB 변경·API·캐시·대량 데이터 시 | 쿼리 최적화, 인덱스, 응답 시간 |
| 보안 | 인증·인가·외부 입력·API 노출 시 | 설계 수준 보안 검토, 데이터 흐름, 에러 처리 전략 |

### 8-3 Implement Phase

**목적**: Design의 슬라이스 계획에 따라 TDD로 구현한다.

**진입 조건**: `workflow_docs/design/{feature}.md` 존재 + Design approved
**산출물**: 소스 코드 + 슬라이스별 커밋 (workflow_docs 산출물 없음)

**status별 진입 경로**:
- `in_progress`: 일반 진입 — 첫 슬라이스부터 순서대로
- `partial_rework`: `/workflow back --slice N`으로 복귀 — `needs_rework` 슬라이스만 재작업

**프로세스 (슬라이스 단위 반복)**:
```
Slice N 시작 (status: pending 또는 needs_rework)
  1. Design에서 Slice N의 "테스트 의도" 읽기
  2. 실패하는 테스트 작성 (Red)
  3. 최소 구현 (Green) — "이 실패하는 테스트를 통과시키는 최소한의 코드만"
  4. 리팩토링 (Refactor) — 동작 유지하면서 구조 개선 (중복 제거, 네이밍)
  5. 자동 검증 (예시는 Python 기준 — 프로젝트에 맞게 대체):
     - lint (ruff check --fix + format)
     - type check (pyright)
     - test (pytest)
  6. 커밋 (아래 커밋 컨벤션 참조)
  7. state.json의 slice 상태 갱신 (Hook 자동)
  8. 다음 Slice로 (또는 rework 완료 시 Verify 재진입)
```

**커밋 컨벤션** (Conventional Commits + Slice ID):
```
feat({scope}): {설명} [{Slice-ID}]    ← 슬라이스 구현
fix({scope}): {설명} [{Slice-ID}]     ← 슬라이스 내 수정
docs: {feature} spec/design 작성       ← Specify/Design 산출물 커밋 (슬라이스 외)
```
- 1 Slice = 1 커밋 (원자성). 커밋 메시지의 `[Slice-ID]`를 `slice-tracker.sh` Hook(§6-2)이 감지하여 state.json 자동 갱신.
- 예시: `feat(notifications): add Notification model [A-1]`

**핵심 규칙**:
- 같은 오류 3회 반복 시 → 접근 방식 변경 (Design 재검토 또는 `/workflow back design`)
- 요구사항 자체가 잘못됐음을 발견 시 → `/workflow back specify`로 에스컬레이션
- 이해하지 못한 코드는 커밋하지 않음
- Slice 1개 = 커밋 1개 (원자성)

**전환 조건 (Skill이 reviewing 단계에서 검증)**:

**자동 게이트** (미충족 시 차단 — 슬라이스별 점진적 검증):
- [ ] 모든 슬라이스 `completed` (needs_rework 없음)
- [ ] 전체 테스트 스위트 통과
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 기존 테스트 깨뜨리지 않음

**인간 게이트**: 없음. Implement는 auto-gate only — 기계적 통과/차단만 판정한다. 질적 코드 리뷰(재사용성, 코드 품질, 런타임 효율, 보안)는 Verify Phase에서 수행.

**Viewpoint 카탈로그**: 없음. Verify Phase로 이관됨.

### 8-4 Verify Phase

**목적**: 구현된 코드를 질적으로 리뷰하고, 명세 커버리지를 최종 확인한다. Implement의 auto-gate(테스트/린트/타입)를 반복하지 않는다.

**진입 조건**: Implement approved
**산출물**: 없음 — 검증 결과는 state.json에 기록. 품질 게이트 역할.

**진입 경로**:
- 일반 진입: Implement 완료 후 `/workflow next` → 전체 코드 대상 리뷰
- 부분 재진입: Slice 재작업 완료 → Implement 승인 → Verify 재진입 (reworked 슬라이스 중심 리뷰)

**프로세스**:
1. AI 코드 리뷰 — 5개 축으로 전체 구현 코드 검토:
   - 재사용성 (중복 코드, 기존 유틸리티 활용)
   - 코드 품질 (가독성, 네이밍, 구조, 에러 처리)
   - 런타임 효율 (N+1, 불필요한 할당, 알고리즘 복잡도)
   - 보안 (OWASP Top 10, 입력 검증, 인증/인가)
   - AC 커버리지 (R-xxx/C-xxx → 테스트 매핑 최종 확인)
2. 경미한 이슈 직접 수정 + 커밋 (네이밍 개선, 같은 파일 내 헬퍼 추출, 에러 처리 보강 등)
3. 리뷰 결과 보고 (수정 내역 + 구조적 이슈 + AC 커버리지 결과)
4. 기어 3: 인간이 리뷰 결과 확인 + 승인/에스컬레이션

**경미한 수정 vs 구조적 문제**:
- 경미한 수정 (Verify에서 직접): 변수명 개선, 같은 파일 내 헬퍼 추출, 불필요한 할당 제거, 에러 처리 보강
- 구조적 문제 (back 필요): 새 파일/모듈 추가, 접근법 변경, 아키텍처 변경, 알고리즘 변경
- 판단 기준: "이 수정이 기존 테스트를 깨뜨리거나, 파일 구조를 바꾸는가?" → Yes: back / No: 직접 수정

**에스컬레이션**:
- 테스트 누락 (AC 매핑 불가) → `/workflow back --slice N`
- needs_rework ≥ 50% → `/workflow back design` 권고
- 설계 결함 → `/workflow back design "reason"`
- 요구사항 갭 → `/workflow back specify "reason"`

**전환 조건 (Skill이 reviewing 단계에서 검증)**:

**자동 게이트**: 없음. Verify는 질적 리뷰 Phase — Implement의 auto-gate(테스트/린트/타입)를 반복하지 않는다. 경미한 수정 후 회귀 확인(lint + type + test)은 수행하지만, Phase 전환의 자동 게이트로서가 아닌 수정 검증 목적.

**인간 게이트** (기어 3 전용):
- [ ] 인간 reviewer가 리뷰 결과를 확인했는가
- [ ] 비즈니스 로직이 실제 의도와 일치하는가
- [ ] 구조적 이슈가 모두 에스컬레이션되었는가

> 기어 2에서는 인간 게이트 없음 — AI 리뷰에서 구조적 이슈가 없으면 자동 `approved`.

**Viewpoint 카탈로그** (기본 5개 리뷰 축은 항상 적용. 추가 심화 viewpoint):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| 성능 심화 | DB 쿼리·대량 데이터·응답 시간 SLA 시 | 쿼리 플랜, 인덱스 활용, 캐시 전략 |
| 접근성 | UI 변경이 있는 기능 | WCAG, 스크린 리더, 키보드 네비게이션 |
| 비즈니스 로직 | 도메인 복잡도 높을 때 | 실제 비즈니스 의도와 구현 일치 |
| 동시성 | 멀티스레드·비동기·분산 처리 시 | 레이스 컨디션, 데드락, 순서 보장 |

### 8-5 Ship Phase

**목적**: 정리 + 워크플로우 완료 기록. 확장 설정에 따라 PR 생성, CI 확인, 이슈 트래커 동기화를 포함.

**진입 조건**: Verify approved
**산출물**: CLAUDE.md 업데이트 (학습 패턴 기록). state.json → history/ 아카이브. (확장 시: PR)

**완료 방식**: Ship은 진입과 동시에 프로세스를 자동 실행하고 완료한다. `/workflow next` 불필요 — 별도 전환 조건 / Viewpoint를 적용하지 않는다. 품질 검증은 Verify에서 완료됨.

**재진입**: 확장(PR/CI) 실패로 back한 뒤 수정→Verify 재통과→Ship 재진입 시, 전체 프로세스를 처음부터 재실행한다. CLAUDE.md 업데이트는 멱등적(이미 기록된 내용은 중복 추가하지 않음). PR은 `gh pr edit`으로 기존 PR 업데이트. 아카이브는 최종 성공 시에만 실행.

**프로세스**:
1. CLAUDE.md 업데이트 (학습한 패턴 기록)
2. *(확장: PR)* PR 생성 또는 업데이트 — 상세: §12-5
3. *(확장: CI)* CI 통과 확인 — 상세: §12-7
4. *(확장: 이슈 트래커)* 이슈 상태 전환 — 상세: §12-4
5. `.workflow/state.json` → `.workflow/history/` 아카이브 + 삭제 ← **항상 마지막**

> 아카이브는 모든 프로세스(핵심 + 확장) 성공 후에만 실행한다. 확장(PR/CI) 실패 시 back이 필요하므로 state.json이 남아있어야 한다. 복귀 동작은 §12-5, §12-7에서 정의.

---

## 9. Phase 내 문서 관리

Phase 내 반복 루프(draft → review → revision → review → approved)에서 문서를 어떻게 관리하는가.

### 9-1 기본 원칙

```
문서 파일  = 항상 최신 버전 (덮어쓰기, Single Source of Truth)
리뷰 파일  = 리뷰 이슈 누적 (append only, 검토 이력 보존)
state.json = Phase 상태 추적 (status, draftCount)
```

**왜 버전별 파일 분리(spec-v1.md, spec-v2.md)를 하지 않는가**:
- 파일 증식으로 "현재 버전"이 어느 파일인지 불분명해짐
- AI가 어떤 파일을 참조해야 하는지 혼란
- Git history가 이미 모든 이전 버전을 보존

### 9-2 Living Document: 내장 변경 이력

문서 본문 아래에 변경 이력 섹션을 유지한다. 리뷰 통과 후 다음 초안 작성 시 이 섹션에 한 줄 추가.

```markdown
# Spec: 사용자 알림 시스템
<!-- workflow: specify | draftCount: 2 | status: reviewing -->

## 1. 개요
...

## 2. 요구사항
...

---
## 변경 이력

| 버전 | 날짜  | 변경 내용                              | 변경 사유               |
|-----|-------|--------------------------------------|----------------------|
| v2  | 03-05 | R-3 추가, R-2 응답 시간 200ms로 수치화 | 리뷰: 수치 없음, AC 누락 |
| v1  | 03-05 | 최초 작성                              | —                    |
```

**규칙**:
- 문서 상단 주석(`<!-- workflow: ... -->`)에 현재 상태를 기록해 한눈에 파악
- 변경 이력은 역순(최신이 위) — 최근 변경을 바로 볼 수 있도록
- 리뷰 이유가 없는 변경은 이력에 기록하지 않음 (단순 오타 수정 등)

### 9-3 사이드카 리뷰 파일 (.review.md)

리뷰 이슈를 누적하는 전용 파일. 문서 본문과 분리해 리뷰 히스토리를 보존한다.

```
workflow_docs/spec/
├── user-notifications.md         # 현재 문서 (항상 최신)
└── user-notifications.review.md  # 리뷰 누적 (append only)
```

`user-notifications.review.md` 형식:

```markdown
# Review Log: user-notifications (Specify)

## 리뷰 #2 (v2 → v3 작업 중)
**상태**: needs_revision
**미해결 이슈**:
- [ ] RI-3 (자동 게이트): AC-5 fallback 행동 미정의
- [ ] RI-4 (Viewpoint:사용자 시나리오): 수신 거부 후 재구독 시나리오 없음

## 리뷰 #1 (v1 → v2) — 완료
**상태**: needs_revision → resolved
**이슈**:
- [x] RI-1 (자동 게이트): R-3에 AC 없음 → v2에서 AC-4, AC-5 추가
- [x] RI-2 (Viewpoint:명확성): R-2 "빠른 응답" 수치 없음 → v2에서 200ms로 명시
```

**규칙**:
- 새 리뷰 시작 시 맨 위에 `## 리뷰 #N` 블록 추가 (append)
- 이전 리뷰 블록은 수정하지 않음 (이력 보존)
- `resolved` 이슈는 `[x]`로 체크, 해결 버전 메모
- `RI-{N}` ID는 워크플로우 전체에서 순차 증가 (Phase별 리셋 없음)
- 이슈 출처를 괄호로 표기: `(자동 게이트)`, `(Viewpoint:{관점명})`

### 9-4 문서 업데이트 프로토콜

리뷰 결과 `needs_revision`이 되면, 사용자가 수정을 지시하면 AI가 다음 순서로 업데이트한다 (사용자가 직접 수정하는 것도 가능):

```
1. user-notifications.review.md
   → 현재 리뷰 #N 블록의 미해결 이슈 목록 작성

2. user-notifications.md 본문 수정
   → RI-xxx 이슈 각각 해결 (수치 추가, AC 추가 등)
   → 변경 이력 섹션에 v(N+1) 행 추가

3. state.json 업데이트
   → phase.draftCount += 1
   → phase.status = "in_progress" (수정 시작)

4. 사용자에게 수정 내용 요약 보고
   → "/workflow next 로 재검토를 시작하세요"
```

### 9-5 draftCount 상한 및 루프 탈출

`draftCount`가 임계값을 초과하면 루프 강제 탈출:

```
draftCount ≤ 2: 정상 범위
draftCount = 3: 경고 — "3회째 초안입니다. 근본 원인을 먼저 파악하세요."
draftCount ≥ 4: 인터럽트 — 다음 중 선택 필요:
  A) /workflow next --force   (현재 상태로 강제 진행, 이슈를 feedback에 기록)
  B) /workflow back           (이전 Phase 재검토 — 문제가 더 상위에 있을 때)
  C) /workflow abort          (기능 범위를 축소하고 재시작)
```

bkit의 "최대 5회" 원칙과 동일한 의도이지만, AI 자율 결정이 아닌 **인간에게 결정권을 돌려준다**.

---

## 10. 흐름 예시

### 기어 2 전체 사이클 (Phase 내부 루프 포함)

```
사용자: "사용자 알림 기능을 추가하고 싶어"

[Hook: gear-detect.sh] 기어 2 이상 판단
[출력] "이 작업은 /workflow start {feature-name} 으로 시작하세요."

사용자: /workflow start user-notifications

[Skills: workflow start]
  코드베이스 탐색 → 파일 7개 영향 → 기어 2 확정
  .workflow/state.json 생성 {phase: specify, status: in_progress}

... (5개 항목 인터뷰 → workflow_docs/spec/user-notifications.md 초안 작성) ...

사용자: /workflow next  ← 1번째 (in_progress → reviewing)

[Skills: workflow next]
  AI 자체 검토:
  [!] R-2의 "빠른 응답" 기준 모호 — 수치 없음
  [!] 네트워크 실패 시나리오 미명시
  status: needs_revision
  "위 항목 보완 후 /workflow next를 다시 실행하세요."

... (R-2 수치 추가, 에러 시나리오 명시 → status: in_progress) ...

사용자: /workflow next  ← 2번째 (in_progress → reviewing → approved)

[Skills: workflow next]
  재검토: 모든 항목 충족
  status: approved
  "DESIGN으로 진행할까요?"

사용자: /workflow next  ← 3번째 (approved → design/in_progress)
  state.json {phase: design, status: in_progress, draftCount: 0}
  phase-design.md 로드 + Spec 컨텍스트 제공

... (코드베이스 탐색 → 변경 계획 → 슬라이스 분해) ...
... (R-3 "1초 이내 AI 분류" 기술적 불가능 발견) ...

AI: "R-3 실현 불가능합니다. 대안: A) 3초로 완화, B) 비동기 처리"

사용자: /workflow back specify "R-3 응답 시간 3초로 완화"

[Skills: workflow back specify]
  feedback 기록 {fromPhase: design, toPhase: specify, type: infeasibility}
  artifacts.designStale = true  (Design 재작업 필요)
  state.json {phase: specify, status: in_progress}

... Spec R-3 수정 ...

사용자: /workflow next  ← (in_progress → reviewing → approved)
사용자: /workflow next  ← (approved → Design 재진입)

[Skills: workflow next → Design]
  "Design 문서가 stale 상태입니다. Spec 변경사항에 맞춰 갱신합니다."
  artifacts.designStale = false
  Design 갱신 + 슬라이스 분해 완료

사용자: /workflow next  ← (in_progress → reviewing → approved)
사용자: /workflow next  ← (approved → Implement 진입)

[Hook: phase-guard.sh] → 이제 src/ 수정 허용

... (A-1, A-2, B-1 Slice 구현 완료) ...

사용자: /workflow next  ← (in_progress → reviewing)

[Skills: workflow next]
  자동 게이트: 모든 슬라이스 completed, 테스트/린트/타입 통과
  status: approved
  "VERIFY로 진행할까요?"

사용자: /workflow next  ← (approved → Verify)

사용자: /workflow next  ← (in_progress → reviewing)

[Skills: workflow next]
  B-1 경계값 테스트 실패 발견
  status: needs_revision

사용자: /workflow back --slice B-1 "경계값 0, -1 미처리"

[Skills: workflow back --slice B-1]
  slices[B-1].status = "needs_rework"
  state.json {phase: implement, status: partial_rework}
  "B-1만 재작업합니다. 나머지 슬라이스는 유지됩니다."

... (B-1 Red→Green→Commit 재수행) ...

사용자: /workflow next (partial_rework → reviewing)

[Skills: workflow next]
  전체 테스트 재검증: 통과
  모든 슬라이스 completed → status: approved

사용자: /workflow next (approved → Verify 재진입)

사용자: /workflow next  ← (in_progress → reviewing)

[Skills: workflow next]
  자동 게이트: 전체 통합 테스트 통과, needs_rework 없음, AC 커버리지 100%
  Viewpoint 검토: 통과
  status: approved

사용자: /workflow next  ← (approved → Ship)

[Skills: Ship 자동 실행]
  CLAUDE.md 학습 패턴 기록
  state.json → history/ 아카이브
  (확장 활성화 시: PR 생성, CI 확인, Jira 전환)
  → 완료
```

---

## 11. 세션 연속성

세션이 끊기거나 `/compact`로 컨텍스트가 압축되어도 state.json이 기관 기억 역할을 한다.

```bash
# 새 세션 시작
claude --resume

> /workflow resume
```

**복원 흐름**:
1. `.workflow/state.json` 읽기 → Phase, status, draftCount, 슬라이스 진행률 파악
2. `context.loadOnResume` 파일 목록 로드
3. `artifacts.designStale` 확인 → true이면 갱신 필요 안내
4. `git log` → 마지막 커밋 이후 변경사항 요약
5. 현재 Phase Skill 로드 + 이어서 진행

출력 예시:
```
[workflow] 워크플로우 복원
  기능: user-notifications (기어 2)
  현재 Phase: IMPLEMENT — partial_rework
  마지막 활동: 2시간 전

  산출물:
    [완료] Spec: workflow_docs/spec/user-notifications.md
    [완료] Design: workflow_docs/design/user-notifications.md
    [진행] Implement

  슬라이스 진행률: 3/4
    [완료] A-1: Notification 모델
    [완료] A-2: Signal handler
    [완료] B-1: 알림 목록 API
    [재작업] B-2: 읽음 처리 (경계값 0, -1 미처리)

  다음 작업: B-2 재작업 — 경계값 테스트부터 시작합니다.
```

---

## 12. 외부 도구 연계

### 12-1 설계 원칙

**필수 의존은 Git(커밋)뿐이다.** 브랜치 전략, 이슈 트래커, PR, CI/CD는 모두 프로젝트 설정에 따른 **확장**이다. 워크플로우는 이들 없이도 완전히 동작해야 한다.

```
기본 (Git 커밋만)
  └── 확장 포인트를 통해 프로젝트 환경에 맞는 도구를 연결
```

### 12-2 기본 흐름 (확장 없이)

확장을 하나도 활성화하지 않았을 때의 워크플로우:

```
/workflow start user-notifications
  → state.json 생성 (현재 브랜치에서 작업)

Specify → Design → Implement
  → 슬라이스별 git commit (Conventional Commits + Slice ID)

Verify → Ship
  → CLAUDE.md 학습 기록
  → state.json → history/ 아카이브
  → 완료
```

이 상태에서:
- 브랜치: **현재 브랜치**에서 작업 (별도 생성 안 함)
- 커밋: AI가 직접 `git commit` 수행. 1 Slice = 1 커밋 (원자성)
- Ship: CLAUDE.md 업데이트 + 아카이브로 종료. PR/CI 없음
- `state.json`의 `feature.branch`, `feature.jira`, `feature.pr`은 모두 `null`

커밋 형식은 §8-3의 커밋 컨벤션을 따른다 (Conventional Commits + Slice ID).

### 12-3 확장 포인트

워크플로우 흐름에서 외부 도구를 연결할 수 있는 지점. 각 확장은 독립적이며, 원하는 조합만 활성화한다.

| 확장 | 연결 시점 | 기본 동작 (확장 없이) | 활성화 시 |
|------|-----------|----------------------|-----------|
| **브랜치 전략** | `/workflow start` | 현재 브랜치 유지 | feature branch 생성 + 전환 |
| **이슈 트래커** | `/workflow start`, Ship | feature name만 사용 | 이슈 조회 → 컨텍스트, 상태 동기화 |
| **커밋 검증** | `git commit` 시점 | 검증 없이 커밋 | pre-commit hooks (lint, type check) |
| **PR 생성** | Ship Phase | 아카이브로 종료 | `gh pr create` + PR URL 기록 |
| **CI/CD** | PR 생성 후 | 없음 | GitHub Actions: test + AI review |

활성화 방법은 프로젝트의 `.claude/settings.json` 또는 CLAUDE.md에서 설정한다. 상세 구현은 Skill reference에서 정의.

### 12-4 확장: 이슈 트래커 (Jira 등)

`state.json`의 `feature.jira` 필드를 통해 이슈 티켓과 연결한다. **프로젝트에 이슈 트래커가 있어도 티켓 없이 시작할 수 있다.**

#### 사용 패턴

```
# 티켓 없이 (기본)
/workflow start user-notifications
→ feature.jira = null

# 티켓 연결
/workflow start user-notifications --jira SAAS-42
→ Jira REST API로 이슈 조회 (제목, 설명, 우선순위)
→ 이슈 정보를 Specify Phase 초기 컨텍스트로 활용
→ feature.jira = "SAAS-42"
```

#### Phase 전환 시 상태 동기화 (선택적)

`feature.jira`가 설정된 경우에만 동작:

| 워크플로우 이벤트 | 이슈 트래커 전환 |
|---|---|
| `/workflow start` | To Do → In Progress |
| Ship Phase (PR 생성 시) | In Progress → In Review |
| PR merge 후 | In Review → Done |

> 연동은 MCP 서버 또는 Skill 내 REST API 호출로 구현. Jira 외 다른 트래커(Linear, GitHub Issues 등)도 동일한 확장 포인트로 연결 가능.

### 12-5 확장: PR 생성

Ship Phase에서 PR을 생성한다. **PR 확장이 비활성이면 Ship은 CLAUDE.md 업데이트 + 아카이브로 종료.**

```bash
gh pr create \
  --title "feat: {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
{Spec 요약 — 1-3문장}

## Changes
{슬라이스별 변경 요약}

## Design Doc
- Spec: workflow_docs/spec/{feature}.md
- Design: workflow_docs/design/{feature}.md

## Test Plan
{Verify Phase 결과 요약}

## References
- Jira: {SAAS-42} (연결된 경우)
EOF
)"
```

- PR 생성 후 `state.json`의 `feature.pr`에 PR URL 기록
- Ship 재진입 시 `gh pr edit`으로 기존 PR 업데이트 (새 PR 생성 안 함)
- **CI 실패 시 복귀**: `gh pr ready --undo`로 PR을 draft 전환 후 `/workflow back verify` 또는 `/workflow back implement`로 복귀하여 원인 해결. Ship 재진입 시 기존 PR 업데이트

> `gh`(GitHub CLI) 기준이지만, GitLab(`glab`) 등 다른 플랫폼도 동일한 확장 포인트에서 대체 가능.

### 12-6 확장: 브랜치 전략

`/workflow start` 시 feature branch를 생성한다. **비활성이면 현재 브랜치에서 그대로 작업.**

```
main (또는 develop)
  └── feat/{slug}              ← 기본
  └── feat/{jira-id}-{slug}   ← 이슈 트래커 연결 시
```

| 시점 | 동작 |
|------|------|
| `/workflow start` | `feat/{slug}` 브랜치 생성 + 전환. 이미 존재하면 전환만 |
| 기어 1 | 브랜치 생성 안 함 (워크플로우 미진입이므로) |
| `/workflow abort` | 브랜치 유지 — git 조작 없음 |

생성된 브랜치명은 `state.json`의 `feature.branch`에 기록.

> Trunk-based development 프로젝트에서는 이 확장을 비활성화하고 현재 브랜치에서 직접 작업한다.

### 12-7 확장: CI/CD 파이프라인

PR 생성 후 CI/CD를 통한 외부 검증. **CI 확장이 비활성이면 Verify Phase의 로컬 검증이 최종 품질 게이트.**

워크플로우 품질 게이트와 CI/CD 계층의 관계:

```
Layer 1 (실시간)     ← Claude Code Hooks (§6): phase-guard, context-inject  [항상]
Layer 2 (커밋 시점)  ← Git pre-commit: lint, type check, commit msg 검증   [확장]
Layer 3 (CI/CD)      ← GitHub Actions: test + coverage + AI review          [확장]
Layer 4 (인간 리뷰)  ← PR reviewer (기어 3 인간 게이트와 연결)               [확장]
```

Layer 1만으로도 워크플로우는 동작한다. Layer 2-4는 프로젝트 환경에 맞게 추가.

#### Git Pre-commit Hooks

Claude Code Hooks(§6)와는 별개로, `git commit` 시점에 개입하는 git pre-commit 프레임워크:

```yaml
# .pre-commit-config.yaml (Python 프로젝트 참고 구성)
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks:
      - id: ruff           # 린트
      - id: ruff-format    # 포맷
  - repo: https://github.com/DetachHead/basedpyright
    hooks:
      - id: basedpyright   # 타입 체크
  - repo: https://github.com/commitizen-tools/commitizen
    hooks:
      - id: commitizen     # Conventional Commits 검증
```

#### GitHub Actions 참고 구성

```yaml
# .github/workflows/ci.yml (Python + GitHub Actions 참고 구성)
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: pytest --cov --cov-report=xml
      - run: ruff check .
      - run: pyright

  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
```

> 위는 Python + GitHub Actions 기준 참고 구성이며, 프로젝트 tech stack에 맞게 대체한다.

### 12-8 전체 확장 활성화 흐름 요약

기본 흐름(확장 없이)은 §12-2 참조. 아래는 전체 확장 활성화 시의 흐름:

```
전체 확장 활성화 시:

/workflow start user-notifications --jira SAAS-42
    │
    ├── [이슈 트래커] SAAS-42 조회 → 컨텍스트
    ├── [브랜치] feat/saas-42-user-notifications 생성
    └── state.json 생성
        │
        ▼
    Specify → Design → Implement (슬라이스별 커밋)
        │                          └── [커밋 검증] pre-commit: ruff + pyright
        ▼
    Verify → Ship
        │
        ├── [PR] gh pr create → [CI] GitHub Actions + AI review
        ├── [이슈 트래커] In Progress → In Review
        ├── CLAUDE.md 학습 기록
        └── state.json → history/ 아카이브
```

---

## 13. 점진적 도입 로드맵

한 번에 다 구현하지 않는다. 각 단계만으로도 독립적으로 가치가 있다.

| 단계 | 구현 항목 | 즉각적 효과 |
|------|----------|-----------|
| **1단계** | CLAUDE.md에 기어 규칙 + Phase 순서 작성 (CLAUDE.md 템플릿은 별도 정의) | AI가 규칙 인지, 자율적으로 따름 |
| **2단계** | `phase-guard.sh` Hook 추가 (→ §6-2) | Specify/Design 미완료 시 코드 수정 차단 |
| **3단계** | `/workflow` Skill 구현 (start, next, status) (→ §3). SKILL.md 및 phase reference 파일 구조는 별도 정의 | 명시적 상태 전환 + state.json |
| **4단계** | `/workflow next` 2단계 동작 (→ §3-2) | Phase 내부 초안→검토 사이클 |
| **5단계** | `/workflow back --slice`, `/workflow back [phase]` (→ §3-3) | Slice 재작업 + 장거리 에스컬레이션 |
| **6단계** | Hooks 자동화 (→ §6-2) | 기어 자동 감지, 컨텍스트 자동 주입 |
| **7단계** | resume, history, stale 감지 고도화 (→ §11) | 세션 연속성 완성 |
| **8단계** | `.review.md` 사이드카 + 자동 게이트 체크 (→ §9) | 리뷰 이슈 추적 + 차단 게이트 |
| **9단계** | Viewpoint 카탈로그 + 서브에이전트 분리 실행 (→ §8-0) | 자동 게이트 후 질적 검토, 관점별 독립 리뷰 |
| **10단계** | 외부 도구 확장 (→ §12) | 브랜치 전략, 이슈 트래커, PR 생성, CI 파이프라인 (프로젝트 환경에 따라 선택 활성화) |

**1단계만으로도 기어 2-3 워크플로우가 작동한다** — AI가 CLAUDE.md를 읽고 규칙을 따르기 때문이다. 이후 단계는 강제력과 자동화를 추가하는 것이다.

---

## 14. 기존 솔루션과의 반복 패턴 비교

| 반복 패턴 | bkit PDCA | Roo Code Boomerang | SPARC | Boris Cherny | 이 설계 |
|-----------|-----------|-------------------|-------|--------------|--------|
| **Phase 내부 초안→리뷰** | Evaluator-Optimizer 자동 루프 (최대 5회) | Refinement 모드 명시적 | Refinement Phase 분리 | Plan 1-6회 왕복 토론 | `/workflow next` 2단계 + `draftCount` |
| **부분 재작업** | 갭 분석 후 해당 항목만 재시도 | sub-task 재위임 | N/A | N/A | `/workflow back --slice N` |
| **장거리 에스컬레이션** | Act → Plan (전체 사이클 재시작) | Orchestrator 재라우팅 | N/A | N/A | `/workflow back [target-phase]` + `designStale` |
| **자동화 수준** | AI 자율 (인간 개입 최소) | AI 자율 (모드별 권한 분리) | AI 자율 | 인간 주도 | **인간 주도** (AI 검토 + 인간 승인) |
| **문서 버전 관리** | docs/01-plan/ 덮어쓰기 | specs/feature/ 단일 파일 | 없음 | docs/plan/*.md 덮어쓰기 | Living doc + `.review.md` 사이드카 + 내장 변경 이력 |
| **종료 조건** | 90% 임계값 (자동) | 없음 (개발자 판단) | 없음 | 없음 (느낌) | 자동 게이트 + Viewpoint 질적 검토 + 인간 게이트 (기어 3) |
| **리뷰 관점** | 단일 Evaluator | 모드별 분리 (권한 격리) | N/A | 단일 관점 | Viewpoint 카탈로그 (선택적 활성화 + 독립 실행) |
