#!/usr/bin/env bash
# Setup script for custom-workflow submodule.
# Run once after cloning the parent repo to:
#   1. Symlink skills/agents into .claude/
#   2. Install git hooks so future submodule updates auto-sync

set -e

# Resolve parent repo root (submodule lives at .vendor/custom-workflow/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENDOR_SKILLS="$SCRIPT_DIR/artifacts/skills"
VENDOR_AGENTS="$SCRIPT_DIR/artifacts/agents"
LOCAL_SKILLS="$PARENT_ROOT/.claude/skills"
LOCAL_AGENTS="$PARENT_ROOT/.claude/agents"

echo "Setting up custom-workflow in: $PARENT_ROOT"

# --- 1. Symlinks ---

mkdir -p "$LOCAL_SKILLS" "$LOCAL_AGENTS"

link_count=0

for src in "$VENDOR_SKILLS"/*/; do
  [ -d "$src" ] || continue
  name=$(basename "$src")
  target="$LOCAL_SKILLS/$name"
  if [ ! -e "$target" ]; then
    ln -sf "../../.vendor/custom-workflow/artifacts/skills/$name" "$target"
    echo "  linked skill: $name"
    ((link_count++))
  fi
done

for src in "$VENDOR_AGENTS"/*.md; do
  [ -f "$src" ] || continue
  name=$(basename "$src")
  target="$LOCAL_AGENTS/$name"
  if [ ! -e "$target" ]; then
    ln -sf "../../.vendor/custom-workflow/artifacts/agents/$name" "$target"
    echo "  linked agent: $name"
    ((link_count++))
  fi
done

echo "  $link_count symlink(s) created"

# --- 2. Git hooks (submodule-local, not committed) ---

HOOKS_DIR="$(cd "$PARENT_ROOT" && git rev-parse --git-dir)/modules/.vendor/custom-workflow/hooks"
mkdir -p "$HOOKS_DIR"

HOOK_BODY='#!/usr/bin/env bash
PARENT_ROOT="$(git rev-parse --show-toplevel)/../.."
"$PARENT_ROOT/scripts/sync-vendor.sh"
'

for hook in post-checkout post-merge; do
  hook_path="$HOOKS_DIR/$hook"
  if [ ! -f "$hook_path" ]; then
    echo "$HOOK_BODY" > "$hook_path"
    chmod +x "$hook_path"
    echo "  installed hook: $hook"
  fi
done

echo "Done."
