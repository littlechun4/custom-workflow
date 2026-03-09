/**
 * Shared state utilities for workflow hooks.
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(process.cwd(), '.workflow', 'state.json');

/**
 * Read and parse state.json. Returns null if not found.
 */
function readState() {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write state.json with updated meta.updatedAt.
 */
function writeState(state) {
  state.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Output hook response as JSON to stdout.
 * @param {string} systemMessage - Brief status message
 * @param {object} hookSpecificOutput - Structured data for context injection
 */
function respond(systemMessage, hookSpecificOutput) {
  const response = { systemMessage, hookSpecificOutput };
  console.log(JSON.stringify(response));
}

/**
 * Get effective gear level (override ?? detected).
 */
function effectiveGear(state) {
  return state.gear.override ?? state.gear.detected;
}

/**
 * Get phase display info.
 */
function phaseInfo(state) {
  const { current, status, draftCount } = state.phase;
  const slices = state.slices || [];
  const completed = slices.filter(s => s.status === 'completed').length;
  const rework = slices.filter(s => s.status === 'needs_rework').length;
  const unresolved = (state.feedback || []).filter(f => !f.resolved).length;

  return {
    current,
    status,
    draftCount,
    sliceTotal: slices.length,
    sliceCompleted: completed,
    sliceRework: rework,
    feedbackUnresolved: unresolved,
  };
}

module.exports = {
  STATE_PATH,
  readState,
  writeState,
  respond,
  effectiveGear,
  phaseInfo,
};
