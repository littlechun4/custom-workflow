# Proposal A: Skill-Chain 오케스트레이터

> 유형: 사용자 주도 슬래시 커맨드 + 파일시스템 상태 머신
> 영감: bkit PDCA, Boris Cherny 워크플로우, Cline Memory Bank
> 작성일: 2026-03-05
> 상태: draft

---

## 1. 핵심 컨셉

### 1-1 한 줄 요약

**사용자가 `/workflow` 슬래시 커맨드로 단계를 전환하고, 파일시스템이 상태 머신 역할을 하며, 각 단계의 스킬이 체이닝되어 컨텍스트를 전달하는 오케스트레이터.**

### 1-2 설계 원칙

| 원칙 | 설명 |
|------|------|
| **사용자가 운전대** | AI가 자동으로 다음 단계로 진행하지 않음. 인간이 `/workflow next`로 명시적 전환 |
| **파일이 상태** | `.workflow/state.json` + `docs/` 디렉토리 구조가 현재 상태를 결정 |
| **스킬이 단계** | 각 Phase는 독립된 스킬이며, 이전 단계의 산출물을 읽어 컨텍스트를 확보 |
| **기어가 경로** | 기능 크기(1-4단)에 따라 어떤 Phase를 건너뛸지 자동 결정 |
| **문서가 기억** | 세션 간 컨텍스트는 `docs/spec/`, `docs/design/` 산출물이 전달 |

### 1-3 bkit와의 차별점

| 항목 | bkit | 이 오케스트레이터 |
|------|------|----------------|
| Phase 모델 | PDCA (4단계) | Specify → Design → Implement → Verify → Ship (5단계) |
| 상태 관리 | `docs/01-plan/` 등 번호 디렉토리 | `.workflow/state.json` + `docs/{phase}/` |
| 기어 시스템 | 3 레벨 (Starter/Dynamic/Enterprise) | 4단 기어 (즉시/경량/표준/풀) |
| Specify ↔ Design 분리 | Plan 단계에 통합 | 명시적 분리 (What vs How) |
| 자동 반복 | Evaluator-Optimizer (최대 5회) | Verify에서 수동 판단 후 선택적 재시도 |
| 팀 에이전트 | CTO Team 내장 | 선택적 — Implement에서만 활용 |

---

## 2. 상태 모델

### 2-1 Phase 상태 전이도

```
                    ┌─────────────────────────────────────────┐
                    │           .workflow/state.json           │
                    │  { phase, gear, feature, started_at }   │
                    └──────────────────┬──────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     │                                 │                                 │
     ▼                                 ▼                                 ▼
 ┌────────┐  /workflow next   ┌──────────┐  /workflow next   ┌───────────┐
 │SPECIFY │ ──────────────── ►│ DESIGN   │ ──────────────── ►│IMPLEMENT  │
 │ (What) │  exit criteria    │  (How)   │  exit criteria    │  (TDD)    │
 └───┬────┘  충족 시           └────┬─────┘  충족 시           └─────┬─────┘
     │                              │                                │
     │ /workflow back               │ /workflow back                 │
     │◄─────────────────────────────│◄──────────────────────────────│
     │ (Design→Spec 피드백)          │                                │
     │                              │                                │
     │                              │                          /workflow next
     │                              │                                │
     │                              │                                ▼
     │                              │                         ┌───────────┐
     │                              │                         │  VERIFY   │
     │                              │                         │  (Check)  │
     │                              │                         └─────┬─────┘
     │                              │                               │
     │                              │   /workflow back              │ /workflow next
     │                              │◄──────────────────────────────│
     │                              │  (품질 미달 → 재설계)           │
     │                              │                               ▼
     │                              │                         ┌───────────┐
     │                              │                         │   SHIP    │
     │                              │                         │  (Act)    │
     │                              │                         └───────────┘
     │                              │
     │          /workflow abort      │
     └──────────────────────────────┘──────── (어느 단계에서든)
```

### 2-2 기어별 Phase 경로

```
기어 1 (즉시): ─────────────────────────── IMPLEMENT → SHIP
                                            (직접 코딩)

기어 2 (경량): ──────────── DESIGN(light) → IMPLEMENT → SHIP
                            (Plan Mode)

기어 3 (표준): SPECIFY → DESIGN → IMPLEMENT → VERIFY → SHIP

기어 4 (풀):   SPECIFY → DESIGN → IMPLEMENT → VERIFY → SHIP
               (PRD급)   (대안검토)  (TDD+팀)   (별도세션)  (PR+학습)
```

| 기어 | 건너뛰는 Phase | 포함되는 Phase | 판단 기준 |
|------|---------------|--------------|----------|
| 1단 | Specify, Design, Verify | Implement → Ship | 한 줄 수정, 오타, 로그 추가 |
| 2단 | Specify, Verify | Design(light) → Implement → Ship | 1-2 파일 변경, 명확한 버그 |
| 3단 | — | 전체 5단계 | 3-10 파일, 신규 기능 |
| 4단 | — | 전체 5단계 (각 Phase 풀 옵션) | 10+ 파일, 아키텍처급 |

### 2-3 `state.json` 스키마

```json
{
  "version": 1,
  "feature": "user-notifications",
  "gear": 3,
  "phase": "design",
  "phase_history": [
    { "phase": "specify", "started_at": "2026-03-05T10:00:00Z", "completed_at": "2026-03-05T10:25:00Z" },
    { "phase": "design", "started_at": "2026-03-05T10:26:00Z", "completed_at": null }
  ],
  "artifacts": {
    "spec": "docs/spec/user-notifications.md",
    "design": null,
    "implementation_branch": null,
    "verify_report": null,
    "pr_url": null
  },
  "exit_criteria_met": {
    "specify": true,
    "design": false,
    "implement": false,
    "verify": false,
    "ship": false
  },
  "jira_issue": "SAAS-456",
  "created_at": "2026-03-05T10:00:00Z",
  "updated_at": "2026-03-05T10:26:00Z"
}
```

---

## 3. 디렉토리 구조

### 3-1 오케스트레이터 파일 구조

```
프로젝트 루트/
├── .claude/
│   ├── settings.json              # Hooks 설정
│   ├── skills/
│   │   └── workflow/              # 오케스트레이터 메인 스킬
│   │       ├── SKILL.md           # /workflow 커맨드 핸들러
│   │       ├── references/
│   │       │   ├── phase-specify.md    # Specify Phase 상세 지침
│   │       │   ├── phase-design.md     # Design Phase 상세 지침
│   │       │   ├── phase-implement.md  # Implement Phase 상세 지침
│   │       │   ├── phase-verify.md     # Verify Phase 상세 지침
│   │       │   ├── phase-ship.md       # Ship Phase 상세 지침
│   │       │   └── gear-routes.md      # 기어별 경로 정의
│   │       ├── scripts/
│   │       │   ├── state-manager.sh    # state.json CRUD
│   │       │   └── exit-criteria.sh    # 종료 조건 검증
│   │       └── assets/
│   │           ├── spec-template.md    # Specify 템플릿
│   │           └── design-template.md  # Design 템플릿
│   ├── agents/                    # Phase별 전문 에이전트 (선택적)
│   │   ├── specify-interviewer.md
│   │   ├── design-planner.md
│   │   └── implementation-reviewer.md
│   └── hooks/
│       └── workflow-guard.sh      # Phase 침범 방지 훅
│
├── .workflow/                     # 워크플로우 런타임 상태
│   ├── state.json                 # 현재 상태 (gitignored)
│   └── history/                   # 완료된 워크플로우 아카이브
│       └── user-notifications.json
│
├── docs/                          # 산출물 (git 커밋)
│   ├── spec/
│   │   └── user-notifications.md  # Specify 산출물
│   ├── design/
│   │   └── user-notifications.md  # Design 산출물
│   └── adr/
│       └── ADR-012-realtime.md    # 아키텍처 결정 (해당 시)
│
└── CLAUDE.md                      # 워크플로우 트리거 규칙 포함
```

### 3-2 `.gitignore` 정책

```gitignore
# 런타임 상태 (세션 간 복원용이지만 git에는 불필요)
.workflow/state.json

# 보존
# .workflow/history/ → 선택적으로 커밋 가능
# docs/ → 항상 커밋
```

---

## 4. 슬래시 커맨드 설계

### 4-1 커맨드 체계

```
/workflow                          # 현재 상태 표시
/workflow start {feature} [--gear N] [--jira ISSUE-ID]
                                   # 새 워크플로우 시작
/workflow next                     # 다음 Phase로 전환 (종료 조건 검증)
/workflow back [reason]            # 이전 Phase로 되돌리기
/workflow status                   # 상세 진행 상태 + 산출물 링크
/workflow resume                   # 세션 재개 (state.json 로드)
/workflow abort [reason]           # 워크플로우 중단 + 아카이브
/workflow gear [N]                 # 기어 변경 (진행 중에도 가능)
/workflow history                  # 완료/중단된 워크플로우 목록
```

### 4-2 커맨드별 동작 상세

#### `/workflow start {feature} [--gear N] [--jira ISSUE-ID]`

```
실행 흐름:
1. feature 이름으로 .workflow/state.json 초기화
2. --gear 미지정 시 → AI가 기능 설명 기반으로 기어 추천
   "이 기능을 한 문장으로 설명할 수 있나요?"
   → Yes: 1-2단 추천
   → No: 3-4단 추천
   → 인간이 최종 결정
3. --jira 있으면 → Jira 이슈 조회 + 정보를 state에 저장
4. 기어에 따라 첫 Phase 진입:
   - 기어 1: 바로 Implement
   - 기어 2: Design(light)
   - 기어 3-4: Specify
5. Phase 스킬 로드 → 해당 Phase 시작
```

**예시:**
```bash
> /workflow start user-notifications --gear 3 --jira SAAS-456

[workflow] 새 워크플로우 시작
  기능: user-notifications
  기어: 3단 (표준)
  Jira: SAAS-456
  경로: Specify → Design → Implement → Verify → Ship

[workflow] Phase 1/5: SPECIFY 진입
  산출물: docs/spec/user-notifications.md
  스킬 로드: phase-specify.md

기능에 대해 알려주세요. 다음 질문들로 요구사항을 구조화하겠습니다...
```

#### `/workflow next`

```
실행 흐름:
1. 현재 Phase의 종료 조건(Exit Criteria) 검증
2. 미충족 시 → 무엇이 빠졌는지 구체적으로 알려줌
3. 충족 시 → 인간에게 확인 ("다음 단계로 넘어갈까요?")
4. 확인 시:
   a. state.json 업데이트 (현재 Phase completed_at + 다음 Phase started_at)
   b. 다음 Phase 스킬 로드
   c. 이전 Phase 산출물을 컨텍스트로 제공
```

**예시 (종료 조건 미충족):**
```bash
> /workflow next

[workflow] SPECIFY → DESIGN 전환 검증 중...

❌ 종료 조건 미충족:
  ✅ docs/spec/user-notifications.md 파일 존재
  ✅ 요구사항에 [R*] ID 태깅됨
  ❌ AC(인수 기준)에 입출력 예시 없음
  ❌ 비범위(Out of Scope) 섹션 누락

위 항목을 보완한 후 다시 /workflow next를 실행하세요.
```

**예시 (종료 조건 충족):**
```bash
> /workflow next

[workflow] SPECIFY → DESIGN 전환 검증 중...

✅ 모든 종료 조건 충족:
  ✅ Spec 파일 존재 + 구조 완전
  ✅ 요구사항 [R1]-[R5] + 제약사항 [C1]-[C2]
  ✅ AC 입출력 예시 3개
  ✅ 비범위 명시

다음 단계(DESIGN)로 진행할까요? [Y/n]
```

#### `/workflow back [reason]`

```
실행 흐름:
1. 이전 Phase로 상태 되돌리기
2. reason 기록 (state.json phase_history에 rollback 이벤트)
3. 이전 Phase 스킬 재로드
4. 되돌린 이유를 바탕으로 수정 가이드 제공

주요 시나리오:
- Design → Specify: 기술적 실현 불가능 발견
- Verify → Implement: 버그 발견 → 수정 필요
- Verify → Design: 설계 자체 결함 발견
- Implement → Design: 예상치 못한 복잡도 발견
```

#### `/workflow resume`

```
실행 흐름:
1. .workflow/state.json 읽기
2. 현재 Phase + 산출물 파일 확인
3. 마지막 활동 시점부터 변경사항 요약
4. 해당 Phase 스킬 로드 + 컨텍스트 복원

세션 간 컨텍스트 복원 전략:
- state.json → 어디까지 진행했는지
- docs/spec/{feature}.md → 무엇을 만드는지
- docs/design/{feature}.md → 어떻게 만드는지
- git log → 마지막 커밋 이후 변경사항
```

**예시:**
```bash
> /workflow resume

[workflow] 워크플로우 복원
  기능: user-notifications (기어 3)
  현재 Phase: IMPLEMENT (3/5)
  시작: 2026-03-05 10:00
  마지막 활동: 2026-03-05 14:32

  산출물:
    ✅ Spec: docs/spec/user-notifications.md
    ✅ Design: docs/design/user-notifications.md
    🔧 Implement: 진행 중

  구현 진행률:
    ✅ Slice A-1: Notification 모델
    ✅ Slice A-2: Signal handler
    🔧 Slice B-1: 알림 목록 API (진행 중)
    ⬜ Slice B-2: 읽음 처리

  다음 작업: Slice B-1의 테스트 작성부터 계속합니다.
```

---

## 5. Phase별 스킬 설계

### 5-1 워크플로우 메인 스킬

```markdown
# .claude/skills/workflow/SKILL.md

---
name: workflow
description: >
  AI 개발 워크플로우 오케스트레이터. /workflow 커맨드로 Specify→Design→Implement→
  Verify→Ship 단계를 전환하고, 각 단계의 스킬을 체이닝한다.
  사용자가 /workflow, /workflow start, /workflow next 등을 입력할 때 활성화.
argument-hint: "[start|next|back|status|resume|abort|gear|history] [args]"
---

# Workflow Orchestrator

## 커맨드 디스패치

| 서브커맨드 | 동작 |
|-----------|------|
| (없음) / status | 현재 상태 표시 |
| start {feature} | 새 워크플로우 시작 → [references/gear-routes.md] |
| next | 종료 조건 검증 → Phase 전환 → [scripts/exit-criteria.sh] |
| back [reason] | 이전 Phase로 복귀 |
| resume | 세션 복원 → state.json 읽기 |
| abort | 워크플로우 중단 + 아카이브 |
| gear [N] | 기어 변경 |
| history | 완료/중단 워크플로우 목록 |

## Phase 진입 시 행동

현재 Phase에 따라 해당 reference를 로드:
- specify → [references/phase-specify.md]
- design → [references/phase-design.md]
- implement → [references/phase-implement.md]
- verify → [references/phase-verify.md]
- ship → [references/phase-ship.md]

## 상태 관리

모든 상태 변경은 `.workflow/state.json`을 통해 수행.
[scripts/state-manager.sh] 로 읽기/쓰기.
```

### 5-2 Phase 스킬 상세: Specify

```markdown
# .claude/skills/workflow/references/phase-specify.md

## Specify Phase (What)

### 목적
"무엇을, 왜, 어디까지"를 확정한다. 코드 0줄 상태에서 진행.

### 입력
- Jira 이슈 (있을 경우)
- 사용자의 기능 설명

### 산출물
- docs/spec/{feature-name}.md

### 프로세스

1. **문제 정의 확인** — 사용자에게 "이 기능이 왜 필요한가" 질문
2. **5단계 인터뷰** — 아래 질문 흐름으로 요구사항 구조화:
   a. 핵심 사용자 행동 (누가, 무엇을)
   b. 입출력 (구체적 데이터 예시)
   c. 엣지 케이스 (경계 조건, 예외)
   d. 비범위 ("이번에 하지 않을 것")
   e. 제약사항 (성능, 외부 계약)
3. **Spec 문서 생성** — 템플릿 기반으로 docs/spec/{feature}.md 작성
4. **인간 리뷰** — 작성된 Spec을 검토/수정

### 금지사항
- 기술 스택 결정 (Design 영역)
- 파일/함수명 지정 (Design 영역)
- 코드 작성 (Implement 영역)
- "Redis로 캐시" 같은 구현 수단 언급 → "응답 200ms 이내" (제약사항)으로 전환

### 종료 조건 (Exit Criteria)
- [ ] docs/spec/{feature}.md 파일 존재
- [ ] 요구사항에 [R*] ID 태깅
- [ ] AC에 입출력 예시 포함
- [ ] 비범위(Out of Scope) 섹션 존재
- [ ] 기술 용어가 혼입되지 않음 (금지사항 위반 없음)

### 기어별 차이
- 기어 3: 인터뷰 + 문서 생성 (10-20분)
- 기어 4: 인터뷰 + PRD급 문서 + 이해관계자 섹션 (20-30분)
```

### 5-3 Phase 스킬 상세: Design

```markdown
# .claude/skills/workflow/references/phase-design.md

## Design Phase (How)

### 목적
"어떻게, 왜 이 방법으로"를 결정한다. Spec을 받아 코드베이스 기반의 구현 경로 설계.

### 입력
- docs/spec/{feature-name}.md (필수 — 파일에서 직접 읽기)
- 코드베이스 (Plan Mode로 탐색)

### 산출물
- docs/design/{feature-name}.md

### 프로세스

1. **Spec 로드** — docs/spec/{feature}.md 읽기, 요구사항/AC 파악
2. **코드베이스 탐색** — Plan Mode로 기존 패턴, 영향 범위, 재사용 모듈 파악
3. **대안 검토** (기존 패턴 그대로면 생략)
   - 2-3개 접근법의 장단점 분석
   - 인간에게 선택 요청
4. **변경 계획 수립** — 파일별 변경 + 실행 순서 + 참조 패턴 + 관련 AC
5. **TDD 슬라이스 분해** — 구현 단위를 Slice로 분해
6. **AC 커버리지 매트릭스** — 모든 R/C가 최소 1개 Slice에 매핑
7. **인간 승인**

### Design → Spec 피드백
기술적 실현 불가능, 범위 불일치, 기존 패턴과 충돌 발견 시:
- 문제 + 대안 2-3개 + 트레이드오프 형식으로 보고
- 인간 의사결정 후 /workflow back으로 Spec 수정
- 최대 3회 왕복 초과 시 기능 범위 분할 권고

### 금지사항
- 요구사항 재정의 (Specify 영역)
- 범위 확장 (비범위로 이동 또는 후속으로 보고)
- 실제 코드/의사코드 작성 (Implement 영역)

### 종료 조건 (Exit Criteria)
- [ ] docs/design/{feature}.md 파일 존재
- [ ] Spec 참조 링크 포함
- [ ] 변경 계획 테이블의 "참조 패턴" 열 모두 채워짐
- [ ] 모든 R/C가 최소 1개 슬라이스에 매핑 (AC 커버리지)
- [ ] 슬라이스당 "테스트 의도" 명확 (테스트 코드로 변환 가능)
- [ ] 인간 승인 ("approved" 상태)

### 기어별 차이
- 기어 2 (light): Plan Mode에서 변경 계획만 수립 (슬라이스 분해 생략)
- 기어 3: 전체 프로세스
- 기어 4: 전체 프로세스 + 대안 검토 필수 + ADR 생성 권장
```

### 5-4 Phase 스킬 상세: Implement

```markdown
# .claude/skills/workflow/references/phase-implement.md

## Implement Phase (TDD)

### 목적
Design의 슬라이스 계획에 따라 TDD로 구현한다. 슬라이스 단위 반복.

### 입력
- docs/design/{feature-name}.md (필수 — 슬라이스 목록 + AC 매핑)
- docs/spec/{feature-name}.md (참조 — AC 입출력 예시)

### 산출물
- 구현된 코드 + 테스트
- 슬라이스별 원자적 커밋
- Design의 AC 커버리지 ⬜ → ✅ 업데이트

### 프로세스 (슬라이스 단위 반복)

```text
┌──────────────────────────────────────────────────┐
│ Slice N 시작                                      │
│                                                   │
│ 1. Design에서 Slice N의 "테스트 의도" 읽기          │
│ 2. 실패하는 테스트 작성 (Red)          ← 인간/AI   │
│ 3. 최소 구현 (Green)                  ← AI        │
│ 4. 자동 검증:                                     │
│    ├── lint (ruff check --fix + format)           │
│    ├── type check (pyright)                       │
│    └── test (pytest)                              │
│ 5. 인간 확인: "이 코드 이해했나요?"                  │
│ 6. 커밋: feat({scope}): {desc} [R{N}]             │
│ 7. Design AC 커버리지 ⬜ → ✅ 업데이트              │
│ 8. 다음 Slice로 →                                 │
└──────────────────────────────────────────────────┘
```

### 핵심 규칙
- "이 실패하는 테스트를 통과시키는 **최소한의** 코드만 작성해" — 가장 효과적인 프롬프트
- 같은 오류 3회 반복 시 → 접근 방식 변경 (Design 재검토 고려)
- 이해하지 못한 코드는 커밋하지 않음
- Slice 1개 = 커밋 1개

### 종료 조건 (Exit Criteria)
- [ ] Design의 모든 슬라이스 ✅ (AC 커버리지 100%)
- [ ] 전체 테스트 스위트 통과 (pytest)
- [ ] 타입 체크 통과 (pyright)
- [ ] 린트 통과 (ruff check)
- [ ] 기존 테스트 깨뜨리지 않음

### 기어별 차이
- 기어 1: 슬라이스 없이 직접 코딩 → 검증 → 커밋
- 기어 2: Design(light)의 변경 계획에 따라 순차 구현
- 기어 3: TDD 슬라이스 기반 반복
- 기어 4: TDD 슬라이스 + 팀 에이전트 병렬 구현 (선택적)
```

### 5-5 Phase 스킬 상세: Verify

```markdown
# .claude/skills/workflow/references/phase-verify.md

## Verify Phase (Check)

### 목적
구현 결과를 명세/계획과 대조하여 검증한다.

### 입력
- 구현된 코드 (git diff)
- docs/spec/{feature}.md (명세)
- docs/design/{feature}.md (설계)

### 산출물
- 검증 보고서 (터미널 출력 또는 별도 파일)
- 필요시: 수정 사항 목록

### 프로세스

1. **전체 테스트 스위트 실행** — 기존 테스트 포함
2. **Writer/Reviewer 분리** — 가능하면 새 세션(또는 서브에이전트)에서 리뷰
   - 같은 세션의 AI는 자기 코드 문제를 잘 못 봄 (편향)
3. **명세 대조 검사** — Spec의 모든 [R*]가 구현되었는지 체크
4. **보안 기본 검사** — 입력 검증, 인증/인가, SQL injection 등
5. **코드 품질 검사** — N+1 쿼리, 에러 핸들링, 일관성

### 검증 체크리스트
```text
□ 모든 테스트 통과 (pytest)
□ 타입 체크 통과 (pyright)
□ 린트 통과 (ruff check)
□ Spec [R*] 모두 구현됨 (AC 커버리지 100%)
□ Spec AC 입출력 예시와 실제 동작 일치
□ N+1 쿼리 없음
□ 에러 핸들링 적절
□ 보안 취약점 없음
```

### 불합격 시 경로
- 경미한 수정 → Implement로 /workflow back → 수정 후 재검증
- 설계 결함 → Design으로 /workflow back → 재설계 후 재구현
- 요구사항 모호 → Specify로 /workflow back → Spec 명확화

### 종료 조건 (Exit Criteria)
- [ ] 검증 체크리스트 모든 항목 통과
- [ ] 인간이 리뷰 결과 승인

### 기어별 차이
- 기어 3: 자동 검증 + 인간 최종 확인
- 기어 4: 별도 세션 AI 리뷰 + 보안 검토 + 인간 최종 확인
```

### 5-6 Phase 스킬 상세: Ship

```markdown
# .claude/skills/workflow/references/phase-ship.md

## Ship Phase (Act)

### 목적
코드를 배포하고, 프로세스에서 배운 것을 기록한다.

### 입력
- 검증 완료된 코드
- docs/spec/{feature}.md, docs/design/{feature}.md

### 산출물
- PR (GitHub)
- Memory 업데이트 (선택적)
- 워크플로우 아카이브

### 프로세스

1. **PR 생성**
   - 브랜치 푸시
   - PR 제목: Conventional Commits 형식
   - PR 본문: Spec 요약 + 변경 내용 + 테스트 계획
   - Spec/Design 문서 링크 포함
2. **CI 검증 대기**
   - pytest + coverage
   - CodeRabbit / Claude GitHub Action 리뷰
3. **인간 리뷰 대기**
   - 비즈니스 로직, 아키텍처 판단
4. **Memory 업데이트** (선택적)
   - 이번 작업에서 발견한 패턴, 결정 사항
   - CLAUDE.md 또는 memory/ 파일에 기록
5. **워크플로우 아카이브**
   - state.json → .workflow/history/{feature}.json
   - state.json 초기화

### 종료 조건 (Exit Criteria)
- [ ] PR 생성됨
- [ ] state.json 아카이브됨

### 기어별 차이
- 기어 1: 직접 커밋 + 푸시 (PR 생략 가능)
- 기어 2: PR 생성 (간략)
- 기어 3-4: PR 생성 + CI + 인간 리뷰 + Memory 업데이트
```

---

## 6. 컨텍스트 전달 메커니즘

### 6-1 Phase 간 컨텍스트 흐름

```
Specify                Design                 Implement              Verify
┌──────────┐           ┌──────────┐           ┌──────────┐          ┌──────────┐
│ 인터뷰   │           │ 코드베이스│           │ Red 테스트│          │ 전체 검증│
│ ↓        │           │ 탐색     │           │ ↓        │          │          │
│ Spec문서 │──────────►│ ↓        │──────────►│ Green 구현│─────────►│ Spec 대조│
│ 생성     │  읽기     │ Design   │  읽기     │ ↓        │  읽기    │ Design대조│
│          │           │ 문서 생성│           │ 원자 커밋 │          │          │
└──────────┘           └──────────┘           └──────────┘          └──────────┘
     │                      │                      │                     │
     ▼                      ▼                      ▼                     ▼
docs/spec/             docs/design/           git commits          검증 보고서
{feature}.md           {feature}.md           + AC 커버리지 ✅
```

**핵심: 파일 기반 컨텍스트 전달**

각 Phase 스킬이 시작할 때 수행하는 컨텍스트 로딩:

| Phase | 읽는 파일 | 핵심 추출 정보 |
|-------|----------|--------------|
| Design | `docs/spec/{feature}.md` | [R*] 요구사항, AC 입출력, 제약사항, 비범위 |
| Implement | `docs/design/{feature}.md` | 슬라이스 목록, 변경 계획, 참조 패턴, 테스트 의도 |
| Implement | `docs/spec/{feature}.md` | AC 입출력 예시 (테스트 데이터로 활용) |
| Verify | `docs/spec/{feature}.md` | [R*] 체크리스트 (구현 대조용) |
| Verify | `docs/design/{feature}.md` | AC 커버리지 매트릭스 (완료 확인) |
| Ship | `docs/spec/{feature}.md` + `docs/design/{feature}.md` | PR 본문 생성용 요약 |

### 6-2 세션 간 컨텍스트 복원

```
새 세션 시작
     │
     ▼
/workflow resume
     │
     ├── .workflow/state.json 읽기
     │   → 어떤 기능, 어떤 기어, 어떤 Phase
     │
     ├── docs/spec/{feature}.md 읽기
     │   → 무엇을 만드는지
     │
     ├── docs/design/{feature}.md 읽기
     │   → 어떻게 만드는지, 어디까지 했는지 (AC 커버리지)
     │
     ├── git log --oneline 확인
     │   → 마지막 커밋 이후 상태
     │
     └── Phase 스킬 로드 + 작업 재개
```

**세션 간 끊김 없는 이유:**
- 모든 상태가 파일에 있음 (state.json + docs/)
- AI의 대화 히스토리에 의존하지 않음
- `/workflow resume` 한 번으로 전체 컨텍스트 복원
- Design의 AC 커버리지 매트릭스가 진행률 추적

---

## 7. 품질 게이트 (Hooks 연동)

### 7-1 Phase 침범 방지 Hook

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/workflow-guard.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/workflow-guard.sh
#
# Specify/Design Phase에서 소스 코드 수정 차단
# docs/ 디렉토리 수정은 허용

STATE_FILE=".workflow/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0  # 워크플로우 미시작 → 차단 안 함
fi

PHASE=$(jq -r '.phase' "$STATE_FILE")
FILE_PATH=$(echo "$1" | jq -r '.tool_input.file_path // .tool_input.file')

# Specify/Design Phase에서 docs/ 외 파일 수정 차단
if [[ "$PHASE" == "specify" || "$PHASE" == "design" ]]; then
  if [[ "$FILE_PATH" != *"/docs/"* && "$FILE_PATH" != *".workflow/"* ]]; then
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "'"$PHASE"' 단계에서는 소스 코드를 수정할 수 없습니다. docs/ 디렉토리만 수정 가능합니다."
      }
    }'
    exit 0
  fi
fi

exit 0
```

### 7-2 자동 품질 검사 Hook

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && ruff check --fix $FILE && ruff format $FILE",
            "async": true,
            "statusMessage": "Ruff 검사 중..."
          }
        ]
      }
    ]
  }
}
```

### 7-3 종료 조건 검증 스크립트

```bash
#!/bin/bash
# .claude/skills/workflow/scripts/exit-criteria.sh
#
# 사용: exit-criteria.sh <phase> <feature-name>
# 종료 코드: 0 = 충족, 1 = 미충족 (미충족 항목을 stdout에 출력)

PHASE=$1
FEATURE=$2
ERRORS=()

case "$PHASE" in
  specify)
    SPEC="docs/spec/$FEATURE.md"
    [ ! -f "$SPEC" ] && ERRORS+=("Spec 파일 없음: $SPEC")
    ! grep -q '\[R[0-9]' "$SPEC" 2>/dev/null && ERRORS+=("요구사항에 [R*] ID 없음")
    ! grep -qiE '입력|input' "$SPEC" 2>/dev/null && ERRORS+=("AC에 입출력 예시 없음")
    ! grep -qi 'out of scope\|비범위' "$SPEC" 2>/dev/null && ERRORS+=("비범위 섹션 없음")
    ;;
  design)
    DESIGN="docs/design/$FEATURE.md"
    [ ! -f "$DESIGN" ] && ERRORS+=("Design 파일 없음: $DESIGN")
    ! grep -q 'docs/spec/' "$DESIGN" 2>/dev/null && ERRORS+=("Spec 참조 링크 없음")
    ! grep -q '참조 패턴\|Reference' "$DESIGN" 2>/dev/null && ERRORS+=("참조 패턴 열 없음")
    ! grep -q 'approved' "$DESIGN" 2>/dev/null && ERRORS+=("인간 승인(approved) 상태 아님")
    ;;
  implement)
    # 전체 테스트 + 린트 + 타입 체크
    cd "$CLAUDE_PROJECT_DIR" || exit 1
    uv run pytest --tb=no -q 2>&1 | tail -1 | grep -q "passed" || ERRORS+=("테스트 실패")
    uv run ruff check . --quiet 2>&1 | head -1 | grep -q "^$" || ERRORS+=("린트 오류")
    uv run pyright --outputjson 2>&1 | jq '.summary.errorCount' | grep -q "^0$" || ERRORS+=("타입 오류")
    ;;
  verify)
    # 인간 승인 여부는 state.json에서 확인
    STATE=".workflow/state.json"
    VERIFIED=$(jq -r '.exit_criteria_met.verify' "$STATE")
    [ "$VERIFIED" != "true" ] && ERRORS+=("인간 승인 미완료")
    ;;
esac

if [ ${#ERRORS[@]} -eq 0 ]; then
  echo "✅ 모든 종료 조건 충족"
  exit 0
else
  echo "❌ 종료 조건 미충족:"
  for e in "${ERRORS[@]}"; do
    echo "  - $e"
  done
  exit 1
fi
```

---

## 8. 에러 처리 및 복구

### 8-1 실패 시나리오별 복구 전략

```
┌────────────────────────┬──────────────────────────┬───────────────────────────┐
│ 실패 시나리오            │ 감지 방법                 │ 복구 전략                  │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ Spec이 기술용어 포함     │ exit-criteria.sh 검사     │ 수정 가이드 제공 후 재검증   │
│                        │ + AI 분석                │                           │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ Design에서 실현 불가 발견 │ AI가 코드베이스 탐색 중    │ /workflow back → Spec 수정  │
│                        │ 문제 보고                 │ 최대 3회 왕복              │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ TDD Red 테스트 3회 실패  │ 카운터 추적               │ 접근 방식 변경 제안         │
│                        │                          │ → Design 재검토 고려       │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ Implement 중 세션 끊김   │ state.json + git status  │ /workflow resume로 복원    │
│                        │                          │ 마지막 슬라이스부터 재개     │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ Verify에서 설계 결함 발견 │ Verify 리뷰 보고서        │ /workflow back design     │
│                        │                          │ → 재설계 후 재구현          │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ 기어 판단 오류           │ 인간의 인식               │ /workflow gear N로 변경    │
│ (너무 낮게/높게 잡음)     │                          │ Phase 경로 자동 조정       │
├────────────────────────┼──────────────────────────┼───────────────────────────┤
│ state.json 손상/삭제    │ 파일 없음 감지             │ docs/ 산출물 + git log로   │
│                        │                          │ state 재구성 시도          │
└────────────────────────┴──────────────────────────┴───────────────────────────┘
```

### 8-2 기어 변경 시 상태 전이

```
기어 2 → 기어 3 승격 시 (Design 진행 중):
  현재: Design Phase
  변경: Specify Phase 추가 필요
  → "Spec 문서가 없습니다. 현재 Design 내용을 기반으로 Spec을 역생성할까요?"
  → 인간 선택: (A) Spec 역생성 후 Design 계속, (B) Specify부터 재시작

기어 3 → 기어 2 강등 시 (Specify 완료, Design 진행 중):
  현재: Design Phase
  변경: Verify Phase 생략
  → Design 계속 진행 (Verify만 경로에서 제거)

기어 3 → 기어 1 강등 시 (Specify 진행 중):
  현재: Specify Phase
  변경: Specify/Design/Verify 모두 생략
  → "작성 중인 Spec을 보관하고 바로 구현으로 넘어갈까요?"
```

---

## 9. CLAUDE.md 통합

### 9-1 CLAUDE.md에 추가할 내용

```markdown
## Workflow

이 프로젝트는 `/workflow` 스킬로 개발 워크플로우를 관리합니다.

### 워크플로우 사용
- `/workflow start {feature} --gear N` — 새 기능 개발 시작
- `/workflow next` — 다음 단계로 전환
- `/workflow resume` — 이전 세션 이어서 작업
- `/workflow status` — 현재 진행 상태 확인

### 기어 시스템
- 1단: 오타, 1줄 수정 → 바로 구현
- 2단: 1-2 파일 → Plan → 구현
- 3단: 3-10 파일 → Specify → Design → Implement → Verify → Ship
- 4단: 10+ 파일 → 풀 사이클 (대안 검토, 팀 에이전트 등)

### Phase 규칙
- Specify/Design 중에는 소스 코드 수정 금지 (docs/만 수정 가능)
- Implement 중에는 Design의 슬라이스 순서를 따를 것
- 각 슬라이스는 독립적 커밋
```

---

## 10. 구현 로드맵

### Phase 1: MVP (핵심 흐름)

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1 | workflow 메인 스킬 | `.claude/skills/workflow/SKILL.md` |
| 2 | state-manager.sh | 상태 CRUD 스크립트 |
| 3 | phase-specify.md | Specify Phase 지침 |
| 4 | phase-design.md | Design Phase 지침 |
| 5 | phase-implement.md | Implement Phase 지침 |
| 6 | phase-verify.md | Verify Phase 지침 |
| 7 | phase-ship.md | Ship Phase 지침 |
| 8 | exit-criteria.sh | 종료 조건 검증 |
| 9 | spec/design 템플릿 | assets/ 디렉토리 |
| 10 | CLAUDE.md 업데이트 | 워크플로우 트리거 규칙 |

### Phase 2: 강화

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 11 | workflow-guard.sh Hook | Phase 침범 방지 |
| 12 | gear-routes.md | 기어별 경로 정의 |
| 13 | 전문 에이전트 | specify-interviewer, design-planner |
| 14 | /workflow history | 완료 워크플로우 아카이브 |

### Phase 3: 고급

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 15 | 팀 에이전트 통합 | 기어 4 Implement에서 병렬 구현 |
| 16 | Jira 연동 | start에서 이슈 조회, ship에서 상태 전환 |
| 17 | CI/CD 연동 | Ship Phase에서 자동 PR + CodeRabbit |

---

## 11. 장단점 분석

### 장점

| 항목 | 설명 |
|------|------|
| **명시적 제어** | 인간이 모든 Phase 전환을 직접 결정 — 예측 불가능한 AI 자율 행동 방지 |
| **세션 독립성** | 파일 기반 상태 → 세션 끊김에 강건, `/workflow resume`으로 즉시 복원 |
| **점진적 도입** | 기어 1-2는 기존 워크플로우와 거의 동일, 기어 3-4만 풀 사이클 |
| **추적 가능성** | AC-ID + 슬라이스 태깅 + 커버리지 매트릭스 → 무엇이 구현되었고 안 되었는지 명확 |
| **재사용성** | Phase 스킬을 독립적으로 사용 가능 (Design 스킬만 단독 호출 등) |
| **투명성** | 모든 상태가 JSON + Markdown 파일 → 인간이 직접 읽고 수정 가능 |

### 단점

| 항목 | 설명 | 완화 방안 |
|------|------|----------|
| **커맨드 오버헤드** | 매 Phase 전환마다 `/workflow next` 입력 필요 | 기어 1-2에서는 최소화됨 |
| **파일 증가** | `.workflow/` + `docs/spec/` + `docs/design/` 등 | 기어 1-2에서는 생성 안 함 |
| **학습 곡선** | 5개 Phase + 4개 기어 + 슬래시 커맨드 체계 | CLAUDE.md에 간단 가이드 + `/workflow` 만 치면 현재 상태 표시 |
| **유연성 부족** | 정해진 Phase 순서를 따라야 함 | `/workflow back` + 기어 변경으로 유연성 확보 |
| **Hook 의존** | Phase 침범 방지에 Hook 필요 | Hook 없이도 스킬 지침으로 동작 (Hook은 추가 안전장치) |

### 리스크

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 스킬 지침이 너무 길어 AI가 무시 | 중 | 고 | references/ 분리 + 500줄 이하 유지 |
| exit-criteria.sh 오탐 | 중 | 중 | 인간이 override 가능 (`/workflow next --force`) |
| state.json 동기화 이슈 | 저 | 중 | 단일 세션 전제, 병렬 시 worktree 격리 |
| 기어 판단 실수 | 중 | 저 | 언제든 `/workflow gear N`으로 변경 |

---

## 12. 대안 오케스트레이터와의 비교

| 항목 | Proposal A (이것) | Proposal B (예상: CLAUDE.md 중심) | Proposal C (예상: 하이브리드) |
|------|-------------------|--------------------------------|---------------------------|
| 상태 관리 | `.workflow/state.json` | CLAUDE.md 내 체크리스트 | state.json + CLAUDE.md 조합 |
| Phase 전환 | `/workflow next` (명시적) | AI가 체크리스트 보고 자동 판단 | Hook이 상태 감지 + 인간 확인 |
| 컨텍스트 전달 | 파일 읽기 (docs/) | CLAUDE.md 인라인 참조 | 파일 + CLAUDE.md 혼합 |
| 강건성 | 파일 기반 → 매우 강건 | CLAUDE.md 변경 시 취약 | 중간 |
| 오버헤드 | 커맨드 입력 필요 | 최소 (자동) | 중간 |
| 유연성 | 기어 + back/abort | 자유도 높음 | 중간 |

---

## 부록 A: 전체 커맨드 Quick Reference

```
/workflow                      현재 상태 표시
/workflow start {feature}      새 워크플로우 시작
  --gear N                     기어 지정 (1-4, 미지정 시 AI 추천)
  --jira ISSUE-ID              Jira 이슈 연결
/workflow next                 다음 Phase로 (종료 조건 검증)
  --force                      종료 조건 강제 통과
/workflow back [reason]        이전 Phase로 복귀
/workflow status               상세 진행 상태
/workflow resume               세션 복원
/workflow abort [reason]       워크플로우 중단
/workflow gear [N]             기어 변경
/workflow history              완료/중단 워크플로우 목록
```

## 부록 B: 최소 시작 가이드

```bash
# 1. 기능 개발 시작
> /workflow start user-notifications --gear 3

# 2. Specify: AI 인터뷰로 요구사항 정리
#    (AI가 질문, 인간이 답변, Spec 문서 자동 생성)

# 3. 다음 단계로
> /workflow next

# 4. Design: AI가 코드베이스 탐색 후 설계 제안
#    (변경 계획, 슬라이스 분해, 인간 승인)

# 5. 다음 단계로
> /workflow next

# 6. Implement: 슬라이스별 TDD
#    (Red → Green → 커밋, 반복)

# 7. 다음 단계로
> /workflow next

# 8. Verify: 전체 검증
> /workflow next

# 9. Ship: PR 생성 + 아카이브
```

## 부록 C: 세션 간 워크플로우 예시

```
[세션 1 - 오전]
> /workflow start user-notifications --gear 3 --jira SAAS-456
  (Specify 완료, Design 시작)
> /workflow next
  (Design 50% 진행 중 세션 종료)

[세션 2 - 오후]
> /workflow resume
  → "user-notifications, 기어 3, Design Phase, 변경 계획 작성 중"
  (Design 완료)
> /workflow next
  (Implement 시작, Slice A-1, A-2 완료)

[세션 3 - 다음 날]
> /workflow resume
  → "user-notifications, 기어 3, Implement Phase"
  → "Slice A-1 ✅, A-2 ✅, B-1 ⬜, B-2 ⬜"
  (B-1, B-2 구현 완료)
> /workflow next
  (Verify)
> /workflow next
  (Ship → PR 생성 → 완료)
```
