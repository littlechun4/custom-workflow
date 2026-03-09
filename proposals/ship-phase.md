# Ship 단계 정의서 (Deliver)

> 작성: 2026-03-09
> 목적: Ship 단계의 역할, 프로세스, 확장 포인트 정의
> 기어: 3단 (10+ 파일, 아키텍처급) 기준 최대치 설계
> 문서 보존: CLAUDE.md 업데이트 + state.json 아카이브

---

## 산출물 위치

```
CLAUDE.md                          # 학습 패턴 기록 (업데이트)
.workflow/history/{slug}.json      # state.json 아카이브
(확장) PR                           # Pull Request
```

---

## 1. 역할 정의

**"정리하고, 기록하고, 완료한다."**

- 워크플로우 학습 패턴을 CLAUDE.md에 기록
- state.json을 history/로 아카이브
- 확장 활성화 시: PR 생성, CI 확인, 이슈 트래커 동기화

## 2. 완료 방식

**Ship은 다른 Phase와 다르다.** 진입과 동시에 프로세스를 자동 실행하고 완료한다.

- `/workflow next` 불필요
- 별도 전환 조건 / Viewpoint 없음
- 품질 검증은 Verify에서 이미 완료됨
- 리뷰/반복 다듬기 없음 — 자동 실행 후 종료

### 재진입

확장(PR/CI) 실패로 back한 뒤 수정→Verify 재통과→Ship 재진입 시, **전체 프로세스를 처음부터 재실행**한다.

- CLAUDE.md 업데이트: 수정 과정에서 새 학습이 있을 수 있으므로 재확인 (멱등적 — 이미 기록된 내용은 중복 추가하지 않음)
- PR: `gh pr edit`으로 기존 PR 업데이트 (새 PR 생성 안 함)
- CI: 업데이트된 PR로 재실행
- 아카이브: 최종 성공 시에만 실행

## 3. 프로세스

### 전체 흐름

```
[Verify approved] ──[/workflow next]──→ Ship 진입
  │
  ├─ 1. CLAUDE.md 업데이트 (학습 패턴 기록)
  ├─ 2. (확장: PR) PR 생성 또는 업데이트
  ├─ 3. (확장: CI) CI 통과 확인
  ├─ 4. (확장: 이슈 트래커) 이슈 상태 전환
  ├─ 5. state.json → .workflow/history/{slug}.json 아카이브 + 삭제
  │
  └─ 워크플로우 완료
```

**아카이브는 항상 마지막 스텝**이다. 확장(PR/CI) 실패 시 back이 필요하므로, state.json은 모든 프로세스가 성공한 뒤에만 삭제한다. 확장이 비활성이면 1→5 순서로 실행.

### 3-1. CLAUDE.md 업데이트

이번 워크플로우에서 학습한 패턴을 CLAUDE.md에 기록:

- 새로 발견한 코드베이스 패턴 (참조 패턴으로 활용 가능)
- 기술적 결정 사항 (ADR이 있으면 링크)
- 주의사항/함정 (다음 작업 시 참고)

**기록 기준:**
> "다음에 비슷한 기능을 구현할 때 알아두면 좋은가?"
> → Yes: 기록
> → No: 생략

### 3-2. (확장) PR 생성

PR 확장이 비활성이면 스킵.

활성화 시:

```bash
gh pr create \
  --title "feat: {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
{Spec 요약 — 1-3문장}

## Changes
{슬라이스별 변경 요약}

## Design Doc
- Spec: workflow_docs/spec/{feature}.md
- Design: workflow_docs/design/{feature}.md

## Test Plan
{Verify Phase 결과 요약}

## References
- Jira: {SAAS-42} (연결된 경우)
EOF
)"
```

**규칙:**
- PR 생성 후 `state.json`의 `feature.pr`에 PR URL 기록
- Ship 재진입 시 `gh pr edit`으로 기존 PR 업데이트 (새 PR 생성 안 함)
- `gh` (GitHub CLI) 기준. GitLab(`glab`) 등 다른 플랫폼도 동일한 확장 포인트에서 대체 가능

### 3-3. (확장) CI 통과 확인

CI 확장이 비활성이면 Verify Phase의 로컬 검증이 최종 품질 게이트.

활성화 시:
- PR 생성 후 CI 파이프라인 통과 대기
- **CI 실패 시 복귀**: `gh pr ready --undo`로 PR을 draft 전환 후 `/workflow back verify` 또는 `/workflow back implement`로 복귀하여 원인 해결
- Ship 재진입 시 기존 PR 업데이트

### 3-4. (확장) 이슈 트래커 동기화

`feature.jira`가 설정된 경우에만 동작:

| 워크플로우 이벤트 | 이슈 트래커 전환 |
|---|---|
| Ship Phase (PR 활성) | In Progress → In Review |
| Ship Phase (PR 비활성) | In Progress → Done |
| PR merge 후 | In Review → Done |

PR 확장이 비활성이면 "In Review" 단계 없이 바로 Done으로 전환한다.

### 3-5. state.json 아카이브

```
.workflow/state.json → .workflow/history/{slug}.json
```

- 완료된 워크플로우의 전체 이력 보존
- 향후 유사 기능 구현 시 참조 가능
- **모든 프로세스(핵심 + 확장) 성공 후** 아카이브 + state.json 삭제
- 삭제 후 다음 `/workflow start` 대기 상태

---

## 4. 금지사항

| 금지 | 이유 | 대처 |
|------|------|------|
| 코드 수정 | Implement 영역 | `/workflow back implement` |
| 테스트 수정/추가 | Implement 영역 | `/workflow back implement` |
| 요구사항/설계 변경 | Specify/Design 영역 | `/workflow back specify` 또는 `/workflow back design` |
| 검증 재실행 | Verify 영역 | `/workflow back verify` |

**핵심 원칙**: Ship은 **정리와 전달**만 한다. 문제 발견 시 해당 Phase로 back.

## 5. CI 실패 시 복귀 흐름

```
Ship 진입 → PR 생성 → CI 실행
  │
  ├─ CI 통과 → 아카이브 → 워크플로우 완료
  │
  └─ CI 실패
       ├─ gh pr ready --undo (PR → draft)
       ├─ 원인 분석
       │   ├─ 검증 실패 (테스트/린트/타입) → /workflow back verify
       │   ├─ 코드 문제 → /workflow back implement
       │   ├─ 설계 문제 → /workflow back design
       │   └─ 환경 문제 → CI 설정 수정 후 Ship 재진입
       └─ 해당 Phase에서 수정 → Verify 재통과 → Ship 재진입
           → 전체 프로세스 재실행 (§2 재진입 참조)
```

**`back` 타겟 선택 기준:**
- `back verify`: CI에서 발견된 문제가 로컬 검증 누락인 경우 (Verify에서 재검증)
- `back implement`: 코드 수정이 필요한 경우
- `back design`/`back specify`: 설계/요구사항 수준의 문제인 경우

---

## 6. 확장 활성화 설정

확장 기능의 활성화는 프로젝트의 CLAUDE.md 또는 `.claude/settings.json`에서 설정:

| 확장 | 기본값 | 설명 |
|------|--------|------|
| PR 생성 | 비활성 | Ship에서 `gh pr create` 실행 |
| CI 확인 | 비활성 | PR 생성 후 CI 통과 대기 |
| 이슈 트래커 | 비활성 | Jira/Linear 등 상태 전환 |

> 브랜치 전략은 `/workflow start` 시점의 확장이며, Ship과 무관하다. orchestrator §12-6 참조.

비활성 시 Ship은 CLAUDE.md 업데이트 + state.json 아카이브만으로 완료.

---

## 7. 소요 시간

- **핵심만**: 1~2분 (CLAUDE.md 업데이트 + 아카이브)
- **PR 확장**: +2~5분 (PR 생성 + 본문 작성)
- **CI 확장**: +CI 파이프라인 실행 시간 (프로젝트 의존)

---

## 8. Ship 체크리스트

### 프로세스 순서대로

- [ ] CLAUDE.md에 학습 패턴이 기록되었는가?
- [ ] (확장: PR) PR이 생성(또는 업데이트)되었는가?
- [ ] (확장: PR) PR 본문에 Spec/Design 문서 링크가 포함되어 있는가?
- [ ] (확장: PR) PR 본문에 Verify 결과 요약이 포함되어 있는가?
- [ ] (확장: CI) CI 파이프라인이 통과했는가?
- [ ] (확장: CI) CI 실패 시 적절한 Phase로 back했는가?
- [ ] (확장: 이슈 트래커) 이슈 상태가 전환되었는가?
- [ ] state.json이 `.workflow/history/`에 아카이브되었는가? ← **마지막**
- [ ] 활성 state.json이 삭제되었는가?

---

## 요약

> **Ship은 "정리하고, 기록하고, 완료"한다.**
> 진입과 동시에 자동 실행 — `/workflow next` 불필요.
> 핵심은 CLAUDE.md 업데이트 + 아카이브. 확장으로 PR/CI/이슈 트래커 연동.
