---
name: workflow-ship
description: |
  Workflow Ship Phase. Wraps up and delivers.
  Updates CLAUDE.md with learned patterns, archives state.json,
  and optionally creates PR / checks CI / syncs issue tracker.

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
  ├─ 1. Update CLAUDE.md (learned patterns)
  ├─ 2. (Extension: PR) Create or update PR
  ├─ 3. (Extension: CI) Verify CI passes
  ├─ 4. (Extension: Issue Tracker) Transition issue status
  ├─ 5. Archive state.json → .workflow/history/{slug}.json + delete active state
  │
  └─ Workflow complete
```

**Archive is always the last step.** Extensions (PR/CI) may fail and require back, so state.json is only deleted after all processes succeed.

---

### Step 1: Update CLAUDE.md

Record patterns learned during this workflow:

- Newly discovered codebase patterns (usable as reference patterns)
- Technical decisions made (link to ADR if exists)
- Gotchas and pitfalls (for future reference)

**Recording criterion:**
> "Would this be useful to know when implementing a similar feature next time?"
> → Yes: record. → No: skip.

**Format**: Add a section or entries under the appropriate existing section in CLAUDE.md. Keep entries concise. Do not duplicate information already present.

### Step 2: (Extension) Create PR

Skip if PR extension is not active.

When active:
```bash
gh pr create \
  --title "feat: {feature-name}" \
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

## References
- Issue: {JIRA-42} (if linked)
EOF
)"
```

**Rules:**
- Record PR URL in `state.json` → `feature.pr`
- On re-entry: `gh pr edit` to update existing PR (no new PR)
- Based on `gh` (GitHub CLI). Other platforms (GitLab `glab`, etc.) use the same extension point

### Step 3: (Extension) Verify CI

Skip if CI extension is not active. When inactive, Verify phase's local checks are the final quality gate.

When active:
- Wait for CI pipeline to pass after PR creation
- **CI failure recovery**: `gh pr ready --undo` (PR → draft), then back to appropriate phase
- On re-entry: existing PR is updated

### Step 4: (Extension) Issue Tracker Sync

Only runs when `feature.jira` is set:

| Workflow Event | Issue Transition |
|----------------|-----------------|
| Ship phase (PR active) | In Progress → In Review |
| Ship phase (PR inactive) | In Progress → Done |
| After PR merge | In Review → Done |

When PR extension is inactive, skip "In Review" and transition directly to Done.

### Step 5: Archive state.json

```
.workflow/state.json → .workflow/history/{slug}.json
```

- Preserves complete workflow history
- Available for reference when implementing similar features
- **Only after all processes (core + extensions) succeed**
- After deletion, ready for next `/workflow start`

---

## CI Failure Recovery

```
Ship entry → PR created → CI runs
  │
  ├─ CI passes → Archive → Workflow complete
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

Extensions are configured in the project's CLAUDE.md or extensions reference:

| Extension | Default | Description |
|-----------|---------|-------------|
| PR Creation | Inactive | Run `gh pr create` in Ship |
| CI Check | Inactive | Wait for CI pass after PR |
| Issue Tracker | Inactive | Transition Jira/Linear status |

When all extensions are inactive, Ship completes with CLAUDE.md update + archive only.

---

## Status Transitions

| Current Status | Trigger | Next Status |
|----------------|---------|-------------|
| `in_progress` | All steps succeed | `approved` (workflow complete) |
| `in_progress` | Extension failure (CI) | back → appropriate phase |

Ship does not use `reviewing` or `needs_revision` — it either completes or backs out.
