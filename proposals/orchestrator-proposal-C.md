# Proposal C: 하이브리드 오케스트레이터

> **핵심 혁신**: 단일 상태 파일(`.workflow/state.json`)을 중심으로 Skill 커맨드, Hooks, 기어 자동 감지를 통합한 워크플로우 오케스트레이터
> 작성일: 2026-03-05
> 기반 연구: 11-workflow-design, 03-real-world-workflows, 05-agent-orchestration, 09-new-tools-deep-dive, specify-design-split-final

---

## 1. 설계 동기

### 기존 접근법의 한계

| 접근법 | 문제 |
|--------|------|
| **순수 Skill 커맨드 (Proposal A)** | 매번 수동으로 `/phase` 호출 필요. 기어 1-2에서는 과도한 의식(ceremony). 상태를 기억하지 못해 세션이 끊기면 컨텍스트 유실 |
| **순수 Hooks 자동화 (Proposal B)** | 암묵적 전환으로 현재 어떤 단계인지 불투명. 복잡한 기능에서 세밀한 제어 불가. Hooks만으로는 "왜 이 단계에 있는지" 추적 어려움 |

### 하이브리드가 해결하는 것

**단일 상태 파일이 "기관 기억" 역할을 수행한다.**

- 인간과 AI 모두 읽고 쓸 수 있는 JSON 파일
- 세션이 끊기거나 `/compact`로 컨텍스트가 압축되어도 상태 유지
- Hooks가 상태를 **읽어서** 현재 단계에 맞는 품질 게이트 자동 적용
- Skill 커맨드가 상태를 **쓰면서** 명시적 단계 전환 수행
- 기어에 따라 자동(1-2단) 또는 수동(3-4단) 흐름 선택

---

## 2. 전체 아키텍처

```
                    ┌─────────────────────────────────┐
                    │     .workflow/state.json         │
                    │     (Single Source of Truth)     │
                    │                                 │
                    │  phase, gear, slices, feedback,  │
                    │  context, progress, history      │
                    └───────┬──────────┬──────────────┘
                            │          │
                    ┌───────▼──┐  ┌────▼───────────┐
                    │  Hooks   │  │ Skill Commands │
                    │ (읽기)   │  │ (읽기+쓰기)     │
                    │          │  │                │
                    │ 품질 게이트│  │ 단계 전환       │
                    │ 컨텍스트  │  │ 기어 설정       │
                    │  주입    │  │ 피드백 기록      │
                    │ 금지사항  │  │ 진행률 갱신      │
                    │  적용    │  │                │
                    └──────────┘  └────────────────┘
                            │          │
                    ┌───────▼──────────▼──────────────┐
                    │        Claude Code Session       │
                    │                                  │
                    │  Plan Mode ← → Implementation    │
                    │  Agent Tool (서브에이전트)         │
                    │  --resume / /compact              │
                    └──────────────────────────────────┘
```

---

## 3. 상태 파일 스키마

### 3-1 전체 스키마 (`/.workflow/state.json`)

```json
{
  "$schema": "workflow-state-v1",
  "feature": {
    "name": "user-notifications",
    "slug": "user-notifications",
    "jira": "SAAS-42",
    "branch": "feat/user-notifications",
    "startedAt": "2026-03-05T09:00:00Z"
  },
  "gear": {
    "detected": 3,
    "override": null,
    "reason": "신규 기능, 영향 파일 7개 예상"
  },
  "phase": {
    "current": "design",
    "status": "in_progress",
    "history": [
      {
        "phase": "specify",
        "status": "approved",
        "startedAt": "2026-03-05T09:00:00Z",
        "completedAt": "2026-03-05T09:25:00Z",
        "sessionId": "session-abc123",
        "iterations": 1
      }
    ]
  },
  "specify": {
    "document": "docs/spec/user-notifications.md",
    "requirements": ["R1", "R2", "R3", "R4", "R5"],
    "constraints": ["C1"],
    "approvedBy": "human",
    "approvedAt": "2026-03-05T09:25:00Z"
  },
  "design": {
    "document": "docs/design/user-notifications.md",
    "adr": [],
    "slices": [
      {
        "id": "A-1",
        "name": "Notification 모델 + 마이그레이션",
        "group": "A",
        "status": "pending",
        "acs": ["R1"],
        "dependencies": [],
        "files": ["notifications/models.py", "notifications/migrations/"]
      },
      {
        "id": "A-2",
        "name": "Signal handler 연결",
        "group": "A",
        "status": "pending",
        "acs": ["R1", "R2"],
        "dependencies": ["A-1"],
        "files": ["notifications/signals.py"]
      },
      {
        "id": "B-1",
        "name": "알림 목록 API",
        "group": "B",
        "status": "pending",
        "acs": ["R3", "R4"],
        "dependencies": ["A-1"],
        "files": ["notifications/views.py", "notifications/urls.py"]
      }
    ],
    "feedback": [],
    "iterations": 1
  },
  "implement": {
    "currentSlice": null,
    "completedSlices": [],
    "commits": [],
    "testResults": {
      "passed": 0,
      "failed": 0,
      "lastRun": null
    }
  },
  "verify": {
    "checks": {
      "allTestsPass": null,
      "lintClean": null,
      "typeCheckPass": null,
      "acCoverage": null,
      "securityScan": null,
      "reviewSession": null
    },
    "issues": []
  },
  "ship": {
    "pr": null,
    "ciStatus": null,
    "reviewers": [],
    "mergedAt": null
  },
  "context": {
    "loadOnResume": [
      "docs/spec/user-notifications.md",
      "docs/design/user-notifications.md"
    ],
    "referencePatterns": [
      "apps/comments/models.py:Comment",
      "apps/analytics/signals.py:track_event"
    ],
    "relatedAdrs": []
  },
  "meta": {
    "createdAt": "2026-03-05T09:00:00Z",
    "updatedAt": "2026-03-05T10:15:00Z",
    "lastSessionId": "session-def456",
    "totalDesignSpecIterations": 1,
    "totalImplementVerifyIterations": 0,
    "workflowVersion": "1.0"
  }
}
```

### 3-2 스키마 설계 원칙

| 원칙 | 설명 |
|------|------|
| **인간 가독성** | JSON이지만 의미가 자명한 필드명 사용. `jq`나 에디터로 직접 확인 가능 |
| **AI 파서블** | 구조화된 데이터로 AI가 정확히 파싱. 자연어 해석 불필요 |
| **최소 충분** | 각 단계에 필요한 정보만 포함. 거대한 문서 내용은 파일 참조(경로)로 대체 |
| **추적 가능** | history 배열로 모든 단계 전환 기록. iterations로 피드백 횟수 추적 |
| **세션 독립** | sessionId를 기록하되 특정 세션에 종속되지 않음. 어떤 세션이든 state.json만 읽으면 재개 가능 |

### 3-3 핵심 필드 상세

#### `gear` — 기어 감지 및 설정

```json
{
  "gear": {
    "detected": 3,
    "override": null,
    "reason": "신규 기능, 영향 파일 7개 예상"
  }
}
```

- `detected`: 자동 감지된 기어 (1-4)
- `override`: 인간이 수동 변경한 경우 (`/workflow gear 4`)
- `reason`: 감지 근거 (투명성)
- 실제 적용 기어 = `override ?? detected`

#### `phase` — 현재 단계 + 이력

```json
{
  "phase": {
    "current": "design",
    "status": "in_progress",
    "history": [...]
  }
}
```

유효한 `current` 값:
```
specify → design → implement → verify → ship
                        ↑          │
                        └──────────┘  (verify 실패 시)
```

유효한 `status` 값:
```
not_started → in_progress → completed | blocked
```

#### `design.feedback` — Design → Specify 피드백 루프

```json
{
  "feedback": [
    {
      "id": "FB-1",
      "type": "infeasibility",
      "description": "R3의 '1초 이내 AI 분류' 불가능. 모델 추론 3초.",
      "alternatives": [
        {"option": "A", "description": "3초로 완화", "tradeoff": "UX 저하"},
        {"option": "B", "description": "경량 모델 사용", "tradeoff": "정확도 85%→70%"},
        {"option": "C", "description": "비동기 처리", "tradeoff": "UX 패턴 변경 필요"}
      ],
      "resolution": null,
      "resolvedAt": null
    }
  ]
}
```

피드백이 기록되면:
1. `phase.status` → `"blocked"` (자동)
2. 인간에게 알림 (Hooks 경유)
3. 인간이 대안 선택 → `resolution` 기록
4. Specify 문서 수정 → Design 재실행 → `iterations` 증가

#### `context.loadOnResume` — 세션 재개 시 컨텍스트

```json
{
  "context": {
    "loadOnResume": [
      "docs/spec/user-notifications.md",
      "docs/design/user-notifications.md"
    ],
    "referencePatterns": [
      "apps/comments/models.py:Comment"
    ]
  }
}
```

- 새 세션 시작 시 `UserPromptSubmit` 훅이 이 목록을 읽어 컨텍스트 주입
- 단계별로 필요한 문서만 로드 (전체 로딩 방지)
- `referencePatterns`: Design의 "참조 패턴"을 여기에도 기록하여 Implement 시 활용

---

## 4. 기어 시스템 통합

### 4-1 기어 자동 감지 알고리즘

```
워크플로우 시작 시:
  1. 사용자 요청 분석
  2. 코드베이스 탐색 (영향 범위 추정)
  3. 기어 결정

판별 기준:
┌─────────────────────────────────────────────────────────┐
│ "이 변경을 한 문장으로 설명할 수 있는가?"                    │
│                                                         │
│  Yes ─┬─ 1개 파일, 단순 수정 ──────────── → 기어 1 (즉시) │
│       └─ 1-2개 파일, 로직 변경 ─────────── → 기어 2 (경량) │
│                                                         │
│  No ──┬─ 3-10 파일, 신규 기능 ────────── → 기어 3 (표준)   │
│       └─ 10+ 파일, 아키텍처 변경 ──────── → 기어 4 (풀)    │
└─────────────────────────────────────────────────────────┘
```

### 4-2 기어별 워크플로우 분기

```
기어 1 (즉시):
  상태 파일: 생성 안 함
  바로 구현 → 자동 lint → 커밋
  총 소요: ~5분

기어 2 (경량):
  상태 파일: 미니멀 (feature + phase만)
  Plan Mode 진입 → 코드 탐색 → 구현 → 테스트 → 커밋
  총 소요: ~30분

기어 3 (표준):        ← 가장 빈번한 사이클
  상태 파일: 전체 스키마
  /workflow start → Specify → Design → Implement(TDD) → Verify → Ship
  총 소요: 수 시간

기어 4 (풀):
  상태 파일: 전체 스키마 + 에이전트 팀 설정
  /workflow start → Specify(인터뷰) → Design(대안검토+ADR) →
  Implement(TDD, 멀티에이전트) → Verify(별도세션 리뷰) → Ship
  총 소요: 1-2일
```

### 4-3 기어에 따른 상태 파일 차이

| 항목 | 기어 1 | 기어 2 | 기어 3 | 기어 4 |
|------|--------|--------|--------|--------|
| state.json 생성 | X | 미니멀 | 전체 | 전체+확장 |
| Specify 문서 | X | X | docs/spec/ | docs/spec/ (인터뷰 기반) |
| Design 문서 | X | Plan Mode 메모 | docs/design/ | docs/design/ + ADR |
| 슬라이스 | X | X | 3-5개 | 5-15개 |
| 대안 검토 | X | X | 해당 시만 | 필수 |
| 에이전트 팀 | X | X | 선택 | 활용 권장 |
| Verify 세션 분리 | X | X | 선택 | 필수 (Writer/Reviewer) |

---

## 5. Skill 커맨드 체계

### 5-1 커맨드 목록

모든 Skill은 `.claude/skills/` 아래 Markdown 파일로 정의한다.

#### 핵심 커맨드

| 커맨드 | 역할 | 상태 파일 영향 |
|--------|------|--------------|
| `/workflow start {feature}` | 워크플로우 초기화 + 기어 감지 | 생성 |
| `/workflow specify` | Specify 단계 진입/재진입 | phase → specify |
| `/workflow design` | Design 단계 진입 | phase → design |
| `/workflow implement` | Implement 단계 진입 | phase → implement |
| `/workflow verify` | Verify 단계 진입 | phase → verify |
| `/workflow ship` | Ship 단계 진입 | phase → ship |

#### 보조 커맨드

| 커맨드 | 역할 | 상태 파일 영향 |
|--------|------|--------------|
| `/workflow status` | 현재 상태 요약 출력 | 읽기만 |
| `/workflow next` | 다음 단계로 자동 전환 (게이트 검사 포함) | phase 전환 |
| `/workflow gear {N}` | 기어 수동 오버라이드 | gear.override 설정 |
| `/workflow feedback` | Design→Specify 피드백 기록 | design.feedback 추가 |
| `/workflow slice {id} done` | 슬라이스 완료 표시 | implement.completedSlices 추가 |

### 5-2 커맨드 상세 설계

#### `/workflow start {feature}` — 진입점

```markdown
---
name: workflow-start
description: >
  새 기능 워크플로우를 시작한다. 기어를 자동 감지하고
  .workflow/state.json을 생성한다.
---

## 실행 절차

1. 사용자의 기능 설명을 분석
2. 코드베이스를 탐색하여 영향 범위 추정
3. 기어 자동 감지 (1-4)
4. `.workflow/state.json` 생성
5. 기어에 따라 다음 단계 안내:
   - 기어 1-2: "바로 구현을 시작합니다"
   - 기어 3-4: "/workflow specify로 명세 작성을 시작하세요"

## 기어 감지 기준

- 사용자 설명의 복잡도
- 영향 받는 파일 수 (git grep, glob 기반)
- 신규 모듈 생성 여부
- 아키텍처 변경 여부

## 결과 출력

현재 기능: {feature}
감지된 기어: {N}단 ({reason})
상태 파일: .workflow/state.json 생성 완료

다음 단계: {기어별 안내}
```

#### `/workflow next` — 자동 진행

```markdown
---
name: workflow-next
description: >
  현재 단계의 완료 조건을 확인하고, 충족되면 다음 단계로 전환한다.
  충족되지 않으면 미충족 항목을 알려준다.
---

## 단계별 완료 게이트

### Specify → Design
- [ ] docs/spec/{feature}.md 파일 존재
- [ ] 요구사항(R)이 1개 이상 정의됨
- [ ] AC가 입출력 예시 형태로 존재
- [ ] 비범위(Out of Scope) 명시

### Design → Implement
- [ ] docs/design/{feature}.md 파일 존재
- [ ] 변경 계획 테이블 존재 (파일, 변경내용, 참조패턴, 관련AC)
- [ ] 슬라이스 최소 1개 정의
- [ ] AC 커버리지 매트릭스에서 모든 R이 매핑됨
- [ ] design.feedback에 미해결 항목 없음

### Implement → Verify
- [ ] 모든 슬라이스 completed
- [ ] 각 슬라이스에 최소 1개 커밋
- [ ] 테스트 전체 통과

### Verify → Ship
- [ ] verify.checks 모든 항목 pass
- [ ] 미해결 issues 없음

### Ship → 완료
- [ ] PR 생성됨
- [ ] CI 통과
- [ ] 인간 리뷰 승인
```

#### `/workflow feedback` — Design→Specify 피드백

```markdown
---
name: workflow-feedback
description: >
  Design 단계에서 Specify의 문제를 발견했을 때 피드백을 기록한다.
  자동으로 phase를 blocked 상태로 변경하고 인간의 의사결정을 요청한다.
---

## 피드백 구조

모든 피드백은 다음 형식을 따른다:
- **문제**: 무엇이 실현 불가능하거나 불일치하는가
- **대안**: 2-3개 (각각 트레이드오프 포함)
- **권장**: AI가 추천하는 대안과 이유

## 피드백 후 흐름

1. state.json에 feedback 항목 추가
2. phase.status → "blocked"
3. 인간에게 대안 제시 + 선택 요청
4. 인간 결정 후:
   - Specify 문서 수정
   - /workflow design으로 재진입
   - design.iterations 증가

## 최대 반복 제한

- Specify ↔ Design 왕복: 최대 3회
- 3회 초과 시: 기능 범위 분할 권고
```

#### `/workflow status` — 상태 대시보드

```markdown
---
name: workflow-status
description: >
  .workflow/state.json을 읽어 현재 워크플로우 상태를 보기 좋게 출력한다.
---

## 출력 예시

워크플로우: user-notifications (SAAS-42)
기어: 3단 (표준)
브랜치: feat/user-notifications

단계 진행:
  [완료] Specify  ─ docs/spec/user-notifications.md (승인됨)
  [진행] Design   ─ docs/design/user-notifications.md
  [대기] Implement
  [대기] Verify
  [대기] Ship

슬라이스 진행: 0/3 완료
  [ ] A-1: Notification 모델 + 마이그레이션
  [ ] A-2: Signal handler 연결
  [ ] B-1: 알림 목록 API

미해결 피드백: 없음
마지막 세션: session-def456 (2시간 전)
```

---

## 6. Hooks 설정

### 6-1 전체 Hooks 구성 (`.claude/settings.json`)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "command": "cat .workflow/state.json 2>/dev/null | jq -r '\"[Workflow: \" + .feature.name + \" | Phase: \" + .phase.current + \" | Gear: \" + (.gear.override // .gear.detected | tostring) + \"단]\"' 2>/dev/null || true",
        "description": "워크플로우 상태 컨텍스트 주입"
      },
      {
        "command": "if [ -f .workflow/state.json ]; then PHASE=$(jq -r '.phase.current' .workflow/state.json); if [ \"$PHASE\" = \"specify\" ]; then echo '[Phase Rule] Specify 단계: 코드 작성 금지. 기술 용어(파일명, 라이브러리명) 사용 금지. What/Why만 다룰 것.'; elif [ \"$PHASE\" = \"design\" ]; then echo '[Phase Rule] Design 단계: 코드 작성 금지. Plan Mode로 코드베이스 탐색 후 변경 계획을 자연어로 기술할 것.'; elif [ \"$PHASE\" = \"implement\" ]; then SLICE=$(jq -r '.implement.currentSlice // \"없음\"' .workflow/state.json); echo \"[Phase Rule] Implement 단계: TDD 사이클 (Red→Green→Refactor). 현재 슬라이스: $SLICE\"; elif [ \"$PHASE\" = \"verify\" ]; then echo '[Phase Rule] Verify 단계: 구현 코드 수정 금지. 검증만 수행. Writer/Reviewer 분리 원칙.'; fi; fi",
        "description": "단계별 제약사항 주입"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "if [ -f .workflow/state.json ]; then PHASE=$(jq -r '.phase.current' .workflow/state.json); GEAR=$(jq -r '.gear.override // .gear.detected' .workflow/state.json); if [ \"$GEAR\" -ge 3 ] && ([ \"$PHASE\" = \"specify\" ] || [ \"$PHASE\" = \"design\" ]); then DEST=\"$CLAUDE_TOOL_INPUT_FILE_PATH\"; case \"$DEST\" in docs/spec/*|docs/design/*|docs/adr/*|.workflow/*) ;; *) echo \"BLOCKED: $PHASE 단계에서 코드 파일 수정 불가. /workflow next로 다음 단계로 이동하세요.\"; exit 2;; esac; fi; fi",
        "description": "Specify/Design 단계에서 코드 편집 차단 (기어 3+)"
      },
      {
        "matcher": "Bash",
        "command": "echo \"$CLAUDE_TOOL_INPUT_COMMAND\" | grep -qE 'rm\\s+-rf|git\\s+push.*--force|git\\s+reset.*--hard' && echo 'BLOCKED: 위험 명령어 차단' && exit 1 || true",
        "description": "위험 명령어 차단"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "case \"$CLAUDE_TOOL_INPUT_FILE_PATH\" in *.py) ruff check --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null && ruff format \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null;; esac; true",
        "description": "Python 파일 자동 lint/format"
      }
    ],
    "Stop": [
      {
        "command": "if [ -f .workflow/state.json ]; then jq --arg ts \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" --arg sid \"${CLAUDE_SESSION_ID:-unknown}\" '.meta.updatedAt = $ts | .meta.lastSessionId = $sid' .workflow/state.json > .workflow/state.tmp && mv .workflow/state.tmp .workflow/state.json; fi",
        "description": "세션 종료 시 상태 파일 타임스탬프 갱신"
      }
    ]
  }
}
```

### 6-2 Hooks 동작 상세

#### UserPromptSubmit — 컨텍스트 자동 주입

매 프롬프트마다 현재 워크플로우 상태를 AI에게 주입한다. AI가 "지금 어떤 단계에 있는지" 항상 인식하게 된다.

```
사용자 입력: "알림 모델을 만들자"

Hooks 주입 결과:
[Workflow: user-notifications | Phase: implement | Gear: 3단]
[Phase Rule] Implement 단계: TDD 사이클 (Red→Green→Refactor). 현재 슬라이스: A-1

→ AI는 자동으로 TDD 사이클을 따르며 Slice A-1을 진행
```

#### PreToolUse — 단계별 편집 제한

기어 3 이상의 워크플로우에서:
- **Specify 단계**: `docs/spec/` 파일만 편집 허용. 코드 파일 차단
- **Design 단계**: `docs/design/`, `docs/adr/` 파일만 편집 허용. 코드 파일 차단
- **Implement 단계**: 모든 파일 편집 가능
- **Verify 단계**: 코드 편집 차단 (검증만)

이 제한은 Kiro의 spec-driven 패턴과 Roo Code의 모드별 권한 격리에서 영감을 받았다.

#### Stop — 세션 종료 시 상태 보존

세션이 종료될 때 자동으로 `meta.updatedAt`과 `meta.lastSessionId`를 갱신한다. 다음 세션에서 `--resume` 없이도 상태 파일만으로 어디까지 진행했는지 파악 가능하다.

---

## 7. 워크플로우 흐름 상세

### 7-1 기어 3 표준 흐름 (가장 빈번)

```
┌────────────────────────────────────────────────────────────────┐
│  /workflow start "사용자 알림 시스템"                              │
│                                                                │
│  → 기어 자동 감지: 3단                                           │
│  → .workflow/state.json 생성                                    │
│  → "기어 3: /workflow specify로 시작하세요"                       │
└────────────────────────┬───────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  /workflow specify                                             │
│                                                                │
│  → Plan Mode 진입 (Shift+Tab)                                  │
│  → AI 인터뷰: 5단계 질문으로 요구사항 구조화                        │
│  → docs/spec/user-notifications.md 작성                        │
│  → state.json 갱신: specify.requirements, specify.constraints  │
│  → 인간 승인 → state.specify.approvedBy = "human"               │
│                                                                │
│  Hooks 보호: 이 단계에서 코드 파일 Edit/Write → BLOCKED          │
└────────────────────────┬───────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  /workflow design                                              │
│                                                                │
│  → Plan Mode에서 코드베이스 탐색                                  │
│  → 기존 패턴 파악 (참조 패턴 수집)                                │
│  → 대안 검토 (해당 시)                                           │
│  → docs/design/user-notifications.md 작성                      │
│  → 변경 계획 테이블 + 슬라이스 분해 + AC 커버리지                   │
│  → state.json 갱신: design.slices[], context.referencePatterns │
│  → 인간 승인                                                    │
│                                                                │
│  피드백 발견 시:                                                  │
│  → /workflow feedback → state.design.feedback[] 추가            │
│  → phase.status = "blocked"                                    │
│  → 인간 결정 후 /workflow specify로 복귀                          │
│                                                                │
│  Hooks 보호: 이 단계에서 코드 파일 Edit/Write → BLOCKED          │
└────────────────────────┬───────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  /workflow implement                                           │
│                                                                │
│  → state.json에서 슬라이스 목록 로드                              │
│  → 의존성 순서대로 슬라이스 진행                                   │
│  → 각 슬라이스마다 TDD 사이클:                                    │
│      1. 실패 테스트 작성 (Red) — 테스트 의도 참조                  │
│      2. 최소 구현 (Green) — 참조 패턴 활용                        │
│      3. 자동 검증 (lint, type, test) — Hooks                    │
│      4. 커밋 — feat(notifications): {slice} [R1, R2]           │
│      5. /workflow slice {id} done                              │
│  → state.json 갱신: implement.currentSlice, completedSlices   │
│                                                                │
│  컨텍스트 보호:                                                  │
│  → /compact 후에도 state.json이 현재 슬라이스/진행률 보존          │
│  → 세션 재개 시 context.loadOnResume 목록 자동 로드               │
└────────────────────────┬───────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  /workflow verify                                              │
│                                                                │
│  → 전체 테스트 스위트 실행                                        │
│  → lint + type check                                           │
│  → Spec AC 대조 (AC 커버리지 매트릭스 전체 ✅ 확인)               │
│  → Writer/Reviewer 분리 (기어 4: 별도 세션 필수)                 │
│  → state.json 갱신: verify.checks                              │
│                                                                │
│  실패 시:                                                       │
│  → verify.issues[]에 문제 기록                                   │
│  → /workflow implement로 복귀 (해당 슬라이스 재작업)              │
│                                                                │
│  Hooks 보호: 이 단계에서 코드 Edit → BLOCKED (검증만)             │
└────────────────────────┬───────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  /workflow ship                                                │
│                                                                │
│  → PR 생성 (Conventional Commits)                               │
│  → CI 검증 대기                                                  │
│  → 인간 리뷰                                                    │
│  → Memory 업데이트 (패턴, 결정사항 기록)                          │
│  → state.json 갱신: ship.pr, ship.mergedAt                     │
│  → .workflow/state.json 아카이브                                │
└────────────────────────────────────────────────────────────────┘
```

### 7-2 기어 1-2 자동 흐름

```
기어 1 (즉시):
  사용자: "로그 메시지 오타 수정해줘"
  → 기어 1 감지 → state.json 미생성
  → 바로 수정 → PostToolUse Hook(lint) → 커밋
  → 완료 (전체 ~5분)

기어 2 (경량):
  사용자: "로그인 에러 메시지 개선"
  → 기어 2 감지 → 미니멀 state.json 생성
  → Plan Mode 진입 (코드 탐색)
  → 구현 → 테스트 → 커밋
  → 완료 (전체 ~30분)
```

기어 1-2에서는 Skill 커맨드를 호출하지 않아도 된다. Hooks의 `UserPromptSubmit`이 기어를 감지하고 적절한 가이드를 주입한다. 이것은 bkit의 레벨 시스템(Starter/Dynamic/Enterprise)과 유사한 적응형 접근이다.

---

## 8. 크로스 세션 연속성

### 8-1 세션 중단/재개 시나리오

```
세션 1: Specify 완료, Design 진행 중
  → /compact 실행 (컨텍스트 압축)
  → 세션 종료 (Stop Hook → state.json 갱신)

세션 2: 새 세션 시작
  → UserPromptSubmit Hook 실행
  → state.json 읽기: phase=design, status=in_progress
  → "[Workflow: user-notifications | Phase: design | Gear: 3단]" 주입
  → context.loadOnResume 파일들 자동 읽기 안내

  사용자: "계속 진행"
  → AI: state.json에서 현재 Design 단계 확인
  → AI: docs/design/user-notifications.md 읽기
  → AI: Design 작업 재개
```

### 8-2 `--resume` vs 상태 파일

| 방식 | 장점 | 한계 |
|------|------|------|
| `--resume` | 전체 대화 히스토리 복원 | 같은 머신, 같은 세션 ID 필요 |
| **상태 파일** | 어떤 세션/머신에서든 재개 가능 | 대화 히스토리는 없음 (구조화된 진행 상태만) |

**조합 사용 권장:**
- 같은 세션 이어가기 → `--resume`
- 새 세션에서 작업 이어가기 → 상태 파일 읽기
- 팀 멤버가 인수인계 → 상태 파일 + 문서 참조

### 8-3 `/compact` 대응

`/compact`로 컨텍스트가 압축되면 이전 대화 내용이 사라진다. 하지만 상태 파일이 있으므로:

1. 현재 단계, 기어, 진행률 → `state.json`에서 복원
2. 명세/설계 문서 → `context.loadOnResume`에서 재로드
3. 참조 패턴 → `context.referencePatterns`에서 복원
4. 슬라이스 진행 상태 → `implement.currentSlice`, `completedSlices`

이것은 Cline의 Memory Bank 패턴(`activeContext.md`, `progress.md`)을 JSON으로 구조화한 것이다.

---

## 9. 피드백 루프 상세

### 9-1 Design → Specify 피드백

이 피드백 루프는 specify-design-split-final에서 정의한 3가지 시나리오를 상태 파일로 추적 가능하게 만든다.

```
Design 진행 중
    │
    ├── 문제 발견 → /workflow feedback 실행
    │     │
    │     ▼
    │   state.json 변경:
    │     design.feedback[].push({
    │       type: "infeasibility|scope_mismatch|pattern_conflict",
    │       description: "...",
    │       alternatives: [...],
    │       resolution: null
    │     })
    │     phase.status = "blocked"
    │
    ├── 인간에게 출력:
    │     "Design 단계에서 문제를 발견했습니다.
    │      문제: R3 '1초 이내 AI 분류'는 현재 인프라로 불가능
    │      대안 A: 3초로 완화 (UX 저하)
    │      대안 B: 경량 모델 (정확도 ↓)
    │      어떤 대안을 선택하시겠습니까?"
    │
    ├── 인간 결정: "대안 A"
    │     │
    │     ▼
    │   state.json 변경:
    │     design.feedback[0].resolution = "A"
    │     phase.status = "in_progress"
    │     → Specify 문서 R3 수정
    │     → design.iterations++
    │     → meta.totalDesignSpecIterations++
    │
    └── 3회 초과 시:
          "3회 이상 Specify↔Design 왕복. 기능 범위 분할을 권장합니다."
```

### 9-2 Verify → Implement 피드백

```
Verify 진행 중
    │
    ├── 실패 발견 (테스트, AC 미충족 등)
    │     │
    │     ▼
    │   state.json 변경:
    │     verify.issues[].push({
    │       type: "test_failure|ac_missing|security",
    │       slice: "B-1",
    │       description: "R4 미충족 — 읽음 처리 후 카운트 미반영"
    │     })
    │
    ├── 자동 전환: phase → implement
    │     implement.currentSlice = "B-1" (문제 슬라이스)
    │
    └── 수정 후 /workflow verify 재실행
```

---

## 10. Claude Code 기능 통합

### 10-1 Plan Mode 통합

| 단계 | Plan Mode 활용 |
|------|---------------|
| **Specify** | Plan Mode에서 AI 인터뷰 진행. 코드 탐색 없이 순수 요구사항 수집 |
| **Design** | Plan Mode 필수 진입. 코드베이스 탐색(읽기 전용)으로 기존 패턴 파악 후 변경 계획 수립. 이후 Plan Mode 해제하여 문서 작성 |
| **Implement** | Plan Mode 비활성. 바로 코드 편집 모드 |
| **Verify** | Plan Mode 진입 권장. 읽기 전용으로 코드 검토 |

### 10-2 Agent Tool (서브에이전트) 통합

기어 3-4에서 병렬 작업이 필요할 때:

```
Implement 단계에서 독립 슬라이스 병렬 실행:

메인 에이전트 (오케스트레이터)
    │
    ├── Agent(탐색): Slice A-1에 필요한 기존 패턴 조사
    │   → 결과: Comment 모델 패턴 발견
    │
    ├── Agent(구현): Slice A-1 TDD 사이클 실행
    │   → 결과: 모델 + 테스트 + 커밋
    │
    └── Agent(리뷰): Slice A-1 구현 검토
        → 결과: N+1 쿼리 위험 발견

state.json 갱신:
  implement.completedSlices = ["A-1"]
  implement.currentSlice = "A-2"
```

Verify 단계에서 병렬 리뷰 (기어 4):

```
Agent(보안): 입력 검증, SQL injection, XSS
Agent(성능): N+1 쿼리, 인덱스, 캐시
Agent(테스트): 커버리지, 엣지 케이스 미테스트 경로

→ 결과 통합 → verify.checks 갱신
```

### 10-3 Worktree 통합

기어 4의 대규모 병렬 작업:

```bash
# 독립 슬라이스 그룹별 worktree 생성
claude --worktree feat/notifications-group-a  # Slice A 그룹
claude --worktree feat/notifications-group-b  # Slice B 그룹

# 각 worktree에서 state.json의 해당 슬라이스만 진행
# 완료 후 머지 → 통합 테스트
```

### 10-4 `--resume` 통합

```
세션 재개 플로우:

claude --resume
  → 이전 대화 히스토리 복원
  → UserPromptSubmit Hook → state.json 읽기
  → 현재 단계 + 진행률 확인
  → "Slice A-2에서 Red 테스트를 작성하던 중이었습니다. 계속할까요?"
```

---

## 11. 디렉토리 구조

```
프로젝트 루트/
├── .workflow/
│   └── state.json                  # 워크플로우 상태 (핵심!)
│
├── .claude/
│   ├── settings.json               # Hooks 설정
│   ├── skills/                     # Skill 커맨드
│   │   ├── workflow-start.md
│   │   ├── workflow-specify.md
│   │   ├── workflow-design.md
│   │   ├── workflow-implement.md
│   │   ├── workflow-verify.md
│   │   ├── workflow-ship.md
│   │   ├── workflow-next.md
│   │   ├── workflow-status.md
│   │   ├── workflow-feedback.md
│   │   └── workflow-gear.md
│   └── agents/                     # 커스텀 서브에이전트 (선택)
│       ├── researcher.md
│       └── reviewer.md
│
├── docs/
│   ├── spec/                       # Specify 산출물
│   │   └── {feature-name}.md
│   ├── design/                     # Design 산출물
│   │   └── {feature-name}.md
│   └── adr/                        # 아키텍처 결정 (해당 시)
│       └── ADR-NNN-{title}.md
│
├── CLAUDE.md                       # 프로젝트 헌법 (짧게)
│   # 포함 내용:
│   # - 워크플로우 스킬 트리거 조건
│   # - @docs/conventions.md 임포트
│   # - 기어 시스템 간략 설명
│
└── memory/
    └── MEMORY.md                   # 세션 간 학습 기록
```

### CLAUDE.md 최소 내용 (워크플로우 관련)

```markdown
## 워크플로우

- 새 기능 시작: `/workflow start {feature}` 사용
- `.workflow/state.json`이 존재하면 현재 워크플로우 진행 중
- 기어 시스템: 변경 규모에 따라 1-4단 자동 감지
- 상세 프로세스는 `.claude/skills/workflow-*.md` 참조

## 코딩 규칙

@docs/conventions.md
```

---

## 12. 타 도구 패턴과의 비교

### 12-1 영감받은 패턴

| 패턴 | 출처 | 이 제안에서의 적용 |
|------|------|------------------|
| **Spec-Driven Development** | Kiro | Specify 단계에서 요구사항→설계→태스크 순서 강제 |
| **Steering 파일** | Kiro | `context.loadOnResume`으로 단계별 컨텍스트 관리 |
| **PDCA + 상태 추적** | bkit | `state.json`이 PDCA 각 단계의 진행률 추적 |
| **모드별 권한 격리** | Roo Code | Hooks의 PreToolUse로 단계별 편집 제한 |
| **Boomerang 오케스트레이션** | Roo Code | Agent 도구로 슬라이스별 서브에이전트 위임 |
| **Memory Bank** | Cline | `state.json`의 `context` 섹션이 동일 역할 |
| **Evaluator-Optimizer** | bkit | Verify → Implement 자동 피드백 루프 |
| **병렬 스레드** | Amp | Worktree + Agent 팀으로 슬라이스 병렬 진행 |
| **비동기 위임** | Jules | 기어 4에서 반복 작업을 에이전트에 위임 |

### 12-2 차별점

| 기존 도구 | 이 제안 |
|-----------|--------|
| bkit: 241개 유틸, 높은 학습 곡선 | **최소 설정**: state.json + 10개 skill + 5개 hook |
| Kiro: IDE에 종속된 spec 시스템 | **IDE 무관**: 터미널 기반, 어디서든 동작 |
| Roo Code: VS Code 전용 커스텀 모드 | **Claude Code 네이티브**: skill + hook 조합 |
| Cline Memory Bank: 비구조적 마크다운 | **구조화된 JSON**: 프로그래밍적 접근 가능 |

---

## 13. 도입 전략

### 13-1 점진적 도입 (3단계)

```
Phase 1: 기본 (1주)
  └── state.json 스키마 확정
  └── /workflow start, /workflow status 구현
  └── UserPromptSubmit 훅 (상태 주입)
  └── 기어 1-2 자동 흐름 테스트

Phase 2: 핵심 (1-2주)
  └── /workflow specify, design, implement 구현
  └── PreToolUse 훅 (단계별 편집 제한)
  └── PostToolUse 훅 (자동 lint)
  └── 피드백 루프 (/workflow feedback)
  └── 기어 3 전체 사이클 테스트

Phase 3: 고급 (2-3주)
  └── /workflow verify, ship 구현
  └── Agent 팀 통합 (기어 4)
  └── Worktree 병렬 작업
  └── Stop 훅 (상태 자동 보존)
  └── 기어 4 전체 사이클 테스트
```

### 13-2 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| state.json 수동 편집으로 깨짐 | 워크플로우 중단 | JSON Schema 검증 + 백업 (`.workflow/state.json.bak`) |
| Hooks 실행 지연 | UX 저하 | Hook 스크립트를 경량으로 유지 (jq만 사용, 외부 호출 최소) |
| 기어 자동 감지 오류 | 과소/과대 프로세스 적용 | `/workflow gear {N}` 수동 오버라이드 항상 가능 |
| 상태 파일과 실제 진행 괴리 | 잘못된 컨텍스트 로드 | `/workflow status`로 주기적 확인, 수동 교정 가능 |
| 과도한 프로세스로 생산성 저하 | 기어 1-2 작업의 오버헤드 | 기어 1은 state.json 자체를 생성하지 않음 |

---

## 14. 요약

### 한 문장 정의

> **상태 파일(`state.json`)을 중심으로 Hooks가 읽어서 보호하고, Skills가 써서 전환하며, 기어가 자동으로 프로세스 무게를 조절하는 하이브리드 오케스트레이터.**

### 핵심 설계 결정 3가지

1. **상태 파일이 유일한 진실의 원천**: 세션, 도구, 인간 모두가 같은 파일을 읽고 쓴다. 세션이 끊기거나 `/compact`으로 컨텍스트가 사라져도 상태는 살아남는다.

2. **기어로 프로세스 무게를 자동 조절**: 1줄 수정에 풀 사이클을 돌리는 오버킬을 방지. 동시에 대규모 기능에서 프로세스를 건너뛰는 언더킬도 방지.

3. **Hooks는 읽기(보호), Skills는 쓰기(전환)**: 역할이 명확히 분리된다. Hooks는 현재 단계에 맞는 제약을 자동 적용하고, Skills는 명시적 의사결정으로 단계를 전환한다.

---

## 부록: 빠른 참조 카드

```
/workflow start {feature}   새 워크플로우 시작 + 기어 감지
/workflow specify            명세 작성 (What/Why)
/workflow design             설계 작성 (How)
/workflow implement          TDD 구현 (Red→Green→Commit)
/workflow verify             검증 (테스트/리뷰/AC대조)
/workflow ship               PR/CI/머지
/workflow status             현재 상태 확인
/workflow next               다음 단계 (게이트 검사)
/workflow gear {1-4}         기어 수동 변경
/workflow feedback           Design→Specify 이슈 보고
/workflow slice {id} done    슬라이스 완료 표시
```
