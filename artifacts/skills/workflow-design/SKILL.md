---
name: workflow-design
description: |
  Workflow Design Phase. Decides "how and why this approach."
  Produces a design document with approach summary, alternatives analysis,
  change plan, TDD slices, AC coverage matrix, and test strategy.

  Auto-invoked by the workflow orchestrator when entering the Design phase.
  Do NOT use for: spec authoring, code implementation, test execution.
user-invocable: false
next-skill: workflow-implement
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
imports:
  - assets/template-design.md
  - assets/template-adr.md
agents:
  review: workflow:design-reviewer
---

# Design Phase

**"Decide how and why this approach."** Takes the spec and produces an implementation roadmap grounded in the actual codebase.

---

## Entry Behavior

### First Entry (artifacts.design = null)

1. Load spec from `artifacts.spec` path
2. Explore codebase to identify:
   - Existing patterns and conventions
   - Impact scope and reusable modules
   - Reference patterns for `context.referencePatterns`
3. Author design document using 2-checkpoint process (see §Checkpoints)
   - Template: [assets/template-design.md](assets/template-design.md)
   - Output: `workflow_docs/design/{feature}.md`
4. Update `state.json`:
   - `artifacts.design = "workflow_docs/design/{feature}.md"`
   - Add design file path to `context.loadOnResume`
   - Populate `context.referencePatterns` with discovered patterns
5. If gear 3, create ADR using [assets/template-adr.md](assets/template-adr.md)
   - Output: `workflow_docs/adr/ADR-NNN-{title}.md`
   - Add path to `artifacts.adr` array

### Re-entry (returned via back)

1. Load existing design document
2. Check `feedback` array for return reason
3. If `artifacts.designStale = true`, reconcile with updated spec
4. Begin revision addressing the reason
5. "Return reason: {reason}. Revising design."

---

## 2-Checkpoint Process

Design output is large, so it uses **2 checkpoints** to prevent wasted work on wrong direction.

### Checkpoint 1: Approach Confirmation (in_progress internal milestone)

Write approach summary + alternatives analysis, then ask the human for direction confirmation. **Do NOT call `/workflow next` at this point** — no status transition.

**What to produce:**
- Approach summary (1-3 sentences)
- Alternatives analysis table (if tech choice needed; otherwise state "Follows existing patterns, no alternatives needed")
- Adoption rationale

**AI auto-verification:**
- Alternatives table exists (or explicit "not needed" statement)
- Adoption rationale is stated

**Human confirmation:**
- Human reviews direction via inline comments
- Human rejects → `needs_revision` → rewrite approach → `in_progress` (draftCount++)
- Human confirms → proceed to detailed planning

**Orchestrator perspective**: phase status remains `in_progress` throughout checkpoint 1.

### Checkpoint 2: Full Approval (formal reviewing → approved loop)

Complete change plan + slices + AC coverage + test strategy, then call `/workflow next`:
- This triggers `in_progress → reviewing` status transition
- Auto-gate: full checklist verification (see §Auto-Gate)
- `[OPEN_QUESTION]` markers must be resolved (any remaining blocks approval)
- Human review: inline comments on slices, change plan
- Human approval → `approved` → next phase

---

## Codebase Exploration

Before writing the design document, explore the actual codebase:

1. **Pattern discovery**: Use `Glob` and `Grep` to find existing patterns
   - File naming conventions
   - Module structure and layer boundaries
   - Import patterns and dependency direction
2. **Reference patterns**: Identify existing code to reference in change plan
   - Format: `path/to/file.py:ClassName` (no line numbers — they change)
   - Store in `context.referencePatterns` in state.json
3. **Impact analysis**: Identify files and modules affected by the change

---

## Design Document Authoring

### Required Sections

| Section | Content |
|---------|---------|
| Approach Summary | Overall strategy in 1-3 sentences |
| Alternatives Analysis | Comparison table with pros/cons/verdict (if applicable) |
| Change Plan | File-by-file changes with reference patterns and AC mapping |
| Implementation Slices | TDD slice decomposition with test intent |
| AC Coverage | Matrix mapping every R-xxx/C-xxx to slices |
| Test Strategy | Test levels, mocking strategy, existing infrastructure |
| Risks / Open Questions | Unresolved items, implementation risks |
| ADR Reference | Link to ADR (gear 3, or when major decisions made) |
| Change History | Living document pattern |

### Change Plan Format

```markdown
| # | File | Changes | Reference Pattern | Related AC |
|---|------|---------|-------------------|------------|
| 1 | `path/to/file.py` | Add FooModel with fields x, y, z | `path/to/existing.py:BarModel` | R-1, R-2 |
| 2 | `path/to/views.py` | Add FooListView endpoint | `path/to/views.py:BarListView` | R-3 |
```

- **#**: Execution order (dependency-based DAG)
- **Reference Pattern**: Existing code to follow — this is the most effective device for reducing AI hallucination during implementation

### TDD Slice Format

```markdown
### Group A: {Group Name} [R-N, R-M]

#### Slice A-1: {Slice Name}
- **Test intent**: {What this slice verifies}
- **Changed files**: {File list}
- **Precondition**: {None / Slice X-Y completed}
```

**Rules:**
- 1 slice = 1 commit
- 1 slice ≤ 3 changed files (split if > 5)
- Test intent must be clear enough for implementation AI to write the failing test

### AC Coverage Matrix

```markdown
| AC | Slice | Status |
|----|-------|--------|
| R-1 | Slice A-1, A-2 | ⬜ |
| C-1 | Slice B-1 | ⬜ |
```

Progress: ⬜ → ✅ when slice is implemented. Verify phase confirms all are ✅.

### `[OPEN_QUESTION]` Marker

Use for undecided items during design authoring:

```markdown
[OPEN_QUESTION] Is pub/sub performance sufficient in Redis Cluster? Load test needed.
```

- Allowed during checkpoint 1
- **Must be resolved before checkpoint 2** (auto-gate blocks if any remain)
- When resolved: remove marker and write decision into the document body

---

## Review Process

When `/workflow next` is called, the orchestrator invokes this skill's review.

### Auto-Gate (blocks on failure)

#### Checkpoint 1 Auto-Verification (in_progress internal)

- [ ] Approach summary is 1-3 sentences and clear
- [ ] Alternatives table exists (or explicit "follows existing patterns" statement)
- [ ] Adoption rationale is stated
- (`[OPEN_QUESTION]` markers allowed at this stage)

#### Checkpoint 2 Auto-Gate (formal — blocks `/workflow next`)

- [ ] `workflow_docs/design/{feature}.md` file exists
- [ ] Spec reference link present
- [ ] "Reference Pattern" column filled for all change plan rows
- [ ] Every requirement (R-xxx/C-xxx) maps to at least 1 slice
- [ ] AC coverage matrix has no unmapped ACs
- [ ] Each slice has clear test intent (convertible to test code)
- [ ] External dependencies are listed (3rd-party APIs, DB, cache, etc.)
- [ ] No `[OPEN_QUESTION]` markers remain (any remaining blocks approval)
- [ ] No `[TBD]`, `[TODO]`, `[PENDING]` strings
- [ ] ADR exists (gear 3 mandatory; gear 2 only when major decision made)

### Viewpoint Review (after auto-gate passes)

Dispatch to `design-reviewer` agent. Active viewpoints:

| Viewpoint | Activation | Review Focus |
|-----------|-----------|--------------|
| Slice Decomposition | **Always** | Independence, size, AC coverage, test intent, delivery order |
| Architecture Consistency | **Always** | Pattern compliance, layer boundaries, naming, import direction |
| Risk & Dependency | External deps / new infra / cross-team | Fallback strategy, migration, performance, security |
| ADR Quality | Gear 3 or ADR exists | Decision recorded, alternatives, consequences, context |

Gear 2: context-relevant viewpoints. Gear 3: all viewpoints active.

### Human Gate (gear 3 only)

After viewpoint review passes:
- Gear 2: auto `approved`
- Gear 3: awaits human approval
  - [ ] Slice decomposition is implementable
  - [ ] Architecture decisions are sound
  - [ ] Risk mitigation is adequate

### Non-Blocking Suggestions

After viewpoint review, collect all `[i]` non-blocking items and write them to `workflow_docs/suggestions/{feature-slug}.md`. See review-protocol §Non-Blocking Suggestions File for format.

### Human Inline Review

Humans can leave reviews directly in the design document:

```markdown
<!-- human-review: Approach | Is SSE more suitable than WebSocket? Need justification for bidirectional -->
<!-- human-review: A-2 | Should use model save() override instead of signal, per existing pattern -->
```

**AI handling rules** (on `/workflow next`):
1. Collect all open `<!-- human-review: -->` tags
2. Revise document to address each review
3. On resolution, convert to `resolved`:
   ```markdown
   <!-- human-review-resolved: Approach | SSE reviewed → added bidirectional justification (future chat feature) -->
   ```
4. `draftCount++`, `status = in_progress`

**Gate rule**: Any open `human-review` tag blocks approval.

### Review Sidecar (.review.md)

All review issues are recorded in a sidecar file alongside the design document. This preserves review history separately from the document body.

**File location**:
```
workflow_docs/design/
├── {feature}.md            # Design document (always latest version)
└── {feature}.review.md     # Review log (append only)
```

**Format**:
```markdown
# Review Log: {feature} (Design)

## Review #2 (v2 → v3 in progress)
**Status**: needs_revision
**Issues**:
- [ ] RI-7 (Auto-Gate): Slice B-2 has no test intent
- [ ] RI-8 (Viewpoint:Architecture Consistency): Import direction violates layer boundary

## Review #1 (v1 → v2) — resolved
**Status**: needs_revision → resolved
**Issues**:
- [x] RI-5 (Auto-Gate): R-3 not mapped to any slice → v2 added Slice C-1
- [x] RI-6 (Viewpoint:Slice Decomposition): Slice A-3 changes 6 files → v2 split into A-3, A-4
```

**Rules**:
- On each new review, prepend a `## Review #N` block at the top (append only)
- Never modify previous review blocks (history preservation)
- Resolved issues are checked `[x]` with resolution version noted
- `RI-{N}` IDs increment sequentially across the entire workflow (no per-phase reset)
- Tag issue source in parentheses: `(Auto-Gate)`, `(Viewpoint:{name})`, `(Human)`

**Update protocol** (on `needs_revision`):
1. Write current `## Review #N` block with unresolved issues in `.review.md`
2. Revise design document body to address each `RI-xxx`
3. Add `v(N+1)` row to Change History section in design document
4. Update `state.json`: `draftCount += 1`, `status = "in_progress"`

---

## Design → Spec Feedback Loop

When Design discovers spec issues:

1. **Do not modify the spec directly**
2. Report to user: problem + 2-3 alternatives + trade-offs for each
3. User decides → spec revision → design re-execution
4. **Max 3 round-trips** — beyond that, suggest feature scope split

Common scenarios:
- **Technical infeasibility**: Spec requirement physically impossible given architecture
- **Scope mismatch**: Hidden dependencies not covered in spec scope
- **Pattern inconsistency**: Spec assumes approach that contradicts codebase conventions

---

## Prohibitions

| Prohibited | Reason | Correct Approach |
|-----------|--------|-----------------|
| Redefining requirements | Spec scope | Report via feedback loop |
| Scope expansion | Prevent creep | Move to out-of-scope or follow-up |
| Writing actual code | Implement scope | Describe changes in natural language |
| Pseudocode | Looks like code | Use natural language for sequence, files, changes |
| Premature optimization | Over-complexity | Record in "Risks / Open Questions" only |

---

## Document Update Policy (during implementation)

### Must Update

| Situation | Update Target |
|-----------|--------------|
| File structure significantly differs from design | Change plan in design document |

### Skip Update

| Situation | Reason |
|-----------|--------|
| Function/variable names differ | Code is source of truth; design is directional |
| Implementation order differs within a file | Order is a guideline |
| Test cases added/changed | Test code is self-documenting |
| Refactoring | No change at design abstraction level |

---

## Escalation

**draftCount ≥ 4 interrupt** options:
- `/workflow next --force` — force progression with current state
- `/workflow back` — return to Specify (problem may be in requirements)
- `/workflow abort` — reduce scope and restart

**Design ↔ Spec round-trips**: Max 3. Beyond that, suggest splitting the feature.
