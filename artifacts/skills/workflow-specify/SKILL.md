---
name: workflow-specify
description: |
  Workflow Specify Phase. Defines "what, why, and how far."
  Produces a spec document with requirements, acceptance criteria (AC),
  edge cases, and scope boundaries.

  Auto-invoked by the workflow orchestrator when entering the Specify phase.
  Do NOT use for: design decisions, code implementation, tech stack selection.
user-invocable: false
next-skill: workflow-design
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
imports:
  - assets/template-spec.md
agents:
  review: workflow:spec-reviewer
---

# Specify Phase

**"Define what, why, and how far."** Proceeds with zero lines of code.

---

## Entry Behavior

### Entry Check

Read `phase.status` from `.workflow/state.json`:
- `reviewing` / `needs_revision`: Skip directly to [§ Review Process](#review-process). Do not re-run interview or draft logic.
- `in_progress`: Continue to First Entry or Re-entry below.

### First Entry (artifacts.spec = null)

1. Confirm problem definition with user: "Why is this feature needed?"
2. Run 5-item interview (see §Interview below)
3. Draft `workflow_docs/spec/{feature}.md` from interview results
   - Template: [assets/template-spec.md](assets/template-spec.md)
4. Update `state.json`:
   - `artifacts.spec = "workflow_docs/spec/{feature}.md"`
   - Add spec file path to `context.loadOnResume`
5. Commit spec document: `git add workflow_docs/spec/{feature}.md && git commit -m "docs(specify): add spec for {feature}"`
6. "Draft complete. Run `/workflow next` to start review."

### Re-entry (returned via back)

1. Load existing spec document
2. Check `feedback` array for return reason
3. Begin revision addressing the reason
4. Commit revised spec: `git add workflow_docs/spec/{feature}.md && git commit -m "docs(specify): revise spec for {feature}"`
5. "Return reason: {reason}. Revising spec."

---

## Interview (5 Items)

Ask sequentially, adapting based on user responses. Do not ask all questions at once — proceed conversationally.

| # | Topic | Example Question |
|---|-------|-----------------|
| 1 | Core user action | "Who needs to do what?" |
| 2 | Input/Output | "What are the specific inputs and expected results?" |
| 3 | Edge cases | "How should empty values, duplicates, or unauthorized access be handled?" |
| 4 | Out of scope | "What will NOT be included this time?" |
| 5 | Constraints | "Are there performance, security, or integration constraints?" |

**Interview principles**:
- If a response is unclear, ask for concrete examples
- If implementation details surface, redirect to goals: "Redis cache" → "Response under 200ms"
- If the user has provided sufficient answers, AI proposes remaining items for confirmation

---

## Spec Document Authoring

### Required Sections

| Section | Content |
|---------|---------|
| Problem | Why this is needed (1-3 sentences) |
| Requirements | `R-xxx` IDs, checklist format |
| Acceptance Criteria (AC) | Input/output examples per scenario |
| Edge Cases | Boundary conditions, exceptions |
| In Scope / Out of Scope | Scope boundaries |
| Constraints | `C-xxx` IDs, non-functional requirements (if applicable) |
| Change History | Living document pattern |

### AC Format

**Basic**: Input/output examples (directly convertible to test data)
```markdown
### Successful Login
- Input: user@example.com / password123
- Expected: JWT token issued, redirect to dashboard
- Verification: Response header contains authorization, status 200
```

**Complex business rules**: Add GIVEN/WHEN/THEN
```markdown
GIVEN 5 consecutive failed login attempts
WHEN the 6th login attempt is made
THEN the account is locked and "Account locked" message is displayed
```

### Document Header Metadata

```markdown
<!-- workflow: specify | draftCount: 1 | status: in_progress -->
```

After review pass, increment draftCount on revision and add a row to Change History.

---

## Review Process

When `/workflow next` is called, the orchestrator invokes this skill's review.

### 1. Auto-Gate (blocks on failure)

Mechanically verify the following. **Any failure blocks** — viewpoint review does not run.

- [ ] `workflow_docs/spec/{feature}.md` file exists
- [ ] All requirements have `R-xxx` IDs
- [ ] Every `R-xxx` maps to at least 1 AC
- [ ] No `[TBD]`, `[TODO]`, `[PENDING]` strings
- [ ] "In Scope / Out of Scope" section exists
- [ ] At least 1 non-functional requirement (performance/security/availability) stated

**Auto-gate failure output**:
```
[workflow] SPECIFY auto-review...

■ Auto-Gate:
  [v] R-1~R-4 present
  [v] In Scope / Out of Scope present
  [x] R-3 has no AC                    ← blocked
  [v] Non-functional requirement present

Blocking items found. Add AC for R-3, then run /workflow next again.
```

### 2. Viewpoint Review (after auto-gate passes)

Dispatch to `spec-reviewer` agent. Active viewpoints:

| Viewpoint | Activation Condition | Review Focus |
|-----------|---------------------|--------------|
| Clarity & Measurability | **Always** | Remove vague qualifiers ("appropriate", "fast"), require numeric thresholds, explicit actors |
| Technical Feasibility | New tech / legacy / external API dependency | Feasibility given current codebase |
| User Scenario | Feature involves UX changes | Empty state, error state, accessibility, flow completeness |
| Business Alignment | Multiple stakeholders or strategic feature | Product direction, ROI, stakeholder consensus |

Gear 2: context-relevant viewpoints. Gear 3: all viewpoints active.

### 3. Human Gate (gear 3 only)

After viewpoint review passes:
- Gear 2: auto `approved`
- Gear 3: awaits human approval
  - [ ] Implementation complexity proportionate to business value
  - [ ] Aligned with product direction and stakeholder consensus

### 4. Human Inline Review

Independently of AI review, humans can leave reviews directly in the spec document.

**Marker format**:
```markdown
<!-- human-review: R-2 | "clear" is ambiguous. Need specific message -->
```

**AI handling rules** (on `/workflow next`):
1. Collect all open `<!-- human-review: -->` tags
2. Revise document to address each review
3. On resolution, convert to `resolved`:
   ```markdown
   <!-- human-review-resolved: R-2 | "clear" was ambiguous → replaced with specific error message -->
   ```
4. `draftCount++`, `status = in_progress`

**Gate rule**: Any open `human-review` tag blocks approval.

### 5. Non-Blocking Suggestions

After viewpoint review, collect all `[i]` non-blocking items and write them to `workflow_docs/suggestions/{feature-slug}.md`. See review-protocol §Non-Blocking Suggestions File for format.

### 6. Review Sidecar (.review.md)

All review issues are recorded in a sidecar file alongside the spec document. This preserves review history separately from the document body.

**File location**:
```
workflow_docs/spec/
├── {feature}.md            # Spec document (always latest version)
└── {feature}.review.md     # Review log (append only)
```

**Format**:
```markdown
# Review Log: {feature} (Specify)

## Review #2 (v2 → v3 in progress)
**Status**: needs_revision
**Issues**:
- [ ] RI-3 (Auto-Gate): AC-5 fallback behavior undefined
- [ ] RI-4 (Viewpoint:User Scenario): No re-subscribe scenario after opt-out

## Review #1 (v1 → v2) — resolved
**Status**: needs_revision → resolved
**Issues**:
- [x] RI-1 (Auto-Gate): R-3 has no AC → v2 added AC-4, AC-5
- [x] RI-2 (Viewpoint:Clarity): R-2 "fast response" has no numeric threshold → v2 set 200ms
```

**Rules**:
- On each new review, prepend a `## Review #N` block at the top (append only)
- Never modify previous review blocks (history preservation)
- Resolved issues are checked `[x]` with resolution version noted
- `RI-{N}` IDs increment sequentially across the entire workflow (no per-phase reset)
- Tag issue source in parentheses: `(Auto-Gate)`, `(Viewpoint:{name})`, `(Human)`

**Update protocol** (on `needs_revision`):
1. Write current `## Review #N` block with unresolved issues in `.review.md`
2. Revise spec document body to address each `RI-xxx`
3. Add `v(N+1)` row to Change History section in spec document
4. Update `state.json`: `draftCount += 1`, `status = "in_progress"`
5. Commit changes: `git add workflow_docs/spec/ && git commit -m "docs(specify): revise spec v{N+1} for {feature}"`

---

## Prohibitions

| Prohibited | Reason | Correct Expression |
|-----------|--------|-------------------|
| Tech stack decisions | Design scope | "Use Django" ❌ → "Query as JSON" ✅ |
| File/function naming | Design scope | "In views.py" ❌ → "Customer list page" ✅ |
| Library selection | Design scope | "Async with Celery" ❌ → "Sending must not block response" ✅ |
| Writing code | Implement scope | Any form ❌ |
| Internal architecture | Design scope | "Redis cache" ❌ → "Response under 200ms" ✅ |

**Decision criterion**: "If this tech/method were replaced, would the user experience remain the same?" → Yes = Design scope.

---

## Escalation

Specify is the first phase — there is no previous phase to `back` to.

**draftCount ≥ 4 interrupt** options:
- `/workflow next --force` — force progression with current state
- `/workflow abort` — reduce scope and restart

**Over 30 minutes**: Feature scope is likely too large. Suggest splitting.

---

## Spec ↔ Design Boundary

When it's unclear whether a user request belongs to Spec or Design:

```
1. Substitutability: "Would a different tech yield the same UX?" → Yes: Design
2. Consumer scope: "Does it affect teams outside ours?" → Yes: Spec (external contract)
3. Verifiability: "Is it the goal itself?" → Spec / "Is it the means?" → Design
```
