<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Auto-commit and push on accepted features

When Jeff accepts a feature or fix (explicit "looks good", "ship it", "that works", or moves on to the next thing after verifying), commit and push to `main` without asking. GitHub Actions auto-deploys; he only needs to restart PM2 if the build changes infra.

Rules:
- Only after Jeff has accepted/verified the change — not after an edit lands.
- Stage specific files (never `git add -A` or `.`). Skip anything that looks like a secret (`.env`, credentials).
- Commit message: concise, why-over-what, following recent repo style.
- Push to `origin main`. Never force-push.
- If tests/lint/build run in a pre-commit hook and fail, fix and create a NEW commit — never `--amend`, never `--no-verify`.
- If a migration file is part of the change, still remind Jeff to apply it in the Supabase SQL Editor — auto-commit doesn't auto-migrate.
