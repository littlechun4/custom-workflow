# Extensions Reference

Optional extension definitions and configuration for the workflow.

Default: All extensions **disabled**. When disabled, Ship Phase only runs CLAUDE.md update + archive.

---

## Extension List

| Extension | Default | Trigger Point |
|-----------|---------|---------------|
| Branch creation | Disabled | On `/workflow start` |
| PR creation | Disabled | Ship Phase |
| CI check | Disabled | After PR creation |
| Issue tracker | Disabled | Ship Phase (based on PR status) |

---

## Configuration

### CLAUDE.md (project root)

```markdown
## Workflow Extension Settings

- Branch creation: enabled
- PR creation: enabled
- CI check: enabled
- Issue tracker: disabled
```

### .claude/settings.json (optional)

```json
{
  "workflow": {
    "extensions": {
      "branch": true,
      "pr": true,
      "ci": false,
      "issueTracker": false,
      "issueTrackerType": "jira"
    }
  }
}
```

---

## Extension: Branch Creation

Runs at `/workflow start`.

```bash
git checkout -b feat/{feature-slug}
```

- Records branch name in `state.json` → `feature.branch`
- If branch already exists, checkout only (no new branch)
- If extension disabled: continue working on current branch

---

## Extension: PR Creation

First extension step of Ship Phase.

```bash
gh pr create \
  --title "feat: {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
{Spec summary — 1-3 sentences}

## Changes
{Per-slice change summary}

## Design Doc
- Spec: workflow_docs/spec/{feature}.md
- Design: workflow_docs/design/{feature}.md

## Test Plan
{Verify Phase results summary}

## References
- Jira: {SAAS-42} (if linked)
EOF
)"
```

- Records PR URL in `state.json` → `feature.pr` after creation
- On Ship **re-entry**: `gh pr edit` to update existing PR (no new PR)
- Based on GitHub CLI (`gh`). For GitLab, substitute with `glab`

---

## Extension: CI Check

Runs after PR creation.

```
PR created
  → CI pipeline starts automatically (GitHub Actions, etc.)
  → Poll status: gh pr checks --watch
  → Pass → next step (issue tracker or archive)
  → Fail → CI failure recovery flow (below)
```

### CI Failure Recovery Flow

```
CI failure
  → gh pr ready --undo (PR → draft)
  → Root cause analysis:
      Test/lint failure → /workflow back verify
      Code issue → /workflow back implement
      Design issue → /workflow back design
      Environment issue (CI config itself) → fix CI config, re-enter Ship
  → Fix in target phase → re-pass Verify → re-enter Ship
  → Full Ship process re-executes (idempotent)
```

---

## Extension: Issue Tracker

Only operates when `state.json` → `feature.jira` field is set.

### Status Transition Mapping

| Workflow Event | Issue Transition |
|----------------|------------------|
| Enter Ship Phase (PR active) | In Progress → In Review |
| Enter Ship Phase (PR disabled) | In Progress → Done |
| After PR merge (webhook or manual) | In Review → Done |

### Supported Platforms

| Platform | CLI | Config Value |
|----------|-----|-------------|
| Jira | `jira` (Atlassian CLI) | `"jira"` |
| Linear | `linear` CLI | `"linear"` |
| GitHub Issues | `gh issue` | `"github"` |

---

## Disabled State Behavior

When all extensions are disabled, Ship Phase = CLAUDE.md update + state.json archive only.

```
[workflow] Ship Phase
  Updating CLAUDE.md...  ✓
  Archiving state.json → .workflow/history/user-notifications.json  ✓

Done. Start a new workflow with /workflow start.
```
