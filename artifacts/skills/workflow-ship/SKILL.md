---
name: workflow-ship
description: |
  Workflow Ship Phase. Wraps up and delivers.
  Updates CLAUDE.md with learned patterns, archives state.json,
  and optionally creates PR / checks CI.

  Auto-invoked by the workflow orchestrator when entering the Ship phase.
  Runs to completion automatically — no /workflow next required.
  Do NOT use for: code changes, test modifications, spec/design authoring.
user-invocable: false
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Ship Phase

**"Wrap up, record, and complete."** Runs automatically on entry — no `/workflow next` required.

---

## Entry Behavior

### Normal Entry (from Verify approved)

Ship executes its full process automatically on entry and completes the workflow. No review, no viewpoints, no human gate.

### Re-entry (from back after extension failure)

When returning after CI/PR failure → fix → Verify re-approval → Ship re-entry:
- **Full process re-executes from step 1** (idempotent)
- CLAUDE.md: re-check for new learnings (no duplicate entries)
- PR: `gh pr edit` to update existing PR (no new PR)
- CI: re-run on updated PR
- Archive: only on final success

---

## Process

```
[Verify approved] ──[/workflow next]──→ Ship entry
  │
  ├─ 1. Capture insights (optional)
  ├─ 2. Convert suggestions to issues (if suggestions file exists)
  ├─ 3. (Extension: PR) Create or update PR — or output manual integration guidance
  ├─ 4. (Extension: CI) Verify CI passes
  ├─ 5. (Extension: PR Auto-Merge) Merge PR + delete branches
  ├─ 6. Archive state.json → .workflow/history/{slug}.json + delete active state
  │
  └─ Workflow complete
```

**Archive is always the last step.** Extensions (PR/CI) may fail and require back, so state.json is only deleted after all processes succeed.

---

### Step 1: Capture Insights

Review the workflow for non-obvious discoveries — things that **cannot be inferred by reading the code**. Add them to `state.json` → `insights` array before archiving.

**What qualifies:**
- Gotchas and pitfalls (e.g., "advisory lock doesn't release on transaction end")
- Non-obvious API/library behaviors discovered during implementation
- Workarounds for known issues (e.g., "Chart.js responsive:true triggers ResizeObserver bug")

**What does NOT qualify:**
- Architecture decisions (already in ADR or design doc)
- Code patterns (readable from the code itself)
- Configuration details (in config files)
- General best practices

```json
"insights": [
  "PostgreSQL advisory lock은 트랜잭션 끝나도 안 풀림 — 명시적 unlock 필요",
  "dlt merge 시 staging 테이블 스키마가 갱신 안 되면 NOT NULL 에러 발생"
]
```

If nothing qualifies, leave the array empty. **Do not force insights where there are none.**

These insights are surfaced by `/workflow start` when it scans history for relevant past work.

### Step 2: Convert Suggestions to Issues

Check if `workflow_docs/suggestions/{slug}.md` exists.

- **If file exists**: Present each suggestion to the user and ask whether to create a tracking issue (GitHub Issue, etc.).
  - User approves → create issue via `gh issue create` or note for manual creation
  - User declines → suggestion remains in the file for future reference only
- **If file does not exist**: Skip this step.

The suggestions file is **never deleted** — it stays in git as a record of review feedback regardless of whether issues were created.

### Step 3: (Extension) Create PR

**When active:**
```bash
gh pr create \
  --title "{type}: {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
{Spec summary — 1-3 sentences}

## Changes
{Per-slice change summary}

## Design Docs
- Spec: workflow_docs/spec/{feature}.md
- Design: workflow_docs/design/{feature}.md

## Test Plan
{Verify phase results summary}

EOF
)"
```

**Rules:**
- Record PR URL in `state.json` → `feature.pr`
- On re-entry: `gh pr edit` to update existing PR (no new PR)
- Based on `gh` (GitHub CLI). Other platforms (GitLab `glab`, etc.) use the same extension point

**When inactive** — output manual integration guidance:
```
[workflow] ⚠ PR extension is not active. Manual integration needed:
  Current branch: {current-branch}
  Base branch: {base-branch}
  Commits: {N} commits ahead of {base-branch}

  Suggested steps:
    git push origin {current-branch}
    gh pr create --base {base-branch}

  To enable automatic PR creation: /workflow setup --extensions
```

### Step 4: (Extension) Verify CI

Skip if CI extension is not active. When inactive, Verify phase's local checks are the final quality gate.

When active:
- Wait for CI pipeline to pass after PR creation
- **CI failure recovery**: `gh pr ready --undo` (PR → draft), then back to appropriate phase
- On re-entry: existing PR is updated

### Step 5: (Extension) PR Auto-Merge

Skip if PR auto-merge extension is not active, or if PR extension is not active.

When active (after CI passes or after PR creation if CI is inactive):

```bash
gh pr merge --squash --delete-branch
```

Then clean up the local branch:

```bash
git checkout main
git pull origin main
git branch -d {feature-branch}
```

**Rules:**
- Uses `--squash` for a clean single-commit history on main
- `--delete-branch` removes the remote branch automatically
- Local branch is deleted after switching to main
- On failure: do NOT retry automatically. Report the error and let the user decide.
- If PR has unresolved review comments, `gh pr merge` will fail — this is expected. Report and wait for user action.

### Step 6: Archive state.json

```
.workflow/state.json → .workflow/history/{slug}.json
```

- Preserves complete workflow history
- Available for reference when implementing similar features
- **Only after all processes (core + extensions) succeed**
- After archiving, ready for next `/workflow start`

---

## CI Failure Recovery

```
Ship entry → PR created → CI runs
  │
  ├─ CI passes → (Auto-Merge → Branch cleanup) → Archive → Workflow complete
  │
  └─ CI fails
       ├─ gh pr ready --undo (PR → draft)
       ├─ Analyze cause
       │   ├─ Verification failure (test/lint/type) → /workflow back verify
       │   ├─ Code issue → /workflow back implement
       │   ├─ Design issue → /workflow back design
       │   └─ Environment issue → Fix CI config, re-enter Ship
       └─ Fix in target phase → Verify re-approval → Ship re-entry
           → Full process re-executes (see §Re-entry)
```

**Back target selection:**
- `back verify`: CI found issue that local verification missed
- `back implement`: Code changes needed
- `back design` / `back specify`: Design or requirement level issue

---

## Prohibitions

| Prohibited | Reason | Correct Approach |
|-----------|--------|-----------------|
| Code changes | Implement scope | `/workflow back implement` |
| Test changes | Implement scope | `/workflow back implement` |
| Requirement/design changes | Spec/Design scope | `/workflow back specify` or `/workflow back design` |
| Re-running verification | Verify scope | `/workflow back verify` |

**Core principle**: Ship only **wraps up and delivers**. Any issue discovered → back to appropriate phase.

---

## Extension Activation

Extensions are configured in `.workflow/config.json` (created by `/workflow setup`):

| Extension | Default | Description |
|-----------|---------|-------------|
| PR Creation | **Active** | Run `gh pr create` in Ship |
| PR Auto-Merge | Inactive | Merge PR + delete branches after CI passes |
| CI Check | Inactive | Wait for CI pass after PR |

When PR extension is inactive, Ship outputs manual integration guidance before archiving (see Step 3).

---

## Status Transitions

| Current Status | Trigger | Next Status |
|----------------|---------|-------------|
| `in_progress` | All steps succeed | `approved` (workflow complete) |
| `in_progress` | Extension failure (CI) | back → appropriate phase |

Ship does not use `reviewing` or `needs_revision` — it either completes or backs out.
