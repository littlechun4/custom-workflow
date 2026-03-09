# orchestrator-recommended.md 일관성 점검 보고서

> **점검 대상**: `proposals/orchestrator-recommended.md`
> **점검일**: 2026-03-06
> **점검자**: consistency-checker agent

---

## 1. 적용 범위 모순

### 이슈 1-1: Specify Exit Criteria에 "Gear 2 = T1만" 표기 — Gear 2는 Specify를 건너뜀

- **위치**: 줄 761
- **문제**: Specify Exit Criteria 기어별 적용 범위에 `Gear 2 = T1만`이라고 적혀 있으나, Section 2-2 (줄 87-90)의 기어별 Phase 매핑 테이블에서 Gear 2는 Specify를 건너뛴다고 명시되어 있다. Gear 2가 Specify Phase에 진입하지 않으므로 T1 검증 적용 자체가 불가능하다.
- **수정 제안**: 줄 761을 `Gear 1-2 = 해당 없음 (Phase 미진입)` | `Gear 3 = T1+T2` | `Gear 4 = T1+T2+T3`으로 수정

### 이슈 1-2: Design Exit Criteria에 "Gear 2 = T1만" 표기 — 정합성 확인 필요

- **위치**: 줄 825
- **문제**: Design Exit Criteria에서 `Gear 2 = T1만`이라고 적혀 있다. Gear 2는 `Design(light)`를 포함하므로(줄 90) 진입 자체는 가능하지만, Gear 2의 Design(light)은 "Plan Mode 메모" 수준이다(줄 100). T1 항목 중 `workflow_docs/design/{feature}.md 파일 존재`(줄 828)나 `슬라이스 목록 존재`(줄 830) 등은 Gear 2 Design(light)의 산출물과 맞지 않는다.
- **수정 제안**: Gear 2 Design(light)에 대한 별도의 경량 Exit Criteria를 정의하거나, 현재 T1 항목이 Gear 3-4 전용임을 명시. 예: `Gear 2 = Plan Mode 완료 확인만` | `Gear 3 = T1+T2` | `Gear 4 = T1+T2+T3`

### 이슈 1-3: Gear 1의 Phase 범위 모순 — "Implement → Ship" vs 실제 흐름

- **위치**: 줄 89 vs 줄 50-54
- **문제**: 기어별 Phase 테이블(줄 89)에서 Gear 1의 포함 Phase는 `Implement → Ship`이라고 적혀 있다. 그러나 Section 2-1(줄 50-54)의 Gear 1 정의에서는 "바로 구현 → lint → 커밋"이며 Ship Phase나 state.json이 없다. Ship Phase(줄 958-963)의 프로세스(PR 생성, state.json 아카이브 등)는 Gear 1의 "마찰 제로" 개념과 충돌한다.
- **수정 제안**: 줄 89의 Gear 1 포함 Phase를 `Implement only (즉시 커밋)`으로 수정하거나, Gear 1에서의 Ship이 단순 커밋만을 의미한다면 그 차이를 명시

### 이슈 1-4: Gear 2의 Phase 범위 모순 — "Design → Implement → Ship" vs 실제 흐름

- **위치**: 줄 90 vs 줄 56-60
- **문제**: 기어별 Phase 테이블(줄 90)에서 Gear 2는 `Design(light) → Implement → Ship`을 포함한다. 그러나 Section 2-1(줄 56-60)에서는 "Plan Mode 탐색 → 구현 → 테스트 → 커밋"으로, Ship Phase가 언급되지 않는다. Gear 2는 미니멀 state.json을 사용하므로(줄 408-432) Ship의 "state.json → history/ 아카이브"가 적용되는지 불명확하다.
- **수정 제안**: Gear 2에서 Ship의 의미를 축소 정의(단순 커밋+정리)하거나, Section 2-1의 흐름 설명에 Ship을 포함

---

## 2. 구조적 일관성

### 이슈 2-1: Ship Phase에만 Exit Criteria와 Viewpoint 카탈로그가 없음

- **위치**: 줄 955-964 (Section 8-5)
- **문제**: Specify(8-1), Design(8-2), Implement(8-3), Verify(8-4) 모두 Exit Criteria(T1/T2/T3)와 Viewpoint 카탈로그를 가지고 있다. Ship Phase만 둘 다 없다. 의도적인 것인지 누락인지 불명확하다.
- **수정 제안**:
  - 의도적이라면: Ship Phase 설명에 "Ship은 최종 정리 단계이므로 별도 Exit Criteria/Viewpoint를 적용하지 않는다"고 명시
  - 누락이라면: 최소한의 Exit Criteria 추가. 예: T1 — CI 통과, PR 생성 완료, state.json 아카이브 완료

### 이슈 2-2: `/workflow back` 매핑에서 Ship → Verify가 있으나 Ship Phase 설명에 back 언급 없음

- **위치**: 줄 229 (back 매핑 테이블) vs 줄 955-964 (Ship Phase)
- **문제**: Section 3-4 테이블에서 Ship의 `back (인수 없음)` = verify, `back specify` = specify, `back design` = design으로 정의되어 있다. 그러나 Ship Phase(8-5)의 프로세스 설명에는 역방향 전환에 대한 언급이 전혀 없다. Ship에서 CI 실패 시 어떻게 되는지 등의 시나리오가 빠져 있다.
- **수정 제안**: Ship Phase에 "CI 실패 시 → `/workflow back verify` 또는 `/workflow back implement`로 복귀" 등의 시나리오 추가

---

## 3. 용어 불일치

### 이슈 3-1: "기어 1-2 무마찰 (상태 파일 없음)" — Gear 2는 상태 파일이 있음

- **위치**: 줄 31
- **문제**: Section 1의 "각 Proposal에서 가져온 것" 테이블에서 `기어 1-2 무마찰 (상태 파일 없음)`이라고 적혀 있다. 그러나 Section 2-1(줄 57)과 Section 4-5(줄 408-432)에서 Gear 2는 미니멀 state.json을 생성한다고 명시되어 있다. "상태 파일 없음"은 Gear 1에만 해당한다.
- **수정 제안**: `기어 1 무마찰 (상태 파일 없음), 기어 2 경량 (미니멀 상태 파일)`로 수정

### 이슈 3-2: Slice ID 표기 혼용 — "A-1" vs "B-2" vs "Slice-ID"

- **위치**: 문서 전반
- **문제**: Slice ID 형식이 일관되지 않다.
  - 줄 119, 209: `/workflow back --slice N` — `N`이 숫자인 것처럼 표기
  - 줄 305-329: `A-1`, `A-2`, `B-1` — 알파벳-숫자 형식
  - 줄 875: `[Slice-ID]` — 커밋 메시지 형식
  - 줄 1153: `--slice B-1` — 알파벳-숫자 형식
- **수정 제안**: 줄 119의 `--slice N`을 `--slice {slice-id}`로 통일. 커맨드 설명 시 "N은 슬라이스 ID (예: A-1, B-2)"로 명시

### 이슈 3-3: "AC 커버리지" 이중 의미

- **위치**: 줄 808 (Design), 줄 829, 줄 934
- **문제**: "AC 커버리지"가 두 가지 의미로 사용된다.
  - Design Phase(줄 808): 모든 R/AC가 최소 1개 Slice에 매핑 → 설계 커버리지
  - Verify Phase(줄 934): 모든 R-xxx의 AC가 테스트에서 추적 가능 → 테스트 커버리지
- **수정 제안**: Design에서는 "슬라이스 매핑 커버리지", Verify에서는 "테스트 추적 커버리지"로 구분하여 명칭 사용

### 이슈 3-4: "이탈 기준" vs "종료 조건" vs "Exit Criteria"

- **위치**: 줄 976 ("이탈 기준 상태"), 줄 759 ("종료 조건 (Exit Criteria)"), 줄 1269 ("이탈 기준")
- **문제**: 같은 개념에 대해 "이탈 기준", "종료 조건", "Exit Criteria" 세 가지 표현이 혼용된다.
- **수정 제안**: 하나로 통일. 추천: "종료 조건(Exit Criteria)"을 공식 용어로 지정하고, "이탈 기준"은 사용하지 않음

---

## 4. 흐름도 vs 텍스트 불일치

### 이슈 4-1: 상태 전이도에 `partial_rework` 상태 누락

- **위치**: 줄 462-473 (상태 전이도) vs 줄 383 (status 정의)
- **문제**: Section 4-2(줄 383)에서 `partial_rework`가 Phase status 값으로 정의되어 있고, Section 8-3(줄 863)과 예시(줄 1157)에서도 사용된다. 그러나 Section 5의 상태 전이도(줄 462-473)에는 `partial_rework`가 표시되어 있지 않다.
- **수정 제안**: 상태 전이도에 `partial_rework` 경로 추가:
  ```
  in_progress → reviewing → approved → 다음 Phase
                    └─ needs_revision → in_progress (수정 후)
  partial_rework → (재작업 완료) → reviewing
  ```

### 이슈 4-2: 상태 전이도에 Ship → Verify back 경로 누락

- **위치**: 줄 454-460 vs 줄 229
- **문제**: 상태 전이도(줄 454)에서 Ship에서의 역방향 화살표가 없다. 그러나 Section 3-4 테이블(줄 229)에서 Ship → Verify(back), Ship → Specify/Design(에스컬레이션)이 정의되어 있다.
- **수정 제안**: 상태 전이도에 Ship에서의 back 경로를 추가

### 이슈 4-3: `needs_revision` 후 `/workflow next` 전이 경로 불명확

- **위치**: 줄 136-147 (Section 3-2) vs 줄 466 (상태 전이도) vs 줄 1060 (Section 9-4)
- **문제**:
  - Section 3-2는 "1번째 next"(in_progress → reviewing)과 "2번째 next"(approved → 다음 Phase)만 정의한다.
  - `needs_revision` 상태에서 `/workflow next`를 호출하면 어떻게 되는지 명시적으로 정의되어 있지 않다.
  - 상태 전이도(줄 466)는 "needs_revision → 수정 → back to in_progress"를 보여준다.
  - Section 9-4(줄 1060)는 "phase.status = in_progress (수정 시작)"이라고 한다.
  - 이를 종합하면 `needs_revision → (수정) → in_progress → (next) → reviewing`이지만, "수정" 완료 후 status를 in_progress로 변경하는 주체가 불명확하다 (AI 자동? 사용자 next?).
- **수정 제안**: Section 3-2에 `needs_revision` 상태에서의 동작을 명시적으로 추가:
  ```
  needs_revision 상태에서 /workflow next:
    → AI가 수정된 부분 확인 → status: reviewing → 재검토
  ```

---

## 5. Status 전이 규칙 vs 예시 불일치

### 이슈 5-1: 예시의 "2번째 next" 전이가 규칙과 불일치

- **위치**: 줄 1112 (Section 10-1 예시) vs 줄 136-147 (Section 3-2 규칙)
- **문제**: 예시에서 `사용자: /workflow next ← 2번째 (needs_revision → reviewing → approved)`라고 적혀 있다. 이는 하나의 next 호출로 needs_revision에서 reviewing을 거쳐 approved까지 간다는 뜻인데, Section 3-2의 2단계 동작 정의와 맞지 않다. Section 3-2에서 "1번째 next"는 in_progress → reviewing이고, "2번째 next"는 approved → 다음 Phase이다. needs_revision에서의 next는 별도 정의되어 있지 않다.
- **수정 제안**: 예시를 다음과 같이 수정:
  ```
  ... (R2 수치 추가, 에러 시나리오 명시 → status: in_progress로 복귀) ...

  사용자: /workflow next  ← (in_progress → reviewing → 재검토 통과 → approved)

  사용자: /workflow next  ← (approved → design/in_progress)
  ```

### 이슈 5-2: 예시에서 "3번째 next"의 트리거 주체 불일치

- **위치**: 줄 1119-1122
- **문제**: 줄 1117에서 AI가 "DESIGN으로 진행할까요?"라고 묻고, 사용자가 "응"이라고 답한 뒤, 줄 1121에서 `[Skills: workflow next] ← 3번째`라고 표시된다. 그러나 사용자는 "응"이라고만 답했지 `/workflow next`를 입력한 것이 아니다. 사용자 확인("응")이 자동으로 Phase 전환을 트리거하는 것인지, 별도 `/workflow next`가 필요한 것인지 불명확하다.
- **수정 제안**: 둘 중 하나를 명확히:
  - A) approved 상태에서 사용자 확인("응")으로 자동 전환 → Section 3-2에 이 동작 추가
  - B) 사용자가 `/workflow next`를 별도로 입력해야 함 → 예시에서 사용자 입력을 `/workflow next`로 수정

### 이슈 5-3: partial_rework 완료 후 전이 경로가 예시와 규칙에서 다름

- **위치**: 줄 1162 (예시) vs 줄 877 (Implement 규칙)
- **문제**:
  - 예시(줄 1162): "partial_rework 완료 → Verify 재진입"
  - Implement Phase(줄 877): "rework 완료 시 Verify 재진입"
  - 그러나 줄 1157에서 `/workflow back --slice B-1` 실행 시 phase는 implement로 바뀐다(줄 210 참조). 그렇다면 다시 Verify로 가려면 `/workflow next`를 실행해야 하고, Implement의 Exit Criteria 검증(전체 슬라이스 completed, 테스트 통과 등)이 다시 적용되어야 하는데, 예시에서는 이 과정이 생략되어 있다.
- **수정 제안**: partial_rework 완료 후 Verify 재진입 프로세스를 명시:
  - 재작업 슬라이스만 completed 처리 → `/workflow next` → Implement reviewing (재작업 범위만 검토) → approved → Verify 재진입

---

## 6. 실용성 문제

### 이슈 6-1: `context-inject.sh`가 매 프롬프트마다 실행됨

- **위치**: 줄 485-495 (Hook 설정), 줄 582-608 (스크립트)
- **문제**: `context-inject.sh`는 `UserPromptSubmit` Hook에 등록되어 있어 사용자의 **매 프롬프트마다** 실행된다. 그러나 스크립트의 설명(줄 586)과 Hook 설명(줄 494)은 "세션 시작 시"라고 되어 있다. state.json을 매번 읽어 컨텍스트를 출력하므로:
  - 매 프롬프트마다 동일한 컨텍스트 정보가 반복 주입되어 토큰 낭비
  - 사용자 경험 저하 (매번 같은 정보 출력)
- **수정 제안**:
  - A) 세션당 1회만 실행되도록 잠금 파일 메커니즘 추가:
    ```bash
    LOCK_FILE=".workflow/.context-injected"
    if [ -f "$LOCK_FILE" ]; then exit 0; fi
    # ... 컨텍스트 주입 ...
    touch "$LOCK_FILE"
    ```
  - B) 또는 `/workflow resume` 커맨드 실행 시에만 컨텍스트를 주입하고, Hook에서는 제거
  - C) `UserPromptSubmit` 대신 다른 시점의 Hook을 검토 (현재 Claude Code에서 세션 시작 Hook이 없다면 A 방식 채택)

### 이슈 6-2: `gear-detect.sh`의 키워드 기반 감지가 오탐 가능성 높음

- **위치**: 줄 519-549
- **문제**: 단순 `grep -qiE` 패턴 매칭으로 기어를 감지한다. "이 버그에 관한 기능을 추가해줘"처럼 여러 키워드가 섞인 프롬프트에서는 Gear 2와 Gear 3 키워드가 모두 매치되며, 먼저 매치된 Gear 2로 판단될 수 있다. 또한 이 Hook도 매 프롬프트마다 실행되지만, state.json이 이미 존재하면 early return하므로 실용적 문제는 적다.
- **수정 제안**:
  - 이 Hook은 참고 구현(reference implementation)이므로 실제 구현 시 LLM 기반 판단으로 대체할 수 있다는 점을 명시
  - 또는 키워드 우선순위를 명확히 하여 Gear 3 키워드가 있으면 Gear 2보다 우선하도록 로직 수정

---

## 7. feedback 배열 관리

### 이슈 7-1: feedback 배열에 정리 메커니즘이 없음

- **위치**: 줄 331-355 (feedback 스키마)
- **문제**: feedback 배열은 에스컬레이션, slice rework 등이 발생할 때마다 항목이 추가된다. 여러 차례 에스컬레이션이 반복되면 배열이 계속 증가하지만, 정리(cleanup/archival) 메커니즘이 정의되어 있지 않다. 이로 인해:
  - state.json 파일 크기가 증가하여 Hook 파싱 시간 영향
  - AI가 컨텍스트로 로드할 때 불필요한 과거 피드백까지 로드
  - `resolved` 상태의 feedback이 계속 남아 있음
- **수정 제안**:
  - A) resolved된 feedback은 `phase.history`에 요약본만 포함하고 feedback 배열에서 제거
  - B) Phase 전환 시 이전 Phase의 resolved feedback을 아카이브 (`feedback` → `feedbackArchive`)
  - C) 최대 개수 제한 (예: 직근 10개만 유지, 나머지는 아카이브)

### 이슈 7-2: reviewIssues 배열도 동일한 문제

- **위치**: 줄 272-287
- **문제**: `phase.reviewIssues` 배열도 리뷰할 때마다 이슈가 추가되지만 정리 메커니즘이 없다. Phase 전환 시 이전 Phase의 reviewIssues가 어떻게 되는지 정의되어 있지 않다 (남아 있는지, 초기화되는지).
- **수정 제안**: Phase 전환 시 reviewIssues 처리 정책 명시:
  - Phase 전환 시 resolved된 reviewIssues는 `phase.history`에 요약 포함 후 배열 초기화

---

## 8. 기타 발견 사항

### 이슈 8-1: Gear 2 미니멀 스키마에 context.loadOnResume이 없음 — resume 작동 불명확

- **위치**: 줄 408-432 (Gear 2 스키마) vs 줄 1211 (resume 흐름)
- **문제**: Section 11의 복원 흐름(줄 1211)에서 `context.loadOnResume` 파일 목록 로드가 2단계로 명시되어 있다. 그러나 Gear 2 미니멀 스키마(줄 408-432)에는 `context` 필드 자체가 없다. Gear 2에서 `/workflow resume`이 어떻게 동작하는지 불명확하다.
- **수정 제안**:
  - A) Gear 2 미니멀 스키마에 `context.loadOnResume` 추가 (최소한의 파일 목록)
  - B) 또는 resume 흐름 설명에 "Gear 2는 context 필드가 없으므로 state.json만 로드"라고 명시

### 이슈 8-2: `/workflow back` 매핑 테이블이 기어별 차이를 고려하지 않음

- **위치**: 줄 224-229
- **문제**: back 매핑 테이블은 모든 Phase에 대한 back 대상을 정의하지만, 기어별로 존재하지 않는 Phase에 대한 처리가 없다. 예를 들어, Gear 2에서는 Specify/Verify Phase가 없으므로 `back specify`가 불가능한데, 이에 대한 언급이 없다.
- **수정 제안**: 테이블에 "Gear 3-4 기준" 주석 추가. 또는 Gear 2에서의 back 동작을 별도 설명

### 이슈 8-3: Gear 2 미니멀 스키마의 `draftCount` — 사용 시점 불명확

- **위치**: 줄 425
- **문제**: Gear 2 미니멀 스키마에 `draftCount: 0`이 있다. 그러나 Gear 2는 Specify를 건너뛰고 Design(light)만 수행하는데, Design(light)은 "Plan Mode 메모"(줄 100) 수준이다. 이 경량 Design에서 draft-review 루프가 적용되는지 불명확하다.
- **수정 제안**:
  - Gear 2에서 draftCount가 사용되는 시나리오를 명시하거나
  - Gear 2 미니멀 스키마에서 draftCount를 제거

### 이슈 8-4: `phase-guard.sh`의 파일 경로 패턴이 하드코딩됨

- **위치**: 줄 572
- **문제**: `grep -qE "^(src|app|apps|lib)/"` — 프로젝트별로 소스 디렉토리 구조가 다를 수 있는데, 패턴이 하드코딩되어 있다. 예를 들어, `packages/`, `modules/`, `internal/` 등의 디렉토리를 사용하는 프로젝트에서는 guard가 작동하지 않는다.
- **수정 제안**:
  - A) `CLAUDE.md` 또는 `state.json`에서 소스 디렉토리 패턴을 읽도록 수정
  - B) 또는 이것이 참고 구현(reference)이라는 점을 명시하고, 프로젝트별 커스터마이즈가 필요하다고 안내

### 이슈 8-5: `slice-tracker.sh`의 커밋 메시지 파싱 패턴과 커밋 형식 불일치

- **위치**: 줄 625 vs 줄 875
- **문제**:
  - `slice-tracker.sh`(줄 625): `grep -oE '\[([A-Z]+-[0-9]+)\]'` — `[A-1]` 형식 기대
  - Implement Phase(줄 875): `feat({scope}): {desc} [Slice-ID]` — `[Slice-ID]`라고만 표기
  - 실제 Slice ID가 `A-1`, `B-2` 형식이므로 정규식 `[A-Z]+-[0-9]+`과 매치되나, `A-1`은 `[A-Z]+`(대문자 1글자 이상) + `-` + `[0-9]+`(숫자 1개 이상)이므로 `A-1`은 매치된다. 다만 커밋 형식 예시가 없어 실제 사용 시 혼란 가능.
- **수정 제안**: 줄 875에 구체적 커밋 메시지 예시 추가: `feat(notifications): Signal handler 연결 [A-2]`

### 이슈 8-6: Viewpoint 실행 방법의 기어 3 vs 기어 4 차이 — "에이전트 팀" 미정의

- **위치**: 줄 104 vs 줄 705-706
- **문제**: Section 2-3 테이블(줄 104)에서 Gear 4 Viewpoint 실행 방식이 "서브에이전트 또는 에이전트 팀"이라고 되어 있다. Section 8-0(줄 705)에서는 "독립된 세션(서브에이전트)으로 분리 실행"만 언급하고, "에이전트 팀" 방식은 정의되어 있지 않다.
- **수정 제안**: "에이전트 팀"이 무엇을 의미하는지 정의하거나, 줄 733의 "상세한 viewpoint 실행 방법은 ... 구현 시 정의"로 위임되어 있음을 줄 104에도 명시

### 이슈 8-7: `phase-guard.sh`에서 workflow_docs/ 경로가 허용 목록에 없음

- **위치**: 줄 571-576
- **문제**: phase-guard.sh는 Specify/Design 단계에서 `src|app|apps|lib` 경로의 Write/Edit을 차단한다. 그러나 Specify/Design 단계에서 `workflow_docs/` 아래에 문서를 작성해야 하는데, 이 경로는 차단 패턴에 포함되지 않으므로 문제는 없다. 다만, `test/` 또는 `tests/` 디렉토리에 대한 Write는 차단되지 않는데, Specify/Design에서 테스트를 작성하는 것이 허용되어야 하는지에 대한 정책이 없다.
- **수정 제안**: 의도한 동작이 맞다면 주석으로 "workflow_docs/, tests/ 등은 허용"을 명시

### 이슈 8-8: 변경 이력 테이블의 순서 모순

- **위치**: 줄 1001-1004 vs 줄 1009
- **문제**: 줄 1009에서 "변경 이력은 역순(최신이 위)"이라고 규칙을 명시하는데, 줄 1001-1004의 예시 테이블은 v2가 v1 위에 있어 역순이 맞다. 그러나 이 규칙이 `draftCount`와 연동되는 방식이 불명확하다. `draftCount`는 Phase별인데, 변경 이력은 문서 전체에 대한 것이므로 여러 Phase를 오가며 수정될 때 버전 번호가 혼란스러울 수 있다.
- **수정 제안**: 변경 이력의 "버전"이 draftCount와 동일한 것인지, 별도 카운터인지 명시. 또한 Phase 간 에스컬레이션으로 인한 재수정 시 버전 번호 체계를 정의

### 이슈 8-9: `.gitignore`에서 `state.json`만 무시하고 `.workflow/` 디렉토리 전체는 무시하지 않음

- **위치**: 줄 683-692
- **문제**: `.gitignore`에서 `.workflow/state.json`만 무시하고, `.workflow/history/`는 "선택적 보존"으로 주석 처리되어 있다. 그러나 디렉토리 구조(줄 665-668)에는 `.workflow/`가 "런타임 상태 (gitignored)"라고 적혀 있어 디렉토리 전체가 gitignore 대상인 것처럼 보인다. 실제 gitignore 설정과 설명이 불일치한다.
- **수정 제안**: 디렉토리 구조의 설명을 "런타임 상태 (state.json은 gitignored, history/는 선택적)"으로 수정

### 이슈 8-10: `/workflow abort` 후 state.json 처리 모순

- **위치**: 줄 122
- **문제**: `/workflow abort`는 "워크플로우 중단 + 아카이브 → history/ 이동"이라고 되어 있다. 그러나 abort된 워크플로우의 state.json을 history/로 이동한 후 `.workflow/state.json`이 없어지면, 이후 gear-detect.sh가 다시 활성화되어 새 워크플로우 시작을 안내하게 된다. 이것이 의도된 동작이라면 문제 없으나, abort 후 동일 feature를 재시작하는 시나리오가 정의되어 있지 않다.
- **수정 제안**: abort 후 동일 feature 재시작 시나리오 추가: "이전 시도의 context를 일부 활용할 수 있도록 history에서 참조 가능"

### 이슈 8-11: 상태 전이도에서 `reviewing → approved` 직접 전이 vs 설명 불일치

- **위치**: 줄 468-470
- **문제**: 상태 전이도에서 "문제 없음 또는 수정 완료 후 next → approved"로 표시되어 있다. "수정 완료 후 next"라는 표현은 needs_revision → (수정) → in_progress → reviewing → approved를 압축한 것인데, 전이도만 보면 reviewing에서 직접 approved로 가는 것처럼 보여 혼란을 줄 수 있다.
- **수정 제안**: 전이도에서 두 경로를 명확히 구분:
  ```
  reviewing ──(문제 없음)──> approved
  reviewing ──(문제 발견)──> needs_revision ──(수정)──> in_progress ──(next)──> reviewing
  ```

### 이슈 8-12: Section 10-1 예시에서 Implement 내부 루프 생략

- **위치**: 줄 1148
- **문제**: 예시에서 `사용자: /workflow next (Implement → Verify)`라고 한 줄로 처리되어 있지만, Section 3-2의 규칙에 따르면 Implement에서도 reviewing 단계를 거쳐야 한다 (1번째 next: reviewing, 통과 후 2번째 next: Verify 진입). 예시가 이 과정을 생략하고 있어, Implement Phase에서는 reviewing이 필요 없는 것처럼 보일 수 있다.
- **수정 제안**: 예시에 Implement의 reviewing 과정을 포함하거나, "간결함을 위해 reviewing 과정 생략"이라는 주석 추가

### 이슈 8-13: `context-inject.sh`의 출력 위치 — stdout vs stderr

- **위치**: 줄 601-607
- **문제**: `gear-detect.sh`(줄 535-546)는 메시지를 `>&2` (stderr)로 출력하고, `phase-guard.sh`(줄 573-574)도 `>&2`로 출력한다. 그러나 `context-inject.sh`(줄 601-607)는 `cat << EOF`로 stdout에 출력한다. Claude Code Hooks에서 stdout과 stderr의 역할이 다를 수 있으므로(stdout = AI에 주입되는 컨텍스트, stderr = 사용자에게 표시되는 메시지), 이 차이가 의도적인지 확인 필요하다.
- **수정 제안**: Claude Code Hooks의 stdout/stderr 처리 방식에 대한 주석을 각 스크립트에 추가하여, 의도된 출력 채널임을 명시

### 이슈 8-14: `/workflow next --force`가 Section 3-2에만 언급되고 status 전이 정의 없음

- **위치**: 줄 165, 174
- **문제**: `--force` 옵션은 "검토 결과를 무시하고 강제 진행"하며 "feedback에 force-skipped 기록"이라고 되어 있다. 그러나 이 경우 status 전이가 어떻게 되는지 정의되어 있지 않다. `needs_revision → approved`로 직접 가는지, `reviewing → approved`로 가는지 불명확하다. Section 4-2(줄 376-383)의 status 전이 표에도 --force 관련 전이가 없다.
- **수정 제안**: Section 4-2 status 전이 표에 --force 시 전이 경로 추가

### 이슈 8-15: `exitCriteria` 스키마 필드와 Phase별 Exit Criteria 불일치

- **위치**: 줄 255-270 (스키마 예시) vs 줄 763-778 (Specify Exit Criteria)
- **문제**: state.json 스키마(줄 255-270)의 `exitCriteria` 예시는 Specify Phase의 T1/T2 항목을 보여주지만, 필드명이 다르다:
  - 스키마의 `t1Items.requirementsNumbered` → Exit Criteria의 "모든 요구사항에 R-xxx ID 부여"
  - 스키마의 `t2Items.acMeasurable` → Exit Criteria의 "각 AC에 수치 기준 또는 GIVEN/WHEN/THEN 포함"
  - 대응 관계가 암묵적이며, T3는 `t3Checklist: []`로만 되어 있어 T3 항목이 어떻게 추적되는지 불명확
- **수정 제안**: 스키마의 필드명과 Exit Criteria 항목의 대응 관계를 명시하거나, 스키마가 Phase별로 동적으로 변한다면 그 규칙을 정의

---

## 요약

| 카테고리 | 이슈 수 | 심각도 높음 | 심각도 중간 | 심각도 낮음 |
|---------|---------|-----------|-----------|-----------|
| 1. 적용 범위 모순 | 4 | 2 (1-1, 1-2) | 2 (1-3, 1-4) | 0 |
| 2. 구조적 일관성 | 2 | 1 (2-1) | 1 (2-2) | 0 |
| 3. 용어 불일치 | 4 | 1 (3-1) | 2 (3-3, 3-4) | 1 (3-2) |
| 4. 흐름도 vs 텍스트 | 3 | 1 (4-3) | 2 (4-1, 4-2) | 0 |
| 5. Status 전이 vs 예시 | 3 | 2 (5-1, 5-2) | 1 (5-3) | 0 |
| 6. 실용성 문제 | 2 | 1 (6-1) | 1 (6-2) | 0 |
| 7. feedback 관리 | 2 | 1 (7-1) | 1 (7-2) | 0 |
| 8. 기타 | 15 | 3 (8-1, 8-3, 8-14) | 7 | 5 |
| **합계** | **35** | **12** | **17** | **6** |

### 우선 수정 권장 (심각도 높음)

1. **이슈 1-1**: Specify Exit Criteria의 Gear 2 적용 범위 — Phase 미진입인데 T1 적용 표기
2. **이슈 1-2**: Design Exit Criteria의 Gear 2 적용 — Design(light)과 T1 항목 불일치
3. **이슈 3-1**: "기어 1-2 무마찰 (상태 파일 없음)" — Gear 2는 상태 파일 있음
4. **이슈 4-3**: needs_revision 후 /workflow next 전이 경로 미정의
5. **이슈 5-1**: 예시의 status 전이가 규칙과 불일치
6. **이슈 5-2**: 예시에서 사용자 확인 vs /workflow next 트리거 혼동
7. **이슈 6-1**: context-inject.sh 매 프롬프트 실행 — 세션 1회면 충분
8. **이슈 7-1**: feedback 배열 무한 증가 — 정리 메커니즘 없음
9. **이슈 2-1**: Ship Phase에만 Exit Criteria/Viewpoint 없음 — 의도 불명확
10. **이슈 8-1**: Gear 2 resume 작동 불명확 — context.loadOnResume 없음
11. **이슈 8-3**: Gear 2 스키마의 draftCount 사용 시점 불명확
12. **이슈 8-14**: --force 시 status 전이 미정의
