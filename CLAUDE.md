# CC Workflow — Skill Development Guide

## Project Purpose

This is a reference/template repository for Claude Code workflow skills.
Other projects copy skills from `artifacts/skills/` into their own `.claude/skills/`.

## Directory Structure

```
artifacts/
├── agents/                ← Agent definitions (same level as skills/)
│   ├── spec-reviewer.md
│   ├── design-reviewer.md
│   ├── code-reviewer.md
│   └── test-strategist.md
├── templates/             ← Project setup templates
│   └── CLAUDE.sample.md   ← Sample CLAUDE.md for target projects
└── skills/                ← Skill source (no .claude wrapper)
    ├── workflow/           ← Orchestrator skill
    │   ├── SKILL.md
    │   ├── hooks/          ← Hook definitions + scripts
    │   └── references/     ← Shared references
    ├── workflow-specify/   ← Specify phase skill
    │   ├── SKILL.md
    │   └── assets/
    ├── workflow-design/    ← Design phase skill
    │   ├── SKILL.md
    │   └── assets/
    ├── workflow-implement/ ← Implement phase skill
    ├── workflow-verify/    ← Verify phase skill
    └── workflow-ship/      ← Ship phase skill

research_docs/              ← Research & analysis
proposals/                  ← Design proposals
```

## Skill Implementation Rules

### Language

- **All skill files (SKILL.md, agent definitions, hook scripts, templates) MUST be written in English.**
- Research docs and proposals may remain in Korean.

### Implementation Process (MANDATORY)

Before ANY skill implementation or modification:

1. Open `research_docs/12-bkit-comparison-review.md` §9 (Implementation Priority Checklist)
2. Cross-check EVERY P0 item against the current task scope
3. List ALL items that apply — do not cherry-pick by intuition
4. Present the full list to the user BEFORE starting work
5. Implement all applicable items together — do not defer P0 items to "next step"

**Violation pattern to avoid**: Implementing frontmatter changes without agents, or hooks without agents, when both are P0 priority. If the checklist says it's P0, it ships together.

### Required References

When implementing or modifying skills, ALWAYS read these first:

1. `research_docs/12-bkit-comparison-review.md` — bkit comparison analysis with structural gaps and implementation checklist
2. `research_docs/04-skills-hooks-automation.md` — Skills/hooks/automation research
3. `artifacts/skills/workflow/references/state-schema.md` — state.json schema
4. `artifacts/skills/workflow/references/review-protocol.md` — Review protocol
5. `artifacts/skills/workflow/references/extensions.md` — Extension definitions

### Frontmatter Checklist

Every skill MUST include these frontmatter fields (refer to §4 of `12-bkit-comparison-review.md`):

- `name` — Skill name
- `description` — With trigger conditions and exclusions
- `user-invocable` — true only for orchestrator
- `allowed-tools` — Phase-appropriate tool list (see §5 of comparison doc)
- `imports` — Template and reference files to auto-load
- `agents` — Action-scoped agent bindings (if applicable)

Phase skills SHOULD also include:
- `next-skill` — Next phase skill name

### Agent Definitions

- Place in `artifacts/agents/` directory (same level as `artifacts/skills/`)
- Use `.md` format with frontmatter (see §2 of comparison doc)
- Required fields: `name`, `description`, `context`, `permissionMode`, `tools`, `disallowedTools`
- Link bidirectionally: skill → agent via `agents:`, agent → skill via `linked-from-skills:`

### Hooks

- Define in `artifacts/skills/workflow/hooks/hooks.json`
- SessionStart hook is P0 priority
- See §1 of comparison doc for event types and schema

### Design Decisions

- Orchestrator pattern (single entry point `/workflow`) — intentional, do not change to free-entry
- state.json as single source of truth — no config/state split for now
- Team orchestration deferred to v2

## Proposals (Design Source)

- `proposals/orchestrator-recommended.md` — Orchestrator design
- `proposals/specify-phase.md` — Specify phase
- `proposals/implement-phase.md` — Implement phase (TDD, slices)
- `proposals/ship-phase.md` — Ship phase (CLAUDE.md update, archive)
