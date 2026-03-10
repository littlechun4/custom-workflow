#!/usr/bin/env node
/**
 * Workflow Orchestrator — PostToolUse(Bash) Hook
 *
 * Slice-Tracker: Detects [Slice-ID] tags in git commit messages
 * and auto-updates the corresponding slice status in state.json.
 *
 * Commit message convention:
 *   git commit -m "[A-1] Implement notification model"
 *   git commit -m "[B-2] Fix boundary value handling"
 *
 * When detected:
 * - Sets slice.status = "completed"
 * - Records slice.commit = commit hash (from git log)
 * - If slice was "needs_rework", clears reworkReason
 * - Updates state.json
 *
 * Input: Hook receives tool output via stdin (JSON with stdout field).
 */

const { execSync } = require('child_process');
const { readState, writeState, respond } = require('./lib/state.js');

// Match [Slice-ID] pattern: [A-1], [B-2], [C-10], etc.
const SLICE_TAG_REGEX = /\[([A-Z]-\d+)\]/g;

function getLatestCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function main() {
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    let toolOutput;
    try {
      toolOutput = JSON.parse(input);
    } catch {
      process.exit(0);
      return;
    }

    // Skip in worktree agent context (parallel mode — Lead handles state updates)
    if (toolOutput.agent_id) {
      process.exit(0);
      return;
    }

    const state = readState();

    // No active workflow or not in implement phase
    if (!state || state.phase.current !== 'implement') {
      process.exit(0);
      return;
    }

    // Check if the bash command was a git commit
    const command = toolOutput.tool_input?.command || '';
    if (!command.includes('git commit')) {
      process.exit(0);
      return;
    }

    // Extract slice IDs from the command (commit message)
    const matches = [...command.matchAll(SLICE_TAG_REGEX)];
    if (matches.length === 0) {
      process.exit(0);
      return;
    }

    const commitHash = getLatestCommitHash();
    const updatedSlices = [];

    for (const match of matches) {
      const sliceId = match[1];
      const slice = state.slices.find(s => s.id === sliceId);

      if (slice && slice.status !== 'completed') {
        slice.status = 'completed';
        slice.commit = commitHash;
        if (slice.reworkReason) {
          delete slice.reworkReason;
        }
        updatedSlices.push(sliceId);
      }
    }

    if (updatedSlices.length > 0) {
      writeState(state);
      respond(
        `Slice tracker: ${updatedSlices.join(', ')} marked as completed.`,
        {
          hookEventName: 'PostToolUse',
          tracker: 'slice',
          updatedSlices: updatedSlices,
          commitHash: commitHash,
        }
      );
    }

    process.exit(0);
  });
}

main();
