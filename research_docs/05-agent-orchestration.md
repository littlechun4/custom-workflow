# 멀티 에이전트 오케스트레이션 패턴 연구
> AI 주도 개발을 위한 에이전트 팀 아키텍처 설계 가이드

**작성일**: 2026-03-04
**출처**: Claude Code 공식 문서, Anthropic Engineering Blog, 커뮤니티 리서치

---

## 목차

1. [개요: 멀티 에이전트 시스템이란](#1-개요)
2. [에이전트 팀 아키텍처 패턴](#2-에이전트-팀-아키텍처-패턴)
3. [역할별 에이전트 설계 가이드](#3-역할별-에이전트-설계-가이드)
4. [태스크 분해 및 의존성 관리 전략](#4-태스크-분해-및-의존성-관리-전략)
5. [커뮤니케이션 흐름 다이어그램](#5-커뮤니케이션-흐름-다이어그램)
6. [Worktree 기반 병렬 작업 패턴](#6-worktree-기반-병렬-작업-패턴)
7. [Claude Agent SDK](#7-claude-agent-sdk)
8. [실전 적용 시나리오](#8-실전-적용-시나리오)
9. [비용 및 효율 고려사항](#9-비용-및-효율-고려사항)

---

## 1. 개요

### 멀티 에이전트 시스템이란?

멀티 에이전트 시스템은 여러 AI 에이전트가 협력하여 복잡한 작업을 수행하는 아키텍처다. 단일 에이전트가 순차적으로 처리하는 방식과 달리, 여러 전문화된 에이전트가 **병렬**로 또는 **조율된 순서**로 작업을 처리한다.

### 언제 멀티 에이전트가 필요한가?

| 시나리오 | 단일 에이전트 | 멀티 에이전트 |
|---------|------------|-------------|
| 간단한 버그 수정 | ✅ 적합 | ❌ 오버킬 |
| 컨텍스트 윈도우 초과 작업 | ❌ 불가 | ✅ 적합 |
| 독립적인 병렬 탐색 | 느림 | ✅ 빠름 |
| 같은 파일 동시 편집 | - | ❌ 충돌 위험 |
| 풀스택 기능 개발 | 느림 | ✅ 각 레이어별 담당 |
| 경쟁 가설 검증 | 편향 가능 | ✅ 객관적 검증 |
| 코드 리뷰 (다각도) | 단일 관점 | ✅ 다중 관점 동시 |

**핵심 원칙**: 작업이 자연스럽게 병렬화 가능하거나, 서로 다른 도메인에 걸쳐 있거나, 컨텍스트 한계를 초과할 때 멀티 에이전트가 효과적이다.

---

## 2. 에이전트 팀 아키텍처 패턴

Claude Code의 에이전트 시스템은 크게 두 가지 방식으로 나뉜다.

### 2.1 서브에이전트 (Subagents) — 단일 세션 내

```
┌─────────────────────────────────────────────────┐
│                 메인 에이전트                      │
│              (단일 컨텍스트 윈도우)                │
│                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ 서브에이│  │ 서브에이│  │  서브에이전트  │  │
│   │ 전트 A  │  │ 전트 B  │  │      C       │  │
│   │(탐색)   │  │(분석)   │  │  (검증)      │  │
│   └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │             │               │           │
│        └─────────────┴───────────────┘           │
│                결과를 메인에 반환                  │
└─────────────────────────────────────────────────┘
```

**특징**:
- 각 서브에이전트는 독립된 컨텍스트 윈도우에서 실행
- 결과만 메인 에이전트에 반환 (서브에이전트 간 직접 통신 불가)
- 메인 에이전트가 모든 조율 담당
- 토큰 비용이 낮음 (결과만 메인 컨텍스트로 복귀)

**적합한 경우**: 빠른 집중 작업, 결과만 필요한 경우

### 2.2 에이전트 팀 (Agent Teams) — 멀티 세션

```
┌─────────────────────────────────────────────────────────────┐
│                      팀 리드 에이전트                         │
│                   (오케스트레이션 담당)                        │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────┐
    │              공유 태스크 리스트           │
    │    [TASK-1: pending] [TASK-2: progress]  │
    │    [TASK-3: done]    [TASK-4: pending]   │
    └──────┬──────────────────────────────────┘
           │                    │
    ┌──────▼─────┐        ┌─────▼──────┐        ┌────────────┐
    │ 팀메이트 A  │◄──────►│ 팀메이트 B  │◄──────►│ 팀메이트 C │
    │ (프론트엔드)│  메시지  │ (백엔드)    │  메시지  │  (테스트)  │
    │ 독립 컨텍스트│        │ 독립 컨텍스트│        │ 독립 컨텍스트│
    └────────────┘        └─────────────┘        └────────────┘
```

**특징**:
- 팀메이트는 독립된 Claude Code 인스턴스
- 공유 태스크 리스트로 작업 조율
- 팀메이트 간 **직접 메시지 가능**
- 완료된 태스크가 차단된 태스크를 자동 해제
- 팀 파일: `~/.claude/teams/{team-name}/config.json`
- 태스크 파일: `~/.claude/tasks/{team-name}/`

**적합한 경우**: 상호 협력이 필요한 복잡한 작업, 병렬 탐색이 가치 있는 경우

### 2.3 핵심 아키텍처 구성 요소

| 컴포넌트 | 역할 |
|---------|------|
| **팀 리드** | 팀 생성, 팀메이트 생성, 작업 조율 |
| **팀메이트** | 할당된 태스크 독립 처리 |
| **태스크 리스트** | 공유 작업 목록, pending/in_progress/completed |
| **메일박스** | 에이전트 간 비동기 메시징 시스템 |

---

## 3. 역할별 에이전트 설계 가이드

### 3.1 기본 내장 서브에이전트 (Claude Code)

**Explore 에이전트**
- 모델: Haiku (빠른 저지연)
- 도구: 읽기 전용 (Write/Edit 불가)
- 목적: 파일 검색, 코드 탐색, 코드베이스 분석

**Plan 에이전트**
- 모델: 메인과 동일
- 도구: 읽기 전용
- 목적: 플랜 모드에서 코드베이스 리서치

**General-purpose 에이전트**
- 모델: 메인과 동일
- 도구: 전체 도구 접근
- 목적: 복잡한 멀티 스텝 작업

### 3.2 개발 워크플로우별 역할 설계

#### 패턴 A: 리서처 + 구현자 + 리뷰어

```
┌──────────────────────────────────────────────────────────────┐
│                    개발 사이클                                  │
│                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────────┐  │
│  │  리서처     │────►│  구현자     │────►│  리뷰어       │  │
│  │ (Researcher)│     │(Implementer)│     │  (Reviewer)   │  │
│  │             │     │             │     │               │  │
│  │- 코드베이스 │     │- 기능 구현  │     │- 코드 품질    │  │
│  │  탐색       │     │- 테스트 작성│     │- 보안 검토    │  │
│  │- 요구사항   │     │- 버그 수정  │     │- 성능 검토    │  │
│  │  분석       │     │             │     │- 표준 준수    │  │
│  │- 패턴 발견  │     │             │     │               │  │
│  └─────────────┘     └─────────────┘     └───────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**커스텀 서브에이전트 정의 예시 (`.claude/agents/researcher.md`)**:

```yaml
---
name: researcher
description: >
  코드베이스 탐색 전문가. 새 기능 구현 전 관련 코드 패턴,
  의존성, 잠재적 영향을 분석한다. 구현 계획 수립 전 자동 사용.
tools: Read, Grep, Glob
model: haiku
---

당신은 코드베이스 분석 전문가입니다.

작업 수행 시:
1. 관련 파일과 모듈을 탐색
2. 기존 패턴과 컨벤션을 파악
3. 잠재적 영향 범위를 매핑
4. 구현자를 위한 컨텍스트 요약 제공

항상 찾은 파일 경로와 핵심 패턴을 명시하세요.
```

#### 패턴 B: 플래너 + 코더 + 테스터

```
요구사항
    │
    ▼
┌──────────┐   계획서   ┌──────────┐   구현   ┌──────────┐
│ 플래너   │──────────►│  코더    │─────────►│ 테스터   │
│(Planner) │           │  (Coder) │          │ (Tester) │
└──────────┘           └──────────┘          └──────────┘
    │                      │                      │
  설계 결정             코드 생성              테스트 검증
  의존성 분석          DB 마이그레이션         실패 리포트
  위험 평가           API 엔드포인트          커버리지 측정
```

#### 패턴 C: 병렬 리뷰어 (다각도 동시 분석)

```
                 PR #142
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ 보안 리뷰어  │ │ 성능     │ │  테스트 커버 │
│              │ │ 리뷰어   │ │  리지 리뷰어 │
│- 인증 취약점 │ │- N+1 쿼리│ │- 미테스트    │
│- 입력 검증   │ │- 인덱스  │ │  경로        │
│- API 키 노출 │ │- 캐시    │ │- 엣지 케이스 │
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
        └─────────────┴───────────────┘
                       │
               팀 리드가 종합
               (통합 리뷰 보고서)
```

### 3.3 Django 프로젝트 특화 에이전트 설계

**모델 설계 에이전트** (`.claude/agents/django-model-designer.md`):
```yaml
---
name: django-model-designer
description: >
  Django 모델 설계 전문가. DB 스키마 변경, 새 모델 추가,
  쿼리 최적화 작업 시 사용. Fat Model 패턴 적용.
tools: Read, Grep, Glob, Bash
model: sonnet
---

Django 모델 설계 전문가로서:
- Fat Model / Thin View 패턴 적용
- select_related/prefetch_related로 N+1 방지
- 마이그레이션 영향 분석 후 설계
- Manager와 QuerySet 최적화 포함
```

**HTMX 뷰 구현 에이전트** (`.claude/agents/htmx-implementer.md`):
```yaml
---
name: htmx-implementer
description: >
  HTMX + Django 뷰 구현 전문가. 부분 템플릿 생성,
  hx-* 속성 적용, FBV 패턴으로 구현.
tools: Read, Edit, Write, Bash
model: sonnet
---

HTMX 구현 시:
- Function-Based Views 우선
- _partial.html 네이밍 규칙
- hx-indicator 로딩 상태 필수
- HX-Request 헤더로 부분/전체 응답 분기
- 폼 제출 시 버튼 비활성화
```

---

## 4. 태스크 분해 및 의존성 관리 전략

### 4.1 태스크 크기 기준

```
너무 작음:                올바른 크기:               너무 큼:
조율 오버헤드 >           명확한 산출물               과도한 컨텍스트
작업 이점                 예: 함수 하나               스위칭
                         테스트 파일 하나
                         리뷰 보고서 하나
```

**실용적 규칙**: 팀메이트 1명당 5-6개 태스크가 최적. 15개 독립 태스크라면 에이전트 3명이 적합.

### 4.2 의존성 그래프 (DAG) 패턴

```
풀스택 기능 구현 분해 예시:

TASK-1: API 엔드포인트 설계 (독립)
    │
    ▼
TASK-2: 백엔드 구현 (TASK-1 완료 후)
TASK-3: DB 마이그레이션 (TASK-1 완료 후)
    │                │
    ▼                ▼
TASK-4: 프론트엔드 HTMX (TASK-2, TASK-3 완료 후)
    │
    ▼
TASK-5: 통합 테스트 (TASK-4 완료 후)
TASK-6: 문서화 (병렬 가능 — TASK-2 완료 후)
```

**태스크 상태 전이**:
```
pending ──► in_progress ──► completed
                │
                ▼
          (차단 태스크 자동 해제)
```

### 4.3 태스크 분해 전략

**방법 1: 레이어 기반 분해**
- 데이터 모델 레이어 → 비즈니스 로직 레이어 → API 레이어 → UI 레이어

**방법 2: 도메인 기반 분해**
- 인증 도메인 → 결제 도메인 → 알림 도메인

**방법 3: 역할 기반 분해**
- 리서치 단계 → 구현 단계 → 검증 단계

**방법 4: 가설 경쟁 분해** (디버깅 최적)
- 각 에이전트가 다른 가설 검증
- 가장 강한 증거를 찾은 에이전트의 결론 채택

### 4.4 파일 충돌 방지 전략

```
에이전트 A                에이전트 B
│                         │
│ apps/accounts/          │ apps/dashboard/
│   models.py ✅          │   models.py ✅
│   views.py  ✅          │   views.py  ✅
│                         │
│ ❌ 같은 파일 동시 수정 금지
```

**파일 소유권 할당 원칙**:
1. 팀메이트별 담당 앱/모듈 명시
2. 공유 파일(urls.py, settings.py)은 팀 리드만 수정
3. Git worktree로 완전 격리 (4장 참조)

---

## 5. 커뮤니케이션 흐름 다이어그램

### 5.1 메시지 전달 방식

**직접 메시지 (Direct Message)**:
```python
# 팀메이트 → 팀메이트 직접 메시지
{
    "type": "message",
    "recipient": "backend-implementer",
    "content": "API 엔드포인트 /api/v1/users/ 스키마 정의 공유 부탁드립니다.",
    "summary": "API 스키마 요청"
}
```

**브로드캐스트 (sparingly)**:
```python
# 팀 전체 공지 — 비용 선형 증가하므로 최소화
{
    "type": "broadcast",
    "content": "차단 버그 발견: DB 연결 실패. 모든 작업 일시 중단.",
    "summary": "긴급 차단 이슈"
}
```

### 5.2 커뮤니케이션 흐름 패턴

**패턴 A: 허브-앤-스포크 (Hub-and-Spoke)**
```
        팀메이트 A
            │
            ▼
팀메이트 D ◄─► 팀 리드 ◄─► 팀메이트 B
            ▲
            │
        팀메이트 C

- 모든 조율이 팀 리드를 통과
- 단순하지만 리드가 병목될 수 있음
- 소규모 팀(3명 이하)에 적합
```

**패턴 B: 피어-투-피어 (Peer-to-Peer)**
```
팀메이트 A ◄──────► 팀메이트 B
     │                   │
     └────────┬───────────┘
              ▼
          팀메이트 C
              │
              ▼
           팀 리드 (조율)

- 팀메이트 간 직접 소통
- 더 빠른 조율, 복잡성 증가
- 중규모 팀(4-6명)에 적합
```

**패턴 C: 보고 체인 (Reporting Chain)**
```
팀 리드
    │
    ├── 리서처 (결과 → 리드)
    │
    ├── 구현자 A (리서처 결과 수신, 완료 → 리드)
    │
    ├── 구현자 B (리서처 결과 수신, 완료 → 리드)
    │
    └── 리뷰어 (구현 완료 후 리드 지시로 시작)

- 명확한 단계별 진행
- 순차적 종속성이 있는 작업에 적합
```

### 5.3 에스컬레이션 패턴

```
팀메이트가 차단됨
       │
       ▼
팀 리드에게 차단 이슈 메시지
       │
       ▼
리드가 대안 전략 제시 또는
다른 팀메이트에 재할당
       │
       ▼
차단 해소 후 재개
```

### 5.4 Hooks를 통한 품질 게이팅

```
팀메이트 작업 완료
       │
       ▼
TaskCompleted 훅 실행
       │
  검증 스크립트
  (테스트 통과? 린트 오류?)
       │
    ┌──┴──┐
    │     │
  통과   실패
    │     │
    ▼     ▼
 완료   exit 2 → 팀메이트에 피드백
        태스크 완료 차단
```

---

## 6. Worktree 기반 병렬 작업 패턴

### 6.1 Git Worktree 개념

Git Worktree는 하나의 저장소에서 여러 작업 디렉토리를 유지하는 기능이다. 각 에이전트가 자체 브랜치와 작업 디렉토리를 가져 파일 충돌 없이 병렬 작업이 가능하다.

```
.git (공유 저장소)
├── main 브랜치: /project/
│
└── worktrees/
    ├── feature-auth/     ← 에이전트 A 작업공간
    │   (브랜치: sc/feature-auth)
    │
    ├── feature-payments/ ← 에이전트 B 작업공간
    │   (브랜치: sc/feature-payments)
    │
    └── refactor-models/  ← 에이전트 C 작업공간
        (브랜치: sc/refactor-models)
```

### 6.2 Claude Code의 Worktree 지원

**내장 Worktree 지원 (CLI)**:
```bash
# 격리된 worktree에서 세션 시작
claude --worktree feature-auth

# 서브에이전트에 worktree 격리 적용
```

**서브에이전트 frontmatter 설정**:
```yaml
---
name: feature-implementer
description: 새 기능을 격리된 worktree에서 구현
isolation: worktree  # 자동으로 임시 git worktree 생성
---
```

**동작 방식**:
- 변경 없으면 worktree 자동 삭제
- 변경 있으면 worktree 경로와 브랜치 정보 반환
- 세션 종료 시 유지/삭제 선택 가능

### 6.3 Worktree 병렬 작업 시나리오

**시나리오: 대규모 코드 마이그레이션**
```
50개 파일 API 패턴 변경
           │
    ┌──────┴─────────────────────────────────┐
    │              태스크 분배               │
    └──────┬─────────────────────────────────┘
           │
    ┌──────┼──────────────────┐
    ▼      ▼                  ▼
 에이전트1 에이전트2      에이전트3
 worktree1 worktree2    worktree3
 10개 파일 10개 파일    10개 파일
    │          │               │
    └──────────┴───────────────┘
                    │
             PR 각각 생성
                    │
              리뷰 후 머지
```

**시나리오: 경쟁 구현 (A/B 테스트)**
```
에이전트 A (worktree-a):     에이전트 B (worktree-b):
  접근법 1로 구현              접근법 2로 구현
  (Redis 캐시)                (DB 인덱스 최적화)
        │                           │
        └────────────┬──────────────┘
                     ▼
              두 구현 비교 리뷰
              더 나은 접근법 선택
```

### 6.4 Worktree 모범 사례

```bash
# 수동 worktree 관리 (참고용)
git worktree add .claude/worktrees/feature-auth -b sc/feature-auth
git worktree list
git worktree remove .claude/worktrees/feature-auth

# Claude Code 자동화 — --worktree 플래그 사용 권장
claude --worktree my-feature
```

**주의사항**:
- 같은 파일을 다른 worktree에서 동시 편집은 별도 브랜치이므로 머지 충돌로 처리
- Worktree가 많아지면 디스크 공간 주의
- 완료된 worktree는 즉시 정리

---

## 7. Claude Agent SDK

### 7.1 개요

Claude Agent SDK는 Claude Code를 라이브러리로 사용하여 프로덕션 AI 에이전트를 구축하는 공식 SDK다. 이전에는 Claude Code SDK라 불렸으며, 더 넓은 사용 사례를 반영하여 Agent SDK로 이름이 변경됐다.

**지원 언어**: Python, TypeScript

### 7.2 Claude Code CLI vs Agent SDK

| 구분 | Claude Code CLI | Claude Agent SDK |
|------|----------------|------------------|
| 인터페이스 | 대화형 터미널 | 프로그래밍 API |
| 사용 사례 | 일상 개발 | CI/CD, 자동화, 프로덕션 |
| 제어 수준 | 대화 기반 | 코드 기반 정밀 제어 |
| 세션 관리 | 수동 | 프로그래밍 방식 |
| 통합 | 터미널 | 모든 애플리케이션 |

### 7.3 핵심 기능

**기본 사용 패턴 (Python)**:
```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="auth.py의 버그를 찾아 수정하세요",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash"]
        ),
    ):
        print(message)

asyncio.run(main())
```

**서브에이전트 정의**:
```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="code-reviewer 에이전트로 코드베이스 리뷰해주세요",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Glob", "Grep", "Task"],
            agents={
                "code-reviewer": AgentDefinition(
                    description="코드 품질 및 보안 전문 리뷰어",
                    prompt="코드 품질, 보안, 모범 사례를 분석하여 개선점을 제안합니다.",
                    tools=["Read", "Glob", "Grep"],
                )
            },
        ),
    ):
        print(message)
```

**Hooks를 통한 감사 로깅**:
```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

async def log_file_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path", "unknown")
    with open("./audit.log", "a") as f:
        f.write(f"{datetime.now()}: 수정됨 {file_path}\n")
    return {}

options = ClaudeAgentOptions(
    permission_mode="acceptEdits",
    hooks={
        "PostToolUse": [
            HookMatcher(matcher="Edit|Write", hooks=[log_file_change])
        ]
    },
)
```

**세션 재개 (컨텍스트 유지)**:
```python
session_id = None

# 첫 번째 쿼리
async for message in query(prompt="인증 모듈 읽어주세요"):
    if hasattr(message, "subtype") and message.subtype == "init":
        session_id = message.session_id

# 이전 컨텍스트 유지하며 재개
async for message in query(
    prompt="이제 그것을 호출하는 모든 곳을 찾아주세요",
    options=ClaudeAgentOptions(resume=session_id),
):
    print(message)
```

### 7.4 Claude Code 에이전트 팀 vs SDK 비교

| 특성 | Claude Code 에이전트 팀 | Claude Agent SDK |
|-----|----------------------|-----------------|
| 오케스트레이션 | Claude가 자동 관리 | 개발자가 코드로 제어 |
| 팀메이트 통신 | 내장 메시징 시스템 | 직접 구현 필요 |
| UI | 터미널 분할 창 | 없음 (headless) |
| 사용 시나리오 | 대화형 개발 작업 | CI/CD, 자동화 파이프라인 |
| 유연성 | 제한적 | 완전 제어 |

---

## 8. 실전 적용 시나리오

### 시나리오 1: 새 Django 앱 풀스택 구현

**팀 구성**: 리드 + 팀메이트 4명

```
팀 리드 역할:
- 에픽 분해 → 태스크 리스트 생성
- 팀메이트 생성 및 할당
- 완료 검증 및 통합

팀메이트 구성:
- 모델 설계자: DB 스키마, 마이그레이션
- 뷰 구현자: Django FBV, URL 라우팅
- 템플릿 개발자: HTMX, 부분 템플릿
- 테스트 작성자: pytest, Factory Boy
```

**태스크 의존성**:
```
[모델 설계] → [뷰 구현] → [템플릿 개발] → [통합 테스트]
                              ↑
                         [테스트 픽스처 준비] (병렬)
```

**프롬프트 예시**:
```
SAAS-XX (고객 대시보드 기능) 에픽 구현을 위해 에이전트 팀을 생성하세요.

팀 구성:
- 모델 설계자: apps/dashboard/ 아래 모델 및 마이그레이션 담당
- 뷰 구현자: FBV 방식으로 뷰와 URL 구현
- 템플릿 개발자: HTMX 인터랙션 포함 템플릿 작성
- 테스터: TDD 방식으로 pytest 테스트 작성

각 팀메이트의 플랜을 먼저 승인받은 후 구현을 시작하세요.
```

### 시나리오 2: 병렬 코드 리뷰

```
PR #142 리뷰 요청
       │
       ▼
에이전트 팀 생성:
├── 보안 리뷰어: 입력 검증, SQL 인젝션, XSS 체크
├── 성능 리뷰어: N+1 쿼리, 인덱스, Celery 작업 최적화
└── 테스트 리뷰어: 커버리지, 엣지 케이스, Factory Boy 사용

각 리뷰어가 동시에 같은 PR을 다른 관점으로 분석
       │
       ▼
팀 리드가 3개 관점 통합 → 종합 리뷰 보고서
```

### 시나리오 3: 버그 경쟁 가설 디버깅

```
버그: "로그인 후 가끔 세션이 끊긴다"
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
가설 A    가설 B    가설 C
Redis    Django    JWT
세션     미들웨어   토큰 만료
만료     충돌      처리
    │        │        │
  각 팀메이트가 자신의 가설 검증
  서로의 이론을 반박하며 토론
    │
    ▼
가장 강한 증거를 가진 가설 채택
팀 리드가 수정사항 구현 지시
```

### 시나리오 4: 대규모 리팩토링 (Worktree 활용)

```
레거시 API 패턴 → 새 패턴으로 50개 파일 변환

에이전트 1 (worktree-a, 브랜치: sc/refactor-batch-1):
  apps/accounts/, apps/dashboard/

에이전트 2 (worktree-b, 브랜치: sc/refactor-batch-2):
  apps/payments/, apps/notifications/

에이전트 3 (worktree-c, 브랜치: sc/refactor-batch-3):
  apps/reports/, apps/admin/

병렬 실행 → 각 브랜치 PR 생성 → 순차 머지
```

---

## 9. 비용 및 효율 고려사항

### 9.1 토큰 비용

| 방식 | 상대적 비용 | 적합한 작업 |
|-----|-----------|-----------|
| 단일 에이전트 | 1x | 단순 작업 |
| 서브에이전트 (3개) | 2-3x | 집중 병렬 탐색 |
| 에이전트 팀 (3명) | 3-7x | 복잡한 협업 |
| 에이전트 팀 (6명) | 6-10x | 대규모 병렬 개발 |

### 9.2 의사결정 트리

```
작업이 컨텍스트 윈도우를 초과하는가?
├── 예 → 멀티 에이전트 필수
└── 아니오 ↓

작업이 독립적으로 병렬화 가능한가?
├── 아니오 → 단일 에이전트 사용
└── 예 ↓

팀메이트 간 직접 소통이 필요한가?
├── 아니오 → 서브에이전트 사용 (비용 절약)
└── 예 → 에이전트 팀 사용
```

### 9.3 모범 사례 요약

1. **작업 크기**: 팀메이트 1명당 5-6개 태스크가 최적
2. **팀 크기**: 3-5명으로 시작, 필요시 확장
3. **파일 소유권**: 팀메이트별 담당 파일 명확히 분리
4. **컨텍스트 제공**: CLAUDE.md가 자동 로딩됨 — 활용
5. **플랜 승인**: 복잡/위험한 작업은 구현 전 플랜 검토
6. **점진적 도입**: 리서치/리뷰부터 시작, 구현으로 확장
7. **모니터링**: 팀메이트 진행 상황 주기적 확인 및 방향 조정

---

## 참고 자료

- [Claude Code Agent Teams 공식 문서](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Anthropic: Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Addy Osmani: Claude Code Swarms](https://addyosmani.com/blog/claude-code-agent-teams/)
- [Git Worktrees for AI Coding](https://medium.com/@mabd.dev/git-worktrees-the-secret-weapon-for-running-multiple-ai-coding-agents-in-parallel-e9046451eb96)
- [Multi-Agent Development Architecture](https://www.sitepoint.com/multi-agent-ai-development-architecture/)
- [Google ADK Multi-Agent Patterns](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
