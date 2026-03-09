# Claude Code 스킬·훅·자동화 완전 가이드

> 작성일: 2026-03-04
> 출처: 공식 문서(code.claude.com), 현재 프로젝트 `.claude/` 탐색 결과

---

## 목차

1. [스킬 시스템 아키텍처](#1-스킬-시스템-아키텍처)
2. [커스텀 스킬 작성법](#2-커스텀-스킬-작성법)
3. [Hooks 종류와 활용 패턴](#3-hooks-종류와-활용-패턴)
4. [CLAUDE.md 설계 베스트 프랙티스](#4-claudemd-설계-베스트-프랙티스)
5. [MCP 서버 통합 방법](#5-mcp-서버-통합-방법)
6. [커스텀 에이전트 정의](#6-커스텀-에이전트-정의)
7. [워크플로우 자동화 시나리오](#7-워크플로우-자동화-시나리오)
8. [현재 프로젝트의 스킬 목록](#8-현재-프로젝트의-스킬-목록)

---

## 1. 스킬 시스템 아키텍처

### 1.1 스킬이란?

스킬은 Claude의 능력을 확장하는 **모듈식 자가-포함 패키지**다. 특정 도메인이나 태스크에 대한 온보딩 가이드처럼 작동하며, Claude를 범용 에이전트에서 전문 에이전트로 변환시킨다.

**스킬이 제공하는 것**:
1. 특정 도메인 전문 워크플로우 (절차적 지식)
2. 도구 통합 지침 (API, 파일 형식)
3. 기업/프로젝트별 도메인 지식
4. 번들된 리소스 (스크립트, 레퍼런스, 에셋)

### 1.2 3단계 점진적 로딩 (Progressive Disclosure)

스킬은 컨텍스트 창을 효율적으로 사용하기 위해 3단계로 로드된다:

| 단계 | 내용 | 로딩 시점 | 크기 |
|------|------|-----------|------|
| Level 1 | `name` + `description` (frontmatter) | 항상 컨텍스트에 존재 | ~100 토큰 |
| Level 2 | `SKILL.md` 본문 전체 | 스킬이 트리거될 때 | < 5,000 토큰 권장 |
| Level 3 | 번들 리소스 (`scripts/`, `references/`, `assets/`) | Claude가 필요하다고 판단할 때 | 무제한 |

**핵심 원칙**: `SKILL.md` 본문을 500줄 이하로 유지. 세부 내용은 `references/`로 분리.

### 1.3 스킬 디렉토리 구조

```
.claude/skills/
└── skill-name/
    ├── SKILL.md              # 필수 — frontmatter + 지침
    ├── scripts/              # 선택 — 실행 가능한 코드
    │   └── my-script.py
    ├── references/           # 선택 — Claude가 필요시 로드할 문서
    │   └── detailed-guide.md
    └── assets/               # 선택 — 출력에 사용되는 파일 (템플릿 등)
        └── template.html
```

---

## 2. 커스텀 스킬 작성법

### 2.1 SKILL.md 기본 구조

```markdown
---
name: my-skill
description: >
  이 스킬이 무엇을 하는지 + 언제 사용해야 하는지를 명확히 기술.
  트리거 조건, 사용 시나리오, 키워드를 포함.
  예: "Django 모델 설계 패턴. ORM 최적화, 비즈니스 로직 캡슐화,
  fat model / thin view 패턴을 사용할 때 활성화."
argument-hint: "[선택적 인자 힌트]"
model: sonnet   # 선택적: 이 스킬 실행 시 사용할 모델
---

# 스킬 제목

## 개요

간결한 설명...

## 워크플로우

1. 단계 1
2. 단계 2

## 참고
- 상세 내용: [references/guide.md](references/guide.md)
```

### 2.2 Description 작성 요령

`description`은 스킬 트리거의 **핵심 메커니즘**이다. frontmatter 바깥의 본문은 트리거 후에만 로드되므로, "언제 사용하는지" 정보는 반드시 `description`에 기술해야 한다.

**좋은 예**:
```yaml
description: >
  Jira 이슈 CRUD (읽기/생성/수정/상태변경). REST API를 스크립트로 직접 호출.
  사용자가 "티켓 읽어줘", "이슈 만들어", "SAAS-N 보여줘", "상태 변경" 등을
  말할 때 활성화. MCP 툴 없이 스크립트로 직접 동작.
```

### 2.3 스킬 생성 6단계 프로세스

1. **구체적 예시 수집** — 어떤 상황에서 어떻게 쓰일지 파악
2. **재사용 리소스 계획** — 스크립트/레퍼런스/에셋 결정
3. **초기화** — `init_skill.py` 실행으로 디렉토리 생성
4. **편집** — SKILL.md 작성, 리소스 구현
5. **패키징** — `package_skill.py`로 `.skill` 파일 생성
6. **반복 개선** — 실사용 후 피드백 반영

```bash
# 초기화
python .claude/skills/skill-creator/scripts/init_skill.py my-skill --path .claude/skills/

# 패키징
python .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/my-skill/
```

### 2.4 자유도(Degree of Freedom) 설정

| 자유도 | 형식 | 사용 시기 |
|--------|------|-----------|
| 높음 | 텍스트 지침 | 다양한 접근법이 유효할 때 |
| 중간 | 의사코드 / 파라미터가 있는 스크립트 | 선호 패턴이 있지만 변형 허용 |
| 낮음 | 특정 스크립트, 파라미터 최소화 | 작업이 오류-취약하고 일관성이 중요할 때 |

### 2.5 실제 예시 — 현재 프로젝트 `jira` 스킬

```markdown
---
name: jira
description: CRUD for a single Jira issue via REST API (read, create, update, transition).
             No MCP tools — uses scripts directly.
---

# jira

## Dispatch
| User intent | Reference |
|---|---|
| show / get / read | references/read.md |
| create / add | references/create.md |
| update / edit | references/update.md |
| search / list / JQL | references/search.md |
```

→ 의도별로 하나의 레퍼런스만 로드하여 컨텍스트 낭비 최소화.

---

## 3. Hooks 종류와 활용 패턴

### 3.1 Hook 이벤트 전체 목록

| 이벤트                  | 발화 시점                 | 매처 지원                                       |
| -------------------- | --------------------- | ------------------------------------------- |
| `SessionStart`       | 세션 시작/재개 시            | ✅ (`startup`, `resume`, `clear`, `compact`) |
| `UserPromptSubmit`   | 프롬프트 제출 후 Claude 처리 전 | ❌                                           |
| `PreToolUse`         | 툴 실행 전 (차단 가능)        | ✅ (툴 이름)                                    |
| `PermissionRequest`  | 권한 다이얼로그 표시 시         | ✅ (툴 이름)                                    |
| `PostToolUse`        | 툴 실행 성공 후             | ✅ (툴 이름)                                    |
| `PostToolUseFailure` | 툴 실행 실패 후             | ✅ (툴 이름)                                    |
| `Notification`       | Claude가 알림 전송 시       | ✅ (알림 유형)                                   |
| `SubagentStart`      | 서브에이전트 생성 시           | ✅ (에이전트 유형)                                 |
| `SubagentStop`       | 서브에이전트 완료 시           | ✅ (에이전트 유형)                                 |
| `Stop`               | Claude 응답 완료 시        | ❌                                           |
| `TeammateIdle`       | 팀 에이전트가 유휴 상태 전환 시    | ❌                                           |
| `TaskCompleted`      | 태스크가 완료로 표시될 때        | ❌                                           |
| `ConfigChange`       | 설정 파일 변경 시            | ✅ (설정 소스)                                   |
| `WorktreeCreate`     | 워크트리 생성 시             | ❌                                           |
| `WorktreeRemove`     | 워크트리 제거 시             | ❌                                           |
| `PreCompact`         | 컨텍스트 압축 전             | ✅ (`manual`, `auto`)                        |
| `SessionEnd`         | 세션 종료 시               | ✅ (종료 이유)                                   |

### 3.2 Hook 핸들러 4가지 타입

#### Command Hook (가장 일반적)
```json
{
  "type": "command",
  "command": ".claude/hooks/check-style.sh",
  "timeout": 30,
  "async": false
}
```
- stdin으로 JSON 이벤트 데이터 수신
- exit code + stdout으로 결과 반환

#### HTTP Hook
```json
{
  "type": "http",
  "url": "http://localhost:8080/hooks/pre-tool",
  "timeout": 30,
  "headers": { "Authorization": "Bearer $MY_TOKEN" },
  "allowedEnvVars": ["MY_TOKEN"]
}
```

#### Prompt Hook (LLM 기반 판단)
```json
{
  "type": "prompt",
  "prompt": "다음 툴 호출이 안전한지 판단해줘: $ARGUMENTS"
}
```

#### Agent Hook (툴 사용 가능한 서브에이전트)
```json
{
  "type": "agent",
  "prompt": "변경된 파일의 보안 취약점을 검사해줘: $ARGUMENTS",
  "timeout": 60
}
```

### 3.3 settings.json Hook 구성 위치

| 파일 | 범위 | 공유 가능 |
|------|------|-----------|
| `~/.claude/settings.json` | 모든 프로젝트 | 아니오 |
| `.claude/settings.json` | 단일 프로젝트 | 예 (git commit 가능) |
| `.claude/settings.local.json` | 단일 프로젝트 | 아니오 (gitignored) |

### 3.4 실용적인 Hook 패턴 예시

#### 패턴 1: 파일 수정 후 린트 자동 실행
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint.sh",
            "async": true
          }
        ]
      }
    ]
  }
}
```

#### 패턴 2: rm -rf 차단
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-dangerous.sh"
          }
        ]
      }
    ]
  }
}
```

`block-dangerous.sh`:
```bash
#!/bin/bash
COMMAND=$(echo "$1" | jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "위험한 명령 차단"}}'
else
  exit 0
fi
```

#### 패턴 3: MCP 툴 작업 로깅
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"MCP 작업: $(date)\" >> ~/mcp-audit.log",
            "async": true
          }
        ]
      }
    ]
  }
}
```

#### 패턴 4: Django 프로젝트 — Python 파일 수정 후 타입 체크
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run ruff check . --quiet 2>&1 | head -20",
            "async": true,
            "statusMessage": "린트 검사 중..."
          }
        ]
      }
    ]
  }
}
```

---

## 4. CLAUDE.md 설계 베스트 프랙티스

### 4.1 CLAUDE.md 범위

| 범위 | 위치 | 목적 |
|------|------|------|
| 사용자 전역 | `~/.claude/CLAUDE.md` | 개인 선호도 (모든 프로젝트 적용) |
| 프로젝트 | `CLAUDE.md` 또는 `.claude/CLAUDE.md` | 팀 공유 컨텍스트 (git commit) |
| 로컬 오버라이드 | `.claude/CLAUDE.md.local` | 개인 프로젝트별 설정 (gitignored) |

### 4.2 CLAUDE.md에 포함해야 할 내용

**필수 항목**:
- 기술 스택 요약 (언어, 프레임워크, DB)
- 패키지 매니저 및 주요 명령어
- 핵심 디렉토리 구조
- 코딩 스타일 및 컨벤션
- Git 컨벤션 (브랜치 이름, 커밋 형식)

**선택적 항목**:
- 스킬 활성화 트리거 규칙
- 에러 처리 원칙
- 테스트 방법론
- 보안 규칙

### 4.3 현재 프로젝트 CLAUDE.md 분석

현재 `.claude/` 구성의 핵심 패턴:

```markdown
## Skill Activation
Before implementing ANY task, check if relevant skills apply:
- Debugging issues → systematic-debugging skill
- Exploring Django project → django-extensions skill
- Creating new skills → skill-creator skill
```

→ 스킬 활성화 조건을 명시하면 Claude가 적절한 스킬을 자동으로 선택.

### 4.4 좋은 CLAUDE.md의 특징

1. **간결성**: 토큰 효율을 위해 필요한 정보만 포함
2. **실행 가능성**: "적절한 방식으로" 같은 모호한 지시 대신 구체적인 명령어 제시
3. **스킬 위임**: 상세 워크플로우는 스킬로 분리하고 CLAUDE.md에서는 트리거만 명시
4. **우선순위 명확화**: 규칙 충돌 시 어느 것이 우선인지 명시

---

## 5. MCP 서버 통합 방법

### 5.1 MCP란?

MCP(Model Context Protocol)는 Claude Code가 외부 도구와 데이터소스에 연결하기 위한 **오픈 소스 표준**이다.

**주요 트랜스포트 타입**:
- `stdio`: 로컬 프로세스로 실행 (시스템 직접 접근 필요 시)
- `http`: 원격 HTTP 서버 (권장, 클라우드 서비스)
- `sse`: 원격 SSE 서버 (deprecated → HTTP 권장)

### 5.2 MCP 서버 추가 방법

```bash
# HTTP 서버 추가
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Stdio 서버 추가
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# GitHub MCP 서버
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# PostgreSQL MCP 서버
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@localhost:5432/mydb"
```

### 5.3 MCP 서버 범위(Scope) 설정

| 범위 | 저장 위치 | 용도 |
|------|-----------|------|
| `local` (기본) | `~/.claude.json` | 개인, 현재 프로젝트만 |
| `project` | `.mcp.json` (git commit) | 팀 공유, 프로젝트별 |
| `user` | `~/.claude.json` | 개인, 모든 프로젝트 |

```bash
# 프로젝트 범위로 추가 (팀 공유)
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp

# 사용자 범위로 추가 (개인 전역)
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com
```

### 5.4 .mcp.json 파일 형식

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "local-db": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DB_URL}"]
    }
  }
}
```

환경변수 확장 지원:
- `${VAR}` — 환경변수 값
- `${VAR:-default}` — 없으면 기본값 사용

### 5.5 MCP Tool Search (컨텍스트 최적화)

MCP 툴 정의가 컨텍스트 창의 10% 초과 시 자동 활성화:
- MCP 툴을 사전 로드하지 않고 필요할 때만 동적 로드
- Sonnet 4 이상에서 지원 (Haiku 미지원)

```bash
# 커스텀 임계값 설정 (5%)
ENABLE_TOOL_SEARCH=auto:5 claude

# 완전 비활성화
ENABLE_TOOL_SEARCH=false claude
```

### 5.6 Claude Code 자체를 MCP 서버로 사용

```bash
claude mcp serve
```

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"]
    }
  }
}
```

---

## 6. 커스텀 에이전트 정의

### 6.1 에이전트 파일 위치 및 구조

```
.claude/agents/
├── implementation-planner.md
└── plan-reviewer.md
```

### 6.2 에이전트 frontmatter 스키마

```markdown
---
name: my-agent
description: >
  언제 이 에이전트를 사용하는지 설명.
  예시도 포함하면 좋음.
tools: Glob, Grep, Read, Edit, Write, Bash, WebFetch, WebSearch, Skill
skills: write-plan, review-plan   # 사전 로드할 스킬
model: opus                        # 사용할 모델 (haiku/sonnet/opus)
color: purple                      # UI 색상
memory: project                    # 메모리 범위
---

에이전트의 시스템 프롬프트...
```

### 6.3 현재 프로젝트 에이전트 예시

**implementation-planner.md**:
```yaml
tools: Glob, Grep, Read, Edit, Write, NotebookEdit, WebFetch, WebSearch,
       mcp__plugin_github_github__*, Skill, TaskCreate, TaskGet, TaskUpdate, TaskList
skills: plan
model: opus
memory: project
```

**plan-reviewer.md**:
```yaml
tools: Glob, Grep, Read, WebFetch, WebSearch, Skill, TaskCreate, TaskGet, TaskUpdate, TaskList
skills: review-plan
model: opus
memory: project
```

→ 에이전트는 특정 스킬을 사전 로드하고 제한된 툴셋만 가질 수 있어, 역할 특화가 가능.

---

## 7. 워크플로우 자동화 시나리오

### 7.1 현재 프로젝트의 전체 개발 워크플로우

```
/start-work SAAS-{N}
    ↓ Jira 이슈 조회 + 브랜치 생성 + 메모리 업데이트

/write-plan {목표}
    ↓ 코드베이스 분석 → 구현 계획서 작성 → docs/plan/에 저장

/review-plan
    ↓ 계획서 검토 → 피드백 → 2회 반복 사이클

/implement [plan-path]
    ↓ 태스크별 구현 → 검증 → 커밋 (체크리스트 기반)

/review-implementation
    ↓ 구현 vs 계획 비교 → 불일치 리포트

/start-work (PR 생성 단계)
    ↓ 브랜치 푸시 → PR 생성 → 메모리 업데이트
```

### 7.2 스킬 체이닝 패턴

```
plan-and-review 스킬 = write-plan + review-plan 자동화
start-work 스킬 = jira + git + memory 오케스트레이션
implement 스킬 = 체크리스트 기반 반복 구현 + 자동 커밋
```

### 7.3 자동화 Hook 활용 시나리오

#### 시나리오 A: 코드 품질 자동 검사
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && uv run ruff check . --quiet",
          "async": true,
          "statusMessage": "Ruff 검사 중..."
        }]
      }
    ]
  }
}
```

#### 시나리오 B: 세션 시작 시 환경 확인
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-env.sh"
        }]
      }
    ]
  }
}
```

#### 시나리오 C: 테스트 파일 수정 시 테스트 실행
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/run-tests-if-test-file.sh",
          "async": true
        }]
      }
    ]
  }
}
```

### 7.4 팀 에이전트(Agent Team) 패턴

Claude Code는 멀티 에이전트 팀을 지원:

```
TeamCreate → TaskCreate → Agent(team_name, name) → SendMessage
```

- **리더**: 태스크 생성 및 에이전트에게 할당
- **팀원**: 태스크 수행 후 완료 보고
- **통신**: `SendMessage` 툴로 비동기 메시지 교환

---

## 8. 현재 프로젝트의 스킬 목록

| 스킬명 | 역할 | 트리거 예시 |
|--------|------|-------------|
| `jira` | Jira CRUD | "SAAS-N 읽어줘", "이슈 만들어" |
| `start-work` | Jira 연동 개발 워크플로우 시작 | `/start-work SAAS-N` |
| `write-plan` | 구현 계획서 작성 | `/write-plan [목표]` |
| `review-plan` | 계획서 검토 | `/review-plan` |
| `plan-and-review` | 계획 + 검토 자동화 | `/plan-and-review` |
| `implement` | 계획 기반 구현 실행 | `/implement` |
| `review-implementation` | 구현 vs 계획 검토 | `/review-implementation` |
| `skill-creator` | 새 스킬 생성 가이드 | "새 스킬 만들어줘" |
| `systematic-debugging` | 4단계 디버깅 방법론 | "버그 조사해줘" |
| `django-extensions` | Django 프로젝트 탐색 | "URL 목록 보여줘" |
| `django-models` | Django 모델 설계 | "모델 최적화해줘" |
| `django-forms` | Django 폼 패턴 | "폼 만들어줘" |
| `django-templates` | Django 템플릿 패턴 | "템플릿 수정해줘" |
| `htmx-patterns` | HTMX 패턴 | "AJAX 동작 추가해줘" |
| `celery-patterns` | Celery 태스크 패턴 | "백그라운드 태스크 만들어줘" |
| `pytest-django-patterns` | pytest-django 테스트 | "테스트 작성해줘" |
| `write-tests` | 테스트 자동 생성 | `/write-tests` |
| `write-prd` | PRD 작성 | `/write-prd [기능]` |
| `documentation` | 문서 진단/생성 | "문서 업데이트해줘" |
| `resolve-pr-review` | PR 리뷰 코멘트 처리 | "PR 리뷰 처리해줘" |

---

## 참고 자료

- [Claude Code 공식 문서 — 스킬](https://code.claude.com/docs/en/skills)
- [Claude Code 공식 문서 — 훅 레퍼런스](https://code.claude.com/docs/en/hooks)
- [Claude Code 공식 문서 — MCP 연동](https://code.claude.com/docs/en/mcp)
- [Claude Code 공식 문서 — 설정](https://code.claude.com/docs/en/settings)
- [anthropics/skills GitHub](https://github.com/anthropics/skills)
- [Claude Code 스킬 내부 구조 분석 (Mikhail Shilkov)](https://mikhail.io/2025/10/claude-code-skills/)
