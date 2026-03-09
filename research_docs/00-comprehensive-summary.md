# AI-Driven Development 종합 요약

> 10개 리서치 문서 통합 요약 | 작성일: 2026-03-05
> 원본 문서: 01~10번 연구 파일 기반 합성

---

## 목차

1. [AI-Driven Development의 핵심 원칙](#1-ai-driven-development의-핵심-원칙)
2. [주요 방법론 비교](#2-주요-방법론-비교)
3. [도구 생태계 지도](#3-도구-생태계-지도)
4. [Context Engineering](#4-context-engineering)
5. [자동화 파이프라인](#5-자동화-파이프라인)
6. [멀티에이전트 패턴](#6-멀티에이전트-패턴)
7. [실전 사례에서 얻은 교훈](#7-실전-사례에서-얻은-교훈)
8. [범용 AI-Driven Workflow 설계를 위한 핵심 빌딩 블록](#8-범용-ai-driven-workflow-설계를-위한-핵심-빌딩-블록)

---

## 1. AI-Driven Development의 핵심 원칙

10개 문서 전체에서 반복적으로 등장하는 공통 원칙들을 추출하면 다음 6가지로 수렴한다.

### 원칙 1: Plan First — 코드 전에 계획

모든 방법론에서 공통적으로 강조하는 첫 번째 원칙은 **코드 생성 전 계획 수립**이다. 바이브 코딩(vibe coding)과 AI-driven development를 구분하는 가장 핵심적인 차이점이다.

- PDCA: 7~15분의 계획 단계를 반드시 선행
- SDD: 사양(Spec) 문서를 단일 진실 원천으로 먼저 작성
- Plan Mode: Claude Code에서 읽기 전용 분석 후 계획 승인
- Kiro: 요구사항 → 설계 → 태스크 문서를 코드보다 먼저

> "아마추어는 바로 코딩에 착수하지만, 전문가는 연구 → 계획 → 구현 → 검증의 체계적인 흐름을 따른다."

### 원칙 2: Small Slices — 작은 단위로 분해

단일 프롬프트로 대규모 기능을 요청하는 것은 가장 흔한 안티패턴이다. 성공하는 AI 워크플로우는 모두 작업을 "한 입 크기(bite-size)"로 분해한다.

- 각 단위는 검토하고 커밋 가능한 크기
- 멀티에이전트 팀: 팀원 1명당 5~6개 태스크가 최적
- 원자적 커밋(Atomic Commit): AI 생성 코드는 반드시 이해 후 즉시 커밋

### 원칙 3: Context Engineering — AI에게 충분한 맥락 제공

AI는 "컨텍스트가 없는 광범위한 지식을 가진 개발자"다. 충분한 컨텍스트를 제공하면 시니어처럼 동작한다. 이것이 단순 프롬프트 엔지니어링을 넘어선 **Context Engineering**이다.

- CLAUDE.md / .cursorrules / .clinerules 등 규칙 파일 관리
- 세션 간 메모리 파일 (MEMORY.md, Memory Bank)
- ADR(Architecture Decision Record)로 설계 결정 보존
- Repomix 등으로 코드베이스 전체 컨텍스트 패키징

### 원칙 4: Verification Loops — 반복적 검증

AI 생성 코드를 그대로 수용하는 것은 위험하다. 모든 성공 사례는 검증 루프를 포함한다.

```
AI 코드 생성 → 린트 → 타입 체크 → 테스트 → 인간 검토 → [실패 시 AI에 피드백] → 반복
```

TDD(테스트 주도 개발)는 AI와의 최강 조합이다. 테스트가 먼저 존재하면 AI가 "통과하는 척"하는 잘못된 테스트를 만들 수 없다.

### 원칙 5: Human Oversight — 인간 감독 유지

2025년 업계 합의: AI는 자율 주행이 아닌 **가속기**다.

- AI 생성 코드 = 주니어 개발자 코드 (동일한 리뷰 기준 적용)
- 보안 크리티컬 코드는 반드시 인간이 직접 검토
- AI 코드 40~45%에 보안 취약점 포함 (복수 연구 결과)
- 이해하지 못하는 코드는 커밋하지 않는다

### 원칙 6: Documentation as Memory — 문서가 프로젝트의 기억

AI 에이전트는 세션이 끊기면 컨텍스트를 잃는다. 문서가 프로젝트의 지속적인 "기억"이 된다.

- CLAUDE.md: AI가 세션마다 읽는 프로젝트 헌법
- ADR: 왜 이 결정을 했는지 기록
- Memory Bank: 현재 진행 상황과 패턴 보존
- docs/plan/*.md: 계획과 구현 로그 저장

---

## 2. 주요 방법론 비교

### 2.1 PDCA 사이클 (Plan-Do-Check-Act)

**배경**: Google DORA 2024 보고서에서 AI 도구 도입 25% 증가마다 배포 안정성 7.2% 감소. GitClear 분석에서 코드 중복이 2020년 0.70% → 2024년 6.66%로 10배 증가. PDCA는 이 "AI 코드 부채" 문제에 대응하는 방법론.

**워크플로우**:
```
Plan (7-15분)
  → 코드베이스 분석 → 아키텍처 드리프트 방지 → 실행 전략 수립
Do (구현)
  → TDD 방식: 실패 테스트 먼저 → 단계별 투명성 유지
Check (검토)
  → 모든 목표 달성 여부 → 테스트 통과 → 문서 완비 → 회귀 없음
Act (회고)
  → 효과적인 패턴 식별 → 프롬프트 개선 → 다음 세션 최적화
```

**전체 사이클**: 1~3시간 내 완료 권장

**측정 지표** (GitHub Actions로 추적):

| 지표 | 목표값 |
|------|--------|
| 대형 커밋 비율 | < 20% |
| 테스트 우선 작성 비율 | > 50% |
| 커밋당 평균 변경 파일 수 | < 5 |

**효과** (InfoQ 사례): 비구조적 방식 대비 프로덕션 코드 534 → 350줄 감소, 테스트 코드 759 → 984줄 증가

**장점**: 체계적, 측정 가능, AI 코드 부채 방지
**단점**: 초기 토큰 비용 증가, 소규모 작업에는 과도할 수 있음

---

### 2.2 Spec-Driven Development (SDD)

**핵심**: AI에게 코드 생성을 요청하기 전에 구조화된 사양(Specification)을 먼저 작성. 사양이 AI와 인간 모두의 단일 진실 원천이 된다.

**3가지 활용 수준**:

| 수준 | 설명 |
|------|------|
| Spec-first | 작업 초반 사양 작성, 완료 후 폐기 |
| Spec-anchored | 사양을 유지·발전시키며 기능과 함께 진화 |
| Spec-as-source | 사양이 주요 편집 대상, 코드는 자동 생성 |

**워크플로우**:
```
아이디어 → PRD (What) → 사양 (How, 기술 제약 + 인수 기준)
        → AI 사양 검토/보완 → 구현 계획 → 코드 생성
        → GIVEN/WHEN/THEN 인수 기준 검증 → 완료
```

**장점**: AI 환각 감소, 인수 기준 명확, 아키텍처 일관성 유지
**단점**: 사양 유지 비용 발생, 빠른 프로토타입에는 오버킬

---

### 2.3 TDD + AI (Red-Green-Refactor)

**핵심**: TDD는 AI와 결합했을 때 시너지가 극대화된다. 바이너리(통과/실패) 테스트가 AI에게 줄 수 있는 가장 명확한 목표이기 때문이다.

**워크플로우**:
```
RED    → 개발자가 실패하는 테스트 작성 (AI에게 엣지 케이스 제안 요청)
GREEN  → AI에게 "이 테스트를 통과시키는 최소한의 코드 작성" 요청
REFACTOR → AI에게 "테스트를 유지하며 코드 개선" 요청
         → 테스트 재실행으로 안전 확인
```

**AI와 인간의 역할 분담**:

| 단계 | 인간 | AI |
|------|------|-----|
| 테스트 작성 | 요구사항 정의, 엣지케이스 설계 | 엣지케이스 제안, 보일러플레이트 |
| 구현 | 검토 및 승인 | 코드 작성 |
| 리팩토링 | 방향 결정 | 구체적인 개선 적용 |

**TDD가 AI 활용에서 중요한 이유**:
1. 환각 방지: 테스트가 먼저 존재하면 AI가 잘못된 테스트를 만들지 못함
2. 명확한 목표: 바이너리 통과/실패 = AI에게 완벽한 명세
3. 롤백 기준: 테스트 실패 = 즉시 되돌릴 기준점

**장점**: 환각 방지, 코드 품질 보장, 점진적 확신
**단점**: 테스트 작성 시간 투자 필요

---

### 2.4 Plan → Implement → Review 사이클

**핵심**: Claude Code Plan Mode를 활용한 읽기 전용 분석 → 계획 승인 → 구현 실행

**워크플로우**:
```
1. Explore (Plan Mode)
   → 관련 코드 읽기 및 이해

2. Plan (Plan Mode)
   → 상세 구현 전략 생성 → docs/plan/*.md로 저장
   → 개발자가 인라인 노트 추가하며 계획 정제 (1~6회 반복)

3. Implement (Normal Mode / Auto-Accept)
   → 승인된 계획 실행
   → 단계별 진행 체크리스트 업데이트

4. Commit (Normal Mode)
   → 변경 사항 커밋 + PR 초안 작성
```

**"한 문장 규칙"**: 변경 사항을 한 문장으로 설명할 수 없다면 Plan Mode 사용
- 3개 이상 파일 수정
- 아키텍처 결정 필요
- 익숙하지 않은 코드베이스

**장점**: 낭비 방지, 아키텍처 제어, 인간 승인 포인트 명확
**단점**: 소형 작업에는 오버헤드

---

### 2.5 방법론 종합 비교표

| 방법론 | 핵심 원칙 | 대표 도구 | 적합한 상황 | 주요 장점 | 주의점 |
|--------|----------|-----------|------------|-----------|--------|
| PDCA | 계획→실행→검증→개선 반복 | bkit, Claude Code | 프로젝트 전반 품질 관리 | 코드 부채 방지, 측정 가능 | 초기 토큰 비용 |
| SDD | 사양이 단일 진실 원천 | Kiro, Spec-Kit | 복잡한 기능 구현 | AI 환각 감소, 인수 기준 명확 | 사양 유지 비용 |
| TDD+AI | 테스트가 AI의 명세 | Claude Code, Cursor | 모든 기능 개발 | 환각 방지, 품질 보장 | 테스트 작성 시간 |
| Plan→Impl→Review | 코드 전에 계획 승인 | Claude Code Plan Mode | 비트리비얼 모든 작업 | 낭비 방지, 아키텍처 제어 | 소형 작업엔 과도함 |
| Prompt-Driven | 규칙 파일로 AI 행동 제어 | CLAUDE.md, .cursorrules | 팀 일관성 유지 | 반복 설명 불필요 | 규칙 파일 관리 필요 |

---

## 3. 도구 생태계 지도

### 3.1 패러다임별 분류

**패러다임 A: 대화 중심 (Conversational)**
- **Aider**: 터미널 기반, Architect/Editor 2모델 분리, SWE-bench 85%
  - 핵심 아이디어: 설계(Architect) → 구현(Editor) 역할 분리
  - `ask 모드`로 설계 논의 → `code 모드`로 구현
- **Windsurf**: 의도 추론 기반 Cascade, 모든 액션 추적, Turbo 모드 자율 실행
  - 핵심 아이디어: AI가 개발자 의도를 추론해 선제적으로 행동
- **Cursor**: VS Code 기반, 최고의 UX, 멀티에이전트 병렬 실행 (Cursor 2.0)
  - 핵심 아이디어: 일상적 코딩에 AI를 1등 시민으로 통합

**패러다임 B: 구조/문서 중심 (Structured)**
- **bkit**: Claude Code 플러그인, PDCA 자동화, 27개 스킬 + 16개 에이전트
  - 핵심 아이디어: Context Engineering + PDCA 구조화 = docs=code 철학
- **Amazon Kiro**: 사양 주도 IDE, Requirements → Design → Tasks 자동 생성
  - 핵심 아이디어: 코드 전에 명세 → 파일 이벤트 기반 Hook 자동화
- **GitHub Copilot Workspace**: 이슈 → 스펙 → 계획 → 코드 단계적 워크플로우
  - 핵심 아이디어: GitHub 생태계와 깊은 통합, spec-to-code 여정
- **Continue.dev**: 오픈소스, config.yaml, CI/CD 통합, 모델 선택 자유
  - 핵심 아이디어: 도구 독립성과 팀 표준화 동시 달성

**패러다임 C: 완전 자율 (Autonomous)**
- **Claude Code**: 터미널 네이티브, 200K 컨텍스트, SWE-bench 82%, 에이전트 팀 지원
  - 핵심 아이디어: Unix 철학의 자율 에이전트, 멀티 워크트리 병렬 실행
- **Devin**: 최초의 완전 자율 AI 엔지니어, sandboxed 환경 (Devin 2.0: $20/월)
  - 핵심 아이디어: 자연어 작업 → 자율 실행 → PR 생성
- **OpenHands**: Devin 오픈소스 버전, Docker 샌드박스
- **Google Jules**: 비동기 AI 코딩 에이전트, 개발자가 기다리지 않아도 됨
  - 핵심 아이디어: GitHub 이슈 할당 → Jules가 백그라운드에서 작업 → PR 생성

**패러다임 D: 특화/신흥 (Specialized)**
- **Augment Code**: 대규모 코드베이스 특화, 400K+ 파일 처리, Context Engine MCP
  - 핵심 아이디어: 전체 코드베이스 의미론적 인덱싱을 MCP로 다른 도구에 제공
- **Roo Code**: 커스텀 모드 시스템, Boomerang 오케스트레이션, 모드별 권한 격리
  - 핵심 아이디어: 역할별 모드(보안 리뷰어, 테스트 작성자) + 파일 접근 권한 분리
- **Sourcegraph Amp**: 병렬 스레드 기반 멀티에이전트, 비동기 태스크 실행
- **Zed AI**: Rust 기반 고성능, Edit Prediction 로컬 모델, CRDT 실시간 협업
- **JetBrains AI**: PSI 트리 기반 IDE 네이티브 통합, 실제 코드 구조 이해
- **OpenAI Codex CLI**: 네트워크 차단 샌드박스, 오픈소스 Rust 재작성

### 3.2 각 도구에서 배울 수 있는 고유한 워크플로우 아이디어

| 도구 | 고유한 아이디어 | Claude Code에 적용하는 방법 |
|------|----------------|---------------------------|
| Aider | Architect/Editor 분리 | Plan Mode(설계) → Normal Mode(구현) 분리 |
| Kiro | 이벤트 기반 Hook 자동화 | PostToolUse Hook으로 파일 저장 시 린트 자동 실행 |
| Roo Code | 모드별 권한 격리 | 에이전트 파일에 `tools`를 제한 (보안 리뷰어: Read only) |
| Google Jules | 비동기 작업 위임 | GitHub Actions + claude-code-action으로 이슈 자동 구현 |
| Augment | Context Engine MCP | 대규모 코드베이스에 Augment MCP 연결 |
| Windsurf | 세션 시작 컨텍스트 | "오늘 작업: SAAS-N. 현재 상태: X. 목표: Y" 패턴 명시 |

### 3.3 시나리오별 도구 추천

| 시나리오 | 최우선 도구 | 이유 |
|---------|-----------|------|
| 일상적 코딩/자동완성 | Cursor / Windsurf | 최고의 IDE UX |
| 복잡한 리팩터링 | Claude Code | 200K 컨텍스트, 멀티파일 이해 |
| 신규 기능 계획 수립 | bkit / Kiro | PDCA, Spec-driven 워크플로우 |
| 완전 자율 작업 위임 | Devin / Jules | 비동기 실행, 감독 하 자율 완료 |
| 대규모 코드베이스 | Augment Code | 400K+ 파일 처리, 의존성 이해 |
| 오픈소스/프라이버시 | Continue.dev / OpenHands | 자체 호스팅, 모델 선택 자유 |
| 엔터프라이즈 보안 | Cody Enterprise | Zero code retention, SOC 2 |

---

## 4. Context Engineering

### 4.1 CLAUDE.md 실전 베스트 프랙티스

**포함해야 할 것 vs 포함하지 말아야 할 것**:

| 포함해야 할 것 | 포함하지 말아야 할 것 |
|---|---|
| Claude가 추측할 수 없는 명령어 | 코드만 읽어도 알 수 있는 것 |
| 기본값과 다른 코드 스타일 규칙 | Claude가 이미 아는 언어 컨벤션 |
| 테스트 명령어 및 선호 테스트 러너 | 자세한 API 문서 (링크로 대체) |
| 브랜치 명명, PR 컨벤션 | 자주 바뀌는 정보 |
| 프로젝트 특수 아키텍처 결정사항 | "클린 코드 작성" 같은 자명한 것 |
| 자명하지 않은 함정 | 파일별 코드베이스 설명 |

**핵심 원칙**: "이 줄을 삭제하면 Claude가 실수를 할까?" → 아니라면 삭제하라.

**효과적인 CLAUDE.md 구조 (CS Dashboard 예시)**:
```markdown
## Quick Facts
- Stack: Django, PostgreSQL, HTMX
- Package Manager: uv (pip 절대 사용 금지)
- Test: uv run pytest -x --lf (전체 스위트 실행 금지)

## Non-obvious gotchas
- CELERY_BROKER_URL은 .env에서만 (settings.py 직접 입력 금지)
- Django signals는 apps/core/apps.py의 ready()에서만 연결

## Skill Activation
- 디버깅 → systematic-debugging skill
- Django 탐색 → django-extensions skill

## Branch naming: {initials}/{description}
```

**CLAUDE.md 임포트 기능** (잘 모르는 기능):
```markdown
See @README.md for overview and @docs/git-instructions.md for git workflow.
```
`@path/to/file` 구문으로 다른 파일을 참조해 CLAUDE.md 자체는 간결하게 유지.

### 4.2 도구별 규칙 파일 비교

| 도구 | 파일 위치 | 조건부 로딩 | 크기 제한 |
|------|-----------|-----------|---------|
| Claude Code | `CLAUDE.md` | 디렉토리 구조 | 권장 < 30줄 |
| Cursor | `.cursor/rules/*.mdc` | globs 패턴 + 4가지 활성화 모드 | 없음 |
| Windsurf | `.windsurfrules` | 제한적 | 6,000자 |
| Cline | `.clinerules/` (디렉토리) | 파일별 | 없음 |
| Kiro | `.kiro/steering/*.md` | `inclusion: always/conditional/manual` | 없음 |

**Cursor .mdc의 4가지 활성화 모드** (강력한 기능):
1. `alwaysApply: true` — 항상 포함
2. `globs: ["*.py"]` — 파일 패턴 매칭 시 자동 포함
3. `description` 있음 + `alwaysApply: false` — 에이전트 요청 시 포함
4. `description` 없음 + `alwaysApply: false` — `@rule-name` 수동 호출만

### 4.3 Memory 관리 패턴

**Cline Memory Bank 패턴** (6파일 구조):
```
memory-bank/
├── projectBrief.md      # 핵심 요구사항과 목표 (Foundation)
├── productContext.md    # 왜 이 프로젝트를 하는가
├── systemPatterns.md   # 아키텍처, 기술 결정
├── techContext.md      # 기술 스택, 개발 환경
├── activeContext.md    # 현재 작업 포커스, 최근 변경
└── progress.md        # 완료된 작업, 남은 작업, 이슈
```
"모든 작업 시작 시 Memory Bank 파일 전부 읽기 — 선택 사항이 아님"

**Claude Code Auto Memory** (`~/.claude/projects/{path}/memory/`):
- MEMORY.md: 항상 로드되는 핵심 메모리 (200줄 제한)
- 상세 내용은 별도 파일에, MEMORY.md에는 링크만

**세션 관리 실전 팁**:
```bash
claude --resume              # 세션 선택 메뉴
/rename feature-user-auth    # 세션 브랜치처럼 명명
/compact                     # 컨텍스트 70~80% 시 압축
/clear                       # 관련없는 작업 시작 시 초기화
```

**Context 최적화 전략**:
- 탐색/조사는 서브에이전트에 위임 → 메인 context 보호
- Repomix로 코드베이스를 AI 친화적 단일 파일로 패키징 (`repomix --compress`)
- 컨텍스트 60~70%: compact 검토, 70~80%: compact 권장, 80%+: 즉시 실행

### 4.4 효과적인 프롬프트 패턴

**기능 구현 프롬프트 구조** (컨텍스트 + 명세 + 검증 기준):
```
[목표: 한 문장]
요구사항:
1. 케이스 A → 결과 X
2. 케이스 B → 결과 Y
제약사항:
- [제약 1]
- [제약 2]
구현 후 pytest로 테스트 실행해서 통과 확인.
파일: apps/accounts/validators.py
```

**7단계 구조화 프롬프트 패턴**:
```
1. 목표: [한 문장으로 명확하게]
2. 제약: [3-7개 핵심 규칙]
3. 예시: [입력→출력 2개]
4. 엣지케이스: [실패 시나리오 2개]
5. 크기: [작은 단위로 요청]
6. 테스트 포함: [검증 코드 함께 요청]
7. 반복: [실패 시 재프롬프트]
```

**Writer/Reviewer 패턴** (2개 세션):
- Session A(Writer): 기능 구현
- Session B(Reviewer): 구현 코드 리뷰 (직접 쓰지 않았으므로 편향 없음)

**"Claude 인터뷰 패턴"** (대형 기능):
```
사용자 알림 시스템을 만들려고 해.
AskUserQuestion 툴로 나를 인터뷰해줘.
기술 구현, UX, 엣지 케이스, 트레이드오프를 물어봐.
충분히 이야기 나눈 후 SPEC.md에 완전한 명세를 작성해줘.
```

---

## 5. 자동화 파이프라인

### 5.1 계층적 품질 게이트 아키텍처

```
Layer 1: 실시간 (코드 작성 중)
  └── IDE 린터 (ruff + pyright 연동)

Layer 2: Pre-commit (커밋 시)
  ├── ruff check + format (자동 수정)
  ├── pyright 타입 체크
  ├── detect-secrets (시크릿 탐지)
  ├── no-commit-to-branch (메인 브랜치 보호)
  └── commitizen (Conventional Commits 검증)

Layer 3: CI/PR 생성 시
  ├── pytest (전체 테스트 + 커버리지 80% 임계값)
  ├── AI 코드 리뷰 (CodeRabbit 자동)
  └── Claude PR Review (anthropics/claude-code-action)

Layer 4: 머지 전 (인간 검토)
  ├── 비즈니스 로직 검토
  ├── 아키텍처 일관성 확인
  └── 보안 취약점 최종 확인
```

### 5.2 Pre-commit 설정 레시피 (Python/Django)

```yaml
# .pre-commit-config.yaml
repos:
  # 기본 파일 검사
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: detect-private-key
      - id: no-commit-to-branch
        args: [--branch, main]

  # Ruff (lint + format)
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.1
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  # Pyright
  - repo: https://github.com/RobertCraigie/pyright-python
    rev: v1.1.391
    hooks:
      - id: pyright
        pass_filenames: false

  # Django 특화 (pre-push에서만 — 느림)
  - repo: local
    hooks:
      - id: django-check
        entry: uv run python manage.py check
        language: system
        pass_filenames: false
        stages: [pre-push]
      - id: django-migrations-check
        entry: uv run python manage.py migrate --check
        language: system
        pass_filenames: false
        stages: [pre-push]
```

### 5.3 Claude Code Hooks 자동화 레시피

**레시피 A: 파일 수정 후 린트 자동 실행**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run ruff check . --quiet",
        "async": true,
        "statusMessage": "Ruff 검사 중..."
      }]
    }]
  }
}
```

**레시피 B: 위험한 명령 차단**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/block-dangerous.sh"
      }]
    }]
  }
}
```

**레시피 C: 세션 시작 시 환경 확인**
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/check-env.sh"
      }]
    }]
  }
}
```

**레시피 D: 테스트 파일 수정 시 테스트 자동 실행**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/run-tests-if-test-file.sh",
        "async": true
      }]
    }]
  }
}
```

### 5.4 GitHub Actions CI 파이프라인

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: uv sync
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run pyright
      - run: uv run pytest --cov --cov-fail-under=80
```

### 5.5 AI 기반 자동화 GitHub Actions 레시피

**레시피 1: @claude 멘션 트리거 (PR/이슈에서 협업)**
```yaml
# .github/workflows/claude.yml
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**레시피 2: PR 자동 코드 리뷰**
```yaml
# PR 생성/업데이트 시 자동 실행
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  review:
    if: github.event.pull_request.draft == false
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이 PR을 리뷰해주세요:
            1. N+1 쿼리 문제
            2. 타입 힌트 누락
            3. 보안 취약점
            4. 테스트 누락
          claude_args: "--max-turns 5 --model claude-sonnet-4-6"
```

**레시피 3: 이슈 자동 구현 ("claude-implement" 라벨)**
```yaml
on:
  issues:
    types: [labeled]

jobs:
  implement:
    if: github.event.label.name == 'claude-implement'
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: "이슈 구현 + 테스트 작성 + PR 생성"
          claude_args: "--max-turns 20 --model claude-opus-4-6"
```

**레시피 4: 주간 자동 코드베이스 분석**
```yaml
on:
  schedule:
    - cron: "0 9 * * 1"  # 매주 월요일 오전 9시
```

### 5.6 CodeRabbit 설정 핵심 (Django 프로젝트용)

```yaml
# .coderabbit.yaml
language: "ko-KR"
reviews:
  profile: "assertive"
  path_filters:
    - "!migrations/**"
    - "!uv.lock"
  path_instructions:
    - path: "apps/**/*.py"
      instructions: |
        - N+1 쿼리 (select_related/prefetch_related 누락)
        - 적절한 HTTP 상태 코드
        - 타입 힌트 누락
    - path: "tests/**/*.py"
      instructions: |
        - Factory Boy 패턴 준수
        - 구현이 아닌 동작 테스트
  auto_review:
    enabled: true
    drafts: false
    base_branches: ["main"]
```

---

## 6. 멀티에이전트 패턴

### 6.1 단일 에이전트 vs 멀티에이전트 선택 기준

```
작업이 컨텍스트 윈도우를 초과하는가?
├── 예 → 멀티에이전트 필수
└── 아니오 ↓

작업이 독립적으로 병렬화 가능한가?
├── 아니오 → 단일 에이전트 사용
└── 예 ↓

팀메이트 간 직접 소통이 필요한가?
├── 아니오 → 서브에이전트 사용 (비용 절약)
└── 예 → 에이전트 팀 사용
```

**토큰 비용 가이드**:

| 방식 | 상대적 비용 |
|-----|-----------|
| 단일 에이전트 | 1x |
| 서브에이전트 (3개) | 2~3x |
| 에이전트 팀 (3명) | 3~7x |
| 에이전트 팀 (6명) | 6~10x |

### 6.2 아키텍처 패턴 2종

**패턴 A: 서브에이전트 (단일 세션 내)**
- 메인 에이전트가 모든 조율 담당
- 서브에이전트: 독립 컨텍스트 윈도우에서 실행, 결과만 반환
- 서브에이전트 간 직접 통신 불가
- 적합한 경우: 빠른 집중 탐색, 결과만 필요한 경우

**패턴 B: 에이전트 팀 (멀티 세션)**
- 팀메이트: 독립된 Claude Code 인스턴스
- 공유 태스크 리스트(`~/.claude/tasks/{team}/`)로 작업 조율
- 팀메이트 간 직접 메시지 가능
- 완료된 태스크가 차단된 태스크를 자동 해제
- 적합한 경우: 상호 협력이 필요한 복잡한 작업

### 6.3 팀 구성 전략

**전략 A: 리서처 → 구현자 → 리뷰어**
```
리서처 (Haiku, Read 전용)
  → 코드베이스 탐색, 패턴 분석, 요구사항 파악
구현자 (Sonnet, 전체 도구)
  → 기능 구현, 테스트 작성, 버그 수정
리뷰어 (Opus, Read 전용)
  → 코드 품질, 보안, 성능, 표준 준수 검토
```

**전략 B: 풀스택 기능 개발 팀**
```
팀 리드: 에픽 분해 → 태스크 생성 → 통합 검증
모델 설계자: DB 스키마, 마이그레이션
뷰 구현자: Django FBV, URL 라우팅
템플릿 개발자: HTMX, 부분 템플릿
테스트 작성자: pytest, Factory Boy
```

**전략 C: 병렬 리뷰어 (다각도 분석)**
```
보안 리뷰어: 인증 취약점, 입력 검증, API 키 노출
성능 리뷰어: N+1 쿼리, 인덱스, 캐시
테스트 커버리지 리뷰어: 미테스트 경로, 엣지 케이스
  → 팀 리드가 3개 관점 통합 → 종합 리뷰 보고서
```

**전략 D: 경쟁 가설 디버깅**
```
버그: "로그인 후 가끔 세션이 끊긴다"
  → 가설 A: Redis 세션 만료 문제
  → 가설 B: Django 미들웨어 충돌
  → 가설 C: JWT 토큰 만료 처리
각 팀메이트가 자신의 가설 검증 → 가장 강한 증거를 가진 가설 채택
```

### 6.4 커뮤니케이션 패턴 3종

**허브-앤-스포크**: 모든 조율이 팀 리드를 통과. 단순하지만 리드가 병목. 소규모(3명 이하)에 적합.

**피어-투-피어**: 팀메이트 간 직접 소통. 빠른 조율, 복잡성 증가. 중규모(4~6명)에 적합.

**보고 체인**: 명확한 단계별 진행. 순차적 종속성이 있는 작업에 적합.

### 6.5 Worktree 기반 병렬 작업

```bash
# 격리된 worktree에서 병렬 실행
claude --worktree feature-auth    # 기능 A 개발
claude --worktree bug-fix-b       # 버그 수정
claude --worktree refactor-models # 리팩토링

# 서브에이전트 frontmatter로 자동 격리
---
name: feature-implementer
isolation: worktree  # 자동으로 임시 git worktree 생성
---
```

**Worktree 병렬 패턴 2종**:
1. **대규모 마이그레이션**: 50개 파일 → 에이전트 3명이 각각 10개씩 병렬 처리
2. **경쟁 구현 (A/B)**: 에이전트 A는 접근법 1, 에이전트 B는 접근법 2 → 비교 후 선택

### 6.6 파일 충돌 방지 원칙

1. 팀메이트별 담당 앱/모듈 명시 (`apps/accounts/` vs `apps/dashboard/`)
2. 공유 파일(`urls.py`, `settings.py`)은 팀 리드만 수정
3. Git worktree로 완전 격리

### 6.7 Claude Agent SDK (자동화/CI용)

Claude Code를 라이브러리로 사용해 프로덕션 AI 에이전트 구축:
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="auth.py의 버그를 찾아 수정하세요",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Bash"],
        permission_mode="acceptEdits"
    ),
):
    print(message)
```

| 구분 | Claude Code CLI | Claude Agent SDK |
|------|----------------|------------------|
| 사용 사례 | 대화형 개발 | CI/CD, 자동화 파이프라인 |
| 제어 수준 | 대화 기반 | 코드 기반 정밀 제어 |
| 세션 관리 | 수동 | 프로그래밍 방식 |

---

## 7. 실전 사례에서 얻은 교훈

### 7.1 성공 사례 요약

**Vulcan Technologies (YC S25)**
- 엔지니어링 배경 없는 팀 → Claude Code로 버지니아 주 규제 분석 플랫폼 구축
- 기성 컨설팅 펌을 제치고 정부 계약 수주
- $10.9M 시드 라운드 조달
- 교훈: **비개발자의 창업이 현실이 됨**

**HumanLayer (YC F24)**
- 팀 전체가 "모든 것을 Claude Code로 작성" 방식 채택
- 300,000 라인 Rust 코드베이스도 Claude Code로 처리
- 하루 만에 일주일치 작업 분량 배포
- 교훈: **적절한 컨텍스트 엔지니어링이 있으면 언어 장벽도 극복**

**TELUS (57,000명 임직원)**
- 13,000개+ 커스텀 AI 솔루션 운영
- 누적 50만 시간 이상 절약, $9,000만 이상 비즈니스 이익
- 교훈: **엔터프라이즈 ROI는 측정 가능하고 증명됨**

**Boris Cherny (Claude Code 창시자) 워크플로우**
- 10~15개 병렬 세션 운영 (로컬 5개 + 원격 5~10개)
- Plan Mode 충분히 논의 → Auto-accept 모드 전환 → 검증 루프 반복 → 결과 2~3배 향상
- CLAUDE.md에 실수와 베스트 프랙티스 누적 (현재 2.5k 토큰)
- 교훈: **계획 후 자율 실행, 검증 루프가 핵심**

**솔로 개발자 성공 사례**
- Danny Postma: AI 도구로 HeadshotPro → 월 $300K 수익
- 1인 개발자 SaaS 포트폴리오 → 월 $28K
- PM이 Claude Code로 App Store iOS 앱 출시
- 교훈: **1인 개발 SaaS의 수익 상한이 AI로 인해 크게 올라감**

### 7.2 실패 사례 요약

**EnrichLead (Cursor AI 전적 의존)**
- "직접 쓴 코드 단 한 줄 없다"고 자랑
- 런칭 2일 후 보안 공격 → API 키 평문 노출, 인증 없음, DB 무보호
- 앱 전체 셧다운
- 교훈: **AI 코드는 기능적으로는 완성도 높지만, 보안 판단력은 체계적으로 결여**

**결제 게이트웨이 $200만 사기**
- Vibe 코딩으로 구축한 결제 시스템 → 입력 검증 없음 → $200만 규모 사기 거래 승인
- 교훈: **보안 크리티컬 코드는 반드시 인간이 명시적으로 검증을 요구해야 함**

**AI 코드 구조적 문제 통계**:
| 항목 | 수치 |
|------|------|
| AI 생성 코드 내 보안 취약점 비율 | 15~25% |
| OWASP Top 10 취약점 포함 비율 | 45% |
| AI 코드 인간 코드 대비 취약성 | 30~40% 더 취약 |
| Vibe 코딩 스타트업 중 재구축 필요 추정 | ~80% |

### 7.3 핵심 교훈 종합

**교훈 1: 컨텍스트 엔지니어링 > 단순 바이브 코딩**
2025년 하반기부터 "vibe coding"에서 체계적인 "context engineering"으로 패러다임 이동 시작. 10,000개 AI 스타트업 중 8,000개가 재구축 필요 추정 — 이 비용이 2026~2027년에 집중적으로 터질 전망.

**교훈 2: 숙련 개발자의 역설**
- 숙련 개발자: AI 사용 시 19% **더 느림** (예상은 24% 빠를 것으로 기대)
- 주니어 개발자: 21~40% 생산성 향상
- 이유: 경험자는 AI 제안의 문제를 더 많이 발견하고 수정함
- **AI는 주니어를 빠르게 하고, 시니어를 더 신중하게 만든다**

**교훈 3: 보안은 자동으로 적용되지 않는다**
입력 검증, 인증, 권한 부여는 반드시 인간이 명시적으로 요구해야 한다. AI에게 "보안을 알아서 처리해줘"는 통하지 않는다.

**교훈 4: 워크플로우 성숙도 단계**
```
Level 1 - 반응적: AI에게 질문하고 답변 수용 → 불일관, 기술 부채
Level 2 - 안내된: CLAUDE.md 작성 → 일관성 향상, 20~40% 생산성 향상
Level 3 - 체계적: PDCA + 검증 루프 + 병렬 세션 → 2~3배 생산성
Level 4 - AI 네이티브: 자동화 프레임워크 + 에이전트 팀 → 전체 파이프라인 자동화
```

**교훈 5: 주니어 개발자 공동화 역설**
2025년 LeadDev 조사에서 엔지니어링 리더 54%가 AI 효율화로 주니어 채용 축소 계획. 그러나 미래의 AI 코드 부채를 수정할 역량이 사라지는 악순환이 예고됨.

---

## 8. 범용 AI-Driven Workflow 설계를 위한 핵심 빌딩 블록

10개 문서 조사에서 추출한, 어떤 프로젝트에든 적용 가능한 워크플로우 구성 요소들.

### 블록 1: 프로젝트 헌법 (CLAUDE.md + ADR)

모든 AI 세션의 출발점. 한 번 잘 작성하면 반복 설명이 사라진다.

**구성 요소**:
- `CLAUDE.md` (프로젝트 루트): 스택, 명령어, 비자명한 함정, Git 컨벤션, 스킬 트리거
- `~/.claude/CLAUDE.md` (전역): 개인 선호도 (모든 프로젝트 적용)
- `docs/adr/` (Architecture Decision Records): "왜 이렇게 결정했는가" 기록
- `.claude/memory/MEMORY.md`: 세션 간 누적 학습 (200줄 제한)

**실행 방법**: `@README.md`, `@docs/adr/` 임포트 구문으로 CLAUDE.md 자체는 간결하게 유지.

---

### 블록 2: 계획 게이트 (Planning Gate)

코드를 쓰기 전에 계획을 검토하고 승인하는 인간 감독 포인트.

**구성 요소**:
- Claude Code Plan Mode (`Shift+Tab` 또는 `claude --permission-mode plan`)
- `docs/plan/{feature}.md`: 계획 문서 버전 관리
- Spec 문서: requirements → design → tasks (Kiro 방식)
- ADR: 아키텍처 결정 포함 시

**핵심 규칙**: "변경 사항을 한 문장으로 설명할 수 없다면 Plan Mode 사용"

---

### 블록 3: 검증 루프 (Verification Loop)

AI가 생성한 코드를 자동으로 검증하는 피드백 사이클.

**구성 요소**:
```
코드 생성 → [린트] → [타입 체크] → [테스트] → [인간 검토]
    ↑ 실패 시 AI에게 오류 메시지 전달 (피드백 루프)
```

**구현 방법**:
- Pre-commit hooks: 커밋 전 자동 검증
- Claude Code Hooks (PostToolUse): 파일 수정 후 즉시 검증
- CI/CD: PR 단계에서 전체 검증

**TDD 통합**: 테스트 먼저 → AI에게 구현 요청 = 환각 방지의 최강 조합

---

### 블록 4: 스킬 레지스트리 (Skill Registry)

반복적인 도메인 작업을 재사용 가능한 모듈로 패키징.

**구성 요소**:
- `.claude/skills/{skill-name}/SKILL.md`: 스킬 정의 (frontmatter + 지침)
- `description` 필드: 자동 트리거의 핵심 (언제 사용하는지 기술)
- `references/`: 상세 내용 분리 (3단계 점진적 로딩)
- `.claude/agents/{agent}.md`: 역할 특화 에이전트 정의

**현재 프로젝트 스킬 예시**: `jira`, `start-work`, `write-plan`, `review-plan`, `implement`, `systematic-debugging`, `django-models`, `htmx-patterns`, `pytest-django-patterns`

---

### 블록 5: 자동화 훅 세트 (Hook Set)

반복적인 수동 작업을 이벤트 기반으로 자동화.

**핵심 훅 패턴**:
| 이벤트 | 액션 | 목적 |
|--------|------|------|
| PostToolUse(Edit/Write) | ruff check | 코드 품질 자동 유지 |
| SessionStart(startup) | check-env.sh | 환경 검증 |
| PreToolUse(Bash) | block-dangerous.sh | 안전 보호 |
| PostToolUse(Edit/Write) | run-tests-if-test-file.sh | 테스트 자동 실행 |
| Stop | summary.sh | 세션 완료 요약 |

---

### 블록 6: CI/CD AI 통합 레이어

GitHub Actions에 AI를 통합해 자동화 완성.

**필수 구성**:
- `@claude` 멘션 트리거 (PR/이슈에서 AI 협업)
- PR 자동 코드 리뷰 (CodeRabbit + Claude Actions)
- 이슈 자동 구현 ("claude-implement" 라벨)
- 주간 자동 코드베이스 분석 (cron)

---

### 블록 7: 멀티에이전트 팀 템플릿

복잡한 기능을 병렬로 처리하는 에이전트 팀 구성.

**최소 팀 구성 (3명)**:
```
팀 리드: 계획 수립 → 태스크 분배 → 완료 통합
팀원 A: 구현 (Opus/Sonnet, 전체 도구)
팀원 B: 리뷰/테스트 (Sonnet, Read + Edit 제한)
```

**Worktree 격리 원칙**:
- 각 팀원은 독립 worktree에서 작업
- 담당 파일/앱 범위 명시적 지정
- 공유 파일은 팀 리드만 수정

---

### 블록 8: 세션 관리 시스템

장기 프로젝트에서 세션 간 컨텍스트를 효과적으로 유지.

**구성 요소**:
- 세션 명명: `/rename feature-{name}` (브랜치처럼 관리)
- 세션 재개: `claude --resume`
- 컨텍스트 최적화: `/compact` (70~80%), `/clear` (관련없는 작업)
- `.claude/shared-context.md`: 세션 간 공유 아키텍처 결정 파일

---

### 통합 워크플로우 — 완전한 AI-Driven 개발 사이클

위의 8개 블록을 결합한 하나의 기능 개발 사이클:

```
[시작]
1. Jira/GitHub 이슈 확인 → 브랜치 생성 (/start-work)

[계획 게이트 - 블록 2]
2. Plan Mode 진입 (Shift+Tab)
3. /write-plan → docs/plan/{feature}.md 생성
4. /review-plan → 2회 피드백 사이클
5. 계획 승인 → 다음 단계

[구현 - 블록 3, 4]
6. TDD: 실패하는 테스트 먼저 작성
7. /implement → 체크리스트 기반 순차 구현
8. Hooks가 자동으로 린트/타입 체크 실행

[검증 - 블록 3, 5]
9. uv run pytest -x --lf (로컬 전체 검증)
10. 원자적 커밋 (이해 후 즉시)

[PR + AI 리뷰 - 블록 6]
11. gh pr create → AI 리뷰 (CodeRabbit + Claude Actions)
12. 개발자 AI 피드백 검토 → 수용/거절
13. 인간 리뷰 → 머지

[회고 - 블록 1]
14. 새로운 패턴/함정 → CLAUDE.md 업데이트
15. 아키텍처 결정 → ADR 업데이트
16. 세션 학습 → MEMORY.md 업데이트
```

---

### 핵심 메타 원칙

> **"AI 도구를 가장 잘 활용하는 개발자는 코드를 가장 많이 생성하는 사람들이 아니라, 언제 신뢰하고 언제 의심하며 어떻게 책임감 있게 통합할지 아는 사람들이다."**

1. **컨텍스트 품질 > 양**: 100줄짜리 완벽한 CLAUDE.md가 1000줄짜리 포괄적 CLAUDE.md보다 효과적
2. **검증 가능하게**: AI가 자기 작업을 스스로 검증할 수 있어야 함 (테스트, 린트, 빌드)
3. **서브에이전트로 context 보호**: 탐색/조사는 서브에이전트에 위임, 메인은 구현에 집중
4. **TDD는 AI와의 최강 조합**: 테스트가 명세 = AI 환각 방지
5. **보안은 명시적으로 요구**: "보안도 신경 써줘"는 부족하다. 구체적 보안 요구사항을 나열해야 한다
6. **문서가 코드다**: ADR, Spec, CLAUDE.md가 없으면 다음 세션에 같은 실수를 반복한다
7. **작게 시작, 점진적으로 확장**: Level 1(반응적)에서 Level 4(AI 네이티브)로 단계적으로 성숙도를 높여간다

---

*이 요약은 2026년 3월 기준 10개 연구 문서(01~10번)를 통합한 결과물입니다. AI 코딩 도구 생태계는 빠르게 변화하므로 지속적인 업데이트가 필요합니다.*
