'use strict';

// ============================================================
// THEME MANAGEMENT
// ============================================================
const THEME_STORAGE_KEY = "mandala_theme";
const THEMES = ["system", "light", "dark"];
let currentThemeMode = localStorage.getItem(THEME_STORAGE_KEY) || "system";

const THEME_ICONS = {
  system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  light:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  dark:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
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

  const themeBtn  = document.getElementById("themeBtn");
  const iconEl    = document.getElementById("themeIcon");
  const labelEl   = document.getElementById("themeLabel");

  if (iconEl)  iconEl.innerHTML  = THEME_ICONS[mode] || THEME_ICONS.system;
  if (labelEl) labelEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  if (themeBtn) {
    const nextMode  = THEMES[(THEMES.indexOf(mode) + 1) % THEMES.length];
    const nextTitle = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
    const curTitle  = mode.charAt(0).toUpperCase() + mode.slice(1);
    themeBtn.setAttribute("title",      `Theme: ${curTitle} (click to switch to ${nextTitle})`);
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
// FREQUENCY BAND DATA
// ============================================================
const FREQUENCY_BANDS = [
  { id: "metal",   name: "Progressive Metal",        baseFrequency: 432, polyrhythmRatio: 7/8, harmonics: 12, hueRange: [260, 290], particleCount: 350, waveForm: "logarithmic_spiral", energy: 0.88, ratioText: "7/8"  },
  { id: "rock",    name: "Alternative & Heavy Rock", baseFrequency: 220, polyrhythmRatio: 4/4, harmonics:  8, hueRange: [ 10,  35], particleCount: 260, waveForm: "sawtooth_crest",     energy: 0.82, ratioText: "4/4"  },
  { id: "pop",     name: "Kinetic Pop",              baseFrequency: 880, polyrhythmRatio: 3/4, harmonics: 16, hueRange: [320, 350], particleCount: 420, waveForm: "prismatic_sine",      energy: 0.95, ratioText: "3/4"  },
  { id: "sub",     name: "Sub-Bass & Low-End",       baseFrequency:  55, polyrhythmRatio: 1/1, harmonics:  4, hueRange: [175, 210], particleCount: 180, waveForm: "sub_resonance",       energy: 0.74, ratioText: "1/1"  },
  { id: "ambient", name: "Ambient Soundscape",       baseFrequency: 110, polyrhythmRatio: 2/4, harmonics:  6, hueRange: [200, 240], particleCount: 200, waveForm: "sub_resonance",       energy: 0.40, ratioText: "2/4"  },
  { id: "synth",   name: "Synthwave",                baseFrequency: 330, polyrhythmRatio: 4/4, harmonics: 14, hueRange: [290, 320], particleCount: 300, waveForm: "sawtooth_crest",     energy: 0.85, ratioText: "4/4"  },
  { id: "dnb",     name: "Drum & Bass",              baseFrequency: 175, polyrhythmRatio: 5/4, harmonics: 24, hueRange: [ 40,  70], particleCount: 450, waveForm: "prismatic_sine",      energy: 1.00, ratioText: "5/4"  },
];

const state = {
  genre:      "all",
  complexity: 12,
  resonance:  45,
};

// ============================================================
// AUDIO ENGINE
// B1: Stream tracks stopped on disable (OS mic indicator cleared)
// B2: _enabling guard against rapid double-click
// B3: 'interrupted' state handled (Safari)
// B4: suspend/resume called from visibility handler
// B5: Distinct error messages per rejection type
// ============================================================
const AudioEngine = (() => {
  let _ctx      = null;
  let _analyser = null;
  let _data     = null;   // Uint8Array, reused each frame
  let _stream   = null;
  let _active   = false;
  let _enabling = false;

  function getFrequencyEnergy(targetHz) {
    if (!_active || !_analyser || !_data || !_ctx) return 0;
    const nyquist  = _ctx.sampleRate / 2;
    const binIndex = Math.min(
      _data.length - 1,
      Math.max(0, Math.round((targetHz / nyquist) * _data.length))
    );
    const prev = _data[Math.max(0, binIndex - 1)]                    || 0;
    const curr = _data[binIndex]                                       || 0;
    const next = _data[Math.min(_data.length - 1, binIndex + 1)]      || 0;
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
      _stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      _ctx    = new (window.AudioContext || window.webkitAudioContext)();

      // B3: resume covers both 'suspended' (Chrome autoplay policy) and
      //     'interrupted' (Safari when another app had audio focus)
      if (_ctx.state === "suspended" || _ctx.state === "interrupted") {
        await _ctx.resume();
      }

      const source   = _ctx.createMediaStreamSource(_stream);
      _analyser      = _ctx.createAnalyser();
      _analyser.fftSize                = 512;
      _analyser.smoothingTimeConstant  = 0.8;
      source.connect(_analyser);
      _data   = new Uint8Array(_analyser.frequencyBinCount);
      _active = true;

      if (btn) {
        btn.textContent        = "Mic Active";
        btn.style.color        = "#00f5d4";
        btn.style.borderColor  = "#00f5d4";
      }
    } catch (err) {
      console.error("Microphone error:", err);
      // B5: distinguish permission denied vs hardware not found vs other
      const msg =
        err.name === "NotAllowedError"  ? "Permission Denied" :
        err.name === "NotFoundError"    ? "No Mic Found"      :
        err.name === "NotReadableError" ? "Mic In Use"        : "Mic Error";
      if (btn) {
        btn.textContent       = msg;
        btn.style.color       = "";
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
    _ctx      = null;
    _analyser = null;
    _data     = null;

    const btn = document.getElementById("audioBtn");
    if (btn) {
      btn.textContent       = "Enable Mic";
      btn.style.color       = "";
      btn.style.borderColor = "";
    }
  }

  async function toggle() {
    if (_active) await _disable();
    else         await _enable();
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
  let _ctx    = null;
  let _rafId  = null;

  let _particles = [];
  let _impulses  = [];
  let _phase     = 0;
  let _lastTs    = 0;

  // C3: Layout dimensions kept up-to-date by ResizeObserver
  let _vW = 600, _vH = 380;
  let _dpr = window.devicePixelRatio || 1;

  // A3/A4: Theme-derived rendering values — updated in onThemeChanged()
  let _isLight  = false;
  let _bgColor  = "#141414";

  // A1: Background gradient cache
  let _bgGrad    = null;
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
      _dpr = window.devicePixelRatio || 1;
      _resizeCanvas();
      _watchDPR();   // re-register for the next monitor move
    }, { once: true });
  }

  function _resizeCanvas() {
    if (!_canvas) return;
    const newW = Math.floor(_vW * _dpr);
    const newH = Math.floor(_vH * _dpr);
    if (_canvas.width !== newW || _canvas.height !== newH) {
      _canvas.width  = newW;
      _canvas.height = newH;
      _gradDirty = true;
    }
    _ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
  }

  // A3/A4: Called by applyTheme() whenever the colour scheme changes
  function onThemeChanged() {
    if (!_canvas) return;   // not yet initialised — safe to skip
    _isLight   = document.documentElement.getAttribute("data-theme") === "light";
    _bgColor   = getCssVar("--surface-dim") || (_isLight ? "#ffffff" : "#141414");
    _gradDirty = true;
  }

  // A1: Builds and caches the background gradient; returns the cached copy on stable frames
  function _getBgGrad(cx, cy, maxR) {
    const key = `${cx | 0},${cy | 0},${maxR | 0},${_isLight}`;
    if (!_gradDirty && _bgGrad && _bgGradKey === key) return _bgGrad;

    _bgGrad = _ctx.createRadialGradient(cx, cy, 5, cx, cy, maxR * 1.2);
    if (_isLight) {
      _bgGrad.addColorStop(0,   "rgba(49, 134, 255, 0.05)");
      _bgGrad.addColorStop(0.6, "rgba(220, 225, 235, 0.12)");
      _bgGrad.addColorStop(1,   "rgba(255, 255, 255, 0)");
    } else {
      _bgGrad.addColorStop(0,   "rgba(49, 134, 255, 0.08)");
      _bgGrad.addColorStop(0.6, "rgba(15, 15, 15, 0.02)");
      _bgGrad.addColorStop(1,   "rgba(0, 0, 0, 0)");
    }
    _bgGradKey = key;
    _gradDirty = false;
    return _bgGrad;
  }

  function _initParticles() {
    _particles = [];
    const totalBands = FREQUENCY_BANDS.length;
    const bandStep   = totalBands > 1 ? 0.72 / (totalBands - 1) : 0;

    FREQUENCY_BANDS.forEach((band, bandIdx) => {
      const count = Math.floor(band.particleCount * 0.7);
      for (let i = 0; i < count; i++) {
        const angle    = Math.random() * Math.PI * 2;
        const baseTier = 0.2 + bandIdx * bandStep;
        const normDist = baseTier + (Math.random() - 0.5) * (bandStep * 0.35);
        const hue = band.hueRange[0] + Math.random() * (band.hueRange[1] - band.hueRange[0]);
        const sat = 85 + Math.random() * 15;
        const lum = 55 + Math.random() * 25;

        _particles.push({
          bandId:          band.id,
          bandIdx:         bandIdx,
          angle:           angle,
          baseNormDist:    normDist,
          currentNormDist: normDist,
          speed:           (0.002 + Math.random() * 0.004) * (bandIdx % 2 === 0 ? 1 : -1) * band.polyrhythmRatio,
          size:            1.2 + Math.random() * 1.8 * band.energy,
          hue:             hue,
          sat:             sat,
          lum:             lum,
          alpha:           0.4 + Math.random() * 0.5,
          seed:            Math.random() * 1000,
          burstVelocity:   0,
          burstAngle:      0,
          // A8: Pre-built fill string prefix; hue+sat never change per particle
          _fillBase: `hsla(${hue.toFixed(1)}, ${sat.toFixed(1)}%,`,
        });
      }
    });
  }

  // Called by InteractionCtrl on tap/click
  function triggerImpulse(cx, cy) {
    _impulses.push({
      x: cx, y: cy,
      radius:    0,
      maxRadius: Math.max(_canvas.width, _canvas.height) * 0.8,
      speed:     7,
      energy:    1.0,
    });

    const centerX = _vW / 2;
    const centerY = _vH / 2;
    const maxR    = Math.min(_vW, _vH) * 0.45;

    _particles.forEach(p => {
      const px = centerX + Math.cos(p.angle) * p.currentNormDist * maxR;
      const py = centerY + Math.sin(p.angle) * p.currentNormDist * maxR;
      const dx = px - cx;
      const dy = py - cy;
      // A7: Compare squared distances before committing to sqrt
      const distSq = dx * dx + dy * dy;
      if (distSq < 120 * 120) {
        const dist       = Math.sqrt(distSq);
        p.burstVelocity  = (120 - dist) * 0.12 * (0.8 + Math.random() * 0.4);
        p.burstAngle     = Math.atan2(dy, dx);
      }
    });
  }

  // ── Main render loop ──────────────────────────────────────
  function _renderFrame(ts) {
    if (!_canvas || !_ctx) return;

    // C12: Delta-time, normalised to 60fps (dt60 = 1.0 at exactly 60fps)
    const dt   = _lastTs === 0 ? 16.667 : Math.min(ts - _lastTs, 50);
    _lastTs    = ts;
    const dt60 = dt / (1000 / 60);

    const w       = _vW, h = _vH;
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.42;

    // Guard: skip frame if canvas has zero area
    if (w < 1 || h < 1) {
      _rafId = requestAnimationFrame(_renderFrame);
      return;
    }

    // ── Clear ──
    _ctx.globalCompositeOperation = "source-over";
    _ctx.fillStyle = _bgColor;
    _ctx.fillRect(0, 0, w, h);

    // A1: Use cached background gradient
    _ctx.fillStyle = _getBgGrad(centerX, centerY, maxRadius);
    _ctx.fillRect(0, 0, w, h);

    // C12: Phase advances proportional to elapsed time, modulated by C9 motion scale
    _phase += 0.015 * dt60 * _motionScale;

    // A5: Poll audio FFT once per frame, then build per-band energy map
    AudioEngine.poll();

    // A2: Compute activeBands once (not inside any loop)
    const activeBands  = state.genre === "all"
      ? FREQUENCY_BANDS
      : FREQUENCY_BANDS.filter(b => b.id === state.genre);
    const totalActive  = activeBands.length;
    const bandStep     = totalActive > 1 ? 0.72 / (totalActive - 1) : 0;

    // A5: One energy lookup per band, results shared by waveform + particle loops
    const energyMap = {};
    activeBands.forEach(b => {
      energyMap[b.id] = AudioEngine.getFrequencyEnergy(b.baseFrequency);
    });

    const mousePos  = InteractionCtrl.mousePos;
    const complexity = state.complexity;
    const resNorm   = state.resonance / 100;
    const isAudio   = AudioEngine.isActive;

    _ctx.globalCompositeOperation = _isLight ? "multiply" : "screen";

    let hoverTagText = "";
    let closestDist  = Infinity;

    // ── 1. Waveforms & Radial Rings ──────────────────────────
    activeBands.forEach((band, idx) => {
      const bandRadius = totalActive === 1
        ? maxRadius * 0.55
        : maxRadius * (0.2 + idx * bandStep);

      const liveEnergy     = energyMap[band.id];
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
          rOffset   = (mod - 0.5) * 12 * effectiveEnergy;
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
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            const pull = (1 - d / 110) * 22;
            px += (dx / d) * pull;
            py += (dy / d) * pull;
            if (d < closestDist) {
              closestDist  = d;
              hoverTagText = `${band.name} \u2022 ${band.baseFrequency}\u202fHz [${band.ratioText}]`;
            }
          }
        }

        if (i === 0) _ctx.moveTo(px, py);
        else         _ctx.lineTo(px, py);
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

      const band      = FREQUENCY_BANDS[p.bandIdx];
      // A5: Energy already computed — no extra getFrequencyEnergy call per particle
      const liveAudio = isAudio ? (energyMap[band.id] || 0) : 0;

      const effectiveDist = totalActive === 1
        ? 0.55 + (p.baseNormDist - 0.55) * 0.4
        : p.currentNormDist;

      if (p.burstVelocity > 0.1) {
        p.currentNormDist += p.burstVelocity * 0.002;
        p.burstVelocity   *= 0.92;
      } else {
        p.currentNormDist += (p.baseNormDist - p.currentNormDist) * 0.05;
      }

      const audioOffset = liveAudio * 0.04 * band.energy;
      const wobble      = Math.sin(_phase * 2 + p.seed) * 0.015 * resNorm;
      const r           = maxRadius * (effectiveDist + wobble + audioOffset);

      let px = centerX + Math.cos(p.angle) * r;
      let py = centerY + Math.sin(p.angle) * r;

      if (mousePos.active) {
        const dx = mousePos.x - px;
        const dy = mousePos.y - py;
        const d  = Math.sqrt(dx * dx + dy * dy);
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

      const pLum   = _isLight ? Math.max(28, p.lum * 0.5)       : p.lum;
      const pAlpha = _isLight ? Math.min(0.9, p.alpha * 1.15)   : p.alpha;
      // A8: Only the two varying numbers are concatenated; prefix is pre-built
      _ctx.fillStyle = `${p._fillBase}${pLum.toFixed(1)}%, ${pAlpha.toFixed(2)})`;
      _ctx.fill();
    });

    // ── 3. Acoustic Impulse Ripples ──────────────────────────
    for (let i = _impulses.length - 1; i >= 0; i--) {
      const imp = _impulses[i];
      // C12: ripple speed is time-normalised
      imp.radius += imp.speed * dt60;
      imp.energy *= 0.95;

      _ctx.beginPath();
      _ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
      _ctx.strokeStyle = _isLight
        ? `rgba(30, 90, 190, ${0.5 * imp.energy})`
        : `rgba(157, 210, 255, ${0.6 * imp.energy})`;
      _ctx.lineWidth = 2 * imp.energy;
      _ctx.stroke();

      if (imp.energy < 0.02 || imp.radius > imp.maxRadius) {
        _impulses.splice(i, 1);
      }
    }

    // ── 4. Central Geometric Core ────────────────────────────
    // Note: core gradient changes every frame (driven by haloRadius + audio),
    //       so it cannot be cached — it is intentionally re-created here.
    const subBassLevel = isAudio ? AudioEngine.getFrequencyEnergy(55) : 0;
    const corePulse    = (3.2 + Math.sin(_phase * 2.5) * 1.4) * (1 + subBassLevel * 2.0);
    const haloRadius   = (26  + Math.sin(_phase * 1.5) * 4)   * (1 + subBassLevel * 1.5);

    const coreGrad = _ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, haloRadius);
    if (_isLight) {
      coreGrad.addColorStop(0,    "rgba(24, 24, 38, 0.7)");
      coreGrad.addColorStop(0.25, "rgba(90, 35, 170, 0.35)");
      coreGrad.addColorStop(0.6,  "rgba(25, 90, 210, 0.15)");
      coreGrad.addColorStop(1,    "rgba(255, 255, 255, 0)");
    } else {
      coreGrad.addColorStop(0,    "rgba(255, 255, 255, 0.9)");
      coreGrad.addColorStop(0.25, "rgba(157, 78, 221, 0.55)");
      coreGrad.addColorStop(0.6,  "rgba(49, 134, 255, 0.2)");
      coreGrad.addColorStop(1,    "rgba(0, 0, 0, 0)");
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
      if (hoverTagText && mousePos.active) {
        tag.textContent   = hoverTagText;
        tag.style.left    = `${mousePos.x}px`;
        tag.style.top     = `${mousePos.y}px`;
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
    _rafId  = requestAnimationFrame(_renderFrame);
  }

  function stop() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function init() {
    _canvas = document.getElementById("mandalaCanvas");
    if (!_canvas) return;
    _ctx = _canvas.getContext("2d");

    // Seed theme cache before first paint
    onThemeChanged();

    // C3: ResizeObserver — dimensions captured here, never queried inside rAF
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        _vW = entry.contentRect.width  || _canvas.parentElement.clientWidth  || 600;
        _vH = entry.contentRect.height || _canvas.parentElement.clientHeight || 380;
      }
      _dpr = window.devicePixelRatio || 1;
      _resizeCanvas();
      if (typeof InteractionCtrl !== "undefined" && InteractionCtrl.invalidateRect) {
        InteractionCtrl.invalidateRect();
      }
    });
    ro.observe(_canvas.parentElement);

    // Seed initial dimensions synchronously
    _vW  = _canvas.parentElement.clientWidth  || 600;
    _vH  = _canvas.parentElement.clientHeight || 380;
    _resizeCanvas();

    _initParticles();
    _watchDPR();   // C13
  }

  return {
    init,
    start,
    stop,
    triggerImpulse,
    onThemeChanged,
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
  let _rectDirty  = true;
  let _pDownMoved = false;
  let _pDownX     = 0, _pDownY = 0;

  function _getRect(canvas) {
    // C2: Re-read only when the layout has changed
    if (_rectDirty || !_cachedRect) {
      _cachedRect = canvas.getBoundingClientRect();
      _rectDirty  = false;
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
      mousePos.x      = x;
      mousePos.y      = y;
      mousePos.active = true;
      // Track significant movement to distinguish tap from drag
      const dx = x - _pDownX, dy = y - _pDownY;
      if (dx * dx + dy * dy > 25) _pDownMoved = true;
    }, { passive: true });

    canvas.addEventListener("pointerleave", () => {
      mousePos.active = false;
      const tag = document.getElementById("freqTag");
      if (tag) tag.style.opacity = "0";
    });

    canvas.addEventListener("pointerdown", e => {
      // Capture ensures pointermove/up fire even if pointer leaves canvas
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* Safari may throw */ }
      _pDownMoved = false;
      const { x, y } = _coords(e, canvas);
      _pDownX = x; _pDownY = y;
      mousePos.x = x; mousePos.y = y; mousePos.active = true;
    });

    canvas.addEventListener("pointerup", e => {
      if (!_pDownMoved) {
        // Tap or click (not a drag) — fire acoustic impulse
        const { x, y } = _coords(e, canvas);
        MandalaRenderer.triggerImpulse(x, y);
      }
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });

    // ── Collapsible deck ──
    const deck       = document.getElementById("controlDeck");
    const deckHeader = document.getElementById("deckHeader");
    if (deck && deckHeader) {
      const toggleBtn  = deckHeader.querySelector(".control-deck-toggle");
      const toggleText = document.getElementById("toggleText");
      deckHeader.addEventListener("click", () => {
        const collapsed = deck.classList.toggle("is-collapsed");
        if (toggleBtn)  toggleBtn.setAttribute("aria-expanded", String(!collapsed));
        if (toggleText) toggleText.textContent = collapsed ? "Show" : "Hide";
        _rectDirty = true;
      });
      deck.addEventListener("transitionend", () => {
        _rectDirty = true;
      });
    }

    // ── Header buttons ──
    document.getElementById("audioBtn") ?.addEventListener("click", () => AudioEngine.toggle());
    document.getElementById("exportBtn")?.addEventListener("click", _exportWallpaper);
    document.getElementById("themeBtn") ?.addEventListener("click", cycleTheme);

    // ── Keyboard shortcuts ──
    // Guard: do not intercept when user is typing inside a form control
    window.addEventListener("keydown", e => {
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
        }

        const badge = document.getElementById(`${e.target.id}-val`);
        if (badge) badge.textContent = e.target.value;
      });
    });

    document.getElementById("genreSelect")?.addEventListener("change", e => {
      state.genre = e.target.value;
    });
  }

  return { init, mousePos, invalidateRect: () => { _rectDirty = true; } };
})();

// ============================================================
// EXPORT
// ============================================================
function _exportWallpaper() {
  const canvas = MandalaRenderer.canvas;
  if (!canvas) return;
  const link     = document.createElement("a");
  link.download  = `sonic-mandala-${state.genre}-${Date.now()}.png`;
  link.href      = canvas.toDataURL("image/png");
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
  let v    = parseFloat(r.value);
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
  applyTheme(currentThemeMode);
  MandalaRenderer.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
