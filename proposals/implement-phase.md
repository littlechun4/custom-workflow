# Implement 단계 정의서 (Build)

> 작성: 2026-03-09
> 목적: Implement 단계의 역할, 활동, TDD 프로세스, 경계 규칙 정의
> 기어: 3단 (10+ 파일, 아키텍처급) 기준 최대치 설계
> 문서 보존: 코드는 git 커밋, workflow_docs 산출물 없음

---

## 산출물 위치

```
소스 코드 + 슬라이스별 커밋 (git)
workflow_docs 산출물 없음 — Design의 슬라이스 계획이 실행 지침
```

---

## 1. 역할 정의

**"Design의 계획대로 TDD로 구현한다."**

- Design의 슬라이스 계획을 1:1로 실행
- 슬라이스 단위 Red→Green→Refactor→Commit 사이클
- 코드가 산출물 — 별도 문서 작성 없음

## 2. 구체적 활동

| 활동 | 주체 | 설명 |
|------|------|------|
| 슬라이스 순서 확인 | AI | Design의 슬라이스 의존성 DAG에 따라 실행 순서 결정 |
| 테스트 작성 (Red) | AI | 슬라이스의 "테스트 의도"를 실패하는 테스트로 변환 |
| 최소 구현 (Green) | AI | 실패 테스트를 통과시키는 최소한의 코드 |
| 리팩토링 | AI | 중복 제거, 네이밍 개선 — 동작 변경 없음 |
| 자동 검증 | AI | lint + type check + test |
| 커밋 | AI | 1 Slice = 1 Commit (원자성) |

## 3. Phase 완료 조건 (Auto-gate Only)

### 전체 흐름

Implement는 **만들기에 집중**한다. 질적 코드 리뷰는 Verify Phase의 역할.

```
슬라이스 순차 실행 (in_progress)
  Slice 1: Red → Green → Refactor → Commit
  Slice 2: Red → Green → Refactor → Commit
  ...
  Slice N: Red → Green → Refactor → Commit
  ──[/workflow next]──→ auto-gate 검증
     → 미충족 → needs_revision → AI 수정 → in_progress
     → 통과 → approved
       ──[/workflow next]──→ 다음 Phase (Verify)
```

인간 리뷰, viewpoint 리뷰는 없다. Verify에서 수행.

### 슬라이스 내부 사이클

각 슬라이스는 독립적인 TDD 사이클로 실행된다:

```
Slice N 시작 (status: pending 또는 needs_rework)
  1. Design에서 Slice N의 "테스트 의도" 읽기
  2. 실패하는 테스트 작성 (Red)
  3. 최소 구현 (Green) — "이 실패하는 테스트를 통과시키는 최소한의 코드만"
  4. 리팩토링 — 동작 유지하면서 구조 개선
  5. 자동 검증:
     - lint (프로젝트 설정에 맞게)
     - type check
     - test (전체 또는 관련 범위)
  6. 커밋 (아래 커밋 컨벤션)
  7. state.json의 slice 상태 갱신 (Hook 자동)
  8. 다음 Slice로 이동
```

### Auto-gate (전체 슬라이스 완료 후)

모든 슬라이스 완료 후 `/workflow next` 시 기계적 검증:

- [ ] 모든 슬라이스 `completed` (needs_rework 없음)
- [ ] 전체 테스트 스위트 통과
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 기존 테스트 깨뜨리지 않음

미충족 시 → `needs_revision` → AI가 자동 수정 → `in_progress` → 재검증.
통과 시 → `approved` → `/workflow next`로 Verify 진입.

**인간 리뷰/승인 없음**: Implement의 auto-gate는 기계적 통과/차단만 판정한다. 코드 품질, 재사용성, 보안 등 질적 리뷰는 Verify Phase에서 인간과 AI가 함께 수행한다.

### status 전이 요약

| 현재 status | 트리거 | 다음 status |
|-------------|--------|------------|
| `in_progress` | 슬라이스 순차 실행 중 | `in_progress` (슬라이스 진행) |
| `in_progress` | 모든 슬라이스 완료 + `/workflow next` | `reviewing` (auto-gate 검증) |
| `reviewing` | auto-gate 미충족 | `needs_revision` |
| `reviewing` | auto-gate 통과 | `approved` |
| `needs_revision` | AI 수정 완료 | `in_progress` |
| `approved` | `/workflow next` | 다음 Phase 전환 (Verify) |
| `partial_rework` | `/workflow back --slice N` | `partial_rework` (해당 슬라이스만 재작업) |
| `partial_rework` | 해당 슬라이스 completed + `/workflow next` | `reviewing` (auto-gate 재검증) |

---

## 4. 금지사항 (Implement 침범 방지)

| 금지 | 이유 | 대처 |
|------|------|------|
| 요구사항 변경 | Specify 영역 | `/workflow back specify` 에스컬레이션 |
| 설계 변경 (새 파일 구조, 새 접근법) | Design 영역 | `/workflow back design` 에스컬레이션 |
| 범위 외 코드 작성 | 범위 이탈 | Design 슬라이스에 없는 코드 금지 |
| 테스트 없는 구현 | TDD 원칙 위반 | 반드시 Red→Green 순서 |
| 이해하지 못한 코드 커밋 | 품질 보장 불가 | 인간에게 설명 요청 |
| 코드 품질 리뷰 (재사용성, 보안 등) | Verify 영역 | Implement는 "만들기"에 집중 |

## 5. TDD 사이클: Red → Green → Refactor

### Red (실패하는 테스트)

- Design 슬라이스의 "테스트 의도"를 테스트 코드로 변환
- 테스트가 **정확한 이유로** 실패하는지 확인 (import error ≠ 올바른 실패)
- 테스트 범위: 슬라이스의 "변경 파일"에 명시된 범위만

### Green (최소 구현)

- 실패하는 테스트를 통과시키는 **최소한의 코드**
- "나중에 쓸 것 같은" 코드 금지 — 현재 테스트가 요구하는 것만
- Design의 "참조 패턴"을 따라 기존 코드베이스와 일관된 스타일

### Refactor (리팩토링)

- 동작 변경 없이 구조 개선
- 중복 제거, 네이밍 개선, 추출
- 리팩토링 후 테스트 재실행으로 동작 보존 확인

## 6. 커밋 컨벤션

**형식** (Conventional Commits + Slice ID):

```
feat({scope}): {설명} [{Slice-ID}]    ← 슬라이스 구현
fix({scope}): {설명} [{Slice-ID}]     ← 슬라이스 내 수정
```

**규칙:**
- **최초 구현: 1 Slice = 1 Commit (원자성)** — feat 커밋 1개로 슬라이스 완성
- Verify에서 `/workflow back --slice N`으로 돌아온 재작업 시: 해당 슬라이스의 추가 fix 커밋 허용
- 즉, 하나의 슬라이스에 **feat 1개 + fix N개**가 가능
- 커밋 메시지의 `[Slice-ID]`로 slice-tracker Hook이 state.json 자동 갱신
- 예시: `feat(notifications): add Notification model [A-1]`

**Verify 재작업 커밋:**
```
fix({scope}): {수정 내용} [{Slice-ID}]
```
- Verify에서 `/workflow back --slice N`으로 돌아온 재작업 커밋
- 최초 feat 커밋 이후, 해당 슬라이스의 수정사항을 fix 커밋으로 처리
- 예시: `fix(notifications): add boundary check for empty list [B-1]`

## 7. 슬라이스 상태 관리

### Slice status 값

| status | 의미 |
|--------|------|
| `pending` | 미시작 |
| `in_progress` | 진행 중 |
| `completed` | 완료 (커밋됨) |
| `needs_rework` | 재작업 필요 |

### 진행률 추적

state.json의 `slices` 배열로 관리 (Hook 자동 갱신):

```json
"slices": [
  {"id": "A-1", "name": "Notification 모델", "status": "completed", "acs": ["R-1"], "commit": "abc1234"},
  {"id": "A-2", "name": "Comment signal", "status": "in_progress", "acs": ["R-1", "R-2"], "commit": null},
  {"id": "B-1", "name": "알림 목록 API", "status": "pending", "acs": ["R-3", "R-4"], "commit": null}
]
```

### AC 커버리지 갱신

state.json의 `slices` 배열에서 슬라이스 완료 시 자동 추적:
- Slice 완료 → 해당 슬라이스의 `acs` 필드에 연결된 AC가 커버됨으로 기록
- Design 문서를 직접 수정하지 않음 (역할 침범 방지)
- Verify에서 state.json 기반으로 최종 AC 커버리지 확인

## 8. 에스컬레이션 규칙

### 같은 오류 3회 반복

같은 오류로 3회 이상 실패 시 → 접근 방식이 잘못된 신호:
1. 현재 시도 중단
2. 원인 분석: Design 문제 vs Spec 문제 vs 환경 문제
3. `/workflow back design` 또는 `/workflow back specify`

### 요구사항 문제 발견

구현 중 Spec의 문제를 발견하면:
- **직접 수정하지 않음**
- 문제 + 대안 + 트레이드오프 형식으로 보고
- `/workflow back specify "R-3 요구사항이 기술적으로 불가능"`

### 설계 문제 발견

구현 중 Design의 문제를 발견하면:
- 현재 슬라이스 중단
- 문제 + 영향 범위 + 대안 보고
- `/workflow back design "참조 패턴이 deprecated, 대안 필요"`

### Slice 단위 부분 재작업

Verify에서 특정 슬라이스 문제 발견 시:

```
/workflow back --slice B-2 "경계값 0, -1 미처리"
→ B-2만 needs_rework 표시
→ 나머지 완료된 슬라이스는 그대로 유지
→ B-2 재작업 후 /workflow next로 Verify 재진입
```

### Implement → Design back 시 슬라이스 처리

완료된 슬라이스는 **보존**한다. Design 재승인 후 Implement 재진입 시:
1. AI가 Design 변경 범위(diff)를 분석
2. 영향 받는 슬라이스만 `needs_rework`로 표시
3. 영향 없는 슬라이스는 `completed` 유지
4. 새로 추가된 슬라이스는 `pending`으로 생성

---

## 9. 문서 업데이트 정책 (구현 중)

### Must Update (반드시 수정)

| 상황 | 이유 | 업데이트 대상 |
|------|------|-------------|
| 요구사항 자체 변경 발견 | Verify에서 혼란 방지 | Spec → `/workflow back specify` |
| 파일 구조가 Design과 크게 달라짐 | 이후 유사 기능 구현 시 혼란 | `/workflow back design` 에스컬레이션 |

### Skip Update (그냥 진행)

| 상황 | 이유 |
|------|------|
| 함수명/변수명이 Design과 다름 | 코드가 진실의 원천 |
| 파일 내 구현 순서가 다름 | 순서는 가이드라인 |
| 테스트 케이스 추가/변경 | 테스트 코드 자체가 문서 |
| 리팩토링으로 구조 변경 | Design 추상화 수준에서 변화 없음 |

**판단 기준:**
> "Verify 단계에서 이 차이가 '이게 뭐지?'를 유발하는가?"
> → Yes: 즉시 에스컬레이션 또는 문서 수정
> → No: 구현 계속

**실무 방식:**
1. 구현 중: `<!-- TODO: update design -->` 또는 코드 내 `// TODO: sync with design` 주석
2. 모든 슬라이스 완료 후: TODO 일괄 정리
3. Verify 전: 문서-코드 정합성 확인

---

## 10. 소요 시간

- **기능 복잡도에 비례** (슬라이스 수 × 사이클당 시간)
- 슬라이스 1개: 5~15분 (Red→Green→Refactor→Commit)
- 전체: 슬라이스 수에 따라 달라짐
- 한 슬라이스에서 30분 이상 막히면 → 에스컬레이션 검토

---

## 11. Implement 체크리스트

### 슬라이스 완료 (슬라이스별)

- [ ] 실패하는 테스트를 먼저 작성했는가? (Red)
- [ ] 테스트가 올바른 이유로 실패하는가? (import error ≠ 올바른 실패)
- [ ] 최소한의 코드로 테스트를 통과시켰는가? (Green)
- [ ] lint 통과하는가?
- [ ] type check 통과하는가?
- [ ] 기존 테스트를 깨뜨리지 않는가?
- [ ] 1 Slice = 1 Commit 원자성을 지켰는가?
- [ ] 커밋 메시지에 [Slice-ID]가 포함되어 있는가?

### Phase 완료 (auto-gate)

- [ ] 모든 슬라이스 `completed` (needs_rework 없음)
- [ ] 전체 테스트 스위트 통과
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 기존 테스트 깨뜨리지 않음

### 에스컬레이션 체크

- [ ] 같은 오류 3회 반복 시 접근 방식을 변경했는가?
- [ ] 요구사항/설계 문제 발견 시 "문제 + 대안 + 트레이드오프"로 보고했는가?
- [ ] 범위 외 코드를 작성하지 않았는가?

---

## 요약

> **Implement는 "Design 계획을 TDD로 실행"한다.**
> 슬라이스 단위 Red→Green→Refactor→Commit 사이클을 반복하고,
> 코드가 유일한 산출물이다. 문서가 아닌 코드로 말한다.
