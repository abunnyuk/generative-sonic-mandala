# Repository Instructions for AI Agents

## Release & Commit Hygiene

This repository uses Release Please driven by Conventional Commits to publish releases and build Android APKs.

When preparing git commits, PR titles, or branch summaries, you MUST strictly adhere to:

1. **Format**: `<type>(<scope>): <subject in lowercase imperative without trailing period>`
   - Common scopes: `canvas`, `audio`, `hud`, `android`, `tv`, `docs`, `ci`
2. **Type Selection**:
   - `feat`: Only for new user-facing capabilities, controls, presets, or hardware profiles (triggers **minor** release).
   - `fix`: Strictly for bug fixes in runtime code (`src/` or `android/`) (triggers **patch** release).
   - `perf`: Strictly for performance optimizations like frame pacing or GC reduction (triggers **patch** release).
   - `docs`: MUST be used for any changes exclusively affecting `.md` files or documentation comments. NEVER use `fix:` for documentation typos (non-releasing).
   - `chore`: For dependency bumps, git configuration, and general maintenance (non-releasing).
   - `ci`: For `.github/workflows/` and CI script updates (non-releasing).
   - `refactor`: For code restructuring that neither fixes a bug nor adds a feature (non-releasing).
   - `test`: For adding or updating test suites and verification scripts (non-releasing).
   - `style`: For code style, formatting, or lint cleanups without logic changes (non-releasing).
3. **Branch Naming**:
   - When creating Git branches, always prefix with the corresponding type: `<type>/<short-kebab-description>` (e.g., `feat/auto-pulse`, `fix/dpad-focus`, `ci/release-automation`).
4. **Breaking Changes**:
   - Only use `feat!:` or `fix!:` if intentionally breaking platform compatibility (e.g. bumping Android `minSdk`) or altering core architectural contracts (triggers **major** release).
