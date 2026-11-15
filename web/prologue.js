// COSMO QUEST — Project Genesis: The Last Signal
// 60fps Smooth Animated Sci-Fi Prologue Film Engine (960x540 Cinema Canvas, 16:9)
"use strict";

(() => {
  const VW = 960;
  const VH = 540;
  const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  function makeRng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909);
      return (s >>> 0) / 4294967296;
    };
  }

  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mixRgb(c1, c2, t) {
    const a = clamp(t, 0, 1);
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * a),
      Math.round(c1[1] + (c2[1] - c1[1]) * a),
      Math.round(c1[2] + (c2[2] - c1[2]) * a),
    ];
  }

  function makeOffscreen(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function roundBox(g, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.lineTo(x + w - rr, y);
    g.quadraticCurveTo(x + w, y, x + w, y + rr);
    g.lineTo(x + w, y + h - rr);
    g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    g.lineTo(x + rr, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - rr);
    g.lineTo(x, y + rr);
    g.quadraticCurveTo(x, y, x + rr, y);
    g.closePath();
  }

  // -------------------------------------------------------------------------- Cinematic Web Audio & Typing Engine
  const PrologueAudio = (() => {
    let ctx = null;
    let master = null;
    let padA = null;
    let padB = null;
    let padC = null;
    let padFilter = null;
    let noiseBuf = null;
    let running = false;
    let lastSignalBeat = -1;
    let lastIgniteScene = -1;
    let lastSceneChime = -1;
    let lastThunderBeat = -1;

    const isSoundEnabled = () => {
      try {
        const raw = localStorage.getItem("sound");
        return raw === null ? true : JSON.parse(raw) !== false;
      } catch {
        return true;
      }
    };

    function ensure() {
      if (!isSoundEnabled()) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) {
        try { ctx = new AC(); } catch { return null; }
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      if (!noiseBuf && ctx) {
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return ctx;
    }

    function start() {
      if (running || !isSoundEnabled()) return;
      const c = ensure();
      if (!c) return;
      try {
        master = c.createGain();
        master.gain.setValueAtTime(0.0001, c.currentTime);
        master.gain.exponentialRampToValueAtTime(0.075, c.currentTime + 1.2);

        padFilter = c.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.setValueAtTime(400, c.currentTime);
        padFilter.Q.value = 1.0;

        padA = c.createOscillator();
        padB = c.createOscillator();
        padC = c.createOscillator();
        padA.type = "triangle";
        padB.type = "sine";
        padC.type = "sine";
        padA.frequency.setValueAtTime(73.42, c.currentTime);
        padB.frequency.setValueAtTime(110.0, c.currentTime);
        padC.frequency.setValueAtTime(220.0, c.currentTime);

        const gA = c.createGain(); gA.gain.value = 0.42;
        const gB = c.createGain(); gB.gain.value = 0.34;
        const gC = c.createGain(); gC.gain.value = 0.16;

        padA.connect(gA).connect(padFilter);
        padB.connect(gB).connect(padFilter);
        padC.connect(gC).connect(padFilter);
        padFilter.connect(master).connect(c.destination);

        padA.start();
        padB.start();
        padC.start();
        running = true;
      } catch {
        stop();
      }
    }

    function stop() {
      running = false;
      [padA, padB, padC].forEach((osc) => {
        if (!osc) return;
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      padA = padB = padC = null;
      if (padFilter) { try { padFilter.disconnect(); } catch {} padFilter = null; }
      if (master) { try { master.disconnect(); } catch {} master = null; }
      lastSignalBeat = -1;
      lastIgniteScene = -1;
      lastSceneChime = -1;
      lastThunderBeat = -1;
    }

    function playSignalPing(accent = false) {
      const c = ensure();
      if (!c || !master) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(accent ? 1420 : 1065, t);
      osc.frequency.exponentialRampToValueAtTime(accent ? 710 : 532, t + 0.38);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(accent ? 0.11 : 0.07, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.45);
    }

    // Soft tactile mechanical typing tick for subtitle narration reveal
    function playTypeTick() {
      if (!isSoundEnabled()) return;
      const c = ensure();
      if (!c || c.state !== "running" || !noiseBuf) return;
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(1950 + Math.random() * 650, t);
      bp.Q.value = 3.2;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.022, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
      src.connect(bp).connect(g).connect(c.destination);
      src.start(t, Math.random() * 0.4);
      src.stop(t + 0.03);
    }

    function playNoiseRumble(dur = 1.6, freq = 140, vol = 0.18) {
      const c = ensure();
      if (!c || !master || !noiseBuf) return;
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(freq, t);
      f.frequency.exponentialRampToValueAtTime(48, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(master);
      src.start(t, Math.random() * 0.4);
      src.stop(t + dur + 0.05);
    }

    function tick(sIdx, p, tSec, paused) {
      if (paused || !isSoundEnabled()) {
        if (running) stop();
        return;
      }
      if (!running) start();
      if (!running || !ctx || !padA || !padFilter) return;

      const chords = [
        [73.42, 110.0, 220.0, 380],
        [65.41, 98.0, 196.0, 310],
        [61.74, 110.0, 246.94, 460],
        [82.41, 123.47, 246.94, 520],
        [87.31, 130.81, 261.63, 620],
        [73.42, 110.0, 293.66, 560],
      ];
      const ch = chords[clamp(sIdx, 0, chords.length - 1)];
      const now = ctx.currentTime;
      padA.frequency.setTargetAtTime(ch[0], now, 0.35);
      padB.frequency.setTargetAtTime(ch[1], now, 0.35);
      padC.frequency.setTargetAtTime(ch[2], now, 0.35);
      padFilter.frequency.setTargetAtTime(ch[3], now, 0.4);

      if (sIdx !== lastSceneChime) {
        lastSceneChime = sIdx;
        if (sIdx === 3 || sIdx === 4) playSignalPing(false);
      }
      if (sIdx === 2 && p > 0.28) {
        const beat = Math.floor(tSec / 0.65);
        if (beat !== lastSignalBeat) {
          lastSignalBeat = beat;
          if (beat % 4 < 3) playSignalPing(beat % 4 === 1);
        }
      }
      if (sIdx === 1 && p > 0.38 && p < 0.68) {
        const tb = Math.floor(tSec / 1.5);
        if (tb !== lastThunderBeat) {
          lastThunderBeat = tb;
          playNoiseRumble(1.1, 165, 0.14);
        }
      }
      if (sIdx === 5 && p > 0.70 && lastIgniteScene !== 5) {
        lastIgniteScene = 5;
        playNoiseRumble(2.4, 210, 0.24);
      }
    }

    return { start, stop, tick, unlock: ensure, playTypeTick };
  })();

  // -------------------------------------------------------------------------- High-Res Pre-baked Cosmos & Fast 60fps Earth LUT
  const ASSETS = (() => {
    const starRnd = makeRng(20261114);
    const stars = [];
    for (let i = 0; i < 320; i++) {
      stars.push({
        x: starRnd() * VW,
        y: starRnd() * VH,
        r: i < 200 ? 0.9 : i < 290 ? 1.4 : 2.1,
        layer: i < 160 ? 0.35 : i < 260 ? 0.7 : 1.15,
        phase: starRnd() * Math.PI * 2,
        cross: i > 304,
        col: i % 13 === 0 ? "#ffd98e" : i % 7 === 0 ? "#ffbfa0" : i % 4 === 0 ? "#a9d0f5" : "#eef4ff",
      });
    }

    // Soft Volumetric Deep-Space Nebula Canvas (960x540)
    const nebula = makeOffscreen(VW, VH);
    {
      const g = nebula.getContext("2d");
      const bg = g.createLinearGradient(0, 0, 0, VH);
      bg.addColorStop(0, "#02050d");
      bg.addColorStop(0.5, "#061126");
      bg.addColorStop(1, "#0a1936");
      g.fillStyle = bg;
      g.fillRect(0, 0, VW, VH);

      // Soft Milky Way glow clouds
      [
        [VW * 0.24, VH * 0.65, 290, "rgba(28, 66, 128, 0.22)"],
        [VW * 0.56, VH * 0.42, 340, "rgba(38, 72, 138, 0.18)"],
        [VW * 0.80, VH * 0.25, 260, "rgba(56, 46, 112, 0.16)"],
        [VW * 0.42, VH * 0.72, 220, "rgba(22, 92, 132, 0.12)"],
      ].forEach(([cx, cy, r, col]) => {
        const rg = g.createRadialGradient(cx, cy, 10, cx, cy, r);
        rg.addColorStop(0, col);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, VW, VH);
      });
    }

    // Smooth Banded Jupiter Sphere (220x220)
    const jupiter = makeOffscreen(220, 220);
    {
      const S = 220, R = 102, CX = 110, CY = 110;
      const g = jupiter.getContext("2d");
      const img = g.createImageData(S, S);
      const d = img.data;
      const bands = [hexRgb("#f2e1c9"), hexRgb("#d9a271"), hexRgb("#b87044"), hexRgb("#85472d"), hexRgb("#e8c9a1")];
      const dark = hexRgb("#0e1222");
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = x - CX, dy = y - CY;
          const dist = Math.hypot(dx, dy);
          if (dist > R + 5) continue;
          const idx = (y * S + x) * 4;
          if (dist > R) {
            const limb = clamp((-dx * 0.7 - dy * 0.3) / R + 0.5, 0, 1);
            const alpha = Math.round(145 * limb * clamp(1 - (dist - R) / 5, 0, 1));
            const rimCol = dy < -70 ? [111, 224, 236] : [236, 188, 134];
            d[idx] = rimCol[0]; d[idx + 1] = rimCol[1]; d[idx + 2] = rimCol[2]; d[idx + 3] = alpha;
            continue;
          }
          const swirl = Math.sin(x * 0.08 + y * 0.05) * 3.1 + Math.cos(x * 0.16 - y * 0.07) * 1.4;
          const b = Math.sin((y + swirl) * 0.19);
          const bt = (b + 1) * 0.5;
          let col = bt > 0.65 ? mixRgb(bands[1], bands[0], (bt - 0.65) / 0.35)
            : bt > 0.35 ? mixRgb(bands[2], bands[1], (bt - 0.35) / 0.3)
            : mixRgb(bands[3], bands[2], bt / 0.35);
          const grs = ((x - 130) / 21) ** 2 + ((y - 138) / 11.5) ** 2;
          if (grs < 1) col = mixRgb(hexRgb("#e37949"), col, grs * 0.65);
          const lit = (-dx * 0.74 - dy * 0.3) / R;
          if (lit < -0.42) col = dark;
          else if (lit < 0.06) col = mixRgb(dark, col, smoothstep(-0.42, 0.06, lit));
          else if (dist > R - 4) col = mixRgb(col, [255, 240, 214], 0.25);
          d[idx] = col[0]; d[idx + 1] = col[1]; d[idx + 2] = col[2]; d[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }

    // Smooth Icy Cracked Europa Sphere (72x72)
    const europa = makeOffscreen(72, 72);
    {
      const S = 72, R = 32, CX = 36, CY = 36;
      const g = europa.getContext("2d");
      const img = g.createImageData(S, S);
      const d = img.data;
      const ice = hexRgb("#edf4fc"), iceM = hexRgb("#bed2e8"), crack = hexRgb("#9f6c52"), dark = hexRgb("#141e33");
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = x - CX, dy = y - CY;
          const dist = Math.hypot(dx, dy);
          if (dist > R + 3) continue;
          const idx = (y * S + x) * 4;
          if (dist > R) {
            d[idx] = 111; d[idx + 1] = 224; d[idx + 2] = 236;
            d[idx + 3] = Math.round(115 * clamp(1 - (dist - R) / 3, 0, 1));
            continue;
          }
          const line1 = Math.abs((y - 22) - Math.sin(x * 0.14) * 7 - (x - 16) * 0.3) < 1.1;
          const line2 = Math.abs((y - 46) + Math.cos(x * 0.12) * 6 + (x - 32) * 0.24) < 1.0;
          const line3 = Math.abs((x - 38) - Math.sin(y * 0.18) * 5) < 0.9;
          let col = (line1 || line2 || line3) ? mixRgb(iceM, crack, 0.72) : mixRgb(iceM, ice, 0.65);
          const lit = (-dx * 0.72 - dy * 0.32) / R;
          if (lit < -0.38) col = dark;
          else if (lit < 0.08) col = mixRgb(dark, col, smoothstep(-0.38, 0.08, lit));
          d[idx] = col[0]; d[idx + 1] = col[1]; d[idx + 2] = col[2]; d[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }

    // Smooth Cratered Moon (150x150)
    const moon = makeOffscreen(150, 150);
    {
      const S = 150, R = 69, CX = 75, CY = 75;
      const g = moon.getContext("2d");
      const img = g.createImageData(S, S);
      const d = img.data;
      const hi = hexRgb("#dde4ef"), mid = hexRgb("#a5aebd"), mare = hexRgb("#6f7887"), dark = hexRgb("#121724");
      const craters = [[50, 52, 11], [92, 64, 14], [68, 96, 9], [96, 104, 8], [44, 88, 7]];
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = x - CX, dy = y - CY;
          const dist = Math.hypot(dx, dy);
          if (dist > R) continue;
          const mNoise = Math.sin(x * 0.07 + y * 0.05) + Math.cos(x * 0.1 - y * 0.08);
          let col = mNoise > 0.35 ? mare : mNoise > -0.3 ? mid : hi;
          for (const [cx, cy, cr] of craters) {
            const cd = Math.hypot(x - cx, y - cy);
            if (cd < cr) col = cd > cr - 2 ? hi : mare;
          }
          const lit = (-dx * 0.7 - dy * 0.25) / R;
          if (lit < -0.38) col = dark;
          else if (lit < 0.05) col = mixRgb(dark, col, smoothstep(-0.38, 0.05, lit));
          const idx = (y * S + x) * 4;
          d[idx] = col[0]; d[idx + 1] = col[1]; d[idx + 2] = col[2]; d[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }

    // Smooth Mars Sphere (130x130)
    const mars = makeOffscreen(130, 130);
    {
      const S = 130, R = 59, CX = 65, CY = 65;
      const g = mars.getContext("2d");
      const img = g.createImageData(S, S);
      const d = img.data;
      const rustL = hexRgb("#e68a56"), rustM = hexRgb("#bd5834"), rustD = hexRgb("#7d3522"), ice = hexRgb("#f2ede3"), dark = hexRgb("#1f1519");
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const dx = x - CX, dy = y - CY;
          const dist = Math.hypot(dx, dy);
          if (dist > R + 4) continue;
          const idx = (y * S + x) * 4;
          if (dist > R) {
            const rim = clamp((-dx * 0.65 - dy * 0.35) / R + 0.5, 0, 1);
            d[idx] = 247; d[idx + 1] = 158; d[idx + 2] = 104;
            d[idx + 3] = Math.round(130 * rim * clamp(1 - (dist - R) / 4, 0, 1));
            continue;
          }
          const n = Math.sin(x * 0.1 + y * 0.08) + Math.cos(x * 0.07 - y * 0.13);
          const valles = Math.abs(y - 68 - Math.sin(x * 0.11) * 3) < 2.2 && x > 42 && x < 90;
          let col = y < 16 || y > 114 ? ice : valles ? rustD : n > 0.5 ? rustD : n > -0.25 ? rustM : rustL;
          const lit = (-dx * 0.65 - dy * 0.35) / R;
          if (lit < -0.4) col = dark;
          else if (lit < 0.06) col = mixRgb(dark, col, smoothstep(-0.4, 0.06, lit));
          else if (dist > R - 3) col = mixRgb(col, [247, 178, 129], 0.35);
          d[idx] = col[0]; d[idx + 1] = col[1]; d[idx + 2] = col[2]; d[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }

    // Smooth Continuous Rotating Earth Texture (512x256 terrain + soft feathered clouds + delicate city lights)
    const EW = 512, EH = 256;
    const earthTex = new Uint8Array(EW * EH * 4);   // R, G, B, flags (bit0:land, bit1:city, bit3:ice)
    const cloudTex = new Uint8Array(EW * EH);       // Continuous cloud opacity 0..255 for wispy edges
    for (let y = 0; y < EH; y++) {
      const lat = (y / EH - 0.5) * Math.PI;
      for (let x = 0; x < EW; x++) {
        const lon = (x / EW) * Math.PI * 2;
        const cont =
          Math.sin(lon * 2.0 + Math.sin(lat * 2.5) * 1.25) * 0.68 +
          Math.cos(lon * 4.0 - lat * 3.1) * 0.44 +
          Math.sin(lon * 8.0 + lat * 7.2) * 0.24 +
          Math.cos(lon * 14.0 - lat * 11.1) * 0.12;
        const isIce = Math.abs(lat) > 1.22 + cont * 0.08;
        const isLand = cont > 0.14;
        const isCoast = !isLand && cont > 0.03;
        const isDesert = isLand && Math.abs(lat) < 0.44 && cont < 0.40;

        // Multi-octave swirling cloud bands (smooth continuous density -> wispy atmosphere!)
        const cld =
          Math.sin(lon * 3.0 + Math.sin(lat * 4.0) * 1.2 + lat * 8.0) * 0.46 +
          Math.cos(lon * 7.0 - lat * 12.0) * 0.34 +
          Math.sin(lon * 13.0 + lat * 19.0) * 0.20;
        const cloudAlpha = Math.round(smoothstep(0.18, 0.78, cld) * 245);

        let col;
        if (isIce) {
          col = [234, 242, 250];
        } else if (isDesert) {
          const dt = clamp((cont - 0.14) / 0.26, 0, 1);
          col = mixRgb([196, 160, 98], [168, 146, 86], dt);
        } else if (isLand) {
          const lt = clamp((cont - 0.14) / 0.55, 0, 1);
          col = mixRgb([84, 148, 66], [46, 88, 42], lt);
        } else if (isCoast) {
          const ct = clamp((cont - 0.03) / 0.11, 0, 1);
          col = mixRgb([46, 118, 194], [82, 168, 222], ct);
        } else {
          const ot = clamp((cont + 0.65) / 0.68, 0, 1);
          col = mixRgb([14, 42, 86], [42, 108, 184], ot);
        }

        // Tiny pinprick night city lights scattered naturally along temperate land (never giant blocks!)
        const cHash = Math.abs(Math.sin(Math.floor(lon * 84) * 12.9898 + Math.floor(lat * 52) * 78.233) * 43758.5453) % 1;
        const cCluster = Math.sin(lon * 5.0 + lat * 4.0) * 0.5 + 0.5;
        const isCity = isLand && !isIce && Math.abs(lat) < 0.95 && cCluster > 0.35 && cHash > 0.92;
        const flags = (isLand ? 1 : 0) | (isCity ? 2 : 0) | (isIce ? 8 : 0);

        const pix = y * EW + x;
        const i = pix * 4;
        earthTex[i] = col[0];
        earthTex[i + 1] = col[1];
        earthTex[i + 2] = col[2];
        earthTex[i + 3] = flags;
        cloudTex[pix] = cloudAlpha;
      }
    }

    const ES = 360, ER = 166, ECX = 180, ECY = 180;
    const earthCanvas = makeOffscreen(ES, ES);
    const earthImgData = earthCanvas.getContext("2d").createImageData(ES, ES);
    const earthLut = [];
    for (let y = 0; y < ES; y++) {
      const dy = y + 0.5 - ECY;
      for (let x = 0; x < ES; x++) {
        const dx = x + 0.5 - ECX;
        const dist = Math.hypot(dx, dy);
        if (dist > ER + 8) continue;
        const pixIdx = (y * ES + x) * 4;
        if (dist > ER) {
          const sunLit = clamp((-dx * 0.72 - dy * 0.35) / ER + 0.58, 0, 1);
          const rimFactor = clamp(1 - (dist - ER) / 8, 0, 1);
          const haloCol = mixRgb([28, 72, 145], [130, 202, 255], rimFactor * sunLit);
          earthImgData.data[pixIdx] = haloCol[0];
          earthImgData.data[pixIdx + 1] = haloCol[1];
          earthImgData.data[pixIdx + 2] = haloCol[2];
          earthImgData.data[pixIdx + 3] = Math.round(220 * rimFactor * (0.28 + sunLit * 0.72));
          continue;
        }
        const nx = dx / ER;
        const ny = dy / ER;
        const z = Math.sqrt(Math.max(0.001, 1 - nx * nx - ny * ny));
        const lon0 = Math.atan2(nx, z);
        const lat0 = Math.asin(clamp(ny, -1, 1));
        const sun = -nx * 0.76 - ny * 0.26 + z * 0.44;
        const texY = clamp(Math.floor(((lat0 / Math.PI) + 0.5) * (EH - 1)), 0, EH - 1);
        earthLut.push({
          pixIdx,
          texYOff: texY * EW,
          lonFrac: ((lon0 / (Math.PI * 2)) % 1 + 1) % 1,
          sun,
          rim: dist > ER - 5 ? smoothstep(ER - 5, ER, dist) * 0.52 : 0,
          edgeAlpha: dist > ER - 1.2 ? Math.round(clamp(ER - dist, 0, 1) * 255) : 255,
        });
      }
    }

    // Crisp World Continent Map (560x228)
    const worldMap = makeOffscreen(560, 228);
    {
      const g = worldMap.getContext("2d");
      g.fillStyle = "#08172b";
      g.fillRect(0, 0, 560, 228);
      g.strokeStyle = "rgba(38, 76, 128, 0.45)";
      g.lineWidth = 1;
      for (let gx = 40; gx < 560; gx += 40) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, 228); g.stroke(); }
      for (let gy = 38; gy < 228; gy += 38) { g.beginPath(); g.moveTo(0, gy); g.lineTo(560, gy); g.stroke(); }

      const polys = [
        [[36, 36], [116, 32], [140, 56], [116, 84], [88, 96], [64, 84], [44, 60]],
        [[144, 20], [176, 20], [172, 44], [148, 48]],
        [[96, 108], [132, 116], [144, 144], [124, 184], [108, 208], [96, 172], [88, 136]],
        [[236, 36], [300, 32], [308, 68], [268, 76], [240, 68]],
        [[244, 84], [308, 88], [328, 120], [300, 176], [276, 184], [256, 140], [232, 112]],
        [[304, 32], [476, 32], [496, 60], [464, 96], [424, 108], [380, 124], [352, 104], [312, 84]],
        [[492, 64], [508, 60], [504, 92], [488, 88]],
        [[428, 144], [488, 144], [496, 184], [452, 188], [428, 172]],
      ];
      g.fillStyle = "#1d4b7d";
      g.strokeStyle = "#4fa3eb";
      g.lineWidth = 1.6;
      polys.forEach((pts) => {
        g.beginPath();
        pts.forEach(([px, py], i) => (i === 0 ? g.moveTo(px, py) : g.lineTo(px, py)));
        g.closePath();
        g.fill();
        g.stroke();
      });
    }

    return { stars, nebula, jupiter, europa, moon, mars, earthTex, cloudTex, earthLut, earthCanvas, earthImgData, worldMap };
  })();

  // Silky 60fps Bilinear Smooth Earth Updater (~1ms per frame)
  function getEarthFrame(phase, cityGlow, threatPulse) {
    const { earthTex, cloudTex, earthLut, earthCanvas, earthImgData } = ASSETS;
    const d = earthImgData.data;
    const uShift = ((phase * 0.34) % 1 + 1) % 1;
    const cloudShift = ((phase * 0.49) % 1 + 1) % 1;
    const EW = 512;

    for (let i = 0; i < earthLut.length; i++) {
      const e = earthLut[i];
      const fx = ((e.lonFrac + uShift) % 1) * EW;
      const tx0 = fx | 0;
      const tx1 = (tx0 + 1) & 511;
      const f = fx - tx0;

      const t0 = (e.texYOff + tx0) * 4;
      const t1 = (e.texYOff + tx1) * 4;
      const flags = earthTex[t0 + 3];

      let r = earthTex[t0] + (earthTex[t1] - earthTex[t0]) * f;
      let g = earthTex[t0 + 1] + (earthTex[t1 + 1] - earthTex[t0 + 1]) * f;
      let b = earthTex[t0 + 2] + (earthTex[t1 + 2] - earthTex[t0 + 2]) * f;

      const cfx = ((e.lonFrac + cloudShift) % 1) * EW;
      const cx0 = cfx | 0;
      const cx1 = (cx0 + 1) & 511;
      const cf = cfx - cx0;
      const cldA = (cloudTex[e.texYOff + cx0] * (1 - cf) + cloudTex[e.texYOff + cx1] * cf) / 255;

      const sun = e.sun;
      const day = smoothstep(-0.18, 0.28, sun);

      // Subtle fire thermal glow on land when threat increases
      if (threatPulse > 0.05 && (flags & 1) && cldA < 0.35 && ((tx0 + e.texYOff) % 37 === 0)) {
        const tp = threatPulse * 0.85;
        r += (255 - r) * tp;
        g += (110 - g) * tp;
        b += (40 - b) * tp;
      }

      // Soft wispy clouds blended over day side
      if (cldA > 0.02) {
        const ca = cldA * 0.88;
        r += (244 - r) * ca;
        g += (248 - g) * ca;
        b += (253 - b) * ca;
      }

      // Sunset atmospheric golden-amber scatter band along terminator
      if (sun > -0.14 && sun < 0.24) {
        const tw = Math.sin(((sun + 0.14) / 0.38) * Math.PI) * 0.42;
        r += (232 - r) * tw;
        g += (132 - g) * tw;
        b += (68 - b) * tw;
      }

      // Night hemisphere shading + delicate city-light constellations
      if (day < 0.99) {
        const isLand = (flags & 1) !== 0;
        let nr = isLand ? 16 : 6;
        let ng = isLand ? 28 : 14;
        let nb = isLand ? 48 : 31;
        if (cldA > 0.04) {
          nr += cldA * 10;
          ng += cldA * 14;
          nb += cldA * 24;
        }
        if (cityGlow > 0 && (flags & 2) && cldA < 0.32) {
          const cg = cityGlow * (1 - cldA);
          nr += (255 - nr) * cg;
          ng += (216 - ng) * cg;
          nb += (118 - nb) * cg;
        }
        r = nr + (r - nr) * day;
        g = ng + (g - ng) * day;
        b = nb + (b - nb) * day;
      }

      // Atmospheric Rayleigh Fresnel rim scatter
      if (e.rim > 0) {
        const ra = e.rim * (0.35 + 0.65 * day);
        r += (124 - r) * ra;
        g += (196 - g) * ra;
        b += (255 - b) * ra;
      }

      const p = e.pixIdx;
      d[p] = r | 0;
      d[p + 1] = g | 0;
      d[p + 2] = b | 0;
      d[p + 3] = e.edgeAlpha;
    }

    earthCanvas.getContext("2d").putImageData(earthImgData, 0, 0);
    return earthCanvas;
  }

  // -------------------------------------------------------------------------- Crisp Smooth 60fps Cinema Drawing Helpers
  function drawStars(g, tSec, speedX = 8, warp = 0) {
    for (const s of ASSETS.stars) {
      const sx = (((s.x - tSec * speedX * s.layer) % VW) + VW) % VW;
      const sy = s.y;
      const tw = 0.65 + 0.35 * Math.sin(tSec * 2.4 + s.phase);
      g.globalAlpha = clamp(tw, 0.2, 1);
      g.fillStyle = s.col;
      if (warp > 0.15) {
        const len = Math.max(2, warp * s.layer * 14);
        g.fillRect(sx, sy, len, Math.max(1.2, s.r));
      } else if (s.cross && tw > 0.72) {
        g.beginPath();
        g.arc(sx, sy, s.r, 0, Math.PI * 2);
        g.fill();
        g.fillRect(sx - s.r * 2.4, sy - 0.5, s.r * 4.8, 1);
        g.fillRect(sx - 0.5, sy - s.r * 2.4, 1, s.r * 4.8);
      } else {
        g.beginPath();
        g.arc(sx, sy, s.r * 0.75, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  function drawSatellite(g, x, y, tSec, opts = {}) {
    const scale = opts.scale || 1;
    const scanDown = !!opts.scanDown;
    const tilt = opts.tilt || 0;
    const dropout = !!opts.dropout;

    g.save();
    g.translate(x, y);
    if (tilt) g.rotate(tilt);
    g.scale(scale, scale);

    if (scanDown) {
      const beamGrad = g.createLinearGradient(0, 12, 0, 130);
      if (dropout && Math.sin(tSec * 16) > 0) {
        beamGrad.addColorStop(0, "rgba(255, 94, 77, 0.34)");
        beamGrad.addColorStop(1, "rgba(255, 94, 77, 0)");
      } else {
        beamGrad.addColorStop(0, dropout ? "rgba(255, 94, 77, 0.16)" : "rgba(111, 224, 236, 0.28)");
        beamGrad.addColorStop(1, "rgba(111, 224, 236, 0)");
      }
      g.fillStyle = beamGrad;
      g.beginPath();
      g.moveTo(0, 10);
      g.lineTo(-56, 130);
      g.lineTo(56, 130);
      g.closePath();
      g.fill();

      if (!dropout) {
        const pulse = (tSec * 45) % 105;
        g.strokeStyle = "rgba(255, 209, 102, 0.65)";
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(-pulse * 0.42, 16 + pulse);
        g.lineTo(pulse * 0.42, 16 + pulse);
        g.stroke();
      }
    }

    // Truss boom
    g.fillStyle = "#95a7bf";
    g.fillRect(-40, -1.5, 80, 3);

    // Solar wings with smooth metallic cobalt gradient & sweeping sun glint
    const glint = (tSec * 22) % 44;
    [-38, 14].forEach((wx) => {
      const sg = g.createLinearGradient(wx, -8, wx + 24, 8);
      sg.addColorStop(0, "#173d78");
      sg.addColorStop(0.5, "#2d6ac7");
      sg.addColorStop(1, "#1a468a");
      g.fillStyle = sg;
      g.fillRect(wx, -8, 24, 16);
      g.strokeStyle = "#6cb0f5";
      g.lineWidth = 1;
      g.strokeRect(wx, -8, 24, 16);
      g.strokeStyle = "rgba(111, 224, 236, 0.35)";
      for (let gx = 6; gx < 24; gx += 6) {
        g.beginPath(); g.moveTo(wx + gx, -8); g.lineTo(wx + gx, 8); g.stroke();
      }
      if (glint < 22) {
        g.fillStyle = "rgba(255,255,255,0.28)";
        g.fillRect(wx + glint, -7, 3, 14);
      }
    });

    // Gold Kapton MLI bus
    const bg = g.createLinearGradient(-10, -8, 10, 10);
    bg.addColorStop(0, "#ffd980");
    bg.addColorStop(0.5, "#e09f34");
    bg.addColorStop(1, "#a66d1a");
    g.fillStyle = bg;
    roundBox(g, -10, -8, 20, 18, 3);
    g.fill();
    g.strokeStyle = "#fff0bf";
    g.lineWidth = 0.8;
    g.stroke();

    // High-gain parabolic dish on top + optical sensor bottom
    g.strokeStyle = "#e6eef8";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, -16, 8, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
    g.fillStyle = "#172233";
    g.fillRect(-4, 9, 8, 5);
    g.fillStyle = "#6fe0ec";
    g.beginPath();
    g.arc(0, 12, 2.2, 0, Math.PI * 2);
    g.fill();

    // Beacon light
    if (Math.sin(tSec * 6) > 0) {
      g.fillStyle = dropout ? "#ff5240" : "#7ad160";
      g.beginPath();
      g.arc(6, -9, 1.8, 0, Math.PI * 2);
      g.fill();
    }

    g.restore();
  }

  function drawEngineer(g, x, y, tSec, opts = {}) {
    const sc = opts.scale || 1;
    const coat = opts.coat || "#2c4163";
    const skin = opts.skin || "#d9a57c";
    const hair = opts.hair || "#1c1f2b";
    const sway = Math.sin(tSec * 2.6 + x * 0.05) * 1.4;
    const point = opts.point && Math.sin(tSec * 2.2) > 0;

    g.save();
    g.translate(x, y);
    g.scale(sc, sc);

    // Torso / blazer shoulders
    g.fillStyle = coat;
    roundBox(g, -11, 12, 22, 24, 5);
    g.fill();
    // Shirt collar + tie
    g.fillStyle = "#edf2fa";
    g.beginPath();
    g.moveTo(-4, 12); g.lineTo(4, 12); g.lineTo(0, 24);
    g.closePath();
    g.fill();
    g.fillStyle = "#e0a342";
    g.fillRect(-1.2, 14, 2.4, 9);

    // Smooth head + hair
    g.fillStyle = skin;
    g.beginPath();
    g.arc(0, 5, 6.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = hair;
    g.beginPath();
    g.arc(0, 3.2, 7.0, Math.PI * 0.92, Math.PI * 2.08);
    g.fill();

    if (opts.headset) {
      g.strokeStyle = "#8ca1bd";
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(0, 4.5, 7.6, Math.PI, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#ffd166";
      g.fillRect(4, 7, 3.5, 1.5);
    }

    // Gesture / typing arm
    g.strokeStyle = coat;
    g.lineWidth = 4;
    g.lineCap = "round";
    g.beginPath();
    if (point) {
      g.moveTo(8, 17);
      g.lineTo(22, 11 + sway);
    } else {
      g.moveTo(-9, 20);
      g.lineTo(-12, 28 + sway * 0.5);
      g.moveTo(9, 20);
      g.lineTo(12, 28 - sway * 0.5);
    }
    g.stroke();
    g.restore();
  }

  function drawPineSilhouette(g, x, baseY, h, col) {
    g.fillStyle = col;
    for (let t = 0; t < 3; t++) {
      const by = baseY - t * h * 0.25;
      const topY = by - h * (0.46 - t * 0.05);
      const hw = h * (0.28 - t * 0.055);
      g.beginPath();
      g.moveTo(x, topY);
      g.lineTo(x + hw, by);
      g.lineTo(x - hw, by);
      g.closePath();
      g.fill();
    }
  }

  function drawSoftSmoke(g, cx, cy, r, col) {
    const rg = g.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  }

  function drawFlameRibbon(g, cx, baseY, height, width, phase) {
    const sway1 = Math.sin(phase * 5.2) * (width * 0.35);
    const sway2 = Math.cos(phase * 7.1) * (width * 0.25);

    const fg = g.createLinearGradient(cx, baseY - height, cx, baseY);
    fg.addColorStop(0, "rgba(255, 210, 90, 0.92)");
    fg.addColorStop(0.45, "rgba(255, 118, 40, 0.92)");
    fg.addColorStop(1, "rgba(210, 46, 20, 0.95)");

    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(cx - width * 0.5, baseY);
    g.quadraticCurveTo(cx - width * 0.45 + sway2, baseY - height * 0.55, cx + sway1, baseY - height);
    g.quadraticCurveTo(cx + width * 0.45 - sway2, baseY - height * 0.55, cx + width * 0.5, baseY);
    g.closePath();
    g.fill();

    // Inner bright core
    g.fillStyle = "rgba(255, 240, 160, 0.85)";
    g.beginPath();
    g.moveTo(cx - width * 0.24, baseY);
    g.quadraticCurveTo(cx + sway1 * 0.5, baseY - height * 0.58, cx + width * 0.24, baseY);
    g.closePath();
    g.fill();
  }

  function drawHudBadge(g, text, x, y, col = "#ffd166") {
    g.save();
    g.font = "600 12px Inter, system-ui, sans-serif";
    const tw = Math.ceil(g.measureText(text).width);
    const bx = clamp(x, 16, VW - tw - 42);
    g.fillStyle = "rgba(6, 13, 28, 0.82)";
    roundBox(g, bx, y, tw + 24, 26, 4);
    g.fill();
    g.fillStyle = col;
    g.fillRect(bx, y + 3, 3, 20);
    g.strokeStyle = "rgba(130, 178, 235, 0.32)";
    g.lineWidth = 1;
    roundBox(g, bx, y, tw + 24, 26, 4);
    g.stroke();
    g.fillStyle = col;
    g.fillText(text, bx + 12, y + 17);
    g.restore();
  }

  function drawGeodesicDome(g, cx, baseY, rx, ry, tint) {
    const dg = g.createLinearGradient(cx - rx, baseY - ry, cx + rx, baseY);
    dg.addColorStop(0, "#eef4fb");
    dg.addColorStop(0.65, "#b7c9de");
    dg.addColorStop(1, "#7c91ab");
    g.fillStyle = dg;
    g.beginPath();
    g.ellipse(cx, baseY, rx, ry, 0, Math.PI, Math.PI * 2);
    g.closePath();
    g.fill();

    g.strokeStyle = "rgba(90, 114, 145, 0.65)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(cx, baseY, rx * 0.55, ry, 0, Math.PI, Math.PI * 2);
    g.stroke();

    // Warm lit interior habitat bays
    g.fillStyle = tint || "#6fe0ec";
    roundBox(g, cx - rx * 0.52, baseY - ry * 0.38, rx * 0.4, 8, 2);
    g.fill();
    roundBox(g, cx + rx * 0.12, baseY - ry * 0.38, rx * 0.4, 8, 2);
    g.fill();

    // Airlock collar
    g.fillStyle = "#5b697d";
    g.fillRect(cx - rx - 14, baseY - 14, 15, 14);
    g.fillStyle = "#e0a342";
    g.fillRect(cx - rx - 9, baseY - 10, 4, 6);
  }

  function drawLaunchRocket(g, cx, baseY, ignitePower, tSec) {
    g.save();
    g.translate(cx, baseY);

    // Exhaust plume on ignition
    if (ignitePower > 0.05) {
      const fh = (36 + Math.sin(tSec * 45) * 6) * ignitePower;
      const fg = g.createRadialGradient(0, 6, 2, 0, fh * 0.6, fh * 1.4);
      fg.addColorStop(0, "rgba(255, 250, 210, 0.98)");
      fg.addColorStop(0.35, "rgba(255, 168, 56, 0.90)");
      fg.addColorStop(1, "rgba(255, 80, 20, 0)");
      g.fillStyle = fg;
      g.beginPath();
      g.arc(0, 14, fh * 1.15, 0, Math.PI * 2);
      g.fill();

      drawFlameRibbon(g, 0, fh + 6, fh, 16, tSec * 3.2);
    }

    // Main rocket body
    const rg = g.createLinearGradient(-8, 0, 8, 0);
    rg.addColorStop(0, "#b8c4d4");
    rg.addColorStop(0.5, "#f7f9fc");
    rg.addColorStop(1, "#9aa8bd");
    g.fillStyle = rg;
    g.fillRect(-7, -104, 14, 96);

    // Fairing nosecone
    g.beginPath();
    g.moveTo(-8, -104);
    g.quadraticCurveTo(-7, -126, 0, -134);
    g.quadraticCurveTo(7, -126, 8, -104);
    g.closePath();
    g.fill();

    // Interstage black band & US/Coalition gold stripe
    g.fillStyle = "#1c2433";
    g.fillRect(-7, -72, 14, 10);
    g.fillStyle = "#e0a342";
    g.fillRect(-7, -96, 14, 4);

    // Landing legs / engine bells
    g.fillStyle = "#323c4d";
    g.fillRect(-9, -8, 18, 6);
    g.restore();
  }

  // -------------------------------------------------------------------------- The 6 Cinematic Animated Scenes (78s Total)
  const PROLOGUE_SCENES = [
    // SCENE 01 — THE BLUE PLANET (10s)
    {
      num: "SCENE 01",
      title: "SCENE 01 — THE BLUE PLANET",
      duration: 10,
      subtitles: [
        [0.0, 0.34, "For centuries, we believed Earth's balance would never break."],
        [0.34, 0.66, "From orbit, the blue planet still looks peaceful."],
        [0.66, 1.01, "Yet beneath the clouds, the first warnings are already spreading."]
      ],
      draw(g, p, tSec) {
        g.drawImage(ASSETS.nebula, 0, 0);
        drawStars(g, tSec, 6);

        // Occasional smooth shooting star across upper cosmos
        if (p > 0.16 && p < 0.44) {
          const mp = (p - 0.16) / 0.28;
          const sx = lerp(860, 560, mp);
          const sy = lerp(42, 154, mp);
          const sg = g.createLinearGradient(sx, sy, sx + 38, sy - 14);
          sg.addColorStop(0, "rgba(255, 240, 190, 0.95)");
          sg.addColorStop(1, "rgba(255, 240, 190, 0)");
          g.strokeStyle = sg;
          g.lineWidth = 2;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 38, sy - 14); g.stroke();
        }

        const ease = smoothstep(0.0, 0.96, p);
        const scale = lerp(1.08, 1.88, ease);
        const ecx = lerp(VW * 0.56, VW * 0.52, ease);
        const ecy = lerp(VH * 0.54, VH * 0.78, ease);
        const threat = smoothstep(0.58, 0.96, p);
        const earthImg = getEarthFrame(p * 1.4, smoothstep(0.18, 0.82, p), threat);

        // Outer soft planetary atmospheric scatter bloom
        const dw = 280 * scale;
        const dh = 280 * scale;
        const atmo = g.createRadialGradient(ecx, ecy, dw * 0.41, ecx, ecy, dw * 0.56);
        atmo.addColorStop(0, "rgba(95, 178, 255, 0.28)");
        atmo.addColorStop(1, "rgba(95, 178, 255, 0)");
        g.fillStyle = atmo;
        g.beginPath();
        g.arc(ecx, ecy, dw * 0.56, 0, Math.PI * 2);
        g.fill();

        g.drawImage(earthImg, ecx - dw * 0.5, ecy - dh * 0.5, dw, dh);

        // Smooth curved orbital trajectory + primary recon satellite
        const s1 = smoothstep(0.04, 0.96, p);
        g.strokeStyle = "rgba(111, 224, 236, 0.28)";
        g.setLineDash([6, 6]);
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(80, 188);
        g.quadraticCurveTo(VW * 0.5, 42, 880, 188);
        g.stroke();
        g.setLineDash([]);

        const satX = lerp(80, 880, s1);
        const satY = lerp(188, 188, s1) - Math.sin(s1 * Math.PI) * 74;
        drawSatellite(g, satX, satY, tSec, { scanDown: p > 0.36, scale: 1.28, tilt: lerp(-0.22, 0.22, s1) });

        // Secondary high-orbit relay
        const s2 = smoothstep(0.22, 1.0, p);
        if (s2 > 0.02) {
          drawSatellite(g, lerp(820, 260, s2), lerp(395, 300, s2), tSec + 2, { scale: 0.85, tilt: 0.14 });
        }

        if (p > 0.62) {
          const al = smoothstep(0.62, 0.85, p);
          const pulse = 0.55 + 0.45 * Math.sin(tSec * 8);
          [
            [ecx - 64, ecy - 68, 20],
            [ecx + 72, ecy + 22, 16],
          ].forEach(([rx, ry, rr]) => {
            const rg = g.createRadialGradient(rx, ry, 2, rx, ry, rr * 1.4);
            rg.addColorStop(0, `rgba(255, 110, 60, ${0.5 * pulse})`);
            rg.addColorStop(1, "rgba(255, 110, 60, 0)");
            g.fillStyle = rg;
            g.beginPath(); g.arc(rx, ry, rr * 1.4, 0, Math.PI * 2); g.fill();
            g.strokeStyle = `rgba(255, 134, 84, ${0.75 * pulse})`;
            g.lineWidth = 1.6;
            g.beginPath(); g.arc(rx, ry, rr, 0, Math.PI * 2); g.stroke();
          });
          drawHudBadge(g, `THERMAL STRESS INDEX +${Math.round(al * 34)}%`, 24, 22, "#ff8b66");
        } else {
          drawHudBadge(g, "ORBITAL RECON · ALTITUDE 705 KM", 24, 22, "#9ec4ef");
        }

        if (p < 0.06) {
          g.fillStyle = `rgba(2, 5, 14, ${1 - p / 0.06})`;
          g.fillRect(0, 0, VW, VH);
        }
        if (p > 0.90) {
          const wp = (p - 0.90) / 0.10;
          g.fillStyle = `rgba(24, 12, 16, ${wp * 0.92})`;
          g.fillRect(0, 0, VW, VH);
        }
      }
    },

    // SCENE 02 — THE WARNING (12s) — Wildfire Valley -> Ocean Cyclone -> Coalition Operations
    {
      num: "SCENE 02",
      title: "SCENE 02 — THE WARNING",
      duration: 12,
      subtitles: [
        [0.0, 0.36, "Across every continent, megafires, extreme storms, and severe droughts are straining our lifeline networks."],
        [0.36, 0.70, "Even our best satellites are hitting dangerous blind spots in coverage and communications."],
        [0.70, 1.01, "Scientists agree: humanity can no longer rely on a single fragile vantage point."]
      ],
      draw(g, p, tSec) {
        if (p < 0.36) {
          // SEQUENCE A: Smooth Wildfire Mountain Valley, Tapered Flame Ribbons, Glowing Embers & Lake Reflection
          const sp = p / 0.36;
          const sky = g.createLinearGradient(0, 0, 0, VH);
          sky.addColorStop(0, "#140914");
          sky.addColorStop(0.55, "#7d2d1d");
          sky.addColorStop(1, "#2b110d");
          g.fillStyle = sky;
          g.fillRect(0, 0, VW, VH);

          const pan = sp * 75;
          // Smooth multi-layered mountain silhouettes
          ["#24111a", "#38181c"].forEach((mCol, layer) => {
            g.fillStyle = mCol;
            g.beginPath();
            g.moveTo(0, VH);
            for (let x = 0; x <= VW; x += 24) {
              const baseH = layer === 0 ? 155 : 98;
              const mh = baseH + Math.sin((x + pan * (0.3 + layer * 0.35)) * 0.015) * 44 + Math.cos((x + pan * 0.4) * 0.036) * 18;
              g.lineTo(x, VH - 125 - mh);
            }
            g.lineTo(VW, VH);
            g.closePath();
            g.fill();
          });

          // Distant firewatch tower on right ridge
          const twx = 816 - pan * 0.4;
          g.fillStyle = "#180d10";
          g.fillRect(twx, 290, 5, 56);
          g.fillRect(twx + 18, 290, 5, 56);
          g.fillRect(twx - 4, 274, 32, 16);
          g.fillStyle = Math.sin(tSec * 8) > 0 ? "#ff5e4d" : "#ffd166";
          g.beginPath(); g.arc(twx + 12, 268, 3.5, 0, Math.PI * 2); g.fill();

          // Soft volumetric drifting smoke clouds
          for (let i = 0; i < 16; i++) {
            const sx = ((i * 84 - pan + tSec * 28) % (VW + 160)) - 80;
            const sy = 320 - ((tSec * 42 + i * 38) % 250);
            const r = 28 + (i % 4) * 12;
            drawSoftSmoke(g, sx, sy, r, sy < 170 ? "rgba(56, 44, 52, 0.42)" : "rgba(155, 76, 42, 0.36)");
          }

          // Foreground slope & rippling lake reflecting firelight
          const fireFront = lerp(240, VW - 60, sp);
          g.fillStyle = "#121a12";
          g.fillRect(0, 352, VW, 76);

          const lakeG = g.createLinearGradient(0, 428, 0, VH);
          lakeG.addColorStop(0, "#152236");
          lakeG.addColorStop(1, "#0b1322");
          g.fillStyle = lakeG;
          g.fillRect(0, 428, VW, VH - 428);

          // Shimmering firelight water ripples
          for (let i = 0; i < 36; i++) {
            const rx = (i * 29 + Math.sin(tSec * 3 + i) * 10) % VW;
            if (rx > fireFront + 40) continue;
            const ry = 436 + ((i * 19) % 90);
            const rw = 16 + Math.sin(tSec * 4 + i) * 8;
            g.fillStyle = i % 2 === 0 ? "rgba(255, 168, 68, 0.28)" : "rgba(255, 98, 42, 0.22)";
            roundBox(g, rx, ry, Math.max(6, rw), 2.5, 1);
            g.fill();
          }

          // Evergreen silhouettes & smooth flickering flame ribbons
          for (let i = 0; i < 48; i++) {
            const tx = ((i * 22 - (pan % 22)) + VW + 40) % (VW + 40) - 20;
            const th = 52 + ((i * 13) % 38);
            const burning = tx < fireFront;
            const charred = tx < fireFront - 390;
            drawPineSilhouette(
              g,
              tx,
              368 + (i % 3) * 5,
              th,
              charred ? "#1b1311" : burning ? "#421d14" : "#1b3620"
            );
            if (burning && !charred && i % 2 === 0) {
              const fh = 34 + Math.sin(tSec * 9 + i * 1.4) * 14 + (i % 3) * 8;
              drawFlameRibbon(g, tx, 372, fh, 18 + (i % 4) * 3, tSec + i);
            }
          }

          // Smooth rising embers
          for (let e = 0; e < 45; e++) {
            const ex = (e * 74 + Math.sin(tSec * 2 + e) * 28 + tSec * 45) % VW;
            const ey = 410 - ((tSec * 68 + e * 39) % 330);
            g.fillStyle = e % 2 === 0 ? "rgba(255, 214, 102, 0.85)" : "rgba(255, 118, 56, 0.82)";
            g.beginPath(); g.arc(ex, ey, 1.6, 0, Math.PI * 2); g.fill();
          }

          drawSatellite(g, lerp(110, 790, sp), 82, tSec, { scanDown: true, scale: 1.05 });
          drawHudBadge(g, "WILDFIRE FRONT · THERMAL RECON", 24, 22, "#ff9966");
        } else if (p < 0.70) {
          // SEQUENCE B: Super-Storm Ocean Swells, Branching Lightning & Satellite Blind Spot
          const sp = (p - 0.36) / 0.34;
          const flash = Math.sin(tSec * 14) > 0.90;
          const sky = g.createLinearGradient(0, 0, 0, VH);
          sky.addColorStop(0, flash ? "#3c5e8c" : "#071224");
          sky.addColorStop(0.65, flash ? "#29466e" : "#112645");
          sky.addColorStop(1, "#08162b");
          g.fillStyle = sky;
          g.fillRect(0, 0, VW, VH);

          for (let c = 0; c < 15; c++) {
            const cx = ((c * 88 - tSec * 48) % (VW + 180)) - 90;
            const cy = 62 + (c % 3) * 28;
            drawSoftSmoke(g, cx, cy, 56, flash ? "rgba(96, 134, 184, 0.55)" : "rgba(26, 48, 82, 0.65)");
          }

          if (flash) {
            g.strokeStyle = "#f4fbff";
            g.lineWidth = 2.6;
            g.beginPath();
            let lx = 528;
            g.moveTo(lx, 108);
            for (let ly = 128; ly <= 368; ly += 24) {
              lx += Math.sin(ly * 0.3 + tSec * 20) * 16;
              g.lineTo(lx, ly);
            }
            g.stroke();
          }

          // Wind-tilted rain sheets
          g.strokeStyle = "rgba(158, 196, 239, 0.36)";
          g.lineWidth = 1.2;
          g.beginPath();
          for (let r = 0; r < 72; r++) {
            const rx = ((r * 47 - tSec * 220) % VW + VW) % VW;
            const ry = (r * 37 + tSec * 390) % 380;
            g.moveTo(rx, ry);
            g.lineTo(rx - 5, ry + 16);
          }
          g.stroke();

          // Smooth bezier multi-layer storm waves
          [
            { y: 368, amp: 11, spd: 2.2, col: "#0f2e52", foam: "rgba(130, 188, 232, 0.5)" },
            { y: 404, amp: 14, spd: 2.9, col: "#143d6b", foam: "rgba(184, 220, 247, 0.6)" },
            { y: 448, amp: 16, spd: 3.6, col: "#0b2442", foam: "rgba(223, 240, 252, 0.7)" },
          ].forEach((wl) => {
            g.fillStyle = wl.col;
            g.beginPath();
            g.moveTo(0, VH);
            for (let wx = 0; wx <= VW; wx += 12) {
              const wy = wl.y + Math.sin(wx * 0.022 + tSec * wl.spd) * wl.amp;
              g.lineTo(wx, wy);
            }
            g.lineTo(VW, VH);
            g.closePath();
            g.fill();

            g.strokeStyle = wl.foam;
            g.lineWidth = 1.6;
            g.beginPath();
            for (let wx = 0; wx <= VW; wx += 12) {
              const wy = wl.y + Math.sin(wx * 0.022 + tSec * wl.spd) * wl.amp;
              if (wx === 0) g.moveTo(wx, wy);
              else g.lineTo(wx, wy);
            }
            g.stroke();
          });

          // Tactical Satellite Blind Spot Overlay
          const bsX = 330, bsY = 122, bsW = 300, bsH = 246;
          g.fillStyle = "rgba(255, 94, 77, 0.14)";
          roundBox(g, bsX, bsY, bsW, bsH, 6);
          g.fill();
          g.strokeStyle = Math.sin(tSec * 10) > 0 ? "#ff5e4d" : "#ffd166";
          g.lineWidth = 1.8;
          g.setLineDash([8, 6]);
          roundBox(g, bsX, bsY, bsW, bsH, 6);
          g.stroke();
          g.setLineDash([]);
          g.font = "600 13px Inter, system-ui, sans-serif";
          g.fillStyle = "#ff9e8f";
          g.fillText("LOS // TELEMETRY BLIND SPOT", bsX + 46, bsY + 224);

          drawSatellite(g, lerp(150, 740, sp), 64, tSec, { scanDown: true, scale: 0.95, dropout: true });
          drawHudBadge(g, "COMMS DROPOUT · COVERAGE GAP DETECTED", 24, 22, "#ff6b5b");
        } else {
          // SEQUENCE C: Parched Lakebed -> Glass-Walled Climate Operations Room
          const sp = (p - 0.70) / 0.30;
          const blend = smoothstep(0.08, 0.46, sp);

          const sky = g.createLinearGradient(0, 0, 0, VH);
          sky.addColorStop(0, "#1c1522");
          sky.addColorStop(0.55, "#75472c");
          sky.addColorStop(1, "#3d2618");
          g.fillStyle = sky;
          g.fillRect(0, 0, VW, VH);

          const sunG = g.createRadialGradient(740, 180, 12, 740, 180, 90);
          sunG.addColorStop(0, "rgba(255, 200, 120, 0.55)");
          sunG.addColorStop(1, "rgba(255, 160, 80, 0)");
          g.fillStyle = sunG;
          g.beginPath(); g.arc(740, 180, 90, 0, Math.PI * 2); g.fill();

          g.fillStyle = "#7a5336";
          g.fillRect(0, 336, VW, 204);

          const roomY = lerp(VH, 58, blend);
          g.fillStyle = "#0b172c";
          roundBox(g, 48, roomY, VW - 96, VH - roomY + 10, 8);
          g.fill();
          g.strokeStyle = "#4874ad";
          g.lineWidth = 2;
          g.stroke();

          const mapX = 192, mapY = roomY + 52;
          g.drawImage(ASSETS.worldMap, mapX, mapY, 576, 236);
          g.strokeStyle = "#2b4f7d";
          g.strokeRect(mapX, mapY, 576, 236);

          const pulse = 0.5 + 0.5 * Math.sin(tSec * 8);
          [
            [mapX + 90, mapY + 64],
            [mapX + 286, mapY + 114],
            [mapX + 436, mapY + 84],
          ].forEach(([hx, hy]) => {
            const rg = g.createRadialGradient(hx, hy, 2, hx, hy, 28);
            rg.addColorStop(0, `rgba(255, 86, 64, ${0.85 * pulse})`);
            rg.addColorStop(1, "rgba(255, 86, 64, 0)");
            g.fillStyle = rg;
            g.beginPath(); g.arc(hx, hy, 28, 0, Math.PI * 2); g.fill();
          });

          drawHudBadge(g, "COALITION ASSESSMENT · SINGLE-ORBIT LIMIT", 72, roomY + 16, "#ffd166");
          drawEngineer(g, 270, roomY + 312, tSec, { coat: "#354d73", point: true, headset: true, scale: 1.2 });
          drawEngineer(g, 444, roomY + 316, tSec + 1.2, { coat: "#5a3d31", hair: "#cfc7b8", scale: 1.2 });
          drawEngineer(g, 602, roomY + 312, tSec + 2.4, { coat: "#2c3b55", skin: "#9a6848", headset: true, scale: 1.2 });
          drawEngineer(g, 746, roomY + 316, tSec + 0.7, { coat: "#3b5243", hair: "#2b201c", scale: 1.2 });
        }
      }
    },

    // SCENE 03 — THE LAST SIGNAL (13s)
    {
      num: "SCENE 03",
      title: "SCENE 03 — THE LAST SIGNAL",
      duration: 13,
      subtitles: [
        [0.0, 0.35, "Then, in late 2026, deep-space listening stations locked onto an unexplained transmission."],
        [0.35, 0.72, "Every 72 minutes, a structured 1.420 GHz pulse repeats from the direction of Jupiter."],
        [0.72, 1.01, "Researchers gave it one name: The Last Signal."]
      ],
      draw(g, p, tSec) {
        g.drawImage(ASSETS.nebula, 0, 0);
        drawStars(g, tSec, 4);

        // Luminous Jupiter + 4 Galilean moons parked cleanly high upper-right
        const jupX = 780, jupY = lerp(34, 16, smoothstep(0, 0.45, p));
        const jupG = g.createRadialGradient(jupX + 66, jupY + 66, 20, jupX + 66, jupY + 66, 98);
        jupG.addColorStop(0, "rgba(232, 182, 124, 0.22)");
        jupG.addColorStop(1, "rgba(232, 182, 124, 0)");
        g.fillStyle = jupG;
        g.beginPath(); g.arc(jupX + 66, jupY + 66, 98, 0, Math.PI * 2); g.fill();
        g.drawImage(ASSETS.jupiter, jupX, jupY, 132, 132);

        g.strokeStyle = "rgba(158, 196, 239, 0.25)";
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(jupX - 96, jupY + 86); g.lineTo(jupX + 132, jupY + 86); g.stroke();
        g.fillStyle = "#e8c476";
        g.beginPath(); g.arc(jupX - 20, jupY + 86, 3, 0, Math.PI * 2); g.fill();
        g.drawImage(ASSETS.europa, jupX - 60, jupY + 69, 34, 34);
        g.strokeStyle = `rgba(111, 224, 236, ${0.4 + 0.45 * Math.sin(tSec * 6)})`;
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(jupX - 43, jupY + 86, 22, 0, Math.PI * 2); g.stroke();

        // Smooth desert mountain twilight silhouette
        g.fillStyle = "#0a1324";
        g.beginPath();
        g.moveTo(0, VH);
        for (let x = 0; x <= VW; x += 24) {
          g.lineTo(x, VH - 68 - Math.sin(x * 0.012) * 22 - Math.cos(x * 0.03) * 10);
        }
        g.lineTo(VW, VH);
        g.closePath();
        g.fill();

        // Secondary dish + red warning beacon tower
        g.fillStyle = "#1a2b4a";
        g.fillRect(284, 392, 16, 56);
        g.beginPath(); g.arc(292, 386, 22, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
        g.fillStyle = "#2b426b";
        g.fillRect(56, 268, 4, 168);
        g.fillStyle = Math.sin(tSec * 4) > 0 ? "#ff4733" : "#4a1714";
        g.beginPath(); g.arc(58, 264, 4, 0, Math.PI * 2); g.fill();

        // Foreground 70m Lattice DSN Telescope
        const aim = smoothstep(0.0, 0.35, p);
        const dishX = 168, dishY = 356;
        g.strokeStyle = "#2b446e";
        g.lineWidth = 3;
        g.strokeRect(dishX - 32, dishY + 38, 64, 106);
        g.beginPath();
        g.moveTo(dishX - 32, dishY + 38); g.lineTo(dishX + 32, dishY + 92);
        g.moveTo(dishX + 32, dishY + 38); g.lineTo(dishX - 32, dishY + 92);
        g.stroke();
        g.fillStyle = "#101b2e";
        g.fillRect(dishX - 26, dishY + 102, 52, 42);
        g.fillStyle = "#ffd166";
        g.fillRect(dishX - 18, dishY + 114, 14, 10);
        g.fillRect(dishX + 4, dishY + 114, 14, 10);

        g.save();
        g.translate(dishX, dishY);
        g.rotate(lerp(-0.24, -0.72, aim));
        g.strokeStyle = "#e3ecf7";
        g.lineWidth = 6;
        g.beginPath();
        g.arc(0, -48, 64, Math.PI * 0.18, Math.PI * 0.82);
        g.stroke();
        g.strokeStyle = "#8aaee0";
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(-36, -6); g.lineTo(0, -52); g.lineTo(36, -6);
        g.stroke();
        g.fillStyle = Math.sin(tSec * 6) > 0 ? "#6fe0ec" : "#ffd166";
        g.beginPath(); g.arc(0, -54, 4.5, 0, Math.PI * 2); g.fill();
        g.restore();

        // Smooth curved radio wavefront arcs traveling from Jupiter to telescope dish
        for (let w = 0; w < 6; w++) {
          const f = (tSec * 0.42 + w / 6) % 1;
          const wx = lerp(jupX - 24, dishX + 24, f);
          const wy = lerp(jupY + 86, dishY - 36, f);
          g.strokeStyle = `rgba(111, 224, 236, ${(1 - f * 0.72) * 0.88})`;
          g.lineWidth = 2.4;
          g.beginPath();
          g.arc(wx, wy, 14 + f * 10, Math.PI * 0.7, Math.PI * 1.3);
          g.stroke();
        }

        // Sleek Dual-Pane Signal Analyzer Suite
        const monVis = smoothstep(0.20, 0.38, p);
        if (monVis > 0.02) {
          const mx = 330, my = lerp(VH, 212, monVis), mw = 600, mh = 300;
          g.fillStyle = "rgba(6, 15, 30, 0.92)";
          roundBox(g, mx, my, mw, mh, 8);
          g.fill();
          g.strokeStyle = "#4874ad";
          g.lineWidth = 2;
          g.stroke();

          // Left pane: smooth FFT Waterfall Spectrogram
          const wfX = mx + 20, wfY = my + 92, wfW = 168, wfH = 144;
          g.fillStyle = "#040b17";
          roundBox(g, wfX, wfY, wfW, wfH, 4);
          g.fill();
          g.strokeStyle = "#25446b";
          g.stroke();
          for (let row = 4; row < wfH - 4; row += 4) {
            const age = (row + Math.floor(tSec * 36)) % 120;
            const pulseRow = age < 16 || (age > 24 && age < 40) || (age > 48 && age < 64);
            g.fillStyle = pulseRow ? "rgba(255, 209, 102, 0.88)" : "rgba(88, 183, 201, 0.25)";
            g.fillRect(wfX + 78, wfY + row, 10, 2.5);
            g.fillStyle = "rgba(88, 183, 201, 0.14)";
            g.fillRect(wfX + 34 + ((row * 9 + Math.floor(tSec * 12)) % 48), wfY + row, 12, 1.5);
          }

          // Right pane: crisp smooth glowing vector oscilloscope
          const oscX = mx + 204, oscY = my + 92, oscW = 376, oscH = 144;
          g.fillStyle = "#040b17";
          roundBox(g, oscX, oscY, oscW, oscH, 4);
          g.fill();
          g.strokeStyle = "#25446b";
          g.stroke();

          g.strokeStyle = "#10243d";
          g.lineWidth = 1;
          for (let gx = oscX + 36; gx < oscX + oscW; gx += 36) { g.beginPath(); g.moveTo(gx, oscY); g.lineTo(gx, oscY + oscH); g.stroke(); }
          for (let gy = oscY + 36; gy < oscY + oscH; gy += 36) { g.beginPath(); g.moveTo(oscX, gy); g.lineTo(oscX + oscW, gy); g.stroke(); }

          const waveY = oscY + 72;
          g.lineWidth = 2.4;
          g.beginPath();
          for (let x = oscX + 8; x <= oscX + oscW - 8; x += 2) {
            const cyclePos = (x + tSec * 140) % 164;
            const isTriplePulse =
              (cyclePos >= 28 && cyclePos <= 40) ||
              (cyclePos >= 52 && cyclePos <= 64) ||
              (cyclePos >= 76 && cyclePos <= 88);
            const amp = isTriplePulse
              ? Math.sin(x * 0.34 - tSec * 18) * 48
              : Math.sin(x * 0.09 + tSec * 4) * 6;
            if (x === oscX + 8) g.moveTo(x, waveY + amp);
            else g.lineTo(x, waveY + amp);
          }
          g.strokeStyle = p > 0.48 ? "#ffd166" : "#58b7c9";
          g.stroke();

          g.font = "600 13px Silkscreen, monospace";
          g.fillStyle = "#ffd166";
          g.fillText("FREQUENCY: 1.420 GHz", mx + 22, my + 30);
          g.fillStyle = "#6fe0ec";
          g.fillText("CYCLE: 00:72:00", mx + 22, my + 54);
          const locked = p > 0.48;
          g.fillStyle = locked ? (Math.sin(tSec * 8) > 0 ? "#7ad160" : "#ffd166") : "#e0a342";
          g.fillText(locked ? "LOCK: DETERMINISTIC PULSE" : "ACQUIRING CARRIER...", mx + 22, my + 78);
          g.font = "600 12px Inter, system-ui, sans-serif";
          g.fillStyle = "#f4efe2";
          g.fillText("ORIGIN AZIMUTH: JUPITER SECTOR", mx + 22, my + 272);

          if (p > 0.60) {
            drawEngineer(g, 766, my + mh - 48, tSec, { coat: "#2c3b55", headset: true, point: true, scale: 1.05 });
            drawEngineer(g, 858, my + mh - 44, tSec + 1.4, { coat: "#455c7a", hair: "#cfc9bf", scale: 1.05 });
          }
        }
      }
    },

    // SCENE 04 — THE COALITION (13s)
    {
      num: "SCENE 04",
      title: "SCENE 04 — THE COALITION",
      duration: 13,
      subtitles: [
        [0.0, 0.34, "Faced with crisis at home and a mystery beyond, space agencies united as the Horizon Coalition."],
        [0.34, 0.72, "Their shared goal: build an interplanetary network to protect Earth and trace the signal's source."],
        [0.72, 1.01, "That mission became Project Genesis."]
      ],
      draw(g, p, tSec) {
        const bg = g.createLinearGradient(0, 0, 0, VH);
        bg.addColorStop(0, "#050d1c");
        bg.addColorStop(1, "#0d1f3a");
        g.fillStyle = bg;
        g.fillRect(0, 0, VW, VH);

        const panX = lerp(-32, 0, smoothstep(0, 0.35, p));
        const hubs = [
          { x: 36 + panX, lbl: "PASADENA", tz: "UTC-8" },
          { x: 264 + panX, lbl: "DARMSTADT", tz: "UTC+1" },
          { x: 492 + panX, lbl: "TSUKUBA", tz: "UTC+9" },
          { x: 720 + panX, lbl: "BENGALURU", tz: "UTC+5" },
        ];
        hubs.forEach((h, i) => {
          const on = p * 4 >= i * 0.55;
          g.fillStyle = on ? "#102442" : "#0a162b";
          roundBox(g, h.x, 20, 208, 84, 6);
          g.fill();
          g.strokeStyle = on ? "#58b7c9" : "#274166";
          g.lineWidth = 1.6;
          g.stroke();

          g.font = "600 13px Silkscreen, monospace";
          g.fillStyle = on ? "#ffd166" : "#6b88ab";
          g.fillText(h.lbl, h.x + 14, 46);
          g.fillStyle = "#9ec4ef";
          g.fillText(h.tz, h.x + 132, 46);

          // Smooth equalizer bars
          for (let b = 0; b < 9; b++) {
            const bh = 8 + Math.abs(Math.sin(tSec * 4.5 + b * 0.8 + i)) * 22;
            g.fillStyle = on ? "#6fe0ec" : "#2c4669";
            roundBox(g, h.x + 16 + b * 14, 92 - bh, 8, bh, 2);
            g.fill();
          }
        });

        const mapX = 36, mapY = 124, mapW = 712, mapH = 272;
        g.fillStyle = "#061224";
        roundBox(g, mapX, mapY, mapW, mapH, 6);
        g.fill();
        g.drawImage(ASSETS.worldMap, mapX + 8, mapY + 8, mapW - 16, mapH - 16);
        g.strokeStyle = "#4874ad";
        g.lineWidth = 1.8;
        roundBox(g, mapX, mapY, mapW, mapH, 6);
        g.stroke();

        // Smooth curved great-circle relay arcs & gliding data packets
        const stations = [
          [156, 196], [376, 184], [536, 240], [652, 208], [648, 324], [232, 304]
        ];
        const linkProgress = smoothstep(0.12, 0.62, p);
        stations.forEach((a, i) => {
          const b = stations[(i + 1) % stations.length];
          const mx = (a[0] + b[0]) * 0.5;
          const my = (a[1] + b[1]) * 0.5 - 24;
          if (linkProgress > 0.05) {
            g.strokeStyle = `rgba(111, 224, 236, ${0.42 * linkProgress})`;
            g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(a[0], a[1]);
            g.quadraticCurveTo(mx, my, b[0], b[1]);
            g.stroke();

            const pt = (tSec * 0.45 + i * 0.18) % 1;
            const px = (1 - pt) ** 2 * a[0] + 2 * (1 - pt) * pt * mx + pt ** 2 * b[0];
            const py = (1 - pt) ** 2 * a[1] + 2 * (1 - pt) * pt * my + pt ** 2 * b[1];
            g.fillStyle = "#ffd166";
            g.beginPath(); g.arc(px, py, 3.5, 0, Math.PI * 2); g.fill();
          }
          g.fillStyle = "#ffd166";
          g.beginPath(); g.arc(a[0], a[1], 4.5, 0, Math.PI * 2); g.fill();
        });

        // Right-side Solar System Architecture Ladder
        const ladX = 768, ladY = 124, ladW = 156, ladH = 272;
        g.fillStyle = "#091830";
        roundBox(g, ladX, ladY, ladW, ladH, 6);
        g.fill();
        g.strokeStyle = "#e0a342";
        g.lineWidth = 1.8;
        g.stroke();
        g.font = "600 12px Silkscreen, monospace";
        g.fillStyle = "#9ec4ef";
        g.fillText("OUTWARD", ladX + 28, ladY + 26);
        [
          [ladX + 38, ladY + 236, "#3b7ec7", "EARTH"],
          [ladX + 38, ladY + 192, "#b9c4d4", "MOON"],
          [ladX + 38, ladY + 148, "#9c8b7a", "BELT"],
          [ladX + 38, ladY + 104, "#c96240", "MARS"],
          [ladX + 38, ladY + 60, "#e0a342", "JUPITER"]
        ].forEach(([nx, ny, nc, lbl], idx) => {
          const lit = p * 5 >= idx;
          if (idx > 0 && p > 0.3) {
            g.strokeStyle = "rgba(255, 209, 102, 0.5)";
            g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(nx, ny + 8); g.lineTo(nx, ny + 36); g.stroke();
          }
          g.fillStyle = lit ? nc : "#283e5e";
          g.beginPath(); g.arc(nx, ny, 7, 0, Math.PI * 2); g.fill();
          g.font = "600 11px Silkscreen, monospace";
          g.fillStyle = lit ? "#f4efe2" : "#51698a";
          g.fillText(lbl, nx + 18, ny + 4);
        });

        if (p > 0.64) {
          const chAlpha = smoothstep(0.64, 0.85, p);
          g.fillStyle = `rgba(7, 15, 30, ${0.93 * chAlpha})`;
          roundBox(g, 124, 204, 536, 112, 8);
          g.fill();
          g.strokeStyle = `rgba(255, 209, 102, ${chAlpha})`;
          g.lineWidth = 2;
          g.stroke();
          g.font = "600 14px Silkscreen, monospace";
          g.fillStyle = `rgba(111, 224, 236, ${chAlpha})`;
          g.fillText("HORIZON COALITION CHARTER", 206, 240);
          g.font = "700 24px Silkscreen, monospace";
          g.fillStyle = `rgba(255, 209, 102, ${chAlpha})`;
          g.fillText("PROJECT GENESIS", 232, 286);
        }

        // Foreground Briefing Table & Coalition Directors
        g.fillStyle = "#162a47";
        g.fillRect(68, 436, VW - 136, 104);
        g.fillStyle = "#c98a27";
        g.fillRect(68, 436, VW - 136, 3);
        const badges = ["NASA", "ESA", "JAXA", "ISRO", "CSA"];
        [192, 336, 480, 624, 768].forEach((sx, idx) => {
          g.fillStyle = "#58b7c9";
          roundBox(g, sx - 20, 424, 40, 8, 2);
          g.fill();
          drawEngineer(g, sx, 392, tSec + idx, {
            coat: ["#3a4b3c", "#2c3b55", "#3d6fa8", "#4b5a3a", "#2c3b55"][idx],
            skin: ["#8d5a3b", "#d9a57c", "#e3c19c", "#c99a74", "#efd2bd"][idx],
            point: idx === 2 && p > 0.42,
            headset: idx % 2 === 0,
            scale: 1.05
          });
          g.font = "600 11px Silkscreen, monospace";
          g.fillStyle = "#9ec4ef";
          g.fillText(badges[idx], sx - 18, 476);
        });
      }
    },

    // SCENE 05 — PROJECT GENESIS (17s) — Smooth Outward Planetary Odyssey
    {
      num: "SCENE 05",
      title: "SCENE 05 — PROJECT GENESIS",
      duration: 17,
      subtitles: [
        [0.0, 0.16, "Step by step, humanity set out to expand beyond low Earth orbit."],
        [0.16, 0.30, "First, guard our home world from space."],
        [0.30, 0.44, "Next, assemble permanent orbital hubs."],
        [0.44, 0.58, "Return to the Moon for deep-space staging."],
        [0.58, 0.72, "Survey asteroids for fuel and materials."],
        [0.72, 0.86, "Establish resilient outposts on Mars."],
        [0.86, 1.01, "And cross the frontier into deep space."]
      ],
      draw(g, p, tSec) {
        g.drawImage(ASSETS.nebula, 0, 0);
        drawStars(g, tSec, 72, 0.45);

        const worldX = p * 4680;

        // Luminous golden trajectory curve across cosmic vista
        g.strokeStyle = "rgba(255, 209, 102, 0.35)";
        g.setLineDash([8, 8]);
        g.lineWidth = 2;
        g.beginPath();
        for (let sx = 0; sx <= VW; sx += 16) {
          const wx = sx + worldX;
          const wy = 270 + Math.sin(wx * 0.0035) * 64;
          if (sx === 0) g.moveTo(sx, wy);
          else g.lineTo(sx, wy);
        }
        g.stroke();
        g.setLineDash([]);

        // 01 Earth Grid
        {
          const ex = 320 - worldX * 0.9;
          if (ex > -500 && ex < VW + 480) {
            const eImg = getEarthFrame(p * 1.1, 0.45, 0);
            g.drawImage(eImg, ex - 220, 172, 440, 440);
            drawSatellite(g, ex - 48, 124, tSec, { scanDown: true, scale: 1.05 });
            drawSatellite(g, ex + 148, 148, tSec + 1, { scanDown: true, scale: 0.9 });
            drawLaunchRocket(g, ex - 150, 310 - p * 140, 1, tSec);
            drawHudBadge(g, "01 EARTH OBSERVATION GRID", ex - 130, 34, "#79bdff");
          }
        }

        // 02 Modular Orbital Hub
        {
          const ox = 1280 - worldX;
          if (ox > -360 && ox < VW + 360) {
            g.fillStyle = "#7a8da6";
            g.fillRect(ox - 168, 256, 336, 12);
            // Radiators
            g.fillStyle = "#dce6f2";
            g.fillRect(ox - 56, 188, 20, 64);
            g.fillRect(ox + 36, 188, 20, 64);
            // Core module
            const mg = g.createLinearGradient(ox - 40, 228, ox - 40, 296);
            mg.addColorStop(0, "#eef3fa");
            mg.addColorStop(1, "#9aa9bd");
            g.fillStyle = mg;
            roundBox(g, ox - 40, 228, 80, 68, 6);
            g.fill();
            g.fillStyle = "#6fe0ec";
            roundBox(g, ox - 24, 242, 48, 14, 3);
            g.fill();
            g.fillStyle = "#ffd166";
            roundBox(g, ox - 10, 268, 20, 14, 3);
            g.fill();

            // Photovoltaic arrays with moving specular glint
            const glint = (tSec * 50) % 108;
            [ox - 148, ox - 104, ox + 72, ox + 116].forEach((wx) => {
              [136, 278].forEach((wy) => {
                g.fillStyle = "#173c75";
                g.fillRect(wx, wy, 32, 112);
                g.fillStyle = "#2b65bd";
                g.fillRect(wx + 3, wy + 3, 26, 106);
                g.strokeStyle = "#5ba0eb";
                g.lineWidth = 1;
                for (let gy = wy + 16; gy < wy + 106; gy += 16) {
                  g.beginPath(); g.moveTo(wx + 3, gy); g.lineTo(wx + 29, gy); g.stroke();
                }
                if (glint < 92) {
                  g.fillStyle = "rgba(255,255,255,0.22)";
                  g.fillRect(wx + 3, wy + glint, 26, 10);
                }
              });
            });

            // Docking crew vehicle
            const sx = ox - 144 + Math.sin(tSec * 2.1) * 10;
            g.fillStyle = "#f4efe2";
            roundBox(g, sx, 248, 36, 18, 4);
            g.fill();
            if (Math.sin(tSec * 10) > 0) {
              g.fillStyle = "rgba(169, 232, 255, 0.8)";
              g.beginPath(); g.arc(sx - 6, 257, 4, 0, Math.PI * 2); g.fill();
            }
            drawHudBadge(g, "02 ORBITAL HUB", ox - 70, 52, "#9ec4ef");
          }
        }

        // 03 Return to the Moon — Shackleton Polar Ridge & Descending Lander
        {
          const mx = 2240 - worldX;
          if (mx > -420 && mx < VW + 420) {
            g.drawImage(ASSETS.moon, mx + 56, 92, 150, 150);
            g.fillStyle = "#6c7687";
            g.beginPath();
            g.moveTo(mx - 340, VH);
            for (let rx = -340; rx <= 340; rx += 20) {
              g.lineTo(mx + rx, 372 + (rx * rx) * 0.0012);
            }
            g.lineTo(mx + 340, VH);
            g.closePath();
            g.fill();

            drawGeodesicDome(g, mx + 88, 376, 44, 32, "#6fe0ec");
            g.fillStyle = "#b8c7db";
            g.fillRect(mx + 160, 292, 5, 88);
            g.fillStyle = "#2b63b8";
            g.fillRect(mx + 144, 292, 38, 28);

            const lBob = Math.sin(tSec * 3.2) * 9;
            const lx = mx - 88, ly = 264 + lBob;
            drawFlameRibbon(g, lx, ly + 46, 28, 12, tSec * 4);
            g.fillStyle = "#e0a342";
            roundBox(g, lx - 20, ly - 10, 40, 24, 4);
            g.fill();
            g.fillStyle = "#d9e6f7";
            roundBox(g, lx - 12, ly - 28, 24, 18, 4);
            g.fill();
            g.strokeStyle = "#9ba6b8";
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(lx - 18, ly + 14); g.lineTo(lx - 26, ly + 28);
            g.moveTo(lx + 18, ly + 14); g.lineTo(lx + 26, ly + 28);
            g.stroke();
            drawHudBadge(g, "03 SHACKLETON BASE", mx - 94, 52, "#f4efe2");
          }
        }

        // 04 Survey the Asteroids
        {
          const ax = 3080 - worldX;
          if (ax > -360 && ax < VW + 360) {
            g.save();
            g.translate(ax + 92, 272);
            g.rotate(tSec * 0.25);
            g.fillStyle = "#6e6155";
            g.beginPath();
            const pts = 14;
            for (let i = 0; i < pts; i++) {
              const a = (i / pts) * Math.PI * 2;
              const rr = 76 * (0.78 + 0.18 * Math.sin(i * 2.7) + 0.08 * Math.cos(i * 4.1));
              const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.78;
              if (i === 0) g.moveTo(px, py);
              else g.lineTo(px, py);
            }
            g.closePath();
            g.fill();
            g.strokeStyle = "#9c8d7e";
            g.lineWidth = 2;
            g.stroke();
            g.restore();

            drawSatellite(g, ax - 108, 252, tSec, { scale: 1.15 });
            g.fillStyle = Math.sin(tSec * 8) > 0 ? "rgba(111, 224, 236, 0.26)" : "rgba(255, 209, 102, 0.22)";
            g.beginPath();
            g.moveTo(ax - 88, 252);
            g.lineTo(ax + 48, 204);
            g.lineTo(ax + 48, 328);
            g.closePath();
            g.fill();
            drawHudBadge(g, "04 ASTEROID BELT SURVEY", ax - 104, 52, "#ffd166");
          }
        }

        // 05 Establish a Presence on Mars
        {
          const rmx = 3920 - worldX;
          if (rmx > -400 && rmx < VW + 400) {
            g.drawImage(ASSETS.mars, rmx - 65, 96, 130, 130);
            g.fillStyle = "#9e462a";
            g.beginPath();
            g.moveTo(rmx - 280, VH);
            for (let rx = -280; rx <= 280; rx += 20) {
              g.lineTo(rmx + rx, 372 + (rx * rx) * 0.0022);
            }
            g.lineTo(rmx + 280, VH);
            g.closePath();
            g.fill();

            drawGeodesicDome(g, rmx - 88, 378, 48, 34, "#ffd166");
            const rvx = rmx + 28 + Math.sin(tSec * 1.4) * 28;
            g.fillStyle = "#e6ded1";
            roundBox(g, rvx, 346, 48, 16, 3);
            g.fill();
            g.fillStyle = "#e0a342";
            g.fillRect(rvx - 8, 350, 8, 10);
            [rvx + 8, rvx + 24, rvx + 40].forEach((wx) => {
              g.fillStyle = "#2b2520";
              g.beginPath(); g.arc(wx, 368, 6.5, 0, Math.PI * 2); g.fill();
            });
            g.fillStyle = "#f4efe2";
            g.fillRect(rvx + 36, 328, 4, 18);
            g.fillStyle = "#6fe0ec";
            g.beginPath(); g.arc(rvx + 40, 326, 3, 0, Math.PI * 2); g.fill();

            drawSatellite(g, rmx + 112, 152, tSec + 2, { scanDown: true, scale: 0.95 });
            drawHudBadge(g, "05 MARS EXPEDITION", rmx - 86, 52, "#ff9966");
          }
        }

        // 06 Deep Space Arrival — Jupiter, Europa & Horizon Flagship
        {
          const jx = 4910 - worldX;
          if (jx > -440 && jx < VW + 440) {
            const jupG = g.createRadialGradient(jx + 110, 228, 30, jx + 110, 228, 170);
            jupG.addColorStop(0, "rgba(232, 182, 124, 0.24)");
            jupG.addColorStop(1, "rgba(232, 182, 124, 0)");
            g.fillStyle = jupG;
            g.beginPath(); g.arc(jx + 110, 228, 170, 0, Math.PI * 2); g.fill();

            g.drawImage(ASSETS.jupiter, jx, 118, 220, 220);
            g.drawImage(ASSETS.europa, jx - 84, 294, 72, 72);

            g.strokeStyle = `rgba(111, 224, 236, ${0.28 + 0.25 * Math.sin(tSec * 5)})`;
            g.lineWidth = 2;
            g.beginPath();
            g.arc(jx + 110, 228, 146, Math.PI * 0.65, Math.PI * 1.35);
            g.stroke();

            // Sleek Deep-Space Horizon Flagship with ion xenon exhaust glow
            const fx = jx - 244;
            const fy = 264 + Math.sin(tSec * 2.2) * 8;
            const ionG = g.createLinearGradient(fx - 76, fy + 14, fx, fy + 14);
            ionG.addColorStop(0, "rgba(111, 224, 236, 0)");
            ionG.addColorStop(1, "rgba(169, 242, 250, 0.95)");
            g.fillStyle = ionG;
            g.beginPath();
            g.moveTo(fx, fy + 8);
            g.lineTo(fx - 76, fy + 14);
            g.lineTo(fx, fy + 20);
            g.closePath();
            g.fill();

            // RTG fins glowing amber-red
            g.fillStyle = "#3e4a5e";
            g.fillRect(fx + 4, fy - 32, 22, 28);
            g.fillRect(fx + 4, fy + 34, 22, 28);
            g.fillStyle = "#e06138";
            g.fillRect(fx + 12, fy - 28, 5, 20);
            g.fillRect(fx + 12, fy + 38, 5, 20);

            // Gold cryo bus
            const fg = g.createLinearGradient(fx, fy, fx + 48, fy + 30);
            fg.addColorStop(0, "#ffe08a");
            fg.addColorStop(1, "#b87a24");
            g.fillStyle = fg;
            roundBox(g, fx, fy, 48, 30, 5);
            g.fill();

            // Parabolic high-gain mesh dish + magnetometer boom
            g.strokeStyle = "#f4efe2";
            g.lineWidth = 5;
            g.beginPath();
            g.arc(fx + 38, fy + 15, 28, -Math.PI * 0.42, Math.PI * 0.42);
            g.stroke();
            g.strokeStyle = "#9ec4ef";
            g.lineWidth = 2.5;
            g.beginPath(); g.moveTo(fx + 52, fy + 15); g.lineTo(fx + 96, fy + 15); g.stroke();
            g.fillStyle = "#ffd166";
            g.beginPath(); g.arc(fx + 98, fy + 15, 4, 0, Math.PI * 2); g.fill();

            drawHudBadge(g, "06 DEEP SPACE · JUPITER / EUROPA", jx - 210, 40, "#6fe0ec");
          }
        }
      }
    },

    // SCENE 06 — FINAL SCENE: YOUR ASSIGNMENT (13s)
    {
      num: "FINAL SCENE",
      title: "FINAL SCENE — YOUR ASSIGNMENT",
      duration: 13,
      subtitles: [
        [0.0, 0.34, "Every mission begins right here at the engineering desk."],
        [0.34, 0.72, "Every orbit, sensor, battery, and gram of fuel decides whether a spacecraft survives."],
        [0.72, 1.01, "Welcome to Project Genesis, Engineer."]
      ],
      draw(g, p, tSec) {
        const push = smoothstep(0.65, 0.98, p);
        g.save();
        if (push > 0) {
          const z = lerp(1, 1.14, push);
          g.translate(VW * 0.5, VH * 0.45);
          g.scale(z, z);
          g.translate(-VW * 0.5, -VH * 0.45);
        }

        g.fillStyle = "#081224";
        g.fillRect(0, 0, VW, VH);
        drawStars(g, tSec, 3);

        // Engineering Terminal Frame (Left-Center)
        const monX = 48, monY = 40, monW = 572, monH = 376;
        g.fillStyle = "#2b2520";
        roundBox(g, monX - 10, monY - 10, monW + 20, monH + 20, 10);
        g.fill();
        g.fillStyle = "#08182e";
        roundBox(g, monX, monY, monW, monH, 6);
        g.fill();

        const power = smoothstep(0.05, 0.22, p);
        if (power > 0.05) {
          g.strokeStyle = "#122c4f";
          g.lineWidth = 1;
          for (let gx = monX + 36; gx < monX + monW; gx += 36) { g.beginPath(); g.moveTo(gx, monY + 42); g.lineTo(gx, monY + monH); g.stroke(); }
          for (let gy = monY + 48; gy < monY + monH; gy += 36) { g.beginPath(); g.moveTo(monX + 10, gy); g.lineTo(monX + monW - 10, gy); g.stroke(); }

          [
            ["ΔV", 0.82, "#6fe0ec"],
            ["PWR", 0.74, "#ffd166"],
            ["MASS", 0.58, "#7ad160"],
          ].forEach(([lbl, val, col], bi) => {
            const by = monY + 80 + bi * 44;
            g.font = "600 12px Silkscreen, monospace";
            g.fillStyle = "#9ec4ef";
            g.fillText(lbl, monX + 24, by);
            g.fillStyle = "#0f223d";
            roundBox(g, monX + 24, by + 8, 96, 12, 3);
            g.fill();
            g.fillStyle = col;
            roundBox(g, monX + 24, by + 8, Math.max(4, 96 * val * power), 12, 3);
            g.fill();
          });

          // 1.420 GHz carrier line upper-right
          g.strokeStyle = "rgba(111, 224, 236, 0.72)";
          g.lineWidth = 1.8;
          g.beginPath();
          for (let wx = monX + 360; wx <= monX + monW - 20; wx += 3) {
            const amp = Math.sin(wx * 0.22 - tSec * 8) * (Math.abs(((wx + tSec * 36) % 88) - 44) < 14 ? 16 : 3);
            if (wx === monX + 360) g.moveTo(wx, monY + 84 + amp);
            else g.lineTo(wx, monY + 84 + amp);
          }
          g.stroke();

          // Unfolding Spacecraft CAD Schematic
          const unfold = smoothstep(0.20, 0.65, p);
          const bx = monX + 316, by = monY + 188;
          const busG = g.createLinearGradient(bx - 32, by - 32, bx + 32, by + 32);
          busG.addColorStop(0, "#ffe08a");
          busG.addColorStop(1, "#b87a24");
          g.fillStyle = busG;
          roundBox(g, bx - 32, by - 32, 64, 64, 6);
          g.fill();

          const wingW = lerp(16, 128, unfold);
          g.fillStyle = "#a2b2c7";
          g.fillRect(bx - 44 - wingW, by - 2, 88 + wingW * 2, 4);
          [-wingW - 40, 40].forEach((offsetX) => {
            g.fillStyle = "#1a4282";
            roundBox(g, bx + offsetX, by - 20, wingW, 40, 3);
            g.fill();
            g.strokeStyle = "#5ba0eb";
            g.lineWidth = 1.2;
            g.stroke();
          });

          if (unfold > 0.38) {
            g.strokeStyle = "#f4efe2";
            g.lineWidth = 5;
            g.beginPath();
            g.arc(bx, by - 22, 34, Math.PI * 1.18, Math.PI * 1.82);
            g.stroke();
            g.fillStyle = "#6fe0ec";
            roundBox(g, bx - 10, by + 36, 20, 14, 3);
            g.fill();
          }

          g.font = "600 13px Silkscreen, monospace";
          g.fillStyle = "#ffd166";
          g.fillText("PROJECT GENESIS · DOSSIER 01", monX + 24, monY + 30);
          g.fillStyle = "#9ec4ef";
          g.fillText("ORBIT · POWER · PAYLOAD · DELTA-V", monX + 28, monY + monH - 18);

          if (p > 0.66) {
            g.fillStyle = "rgba(244, 239, 226, 0.96)";
            roundBox(g, monX + 68, monY + 272, 436, 40, 5);
            g.fill();
            g.strokeStyle = "#a8322a";
            g.lineWidth = 2;
            g.stroke();
            g.font = "700 14px Silkscreen, monospace";
            g.fillStyle = "#a8322a";
            g.fillText("STATUS: ASSIGNED TO ENGINEER", monX + 104, monY + 297);
          }
        }

        // Right Observation Window: Searchlights, Lattice Launch Tower & Smooth Rocket Ignition
        const rx = 652, ry = 40, rw = 260, rh = 376;
        g.fillStyle = p > 0.72 ? "#1f1512" : "#060e1c";
        roundBox(g, rx, ry, rw, rh, 6);
        g.fill();
        g.strokeStyle = "#c98a27";
        g.lineWidth = 2;
        g.stroke();

        // Sweeping searchlight cones
        const beamX = rx + 130 + Math.sin(tSec * 1.6) * 64;
        g.fillStyle = "rgba(255, 224, 148, 0.08)";
        g.beginPath();
        g.moveTo(rx + 56, ry + 292);
        g.lineTo(beamX - 36, ry + 8);
        g.lineTo(beamX + 36, ry + 8);
        g.closePath();
        g.fill();

        g.fillStyle = "#202e20";
        g.fillRect(rx + 4, ry + 296, rw - 8, 76);

        // Steel lattice gantry tower
        g.strokeStyle = "#665c52";
        g.lineWidth = 2;
        g.strokeRect(rx + 58, ry + 124, 20, 172);
        for (let gy = ry + 124; gy < ry + 296; gy += 22) {
          g.beginPath();
          g.moveTo(rx + 58, gy); g.lineTo(rx + 78, gy + 22);
          g.moveTo(rx + 78, gy); g.lineTo(rx + 58, gy + 22);
          g.stroke();
        }
        g.fillStyle = Math.sin(tSec * 6) > 0 ? "#ff4030" : "#5a1a14";
        g.beginPath(); g.arc(rx + 68, ry + 114, 4, 0, Math.PI * 2); g.fill();

        // Soft drifting cryogenic vapor & ignition deluge steam clouds
        for (let c = 0; c < 5; c++) {
          const vx = rx + 162 + ((tSec * 30 + c * 32) % 80);
          const vy = ry + 258 - c * 20;
          drawSoftSmoke(g, vx, vy, 20 + c * 3, p > 0.68 ? "rgba(255, 210, 150, 0.34)" : "rgba(220, 236, 250, 0.22)");
        }
        drawLaunchRocket(g, rx + 150, ry + 294 - smoothstep(0.76, 0.99, p) * 32, smoothstep(0.66, 0.85, p), tSec);

        // Foreground Architect Desk, Warm Drafting Lamp & Lead Engineer
        g.fillStyle = "#1c1814";
        g.fillRect(0, 436, VW, 104);
        g.fillStyle = "#3d3328";
        g.fillRect(0, 430, VW, 6);

        const lampG = g.createRadialGradient(54, 405, 8, 54, 430, 120);
        lampG.addColorStop(0, "rgba(255, 214, 120, 0.25)");
        lampG.addColorStop(1, "rgba(255, 214, 120, 0)");
        g.fillStyle = lampG;
        g.beginPath(); g.arc(54, 420, 120, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#c98a27";
        roundBox(g, 36, 380, 36, 14, 4);
        g.fill();
        g.fillRect(50, 394, 8, 36);

        // Steaming coffee mug
        g.fillStyle = "#f4efe2";
        roundBox(g, 144, 412, 14, 18, 2);
        g.fill();

        drawEngineer(g, 572, 384, tSec, { coat: "#2c3b55", headset: true, point: p > 0.35 && p < 0.72, scale: 1.3 });
        g.restore();

        if (p > 0.94) {
          const fade = (p - 0.94) / 0.06;
          g.fillStyle = `rgba(4, 8, 18, ${fade * 0.72})`;
          g.fillRect(0, 0, VW, VH);
        }
      }
    }
  ];

  // -------------------------------------------------------------------------- Film Playback & Typewriter Subtitle Controller
  let rafId = null;
  let lastTs = 0;
  let totalTimeSec = 0;
  let sceneIdx = 0;
  let sceneProg = 0;
  let paused = false;
  let subtitlesOn = true;
  let timelineBuilt = false;

  // Typewriter reveal state per subtitle line
  let activeSubKey = "";
  let subElapsedSec = 0;
  let lastTickChar = 0;

  const totalSec = () => PROLOGUE_SCENES.reduce((a, s) => a + s.duration, 0);
  const elapsedSec = () => {
    let acc = 0;
    for (let i = 0; i < sceneIdx; i++) acc += PROLOGUE_SCENES[i].duration;
    return acc + (PROLOGUE_SCENES[sceneIdx] ? PROLOGUE_SCENES[sceneIdx].duration * sceneProg : 0);
  };
  const fmtTc = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  function ensureTimelineBuilt() {
    const tl = document.getElementById("prolTimeline");
    if (!tl || timelineBuilt) return;
    timelineBuilt = true;
    tl.innerHTML = PROLOGUE_SCENES.map((s, i) => `
      <button type="button" class="cq-prol-seg" data-ps="${i}" title="${s.title}" aria-label="Jump to ${s.title}">
        <span class="cq-prol-seg-fill"></span>
        <span class="cq-prol-seg-lbl">0${i + 1}</span>
      </button>
    `).join("");
    tl.querySelectorAll("[data-ps]").forEach((btn) => {
      btn.onclick = () => {
        PrologueAudio.unlock();
        sceneIdx = +btn.dataset.ps;
        sceneProg = 0;
        activeSubKey = "";
        const ov = document.getElementById("prolFinalOverlay");
        if (ov) ov.classList.add("hidden");
        updateHud(0);
        drawFrame();
      };
    });
  }

  // DOM-cached HUD updater so 60fps playback never thrashes CSS animations or Playwright paint stability
  let lastKickerText = "";
  let lastTitleText = "";
  let lastSubsState = null;
  let lastRenderedSlice = "";
  let lastShowCursor = null;
  let lastPlayLabel = "";
  let capTextEl = null;
  let capCursorEl = null;

  function ensureCaptionNodes(capEl) {
    if (!capTextEl || !capEl.contains(capTextEl)) {
      capEl.textContent = "";
      capTextEl = document.createElement("span");
      capTextEl.className = "cq-cap-text";
      capCursorEl = document.createElement("span");
      capCursorEl.className = "cq-cap-cursor";
      capCursorEl.setAttribute("aria-hidden", "true");
      capEl.appendChild(capTextEl);
      capEl.appendChild(capCursorEl);
      lastRenderedSlice = "";
      lastShowCursor = null;
    }
  }

  function updateHud(dtSec = 0) {
    const sc = PROLOGUE_SCENES[sceneIdx] || PROLOGUE_SCENES[0];
    const kickerText = `HORIZON COALITION · ${sc.num} / 06 · ${fmtTc(elapsedSec())} / ${fmtTc(totalSec())}`;
    if (kickerText !== lastKickerText) {
      lastKickerText = kickerText;
      const kicker = document.getElementById("prolSceneKicker");
      if (kicker) kicker.textContent = kickerText;
    }
    if (sc.title !== lastTitleText) {
      lastTitleText = sc.title;
      const titleEl = document.getElementById("prolTitle");
      if (titleEl) titleEl.textContent = sc.title;
    }

    let subIdx = 0;
    let subLine = sc.subtitles[0][2];
    for (let i = 0; i < sc.subtitles.length; i++) {
      const [a, b, txt] = sc.subtitles[i];
      if (sceneProg >= a && sceneProg <= b) {
        subIdx = i;
        subLine = txt;
        break;
      }
    }

    const key = `${sceneIdx}_${subIdx}`;
    if (key !== activeSubKey) {
      activeSubKey = key;
      subElapsedSec = reducedMotion() ? 99 : 0;
      lastTickChar = 0;
    } else if (!paused && subtitlesOn) {
      subElapsedSec += dtSec;
    }

    const capEl = document.getElementById("prolCaption");
    if (capEl) {
      ensureCaptionNodes(capEl);
      if (subtitlesOn !== lastSubsState) {
        lastSubsState = subtitlesOn;
        capEl.classList.toggle("subs-off", !subtitlesOn);
      }
      if (!subtitlesOn) {
        const offText = "Subtitles hidden — click Subtitles to restore narration.";
        if (lastRenderedSlice !== offText) {
          lastRenderedSlice = offText;
          capTextEl.textContent = offText;
        }
        if (lastShowCursor !== false) {
          lastShowCursor = false;
          capCursorEl.style.display = "none";
        }
      } else {
        const charsToShow = Math.min(subLine.length, Math.max(1, Math.floor(subElapsedSec * 52)));
        const typingDone = charsToShow >= subLine.length;

        if (!paused && dtSec > 0 && charsToShow > lastTickChar) {
          const ch = subLine[charsToShow - 1];
          if (ch && ch !== " " && charsToShow % 3 === 0) {
            PrologueAudio.playTypeTick();
          }
          lastTickChar = charsToShow;
        }

        const slice = subLine.slice(0, charsToShow);
        if (slice !== lastRenderedSlice) {
          lastRenderedSlice = slice;
          capTextEl.textContent = slice;
        }
        const showCursor = !typingDone && !paused;
        if (showCursor !== lastShowCursor) {
          lastShowCursor = showCursor;
          capCursorEl.style.display = showCursor ? "inline-block" : "none";
        }
      }
    }

    ensureTimelineBuilt();
    const segs = document.querySelectorAll("#prolTimeline .cq-prol-seg");
    segs.forEach((seg, i) => {
      seg.classList.toggle("on", i === sceneIdx);
      seg.classList.toggle("done", i < sceneIdx);
      const fill = seg.querySelector(".cq-prol-seg-fill");
      if (fill) {
        const pctFill = i < sceneIdx ? 100 : i === sceneIdx ? Math.round(sceneProg * 100) : 0;
        fill.style.width = `${pctFill}%`;
      }
    });

    const playLabel = (sceneIdx === PROLOGUE_SCENES.length - 1 && paused && sceneProg >= 0.99)
      ? "REPLAY"
      : (paused ? "PLAY" : "PAUSE");
    if (playLabel !== lastPlayLabel) {
      lastPlayLabel = playLabel;
      const playBtn = document.getElementById("prolPlayBtn");
      if (playBtn) playBtn.textContent = playLabel;
    }
  }

  function drawFrame() {
    const cv = document.getElementById("prologueCanvas");
    if (!cv) return;
    if (cv.width !== VW || cv.height !== VH) {
      cv.width = VW;
      cv.height = VH;
    }
    const g = cv.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    const sc = PROLOGUE_SCENES[sceneIdx] || PROLOGUE_SCENES[0];
    sc.draw(g, sceneProg, totalTimeSec);
  }

  function loop(ts) {
    rafId = null;
    const prolEl = document.getElementById("prologue");
    if (!prolEl || !prolEl.classList.contains("active")) {
      PrologueAudio.stop();
      return;
    }

    if (!lastTs) lastTs = ts;
    const dtSec = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;

    if (!paused) {
      totalTimeSec += dtSec;
      const sc = PROLOGUE_SCENES[sceneIdx] || PROLOGUE_SCENES[0];
      sceneProg += dtSec / Math.max(4, sc.duration);
      if (sceneProg >= 1) {
        if (sceneIdx < PROLOGUE_SCENES.length - 1) {
          sceneProg = 0;
          sceneIdx++;
          activeSubKey = "";
          if (typeof SFX !== "undefined") SFX.beep(false);
        } else {
          sceneProg = 1;
          paused = true;
          PrologueAudio.stop();
          const ov = document.getElementById("prolFinalOverlay");
          if (ov) ov.classList.remove("hidden");
          if (typeof SFX !== "undefined") SFX.chime();
        }
      }
      PrologueAudio.tick(sceneIdx, sceneProg, totalTimeSec, paused);
      updateHud(dtSec);
      drawFrame();
    }

    if (!paused) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function startRaf() {
    if (rafId != null) cancelAnimationFrame(rafId);
    lastTs = 0;
    PrologueAudio.unlock();
    if (!paused) PrologueAudio.start();
    rafId = requestAnimationFrame(loop);
  }

  function stopPrologue() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = 0;
    PrologueAudio.stop();
  }

  function openPrologue() {
    if (typeof show === "function") show("prologue");
    stopPrologue();
    sceneIdx = 0;
    sceneProg = 0;
    totalTimeSec = 0;
    activeSubKey = "";
    paused = reducedMotion();
    const ov = document.getElementById("prolFinalOverlay");
    if (ov) ov.classList.add("hidden");
    updateHud(0);
    drawFrame();
    if (!paused) startRaf();
  }

  function replayFilm() {
    sceneIdx = 0;
    sceneProg = 0;
    totalTimeSec = 0;
    activeSubKey = "";
    paused = false;
    const ov = document.getElementById("prolFinalOverlay");
    if (ov) ov.classList.add("hidden");
    updateHud(0);
    drawFrame();
    startRaf();
  }

  function replayCurrentScene() {
    sceneProg = 0;
    activeSubKey = "";
    paused = false;
    const ov = document.getElementById("prolFinalOverlay");
    if (ov) ov.classList.add("hidden");
    updateHud(0);
    drawFrame();
    startRaf();
  }

  function togglePlay() {
    if (sceneIdx === PROLOGUE_SCENES.length - 1 && paused && sceneProg >= 0.99) {
      replayFilm();
      return;
    }
    paused = !paused;
    updateHud(0);
    drawFrame();
    if (!paused) startRaf();
    else stopPrologue();
  }

  function prevScene() {
    const ov = document.getElementById("prolFinalOverlay");
    if (ov) ov.classList.add("hidden");
    sceneIdx = Math.max(0, sceneIdx - 1);
    sceneProg = 0;
    activeSubKey = "";
    updateHud(0);
    drawFrame();
    if (!paused) startRaf();
  }

  function nextScene() {
    if (sceneIdx < PROLOGUE_SCENES.length - 1) {
      sceneIdx++;
      sceneProg = 0;
      activeSubKey = "";
      const ov = document.getElementById("prolFinalOverlay");
      if (ov) ov.classList.add("hidden");
      updateHud(0);
      drawFrame();
      if (!paused) startRaf();
    } else {
      sceneProg = 1;
      paused = true;
      stopPrologue();
      const ov = document.getElementById("prolFinalOverlay");
      if (ov) ov.classList.remove("hidden");
      updateHud(0);
      drawFrame();
    }
  }

  function toggleSubtitles() {
    subtitlesOn = !subtitlesOn;
    const subBtn = document.getElementById("prolSubBtn");
    if (subBtn) subBtn.textContent = subtitlesOn ? "SUBTITLES: ON" : "SUBTITLES: OFF";
    updateHud(0);
  }

  window.PrologueFilm = {
    scenes: PROLOGUE_SCENES,
    open: openPrologue,
    stop: stopPrologue,
    replayFilm,
    replayCurrentScene,
    togglePlay,
    prevScene,
    nextScene,
    toggleSubtitles,
    getState: () => ({ sceneIdx, sceneProg, paused, subtitlesOn })
  };
  window.openPrologue = openPrologue;
  window.stopPrologue = stopPrologue;
})();
