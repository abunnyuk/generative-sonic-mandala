# Generative Sonic Mandala

[![CodeQL](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/github-code-scanning/codeql)
[![GitHub Pages](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/pages.yml/badge.svg)](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/pages.yml)
[![Android App](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/android.yml/badge.svg)](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/android.yml)

An interactive, audio-reactive radial waveform visualizer built with HTML5 Canvas and the Web Audio API. It transforms microphone input and mathematical harmonic ratios into dynamic polyrhythmic mandalas with real-time particle dynamics.

## Features

- **Audio-Reactive Visuals**: Real-time FFT frequency mapping responds dynamically to live microphone input.
- **Polyrhythmic Frequency Bands**: Multi-genre harmonic presets ranging from Sub-Bass (55 Hz) to Kinetic Pop (880 Hz), each with distinct wave math and color palettes.
- **Dynamic Particle Physics**: Hundreds of responsive particles reacting to radial waveforms, acoustic impulses, and cursor proximity.
- **Interactive Control Deck**: Fine-tune harmonic steps and turbulence, switch genre focus, and trigger acoustic ripples via click or tap. **Auto Pulse** (0–10, default off) adds a self-driving pointer that wanders smoothly across the whole mandala and emits ripples at organic intervals — handy on TV, where there is no mouse. Auto Pulse cooperatively yields to active user pointer interactions (mouse moves, clicks, and touches) and smoothly engages when the user is idle. An optional **Shockwaves** toggle (disabled by default for a smoother look) can be enabled to draw visual concentric ripple rings.
- **Animation Controls**: Pause and resume the generative visualizer at any frame.
- **Distraction-Free Auto-Hiding HUD**: Controls and cursor smoothly fade out during inactivity for an immersive, uninterrupted visual experience.
- **OLED True Black Foundation**: True black (`#000000`) canvas clearing and styling designed to protect OLED displays against burn-in.
- **Multi-Input & Spatial Navigation**: Comprehensive support for mouse, touch, keyboard, and TV remote D-pads (including Google TV / Android keycodes).
- **Snapshot Export**: Export crisp high-resolution PNG captures directly from the canvas.
- **Native Android App**: A WebView wrapper with runtime microphone permission, installable as an APK (see [Android App](#android-app)).
- **Theme Support & Accessibility**: Dark, Light, and System themes, `prefers-reduced-motion` compliance, and full ARIA semantics.
- **Zero Dependencies**: Lightweight vanilla JavaScript, CSS, and HTML with no build tools, bundlers, or npm packages required for the web app.

## Quick Start

Modern browsers require a secure origin (`localhost` or `https://`) to grant microphone permissions.

1. Run any static HTTP server with `src/` as the document root:

    ```bash
    # Node.js
    npx serve src -l 8000

    # or Python 3
    python3 -m http.server 8000 --directory src
    ```

2. Open `http://localhost:8000` in your browser.

> [!NOTE]
> You can also open `src/index.html` directly as a local file (`file://`) to run the generative visualizer without microphone access.

## Project Structure

```text
├── .github/
│   ├── ISSUE_TEMPLATE/   # Bug report & feature request templates
│   └── workflows/        # GitHub Pages + Android build workflows
├── .vscode/              # Shared editor settings
├── android/              # Native Android (Kotlin + WebView) wrapper
├── docs/
│   ├── ANDROID.md        # Build, sign, and publish the Android app
│   └── CI.md             # GitHub Actions workflows & release process
├── src/                  # The web app (single source of truth, also bundled into the APK)
│   ├── assets/           # Static media assets & icons
│   ├── css/style.css     # Stylesheets, themes, & design tokens
│   ├── js/app.js         # Canvas rendering, Web Audio FFT, & interactions
│   └── index.html        # Application entry point
├── CONTRIBUTING.md       # Contribution guidelines & architectural principles
├── LICENSE               # GNU General Public License v3.0
└── README.md
```

## Controls & Keyboard Shortcuts

| Input / Shortcut | Action |
| :--- | :--- |
| **Click / Tap** | Trigger an acoustic impulse ripple on canvas, or activate controls |
| **Double-Click / Double-Tap** | Trigger a full-mandala mega acoustic impulse |
| **Hover / Pointer Move** | Inspect frequency bands, apply magnetic particle deflection, or wake the HUD |
| **Play / Pause Button** / `MediaPlayPause` | Pause or resume generative animation |
| `M` | Toggle microphone input on / off |
| `S` | Export current canvas frame as a PNG image |
| `T` | Cycle color theme (System → Light → Dark) |
| `Escape` / `Back` | Hide HUD overlay immediately |
| `Arrow Keys` / `D-pad` | Spatial focus navigation across HUD controls; adjust slider values (`Left` / `Right`) |

> [!TIP]
> The HUD automatically fades out after 4 seconds of inactivity. Move the pointer, tap the screen, or press any navigation key / D-pad button to reveal the controls again. When Auto Pulse is enabled, leaving the pointer stationary allows Auto Pulse to smoothly take over after 3 seconds of inactivity.

## Tech Stack

- **Graphics**: HTML5 `<canvas>` 2D rendering with 60fps delta-time normalization, high-DPI (Retina) scaling, and OLED true-black clear states
- **Audio**: Web Audio API (`AudioContext`, `AnalyserNode` FFT)
- **Styling & Fonts**: CSS Custom Properties, Google Sans Flex & Google Sans Code
- **Ergonomics & Navigation**: Auto-hiding HUD with focus lifecycle management (`inert`), cursor auto-suppression, and 2D spatial D-pad navigation
- **Runtime**: 100% Vanilla JavaScript with zero external dependencies
- **Android**: Kotlin, `WebView` + `WebViewAssetLoader`, Android Gradle Plugin 8.5, Gradle 9.7 (JDK 17)

## Android App

A native Android wrapper (Kotlin + WebView, no Node required) lives in [`android/`](android/). It bundles `src/` into the APK, serves it from the secure `https://appassets.androidplatform.net` origin, and requests the `RECORD_AUDIO` permission at runtime when you tap **Enable Mic**.

```bash
cd android && ./gradlew assembleDebug   # requires JDK 17 + Android SDK 34
```

See [docs/ANDROID.md](docs/ANDROID.md) for the full build, signing, and publishing guide, and [docs/CI.md](docs/CI.md) for the automated builds and releases.

## Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for architectural principles, code of conduct, and development workflow.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
