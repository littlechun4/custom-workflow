---
name: resolve-pr-review
description: >
  Triage bot/human review comments on a pull request, apply valid fixes, reply
  with rationale, and resolve conversation threads. Use when the user asks to
  handle, resolve, or triage review comments on a PR.
argument-hint: "[PR number]"
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
---

# Resolve PR Review

Triage bot/human review comments on a pull request, apply valid fixes, reply
with rationale, and resolve conversation threads.

## Input

- **PR number**: From the skill argument (e.g., `/resolve-pr-review 1`).
  If omitted, the scripts auto-detect from the current branch.

## Workflow

### Step 1: Fetch review comments

Scripts are located at `.claude/skills/resolve-pr-review/scripts/` (resolved via symlink).

```bash
python3 .claude/skills/resolve-pr-review/scripts/fetch_comments.py [pr_number]
```

Output: `{ "reviews": [{author, state, body}], "comments": [{id, author, path, line, body, diff_hunk}] }`

### Step 2: Triage each comment

For every comment, evaluate it against the actual codebase:

| Verdict | Criteria | Action |
|---------|----------|--------|
| **Apply** | Suggestion is correct and improves the code | Apply the fix |
| **Dismiss** | Suggestion is incorrect or based on wrong assumptions | Explain why |
| **Defer** | Valid idea but out of scope (YAGNI, future work) | Acknowledge and defer |

**Verification is mandatory.** Never accept or reject a suggestion without
checking the actual code, database schema, or runtime behavior. For example:
- A "typo" in a table name → verify against the actual DB schema
- A "missing error handling" → check if the error path is reachable
- A "better pattern" → check if it aligns with existing project conventions

Present a summary table to the user before applying:

```
| # | File | Comment | Verdict | Reason |
|---|------|---------|---------|--------|
| 1 | config.yml:252 | missing_field typo | Dismiss | Actual DB table name |
| 2 | handler.py:90-98 | Add ValueError for unknown strategy | Apply | Good defensive check |
| 3 | handler.py:93 | Make schema configurable | Defer | YAGNI — only one schema in use |
```

Wait for user confirmation before proceeding.

### Step 3: Apply fixes

For each comment with verdict **Apply**:

1. Make the code change
2. Verify the change doesn't break anything using the project's appropriate
   validation command (e.g., run tests, type check, lint)

### Step 4: Commit and push

If any fixes were applied:

```bash
git add <changed files>
git commit -m "fix: address PR review feedback

<summary of changes>

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### Step 5: Reply to each comment

Build a `replies.json` file mapping comment IDs to reply text, then post all
replies in one script call:

```json
[
  {"comment_id": 123456, "body": "Applied in `abc1234`. ..."},
  {"comment_id": 789012, "body": "Dismissed. Verified against DB — ..."}
]
```

```bash
python3 .claude/skills/resolve-pr-review/scripts/post_replies.py <pr_number> replies.json
```

Reply guidelines:
- **Apply**: Reference the fix commit hash. Example: "Applied in `abc1234`. Unknown strategies now raise `ValueError`."
- **Dismiss**: Provide evidence. Example: "Verified against source DB — actual table name is `mission_progreses`."
- **Defer**: Acknowledge the value, explain why it's deferred. Example: "Valid suggestion. All current sources use `public` — will add when a non-public source is needed."

### Step 6: Resolve all conversation threads

```bash
bash .claude/skills/resolve-pr-review/scripts/resolve_threads.sh [pr_number]
```

## Output

After completion, report:

```
PR #<number> review resolved:
- Applied: <count> fix(es) — committed as <hash>
- Dismissed: <count> comment(s)
- Deferred: <count> comment(s)
- All <total> conversation thread(s) resolved
```

## Notes

- This skill works with any reviewer (Gemini, Copilot, humans, etc.)
- The GraphQL `resolveReviewThread` mutation is required to fold threads —
  the REST API only supports replying, not resolving
- If the PR has no review comments, report that and exit early
