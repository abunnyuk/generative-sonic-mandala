'use strict';

// ============================================================
// THEME MANAGEMENT
// ============================================================
const THEME_STORAGE_KEY = "mandala_theme";
const THEMES = ["system", "light", "dark"];
let currentThemeMode = localStorage.getItem(THEME_STORAGE_KEY) || "dark";

const THEME_ICONS = {
  system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  light: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  dark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}

function applyTheme(mode) {
  currentThemeMode = mode;
  localStorage.setItem(THEME_STORAGE_KEY, mode);

  const effective = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.setAttribute("data-theme", effective);
  document.documentElement.setAttribute("data-theme-setting", mode);
  if (document.body) {
    document.body.classList.toggle("dark-mode", effective === "dark");
    document.body.classList.toggle("light-mode", effective === "light");
  }

  const themeBtn = document.getElementById("themeBtn");
  const iconEl = document.getElementById("themeIcon");
  const labelEl = document.getElementById("themeLabel");

  if (iconEl) iconEl.innerHTML = THEME_ICONS[mode] || THEME_ICONS.system;
  if (labelEl) labelEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  if (themeBtn) {
    const nextMode = THEMES[(THEMES.indexOf(mode) + 1) % THEMES.length];
    const nextTitle = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
    const curTitle = mode.charAt(0).toUpperCase() + mode.slice(1);
    themeBtn.setAttribute("title", `Theme: ${curTitle} (click to switch to ${nextTitle})`);
    themeBtn.setAttribute("aria-label", `Theme: ${mode}. Click to cycle to ${nextTitle}.`);
  }

  // A3/A4 FIX: notify renderer to invalidate its theme-dependent caches
  MandalaRenderer.onThemeChanged();
}

function cycleTheme() {
  applyTheme(THEMES[(THEMES.indexOf(currentThemeMode) + 1) % THEMES.length]);
}

// Listen for OS-level theme change
const sysThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
if (sysThemeQuery.addEventListener) {
  sysThemeQuery.addEventListener("change", () => {
    if (currentThemeMode === "system") applyTheme("system");
  });
} else if (sysThemeQuery.addListener) {
  // Safari < 14 fallback
  sysThemeQuery.addListener(() => {
    if (currentThemeMode === "system") applyTheme("system");
  });
}

function getCssVar(name) {
  if (!name) return "";
  const clean = name.replace(/^var\(/, "").replace(/\)$/, "").trim();
  return getComputedStyle(document.documentElement)
    .getPropertyValue(clean.startsWith("--") ? clean : "--" + clean)
    .trim();
}

// ============================================================
// HARDWARE PROFILE REGISTRY
// Declarative configuration for hardware-specific constraints:
// - maxDpr: caps backing canvas resolution (prevents 4K fill-rate saturation on TV SoCs)
// - particleBudget: scales particle count to hit 120Hz/60Hz frame budgets
// - audioConstraints: raw audio capture parameters avoiding VoIP AEC/AGC rerouting
// ============================================================
const HARDWARE_PROFILES = {
  "philips-oled": {
    id: "philips-oled",
    name: "Philips 77OLED809 / TP Vision OLED",
    maxDpr: 1.0,              // 1080p canvas buffer prevents Mali-G57 MC2 fillrate saturation
    particleBudget: 0.50,     // 50% particles to reliably hit 8.33ms (120Hz) frame deadline
    audioConstraints: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    trueBlackRequired: true,
  },
  "android-tv": {
    id: "android-tv",
    name: "Generic Android TV / Google TV",
    maxDpr: 1.0,
    particleBudget: 0.55,
    audioConstraints: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    trueBlackRequired: false,
  },
  "default": {
    id: "default",
    name: "Standard Desktop & High-End Mobile",
    maxDpr: 2.5,
    particleBudget: 0.70,
    audioConstraints: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    trueBlackRequired: false,
  },
};

const HardwareProfile = (() => {
  function _resolve() {
    // 1. URL parameter override: ?profile=<id> or ?dpr=<number>
    try {
      const params = new URLSearchParams(window.location.search);
      const forcedProfile = params.get("profile");
      if (forcedProfile && HARDWARE_PROFILES[forcedProfile]) {
        const p = Object.assign({}, HARDWARE_PROFILES[forcedProfile]);
        const forcedDpr = parseFloat(params.get("dpr"));
        if (!isNaN(forcedDpr) && forcedDpr > 0) p.maxDpr = forcedDpr;
        return p;
      }
    } catch (_) { /* ignore query parsing */ }

    // 2. Native Android DeviceBridge via window.DeviceProfile
    if (typeof window.DeviceProfile !== "undefined") {
      try {
        const suggested = window.DeviceProfile.getSuggestedProfile();
        if (suggested && HARDWARE_PROFILES[suggested]) {
          return Object.assign({}, HARDWARE_PROFILES[suggested], {
            source: "native-bridge",
            manufacturer: window.DeviceProfile.getManufacturer(),
            model: window.DeviceProfile.getModel(),
            isTv: window.DeviceProfile.isTv(),
          });
        }
        if (window.DeviceProfile.isTv()) {
          return Object.assign({}, HARDWARE_PROFILES["android-tv"], {
            source: "native-bridge",
            isTv: true,
          });
        }
      } catch (_) { /* ignore bridge errors */ }
    }

    // 3. User-Agent & Environment Heuristics (for TV browsers / sideloaded web)
    const ua = navigator.userAgent || "";
    const isTvUa = /\bTV\b|GoogleTV|Android TV|SmartTV/i.test(ua);
    const isPhilips = /Philips|TPVision|TPV/i.test(ua);
    const isOled = /OLED/i.test(ua);

    if (isPhilips && isOled) {
      return Object.assign({}, HARDWARE_PROFILES["philips-oled"], { source: "ua-heuristic", isTv: true });
    }
    if (isTvUa) {
      return Object.assign({}, HARDWARE_PROFILES["android-tv"], { source: "ua-heuristic", isTv: true });
    }

    return Object.assign({}, HARDWARE_PROFILES["default"], { source: "default", isTv: false });
  }

  const current = _resolve();

  return {
    get current() { return current; },
    get isTv() { return !!current.isTv || current.id === "philips-oled" || current.id === "android-tv"; },
  };
})();

// ============================================================
// FREQUENCY BAND DATA
// ============================================================
const FREQUENCY_BANDS = [
  { id: "metal", name: "Progressive Metal", baseFrequency: 432, polyrhythmRatio: 7 / 8, harmonics: 12, hueRange: [260, 290], particleCount: 350, waveForm: "logarithmic_spiral", energy: 0.88, ratioText: "7/8" },
  { id: "rock", name: "Alternative & Heavy Rock", baseFrequency: 220, polyrhythmRatio: 4 / 4, harmonics: 8, hueRange: [10, 35], particleCount: 260, waveForm: "sawtooth_crest", energy: 0.82, ratioText: "4/4" },
  { id: "pop", name: "Kinetic Pop", baseFrequency: 880, polyrhythmRatio: 3 / 4, harmonics: 16, hueRange: [320, 350], particleCount: 420, waveForm: "prismatic_sine", energy: 0.95, ratioText: "3/4" },
  { id: "sub", name: "Sub-Bass & Low-End", baseFrequency: 55, polyrhythmRatio: 1 / 1, harmonics: 4, hueRange: [175, 210], particleCount: 180, waveForm: "sub_resonance", energy: 0.74, ratioText: "1/1" },
  { id: "ambient", name: "Ambient Soundscape", baseFrequency: 110, polyrhythmRatio: 2 / 4, harmonics: 6, hueRange: [200, 240], particleCount: 200, waveForm: "sub_resonance", energy: 0.40, ratioText: "2/4" },
  { id: "synth", name: "Synthwave", baseFrequency: 330, polyrhythmRatio: 4 / 4, harmonics: 14, hueRange: [290, 320], particleCount: 300, waveForm: "sawtooth_crest", energy: 0.85, ratioText: "4/4" },
  { id: "dnb", name: "Drum & Bass", baseFrequency: 175, polyrhythmRatio: 5 / 4, harmonics: 24, hueRange: [40, 70], particleCount: 450, waveForm: "prismatic_sine", energy: 1.00, ratioText: "5/4" },
];

const state = {
  genre: "all",
  complexity: 12,
  resonance: 45,
  autoPulse: 0,   // 0 = off … 10 = fastest autonomous impulse generator
  shockwaves: false, // false by default = smooth look (no concentric shockwave rings)
};

const AUTO_PULSE_STORAGE_KEY = "mandala_auto_pulse";
const SHOCKWAVES_STORAGE_KEY = "mandala_shockwaves";
(function restoreSettings() {
  try {
    const v = parseInt(localStorage.getItem(AUTO_PULSE_STORAGE_KEY), 10);
    if (v >= 0 && v <= 10) state.autoPulse = v;
    const r = localStorage.getItem(SHOCKWAVES_STORAGE_KEY);
    if (r !== null) state.shockwaves = r === "true";
  } catch (_) { /* storage unavailable */ }
})();

// ============================================================
// AUTO PULSE
// Autonomous "virtual pointer" that glides along a random, smooth
// curved path across the whole mandala (rim included) and emits acoustic impulses at organic,
// slightly randomised intervals. Level 0 = off, 10 = fastest.
// Effects only: nothing is drawn for the pointer itself.
// ============================================================
const AutoPulse = (() => {
  const pos = { x: 0, y: 0, active: false };
  let _countdown = 0;  // ms until next impulse
  let _wasOn = false;
  let _u = 0;          // progress along the current spline segment (0..1)
  let _pts = [];       // 4 control points (normalised, unit disc) for Catmull-Rom
  let _n = 0;          // waypoints generated so far

  // Pause & gradual ramp-up after a Mega Impulse
  // Gives 3.5s of calm stillness to enjoy the mega ripple expanding,
  // followed by a 4.5s smooth ease back up to full configured speed & rate.
  const MEGA_COOLDOWN_PAUSE_MS = 3500;
  const MEGA_COOLDOWN_RAMP_MS = 4500;
  let _cooldownTimer = 0; // ms remaining in total cooldown (pause + ramp)

  function onMegaImpulse() {
    _cooldownTimer = MEGA_COOLDOWN_PAUSE_MS + MEGA_COOLDOWN_RAMP_MS;
    // Push next regular impulse countdown back so it doesn't fire during the quiet pause
    _countdown = Math.max(_countdown, MEGA_COOLDOWN_PAUSE_MS + 1000);
  }

  // L1 ≈ 6 s, L5 ≈ 1.6 s, L10 ≈ 0.6 s
  function _interval(level) { return 6000 * Math.pow(0.72, level - 1); }
  function _nextDelay(level) { return _interval(level) * (1 + (Math.random() * 2 - 1) * 0.3); }

  // Random waypoint in the unit disc. Every other point is pushed out to the
  // rim so the path regularly reaches the outer edge of the mandala; the rest
  // are scattered anywhere (area-uniform) so it also crosses the interior.
  function _waypoint() {
    const edge = (_n++ % 2) === 0;
    const r = edge ? 0.85 + Math.random() * 0.15 : Math.sqrt(Math.random()) * 0.9;
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  function _catmull(p0, p1, p2, p3, u) {
    const u2 = u * u, u3 = u2 * u;
    const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
    return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
  }

  // dt in ms. Returns the virtual pointer ({x,y,active}); fires impulses via `fire`.
  function update(dt, cx, cy, maxR, motionScale, suppressed, fire) {
    const level = state.autoPulse;
    if (level <= 0) { _wasOn = false; pos.active = false; return pos; }

    // Factor in post-Mega Impulse stillness & gradual ramp-up
    let rampFactor = 1.0;
    if (_cooldownTimer > 0) {
      _cooldownTimer = Math.max(0, _cooldownTimer - dt);
      if (_cooldownTimer > MEGA_COOLDOWN_RAMP_MS) {
        // Still in stillness pause phase
        rampFactor = 0;
      } else {
        // In gradual ramp-up phase (0 -> 1)
        const progress = 1 - (_cooldownTimer / MEGA_COOLDOWN_RAMP_MS);
        // Smooth cubic ease-in-out
        rampFactor = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      }
    }

    const effectiveLevel = level * rampFactor;
    const k = effectiveLevel / 10;
    const sec = dt / 1000;
    const ms = Math.max(motionScale, 0.15);

    if (_pts.length === 0) { for (let i = 0; i < 4; i++) _pts.push(_waypoint()); }

    // Travel speed in unit-disc radii per second; halts/creeps during cooldown then eases up
    const speed = (0.18 + 0.55 * k) * ms * (0.1 + 0.9 * rampFactor);
    const segLen = Math.max(0.3, Math.hypot(_pts[2].x - _pts[1].x, _pts[2].y - _pts[1].y));
    _u += (speed * sec) / segLen;
    while (_u >= 1) { _u -= 1; _pts.shift(); _pts.push(_waypoint()); }

    const c = _catmull(_pts[0], _pts[1], _pts[2], _pts[3], _u);
    const tx = cx + c.x * maxR;
    const ty = cy + c.y * maxR;

    if (!_wasOn) {                       // start on the path, no jump
      pos.x = tx; pos.y = ty;
      _countdown = _nextDelay(level);
      _wasOn = true;
    } else {
      const f = 1 - Math.exp(-dt / 80);  // light smoothing
      pos.x += (tx - pos.x) * f;
      pos.y += (ty - pos.y) * f;
    }
    pos.active = true;

    // In stillness pause, suppress impulses and countdown decrements
    const inPause = _cooldownTimer > MEGA_COOLDOWN_RAMP_MS;
    if (!suppressed && !inPause) {
      _countdown -= dt * Math.max(0.2, rampFactor);
      if (_countdown <= 0) {
        fire(pos.x, pos.y, {
          energy: (0.5 + 0.5 * k) * (0.85 + Math.random() * 0.3),
          speed: 5 + 3 * k,
        });
        _countdown = _nextDelay(Math.max(1, Math.round(effectiveLevel)));   // at most one impulse per frame
      }
    }
    return pos;
  }

  return { update, pos, onMegaImpulse };
})();

// ============================================================
// AUDIO ENGINE
// B1: Stream tracks stopped on disable (OS mic indicator cleared)
// B2: _enabling guard against rapid double-click
// B3: 'interrupted' state handled (Safari)
// B4: suspend/resume called from visibility handler
// B5: Distinct error messages per rejection type
// ============================================================
const AudioEngine = (() => {
  let _ctx = null;
  let _analyser = null;
  let _data = null;   // Uint8Array, reused each frame
  let _stream = null;
  let _active = false;
  let _enabling = false;

  function getFrequencyEnergy(targetHz) {
    if (!_active || !_analyser || !_data || !_ctx) return 0;
    const nyquist = _ctx.sampleRate / 2;
    const binIndex = Math.min(
      _data.length - 1,
      Math.max(0, Math.round((targetHz / nyquist) * _data.length))
    );
    const prev = _data[Math.max(0, binIndex - 1)] || 0;
    const curr = _data[binIndex] || 0;
    const next = _data[Math.min(_data.length - 1, binIndex + 1)] || 0;
    return (prev + curr + next) / (3 * 255);
  }

  /** Called once per rAF to pull the latest FFT snapshot into _data. */
  function poll() {
    if (_active && _analyser && _data) {
      _analyser.getByteFrequencyData(_data);
    }
  }

  async function _enable() {
    if (_enabling) return;   // B2: guard
    _enabling = true;
    const btn = document.getElementById("audioBtn");
    try {
      const audioConstraints = HardwareProfile.current.audioConstraints || {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };
      _stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
      _ctx = new (window.AudioContext || window.webkitAudioContext)();

      // B3: resume covers both 'suspended' (Chrome autoplay policy) and
      //     'interrupted' (Safari when another app had audio focus)
      if (_ctx.state === "suspended" || _ctx.state === "interrupted") {
        await _ctx.resume();
      }

      const source = _ctx.createMediaStreamSource(_stream);
      _analyser = _ctx.createAnalyser();
      _analyser.fftSize = 512;
      _analyser.smoothingTimeConstant = 0.8;
      source.connect(_analyser);
      _data = new Uint8Array(_analyser.frequencyBinCount);
      _active = true;

      if (btn) {
        btn.textContent = "Mic Active";
        btn.style.color = "#00f5d4";
        btn.style.borderColor = "#00f5d4";
      }
    } catch (err) {
      console.error("Microphone error:", err);
      // B5: distinguish permission denied vs hardware not found vs other
      const msg =
        err.name === "NotAllowedError" ? "Permission Denied" :
          err.name === "NotFoundError" ? "No Mic Found" :
            err.name === "NotReadableError" ? "Mic In Use" : "Mic Error";
      if (btn) {
        btn.textContent = msg;
        btn.style.color = "";
        btn.style.borderColor = "";
      }
    } finally {
      _enabling = false;
    }
  }

  async function _disable() {
    _active = false;
    // B1: stop all mic tracks so the OS-level recording indicator clears
    if (_stream) {
      _stream.getTracks().forEach(t => t.stop());
      _stream = null;
    }
    if (_ctx && _ctx.state !== "closed") {
      await _ctx.close();
    }
    _ctx = null;
    _analyser = null;
    _data = null;

    const btn = document.getElementById("audioBtn");
    if (btn) {
      btn.textContent = "Enable Mic";
      btn.style.color = "";
      btn.style.borderColor = "";
    }
  }

  async function toggle() {
    if (_active) await _disable();
    else await _enable();
  }

  /** B4: Suspend context when tab goes hidden; called from visibilitychange. */
  async function suspend() {
    if (_ctx && _ctx.state === "running") {
      try { await _ctx.suspend(); } catch (_) { /* ignore */ }
    }
  }

  /** B4: Resume context when tab becomes visible again. */
  async function resume() {
    if (_ctx && (_ctx.state === "suspended" || _ctx.state === "interrupted")) {
      try { await _ctx.resume(); } catch (_) { /* ignore */ }
    }
  }

  return {
    get isActive() { return _active; },
    getFrequencyEnergy,
    poll,
    toggle,
    suspend,
    resume,
  };
})();

// ============================================================
// MANDALA RENDERER
// A1: Background gradient cached; invalidated on resize or theme change
// A2: activeBands computed once per frame (not inside inner loops)
// A3: _isLight flag cached, not read from DOM every frame
// A4: --surface-dim CSS var cached, not queried every frame
// A5: Per-band energy map built once per frame, used by both ring & particle loops
// A6: rAF stopped/started via visibilitychange
// A7: Squared-distance used before sqrt in burst scatter
// A8: Particle fillStyle uses pre-built prefix string; only lum+alpha vary per frame
// C3: ResizeObserver captures dimensions; avoids per-frame forced reflow
// C9: motionScale from CSS var / matchMedia, applied to phase increment & particle speed
// C12: Delta-time normalised to 60fps baseline; correct on 120/144 Hz screens
// C13: DPR change listener re-registered after each monitor switch
// ============================================================
const MandalaRenderer = (() => {
  let _canvas = null;
  let _ctx = null;
  let _rafId = null;

  let _particles = [];
  let _impulses = [];
  let _phase = 0;
  let _lastTs = 0;
  let _paused = false;

  // Mega impulse: rare, randomised acoustic ripple triggered when Auto Pulse > 0.
  // Delay is uniform in [15 s, 5 min] skewed toward longer waits (r²) so it
  // stays a surprise rather than a pattern: median ≈ 1 min 10 s.
  const MEGA_MIN_MS = 15000, MEGA_MAX_MS = 300000;
  function _nextMegaDelay() {
    const r = Math.random();
    return MEGA_MIN_MS + r * r * (MEGA_MAX_MS - MEGA_MIN_MS);
  }
  let _megaCountdown = _nextMegaDelay();

  // C3: Layout dimensions kept up-to-date by ResizeObserver
  let _vW = 600, _vH = 380;
  let _dpr = window.devicePixelRatio || 1;

  // A3/A4: Theme-derived rendering values — updated in onThemeChanged()
  let _isLight = false;
  let _bgColor = "#000000";

  // A1: Background gradient cache
  let _bgGrad = null;
  let _bgGradKey = "";
  let _gradDirty = true;   // set true whenever center/size/theme changes

  // C9: Reduced-motion support
  const _motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let _motionScale = _motionMQ.matches ? 0.15 : 1.0;
  _motionMQ.addEventListener("change", e => { _motionScale = e.matches ? 0.15 : 1.0; });

  // ── DPR change listener (C13) ──────────────────────────────
  function _watchDPR() {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener("change", () => {
      _resizeCanvas();
      _watchDPR();   // re-register for the next monitor move
    }, { once: true });
  }

  function _resizeCanvas() {
    if (!_canvas) return;
    const maxDpr = HardwareProfile.current.maxDpr || 2.5;
    _dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const newW = Math.floor(_vW * _dpr);
    const newH = Math.floor(_vH * _dpr);
    if (_canvas.width !== newW || _canvas.height !== newH) {
      _canvas.width = newW;
      _canvas.height = newH;
      _gradDirty = true;
    }
    _ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
  }

  // A3/A4: Called by applyTheme() whenever the colour scheme changes
  function onThemeChanged() {
    if (!_canvas) return;   // not yet initialised — safe to skip
    _isLight = document.documentElement.getAttribute("data-theme") === "light";
    // Dark mode is always true black so OLED subpixels switch fully off.
    _bgColor = _isLight ? (getCssVar("--surface-dim") || "#ffffff") : "#000000";
    _gradDirty = true;
  }

  // A1: Builds and caches the background gradient; returns the cached copy on stable frames
  function _getBgGrad(cx, cy, maxR) {
    const key = `${cx | 0},${cy | 0},${maxR | 0},${_isLight}`;
    if (!_gradDirty && _bgGrad && _bgGradKey === key) return _bgGrad;

    _bgGrad = _ctx.createRadialGradient(cx, cy, 5, cx, cy, maxR * 1.2);
    if (_isLight) {
      _bgGrad.addColorStop(0, "rgba(49, 134, 255, 0.05)");
      _bgGrad.addColorStop(0.6, "rgba(220, 225, 235, 0.12)");
      _bgGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    } else {
      // Dark: no ambient glow (see _renderFrame) — untouched pixels stay #000.
      _bgGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      _bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    }
    _bgGradKey = key;
    _gradDirty = false;
    return _bgGrad;
  }

  function _initParticles() {
    _particles = [];
    const totalBands = FREQUENCY_BANDS.length;
    const bandStep = totalBands > 1 ? 0.72 / (totalBands - 1) : 0;
    const budget = HardwareProfile.current.particleBudget || 0.7;

    FREQUENCY_BANDS.forEach((band, bandIdx) => {
      const count = Math.floor(band.particleCount * budget);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const baseTier = 0.2 + bandIdx * bandStep;
        const normDist = baseTier + (Math.random() - 0.5) * (bandStep * 0.35);
        const hue = band.hueRange[0] + Math.random() * (band.hueRange[1] - band.hueRange[0]);
        const sat = 85 + Math.random() * 15;
        const lum = 55 + Math.random() * 25;
        const alpha = 0.4 + Math.random() * 0.5;

        // A8: Pre-build static theme fill strings to eliminate runtime string allocation & GC hitches
        const fillDark = `hsla(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${lum.toFixed(1)}%, ${alpha.toFixed(2)})`;
        const lightLum = Math.max(28, lum * 0.5);
        const lightAlpha = Math.min(0.9, alpha * 1.15);
        const fillLight = `hsla(${hue.toFixed(1)}, ${sat.toFixed(1)}%, ${lightLum.toFixed(1)}%, ${lightAlpha.toFixed(2)})`;

        _particles.push({
          bandId: band.id,
          bandIdx: bandIdx,
          angle: angle,
          baseNormDist: normDist,
          currentNormDist: normDist,
          speed: (0.002 + Math.random() * 0.004) * (bandIdx % 2 === 0 ? 1 : -1) * band.polyrhythmRatio,
          size: 1.2 + Math.random() * 1.8 * band.energy,
          hue: hue,
          sat: sat,
          lum: lum,
          alpha: alpha,
          seed: Math.random() * 1000,
          burstVelocity: 0,
          burstAngle: 0,
          fillStyleDark: fillDark,
          fillStyleLight: fillLight,
        });
      }
    });
  }

  // Called by InteractionCtrl on tap/click
  function triggerImpulse(cx, cy, opts) {
    if (_impulses.length >= 8) _impulses.shift();   // cap for low-end GPUs (TV)
    _impulses.push({
      x: cx, y: cy,
      radius: 0,
      maxRadius: Math.max(_canvas.width, _canvas.height) * 0.8,
      speed: (opts && opts.speed) || 7,
      energy: (opts && opts.energy) || 1.0,
      decay: (opts && opts.decay) || 0.95,   // per-frame energy falloff
      width: (opts && opts.width) || 2,      // base stroke width
    });

    if (opts && opts.mega) {
      // Mega impulse: shove every particle outward from the impact point
      const mcx = _vW / 2, mcy = _vH / 2;
      const mR = Math.min(_vW, _vH) * 0.45;
      _particles.forEach(p => {
        const px = mcx + Math.cos(p.angle) * p.currentNormDist * mR;
        const py = mcy + Math.sin(p.angle) * p.currentNormDist * mR;
        p.burstVelocity = 10 * (0.8 + Math.random() * 0.4);
        p.burstAngle = Math.atan2(py - cy, px - cx);
      });
      return;
    }

    const centerX = _vW / 2;
    const centerY = _vH / 2;
    const maxR = Math.min(_vW, _vH) * 0.45;

    _particles.forEach(p => {
      const px = centerX + Math.cos(p.angle) * p.currentNormDist * maxR;
      const py = centerY + Math.sin(p.angle) * p.currentNormDist * maxR;
      const dx = px - cx;
      const dy = py - cy;
      // A7: Compare squared distances before committing to sqrt
      const distSq = dx * dx + dy * dy;
      if (distSq < 120 * 120) {
        const dist = Math.sqrt(distSq);
        p.burstVelocity = (120 - dist) * 0.12 * (0.8 + Math.random() * 0.4);
        p.burstAngle = Math.atan2(dy, dx);
      }
    });
  }

  function triggerMegaImpulse(cx, cy) {
    const x = cx !== undefined ? cx : _vW / 2;
    const y = cy !== undefined ? cy : _vH / 2;
    triggerImpulse(x, y, {
      mega: true,
      energy: 1.0,
      speed: Math.max(_vW, _vH) / 180,   // ≈ 3 s to cross the screen
      decay: 0.988,
      width: 7,
    });
    AutoPulse.onMegaImpulse();
  }

  // ── Main render loop ──────────────────────────────────────
  function _renderFrame(ts) {
    if (!_canvas || !_ctx) return;

    // C12: Delta-time, normalised to 60fps (dt60 = 1.0 at exactly 60fps)
    const dt = _lastTs === 0 ? 16.667 : Math.min(ts - _lastTs, 50);
    _lastTs = ts;
    const dt60 = dt / (1000 / 60);

    const w = _vW, h = _vH;
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.42;

    // Mega impulse timer: active only when Auto Pulse > 0 and not paused
    if (!_paused && state.autoPulse > 0) {
      _megaCountdown -= dt;
      if (_megaCountdown <= 0) {
        triggerMegaImpulse(centerX, centerY);
        _megaCountdown = _nextMegaDelay();
      }
    }

    // Guard: skip frame if canvas has zero area
    if (w < 1 || h < 1) {
      _rafId = requestAnimationFrame(_renderFrame);
      return;
    }

    // Paused (media key / button): freeze the last frame, keep the loop alive.
    if (_paused) {
      _rafId = requestAnimationFrame(_renderFrame);
      return;
    }

    // ── Clear ── (opaque #000 in dark mode; nothing is drawn over untouched areas)
    _ctx.globalCompositeOperation = "source-over";
    _ctx.fillStyle = _bgColor;
    _ctx.fillRect(0, 0, w, h);

    // A1: Use cached background gradient — light theme only; dark stays pure black
    if (_isLight) {
      _ctx.fillStyle = _getBgGrad(centerX, centerY, maxRadius);
      _ctx.fillRect(0, 0, w, h);
    }

    // C12: Phase advances proportional to elapsed time, modulated by C9 motion scale
    _phase += 0.015 * dt60 * _motionScale;

    // A5: Poll audio FFT once per frame, then build per-band energy map
    AudioEngine.poll();

    // A2: Compute activeBands once (not inside any loop)
    const activeBands = state.genre === "all"
      ? FREQUENCY_BANDS
      : FREQUENCY_BANDS.filter(b => b.id === state.genre);
    const totalActive = activeBands.length;
    const bandStep = totalActive > 1 ? 0.72 / (totalActive - 1) : 0;

    // A5: One energy lookup per band, results shared by waveform + particle loops
    const energyMap = {};
    activeBands.forEach(b => {
      energyMap[b.id] = AudioEngine.getFrequencyEnergy(b.baseFrequency);
    });

    const realPos = InteractionCtrl.mousePos;
    // Autonomous pointer yields to real input (active hover or recent touch/click).
    // Stationary hover on the canvas times out after 3s of inactivity, allowing
    // Auto Pulse to smoothly engage when the user goes idle and menus fade off.
    const isRecentInput = InteractionCtrl.isDown || (performance.now() - InteractionCtrl.lastInputTs < 3000);
    const realActive = realPos.active && isRecentInput;
    const userBusy = isRecentInput;
    const virtPos = AutoPulse.update(dt, centerX, centerY, maxRadius, _motionScale, userBusy, triggerImpulse);
    const mousePos = realActive ? realPos : virtPos;
    const complexity = state.complexity;
    const resNorm = state.resonance / 100;
    const isAudio = AudioEngine.isActive;

    _ctx.globalCompositeOperation = _isLight ? "multiply" : "screen";

    let hoverTagText = "";
    let closestDist = Infinity;

    // ── 1. Waveforms & Radial Rings ──────────────────────────
    activeBands.forEach((band, idx) => {
      const bandRadius = totalActive === 1
        ? maxRadius * 0.55
        : maxRadius * (0.2 + idx * bandStep);

      const liveEnergy = energyMap[band.id];
      const effectiveEnergy = isAudio ? liveEnergy * 2.2 : band.energy;

      _ctx.beginPath();
      const points = 180;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        let rOffset = 0;

        if (band.waveForm === "logarithmic_spiral") {
          rOffset = Math.sin(theta * band.harmonics + _phase * band.polyrhythmRatio) * 6 * effectiveEnergy;
        } else if (band.waveForm === "sawtooth_crest") {
          const mod = ((theta * band.harmonics) / (Math.PI * 2)) % 1;
          rOffset = (mod - 0.5) * 12 * effectiveEnergy;
        } else if (band.waveForm === "prismatic_sine") {
          rOffset = (Math.sin(theta * complexity) + Math.cos(theta * band.harmonics * 0.5)) * 5 * effectiveEnergy;
        } else if (band.waveForm === "sub_resonance") {
          rOffset = Math.sin(theta * 2 + _phase * 0.5) * 10 * effectiveEnergy;
        }

        const turb = Math.sin(theta * 18 + _phase * 3 + band.baseFrequency)
          * resNorm * 8
          * (isAudio ? 0.6 + liveEnergy * 1.2 : 1.0);
        let r = bandRadius + rOffset + turb;

        let px = centerX + Math.cos(theta) * r;
        let py = centerY + Math.sin(theta) * r;

        if (mousePos.active) {
          const dx = mousePos.x - px;
          const dy = mousePos.y - py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            const pull = (1 - d / 110) * 22;
            px += (dx / d) * pull;
            py += (dy / d) * pull;
            if (d < closestDist) {
              closestDist = d;
              hoverTagText = `${band.name} \u2022 ${band.baseFrequency}\u202fHz [${band.ratioText}]`;
            }
          }
        }

        if (i === 0) _ctx.moveTo(px, py);
        else _ctx.lineTo(px, py);
      }
      _ctx.closePath();

      const baseHue = (band.hueRange[0] + band.hueRange[1]) / 2;
      _ctx.strokeStyle = _isLight
        ? `hsla(${baseHue}, 85%, 45%, ${0.45 * effectiveEnergy})`
        : `hsla(${baseHue}, 80%, 65%, ${0.35 * effectiveEnergy})`;
      _ctx.lineWidth = 1.2 + effectiveEnergy * 1.5;
      _ctx.stroke();

      const nodeCount = Math.min(complexity, band.harmonics);
      for (let n = 0; n < nodeCount; n++) {
        const nodeAngle = (n / nodeCount) * Math.PI * 2 + _phase * band.polyrhythmRatio * 0.2;
        const nx = centerX + Math.cos(nodeAngle) * bandRadius;
        const ny = centerY + Math.sin(nodeAngle) * bandRadius;
        _ctx.beginPath();
        _ctx.arc(nx, ny, 2.5 * effectiveEnergy, 0, Math.PI * 2);
        _ctx.fillStyle = _isLight
          ? `hsla(${baseHue}, 90%, 35%, 0.85)`
          : `hsla(${baseHue}, 90%, 75%, 0.8)`;
        _ctx.fill();
      }
    });

    // ── 2. Particles ─────────────────────────────────────────
    _particles.forEach(p => {
      if (state.genre !== "all" && p.bandId !== state.genre) return;

      const band = FREQUENCY_BANDS[p.bandIdx];
      // A5: Energy already computed — no extra getFrequencyEnergy call per particle
      const liveAudio = isAudio ? (energyMap[band.id] || 0) : 0;

      const effectiveDist = totalActive === 1
        ? 0.55 + (p.baseNormDist - 0.55) * 0.4
        : p.currentNormDist;

      // Smooth, organic return physics:
      // When burstVelocity is high, push outward and decay smoothly.
      // When settling back toward base orbit, ease in with a gentle spring damping
      // instead of an abrupt linear snap.
      if (p.burstVelocity > 0.05) {
        p.currentNormDist += p.burstVelocity * 0.002 * dt60;
        p.burstVelocity *= Math.pow(0.93, dt60);
      }
      // Continuous gentle ease back to base radius
      const distDelta = p.baseNormDist - p.currentNormDist;
      p.currentNormDist += distDelta * (1 - Math.pow(0.975, dt60));

      const audioOffset = liveAudio * 0.04 * band.energy;
      const wobble = Math.sin(_phase * 2 + p.seed) * 0.015 * resNorm;
      const r = maxRadius * (effectiveDist + wobble + audioOffset);

      let px = centerX + Math.cos(p.angle) * r;
      let py = centerY + Math.sin(p.angle) * r;

      if (mousePos.active) {
        const dx = mousePos.x - px;
        const dy = mousePos.y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) {
          const factor = (1 - d / 90) * 16;
          px += (dx / d) * factor;
          py += (dy / d) * factor;
        }
      }

      const speedMul = isAudio ? 0.2 + liveAudio * 4.0 : 1.0;
      // C12/C9: particle angle advance is time-normalised and motion-scaled
      p.angle += p.speed * (1 + resNorm * 0.5) * speedMul * dt60 * _motionScale;

      const dynamicSize = isAudio ? p.size * (0.4 + liveAudio * 2.5) : p.size;

      _ctx.beginPath();
      _ctx.arc(px, py, dynamicSize, 0, Math.PI * 2);

      // A8: Static precomputed theme fill style eliminates GC allocations per frame
      _ctx.fillStyle = _isLight ? p.fillStyleLight : p.fillStyleDark;
      _ctx.fill();
    });

    // ── 3. Acoustic Impulse Ripples ──────────────────────────
    if (state.shockwaves) {
      for (let i = _impulses.length - 1; i >= 0; i--) {
        const imp = _impulses[i];
        // C12: ripple speed is time-normalised
        imp.radius += imp.speed * dt60;
        imp.energy *= imp.decay;

        _ctx.beginPath();
        _ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
        _ctx.strokeStyle = _isLight
          ? `rgba(30, 90, 190, ${0.5 * imp.energy})`
          : `rgba(157, 210, 255, ${0.6 * imp.energy})`;
        _ctx.lineWidth = imp.width * imp.energy;
        _ctx.stroke();

        if (imp.energy < 0.02 || imp.radius > imp.maxRadius) {
          _impulses.splice(i, 1);
        }
      }
    } else if (_impulses.length > 0) {
      _impulses.length = 0;
    }

    // ── 4. Central Geometric Core ────────────────────────────
    // Note: core gradient changes every frame (driven by haloRadius + audio),
    //       so it cannot be cached — it is intentionally re-created here.
    const subBassLevel = isAudio ? AudioEngine.getFrequencyEnergy(55) : 0;
    const corePulse = (3.2 + Math.sin(_phase * 2.5) * 1.4) * (1 + subBassLevel * 2.0);
    const haloRadius = (26 + Math.sin(_phase * 1.5) * 4) * (1 + subBassLevel * 1.5);

    const coreGrad = _ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, haloRadius);
    if (_isLight) {
      coreGrad.addColorStop(0, "rgba(24, 24, 38, 0.7)");
      coreGrad.addColorStop(0.25, "rgba(90, 35, 170, 0.35)");
      coreGrad.addColorStop(0.6, "rgba(25, 90, 210, 0.15)");
      coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    } else {
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      coreGrad.addColorStop(0.25, "rgba(157, 78, 221, 0.55)");
      coreGrad.addColorStop(0.6, "rgba(49, 134, 255, 0.2)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    }
    _ctx.fillStyle = coreGrad;
    _ctx.beginPath();
    _ctx.arc(centerX, centerY, haloRadius, 0, Math.PI * 2);
    _ctx.fill();

    _ctx.fillStyle = _isLight ? "#1a1a24" : "#ffffff";
    _ctx.beginPath();
    _ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
    _ctx.fill();

    // ── 5. Restore blending; update hover tag ────────────────
    _ctx.globalCompositeOperation = "source-over";

    const tag = document.getElementById("freqTag");
    if (tag) {
      if (hoverTagText && realActive) {
        tag.textContent = hoverTagText;
        tag.style.left = `${mousePos.x}px`;
        tag.style.top = `${mousePos.y}px`;
        tag.style.opacity = "1";
      } else {
        tag.style.opacity = "0";
      }
    }

    _rafId = requestAnimationFrame(_renderFrame);
  }

  // ── Public API ────────────────────────────────────────────
  function start() {
    if (_rafId) cancelAnimationFrame(_rafId);
    _lastTs = 0;
    _rafId = requestAnimationFrame(_renderFrame);
  }

  function stop() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function init() {
    _canvas = document.getElementById("mandalaCanvas");
    if (!_canvas) return;
    // alpha:false → opaque backbuffer that starts (and clears) as pure black.
    _ctx = _canvas.getContext("2d", { alpha: false });

    // Seed theme cache before first paint
    onThemeChanged();

    // C3: ResizeObserver — dimensions captured here, never queried inside rAF
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        _vW = entry.contentRect.width || _canvas.parentElement.clientWidth || 600;
        _vH = entry.contentRect.height || _canvas.parentElement.clientHeight || 380;
      }
      _resizeCanvas();
      if (typeof InteractionCtrl !== "undefined" && InteractionCtrl.invalidateRect) {
        InteractionCtrl.invalidateRect();
      }
    });
    ro.observe(_canvas.parentElement);

    // Seed initial dimensions synchronously
    _vW = _canvas.parentElement.clientWidth || 600;
    _vH = _canvas.parentElement.clientHeight || 380;
    _resizeCanvas();

    _initParticles();
    _watchDPR();   // C13
  }

  return {
    init,
    start,
    stop,
    triggerImpulse,
    triggerMegaImpulse,
    onThemeChanged,
    setPaused(p) { _paused = !!p; _lastTs = 0; return _paused; },
    get paused() { return _paused; },
    get canvas() { return _canvas; },
  };
})();

// ============================================================
// INTERACTION CONTROLLER
// C1:  Unified Pointer Events (mouse + touch + stylus)
// C2:  getBoundingClientRect cached; invalidated on resize only
// C11: Canvas parent dimensions come from ResizeObserver cache
// ============================================================
const InteractionCtrl = (() => {
  // Shared pointer state — read by MandalaRenderer._renderFrame via closure
  const mousePos = { x: -9999, y: -9999, active: false };

  let _cachedRect = null;
  let _rectDirty = true;
  let _isDown = false;
  let _pDownMoved = false;
  let _pDownX = 0, _pDownY = 0;
  let _lastInputTs = -Infinity;   // last real pointer activity (ms, performance.now)
  let _lastTapTs = 0;             // double-click / double-tap tracking
  let _lastTapX = 0, _lastTapY = 0;

  function _getRect(canvas) {
    // C2: Re-read only when the layout has changed
    if (_rectDirty || !_cachedRect) {
      _cachedRect = canvas.getBoundingClientRect();
      _rectDirty = false;
    }
    return _cachedRect;
  }

  function _coords(e, canvas) {
    const r = _getRect(canvas);
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function init() {
    const canvas = MandalaRenderer.canvas;
    if (!canvas) return;

    // Invalidate cached rect whenever the window is resized
    // (ResizeObserver handles the canvas backing store; this covers the rect offset)
    window.addEventListener("resize", () => { _rectDirty = true; }, { passive: true });

    // ── C1: Pointer Events — covers mouse, touch, and stylus ──
    canvas.addEventListener("pointermove", e => {
      const { x, y } = _coords(e, canvas);
      mousePos.x = x;
      mousePos.y = y;
      mousePos.active = true;
      _lastInputTs = performance.now();
      // Track significant movement to distinguish tap from drag
      const dx = x - _pDownX, dy = y - _pDownY;
      if (dx * dx + dy * dy > 25) _pDownMoved = true;
    }, { passive: true });

    canvas.addEventListener("pointerleave", () => {
      _isDown = false;
      mousePos.active = false;
      const tag = document.getElementById("freqTag");
      if (tag) tag.style.opacity = "0";
    });

    canvas.addEventListener("pointerdown", e => {
      // Capture ensures pointermove/up fire even if pointer leaves canvas
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* Safari may throw */ }
      _isDown = true;
      _pDownMoved = false;
      const { x, y } = _coords(e, canvas);
      _pDownX = x; _pDownY = y;
      _lastInputTs = performance.now();
      mousePos.x = x; mousePos.y = y; mousePos.active = true;
    });

    canvas.addEventListener("pointerup", e => {
      _isDown = false;
      if (!_pDownMoved) {
        const { x, y } = _coords(e, canvas);
        const now = performance.now();
        const dtTap = now - _lastTapTs;
        const dxTap = x - _lastTapX, dyTap = y - _lastTapY;

        // Double-click/tap (< 300ms, close spatial proximity) triggers mega impulse
        if (dtTap > 0 && dtTap < 300 && (dxTap * dxTap + dyTap * dyTap < 35 * 35)) {
          MandalaRenderer.triggerMegaImpulse(x, y);
          _lastTapTs = 0; // reset so 3rd click starts fresh
        } else {
          // Single tap/click — fire regular acoustic impulse
          MandalaRenderer.triggerImpulse(x, y);
          _lastTapTs = now;
          _lastTapX = x;
          _lastTapY = y;
        }
      }
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });

    canvas.addEventListener("pointercancel", () => {
      _isDown = false;
      mousePos.active = false;
      const tag = document.getElementById("freqTag");
      if (tag) tag.style.opacity = "0";
    });

    // ── Collapsible deck ──
    const deck = document.getElementById("controlDeck");
    const deckHeader = document.getElementById("deckHeader");
    if (deck && deckHeader) {
      const toggleBtn = deckHeader.querySelector(".control-deck-toggle");
      const toggleText = document.getElementById("toggleText");
      deckHeader.addEventListener("click", () => {
        const collapsed = deck.classList.toggle("is-collapsed");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(!collapsed));
        if (toggleText) toggleText.textContent = collapsed ? "Show" : "Hide";
        _rectDirty = true;
      });
      deck.addEventListener("transitionend", () => {
        _rectDirty = true;
      });
    }

    // ── Header buttons ──
    document.getElementById("audioBtn")?.addEventListener("click", () => AudioEngine.toggle());
    document.getElementById("exportBtn")?.addEventListener("click", _exportWallpaper);
    document.getElementById("themeBtn")?.addEventListener("click", cycleTheme);

    // ── Keyboard shortcuts ──
    // Guard: do not intercept when user is typing inside a form control
    window.addEventListener("keydown", e => {
      if (!HudCtrl.isVisible) return;   // hidden HUD ⇒ no hidden option can fire
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") AudioEngine.toggle();
      if (e.key === "s" || e.key === "S") _exportWallpaper();
      if (e.key === "t" || e.key === "T") cycleTheme();
    });

    // ── C8: Sliders — update state + ARIA live attributes ──
    document.querySelectorAll(".lumi-slider").forEach(slider => {
      slider.addEventListener("input", e => {
        const key = e.target.dataset.key;
        state[key] = parseFloat(e.target.value);

        const pct = ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
        e.target.style.setProperty("--progress", pct + "%");
        e.target.setAttribute("aria-valuenow", e.target.value);

        if (key === "complexity") {
          e.target.setAttribute("aria-valuetext", `${e.target.value} harmonic steps`);
        } else if (key === "resonance") {
          e.target.setAttribute("aria-valuetext", `${e.target.value}% turbulence`);
        } else if (key === "autoPulse") {
          const v = parseInt(e.target.value, 10);
          e.target.setAttribute("aria-valuetext", v === 0 ? "Off" : `Level ${v}`);
          try { localStorage.setItem(AUTO_PULSE_STORAGE_KEY, String(v)); } catch (_) { /* ignore */ }
        }

        const badge = document.getElementById(`${e.target.id}-val`);
        if (badge) badge.textContent = key === "autoPulse" && e.target.value === "0" ? "Off" : e.target.value;
      });
    });

    // Reflect the persisted Auto Pulse level in the UI
    const autoSlider = document.getElementById("autoSlider");
    if (autoSlider) {
      autoSlider.value = state.autoPulse;
      autoSlider.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Reflect the persisted Shockwaves checkbox in the UI
    const shockwavesCheckbox = document.getElementById("shockwavesCheckbox");
    if (shockwavesCheckbox) {
      shockwavesCheckbox.checked = !!state.shockwaves;
      shockwavesCheckbox.addEventListener("change", e => {
        state.shockwaves = e.target.checked;
        try { localStorage.setItem(SHOCKWAVES_STORAGE_KEY, String(state.shockwaves)); } catch (_) { /* ignore */ }
      });
    }

    document.getElementById("genreSelect")?.addEventListener("change", e => {
      state.genre = e.target.value;
    });
  }

  return {
    init,
    mousePos,
    get lastInputTs() { return _lastInputTs; },
    get isDown() { return _isDown; },
    invalidateRect: () => { _rectDirty = true; }
  };
})();

// ============================================================
// HUD CONTROLLER — Android TV / Google TV remote, auto-hide, focus safety
// ============================================================
const HudCtrl = (() => {
  const HIDE_AFTER_MS = 4000;   // inactivity timeout
  const INITIAL_MS = 4000;   // launch discovery window

  // Android KeyEvent codes (delivered as keyCode when `key` is "Unidentified").
  const KEYCODE = {
    BACK: 4, DPAD_UP: 19, DPAD_DOWN: 20, DPAD_LEFT: 21, DPAD_RIGHT: 22, DPAD_CENTER: 23,
    MEDIA_PLAY_PAUSE: 85, MEDIA_PLAY: 126, MEDIA_PAUSE: 127,
  };
  // DOM `key` values produced by Chrome / WebView / desktop for the same buttons.
  const BY_KEY = {
    ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
    Enter: "CENTER", " ": "CENTER",
    GoBack: "BACK", BrowserBack: "BACK", Escape: "BACK",
    MediaPlayPause: "PLAY_PAUSE", MediaPlay: "PLAY", MediaPause: "PAUSE",
  };
  const BY_CODE = {
    [KEYCODE.BACK]: "BACK", [KEYCODE.DPAD_UP]: "UP", [KEYCODE.DPAD_DOWN]: "DOWN",
    [KEYCODE.DPAD_LEFT]: "LEFT", [KEYCODE.DPAD_RIGHT]: "RIGHT", [KEYCODE.DPAD_CENTER]: "CENTER",
    [KEYCODE.MEDIA_PLAY_PAUSE]: "PLAY_PAUSE", [KEYCODE.MEDIA_PLAY]: "PLAY", [KEYCODE.MEDIA_PAUSE]: "PAUSE",
  };
  const FOCUSABLE = "button, select, input, [href], [tabindex]";

  let _visible = true;
  let _timer = null;
  let _els = [];   // .hud containers
  let _primary = null;

  function classify(e) {
    if (e.key && e.key !== "Unidentified") return BY_KEY[e.key] || null;
    return BY_CODE[e.keyCode] || null;   // raw Android codes only when key is unknown
  }

  function _focusables() {
    return _els
      .flatMap(el => Array.from(el.querySelectorAll(FOCUSABLE)))
      .filter(el =>
        !el.disabled &&
        !el.closest(".control-deck.is-collapsed .control-deck-body") &&
        el.getClientRects().length > 0);
  }

  function _setFocusable(on) {
    _els.forEach(el => {
      el.inert = !on;
      el.setAttribute("aria-hidden", String(!on));
      el.querySelectorAll(FOCUSABLE).forEach(c => {
        if (on) c.removeAttribute("tabindex");   // restore natural order
        else c.tabIndex = -1;
      });
    });
  }

  function _restartTimer(ms = HIDE_AFTER_MS) {
    clearTimeout(_timer);
    if (_visible) _timer = setTimeout(hide, ms);
  }

  function show({ focus = false, ms = HIDE_AFTER_MS } = {}) {
    _visible = true;
    document.body.classList.remove("hud-hidden");
    _setFocusable(true);
    if (focus && _primary) _primary.focus({ preventScroll: true });
    _restartTimer(ms);
  }

  function hide() {
    clearTimeout(_timer);
    _visible = false;
    const a = document.activeElement;
    if (a && _els.some(el => el.contains(a))) a.blur();   // keys must not reach hidden controls
    document.body.classList.add("hud-hidden");
    _setFocusable(false);
  }

  /** Nearest focusable in the pressed direction (spatial navigation). */
  function _move(dir, from) {
    const items = _focusables();
    if (!items.length) return;
    if (!from || !items.includes(from)) { (_primary || items[0]).focus(); return; }
    const r = from.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bestScore = Infinity;
    for (const el of items) {
      if (el === from) continue;
      const b = el.getBoundingClientRect();
      const dx = (b.left + b.width / 2) - cx;
      const dy = (b.top + b.height / 2) - cy;
      const [main, cross] =
        dir === "RIGHT" ? [dx, Math.abs(dy)] :
          dir === "LEFT" ? [-dx, Math.abs(dy)] :
            dir === "DOWN" ? [dy, Math.abs(dx)] : [-dy, Math.abs(dx)];
      if (main <= 1) continue;                 // not in that direction
      const score = main + cross * 2;          // favour aligned targets
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) best.focus({ preventScroll: true });
  }

  function togglePlay(force) {
    const next = typeof force === "boolean" ? force : !MandalaRenderer.paused;
    MandalaRenderer.setPaused(next);
    if (_primary) {
      _primary.textContent = next ? "Play" : "Pause";
      _primary.setAttribute("aria-pressed", String(next));
      _primary.setAttribute("aria-label", next ? "Resume the visualiser animation" : "Pause the visualiser animation");
    }
  }

  /** Returns true if the BACK press was consumed (HUD was visible and is now hidden). */
  function handleBack() {
    if (!_visible) return false;   // let default back/exit navigation proceed
    hide();
    return true;
  }

  function _onKeyDown(e) {
    const action = classify(e);

    // Any key while visible counts as activity.
    if (_visible) _restartTimer();

    if (!action) return;

    if (action === "BACK") {
      if (handleBack()) { e.preventDefault(); e.stopImmediatePropagation(); }
      return;   // hidden: do NOT preventDefault → default back/exit
    }

    if (action === "PLAY_PAUSE" || action === "PLAY" || action === "PAUSE") {
      e.preventDefault();
      togglePlay(action === "PLAY_PAUSE" ? undefined : action === "PAUSE");
      show();            // brief confirmation, no focus change
      return;
    }

    // D-pad (UP/DOWN/LEFT/RIGHT/CENTER)
    if (!_visible) {
      // First press only wakes the HUD; it must not change any setting.
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) show({ focus: true });
      return;
    }

    const cur = _els.some(el => el.contains(document.activeElement)) ? document.activeElement : null;

    if (action === "CENTER") {
      if (!cur) { e.preventDefault(); _primary?.focus(); return; }
      // Enter/Space already click natively; raw DPAD_CENTER (key "Unidentified") does not.
      if (e.key === "Unidentified" && cur.tagName !== "INPUT") { e.preventDefault(); cur.click(); }
      return;
    }

    // Sliders keep native Left/Right (adjust value); everything else is spatial.
    if (cur && cur.type === "range" && (action === "LEFT" || action === "RIGHT")) return;
    e.preventDefault();
    _move(action, cur);
  }

  function init() {
    _els = Array.from(document.querySelectorAll(".hud"));
    _primary = document.getElementById("playPauseBtn");

    _primary?.addEventListener("click", () => togglePlay());

    // Capture phase: run before app/shortcut handlers and native control behaviour.
    window.addEventListener("keydown", _onKeyDown, true);

    // Pointer/focus activity keeps (or wakes) the HUD for mouse/touch users.
    const activity = () => (_visible ? _restartTimer() : show());
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("pointermove", e => { if (e.pointerType === "mouse") activity(); }, { passive: true });
    document.addEventListener("input", () => _restartTimer(), true);
    document.addEventListener("change", () => _restartTimer(), true);

    // Hook for a native Android wrapper: onBackPressed → if (!window.mandalaHandleBack()) finish();
    window.mandalaHandleBack = handleBack;

    // Launch: reveal briefly so users discover remote navigation, then fade out.
    show({ ms: INITIAL_MS });
  }

  return { init, show, hide, handleBack, get isVisible() { return _visible; } };
})();

// ============================================================
// EXPORT
// ============================================================
function _exportWallpaper() {
  const canvas = MandalaRenderer.canvas;
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `sonic-mandala-${state.genre}-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ============================================================
// A6 / B4: Pause render loop and AudioContext when tab is hidden;
//          resume both when the tab becomes visible again.
// ============================================================
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    MandalaRenderer.stop();
    AudioEngine.suspend();
  } else {
    AudioEngine.resume();
    MandalaRenderer.start();
  }
});

// ============================================================
// SLIDER CSS VARIABLE NORMALIZER
// Runs once on load and on every input to sync --progress
// ============================================================
function normalizeSlider(r) {
  if (!r || r.type !== "range") return;
  const mn = parseFloat(r.min || "0");
  const mx = parseFloat(r.max || "100");
  let v = parseFloat(r.value);
  if (isNaN(v)) v = (mn + mx) / 2;
  const p = mx > mn ? ((v - mn) / (mx - mn)) * 100 : 50;
  r.style.setProperty("--progress", p + "%");
}

document.addEventListener("input", function (e) {
  normalizeSlider(e.target);
});

// ============================================================
// BOOT SEQUENCE
// ============================================================
function initApp() {
  document.querySelectorAll('input[type="range"], .lumi-slider').forEach(normalizeSlider);
  MandalaRenderer.init();
  InteractionCtrl.init();
  HudCtrl.init();
  applyTheme(currentThemeMode);
  MandalaRenderer.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
