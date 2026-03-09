#!/usr/bin/env node
/**
 * Workflow Orchestrator — PreToolUse(Write|Edit) Hook
 *
 * Phase-level file guard. Prevents modifications outside the allowed
 * scope of the current phase.
 *
 * Rules:
 * - specify: only workflow_docs/spec/ and .workflow/state.json
 * - design:  only workflow_docs/design/, workflow_docs/adr/, and .workflow/state.json
 * - implement: source code + tests + .workflow/state.json (no spec/design modification)
 * - verify:  test files + .workflow/state.json (no source code modification)
 * - ship:    CLAUDE.md + .workflow/ (archive)
 *
 * Input: Hook receives tool input via stdin (JSON with tool_input.file_path).
 * Output: JSON with decision (allow/warn). Warnings are advisory — the hook
 *         does not block, but injects a system message to remind the AI.
 */

const fs = require('fs');
const path = require('path');
const { readState, effectiveGear, respond } = require('./lib/state.js');

// Paths that are always allowed
const ALWAYS_ALLOWED = [
  '.workflow/state.json',
  '.workflow/history/',
];

// Phase-specific allowed path patterns (prefix match)
const PHASE_ALLOWED = {
  specify: [
    'workflow_docs/spec/',
  ],
  design: [
    'workflow_docs/design/',
    'workflow_docs/adr/',
  ],
  implement: [
    'src/', 'lib/', 'app/', 'pkg/', 'cmd/', 'internal/',
    'test/', 'tests/', 'spec/', '__tests__/',
    'package.json', 'requirements.txt', 'go.mod', 'Cargo.toml',
    'tsconfig.json', 'pyproject.toml',
  ],
  verify: [
    'test/', 'tests/', 'spec/', '__tests__/',
    'workflow_docs/',
  ],
  ship: [
    'CLAUDE.md',
    '.workflow/',
    'workflow_docs/',
  ],
};

// Phase-specific blocked patterns (takes priority over allowed)
const PHASE_BLOCKED = {
  implement: [
    'workflow_docs/spec/',
    'workflow_docs/design/',
  ],
  verify: [
    'src/', 'lib/', 'app/', 'pkg/', 'cmd/', 'internal/',
  ],
};

function main() {
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    const state = readState();

    // No active workflow — allow everything
    if (!state) {
      process.exit(0);
      return;
    }

    let toolInput;
    try {
      toolInput = JSON.parse(input);
    } catch {
      process.exit(0);
      return;
    }

    const filePath = toolInput.tool_input?.file_path;
    if (!filePath) {
      process.exit(0);
      return;
    }

    // Normalize to relative path
    const cwd = process.cwd();
    const relPath = path.isAbsolute(filePath)
      ? path.relative(cwd, filePath)
      : filePath;

    const phase = state.phase.current;

    // Always-allowed paths
    for (const p of ALWAYS_ALLOWED) {
      if (relPath.startsWith(p) || relPath === p.replace(/\/$/, '')) {
        process.exit(0);
        return;
      }
    }

    // Check blocked patterns first
    const blocked = PHASE_BLOCKED[phase] || [];
    for (const pattern of blocked) {
      if (relPath.startsWith(pattern)) {
        respond(
          `⚠ Phase guard: modifying "${relPath}" is not recommended during ${phase} phase.`,
          {
            hookEventName: 'PreToolUse',
            phase: phase,
            filePath: relPath,
            decision: 'warn',
            reason: `File belongs to a different phase scope. Current phase: ${phase}.`,
          }
        );
        process.exit(0);
        return;
      }
    }

    // Check allowed patterns
    const allowed = PHASE_ALLOWED[phase] || [];
    const isAllowed = allowed.some(pattern => relPath.startsWith(pattern) || relPath === pattern);

    if (!isAllowed) {
      respond(
        `⚠ Phase guard: "${relPath}" is outside the typical scope for ${phase} phase.`,
        {
          hookEventName: 'PreToolUse',
          phase: phase,
          filePath: relPath,
          decision: 'warn',
          reason: `File does not match expected patterns for ${phase} phase. Allowed: ${allowed.join(', ')}`,
        }
      );
    }

    process.exit(0);
  });
}

main();
