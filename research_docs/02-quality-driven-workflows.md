# 품질 중심 AI 개발 워크플로우 연구

> 연구 목적: AI 코딩 시대에 코드 품질을 유지하기 위한 실전 패턴과 워크플로우 정리
> 작성일: 2026-03-04

---

## 목차

1. [TDD + AI: 테스트 주도 개발과 AI의 결합](#1-tdd--ai)
2. [AI 코드 리뷰 자동화](#2-ai-코드-리뷰-자동화)
3. [지속적 품질 관리 (Continuous Quality)](#3-지속적-품질-관리)
4. [검증 주도 개발 (Verification-Driven Development)](#4-검증-주도-개발)
5. [AI 페어 프로그래밍 패턴](#5-ai-페어-프로그래밍-패턴)
6. [품질 게이트 설계](#6-품질-게이트-설계)
7. [통합 워크플로우: CS Dashboard 적용안](#7-통합-워크플로우)

---

## 1. TDD + AI

### 핵심 개념

TDD(Test-Driven Development)는 AI와 결합했을 때 시너지가 극대화된다. AI 에이전트는 명확하고 측정 가능한 목표를 좋아하는데, 바이너리(통과/실패) 테스트가 AI에게 줄 수 있는 가장 명확한 목표이기 때문이다.

> "TDD prevents a failure mode where agents write tests that verify broken behavior. When the tests exist before the code, agents cannot cheat by writing a test that simply confirms whatever incorrect implementation they produced."
> — The Register, Agile Workshop Report

### Red-Green-Refactor with AI

```
┌─────────────────────────────────────────────────────────┐
│                   TDD + AI 사이클                        │
│                                                          │
│  1. RED   → 개발자가 실패하는 테스트 작성               │
│             AI에게 엣지 케이스 제안 요청                │
│                                                          │
│  2. GREEN → AI에게 "이 테스트를 통과시키는 코드 작성"  │
│             최소한의 구현만 요청                        │
│                                                          │
│  3. REFACTOR → AI에게 "테스트를 유지하며 개선"         │
│                테스트 재실행으로 안전 확인              │
└─────────────────────────────────────────────────────────┘
```

### 구체적인 워크플로우 단계

#### Phase 1: RED (실패하는 테스트 작성)

```python
# 개발자가 먼저 작성
def test_calculate_shipping_cost():
    """배송비 계산 - 음수 무게는 ValueError 발생해야 함"""
    with pytest.raises(ValueError, match="Weight must be positive"):
        calculate_shipping_cost(weight=-1, distance=100)

    assert calculate_shipping_cost(weight=1, distance=100) == 10.0
    assert calculate_shipping_cost(weight=5, distance=100) == 30.0
```

```bash
uv run pytest tests/test_shipping.py  # RED: 실패 확인
```

#### Phase 2: GREEN (AI에게 구현 요청)

AI 프롬프트 패턴:
```
이 실패하는 테스트를 통과시키는 최소한의 코드를 작성해줘.
과도한 최적화나 추가 기능 없이, 테스트를 통과시키는 데만 집중해.

[테스트 코드 붙여넣기]
```

```bash
uv run pytest tests/test_shipping.py  # GREEN: 통과 확인
```

#### Phase 3: REFACTOR (AI와 함께 개선)

```
현재 코드를 리팩토링해줘. 테스트는 반드시 유지되어야 해.
더 읽기 쉽고 유지보수하기 좋은 구조로 개선해줘.
```

```bash
uv run pytest  # 전체 테스트 재실행 확인
uv run ruff check .  # 린트 확인
```

### AI와 인간의 역할 분담

| 역할 | 인간 | AI |
|------|------|-----|
| 테스트 작성 | 요구사항 정의, 엣지케이스 설계 | 엣지케이스 제안, 보일러플레이트 생성 |
| 구현 | 검토 및 승인 | 코드 작성 |
| 리팩토링 | 방향 결정 | 구체적인 개선 적용 |
| 디버깅 | 실패 분석 | 수정 제안 |

### TDD가 AI 활용에서 중요한 이유

1. **환각 방지**: 테스트가 먼저 존재하면 AI가 "통과하는 것처럼 보이는" 잘못된 테스트를 만들지 못함
2. **명확한 목표**: 바이너리 통과/실패가 AI에게 가장 명확한 목표
3. **롤백 기준**: 테스트 실패 = 즉시 되돌릴 기준점
4. **점진적 확신**: 각 사이클마다 동작하는 코드가 쌓임

---

## 2. AI 코드 리뷰 자동화

### 핵심 개념

AI 코드 리뷰는 "Reviewer Zero" 개념으로 접근: AI가 먼저 PR을 검토하여 기본적인 이슈를 잡아내고, 인간 리뷰어는 더 높은 수준의 판단에 집중한다.

### 주요 도구

#### CodeRabbit (권장)
- GitHub PR에 자동으로 AI 리뷰 코멘트 추가
- 무료 오픈소스 플랜 존재
- 설정 파일 기반 커스터마이징

```yaml
# .coderabbit.yml
reviews:
  profile: "chill"  # assertive / chill
  request_changes_workflow: false
  high_level_summary: true
  poem: false
  review_status: true
  collapse_walkthrough: false
  auto_review:
    enabled: true
    drafts: false
```

#### GitHub Actions + Claude/GPT PR 리뷰

```yaml
# .github/workflows/ai-review.yml
name: AI PR Review

on:
  pull_request:
    types: [labeled]  # 'ai-review' 레이블 추가 시 실행

jobs:
  review:
    if: contains(github.event.label.name, 'ai-review')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snarktank/ai-pr-review@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

#### qodo-ai/pr-agent (오픈소스)

```bash
# 로컬에서 직접 실행
python -m pr_agent.cli --pr_url=https://github.com/org/repo/pull/123 review
python -m pr_agent.cli --pr_url=https://github.com/org/repo/pull/123 improve
python -m pr_agent.cli --pr_url=https://github.com/org/repo/pull/123 describe
```

### AI 리뷰 워크플로우

```
PR 생성
  ↓
AI 자동 리뷰 (CodeRabbit / Actions)
  ↓
개발자가 AI 피드백 확인 및 적용 (30% 수용률 기준)
  ↓
AI 피드백 해결 완료 후 인간 리뷰어 요청
  ↓
인간 리뷰 (비즈니스 로직, 아키텍처 판단)
  ↓
머지
```

### 효과적인 AI 코드 리뷰 포인트

AI 리뷰어가 잘 잡아내는 것:
- 보안 취약점 (SQL 인젝션, XSS 등)
- N+1 쿼리 문제
- 오타, 미사용 변수
- 기본적인 로직 오류
- 코드 스타일 일관성

인간 리뷰어가 집중해야 할 것:
- 비즈니스 요구사항과의 정합성
- 아키텍처 결정의 적절성
- 팀 컨텍스트와 미래 확장성
- AI 제안의 실제 타당성 검증

---

## 3. 지속적 품질 관리

### 핵심 개념

AI가 코드를 대량으로 빠르게 생성할수록, 자동화된 품질 게이트가 더 중요해진다. 속도는 좋은 설계와 나쁜 결정 모두를 증폭시킨다.

### 계층적 품질 게이트

```
레벨 1: 로컬 (즉각 피드백)
  ├── pre-commit hooks
  │   ├── ruff check (린트)
  │   ├── ruff format (포맷)
  │   └── pyright (타입 체크)
  │
레벨 2: PR (통합 확인)
  ├── GitHub Actions CI
  │   ├── pytest (전체 테스트)
  │   ├── coverage 임계값 확인
  │   └── AI 코드 리뷰
  │
레벨 3: 머지 전 (최종 게이트)
  └── 인간 리뷰 승인
```

### Pre-commit 설정 (Python 프로젝트)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/RobertCraigie/pyright-python
    rev: v1.1.390
    hooks:
      - id: pyright

  # 주의: pytest는 CI에서 실행 (pre-commit에서는 느림)
```

```bash
# 설치
uv add --dev pre-commit
pre-commit install

# 수동 실행
pre-commit run --all-files
```

### CI/CD 파이프라인 예시

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Install dependencies
        run: uv sync

      - name: Lint
        run: uv run ruff check .

      - name: Format check
        run: uv run ruff format --check .

      - name: Type check
        run: uv run pyright

      - name: Tests with coverage
        run: uv run pytest --cov --cov-fail-under=80
```

### AI 생성 코드의 품질 위험 요소

1. **환각(Hallucination)**: 존재하지 않는 API나 메서드 사용
2. **엣지케이스 누락**: 경계값 처리 미흡
3. **보안 취약점**: 입력 검증 누락
4. **과도한 추상화**: 불필요한 복잡성 도입
5. **일관성 부재**: 여러 AI 세션에서 서로 다른 패턴 혼재

---

## 4. 검증 주도 개발 (Verification-Driven Development)

### 핵심 개념: Generate → Verify → Accept/Reject 루프

```
┌──────────────────────────────────────────────┐
│         검증 주도 개발 루프                   │
│                                               │
│  개발자: 요구사항 + 제약 정의                │
│     ↓                                         │
│  AI: 코드 생성                               │
│     ↓                                         │
│  자동 검증: 린트 + 타입체크 + 테스트         │
│     ↓                                         │
│  검증 통과? ──→ NO  → AI에게 수정 요청       │
│     ↓ YES                                     │
│  개발자 검토: 비즈니스 로직, 보안            │
│     ↓                                         │
│  Accept → 커밋   Reject → 재프롬프트         │
└──────────────────────────────────────────────┘
```

### 7단계 구조화 프롬프트 패턴

실전에서 효과적인 AI 요청 구조:

```
1. 목표: [한 문장으로 명확하게]
2. 제약: [3-7개 핵심 규칙]
3. 예시: [입력 → 출력 2개]
4. 엣지케이스: [실패 시나리오 2개]
5. 크기: [작은 단위로 요청]
6. 테스트 포함: [검증 코드 함께 요청]
7. 반복: [실패 시 재프롬프트]
```

실전 예시 (Django View):
```
목표: 고객 목록을 반환하는 Django ListView 작성

제약:
- FBV(Function-Based View) 사용
- select_related('company') 포함
- HX-Request 헤더에 따라 부분/전체 템플릿 분기
- 로그인 필수 (login_required 데코레이터)
- N+1 쿼리 없을 것

예시:
- GET /customers/ → customers/list.html 렌더링
- GET /customers/ (HTMX) → customers/_list_partial.html 렌더링

엣지케이스:
- 쿼리셋이 비어있을 때 빈 상태 처리
- 권한 없는 사용자 접근 시 리다이렉트

이 뷰에 대한 pytest 테스트도 함께 작성해줘.
```

### 검증 실패 시 처리 패턴

```bash
# 1. AI 코드 생성 후 즉시 검증
uv run ruff check .
uv run pyright
uv run pytest tests/ -x  # 첫 실패에서 중단

# 2. 실패 시 AI에게 피드백 제공
"다음 오류가 발생했어. 수정해줘:
[오류 메시지 전체 복사]"

# 3. 3회 이상 같은 오류 반복 시 → 접근 방식 변경
# "같은 방법으로 계속 실패하고 있어. 다른 접근법을 시도해봐."
```

---

## 5. AI 페어 프로그래밍 패턴

### 핵심 개념

AI를 단순한 "코드 자동완성"이 아닌 **시니어 개발자와의 페어 프로그래밍**처럼 대화하며 협업하는 접근법.

> "LLM은 주니어 개발자가 아니다. 광범위한 지식을 가졌지만 컨텍스트가 없는 개발자다. 충분한 컨텍스트를 제공하면 시니어처럼 동작한다."

### 컨텍스트 제공 전략

```
좋은 컨텍스트 공급 방법:

1. CLAUDE.md / AGENTS.md 파일
   - 코딩 스타일, 린트 규칙, 아키텍처 결정
   - 금지 패턴, 선호 패턴

2. 관련 코드 스니펫 직접 제공
   - "이 파일의 패턴을 따라서..."

3. 실패 메시지 전체 제공
   - 오류 메시지, 스택 트레이스 전부

4. gitingest / repo2txt 활용
   - 코드베이스 일부를 번들하여 AI에게 제공
```

### 점진적 개발 전략 (Incremental Development)

```
잘못된 방법:
"전체 인증 시스템을 만들어줘" ❌

올바른 방법:
Step 1: "로그인 폼 ModelForm 만들어줘" → 검토 → 커밋
Step 2: "이 폼을 처리하는 FBV 만들어줘" → 검토 → 커밋
Step 3: "JWT 토큰 발급 로직 추가해줘" → 검토 → 커밋
Step 4: "로그인 실패 처리 추가해줘" → 검토 → 커밋
```

### 원자적 커밋 (Atomic Commits) 규칙

```bash
# AI 작업 후 즉시 커밋하는 습관
# 각 작업 단위마다 커밋 = 롤백 기준점

# 1. AI 코드 생성
# 2. 검증 (린트 + 테스트)
# 3. 검토 (이해한 후에만 커밋)
# 4. 커밋

git add -p  # 변경사항 청크별 검토
git commit -m "feat: add customer list view with HTMX support"

# 다음 단계 진행 전에 반드시 커밋 완료
```

### AI 페어 프로그래밍 대화 패턴

```
탐색 모드:
"이 Django 모델에서 N+1 쿼리가 발생할 수 있는 곳이 어디야?"

구현 모드:
"이 테스트를 통과시키는 최소한의 코드 작성해줘"

리팩토링 모드:
"이 뷰가 너무 복잡해. 책임을 분리할 방법 제안해줘"

디버깅 모드:
"이 오류가 왜 발생하는지 설명하고 수정 방법 알려줘:
[오류 메시지]"

학습 모드:
"방금 생성한 코드에서 이 부분이 어떻게 동작하는지 설명해줘"
```

### 위험 신호 및 대처법

| 신호 | 원인 | 대처 |
|------|------|------|
| 같은 오류 3회 반복 | 접근법 자체가 잘못됨 | "다른 방법으로 시도해봐" |
| 코드가 너무 복잡 | 요청이 너무 큼 | 작은 단위로 분할 |
| 존재하지 않는 함수 사용 | 환각 | 공식 문서와 대조 검증 |
| 이전 결정과 모순 | 컨텍스트 손실 | CLAUDE.md 업데이트 |

---

## 6. 품질 게이트 설계

### 다층 품질 게이트 아키텍처

```
┌─────────────────────────────────────────────────┐
│              품질 게이트 레이어                  │
│                                                   │
│ Layer 1: 실시간 (코드 작성 중)                  │
│   • IDE 린터 (ruff + pyright 연동)               │
│   • AI 코드 생성 직후 즉시 실행                  │
│                                                   │
│ Layer 2: Pre-commit (커밋 시)                    │
│   • ruff check + format                          │
│   • pyright 타입 체크                            │
│   • (선택) 빠른 단위 테스트                      │
│                                                   │
│ Layer 3: CI (PR 생성 시)                         │
│   • 전체 pytest 실행                             │
│   • 커버리지 임계값 (80% 이상)                   │
│   • AI 코드 리뷰 (CodeRabbit)                    │
│                                                   │
│ Layer 4: 머지 전 (인간 검토)                     │
│   • 비즈니스 로직 검토                           │
│   • 아키텍처 일관성 확인                         │
│   • 보안 취약점 최종 확인                        │
└─────────────────────────────────────────────────┘
```

### 커버리지 임계값 설정

```ini
# pyproject.toml
[tool.pytest.ini_options]
addopts = "--cov=apps --cov-report=term-missing"

[tool.coverage.report]
fail_under = 80
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
]
```

### 품질 게이트 통과 체크리스트 (AI 작업 완료 후)

```bash
# 자동 검증 스크립트
#!/bin/bash
set -e

echo "=== 품질 게이트 검사 ==="

echo "1. 린트 검사..."
uv run ruff check .

echo "2. 포맷 검사..."
uv run ruff format --check .

echo "3. 타입 검사..."
uv run pyright

echo "4. 테스트 실행..."
uv run pytest -x --lf  # 마지막 실패 먼저, 첫 실패 시 중단

echo "=== 모든 검사 통과! 커밋 가능 ==="
```

---

## 7. 통합 워크플로우

### CS Dashboard 프로젝트 적용 워크플로우

#### 일일 개발 사이클

```
1. Jira 이슈 확인 (scripts/read.py)
   ↓
2. 브랜치 생성 (sc/feature-description)
   ↓
3. CLAUDE.md 컨텍스트 확인
   ↓
4. TDD 시작: 실패하는 테스트 작성
   ↓
5. AI에게 구현 요청 (명확한 프롬프트)
   ↓
6. 품질 게이트 통과 확인
   uv run ruff check .
   uv run pyright
   uv run pytest -x
   ↓
7. 코드 이해 후 커밋 (atomic commit)
   ↓
8. PR 생성 → AI 리뷰 확인 → 인간 리뷰
   ↓
9. 머지 후 Jira 상태 업데이트
```

#### AI 프롬프트 템플릿 (Django FBV)

```
이 프로젝트의 컨텍스트:
- Django + HTMX 스택
- FBV 선호
- type hints 필수 (pyright strict)
- select_related/prefetch_related로 N+1 방지
- HX-Request 헤더로 부분/전체 응답 분기

작업: [구체적인 작업 설명]

제약사항:
- [제약 1]
- [제약 2]

기존 패턴 참고: [유사한 기존 코드 스니펫]

다음을 함께 작성해줘:
1. 뷰 함수
2. URL 패턴
3. pytest 테스트 (Factory Boy 사용)
```

---

## 참고 자료

- [How AI Code Assistants Are Revolutionizing TDD](https://www.qodo.ai/blog/ai-code-assistants-test-driven-development/) — Qodo
- [How to Use TDD for Better AI Coding Outputs](https://nimbleapproach.com/blog/how-to-use-test-driven-development-for-better-ai-coding-outputs/) — Nimble Approach
- [TDD in the Age of Vibe Coding](https://medium.com/@rupeshit/tdd-in-the-age-of-vibe-coding-pairing-red-green-refactor-with-ai-65af8ed32ae8) — Medium
- [TDD and AI: Quality in the DORA report](https://cloud.google.com/discover/how-test-driven-development-amplifies-ai-success) — Google Cloud
- [My LLM Coding Workflow Going Into 2026](https://addyosmani.com/blog/ai-coding-workflow/) — Addy Osmani
- [AI Pair Programming in 2025](https://www.builder.io/blog/ai-pair-programming) — Builder.io
- [The AI Coding Loop: How to Guide AI With Rules and Tests](https://www.freecodecamp.org/news/how-to-guide-ai-with-rules-and-tests/) — freeCodeCamp
- [Agentic AI Coding: Best Practice Patterns](https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality) — CodeScene
- [CodeRabbit Documentation](https://docs.coderabbit.ai/guides/commands) — CodeRabbit
- [AI Code Review Action](https://github.com/marketplace/actions/ai-code-review-action) — GitHub Marketplace
- [qodo-ai/pr-agent](https://github.com/qodo-ai/pr-agent) — GitHub
- [Ruff Integrations](https://docs.astral.sh/ruff/integrations/) — Astral
- [Effortless Code Quality: Pre-Commit Hooks Guide 2025](https://gatlenculp.medium.com/effortless-code-quality-the-ultimate-pre-commit-hooks-guide-for-2025-57ca501d9835) — Medium
