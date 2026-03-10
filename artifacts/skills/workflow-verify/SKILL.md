---
name: workflow-verify
description: |
  Workflow Verify Phase. Qualitative code review and spec coverage verification.
  Reviews implementation across 5 axes: reusability, code quality, runtime efficiency,
  security, and AC coverage. Fixes minor issues directly; escalates structural problems.

  Auto-invoked by the workflow orchestrator when entering the Verify phase.
  Do NOT use for: spec authoring, design decisions, writing new features, adding tests.
user-invocable: false
next-skill: workflow-ship
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
agents:
  review: workflow:test-strategist
  security: workflow:security-reviewer
  code: workflow:code-reviewer
---

# Verify Phase

**"Review code quality and confirm spec coverage."** No new features — review, minor fixes, and escalation only.

---

## Entry Behavior

### Normal Entry (from Implement approved)

1. Load spec from `artifacts.spec`, design from `artifacts.design`
2. Load `slices` array from state.json
3. Read all implementation code and test files
4. Run full review across 5 axes (see §Review Axes)
5. Fix minor issues directly + commit
6. Update design document AC Coverage Matrix: set ⬜ → ✅ for all verified ACs
7. Report review results
8. "Review complete. {N} minor fixes applied. Run `/workflow next` to proceed."

### Partial Re-entry (from slice rework)

1. Load previous review state
2. Focus review on reworked slices (previous review for other slices preserved)
3. "Re-reviewing reworked slices: {slice IDs}."

---

## Role Separation from Implement

| | Implement | Verify |
|--|-----------|--------|
| Focus | "Building" — produce code via TDD | "Reviewing" — code quality + spec coverage |
| Verification | Auto-gate (tests/lint/types pass) | Qualitative review (reusability, efficiency, security) + AC coverage |
| Human involvement | None | Gear 3: yes (final approval) / Gear 2: none |
| Code changes | Primary activity | Minor fixes only (refactoring, naming, etc.) |

---

## Review Axes (5 axes, always active)

### 1. Reusability

- Is the same/similar logic duplicated across locations?
- Are existing utilities/helpers used where available?
- Is there common logic worth extracting for other features?

**Minor fix**: Extract 3+ lines of repeated code into helper (same file).
**Escalate**: Common module creation needed → `/workflow back design`.

### 2. Code Quality

- Do function/variable names clearly convey intent?
- Do functions have single responsibility? (Not too long or complex?)
- Is error handling adequate? (No silent failures, empty catch blocks)
- Is it consistent with existing codebase patterns?

**Minor fix**: Rename `data` → `user_notifications`, add logging to empty except.
**Escalate**: Function split requires file structure change → `/workflow back design`.

### 3. Runtime Efficiency

- Are there N+1 queries?
- Are there unnecessary memory allocations?
- Are there unnecessary operations inside loops?
- Does it meet Spec performance requirements (C-xxx)?

**Minor fix**: Add `select_related`, optimize list comprehension.
**Escalate**: Algorithm change needed → `/workflow back design`.

### 4. Security

- Is user input properly validated/escaped?
- Are there SQL injection, XSS, CSRF vulnerabilities?
- Is authentication/authorization correctly applied?
- Is sensitive data exposed in logs/responses?

**Minor fix**: Add input validation, mask sensitive fields in logs.
**Escalate**: Authentication architecture flaw → `/workflow back design`.

### 5. AC Coverage

Trace every AC from Spec to code/test:

```
AC Coverage Verification:

| AC  | Slice    | Test                      | Status       |
|-----|----------|---------------------------|--------------|
| R-1 | A-1, A-2 | test_notification_created | ✅ Traceable |
| R-2 | A-2      | test_signal_handler       | ✅ Traceable |
| R-3 | B-1      | test_list_view            | ✅ Traceable |
| C-1 | B-1      | test_rest_api_format      | ✅ Traceable |
| R-4 | B-2      | —                         | ❌ Test missing |
```

- ❌ found → `/workflow back --slice N` for that slice
- AC itself is inappropriate → `/workflow back specify`

---

## Additional Viewpoints (context-dependent)

Beyond the 5 always-active axes, these activate based on feature characteristics:

| Viewpoint | Activation Condition | Focus |
|-----------|---------------------|-------|
| Performance Deep-Dive | DB queries, large data, response time SLA | Query plans, index usage, cache strategy |
| Accessibility | UI changes present | WCAG, screen reader, keyboard navigation |
| Business Logic | High domain complexity | Business intent vs implementation alignment |
| Concurrency | Multi-thread / async / distributed | Race conditions, deadlocks, ordering guarantees |

---

## Review Process

When `/workflow next` is called, the orchestrator invokes this skill's review.

### Auto-Gate (blocks on failure)

- [ ] All slices have status `completed`
- [ ] Full test suite passes
- [ ] Type check passes
- [ ] Lint passes
- [ ] No existing tests broken (regression)
- [ ] AC coverage: all R-xxx/C-xxx traceable to tests
- [ ] Design document AC Coverage Matrix updated (⬜ → ✅ for verified ACs)

### Viewpoint Review (after auto-gate passes)

Dispatch to `test-strategist` agent for test coverage evaluation, plus activate the code-reviewer viewpoints. The test-strategist maps every AC to test evidence and identifies coverage gaps.

Additionally, dispatch `security-reviewer` agent when activation conditions are met (gear 3: always; gear 2: security-related ACs in spec). Runs in parallel with test-strategist.

### Non-Blocking Suggestions

After viewpoint review, collect all `[i]` non-blocking items from both code-reviewer and test-strategist agents and append them to `workflow_docs/suggestions/{feature-slug}.md`. See review-protocol §Non-Blocking Suggestions File for format.

### Approval Flow

**Gear 2:**
- No structural issues → auto `approved` (no human review)
- Structural issues found → `needs_revision` → AI fixes → `in_progress`

**Gear 3:**
- → `reviewing` (human review pending)
- Human reviews results, reads code, checks business intent alignment
- Additional fixes requested → `needs_revision` → AI fixes → `in_progress` (draftCount++)
- Structural problem → escalation (see §Escalation)
- Human "approved" → `approved`

**Approval authority**: Gear 3 `approved` requires human. Gear 2 auto-approves on clean AI review.

### Human Review (gear 3 only)

Verify's human review is the **final review of the code**:

1. **Conversational feedback**: Human reviews code and communicates changes
2. **Code TODOs**: `// TODO(review): {comment}` directly in code
3. **Slice-targeted**: "Improve error handling in Slice B-2"

AI processes human feedback:
1. Apply code changes
2. Re-run auto-verification (lint + type + test)
3. Create fix commit
4. `draftCount++` + `status: in_progress`

---

## Minor Fix vs Structural Issue

| Minor Fix (fix in Verify) | Structural Issue (back required) |
|---------------------------|--------------------------------|
| Variable/function name improvement | New file/module addition |
| Duplicate code → helper extraction (same file) | Approach change |
| Remove unnecessary allocation/operation | Architecture change |
| Add missing error handling | AC unmappable (test itself missing) |
| Add type hints | Security vulnerability (design level) |
| Add comments/docstrings | Performance issue (algorithm change needed) |

**Decision criterion**: "Does this fix break existing tests or change file structure?" → Yes: back needed. No: fix directly.

---

## Escalation Rules

| Finding | Judgment | Target |
|---------|---------|--------|
| Test missing (AC unmappable) | Slice issue | `/workflow back --slice N` |
| Code quality issue (minor) | Fix directly | Fix in Verify + commit |
| Security vulnerability (design level) | Design issue | `/workflow back design` |
| Performance issue (algorithm change) | Design issue | `/workflow back design` |
| AC itself inappropriate | Requirement issue | `/workflow back specify` |
| needs_rework ≥ 50% of slices | Overall design issue | Recommend `/workflow back design` |

---

## Status Transitions

**Gear 2:**

| Current Status | Trigger | Next Status |
|----------------|---------|-------------|
| `in_progress` | AI review + minor fixes + `/workflow next` | `approved` (no structural issues) or `needs_revision` |
| `needs_revision` | AI fixes complete | `in_progress` (draftCount++) |
| `approved` | `/workflow next` | Next phase (Ship) |

**Gear 3:**

| Current Status | Trigger | Next Status |
|----------------|---------|-------------|
| `in_progress` | AI review + minor fixes + `/workflow next` | `reviewing` (human review pending) |
| `reviewing` | Human requests additional fixes | `needs_revision` |
| `reviewing` | Human escalation | back → appropriate phase |
| `reviewing` | Human "approved" | `approved` |
| `needs_revision` | AI fixes complete | `in_progress` (draftCount++) |
| `approved` | `/workflow next` | Next phase (Ship) |

---

## draftCount Threshold (gear 3)

Gear 2 has no human review, so draftCount doesn't increase.

```
≤ 2: Normal range
= 3: Warning — "This is review revision #3. Identify the root cause first."
≥ 4: Interrupt — choose one:
  A) /workflow next --force   (force progression, recorded in feedback)
  B) /workflow back design    (full design re-examination)
  C) /workflow back specify   (full requirements re-examination)
```
