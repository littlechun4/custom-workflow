# Review Protocol Reference

Defines the review process executed on `/workflow next`.

---

## 3-Step Review Structure

```
/workflow next
  │
  ├─ 1. Auto-gate
  │     Failed → needs_revision (blocked)
  │     Passed ↓
  │
  ├─ 2. Viewpoint Review
  │     Blocking issues → needs_revision (blocked)
  │     Non-blocking only → approved possible (passes without --force)
  │     Passed ↓
  │
  └─ 3. Human Gate (gear 3 only)
        Not approved → reviewing (held)
        Approved → approved
```

Gear 2: Auto-gate + Viewpoint pass → immediately `approved`
Gear 3: Auto-gate + Viewpoint + human approval all required

---

## Auto-Gate Output Format

```
[workflow] {PHASE} auto-gate validation...

■ Auto-gate:
  [v] {passed item}
  [v] {passed item}
  [x] {failed item}       ← blocked

Blocked: {failed item description}. Fix and run /workflow next again.
```

On pass:
```
■ Auto-gate: all passed ✓
```

**Rule**: If any item is `[x]`, do NOT proceed to Viewpoint review.

---

## Viewpoint Review Output Format

```
■ Viewpoint Review (active: {viewpoint1}, {viewpoint2}):
  [!] {issue description}    (blocking)
  [i] {issue description}    (non-blocking)

Blocking issues found. Resolve and run /workflow next again.
Non-blocking issues can be overridden with /workflow next --force.
```

When no issues:
```
■ Viewpoint Review (active: {viewpoint1}): no issues ✓
```

**blocking vs non-blocking**:
- `blocking`: Issues that will cause clear problems in the next phase. Must be resolved.
- `non-blocking`: Improvement suggestions. Can be overridden with `--force`, recorded as `force_skipped` in `feedback`.

**Parallel execution**: When 2+ viewpoints are active, run as separate sub-agents in parallel.

---

## Human Inline Review Markers

Protocol for humans to leave reviews directly in artifact documents.

### Writing Markers (human)

```markdown
<!-- human-review: {target} | {comment} -->
```

Examples:
```markdown
<!-- human-review: R-2 | "clear" is ambiguous. Need specific message -->
<!-- human-review: slice-B-1 | Missing boundary value handling for 0 and -1 -->
<!-- human-review: general | Overall scope seems too large, consider splitting -->
```

### AI Processing (on `/workflow next`)

1. Collect all `<!-- human-review:` tags from artifact documents
2. Modify documents to address each review
3. On completion, convert to `resolved`:

```markdown
<!-- human-review-resolved: R-2 | "clear" was ambiguous → changed to "Return 404 when accessing non-existent user" -->
```

4. `draftCount++`, update `state.json`

### Gate Rule

- If even 1 open `<!-- human-review: -->` tag exists, `approved` is NOT possible
- After all tags are `resolved`, re-run auto-gate + Viewpoint

### Target Conventions

| Target Format | Meaning |
|---------------|---------|
| `R-2` | Specific requirement |
| `AC-3` | Specific acceptance criteria |
| `slice-A-1` | Specific slice |
| `section-design` | Document section |
| `general` | Entire document |

---

## needs_revision Handling Flow

```
Issues found in review
  → phase.status = needs_revision
  → AI fixes the issues
  → phase.status = in_progress
  → phase.draftCount++
  → "Fixes complete. Run /workflow next to re-review."
  → User runs /workflow next
  → Review re-executes
```

When AI cannot auto-fix (user decision required):
```
[workflow] Cannot auto-fix: {issue}
Decision needed:
  A) {option A}
  B) {option B}
  C) /workflow back — re-examine in previous phase
```

---

## Non-Blocking Suggestions File

When viewpoint review produces `[i]` non-blocking items, the phase skill records them in a persistent suggestions file. Unlike `state.json` (archived on Ship), this file remains in git for future reference.

### File Location

```
workflow_docs/suggestions/{feature-slug}.md
```

### Format

```markdown
# Suggestions: {Feature Name}

## {Phase} review ({date})

### 1. {Title}

- **Priority**: low | medium
- **Related**: `path/to/file`
- **Description**: {what and why}

### 2. {Title}
...
```

### Rules

- **One file per workflow** — all phases append to the same file
- **Append only** — each phase adds a new `## {Phase} review` section; never modify previous sections
- **Phase skill responsibility** — reviewer agents produce `[i]` items in output; the invoking phase skill writes them to the file
- **Skip when empty** — if no non-blocking items, do not create or update the file
- **Ship phase** — optionally converts remaining suggestions to tracking issues (see workflow-ship)

---

## Human Gate (Gear 3)

Activated only in gear 3, after Viewpoint passes.

```
[workflow] Human Gate — approval required.

Review items:
{phase-specific human gate checklist}

Enter "approve" to approve.
```

Phase-specific human gate checklists:

| Phase | Checklist |
|-------|-----------|
| Specify | Is complexity appropriate for business value? / Aligned with product direction and stakeholder consensus? |
| Design | Architecture decisions consistent with team conventions? / Security/performance design adequate? |
| Verify | Overall verification coverage sufficient? / Acceptable for deployment? |

---

## Phase-Specific Auto-Gate Checklists

### Specify

- [ ] `workflow_docs/spec/{feature}.md` file exists
- [ ] All requirements have `R-xxx` IDs assigned
- [ ] Every `R-xxx` has at least 1 AC mapped
- [ ] No `[TBD]`, `[TODO]`, `[undecided]` markers present
- [ ] "In Scope / Out of Scope" section exists
- [ ] At least 1 non-functional requirement (performance/security/availability) specified

### Design

- [ ] `workflow_docs/design/{feature}.md` file exists
- [ ] Every `R-xxx` has at least 1 slice mapped
- [ ] Slice dependency DAG has no cycles
- [ ] Each slice has "test intent" specified
- [ ] Gear 3: at least 1 ADR exists

### Implement

- [ ] All slices `completed` (no needs_rework)
- [ ] Full test suite passes
- [ ] Type checking passes
- [ ] Linting passes
- [ ] No existing tests broken

### Verify

- [ ] All ACs covered (based on state.json slices.acs)
- [ ] Edge case tests exist
- [ ] Performance/security constraints verified (when applicable)
- [ ] Regression tests pass
