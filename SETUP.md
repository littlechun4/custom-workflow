# Workflow Setup

Installation and configuration instructions for Claude to follow.
Read this file and execute the steps below.

---

## Prerequisites

- Git repository initialized
- Submodule added: `.vendor/custom-workflow/` must exist and be populated
  - If missing: ask the user to run `git submodule add <repo-url> .vendor/custom-workflow`

## Step 1: Create directories

Create if missing:

```
.claude/skills/
.claude/agents/
.workflow/
```

## Step 2: Link workflow skills

Create symlinks (relative paths, from `.claude/skills/`):

```
.claude/skills/workflow           → ../../.vendor/custom-workflow/artifacts/skills/workflow
.claude/skills/workflow-specify   → ../../.vendor/custom-workflow/artifacts/skills/workflow-specify
.claude/skills/workflow-design    → ../../.vendor/custom-workflow/artifacts/skills/workflow-design
.claude/skills/workflow-implement → ../../.vendor/custom-workflow/artifacts/skills/workflow-implement
.claude/skills/workflow-verify    → ../../.vendor/custom-workflow/artifacts/skills/workflow-verify
.claude/skills/workflow-ship      → ../../.vendor/custom-workflow/artifacts/skills/workflow-ship
```

If a symlink already exists and points to the correct target, skip it.

## Step 3: Link agents

```
.claude/agents/spec-reviewer.md    → ../../.vendor/custom-workflow/artifacts/agents/spec-reviewer.md
.claude/agents/design-reviewer.md  → ../../.vendor/custom-workflow/artifacts/agents/design-reviewer.md
.claude/agents/code-reviewer.md    → ../../.vendor/custom-workflow/artifacts/agents/code-reviewer.md
.claude/agents/test-strategist.md  → ../../.vendor/custom-workflow/artifacts/agents/test-strategist.md
```

## Step 4: Optional skills

Ask the user:

```
Optional skills:
  resolve-pr-review (triage & resolve PR review comments): [Y/n]
```

If accepted:
```
.claude/skills/resolve-pr-review → ../../.vendor/custom-workflow/artifacts/skills/resolve-pr-review
```

## Step 5: Configure extensions

Ask the user:

```
Configure workflow extensions:
  Branch creation (auto-create feat/{slug} branch): [Y/n]
  PR creation (gh pr create in Ship phase): [Y/n]
  PR auto-merge (squash merge + branch cleanup): [y/N]
  CI check (wait for CI after PR): [y/N]
```

Write responses to `.workflow/config.json`:

```json
{
  "extensions": {
    "branch": true,
    "pr": true,
    "autoMerge": false,
    "ci": false
  }
}
```

## Step 6: Verify

Check that all symlinks resolve correctly. Report:

```
[workflow] Setup complete
  Skills: {N}/6 linked ✓  (+ optional skills)
  Agents: 4/4 linked ✓
  Config: .workflow/config.json ✓

  /workflow is now available.
```

---

## After installation

- Start a workflow: `/workflow start {feature}`
- Change extension settings: `/workflow setup --extensions`
- Update submodule: `/workflow setup --update`
