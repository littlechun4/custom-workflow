# Design: {Feature Name}
<!-- workflow: design | draftCount: 1 | status: in_progress -->

> Spec: @workflow_docs/spec/{feature-name}.md
> Date: {YYYY-MM-DD}
> Approved by: {who}, {date}

---

## Approach Summary

{Overall strategy in 1-3 sentences.}

## Alternatives Analysis — if applicable

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| A: {tech/approach} | {pros} | {cons} | ✅ Adopted / ❌ |
| B: {tech/approach} | {pros} | {cons} | ❌ |

> **Adoption rationale**: {1-2 sentences}

## Change Plan

| # | File | Changes | Reference Pattern | Related AC |
|---|------|---------|-------------------|------------|
| 1 | `path/to/file` | {what changes} | `path/to/existing:ClassName` | R-1 |
| 2 | ... | | | |

## Implementation Slices

### Group {A/B/...}: {Group Name} [R-{N}, R-{M}]

#### Slice {X-Y}: {Slice Name}
- **Test intent**: {What this slice verifies}
- **Changed files**: {File list}
- **Precondition**: {None / Slice X-Y completed}

## AC Coverage

| AC | Slice | Status |
|----|-------|--------|
| R-1 | Slice A-1 | ⬜ |

## Test Strategy

- **Unit**: {What to test, what to mock}
- **Integration**: {What boundaries to cross}
- **Manual**: {Items that cannot be automated}

## Risks / Open Questions

- [ ] {Item to confirm during implementation}
- [OPEN_QUESTION] {Undecided item — must resolve before checkpoint 2}

## ADR Reference — if applicable

- [ADR-NNN: {Title}](../adr/ADR-NNN-{title}.md)

---
## Change History

| Version | Date | Changes | Reason |
|---------|------|---------|--------|
| v1 | {YYYY-MM-DD} | Initial draft | — |
