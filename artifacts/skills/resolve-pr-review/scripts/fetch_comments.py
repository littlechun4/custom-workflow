#!/usr/bin/env python3
"""fetch_comments.py [pr_number]

Fetches PR review comments and strips to fields needed for triage.
If pr_number is omitted, uses the PR for the current branch.

Output (stdout, JSON):
  {
    "reviews": [{"author", "state", "body"}],   # PR-level summaries
    "comments": [{"id", "author", "path", "line", "body", "diff_hunk"}]
  }
"""
import json
import subprocess
import sys


def run(cmd):
    return json.loads(subprocess.run(cmd, capture_output=True, text=True, check=True).stdout)


def main():
    if len(sys.argv) > 1:
        pr = sys.argv[1]
    else:
        pr = subprocess.run(
            ["gh", "pr", "view", "--json", "number", "-q", ".number"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()

    repo = run(["gh", "repo", "view", "--json", "owner,name"])
    owner, name = repo["owner"]["login"], repo["name"]

    comments_raw = run(["gh", "api", f"repos/{owner}/{name}/pulls/{pr}/comments"])
    comments = [
        {
            "id": c["id"],
            "author": c["user"]["login"],
            "path": c["path"],
            "line": c.get("line") or c.get("original_line"),
            "body": c["body"],
            "diff_hunk": c["diff_hunk"],
        }
        for c in comments_raw
    ]

    reviews_raw = run(["gh", "pr", "view", pr, "--json", "reviews"])
    reviews = [
        {
            "author": r["author"]["login"],
            "state": r["state"],
            "body": r["body"][:500] if r["body"] else "",
        }
        for r in reviews_raw.get("reviews", [])
        if r["body"]
    ]

    print(json.dumps({"reviews": reviews, "comments": comments}, indent=2))


if __name__ == "__main__":
    main()
