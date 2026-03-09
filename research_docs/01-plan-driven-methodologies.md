# 플랜 주도 AI 개발 방법론 연구

> 작성일: 2026-03-04
> 목적: AI 코딩 워크플로우에서 계획 선행(Plan-First) 방법론 종합 조사

---

## 목차

1. [PDCA 사이클 기반 AI 개발](#1-pdca-사이클-기반-ai-개발)
2. [사양 주도 개발 (Spec-Driven Development)](#2-사양-주도-개발-spec-driven-development)
3. [디자인 문서 우선 방식 (Design-Docs-First)](#3-디자인-문서-우선-방식-design-docs-first)
4. [Plan → Implement → Review 사이클](#4-plan--implement--review-사이클)
5. [프롬프트 주도 개발 (Prompt-Driven Development)](#5-프롬프트-주도-개발-prompt-driven-development)
6. [방법론 비교 요약](#6-방법론-비교-요약)
7. [실전 권장 워크플로우](#7-실전-권장-워크플로우)

---

## 1. PDCA 사이클 기반 AI 개발

### 핵심 개념

PDCA(Plan-Do-Check-Act)는 원래 품질 관리 방법론이지만, AI 코딩 도구의 품질 문제를 해결하기 위한 구조적 프레임워크로 재해석되고 있다.

**배경**: Google DORA 2024 보고서에 따르면 AI 도구 도입 25% 증가마다 배포 안정성이 7.2% 감소한다. GitClear의 분석에서는 2024년 코드 중복이 10배 증가(2020년 0.70% → 2024년 6.66%)하는 문제가 확인됐다. PDCA는 이런 "AI 코드 부채" 문제에 대응하는 방법론이다.

### 4단계 워크플로우

```
Plan (7-15분)
  ↓ 코드베이스 전체 분석 → 아키텍처 드리프트 방지 → 실행 전략 + 체크포인트 수립
Do (구현)
  ↓ TDD 방식: 실패 테스트 먼저 → 프로덕션 코드 구현 → 단계별 투명성 유지
Check (검토)
  ↓ 모든 목표 달성 여부 확인 → 테스트 통과 → 문서 완비 → 회귀 없음 확인
Act (회고)
  ↓ 효과적인 패턴 식별 → 프롬프트 개선 → 다음 세션 최적화
```

전체 사이클은 **1~3시간** 내에 완료하는 것이 이상적.

### bkit: PDCA 자동화 플러그인

**bkit**(Vibecoding Kit)은 Claude Code용 PDCA 플러그인으로, 체계적인 AI 주도 개발을 지원한다.

- **9단계 개발 파이프라인** 자동화
- **11개 특화 AI 에이전트** 운용 (리뷰, 문서화 등)
- 프로젝트 복잡도(Starter / Dynamic / Enterprise) 자동 감지
- DRY, SRP 등 코드 품질 기준 자동 강제
- 계층적 프로젝트 규칙(rules) 관리

### 측정 지표

PDCA를 실무에 적용할 때 GitHub Actions로 추적하는 품질 지표:

| 지표 | 목표값 |
|------|--------|
| 대형 커밋 비율 | < 20% |
| 테스트 우선 작성 비율 | > 50% |
| 커밋당 평균 변경 파일 수 | < 5 |

### 효과

InfoQ 사례 연구에서 비구조적 방식 대비 PDCA 방식의 결과:
- 프로덕션 코드 라인 감소: 534 → 350
- 테스트 코드 증가: 759 → 984줄
- 구현 후 트러블슈팅 감소 (초기 토큰 비용 증가 감수)

### 참고 자료
- [A Plan-Do-Check-Act Framework for AI Code Generation - InfoQ](https://www.infoq.com/articles/PDCA-AI-code-generation/)
- [Reducing AI code debt: A human-supervised PDCA framework - Agile Alliance](https://agilealliance.org/reducing-ai-code-debt/)
- [bkit PDCA Workflow Skill - MCP Market](https://mcpmarket.com/ko/tools/skills/bkit-core-rules-pdca-workflow)

---

## 2. 사양 주도 개발 (Spec-Driven Development)

### 핵심 개념

**SDD(Spec-Driven Development)**는 AI 코딩 에이전트에게 코드 생성을 요청하기 전에 구조화된 사양(Specification)을 먼저 작성하는 개발 패러다임.

> "바이브 코딩(vibe-coding)은 빠른 프로토타입에는 좋지만, 진지한 프로덕션 앱에는 신뢰성이 떨어진다. 문제는 코딩 에이전트의 코딩 능력이 아니라 우리의 접근 방식이다."

사양은 AI와 인간 모두의 **단일 진실 원천(source of truth)**이 된다.

### 사양의 3가지 활용 수준

| 수준 | 설명 |
|------|------|
| **Spec-first** | 작업 초반에 사양 작성, 완료 후 폐기 |
| **Spec-anchored** | 사양을 유지·발전시키며 피처와 함께 진화 |
| **Spec-as-source** | 사양이 주요 편집 대상, 코드는 자동 생성 (`// GENERATED FROM SPEC - DO NOT EDIT`) |

### 주요 도구 비교

#### Amazon Kiro (사양 주도 IDE)
- VS Code 기반의 AI 코딩 도구로 SDD를 네이티브로 지원
- **사양 워크플로우**: 요구사항 → 설계 → 태스크
  - GIVEN...WHEN...THEN 형식의 인수 기준(acceptance criteria) 포함
  - 자동으로 사용자 스토리 + 기술 설계 문서 + 태스크 목록 생성
- **Steering 파일** (`/.kiro/steering/`): 프로젝트 전체에 적용되는 지속 지식
  - `product.md`: 제품 컨텍스트
  - `tech.md`: 기술 스택 및 패턴
  - `structure.md`: 코드 구조
- **Hooks**: 파일 변경 시 자동 실행되는 에이전트 액션 (예: 코드 변경 시 자동 문서 업데이트)

#### GitHub Spec-Kit (오픈소스 CLI)
- **워크플로우**: Constitution → Specify → Plan → Tasks (순환)
- **Constitution**: 모든 변경에 적용되는 불변 아키텍처 원칙
- 명확화 체크리스트 및 위반 사항 추적 파일 생성

#### Tessl (프라이빗 베타)
- 사양과 코드 파일 간 1:1 매핑 구조
- `@generate`, `@test` 태그로 코드 생성 방향 지정
- 진정한 Spec-as-source 접근 방식 추구

### PRD와 사양의 차이

- **PRD**: 구현 가이드가 아닌 아이디어의 구조화 문서
- **사양**: PRD보다 기술적으로 더 구체적 (명시적 기술 제약, 인수 기준 포함)
- AI가 PRD를 읽고 사양을 생성할 수 있음

### 워크플로우 패턴

```
아이디어 → PRD 작성 (AI 협업) → 사양 작성 (기술 제약 명시)
        → AI가 사양 검토/보완 → 구현 계획 생성 → 코드 생성
        → 인수 기준 검증 → 완료
```

### 참고 자료
- [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl - Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Spec-driven development with AI - GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Beyond Vibe Coding: Amazon Introduces Kiro - InfoQ](https://www.infoq.com/news/2025/08/aws-kiro-spec-driven-agent/)
- [How to Write a Good Spec for AI Agents - Addy Osmani](https://addyosmani.com/blog/good-spec/)

---

## 3. 디자인 문서 우선 방식 (Design-Docs-First)

### 핵심 개념

코딩을 시작하기 전에 아키텍처 결정을 문서화하는 방식. ADR(Architecture Decision Record)이 대표적인 형식.

### ADR (Architecture Decision Record)

**ADR의 목적**: "왜 이렇게 결정했는가"를 미래의 팀원(혹은 AI)이 이해할 수 있도록 기록.

#### 최소 ADR 구조 (Michael Nygard 프레임워크)
```markdown
# ADR-001: [결정 제목]

## 컨텍스트 (Context)
어떤 상황에서 이 결정이 필요했는가

## 결정 (Decision)
어떤 방향으로 결정했는가

## 결과 (Consequences)
이 결정의 장단점 및 트레이드오프
```

#### 확장 구조 (클라우드 프로젝트용)
```markdown
# ADR-001: [결정 제목]

## 상태 (Status): [제안/승인/폐기]
## 컨텍스트
## 옵션 (대안 탐색)
## 결정
## 결과
## 컴플라이언스 요구사항 (해당 시)
```

### AI + ADR 워크플로우

LLM을 활용한 ADR 자동화:
- **작성 에이전트**: 코드베이스 분석 후 ADR 초안 생성
- **검증 에이전트**: 결정의 일관성 및 완성도 검증
- **포매팅 에이전트**: 표준 형식으로 변환

> "실제 강점은 에이전트들의 협업에서 나온다 — 책임을 연결하고(작성자 → 검증자 → 포매터) 도구에 접근 권한을 부여함으로써 수작업으로는 번거로운 워크플로우를 조율할 수 있다."

### Design-First와 ADR 통합

```
1. 피처 요청 수신
2. 대안 옵션 탐색 (Design Doc 작성)
3. 트레이드오프 분석
4. ADR에 최종 결정 기록
5. AI가 ADR을 컨텍스트로 구현 시작
```

**핵심 원칙**: 설계(Design)와 결정(Decision)을 분리한다. 설계 문서에서 대안을 충분히 탐색한 후, ADR에 최종 결정을 기록.

### AI 개발에서의 실용적 가치

- AI가 "왜 이렇게 구현됐는가"를 이해하고, 기존 결정을 존중하며 코드를 생성
- 아키텍처 드리프트 방지 (AI가 임의로 패턴을 바꾸는 것 방지)
- 팀 내 일관성 유지

### 참고 자료
- [Documenting Architecture Decisions - Cognitect](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR process - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html)
- [Building an Architecture Decision Record Writer Agent - Medium](https://piethein.medium.com/building-an-architecture-decision-record-writer-agent-a74f8f739271)

---

## 4. Plan → Implement → Review 사이클

### Claude Code Plan Mode

**Plan Mode**는 Claude Code가 파일 수정 없이 분석과 계획만 수행하는 읽기 전용 모드.

> "코드 작성 전에 작성된 계획을 검토하고 승인할 때까지 Claude가 코드를 작성하지 못하게 한다."

#### 활성화 방법
```bash
Shift+Tab (두 번)          # 모드 전환
claude --permission-mode plan  # 플랜 모드로 시작
/plan                          # 프롬프트에서 직접 입력
```

#### 4단계 워크플로우
```
1. Explore (Plan Mode)
   └─ 관련 코드 읽기 및 이해

2. Plan (Plan Mode)
   └─ 상세 구현 전략 생성 (docs/plan/*.md 파일로 저장)
   └─ 개발자가 인라인 노트 추가하며 계획 정제 (1-6회 반복)

3. Implement (Normal Mode / Auto-Accept)
   └─ 승인된 계획 실행
   └─ 단계별 진행 체크리스트 업데이트

4. Commit (Normal Mode)
   └─ 변경 사항 커밋 + PR 초안 작성
```

#### "한 문장 규칙"
변경 사항을 한 문장으로 설명할 수 없다면 Plan Mode를 사용하라:
- 3개 이상 파일 수정
- 아키텍처 결정 필요
- 익숙하지 않은 코드베이스

### Research-Plan-Implement 프레임워크

Claude Code용 오픈소스 구조적 워크플로우 ([GitHub](https://github.com/brilliantconsultingdev/claude-research-plan-implement)):

```
1. Research Codebase  → 병렬 에이전트로 코드베이스 분석
2. Create Plan        → 단계별 구현 전략 생성
3. Validate Plan      → 성공 기준 대비 계획 검증
4. Implement Plan     → 단계별 체계적 구현
5. Save Progress      → 세션 지속성을 위한 문서화
6. Resume Work        → 이전 세션 컨텍스트 복원
7. Research Cloud     → 클라우드 인프라 분석 (읽기 전용)
8. Define Test Cases  → DSL 패턴으로 인수 테스트 정의
```

**`thoughts/` 디렉토리**에 연구 결과, 계획, 세션 기록을 영구 보존.

### PRD → Plan → Todo 워크플로우

```
Phase 1: 요구사항 분석
  프롬프트: "코드 작성 전에 PRD를 검토하고 요구사항 요약,
            모호한 부분, 기술 결정, 아키텍처 제안을 알려줘"

Phase 2: 구조화된 계획 생성
  프롬프트: "다음을 포함한 상세 구현 계획을 작성해:
            - 생성/수정할 파일 목록
            - 단계별 구체적 변경사항
            - 단계 간 의존성
            - 복잡도 추정 (소/중/대)"
  → plans/feature.md 로 버전 관리에 저장

Phase 3: 태스크 추적으로 실행
  - 번호가 매겨진 태스크 생성
  - 순차적 구현
  - 주요 단계 후 승인 대기
```

### 참고 자료
- [Plan Mode in Claude Code - codewithmukesh](https://codewithmukesh.com/blog/plan-mode-claude-code/)
- [PRD to Plan to Todo Workflow - Developer Toolkit](https://developertoolkit.ai/en/claude-code/quick-start/prd-workflow/)
- [Research-Plan-Implement Framework - GitHub](https://github.com/brilliantconsultingdev/claude-research-plan-implement)
- [What Actually Is Claude Code's Plan Mode? - Armin Ronacher](https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/)

---

## 5. 프롬프트 주도 개발 (Prompt-Driven Development)

### 핵심 개념

규칙 파일(Rules Files), 설정 파일을 통해 AI 에이전트의 행동을 프로젝트 수준에서 제어하는 방식. 코딩 표준, 아키텍처 결정, 선호 라이브러리 등을 한 번 정의하면 모든 세션에 자동 적용.

### 도구별 설정 파일

| 도구 | 파일 위치 | 특징 |
|------|-----------|------|
| **Claude Code** | `CLAUDE.md` (프로젝트 루트) | 세션마다 자동 로딩 |
| **Cursor** | `.cursor/rules/*.mdc` | 과거 `.cursorrules`에서 이전 |
| **Windsurf** | `.windsurf/rules/rules.md` | 글로벌 규칙 오버라이드 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Agent mode에서 사용 |
| **Kiro** | `.kiro/steering/*.md` | Steering 파일 (전체 프로젝트 컨텍스트) |

### CLAUDE.md 작성 가이드

효과적인 CLAUDE.md의 구성 요소:

```markdown
# 프로젝트명

## 빠른 사실
- 스택: Django, PostgreSQL, HTMX
- 패키지 관리자: uv
- 테스트 명령어: uv run pytest

## 핵심 디렉토리
- apps/ - Django 앱
- config/ - 설정 및 URLconf

## 코드 스타일
- Python 3.12+ 타입 힌트 필수
- Ruff로 린팅/포매팅

## 비판적 규칙
- 에러를 조용히 삼키지 말 것
- 항상 사용자 피드백 표시

## 공통 명령어
- 개발 서버, 테스트, 마이그레이션 명령어
```

**주의사항**:
- CLAUDE.md는 최대 30줄 이내로 유지 (긴 파일은 컨텍스트 창을 낭비)
- 린터로 처리 가능한 코드 스타일은 CLAUDE.md에 넣지 말 것
- 모든 세션에 보편적으로 적용되는 내용만 포함

### 고급 프롬프트 주도 패턴

**1. 슬래시 커맨드 (Skills)**
```bash
/review-pr     # PR 리뷰 자동화
/deploy-staging # 스테이징 배포
/write-tests   # 테스트 작성
```

**2. Hooks 자동화**
```json
// Claude Code hooks 설정
{
  "PreToolUse": ["uv run ruff format ."],
  "PostToolUse": ["uv run ruff check ."]
}
```

**3. 모듈러 프롬프트 원칙**
- 한 번에 하나의 작업에 집중
- 여러 작업을 단일 프롬프트에 결합하지 않기
- 코드가 아닌 결과(what)에 집중, 방법(how)은 명시하지 않기

### 멀티 모델 전략

> "단일 모델 의존을 피하라. 다양한 작업에 여러 LLM을 테스트하고, 하나가 막히면 다른 서비스로 전환하는 '모델 뮤지컬 의자' 전략을 활용하라."

- **Claude Code**: 복잡한 코드베이스 분석, 멀티파일 수정
- **GitHub Copilot**: 인라인 자동 완성, 빠른 편집
- **Cursor**: 페어 프로그래밍 스타일, 실시간 제안

### 참고 자료
- [Writing a good CLAUDE.md - HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Claude Code: Best practices - Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-best-practices)
- [CLAUDE.md Best Practices - Arize](https://arize.com/blog/claude-md-best-practices-learned-from-optimizing-claude-code-with-prompt-learning/)
- [The Complete Guide to AI Agent Memory Files - Medium](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)

---

## 6. 방법론 비교 요약

| 방법론 | 핵심 원칙 | 대표 도구 | 적합한 상황 | 주요 장점 | 주의점 |
|--------|----------|-----------|------------|-----------|--------|
| **PDCA** | 계획→실행→검증→개선 반복 | bkit, Claude Code | 프로젝트 전반 품질 관리 | 코드 부채 방지, 측정 가능 | 초기 토큰 비용 증가 |
| **SDD** | 사양이 단일 진실 원천 | Kiro, Spec-Kit | 복잡한 기능 구현 | AI 환각 감소, 인수 기준 명확 | 사양 유지 비용 발생 |
| **Design-First** | 설계 결정 사전 문서화 | ADR, Kiro Steering | 아키텍처 결정 | 팀 일관성, 변경 이유 추적 | 문서 작성 오버헤드 |
| **Plan→Impl→Review** | 코드 전에 계획 승인 | Claude Code Plan Mode | 모든 비트리비얼 작업 | 낭비 방지, 아키텍처 제어 | 소형 작업엔 과도함 |
| **Prompt-Driven** | 규칙 파일로 AI 행동 제어 | CLAUDE.md, .cursorrules | 팀 일관성 유지 | 반복 설명 불필요 | 규칙 파일 관리 필요 |

---

## 7. 실전 권장 워크플로우

AI 코딩 프로젝트에 적용할 수 있는 통합 워크플로우:

### 세션 시작 전 (Design-First + Prompt-Driven)
```
1. CLAUDE.md / .cursorrules 확인 및 업데이트
2. 작업할 기능에 대한 간단한 사양 작성 (spec.md)
   - 요구사항
   - 기술 제약
   - 인수 기준 (GIVEN/WHEN/THEN)
3. 필요시 ADR 작성 (아키텍처 결정 포함)
```

### 구현 단계 (PDCA + Plan→Implement→Review)
```
Plan:
  4. Claude Code Plan Mode 활성화 (Shift+Tab)
  5. AI에게 사양 파일 참조 지시
  6. 생성된 계획 검토 → 인라인 주석으로 수정
  7. 계획 승인

Do:
  8. 계획 실행 (Normal Mode)
  9. 단계별 테스트 (TDD)

Check:
  10. 인수 기준 대비 검증
  11. 테스트 통과 확인
  12. 코드 리뷰 (AI + 인간)

Act:
  13. 효과적이었던 패턴 기록
  14. CLAUDE.md 업데이트 (새로운 컨벤션 발견 시)
  15. ADR 업데이트 (아키텍처 결정 변경 시)
```

### 핵심 교훈

> "아마추어는 바로 코딩에 착수하지만, 전문가는 연구 → 계획 → 구현 → 검증의 체계적인 흐름을 따른다."

1. **컨텍스트 최우선**: AI에게 충분한 컨텍스트 제공 (코드베이스, 문서, 제약사항)
2. **작게 쪼개기**: 큰 작업보다 작은 단위로 반복
3. **인간 감독 유지**: AI 생성 코드를 주니어 개발자 코드처럼 검토
4. **측정 가능하게**: 커밋 품질, 테스트 비율 등 지표 추적
5. **문서가 코드다**: ADR, 사양, CLAUDE.md가 프로젝트의 "기억"

---

*참고: 이 문서는 2026년 3월 기준으로 작성된 연구 결과이며, AI 코딩 도구 생태계가 빠르게 변화하고 있어 지속적인 업데이트가 필요하다.*
