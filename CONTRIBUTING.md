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

## Development Workflow

1. Fork the repository and create a feature branch from `main`:

   ```bash
    git checkout main
    git pull origin main
    git checkout -b feature/your-feature-name
   ```

2. Start a local HTTP server from the project root (required for Web Audio, modules, and asset loading):

    ```bash
    # Node.js
    npx serve src -l 8000

    # or Python 3
    python3 -m http.server 8000 --directory src
    ```

3. Open `http://localhost:8000` in your browser to verify changes.
4. Ensure all manual testing and browser console checks pass cleanly without unhandled runtime exceptions.
