# Auto Mode Reference

When started with `--auto`, the workflow runs from the current phase through Ship without waiting for user input. The user receives a comprehensive report at the end.

## Behavior Changes in Auto Mode

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

## Hard Limits

Auto mode runs until completion **or** until a hard limit is violated. On violation, the workflow **halts immediately** and requests user feedback.

```
Hard Limit                         Default    On Violation
─────────────────────────────────────────────────────────
phaseMaxDraft (per phase)          5          Halt: "Phase {X} exceeded {N} drafts"
totalBackCount (entire workflow)   3          Halt: "Workflow exceeded {N} back navigations"
samePhaseBackCount (to same phase) 2          Halt: "Returned to {X} {N} times"
designSpecMaxIterations            3          Halt: "Design↔Specify loop exceeded {N}"
```

## Halt Behavior

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

## Resuming After Halt

- `/workflow next --auto`: Resume auto mode (hard limit counters are NOT reset)
- `/workflow next`: Continue in manual mode (switches `execution.mode = "manual"`)
- User can also adjust limits: `/workflow limits phaseMaxDraft 7`

## Auto-Mode Report

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

## `/workflow limits`

Override hard limits for the current workflow:

```
/workflow limits phaseMaxDraft 7
/workflow limits totalBackCount 5
```

Recorded in `execution.hardLimits`. Effective immediately.
