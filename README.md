# Generative Sonic Mandala

[![CodeQL](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/github-code-scanning/codeql)
[![Publish Static Website](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/publish.yml/badge.svg)](https://github.com/abunnyuk/generative-sonic-mandala/actions/workflows/publish.yml)

An interactive, audio-reactive radial waveform visualizer built with HTML5 Canvas and the Web Audio API. It transforms microphone input and mathematical harmonic ratios into dynamic polyrhythmic mandalas with real-time particle dynamics.

## Features

- **Audio-Reactive Visuals**: Real-time FFT frequency mapping responds dynamically to live microphone input.
- **Polyrhythmic Frequency Bands**: Multi-genre harmonic presets ranging from Sub-Bass (55 Hz) to Kinetic Pop (880 Hz), each with distinct wave math and color palettes.
- **Dynamic Particle Physics**: Hundreds of responsive particles reacting to radial waveforms, acoustic impulses, and cursor proximity.
- **Interactive Control Deck**: Fine-tune harmonic steps and turbulence, switch genre focus, and trigger acoustic ripples via click or tap.
- **Animation Controls**: Pause and resume the generative visualizer at any frame.
- **Distraction-Free Auto-Hiding HUD**: Controls and cursor smoothly fade out during inactivity for an immersive, uninterrupted visual experience.
- **OLED True Black Foundation**: True black (`#000000`) canvas clearing and styling designed to protect OLED displays against burn-in.
- **Multi-Input & Spatial Navigation**: Comprehensive support for mouse, touch, keyboard, and TV remote D-pads (including Google TV / Android keycodes).
- **Snapshot Export**: Export crisp high-resolution PNG captures directly from the canvas.
- **Theme Support & Accessibility**: Dark, Light, and System themes, `prefers-reduced-motion` compliance, and full ARIA semantics.
- **Zero Dependencies**: Lightweight vanilla JavaScript, CSS, and HTML with no build tools, bundlers, or npm packages required. Organized cleanly with source files in `src/`.

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
├── .github/          # GitHub Actions workflows & issue templates
├── CONTRIBUTING.md   # Contribution guidelines & architectural principles
├── LICENSE           # GNU General Public License v3.0
├── README.md         # Project documentation
└── src/
    ├── assets/       # Static media assets & icons
    ├── css/
    │   └── style.css # Stylesheets, themes, & design tokens
    ├── js/
    │   └── app.js    # Canvas rendering, Web Audio FFT, & interactions
    └── index.html    # Application entry point
```

## Controls & Keyboard Shortcuts

| Input / Shortcut | Action |
| :--- | :--- |
| **Click / Tap** | Trigger an acoustic impulse ripple on canvas, or activate controls |
| **Hover / Pointer Move** | Inspect frequency bands, apply magnetic particle deflection, or wake the HUD |
| **Play / Pause Button** / `MediaPlayPause` | Pause or resume generative animation |
| `M` | Toggle microphone input on / off |
| `S` | Export current canvas frame as a PNG image |
| `T` | Cycle color theme (System → Light → Dark) |
| `Escape` / `Back` | Hide HUD overlay immediately |
| `Arrow Keys` / `D-pad` | Spatial focus navigation across HUD controls; adjust slider values (`Left` / `Right`) |

> [!TIP]
> The HUD automatically fades out after 5 seconds of inactivity. Move the pointer, tap the screen, or press any navigation key / D-pad button to reveal the controls again.

## Tech Stack

- **Graphics**: HTML5 `<canvas>` 2D rendering with 60fps delta-time normalization, high-DPI (Retina) scaling, and OLED true-black clear states
- **Audio**: Web Audio API (`AudioContext`, `AnalyserNode` FFT)
- **Styling & Fonts**: CSS Custom Properties, Google Sans Flex & Google Sans Code
- **Ergonomics & Navigation**: Auto-hiding HUD with focus lifecycle management (`inert`), cursor auto-suppression, and 2D spatial D-pad navigation
- **Runtime**: 100% Vanilla JavaScript with zero external dependencies

## Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for architectural principles, code of conduct, and development guidelines.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

## Android app

A native Android wrapper (Kotlin + WebView, no Node required) lives in [`android/`](android/). It bundles `src/` into the APK, serves it from a secure `https://appassets.androidplatform.net` origin, and requests the `RECORD_AUDIO` permission at runtime when you tap **Enable Mic**.

Build locally (JDK 17 + Android SDK 34):

```bash
cd android && ./gradlew assembleDebug   # -> app/build/outputs/apk/debug/app-debug.apk
```

The [Build Android App](.github/workflows/android-release.yml) workflow builds APKs on every push to `main` and attaches them to a GitHub Release when a `v*` tag is pushed (e.g. `git tag v1.0.0 && git push --tags`). To sign the release APK, add the repo secrets `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` and `KEY_PASSWORD`; without them the release APK is unsigned.
