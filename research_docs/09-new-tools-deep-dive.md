# AI 개발 도구 심층 분석 — 2차 라운드

> 이전 라운드에서 다루지 않은 도구들: Amazon Kiro, Augment Code, Roo Code, Sourcegraph Cody, Sourcegraph Amp, OpenAI Codex CLI, Zed AI, JetBrains AI, Google Jules, Firebase Genkit

---

## 1. Amazon Kiro (2025)

### 개요

Kiro는 Amazon이 2025년 프리뷰로 공개한 VS Code 포크 기반의 에이전틱 IDE다. "spec-driven development"를 핵심 철학으로 하며, "바이브 코딩(Vibe Coding)"의 단점—모호한 결과, 유지보수 어려움—을 극복하기 위해 설계되었다.

### Spec-Driven 워크플로우

개발자가 자연어로 원하는 기능을 설명하면 Kiro는 세 단계의 문서를 자동 생성한다:

```
1. Requirements (요구사항)
   ↓ EARS (Easy Approach to Requirements Syntax) 방식
   → 사용자 스토리 형태: "users can submit a review"

2. Design (설계)
   → UML/Mermaid 다이어그램
   → API 명세
   → DB 스키마

3. Tasks (구현 작업 목록)
   → 각 태스크가 요구사항/설계 항목에 연결
   → 의존성 순서로 시퀀싱
```

코드를 바로 생성하는 것이 아니라, **개발자가 검토·수정할 수 있는 명세를 먼저 만들고 나서** 구현을 시작한다는 점이 핵심 차별점이다.

### .kiro/ 디렉토리 구조

```
.kiro/
├── steering/          # 프로젝트 수준 스티어링 파일
│   ├── tech-stack.md
│   ├── code-style.md
│   └── api-conventions.md
├── hooks/             # 이벤트 트리거 자동화
│   └── auto-test.json
└── specs/             # 기능별 명세 문서
    └── feature-name/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

전역 스티어링은 `~/.kiro/steering/`에 저장되어 모든 워크스페이스에 적용된다.

### Steering 파일 예시

```markdown
---
inclusion: always
---

# 기술 스택
- Framework: Django 5.x with Python 3.12
- Frontend: HTMX + Alpine.js (no React/Vue)
- DB: PostgreSQL with pgvector

# 코딩 컨벤션
- 뷰: Function-Based Views 우선
- ORM: select_related()/prefetch_related() 필수
- 타입 힌트: 모든 함수에 required
```

YAML front matter의 `inclusion` 옵션:
- `always`: 매 요청에 자동 포함
- `conditional`: 특정 파일 패턴이 관련될 때
- `manual`: 명시적으로 참조할 때만

### Agent Hooks 시스템

Hooks = 파일 이벤트에 반응하는 자동화된 에이전트 프롬프트.

```json
{
  "name": "Update tests on component save",
  "trigger": {
    "type": "fileEdited",
    "patterns": ["src/components/**/*.tsx"]
  },
  "action": {
    "prompt": "The component was updated. Review the related test file and update it to match the new interface."
  }
}
```

실용적 사용 예:
- React 컴포넌트 저장 → 테스트 파일 자동 업데이트
- API 엔드포인트 수정 → README 자동 갱신
- 커밋 전 → 시크릿 키 노출 여부 스캔

### 장단점

| 장점 | 단점 |
|------|------|
| 코드 전에 명세 → 의도 일치율 높음 | 단순 수정 작업엔 오버헤드 |
| Hooks로 루틴 작업 자동화 | 프리뷰 단계 — 안정성 미검증 |
| Steering으로 컨텍스트 반복 불필요 | AWS 생태계 Lock-in 우려 |
| MCP 서버 통합 지원 | VS Code 포크 — 기존 Cursor 사용자와 겹침 |

### 워크플로우 아이디어 (참고 가능)

> **명세 먼저, 코드 나중** 패턴을 Claude Code에 적용: 복잡한 기능은 먼저 `docs/plan/feature-spec.md`에 requirements → design → tasks를 작성하고 구현에 들어가는 습관.

---

## 2. Augment Code

### 개요

대규모 코드베이스 특화 AI 코딩 어시스턴트. VS Code, JetBrains IDE 플러그인으로 제공되며, Context Engine이 핵심 기술이다.

### Context Engine — 작동 원리

```
전체 코드베이스 수집
         ↓
시맨틱 임베딩 생성
(커스텀 모델, 단순 텍스트 검색 X)
         ↓
의존성 관계 매핑
(서비스 경계, 아키텍처 패턴 이해)
         ↓
밀리초 단위 실시간 동기화
(코드 변경 즉시 반영)
```

- 400,000+ 파일 코드베이스 처리
- SWE-bench 정확도 70.6% (파일 제한 경쟁사 56% 대비)
- 200,000 토큰 컨텍스트 윈도우

### 멀티 리포 지원

- 모노레포와 멀티 리포 모두 네이티브 지원
- GitHub, Jira, Notion 등 외부 도구 컨텍스트 통합
- Elasticsearch 3.6M 라인(Java) 블라인드 테스트에서 경쟁사 대비 정확도 +14.8, 완성도 +18.2

### Context Engine MCP (2025 신기능)

Context Engine을 MCP 서버로 분리하여 Claude Code, Cursor, Zed 등 **다른 도구에서도 활용 가능**하게 만들었다.

```
Claude Code / Cursor / Zed
         ↓ MCP 연결
Augment Context Engine
         ↓
전체 코드베이스 의미론적 검색
```

도구와 무관하게 컨텍스트 품질 30~80% 향상 보고.

### 가격 (2025 기준)

| 플랜 | 가격 | 대상 |
|------|------|------|
| Indie | $20/월 | 개인 개발자 |
| Team | $50/인/월 | 팀 (연 결제 시 할인) |
| Enterprise | 협의 | 대기업, 자체 호스팅 |

크레딧 기반 사용량 측정: Context Engine 쿼리당 40~70 크레딧.

### 차별점 요약

- **Cursor**: 파일 제한 있음, 검색 기반
- **Augment**: 전체 코드베이스 인덱싱, 의존성 이해, 실시간 동기화

### 워크플로우 아이디어

> Context Engine MCP를 Claude Code에 연결하면 대규모 Django 프로젝트에서도 ORM 관계, URL 패턴, 뷰 의존성을 빠르게 파악할 수 있다.

---

## 3. Roo Code (구 Roo Cline)

### 개요

VS Code 확장으로 제공되는 오픈소스 AI 코딩 에이전트. Cline 포크에서 출발했으며, 커스텀 모드 시스템과 Boomerang 오케스트레이션이 핵심 특징이다.

### 커스텀 모드 시스템

모드(Mode)는 AI의 역할과 접근 가능한 파일/도구 권한을 정의한다.

#### .roomodes 파일 구조 (YAML)

```yaml
customModes:
  - slug: django-dev
    name: 🐍 Django Developer
    description: Django 개발 전문 모드 — 뷰, 모델, 마이그레이션 담당
    roleDefinition: |
      You are an expert Django developer. You follow:
      - Function-Based Views
      - Fat models / thin views pattern
      - select_related()/prefetch_related() for ORM optimization
      - Always write tests with Factory Boy
    whenToUse: Use when working on Django models, views, URL patterns, or migrations
    groups:
      - read
      - edit
      - command
    customInstructions: |
      Always check existing patterns before creating new ones.
      Never use Any types.

  - slug: test-writer
    name: 🧪 Test Writer
    description: 테스트 작성 전담 모드
    roleDefinition: You are a TDD expert focused on writing pytest tests.
    whenToUse: Use when writing new tests or improving test coverage
    groups:
      - read
      - edit
    fileRestrictions:
      - allowedGlobs: ["tests/**/*.py", "conftest.py"]
```

#### JSON 형식 (레거시)

```json
{
  "customModes": [
    {
      "slug": "security-reviewer",
      "name": "🔒 Security Reviewer",
      "roleDefinition": "You are a security expert reviewing code for vulnerabilities.",
      "groups": ["read"],
      "customInstructions": "Focus on OWASP Top 10. Never write code, only review."
    }
  ]
}
```

파일 위치:
- 프로젝트별: `{project-root}/.roomodes`
- 전역: VS Code 설정 내 저장

### Boomerang 오케스트레이션

"부메랑"이란 이름처럼 — 태스크를 서브에이전트에 던지고(delegate), 완료 후 결과를 받아온다(return).

```
오케스트레이터 모드 (Orchestrator)
         ↓ new_task 명령
┌─────────────────────────────────┐
│  서브태스크 A: Django 모델 설계   │ ← django-dev 모드
│  서브태스크 B: 테스트 작성        │ ← test-writer 모드
│  서브태스크 C: 보안 리뷰          │ ← security-reviewer 모드
└─────────────────────────────────┘
         ↓ 결과 취합
오케스트레이터: 최종 통합
```

핵심 특징:
- 각 서브태스크는 **독립적인 컨텍스트 창** 사용 (부모 히스토리 상속 X)
- 정보는 서브태스크 초기 지시사항에 명시적으로 전달
- `whenToUse` 필드로 오케스트레이터가 올바른 모드 자동 선택

### SPARC 프레임워크와 통합

Boomerang + SPARC(Specification, Pseudocode, Architecture, Refinement, Completion):

```
Specification 모드 → 요구사항 분석
      ↓
Pseudocode 모드 → 알고리즘 설계
      ↓
Architecture 모드 → 구조 설계
      ↓
Refinement 모드 → 코드 구현 (django-dev 모드 등)
      ↓
Completion 모드 → 테스트 + 문서화
```

### MCP 서버 통합

각 모드에서 특정 MCP 서버만 활성화:

```yaml
- slug: database-admin
  name: 🗄️ DB Admin
  mcpServers:
    - postgres-mcp
    - redis-mcp
  groups:
    - read
```

### 워크플로우 아이디어

> **모드별 권한 분리**: 보안 리뷰 모드는 read-only, 구현 모드만 edit 권한 → 실수로 코드를 덮어쓰는 사고 방지. Django 프로젝트에서 migration 전담 모드를 만들어 다른 파일 건드리지 못하게 격리 가능.

---

## 4. Sourcegraph Cody

### 개요

Sourcegraph의 코드 검색 플랫폼과 AI를 결합한 코딩 어시스턴트. VS Code, JetBrains, Visual Studio 지원.

### 컨텍스트 수집 아키텍처

Cody는 임베딩 기반에서 Sourcegraph 네이티브 검색으로 전환했다.

```
로컬 컨텍스트
(현재 파일, 열린 탭)
       +
Sourcegraph Remote Search
(전체 코드베이스 심볼 검색, 레퍼런스 검색)
       +
RSG (Repo-level Semantic Graph)
(리포 전체의 전역 컨텍스트 캡슐화)
       ↓
LLM으로 통합 제공
```

Cody Enterprise의 임베딩 제거 이점:
- 코드를 임베딩 프로세서로 전송 불필요 → 보안 강화
- 추가 설정 제로
- 대규모 코드베이스 즉시 확장

### 멀티 리포 컨텍스트

```
현재 리포 (A)
       ↓
Cody가 참조:
  → 리포 B의 공유 라이브러리
  → 리포 C의 API 명세
  → 리포 D의 인증 모듈
```

엔터프라이즈 환경에서 마이크로서비스 전체를 이해하며 응답.

### 엔터프라이즈 보안 기능

| 기능 | 설명 |
|------|------|
| Zero code retention | 코드가 외부에 저장되지 않음 |
| SOC 2/GDPR/CCPA | 컴플라이언스 인증 |
| SSO/SAML | 기업 인증 통합 |
| Self-hosted | 온프레미스 배포 |
| BYOK | 직접 LLM 키 사용 |
| Audit logs | 모든 AI 요청 로깅 |

### Cody vs Cursor 주요 차이

| | Cody | Cursor |
|--|------|--------|
| 코드 검색 | Sourcegraph 네이티브 | 없음 (파일 인덱싱) |
| 멀티 리포 | 엔터프라이즈 지원 | 제한적 |
| 타겟 | 대기업, 모노레포 | 개인/스타트업 |
| 가격 | 무료 플랜 + 엔터프라이즈 협의 | $20/월 |

---

## 5. Sourcegraph Amp

### 개요

2025년 5월 Sourcegraph가 발표한 독립적인 AI 코딩 에이전트. Cody의 채팅 어시스턴트와 달리 **자율적인 태스크 실행**에 초점.

### Cody와의 차이점

| | Cody | Amp |
|--|------|-----|
| 형태 | IDE 채팅 어시스턴트 | 자율 에이전트 |
| 실행 | 수동 요청-응답 | 태스크 위임 후 자율 완료 |
| 병렬성 | 없음 | 멀티에이전트 병렬 실행 |
| 인터페이스 | IDE 패널 | 별도 UI + IDE 통합 |

### 멀티에이전트 병렬 실행

```
메인 스레드 (오케스트레이터)
         ↓
┌────────────────────────────────┐
│ 서브에이전트 1: 코드 변경 작업   │
│ 서브에이전트 2: 테스트 업데이트   │
│ 서브에이전트 3: 문서 생성        │
│ 서브에이전트 4: 보안 스캔         │
└────────────────────────────────┘
         ↓ 결과 통합
메인 스레드: 최종 확인
```

- 최대 4개 스레드 동시 병렬 실행
- 각 서브에이전트는 독립 컨텍스트 창
- 태스크 완료 후 메인으로 결과 보고

### 스레드 기반 아키텍처

```bash
# Amp CLI 사용 예
amp thread create "SAAS-50: 결제 모듈 구현"

# 병렬 서브태스크 생성
amp thread spawn --parent main "모델 작성"
amp thread spawn --parent main "뷰 작성"
amp thread spawn --parent main "테스트 작성"

# 결과 확인
amp thread status
```

### 워크플로우 아이디어

> 큰 기능 구현 시 Amp의 병렬 스레드 패턴 참고: 모델 설계 에이전트, 뷰 구현 에이전트, 테스트 작성 에이전트를 동시에 실행하고 마지막에 통합. Claude Code의 `Agent` 도구와 유사한 접근.

---

## 6. OpenAI Codex CLI

### 개요

2025년 4월 오픈소스로 공개된 OpenAI의 터미널 기반 AI 에이전트. Claude Code와 직접 경쟁하는 CLI 도구.

### 샌드박스 기반 실행 환경

Codex CLI의 가장 독특한 특징은 **네트워크 비활성화 샌드박스**:

```
macOS: Seatbelt (App Sandbox)
Linux: seccomp + Landlock
         ↓
네트워크 완전 차단 기본값
(의도치 않은 외부 API 호출 방지)
```

- Rust로 재작성 중 (기존 Node.js/TypeScript → Rust)
- 메모리 안전성 + 추가 보안 강화
- macOS, Linux 네이티브 샌드박스 활용

### Claude Code와의 상세 비교

| | OpenAI Codex CLI | Claude Code |
|--|-----------------|-------------|
| 모델 | GPT-4o / o3 | Claude Sonnet/Opus |
| 실행 방식 | 샌드박스 (네트워크 차단) | 로컬 (Docker 격리 옵션) |
| 인터렉션 | 자율 실행 → 결과 제시 | 인터랙티브 (판단 포인트) |
| 오픈소스 | Yes (Rust) | No |
| SWE-bench | 69.1% | 72.7% |
| 비용 | API 사용료 기반 | $20/월 (Pro) |
| 멀티에이전트 | 제한적 | Agent 도구 지원 |

### 실제 사용 후기 요약

**장점:**
- 네트워크 격리로 보안 사고 방지
- 오픈소스 — 커스터마이징 가능
- 가벼운 설치 (단일 바이너리 예정)

**단점:**
- Claude Code 대비 성능 열세
- 인터랙티브 판단 포인트 부족
- 에이전트 오케스트레이션 미흡

### 워크플로우 아이디어

> 샌드박스 격리 기본값 패턴: 신뢰할 수 없는 코드베이스 탐색이나 CI 환경에서 유용. Claude Code도 Docker 샌드박스 + 네트워크 제한 조합으로 유사 환경 구성 가능.

---

## 7. Zed AI

### 개요

Rust로 작성된 고성능 텍스트 에디터. GPU 가속 + CRDT 기반 실시간 협업이 원래 강점이었으나, 2025년 AI 네이티브 IDE로 방향 전환.

### AI 네이티브 아키텍처

```
Zed 에디터 (Rust, GPU 가속)
         ↓
AI 기능 레이어:
  ├── Assistant Panel (채팅)
  ├── Inline Transformations (인라인 편집)
  ├── Edit Prediction (Zeta 로컬 모델)
  └── Agentic Editing (파일 단위 에이전트)
```

### 핵심 AI 기능

**Edit Prediction (Zeta 모델)**
- 로컬 실행 (무료, 베타)
- 다음 토큰이 아닌 **다음 편집** 예측
- Tab으로 멀티라인 변경 수용

**Inline Transformations**
- `Ctrl+Enter`로 활성화
- 커스텀 스트리밍 diff 프로토콜
- 모델이 스트리밍하는 즉시 diff 표시 → 실시간 검토 가능

**Agentic Editing**
- 자연어로 변경 사항 기술
- AI가 파일 패치 → diff 표시 → 사용자 승인 요청

### 주요 차별점

| | Zed | Cursor |
|--|-----|--------|
| 성능 | GPU 가속, Rust | Electron 기반 |
| 협업 | CRDT 네이티브 실시간 | 제한적 |
| AI 모델 | Claude (기본) + BYOM | GPT/Claude 선택 |
| 로컬 모델 | Zeta (무료, 오프라인) | Ollama 통합 |
| ACP 에이전트 | 지원 | 없음 |

### JetBrains × Zed 협력 (2025.10)

JetBrains와 Zed가 오픈 인터오퍼러빌리티 발표:
- AI 코딩 에이전트가 IDE 간 이동 가능
- 표준 프로토콜로 Zed 에이전트 ↔ IntelliJ 연동

---

## 8. JetBrains AI Assistant

### 개요

IntelliJ IDEA, PyCharm, WebStorm 등 JetBrains IDE에 기본 내장된 AI 어시스턴트. IDE 네이티브 통합이 가장 큰 강점.

### IDE 네이티브 통합의 강점

다른 도구들이 IDE 위에 레이어를 얹는 방식과 달리, JetBrains AI는 IDE의 PSI(Program Structure Interface)를 직접 활용:

```
일반 AI 도구:       JetBrains AI:
텍스트 이해          PSI 트리 이해
(파일 내용 파싱)     (실제 코드 구조)
       ↓                    ↓
추론               타입 정보, 참조, 의존성
                  IDE가 이미 알고 있는 것
```

### 2025 주요 업데이트

**멀티파일 편집 + RAG**
- 채팅에서 프로젝트 전체 파일 수정 제안
- RAG로 관련 파일 자동 탐색

**`/web` 명령어**
- 채팅 내에서 외부 문서 직접 검색
- 최신 라이브러리 문서, 트러블슈팅 가이드 실시간 참조

**이미지 첨부**
- 스크린샷 붙여넣기 → 에러 분석
- 아키텍처 다이어그램 → 클래스 생성
- (Anthropic, OpenAI 모델 사용 시)

**로컬 모델 지원**
- Qwen2.5-Coder, DeepSeek-Coder 1.3B, CodeStral
- 오프라인 환경, 보안 요구사항 높은 환경에 적합

### 가격

| 플랜 | 가격 |
|------|------|
| Free | 제한된 기능 (2025 신설) |
| AI Pro | $8.33/월 (All Products Pack 포함 시) |
| 개인 구매 | $10/월 |

### 워크플로우 아이디어

> PSI 기반 정확한 리팩토링: "이 메서드의 모든 호출부를 찾아 시그니처 변경" — IDE가 이미 알고 있는 구조 정보를 활용하므로 일반 AI보다 정확.

---

## 9. Google Jules

### 개요

Google Labs가 2024년 12월 발표, 2025년 5월 Google I/O에서 퍼블릭 베타, 2025년 9월 정식 출시. GitHub 통합 **비동기 AI 코딩 에이전트**.

### 비동기 모델 — 핵심 차별점

Jules는 동기식(사용자 대기)이 아닌 **비동기 방식**으로 동작:

```
개발자 (GitHub에서)
    ↓ 태스크 할당 (이슈 or PR 코멘트)
Jules가 Google Cloud VM에서:
    ├── 전체 코드베이스 클론
    ├── 프로젝트 구조 분석
    ├── 코드 변경 실행
    └── PR 생성 → GitHub에 제출
개발자
    ↓ PR 리뷰 (비동기로 돌아와서)
    ↑ 승인 or 피드백
```

개발자가 기다리지 않고 **다른 작업 진행 가능**.

### 실행 환경

- Google Cloud VM에서 안전하게 실행
- Gemini 2.5 Pro 기반
- 전체 리포 클론 후 풀 컨텍스트로 작업
- 복잡한 멀티파일 변경 처리

### 사용량 제한 (2025 기준)

- 무료 사용 가능 (베타)
- 일일 최대 60 태스크
- 동시 실행 최대 5개

### 적합한 사용 사례

| 사례 | 설명 |
|------|------|
| 버그 수정 | 이슈 등록 → Jules PR 생성 → 리뷰 |
| 테스트 추가 | "이 모듈에 테스트 추가해줘" |
| 의존성 업데이트 | 라이브러리 버전업 + 호환성 수정 |
| 문서화 | 코드 변경 후 README/docstring 업데이트 |
| 기술 부채 | 린트 오류 일괄 수정 |

---

## 10. Firebase Genkit

### 개요

Firebase (Google)의 AI 앱 개발 오픈소스 프레임워크. Jules가 에이전트라면 Genkit은 **에이전트를 직접 만들기 위한 SDK**.

### 주요 특징

```
Genkit
├── 통합 API (모델 제공자 추상화)
│   ├── Gemini
│   ├── Claude
│   ├── GPT
│   └── 로컬 모델 (Ollama)
├── Flow (워크플로우 정의)
├── Plugin 시스템
│   ├── Firebase 플러그인
│   ├── Google AI 플러그인
│   └── Vector DB 플러그인
└── 개발 도구 (로컬 UI)
```

### 지원 언어

- JavaScript/TypeScript (주력)
- Go
- Python (알파)

### Genkit Flow 예시

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({ plugins: [googleAI()] });

// Flow 정의 — 재실행 가능, 관찰 가능
const reviewCodeFlow = ai.defineFlow('reviewCode', async (input) => {
  const analysis = await ai.generate({
    model: 'gemini-2.0-flash',
    prompt: `Review this code for security issues: ${input.code}`,
  });

  return { review: analysis.text };
});
```

### Jules vs Genkit

| | Jules | Genkit |
|--|-------|--------|
| 역할 | 사용 준비된 비동기 에이전트 | 에이전트 빌딩 프레임워크 |
| 대상 | 개발자 (GitHub 워크플로우) | AI 앱 개발자 |
| 커스터마이징 | 제한적 | 완전 커스터마이징 |
| 호스팅 | Google Cloud | 어디서나 |

---

## 종합 비교 및 워크플로우 인사이트

### 도구별 포지셔닝 맵

```
            [개인 개발자]
                 │
    Roo Code ────┤──── Zed AI
    (커스텀 모드) │    (고성능 에디터)
                 │
OpenAI Codex ───┤──── Claude Code
    (오픈소스CLI) │    (인터랙티브 CLI)
                 │
─────────────────┼─────────────────
                 │
  Augment Code ──┤──── JetBrains AI
   (대규모코드) │    (IDE 네이티브)
                 │
  Sourcegraph ───┤──── Amazon Kiro
   Cody/Amp      │    (Spec-Driven)
            [엔터프라이즈]

수직축: 개인 ↕ 엔터프라이즈
수평축: 경량 ↔ 풀 IDE
```

### 핵심 워크플로우 아이디어 요약

| 아이디어 | 출처 | 적용 방법 |
|---------|------|----------|
| **명세 먼저** | Kiro | 복잡한 기능은 `docs/plan/` 에 requirements → design → tasks 먼저 작성 |
| **이벤트 기반 자동화** | Kiro Hooks | 파일 저장 시 테스트 자동 업데이트 규칙 설정 |
| **모드별 권한 격리** | Roo Code | 역할별 Claude 에이전트에 read-only/edit 권한 분리 |
| **병렬 서브에이전트** | Amp | 모델 / 뷰 / 테스트를 별도 에이전트가 동시 작업 |
| **비동기 위임** | Jules | 단순 반복 작업(테스트 추가, 린트 수정)은 Jules처럼 위임 후 PR 리뷰 |
| **컨텍스트 엔진 MCP** | Augment | 전체 코드베이스 인덱싱을 MCP로 Claude Code에 연결 |
| **샌드박스 격리** | Codex CLI | 신뢰 불명 코드 탐색 시 Docker + 네트워크 차단 |

---

*작성일: 2026-03-04*
*참고 출처: kiro.dev, docs.roocode.com, augmentcode.com, sourcegraph.com, ampcode.com, jules.google.com, zed.dev, jetbrains.com/ai-assistant*
