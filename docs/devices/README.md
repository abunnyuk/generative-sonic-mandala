# Target Device Specifications & Hardware Profiles

This directory documents the reference hardware devices and display environments targeted by **Generative Sonic Mandala**.

Because this application runs across web browsers, mobile devices, and large-format Living Room / Ambient TV displays via its Android WebView wrapper, documenting target device profiles ensures:

* Visuals render smoothly at the device's native refresh rate and resolution without GPU throttling.
* OLED panels are safeguarded against burn-in through true-black background states and dynamic UI suppression.
* Remote control, D-pad, keyboard, and pointer inputs provide intuitive spatial navigation.
* Microphone capture and acoustic frequency reproduction align with the physical audio hardware.
* Ambient enhancements (such as Philips Ambilight) synchronize naturally with the generative visuals.

---

## Device Directory

| Device Model | Form Factor | Display / Panel | OS / Runtime | Primary Doc |
| :--- | :--- | :--- | :--- | :--- |
| **Philips 77OLED809/12** | 77" Living Room TV | 4K OLED (EX Panel), 120Hz/144Hz | Google TV (Android TV OS) | [`philips-77oled809.md`](philips-77oled809.md) |

---

## Hardware Profile Categories

When evaluating or onboarding a target device, consider the following technical dimensions:

### 1. Display Architecture & Refresh Rate

* **Panel Technology**: OLED / QD-OLED (emissive, true blacks, burn-in sensitive) vs. Mini-LED / LCD (transmissive, backlit).
* **Native Resolution & Viewport**: Physical 4K UHD (`3840x2160`) vs. logical viewport (`1920x1080` CSS pixels) and `window.devicePixelRatio`.
* **Refresh Rate & Frame Budget**: 60Hz (16.67ms frame time) vs. 120Hz/144Hz (8.33ms / 6.94ms frame time). The rendering engine must decouple physics velocity from frame rate using delta-time normalization.
* **Picture Processing Engine**: AI upscaling, motion interpolation, or dynamic contrast that could alter visual fidelity or introduce input-to-render latency.

### 2. Operating System & Runtime Environment

* **Platform**: Google TV / Android TV OS, Chromium WebView version, desktop browser, or mobile OS.
* **App Shell**: Native Kotlin WebView with `WebViewAssetLoader` running over `https://appassets.androidplatform.net`.
* **Resource Constraints**: SoC CPU cores, available GPU memory, and system background process limits.

### 3. Input & Interaction Paradigm

* **Navigation Hardware**: 5-way D-pad (Up/Down/Left/Right/Center), Back button, Media keys (`Play/Pause`), or pointer/touch.
* **Spatial Navigation**: Visual focus rings, keyboard trapping prevention (`inert`), and auto-hiding heads-up display (HUD).
* **Ambient Autonomy**: Auto Pulse capability to wander and trigger acoustic impulses autonomously during lean-back sessions without pointer input.

### 4. Acoustic Pipeline & Capture

* **Microphone Input**: Remote control microphone, far-field TV array, or USB audio interface.
* **Speaker Output**: Speaker channel configuration (e.g. 2.1 channel with dedicated subwoofer) and bass extension (e.g. sub-bass response down to 40–55 Hz).
* **Audio-to-Visual Latency**: End-to-end delay between ambient sound production, microphone capture, FFT bin calculation, and canvas frame presentation.

### 5. Ambient Immersion

* **Perimeter Lighting**: Integrated bias lighting (e.g., 3-sided Philips Ambilight) reacting to edge canvas colors or music modes.

---

## Hardware Profile Registry Architecture

To prevent scattered device checks across rendering loops and audio controllers, the application utilizes a declarative **Hardware Profile Registry** (`HARDWARE_PROFILES` in `src/js/app.js`).

### Active Profiles

| Profile ID | Target Environment | `maxDpr` | `particleBudget` | Audio Constraints | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `philips-oled` | Philips 77OLED809 / TP Vision OLED | `1.0` | `0.50` | Raw (AEC/AGC off) | Prevents 4K fillrate saturation, preserves HDMI eARC |
| `android-tv` | Generic Android TV / Google TV | `1.0` | `0.55` | Raw (AEC/AGC off) | 1080p canvas buffer, stable 60/120Hz frame pacing |
| `default` | Desktop Browsers & High-End Mobile | `2.5` | `0.70` | Raw (AEC/AGC off) | Uncapped high-DPI rendering |

### How Hardware Profiles Are Resolved

`HardwareProfile.resolve()` evaluates hardware in priority order:

1. **URL Query Override**: Developers can force any profile or DPR during browser testing:
   * `https://localhost:8000/?profile=philips-oled`
   * `https://localhost:8000/?profile=android-tv&dpr=1.0`
2. **Native Android Bridge (`window.DeviceProfile`)**: Populated by `MainActivity.kt` using `FEATURE_LEANBACK`, `UI_MODE_TYPE_TELEVISION`, `Build.MANUFACTURER`, and `Build.MODEL`.
3. **User-Agent & Environment Heuristics**: Fallback detection for TV browsers or sideloaded web runtimes (`/\bTV\b|GoogleTV|Android TV|SmartTV/i`).
4. **Default Profile**: Standard desktop and mobile settings.

### Adding a Future Hardware Profile

To onboard a new device (e.g., Raspberry Pi, Meta Quest, or low-power tablet):

1. **Add the profile definition to `HARDWARE_PROFILES` in `src/js/app.js`**:

   ```javascript
   "meta-quest": {
     id: "meta-quest",
     name: "Meta Quest VR Browser",
     maxDpr: 1.25,
     particleBudget: 0.60,
     audioConstraints: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
   }
   ```

2. **Add matching heuristic to `HardwareProfile.resolve()`**:

   ```javascript
   if (/OculusBrowser|Quest/i.test(navigator.userAgent)) {
     return Object.assign({}, HARDWARE_PROFILES["meta-quest"], { source: "ua-heuristic" });
   }
   ```

3. *(Optional)* If the device runs through a native Android wrapper, update `suggestedProfile` in `MainActivity.kt`.
