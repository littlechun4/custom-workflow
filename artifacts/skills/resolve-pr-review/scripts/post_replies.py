#!/usr/bin/env python3
"""post_replies.py <pr_number> <replies.json>

Posts reply comments to PR review threads.

replies.json format:
  [
    {"comment_id": 123456, "body": "reply text"},
    ...
  ]
"""
import json
import subprocess
import sys


def main():
    if len(sys.argv) != 3:
        print("Usage: post_replies.py <pr_number> <replies.json>", file=sys.stderr)
        sys.exit(1)

    pr = sys.argv[1]
    replies_file = sys.argv[2]

    repo = json.loads(subprocess.run(
        ["gh", "repo", "view", "--json", "owner,name"],
        capture_output=True, text=True, check=True,
    ).stdout)
    owner, name = repo["owner"]["login"], repo["name"]

    with open(replies_file) as f:
        replies = json.load(f)

    count = 0
    for r in replies:
        subprocess.run(
            [
                "gh", "api",
                f"repos/{owner}/{name}/pulls/{pr}/comments/{r['comment_id']}/replies",
                "-f", f"body={r['body']}",
            ],
            check=True,
            capture_output=True,
        )
        count += 1

    print(f"Posted {count} reply/replies on PR #{pr}")


if __name__ == "__main__":
    main()
