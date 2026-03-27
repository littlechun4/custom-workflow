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
hooks: hooks/hooks.json
---

# Workflow Orchestrator

Manages state transitions and phase dispatch for the 5-phase development workflow.

**Principle**: The orchestrator handles **state transitions only**. Phase-internal activities (document authoring, code implementation, review) are delegated to each phase skill.

## Conditional Reference Loading

Load these references on demand — do NOT read them unless the condition applies:

| Reference | When to Read |
|-----------|-------------|
| `references/review-protocol.md` | On `/workflow next` (review + transition) |
| `references/extensions.md` | On `/workflow setup` and Ship phase (extension behavior reference) |
| `references/auto-mode.md` | When `execution.mode = "auto"` in state.json |
| `references/back-navigation.md` | On `/workflow back` (cascade logic + target mapping) |

## Commands

| Command | Purpose |
|---------|---------|
| `/workflow start {feature} [--auto] [--parallel]` | Start new workflow (gear detection + state.json creation) |
| `/workflow setup` | Install/configure workflow skills and extensions |
| `/workflow next [--force]` | Review current phase → transition to next phase (2-step) |
| `/workflow back [target] [reason]` | Return to previous/specified phase + record feedback |
| `/workflow back --slice {id} [reason]` | Rework a specific slice only |
| `/workflow status` | Display current state dashboard |
| `/workflow gear [N]` | Manual gear override |
| `/workflow parallel [on|off]` | Enable/disable parallel slice execution (Implement phase) |
| `/workflow abort [reason]` | Abort workflow + archive |
| `/workflow resume` | Restore session (state.json + artifact loading) |
| `/workflow history` | List completed/aborted workflows |
| `/workflow limits {key} {value}` | Override hard limits for auto mode |
| `/workflow done` | Complete Gear 1 workflow (brief → implement → ship-lite) |

---

## /workflow start {feature}

1. Check if `.workflow/state.json` exists
   - If exists, present options:
     - `a) /workflow resume` — continue existing workflow
     - `b) /workflow abort` — archive existing, then start new
     - `c) /workflow status` — check current state before deciding
2. **Branch status check** (always runs, before gear detection):
   - Read `.workflow/config.json` for extension settings
   - If config.json missing: display `"Run /workflow setup to configure extensions (branch, PR, etc.)"` and continue with all extensions disabled
   - Run `git branch --show-current` to get current branch
   - Check if current branch is already merged into base branch (main/develop):
     `git branch --merged main` or `git branch --merged develop`
   - Check if working directly on main/develop (warn against this)
   - **If issues found**: display warning and offer options:
     ```
     [workflow] Branch check:
       Current branch: {branch}
       ⚠ {issue description}
       → a) Create new branch: feat/{feature-slug}
       → b) Continue on current branch
       → c) Enter custom branch name
     ```
   - **If branch extension enabled** and no issues: auto-create `feat/{feature-slug}` branch
   - **If branch extension disabled** and no issues: display current branch info and continue
3. **Scan past insights**: If `.workflow/history/` exists, scan history files for `insights` arrays. Display any that may be relevant to the new feature:
   ```
   [workflow] Relevant insights from past workflows:
     • (audit-log-detail-view) PostgreSQL advisory lock은 트랜잭션 끝나도 안 풀림
     • (pethroom-friends-metric) dlt merge 시 staging 테이블 스키마 주의
   ```
   If no relevant insights, skip silently.
4. Explore codebase to detect gear level
5. Gear 1 → lightweight workflow:
   - Create `.workflow/` directory if it doesn't exist
   - (Extension) Create branch if branch extension enabled
   - Write brief document `workflow_docs/brief/{feature-slug}.md`:
     ```markdown
     # {Feature Name}

     ## What
     {1-2 sentence description}

     ## Why
     {Background/motivation}

     ## Approach
     {How to implement — key decisions, approach summary}

     ## Changes
     - `path/to/file` — {what changes}
     - `path/to/file` — {what changes}
     ```
   - Write `.workflow/state.json` (minimal):
     ```json
     {
       "$schema": "workflow-state-v1",
       "feature": { "name": "{feature}", "slug": "{slug}", "branch": "{branch|null}" },
       "gear": { "detected": 1, "override": null, "reason": "{rationale}" },
       "phase": { "current": "implement", "status": "in_progress" },
       "artifacts": { "brief": "workflow_docs/brief/{slug}.md" },
       "insights": [],
       "meta": { "createdAt": "{ISO8601}", "workflowVersion": "1.0" }
     }
     ```
   - Implement directly. Commits are made freely during implementation.
   - On completion: run `/workflow done` to wrap up
6. Gear 2-3:
   - Create `.workflow/` directory
   - Initialize `state.json` per `references/state-schema.md`. Key overrides: `--auto` sets `execution.mode = "auto"` and `execution.report = "workflow_docs/reports/{feature-slug}-report.md"`, `--parallel` sets `execution.parallelMode = true`.
   - Invoke `/workflow-specify` via Skill tool

### Gear Detection Criteria

```
"Can this change be described in a single sentence?"
  Yes + 1-2 files → Gear 1 (skip workflow)
  No  + 3-10 files → Gear 2
  No  + 10+ files  → Gear 3
```

---

## /workflow next

Operates in 2 steps based on `phase.status`.

### Step 1: Review (in_progress / partial_rework → reviewing)

1. Set `phase.status` to `reviewing`
2. Invoke current phase skill via **Skill tool**.
   The phase skill reads `phase.status = reviewing` and executes its full Review Process.
   **Do NOT run any review logic inline here.**
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
```

### Slice-Level Rework

```
/workflow back --slice B-2 "reason"  →  Mark slice as needs_rework, partial_rework status
```

### Common Processing

1. Record in `feedback` array: `{fromPhase, toPhase, type, description}`
2. On long-range escalation: set `artifacts.designStale = true` for intermediate phases
3. Append current phase to `phase.history`
4. Transition to target: `current = target`, `status = in_progress`, `draftCount = 0`
5. Invoke target phase skill via Skill tool

For rework cascade logic, dependency propagation, and target mapping table, read `references/back-navigation.md`.

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
- When enabled, independent slices execute in parallel on a shared working copy
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
   - Check `slices` array for incomplete slices (status != `completed`)
   - Report progress and offer to continue remaining slices
5. Invoke current phase skill via Skill tool

**Note**: The SessionStart hook (see `hooks/hooks.json`) handles automatic context injection on session start. `/workflow resume` is for explicit manual restoration when the hook is not active or state needs re-syncing.

## /workflow history

List JSON files in `.workflow/history/`:
```
[workflow] Completed/Aborted Workflows:
  1. user-notifications (gear 2, completed, 2026-03-05)
  2. fix-button-label-typo (gear 1, direct, 2026-03-04)
  3. auth-refactor (gear 2, aborted: "scope too large", 2026-03-03)
```

Gear 1 entries show `completed` with gear 1.

---

## /workflow done

Complete a Gear 1 workflow. Only valid when `gear.detected = 1` (or `gear.override = 1`).

1. **Collect changes**: Run `git log` to find commits since workflow started (compare against `meta.createdAt`)
2. **Update brief**: Add actual changes to the brief document if they differ from the plan
3. **Capture insights**: Same criteria as Ship Step 1 — non-obvious gotchas only. Add to `insights` array
4. **Summary**: Record in `state.json`:
   ```json
   {
     "summary": "{1-2 sentence summary of what was done}",
     "commits": ["abc1234", "def5678"],
     "changedFiles": ["path/to/file1", "path/to/file2"]
   }
   ```
5. **(Extension) PR**: If PR extension enabled, create PR. If disabled, show manual integration guidance (same as Ship)
6. **Archive**: `state.json` → `.workflow/history/{slug}.json`

```
[workflow] Done — {feature-name} (gear 1)
  Brief: workflow_docs/brief/{slug}.md
  Commits: 3
  Changed files: 4

  ⚠ PR extension is not active.
    git push origin {branch}
    gh pr create --base main

  Archived → .workflow/history/{slug}.json
```

If the user runs `/workflow done` on a Gear 2-3 workflow, reject: "Use `/workflow next` to progress through phases."

---

## /workflow setup

Manage workflow installation settings. For **initial installation**, see `SETUP.md` at the submodule root.

### Usage

Display current status and offer options:

```
[workflow] Setup — installed
  Submodule: .vendor/custom-workflow
  Skills: 6/6 linked ✓
  Agents: 4/4 linked ✓

  Current extensions:
    Branch creation: enabled
    PR creation: enabled
    PR auto-merge: disabled
    CI check: disabled

  Config: .workflow/config.json

  Options:
    a) Change extension settings
    b) Update submodule (git submodule update --remote)
    c) Re-link (fix broken symlinks)
    d) Done
```

### Flags

| Flag | Purpose |
|------|---------|
| `--extensions` | Jump directly to extension configuration |
| `--update` | Update submodule to latest and re-verify links |

---

## Phase Mapping

| Order | Phase | Skill | Next Skill | Artifact |
|-------|-------|-------|------------|----------|
| 1 | specify | `/workflow-specify` | `workflow-design` | `workflow_docs/spec/{feature}.md` |
| 2 | design | `/workflow-design` | `workflow-implement` | `workflow_docs/design/{feature}.md` + ADR (gear 3) |
| 3 | implement | `/workflow-implement` | `workflow-verify` | Source code + per-slice commits |
| 4 | verify | `/workflow-verify` | `workflow-ship` | None (results in state.json) |
| 5 | ship | `/workflow-ship` | — | CLAUDE.md update + archive |

Suggestions file (`workflow_docs/suggestions/{feature-slug}.md`) is created during review phases (specify/design/verify) when non-blocking items are found.

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

## Concurrency Constraint

Only one workflow can be active at a time. If `state.json` exists when `/workflow start` is called, present options (see § start above).
