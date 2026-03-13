# state.json Schema Reference

`.workflow/state.json` — single source of truth for the workflow.

---

## Top-Level Structure

```json
{
  "$schema": "workflow-state-v1",
  "feature": { ... },
  "gear": { ... },
  "phase": { ... },
  "artifacts": { ... },
  "slices": [ ... ],
  "feedback": [ ... ],
  "context": { ... },
  "meta": { ... }
}
```

---

## feature

```json
"feature": {
  "name": "User Notifications",
  "slug": "user-notifications",
  "branch": "feat/user-notifications",
  "pr": "https://github.com/org/repo/pull/123"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Feature name provided at `/workflow start` |
| `slug` | string | kebab-case conversion (used for archive filenames) |
| `branch` | string \| null | Recorded when branch extension is enabled. Default null |
| `pr` | string \| null | PR URL recorded during Ship phase |

---

## gear

```json
"gear": {
  "detected": 2,
  "override": 3,
  "reason": "10+ files, introduces new architecture"
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `detected` | number | 1, 2, 3 | Gear auto-detected from codebase exploration |
| `override` | number \| null | 1, 2, 3 | Manually set via `/workflow gear N`. null = no override |
| `reason` | string | — | Detection rationale (file count, change nature, etc.) |

**Effective gear = `override ?? detected`**

---

## phase

```json
"phase": {
  "current": "implement",
  "status": "partial_rework",
  "draftCount": 1,
  "history": [
    { "phase": "specify", "status": "approved", "draftCount": 2, "completedAt": "2026-03-09T10:00:00Z" },
    { "phase": "design",  "status": "approved", "draftCount": 1, "completedAt": "2026-03-09T11:30:00Z" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `current` | string | Currently active phase. Values: `specify` `design` `implement` `verify` `ship` |
| `status` | string | Current phase status (see table below) |
| `draftCount` | number | Revision cycle count within current phase. Resets to 0 on phase transition |
| `history` | array | Completed phase records. Append-only |

**Status values**:

| Value | Meaning |
|-------|---------|
| `in_progress` | Work in progress |
| `reviewing` | AI reviewing or awaiting human review |
| `needs_revision` | Issues found in review, AI fixing |
| `approved` | Review passed, ready for next phase transition |
| `partial_rework` | Specific slices being reworked (implement phase only) |

---

## artifacts

```json
"artifacts": {
  "spec": "workflow_docs/spec/user-notifications.md",
  "design": "workflow_docs/design/user-notifications.md",
  "designStale": false,
  "adr": ["workflow_docs/adr/0001-notification-queue.md"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `spec` | string \| null | Spec document path. Recorded on Specify phase completion |
| `design` | string \| null | Design document path. Recorded on Design phase completion |
| `designStale` | boolean | Set to true when back from implement/verify to design. Reset to false on Design re-approval |
| `adr` | array | ADR file paths. Added for gear 3 or major technical decisions |

---

## slices

```json
"slices": [
  {
    "id": "A-1",
    "name": "Notification Model",
    "status": "completed",
    "acs": ["R-1"],
    "commit": "abc1234",
    "blockedBy": [],
    "changedFiles": ["src/models/notification.py", "tests/test_notification.py"]
  },
  {
    "id": "B-1",
    "name": "Notification List API",
    "status": "needs_rework",
    "acs": ["R-3", "R-4"],
    "commit": "def5678",
    "reworkReason": "Boundary values 0 and -1 unhandled",
    "blockedBy": ["A-1"],
    "changedFiles": ["src/api/views.py", "tests/test_views.py"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Slice ID defined in Design document (e.g., A-1, B-2) |
| `name` | string | Slice name |
| `status` | string | `pending` `in_progress` `completed` `needs_rework` |
| `acs` | array | AC IDs covered by this slice |
| `commit` | string \| null | Completion commit hash (original implementation commit, not merge commit). null if incomplete |
| `reworkReason` | string | Reason for rework when `needs_rework`. Optional |
| `blockedBy` | array | Predecessor slice IDs. Empty array `[]` = independent. Used for parallel execution scheduling |
| `changedFiles` | array | Target file paths for this slice. Used for parallel file-conflict validation |

**Slice-Tracker Hook**: Detects `[Slice-ID]` tags in commit messages and auto-updates slice status. Defined in `hooks/hooks.json`.

---

## feedback

```json
"feedback": [
  {
    "fromPhase": "implement",
    "toPhase": "design",
    "type": "escalation",
    "description": "Reference pattern is deprecated, alternative needed",
    "timestamp": "2026-03-09T14:00:00Z",
    "resolved": false
  },
  {
    "fromPhase": "verify",
    "toPhase": "implement",
    "type": "slice_rework",
    "description": "B-1 boundary values unhandled",
    "sliceId": "B-1",
    "timestamp": "2026-03-09T15:00:00Z",
    "resolved": false
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `fromPhase` | string | Phase where the return originated |
| `toPhase` | string | Target phase for the return |
| `type` | string | `escalation` `slice_rework` `force_skipped` |
| `description` | string | Reason for the return |
| `sliceId` | string | Relevant slice ID for `slice_rework` type |
| `timestamp` | string | ISO8601 |
| `resolved` | boolean | Resolution status. Set to true when rework is complete |

---

## context

```json
"context": {
  "loadOnResume": [
    "workflow_docs/spec/user-notifications.md",
    "workflow_docs/design/user-notifications.md"
  ],
  "referencePatterns": [
    "src/models/User.py (model reference pattern)",
    "src/api/views.py (API view reference pattern)"
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `loadOnResume` | array | File paths to auto-load on `/workflow resume` |
| `referencePatterns` | array | Reference pattern files discovered during Design. Used to maintain code consistency during Implement |

---

## execution

```json
"execution": {
  "mode": "auto",
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
  "report": "workflow_docs/reports/{feature-slug}-report.md"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `manual` (default) or `auto`. Set at `/workflow start` |
| `parallelMode` | boolean | Parallel slice execution in Implement phase. Default false. Set by `/workflow start --parallel` or `/workflow parallel on` |
| `maxParallelSlices` | number | Max concurrent agents per tier. Default 3 |
| `hardLimits` | object | Thresholds that halt auto mode |
| `hardLimits.phaseMaxDraft` | number | Max draftCount per phase before halt. Default 5 |
| `hardLimits.totalBackCount` | number | Max total back navigations before halt. Default 3 |
| `hardLimits.samePhaseBackCount` | number | Max back to the same phase before halt. Default 2 |
| `hardLimits.designSpecMaxIterations` | number | Max Design↔Specify round-trips. Default 3 |
| `halted` | boolean | True when a hard limit is violated. Workflow paused |
| `haltReason` | string \| null | Which limit was hit and details |
| `report` | string \| null | Path to auto-mode report file. null in manual mode |

---

## meta

```json
"meta": {
  "createdAt": "2026-03-09T09:00:00Z",
  "updatedAt": "2026-03-09T15:30:00Z",
  "designSpecIterations": 1,
  "workflowVersion": "1.0"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | string | `/workflow start` timestamp (ISO8601) |
| `updatedAt` | string | Last modification timestamp of state.json |
| `designSpecIterations` | number | Design↔Specify round-trip count. Recommended max 3 |
| `workflowVersion` | string | Workflow version. Incremented on schema migration |
