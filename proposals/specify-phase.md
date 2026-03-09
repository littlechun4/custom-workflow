# Specify 단계 정의서 (What)

> 작성: 2026-03-05
> 목적: Specify 단계의 역할, 활동, 템플릿, 경계 규칙 정의
> 기어: 3단 (10+ 파일, 아키텍처급) 기준 최대치 설계
> 문서 보존: git에 영구 보존

---

## 산출물 위치

```
workflow_docs/
├── spec/{feature-name}.md      # Specify 산출물 (What)
```

---

## 1. 역할 정의

**"무엇을, 왜, 어디까지"를 확정한다.**

- 기능의 범위와 제약사항 명시
- 검증 가능한 완료 기준(AC) 정의
- 코드 0줄 상태에서 진행 — 설계 결정은 다음 단계

## 2. 구체적 활동

| 활동 | 주체 | 설명 |
|------|------|------|
| 문제 정의 | 인간 | 이 기능이 왜 필요한가 (1-3문장) |
| AI 인터뷰 | AI가 질문, 인간이 답변 | 5개 항목 인터뷰로 요구사항 구조화 |
| 요구사항 정리 | 인간+AI | 검증 가능한 목록화 |
| 입출력 예시 | AI 제안, 인간 선별 | 구체적 데이터로 행동 명시 |
| 엣지 케이스 나열 | AI가 제안, 인간 선별 | 경계 조건, 예외 식별 |
| 비범위 명시 | 인간 결정 | "이번에 하지 않을 것" 선언 |
| 인수 기준(AC) 정의 | 인간+AI | 기능 완료 시 통과 기준 |

## 3. 리뷰 및 반복 다듬기 (Iterative Refinement)

### 전체 흐름

```
in_progress ──[/workflow next]──→ reviewing
   ▲                                │
   │                    ┌───────────┴───────────┐
   │                    │                       │
   │           AI 자동 검토                인간 리뷰 단계
   │           (auto-gate +              (산출물 직접 확인)
   │            viewpoint)                      │
   │                    │               human-review 작성
   │                    │                       │
   │              이슈 발견?             open 리뷰 있음?
   │              ↓Yes   ↓No            ↓Yes      ↓No
   │         needs_revision  ──→  인간 리뷰 대기   │
   │              │                     │    인간 "승인" 발화
   │              │                     │         │
   └──────────────┘                     │         ▼
        (AI 수정,                        │     approved
         draftCount++)                  │         │
              ▲                         │    [/workflow next]
              └─────────────────────────┘         │
                  (AI가 리뷰 반영,                  ▼
                   draftCount++)             다음 Phase
```

### 단계별 설명

**1단계: AI 자동 검토** (`/workflow next` 시 자동 실행)

- **자동 게이트**: 구조/형식 체크리스트 기계적 검증 (미충족 시 차단)
- **Viewpoint 리뷰**: 자동 게이트 통과 후 관점별 질적 검토
- 이슈 발견 → `needs_revision` → AI가 수정 → `in_progress` → 재검토
- 이슈 없음 → 인간 리뷰 대기

**2단계: 인간 리뷰** (AI 검토 통과 후)

- 인간이 산출물을 직접 읽고 인라인 코멘트 작성
- open 리뷰가 있는 상태에서 `/workflow next` → AI가 리뷰 반영 → `in_progress` (draftCount++)
- open 리뷰가 없고 인간이 "승인" → `approved`

**승인 권한**: `approved`는 인간만 줄 수 있다. AI는 이슈 유무를 보고할 뿐, 승인하지 않는다.

### 인라인 인간 리뷰 형식

**마커:**
```markdown
<!-- human-review: {대상} | {코멘트} -->
```

**대상**은 AC ID, 섹션명, 또는 자유 텍스트:

```markdown
- [ ] [R-2] 로그인 실패 시 명확한 에러 메시지가 표시된다
<!-- human-review: R-2 | "명확한"이 모호함. "이메일 또는 비밀번호가 잘못되었습니다" 수준의 구체성 필요 -->

## In Scope / Out of Scope
<!-- human-review: scope | 비밀번호 재설정은 Out of Scope에 명시해야 하지 않나? -->

## 제약사항
<!-- human-review: C-2 | 200ms가 P95인지 P99인지 명시 필요 -->
```

**AI 처리 규칙:**
1. `/workflow next` 실행 시 `<!-- human-review: -->` (open) 태그를 전수 수집
2. 각 리뷰를 반영하여 문서 수정
3. 반영 완료된 리뷰는 `resolved`로 변환:
   ```markdown
   <!-- human-review-resolved: R-2 | "명확한"이 모호함 → "이메일 또는 비밀번호 오류 메시지 표시"로 구체화 -->
   ```
4. 원본 코멘트 보존 + 해결 내용 `→` 뒤에 append
5. `draftCount` 증가 + `status: in_progress`로 전환

**인간 재오픈:** resolved가 불만족이면 `human-review-resolved`를 `human-review`로 되돌리면 됨.

**게이트 규칙:**
- `<!-- human-review: -->` (open)이 1개라도 있으면 → **승인 불가**
- `<!-- human-review-resolved: -->` 만 남아있으면 → 승인 가능

### draftCount 상한

```
draftCount ≤ 2: 정상 범위
draftCount = 3: 경고 — "3회째 초안입니다. 근본 원인을 먼저 파악하세요."
draftCount ≥ 4: 인터럽트 — 다음 중 선택 필요:
  A) /workflow next --force   (현재 상태로 강제 진행, feedback에 기록)
  B) /workflow abort          (기능 범위 축소 후 재시작)
```

### status 전이 요약

| 현재 status | 트리거 | 다음 status |
|-------------|--------|------------|
| `in_progress` | `/workflow next` | `reviewing` (AI 검토 시작) |
| `reviewing` | AI 이슈 발견 | `needs_revision` |
| `reviewing` | AI 이슈 없음 | `reviewing` (인간 리뷰 대기) |
| `needs_revision` | AI 수정 완료 | `in_progress` (draftCount++) |
| `reviewing` | 인간이 human-review 작성 + `/workflow next` | `in_progress` (AI 반영, draftCount++) |
| `reviewing` | 인간 "승인" (open 리뷰 0개) | `approved` |
| `approved` | `/workflow next` | 다음 Phase 전환 |

---

## 4. 금지사항 (Specify 침범 방지)

| 금지 | 이유 | 올바른 표현 |
|------|------|------------|
| 기술 스택 결정 | Design 영역 | "Django REST Framework로" ❌ → "JSON으로 조회" ✅ |
| 파일/함수명 지정 | Design 영역 | "views.py에 구현" ❌ → "고객 목록 페이지" ✅ |
| 라이브러리 선택 | Design 영역 | "Celery로 비동기" ❌ → "발송이 응답을 차단하지 않아야" ✅ |
| 코드 작성 | Implement 영역 | 어떤 형태든 ❌ |
| 내부 구조 설계 | Design 영역 | "Redis 캐시 사용" ❌ → "응답 200ms 이내" ✅ (제약사항) |

## 5. AC 형식: 하이브리드 추천

**세 가지 요소의 조합:**

1. **요구사항 (Requirement) — 체크리스트**
   ```markdown
   - [ ] [R-1] 사용자가 이메일+비밀번호로 로그인할 수 있다
   - [ ] [R-2] 로그인 실패 시 명확한 에러 메시지가 표시된다
   ```
   - Verify 단계에서 체크리스트로 대조 (O/X)

2. **인수 기준 (Acceptance Criteria) — 입출력 예시**
   ```markdown
   ### 정상 로그인
   - 입력: user@example.com / password123
   - 기대 결과: JWT 토큰 발급, 대시보드로 리다이렉트
   - 검증: 응답 헤더에 authorization 포함, 상태 200

   ### 잘못된 비밀번호
   - 입력: user@example.com / wrongpass
   - 기대 결과: 401 에러 + "이메일 또는 비밀번호가 잘못되었습니다"
   - 검증: 에러 메시지 명시, 토큰 미발급
   ```
   - 테스트 작성자가 직접 테스트 데이터로 활용 (Python dict로 변환 가능)

3. **선택적: GIVEN/WHEN/THEN (복잡한 비즈니스 규칙만)**
   ```markdown
   GIVEN 5회 연속 로그인 실패 후
   WHEN 6번째 로그인을 시도하면
   THEN 계정이 잠기고 "계정이 잠겼습니다. 관리자 연락" 메시지 표시
   ```

## 6. 비기능 요구사항(NFR): 조건부 포함

**Spec에 포함 여부 판별:**

| 요구사항                   | 포함  | 이유                       |
| ---------------------- | --- | ------------------------ |
| "응답 시간 200ms 이내"       | ✅   | 사용자 체감, 검증 가능 → **제약사항** |
| "REST API로 제공"         | ✅   | 외부 인터페이스 계약 → **제약사항**   |
| "GDPR 준수 필수"           | ✅   | 규정 요구 → **제약사항**         |
| "Redis 캐시 TTL 300초"    | ❌   | 기술적 구현 → Design          |
| "bcrypt salt round 12" | ❌   | 기술적 구현 → Design          |

**제약사항 섹션 (선택적):**
```markdown
## 제약사항 (Constraints)
- [C-1] REST API로 제공 (기존 프론트엔드 호환)
- [C-2] 응답 시간 200ms 이내
- [C-3] 기존 PostgreSQL DB 사용 (신규 DB 도입 불가)
```

## 7. Jira와의 관계

- **Specify는 Jira 이슈의 상세 전개판**
- Jira에 AC를 중복 작성하지 않음 (단일 원천: Specify)
- Spec 문서 상단에 `이슈: JIRA-123` 링크만 명시
- Jira 이슈 코멘트에 `@workflow_docs/spec/{feature}.md` 링크

## 8. 소요 시간

- **10~30분** (대화형, 기어 3 기준)
- 인터뷰 + 문서 작성 포함
- 30분 초과 시 → 기능 범위 너무 큼 (분할 검토)

---

## 9. Specify ↔ Design 경계 판단

### 회색 지대: 3단계 판단 기준

```
1단계: 대체 가능성 테스트
  "이 기술/방법을 다른 것으로 바꿔도 사용자 경험이 동일한가?"
  → Yes: Design (구현 수단)
  → No: Spec (본질적 요구사항)

2단계: 소비자 범위 테스트
  "이 결정의 영향이 팀 외부(사용자, 외부 시스템)에 미치는가?"
  → Yes: Spec (외부 계약/제약)
  → No: Design (내부 기술 결정)

3단계: 검증 가능성 테스트
  "이것을 테스트/측정으로 검증할 수 있는 목표인가?"
  → 목표 자체: Spec (성공 기준)
  → 달성 수단: Design (기술 선택)
```

**구체적 사례:**

| 표현 | 판정 | 근거 |
|------|------|------|
| "JWT 인증을 사용한다" | 상황에 따라 다름 | 외부 시스템 요구사항이면 Spec 제약, 팀 선택이면 Design |
| "실시간(3초 이내)으로 알림 전달" | Spec | 사용자 체감 목표 |
| "WebSocket으로 실시간 구현" | Design | 달성 수단 (SSE, 폴링으로 대체 가능) |
| "REST API로 제공" | Spec | 외부 소비자 인터페이스 계약 |
| "500ms 이내 응답" | Spec | 검증 가능한 성능 요구사항 |
| "Redis 캐싱으로 성능 개선" | Design | 달성 수단 |
| "PostgreSQL 사용" | 보통 Spec | 기존 시스템 제약 (C1) |

---

## 10. 문서 업데이트 정책 (구현 중)

### Must Update (반드시 Spec 수정)

| 상황 | 이유 | 업데이트 대상 |
|------|------|-------------|
| 요구사항 자체 변경 | Spec이 거짓말하면 Verify가 의미 없음 | Spec의 요구사항/AC |
| 비범위가 범위로 편입 | 범위 추적 안 되면 무한 확장 | Spec 요구사항으로 이동 |
| 새로운 기술 제약 발견 | 후속 작업에 영향 | Spec 제약사항 추가 |

### Skip Update (그냥 진행)

| 상황 | 이유 |
|------|------|
| 함수명/변수명이 다름 | 코드가 진실의 원천, 문서는 방향만 |
| 테스트 케이스 추가/변경 | 테스트 코드 자체가 문서 |

**판단 기준:**
> "Verify 단계에서 이 차이가 '이게 뭐지?'를 유발하는가?"
> → Yes: 즉시 문서 수정 (구현 중단 → 문서 수정 → 구현 재개)
> → No: 구현 계속

**실무 방식:**
1. 구현 중: `<!-- TODO: update spec R-2 -->` 주석으로 표시만
2. 구현 완료 후: AI에게 "TODO 주석을 찾아서 실제 구현과 동기화"
3. Verify 전: 모든 문서 최신 상태 보장

---

## 11. 템플릿

**status 값 설명:**

| status | 의미 |
|--------|------|
| `in_progress` | 작성 중 또는 리뷰 반영 수정 중 |
| `reviewing` | AI 자동 검토 중 또는 인간 리뷰 대기 |
| `needs_revision` | AI 검토에서 이슈 발견, 수정 필요 |
| `approved` | 인간 승인 완료, 다음 Phase 진행 가능 |

```markdown
# Spec: {기능 이름}
<!-- workflow: specify | draftCount: 1 | status: in_progress -->

> 작성일: {YYYY-MM-DD}
> 이슈: {JIRA-123 또는 링크}

---

## 문제 (Problem)

{이 기능이 왜 필요한가. 1-3문장.}

## 요구사항 (Requirements)

- [ ] [R-1] {검증 가능한 요구사항}
<!-- human-review: R-1 | {인간 리뷰 코멘트 예시 — 실제 작성 시 이 줄 삭제} -->
- [ ] [R-2] {검증 가능한 요구사항}
- [ ] [R-3] ...

## 인수 기준 (Acceptance Criteria)

### {시나리오 이름}
- 입력: {구체적 데이터/상태}
- 기대 결과: {구체적 결과}
- 검증 방법: {어떻게 확인하는가}

### {시나리오 이름}
- 입력: {구체적 데이터/상태}
- 기대 결과: {구체적 결과}
- 검증 방법: {어떻게 확인하는가}

## 엣지 케이스

| 상황 | 기대 동작 |
|------|----------|
| {예외 상황 1} | {어떻게 처리} |
| {예외 상황 2} | {어떻게 처리} |

## In Scope / Out of Scope

**In Scope**:
- {이번에 구현할 것}

**Out of Scope**:
- {이번에 하지 않을 것 1}
- {이번에 하지 않을 것 2}

## 제약사항 (Constraints) — 해당 시만

- [C-1] {외부 제약 1}
- [C-2] {외부 제약 2}

---
## 변경 이력

| 버전 | 날짜 | 변경 내용 | 변경 사유 |
|------|------|----------|----------|
| v1 | {YYYY-MM-DD} | 최초 작성 | — |
```

---

## 12. Specify 체크리스트

### 작성 품질 (auto-gate)

- [ ] 요구사항에 [R-1], [R-2]... (R-xxx 형식) ID 부여
- [ ] 각 요구사항이 체크리스트 형태 (검증 가능한가?)
- [ ] 모든 R-xxx에 AC가 최소 1개 이상 매핑되어 있는가?
- [ ] AC가 입출력 예시 형태 (테스트로 변환 가능한가?)
- [ ] `[TBD]`, `[미정]`, `[TODO]` 문자열이 없는가? (미결정 사항 금지)
- [ ] "In Scope / Out of Scope" 섹션이 존재하는가?
- [ ] 비기능 요건 최소 1개 (성능/보안/가용성)가 명시되어 있는가?
- [ ] 기술 용어가 섞여있지 않은가? (금지사항 체크)

### 리뷰 완료 (승인 전)

- [ ] `<!-- human-review: -->` (open) 태그가 0개인가?
- [ ] 인간이 명시적으로 "승인"했는가?

---

## 13. 문서 간 참조 방식

**Spec의 요구사항에 ID 부여:**
```markdown
## 요구사항 (Spec)
- [ ] [R-1] 사용자는 이메일+비밀번호로 로그인할 수 있다
- [ ] [R-2] 로그인 실패 시 에러 메시지
- [ ] [C-1] REST API로 제공 (외부 계약)

## 제약사항
- [C-1] REST API로 제공
```

**기능 간 의존성 참조:**
```markdown
### 의존성
- 선행: [사용자 인증](workflow_docs/spec/auth-system.md) — 로그인 API 필요
- 후속: [이메일 발송](workflow_docs/spec/email-service.md) — 알림 채널로 사용
```

---

## 요약

> **Specify는 "무엇을, 왜, 어디까지"를 정의한다.**
> AC-ID 태깅(R-xxx, C-xxx)으로 Design 단계와의 추적 가능성을 확보한다.
