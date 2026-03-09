#!/usr/bin/env node
/**
 * Workflow Orchestrator — SessionStart Hook
 *
 * Runs once per session. Detects active workflow and injects context
 * so the user doesn't need to manually run /workflow resume.
 *
 * Output:
 * - If no active workflow: minimal system message, no context injection
 * - If active workflow: phase/status summary + artifact paths for context loading
 */

const fs = require('fs');
const path = require('path');
const { readState, effectiveGear, phaseInfo, respond } = require('./lib/state.js');

function main() {
  const state = readState();

  if (!state) {
    respond('Workflow: no active workflow.', {
      hookEventName: 'SessionStart',
      hasActiveWorkflow: false,
    });
    process.exit(0);
  }

  const gear = effectiveGear(state);
  const info = phaseInfo(state);
  const feature = state.feature;

  // Build context string for system prompt injection
  const contextLines = [
    `## Active Workflow: ${feature.name} (gear ${gear})`,
    `Phase: ${info.current} — ${info.status} (draft #${info.draftCount})`,
    '',
  ];

  // Stale design warning
  if (state.artifacts.designStale) {
    contextLines.push('⚠ Design document is STALE — was modified after back-navigation. Review before proceeding.');
    contextLines.push('');
  }

  // Unresolved feedback warning
  if (info.feedbackUnresolved > 0) {
    contextLines.push(`⚠ ${info.feedbackUnresolved} unresolved feedback item(s) from previous phases.`);
    contextLines.push('');
  }

  // Slice progress (implement/verify phases)
  if (info.sliceTotal > 0) {
    contextLines.push(`Slice progress: ${info.sliceCompleted}/${info.sliceTotal} completed`);
    if (info.sliceRework > 0) {
      contextLines.push(`  ${info.sliceRework} slice(s) need rework`);
    }
    contextLines.push('');
  }

  // draftCount warning
  if (info.draftCount >= 3) {
    contextLines.push(`⚠ Draft count is ${info.draftCount}. Consider root cause analysis or /workflow back.`);
    contextLines.push('');
  }

  // Files to load for context
  const filesToLoad = [];
  if (state.context.loadOnResume) {
    filesToLoad.push(...state.context.loadOnResume);
  }

  contextLines.push('### Workflow Commands');
  contextLines.push('- `/workflow next` — review and advance to next phase');
  contextLines.push('- `/workflow back [target] [reason]` — return to previous phase');
  contextLines.push('- `/workflow status` — show full dashboard');
  contextLines.push('- `/workflow gear [N]` — change gear level');

  respond(`Workflow: ${feature.name} — ${info.current} (${info.status})`, {
    hookEventName: 'SessionStart',
    hasActiveWorkflow: true,
    featureName: feature.name,
    featureSlug: feature.slug,
    gear: gear,
    phase: info.current,
    status: info.status,
    draftCount: info.draftCount,
    designStale: state.artifacts.designStale,
    filesToLoad: filesToLoad,
    additionalContext: contextLines.join('\n'),
  });

  process.exit(0);
}

main();
