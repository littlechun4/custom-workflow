# CI/CD + AI 자동화 파이프라인 설정 가이드

> 즉시 복사-붙여넣기 가능한 완전한 설정 파일 모음
> 최종 업데이트: 2026-03-04

---

## 목차

1. [CodeRabbit `.coderabbit.yaml` 설정](#1-coderabbit-coderabbityaml-설정)
2. [Claude GitHub Actions 워크플로우](#2-claude-github-actions-워크플로우)
3. [Pre-commit 훅 설정](#3-pre-commit-훅-설정)
4. [Claude Code Hooks `settings.json`](#4-claude-code-hooks-settingsjson)
5. [AI 기반 자동 테스트 생성 GitHub Actions](#5-ai-기반-자동-테스트-생성-github-actions)
6. [Renovate Bot + AI 코드 리뷰 연동](#6-renovate-bot--ai-코드-리뷰-연동)

---

## 1. CodeRabbit `.coderabbit.yaml` 설정

### 개요

CodeRabbit은 AI 기반 코드 리뷰 도구다. `.coderabbit.yaml` 파일을 저장소 루트에 두면 UI 설정보다 우선 적용된다.

**파일 위치**: `.coderabbit.yaml` (저장소 루트)

### 기본 설정 (Python/Django 프로젝트용)

```yaml
# .coderabbit.yaml
# 공식 문서: https://docs.coderabbit.ai/getting-started/yaml-configuration
# JSON 스키마: https://coderabbit.ai/integrations/schema.v2.json

language: "ko-KR"   # 한국어 리뷰 (영어: "en-US")
early_access: true   # 얼리 액세스 기능 활성화
enable_free_tier: true

reviews:
  # 리뷰 프로파일: chill (덜 공격적), assertive (더 꼼꼼)
  profile: "assertive"

  # PR 요청 변경 워크플로우 활성화
  request_changes_workflow: true

  # PR 설명에 고수준 요약 추가
  high_level_summary: true
  high_level_summary_in_walkthrough: true

  # 코드 변경 걸음마(walkthrough) 섹션 접기
  collapse_walkthrough: false

  # 변경된 파일 요약
  changed_files_summary: true

  # 시퀀스 다이어그램 생성
  sequence_diagrams: true

  # 코드 리뷰 작업량 추정
  estimate_code_review_effort: true

  # 연결된 이슈 해결 여부 평가
  assess_linked_issues: true

  # 관련 이슈/PR 제안
  related_issues: true
  related_prs: true

  # 라벨 자동 제안 (적용은 수동)
  suggested_labels: true
  auto_apply_labels: false

  # 리뷰어 제안
  suggested_reviewers: true
  auto_assign_reviewers: false

  # 커밋 상태 표시
  review_status: true
  commit_status: true
  fail_commit_status: false

  # 재미 요소 비활성화
  poem: false

  # 검토 제외 파일 패턴
  path_filters:
    - "!uv.lock"
    - "!poetry.lock"
    - "!requirements*.txt"    # lock 파일만 제외하려면 requirements-lock.txt 등으로 명시
    - "!*.min.js"
    - "!*.min.css"
    - "!staticfiles/**"
    - "!.venv/**"
    - "!migrations/**"        # Django 마이그레이션 자동 생성 파일

  # PR 닫힘 시 리뷰 중단
  abort_on_close: true
  disable_cache: false

  # 자동 리뷰 설정
  auto_review:
    enabled: true
    auto_incremental_review: true   # 각 푸시마다 증분 리뷰
    drafts: false                   # 드래프트 PR 제외
    base_branches:
      - "main"
      - "develop"
      - "release/.*"              # 릴리즈 브랜치 정규식
    # 봇 계정 무시
    ignore_usernames:
      - "dependabot[bot]"
      - "renovate[bot]"
      - "github-actions[bot]"

  # 마무리 터치 (유료 기능)
  finishing_touches:
    docstrings:
      enabled: false   # 독스트링 자동 생성 (실험적)
    unit_tests:
      enabled: false   # 유닛 테스트 자동 생성 (실험적)

  # 파일별 커스텀 지침
  path_instructions:
    - path: "apps/**/*.py"
      instructions: |
        Django 앱 코드를 리뷰할 때 다음을 확인하세요:
        - N+1 쿼리 문제 (select_related/prefetch_related 누락)
        - 적절한 HTTP 상태 코드 반환
        - 폼 유효성 검사 로직
        - 타입 힌트 누락
    - path: "tests/**/*.py"
      instructions: |
        테스트 코드를 리뷰할 때 다음을 확인하세요:
        - Factory Boy 패턴 준수
        - 구현이 아닌 동작 테스트
        - 충분한 엣지 케이스 커버
    - path: "templates/**/*.html"
      instructions: |
        Django 템플릿을 리뷰할 때:
        - HTMX 속성 올바른 사용법
        - hx-indicator 로딩 상태 확인
        - {% csrf_token %} 누락 여부

# 채팅 자동 응답
chat:
  auto_reply: true

# 지식 베이스 (유료 기능)
knowledge_base:
  opt_out: false   # 콘텐츠 분석 허용
```

### 미니멀 설정 (무료 플랜)

```yaml
# .coderabbit.yaml (무료 플랜 최소 설정)
language: "ko-KR"

reviews:
  profile: "chill"
  high_level_summary: true
  poem: false
  path_filters:
    - "!uv.lock"
    - "!migrations/**"
  auto_review:
    enabled: true
    drafts: false
    base_branches:
      - "main"

chat:
  auto_reply: true
```

### 사용 방법

1. GitHub 앱 설치: `https://github.com/apps/coderabbit`
2. 저장소 루트에 `.coderabbit.yaml` 파일 생성
3. PR 생성 시 자동으로 CodeRabbit이 리뷰 시작
4. PR 댓글에서 `@coderabbitai review` 로 수동 트리거 가능

---

## 2. Claude GitHub Actions 워크플로우

### 개요

Anthropic 공식 GitHub Action (`anthropics/claude-code-action@v1`)을 사용해 PR/이슈에서 `@claude` 멘션으로 Claude를 호출하거나, 자동화 파이프라인을 구성할 수 있다.

**공식 문서**: https://code.claude.com/docs/en/github-actions
**공식 저장소**: https://github.com/anthropics/claude-code-action

### 사전 준비

1. GitHub Secrets에 `ANTHROPIC_API_KEY` 추가
2. GitHub App 설치 (권장): `https://github.com/apps/claude`

### 기본 워크플로우 (`@claude` 트리거)

**파일 위치**: `.github/workflows/claude.yml`

```yaml
# .github/workflows/claude.yml
# @claude 멘션으로 Claude 코드 어시스턴트 호출
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write
  actions: read

jobs:
  claude:
    runs-on: ubuntu-latest
    # @claude 멘션이 있는 경우에만 실행
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code Action
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # 선택적 설정
          # trigger_phrase: "@claude"        # 기본값
          # claude_args: "--max-turns 10"    # 최대 대화 턴
```

### 자동 PR 코드 리뷰 워크플로우

**파일 위치**: `.github/workflows/claude-pr-review.yml`

```yaml
# .github/workflows/claude-pr-review.yml
# PR 생성/업데이트 시 자동 코드 리뷰
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
    branches:
      - main
      - develop

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  review:
    runs-on: ubuntu-latest
    # 드래프트 PR 제외
    if: github.event.pull_request.draft == false
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # 전체 히스토리 (diff 비교용)

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # 자동화 모드: prompt가 있으면 즉시 실행
          prompt: |
            이 PR의 변경 사항을 리뷰해주세요. 다음 항목을 중점적으로 확인하세요:

            1. **코드 품질**
               - Python 타입 힌트 누락
               - N+1 쿼리 문제 (select_related/prefetch_related 누락)
               - 예외 처리 누락 또는 무시

            2. **Django 컨벤션**
               - FBV(함수 기반 뷰) 사용 여부
               - 적절한 HTTP 상태 코드 반환
               - ModelForm 사용 여부

            3. **보안**
               - SQL 인젝션 취약점
               - CSRF 보호 누락
               - 민감 정보 노출

            4. **테스트**
               - 새로운 코드에 대한 테스트 존재 여부
               - Factory Boy 패턴 준수

            리뷰 결과를 한국어로 PR 댓글에 작성해주세요.
          claude_args: |
            --max-turns 5
            --model claude-sonnet-4-6
```

### 이슈 자동 구현 워크플로우

**파일 위치**: `.github/workflows/claude-issue.yml`

```yaml
# .github/workflows/claude-issue.yml
# 이슈에 "claude-implement" 라벨 추가 시 자동 구현
name: Claude Issue Implementation

on:
  issues:
    types: [labeled]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  implement:
    runs-on: ubuntu-latest
    # "claude-implement" 라벨이 붙은 경우에만
    if: github.event.label.name == 'claude-implement'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python (uv)
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Install dependencies
        run: uv sync

      - name: Implement issue with Claude
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이슈 #${{ github.event.issue.number }} "${{ github.event.issue.title }}"를 구현해주세요.

            이슈 내용:
            ${{ github.event.issue.body }}

            구현 시 다음 규칙을 따르세요:
            1. CLAUDE.md의 코드 스타일 가이드 준수
            2. 새로운 기능에 대한 테스트 작성 (TDD)
            3. 타입 힌트 필수
            4. 완료 후 PR 생성
          claude_args: |
            --max-turns 20
            --model claude-opus-4-6
            --allowedTools "Bash(uv run *),Edit,Write,Read,Glob,Grep"
```

### 스케줄 자동화 워크플로우

**파일 위치**: `.github/workflows/claude-scheduled.yml`

```yaml
# .github/workflows/claude-scheduled.yml
# 정기적인 코드베이스 분석 및 리포트
name: Claude Scheduled Analysis

on:
  schedule:
    - cron: "0 9 * * 1"   # 매주 월요일 오전 9시 (UTC)
  workflow_dispatch:        # 수동 실행도 가능

permissions:
  contents: read
  issues: write

jobs:
  weekly-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Weekly Report
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            지난 주(7일간)의 코드베이스 변경 사항을 분석하고
            GitHub 이슈로 주간 리포트를 작성해주세요.

            포함 항목:
            - 주요 변경 사항 요약
            - 잠재적인 기술 부채
            - 개선이 필요한 영역
            - 테스트 커버리지 현황
          claude_args: |
            --max-turns 10
            --model claude-opus-4-6
```

### AWS Bedrock을 통한 엔터프라이즈 설정

**파일 위치**: `.github/workflows/claude-bedrock.yml`

```yaml
# .github/workflows/claude-bedrock.yml
# AWS Bedrock을 통한 Claude 호출 (데이터 주권 요구사항 있는 경우)
name: Claude Code (Bedrock)

permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude-bedrock:
    runs-on: ubuntu-latest
    if: contains(github.event.comment.body, '@claude')
    env:
      AWS_REGION: us-west-2
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate GitHub App token
        id: app-token
        uses: actions/create-github-app-token@v2
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: us-west-2

      - uses: anthropics/claude-code-action@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
          use_bedrock: "true"
          claude_args: "--model us.anthropic.claude-sonnet-4-6 --max-turns 10"
```

---

## 3. Pre-commit 훅 설정

### 개요

`pre-commit` 프레임워크를 사용해 커밋 전 자동 코드 품질 검사를 실행한다.

**파일 위치**: `.pre-commit-config.yaml` (저장소 루트)

### 설치

```bash
uv add --dev pre-commit
uv run pre-commit install        # Git 훅으로 설치
uv run pre-commit install --hook-type commit-msg   # 커밋 메시지 훅도 설치
```

### 완전한 설정 (Python/Django + Ruff + Pyright)

```yaml
# .pre-commit-config.yaml
# 공식 문서: https://pre-commit.com/
# Ruff pre-commit: https://github.com/astral-sh/ruff-pre-commit

default_language_version:
  python: python3.12

# 기본 실행 단계
default_stages: [pre-commit]

repos:
  # ─────────────────────────────────────────
  # 기본 파일 검사
  # ─────────────────────────────────────────
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace        # 후행 공백 제거
        args: [--markdown-linebreak-ext=md]
      - id: end-of-file-fixer          # 파일 끝 줄바꿈 추가
      - id: check-yaml                 # YAML 문법 검사
      - id: check-toml                 # TOML 문법 검사
      - id: check-json                 # JSON 문법 검사
      - id: check-added-large-files    # 대용량 파일 커밋 방지
        args: [--maxkb=1000]
      - id: check-merge-conflict       # 머지 충돌 마커 감지
      - id: check-case-conflict        # 대소문자 충돌 감지 (macOS/Windows)
      - id: debug-statements           # print/pdb 디버그 구문 감지
      - id: detect-private-key         # 개인 키 노출 방지
      - id: mixed-line-ending          # 줄바꿈 형식 통일
        args: [--fix=lf]
      - id: no-commit-to-branch        # 메인 브랜치 직접 커밋 방지
        args: [--branch, main, --branch, develop]

  # ─────────────────────────────────────────
  # Ruff - 린터 + 포매터 (flake8, black, isort 대체)
  # ─────────────────────────────────────────
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.1
    hooks:
      - id: ruff                       # 린터 (--fix로 자동 수정)
        name: "Ruff linter"
        args: [--fix, --exit-non-zero-on-fix]
        types_or: [python, pyi]
      - id: ruff-format                # 포매터
        name: "Ruff formatter"
        types_or: [python, pyi]

  # ─────────────────────────────────────────
  # Pyright - 타입 검사
  # ─────────────────────────────────────────
  - repo: https://github.com/RobertCraigie/pyright-python
    rev: v1.1.391
    hooks:
      - id: pyright
        name: "Pyright type checker"
        # additional_dependencies는 프로젝트의 실제 의존성을 맞춰야 함
        # uv로 관리하는 경우 별도 venv를 활용하는 것이 좋음
        pass_filenames: false   # 전체 프로젝트 검사

  # ─────────────────────────────────────────
  # Django 관련
  # ─────────────────────────────────────────
  - repo: local
    hooks:
      # Django 시스템 체크
      - id: django-check
        name: "Django system check"
        entry: uv run python manage.py check
        language: system
        pass_filenames: false
        types: [python]
        stages: [pre-push]   # 커밋이 아닌 푸시 시에만 실행 (느림)

      # 마이그레이션 누락 감지
      - id: django-migrations-check
        name: "Django migrations check"
        entry: uv run python manage.py migrate --check
        language: system
        pass_filenames: false
        types: [python]
        stages: [pre-push]

  # ─────────────────────────────────────────
  # 보안 검사
  # ─────────────────────────────────────────
  - repo: https://github.com/PyCQA/bandit
    rev: 1.8.3
    hooks:
      - id: bandit
        name: "Bandit security check"
        args: ["-c", "pyproject.toml"]
        types: [python]
        # 테스트 파일 제외
        exclude: "^tests/"

  # ─────────────────────────────────────────
  # 시크릿 탐지
  # ─────────────────────────────────────────
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        name: "Detect secrets"
        args: ["--baseline", ".secrets.baseline"]
        exclude: "uv.lock|poetry.lock"

  # ─────────────────────────────────────────
  # 커밋 메시지 컨벤션 (Conventional Commits)
  # ─────────────────────────────────────────
  - repo: https://github.com/commitizen-tools/commitizen
    rev: v4.1.0
    hooks:
      - id: commitizen
        name: "Conventional commit check"
        stages: [commit-msg]
```

### 빠른 설정 (핵심만)

```yaml
# .pre-commit-config.yaml (최소 설정)
default_language_version:
  python: python3.12

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: debug-statements
      - id: detect-private-key
      - id: no-commit-to-branch
        args: [--branch, main]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.9.1
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

### CI에서 pre-commit 실행

**파일 위치**: `.github/workflows/pre-commit.yml`

```yaml
# .github/workflows/pre-commit.yml
name: Pre-commit checks

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Run pre-commit
        uses: pre-commit/action@v3.0.1
```

---

## 4. Claude Code Hooks `settings.json`

### 개요

Claude Code 훅은 특정 이벤트(파일 편집, 프롬프트 제출 등)가 발생할 때 자동으로 쉘 명령을 실행한다.

**설정 파일 위치**:
- `~/.claude/settings.json` — 모든 프로젝트에 적용 (전역)
- `.claude/settings.json` — 단일 프로젝트 적용 (저장소에 커밋 가능)
- `.claude/settings.local.json` — 단일 프로젝트 적용 (gitignore됨, 개인 설정)

**공식 문서**: https://code.claude.com/docs/en/hooks

### 주요 훅 이벤트

| 이벤트 | 발생 시점 | 차단 가능 |
|--------|-----------|-----------|
| `SessionStart` | 세션 시작 시 | 아니오 |
| `UserPromptSubmit` | 프롬프트 제출 전 | 예 |
| `PreToolUse` | 도구 실행 전 | 예 |
| `PostToolUse` | 도구 실행 후 | 아니오 |
| `Stop` | Claude 응답 완료 후 | 예 |
| `SessionEnd` | 세션 종료 시 | 아니오 |

### 완전한 프로젝트 설정 (Django용)

**파일 위치**: `.claude/settings.json`

```json
{
  "env": {
    "INSIDE_CLAUDE_CODE": "1",
    "BASH_DEFAULT_TIMEOUT_MS": "300000",
    "BASH_MAX_TIMEOUT_MS": "600000"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/post-edit.sh",
            "timeout": 60,
            "statusMessage": "코드 품질 검사 중..."
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre-bash.sh",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-branch.sh",
            "timeout": 5,
            "statusMessage": "브랜치 확인 중..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/prompt-context.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/on-stop.sh",
            "async": true,
            "timeout": 120
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh",
            "timeout": 15,
            "statusMessage": "프로젝트 컨텍스트 로드 중..."
          }
        ]
      }
    ]
  }
}
```

### 훅 스크립트 파일들

**디렉토리 구조**:

```
.claude/
  settings.json
  hooks/
    post-edit.sh          # 파일 편집 후 린트/타입 체크
    pre-bash.sh           # 위험한 bash 명령 차단
    check-branch.sh       # main 브랜치 직접 편집 방지
    prompt-context.sh     # 프롬프트에 컨텍스트 추가
    on-stop.sh            # 작업 완료 후 테스트 실행
    session-start.sh      # 세션 시작 시 컨텍스트 로드
```

**`.claude/hooks/post-edit.sh`** — 파일 편집 후 자동 린트

```bash
#!/bin/bash
# PostToolUse: Write|Edit 후 실행
# 편집된 Python 파일에 대해 ruff 린트 실행

set -euo pipefail

# stdin에서 JSON 입력 읽기
INPUT=$(cat)

# 편집된 파일 경로 추출
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Write 도구: file_path 필드
# Edit 도구: file_path 필드
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Python 파일이 아니면 스킵
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" != *.py ]]; then
    exit 0
fi

# 파일이 존재하는지 확인
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

# ruff 린트 실행 (자동 수정 포함)
cd "$CLAUDE_PROJECT_DIR"
if command -v uv &>/dev/null; then
    uv run ruff check --fix "$FILE_PATH" 2>&1 || true
    uv run ruff format "$FILE_PATH" 2>&1 || true
fi

exit 0
```

**`.claude/hooks/pre-bash.sh`** — 위험한 명령 차단

```bash
#!/bin/bash
# PreToolUse: Bash 도구 실행 전 위험한 명령 차단

INPUT=$(cat)

# 실행할 명령 추출
COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

# 위험한 패턴 목록
DANGEROUS_PATTERNS=(
    "rm -rf /"
    "rm -rf \*"
    "DROP TABLE"
    "DROP DATABASE"
    "> /dev/sda"
    "mkfs\."
    "dd if="
)

for PATTERN in "${DANGEROUS_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qiE "$PATTERN"; then
        # exit 2로 도구 호출 차단
        echo "위험한 명령이 차단되었습니다: $PATTERN" >&2
        exit 2
    fi
done

exit 0
```

**`.claude/hooks/check-branch.sh`** — main 브랜치 직접 편집 방지

```bash
#!/bin/bash
# PreToolUse: Write|Edit 전 브랜치 확인

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
    # JSON으로 차단 응답
    python3 -c "
import json
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'PreToolUse',
        'permissionDecision': 'deny',
        'permissionDecisionReason': 'main 브랜치에서 직접 파일을 편집할 수 없습니다. 먼저 feature 브랜치를 생성하세요: git checkout -b feat/your-feature'
    }
}))
"
    exit 0
fi

exit 0
```

**`.claude/hooks/prompt-context.sh`** — 프롬프트에 컨텍스트 자동 추가

```bash
#!/bin/bash
# UserPromptSubmit: 프롬프트 제출 전 프로젝트 컨텍스트 추가

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 현재 브랜치, 최근 커밋, 작업 디렉토리 상태를 컨텍스트로 추가
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "no commits")
DIRTY=$(git status --short 2>/dev/null | head -5 || echo "")

CONTEXT="[자동 컨텍스트] 브랜치: $BRANCH | 마지막 커밋: $LAST_COMMIT"
if [[ -n "$DIRTY" ]]; then
    CONTEXT="$CONTEXT | 수정된 파일: $(echo "$DIRTY" | tr '\n' ', ')"
fi

# JSON으로 컨텍스트 전달
python3 -c "
import json, sys
context = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'UserPromptSubmit',
        'additionalContext': context
    }
}))
" "$CONTEXT"

exit 0
```

**`.claude/hooks/on-stop.sh`** — 작업 완료 후 테스트 실행

```bash
#!/bin/bash
# Stop: Claude 응답 완료 후 비동기로 테스트 실행

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 수정된 Python 파일 확인
MODIFIED_PY=$(git diff --name-only HEAD 2>/dev/null | grep '\.py$' | head -20)

if [[ -n "$MODIFIED_PY" ]]; then
    # 비동기 실행이므로 백그라운드에서 테스트
    echo "[on-stop] Python 파일이 수정됨, 관련 테스트 실행 중..."
    uv run pytest --lf -x -q 2>&1 | tail -20 || true
fi

exit 0
```

**`.claude/hooks/session-start.sh`** — 세션 시작 시 컨텍스트 로드

```bash
#!/bin/bash
# SessionStart: 세션 시작 시 프로젝트 정보 제공

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 환경 변수 설정 (이 세션의 모든 Bash 명령에 적용)
if [[ -n "$CLAUDE_ENV_FILE" ]]; then
    echo "export DJANGO_SETTINGS_MODULE=config.settings.local" >> "$CLAUDE_ENV_FILE"
    echo "export PYTHONPATH=$CLAUDE_PROJECT_DIR" >> "$CLAUDE_ENV_FILE"
fi

# 프로젝트 상태 컨텍스트 수집
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
OPEN_ISSUES=$(gh issue list --state open --limit 5 --json number,title 2>/dev/null | python3 -c "
import json, sys
issues = json.load(sys.stdin)
return '\n'.join(f'  #{i[\"number\"]}: {i[\"title\"]}' for i in issues)
" 2>/dev/null || echo "  (gh CLI 없음)")

CONTEXT="현재 브랜치: $BRANCH
최근 오픈 이슈:
$OPEN_ISSUES"

python3 -c "
import json, sys
context = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'SessionStart',
        'additionalContext': context
    }
}))
" "$CONTEXT"

exit 0
```

### 스크립트 실행 권한 설정

```bash
# 훅 스크립트에 실행 권한 부여
chmod +x .claude/hooks/*.sh
```

### 전역 설정 예시 (모든 프로젝트)

**파일 위치**: `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'COMMAND=$(python3 -c \"import json,sys; d=json.load(sys.stdin); print(d.get(\\\"tool_input\\\",{}).get(\\\"command\\\",\\\"\\\"))\"); if echo \"$COMMAND\" | grep -qE \"rm -rf /|DROP DATABASE\"; then echo \"위험한 명령 차단\" >&2; exit 2; fi'",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true",
            "async": true,
            "timeout": 5,
            "statusMessage": "완료 알림..."
          }
        ]
      }
    ]
  }
}
```

---

## 5. AI 기반 자동 테스트 생성 GitHub Actions

### 개요

PR에서 새로운 코드 변경 시 Claude가 자동으로 테스트를 생성하거나, 기존 테스트 커버리지를 분석하고 개선을 제안한다.

### 테스트 커버리지 리포트 + AI 분석 워크플로우

**파일 위치**: `.github/workflows/test-coverage.yml`

```yaml
# .github/workflows/test-coverage.yml
# pytest 실행 + 커버리지 측정 + Claude AI 분석
name: Test Coverage with AI Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python with uv
        uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Run tests with coverage
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_db"
          REDIS_URL: "redis://localhost:6379/0"
          DJANGO_SETTINGS_MODULE: "config.settings.test"
          SECRET_KEY: "test-secret-key-for-ci"
        run: |
          uv run pytest \
            --cov=apps \
            --cov-report=xml:coverage.xml \
            --cov-report=html:htmlcov \
            --cov-report=term-missing \
            --cov-fail-under=70 \
            -v \
            --tb=short \
            2>&1 | tee pytest-output.txt

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v5
        with:
          files: ./coverage.xml
          fail_ci_if_error: false

      - name: Coverage Comment on PR
        if: github.event_name == 'pull_request'
        uses: MishaKav/pytest-coverage-comment@main
        with:
          pytest-xml-coverage-path: ./coverage.xml
          pytest-txt-report-path: ./pytest-output.txt
          title: "테스트 커버리지 리포트"
          badge-title: "Coverage"
          hide-badge: false
          hide-report: false
          create-new-comment: false
          hide-comment: false
          report-only-changed-files: true

      - name: Save coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: |
            coverage.xml
            htmlcov/
            pytest-output.txt

  ai-test-analysis:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request' && always()
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download coverage report
        uses: actions/download-artifact@v4
        with:
          name: coverage-report

      - name: Analyze with Claude and suggest tests
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이 PR의 테스트 커버리지를 분석하고 추가 테스트를 제안해주세요.

            분석 방법:
            1. coverage.xml 파일을 읽어 커버리지가 낮은 모듈 확인
            2. PR에서 변경된 파일 확인 (git diff)
            3. 테스트가 없거나 커버리지가 50% 미만인 새 코드 식별

            요청 사항:
            - 커버리지 부족 영역을 PR 댓글로 요약
            - 가장 중요한 3개의 누락 테스트 케이스 제안
            - Factory Boy 패턴을 사용한 실제 테스트 코드 스니펫 제공

            Django 프로젝트 컨벤션:
            - pytest + Factory Boy 사용
            - FBV(함수 기반 뷰) 테스트
            - 동작 테스트 (구현이 아닌)
          claude_args: "--max-turns 5 --model claude-sonnet-4-6"
```

### 자동 테스트 생성 워크플로우 (Qodo Cover 통합)

**파일 위치**: `.github/workflows/auto-test-gen.yml`

```yaml
# .github/workflows/auto-test-gen.yml
# Qodo Cover를 활용한 AI 자동 테스트 생성
name: AI Test Generation

on:
  pull_request:
    types: [opened, synchronize]
    branches: [main, develop]

permissions:
  contents: write
  pull-requests: write

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: astral-sh/setup-uv@v4

      - name: Install dependencies
        run: uv sync

      - name: Get changed Python files
        id: changed-files
        run: |
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep '\.py$' | grep -v 'test_\|_test\.py\|migrations/' | head -10)
          echo "files=$CHANGED" >> $GITHUB_OUTPUT
          echo "Changed files: $CHANGED"

      - name: Generate tests with Claude
        if: steps.changed-files.outputs.files != ''
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            다음 변경된 파일들에 대한 테스트를 생성해주세요:

            ${{ steps.changed-files.outputs.files }}

            각 파일에 대해:
            1. 기존 테스트 파일 확인 (tests/ 디렉토리)
            2. 새로운 함수/메서드에 대한 테스트 추가
            3. Factory Boy를 사용한 테스트 데이터 생성
            4. 엣지 케이스 포함

            규칙:
            - pytest 스타일 사용
            - 파일명: test_{원본파일명}.py 또는 기존 테스트 파일에 추가
            - 각 테스트는 명확한 docstring 포함
            - TDD 원칙: 동작 테스트
          claude_args: |
            --max-turns 15
            --model claude-sonnet-4-6
            --allowedTools "Read,Write,Edit,Bash(uv run pytest *)"
```

---

## 6. Renovate Bot + AI 코드 리뷰 연동

### 개요

Renovate Bot으로 의존성을 자동 업데이트하고, Claude로 업데이트된 의존성의 영향을 분석한다.

**공식 GitHub**: https://github.com/renovatebot
**공식 문서**: https://docs.renovatebot.com/

### Renovate 설정 파일

**파일 위치**: `renovate.json` (저장소 루트)

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":dependencyDashboard",
    ":semanticCommits",
    ":enablePreCommit"
  ],

  "timezone": "Asia/Seoul",
  "schedule": ["after 10pm every weekday", "before 5am every weekday"],

  "labels": ["dependencies", "renovate"],
  "assignees": [],
  "reviewers": [],

  "commitMessagePrefix": "chore(deps):",
  "commitMessageAction": "update",

  "prHourlyLimit": 3,
  "prConcurrentLimit": 10,
  "branchConcurrentLimit": 20,

  "enabledManagers": [
    "pip_requirements",
    "pyenv",
    "github-actions",
    "docker-compose",
    "dockerfile"
  ],

  "python": {
    "registryUrls": ["https://pypi.org/simple/"]
  },

  "packageRules": [
    {
      "description": "Django 마이너/패치 업데이트 자동 머지",
      "matchPackageNames": ["django"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash",
      "labels": ["dependencies", "django", "automerge"]
    },
    {
      "description": "Django 메이저 업데이트는 수동 검토",
      "matchPackageNames": ["django"],
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["dependencies", "django", "major-update"],
      "assignees": ["@team-lead"]
    },
    {
      "description": "보안 업데이트는 즉시 처리",
      "matchUpdateTypes": ["patch"],
      "matchCategories": ["security"],
      "automerge": true,
      "automergeType": "pr",
      "labels": ["security", "automerge"],
      "schedule": ["at any time"]
    },
    {
      "description": "개발 의존성 패치 자동 머지",
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "groupName": "dev dependencies (patch)",
      "labels": ["dependencies", "dev-only"]
    },
    {
      "description": "린트/포맷 도구 그룹화",
      "matchPackageNames": ["ruff", "pyright", "black", "isort", "flake8"],
      "groupName": "Python lint/format tools",
      "automerge": true,
      "automergeType": "pr",
      "labels": ["dependencies", "tooling"]
    },
    {
      "description": "테스트 관련 패키지 그룹화",
      "matchPackageNames": [
        "pytest",
        "pytest-django",
        "pytest-cov",
        "factory-boy",
        "faker"
      ],
      "groupName": "Test dependencies",
      "automerge": true,
      "labels": ["dependencies", "testing"]
    },
    {
      "description": "Celery 관련 패키지 그룹화",
      "matchPackageNames": ["celery", "redis", "kombu", "billiard"],
      "groupName": "Celery stack",
      "automerge": false,
      "labels": ["dependencies", "celery"]
    },
    {
      "description": "GitHub Actions 업데이트 자동 머지",
      "matchManagers": ["github-actions"],
      "automerge": true,
      "groupName": "GitHub Actions",
      "labels": ["dependencies", "ci"]
    },
    {
      "description": "메이저 업데이트 주간 처리",
      "matchUpdateTypes": ["major"],
      "schedule": ["on monday"],
      "labels": ["dependencies", "major-update"]
    }
  ],

  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "schedule": ["at any time"],
    "automerge": true
  },

  "dependencyDashboard": true,
  "dependencyDashboardTitle": "Renovate Dependency Dashboard",
  "dependencyDashboardLabels": ["renovate"],

  "postUpdateOptions": [
    "uvLockFileMaintenance"
  ]
}
```

### Renovate PR에 Claude 코드 리뷰 연동

**파일 위치**: `.github/workflows/renovate-review.yml`

```yaml
# .github/workflows/renovate-review.yml
# Renovate PR에 AI 영향 분석 추가
name: Renovate Dependency Analysis

on:
  pull_request:
    types: [opened, synchronize]
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  analyze:
    runs-on: ubuntu-latest
    # Renovate 봇의 PR만 처리
    if: startsWith(github.head_ref, 'renovate/')
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: astral-sh/setup-uv@v4

      - name: Install updated dependencies
        run: |
          uv sync || echo "의존성 설치 중 오류 발생"
        continue-on-error: true

      - name: Run tests on updated dependencies
        id: tests
        run: |
          uv run pytest --tb=short -q 2>&1 | tee test-results.txt || true
          echo "exit_code=$?" >> $GITHUB_OUTPUT
        env:
          DJANGO_SETTINGS_MODULE: "config.settings.test"
          DATABASE_URL: "sqlite:///test.db"
        continue-on-error: true

      - name: Analyze dependency update impact
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            이 Renovate PR의 의존성 업데이트를 분석해주세요.

            PR 제목: ${{ github.event.pull_request.title }}
            PR 브랜치: ${{ github.head_ref }}

            분석 항목:
            1. `uv.lock` 또는 `requirements*.txt` 변경 사항 확인
            2. 업데이트된 패키지의 변경 사항 (CHANGELOG, breaking changes)
            3. 테스트 실행 결과 확인 (test-results.txt)
            4. 업데이트 적용 권장 여부

            주의 사항:
            - Django 버전 업데이트 시 마이그레이션 호환성 확인
            - Celery 버전 업데이트 시 태스크 직렬화 호환성 확인
            - 보안 취약점 패치 여부 확인

            결과를 한국어로 PR 댓글에 작성해주세요.
          claude_args: "--max-turns 5 --model claude-sonnet-4-6"
```

### Dependabot 보안 알림 자동 처리

**파일 위치**: `.github/dependabot.yml`

```yaml
# .github/dependabot.yml
# 보안 알림은 Dependabot, 일반 업데이트는 Renovate로 분리
version: 2

updates:
  # Python 의존성 보안 알림만
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    # 보안 관련 PR만 생성 (업데이트는 Renovate가 처리)
    open-pull-requests-limit: 5
    labels:
      - "security"
      - "dependabot"
    commit-message:
      prefix: "fix(security):"

  # GitHub Actions 보안 알림
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "security"
      - "ci"
    commit-message:
      prefix: "fix(ci):"
```

### Renovate 자체 실행 (Self-hosted) GitHub Actions

**파일 위치**: `.github/workflows/renovate.yml`

```yaml
# .github/workflows/renovate.yml
# GitHub App을 통한 Renovate 자체 실행 (비공개 저장소 또는 세밀한 제어 필요 시)
name: Renovate

on:
  schedule:
    - cron: "0 3 * * *"   # 매일 오전 3시 (UTC)
  workflow_dispatch:
    inputs:
      repoCache:
        description: "캐시 재사용 여부"
        type: boolean
        default: true

permissions:
  contents: read

jobs:
  renovate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get Renovate token
        id: get-token
        uses: actions/create-github-app-token@v2
        with:
          app-id: ${{ secrets.RENOVATE_APP_ID }}
          private-key: ${{ secrets.RENOVATE_PRIVATE_KEY }}
          repositories: ${{ github.event.repository.name }}

      - name: Run Renovate
        uses: renovatebot/github-action@v41
        with:
          token: ${{ steps.get-token.outputs.token }}
        env:
          LOG_LEVEL: "info"
          RENOVATE_REPOSITORIES: "${{ github.repository }}"
```

---

## 빠른 시작 체크리스트

### 최소 설정 (30분)

- [ ] `.coderabbit.yaml` 저장소 루트에 추가
- [ ] `ANTHROPIC_API_KEY` GitHub Secrets에 추가
- [ ] `.github/workflows/claude.yml` 추가 (`@claude` 멘션 기능)
- [ ] `.pre-commit-config.yaml` 추가 + `uv run pre-commit install`

### 완전한 설정 (2시간)

- [ ] 위 최소 설정 완료
- [ ] `.github/workflows/claude-pr-review.yml` 추가 (자동 PR 리뷰)
- [ ] `.github/workflows/test-coverage.yml` 추가 (테스트 커버리지)
- [ ] `.claude/settings.json` + 훅 스크립트 추가
- [ ] `renovate.json` 추가 + Renovate GitHub App 설치
- [ ] `.github/workflows/renovate-review.yml` 추가

### GitHub Secrets 목록

| Secret 이름 | 설명 | 필수 여부 |
|-------------|------|-----------|
| `ANTHROPIC_API_KEY` | Claude API 키 | 필수 |
| `APP_ID` | GitHub App ID (Renovate용) | 선택 |
| `APP_PRIVATE_KEY` | GitHub App Private Key | 선택 |
| `RENOVATE_APP_ID` | Renovate GitHub App ID | Renovate 자체실행 시 |
| `RENOVATE_PRIVATE_KEY` | Renovate App Private Key | Renovate 자체실행 시 |
| `AWS_ROLE_TO_ASSUME` | AWS IAM Role ARN | Bedrock 사용 시 |

---

## 참고 자료 (Sources)

- [CodeRabbit YAML 설정 공식 문서](https://docs.coderabbit.ai/getting-started/yaml-configuration)
- [CodeRabbit 설정 레퍼런스](https://docs.coderabbit.ai/configure-coderabbit/)
- [anthropics/claude-code-action GitHub](https://github.com/anthropics/claude-code-action)
- [Claude Code GitHub Actions 공식 문서](https://code.claude.com/docs/en/github-actions)
- [Claude Code Hooks 레퍼런스](https://code.claude.com/docs/en/hooks)
- [Claude Code Action 예제 디렉토리](https://github.com/anthropics/claude-code-action/tree/main/examples)
- [astral-sh/ruff-pre-commit](https://github.com/astral-sh/ruff-pre-commit)
- [RobertCraigie/pyright-python pre-commit](https://github.com/RobertCraigie/pyright-python)
- [Renovate Bot 공식 문서](https://docs.renovatebot.com/)
- [Renovate vs Dependabot 비교](https://docs.renovatebot.com/bot-comparison/)
- [Qodo Cover AI 테스트 생성](https://github.com/qodo-ai/qodo-cover)
- [Pytest Coverage Comment GitHub Action](https://github.com/marketplace/actions/pytest-coverage-comment)
- [repomix .coderabbit.yaml 실제 예시](https://github.com/yamadashy/repomix/blob/main/.coderabbit.yaml)
- [actions-up .coderabbit.yaml 실제 예시](https://github.com/azat-io/actions-up/blob/main/.coderabbit.yaml)
