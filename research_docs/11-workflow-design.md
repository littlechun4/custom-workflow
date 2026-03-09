# AI-Driven Development Workflow Design

> 10개 조사 문서를 종합하여 설계한 범용 AI-driven 개발 워크플로우.
> Claude Code 기반이지만, 원칙은 어떤 AI 코딩 도구에도 적용 가능.

---

## 1. 핵심 원칙

10개 조사 문서에서 반복적으로 등장한 6대 원칙:

| 원칙 | 설명 | 근거 |
|------|------|------|
| **Plan First** | AI에게 코드를 쓰게 하기 전에 반드시 계획 | 구조 없이 AI 사용 시 기술 부채 10배 속도로 축적 (MIT Technology Review) |
| **Small Slices** | 큰 작업을 작은 단위로 분해, 한 번에 하나씩 구현→검증→커밋 | bkit PDCA: 프로덕션 코드 35% 감소, 테스트 코드 30% 증가 |
| **Context Engineering** | AI에게 무엇을 주는지가 결과를 결정 | "Vibe Coding → Context Engineering" 패러다임 전환 (2025) |
| **Verification Loops** | Generate → Verify → Accept/Reject 루프 | AI 생성 코드의 40%에 보안 취약점 (Clutch 2025) |
| **Human Oversight** | AI는 "자율 주행"이 아닌 "가속기" | EnrichLead: 런칭 48시간 만에 보안 이슈로 셧다운 |
| **Documentation as Memory** | 문서가 곧 AI의 기억 | 세션 간 컨텍스트 전달 매체로서의 spec, plan, ADR |

---

## 2. 기어 시스템 — 기능 크기에 따른 워크플로우 전환

모든 기능에 풀 사이클을 돌리면 오버킬이고, 매번 vibe coding하면 기술 부채가 쌓인다.
**기능 크기에 따라 기어를 전환**하는 것이 핵심.

```
┌────────────┬─────────────────────┬───────────────────────────┬──────────────────┐
│ 기어        │ 대상                │ 시작 지점                  │ 예시             │
├────────────┼─────────────────────┼───────────────────────────┼──────────────────┤
│ 1단 (즉시)  │ 타이포, 1줄 수정     │ 바로 구현                  │ 오타 수정, 로그 추가│
│ 2단 (경량)  │ 1-2 파일 변경       │ Plan Mode → 구현           │ 버그 수정, 작은 기능│
│ 3단 (표준)  │ 3-10 파일, 신규 기능 │ Spec → Plan → TDD         │ 새 API 엔드포인트 │
│ 4단 (풀)    │ 10+ 파일, 아키텍처   │ PRD → Plan → TDD → Review │ 인증 시스템, 결제  │
└────────────┴─────────────────────┴───────────────────────────┴──────────────────┘
```

**기어 선택 기준**: "이 변경을 한 문장으로 설명할 수 있는가?"
- Yes → 1-2단
- No → 3-4단

대부분의 일상 작업은 **2-3단**에서 처리되고, 4단은 Epic 급 기능에만 사용.

---

## 3. 표준 워크플로우 (3단 기어) — 가장 자주 쓰는 사이클

### 전체 흐름

```
 ┌─────────────────────────────────────────────────────┐
 │  Phase 0: CONTEXT (항상 활성)                        │
 │  CLAUDE.md + Memory + Skills = AI의 기관 지식        │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │  Phase 1: SPECIFY (What)                            │
 │  "뭘 만들지 모르면서 만들지 마라"                       │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │  Phase 2: PLAN (How)                                │
 │  "한 문장으로 설명 못하면 Plan Mode"                    │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │  Phase 3: IMPLEMENT with TDD (Do)                   │
 │  "테스트 먼저, 구현은 AI가, 한 번에 하나씩"             │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │  Phase 4: VERIFY (Check)                            │
 │  "AI가 쓴 코드를 AI가 리뷰하되, 별도 세션으로"          │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │  Phase 5: SHIP & LEARN (Act)                        │
 │  "PR 생성 → CI 검증 → 인간 리뷰 → Memory 업데이트"    │
 └─────────────────────────────────────────────────────┘
```

---

### Phase 0: CONTEXT (항상 활성)

AI의 "기관 지식"을 구성하는 영속적 컨텍스트 계층.

```
프로젝트 루트/
├── CLAUDE.md                    # 프로젝트 헌법 (짧게, 핵심만)
│   └── @docs/conventions.md     # 임포트로 상세 규칙 분리
├── .claude/
│   ├── settings.json            # Hooks, 권한 설정
│   ├── skills/                  # 재사용 워크플로우 스킬
│   └── agents/                  # 커스텀 에이전트 정의
└── memory/
    └── MEMORY.md                # 세션 간 학습 기록
```

**CLAUDE.md 원칙**:
- "삭제해도 AI가 실수 안 하면 삭제하라" — 짧을수록 효과적
- 상세 워크플로우는 스킬로 분리, CLAUDE.md엔 트리거 조건만 명시
- 린터로 처리 가능한 규칙은 CLAUDE.md에 쓰지 않음

**Memory 구조** (Cline Memory Bank 참고):
```
projectBrief.md      ← 최상위 컨텍스트 (왜 이 프로젝트가 존재하는가)
├── systemPatterns.md ← 아키텍처 결정, 패턴
├── techContext.md    ← 기술 스택, 의존성
├── activeContext.md  ← 현재 진행 중인 작업
└── progress.md       ← 완료/미완료 추적
```

---

### Phase 1: SPECIFY (What을 정의)

**목적**: "무엇을 만들 것인가"를 명확히 정의.

**입력**: Jira 이슈, 사용자 요청, 아이디어
**출력**: 명세 문서 (한 문단 ~ PRD)

**프로세스**:
1. 요구사항이 명확한 경우 → 한 문단 명세로 충분
2. 요구사항이 모호한 경우 → **인터뷰 패턴** 사용:
   - "나를 인터뷰해서 요구사항을 파악한 후 SPEC.md를 작성해"
   - AI가 질문 → 사용자 답변 → 반복 → 명세 문서 생성
3. 대형 기능의 경우 → PRD 작성 (배경, 목표, 범위, 비범위, 성공 기준)

**종료 조건**: "이 기능이 끝나면 뭐가 달라지는가?"에 한 문장으로 답할 수 있어야 함.

**도구 매핑**:
- `/write-prd` — 구조화된 PRD 생성
- `/start-work` — Jira 이슈에서 시작 (이슈 조회 + 브랜치 생성)
- `AskUserQuestion` — 인터뷰 패턴

---

### Phase 2: PLAN (How를 설계)

**목적**: "어떻게 만들 것인가"를 설계. 코드를 쓰기 전에 접근 방식 합의.

**입력**: Phase 1의 명세 문서
**출력**: 체크리스트형 구현 계획 (docs/plan/*.md)

**프로세스**:
1. **Plan Mode 진입** (Shift+Tab) — 읽기 전용 모드에서 코드베이스 탐색
2. **기존 패턴 파악** — 비슷한 기능이 이미 어떻게 구현되어 있는지 확인
3. **계획 작성**:
   - 변경할 파일 목록
   - 각 파일의 변경 내용 (구체적)
   - 실행 순서 (의존성 고려)
   - 테스트 전략
4. **계획 리뷰** — AI 또는 사용자가 계획의 타당성 검토
5. **사용자 승인** — 계획 확정 후 구현 시작

**종료 조건**: 모든 변경 사항이 체크리스트로 작성되고, 사용자가 승인.

**도구 매핑**:
- Plan Mode (`Shift+Tab`) — 코드베이스 탐색 + 계획 수립
- `/write-plan` — 구조화된 구현 계획 생성
- `/review-plan` — 계획 리뷰 (실현 가능성, 빠진 부분 체크)

---

### Phase 3: IMPLEMENT with TDD (Do)

**목적**: 계획에 따라 코드를 구현. TDD로 품질 보장.

**입력**: Phase 2의 구현 계획
**출력**: 구현된 코드 + 테스트 + 원자적 커밋들

**프로세스** (슬라이스 단위 반복):
```
┌──────────────────────────────────────────┐
│ 1. 실패하는 테스트 작성 (Red)    ← 인간/AI │
│ 2. 최소 구현 (Green)            ← AI      │
│ 3. 자동 검증                              │
│    └─ lint (ruff) ✓                       │
│    └─ type check (pyright) ✓              │
│    └─ test (pytest) ✓                     │
│ 4. 코드 이해 확인               ← 인간     │
│ 5. 커밋                                   │
│ 6. 다음 슬라이스로 →                       │
└──────────────────────────────────────────┘
```

**TDD + AI 핵심 규칙**:
- "이 실패하는 테스트를 통과시키는 **최소한의** 코드만 작성해" — 가장 효과적인 프롬프트
- 테스트가 AI 환각을 방지하는 명세 역할
- Red(테스트 설계)는 인간이 주도, Green(구현)은 AI가 주도
- 같은 오류 3회 반복 시 → 접근 방식 자체를 변경

**원자적 커밋 원칙**:
- 각 슬라이스마다 독립적으로 커밋
- 커밋 메시지는 "왜"를 설명 (무엇은 diff가 보여줌)
- 이해하지 못한 코드는 커밋하지 않음

**도구 매핑**:
- `/implement` — 체크리스트 기반 단계별 구현
- Claude Code + pytest — TDD 사이클
- Hooks (PostToolUse) — 파일 편집 후 자동 lint/format

---

### Phase 4: VERIFY (Check)

**목적**: 구현 결과를 명세/계획과 대조하여 검증.

**입력**: Phase 3의 구현 결과
**출력**: 리뷰 보고서 + 수정 사항

**프로세스**:
1. **전체 테스트 스위트 실행** — 기존 테스트 깨뜨리지 않았는지 확인
2. **Writer/Reviewer 패턴 적용**:
   - 구현한 세션(Writer)과 다른 세션(Reviewer)에서 리뷰
   - 같은 세션의 AI는 자기 코드의 문제를 잘 못 봄 (편향)
3. **명세 대조 검사** — Phase 1의 명세와 비교하여 빠진 것 없는지
4. **보안 기본 검사** — 입력 검증, 인증/인가, SQL injection 등

**검증 체크리스트**:
```
□ 모든 테스트 통과
□ 타입 체크 통과 (pyright)
□ 린트 통과 (ruff)
□ 명세의 모든 요구사항 충족
□ N+1 쿼리 없음 (Django select_related/prefetch_related)
□ 에러 핸들링 적절
□ 보안 취약점 없음
```

**도구 매핑**:
- `/review-implementation` — 계획 대비 구현 검증
- 새 세션에서 리뷰 (Writer/Reviewer 패턴)
- `uv run pytest`, `uv run pyright`, `uv run ruff check .`

---

### Phase 5: SHIP & LEARN (Act)

**목적**: 코드를 배포하고, 프로세스에서 배운 것을 기록.

**입력**: Phase 4에서 검증된 코드
**출력**: PR + Memory 업데이트

**프로세스**:
1. **PR 생성**:
   - 제목: Conventional Commits 형식
   - 본문: 변경 요약, 테스트 계획
2. **CI 자동 검증**:
   - GitHub Actions: pytest + coverage + CodeRabbit AI 리뷰
   - Claude GitHub Action: `@claude` 멘션으로 추가 리뷰 가능
3. **인간 리뷰**:
   - 비즈니스 로직, 아키텍처 판단은 인간이 최종 결정
4. **Memory 업데이트**:
   - 이번 작업에서 배운 패턴, 결정 사항 기록
   - 다음에 같은 유형 작업 시 참고할 내용

**도구 매핑**:
- `/commit` — 커밋 생성
- `gh pr create` — PR 생성
- Anthropic GitHub Action — CI에서 AI 리뷰
- Memory 파일 업데이트

---

## 4. 품질 게이트 4계층

각 Phase에서 자동/수동으로 작동하는 품질 보장 장치:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: 실시간                                         │
│ - IDE 린터 (ruff)                                       │
│ - Claude Code 자동 제안                                  │
│ - Hooks: PostToolUse → 자동 lint/format                  │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Pre-commit                                     │
│ - ruff check + ruff format                              │
│ - pyright strict mode                                   │
│ - bandit (보안 검사)                                     │
│ - commitizen (커밋 메시지 형식)                           │
├─────────────────────────────────────────────────────────┤
│ Layer 3: CI/CD                                          │
│ - pytest + coverage                                     │
│ - CodeRabbit AI 리뷰 (.coderabbit.yaml)                 │
│ - Claude GitHub Action (anthropics/claude-code-action)   │
│ - Renovate + AI 영향 분석                                │
├─────────────────────────────────────────────────────────┤
│ Layer 4: 인간 리뷰                                      │
│ - 비즈니스 로직 검증                                     │
│ - 아키텍처 판단                                          │
│ - 보안 최종 확인                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Claude Code Hooks 레시피

워크플로우를 자동화하는 핵심 Hooks 설정:

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "ruff check --fix $FILE && ruff format $FILE"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "echo '$COMMAND' | grep -qE 'rm\\s+-rf|git\\s+push.*--force' && echo 'BLOCKED: 위험 명령' && exit 1 || true"
      }
    ],
    "UserPromptSubmit": [
      {
        "command": "echo \"Current branch: $(git branch --show-current), Uncommitted: $(git status --porcelain | wc -l | tr -d ' ') files\""
      }
    ]
  }
}
```

---

## 6. 멀티에이전트 활용 가이드

### 서브에이전트 vs 에이전트 팀 선택

```
단순 조사, 병렬 검색, 코드 탐색
  → 서브에이전트 (저비용 2-3x, 결과만 반환)

복잡한 기능 구현, 역할 분담, 직접 통신 필요
  → 에이전트 팀 (고비용 3-7x, 상호 통신)
```

### 효과적인 팀 구성 패턴

| 패턴 | 구성 | 적합한 상황 |
|------|------|-----------|
| **리서처-구현자-리뷰어** | 3인 | 신규 기능 개발 |
| **풀스택 팀** | 모델+뷰+템플릿+테스트 | 레이어별 분담 |
| **병렬 리뷰어** | 보안+성능+테스트 | 다각도 코드 리뷰 |
| **경쟁 가설** | 가설A+가설B+가설C | 디버깅, 원인 분석 |

### Worktree 격리

```bash
# 에이전트별 독립 워크트리 → 같은 파일도 충돌 없이 병렬 작업
claude --worktree  # 자동으로 .claude/worktrees/ 에 생성
```

---

## 7. 도구별 핵심 워크플로우 아이디어 (차용 가능)

각 도구에서 범용 워크플로우로 가져올 수 있는 아이디어:

| 도구 | 핵심 아이디어 | 적용 방법 |
|------|-------------|----------|
| **bkit** | Evaluator-Optimizer 자동 개선 루프 | 품질 90% 미달 시 자동 재시도 (최대 N회) |
| **Kiro** | steering 파일로 컨텍스트 영속화 | CLAUDE.md + @import로 동일 효과 |
| **Roo Code** | Boomerang 오케스트레이션 | 역할별 서브에이전트 위임 → 결과 취합 |
| **Aider** | Architect/Editor 모드 분리 | Plan Mode(설계) → Implementation(편집) 전환 |
| **Jules** | 비동기 에이전트 | 반복 작업을 백그라운드 에이전트에 위임 |
| **Augment** | Context Engine MCP | 대규모 코드베이스 시맨틱 검색 |

---

## 8. 성공/실패 사례에서 얻은 교훈

### 성공 공식
```
계획 + 작은 단위 + 검증 루프 + 인간 감독 = 성공
```
- TELUS: 57,000명 배포, $9,000만+ ROI, 인터랙션당 40분 절약
- Vulcan Technologies: 비개발자 2인 팀이 정부 계약 수주
- Boris Cherny: 검증 루프로 결과 2-3배 향상

### 실패 공식
```
무계획 + 대규모 생성 + 검증 없음 + 맹목 수용 = 실패
```
- EnrichLead: 런칭 48시간 만에 보안 이슈로 셧다운
- AI 코드 스타트업 80%가 $50K~$500K 기술 부채로 재구축 필요
- AI 생성 코드의 40%에 보안 취약점
- 결제 게이트웨이 $200만 사기 거래 승인 (보안 무시)

### 핵심 안티패턴
1. **모호한 프롬프트** → 명세서 먼저 작성
2. **대용량 코드 한번에 생성** → 작은 단위로 분해
3. **이해 없이 AI 코드 수용** → 59%의 개발자가 이 실수
4. **보안을 AI에 전적 위임** → 자동 검증 + 인간 리뷰 필수
5. **구조 없이 AI 사용** → 기술 부채 10배 속도 축적

---

## 9. 워크플로우 성숙도 단계

조직/개인의 AI 활용 성숙도에 따른 단계적 도입:

```
Stage 1: 보조 도구
  └─ AI를 자동완성/코드 제안 수준으로 사용
  └─ CLAUDE.md 기본 설정만

Stage 2: 구조화된 파트너
  └─ Plan Mode + TDD 사이클 도입
  └─ 기어 시스템으로 작업 규모별 대응
  └─ Pre-commit hooks 설정

Stage 3: 자동화된 파이프라인
  └─ CI/CD AI 통합 (CodeRabbit, Claude GitHub Action)
  └─ Hooks로 품질 자동 검증
  └─ Memory 시스템으로 세션 간 연속성

Stage 4: 에이전트 오케스트레이션
  └─ 멀티에이전트 팀으로 병렬 작업
  └─ 비동기 에이전트 위임
  └─ 자동 개선 루프 (Evaluator-Optimizer)
```

---

## 부록: 조사 문서 색인

| # | 파일 | 내용 |
|---|------|------|
| 00 | `00-comprehensive-summary.md` | 전체 종합 요약 |
| 01 | `01-plan-driven-methodologies.md` | PDCA, SDD, ADR, Plan Mode, 프롬프트 주도 개발 |
| 02 | `02-quality-driven-workflows.md` | TDD+AI, AI 코드리뷰, VDD, 품질 게이트, 페어 프로그래밍 |
| 03 | `03-real-world-workflows.md` | bkit, Boris Cherny 워크플로우, 엔터프라이즈/솔로 패턴 |
| 04 | `04-skills-hooks-automation.md` | 스킬 시스템, Hooks, CLAUDE.md, MCP, 커스텀 에이전트 |
| 05 | `05-agent-orchestration.md` | 멀티에이전트 패턴, Worktree, Agent SDK, 태스크 분해 |
| 06 | `06-tools-comparison.md` | bkit, Aider, Cursor, Windsurf, Copilot Workspace, Devin 비교 |
| 07 | `07-context-engineering-practices.md` | CLAUDE.md 실전, rules 파일, 프롬프트 패턴 |
| 08 | `08-concrete-case-studies.md` | 실제 프로젝트 구축 사례, 실패 사례, 수치 |
| 09 | `09-new-tools-deep-dive.md` | Kiro, Augment, Roo Code, Cody, Amp, Codex, Jules 등 |
| 10 | `10-cicd-ai-automation.md` | CI/CD 설정 레시피 (복붙 가능 수준) |
