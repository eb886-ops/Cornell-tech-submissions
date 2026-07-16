# GitHub Copilot Instructions — Ethical Vibe Coding (TECHIE 1121)

Repository-wide custom instructions for **GitHub Copilot** (Chat & agent mode).
The full canonical version is in [AGENTS.md](../AGENTS.md) — follow it too.

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
- **Tool**: GitHub Copilot
- **Annotations**: [Any instructions or context attached to the prompt]

**Input Files**:
- [Files read or modified as direct context]

**Action Summary**:
- [What you changed and why]

---
```

This is a graded course requirement: document the "vibe" of the process, on **every**
turn that touches a `code_deliverable/` — including deep into a long chat. Do not stop
logging as the conversation grows; if you realize you skipped a turn, add it now.

> Note: Copilot's autocomplete (grey-text) suggestions cannot write log files. Use
> **Copilot Chat / agent mode** for changes you need logged, or add the entry yourself.
> If asked to "log that to history.md," re-read this rule and append the missing entries.

## Working style
- Simple, readable, well-commented code the student can explain.
- Keep each assignment inside its own `weekN/M_DD/` folder; assets go in `code_deliverable/`.
- Never invent citations or data in a `vibe-report.md`.
