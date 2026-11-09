# Generative Sonic Mandala Constitution

## Project Identity & Mission

Generative Sonic Mandala is an interactive, audio-reactive radial waveform visualizer and
kinetic particle dynamics engine. It targets desktop browsers, mobile devices, and ambient 4K
OLED living room displays (Android TV / Google TV).

## Core Principles

### I. Zero-Dependency Vanilla Web Core (Single Source of Truth)

The web application in `src/` is the single source of truth for both browser and native wrapper
deployments. The web runtime MUST remain 100% vanilla JavaScript, HTML5 Canvas 2D, Web Audio
API, and CSS Custom Properties, with zero bundlers, build steps, or runtime npm dependencies.

Rationale: one dependency-free codebase keeps browser and native builds identical and trivially
auditable.

### II. OLED True-Black Foundation & Hardware Burn-in Protection

Display preservation for emissive OLED/QD-OLED panels is non-negotiable.

- Canvas clear states, backgrounds, and viewport letterboxing MUST default to pure `#000000`.
- Persistent ambient overlays and high-contrast static elements are strictly prohibited, to
  prevent display burn-in during continuous ambient playback.

### III. Delta-Time Normalization & Zero-GC Render Loop

- Generative animation and particle physics MUST decouple motion velocity from display refresh
  rate using delta-time normalization, supporting 60Hz, 120Hz, and 144Hz panels seamlessly.
- The render and audio analysis loops MUST perform zero garbage-collecting allocations: use
  pre-allocated particle pools, cached style strings, and no layout reflows or DOM mutations
  within animation ticks.
- Hardware-adaptive profile heuristics MUST dynamically cap backbuffer resolution on
  resource-constrained TV SoCs.

### IV. Multi-Modal Input & Distraction-Free Spatial Navigation

- Input MUST provide first-class equality across mouse/touch, physical keyboard, and 5-way TV
  remote D-pads (Google TV keycodes).
- The interface MUST feature an auto-hiding HUD with a 4-second inactivity timeout and strict
  focus-lifecycle management: `inert` and focus suppression when hidden, plus cursor
  auto-hiding.
- Autonomous "Auto Pulse" wander mode MUST cooperatively yield immediately to any human
  interaction.

### V. Release & Commit Hygiene (Conventional Commits)

- Commits, PR titles, and branch summaries MUST follow Conventional Commits, managed by Release
  Please: `<type>(<scope>): <lowercase imperative subject without trailing period>`.
- Release-triggering types (`feat:`, `fix:`, `perf:`) MUST be strictly separated from
  non-releasing types (`docs:`, `chore:`, `ci:`, `refactor:`, `test:`, `style:`).
  Documentation changes MUST use `docs:` and NEVER `fix:`.
- Scopes MUST follow domain boundaries: `canvas`, `audio`, `hud`, `android`, `tv`, `docs`, `ci`.
- Git branches MUST be named `<type>/<kebab-description>`.
- Breaking markers (`feat!:`, `fix!:`) are reserved for intentional platform compatibility
  breaks (e.g. raising Android `minSdk`) or core architectural contract changes.

## Additional Constraints & Hardware Profiles

- **Native Android Wrapper**: A lightweight Kotlin WebView wrapper (`android/`) MUST bundle
  `src/` verbatim, serve it from `https://appassets.androidplatform.net`, request microphone
  permission at runtime, and preserve HDMI eARC audio routing.
- **Accessibility & Theming**: The app MUST fully support Dark, Light, and System themes,
  strictly honor `prefers-reduced-motion`, and use accessible ARIA attributes.
- **Audio Resilience**: Web Audio capture requires secure origins (`localhost` or `https://`).
  The app MUST fall back gracefully to silent generative behavior when microphone access is
  disabled or unavailable.

## Development Workflow & Quality Gates

- Dual-target verification: all changes MUST be verified against standalone web serving
  (`npx serve src` or `python3 -m http.server --directory src`), and against debug Android APK
  builds whenever wrapper code or bridge contracts are altered.
- Zero uncaught console exceptions and zero dropped frames under target device budgets.
- Reviews MUST verify compliance with Principles I–V.

## Governance

This constitution supersedes all ad-hoc conventions. Amendments MUST include a rationale, a
compliance impact assessment, and a semantic version increment:

- MAJOR: principle removals or redefinitions.
- MINOR: principle or section additions, or materially expanded guidance.
- PATCH: clarifications and refinements.

All PRs and reviews MUST verify compliance, and any deviation MUST be justified in writing.

**Version**: 1.0.0 | **Ratified**: 2026-11-09 | **Last Amended**: 2026-11-09
