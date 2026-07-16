# AGENTS.md — Ethical Vibe Coding (TECHIE 1121)

> Canonical instructions for **any** AI coding agent working in this repository.
> This is the cross-tool standard file (Codex, Amp, Jules, Gemini CLI, Cursor, and
> others read it). Tool-specific mirrors live at `CLAUDE.md`, `GEMINI.md`,
> `.github/copilot-instructions.md`, `.cursor/rules/vibe-trace.mdc`,
> `.windsurf/rules/vibe-trace.md`, `.agent/rules/vibe-trace.md`, and `replit.md`.
> They all say the same thing. **If you change the rule, change it everywhere.**

## What this repo is

This is the student work repository for **TECHIE 1121 — Ethical Vibe Coding**
(Cornell Tech, Summer 2026). Students "vibe code" small apps with AI agents. The
course is about *how* you build with AI — the process, the prompts, the ethical
choices — at least as much as the final product.

Each assignment lives in a dated folder and uses this structure:

```text
weekN/M_DD/
├── code_deliverable/    # the app you build (HTML/CSS/JS, or a framework app)
├── log_deliverable/     # history.md — your AI interaction log (see below)
└── vibe-report.md       # your reflection / documentation
```

## THE VIBE-TRACE RULE (required)

**Whenever you create or edit files inside any `code_deliverable/` directory, you
MUST log the interaction to the sibling `log_deliverable/history.md`**
(e.g. `../log_deliverable/history.md`). Create the file if it does not exist.

**Prepend each new entry to the TOP of `history.md`** (newest first). Use exactly
this template:

```markdown
## [Local Time: YYYY-MM-DD HH:MM:SS]

**User Prompt**:
> [Insert the exact user prompt here]

**Metadata & Annotations**:
- **Time**: [Local time]
- **Tool**: [e.g. GitHub Copilot / Codex / Claude Code / Cursor / Gemini / Windsurf / v0 / Replit]
- **Annotations**: [Any instructions or context attached to the prompt]

**Input Files**:
- [Files read or modified as direct context]

**Action Summary**:
- [What you changed and why]

---
```

This fulfills the course requirement to document the "vibe" of the coding process.
Do it every turn that touches a `code_deliverable/`, without being asked.

## Working style for this course

- Prefer simple, readable, well-commented code — students must be able to explain it.
- Keep each assignment self-contained inside its `weekN/M_DD/` folder.
- Put all assets (images, fonts, models) inside `code_deliverable/` or reference them by URL.
- Do not touch other students' or other assignments' folders.
- Never invent citations, data, or statistics in a `vibe-report.md`; flag assumptions.
