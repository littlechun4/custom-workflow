# CC Workflow — 시스템 개요

오케스트레이터와 5개 페이즈 스킬이 어떻게 함께 동작하는지 정리한 문서.

---

## 1. 아키텍처

```
사용자 ──→ /workflow (오케스트레이터) ──→ 페이즈 스킬 ──→ 산출물
                │                            │
                ├─ state.json (단일 진실 원천) ├─ workflow-specify
                ├─ review-protocol           ├─ workflow-design
                ├─ extensions                ├─ workflow-implement
                └─ state-schema              ├─ workflow-verify
                                             └─ workflow-ship
```

- **단일 진입점**: 모든 상호작용은 `/workflow` 명령어를 통해 이루어짐
- **상태 기반 디스패치**: 오케스트레이터가 `state.json`을 읽고 적절한 페이즈 스킬을 호출
- **페이즈 스킬은 직접 호출 불가**: 오케스트레이터만 호출할 수 있음

---

## 2. 라이프사이클

```
/workflow start → Specify → Design → Implement → Verify → Ship → 아카이브
                     ↑         ↑         ↑          ↑
                     └─back────└─back────└─back─────┘
```

### 페이즈 흐름

| 페이즈 | 목적 | 입력 | 산출물 |
|--------|------|------|--------|
| Specify | 무엇을, 왜, 어디까지 | 사용자 인터뷰 | `workflow_docs/spec/{feature}.md` |
| Design | 어떻게, 왜 이 방식으로 | 스펙 + 코드베이스 | `workflow_docs/design/{feature}.md` + ADR (기어 3) |
| Implement | TDD로 구현 | 설계 문서 | 코드 + 테스트 (슬라이스별 커밋) |
| Verify | 질적 리뷰 | 구현된 코드 | 리뷰 결과, 경미한 수정 |
| Ship | 마무리 | 전체 | CLAUDE.md 업데이트, PR, 아카이브 |

### 명령어

| 명령어 | 설명 |
|--------|------|
| `/workflow start {feature}` | 워크플로우 초기화 — 기어 감지, state.json 생성, Specify 진입 |
| `/workflow next [--force]` | 현재 페이즈 리뷰 → 통과 시 다음 페이즈로 전환 |
| `/workflow back [target] [reason]` | 이전 (또는 지정된) 페이즈로 피드백과 함께 복귀 |
| `/workflow status` | 대시보드 표시: 페이즈, 상태, 기어, draftCount |
| `/workflow gear [N]` | 기어 수준 수동 변경 (1–3) |
| `/workflow abort [reason]` | 아카이브 후 워크플로우 종료 |
| `/workflow resume` | 기존 state.json에서 세션 복원 |
| `/workflow history` | 완료된 워크플로우 목록 표시 |
| `/workflow limits {key} {value}` | 자동 모드 hard limit 변경 |
| `/workflow parallel [on\|off]` | Implement 페이즈 병렬 실행 토글 |
| `/workflow setup` | 스킬 설치/설정 관리 (submodule, symlink, extension 설정) |

---

## 3. 상태 관리

단일 진실 원천: `.workflow/state.json`

### 페이즈 상태 순환

```
in_progress ──→ reviewing ──→ approved ──→ (다음 페이즈)
                    │
                    ↓
              needs_revision ──→ in_progress (draftCount++)
```

- `in_progress`: 페이즈 작업 진행 중
- `reviewing`: `/workflow next` 호출됨, 리뷰 실행 중
- `needs_revision`: 리뷰에서 이슈 발견, 수정 필요
- `approved`: 리뷰 통과, 다음 페이즈 전환 준비 완료
- `partial_rework`: 슬라이스 단위 재작업 (Implement 전용)

### draftCount 임계값

| 횟수 | 동작 |
|------|------|
| ≤ 2 | 정상 범위 |
| 3 | 경고: "근본 원인부터 파악하세요" |
| ≥ 4 | 중단: `--force` / `back` / `abort` 중 선택 |

### 기어 수준

| 기어 | 범위 | 인간 게이트 | 뷰포인트 |
|------|------|------------|----------|
| 1 | 핫픽스 (≤3 파일, 단일 모듈) | 없음 | 최소 |
| 2 | 일반 기능 | 없음 (자동 승인) | 맥락에 맞는 것만 |
| 3 | 대규모/횡단 변경 | 필수 | 전체 카탈로그 |

---

## 4. 리뷰 시스템

Ship을 제외한 모든 페이즈는 `/workflow next` 호출 시 리뷰를 수행한다.

### 리뷰 파이프라인

```
1. 자동 게이트 ─── 구조/형식 체크리스트
   │                실패 시 → 차단 (뷰포인트 실행 안 함)
   ↓
2. 뷰포인트 리뷰 ─── 서브 에이전트에 의한 질적 검토
   │                   이슈: blocking / non-blocking
   │                   blocking → 차단
   │                   non-blocking → --force로 우회 가능
   ↓
3. 인간 게이트 ─── 기어 3 전용, 비즈니스/아키텍처 수준 승인
```

### 리뷰 사이드카 (.review.md)

Specify와 Design 페이즈는 문서 옆에 `.review.md` 파일을 생성한다:

```
workflow_docs/spec/
├── {feature}.md            # 문서 본문 (항상 최신 버전)
└── {feature}.review.md     # 리뷰 기록 (append only)
```

- 리뷰할 때마다 `## Review #N` 블록을 맨 위에 추가
- 이전 블록은 수정하지 않음 (이력 보존)
- 이슈 ID (`RI-{N}`)는 워크플로우 전체에서 순차 증가
- 출처 표기: `(Auto-Gate)`, `(Viewpoint:{이름})`, `(Human)`
- 해결된 이슈는 `[x]`로 체크, 해결 버전 메모

### 인간 인라인 리뷰

사용자가 스펙/설계 문서에 직접 리뷰 마커를 남길 수 있다:

```markdown
<!-- human-review: R-2 | "clear"가 모호함. 구체적인 메시지 필요 -->
```

열린 마커가 있으면 승인이 차단된다. 해결 시 `<!-- human-review-resolved: ... -->`로 변환.

---

## 5. 페이즈별 상세

### 5-1. Specify

**"무엇을, 왜, 어디까지 정의한다."** 코드는 한 줄도 작성하지 않는다.

**프로세스**:
1. 5개 항목 대화형 인터뷰 (핵심 행위 → 입출력 → 엣지 케이스 → 범위 외 → 제약조건)
2. 템플릿으로 스펙 초안 작성: 문제, 요구사항 (R-xxx), AC, 엣지 케이스, 범위, 제약조건
3. `/workflow next` → 자동 게이트 + 뷰포인트 리뷰

**AC 형식**:
- 기본: 입출력 예시 (테스트 데이터로 변환 가능)
- 복잡한 비즈니스 규칙: GIVEN/WHEN/THEN

**뷰포인트**: 명확성 및 측정 가능성 (항상), 기술적 실현 가능성, 사용자 시나리오, 비즈니스 정합성

**금지 사항**: 기술 스택, 파일 명명, 라이브러리 선택, 코드, 아키텍처 결정 불가. 기술을 교체해도 UX가 동일하면 Design 범위.

**에이전트**: `spec-reviewer`

---

### 5-2. Design

**"어떻게, 왜 이 방식으로 결정한다."** 실제 코드베이스 탐색에 기반.

**2-체크포인트 프로세스**:

| 체크포인트 | 내용 | 상태 전환 |
|-----------|------|----------|
| CP1 | 접근 방식 요약 + 대안 분석 | 없음 (`in_progress` 유지) |
| CP2 | 전체 문서: 변경 계획, 슬라이스, AC 커버리지, 테스트 전략 | `in_progress → reviewing → approved` |

**코드베이스 탐색** (문서 작성 전):
- Glob/Grep으로 기존 패턴 발견
- 발견된 참조 패턴을 `context.referencePatterns`에 저장
- 영향받는 파일/모듈 분석

**문서 섹션**: 접근 방식 요약, 대안 분석, 변경 계획 (파일별 + 참조 패턴), TDD 슬라이스 (1 슬라이스 = 1 커밋, ≤3 파일), AC 커버리지 매트릭스, 테스트 전략, 리스크/미결 항목, ADR

**`[OPEN_QUESTION]` 마커**: CP1에서 허용, CP2 전에 반드시 해결.

**Design ↔ Spec 피드백 루프**: 최대 3회 왕복. 초과 시 → 기능 분할 제안.

**뷰포인트**: 슬라이스 분해 (항상), 아키텍처 일관성 (항상), 리스크 및 의존성, ADR 품질

**에이전트**: `design-reviewer`

---

### 5-3. Implement

**"슬라이스 단위로 구현한다."** 슬라이스별 TDD Red→Green→Refactor.

**TDD 사이클 (슬라이스당)**:
```
1. Red    — 슬라이스의 테스트 의도로 실패하는 테스트 작성
2. Green  — 통과시키기 위한 최소 코드
3. Refactor — 동작 변경 없이 정리
4. Verify — 테스트 + 린트 + 타입 체크 실행
5. Commit — feat({scope}): {설명} [{Slice-ID}]
```

**슬라이스 상태**: `pending → in_progress → completed` (또는 `needs_rework`)

**리뷰**: 자동 게이트만 (뷰포인트 없음, 인간 게이트 없음):
- 모든 슬라이스 완료
- 모든 테스트 통과
- 린트 + 타입 체크 통과
- 회귀 없음 (전체 테스트 스위트)

**에스컬레이션**:
- 동일 오류 3회 반복 → 중단 후 분석
- 요구사항 이슈 → Specify로 `back`
- 설계 이슈 → Design으로 `back`
- Verify에서 슬라이스 재작업 → `partial_rework` 상태

**에이전트**: `code-reviewer`

---

### 5-4. Verify

**"품질을 리뷰하고, 커버리지를 확인한다."** 구현하지 않고 리뷰만 수행.

**항상 활성화되는 5개 리뷰 축**:

| 축 | 초점 |
|----|------|
| 재사용성 | 중복, 기존 유틸리티, 추상화 기회 |
| 코드 품질 | 네이밍, 책임 분리, 에러 처리, 패턴 준수 |
| 런타임 효율 | N+1 쿼리, 할당, 루프, 성능 제약 |
| 보안 | 입력 검증, 인젝션, 인증/인가, 민감 데이터 |
| AC 커버리지 | 모든 AC를 코드 + 테스트로 추적 |

**추가 뷰포인트** (맥락에 따라): 성능 심화, 접근성, 비즈니스 로직, 동시성

**경미한 수정 vs 구조적 이슈**:
- 경미 (네이밍, 소규모 리팩토링): Verify에서 직접 수정, 회귀 테스트 실행
- 구조적 (아키텍처, 로직): `slice_rework` 피드백과 함께 Implement로 `back`

**인간 게이트** (기어 3 전용): 리뷰 결과에 대한 최종 승인

**에이전트**: `test-strategist`

---

### 5-5. Ship

**"마무리하고 기록한다."** 진입 시 자동으로 완료까지 실행 — `/workflow next` 불필요.

**프로세스**:
```
1. 인사이트 캡처 — 코드에서 유추 불가능한 발견사항을 history에 기록 (선택적)
2. 제안 사항 변환 — 비차단 리뷰 항목을 이슈로 전환 (선택적)
3. (확장) PR 생성 — gh pr create로 요약 + 문서 포함 (기본 활성)
4. (확장) CI 확인 — 통과/실패까지 폴링
5. (확장) PR 자동 병합 — squash merge + 브랜치 정리
6. 아카이브 — state.json을 .workflow/history/로 이동
```

**확장 기능**: `.workflow/config.json`으로 관리 (`/workflow setup`으로 생성). config 없으면 전부 비활성. setup 기본값: Branch/PR 활성, CI/자동 병합 비활성.

**CI 실패 복구**: 적절한 페이즈로 복귀 (테스트 실패 → Implement, 린트 → Implement, 타입 → Design)

**아카이브는 항상 마지막**: 모든 프로세스 (핵심 + 확장) 성공 후에만 실행.

**금지 사항**: 코드 변경, 테스트 변경, 요구사항/설계 변경, 재검증 불가.

---

## 6. 자동 모드 (Auto Mode)

`/workflow start {feature} --auto`로 시작하면 Specify 이후 (또는 현재 페이즈부터) Ship까지 사용자 개입 없이 자동 실행된다.

### 수동 모드와의 차이

| 항목 | 수동 모드 | 자동 모드 |
|------|----------|----------|
| 페이즈 전환 | `/workflow next` 수동 호출 | `approved` → 자동 진입 |
| 전환 확인 | "Proceed? [Y/n]" | 생략 |
| `needs_revision` | 수정 후 `/workflow next` 수동 | 수정 → 자동 재리뷰 |
| Design CP1 | 사용자 방향 확인 | AI 자체 검증 후 진행 |
| 기어 3 인간 게이트 | 사용자 승인 대기 | AI 리뷰만으로 진행 |
| non-blocking 이슈 | 사용자 `--force` 결정 | 자동 force, 리포트에 기록 |
| 출력 | 매 단계 실시간 | 완료/중단 시 종합 보고서 |

### Hard Limit (위반 시 즉시 중단)

| 제한 | 기본값 | 위반 시 |
|------|--------|--------|
| 페이즈당 최대 draftCount | 5 | 중단: "{페이즈}가 {N}회 초안을 초과" |
| 워크플로우 전체 back 횟수 | 3 | 중단: "back 내비게이션 {N}회 초과" |
| 동일 페이즈 back 횟수 | 2 | 중단: "{페이즈}에 {N}회 복귀" |
| Design↔Specify 왕복 | 3 | 중단: "Design↔Specify 루프 {N}회 초과" |

중단 시 진행 상황을 보고서에 기록하고, 사용자에게 선택지를 제시한다:
- `/workflow next --auto` — 자동 모드로 재개
- `/workflow next` — 수동 모드로 전환
- `/workflow back` / `/workflow abort` — 복귀 또는 종료

### 종합 보고서

`workflow_docs/reports/{feature-slug}-report.md`에 생성. 각 페이즈 완료 시 해당 섹션을 추가하며, 중단 시에도 진행 상황까지 기록.

보고서 내용:
- 전체 요약 (기어, 결과, 총 초안 수, back 횟수, force-skip 이슈 수)
- 페이즈별: 자동 게이트 결과, 뷰포인트 리뷰 결과, force-skip된 이슈, 에스컬레이션
- Implement: 슬라이스 진행 테이블
- Verify: 5축 리뷰 결과 요약
- Ship: 수행된 액션 목록

---

## 6-1. 병렬 실행 모드 (Parallel Mode)

Implement 페이즈에서 독립 슬라이스를 Teams API 기반으로 병렬 실행. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 필요.

### 활성화

유저 명시 지시로만 활성화 (자동 판단 없음):
```
/workflow start {feature} --parallel
/workflow parallel on
```

### 구조

```
Lead (메인 세션)
  ├─ Teammate(A-1): 코드 작성 (공유 working copy)
  ├─ Teammate(B-1): 코드 작성 (공유 working copy)
  └─ Teammate(C-1): 코드 작성 (공유 working copy)
      ↕ SendMessage (test lock / commit lock 요청/승인)
```

- **코드 작성은 병렬**: 각 Teammate가 공유 working copy에서 TDD cycle 수행 (파일 겹침 없음)
- **테스트 실행은 직렬**: Lead가 test lock으로 한 번에 하나의 테스트만 실행 허용
- **git commit은 직렬**: Lead가 commit lock으로 staging/commit 충돌 방지
- **state.json 업데이트는 Lead 전담**: hook은 Teammate에서 스킵, tier 완료 후 일괄 처리

### Tier 실행 순서

`blockedBy` 배열에서 tier를 계산하여 의존성 순서대로 실행:
```
Tier 0: [A-1, B-1, C-1] (독립) → 병렬 실행
Tier 1: [A-2] (A-1 의존) → A-1 완료 후 실행
Tier 2: [D-1] (A-2, B-1 의존) → 두 슬라이스 완료 후 실행
```

같은 tier의 슬라이스들은 `changedFiles` 겹침 검증 → 겹치면 다음 tier로 분리.

### 실패 처리

- Teammate는 직접 에스컬레이션하지 않음 → Lead에 리포트 → 유저가 결정
- 완료된 슬라이스만 부분 merge, 실패 슬라이스는 pending 유지
- Rework cascade: upstream 슬라이스 rework 시 downstream 자동 전파

---

## 7. 페이즈 간 메커니즘

### Back 내비게이션

모든 페이즈에서 이전 페이즈로 사유와 함께 복귀 가능:

```
/workflow back [target] [reason]
```

- 피드백이 `feedback[]` 배열에 `fromPhase`, `toPhase`, `type`, `description`으로 기록
- 대상 페이즈는 피드백 맥락을 가지고 재진입
- `reviewing`/`needs_revision` 상태면 `in_progress`로 리셋

### 피드백 유형

| 유형 | 설명 |
|------|------|
| `escalation` | 페이즈 단위 복귀 (예: Design에서 스펙 이슈 발견) |
| `slice_rework` | Verify에서 특정 슬라이스를 Implement로 반환 |
| `force_skipped` | `--force`로 blocking 이슈를 건너뜀 |

### 산출물 추적

`state.json`이 모든 산출물을 추적:

| 필드 | 페이즈 | 내용 |
|------|--------|------|
| `artifacts.spec` | Specify | 스펙 문서 경로 |
| `artifacts.design` | Design | 설계 문서 경로 |
| `artifacts.designStale` | Design | 스펙 변경으로 설계가 무효화된 경우 플래그 |
| `artifacts.adr` | Design | ADR 경로 배열 (기어 3) |
| `slices[]` | Implement | 슬라이스 상태, AC 매핑, 커밋 해시 |

### 컨텍스트 보존

- `context.loadOnResume`: `/workflow resume` 시 다시 로드할 파일 경로
- `context.referencePatterns`: Design 단계에서 발견한 코드베이스 패턴
- `phase.history[]`: 완료된 페이즈 기록 (draftCount, 타임스탬프 포함)

---

## 8. 파일 구조

```
.workflow/
├── state.json                          # 런타임 상태 (gitignored)
└── history/                            # 아카이브된 워크플로우

workflow_docs/                          # 산출물 (git 커밋 대상)
├── spec/
│   ├── {feature}.md                    # 스펙 문서
│   └── {feature}.review.md            # 스펙 리뷰 기록
├── design/
│   ├── {feature}.md                    # 설계 문서
│   └── {feature}.review.md            # 설계 리뷰 기록
├── adr/
│   └── ADR-NNN-{title}.md             # 아키텍처 결정 기록
├── suggestions/
│   └── {feature-slug}.md              # non-blocking 제안 사항
└── reports/
    └── {feature-slug}-report.md       # 자동 모드 종합 보고서
```
