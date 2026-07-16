# CLAUDE.md — Ethical Vibe Coding (TECHIE 1121)

Instructions for **Claude Code** in this repository. The full canonical version
(with repo structure and working-style notes) is in [AGENTS.md](AGENTS.md) — read it too.

## THE VIBE-TRACE RULE (required)

Whenever you create or edit files inside any `code_deliverable/` directory, you MUST
log the interaction to the sibling `log_deliverable/history.md` (e.g.
`../log_deliverable/history.md`). Create the file if it does not exist.

**Prepend each new entry to the TOP of `history.md`** (newest first), using this template:

```markdown
## [Local Time: YYYY-MM-DD HH:MM:SS]

**User Prompt**:
> [Insert the exact user prompt here]

**Metadata & Annotations**:
- **Time**: [Local time]
- **Tool**: Claude Code
- **Annotations**: [Any instructions or context attached to the prompt]

**Input Files**:
- [Files read or modified as direct context]

**Action Summary**:
- [What you changed and why]

---
```

This is a graded course requirement: document the "vibe" of the process, every turn
that touches a `code_deliverable/`, without being asked.

## Working style
- Simple, readable, well-commented code the student can explain.
- Keep each assignment inside its own `weekN/M_DD/` folder; assets go in `code_deliverable/`.
- Never invent citations or data in a `vibe-report.md`.
