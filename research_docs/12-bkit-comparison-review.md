# bkit 플러그인 vs 워크플로우 스킬 비교 분석

> 작성일: 2026-03-09
> 비교 대상: bkit@bkit-marketplace v1.5.8 vs artifacts/skills/workflow*
> 목적: 워크플로우 스킬 구현 시 참고할 구조적 갭 분석

---

## 1. Hooks 시스템

### bkit 구현

`hooks/hooks.json`에 8개 이벤트 정의. 각 hook은 node.js 스크립트로 실행.

**이벤트 목록**:

| 이벤트 | 용도 | 예시 스크립트 |
|--------|------|--------------|
| SessionStart | 상태 초기화, 마이그레이션, 컨텍스트 주입 | session-start.js |
| PreToolUse | Write/Edit/Bash 실행 전 가드 | unified-bash-pre.js |
| PostToolUse | Write/Edit/Bash 실행 후 처리 | skill-post.js |
| Stop | 세션 종료 시 클린업 | unified-stop.js |
| UserPromptSubmit | 사용자 입력 캡처 | user-prompt-handler.js |
| TaskCompleted | 자동 Phase 전환 | pdca-task-completed.js |
| SubagentStart/Stop | 에이전트 수명주기 추적 | subagent-start-handler.js |
| TeammateIdle | 유휴 에이전트에 작업 배정 | team-idle-handler.js |

**hook 스키마 핵심 필드**:
```json
{
  "hooks": {
    "SessionStart": [{
      "type": "command",
      "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js",
      "timeout": 5000,
      "once": true
    }],
    "PreToolUse": [{
      "type": "command",
      "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/pre-write.js",
      "matcher": "Write|Edit",
      "timeout": 3000
    }]
  }
}
```

- `matcher`: 도구 이름 정규식 필터 (PreToolUse/PostToolUse 전용)
- `once`: 세션당 1회만 실행 (SessionStart 전용)
- `timeout`: ms 단위 타임아웃

**session-start.js 주요 동작**:
- `.bkit/` 구조 디렉토리 자동 생성/마이그레이션
- PDCA 상태 파일 로드 및 컨텍스트 주입
- 메모리 스토어 초기화
- JSON 출력으로 `hookSpecificOutput` 반환

### 우리 워크플로우 갭

- hook 시스템 자체 없음
- `state-schema.md`에서 slice-tracker hook 언급하지만 구현 부재
- 세션 시작 시 컨텍스트 자동 주입 없음 (`/workflow resume` 수동 필요)
- Write/Edit 전후 가드 없음 (잘못된 파일 수정 방지 불가)

### 워크플로우에 필요한 hooks

| hook | 용도 | 우선순위 |
|------|------|---------|
| SessionStart | state.json 로드, 현재 Phase 컨텍스트 주입 | **필수** |
| PostToolUse(Bash) | 커밋 메시지에서 `[Slice-ID]` 감지 → slice 상태 갱신 | 높음 |
| PreToolUse(Write\|Edit) | Phase별 파일 수정 범위 가드 (Specify에서 코드 수정 차단 등) | 높음 |
| Stop | state.json updatedAt 갱신, 미저장 상태 클린업 | 중간 |

---

## 2. Agent 정의 및 바인딩

### bkit 구현

에이전트를 `agents/*.md` 파일에 독립 정의. frontmatter로 메타데이터 관리.

**에이전트 정의 예시** (gap-detector.md):
```yaml
name: gap-detector
description: 구현-설계 간 갭 분석
linked-from-skills:
  - pdca: analyze
context: fork           # 격리된 실행 컨텍스트
mergeResult: false      # 포크 결과 미병합
permissionMode: plan    # 읽기 전용
memory: project         # 프로젝트 스코프 영속 메모리
model: opus
tools:
  - Read
  - Glob
  - Grep
  - Task(Explore)
disallowedTools:
  - Write
  - Edit
```

**스킬에서 에이전트 바인딩** (pdca SKILL.md):
```yaml
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  team: bkit:cto-lead
  default: null
```

**CTO-Lead 에이전트** (cto-lead.md):
- `permissionMode: acceptEdits` — 편집 권한 있음
- `tools: [Task(enterprise-expert), Task(infra-architect), ...]` — 다른 에이전트에 위임 가능
- `skills: [pdca, enterprise, bkit-rules]` — 사전 로드 스킬
- Phase별 에이전트 위임 매핑 포함

**양방향 연결**:
- 스킬 → 에이전트: `agents:` frontmatter
- 에이전트 → 스킬: `linked-from-skills:` frontmatter

### 우리 워크플로우 갭

- `agents:` frontmatter 필드 없음
- agent 정의 파일(`.md`) 없음
- Viewpoint 리뷰를 "서브에이전트로 분리 실행" 언급하지만 바인딩 없음
- 에이전트별 도구/권한/모델 제어 없음

### 워크플로우에 필요한 agents

| 에이전트 | 역할 | 연결 스킬 |
|---------|------|----------|
| spec-reviewer | Specify Phase Viewpoint 리뷰 | workflow-specify |
| design-reviewer | Design Phase Viewpoint 리뷰 | workflow-design |
| code-reviewer | Implement Phase 코드 리뷰 | workflow-implement |
| test-strategist | Verify Phase 테스트 전략 | workflow-verify |

---

## 3. Imports & Template 시스템

### bkit 구현

`imports:` frontmatter로 템플릿을 자동 로드:
```yaml
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
  - ${PLUGIN_ROOT}/templates/design.template.md
  - ${PLUGIN_ROOT}/templates/analysis.template.md
```

- `${PLUGIN_ROOT}` 변수로 경로 해소
- 공유 템플릿: `templates/shared/api-patterns.md`, `templates/shared/naming-conventions.md`
- 스킬 실행 시 imports 파일이 자동으로 컨텍스트에 주입

### 우리 워크플로우 갭

- `imports:` frontmatter 없음
- `template-spec.md`는 존재하지만 SKILL.md 본문에서 상대경로 링크만
- 스킬 실행 시 자동 로드 보장 없음 (AI가 판단해서 읽어야 함)

### 워크플로우에 필요한 imports

| 스킬 | 필요한 imports |
|------|---------------|
| workflow | references/state-schema.md, references/review-protocol.md, references/extensions.md |
| workflow-specify | assets/template-spec.md |
| workflow-design | assets/template-design.md |
| workflow-implement | (없음 — 코드 템플릿은 코드베이스 참조) |
| workflow-verify | (없음) |
| workflow-ship | assets/template-claude-md-update.md |

---

## 4. Frontmatter 필드 비교

### bkit에서 사용하는 필드 전체

| 필드 | 타입 | 용도 | 적용 대상 |
|------|------|------|----------|
| `name` | string | 스킬/에이전트 이름 | 스킬, 에이전트 |
| `description` | string | 설명 + 트리거 조건 | 스킬, 에이전트 |
| `argument-hint` | string | 사용법 안내 | 스킬 |
| `user-invocable` | boolean | 사용자 직접 호출 가능 여부 | 스킬 |
| `allowed-tools` | array | 허용 도구 목록 | 스킬, 에이전트 |
| `disallowedTools` | array | 금지 도구 목록 | 에이전트 |
| `agents` | object | 액션별 에이전트 바인딩 | 스킬 |
| `imports` | array | 자동 로드 파일 | 스킬 |
| `next-skill` | string | 다음 Phase 스킬 | 스킬 |
| `context` | string | 실행 격리 (fork/shared) | 에이전트 |
| `mergeResult` | boolean | 포크 결과 병합 여부 | 에이전트 |
| `permissionMode` | string | 권한 수준 (plan/acceptEdits) | 에이전트 |
| `memory` | string | 메모리 스코프 (project/user) | 에이전트 |
| `model` | string | 모델 선택 (opus/sonnet) | 에이전트 |
| `skills` | array | 사전 로드 스킬 목록 | 에이전트 |
| `linked-from-skills` | array | 역방향 스킬 참조 | 에이전트 |
| `task-template` | string | 자동 태스크 이름 패턴 | 스킬 |
| `pdca-phase` | string | 수명주기 Phase 추적 | 스킬 |

### 우리가 현재 사용하는 필드

| 필드 | workflow | workflow-specify |
|------|----------|-----------------|
| `name` | ✅ | ✅ |
| `description` | ✅ | ✅ |
| `argument-hint` | ✅ | ❌ |
| `user-invocable` | ✅ true | ✅ false |
| `allowed-tools` | ✅ | ✅ |
| 나머지 | ❌ 전부 없음 | ❌ 전부 없음 |

### 우리 스킬에 추가해야 할 필드

**오케스트레이터 (workflow)**:
```yaml
agents:
  gear-detect: workflow:gear-detector     # 기어 감지 (선택)
  default: null
imports:
  - references/state-schema.md
  - references/review-protocol.md
  - references/extensions.md
```

**Phase 스킬 (workflow-specify 등)**:
```yaml
imports:
  - ../workflow/references/state-schema.md    # 상태 스키마 참조
  - ../workflow/references/review-protocol.md # 리뷰 프로토콜 참조
  - assets/template-spec.md                   # 템플릿
agents:
  review: workflow:spec-reviewer              # Viewpoint 리뷰 에이전트
next-skill: workflow-design                   # 다음 Phase
```

---

## 5. 권한 및 도구 제어

### bkit 구현

**글로벌 레벨** (bkit.config.json):
```json
"permissions": {
  "Write": "allow",
  "Edit": "allow",
  "Bash": "allow",
  "Bash(rm -rf*)": "deny",
  "Bash(rm -r*)": "ask",
  "Bash(git push --force*)": "deny",
  "Bash(git reset --hard*)": "ask"
}
```

**에이전트 레벨** (agent .md):
```yaml
permissionMode: plan
disallowedTools:
  - Write
  - Edit
```

패턴 매칭 (`Bash(rm -rf*)`)으로 특정 명령만 차단 가능.

### 우리 워크플로우 갭

- 글로벌 권한 설정 없음
- Phase별 도구 제한 부재 (Specify에서 Bash 불필요하지만 workflow 오케스트레이터에는 있음)
- 에이전트별 도구/권한 제어 없음

### 워크플로우에 적용할 권한 설계

| 스킬 | allowed-tools | 제한 사유 |
|------|--------------|----------|
| workflow (오케스트레이터) | Read, Write, Edit, Glob, Grep, Bash | 상태 관리 + Phase 디스패치 |
| workflow-specify | Read, Write, Edit, Glob, Grep | 코드 실행 불필요 |
| workflow-design | Read, Write, Edit, Glob, Grep | 코드 실행 불필요 |
| workflow-implement | Read, Write, Edit, Glob, Grep, Bash | 코드 작성 + 테스트 실행 |
| workflow-verify | Read, Write, Edit, Glob, Grep, Bash | 테스트 실행 필요 |
| workflow-ship | Read, Write, Edit, Glob, Grep, Bash | git/gh 명령 필요 |

---

## 6. 설정 vs 상태 분리

### bkit 구현

```
bkit.config.json          ← 정적 설정 (변경 드묾)
├── pdca.docPaths          — 문서 경로 패턴
├── pdca.matchRateThreshold — 품질 기준
├── pdca.automationLevel   — 자동화 수준
├── team.enabled           — 팀 사용 여부
├── team.orchestrationPatterns — 오케스트레이션 패턴
├── pipeline.autoTransition — 자동 전환 여부
└── permissions            — 권한 규칙

.bkit/state/              ← 동적 상태 (수시 변경)
├── features/              — 피처별 상태
└── memory/                — 프로젝트 메모리

.pdca-status.json         ← PDCA 진행 상태
.bkit-memory.json         ← 프로젝트 메모리
```

### 우리 워크플로우 현재

```
.workflow/state.json      ← 설정 + 상태 혼재
├── feature                — 피처 메타 (반정적)
├── gear                   — 기어 설정 (반정적)
├── phase                  — 동적 상태
├── artifacts              — 동적 상태
├── slices                 — 동적 상태
├── feedback               — 동적 상태
├── context                — 설정 + 상태 혼재
└── meta                   — 메타 정보
```

### 분리 제안

**옵션 A: 최소 변경** — 현재 state.json 유지, 별도 config는 CLAUDE.md에서 관리
**옵션 B: 분리** — workflow.config.json (정적) + state.json (동적) 분리

현재로서는 **옵션 A 권장**. 이유:
- 워크플로우 설정은 대부분 CLAUDE.md에서 관리 (확장 설정 등)
- state.json의 gear/feature는 워크플로우 시작 시 1회 설정 후 거의 불변
- 별도 config 파일은 복잡도만 증가

---

## 7. 스킬 구성 및 체이닝

### bkit 구현

- 스킬은 원자적(atomic) 단위로 독립 실행 가능
- `/pdca plan` → `/pdca design` → `/pdca do` → `/pdca analyze` → `/pdca report`
- `next-skill` 필드로 시퀀싱 안내
- 사용자가 어느 Phase든 직접 진입 가능

### 우리 워크플로우 설계

- `/workflow`가 유일한 진입점 (오케스트레이터 패턴)
- Phase 스킬은 `user-invocable: false`로 직접 호출 불가
- 오케스트레이터가 전환 제어

**차이의 의도**: 우리는 Phase 순서를 강제하기 위해 의도적으로 오케스트레이터 패턴 채택. bkit의 자유 진입은 PDCA의 반복 특성에 맞지만, 우리 5-Phase는 순차 의존성이 강함. 현재 설계 유지가 적합.

단, `next-skill` 필드는 오케스트레이터가 디스패치할 때 참조용으로 유용:
```yaml
# workflow-specify SKILL.md
next-skill: workflow-design
```

---

## 8. 팀 오케스트레이션 (참고)

### bkit 구현

```json
"team": {
  "enabled": true,
  "maxTeammates": 5,
  "orchestrationPatterns": {
    "Dynamic": {
      "plan": "leader",
      "design": "leader",
      "do": "swarm",
      "check": "council",
      "act": "leader"
    }
  }
}
```

- `leader`: CTO 에이전트가 지시
- `swarm`: 병렬 에이전트 실행
- `council`: 복수 에이전트 합의

### 우리 워크플로우 해당사항

현재 단일 에이전트 실행 전제. Viewpoint 리뷰 시 병렬 서브에이전트만 사용.
팀 오케스트레이션은 v2 범위로 보류.

---

## 9. 구현 우선순위 체크리스트

### P0 — 스킬이 제대로 동작하기 위한 필수

- [ ] `imports:` frontmatter 추가 (모든 스킬)
- [ ] `agents:` frontmatter 추가 (Viewpoint 리뷰용)
- [ ] agent 정의 파일 생성 (`agents/` 디렉토리)
- [ ] `hooks.json` + SessionStart hook 스크립트
- [ ] Phase별 `allowed-tools` 재정의

### P1 — 구조 개선

- [ ] `next-skill:` frontmatter 추가 (Phase 스킬)
- [ ] PostToolUse(Bash) hook — slice-tracker
- [ ] PreToolUse(Write|Edit) hook — Phase별 파일 가드
- [ ] `bkit-rules` 스타일 auto-applied rules 스킬

### P2 — 고도화 (v2)

- [ ] 팀 오케스트레이션 패턴
- [ ] 멀티 피처 추적
- [ ] 상태 마이그레이션 시스템
- [ ] 에이전트 메모리 (project scope)

---

## 10. bkit 참조 파일 경로

분석에 사용한 bkit 원본 파일 위치:

```
/Users/infinishow/.claude/plugins/cache/bkit-marketplace/bkit/1.5.8/
├── bkit.config.json          — 글로벌 설정
├── hooks/
│   ├── hooks.json            — hook 이벤트 정의
│   └── session-start.js      — SessionStart 스크립트
├── skills/
│   ├── pdca/SKILL.md         — PDCA 메인 스킬 (agents, imports 예시)
│   ├── bkit-rules/SKILL.md   — auto-applied rules
│   └── phase-*/SKILL.md      — Phase별 스킬
├── agents/
│   ├── cto-lead.md           — CTO 에이전트 (위임 패턴)
│   ├── gap-detector.md       — 갭 분석 에이전트 (읽기 전용)
│   └── ...
└── templates/                — 템플릿 파일
```
