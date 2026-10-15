# Generative Sonic Mandala

An interactive, audio-reactive radial waveform visualizer built with HTML5 Canvas and the Web Audio API. It transforms microphone input and mathematical harmonic ratios into dynamic polyrhythmic mandalas with real-time particle dynamics.

## Features

- **Audio-Reactive Visuals**: Real-time FFT frequency mapping responds dynamically to live microphone input.
- **Polyrhythmic Frequency Bands**: Multi-genre harmonic presets ranging from Sub-Bass (55 Hz) to Kinetic Pop (880 Hz), each with distinct wave math and color palettes.
- **Dynamic Particle Physics**: Hundreds of responsive particles reacting to radial waveforms, acoustic impulses, and cursor proximity.
- **Interactive Control Deck**: Fine-tune harmonic steps and turbulence, switch genre focus, and trigger acoustic ripples via click or tap.
- **Snapshot Export**: Export crisp high-resolution PNG captures directly from the canvas.
- **Theme Support & Accessibility**: Dark, Light, and System themes, `prefers-reduced-motion` compliance, and full ARIA semantics.
- **Zero Dependencies**: Lightweight, single-file vanilla JavaScript, CSS, and HTML with no build tools, bundlers, or npm packages required.

## Quick Start

Modern browsers require a secure origin (`localhost` or `https://`) to grant microphone permissions.

### 1. Serve Locally

Run any static HTTP server from the repository root:

```bash
# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

### 2. Open in Browser

Navigate to `http://localhost:8000` (or the port provided by your server).

> **Note**: You can also open `index.html` directly as a local file (`file://`) to run the generative visualizer without microphone access.

## Controls & Keyboard Shortcuts

| Input / Shortcut | Action |
| :--- | :--- |
| **Click / Tap** | Trigger an acoustic impulse ripple |
| **Hover / Pointer Move** | Inspect frequency bands and apply magnetic particle deflection |
| `M` | Toggle microphone input on / off |
| `S` | Export current canvas frame as a PNG image |
| `T` | Cycle color theme (System → Light → Dark) |

## Tech Stack

- **Graphics**: HTML5 `<canvas>` 2D rendering with 60fps delta-time normalization and high-DPI (Retina) scaling
- **Audio**: Web Audio API (`AudioContext`, `AnalyserNode` FFT)
- **Styling & Fonts**: CSS Custom Properties, Google Sans Flex & Google Sans Code
- **Runtime**: 100% Vanilla JavaScript with zero external dependencies

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
