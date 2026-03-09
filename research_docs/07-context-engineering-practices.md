# Context Engineering for AI-driven Development — 실전 패턴과 구체적 사례

> 작성일: 2026-03-04
> 조사 목적: AI 코딩 도구에서의 컨텍스트 엔지니어링 실전 패턴 정리

---

## 1. CLAUDE.md 실전 사례

### 1.1 Claude Code 공식 문서 권장 구조

공식 [Best Practices 문서](https://code.claude.com/docs/en/best-practices)에 따른 CLAUDE.md 포함/제외 기준:

| ✅ 포함해야 할 것 | ❌ 포함하지 말아야 할 것 |
|---|---|
| Claude가 추측할 수 없는 Bash 명령어 | 코드만 읽어도 알 수 있는 것 |
| 기본값과 다른 코드 스타일 규칙 | Claude가 이미 아는 언어 컨벤션 |
| 테스트 명령어 및 선호 테스트 러너 | 자세한 API 문서 (링크로 대체) |
| 브랜치 명명, PR 컨벤션 등 저장소 에티켓 | 자주 바뀌는 정보 |
| 프로젝트 특수 아키텍처 결정사항 | 긴 설명이나 튜토리얼 |
| 개발 환경 특이사항 (필수 환경변수) | 파일별 코드베이스 설명 |
| 자명하지 않은 동작이나 함정 | "클린 코드 작성" 같은 자명한 것 |

**핵심 원칙**: 각 줄에 대해 "이 줄을 삭제하면 Claude가 실수를 할까?"를 물어보라. 아니라면 삭제하라.

---

### 1.2 실제 오픈소스 프로젝트 사례

#### 사례 1: claude-code-django (kjnez/claude-code-django)

Django 프로젝트를 위한 종합 Claude Code 설정 예시. 현재 이 프로젝트의 `CLAUDE.md`와 거의 동일한 구조:

```markdown
# Django Project

## Quick Facts
- **Stack**: Django, PostgreSQL, HTMX
- **Package Manager**: uv
- **Test Command**: `uv run pytest`
- **Lint Command**: `uv run ruff check .`
- **Format Command**: `uv run ruff format .`
- **Type Check**: `uv run pyright`

## Key Directories
- `apps/` - Django applications
- `config/` - Django settings and root URLconf

## Code Style
- Python 3.12+ with type hints required
- Ruff for linting and formatting
- No `Any` types - use proper type hints
- Use early returns, avoid nested conditionals
```

프로젝트 구조:
```
project-root/
├── CLAUDE.md                 # 프로젝트 메모리/컨텍스트
├── .mcp.json                 # MCP 서버 통합
├── .claude/
│   ├── settings.json         # 훅과 권한
│   ├── agents/               # 전문화된 어시스턴트
│   ├── commands/             # 슬래시 커맨드
│   ├── hooks/                # 스크립트 트리거
│   ├── skills/               # 도메인 지식
│   └── rules/                # 모듈형 지침
└── .github/workflows/        # 자동화 워크플로우
```

---

#### 사례 2: Jesse Vincent의 개인 CLAUDE.md (obra/dotfiles)

하퍼 리드가 "강력한 템플릿"으로 추천한 실제 파일 내용:

```markdown
# Core Philosophy
An experienced, pragmatic engineer who avoids over-engineering.
Rule #1: Any exception requires explicit permission from Jesse.

## Foundational Rules
- Never invent technical details — research or admit uncertainty
- Always address Jesse by name
- No sycophancy; honest technical judgment required
- Must immediately flag unknowns or problems
- Never use "You're absolutely right!"
- Use "Strange things are afoot at the Circle K" as safe dissent phrase
- Maintain a journal for memory and insights

## Development Standards
**TDD:** Required for every feature and bugfix.

**Code Quality:**
- Smallest reasonable changes
- Never rewrite without permission
- Match surrounding code style
- Fix bugs immediately without permission

**Testing:**
- All test failures are your responsibility
- Never delete failing tests
- No mocks testing mocked behavior
- Test output must be pristine

## Debugging
- Always find root causes; never workaround symptoms
- Use journal frequently for insights and patterns
```

**포인트**: 기술적 규칙 외에 **상호작용 원칙**과 **철학**을 명시. "비굴하게 굴지 말라", "반대 의견은 특정 구문으로 표현"하는 등 AI와의 관계 설정.

---

#### 사례 3: django-material (viewflow/django-material)

실제 오픈소스 Django 라이브러리의 CLAUDE.md:

```markdown
# Django Material Development Guidelines

## Project Setup
- Install with `pip install -e ".[docs]"`
- Run development server via `python manage.py runserver`
- Run tests: `python manage.py test`
- Build docs: `mkdocs build`

## Code Style
- TailwindCSS for styling components
- Google style docstrings for Python code
- Material Design 3 principles
- ARIA attributes for accessibility on all components

## Django-Cotton Framework
Components use naming pattern:
- Files stored as snake_case in `templates/cotton/`
- Invoked with kebab-case prefixed by 'c-'
- Variants use dot notation (e.g., `<c-button.filled>`)

## Documentation & Testing
- Document components in `docs/components.md`
- Demo implementations in `demo/` directory
```

---

#### 사례 4: 공식 문서 권장 최소 예시

```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible

# Workflow
- Be sure to typecheck when done making changes
- Prefer running single tests, not the whole suite (performance)
```

---

### 1.3 효과적인 vs 비효율적인 CLAUDE.md

#### ❌ 비효율적인 CLAUDE.md (너무 길고 자명한 것들 포함)

```markdown
# Project Rules
- Write clean, readable code
- Follow Python best practices
- Use meaningful variable names
- Comment your code
- Handle errors properly
- Write unit tests
- Use version control with git
- Follow PEP 8 style guide
- Never commit secrets
- Review code before pushing
# [계속 30줄...]
```

**문제점**: Claude가 이미 아는 것들. CLAUDE.md가 너무 길면 Claude가 실제 중요한 지침을 무시한다.

#### ✅ 효과적인 CLAUDE.md (프로젝트 특수 정보만)

```markdown
# Quick Facts
- Package manager: uv (pip 절대 사용 금지)
- Test: `uv run pytest -x --lf` (전체 스위트 실행 금지)
- Migrations: `uv run python manage.py makemigrations apps/your_app`

# Non-obvious gotchas
- CELERY_BROKER_URL은 .env에서만 설정 (settings.py에 직접 쓰지 말 것)
- Django signals는 apps/core/apps.py의 ready()에서만 연결

# Branch naming: `{initials}/{description}` (e.g., sc/add-oauth)
```

---

### 1.4 CLAUDE.md 임포트 기능 (잘 모르는 고급 기능)

```markdown
# CLAUDE.md
See @README.md for project overview and @package.json for npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

`@path/to/file` 구문으로 다른 파일을 임포트할 수 있어 CLAUDE.md를 간결하게 유지하면서 상세 정보는 별도 파일로 관리 가능.

---

## 2. Context Window 관리 실전

### 2.1 /compact 전략

공식 문서와 커뮤니티 경험을 종합한 실전 가이드:

```
컨텍스트 사용률 가이드:
0-60%  → 정상 작업
60-70% → /compact 검토 시점
70-80% → /compact 권장
80%+   → 자동 compact 트리거 (또는 수동 즉시 실행)
```

#### 시나리오별 compact 전략

**시나리오 1: 장기 디버깅 세션**
```
문제: 복잡한 버그 디버깅 중 context가 실패한 시도들로 가득 참
해결: /compact Focus on the current error and what we've tried

효과: 실패한 접근법들 제거, 핵심 에러 컨텍스트 유지
```

**시나리오 2: 여러 기능 구현 중**
```
문제: A 기능 완료 후 B 기능 시작하는데 context에 A 내용이 많음
해결: /clear (또는 새 세션 시작)

공식 권장: 관련없는 작업 사이에는 /clear
```

**시나리오 3: 대규모 코드베이스 탐색**
```
문제: 파일 탐색으로 context가 빨리 차는 문제
해결: "Use subagents to investigate X" — 서브에이전트가 탐색하고 요약만 전달

서브에이전트 패턴:
- 서브에이전트: 파일 읽기, 코드 탐색 (별도 context window)
- 메인 세션: 서브에이전트 요약만 받음 → context 절약
```

**시나리오 4: 대화 중간 compact**
```
특정 시점부터만 압축하기:
1. Esc + Esc (또는 /rewind)
2. 시작 메시지 선택
3. "Summarize from here" 선택

효과: 이전 맥락은 유지, 선택 시점부터만 압축
```

#### CLAUDE.md에서 compact 동작 제어

```markdown
# Compaction Instructions
When compacting, always preserve:
- Full list of modified files
- Test commands that were run
- Current error message (if debugging)
- Branch name and PR number (if working on a feature)
```

---

### 2.2 --resume와 --continue 실전 활용

```bash
# 가장 최근 세션 이어서 시작
claude --continue

# 세션 선택 메뉴 열기
claude --resume

# 세션 이름 설정 (나중에 찾기 쉽게)
/rename oauth-migration
/rename debugging-memory-leak

# 실전 패턴: 며칠에 걸친 작업
Day 1: claude (새 세션)
       /rename feature-user-notifications
       # 작업...

Day 2: claude --resume  # "feature-user-notifications" 선택
       # 이전 컨텍스트 그대로 이어서 작업
```

---

### 2.3 Repomix — 대규모 코드베이스 컨텍스트 준비 도구

[Repomix](https://repomix.com/)는 전체 코드베이스를 AI 친화적 단일 파일로 패키징.

#### 설치 및 기본 사용

```bash
# 설치
npm install -g repomix
# 또는
brew install repomix

# 기본 실행 (현재 디렉토리)
repomix
# → repomix-output.xml 생성

# 출력 형식 선택
repomix --style xml       # XML (기본값, Claude 권장)
repomix --style markdown  # 마크다운
repomix --style plain     # 일반 텍스트

# 특정 파일만 포함
repomix --include "src/**/*.py,tests/**/*.py"

# 토큰 수 확인
repomix --token-count-tree

# 코드 압축 (Tree-sitter로 핵심 구조만 추출)
repomix --compress
```

#### 실전 워크플로우

```bash
# 1. 코드베이스 패키징
repomix --style markdown --compress

# 2. Claude에 붙여넣기 + 프롬프트
"[repomix-output.md 내용]

Review the authentication flow and identify security issues."

# 또는 특정 모듈만
repomix --include "apps/accounts/**"
```

#### 원격 저장소 분석

```bash
# GitHub 저장소 직접 분석
npx repomix --remote https://github.com/user/repo
```

---

## 3. Rules File 실전 비교

### 3.1 각 도구별 Rules 파일 위치와 포맷

| 도구 | 파일 위치 | 포맷 | 크기 제한 |
|------|-----------|------|-----------|
| Claude Code | `CLAUDE.md` (루트 또는 `~/.claude/`) | Markdown | 제한 없음 (간결하게 유지 권장) |
| Cursor (구버전) | `.cursorrules` (루트) | Plain text/Markdown | 없음 (deprecated) |
| Cursor (신버전) | `.cursor/rules/*.mdc` | YAML frontmatter + Markdown | 없음 |
| Windsurf | `.windsurfrules` 또는 `.windsurf/rules/*.md` | Markdown | 6,000자 |
| Cline | `.clinerules/` (디렉토리) | Markdown | 없음 |
| Kiro | `.kiro/steering/*.md` | YAML frontmatter + Markdown | 없음 |

---

### 3.2 Cursor .mdc 포맷 실전 예시

`.cursor/rules/django-patterns.mdc`:

```markdown
---
description: Django-specific patterns and conventions
globs: ["apps/**/*.py", "tests/**/*.py"]
alwaysApply: false
---

# Django Patterns

## Views
- Always use Function-Based Views (FBV), not Class-Based Views
- Validate request.method explicitly at the top
- Use select_related() / prefetch_related() to avoid N+1 queries

## Forms
- Use ModelForm for model-backed forms
- Validate in clean() and clean_<field>() methods

## HTMX
- Check HX-Request header: `if request.headers.get('HX-Request')`
- Return partial template for HTMX, full page otherwise
- Name partials with underscore: `_partial.html`
```

#### MDC 파일의 4가지 활성화 모드

```yaml
# 1. 항상 포함
alwaysApply: true

# 2. 파일 패턴 매칭 시 자동 포함
globs: ["*.py", "tests/**"]

# 3. 에이전트 요청 시 포함
description: "Django patterns - loaded when working on Django code"
alwaysApply: false

# 4. 수동 호출 (@rule-name)
# description 없이 alwaysApply: false
```

---

### 3.3 Windsurf .windsurfrules 실전 예시

`.windsurfrules`:

```markdown
# Project: CS Dashboard

## Build System
- Package manager: uv (pip 절대 사용 금지)
- Test: uv run pytest
- Format: uv run ruff format .

## Coding Standards
1. Python 3.12+ with type hints required
2. No Any types - use proper type hints
3. Early returns over nested conditionals
4. Function-Based Views only

## API Security
- Never expose raw database IDs in URLs (use slugs or UUIDs)
- Always validate request.user.is_authenticated for protected views
- Use Django's CSRF protection for all POST endpoints

## Don't modify
- config/settings/*.py (ask first)
- */migrations/*.py (use makemigrations)
```

---

### 3.4 Kiro Steering 파일 구조

Kiro는 3개의 핵심 파일을 기본 생성:

`.kiro/steering/product.md`:
```markdown
---
inclusion: always
---

# Product Overview
CS Dashboard는 고객 성공팀이 고객 건강도를 모니터링하는 SaaS 플랫폼.

## Target Users
- Customer Success Managers
- Account Executives

## Key Features
- Customer health score tracking
- Churn prediction alerts
- Usage analytics dashboard
```

`.kiro/steering/tech.md`:
```markdown
---
inclusion: always
---

# Technology Stack
- Backend: Django 5.x + PostgreSQL
- Frontend: HTMX + Alpine.js
- Async: Celery + Redis
- Package manager: uv
- Type checking: pyright strict mode
```

`.kiro/steering/structure.md`:
```markdown
---
inclusion: always
---

# Project Structure
- apps/ — Django 애플리케이션
- config/ — 설정 파일 (직접 수정 금지)
- templates/ — 템플릿 파일
- static/ — 정적 파일

# Naming Conventions
- URLs: kebab-case (/customer-health/)
- Python: snake_case
- Templates: snake_case, partials는 _로 시작
```

#### Kiro의 특수 기능: 파일 매칭 조건부 포함

```markdown
---
inclusion: fileMatch
fileMatchPattern: "apps/*/views.py"
---

# View Conventions
HTMX 뷰는 반드시 HX-Request 헤더를 체크하세요.
FBV를 사용하고, CBV는 사용하지 마세요.
```

---

### 3.5 .clinerules 포맷 예시

`.clinerules/python-style.md`:

```markdown
# Python 코딩 스타일

## 타입 힌트
모든 함수와 메서드에 반드시 타입 힌트를 추가하세요.
Any 타입 사용을 금지합니다.

## 에러 처리
- 에러를 조용히 삼키지 마세요
- 항상 구체적인 예외 타입을 잡으세요
- logging.exception()으로 스택 트레이스를 기록하세요
```

`.clinerules/git-conventions.md`:

```markdown
# Git 컨벤션

## 브랜치 명명
{initials}/{description}
예: sc/add-oauth-login

## 커밋 메시지
Conventional Commits 형식:
- feat: 새 기능
- fix: 버그 수정
- docs: 문서
- refactor: 리팩토링
```

---

## 4. Memory & Session 관리 패턴

### 4.1 Cline Memory Bank 패턴 (상세)

[Cline 공식 문서](https://docs.cline.bot/prompting/cline-memory-bank)에서 소개된 6파일 구조:

```
memory-bank/
├── projectBrief.md      # 핵심 요구사항과 목표 (Foundation)
├── productContext.md    # 왜 이 프로젝트를 하는가, UX 목표
├── systemPatterns.md   # 아키텍처, 기술 결정, 디자인 패턴
├── techContext.md      # 기술 스택, 개발 환경, 제약사항
├── activeContext.md    # 현재 작업 포커스, 최근 변경, 다음 단계
└── progress.md        # 완료된 작업, 남은 작업, 알려진 이슈
```

**의존성 계층**:
```
projectBrief.md
    ↓
productContext.md + systemPatterns.md + techContext.md
    ↓
activeContext.md + progress.md
```

**Cline 운영 원칙**: "모든 작업 시작 시 Memory Bank 파일 전부 읽기 — 선택 사항이 아님"

---

### 4.2 Claude Code Auto Memory

Claude Code의 자동 메모리 시스템은 다음을 자동 저장:

```
~/.claude/projects/{project-path}/memory/
├── MEMORY.md          # 항상 로드되는 핵심 메모리 (200줄 제한)
├── debugging.md       # 디버깅 인사이트
├── patterns.md        # 코드 패턴
└── architecture.md    # 아키텍처 결정사항
```

**저장되는 내용**:
- 빌드 명령어와 특이사항
- 디버깅 인사이트
- 아키텍처 노트
- 코드 스타일 선호도
- 워크플로우 습관

**실전 팁**: MEMORY.md 200줄 제한 — 상세 내용은 별도 파일에, MEMORY.md에는 링크만

---

### 4.3 세션 간 컨텍스트 유지 전략

#### 전략 1: Shared Context 파일

```bash
# .claude/shared-context.md 생성
cat > .claude/shared-context.md << 'EOF'
# 공유 컨텍스트 (세션 간 유지)

## 아키텍처 결정사항
- 2025-03-01: Celery broker로 Redis 선택 (RabbitMQ 대신)
  이유: 기존 Redis 캐시 재사용, 운영 복잡도 감소

## 진행 중인 작업
- SAAS-46: Celery 설정 완료
- SAAS-47: OAuth 구현 예정

## 알려진 이슈
- pytest 병렬 실행 시 DB fixture 충돌 (--dist=no 사용)
EOF
```

```markdown
# CLAUDE.md에 추가
See @.claude/shared-context.md for current architecture decisions and known issues.
```

#### 전략 2: 세션 이름 기반 관리

```bash
# 기능별 세션 명명
/rename celery-redis-setup    # SAAS-46 작업 세션
/rename oauth-implementation  # SAAS-47 작업 세션
/rename debug-payment-flow    # 디버깅 세션

# 재개
claude --resume  # 메뉴에서 선택
```

#### 전략 3: Parallel Session with Worktree

대규모 코드베이스에서 3개 병렬 세션 패턴:

```
Session A: 핵심 도메인 로직 작업 (apps/core/)
Session B: API 엔드포인트 작업 (apps/api/)
Session C: 프론트엔드/템플릿 작업 (templates/)
```

각 세션이 서로 다른 영역을 담당해 context window 충돌 방지.

---

### 4.4 Memory Bank MCP 서버

[memory-bank-mcp](https://github.com/alioshr/memory-bank-mcp) — 여러 AI 도구 간 메모리 공유:

```json
// .mcp.json
{
  "mcpServers": {
    "memory-bank": {
      "command": "npx",
      "args": ["-y", "memory-bank-mcp"],
      "env": {
        "MEMORY_BANK_ROOT": "./.memory-bank"
      }
    }
  }
}
```

**특징**: Cursor, Cline, Claude Code 모두에서 같은 memory-bank 접근 가능.

---

## 5. 프롬프트 패턴 라이브러리

### 5.1 기능 구현 프롬프트

#### ❌ 비효율적 (모호함)

```
"사용자 인증 기능 추가해줘"
"이 함수 고쳐줘"
"로그인이 안 돼"
```

#### ✅ 효과적인 구조

**패턴: 컨텍스트 + 명세 + 검증 기준**

```
이메일 검증 기능을 구현해줘.

요구사항:
1. user@example.com → True
2. invalid → False
3. user@.com → False
4. 빈 문자열 → False

구현 후 pytest로 각 케이스 테스트 실행해서 통과 확인.
파일: apps/accounts/validators.py
```

---

### 5.2 TDD 프롬프트 패턴

"robots LOVE TDD" — AI 코딩에서 TDD는 환각을 극적으로 줄임.

#### Phase 1: 테스트 먼저 (Red)

```
apps/accounts/validators.py에 username 검증 함수를 추가할 거야.

규칙:
- 길이 3~16자
- 첫 글자는 문자 또는 언더스코어
- 연속 언더스코어 시작 금지 (__name)
- 이후에는 문자, 숫자, 언더스코어 가능

지금은 테스트 함수만 작성해줘. 구현 코드는 아직 쓰지 마.
파일: tests/test_validators.py
```

#### Phase 2: 구현 (Green)

```
이제 방금 작성한 테스트를 통과하는 validate_username() 함수를
apps/accounts/validators.py에 구현해줘.
구현 후 pytest tests/test_validators.py 실행해서 전부 통과하는지 확인.
```

#### Phase 3: 리팩토링

```
테스트가 통과했어. 이제 구현을 리팩토링해줘:
1. RORO 패턴 적용 (Receive Object, Return Object)
2. 조건 초반에 early return
3. 에러 메시지는 structured logging으로

테스트가 여전히 통과하는지 확인 필수.
```

---

### 5.3 디버깅 프롬프트 패턴

#### ❌ 약한 프롬프트

```
"로그인이 왜 안 돼?"
"이 에러 고쳐줘"
```

#### ✅ 강한 프롬프트

```
세션 타임아웃 후 로그인이 실패하는 버그가 있어.

증상: 30분 비활성 후 로그인 시도 → 500 에러
에러: ValueError: Session data corrupted at session.py:142
예상 동작: 세션 재생성 후 정상 로그인

관련 파일: apps/accounts/views.py (login_view),
          config/session.py

재현하는 실패 테스트를 먼저 작성하고,
근본 원인을 찾아서 수정해줘. 증상 억제(try/except로 무시)는 금지.
```

---

### 5.4 코드 리뷰 프롬프트 패턴

#### 기본 리뷰 요청

```
시니어 Django 엔지니어로서 이 코드를 리뷰해줘.
파일: apps/orders/views.py

체크 항목:
1. N+1 쿼리 문제
2. 인증/권한 누락
3. 에러 처리 누락
4. 기존 패턴과의 불일치 (비교: apps/customers/views.py)

각 이슈에 파일:라인번호와 수정 제안 포함.
```

#### Writer/Reviewer 패턴 (2개 세션)

```
# Session A (Writer)
이 기능을 구현해줘: [스펙]

# Session B (Reviewer) — 별도 새 세션
@apps/orders/views.py 를 리뷰해줘.
엣지 케이스, 레이스 컨디션,
그리고 @apps/customers/views.py 패턴과의 일관성을 중점 확인.
```

**핵심**: 리뷰어 세션은 코드를 직접 쓰지 않았으므로 편향 없음.

---

### 5.5 리팩토링 프롬프트 패턴

#### ❌ 모호한 요청

```
"이 코드 리팩토링해줘"
"더 좋게 만들어줘"
```

#### ✅ 구체적인 리팩토링 요청

```
OrderProcessor 클래스 (apps/orders/processors.py:1-350)를 리팩토링해줘.

현재 문제:
- 클래스 하나에 350줄 (inventory, payments, shipping, analytics 혼재)
- 프로덕션에서 하루 10,000건 처리

목표:
1. payment 처리 로직을 PaymentProcessor로 분리
2. 기존 테스트(tests/test_orders.py) 모두 통과 유지
3. 새 클래스에 타입 힌트 추가

절대 금지:
- 재작성 (refactor only)
- 기존 공개 API 변경
- 테스트 삭제

먼저 변경 계획을 설명하고, 승인 후 구현해줘.
```

---

### 5.6 탐색/학습 프롬프트 패턴

#### 코드베이스 온보딩

```
이 Django 프로젝트에 새로 합류했어. Plan Mode로:

1. 인증 시스템이 어떻게 작동하는지 설명해줘
2. 새 API 엔드포인트를 추가하는 방법은?
3. Celery 태스크는 어디에 정의되어 있어?
4. 테스트는 어떻게 실행해?

코드를 수정하지 말고, 코드베이스 탐색 후 설명만 해줘.
```

#### Claude 인터뷰 패턴 (대형 기능)

```
사용자 알림 시스템을 만들려고 해.
AskUserQuestion 툴로 나를 인터뷰해줘.

기술 구현, UX, 엣지 케이스, 트레이드오프를 물어봐.
명백한 질문은 건너뛰고, 내가 미처 생각 못한 어려운 부분들을 파고들어.

충분히 이야기 나눈 후 SPEC.md에 완전한 명세를 작성해줘.
```

---

## 6. 종합 비교: 도구별 컨텍스트 엔지니어링 방식

| 측면 | Claude Code | Cursor | Windsurf | Cline | Kiro |
|------|-------------|--------|----------|-------|------|
| 설정 파일 | CLAUDE.md | .cursor/rules/*.mdc | .windsurfrules | .clinerules/ | .kiro/steering/ |
| 조건부 로딩 | 디렉토리 구조 | globs 패턴 | 제한적 | 파일별 | fileMatch 패턴 |
| 메모리 | Auto memory + /compact | Memories (UI) | Memories | Memory Bank | 없음 |
| 세션 관리 | --resume/--continue | 자동 (Composer) | 자동 | 자동 | 자동 |
| 컨텍스트 주입 | @파일명 | @파일명 | @파일명 | @파일명 | #[[file:...]] |
| 특수 기능 | Skills, Hooks, Subagents | MCPs, Agents | MCPs | MCPs | Spec-driven (요구사항→태스크→코드) |

---

## 7. 핵심 원칙 요약

1. **컨텍스트 품질 > 양**: 100줄짜리 완벽한 CLAUDE.md가 1000줄짜리 포괄적 CLAUDE.md보다 효과적
2. **검증 가능하게**: 테스트, 스크린샷, 빌드 결과 — Claude가 자기 작업을 검증할 수 있어야 함
3. **서브에이전트로 context 보호**: 탐색/조사는 서브에이전트에 위임, 메인 context는 구현에 집중
4. **TDD는 AI와의 최강 조합**: 테스트가 명세 = AI 환각 방지
5. **세션 이름 지정**: 세션을 브랜치처럼 관리 (`/rename feature-name`)
6. **/clear를 두려워 말 것**: 관련없는 작업 사이에는 과감히 context 초기화

---

## 참고 자료

- [Claude Code Best Practices 공식 문서](https://code.claude.com/docs/en/best-practices)
- [Kiro Steering Files 공식 문서](https://kiro.dev/docs/steering/)
- [awesome-cursorrules (PatrickJS)](https://github.com/PatrickJS/awesome-cursorrules)
- [awesome-cursor-rules-mdc (sanjeed5)](https://github.com/sanjeed5/awesome-cursor-rules-mdc)
- [Cline Memory Bank 공식 문서](https://docs.cline.bot/prompting/cline-memory-bank)
- [claude-code-memory-bank (hudrazine)](https://github.com/hudrazine/claude-code-memory-bank)
- [Repomix 공식 사이트](https://repomix.com/)
- [Jesse Vincent의 CLAUDE.md (obra/dotfiles)](https://github.com/obra/dotfiles/blob/main/.claude/CLAUDE.md)
- [The Prompt Engineering Playbook for Programmers](https://addyo.substack.com/p/the-prompt-engineering-playbook-for)
- [harper.blog — Basic Claude Code](https://harper.blog/2025/05/08/basic-claude-code/)
- [Context Window Management (DeepWiki)](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/3.2-the-compact-command)
- [Managing Claude Code Context (MCPcat)](https://mcpcat.io/guides/managing-claude-code-context/)
