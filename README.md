# custom-workflow

Claude Code용 구조화된 개발 워크플로우 스킬.

## 설치

Claude에게 이 URL을 주고 설치를 요청하세요:

```
https://github.com/littlechun4/custom-workflow 설치해줘
```

Claude가 다음을 순서대로 수행합니다:
1. `git submodule add` 로 `.vendor/custom-workflow` 등록
2. `SETUP.md` 를 읽고 심볼릭 링크 + 설정 생성

### Claude를 위한 설치 가이드

> **Claude**: 이 repo를 설치하라는 요청을 받았다면:
> 1. 현재 프로젝트에서 `git submodule add git@github.com:littlechun4/custom-workflow.git .vendor/custom-workflow` 실행
> 2. `.vendor/custom-workflow/SETUP.md` 를 읽고 모든 단계를 실행

### 이미 설치된 프로젝트를 clone한 경우

```bash
git clone --recursive <repo>
# 또는
git clone <repo> && git submodule update --init
```

submodule이 비어있으면 Claude에게 `.vendor/custom-workflow/SETUP.md 읽고 따라해줘` 요청.

## 업데이트

```bash
git submodule update --remote .vendor/custom-workflow
```

또는 `/workflow setup --update` 실행.

## 포함 항목

| 경로 | 설명 |
|---|---|
| `artifacts/skills/workflow*` | 5-phase 개발 워크플로우 (Specify→Design→Implement→Verify→Ship) |
| `artifacts/skills/resolve-pr-review` | PR 리뷰 코멘트 처리 (독립 스킬) |
| `artifacts/agents/` | spec-reviewer, design-reviewer, code-reviewer, test-strategist |
| `SETUP.md` | Claude가 읽는 설치 지침 |
