# Contributing Guidelines

Thank you for your interest in contributing to the project. We welcome contributions that improve stability, performance, cross-platform compatibility, and visual quality.

Please review this guide before submitting changes.

## Code of Conduct

We are committed to providing a respectful, welcoming, and productive environment for all contributors. Please keep discussions professional, constructive, and focused on technical merit.

## Architectural Principles

When writing or modifying code, keep the following core constraints in mind:

- **True Black Foundation (`#000000`):** To safeguard mobile and television OLED displays against panel burn-in, viewports and canvas clear states must default to pure black. Avoid persistent ambient overlays or semi-transparent letterbox bars.
- **Distraction-Free Auto-Hiding UI:** Static controls and HUD elements must fade out following periods of user inactivity. Any new interface elements must register with the visibility lifecycle and focus-suppression handlers (`inert` / `tabIndex = -1` when hidden).
- **Multi-Input Ergonomics:** The application supports pointer, touch, and D-pad/remote controller input (such as Google TV key codes). All user-facing components must support standard spatial focus and keyboard navigation without relying exclusively on hover states or continuous pointer events.
- **Render Performance:** Audio analysis and generative rendering run continuously on animation frames. Avoid operations that trigger layout reflows, garbage collection spikes, or canvas context resets during the render loop.

### Commit & Pull Request Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) to automatically manage versioning and releases via Release Please.

Please format your PR titles (which become squash-commit messages) as:
`<type>(<optional scope>): <description>`

#### Release-Triggering Types

- `feat:` Adds a new user-facing feature or capability (bumps **MINOR**, e.g. `1.0.0` → `1.1.0`).
- `fix:` Fixes a bug in the application (bumps **PATCH**, e.g. `1.0.0` → `1.0.1`).
- `perf:` Improves runtime performance without changing behavior (bumps **PATCH**).
- Append `!` or add `BREAKING CHANGE:` in the body for breaking changes (bumps **MAJOR**, e.g. `1.0.0` → `2.0.0`).

#### Non-Releasing Types (Do NOT trigger releases)

- `docs:` Documentation-only changes (README, docs/, code comments).
- `chore:` Tooling, dependency maintenance, git configuration.
- `ci:` GitHub Actions workflow and CI script updates.
- `refactor:` Code reorganization that neither fixes a bug nor adds a feature.
- `test:` Adding or updating tests or verification scripts.
- `style:` Whitespace, formatting, or linting fixes that do not change code logic.

#### Common Scopes

Scopes are optional but encouraged when changes are contained:

- `canvas`: Waveform math, particle physics, shaders, and 2D canvas rendering.
- `audio`: Web Audio API, FFT analyzer, microphone capture, and eARC routing.
- `hud`: Controls deck, spatial navigation, focus lifecycle (`inert`), and theming.
- `android`: Native Kotlin wrapper, WebView bridge, manifest, and Gradle builds.
- `tv`: Android TV / Google TV optimizations, D-pad ergonomics, and remote key handling.
- `docs`: Documentation, guides, and architectural notes.
- `ci`: GitHub Actions workflows, Release Please, and validation scripts.

#### Branch Naming

We recommend prefixing branch names with the corresponding type (e.g. `feat/auto-pulse`, `fix/dpad-focus`, `perf/render-caching`, `docs/ci-guide`).

> [!IMPORTANT]
> If you are fixing a typo in documentation or updating a markdown file, use `docs:`, not `fix:`. Using `fix:` will trigger an unnecessary release.

## Development Workflow

1. Fork the repository and create a branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b <type>/your-branch-name
   ```

2. Run the app locally by following the [Quick Start in the README](README.md#quick-start). Serve `src/` over `localhost` or `https://`; Web Audio microphone access requires a secure origin.
3. Make your changes in `src/` (the only source of truth for the web app; the Android build copies it from there).
4. Verify in your browser at `http://localhost:8000`. Check that there are no unhandled exceptions in the console, and test mouse, touch, and keyboard/D-pad navigation, light/dark themes, and `prefers-reduced-motion`.
5. If your change affects the Android wrapper (`android/`) or needs testing inside the WebView, follow [docs/ANDROID.md](docs/ANDROID.md) to build and install a debug APK.
6. Open a pull request against `main`. Changes under `src/`, `android/`, or the Android workflow trigger the Android build (see [docs/CI.md](docs/CI.md)), which must pass.

## Dependencies & Security

The web app has no runtime dependencies; please keep it that way. For the Android build, the Gradle versions and the security-driven dependency overrides in [`android/build.gradle.kts`](android/build.gradle.kts) are described in [docs/ANDROID.md](docs/ANDROID.md#dependency-security-overrides). Do not commit keystores or credentials.
