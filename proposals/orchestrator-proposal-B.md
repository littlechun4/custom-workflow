# Proposal B: CLAUDE.md 헌법 + Hooks 기반 암묵적 오케스트레이터

> 작성: 2026-03-05
> 영감: Amazon Kiro (Steering + Spec-Driven), GitHub Spec-Kit (Constitution), Cline Memory Bank
> 핵심 철학: **규칙과 자동화가 명시적 명령을 대체한다**

---

## 1. 설계 철학

### 1-1 핵심 아이디어

이 오케스트레이터는 **명시적 명령 없이도 작동**한다. 워크플로우 규칙은 CLAUDE.md에 "헌법"으로 내재되고, Hooks가 "사법부"처럼 위반을 차단하며, 디렉토리 구조가 "상태 머신"으로 현재 Phase를 표현한다.

```
┌─────────────────────────────────────────────────────┐
│  CLAUDE.md = 헌법 (입법부)                            │
│  "어떤 순서로 무엇을 해야 하는가"                       │
├─────────────────────────────────────────────────────┤
│  Hooks = 사법부 (자동 집행)                            │
│  "규칙 위반을 감지하고 차단한다"                         │
├─────────────────────────────────────────────────────┤
│  디렉토리 구조 = 상태 표현 (행정부)                      │
│  "현재 어떤 단계에 있는가"                              │
├─────────────────────────────────────────────────────┤
│  기어 시스템 = 자동 변속기                              │
│  "작업 크기에 따라 프로세스 강도를 자동 조절"              │
└─────────────────────────────────────────────────────┘
```

### 1-2 Proposal A (스킬 체인)와의 차이

| 측면 | Proposal A: 스킬 체인 | Proposal B: 헌법 + Hooks |
|------|---------------------|------------------------|
| 시작 방식 | `/specify`, `/design` 등 명시적 명령 | 자연어 요청 → 자동 감지 |
| 상태 관리 | 스킬 내부의 체크리스트/상태 파일 | 디렉토리에 파일 존재 여부 |
| 규칙 집행 | 스킬 내 프롬프트 지시 | Hooks가 강제 차단 |
| 간단한 작업 | 기어 1-2용 별도 스킬 필요 | 자동으로 프로세스 생략 (마찰 제로) |
| 확장성 | 새 스킬 추가 | CLAUDE.md 규칙 + Hook 스크립트 추가 |
| 사용자 학습 곡선 | 커맨드 암기 필요 | 규칙이 내재되어 있어 자연스러움 |

### 1-3 설계 원칙

1. **규칙은 암묵적, 집행은 자동적** — 사용자가 워크플로우를 의식하지 않아도 올바른 순서로 진행
2. **파일 존재가 곧 상태** — 별도 상태 파일 없이 `docs/spec/`, `docs/design/` 유무로 판단
3. **기어 자동 변속** — 간단한 작업에 불필요한 프로세스 강요하지 않음
4. **위반 차단, 제안 아닌 강제** — Hooks의 exit code 1로 부적절한 행동을 원천 차단
5. **점진적 도입** — 기본 CLAUDE.md만으로 시작, 필요에 따라 Hook과 규칙 추가

---

## 2. 아키텍처

### 2-1 디렉토리 구조

```
project-root/
├── CLAUDE.md                          # [핵심] 워크플로우 헌법
│
├── .claude/
│   ├── settings.json                  # Hooks 설정 (사법부)
│   ├── hooks/                         # Hook 스크립트
│   │   ├── gear-detect.sh             # 기어 자동 감지
│   │   ├── phase-guard.sh             # Phase 위반 차단
│   │   ├── quality-gate.sh            # 품질 게이트 검증
│   │   └── session-context.sh         # 세션 시작 시 상태 주입
│   ├── rules/                         # 분리된 규칙 파일 (CLAUDE.md에서 @import)
│   │   ├── workflow-constitution.md   # 워크플로우 상세 규칙
│   │   ├── phase-specify.md           # Specify 단계 상세 지침
│   │   ├── phase-design.md            # Design 단계 상세 지침
│   │   ├── phase-implement.md         # Implement 단계 상세 지침
│   │   └── phase-verify.md            # Verify 단계 상세 지침
│   └── agents/                        # 전문화된 에이전트
│       ├── specifier.md               # Specify 전문 에이전트
│       ├── designer.md                # Design 전문 에이전트
│       └── reviewer.md                # Verify 전문 에이전트
│
├── docs/                              # [상태 머신] 파일 존재 = Phase 완료
│   ├── spec/                          # Specify 산출물
│   │   └── {feature-name}.md          # → 이 파일 존재 = Specify 완료
│   ├── design/                        # Design 산출물
│   │   └── {feature-name}.md          # → 이 파일 존재 = Design 완료
│   └── adr/                           # 아키텍처 결정 기록
│       └── ADR-NNN-{title}.md
│
└── memory/
    └── MEMORY.md                      # 세션 간 학습 기록
```

### 2-2 상태 머신: 파일 존재로 Phase 판단

```
Phase 판단 로직:

docs/spec/{feature}.md 없음           → Phase 1: Specify 필요
docs/spec/{feature}.md 있음            → Phase 1 완료
docs/design/{feature}.md 없음          → Phase 2: Design 필요
docs/design/{feature}.md 있음           → Phase 2 완료
docs/design/{feature}.md 에 ⬜ 있음    → Phase 3: Implement 진행 중
docs/design/{feature}.md 에 ⬜ 없음    → Phase 3 완료 (모든 AC ✅)
테스트 전체 통과                         → Phase 4: Verify 가능
```

이 로직은 Hook 스크립트(`phase-guard.sh`)에서 실행되어, 현재 Phase에 맞지 않는 행동을 차단한다.

### 2-3 기어 시스템 — 자동 변속

```
┌──────────┬──────────────────────┬──────────────────────────────────┐
│ 기어      │ 자동 감지 기준         │ 적용되는 워크플로우                 │
├──────────┼──────────────────────┼──────────────────────────────────┤
│ 1단(즉시) │ 1줄 수정, 오타, 로그   │ 바로 구현 (Hooks: 린트만)          │
│ 2단(경량) │ 1-2 파일, 명확한 버그  │ Plan Mode → 구현 (Phase 강제 없음) │
│ 3단(표준) │ 3-10 파일, 신규 기능   │ Specify → Design → TDD → Verify  │
│ 4단(풀)   │ 10+ 파일, 아키텍처    │ 풀 사이클 + ADR + 리뷰             │
└──────────┴──────────────────────┴──────────────────────────────────┘

기어 자동 감지 신호:
- "오타 수정해줘" "이 로그 추가" → 기어 1 (키워드 패턴)
- "이 버그 수정해줘" + 파일 1-2개 → 기어 2 (파일 수 + 키워드)
- "새로운 기능 추가" "API 만들어" → 기어 3 (키워드)
- "인증 시스템" "결제 모듈" "아키텍처 변경" → 기어 4 (키워드 + 규모)
```

**핵심: 기어 1-2는 마찰 제로.** Hooks가 Phase 가드를 적용하는 것은 기어 3-4일 때만.

---

## 3. CLAUDE.md 헌법 — 구체적 설계

### 3-1 메인 CLAUDE.md (간결하게 유지)

```markdown
# {Project Name}

## Quick Facts
- **Stack**: Django 5.x, PostgreSQL, HTMX + Alpine.js
- **Package Manager**: uv
- **Test**: `uv run pytest -x --lf`
- **Lint**: `uv run ruff check . && uv run ruff format .`
- **Type Check**: `uv run pyright`

## Workflow Constitution

이 프로젝트는 기어 기반 워크플로우를 따른다.
상세 규칙: @.claude/rules/workflow-constitution.md

### 기어 판단 (모든 작업 시작 전 수행)
- 1줄 수정, 오타 → **기어 1**: 바로 구현
- 1-2 파일 버그 수정 → **기어 2**: Plan Mode 후 구현
- 신규 기능 (3+ 파일) → **기어 3**: Specify → Design → Implement → Verify
- 아키텍처급 변경 (10+ 파일) → **기어 4**: 풀 사이클 + ADR

### Phase 순서 (기어 3-4)
1. **Specify** (What): `docs/spec/{feature}.md` 작성 → @.claude/rules/phase-specify.md
2. **Design** (How): `docs/design/{feature}.md` 작성 → @.claude/rules/phase-design.md
3. **Implement** (TDD): 슬라이스별 Red→Green→Commit → @.claude/rules/phase-implement.md
4. **Verify** (Check): 명세 대조 + 리뷰 → @.claude/rules/phase-verify.md
5. **Ship**: PR 생성 + Memory 업데이트

### Phase 위반 금지 (Hooks가 강제)
- Specify 없이 Design 작성 금지
- Design 없이 프로덕션 코드 작성 금지 (기어 3-4)
- 테스트 없이 커밋 금지
- 모든 AC가 ✅ 아닌 상태에서 PR 생성 금지

## Code Style
- Python 3.12+ with type hints required
- No `Any` types
- Early returns, avoid nested conditionals
- Function-Based Views (Django)

## Non-obvious Gotchas
- {프로젝트 특수 함정들}
```

### 3-2 워크플로우 헌법 (분리 파일)

`.claude/rules/workflow-constitution.md`:

```markdown
# Workflow Constitution

## Article 1: 기어 자동 감지

모든 작업 요청 시, 먼저 기어를 판단하라.

### 기어 1 (즉시)
**조건**: 다음 키워드/패턴 중 하나에 해당
- 오타, typo, 로그, print, 주석, 상수값 변경
- 변경 파일이 1개이고 변경 라인이 5줄 이내로 예상
**행동**: 바로 구현. Phase 문서 불필요.

### 기어 2 (경량)
**조건**: 다음 모두 충족
- 변경 파일이 1-2개
- 버그 수정이거나 기존 기능의 작은 변경
- "이 변경을 한 문장으로 설명할 수 있다"
**행동**: Plan Mode로 코드 탐색 후 구현. Phase 문서 불필요.

### 기어 3 (표준)
**조건**: 다음 중 하나
- 변경 파일이 3개 이상 예상
- 신규 기능 추가
- 새로운 모델/뷰/URL 패턴 생성
**행동**: Specify → Design → Implement(TDD) → Verify 풀 사이클.

### 기어 4 (풀)
**조건**: 다음 중 하나
- 변경 파일 10개 이상 예상
- 아키텍처 변경 (새 앱, 새 인프라, DB 스키마 대규모 변경)
- 여러 도메인에 걸친 변경
**행동**: 기어 3 + ADR 작성 + 별도 세션 리뷰 (Writer/Reviewer 패턴).

### 기어 불확실 시
사용자에게 질문:
"이 변경의 예상 범위를 확인하겠습니다:
- 변경 파일 수: ?
- 신규 모델/뷰 생성: Y/N
- 기존 API 변경: Y/N
이 정보로 기어를 판단합니다."

## Article 2: Phase 순서 및 전이 조건

### Phase 전이 다이어그램

```
[사용자 요청] → [기어 판단]
                    │
            ┌───────┼───────┐
            ▼       ▼       ▼
        기어 1-2  기어 3   기어 4
        즉시 구현  표준     풀 사이클
                    │       │
                    ▼       ▼
                [Specify]──[Specify]
                    │       │
                    ▼       ▼
                [Design]──[Design + ADR]
                    │       │
                    ▼       ▼
              [Implement]─[Implement]
                    │       │
                    ▼       ▼
               [Verify]──[Verify + 별도 세션 리뷰]
                    │       │
                    ▼       ▼
                 [Ship]───[Ship]
```

### 전이 조건 (Gate)

| From → To | 전이 조건 |
|-----------|----------|
| → Specify | 기어 3-4 판단됨 |
| Specify → Design | `docs/spec/{feature}.md` 존재 + 상태가 `approved` |
| Design → Implement | `docs/design/{feature}.md` 존재 + 상태가 `approved` |
| Implement → Verify | Design의 모든 AC 커버리지가 ✅ |
| Verify → Ship | 전체 테스트 통과 + 리뷰 완료 |

## Article 3: Phase별 금지 행위

### Specify 단계에서 금지
- 기술 스택/라이브러리 결정 (Design 영역)
- 파일명/함수명 지정 (Design 영역)
- 코드 작성 (Implement 영역)

### Design 단계에서 금지
- 요구사항 재정의 (Specify 영역 → 피드백 루프)
- 실제 코드 작성 (Implement 영역)
- 의사코드 작성 (자연어로 기술)

### Implement 단계에서 금지
- 테스트 없이 프로덕션 코드 작성
- Design에 없는 파일 수정 (Design 업데이트 먼저)
- 5개 이상 파일을 테스트 없이 한 번에 변경

## Article 4: 문서 명명 규칙

- Spec: `docs/spec/{kebab-case-feature-name}.md`
- Design: `docs/design/{kebab-case-feature-name}.md`
- ADR: `docs/adr/ADR-{NNN}-{kebab-case-title}.md`
- feature-name은 Spec과 Design에서 동일해야 함 (매핑 키)
```

### 3-3 Phase별 규칙 파일 (예시: Specify)

`.claude/rules/phase-specify.md`:

```markdown
# Phase: Specify (What)

## 역할
"무엇을, 왜, 어디까지"를 확정한다.

## 진입 조건
- 기어 3 또는 4로 판단됨
- 사용자가 새로운 기능을 요청함

## 프로세스

### Step 1: 문제 정의
사용자에게 다음을 확인:
- 이 기능이 왜 필요한가 (1-3문장)
- 누가 사용하는가

### Step 2: AI 인터뷰
AskUserQuestion으로 5단계 질문:
1. 핵심 동작 (Happy Path)
2. 입출력 데이터 형태
3. 예외/에러 상황
4. 기존 시스템과의 관계
5. 비범위 확인

### Step 3: 문서 작성
`docs/spec/{feature-name}.md`에 작성:
- 문제 정의
- 요구사항 ([R1], [R2]... ID 부여, 체크리스트)
- 인수 기준 (입출력 예시 형태)
- 엣지 케이스
- 비범위
- 제약사항 (해당 시)

### Step 4: 사용자 승인
문서 상단의 상태를 `draft → approved`로 변경.
사용자가 승인해야 Design으로 전이 가능.

## 금지사항
- 기술 용어 사용 금지 ("Redis 캐시" ❌ → "응답 200ms 이내" ✅)
- 파일명/함수명 지정 금지
- 코드 작성 금지

## 산출물
- `docs/spec/{feature-name}.md` (상태: approved)

## 종료 조건
"이 기능이 끝나면 뭐가 달라지는가?"에 한 문장으로 답할 수 있어야 함.
```

### 3-4 Phase별 규칙 파일 (예시: Design)

`.claude/rules/phase-design.md`:

```markdown
# Phase: Design (How)

## 역할
"어떻게, 왜 이 방법으로"를 결정한다.

## 진입 조건
- `docs/spec/{feature-name}.md` 존재
- Spec 상태가 `approved`

## 프로세스

### Step 1: 코드베이스 탐색
Plan Mode로 다음을 파악:
- 기존에 유사한 기능이 어떻게 구현되어 있는가
- 어떤 패턴을 따르고 있는가
- 영향받는 파일 범위

### Step 2: 대안 검토 (필요 시)
기존 패턴과 다른 접근이 필요할 때만:
- 2-3개 대안의 장단점 비교
- 채택 근거 기록
- (기어 4) ADR 작성

### Step 3: 변경 계획 수립
테이블 형식으로:
| # | 파일 | 변경 내용 | 참조 패턴 | 관련 AC |

- **참조 패턴**: 기존 코드의 `파일:클래스명` (AI 환각 방지 핵심)
- **관련 AC**: Spec의 [R1], [C1] 등

### Step 4: TDD 슬라이스 분해
각 슬라이스에 명시:
- 테스트 의도 (무엇을 검증하는가)
- 변경 파일 (1-3개)
- 선행 조건 (어떤 슬라이스가 먼저여야 하는가)

### Step 5: AC 커버리지 매트릭스
| AC | 슬라이스 | 상태 |
모든 AC가 최소 1개 슬라이스에 매핑되었는지 확인.

### Step 6: 사용자 승인
상태를 `exploring → approved`로 변경.

## 금지사항
- 요구사항 재정의 (Specify 영역 → 피드백 보고)
- 실제 코드 작성
- Design이 Spec을 직접 수정하지 않음

## 피드백 루프
Design에서 Spec 문제 발견 시:
1. "문제 + 대안 2-3개 + 트레이드오프" 형식으로 사용자에게 보고
2. 사용자 의사결정
3. Spec 수정
4. Design 재실행
5. 최대 3회 왕복 초과 시 기능 분할

## 산출물
- `docs/design/{feature-name}.md` (상태: approved)
- (기어 4) `docs/adr/ADR-NNN-{title}.md`
```

### 3-5 Phase별 규칙 파일 (예시: Implement)

`.claude/rules/phase-implement.md`:

```markdown
# Phase: Implement (TDD)

## 역할
Design의 슬라이스를 TDD로 구현한다.

## 진입 조건
- `docs/design/{feature-name}.md` 존재 + 상태 `approved`
- Design의 AC 커버리지 매트릭스에 ⬜가 있음

## 프로세스 (슬라이스 단위 반복)

### 각 슬라이스마다:
1. **Red**: Design의 "테스트 의도"에 따라 실패하는 테스트 작성
2. **Green**: "이 실패하는 테스트를 통과시키는 최소한의 코드만 작성해"
3. **자동 검증**: lint + type check + test (Hooks가 자동 실행)
4. **AC 업데이트**: Design의 해당 슬라이스 상태를 ⬜ → ✅로 변경
5. **커밋**: `feat({scope}): {설명} [{AC-IDs}]`

### 슬라이스 규칙
- 1 슬라이스 = 1 커밋
- 슬라이스당 변경 파일 1-3개
- 같은 오류 3회 반복 시 → 접근 방식 변경

## 금지사항
- 테스트 없이 프로덕션 코드 작성 (Hooks가 차단)
- Design에 없는 파일 수정 (Design 업데이트 먼저)
- 이해하지 못한 코드 커밋

## 산출물
- 구현 코드 + 테스트
- Design의 AC 커버리지 매트릭스 업데이트 (모든 ⬜ → ✅)
```

---

## 4. Hooks 시스템 — 구체적 설계

### 4-1 전체 Hooks 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Hooks 계층 구조                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SessionStart                                           │
│  └─ session-context.sh                                  │
│     → 현재 Phase 감지, 진행 중인 기능 식별                  │
│     → 컨텍스트 정보를 Claude에 주입                        │
│                                                         │
│  UserPromptSubmit                                       │
│  └─ gear-detect.sh                                      │
│     → 사용자 프롬프트 분석, 기어 자동 판단                   │
│     → 기어 3-4이면 Phase 가드 활성화 신호                   │
│                                                         │
│  PreToolUse (Edit|Write)                                │
│  └─ phase-guard.sh                                      │
│     → 현재 Phase에서 허용된 파일만 수정 가능                 │
│     → Specify 중 코드 파일 수정 차단                       │
│     → Design 없이 src/ 파일 수정 차단 (기어 3-4)           │
│                                                         │
│  PostToolUse (Edit|Write)                               │
│  └─ quality-gate.sh                                     │
│     → Python 파일 수정 시 자동 ruff check + format         │
│     → 테스트 파일 수정 시 해당 테스트 자동 실행              │
│                                                         │
│  PreToolUse (Bash)                                      │
│  └─ dangerous-command-guard.sh                          │
│     → rm -rf, git push --force 등 위험 명령 차단           │
│     → git commit 시 Design AC 상태 체크                    │
│                                                         │
│  Stop                                                   │
│  └─ phase-transition-check.sh                           │
│     → Phase 산출물 완성 여부 확인                          │
│     → 다음 Phase 안내                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4-2 settings.json 전체 설정

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-context.sh",
            "timeout": 10
          }
        ]
      }
    ],

    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/gear-detect.sh",
            "timeout": 5
          }
        ]
      }
    ],

    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/phase-guard.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dangerous-command-guard.sh",
            "timeout": 5
          }
        ]
      }
    ],

    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.sh",
            "async": true,
            "statusMessage": "품질 검사 중..."
          }
        ]
      }
    ],

    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/phase-transition-check.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 4-3 핵심 Hook 스크립트 상세

#### session-context.sh — 세션 시작 시 상태 주입

```bash
#!/bin/bash
# 세션 시작 시 현재 워크플로우 상태를 Claude에 알린다

PROJECT_DIR="$CLAUDE_PROJECT_DIR"
STATUS=""

# 진행 중인 기능 감지
ACTIVE_SPECS=$(find "$PROJECT_DIR/docs/spec" -name "*.md" -newer "$PROJECT_DIR/.git/HEAD" 2>/dev/null | head -5)
ACTIVE_DESIGNS=$(find "$PROJECT_DIR/docs/design" -name "*.md" 2>/dev/null | head -5)

# 현재 브랜치에서 기능명 추출
BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null)
UNCOMMITTED=$(cd "$PROJECT_DIR" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# 진행 중인 Phase 판단
for spec in $ACTIVE_SPECS; do
  FEATURE=$(basename "$spec" .md)
  DESIGN="$PROJECT_DIR/docs/design/$FEATURE.md"

  if [ ! -f "$DESIGN" ]; then
    STATUS="$STATUS\n[WORKFLOW] Feature '$FEATURE': Specify 완료, Design 필요"
  elif grep -q '⬜' "$DESIGN" 2>/dev/null; then
    PENDING=$(grep -c '⬜' "$DESIGN")
    STATUS="$STATUS\n[WORKFLOW] Feature '$FEATURE': Implement 진행 중 ($PENDING 슬라이스 남음)"
  else
    STATUS="$STATUS\n[WORKFLOW] Feature '$FEATURE': Implement 완료, Verify 가능"
  fi
done

if [ -z "$STATUS" ]; then
  STATUS="[WORKFLOW] 진행 중인 기능 없음. 새 작업 시작 가능."
fi

echo -e "Branch: $BRANCH | Uncommitted: $UNCOMMITTED files$STATUS"
```

#### phase-guard.sh — Phase 위반 차단 (핵심)

```bash
#!/bin/bash
# PreToolUse (Edit|Write): 현재 Phase에서 허용되지 않는 파일 수정 차단

# stdin에서 이벤트 데이터 읽기
EVENT=$(cat)
FILE_PATH=$(echo "$EVENT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# 파일 경로가 없으면 통과
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_DIR="$CLAUDE_PROJECT_DIR"

# 기어 상태 파일 확인 (gear-detect.sh가 생성)
GEAR_FILE="$PROJECT_DIR/.claude/.current-gear"
GEAR=$(cat "$GEAR_FILE" 2>/dev/null || echo "0")

# 기어 1-2는 Phase 가드 비활성
if [ "$GEAR" -le 2 ]; then
  exit 0
fi

# docs/ 파일은 항상 허용 (Phase 문서 작성)
if echo "$FILE_PATH" | grep -qE '^docs/|^\.claude/'; then
  exit 0
fi

# 테스트 파일은 항상 허용
if echo "$FILE_PATH" | grep -qE 'test_|_test\.|tests/|conftest'; then
  exit 0
fi

# 현재 기능의 Design 존재 여부 확인
# 가장 최근 수정된 spec 파일에서 기능명 추출
LATEST_SPEC=$(ls -t "$PROJECT_DIR/docs/spec/"*.md 2>/dev/null | head -1)
if [ -z "$LATEST_SPEC" ]; then
  # spec도 없는데 프로덕션 코드 수정 시도 → 차단
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "기어 3-4 작업인데 Specify 문서가 없습니다. 먼저 docs/spec/{feature}.md를 작성하세요."
    }
  }'
  exit 0
fi

FEATURE=$(basename "$LATEST_SPEC" .md)
DESIGN="$PROJECT_DIR/docs/design/$FEATURE.md"

# Design 없이 프로덕션 코드 수정 시도 → 차단
if [ ! -f "$DESIGN" ]; then
  jq -n --arg feature "$FEATURE" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("Specify는 완료되었지만 Design이 없습니다. 먼저 docs/design/" + $feature + ".md를 작성하세요.")
    }
  }'
  exit 0
fi

# Design이 approved 상태인지 확인
if ! grep -q 'approved' "$DESIGN" 2>/dev/null; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Design이 아직 approved 상태가 아닙니다. 사용자 승인을 받으세요."
    }
  }'
  exit 0
fi

# 모든 조건 통과
exit 0
```

#### gear-detect.sh — 기어 자동 감지

```bash
#!/bin/bash
# UserPromptSubmit: 사용자 프롬프트를 분석하여 기어 판단

EVENT=$(cat)
PROMPT=$(echo "$EVENT" | jq -r '.user_prompt // empty')
PROJECT_DIR="$CLAUDE_PROJECT_DIR"
GEAR_FILE="$PROJECT_DIR/.claude/.current-gear"

# 기어 1 키워드
GEAR1_PATTERN='오타|typo|로그|log|print|주석|comment|상수|constant|오류 수정|fix typo|remove unused'

# 기어 2 키워드
GEAR2_PATTERN='버그|bug|수정|fix|고쳐|patch|간단한|simple|작은|small'

# 기어 4 키워드
GEAR4_PATTERN='아키텍처|architecture|인증 시스템|auth system|결제|payment|마이그레이션|migration 대규모|시스템 설계|system design|전체 리팩토링'

# 기어 3 키워드 (기본)
GEAR3_PATTERN='기능|feature|추가|add|새로운|new|API|엔드포인트|endpoint|모델|model|뷰|view'

if echo "$PROMPT" | grep -qiE "$GEAR1_PATTERN"; then
  GEAR=1
elif echo "$PROMPT" | grep -qiE "$GEAR4_PATTERN"; then
  GEAR=4
elif echo "$PROMPT" | grep -qiE "$GEAR3_PATTERN"; then
  GEAR=3
elif echo "$PROMPT" | grep -qiE "$GEAR2_PATTERN"; then
  GEAR=2
else
  GEAR=0  # 판단 불가 → Claude가 CLAUDE.md 규칙에 따라 판단
fi

# 기어 상태 저장
mkdir -p "$(dirname "$GEAR_FILE")"
echo "$GEAR" > "$GEAR_FILE"

# 기어 3-4에서만 워크플로우 안내 출력
if [ "$GEAR" -ge 3 ]; then
  echo "[GEAR $GEAR 감지] Phase 워크플로우가 활성화됩니다. Specify → Design → Implement → Verify 순서를 따릅니다."
elif [ "$GEAR" -ge 1 ]; then
  echo "[GEAR $GEAR 감지] 경량 모드. 바로 진행하세요."
fi
```

#### quality-gate.sh — 자동 품질 검사

```bash
#!/bin/bash
# PostToolUse (Edit|Write): 파일 수정 후 자동 품질 검사

EVENT=$(cat)
FILE_PATH=$(echo "$EVENT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')
PROJECT_DIR="$CLAUDE_PROJECT_DIR"

# Python 파일이 아니면 스킵
if ! echo "$FILE_PATH" | grep -qE '\.py$'; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# ruff check + format
LINT_RESULT=$(uv run ruff check "$FILE_PATH" --quiet 2>&1 | head -10)
if [ -n "$LINT_RESULT" ]; then
  echo "[LINT] $LINT_RESULT"
  uv run ruff check "$FILE_PATH" --fix --quiet 2>/dev/null
  uv run ruff format "$FILE_PATH" --quiet 2>/dev/null
fi

# 테스트 파일 수정 시 해당 테스트 실행
if echo "$FILE_PATH" | grep -qE 'test_|_test\.'; then
  TEST_RESULT=$(uv run pytest "$FILE_PATH" -x --tb=short --no-header -q 2>&1 | tail -5)
  echo "[TEST] $TEST_RESULT"
fi
```

---

## 5. 워크플로우 시나리오

### 5-1 시나리오: 기어 1 (오타 수정)

```
사용자: "README.md에서 'djanago'를 'django'로 고쳐줘"

[UserPromptSubmit Hook] → gear-detect.sh → GEAR=1 저장
[GEAR 1 감지] 경량 모드. 바로 진행하세요.

Claude: README.md 수정

[PostToolUse Hook] → .md 파일이므로 quality-gate 스킵

→ 완료. Phase 문서 없음, 마찰 없음.
```

### 5-2 시나리오: 기어 2 (버그 수정)

```
사용자: "로그인 뷰에서 비밀번호 검증이 안 되는 버그 수정해줘"

[UserPromptSubmit Hook] → gear-detect.sh → GEAR=2 저장
[GEAR 2 감지] 경량 모드. 바로 진행하세요.

Claude: (CLAUDE.md 규칙에 따라 Plan Mode로 코드 탐색 후 구현)
  1. Plan Mode: apps/accounts/views.py 탐색
  2. 버그 원인 파악
  3. 테스트 작성 + 수정

[PreToolUse Hook] → GEAR=2이므로 phase-guard 비활성 → 통과
[PostToolUse Hook] → quality-gate → 린트 + 테스트 자동 실행

→ 완료. Phase 문서 없음, 린트/테스트만 자동.
```

### 5-3 시나리오: 기어 3 (신규 기능)

```
사용자: "사용자 알림 시스템을 만들어줘"

[UserPromptSubmit Hook] → gear-detect.sh → GEAR=3 저장
[GEAR 3 감지] Phase 워크플로우가 활성화됩니다.

--- Phase 1: Specify ---

Claude: (CLAUDE.md + phase-specify.md 규칙에 따라)
  "알림 시스템의 요구사항을 파악하기 위해 몇 가지 질문드립니다:
  1. 어떤 이벤트에서 알림이 발생하나요?
  2. 알림 전달 방식은? (인앱, 이메일, 푸시)
  3. 실시간성이 필요한가요?
  ..."

사용자: (답변)

Claude: docs/spec/user-notifications.md 작성

사용자: "승인"

Claude: 상태를 approved로 변경

--- Phase 2: Design ---

Claude: (phase-design.md 규칙에 따라 Plan Mode로 코드베이스 탐색)
  - 기존 comments/models.py 패턴 확인
  - 기존 signals 패턴 확인
  → docs/design/user-notifications.md 작성 (변경 계획 + 슬라이스)

사용자: "승인"

--- Phase 3: Implement ---

Claude: Slice A-1 구현 시작
  1. 테스트 작성 (Red)

  [PreToolUse: Edit notifications/models.py]
  → phase-guard.sh: Design approved ✅ → 통과

  2. 구현 (Green)
  3. Design AC 커버리지 업데이트 (⬜ → ✅)
  4. 커밋: feat(notifications): add Notification model [R1]

Claude: Slice A-2 구현...
  (반복)

--- Phase 4: Verify ---

Claude: (Design의 모든 AC가 ✅)
  - 전체 테스트 실행
  - Spec 대조: 모든 요구사항 충족 확인
  - 보안 기본 검사

--- Phase 5: Ship ---

Claude: PR 생성 + Memory 업데이트
```

### 5-4 시나리오: Phase 위반 차단

```
사용자: "사용자 알림 시스템을 만들어줘"

[GEAR 3 감지]

Claude: (Specify 시작 전에 코드를 쓰려고 시도)
  Edit: apps/notifications/models.py

[PreToolUse Hook] → phase-guard.sh:
  - GEAR=3 ✅
  - docs 파일이 아님 ✅ (체크 대상)
  - docs/spec/*.md 없음 ❌
  → DENIED: "기어 3-4 작업인데 Specify 문서가 없습니다.
    먼저 docs/spec/{feature}.md를 작성하세요."

Claude: (거부됨 → CLAUDE.md 규칙에 따라 Specify로 돌아감)
  "먼저 요구사항을 정리하겠습니다. 몇 가지 질문드립니다..."
```

### 5-5 시나리오: Design → Spec 피드백 루프

```
--- Phase 2: Design 중 ---

Claude: (Plan Mode로 코드베이스 탐색)
  발견: Spec에 "실시간 알림 1초 이내"라고 되어 있지만,
  기존 인프라에 WebSocket/ASGI가 없음.

Claude: (phase-design.md 피드백 루프 규칙에 따라)
  "Spec에서 문제를 발견했습니다:

  문제: '1초 이내 실시간' 요구사항이 현재 인프라로 불가능

  대안:
  A) Django Channels + WebSocket 도입 (1초 가능, ASGI 서버 필요)
  B) SSE 방식 (2-3초, 인프라 변경 최소)
  C) HTMX 폴링 5초 간격 (단순, 실시간 아님)

  어떤 방향으로 진행할까요?"

사용자: "B로 하자. 3초까지는 OK."

Claude: docs/spec/user-notifications.md 수정 (1초 → 3초)
Claude: Design 재작성 (SSE 기반)
```

---

## 6. 에이전트 정의

### 6-1 Specifier 에이전트

`.claude/agents/specifier.md`:

```markdown
---
name: specifier
description: >
  Specify(What) 단계 전문 에이전트. 사용자를 인터뷰하여
  요구사항을 구조화하고 docs/spec/{feature}.md를 작성한다.
  기어 3-4 기능의 Specify 단계에서 사용.
tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
memory: project
---

당신은 Specify 단계 전문가입니다.

## 역할
사용자를 인터뷰하여 "무엇을, 왜, 어디까지"를 명확히 하고,
구조화된 요구사항 문서를 작성합니다.

## 규칙
1. 기술 용어를 사용하지 마세요 (Redis, Celery 등)
2. 파일명, 함수명을 지정하지 마세요
3. 코드를 작성하지 마세요
4. 모든 요구사항에 [R1], [R2]... ID를 부여하세요
5. 인수 기준은 입출력 예시 형태로 작성하세요

## 인터뷰 흐름
1. 핵심 동작 (Happy Path): "이 기능의 가장 기본적인 사용 시나리오는?"
2. 입출력: "사용자가 무엇을 입력하고 무엇을 받나요?"
3. 예외: "어떤 상황에서 실패할 수 있나요?"
4. 기존 시스템: "기존 기능과 어떻게 연관되나요?"
5. 비범위: "이번에 하지 않을 것은?"

## 산출물
docs/spec/{feature-name}.md (specify-design-split-final.md 템플릿 준수)
```

### 6-2 Designer 에이전트

`.claude/agents/designer.md`:

```markdown
---
name: designer
description: >
  Design(How) 단계 전문 에이전트. Spec을 받아 코드베이스를 탐색하고
  구현 경로를 설계하며 docs/design/{feature}.md를 작성한다.
  기어 3-4 기능의 Design 단계에서 사용.
tools: Read, Glob, Grep, Write, Edit, Bash
model: opus
memory: project
---

당신은 Design 단계 전문가입니다.

## 역할
Spec을 받아 "어떻게, 왜 이 방법으로"를 결정합니다.
코드베이스의 기존 패턴을 파악하고 일관성 있는 구현 경로를 설계합니다.

## 규칙
1. 반드시 코드베이스를 먼저 탐색하세요 (Plan Mode)
2. 변경 계획의 "참조 패턴" 열을 반드시 채우세요
3. 모든 AC가 슬라이스에 매핑되었는지 확인하세요
4. 실제 코드를 작성하지 마세요
5. Spec 문제 발견 시 직접 수정하지 말고 보고하세요

## 탐색 패턴
1. 유사 기능 찾기: 기존에 비슷한 것이 어떻게 되어 있는가
2. 패턴 파악: 어떤 관례를 따르는가 (뷰 구조, 모델 패턴, URL 패턴)
3. 영향 범위: 어떤 파일이 영향받는가

## 산출물
docs/design/{feature-name}.md (specify-design-split-final.md 템플릿 준수)
```

### 6-3 Reviewer 에이전트

`.claude/agents/reviewer.md`:

```markdown
---
name: reviewer
description: >
  Verify 단계 전문 에이전트. 구현 결과를 Spec/Design과 대조하여
  검증하고, 보안/성능 이슈를 식별한다.
  Writer/Reviewer 패턴의 Reviewer 역할.
tools: Read, Glob, Grep, Bash
model: opus
memory: project
---

당신은 Verify 단계의 독립적 리뷰어입니다.
구현자(Writer)와는 별도의 관점에서 코드를 검증합니다.

## 검증 체크리스트
1. Spec 대조: 모든 [R1], [R2]... 요구사항 충족 여부
2. Design 대조: 변경 계획과 실제 구현의 일치
3. 테스트 커버리지: 모든 AC에 테스트 존재
4. 보안: 입력 검증, 인증/인가, SQL injection, XSS
5. 성능: N+1 쿼리, select_related/prefetch_related
6. 코드 품질: 타입 힌트, 에러 핸들링, 기존 패턴 일관성

## 규칙
- 코드를 수정하지 마세요 (Read-only)
- 문제 발견 시 "파일:라인번호 + 문제 설명 + 수정 제안" 형식
- 긍정 피드백도 포함하세요 (잘한 점)
```

---

## 7. 기어별 흐름 다이어그램

### 7-1 기어 1-2: 마찰 없는 즉시 처리

```
사용자 요청
    │
    ▼
[gear-detect.sh: GEAR 1-2]
    │
    ▼
Claude가 CLAUDE.md 기본 규칙만 따름
    │
    ├─ 기어 1: 바로 수정
    │   └─ [PostToolUse] 린트 자동 실행
    │
    └─ 기어 2: Plan Mode → 수정
        └─ [PostToolUse] 린트 + 테스트 자동 실행
    │
    ▼
완료 (Phase 문서 없음)
```

### 7-2 기어 3: 표준 워크플로우

```
사용자 요청
    │
    ▼
[gear-detect.sh: GEAR 3]
    │
    ▼
Phase 1: SPECIFY ──────────────────────────────────
    │  Claude가 인터뷰 → docs/spec/{feature}.md 작성
    │  [사용자 승인]
    ▼
Phase 2: DESIGN ───────────────────────────────────
    │  Plan Mode 탐색 → docs/design/{feature}.md 작성
    │  ┌─ Spec 문제 발견? → 피드백 루프 (최대 3회)
    │  [사용자 승인]
    ▼
Phase 3: IMPLEMENT (TDD) ─────────────────────────
    │  슬라이스 반복: Red → Green → 검증 → AC ✅ → 커밋
    │  [PreToolUse] Design approved 확인
    │  [PostToolUse] 린트 + 테스트 자동 실행
    ▼
Phase 4: VERIFY ───────────────────────────────────
    │  전체 테스트 + Spec 대조 + 보안 검사
    ▼
Phase 5: SHIP ─────────────────────────────────────
    PR 생성 + Memory 업데이트
```

### 7-3 기어 4: 풀 사이클

```
기어 3과 동일 +

Design 단계에서:
  └─ ADR 작성 (docs/adr/ADR-NNN-{title}.md)

Verify 단계에서:
  └─ 별도 세션에서 reviewer 에이전트 실행 (Writer/Reviewer 패턴)
  └─ 멀티에이전트 병렬 리뷰 가능:
     ├─ 보안 리뷰어
     ├─ 성능 리뷰어
     └─ 패턴 일관성 리뷰어
```

---

## 8. 상태 공유 및 세션 간 연속성

### 8-1 디렉토리가 곧 상태

별도의 상태 파일(`.workflow-state.json` 등)을 사용하지 않는다. 대신:

```
상태 판단 로직:

1. docs/spec/{feature}.md 존재?
   └─ No: Specify 필요
   └─ Yes: 상태 헤더 확인 (draft / review / approved)

2. docs/design/{feature}.md 존재?
   └─ No: Design 필요
   └─ Yes: 상태 헤더 확인 (exploring / decided / approved)

3. docs/design/{feature}.md의 AC 커버리지에 ⬜ 있음?
   └─ Yes: Implement 진행 중
   └─ No: Implement 완료, Verify 가능

4. git log로 최근 커밋에 [R1], [R2] 태깅 확인
   → 어떤 AC가 구현되었는지 추적
```

**장점**: 파일을 열면 바로 상태를 알 수 있고, git diff로 진행 추적 가능.

### 8-2 세션 간 연속성

```
세션 A (Day 1): Specify + Design 완료
  → docs/spec/notifications.md (approved)
  → docs/design/notifications.md (approved, ⬜ 4개)

--- 세션 종료 ---

세션 B (Day 2): claude --resume
  [SessionStart Hook] → session-context.sh:
    "[WORKFLOW] Feature 'notifications': Implement 진행 중 (4 슬라이스 남음)"

  Claude: Design을 읽고 남은 슬라이스부터 구현 재개
```

세션을 새로 시작해도 파일 시스템의 상태가 모든 정보를 담고 있어, Claude가 CLAUDE.md 규칙과 디렉토리 구조만으로 현재 위치를 파악할 수 있다.

### 8-3 Memory 활용

```markdown
# memory/MEMORY.md (자동 업데이트)

## Active Features
- notifications: Implement phase, 4 slices remaining

## Patterns Learned
- signals는 apps/{app}/signals.py에, apps.py의 ready()에서 연결
- 모든 모델에 created_at, updated_at 포함 (TimeStampedModel 상속)

## Workflow Decisions
- 기어 판단 기준: 새 URL 패턴 추가 시 기어 3 이상
```

---

## 9. 품질 게이트 4계층 통합

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: 실시간 (Hooks — PostToolUse)                │
│ - ruff check + format (자동)                         │
│ - 테스트 파일 수정 시 해당 테스트 실행 (자동)            │
├─────────────────────────────────────────────────────┤
│ Layer 2: Phase 전이 시 (Hooks — PreToolUse)           │
│ - Specify 없이 코드 작성 차단                          │
│ - Design 미승인 상태에서 구현 차단                      │
│ - AC 미완료 상태에서 PR 생성 차단                       │
├─────────────────────────────────────────────────────┤
│ Layer 3: Pre-commit                                  │
│ - ruff + pyright + bandit                            │
│ - commitizen (커밋 메시지 형식)                        │
│ - Design AC 태그 포함 확인                             │
├─────────────────────────────────────────────────────┤
│ Layer 4: CI/CD + 인간 리뷰                            │
│ - pytest + coverage                                  │
│ - CodeRabbit AI 리뷰                                 │
│ - 인간: 비즈니스 로직 + 아키텍처 판단                    │
└─────────────────────────────────────────────────────┘
```

---

## 10. 장단점 분석

### 10-1 장점

| 장점 | 설명 |
|------|------|
| **마찰 최소화** | 기어 1-2는 아무 프로세스 없이 즉시 작업. 자연어로 시작 |
| **강제 집행** | Hooks가 위반을 차단하므로 규칙이 무시되지 않음 |
| **상태 투명성** | 파일 시스템이 상태 → git으로 추적 가능, 별도 도구 불필요 |
| **세션 독립성** | 세션이 끊어져도 디렉토리 구조로 상태 복원 |
| **학습 곡선 낮음** | 사용자가 명령어를 외울 필요 없음 |
| **점진적 도입** | CLAUDE.md만으로 시작, Hooks는 필요시 추가 |
| **팀 공유** | settings.json + hooks/ + rules/를 git commit으로 공유 |

### 10-2 단점

| 단점 | 완화 방안 |
|------|----------|
| **Hook 스크립트 복잡도** | 검증된 스크립트 템플릿 제공, 점진적 추가 |
| **기어 오판 가능성** | 기어 0(판단 불가) → Claude가 질문으로 확인 |
| **CLAUDE.md 비대화 위험** | 핵심만 CLAUDE.md, 상세는 rules/로 분리 |
| **디버깅 어려움** | Hook 스크립트에 로깅 추가, `--verbose` 모드 |
| **Hooks 미지원 환경** | CLAUDE.md 규칙만으로도 작동 (강제성만 감소) |
| **규칙 우회 가능성** | Hooks exit code 1은 강제 차단이므로 우회 어려움 |

### 10-3 Proposal A 대비 트레이드오프

```
                    Proposal A           Proposal B
                  (스킬 체인)        (헌법 + Hooks)
                       │                    │
명시성             높음 ████████░░         낮음 ██░░░░░░░░
  (사용자가 무엇을 하는지 앎)              (암묵적으로 진행)

마찰               중간 ████░░░░░░         낮음 ██░░░░░░░░
  (간단한 작업에서)                       (기어 1-2는 제로)

강제성             낮음 ██░░░░░░░░         높음 ████████░░
  (규칙 위반 방지)                        (Hook이 차단)

확장성             높음 ████████░░         중간 ████░░░░░░
  (새 Phase 추가)                         (스크립트 작성 필요)

디버깅             쉬움 ██████░░░░         어려움 ██░░░░░░░░
  (무엇이 잘못됐는지 파악)                (Hook 로그 확인 필요)

팀 도입            중간 ████░░░░░░         쉬움 ██████░░░░
  (새 팀원 온보딩)                        (규칙이 내재, 외울 것 없음)
```

---

## 11. 점진적 도입 로드맵

### Stage 1: CLAUDE.md만 (Day 1)

```
추가할 것:
- CLAUDE.md에 기어 시스템 규칙 추가
- .claude/rules/ 에 Phase별 규칙 파일

아직 없는 것:
- Hooks (강제 없음, Claude의 자발적 준수만)

효과:
- Claude가 CLAUDE.md 규칙을 읽고 "기어 3이므로 Specify부터 시작하겠습니다" 응답
- 위반 가능하지만 대부분 따름
```

### Stage 2: 품질 Hooks 추가 (Week 1)

```
추가할 것:
- PostToolUse Hook: 린트 + 테스트 자동 실행
- SessionStart Hook: 상태 주입

아직 없는 것:
- Phase 가드 (강제 차단 없음)

효과:
- 코드 품질 자동 보장
- 세션 시작 시 현재 상태 인지
```

### Stage 3: Phase 가드 추가 (Week 2-3)

```
추가할 것:
- PreToolUse Hook: phase-guard.sh (Phase 위반 차단)
- UserPromptSubmit Hook: gear-detect.sh (기어 자동 감지)

효과:
- 풀 워크플로우 강제 집행
- 기어 자동 변속
```

### Stage 4: 에이전트 통합 (Week 4+)

```
추가할 것:
- specifier, designer, reviewer 에이전트
- 멀티에이전트 병렬 리뷰 (기어 4)

효과:
- Phase별 전문화된 AI 행동
- 독립적 리뷰어로 편향 제거
```

---

## 12. Proposal A와의 조합 가능성

이 제안은 Proposal A(스킬 체인)와 상호 배타적이지 않다. 실제로는 혼합 구성이 가장 효과적일 수 있다:

```
CLAUDE.md 헌법 (Proposal B)
  ├─ 기어 판단 규칙
  ├─ Phase 순서 규칙
  └─ 금지 행위 규칙

Hooks (Proposal B)
  ├─ Phase 가드 (강제 차단)
  ├─ 품질 게이트 (자동 검증)
  └─ 기어 감지 (자동 변속)

스킬 (Proposal A 요소)
  ├─ /specify — 기어 3-4에서 Phase 문서 작성 자동화
  ├─ /design — Design 문서 구조화된 작성
  └─ /implement — TDD 슬라이스 체계적 실행

→ 규칙은 암묵적(B), 실행은 선택적으로 명시적(A)
→ 스킬 없이도 작동하지만, 스킬이 있으면 더 구조적
```

이 조합이 Proposal C (하이브리드)의 기반이 된다.

---

## 부록: 참고 자료

| 출처 | 차용 아이디어 |
|------|-------------|
| **Kiro** | Steering 파일로 컨텍스트 영속화, Spec-driven 워크플로우 |
| **GitHub Spec-Kit** | CLAUDE.md를 "헌법"으로 활용하는 패턴 |
| **Roo Code** | 모드별 권한 격리 → 에이전트별 도구 제한 |
| **Cline Memory Bank** | 디렉토리 기반 상태 관리 |
| **bkit PDCA** | 기어 시스템, 슬라이스 기반 TDD |
| **Kiro Agent Hooks** | 이벤트 기반 자동화 → Claude Code Hooks로 변환 |
| **Specify-Design 정의서** | Phase별 활동, 금지사항, 템플릿 전체 차용 |
