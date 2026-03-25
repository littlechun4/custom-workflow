# Extensions Reference

Optional extension definitions and configuration for the workflow.

Default: All extensions **disabled** until `/workflow setup` initializes `.workflow/config.json`. Setup defaults Branch and PR creation to **enabled**, CI and auto-merge to **disabled**.

---

## Extension List

| Extension | Setup Default | Trigger Point |
|-----------|--------------|---------------|
| Branch creation | **Enabled** | On `/workflow start` |
| PR creation | **Enabled** | Ship Phase |
| PR auto-merge | Disabled | Ship Phase (after CI or after PR if CI inactive) |
| CI check | Disabled | After PR creation |
| Parallel execution | Disabled | Implement Phase |

**Note**: "Setup Default" is the value `/workflow setup` proposes. Without config.json, all extensions are disabled.

---

## Configuration

Extensions are configured in `.workflow/config.json`. The `/workflow setup` command creates and manages this file interactively.

**If `.workflow/config.json` does not exist, all extensions are disabled.** Run `/workflow setup` to initialize.

### .workflow/config.json

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

- Created by `/workflow setup` (step 5)
- Persists across workflows (not archived with state.json)
- Can be committed to git for team-wide consistency

---

## Extension: Branch Creation

Runs at `/workflow start`.

```bash
git checkout -b feat/{feature-slug}
```

- Records branch name in `state.json` → `feature.branch`
- If branch already exists, checkout only (no new branch)
- When disabled: orchestrator still performs branch status check (see §Branch Status Check) and displays current branch info

### Branch Status Check (always runs, regardless of extension)

On `/workflow start`, the orchestrator always checks:

1. **Current branch**: `git branch --show-current`
2. **Already-merged check**: Whether current branch is already merged into the base branch
3. **Base branch detection**: Working on main/develop directly without a feature branch

```
[workflow] Branch check:
  Current branch: feature/audit-log-coverage
  ⚠ This branch is already merged into main.
  → Create a new branch? [Y/n]
  → Branch name: feat/{feature-slug} (or custom)
```

When branch extension is disabled and no issues detected:
```
[workflow] Branch: working on '{current-branch}'
  (Branch extension is inactive — no automatic branch creation)
```

---

## Extension: PR Creation

First extension step of Ship Phase.

```bash
gh pr create \
  --title "feat: {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
{Spec summary — 1-3 sentences}

## Changes
{Per-slice change summary}

## Design Doc
- Spec: workflow_docs/spec/{feature}.md
- Design: workflow_docs/design/{feature}.md

## Test Plan
{Verify Phase results summary}

EOF
)"
```

- Records PR URL in `state.json` → `feature.pr` after creation
- On Ship **re-entry**: `gh pr edit` to update existing PR (no new PR)
- Based on GitHub CLI (`gh`). For GitLab, substitute with `glab`

When PR extension is disabled, Ship Phase outputs manual integration guidance (see §Disabled Extension Guidance).

---

## Extension: CI Check

Runs after PR creation.

```
PR created
  → CI pipeline starts automatically (GitHub Actions, etc.)
  → Poll status: gh pr checks --watch
  → Pass → next step (archive)
  → Fail → CI failure recovery flow (below)
```

### CI Failure Recovery Flow

```
CI failure
  → gh pr ready --undo (PR → draft)
  → Root cause analysis:
      Test/lint failure → /workflow back verify
      Code issue → /workflow back implement
      Design issue → /workflow back design
      Environment issue (CI config itself) → fix CI config, re-enter Ship
  → Fix in target phase → re-pass Verify → re-enter Ship
  → Full Ship process re-executes (idempotent)
```

---

## Extension: PR Auto-Merge

Runs in Ship Phase after CI passes (or after PR creation if CI is inactive). Requires PR extension to be active.

```bash
gh pr merge --squash --delete-branch
```

Then clean up the local branch:

```bash
git checkout main
git pull origin main
git branch -d {feature-branch}
```

- Uses `--squash` for a clean single-commit history on main
- `--delete-branch` removes the remote branch automatically
- Local branch is deleted after switching to main
- On failure: do NOT retry automatically. Report the error and let the user decide
- If PR has unresolved review comments, `gh pr merge` will fail — report and wait for user action

---

## Extension: Parallel Execution

Enables Teams-based parallel slice execution in the Implement phase.

**Prerequisite**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable.

**Activation**: `/workflow start --parallel` or `/workflow parallel on`

```
execution.parallelMode = true
execution.maxParallelSlices = 3   (configurable)
```

- Independent slices (no `blockedBy` overlap, no `changedFiles` overlap) execute in parallel on a shared working copy
- Lead manages test execution (test lock) and git commits (commit lock)
- State.json updates are batched per tier (hooks skip in Teammate context)
- See `workflow-implement` SKILL.md §Parallel Execution for full details

---

## Disabled Extension Guidance

When extensions are inactive, Ship Phase outputs explicit manual integration guidance instead of silently completing.

### PR extension inactive

Manual guidance is shown **before** archive (Step 3 in Ship). Archive still runs as the final step.

```
[workflow] Ship Phase
  ✓ CLAUDE.md updated

  ⚠ PR extension is not active. Manual integration needed:
    Current branch: {current-branch}
    Base branch: {base-branch} (main or develop)
    Commits: {N} commits ahead of {base-branch}

    Suggested steps:
      git push origin {current-branch}
      gh pr create --base {base-branch}

    To enable automatic PR creation: /workflow setup --extensions

  ✓ State archived → .workflow/history/{slug}.json
  Done.
```

### Both Branch and PR extensions inactive

```
[workflow] Ship Phase
  ✓ CLAUDE.md updated

  ⚠ Branch/PR extensions are not active.
    All work is on: {current-branch}
    Review your changes and integrate manually:
      git log {base-branch}..HEAD --oneline
      git push origin {current-branch}

    To configure extensions: /workflow setup --extensions

  ✓ State archived → .workflow/history/{slug}.json
  Done.
```

### All extensions active (normal flow)

No extra messaging — Ship handles PR creation, CI, and cleanup automatically.
