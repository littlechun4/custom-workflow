# AI 개발 도구 비교 연구 (2025-2026)

> 리서치 기준일: 2026-03-04
> 대상 도구: bkit, Aider, Cursor, Windsurf, Continue.dev, GitHub Copilot Workspace, Claude Code, Devin/OpenHands/SWE-agent

---

## 목차

1. [각 도구의 핵심 철학과 접근 방식](#1-각-도구의-핵심-철학과-접근-방식)
2. [워크플로우 패턴 비교표](#2-워크플로우-패턴-비교표)
3. [설정/구성 방법 (예제 포함)](#3-설정구성-방법)
4. [장단점 비교 매트릭스](#4-장단점-비교-매트릭스)
5. [Claude Code와의 통합 가능성](#5-claude-code와의-통합-가능성)
6. [각 도구에서 배울 수 있는 워크플로우 아이디어](#6-배울-수-있는-워크플로우-아이디어)

---

## 1. 각 도구의 핵심 철학과 접근 방식

### 1.1 bkit (Vibecoding Kit)

**핵심 철학**: Context Engineering — LLM 추론 최적화를 위한 체계적 컨텍스트 큐레이션

bkit은 Claude Code 플러그인으로, 즉흥적인 AI 지원을 "구조화된 프로세스 중심 개발"로 전환하는 것을 목표로 한다. PDCA(Plan-Do-Check-Act) 사이클과 Anthropic의 Evaluator-Optimizer 패턴을 결합하여 개발 전 과정에서 문서화와 반복 개선을 자동화한다.

**핵심 아키텍처**:
- **도메인 레이어**: 27개 도메인별 스킬 (전문 지식 컨텍스트 제공)
- **행동 레이어**: 16개 특화 에이전트 (모델 선택: opus/sonnet/haiku)
- **상태 관리**: 241개 유틸리티 함수 (PDCA 상태, 의도 감지, 팀 조율)

**PDCA 구현 방식**:
```
Plan  → 전략적 청사진 생성, 대안 탐색
Do    → 아키텍처 결정 기반 구현 가이드 생성
Check → 계획 대 실제 결과 자동 갭 분석 (90% 임계값)
Act   → Evaluator-Optimizer 패턴으로 자동 수정 (최대 5회 반복)
```

**9단계 파이프라인**:
1. 스키마 설계 → 2. API 명세 → 3. DB 모델링 → 4. 인증 설정 → 5. 프론트엔드 아키텍처 → 6. 백엔드 구현 → 7. 통합 테스트 → 8. QA → 9. 프로덕션 배포

**프로젝트 레벨**:

| 레벨 | 타입 | 스택 |
|------|------|------|
| Starter | 정적 웹사이트 | HTML/CSS/JS |
| Dynamic | 풀스택 앱 | Next.js + BaaS |
| Enterprise | 마이크로서비스 | Kubernetes, Terraform |

**독특한 특징**:
- 45개 훅 스크립트 (5개 실행 레이어)
- 8개 언어 자동 감지 (한국어 포함)
- CTO 주도 에이전트 팀 (v1.5.1): 3-5명 병렬 에이전트
- docs=code: 개발 전 과정에 문서화 내장

---

### 1.2 Aider

**핵심 철학**: Convention-Based AI Coding — 구조화된 파일 편집과 Git 통합

Aider는 터미널 기반의 순수 AI 코딩 도구로, "agentic하지 않은" 접근을 취한다. 개발자가 대화를 통해 방향을 제시하고, AI가 실제 파일을 편집하는 방식이다.

**핵심 혁신 — Architect/Editor 모드**:
```
Architect 모델: 문제를 어떻게 해결할지 전략 수립
     ↓
Editor 모델: Architect의 솔루션을 실제 파일 편집 명령으로 변환
```

이 분리를 통해 추론 집중 모델(o1, Claude)은 계획에, 편집 최적화 모델은 코드 변경에 집중할 수 있어 SWE-bench에서 SOTA 85% 달성.

**4가지 채팅 모드**:

| 모드 | 용도 | 파일 수정 |
|------|------|----------|
| `code` | 기본 모드 - 파일 직접 편집 | ✅ |
| `ask` | 질문/토론 - 수정 없이 분석 | ❌ |
| `architect` | 2모델 워크플로우 | ✅ (editor를 통해) |
| `help` | Aider 자체 도움말 | ❌ |

**추천 워크플로우**:
```
ask 모드: 접근 방식 논의 → code 모드: 구현 → ask 모드: 결과 검토
```

**컨텍스트 관리 특징**:
- treesitter + ripgrep 기반 코드 컨텍스트 fetching
- Git 기반 변경사항 추적 및 자동 커밋
- 리포맵(repomap)으로 코드베이스 구조 이해

---

### 1.3 Cursor

**핵심 철학**: AI-First IDE — VS Code 경험에 AI를 1등 시민으로 통합

Cursor는 VS Code를 기반으로 하면서 AI를 IDE의 핵심 구성요소로 만든 도구다. 2025년 Cursor 2.0에서 멀티에이전트 아키텍처로 진화했다.

**Composer 모델** (Cursor 2.0):
- 내부 개발 AI 모델 (강화학습 기반 훈련)
- 대부분의 작업을 30초 내 완료
- 코드베이스 전역 시맨틱 검색 내장

**Agent Mode** (Cursor 2.0):
- 하나의 프롬프트에 최대 8개 병렬 에이전트
- 격리된 git worktree 또는 원격 환경에서 각각 독립 실행
- 결과 비교 후 최적 솔루션 선택

**`.cursorrules` 설정**:
```markdown
# .cursorrules 예시
You are an expert Django developer.

## Tech Stack
- Django 5.0+, Python 3.12+
- PostgreSQL for database
- HTMX for dynamic interactions
- Ruff for linting

## Code Style
- Prefer function-based views
- Use type hints everywhere
- Write failing tests first (TDD)
- Use select_related/prefetch_related to avoid N+1

## File Structure
- apps/ for Django applications
- templates/ for HTML templates
- tests/ for all test files
```

**인터페이스 진화**:
- Agent, Plan, Runs이 사이드바의 1등 시민으로 등장
- 다중 에이전트 병렬 작업 (예: 리팩터링 + 테스트 수정 + UI 개선 동시 진행)

---

### 1.4 Windsurf (Codeium)

**핵심 철학**: Flow State — AI가 의도를 추론하여 개발 흐름을 방해하지 않는 협업

Windsurf는 VS Code 기반이지만 "AI-네이티브 로우코드 IDE"를 지향한다. 핵심은 Cascade — 모든 개발자 액션(편집, 명령, 클립보드, 터미널 등)을 추적하여 의도를 실시간으로 파악한다.

**Cascade 핵심 기능**:
- **의도 추론**: 모든 액션 추적으로 반복 설명 불필요
- **전체 코드베이스 이해**: 다중 파일 리네이밍, 반복적 디버깅
- **메모리 자동 생성**: 코드베이스 및 워크플로우 핵심 정보 자동 저장
- **MCP 통합**: GitHub, Slack, Stripe, Figma, DB, 내부 API 연결

**Cascade 모드**:

| 모드 | 용도 |
|------|------|
| Code | 코드베이스 생성/수정 |
| Chat | 코드베이스 질문, 코딩 원칙 토론 |

**자동화 레벨** (Windsurf 고유):
- **Off**: 수동 제어
- **Auto**: 지능적 자동화
- **Turbo**: 최대 자동화

**Rulebooks**: 재사용 가능한 행동 규칙 세트 (자동 생성 슬래시 명령으로 Cascade에서 호출)

**Cursor와의 차별점**:
- VS Code 플러그인이 아닌 완전히 재설계된 IDE
- 액션 추적 기반 의도 추론 (vs Cursor의 명시적 지시 기반)
- 월 $15로 Cursor($20) 대비 저렴

---

### 1.5 Continue.dev

**핵심 철학**: Open, Composable AI — 완전한 제어권과 유연성을 가진 오픈소스 AI 코딩

Continue.dev는 VS Code와 JetBrains에서 동작하는 오픈소스 AI 코딩 도구로, 어떤 AI 모델이든 플러그인 방식으로 연결할 수 있다.

**config.yaml 기반 설정**:
```yaml
# config.yaml 예시
models:
  - provider: anthropic
    model: claude-sonnet-4-6
    name: Claude Sonnet
    roles:
      - chat
      - edit
  - provider: anthropic
    model: claude-haiku-4-5-20251001
    name: Claude Haiku
    roles:
      - autocomplete

context:
  providers:
    - name: file
    - name: code
    - name: diff
    - name: terminal

slashCommands:
  - name: edit
    description: Edit code in place
  - name: review
    description: Review the code changes

rules:
  - Always use type hints in Python
  - Follow Django conventions
  - Write tests for all new features
```

**2025 핵심 업데이트**:
- CI/CD 파이프라인 통합: PR 오픈 시 자동 AI 워크플로우 실행
- MCP 통합: GitHub, Sentry, Snyk, Linear 연결
- Source-controlled AI checks: 팀 표준화된 AI 행동 관리

**강점**: 모델 선택 자유, 데이터 프라이버시, 자체 호스팅 가능

---

### 1.6 GitHub Copilot Workspace

**핵심 철학**: Spec-to-Code — 자연어 스펙에서 완전한 코드 구현까지 구조화된 여정

GitHub Copilot Workspace(현재는 Copilot Coding Agent로 진화)는 작업 → 스펙 → 계획 → 코드의 단계적 워크플로우를 제공한다.

**핵심 워크플로우**:
```
1. 작업 입력 (자연어)
     ↓
2. 스펙 생성 (현재 상태 + 원하는 상태 bullet points)
     ↓ [개발자가 스펙 편집 가능]
3. 계획 생성 (변경할 파일 목록 + 각 파일별 액션)
     ↓ [개발자가 계획 편집 가능]
4. 코드 구현 (sub-agents 시스템으로 실행)
```

**2025 Copilot Coding Agent** (GA):
- Agent mode: 자체 출력물 반복 개선
- 오류 자동 인식 및 수정
- 터미널 명령 제안
- 런타임 오류 분석 및 자가 치유

**GitHub 통합 특징**:
- 이슈, PR과 직접 연결
- CI/CD 파이프라인 통합
- 조직 전체 구성 템플릿

---

### 1.7 Claude Code

**핵심 철학**: Terminal-Native Agentic — Unix 철학으로 터미널에서 완전한 자율 에이전트

Claude Code는 IDE가 아닌 터미널 기반 AI 에이전트로, 전체 코드베이스를 이해하고 복잡한 멀티스텝 작업을 자율적으로 수행한다.

**핵심 강점**:
- **SWE-bench**: 82.0% (병렬 테스트-타임 컴퓨팅 포함), 표준 77.2%
- **컨텍스트 윈도우**: 200K 토큰 (대규모 코드베이스 처리)
- **자율성**: 30시간 이상 연속 자율 작동 사례
- **Unix 철학**: 작고 조합 가능한 도구들

**주요 기능**:
```bash
# 코드베이스 전체 이해 및 멀티파일 편집
claude "리팩터링 auth 모듈 - 모든 연관 파일 업데이트"

# 테스트 실행 및 디버깅
claude "테스트 실패 원인 찾고 수정"

# Git 통합
claude "PR 생성하고 리뷰 코멘트 반영"
```

**CLAUDE.md** (프로젝트별 AI 행동 설정):
```markdown
# CLAUDE.md 예시
## Stack
- Django, PostgreSQL, HTMX
- uv for package management

## Code Style
- Python 3.12+ with type hints
- Prefer FBVs over CBVs
- TDD workflow

## Critical Rules
- Never swallow errors silently
- Use select_related/prefetch_related
- Always validate request.method
```

**팀/에이전트 기능** (2025):
- 멀티 에이전트 조율 (Team 기능)
- TaskCreate/TaskUpdate로 작업 추적
- 병렬 에이전트 실행 (worktree 격리)

**시장 포지션**: Cursor의 기본 모델로 사용, Google 엔지니어들이 선호

---

### 1.8 Devin / OpenHands / SWE-agent

#### Devin (Cognition AI)
**핵심 철학**: Autonomous Software Engineer — 완전 자율 소프트웨어 엔지니어

Devin은 최초의 완전 자율 AI 소프트웨어 엔지니어로, sandboxed 환경(셸, 코드 에디터, 브라우저)에서 독립적으로 작업한다.

**워크플로우**:
```
1. 자연어 작업 입력
2. Planner 모듈: 단계별 계획 수립
3. 실행: 셸(의존성 설치) + 에디터(코드 작성) + 브라우저(문서 검색)
4. test-debug-fix 반복 루프
```

**Devin 2.0 (2025년 4월)**:
- 가격: $500/월 → $20/월 (Core 플랜)
- Devin Search: 자연어 코드 쿼리
- Devin Wiki: 코드베이스 자동 인덱싱 및 아키텍처 다이어그램 생성
- 멀티에이전트: 다수 Devin 인스턴스 병렬 실행
- SWE-bench: 13.86% (실제 GitHub 이슈 해결)

#### OpenHands (구 OpenDevin)
**핵심 철학**: Open Platform — 오픈소스로 Devin의 능력을 민주화

Devin에 영감받아 만들어진 커뮤니티 주도 프로젝트. 자신의 LLM(Claude, GPT-4o, Llama 등)을 선택하여 사용.

**아키텍처**:
- Event-sourced 상태 모델 (결정론적 재현)
- 타입 시스템 기반 MCP 통합
- Docker 샌드박스 실행환경
- 로컬 프로토타입 → 원격 보안 컨테이너 동일 에이전트 실행

#### SWE-agent (Princeton NLP)
학술 연구 기반 에이전트로, SWE-bench 벤치마크의 표준이 됨. Agent-Computer Interface(ACI)를 통해 파일 시스템과 상호작용.

---

## 2. 워크플로우 패턴 비교표

### 기본 특성 비교

| 도구 | 인터페이스 | 자율성 레벨 | 컨텍스트 방식 | 가격 (2025) |
|------|----------|-----------|------------|-----------|
| **bkit** | Terminal (Claude Code 플러그인) | 반자율 (PDCA 주도) | 문서 기반 상태 관리 | 오픈소스 |
| **Aider** | Terminal/CLI | 반자율 (대화 주도) | treesitter + ripgrep | 오픈소스 |
| **Cursor** | IDE (VS Code 기반) | 반자율~완전자율 | 시맨틱 검색 + 규칙 | $20/월 |
| **Windsurf** | IDE (VS Code 기반) | 반자율~완전자율 | 액션 추적 의도 추론 | $15/월 |
| **Continue.dev** | IDE 플러그인 | 반자율 | config.yaml | 오픈소스 |
| **Copilot Workspace** | 웹 + GitHub | 완전자율 (감독 하) | 스펙 문서 | GitHub Pro+ |
| **Claude Code** | Terminal | 완전자율 | 200K 컨텍스트 | 사용량 기반 |
| **Devin** | 웹 | 완전자율 | 샌드박스 환경 | $20/월~ |
| **OpenHands** | CLI/웹 | 완전자율 | Docker 샌드박스 | 오픈소스 |

### 워크플로우 패러다임 분류

```
┌─────────────────────────────────────────────────────────┐
│                   워크플로우 패러다임                      │
├───────────────┬─────────────────┬───────────────────────┤
│ 대화 중심      │ 구조/문서 중심    │ 완전 자율              │
│               │                 │                       │
│ • Aider       │ • bkit (PDCA)   │ • Devin               │
│ • Windsurf    │ • Copilot WS    │ • OpenHands            │
│   (Cascade)   │   (Spec→Code)   │ • Claude Code         │
│ • Cursor      │ • Kiro (EARS)   │   (복잡한 작업)        │
│   (일상 작업) │ • Continue.dev  │                       │
│               │   (CI/CD)       │                       │
└───────────────┴─────────────────┴───────────────────────┘
```

### 컨텍스트 관리 방식 비교

| 도구 | 컨텍스트 소스 | 지속성 | 팀 공유 |
|------|------------|-------|-------|
| bkit | PDCA 문서 + 메모리 파일 | 세션 간 영속 | ✅ (docs=code) |
| Aider | repomap + 대화 기록 | 세션 내 | ❌ |
| Cursor | .cursorrules + 시맨틱 검색 | 규칙 파일 | ✅ |
| Windsurf | 액션 로그 + Rulebooks + 자동 메모리 | 자동 저장 | ✅ |
| Continue.dev | config.yaml + MCP | 설정 파일 | ✅ |
| Claude Code | CLAUDE.md + 세션 메모리 | 파일 영속 | ✅ |
| Devin | 샌드박스 + Devin Wiki | 프로젝트 영속 | ✅ |

---

## 3. 설정/구성 방법

### 3.1 bkit 설정

```bash
# 설치
npm install -g @popup-studio-ai/bkit-claude-code

# 프로젝트 초기화
/bkit:init-starter       # 스타터 프로젝트
/bkit:init-dynamic       # 풀스택 프로젝트
/bkit:init-enterprise    # 엔터프라이즈

# PDCA 워크플로우 시작
/bkit:pdca-plan          # Plan 단계
/bkit:pdca-design        # Design
/bkit:pdca-do            # 구현
/bkit:pdca-analyze       # 갭 분석
/bkit:pdca-iterate       # 자동 반복 최적화
/bkit:pdca-report        # 완료 문서화
```

```yaml
# .claude/settings.yaml (bkit 설정)
output_style: enterprise    # learning | pdca-guide | enterprise
language: ko                # 자동 감지 또는 명시
project_level: dynamic
pdca_threshold: 90          # Check 단계 통과 기준 (%)
max_iterations: 5           # Act 단계 최대 반복 횟수
```

### 3.2 Aider 설정

```yaml
# .aider.conf.yml
model: claude-sonnet-4-6
architect-model: claude-opus-4-6
editor-model: claude-sonnet-4-6

# Git 설정
auto-commits: true
commit-prompt: |
  feat: {message}

  Co-authored-by: Aider <aider@aider.chat>

# 편집 형식
edit-format: editor-diff    # architect 모드에서 권장
```

```
# .aiderignore (컨텍스트 제외)
.venv/
node_modules/
*.pyc
__pycache__/
```

### 3.3 Cursor 설정

```markdown
# .cursorrules (프로젝트 루트)

## Expert Context
You are a senior Django developer specializing in HTMX-driven applications.

## Tech Stack
- Python 3.12+, Django 5.x, PostgreSQL
- HTMX for dynamic interactions (no heavy JavaScript)
- uv for package management, Ruff for linting
- pytest + Factory Boy for testing

## Code Style Rules
- Always use type hints
- Prefer function-based views (FBVs)
- Use select_related/prefetch_related proactively
- Early returns over nested conditionals
- No Any types - use proper type hints

## Testing Requirements
- Write tests BEFORE implementation (TDD)
- Use Factory Boy factories
- Test behavior, not implementation
- All models need factory classes

## File Naming
- Partial templates: _partial.html
- Factory files: factories.py in each app
- Test files: test_*.py

## HTMX Patterns
- Always include hx-indicator for loading states
- Handle HX-Request header for partials
- Use _partial.html suffix for HTMX fragments
```

### 3.4 Windsurf (Cascade) 설정

```markdown
# Rulebook: django-project.md
# 호출: /django-project

## Django Development Rules

### Architecture
- Fat models, thin views pattern
- Prefer QuerySet methods over raw SQL
- Use Django's built-in authentication

### HTMX Integration
- Always return partial HTML for HX-Request
- Include HX-Trigger header for events
- Loading states with htmx-indicator class

### Database
- Always add db_index for foreign keys
- Use select_related for ForeignKey traversal
- Use prefetch_related for M2M and reverse FK
```

### 3.5 Continue.dev 설정

```yaml
# ~/.continue/config.yaml
name: CS Dashboard Project
version: 1.0.0

models:
  - provider: anthropic
    model: claude-sonnet-4-6
    name: Claude Sonnet (Chat)
    roles:
      - chat
      - edit

  - provider: anthropic
    model: claude-haiku-4-5-20251001
    name: Claude Haiku (Autocomplete)
    roles:
      - autocomplete

context:
  providers:
    - name: file
    - name: code
    - name: diff
    - name: terminal
    - name: github
      params:
        repo: my-org/cs-dashboard

rules:
  - Always use type hints in Python 3.12+
  - Follow Django conventions
  - Use Ruff for formatting (not Black)
  - Write pytest tests (not unittest)

slashCommands:
  - name: review
    description: Review code changes
    prompt: |
      Review these changes for:
      1. Type safety
      2. N+1 queries
      3. Missing tests
      4. Security issues

  - name: test
    description: Write tests for selection
    prompt: |
      Write pytest tests for this code.
      Use Factory Boy for fixtures.
      Follow TDD principles.
```

### 3.6 Claude Code 설정

```markdown
# CLAUDE.md (프로젝트 루트)

## Stack
- Django 5.x + PostgreSQL + HTMX
- Python 3.12+ with strict type hints
- uv for package management

## Commands
- Test: `uv run pytest`
- Lint: `uv run ruff check .`
- Format: `uv run ruff format .`
- Type: `uv run pyright`

## Critical Rules
- NEVER swallow errors silently
- Use select_related/prefetch_related (no N+1)
- Prefer FBVs over CBVs
- TDD: failing test first

## Skill Activation
- Debugging → systematic-debugging skill
- Django exploration → django-extensions skill
```

```bash
# Claude Code 훅 예시 (.claude/settings.json)
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "uv run ruff check --fix $CLAUDE_FILE_PATHS"
          }
        ]
      }
    ]
  }
}
```

---

## 4. 장단점 비교 매트릭스

### 기능별 점수표 (1-5점)

| 기능 | bkit | Aider | Cursor | Windsurf | Continue | Copilot WS | Claude Code | Devin |
|------|------|-------|--------|----------|---------|-----------|------------|-------|
| **컨텍스트 이해** | 4 | 5 | 4 | 4 | 3 | 3 | 5 | 4 |
| **자율 실행** | 3 | 2 | 4 | 4 | 2 | 4 | 5 | 5 |
| **구조화된 워크플로우** | 5 | 3 | 3 | 3 | 3 | 5 | 3 | 3 |
| **팀 협업** | 4 | 2 | 4 | 3 | 5 | 5 | 4 | 3 |
| **사용 용이성** | 3 | 3 | 5 | 5 | 3 | 4 | 3 | 5 |
| **설정 유연성** | 4 | 4 | 4 | 3 | 5 | 2 | 5 | 2 |
| **문서화 품질** | 5 | 2 | 2 | 2 | 2 | 4 | 3 | 3 |
| **오픈소스** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **IDE 독립** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 시나리오별 추천 도구

| 시나리오 | 최우선 도구 | 보조 도구 |
|---------|-----------|---------|
| 대규모 리팩터링 | Claude Code | Aider |
| 신규 기능 계획 수립 | bkit / Copilot WS | Claude Code |
| 일상적 코딩/자동완성 | Cursor / Windsurf | Continue.dev |
| 완전 자율 작업 위임 | Devin / OpenHands | Claude Code |
| 오픈소스/프라이버시 | Continue.dev / OpenHands | Aider |
| 엔터프라이즈 팀 | Cursor / Copilot WS | Continue.dev |
| Django 전문 개발 | Claude Code + CLAUDE.md | Cursor |

### 장단점 상세

#### bkit
- ✅ PDCA로 체계적 개발 프로세스 강제화
- ✅ 자동 문서화 (docs=code)
- ✅ 한국어 포함 8개 언어 지원
- ✅ Claude Code와 완벽 통합
- ❌ Claude Code 종속적
- ❌ 학습 곡선 존재
- ❌ 소규모 작업에 과도한 구조

#### Aider
- ✅ 최고 수준의 컨텍스트 fetching
- ✅ Architect/Editor 분리로 최고 코드 품질
- ✅ 완전 오픈소스
- ✅ 모든 LLM 지원
- ❌ IDE 통합 없음 (순수 터미널)
- ❌ 자율성 낮음 (대화 주도)
- ❌ GUI 없음

#### Cursor
- ✅ 최고의 사용자 경험
- ✅ VS Code 생태계 완전 활용
- ✅ 멀티에이전트 병렬 실행 (Cursor 2.0)
- ✅ .cursorrules로 팀 표준화
- ❌ 비용 ($20/월 + 추가 사용량)
- ❌ 폐쇄적 에코시스템
- ❌ 대규모 코드베이스에서 컨텍스트 손실

#### Windsurf
- ✅ 의도 추론으로 마찰 없는 경험
- ✅ Cursor 대비 저렴 ($15/월)
- ✅ Turbo 모드 자동화
- ❌ Cursor보다 적은 생태계
- ❌ 일부 복잡한 작업에서 정확도 저하

#### Continue.dev
- ✅ 완전한 모델 선택 자유
- ✅ 데이터 프라이버시 (자체 호스팅)
- ✅ CI/CD 통합
- ✅ 완전 오픈소스
- ❌ 설정 복잡도
- ❌ 단독으로는 덜 강력

#### Claude Code
- ✅ 업계 최고 SWE-bench (82%)
- ✅ 200K 컨텍스트 (대규모 코드베이스)
- ✅ 완전한 에이전트 자율성
- ✅ CLAUDE.md로 완벽 커스터마이징
- ✅ bkit 등 생태계와 통합
- ❌ 터미널 전용 (GUI 없음)
- ❌ 사용량 기반 비용 (대량 사용 시 고가)
- ❌ IDE 자동완성 없음

#### Devin
- ✅ 진정한 완전 자율 실행
- ✅ 가격 대폭 인하 ($500 → $20/월)
- ✅ Devin Wiki로 자동 문서화
- ✅ 멀티에이전트 병렬 실행
- ❌ SWE-bench 13.86% (여전히 제한적)
- ❌ 폐쇄적 플랫폼
- ❌ 복잡한 작업에서 실패 가능성

---

## 5. Claude Code와의 통합 가능성

### 현재 통합 생태계

```
Claude Code 생태계
├── bkit (공식 Claude Code 플러그인)
│   ├── PDCA 워크플로우 구조 제공
│   ├── 스킬 시스템 (27개 도메인 스킬)
│   └── 에이전트 팀 조율
│
├── CLAUDE.md (프로젝트별 컨텍스트)
│   ├── 팀 표준 설정
│   ├── 스킬 활성화 규칙
│   └── 기술 스택 명세
│
├── Hooks 시스템
│   ├── PostToolUse: 자동 린팅/포맷팅
│   ├── PreToolUse: 안전 검사
│   └── 커스텀 자동화
│
└── MCP (Model Context Protocol)
    ├── Jira 통합
    ├── GitHub 통합
    └── 커스텀 도구
```

### Aider와의 통합 아이디어

Architect/Editor 패턴을 Claude Code에서 응용:
```bash
# Claude Code에서 Aider 스타일 분리
# 1단계: Ask 모드로 설계 논의
claude "이 기능의 아키텍처를 설계해줘 (코드 변경 없이)"

# 2단계: 승인 후 구현
claude "앞서 논의한 설계대로 구현해줘"
```

### Cursor/Windsurf와의 병행 사용

실무 추천 워크플로우:
```
일상적 코딩 → Cursor/Windsurf (자동완성, 인라인 편집)
복잡한 작업 → Claude Code (대규모 리팩터링, 아키텍처 변경)
계획/문서화 → bkit PDCA (기능 설계, 갭 분석)
CI/CD 통합 → Continue.dev (PR 자동 리뷰, 표준 검사)
```

### Continue.dev + Claude Code 통합

```yaml
# Continue.dev에서 Claude Code 스타일 규칙 재사용
rules:
  - name: django-conventions
    content: |
      Follow these Django conventions:
      - Prefer FBVs over CBVs
      - Use select_related/prefetch_related
      - Type hints required
      - TDD: write tests first
```

---

## 6. 배울 수 있는 워크플로우 아이디어

### 6.1 bkit에서 배우기 → PDCA + 자동 문서화

**적용 아이디어**: 모든 기능 개발에 PDCA 체크포인트 강제화

```markdown
# 기능 개발 PDCA 템플릿

## Plan
- [ ] 요구사항 명확화
- [ ] 기술 접근법 결정
- [ ] 영향 파일 목록화

## Do
- [ ] 구현 완료
- [ ] 타입 힌트 추가
- [ ] 린팅 통과

## Check (갭 분석)
- [ ] 테스트 커버리지 확인
- [ ] N+1 쿼리 없음
- [ ] 에러 처리 완전

## Act
- [ ] 발견된 갭 수정
- [ ] 재검토
- [ ] 문서 업데이트
```

### 6.2 Aider에서 배우기 → Architect/Editor 분리

**적용 아이디어**: 복잡한 기능은 설계 단계를 분리

```
설계 세션 (ask/architect 모드):
→ Claude Code에 "--no-edit" 플래그로 설계만 논의
→ 설계 문서 생성 후 승인

구현 세션 (code 모드):
→ 승인된 설계 기반으로 구현
→ 예상치 못한 변경 최소화
```

### 6.3 Cursor에서 배우기 → .cursorrules → CLAUDE.md 고도화

팀 전체가 동일한 AI 행동을 보장하는 CLAUDE.md 패턴:

```markdown
# CLAUDE.md 고도화 패턴

## Skill Activation (자동 스킬 트리거)
- 버그 디버깅 → systematic-debugging skill
- Django 탐색 → django-extensions skill
- 테스트 작성 → write-tests skill
- 폼 구현 → django-forms skill
- HTMX → htmx-patterns skill

## Forbidden Patterns (금지 패턴)
- 절대 Any 타입 사용 금지
- 절대 bare except 금지
- N+1 쿼리 생성 금지
- 에러 무시 금지

## Required Patterns (필수 패턴)
- 모든 뷰에 타입 힌트
- 모든 모델 변경에 마이그레이션
- 모든 새 기능에 Factory Boy 팩토리
```

### 6.4 Windsurf에서 배우기 → 의도 추론 컨텍스트

**적용 아이디어**: 세션 시작 시 작업 컨텍스트 명시화

```bash
# 세션 시작 컨텍스트 설정 패턴
claude "오늘 작업: SAAS-46 Celery/Redis 설정.
현재 상태: config/celery.py 없음, Redis 미설정.
목표: 기본 Celery 태스크 실행 가능.
제약: Docker Compose 사용, 개발환경 only."
```

### 6.5 GitHub Copilot Workspace에서 배우기 → Spec-First Development

**적용 아이디어**: 모든 기능을 스펙 문서로 시작

```markdown
# 기능 스펙 템플릿 (Jira 이슈 기반)

## 현재 상태
- [ 현재 코드베이스 상태 bullet points ]

## 원하는 상태
- [ 구현 후 기대되는 상태 bullet points ]

## 변경 계획
- 파일 A: [수정 내용]
- 파일 B: [추가 내용]
- 파일 C: [삭제]

## 검증 기준
- [ ] 테스트 통과
- [ ] 타입 체크 통과
- [ ] 린팅 통과
```

### 6.6 자율 에이전트에서 배우기 → 작업 위임 패턴

Devin/OpenHands에서 배운 완전 자율 실행 패턴을 Claude Code에 적용:

```bash
# 구조화된 작업 위임 (Claude Code)
claude "
작업: SAAS-52 구현 (사용자 인증 시스템)

체크리스트:
1. apps/accounts/models.py - CustomUser 모델 생성
2. apps/accounts/forms.py - 로그인/회원가입 폼
3. apps/accounts/views.py - FBV 뷰
4. templates/accounts/ - 관련 템플릿
5. tests/accounts/ - Factory Boy + pytest 테스트

완료 기준:
- 모든 테스트 통과 (uv run pytest)
- 린팅 통과 (uv run ruff check .)
- 타입 체크 통과 (uv run pyright)

시작해줘. 각 단계 완료 시 확인해줘."
```

### 6.7 종합 추천 워크플로우 (CS Dashboard 프로젝트)

```
┌─────────────────────────────────────────────────────────────┐
│            CS Dashboard 최적 AI 개발 워크플로우               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 기능 계획 (PDCA Plan)                                    │
│     → bkit /pdca-plan 또는 /write-plan 스킬                 │
│     → Jira 이슈 기반 스펙 문서 작성                          │
│                                                              │
│  2. 설계 검토 (Architect 모드)                               │
│     → Claude Code ask 모드로 설계 논의                       │
│     → 변경 파일 목록 및 접근법 확정                           │
│                                                              │
│  3. 구현 (Claude Code 자율 실행)                             │
│     → /start-work 스킬로 브랜치 생성                         │
│     → /implement 스킬로 단계적 구현                          │
│     → 자동 린팅/테스트 (hooks)                               │
│                                                              │
│  4. 검토 (Check)                                            │
│     → /review-implementation 스킬                           │
│     → 갭 분석 및 누락 사항 확인                              │
│                                                              │
│  5. 완료 (Act + Report)                                     │
│     → PR 생성 (gh pr create)                                │
│     → Jira 이슈 업데이트                                     │
│     → /pdca-report로 문서화                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 참고 자료

- [bkit GitHub (Claude Code)](https://github.com/popup-studio-ai/bkit-claude-code)
- [bkit 공식 사이트](https://www.bkit.ai/)
- [Aider 채팅 모드 문서](https://aider.chat/docs/usage/modes.html)
- [Aider Architect/Editor 아키텍처](https://aider.chat/2024/09/26/architect.html)
- [Cursor 2.0 멀티에이전트 발표](https://www.infoq.com/news/2025/11/cursor-composer-multiagent/)
- [Windsurf Cascade 문서](https://docs.windsurf.com/windsurf/cascade/cascade)
- [Continue.dev 공식 문서](https://docs.continue.dev/)
- [GitHub Copilot Workspace](https://githubnext.com/projects/copilot-workspace)
- [Claude Code 완전 가이드](https://datanorth.ai/blog/claude-code-ai-coding-assistant-guide-2025)
- [AI 코딩 에이전트 배틀 비교](https://www.lotharschulz.info/2025/09/30/battle-of-the-ai-coding-agents-github-copilot-vs-claude-code-vs-cursor-vs-windsurf-vs-kiro-vs-gemini-cli/)
- [Devin 2.0 발표](https://venturebeat.com/programming-development/devin-2-0-is-here-cognition-slashes-price-of-ai-software-engineer-to-20-per-month-from-500)
- [OpenHands 공식 사이트](https://openhands.dev/)
- [Cursor vs Windsurf vs Claude Code 비교](https://dev.to/pockit_tools/cursor-vs-windsurf-vs-claude-code-in-2026-the-honest-comparison-after-using-all-three-3gof)
- [bkit Vibecoding Kit 개념 정리 (한국어)](https://tilnote.io/en/pages/6971d065324e33cc1df11173)
