---
trigger: always_on
glob: "**/code_deliverable/**"
description: Automatically log user prompts, annotations, and input files for vibe coding sessions in deliverable folders, prepending to history.md.
---

Whenever you are working on files within a `code_deliverable` directory, you MUST maintain a detailed log of the interaction in the corresponding `log_deliverable` directory (e.g., `../log_deliverable/history.md`).

**CRITICAL: Each entry MUST be prepended to the TOP of the `history.md` file.**

The log entry MUST use the following template:

```markdown
## [Local Time: YYYY-MM-DD HH:MM:SS]

**User Prompt**:
> [Insert Exact User Prompt Here]

**Metadata & Annotations**:
- **Time**: [Local Time]
- **Annotations**: [Any specific metadata or instructions attached to the prompt]

**Input Files**:
- [List of files being modified or used as direct context]

**Action Summary**:
- [Brief description of the changes made and the rationale]

---
```

This ensures transparency and fulfills the course requirement for documenting the "vibe" of the coding process.
