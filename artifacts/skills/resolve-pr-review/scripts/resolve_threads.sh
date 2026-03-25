#!/usr/bin/env bash
# resolve_threads.sh [pr_number]
#
# Resolves all unresolved review threads on a PR via GitHub GraphQL API.
# If pr_number is omitted, uses the PR for the current branch.

set -euo pipefail

if [ $# -gt 0 ]; then
    PR="$1"
else
    PR=$(gh pr view --json number -q .number)
fi

OWNER=$(gh repo view --json owner -q .owner.login)
NAME=$(gh repo view --json name -q .name)

THREAD_IDS=$(gh api graphql -f query="{
  repository(owner: \"$OWNER\", name: \"$NAME\") {
    pullRequest(number: $PR) {
      reviewThreads(first: 50) {
        nodes { id isResolved }
      }
    }
  }
}" --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id')

COUNT=0
for id in $THREAD_IDS; do
    gh api graphql -f query="mutation {
      resolveReviewThread(input: {threadId: \"$id\"}) {
        thread { isResolved }
      }
    }" > /dev/null
    COUNT=$((COUNT + 1))
done

echo "Resolved $COUNT thread(s) on PR #$PR"
