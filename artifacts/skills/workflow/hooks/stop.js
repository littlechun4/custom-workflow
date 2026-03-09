#!/usr/bin/env node
/**
 * Workflow Orchestrator — Stop Hook
 *
 * Runs on session termination. Updates meta.updatedAt in state.json
 * to preserve the last activity timestamp.
 */

const { readState, writeState, respond } = require('./lib/state.js');

function main() {
  const state = readState();

  if (!state) {
    process.exit(0);
    return;
  }

  // writeState automatically updates meta.updatedAt
  writeState(state);

  respond('Workflow: session state saved.', {
    hookEventName: 'Stop',
    featureSlug: state.feature.slug,
    phase: state.phase.current,
    status: state.phase.status,
  });

  process.exit(0);
}

main();
