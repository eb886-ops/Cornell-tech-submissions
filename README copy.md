[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/fw74T59W)
# Team Repo — Project 1 · Ethical Vibe Coding (TECHIE 1121)

This is your **team's shared repository** for Project 1. Everyone on the team
commits here, so the AI-interaction log and git history reflect the whole team's
work. (Teammate not on the repo yet? Accept the assignment and join your team:
[https://classroom.github.com/a/fw74T59W](https://classroom.github.com/a/fw74T59W))

**📖 The Project 1 brief lives on the course site:**
[Project 1 — Vibe Code Something Your Team Wants or Needs](https://vibe-coding-ethics.tech.cornell.edu/instructions.html?file=projects/project1/instructions.md&title=Project%201)

## Structure

```text
code_deliverable/     # your hosted app source goes here
log_deliverable/      # history.md — AI interaction log (Vibe-Trace, automatic)
project-report.md     # your team report — fill in the provided template
deadline.json         # due date
```

## Before you start

1. **Add every team member as a collaborator** and make sure everyone commits at
   least once — rotate who drives the AI.
2. **Vibe-Trace is pre-configured** for all supported tools (`AGENTS.md`,
   `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, Cursor/Windsurf
   rules). Whenever your AI edits `code_deliverable/`, it must log to
   `log_deliverable/history.md`. **Check that the log is actually filling up** —
   nudge your tool with "log that to history.md" if it forgets.
3. **Hosting:** GitHub Pages — repo *Settings → Pages → source: GitHub Actions*
   (the deploy workflow is included). Your app then lives at
   `https://cornell-tech-vibe-coding-summer-2026.github.io/<this-repo-name>/code_deliverable/`.
   Framework apps (React/Vue/Next) can use Vercel instead — connect the repo for auto-deploy.

## Run & test locally

- **Static app:** `npm run dev` → open [http://localhost:8000](http://localhost:8000).
  (No install needed — it uses Python's built-in server.)
- **Framework app:** work inside `code_deliverable/` as usual (`npm install`, `npm run dev`).
- **Check the deploy before pushing:** `npm run test:build` runs the same build
  script GitHub Pages uses, into `_site/` — if it passes locally, the deploy will pass.

## The report

`project-report.md` is pre-seeded with the template. It requires:
- your team roster (every member's name + GitHub handle),
- the record of your **fake-it loop and re-scope decision**, and how you split roles for the focused build,
- the team ethical reflection (**human-written**),
- an **individual reflection from every member** on collaborating with human
  teammates and collaborating with AI (**human-written**).
