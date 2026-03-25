# custom-workflow

Claude Code용 워크플로우 스킬과 에이전트 모음.

## 포함 항목

| 경로 | 설명 |
|---|---|
| `artifacts/skills/workflow*` | 5-phase 개발 워크플로우 스킬 |
| `artifacts/skills/resolve-pr-review` | PR 리뷰 코멘트 처리 스킬 (독립) |
| `artifacts/agents/` | 코드 리뷰, 보안 검토 등 특화 에이전트 |
| `artifacts/templates/CLAUDE.sample.md` | 프로젝트 CLAUDE.md 템플릿 |
| `artifacts/docs/` | 워크플로우 개요 문서 |

## 프로젝트에 추가하기

### 1. 서브모듈 등록

```bash
git submodule add git@github.com:littlechun4/custom-workflow.git .vendor/custom-workflow
```

### 2. Claude에게 설치 요청

```
.vendor/custom-workflow/artifacts/skills/workflow/SKILL.md의 setup 섹션을 읽고 실행해줘
```

Claude가 프로젝트 구조를 파악하고 다음을 수행합니다:
- `.claude/skills/` 에 워크플로우 스킬 심볼릭 링크 생성 (6개)
- `.claude/agents/` 에 에이전트 심볼릭 링크 생성 (4개)
- 선택적 스킬 (resolve-pr-review) 설치 여부 확인
- `.workflow/config.json` 에 extension 설정 (branch, PR, CI 등)

설치 완료 후에는 `/workflow setup`으로 설정 변경 가능.

### 3. 기존 프로젝트 clone 후

```bash
git clone --recursive <repo>
# 또는
git clone <repo> && git submodule update --init
```

## 업데이트

```bash
git submodule update --remote .vendor/custom-workflow
```

또는 `/workflow setup --update` 실행.

## 동기화 방향

단방향 (서브모듈 → 프로젝트):
- 서브모듈의 신규 항목은 `/workflow setup`의 re-link로 반영됩니다.
- `.claude/`에 직접 추가한 로컬 스킬/에이전트는 서브모듈에 영향을 주지 않습니다.
