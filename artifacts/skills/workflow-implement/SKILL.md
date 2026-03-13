---
name: workflow-implement
description: |
  Workflow Implement Phase. Executes the design plan via TDD.
  Runs slice-by-slice Red→Green→Refactor→Commit cycles.
  Code is the only artifact — no separate documents produced.

  Auto-invoked by the workflow orchestrator when entering the Implement phase.
  Do NOT use for: spec authoring, design decisions, code review, test strategy.
user-invocable: false
next-skill: workflow-verify
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
agents:
  review: workflow:code-reviewer
  implementer: workflow:slice-implementer
---

# Implement Phase

**"Execute the design plan via TDD."** Slice-by-slice Red→Green→Refactor→Commit cycles. Code is the only artifact.

---

## Entry Behavior

### First Entry (no completed slices)

1. Load design from `artifacts.design` path
2. Load spec from `artifacts.spec` path (for AC reference)
3. Read slice definitions from design document
4. Populate `slices` array in state.json (all `pending`)
5. Determine execution order from slice dependency DAG
6. Begin first slice TDD cycle
7. "Starting implementation. {N} slices to complete."

### Re-entry (returned via back)

1. Load design and spec documents
2. Check `feedback` array for return reason
3. If `partial_rework`: identify slices marked `needs_rework`, execute only those
4. If full re-entry from design: analyze design diff, mark affected slices `needs_rework`, keep unaffected as `completed`
5. "Return reason: {reason}. Resuming implementation."

---

## TDD Cycle (per slice)

Each slice runs an independent TDD cycle:

```
Slice N start (status: pending or needs_rework)
  1. Read Slice N's "test intent" from design
  2. Write failing test (Red)
  3. Minimal implementation (Green)
  4. Refactor — improve structure, preserve behavior
  5. Auto-verify:
     - lint (per project config, source code files only — skip static assets, templates, and non-applicable file types)
     - type check (source code files only)
     - test (full suite or relevant scope)
  6. Commit (see §Commit Convention)
  7. state.json slice status updated (via post-bash hook)
  8. Move to next slice
```

### Red (Failing Test)

- Convert the slice's "test intent" into test code
- Verify the test fails **for the correct reason** (import error ≠ valid failure)
- Test scope: only files listed in slice's "changed files"

### Green (Minimal Implementation)

- Write the **minimum code** to pass the failing test
- No speculative code — only what the current test demands
- Follow the design's "reference pattern" for codebase-consistent style

### Refactor

- Improve structure without changing behavior
- Remove duplication, improve naming, extract where needed
- Re-run tests after refactoring to confirm behavior preservation

---

## Commit Convention

**Format** (Conventional Commits + Slice ID):

```
feat({scope}): {description} [{Slice-ID}]    ← slice implementation
fix({scope}): {description} [{Slice-ID}]     ← rework fix
```

**Rules:**
- **Initial implementation: 1 Slice = 1 Commit** (atomicity)
- Rework from Verify (`/workflow back --slice N`): additional fix commits allowed
- One slice may have **1 feat + N fix** commits
- `[Slice-ID]` in commit message enables post-bash hook to auto-update state.json
- Example: `feat(notifications): add Notification model [A-1]`

**Rework commit:**
```
fix(notifications): add boundary check for empty list [B-1]
```

---

## Slice State Management

### Slice Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Currently being worked on |
| `completed` | Done (committed) |
| `needs_rework` | Rework required (from Verify feedback) |

### Progress Tracking

Managed via `slices` array in state.json (auto-updated by hook):

```json
"slices": [
  {"id": "A-1", "name": "Notification model", "status": "completed", "acs": ["R-1"], "commit": "abc1234"},
  {"id": "A-2", "name": "Comment signal", "status": "in_progress", "acs": ["R-1", "R-2"], "commit": null},
  {"id": "B-1", "name": "Notification list API", "status": "pending", "acs": ["R-3", "R-4"], "commit": null}
]
```

### AC Coverage Tracking

- Slice completion → ACs in that slice's `acs` field are covered
- Design document is NOT modified (no role boundary crossing)
- Verify phase confirms final AC coverage via state.json

---

## Review Process

When `/workflow next` is called, the orchestrator invokes this skill's review.

### Auto-Gate (blocks on failure)

Mechanically verify after all slices are completed:

- [ ] All slices have status `completed` (no `needs_rework`)
- [ ] Full test suite passes
- [ ] Type check passes
- [ ] Lint passes
- [ ] No existing tests broken (regression)

**No human review or viewpoint review**. Implement's auto-gate is purely mechanical pass/fail. Qualitative code review (reusability, security, patterns) is performed in the Verify phase.

Failure → `needs_revision` → AI auto-fixes → `in_progress` → re-verify.
Pass → `approved` → `/workflow next` enters Verify.

### Code Reviewer Agent

The `code-reviewer` agent is bound for the Verify phase's use when reviewing implementation quality. During the Implement phase itself, only the auto-gate runs.

---

## Escalation Rules

### Same Error 3 Times

If the same error recurs 3+ times → signal that the approach is wrong:
1. Stop current attempt
2. Analyze cause: Design issue vs Spec issue vs Environment issue
3. `/workflow back design` or `/workflow back specify`

### Requirement Issue Discovered

When a spec problem is found during implementation:
- **Do not modify the spec directly**
- Report: problem + alternatives + trade-offs
- `/workflow back specify "R-3 requirement is technically infeasible"`

### Design Issue Discovered

When a design problem is found during implementation:
- Stop current slice
- Report: problem + impact scope + alternatives
- `/workflow back design "Reference pattern is deprecated, need alternative"`

### Slice-Level Rework

When Verify finds issues in specific slices:

```
/workflow back --slice B-2 "boundary values 0, -1 unhandled"
→ Mark B-2 as needs_rework
→ Other completed slices remain intact
→ After B-2 rework, /workflow next re-enters Verify
```

### Implement → Design Back: Slice Handling

Completed slices are **preserved**. After design re-approval and implement re-entry:
1. AI analyzes design change scope (diff)
2. Affected slices → `needs_rework`
3. Unaffected slices → remain `completed`
4. New slices → `pending`

---

## Prohibitions

| Prohibited | Reason | Correct Approach |
|-----------|--------|-----------------|
| Changing requirements | Spec scope | `/workflow back specify` |
| Changing design (new file structure, new approach) | Design scope | `/workflow back design` |
| Out-of-scope code | Scope creep | Only code in design slices |
| Implementation without tests | TDD violation | Always Red→Green order |
| Committing code you don't understand | Quality risk | Ask human for clarification |
| Code quality review (reusability, security) | Verify scope | Implement focuses on "building" |

---

## Document Update Policy (during implementation)

### Must Escalate

| Situation | Action |
|-----------|--------|
| Requirement change discovered | `/workflow back specify` |
| File structure significantly differs from design | `/workflow back design` |

### Skip Update

| Situation | Reason |
|-----------|--------|
| Function/variable names differ from design | Code is source of truth |
| Implementation order within file differs | Order is a guideline |
| Test cases added/changed | Test code is self-documenting |
| Refactoring changes structure | No change at design abstraction level |

**Decision criterion**: "Would this difference cause confusion in Verify?" → Yes: escalate. No: continue.

---

## Parallel Execution (Teams-based)

When `execution.parallelMode = true`, independent slices execute in parallel using Teams API on a shared working copy. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

Each Teammate is spawned using the `slice-implementer` agent (`model: sonnet`) for cost-effective parallel execution. The Lead (main session) retains its current model. Teammates write code only — test execution and git commits are serialized by the Lead.

### Tier Computation

Compute tiers from `blockedBy` at phase entry:

```
tier(S) = 0                                           if blockedBy(S) = []
tier(S) = max(tier(dep) for dep in blockedBy(S)) + 1  otherwise
```

### File Conflict Validation

Before executing a tier, compare `changedFiles` across all same-tier slices:
- No overlap → parallel execution
- Overlap found → move conflicting slice to next tier, notify user

### Execution Flow

```
Lead (main session): Team creation + lock management + commits + state.json updates

Tier 0: [A-1, B-1, C-1] — spawn Teammates (shared working copy)
  ├─ Teammate(A-1): write test → request test lock → run test (Red) → release
  │                  write code → request test lock → run test (Green) → release
  │                  refactor → request test lock → run test → release
  │                  → request commit lock → Lead commits [A-1] → release
  ├─ Teammate(B-1): (same cycle, waits for locks when needed)
  └─ Teammate(C-1): (same cycle, waits for locks when needed)

All Teammates complete → Lead: state.json batch update
Tier 1: [A-2] — single slice, sequential execution

Lead: integration test (full suite after all tiers)
```

When `maxParallelSlices < tier slice count`: batch execution (e.g., 5 slices, max 3 → run 3, wait, run 2).

### Test Lock Protocol

Lead serializes test execution to prevent shared resource conflicts (DB, ports).

```
Teammate → Lead: SendMessage("test-lock-request", {sliceId, phase: "red|green|refactor"})
Lead: if lock free → SendMessage("test-lock-granted", {sliceId})
      if lock held → queue request, grant when released
Teammate: run test
Teammate → Lead: SendMessage("test-lock-release", {sliceId, result: "pass|fail"})
Lead: release lock → grant next queued request
```

### Commit Lock Protocol

Lead serializes git commits to prevent staging/index conflicts on the shared working copy.

```
Teammate → Lead: SendMessage("commit-lock-request", {sliceId, files: [...], message: "feat(...): ... [Slice-ID]"})
Lead: stage files + commit + SendMessage("commit-lock-granted", {sliceId, commit: "{hash}"})
```

Teammates do NOT run `git add` or `git commit` directly. The Lead performs all git operations.

Code writing is parallel; test execution and commits are serialized. Since code writing takes longer than either, most parallelism is preserved.

### Teammate Context

Each Teammate receives:

```
You are implementing Slice {ID}: {Name}
You are a Teammate in a parallel implementation team. The Lead manages test execution and git commits.

## Your Slice
- Test intent: {from design}
- Changed files: {file list}
- Reference patterns: {from context.referencePatterns}

## Rules
- TDD cycle: Red → Green → Refactor → request commit
- ONLY modify files in your Changed files list
- Do NOT modify spec, design, or state.json
- Do NOT run git add/commit — request commit lock from Lead
- Do NOT escalate directly — if blocked, report the issue and stop

## Test Execution Protocol
- Before running any test, send "test-lock-request" to Lead
- Wait for "test-lock-granted" before executing tests
- After test completes, send "test-lock-release" with result

## Commit Protocol
- After TDD cycle completes (all tests pass), send "commit-lock-request" to Lead
  with {sliceId, files: [changed file list], message: "feat({scope}): {description} [{Slice-ID}]"}
- Lead stages, commits, and responds with commit hash
```

### Teammate Failure Handling

```
Tier 0 execution:
  Agent(A-1): completed ✓
  Agent(B-1): failed (design issue or TDD failure 3×)
  Agent(C-1): completed ✓

→ Wait for all Teammates to finish (do not abort running agents)
→ Completed slices already committed by Lead (A-1, C-1)
→ state.json: A-1=completed, C-1=completed, B-1=pending (unchanged)
→ Report to user with options:
  A) /workflow back design — re-examine design
  B) /workflow parallel off → resolve B-1 sequentially
  C) Retry B-1 only
```

Teammates do NOT call `/workflow back` directly. They report issues to the Lead, and the user decides.

### Hook Behavior in Parallel Mode

post-bash hook skips state.json updates in Teammate context (detects `agent_id` in hook input). Lead performs batch state.json updates after tier completion.

### Rework in Parallel Mode

`/workflow back --slice B-1`: single sequential execution. Rework cascade applies — downstream slices via `blockedBy` are auto-marked `needs_rework`.

---

## Status Transitions

| Current Status | Trigger | Next Status |
|----------------|---------|-------------|
| `in_progress` | Slices executing sequentially | `in_progress` |
| `in_progress` | All slices completed + `/workflow next` | `reviewing` (auto-gate) |
| `reviewing` | Auto-gate fails | `needs_revision` |
| `reviewing` | Auto-gate passes | `approved` |
| `needs_revision` | AI fixes complete | `in_progress` |
| `approved` | `/workflow next` | Next phase (Verify) |
| `partial_rework` | `/workflow back --slice N` | `partial_rework` |
| `partial_rework` | Reworked slice completed + `/workflow next` | `reviewing` (auto-gate re-verify) |
