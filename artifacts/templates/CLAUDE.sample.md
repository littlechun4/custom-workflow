# {Project Name}

## Workflow Settings

This project uses the structured development workflow (`/workflow`).

### Extension Settings

<!-- Uncomment to enable. Ship phase reads these settings. -->
<!-- - Branch creation: enabled -->
<!-- - PR creation: enabled -->
<!-- - CI check: enabled -->
<!-- - Issue tracker: enabled -->
<!-- - Issue tracker type: jira -->

### Source Directories

<!-- The phase guard hook (pre-write.js) uses these default source directories
     for the Implement phase:
       src/, lib/, app/, pkg/, cmd/, internal/
       test/, tests/, spec/, __tests__/
     If your project uses different directories (e.g., modules/, core/),
     add them to the implement section in hooks/pre-write.js. -->

## Project Conventions

### Code Style

<!-- Project-specific style rules that the workflow should follow.
     Examples:
     - Use ESM imports (no require)
     - Prefer functional components over class components
     - Error messages must be user-facing (i18n keys, not raw strings)
-->

### Architecture

<!-- Key architectural patterns for Design/Implement phases to reference.
     Examples:
     - Repository pattern for data access (see src/repos/user-repo.ts)
     - Event-driven: domain events via src/events/bus.ts
     - All API routes in src/routes/, controllers in src/controllers/
-->

### Testing

<!-- Testing conventions for Implement phase TDD cycles.
     Examples:
     - Unit tests colocated: src/foo.ts → src/foo.test.ts
     - Integration tests in tests/integration/
     - Use vitest, not jest
     - Mock external services via src/test-utils/mocks.ts
-->

## Workflow Learned Patterns

<!-- This section is updated automatically by the Ship phase.
     Each completed workflow records useful patterns here.
     Do not remove existing entries. -->
