# Philips 77OLED809/12 Reference Specification

This document details the hardware specifications of the **Philips 77OLED809/12** (77" 4K OLED, Google TV) and captures the specific architectural, performance, visual, and acoustic considerations for developing, optimizing, and testing **Generative Sonic Mandala** on this platform.

---

## 1. Technical Specifications

### Hardware & Display

| Parameter | Specification |
| :--- | :--- |
| **Model** | Philips 77OLED809/12 |
| **Screen Size** | 77 inches (194 cm diagonal) |
| **Panel Technology** | OLED 4K Ultra HD (LG Display OLED.EX Panel) |
| **Native Resolution** | 3840 x 2160 pixels (16:9 aspect ratio) |
| **Native Refresh Rate** | 120Hz native (up to 144Hz with Variable Refresh Rate) |
| **Picture Processing** | 8th Gen P5 AI Perfect Picture Engine |
| **High Dynamic Range (HDR)** | Dolby Vision, HDR10+, HDR10+ Adaptive, HDR10, HLG |
| **Certifications** | IMAX Enhanced, Calman Ready |

### Smart TV & OS Environment

| Parameter | Specification |
| :--- | :--- |
| **Operating System** | Google TV (based on Android TV OS) |
| **Application Ecosystem** | Google Play Store for Android TV |
| **Voice Assistant** | Google Assistant built-in (remote microphone & TV integration) |
| **Smart Home Integration** | Amazon Alexa, Matter, Apple HomeKit / AirPlay 2 |
| **Firmware Notes** | Regional catch-up suites (Freeview Play / UK apps) are not natively bundled on this specific firmware variant; standard Google Play Store runtime applies. |

### Connectivity & I/O

| Parameter | Specification |
| :--- | :--- |
| **HDMI Ports** | 4 ports total: <br>• 2x HDMI 2.1 (4K @ 120Hz / 144Hz, VRR, ALLM) <br>• 2x HDMI 2.0 |
| **Audio Return Channel** | eARC supported on HDMI 2 |
| **USB Ports** | 2 ports (1x USB 3.0, 1x USB 2.0) |
| **Wireless Connectivity** | Wi-Fi 6 (802.11ax) Dual-band, Bluetooth 5.2 |
| **Other Audio / Network I/O** | Optical Digital Audio Out (TOSLINK), Ethernet (RJ-45 10/100 Mbps), 3.5mm Headphone out, CI+ slot |

### Gaming & Latency Features

| Parameter | Specification |
| :--- | :--- |
| **Variable Refresh Rate (VRR)** | AMD FreeSync Premium, NVIDIA G-SYNC Compatible |
| **Auto Low Latency Mode (ALLM)** | Supported across HDMI 2.1 inputs |
| **Game Enhancement** | Dedicated On-Screen Game Bar, Dolby Vision Gaming mode |

### Audio System

| Parameter | Specification |
| :--- | :--- |
| **Total Audio Power** | 70W RMS total output |
| **Speaker Configuration** | 2.1 Channel: <br>• 4 x 10W mid-high frequency transducers <br>• 1 x 30W integrated rear subwoofer |
| **Supported Codecs** | Dolby Atmos, DTS:X |
| **Wireless Multiroom** | DTS Play-Fi |

### Ambilight System

| Parameter | Specification |
| :--- | :--- |
| **Configuration** | 3-Sided Integrated Ambilight (Top, Left, Right rear LED arrays) |
| **Feature Modes** | Ambilight Lounge mode, Wall colour adaptive, AmbiWakeup, AmbiSleep, Ambilight Music |

---

## 2. Development & Engineering Implications for Sonic Mandala

The Philips 77OLED809/12 provides a massive 77" high-contrast OLED canvas combined with 120Hz refresh rates, a 2.1 audio system with dedicated low-end bass, and 3-sided Ambilight bias lighting. Developing and testing for this TV requires alignment with the following core engineering domains:

### A. Display & Panel Protection (OLED.EX Burn-in Mitigation)

Because OLED pixels are emissive organic diodes, prolonged static bright elements can cause temporary image retention or permanent differential aging.

1. **True-Black Canvas Clearing (`#000000`)**:
   * The app clears the canvas using `#000000` (or transparent black over a `#000000` background). On the 77OLED809's EX panel, true black turns the organic subpixels completely off (0 nits), yielding infinite contrast and zero power draw across unlit screen areas.
   * *Requirement*: Retain true black as the primary background foundation in dark mode; never use dark grays (`#121212`) for fullscreen fills.
2. **Auto-Hiding Heads-Up Display (HUD)**:
   * The control deck, badges, sliders, and buttons fade out completely after 4 seconds of inactivity (`HUD.hide()`).
   * *Requirement*: Ensure active DOM focus is released (`document.activeElement.blur()`) when the HUD fades out so no bright focus rings remain visible on the panel.
3. **Auto Pulse & Particle Drift**:
   * Auto Pulse continuously animates a virtual pointer across the canvas in organic orbits, triggering ripples and shifting particle trajectories.
   * *Benefit*: Continuous subtle movement across the center of the 77" screen prevents static line-drawing retention during ambient background sessions.

---

### B. 120Hz Rendering & Resolution Scaling

The native 120Hz panel cuts the frame time budget from 16.67ms (60Hz) down to **8.33ms**.

1. **Delta-Time Normalization (`dt60`)**:
   * The physics simulation and particle integration in `src/js/app.js` normalize elapsed time via `dt60 = elapsed / (1000 / 60)`.
   * On a 120Hz display, `requestAnimationFrame` fires every ~8.33ms (`dt60 ≈ 0.5`). The math cleanly scales velocities, harmonic wave rotation, and particle decay per frame without speeding up or slowing down motion.
2. **Canvas DPI and Viewport Constraints (Dynamic DPR 1.0 Capping)**:
   * The physical panel is 3840 x 2160, but the Android TV WebView exposes a logical CSS viewport of 1920 x 1080 with a `window.devicePixelRatio` of 1.5 or 2.0.
   * Rendering a 2D canvas at full uncompressed 3840x2160 with hundreds of glowing particle paths, radial gradients, and composite blend modes on a TV SoC GPU (MediaTek Pentonic 1000 / ARM Mali-G57 MC2) causes GPU fillrate bottlenecks and dropped frames.
   * *Implementation*: `HardwareProfile` detects the TV via the native Android `DeviceBridge` (or UA heuristics) and caps backing canvas DPR to `1.0` (`maxDpr: 1.0`). This keeps canvas backing at 1920x1080 (a 4x fillrate reduction vs 4K), allowing the TV's hardware upscaler to project the image onto the 77" screen smoothly.
3. **Particle Budget & Particle Theme Caching**:
   * To fit comfortably inside the 8.33ms budget at 120Hz, the `philips-oled` profile applies a `particleBudget` of `0.50` (50% particle density), reducing per-frame draw calls.
   * Particle theme styles (`fillStyleDark`, `fillStyleLight`) are precomputed at initialization, providing reduced particle-style allocations through caching during 120Hz playback.

---

### C. TV Remote Navigation & Spatial Focus

The 77OLED809/12 is operated via a voice remote with a 5-way D-pad (no mouse or touchscreen).

1. **Android Keycode Handling**:
   * The app maps both modern DOM `key` values and raw Android `keyCode` values in `src/js/app.js`:
     * `DPAD_UP` (19), `DPAD_DOWN` (20), `DPAD_LEFT` (21), `DPAD_RIGHT` (22)
     * `DPAD_CENTER` (23) / `ENTER`
     * `BACK` (4) / `Escape`
     * `MEDIA_PLAY_PAUSE` (85), `MEDIA_PLAY` (126), `MEDIA_PAUSE` (127)
2. **Focus Lifecycle & `inert`**:
   * When the HUD is hidden, interactive controls must be marked `inert` or unfocused so D-pad clicks do not invisibly activate buttons while the user is enjoying the visualizer.
   * Pressing any D-pad arrow immediately reveals the HUD and focuses the first logical control.
3. **Overscan Margins**:
   * All critical HUD controls and badges must remain within the TV overscan-safe zone (5% padding from the display edge, as configured in `src/css/style.css`).

---

### D. Audio Pipeline & Physical Speaker Profile

The audio system consists of 70W RMS output in a 2.1 arrangement (4 x 10W mid-high drivers + 30W rear subwoofer).

1. **Sub-Bass Harmonic Band (55Hz)**:
   * The app includes a dedicated Sub-Bass harmonic preset centered at 55Hz.
   * The 30W integrated subwoofer reproduces low frequencies down to ~40–60Hz, allowing the room to physically resonate with the visual pulse when music is played in the room.
2. **Microphone Capture & HDMI eARC Preservation**:
   * Capturing ambient room audio requires the `RECORD_AUDIO` permission in `AndroidManifest.xml` and an explicit `navigator.mediaDevices.getUserMedia(...)` call.
   * *AEC & Audio Routing Pitfall*: When Chromium's `getUserMedia` requests default audio, it enables Acoustic Echo Cancellation (AEC) and switches Android's audio system to `MODE_IN_COMMUNICATION`. On Android TV OS, communication audio is hardwired to route exclusively to internal TV speakers, causing external HDMI eARC/ARC AV receiver connections to disconnect.
   * *Resolution*:
     * **Web Layer**: `HardwareProfile.current.audioConstraints` passes explicit raw constraints (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`), preventing Chromium from requesting VoIP communication mode and preserving full-fidelity audio for FFT analysis.
     * **Native Layer**: In `MainActivity.kt`, granting audio capture enforces `audioManager.mode = AudioManager.MODE_NORMAL` and explicitly selects HDMI audio endpoints on Android 12+ (`setCommunicationDevice`), ensuring TV audio remains routed over HDMI eARC to the external AV receiver.
   * On Google TV, the microphone may reside on an attached USB conference/webcam mic or external audio interface.
   * *Note*: Google Assistant hotword listening may temporarily hold or arbitrate microphone access; the app handles microphone stream interruptions gracefully.

---

### E. Ambilight Synergy (3-Sided Integrated Lighting)

The 77OLED809 includes 3-sided rear Ambilight LEDs projecting real-time colored light onto the surrounding wall.

1. **Ambilight Music Mode**:
   * When the TV's native "Ambilight Music" mode is active, the TV analyzes the incoming audio signal and pulses the rear LEDs in synchrony with ambient music.
2. **Video-Following Bias Lighting**:
   * In standard Ambilight video modes, the TV samples the edges of the active display.
   * Because Sonic Mandala uses an OLED true-black canvas with radial waves expanding outwards, acoustic impulses sending shockwave rings and glowing particles to the edge of the 77" screen trigger synchronized light bursts onto the physical wall.
   * The color palettes (e.g. Cyberpunk Cyan, Solar Gold, Deep Violet) naturally project into the room.

---

### F. Picture Engine Tuning (8th Gen P5 AI)

The TV includes Philips' 8th Generation P5 AI processing engine, which applies deep learning upscaling, motion smoothing (MEMC), and dynamic contrast enhancement.

* **Motion Smoothing**: Aggressive frame interpolation can introduce unnatural motion artifacts on high-frequency procedural mandala lines and thin particle trails.
* **Input Latency**: Standard picture modes (Vivid / Standard) may add 50–100ms of display processing delay, desynchronizing the visual response from ambient music.
* **Recommended TV Picture Settings for Mandala**:
  * **Picture Style**: *Game Mode*, *Filmmaker Mode*, or *Monitor Mode*.
  * **Motion**: Set *Motion Styles* to *Off* or *Pure Cinema* to disable frame interpolation.
  * **Auto Low Latency Mode (ALLM)**: Enabled to guarantee instantaneous rendering response.

---

## 3. Developer Workflow: Sideloading & Remote Debugging

The Philips 77OLED809/12 runs Google TV (Android TV OS), supporting standard Android Debug Bridge (ADB) over Wi-Fi 6 or Ethernet.

### Step 1: Enable Developer Options on the TV

1. On the Philips Google TV, go to **Settings** (gear icon) → **System** → **About**.
2. Scroll down to **Android TV OS build** and click the remote's Center button 7 times until you see the prompt: *"You are now a developer!"*.
3. Go back to **Settings** → **System** → **Developer options**.
4. Enable **USB debugging** (and **Network debugging** / **Wireless debugging** if shown separately).

### Step 2: Connect via Wireless ADB

Find the TV's IP address under **Settings** → **Network & Internet** → **Connected Network**.

From your development machine on the same local Wi-Fi / LAN network:

```bash
# Connect to the Philips Google TV
adb connect 192.168.1.xxx:5555

# Verify connection
adb devices
# Output should show: 192.168.1.xxx:5555    device
```

> [!TIP]
> A confirmation dialog will appear on the 77" TV screen: *"Allow USB debugging from this computer?"*. Select **Always allow from this computer** and press OK on the remote.

### Step 3: Install and Sideload the APK

Build and install the debug APK directly from the repository:

```bash
cd android
./gradlew assembleDebug
adb -s 192.168.1.xxx:5555 install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Inspect WebView Logs in Real Time

Monitor Chromium WebView console logs, Web Audio context states, and D-pad event handling:

```bash
adb -s 192.168.1.xxx:5555 logcat chromium:I *:S
```

### Step 5: Test Web Version Directly via HDMI 2.1

Alternatively, connect a laptop or desktop with an HDMI 2.1 cable to HDMI Port 1 or 2 on the TV:

1. Set the TV display mode to **3840 x 2160 @ 120Hz**.
2. Open Chrome or Edge with hardware acceleration enabled.
3. Navigate to the local dev server (`http://localhost:8000`).
4. Verify 120Hz smooth canvas performance and inspect rendering metrics via DevTools (`chrome://gpu` and the FPS meter).

---

## 4. Android TV Platform Compatibility Checklist

| Feature | Target State on Philips 77OLED809/12 | Status in Repo |
| :--- | :--- | :--- |
| **Overscan Safety** | Critical HUD controls have ≥ 5% margin from edges | Implemented (`src/css/style.css`) |
| **D-pad Navigation** | Full spatial navigation with focus lifecycle | Implemented (`src/js/app.js`) |
| **OLED Black Clear** | Canvas and body clear with `#000000` | Implemented |
| **HUD Auto-Hide** | Controls disappear after 4 seconds of idle | Implemented |
| **Auto Pulse** | Organic pointer drift for hands-free TV ambient display | Implemented |
| **Microphone Permission** | Runtime `RECORD_AUDIO` request for Web Audio FFT | Implemented (`android/`) |
| **Leanback Launcher** | Android TV launcher banner and category filter | Documented in TV roadmap |
| **120Hz Frame Budget** | Delta-time normalization (`dt60`) | Implemented |
| **Hardware Profile Bridge** | `DeviceBridge` exposed to WebView with TV/OLED profile detection | Implemented (`android/` & `src/js/app.js`) |
| **DPR 1.0 Backbuffer Capping** | Backing canvas capped at 1080p on TV to prevent 4K GPU fillrate saturation | Implemented (`src/js/app.js`) |
| **HDMI eARC Audio Output** | Enforces `MODE_NORMAL` and raw audio constraints so mic capture preserves AV receiver sink | Implemented (`android/` & `src/js/app.js`) |
| **Particle Theme Caching** | Precomputed theme styles provide reduced particle-style allocations through caching during 120Hz playback | Implemented (`src/js/app.js`) |
