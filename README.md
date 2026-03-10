# custom-workflow

Claude Code용 워크플로우 스킬과 에이전트 모음.

## 포함 항목

| 경로 | 설명 |
|---|---|
| `artifacts/skills/workflow*` | 5-phase 개발 워크플로우 스킬 |
| `artifacts/agents/` | 코드 리뷰, 보안 검토 등 특화 에이전트 |
| `artifacts/templates/CLAUDE.sample.md` | 프로젝트 CLAUDE.md 템플릿 |
| `artifacts/docs/` | 워크플로우 개요 문서 |

## 프로젝트에 추가하기

### 1. 서브모듈 등록

```bash
git submodule add git@github.com:littlechun4/custom-workflow.git .vendor/custom-workflow
```

### 2. 초기 셋업

```bash
bash .vendor/custom-workflow/setup.sh
```

`setup.sh`가 하는 일:
- `artifacts/skills/*` → `.claude/skills/` 심볼릭 링크 생성
- `artifacts/agents/*` → `.claude/agents/` 심볼릭 링크 생성
- 서브모듈 git hook 설치 (이후 업데이트 시 자동 동기화)

### 3. 기존 프로젝트 clone 후 셋업

```bash
git clone <repo>
git submodule update --init
bash .vendor/custom-workflow/setup.sh
```

## 업데이트

```bash
git submodule update --remote --merge .vendor/custom-workflow
```

업데이트 시 `post-merge` hook이 자동으로 새 스킬/에이전트를 `.claude/`에 링크합니다.
hook이 설치되지 않은 경우(setup.sh 미실행) `scripts/sync-vendor.sh`를 수동으로 실행하세요.

## 동기화 방향

단방향 (서브모듈 → 프로젝트):
- 서브모듈의 신규 항목은 `.claude/`에 자동 링크됩니다.
- `.claude/`에 직접 추가한 로컬 스킬/에이전트는 서브모듈에 영향을 주지 않습니다.
