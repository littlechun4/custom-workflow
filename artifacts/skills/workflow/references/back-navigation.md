# Back Navigation Reference

Detailed rework cascade logic and target mapping for `/workflow back`.

## Rework Cascade (dependency propagation)

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

## Target Mapping

| Current Phase | back (no args) | specify | design | implement | verify |
|---------------|----------------|---------|--------|-----------|--------|
| design | specify | specify | — | — | — |
| implement | design | specify | design | — | — |
| verify | implement | specify | design | implement | — |
| ship | verify | specify | design | implement | verify |

`—` = current or future phase (not allowed).

## Slice-Level Rework

```
/workflow back --slice B-2 "boundary values unhandled"
→ Mark B-2 as needs_rework
→ phase.current = implement, phase.status = partial_rework
→ Other completed slices remain intact
```

Multiple slices: call `back --slice` repeatedly to mark additional slices as `needs_rework`.
