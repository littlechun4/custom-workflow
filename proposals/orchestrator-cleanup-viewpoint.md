# Viewpoint-Exit Criteria 관계 재구조화 제안서

> **대상 문서**: `proposals/orchestrator-recommended.md`
> **작성일**: 2026-03-06
> **목적**: Viewpoint와 Exit Criteria(T1/T2/T3)의 중복을 제거하고, 각 레이어의 역할을 명확히 분리

---

## 1. 변경 원칙

현재 문서의 문제:
- "핵심 viewpoint"(구조 완전성, 명확성/측정 가능성 등)가 T1/T2 exit criteria와 거의 동일한 내용을 검토 → **이중 검사**
- "핵심/확장 viewpoint" 구분이 실제로는 "T1/T2와 겹치는 것 vs 진짜 독립 관점"의 구분에 불과

**새 구조**:

| 레이어 | 역할 | 실행 시점 | 실행 방식 |
|--------|------|----------|----------|
| **T1 (기계적 gate)** | 구조/형식 자동 검증 | viewpoint 실행 전, 항상 | 자동 스크립트/체크리스트, 관점 무관 |
| **Viewpoint (질적 검토)** | 독립된 전문 관점으로 질적 평가 | T1 통과 후 | 기어/컨텍스트에 따라 선택적 활성화, 서브에이전트 |
| **T3 (인간 판단)** | 비즈니스/아키텍처 수준 인간 sign-off | viewpoint 완료 후 | 기어 4 전용, 인간 수동 |

- 기존 T2("AI 판단/권고")는 → **viewpoint의 산출물**로 흡수. T2라는 별도 레이어 제거.
- Viewpoint가 발견한 이슈는 blocking/non-blocking으로 분류 (기존 T1/T2 역할을 viewpoint 내부에서 자체 판단).

---

## 2. 수정 항목 목록

### 2-1. Section 2-3 기어에 따른 산출물 테이블 (line 96~105)

**현재 내용** (line 103-104):
```markdown
| Viewpoint 범위   | X    | X            | 핵심 viewpoint             | 핵심 + 확장 viewpoint            |
| Viewpoint 실행   | X    | X            | 서브에이전트 (2개+ 시 분리)   | 서브에이전트 또는 에이전트 팀         |
```

**수정 제안**:
```markdown
| Viewpoint        | X    | X            | 컨텍스트 해당 viewpoint     | 전체 viewpoint 카탈로그          |
| Viewpoint 실행   | X    | X            | 서브에이전트 (2개+ 시 분리)   | 서브에이전트 또는 에이전트 팀         |
```

**변경 이유**: "핵심/확장" 구분을 제거. 기어 3은 컨텍스트 필터링으로 해당하는 viewpoint만 활성화, 기어 4는 카탈로그 전체를 대상으로 필터링.

---

### 2-2. Section 3-2 `/workflow next` 출력 예시 (line 149~166)

**현재 내용** (line 151~166):
```
[workflow] SPECIFY 자체 검토 중... (T1 + T2 적용)

■ T1 구조 체크 (자동 / 미충족 시 차단):
  [v] 요구사항 R-1~R-4 존재
  [v] In Scope / Out of Scope 섹션 존재
  [✗] R-3에 AC 없음                            ← 차단
  [v] 비기능 요건 존재 (응답 시간 200ms)

■ T2 내용 체크 (AI 판단 / 권고):
  [v] 행위자(Actor) 식별됨
  [!] R-2의 "빠른 응답" — 수치 없음           (권고)
  [!] 에러 시나리오 (네트워크 실패) 미명시     (권고)

T1 차단 항목이 있습니다. R-3에 AC를 추가한 후 /workflow next 를 다시 실행하세요.
T2 권고 항목은 /workflow next --force 로 override 가능합니다.
```

**수정 제안**:
```
[workflow] SPECIFY 자체 검토 중...

■ T1 Gate (자동 / 미충족 시 차단):
  [v] 요구사항 R-1~R-4 존재
  [v] In Scope / Out of Scope 섹션 존재
  [✗] R-3에 AC 없음                            ← 차단
  [v] 비기능 요건 존재 (응답 시간 200ms)

T1 차단 항목이 있습니다. R-3에 AC를 추가한 후 /workflow next 를 다시 실행하세요.

── T1 통과 시에만 아래 Viewpoint 검토 실행 ──

■ Viewpoint 검토 (활성: 기술 실현성, 사용자 시나리오):
  [기술 실현성] R-5 외부 API 응답 시간 제약 미명시 (blocking)
  [사용자 시나리오] 에러 시나리오 (네트워크 실패) 미명시 (non-blocking)

blocking 이슈가 있습니다. 해결 후 /workflow next 를 다시 실행하세요.
non-blocking 이슈는 /workflow next --force 로 override 가능합니다.
```

**변경 이유**: T1 gate → Viewpoint 질적 검토의 순차적 흐름을 출력에서도 명확히 표현. T2 레이어를 viewpoint 검토로 대체.

---

### 2-3. Section 8-0 Viewpoint 기반 리뷰 (line 698~733)

**현재 내용** (line 700~733):
```markdown
각 Phase의 리뷰(`/workflow next` → reviewing)에서 적용할 **검토 관점(viewpoint)**을 정의한다.

**원칙**:
1. **포괄적 정의** — Phase별 viewpoint를 최대한 넓게 정의한다
2. **선택적 활성화** — feature 특성에 따라 해당하는 viewpoint만 활성화 (프론트 없는 기능이면 프론트 viewpoint 제외)
3. **독립 실행** — 활성화된 viewpoint가 2개 이상이면 각각 독립된 세션(서브에이전트)으로 분리 실행. 단일 세션에서 순차 적용하지 않음
4. **기어 연동** — 기어 3은 핵심 viewpoint만, 기어 4는 확장 viewpoint까지

**순차 적용을 하지 않는 이유**:
- 앞 관점의 컨텍스트가 뒤 관점의 판단을 오염
- 컨텍스트 윈도우 낭비
- 관점 간 독립성 훼손으로 편향된 검토

**선택 흐름**:
(... 기어 필터링 포함 플로우 ...)

**Viewpoint vs Exit Criteria**:
- **Viewpoint** = 검토 렌즈 (어떤 관점으로 보는가)
- **Exit Criteria** = 통과 조건 (T1/T2/T3 체크리스트)
- 각 viewpoint가 발견한 이슈는 T1/T2/T3로 분류되어 exit criteria에 반영
```

**수정 제안**:
```markdown
각 Phase의 리뷰(`/workflow next` → reviewing)는 3단계로 실행된다.

**리뷰 흐름**:
```
1. T1 Gate (기계적 검증)
   → 구조/형식 자동 체크. 관점 무관. 미충족 시 차단.
   → T1 실패 시 viewpoint 검토를 실행하지 않음 (불필요한 비용 방지)

2. Viewpoint 질적 검토 (T1 통과 후)
   → 활성화된 viewpoint별 독립 세션(서브에이전트)에서 질적 검토
   → 각 viewpoint가 발견한 이슈를 blocking / non-blocking으로 분류
   → blocking 이슈 존재 시 차단, non-blocking은 --force로 override 가능

3. T3 인간 판단 (기어 4 전용, viewpoint 완료 후)
   → 비즈니스/아키텍처 수준 인간 sign-off
```

**원칙**:
1. **T1과 viewpoint는 역할이 다르다** — T1은 "형식이 갖춰졌는가" (기계적), viewpoint는 "내용이 충분한가" (질적)
2. **선택적 활성화** — feature 특성과 기어에 따라 해당하는 viewpoint만 활성화
3. **독립 실행** — 활성화된 viewpoint가 2개 이상이면 각각 독립된 세션(서브에이전트)으로 분리 실행
4. **이슈 분류** — viewpoint가 발견한 이슈는 blocking(차단) / non-blocking(권고)으로 분류. T1/T2라는 별도 라벨 불필요.

**순차 적용을 하지 않는 이유**:
- 앞 관점의 컨텍스트가 뒤 관점의 판단을 오염
- 컨텍스트 윈도우 낭비
- 관점 간 독립성 훼손으로 편향된 검토

**선택 흐름**:
```
Phase 전체 viewpoint 카탈로그
       │
       ▼
 컨텍스트 필터링 (feature 특성에 해당하는 것만)
 예: 프론트 없는 기능 → UI/접근성 viewpoint 제외
       │
       ▼
 기어 필터링 (기어 3: 컨텍스트 해당만 / 기어 4: 전체 카탈로그)
       │
       ▼
 활성 viewpoint 수 → 1개: 단일 세션 / 2개+: 분리 실행
```
```

**변경 이유**:
- "Viewpoint vs Exit Criteria" 관계를 "Viewpoint = 검토 렌즈" vs "Exit Criteria = T1/T2/T3"로 설명하던 것을 → T1 gate → Viewpoint → T3 인간 판단의 **순차 파이프라인**으로 재정의
- 기존 T2의 역할이 viewpoint로 흡수됨을 명확화
- "핵심/확장" 구분 제거. 기어 3/4의 차이는 필터링 강도의 차이로 표현

---

### 2-4. Section 8-1 Specify Phase — Exit Criteria & Viewpoint 카탈로그 (line 759~791)

#### 2-4-a. 기어별 적용 범위 행 (line 761)

**현재 내용**:
```
기어별 적용 범위: `Gear 1 = 없음` | `Gear 2 = T1만` | `Gear 3 = T1+T2` | `Gear 4 = T1+T2+T3`
```

**수정 제안**:
```
기어별 적용 범위: `Gear 1 = 없음` | `Gear 2 = T1만` | `Gear 3 = T1 + Viewpoint` | `Gear 4 = T1 + Viewpoint + T3`
```

#### 2-4-b. T2 섹션 제거 (line 771~776)

**현재 내용**:
```markdown
**T2 — 내용 체크 (AI 판단 / 권고, `--force`로 override 가능)**:
- [ ] 각 AC에 수치 기준 또는 GIVEN/WHEN/THEN 포함
- [ ] "빠르게", "쉽게", "적절히" 등 모호어 없음
- [ ] 행위자(Actor) 명시 (누가 이 기능을 사용하는가)
- [ ] 빈 상태(empty state), 에러 상태 시나리오 포함
- [ ] 기술 구현 수단 혼입 없음 (Design 영역)
```

**수정 제안**: **T2 섹션 전체 삭제**. 이 항목들은 아래 viewpoint 카탈로그의 각 viewpoint 검토 내용으로 흡수됨.

#### 2-4-c. Viewpoint 카탈로그 (line 782~791)

**현재 내용**:
```markdown
**Viewpoint 카탈로그**:

| Viewpoint | 범위 | 적용 조건 | 주요 검토 내용 |
|-----------|------|-----------|-------------|
| 구조 완전성 | 핵심 | 항상 | R-ID 체계, AC 존재, Scope 정의, 비기능 요건 |
| 명확성/측정 가능성 | 핵심 | 항상 | 모호어 제거, 수치 기준, GIVEN/WHEN/THEN |
| 기술 실현성 | 확장 | 신기술·레거시 연동·외부 API 의존 시 | 현 코드베이스 기반 실현 가능 여부, 기술 제약 |
| 사용자 시나리오 | 확장 | UX 변경이 있는 기능 | 빈 상태, 에러 상태, 접근성, 사용 흐름 |
| 비즈니스 정합성 | 확장 | 기어 4 또는 이해관계자 다수 | 제품 방향, ROI, 이해관계자 합의 |
```

**수정 제안**:
```markdown
**Viewpoint 카탈로그** (T1 통과 후 활성화):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| 명확성/측정 가능성 | 항상 | 모호어 제거, 수치 기준, GIVEN/WHEN/THEN, 행위자 명시 |
| 기술 실현성 | 신기술·레거시 연동·외부 API 의존 시 | 현 코드베이스 기반 실현 가능 여부, 기술 제약, 구현 수단 혼입 여부 |
| 사용자 시나리오 | UX 변경이 있는 기능 | 빈 상태, 에러 상태, 접근성, 사용 흐름 |
| 비즈니스 정합성 | 이해관계자 다수 또는 전략적 기능 | 제품 방향, ROI, 이해관계자 합의 |
```

**변경 이유**:
- "구조 완전성" viewpoint 삭제: R-ID 체계, AC 존재, Scope 정의 등은 T1 gate에서 이미 기계적으로 검증
- "명확성/측정 가능성"은 유지: T1으로 자동화할 수 없는 질적 판단 (모호어 판별, 수치 적절성)
- "범위" 열 삭제: "핵심/확장" 구분 폐지에 따라 불필요
- 기존 T2 항목 중 viewpoint에 해당하는 것 흡수 (행위자 명시 → 명확성, 구현 수단 혼입 → 기술 실현성)

---

### 2-5. Section 8-2 Design Phase — Exit Criteria & Viewpoint 카탈로그 (line 823~854)

#### 2-5-a. 기어별 적용 범위 행 (line 825)

**현재 내용**:
```
기어별 적용 범위: `Gear 2 = T1만` | `Gear 3 = T1+T2` | `Gear 4 = T1+T2+T3`
```

**수정 제안**:
```
기어별 적용 범위: `Gear 2 = T1만` | `Gear 3 = T1 + Viewpoint` | `Gear 4 = T1 + Viewpoint + T3`
```

#### 2-5-b. T2 섹션 제거 (line 834~839)

**현재 내용**:
```markdown
**T2 — 내용 체크 (AI 판단 / 권고)**:
- [ ] 슬라이스당 "테스트 의도" 명확 (테스트 코드로 변환 가능)
- [ ] 변경 계획 테이블의 "참조 패턴" 열 모두 채워짐
- [ ] 대안 검토 흔적 존재 (왜 이 방법을 선택했는가)
- [ ] 에러 처리 전략 명시
- [ ] 요구사항 재정의 없음 (Specify 영역 침범 여부)
```

**수정 제안**: **T2 섹션 전체 삭제**. 각 항목은 viewpoint 카탈로그로 흡수.

#### 2-5-c. Viewpoint 카탈로그 (line 845~854)

**현재 내용**:
```markdown
| Viewpoint | 범위 | 적용 조건 | 주요 검토 내용 |
|-----------|------|-----------|-------------|
| 구조 완전성 | 핵심 | 항상 | AC 커버리지 100%, 슬라이스 분해, 의존성 목록 |
| 패턴 일관성 | 핵심 | 항상 | 기존 코드베이스 컨벤션, 참조 패턴 존재 |
| 성능/확장성 | 확장 | DB 변경·API·캐시·대량 데이터 시 | 쿼리 최적화, 인덱스, 응답 시간 |
| 보안 | 확장 | 인증·인가·외부 입력·API 노출 시 | 설계 수준 보안 검토, 데이터 흐름 |
| 테스트 가능성 | 확장 | 외부 의존성·비동기·복잡 상태 시 | 슬라이스 독립 테스트 가능 여부, 모킹 전략 |
```

**수정 제안**:
```markdown
**Viewpoint 카탈로그** (T1 통과 후 활성화):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| 패턴 일관성 | 항상 | 기존 코드베이스 컨벤션, 참조 패턴 존재, 대안 검토 흔적 |
| 테스트 가능성 | 외부 의존성·비동기·복잡 상태 시 | 슬라이스당 테스트 의도 명확, 독립 테스트 가능 여부, 모킹 전략 |
| 성능/확장성 | DB 변경·API·캐시·대량 데이터 시 | 쿼리 최적화, 인덱스, 응답 시간 |
| 보안 | 인증·인가·외부 입력·API 노출 시 | 설계 수준 보안 검토, 데이터 흐름, 에러 처리 전략 |
```

**변경 이유**:
- "구조 완전성" 삭제: AC 커버리지 100%, 슬라이스 분해, 의존성 목록은 T1에서 이미 기계적으로 검증
- "패턴 일관성"에 기존 T2의 "대안 검토 흔적" 흡수
- "테스트 가능성"에 기존 T2의 "테스트 의도 명확" 흡수
- "보안"에 기존 T2의 "에러 처리 전략" 흡수
- "범위" 열 삭제

---

### 2-6. Section 8-3 Implement Phase — Exit Criteria & Viewpoint 카탈로그 (line 886~909)

#### 2-6-a. T2 섹션 (line 895~898)

**현재 내용**:
```markdown
**T2 — AI 판단 (권고)**:
- [ ] 구현이 Design 명세와 일치 (슬라이스 범위 이탈 없음)
- [ ] 각 슬라이스가 연결된 AC를 실제로 충족
```

**수정 제안**: **T2 섹션 삭제**. viewpoint 카탈로그의 "Design 준수" viewpoint로 흡수.

#### 2-6-b. Viewpoint 카탈로그 (line 902~909)

**현재 내용**:
```markdown
| Viewpoint | 범위 | 적용 조건 | 주요 검토 내용 |
|-----------|------|-----------|-------------|
| Design 준수 | 핵심 | 항상 | 구현이 설계 명세와 일치, 범위 이탈 없음 |
| 코드 품질 | 확장 | 신규 패턴 도입·복잡 로직 시 | 가독성, 중복 제거, 에러 처리, 네이밍 |
| 테스트 충분성 | 확장 | 엣지 케이스 많은 기능 시 | AC별 테스트 존재, 경계값, 에러 경로 |
```

**수정 제안**:
```markdown
**Viewpoint 카탈로그** (T1 통과 후 활성화):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| Design 준수 | 항상 | 구현이 설계 명세와 일치, 범위 이탈 없음, AC 실제 충족 |
| 코드 품질 | 신규 패턴 도입·복잡 로직 시 | 가독성, 중복 제거, 에러 처리, 네이밍 |
| 테스트 충분성 | 엣지 케이스 많은 기능 시 | AC별 테스트 존재, 경계값, 에러 경로 |
```

**변경 이유**:
- "범위" 열 삭제
- 기존 T2의 "AC 실제 충족" 검토를 "Design 준수" viewpoint에 흡수
- "Design 준수"는 T1(기계적)으로 검증 불가한 질적 판단이므로 viewpoint로 유지 타당

---

### 2-7. Section 8-4 Verify Phase — Exit Criteria & Viewpoint 카탈로그 (line 928~953)

#### 2-7-a. T2 섹션 (line 936~938)

**현재 내용**:
```markdown
**T2 — AI 판단 (권고)**:
- [ ] 엣지 케이스 (경계값, 빈 상태, 에러 상태) 테스트 존재
- [ ] 보안 취약점 패턴 없음 (SQL 인젝션, XSS 등)
```

**수정 제안**: **T2 섹션 삭제**. viewpoint 카탈로그의 "테스트 커버리지"와 "보안" viewpoint로 흡수.

#### 2-7-b. Viewpoint 카탈로그 (line 944~953)

**현재 내용**:
```markdown
| Viewpoint | 범위 | 적용 조건 | 주요 검토 내용 |
|-----------|------|-----------|-------------|
| AC 추적 | 핵심 | 항상 | 모든 R-xxx AC가 테스트로 추적 가능 |
| 보안 | 확장 | 인증·외부 입력·API 노출 시 | OWASP Top 10, SQL injection, XSS |
| 성능 | 확장 | DB 쿼리·대량 데이터·응답 시간 SLA 시 | N+1, 인덱스, 캐시, 부하 |
| 테스트 커버리지 | 확장 | 복잡 비즈니스 로직·엣지 케이스 다수 시 | 경계값, 빈 상태, 에러 상태 |
| 접근성 | 확장 | UI 변경이 있는 기능 | WCAG, 스크린 리더, 키보드 네비게이션 |
| 비즈니스 로직 | 확장 | 기어 4 또는 도메인 복잡도 높을 때 | 실제 비즈니스 의도와 구현 일치 |
```

**수정 제안**:
```markdown
**Viewpoint 카탈로그** (T1 통과 후 활성화):

| Viewpoint | 적용 조건 | 주요 검토 내용 |
|-----------|-----------|-------------|
| 보안 | 인증·외부 입력·API 노출 시 | OWASP Top 10, SQL injection, XSS |
| 성능 | DB 쿼리·대량 데이터·응답 시간 SLA 시 | N+1, 인덱스, 캐시, 부하 |
| 테스트 커버리지 | 복잡 비즈니스 로직·엣지 케이스 다수 시 | 경계값, 빈 상태, 에러 상태 |
| 접근성 | UI 변경이 있는 기능 | WCAG, 스크린 리더, 키보드 네비게이션 |
| 비즈니스 로직 | 도메인 복잡도 높을 때 | 실제 비즈니스 의도와 구현 일치 |
```

**변경 이유**:
- "AC 추적" viewpoint 삭제: "모든 R-xxx AC가 테스트로 추적 가능"은 T1의 기계적 체크로 검증 가능 (T1에 이미 존재: line 934)
- "범위" 열 삭제
- 기존 T2의 "엣지 케이스 테스트 존재" → "테스트 커버리지" viewpoint에 이미 포함
- 기존 T2의 "보안 취약점 패턴 없음" → "보안" viewpoint에 이미 포함

---

### 2-8. Section 8-4 Verify Phase — line 926 Writer/Reviewer 패턴 (line 926)

**현재 내용**:
```
5. 기어 4: 별도 Reviewer 세션 (Writer/Reviewer 패턴)
```

**수정 제안**:
```
5. 기어 4: 전체 viewpoint 카탈로그 활성화 + T3 인간 sign-off
```

**변경 이유**: "Writer/Reviewer 패턴"이라는 별도 개념 대신, viewpoint 기반 리뷰 체계 내에서 처리. 기어 4에서는 카탈로그 전체를 대상으로 필터링하고, 추가로 T3 인간 판단 단계를 거침.

---

### 2-9. Section 4-1 state.json 스키마 — exitCriteria 필드 (line 255~271)

**현재 내용**:
```json
"exitCriteria": {
  "t1Passed": false,
  "t1Items": {
    "requirementsNumbered": true,
    "eachRequirementHasAC": false,
    "noTBDInCriticalSections": true,
    "scopeInOutDefined": true,
    "nonFunctionalAddressed": true
  },
  "t2Items": {
    "acMeasurable": true,
    "noAmbiguousTerms": false,
    "actorsIdentified": true,
    "edgeCasesMentioned": true
  },
  "t3Checklist": []
},
```

**수정 제안**:
```json
"exitCriteria": {
  "t1Passed": false,
  "t1Items": {
    "requirementsNumbered": true,
    "eachRequirementHasAC": false,
    "noTBDInCriticalSections": true,
    "scopeInOutDefined": true,
    "nonFunctionalAddressed": true
  },
  "viewpointResults": [
    {
      "viewpoint": "명확성/측정 가능성",
      "status": "completed",
      "blockingIssues": ["R-2의 '빠른 응답' 수치 없음"],
      "nonBlockingIssues": []
    },
    {
      "viewpoint": "기술 실현성",
      "status": "skipped",
      "reason": "외부 API 의존 없음"
    }
  ],
  "t3Checklist": []
},
```

**변경 이유**: `t2Items` 필드를 `viewpointResults` 배열로 대체. 각 viewpoint의 활성화/스킵 여부와 발견 이슈를 구조적으로 추적.

---

### 2-10. Section 13 기존 솔루션 비교표 — 이탈 기준 행 (line 1269)

**현재 내용**:
```
| **이탈 기준** | 90% 임계값 (자동) | 없음 (개발자 판단) | 없음 | 없음 (느낌) | T1 자동 차단 + T2 권고 + T3 인간 sign-off |
```

**수정 제안**:
```
| **이탈 기준** | 90% 임계값 (자동) | 없음 (개발자 판단) | 없음 | 없음 (느낌) | T1 자동 gate + Viewpoint 질적 검토 + T3 인간 sign-off |
```

---

### 2-11. Section 8-0 "핵심 viewpoint" 용어 사용 (line 706)

**현재 내용** (line 706):
```
4. **기어 연동** — 기어 3은 핵심 viewpoint만, 기어 4는 확장 viewpoint까지
```

이 항목은 2-3의 전체 재작성에 포함되므로 별도 수정 불필요.

---

### 2-12. Section 12 점진적 도입 로드맵 — 9단계 (line 1254)

**현재 내용**:
```
| **9단계** | Viewpoint 카탈로그 + 서브에이전트 분리 실행 | 관점별 독립 리뷰, 편향 방지 |
```

**수정 제안**:
```
| **9단계** | Viewpoint 카탈로그 + 서브에이전트 분리 실행 | T1 gate 후 질적 검토, 관점별 독립 리뷰 |
```

---

### 2-13. Section 12 점진적 도입 로드맵 — 8단계 (line 1253)

**현재 내용**:
```
| **8단계** | `.review.md` 사이드카 + `exitCriteria` T1 자동 체크 | 리뷰 이슈 추적 + 차단 게이트 |
```

변경 불필요. T1 자동 체크는 새 구조에서도 동일하게 유지.

---

## 3. 변경 요약

| 변경 유형 | 영향 범위 | 핵심 변경 |
|-----------|----------|----------|
| **T2 레이어 폐지** | 8-1, 8-2, 8-3, 8-4, 4-1, 3-2 | T2 섹션 삭제, viewpoint로 흡수 |
| **핵심/확장 구분 제거** | 2-3, 8-0, 8-1~8-4 | "범위" 열 삭제, 기어 차이는 필터링 강도로 표현 |
| **T1 중복 viewpoint 삭제** | 8-1, 8-2, 8-4 | "구조 완전성"(8-1, 8-2), "AC 추적"(8-4) 삭제 |
| **리뷰 흐름 재정의** | 8-0, 3-2 | T1 gate → Viewpoint → T3 순차 파이프라인 |
| **state.json 스키마** | 4-1 | `t2Items` → `viewpointResults` |
| **Writer/Reviewer 패턴 제거** | 8-4 line 926 | viewpoint 체계로 통합 |

---

## 4. 마이그레이션 영향

### 코드 변경 필요 항목
- `phase-guard.sh` 등 기존 Hook: 변경 없음 (T1은 그대로)
- `/workflow next` Skill 구현: T2 체크 로직 → viewpoint 서브에이전트 호출로 변경
- `state.json` 파서: `t2Items` → `viewpointResults` 구조 변경

### 문서 변경 항목
- `CLAUDE.md`: "T1+T2" 언급 → "T1 + Viewpoint"로 수정
- `phase-*.md` skill references: 각 Phase의 exit criteria에서 T2 섹션 제거, viewpoint 카탈로그 수정
