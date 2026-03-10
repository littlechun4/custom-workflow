---
name: workflow
description: |
  Structured development workflow orchestrator.
  Manages a 5-phase cycle: Specify → Design → Implement → Verify → Ship.
  Commands: start, next, back, status, gear, abort, resume, history.

  Activated on /workflow invocation. Detects gear level and dispatches to phase skills.
  Do NOT use for: simple fixes, typos, single-file changes (gear 1), non-development tasks.
argument-hint: "[command] [args]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
imports:
  - references/state-schema.md
  - references/review-protocol.md
  - references/extensions.md
hooks: hooks/hooks.json
---

# Workflow Orchestrator

Manages state transitions and phase dispatch for the 5-phase development workflow.

**Principle**: The orchestrator handles **state transitions only**. Phase-internal activities (document authoring, code implementation, review) are delegated to each phase skill.

## Commands

| Command | Purpose |
|---------|---------|
| `/workflow start {feature} [--auto] [--parallel]` | Start new workflow (gear detection + state.json creation) |
| `/workflow next [--force]` | Review current phase → transition to next phase (2-step) |
| `/workflow back [target] [reason]` | Return to previous/specified phase + record feedback |
| `/workflow back --slice {id} [reason]` | Rework a specific slice only |
| `/workflow status` | Display current state dashboard |
| `/workflow gear [N]` | Manual gear override |
| `/workflow parallel [on\|off]` | Enable/disable parallel slice execution (Implement phase) |
| `/workflow abort [reason]` | Abort workflow + archive |
| `/workflow resume` | Restore session (state.json + artifact loading) |
| `/workflow history` | List completed/aborted workflows |
| `/workflow limits {key} {value}` | Override hard limits for auto mode |

---

## /workflow start {feature}

1. Check if `.workflow/state.json` exists
   - If exists, present options:
     - `a) /workflow resume` — continue existing workflow
     - `b) /workflow abort` — archive existing, then start new
     - `c) /workflow status` — check current state before deciding
2. Explore codebase to detect gear level
3. Gear 1 → skip workflow — advise "Implement directly" and exit
4. Gear 2-3:
   - Create `.workflow/` directory
   - Create `state.json` (initial values below)
   - Invoke `/workflow-specify` via Skill tool

### Gear Detection Criteria

```
"Can this change be described in a single sentence?"
  Yes + 1-2 files → Gear 1 (skip workflow)
  No  + 3-10 files → Gear 2
  No  + 10+ files  → Gear 3
```

### Initial state.json

```json
{
  "$schema": "workflow-state-v1",
  "feature": {
    "name": "{feature}",
    "slug": "{feature-slug}",
    "jira": null,
    "branch": null,
    "pr": null
  },
  "gear": {
    "detected": 2,
    "override": null,
    "reason": "{detection rationale}"
  },
  "phase": {
    "current": "specify",
    "status": "in_progress",
    "draftCount": 0,
    "history": []
  },
  "artifacts": {
    "spec": null,
    "design": null,
    "designStale": false,
    "adr": []
  },
  "slices": [],
  "feedback": [],
  "context": {
    "loadOnResume": [],
    "referencePatterns": []
  },
  "execution": {
    "mode": "manual",
    "parallelMode": false,
    "maxParallelSlices": 3,
    "hardLimits": {
      "phaseMaxDraft": 5,
      "totalBackCount": 3,
      "samePhaseBackCount": 2,
      "designSpecMaxIterations": 3
    },
    "halted": false,
    "haltReason": null,
    "report": null
  },
  "meta": {
    "createdAt": "{ISO8601}",
    "updatedAt": "{ISO8601}",
    "designSpecIterations": 0,
    "workflowVersion": "1.0"
  }
}
```

When `--auto` flag is passed, set `execution.mode = "auto"` and `execution.report = "workflow_docs/reports/{feature-slug}-report.md"`.

When `--parallel` flag is passed, set `execution.parallelMode = true`. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable.

Full schema: see imported `references/state-schema.md`.

---

## /workflow next

Operates in 2 steps based on `phase.status`.

### Step 1: Review (in_progress / partial_rework → reviewing)

1. Set `phase.status` to `reviewing`
2. Invoke current phase skill's **review process**:
   - Auto-gate — structural/format checklist (blocks on failure)
   - Viewpoint review — qualitative review after auto-gate passes
   - Human gate — gear 3 only (varies by phase)
3. Result:
   - Issues found → `needs_revision` → fix instructions
   - No issues + human approval → `approved`

**needs_revision handling**: After AI completes fixes, set `in_progress` + `draftCount++`. User runs `/workflow next` again to re-review.

### Step 2: Transition (approved → next phase)

1. Determine next phase
2. Confirm: "Proceed to {NEXT PHASE}? [Y/n]"
3. On approval:
   - Append current phase to `phase.history`
   - Set `phase.current` → next phase
   - Set `phase.status` → `in_progress`
   - Set `phase.draftCount` → 0
   - Invoke next phase skill via Skill tool

### Ship Phase Special Handling

When Verify is approved → next → entering Ship, `/workflow-ship` runs automatically to completion. No additional `/workflow next` required.

### --force Option

Overrides blocking issues and forces progression. Records `force_skipped` in `feedback` array. Displays warning at the start of the next phase review.

---

## /workflow back

### Adjacent Return (no target argument)

```
/workflow back "reason"  →  return to immediately previous phase
```

### Long-Range Escalation (target specified)

```
/workflow back specify "reason"
/workflow back design "reason"
/workflow back implement "reason"
/workflow back verify "reason"
```

### Slice-Level Rework

```
/workflow back --slice B-2 "boundary values unhandled"
→ Mark B-2 as needs_rework
→ phase.current = implement, phase.status = partial_rework
→ Other completed slices remain intact
```

Multiple slices: call `back --slice` repeatedly to mark additional slices as `needs_rework`.

### Rework Cascade (dependency propagation)

When a reworked slice has downstream dependents (via `blockedBy`):

```
A-1 ← A-2 ← D-1 (dependency chain)

/workflow back --slice A-1 "model restructure needed"
→ A-1: needs_rework
→ A-2: needs_rework (depends on A-1, auto-propagated)
→ D-1: needs_rework (depends on A-2, auto-propagated)
→ B-1, C-1: completed (no dependency on A-1)
```

- Propagated slices get `reworkReason: "upstream slice {ID} reworked"`
- Rework executes in dependency order (A-1 → A-2 → D-1)
- If downstream slice tests still pass after upstream rework, restore to `completed` without code changes

### Common Processing

1. Record in `feedback` array: `{fromPhase, toPhase, type, description}`
2. On long-range escalation: set `artifacts.designStale = true` for intermediate phases
3. Append current phase to `phase.history`
4. Transition to target: `current = target`, `status = in_progress`, `draftCount = 0`
5. Invoke target phase skill via Skill tool

### Target Mapping

| Current Phase | back (no args) | specify | design | implement | verify |
|---------------|----------------|---------|--------|-----------|--------|
| design | specify | specify | — | — | — |
| implement | design | specify | design | — | — |
| verify | implement | specify | design | implement | — |
| ship | verify | specify | design | implement | verify |

`—` = current or future phase (not allowed).

---

## /workflow status

Read state.json and display dashboard:

```
[workflow] {feature} (gear {N})
Phase: {CURRENT} — {status} (draft #{draftCount})

Phase History:
  [done] Specify (draft 2)
  [done] Design (draft 1)
  [active] Implement — partial_rework

Slice Progress: {completed}/{total}
  [done] A-1: {name}
  [rework] B-2: {name} — {reworkReason}
  [pending] C-1: {name}

Feedback: {count} entries ({unresolved} unresolved)
```

---

## /workflow gear [N]

- Record in `gear.override` and `gear.reason`
- **Upgrading (2→3)**: Retroactively apply additional requirements (ADR mandatory, etc.)
- **Downgrading (3→2)**: Keep existing artifacts, apply lower gear requirements for subsequent phases
- If `phase.status` is `reviewing`/`needs_revision`, reset to `in_progress`

## /workflow parallel [on|off]

Toggle parallel slice execution for the Implement phase. User-explicit only — never auto-activated.

```
/workflow parallel on    → execution.parallelMode = true
/workflow parallel off   → execution.parallelMode = false
```

- Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable
- Only affects Implement phase (other phases unchanged)
- Can be toggled before entering Implement phase
- When enabled, independent slices (no `blockedBy` overlap) execute in parallel worktree agents
- Lead manages test execution via test lock protocol (one test suite runs at a time)
- See `workflow-implement` SKILL.md §Parallel Execution for full details

---

## /workflow abort [reason]

1. Archive `state.json` → `.workflow/history/{slug}.json` (include abort reason)
2. Do NOT delete `workflow_docs/` files (preserve in git)
3. Keep branches/commits intact (no git operations)

## /workflow resume

1. Read `.workflow/state.json` — determine phase, status, slice progress
2. Load files listed in `context.loadOnResume`
3. Check `artifacts.designStale` → if true, notify user
4. If `parallelMode = true` and phase is `implement`:
   - Check for orphaned worktree branches: `git branch --list "wf/slice-*"`
   - For each found branch, check latest commit for `[Slice-ID]` tag
   - Report findings and offer to merge completed work
   - Clean up orphaned worktrees: `git worktree remove`
5. Invoke current phase skill via Skill tool

**Note**: The SessionStart hook (see `hooks/hooks.json`) handles automatic context injection on session start. `/workflow resume` is for explicit manual restoration when the hook is not active or state needs re-syncing.

## /workflow history

List JSON files in `.workflow/history/`:
```
[workflow] Completed/Aborted Workflows:
  1. user-notifications (completed, 2026-03-05)
  2. auth-refactor (aborted: "scope too large", 2026-03-03)
```

---

## Phase Mapping

| Order | Phase | Skill | Next Skill | Artifact |
|-------|-------|-------|------------|----------|
| 1 | specify | `/workflow-specify` | `workflow-design` | `workflow_docs/spec/{feature}.md` |
| 2 | design | `/workflow-design` | `workflow-implement` | `workflow_docs/design/{feature}.md` + ADR (gear 3) |
| 3 | implement | `/workflow-implement` | `workflow-verify` | Source code + per-slice commits |
| 4 | verify | `/workflow-verify` | `workflow-ship` | None (results in state.json) |
| 5 | ship | `/workflow-ship` | — | CLAUDE.md update + archive |

Suggestions file (`workflow_docs/suggestions/{feature-slug}.md`) is created during review phases (specify/design/verify) when non-blocking items are found. It persists in git across workflow completion.

## Phase Status Values

| Status | Meaning |
|--------|---------|
| `in_progress` | Phase work in progress |
| `reviewing` | AI review in progress or awaiting human review |
| `needs_revision` | Issues found in review, fixes required |
| `approved` | Review passed, ready for next phase |
| `partial_rework` | Partial slice rework in progress (implement phase only) |

## draftCount Threshold

```
≤ 2: Normal range
= 3: Warning — "This is draft #3. Identify the root cause first."
≥ 4: Interrupt — choose one:
  A) /workflow next --force (force progression, recorded in feedback)
  B) /workflow back (re-examine previous phase)
  C) /workflow abort (reduce scope and restart)
```

## Gear Comparison

| Aspect | Gear 2 | Gear 3 |
|--------|--------|--------|
| Human gate | None (AI auto-approves) | Required (human sign-off) |
| ADR | Only when applicable | Mandatory |
| Viewpoints | Context-relevant only | Full catalog |
| Design-Specify round-trips | Max 3 | Max 3 |

## Auto Mode

When started with `--auto`, the workflow runs from the current phase through Ship without waiting for user input. The user receives a comprehensive report at the end.

### Behavior Changes in Auto Mode

| Aspect | Manual Mode | Auto Mode |
|--------|-------------|-----------|
| Phase transition | `/workflow next` required | `approved` → auto-advance |
| Transition confirmation | "Proceed? [Y/n]" prompt | Skipped |
| `needs_revision` | Fix → wait for `/workflow next` | Fix → auto re-review |
| Design CP1 | User confirms direction | AI self-verifies and proceeds |
| Gear 3 human gate | User approval required | Skipped (AI review only) |
| `draftCount` soft warning (=3) | Warning message | Logged, continues |
| Escalation back target | User selects | AI analyzes and selects |
| Non-blocking issues | User decides `--force` | Auto-force, logged in report |
| Output | Real-time per step | Comprehensive report on completion |

### Hard Limits

Auto mode runs until completion **or** until a hard limit is violated. On violation, the workflow **halts immediately** and requests user feedback.

```
Hard Limit                         Default    On Violation
─────────────────────────────────────────────────────────
phaseMaxDraft (per phase)          5          Halt: "Phase {X} exceeded {N} drafts"
totalBackCount (entire workflow)   3          Halt: "Workflow exceeded {N} back navigations"
samePhaseBackCount (to same phase) 2          Halt: "Returned to {X} {N} times"
designSpecMaxIterations            3          Halt: "Design↔Specify loop exceeded {N}"
```

### Halt Behavior

When a hard limit is hit:

1. Set `execution.halted = true` and `execution.haltReason = "{description}"`
2. Write progress so far to the report file
3. Output halt message with context:

```
[workflow] AUTO MODE HALTED
Reason: Phase "design" exceeded 5 draft revisions.
Current state: design — needs_revision (draft #5)

Progress so far has been written to:
  workflow_docs/reports/{feature-slug}-report.md

Options:
  A) Fix the issue and run /workflow next --auto to resume auto mode
  B) /workflow next to continue in manual mode
  C) /workflow back [target] to re-examine a previous phase
  D) /workflow abort to terminate
```

### Resuming After Halt

- `/workflow next --auto`: Resume auto mode (hard limit counters are NOT reset)
- `/workflow next`: Continue in manual mode (switches `execution.mode = "manual"`)
- User can also adjust limits: `/workflow limits phaseMaxDraft 7`

### Auto-Mode Report

Generated at `workflow_docs/reports/{feature-slug}-report.md`. Written incrementally — each phase appends its section on completion. Also written on halt.

```markdown
# Workflow Report: {Feature Name}
<!-- mode: auto | gear: {N} | status: {completed|halted} -->

## Summary
- **Feature**: {name}
- **Gear**: {N}
- **Result**: completed | halted at {phase} ({reason})
- **Total drafts**: {sum across phases}
- **Back navigations**: {count}
- **Force-skipped issues**: {count}

## Specify — approved (draft #{N})
### Auto-Gate
{pass/fail summary}
### Viewpoint Review
{active viewpoints, issues found, resolution}
### Force-Skipped
{list of non-blocking issues skipped, or "None"}

## Design — approved (draft #{N})
### CP1: Approach (auto-approved)
{approach summary + rationale}
### Auto-Gate
{pass/fail summary}
### Viewpoint Review
{active viewpoints, issues found, resolution}
### Force-Skipped
{list or "None"}

## Implement — approved (draft #{N})
### Slice Progress
{slice completion table}
### Auto-Gate
{test/lint/type results}
### Escalations
{back navigations during implement, or "None"}

## Verify — approved (draft #{N})
### 5-Axis Review
| Axis | Result | Issues |
{per-axis summary}
### Minor Fixes Applied
{list of direct fixes, or "None"}
### Force-Skipped
{list or "None"}

## Ship — completed
### Actions Taken
{CLAUDE.md update, PR, CI, archive status}
```

### `/workflow limits`

Override hard limits for the current workflow:

```
/workflow limits phaseMaxDraft 7
/workflow limits totalBackCount 5
```

Recorded in `execution.hardLimits`. Effective immediately.

---

## Concurrency Constraint

Only one workflow can be active at a time. If `state.json` exists when `/workflow start` is called, present options (see § start above).
