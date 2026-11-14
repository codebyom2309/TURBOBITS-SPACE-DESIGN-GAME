// COSMO QUEST: Main menu environment, pixel-art banners, Story Campaign (Project Genesis),
// Prologue Film (The Last Signal), top bar modals, and live status bar.
"use strict";

(() => {
  const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------------------------------------------------------- Story Campaign Data
  const STORY_CHAPTERS = [
    {
      id: "ch1",
      num: "CHAPTER 01",
      title: "SILENT ORBIT",
      scenario: "wildfire",
      location: "Low Earth Orbit · Relay Calibration",
      speaker: "Dr. Elena Vance · Deep Space Network",
      look: { skin: "#d9a57c", skinD: "#b07f5a", hair: "#2b2018", hairStyle: "bun", coat: "#2c3b55", shirt: "#e9e3d6", glasses: true, badge: true },
      brief: [
        "In late 2026, Deep Space Network dishes picked up a faint 1.42 GHz carrier wave repeating every 72 minutes from the direction of Jupiter.",
        "Before we can isolate the deep-space signal, Earth's orbital relay and thermal-imaging fleet must be recalibrated. Launch a lean Earth observer to validate our telemetry chain."
      ],
      objective: "Design and fly an Earth-orbit thermal & optical observer with reliable daily downlink."
    },
    {
      id: "ch2",
      num: "CHAPTER 02",
      title: "LUNAR SHADOW",
      scenario: "lunar_ice",
      location: "Lunar South Pole · Relay Staging",
      speaker: "Dr. Mei Tanaka · Lunar Resources Office",
      look: { skin: "#e3c19c", skinD: "#b8957a", hair: "#16141a", hairStyle: "bun", coat: "#e8e4dc", shirt: "#3d6fa8", glasses: true },
      brief: [
        "Spectral analysis links the carrier harmonics to frozen water-ice signatures—and we need propellant staging on the Moon before any outer-system push.",
        "Survey the permanently shadowed polar craters for water ice and establish a high-latitude lunar relay node."
      ],
      objective: "Map polar lunar ice reserves in darkness and prove deep-cislunar communications."
    },
    {
      id: "ch3",
      num: "CHAPTER 03",
      title: "ECHO THROUGH THE DUST",
      scenario: "mars_climate",
      location: "Mars Orbit · Deep-Space Relay",
      speaker: "Dr. Luis Herrera · Planetary Climate Lab",
      look: { skin: "#c99a74", skinD: "#9e7454", hair: "#3b2a1e", hairStyle: "curly", coat: "#4b5a3a", shirt: "#e0d8c6", beard: true },
      brief: [
        "Earth's solar conjunctions keep interrupting our listening window. A high-gain relay orbiter at Mars will bridge the gap while profiling Martian storms.",
        "Prove our solar arrays, batteries, and Ka-band comms can survive weak sunlight and 2.5 AU signal loss."
      ],
      objective: "Deliver a long-duration Mars orbiter capable of autonomous storm tracking and deep-space relay."
    },
    {
      id: "ch4",
      num: "CHAPTER 04",
      title: "EYES BEYOND THE BELT",
      scenario: "exoplanet_hunter",
      location: "Sun-Earth L2 · Infrared Observatory",
      speaker: "Dr. Aisha Bello · Exoplanet Science Institute",
      look: { skin: "#7a4e34", skinD: "#5a3826", hair: "#1a1716", hairStyle: "bun", coat: "#3d3550", shirt: "#e9e3d6", glasses: true },
      brief: [
        "The carrier isn't random noise—its modulation points toward a sub-surface resonance matching Europa's icy shell, yet carries an interstellar signature.",
        "Station a precision infrared observatory at L2 to pinpoint the exact source coordinates in the Jovian system."
      ],
      objective: "Operate a cold, ultra-steady L2 infrared telescope without thermal or pointing drift."
    },
    {
      id: "ch5",
      num: "CHAPTER 05",
      title: "THE LAST SIGNAL",
      scenario: "europa",
      location: "Europa Orbit · Project Genesis Finale",
      speaker: "Dr. Ingrid Solberg · Outer Planets Program",
      look: { skin: "#efd2bd", skinD: "#c9a891", hair: "#d8c27a", hairStyle: "long", coat: "#2c3b55", shirt: "#e9e3d6", glasses: true, badge: true },
      brief: [
        "Everything we built leads here. At Jupiter, sunlight is 27 times weaker and radiation fries ordinary flight computers in weeks.",
        "Fly the Project Genesis flagship to Europa, survive Jupiter's radiation belts, sound the ice shell, and decode The Last Signal."
      ],
      objective: "Survive Jovian radiation and confirm the origin of the signal beneath Europa's ice."
    }
  ];

  // -------------------------------------------------------------------------- Custom Pixel Art Icons
  const CQ_ICONS = {
    gamepad: (r) => {
      r(3, 5, 10, 6, "#d9e6f7"); r(2, 6, 12, 5, "#d9e6f7");
      r(3, 11, 3, 2, "#b5c9e4"); r(10, 11, 3, 2, "#b5c9e4");
      r(4, 7, 3, 1, "#101c33"); r(5, 6, 1, 3, "#101c33");
      r(10, 7, 1, 1, "#d94f3d"); r(11, 8, 1, 1, "#e0a342");
    },
    bars: (r) => {
      r(2, 10, 2, 4, "#9ec4ef"); r(5, 7, 2, 7, "#9ec4ef");
      r(8, 4, 2, 10, "#e0a342"); r(11, 2, 2, 12, "#d9e6f7");
    },
    gear: (r) => {
      r(6, 2, 4, 12, "#d9e6f7"); r(2, 6, 12, 4, "#d9e6f7");
      r(4, 4, 8, 8, "#d9e6f7"); r(3, 3, 2, 2, "#9ec4ef"); r(11, 3, 2, 2, "#9ec4ef");
      r(3, 11, 2, 2, "#9ec4ef"); r(11, 11, 2, 2, "#9ec4ef");
      r(6, 6, 4, 4, "#0d192d");
    },
    info: (r) => {
      r(7, 3, 2, 2, "#f3ebd8");
      r(6, 6, 3, 1, "#f3ebd8"); r(7, 7, 2, 5, "#f3ebd8"); r(6, 12, 4, 1, "#f3ebd8");
    },
    crew: (r) => {
      // Three pixel astronauts/engineers
      r(7, 2, 2, 2, "#f3ebd8"); r(6, 4, 4, 1, "#f3ebd8"); r(5, 6, 6, 6, "#d9e6f7");
      r(3, 4, 2, 2, "#9ec4ef"); r(2, 7, 3, 5, "#6b8fb8");
      r(11, 4, 2, 2, "#9ec4ef"); r(11, 7, 3, 5, "#6b8fb8");
    },
    teamhub: (r) => {
      // Pixel mission complex + launch tower
      r(1, 13, 14, 2, "#354c73");
      r(2, 7, 5, 6, "#e0a342"); r(3, 9, 1, 2, "#fff1c2"); r(5, 9, 1, 2, "#fff1c2");
      r(8, 5, 6, 8, "#d9cfc1"); r(10, 7, 2, 2, "#354c73"); r(10, 10, 2, 3, "#e0a342");
      r(10, 1, 1, 4, "#9ec4ef"); r(9, 2, 3, 1, "#c94032");
    },
    trophy: (r) => {
      r(4, 2, 8, 6, "#e0a342"); r(5, 3, 6, 4, "#f7cf78");
      r(2, 3, 2, 3, "#c98b2c"); r(12, 3, 2, 3, "#c98b2c");
      r(6, 8, 4, 2, "#c98b2c"); r(7, 10, 2, 2, "#e0a342"); r(4, 12, 8, 2, "#e0a342");
    },
    book: (r) => {
      r(1, 3, 6, 10, "#e9dfc6"); r(9, 3, 6, 10, "#e9dfc6");
      r(7, 4, 2, 10, "#9ec4ef"); r(2, 13, 12, 1, "#4d77ad");
      r(3, 5, 3, 1, "#4d77ad"); r(3, 7, 3, 1, "#4d77ad"); r(3, 9, 3, 1, "#4d77ad");
      r(10, 5, 3, 1, "#4d77ad"); r(10, 7, 3, 1, "#4d77ad"); r(10, 9, 3, 1, "#4d77ad");
    },
    film: (r) => {
      r(2, 3, 12, 10, "#d9cfc1"); r(3, 4, 2, 1, "#101c33"); r(3, 6, 2, 1, "#101c33");
      r(3, 8, 2, 1, "#101c33"); r(3, 10, 2, 1, "#101c33");
      r(11, 4, 2, 1, "#101c33"); r(11, 6, 2, 1, "#101c33"); r(11, 8, 2, 1, "#101c33"); r(11, 10, 2, 1, "#101c33");
      r(6, 4, 4, 8, "#162a4a"); r(7, 6, 2, 4, "#e0a342");
    },
    play: (r) => {
      r(5, 3, 2, 10, "#0c182c"); r(7, 4, 2, 8, "#0c182c"); r(9, 5, 2, 6, "#0c182c"); r(11, 7, 1, 2, "#0c182c");
    }
  };

  function cqIconData(name) {
    if (!CQ_ICONS[name]) return "";
    return sprite(16, 16, CQ_ICONS[name]);
  }

  function hydrateIcons() {
    document.querySelectorAll("[data-cq-icon]").forEach((el) => {
      const k = el.dataset.cqIcon;
      if (CQ_ICONS[k]) el.src = cqIconData(k);
    });
  }

  // -------------------------------------------------------------------------- Full-Bleed Animated Space + Earth Horizon Background
  function cosmoBgScene(canvas) {
    if (!canvas) return () => {};
    const g = canvas.getContext("2d");
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const cw = Math.max(320, rect.width || window.innerWidth);
      const ch = Math.max(200, rect.height || window.innerHeight);
      const H = 220;
      const W = Math.max(130, Math.min(520, Math.round(H * (cw / ch))));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      g.imageSmoothingEnabled = false;
    }
    resizeCanvas();

    const rnd = _rng(2026);
    const starsList = [];
    for (let i = 0; i < 190; i++) {
      starsList.push({
        nx: rnd(),
        ny: rnd() * 0.78,
        layer: i < 100 ? 0 : i < 160 ? 1 : 2,
        phase: rnd() * 40,
        cross: i > 176,
        col: i % 9 === 0 ? "#f7d794" : i % 4 === 0 ? "#a9ccf5" : "#eef4ff"
      });
    }

    // Pre-render crisp planets
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 36; moonCanvas.height = 36;
    {
      const mg = moonCanvas.getContext("2d");
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
        const dx = x - 17.5, dy = y - 17.5, d = Math.hypot(dx, dy);
        if (d > 15.5) continue;
        const lit = (-dx * 0.65 - dy * 0.45) / 15.5;
        let col = lit > 0.35 ? "#c5cdd9" : lit > -0.1 ? "#8a95a8" : lit > -0.45 ? "#545e73" : "#252d40";
        const crater = ((x - 12) ** 2 + (y - 13) ** 2 < 10) || ((x - 21) ** 2 + (y - 19) ** 2 < 6) || ((x - 15) ** 2 + (y - 24) ** 2 < 5);
        if (crater && lit > -0.35) col = lit > 0.2 ? "#94a0b3" : "#444d61";
        mg.fillStyle = col; mg.fillRect(x, y, 1, 1);
      }
    }

    const jupiterCanvas = document.createElement("canvas");
    jupiterCanvas.width = 84; jupiterCanvas.height = 84;
    {
      const jg = jupiterCanvas.getContext("2d");
      for (let y = 0; y < 84; y++) for (let x = 0; x < 84; x++) {
        const dx = x - 41.5, dy = y - 41.5, d = Math.hypot(dx, dy);
        if (d > 39.5) continue;
        const band = Math.sin((y + Math.sin(x * 0.14) * 1.4) * 0.48);
        let col = band > 0.45 ? "#e8cfb2" : band > 0 ? "#cf986b" : band > -0.55 ? "#b06e46" : "#874d33";
        const shade = (-dx * 0.72 - dy * 0.35) / 39.5;
        if (shade < -0.42) col = "#2a2230";
        else if (shade < -0.12) col = _darken(col, 0.48);
        else if (d > 37 && shade > 0) col = "#f2dec4";
        jg.fillStyle = col; jg.fillRect(x, y, 1, 1);
      }
    }

    const meteors = [];
    let t = 0;

    function drawFrame() {
      const titleEl = document.getElementById("title");
      const storyEl = document.getElementById("story");
      const active = (titleEl && titleEl.classList.contains("active")) || (storyEl && storyEl.classList.contains("active"));
      if (!active || document.hidden) return;

      resizeCanvas();
      const W = canvas.width, H = canvas.height;
      const anim = !reducedMotion();
      if (anim) {
        t++;
        ptr.x += (ptr.tx - ptr.x) * 0.08;
        ptr.y += (ptr.ty - ptr.y) * 0.08;
      }

      // 1. Deep Midnight Sky Gradient
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#060d18");
      sky.addColorStop(0.55, "#0c1a30");
      sky.addColorStop(1, "#142a4b");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);

      // 2. Parallax Starfield
      for (const s of starsList) {
        const speed = s.layer === 0 ? 0.015 : s.layer === 1 ? 0.04 : 0.08;
        const pxOff = ptr.x * (s.layer + 1) * 1.4;
        const pyOff = ptr.y * (s.layer + 1) * 1.0;
        const sx = Math.floor((((s.nx * W - (anim ? t * speed : 0) + pxOff) % W) + W) % W);
        const sy = Math.floor(s.ny * H + pyOff);
        const tw = anim ? Math.sin(t * 0.08 + s.phase) : 0.5;
        if (s.layer === 0 && tw < -0.5) continue;
        g.fillStyle = s.col;
        if (s.cross && tw > 0.25) {
          g.fillRect(sx, sy, 1, 1);
          g.fillStyle = "rgba(238,244,255,0.45)";
          g.fillRect(sx - 1, sy, 1, 1); g.fillRect(sx + 1, sy, 1, 1);
          g.fillRect(sx, sy - 1, 1, 1); g.fillRect(sx, sy + 1, 1, 1);
        } else {
          g.fillRect(sx, sy, 1, 1);
        }
      }

      // Shooting stars
      if (anim && rnd() < 0.012 && meteors.length < 2) {
        meteors.push({ x: W * (0.2 + rnd() * 0.6), y: H * (0.06 + rnd() * 0.28), life: 24 });
      }
      for (const m of meteors) {
        for (let k = 0; k < 9; k++) {
          g.fillStyle = `rgba(243,235,216,${((1 - k / 9) * m.life) / 24})`;
          g.fillRect(Math.round(m.x - k * 2), Math.round(m.y - k * 0.8), 2, 1);
        }
        m.x += 3.2; m.y += 1.3; m.life--;
      }
      while (meteors.length && meteors[0].life <= 0) meteors.shift();

      // 3. Upper-Left Cratered Moon
      const narrow = W < 180;
      const moonX = Math.round((narrow ? 2 : W * 0.06) + ptr.x * 2.5);
      const moonY = Math.round(H * (narrow ? 0.12 : 0.11) + (anim ? Math.sin(t * 0.025) * 1.5 : 0) + ptr.y * 2);
      g.drawImage(moonCanvas, moonX, moonY);

      // 4. Upper-Right Banded Gas Giant + Small Moon
      const jupX = Math.round(W - (narrow ? 44 : 60) + ptr.x * 3.5);
      const jupY = Math.round(H * (narrow ? 0.02 : 0.04) + (anim ? Math.cos(t * 0.02) * 1.5 : 0) + ptr.y * 2.5);
      g.drawImage(jupiterCanvas, jupX, jupY);
      // Small orbiting moon beside Jupiter
      const smAng = anim ? t * 0.02 : 0.4;
      const smX = Math.round(jupX - 8 + Math.cos(smAng) * 3);
      const smY = Math.round(jupY + 46 + Math.sin(smAng) * 2);
      g.fillStyle = "#9aa7b8"; g.fillRect(smX, smY, 5, 5);
      g.fillStyle = "#cfd8e3"; g.fillRect(smX, smY, 3, 3);
      g.fillStyle = "#4d586b"; g.fillRect(smX + 3, smY + 2, 2, 3);

      // Soft dusk scrim on very narrow mobile viewports so hero typography keeps crisp contrast
      if (narrow) {
        const scrim = g.createLinearGradient(0, 42, 0, 95);
        scrim.addColorStop(0, "rgba(6, 13, 24, 0)");
        scrim.addColorStop(0.5, "rgba(6, 13, 24, 0.55)");
        scrim.addColorStop(1, "rgba(6, 13, 24, 0)");
        g.fillStyle = scrim;
        g.fillRect(0, 42, W, 53);
      }

      // 5. Mid-Left Orbiting Satellite & Dotted Orbital Arc (visibly cruising left margin)
      g.fillStyle = "rgba(130, 178, 235, 0.42)";
      for (let x = 2; x < Math.max(48, W * 0.22); x += 4) {
        const ay = Math.round(H * 0.37 - Math.sin(x * 0.04) * 5);
        g.fillRect(x, ay, 2, 1);
      }
      const satPhase = anim ? (Math.sin(t * 0.015) * 0.5 + 0.5) : 0.48;
      const satX = Math.round(Math.max(16, W * 0.035) + satPhase * Math.max(24, W * 0.11));
      const satY = Math.round(H * 0.36 - Math.sin(satX * 0.04) * 5);
      // Angled pixel solar wings + gold/cream bus
      g.fillStyle = "#24508f";
      g.fillRect(satX - 11, satY - 3, 7, 4); g.fillRect(satX - 9, satY - 4, 6, 3);
      g.fillRect(satX + 5, satY, 7, 4); g.fillRect(satX + 6, satY - 1, 6, 3);
      g.fillStyle = "#6cb0f5";
      g.fillRect(satX - 10, satY - 3, 5, 2); g.fillRect(satX + 6, satY, 5, 2);
      g.fillStyle = "#192d4f"; g.fillRect(satX - 4, satY - 1, 8, 2);
      g.fillStyle = "#d8a348"; g.fillRect(satX - 3, satY - 3, 7, 6);
      g.fillStyle = "#f3ebd8"; g.fillRect(satX - 1, satY - 2, 3, 3);
      g.fillStyle = "#9ec4ef"; g.fillRect(satX, satY - 6, 1, 3);
      if (!anim || t % 28 < 12) {
        g.fillStyle = "#e84a3c"; g.fillRect(satX + 2, satY - 4, 1, 1);
      }

      // 6. Curved Earth Horizon across the bottom third
      const R = Math.round(Math.max(270, W * 0.88));
      const ecx = Math.round(W * 0.5);
      const ecy = H + R - Math.round(H * 0.25);
      const cloudDrift = anim ? t * 0.18 : 12;

      const topY = Math.max(0, ecy - R - 5);
      for (let y = topY; y < H; y++) {
        const dy = y + 0.5 - ecy;
        const maxDx = Math.sqrt(Math.max(0, (R + 4) * (R + 4) - dy * dy));
        const xStart = Math.max(0, Math.floor(ecx - maxDx));
        const xEnd = Math.min(W, Math.ceil(ecx + maxDx));
        for (let x = xStart; x < xEnd; x++) {
          const d = Math.hypot(x + 0.5 - ecx, dy);
          if (d > R + 4) continue;
          let col;
          if (d > R) {
            col = d > R + 2.8 ? "#1b386b" : d > R + 1.5 ? "#4284d6" : "#9bd0ff";
          } else {
            const u = (x + cloudDrift * 0.45) / 24;
            const v = (y - topY) / 7;
            const land = Math.sin(u * 1.2 + Math.sin(v * 0.65) * 1.8) + Math.sin(u * 0.35 + v * 0.8) > 0.92;
            const cloud = Math.sin((x + cloudDrift) / 15 + v * 1.5) + Math.sin((x + cloudDrift) / 27 - v * 1.8) > 1.18;
            col = cloud ? "#eaf3fc" : land ? "#488242" : "#22559c";
            if (R - d < 3 && (x + y) % 2 === 0) col = "#86bef7";
            const edgeFade = Math.abs(x - ecx) / (W * 0.55);
            if (edgeFade > 0.72) col = _darken(col, 0.55);
          }
          g.fillStyle = col;
          g.fillRect(x, y, 1, 1);
        }
      }

      // Sunrise glint crest on Earth's limb
      const sunX = Math.round(W * 0.52), sunY = topY + 4;
      g.fillStyle = "rgba(255, 232, 168, 0.45)"; g.fillRect(sunX - 12, sunY, 24, 3);
      g.fillStyle = "rgba(255, 244, 200, 0.88)"; g.fillRect(sunX - 6, sunY, 12, 2);
      g.fillStyle = "#fffdf0"; g.fillRect(sunX - 3, sunY - 1, 6, 2);

      // 7. Foreground Space Research Facilities along horizon base
      const baseTop = H - 28;
      // Ground deck & railing
      g.fillStyle = "#0a1220"; g.fillRect(0, H - 14, W, 14);
      g.fillStyle = "#192a45"; g.fillRect(0, H - 15, W, 2);
      g.fillStyle = "#314e78";
      for (let x = 0; x < W; x += 10) g.fillRect(x, H - 18, 1, 3);
      g.fillRect(0, H - 18, W, 1);

      // Left Launch Gantry Tower (with illuminated orange banner & top beacons)
      const tx = Math.round(W * 0.025);
      g.fillStyle = "#0e1729"; g.fillRect(tx, baseTop - 40, 18, 54);
      g.fillStyle = "#2b426b"; g.fillRect(tx - 2, baseTop - 41, 22, 3);
      g.fillStyle = "#1d2e4c";
      for (let yy = baseTop - 36; yy < H - 16; yy += 6) {
        g.fillRect(tx + 2, yy, 14, 1);
        g.fillRect(tx + 2, yy, 2, 5);
        g.fillRect(tx + 14, yy, 2, 5);
      }
      // Illuminated vertical orange mission banner inside tower
      g.fillStyle = "#d96b38"; g.fillRect(tx + 10, baseTop - 25, 4, 11);
      g.fillStyle = "#ffd980"; g.fillRect(tx + 11, baseTop - 22, 2, 4);
      // Gantry arm & base walkway
      g.fillStyle = "#2b426b"; g.fillRect(tx + 18, baseTop - 28, 12, 2);
      g.fillStyle = "#15233b"; g.fillRect(tx + 18, H - 22, 34, 8);
      g.fillStyle = "#f7c96a"; g.fillRect(tx + 24, H - 18, 5, 2); g.fillRect(tx + 38, H - 18, 6, 2);
      if (!anim || t % 36 < 18) {
        g.fillStyle = "#f09c38"; g.fillRect(tx + 4, baseTop - 44, 3, 3);
        g.fillStyle = "#e84a3c"; g.fillRect(tx + 11, baseTop - 44, 3, 3);
      }

      // Center-Right Tilted Deep Space Dish
      const dx = Math.round(W * 0.66);
      const dishShift = anim ? Math.round(Math.sin(t * 0.025)) : 0;
      g.fillStyle = "#132038"; g.fillRect(dx - 16, H - 24, 34, 10);
      g.fillStyle = "#f7c96a"; g.fillRect(dx - 10, H - 19, 5, 3); g.fillRect(dx + 2, H - 19, 6, 3);
      g.fillStyle = "#1b2d4a"; g.fillRect(dx - 3, H - 29, 6, 6);
      // Stepped angled parabolic reflector facing upper-left
      for (let i = -9; i <= 9; i++) {
        const bx = dx + i + dishShift;
        const by = Math.round(H - 35 - i * 0.45 + (i * i) * 0.05);
        g.fillStyle = "#2d4c7a"; g.fillRect(bx, by + 1, 2, 2);
        g.fillStyle = "#8cb7eb"; g.fillRect(bx, by, 1, 1);
      }
      // Feed horn tripod
      g.fillStyle = "#c9d9ed";
      g.fillRect(dx - 3 + dishShift, H - 40, 1, 5);
      g.fillRect(dx + 1 + dishShift, H - 40, 1, 4);
      g.fillStyle = "#f3ebd8"; g.fillRect(dx - 3 + dishShift, H - 41, 3, 2);

      // Right Command & Research Complex + Roof Domes + 2x2 TURBOBITS Sign
      const cx0 = Math.round(W * 0.74);
      g.fillStyle = "#101c30"; g.fillRect(cx0, H - 36, Math.max(60, W - cx0 - 4), 22);
      g.fillStyle = "#1d2f4d"; g.fillRect(cx0 + 18, H - 49, Math.max(36, W - cx0 - 20), 13);
      g.fillStyle = "#2d4870"; g.fillRect(cx0, H - 37, Math.max(60, W - cx0 - 4), 1);
      g.fillStyle = "#2d4870"; g.fillRect(cx0 + 18, H - 50, Math.max(36, W - cx0 - 20), 1);
      // Roof observatory domes
      g.fillStyle = "#9ec4ef"; g.fillRect(cx0 + 25, H - 52, 5, 3); g.fillRect(cx0 + 33, H - 52, 5, 3);
      g.fillStyle = "#f3ebd8"; g.fillRect(cx0 + 26, H - 53, 3, 1); g.fillRect(cx0 + 34, H - 53, 3, 1);
      // Warm amber hangar bay (with ribs) & control windows
      g.fillStyle = "#d98a36"; g.fillRect(cx0 + 5, H - 26, 16, 11);
      g.fillStyle = "#ffd980";
      for (let ry = H - 24; ry < H - 16; ry += 2) g.fillRect(cx0 + 7, ry, 12, 1);
      g.fillStyle = "#f7c96a";
      g.fillRect(cx0 + 23, H - 45, 4, 3); g.fillRect(cx0 + 30, H - 45, 4, 3); g.fillRect(cx0 + 37, H - 45, 4, 3);
      // Facility 2x2 Turbobits Pixel Emblem
      const lx = cx0 + 28, ly = H - 32;
      if (lx + 10 < W) {
        g.fillStyle = "#f3ebd8"; g.fillRect(lx, ly, 4, 4);
        g.fillStyle = "#d94f3d"; g.fillRect(lx + 5, ly, 4, 4);
        g.fillStyle = "#e0a342"; g.fillRect(lx, ly + 5, 4, 4);
        g.fillStyle = "#c94032"; g.fillRect(lx + 5, ly + 5, 4, 4);
        g.fillStyle = "#9cb5d4"; g.fillRect(lx - 3, ly + 11, 15, 1);
      }
      // Roof comms spires + blinking beacon
      const rxSpire = Math.min(W - 8, cx0 + 48);
      g.fillStyle = "#6c96c7"; g.fillRect(rxSpire, H - 62, 1, 14);
      g.fillStyle = "#c94032"; g.fillRect(rxSpire, H - 58, 1, 3);
      if (!anim || t % 30 < 14) {
        g.fillStyle = "#e84a3c"; g.fillRect(rxSpire, H - 64, 2, 2);
      }
    }

    const onMove = (e) => {
      if (reducedMotion()) return;
      ptr.tx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 4;
      ptr.ty = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 3;
    };
    window.removeEventListener("mousemove", cosmoBgScene._onMove || (() => {}));
    cosmoBgScene._onMove = onMove;
    window.addEventListener("mousemove", onMove, { passive: true });

    clearInterval(titleScene._iv);
    clearInterval(cosmoBgScene._iv);
    drawFrame();
    if (!reducedMotion()) {
      cosmoBgScene._iv = setInterval(drawFrame, 65);
    }
    return drawFrame;
  }
  window.cosmoBgScene = cosmoBgScene;

  // -------------------------------------------------------------------------- Story Campaign Card Banner (Sunset Launchpad)
  function drawStoryBanner(canvas) {
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = 180, H = 64;
    canvas.width = W; canvas.height = H;
    let t = 0;

    function frame() {
      const titleEl = document.getElementById("title");
      if (!titleEl || !titleEl.classList.contains("active") || document.hidden) return;
      t++;
      // Sunset sky gradient bands (warm twilight horizon)
      const skyCols = ["#3d4675", "#515485", "#6e618d", "#966d85", "#c27f75", "#e09b6b", "#f2bd78"];
      const bandH = Math.ceil(H / skyCols.length);
      skyCols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bandH, W, bandH); });

      // Billowy pixel-art sunset clouds on left and right horizons (like reference)
      const drawBillow = (bx, by, bw, bh) => {
        g.fillStyle = "#91637c"; g.fillRect(bx, by + 4, bw, bh);
        g.fillStyle = "#c78272"; g.fillRect(bx + 2, by + 2, bw - 4, bh - 2);
        g.fillStyle = "#f2b677"; g.fillRect(bx + 4, by, bw - 8, 3);
      };
      drawBillow(-4, 34, 44, 16);
      drawBillow(18, 40, 32, 12);
      drawBillow(112, 36, 42, 15);
      drawBillow(140, 26, 44, 24);

      // Distant hills & launchpad deck
      g.fillStyle = "#1c1f36"; g.fillRect(0, 50, W, 14);
      g.fillStyle = "#2d3252"; g.fillRect(0, 48, W, 3);

      // Left Launch Gantry Structure (dual-column lattice + service arms)
      g.fillStyle = "#161a2e"; g.fillRect(38, 12, 3, 38); g.fillRect(48, 8, 10, 42);
      g.fillStyle = "#354166";
      for (let y = 10; y < 48; y += 5) {
        g.fillRect(49, y, 8, 1);
        g.fillRect(50, y, 1, 4); g.fillRect(55, y, 1, 4);
      }
      g.fillStyle = "#4d5d8c"; g.fillRect(58, 18, 14, 2); g.fillRect(58, 30, 12, 2);

      // Rocket lifting on ignition plumes
      const rx = 78, ry = 13;
      const flk = reducedMotion() ? 1 : (t % 4 < 2 ? 1 : 0);
      // Exhaust flame & billowing golden pad smoke
      g.fillStyle = "#e87835"; g.fillRect(rx - 3, ry + 29, 14, 10 + flk * 2);
      g.fillStyle = "#ffd96b"; g.fillRect(rx - 1, ry + 29, 10, 8 + flk);
      g.fillStyle = "#fff8dc"; g.fillRect(rx + 2, ry + 29, 4, 6);
      g.fillStyle = "rgba(247, 212, 145, 0.8)";
      g.fillRect(rx - 14 - flk, 47, 36 + flk * 2, 5);
      g.fillStyle = "rgba(218, 138, 94, 0.7)";
      g.fillRect(rx - 20, 50, 48, 4);

      // Rocket hull (tapered nose, black interstage band, side boosters/fins)
      g.fillStyle = "#222940"; g.fillRect(rx + 3, ry - 5, 2, 5);
      g.fillStyle = "#f4efe2"; g.fillRect(rx + 1, ry, 6, 4);
      g.fillStyle = "#f4efe2"; g.fillRect(rx, ry + 4, 8, 23);
      g.fillStyle = "#cfd6e0"; g.fillRect(rx + 5, ry + 4, 3, 23);
      g.fillStyle = "#1b2438"; g.fillRect(rx, ry + 9, 8, 2); g.fillRect(rx, ry + 18, 8, 2);
      g.fillStyle = "#c94032"; g.fillRect(rx - 2, ry + 21, 2, 6); g.fillRect(rx + 8, ry + 21, 2, 6);
      g.fillStyle = "#4b556b"; g.fillRect(rx, ry + 27, 8, 2);
    }

    clearInterval(drawStoryBanner._iv);
    frame();
    if (!reducedMotion()) drawStoryBanner._iv = setInterval(frame, 140);
  }

  // -------------------------------------------------------------------------- Mission Design Lab Banner (Spacecraft Blueprint)
  function drawLabBanner(canvas) {
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = 180, H = 64;
    canvas.width = W; canvas.height = H;
    let t = 0;

    function frame() {
      const titleEl = document.getElementById("title");
      if (!titleEl || !titleEl.classList.contains("active") || document.hidden) return;
      t++;
      g.fillStyle = "#0d1f3b"; g.fillRect(0, 0, W, H);
      // Blueprint grid
      g.fillStyle = "#17345e";
      for (let x = 0; x < W; x += 10) g.fillRect(x, 0, 1, H);
      for (let y = 0; y < H; y += 10) g.fillRect(0, y, W, 1);

      // Dashed horizontal alignment axis & tick marks
      const cx = 90, cy = 32;
      g.fillStyle = "rgba(158, 196, 239, 0.55)";
      for (let x = 14; x < W - 14; x += 5) g.fillRect(x, cy, 3, 1);
      g.fillRect(cx - 56, cy - 2, 1, 5);
      g.fillRect(cx + 56, cy - 2, 1, 5);

      // Left & Right Solar Arrays (crisp white border + 4 solar cells + specular glint)
      [cx - 50, cx + 16].forEach((sx) => {
        g.fillStyle = "#e6f0fc"; g.fillRect(sx - 1, cy - 9, 36, 18);
        g.fillStyle = "#184680"; g.fillRect(sx, cy - 8, 34, 16);
        g.fillStyle = "#3172bd";
        for (let i = 0; i < 4; i++) {
          g.fillRect(sx + 1 + i * 8, cy - 7, 7, 6);
          g.fillRect(sx + 1 + i * 8, cy + 1, 7, 6);
        }
        g.fillStyle = "#8bc2fa";
        g.fillRect(sx + 1, cy - 7, 4, 1); g.fillRect(sx + 17, cy - 7, 4, 1);
      });
      // Struts
      g.fillStyle = "#e6f0fc";
      g.fillRect(cx - 14, cy - 1, 6, 3); g.fillRect(cx + 8, cy - 1, 6, 3);
      // Central bus
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 9, cy - 12, 18, 24);
      g.fillStyle = "#5c7a9e"; g.fillRect(cx - 7, cy - 10, 14, 20);
      g.fillStyle = "#183354"; g.fillRect(cx - 5, cy - 7, 10, 14);
      g.fillStyle = "#f3ebd8"; g.fillRect(cx - 3, cy - 4, 6, 8);
      // Top optical module & bottom thruster nozzle
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 5, cy - 16, 10, 4);
      g.fillStyle = "#3c74b8"; g.fillRect(cx - 3, cy - 15, 6, 2);
      g.fillStyle = "#9bb4d4"; g.fillRect(cx - 4, cy + 12, 8, 3);
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 2, cy + 15, 4, 2);

      // Subtle scan pulse
      if (!reducedMotion()) {
        const scanX = (t * 2) % W;
        g.fillStyle = "rgba(138, 184, 235, 0.14)";
        g.fillRect(scanX, 0, 4, H);
      }
    }

    clearInterval(drawLabBanner._iv);
    frame();
    if (!reducedMotion()) drawLabBanner._iv = setInterval(frame, 80);
  }

  // -------------------------------------------------------------------------- Live Game State Helpers (Zero fake data!)
  function getStoryDone() {
    return store.get("storyDone", {});
  }

  function calcResearchPoints() {
    const a = typeof agency === "function" ? agency() : null;
    const prog = typeof progress === "function" ? progress() : {};
    const sd = getStoryDone();
    const techPts = a ? Math.max(0, (a.tech || []).length - 1) * 15 : 0;
    const medalPts = a ? (a.medals || []).length * 30 : 0;
    const freePts = Object.keys(prog || {}).length * 10;
    const storyPts = Object.keys(sd || {}).length * 25;
    return techPts + medalPts + freePts + storyPts;
  }

  let _onlineState = navigator.onLine;
  async function checkServerHealth() {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      _onlineState = r.ok;
    } catch {
      _onlineState = false;
    }
    refreshStatusBar();
  }

  function refreshStatusBar() {
    const a = typeof agency === "function" ? agency() : null;
    const name = (typeof S !== "undefined" && S.player) ? S.player : store.get("player", "");
    const rp = calcResearchPoints();
    const funds = a ? `${fmt(a.funds)} M$` : "150 M$";
    const year = a ? String(2027 + Math.floor(a.month / 12)) : "2026";

    const dot = $("#sbOnlineDot"), lbl = $("#sbOnlineLabel"), bars = $("#sbSignalBars");
    if (dot && lbl) {
      dot.classList.toggle("off", !_onlineState);
      lbl.textContent = _onlineState ? "ONLINE" : "OFFLINE";
      if (bars) bars.classList.toggle("off", !_onlineState);
    }
    if ($("#sbProfile")) $("#sbProfile").textContent = name || "—";
    if ($("#sbRP")) $("#sbRP").textContent = String(rp);
    if ($("#sbFunds")) $("#sbFunds").textContent = funds;
    if ($("#sbYear")) $("#sbYear").textContent = year;

    // Tutorial progress dots on Tutorial card
    const tutDone = store.get("tutorialDone", false);
    const progCount = Object.keys(typeof progress === "function" ? progress() : {}).length;
    const activeNodes = tutDone ? 5 : Math.min(4, progCount > 0 ? 2 : 1);
    const dotsEl = $("#tutProgressDots");
    if (dotsEl) {
      dotsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<span class="cq-step-dot ${i < activeNodes ? "on" : ""}"></span>`
      ).join('<span class="cq-step-line"></span>');
    }
  }
  window.refreshStatusBar = refreshStatusBar;

  // -------------------------------------------------------------------------- Top Nav Modals (Profile, Settings, About)
  let _afterProfile = null;
  function openProfileModal(afterSave = null) {
    _afterProfile = afterSave;
    const m = $("#profileModal");
    if (!m) return;
    const inp = $("#playerName");
    if (inp) inp.value = S.player || store.get("player", "");

    const a = typeof agency === "function" ? agency() : null;
    const sd = getStoryDone();
    const stats = $("#profileStats");
    if (stats) {
      const rank = a ? (a.rep >= 60 ? "Flight Director" : a.rep >= 30 ? "Senior Systems Lead" : "Mission Engineer") : "Cadet Engineer";
      stats.innerHTML = `
        <div class="cq-stat-row"><span>Rank</span><b>${esc(rank)}</b></div>
        <div class="cq-stat-row"><span>Research Points</span><b>${calcResearchPoints()} RP</b></div>
        <div class="cq-stat-row"><span>Agency Funds</span><b>${a ? `${fmt(a.funds)} M$` : "150 M$ (Initial)"}</b></div>
        <div class="cq-stat-row"><span>Story Chapters</span><b>${Object.keys(sd).length} / ${STORY_CHAPTERS.length}</b></div>
      `;
    }
    const hint = $("#profilePrompt");
    if (hint) {
      hint.textContent = afterSave
        ? "Enter your engineer callsign to enter the Team Room."
        : "Your callsign appears on Career HQ, Team Rooms, and Hall of Fame records.";
    }
    m.classList.remove("hidden");
    setTimeout(() => inp && inp.focus(), 40);
  }
  window.openProfileModal = openProfileModal;

  function openSettingsModal() {
    const m = $("#settingsModal");
    if (!m) return;
    const sndOn = store.get("sound", true);
    if ($("#setSoundBtn")) $("#setSoundBtn").textContent = sndOn ? "SOUND FX: ON" : "SOUND FX: OFF";
    if ($("#setMotionVal")) $("#setMotionVal").textContent = reducedMotion() ? "REDUCED (OS)" : "STANDARD";
    if ($("#setResetConfirm")) $("#setResetConfirm").classList.add("hidden");
    m.classList.remove("hidden");
  }

  function openAboutModal() {
    const m = $("#aboutModal");
    if (m) m.classList.remove("hidden");
  }

  // -------------------------------------------------------------------------- Story Campaign: Project Genesis
  function openStory() {
    show("story");
    const done = getStoryDone();
    const list = $("#storyChapters");
    if (!list) return;

    let unlockedIdx = 0;
    STORY_CHAPTERS.forEach((ch, idx) => {
      if (done[ch.id] && PASS.includes(done[ch.id].grade)) {
        unlockedIdx = Math.max(unlockedIdx, idx + 1);
      }
    });

    list.innerHTML = STORY_CHAPTERS.map((ch, idx) => {
      const rec = done[ch.id];
      const isDone = rec && PASS.includes(rec.grade);
      const locked = idx > unlockedIdx;
      const scObj = S.cat && S.cat.SCENARIOS ? S.cat.SCENARIOS[ch.scenario] : null;
      return `
        <article class="cq-chapter ${locked ? "locked" : ""} ${isDone ? "done" : ""}" data-ch="${ch.id}">
          <div class="cq-ch-portrait">
            <img class="px" src="${portrait(ch.look, isDone ? "happy" : "neutral")}" alt="${esc(ch.speaker)}">
          </div>
          <div class="cq-ch-body">
            <div class="cq-ch-head">
              <span class="cq-ch-num">${ch.num}</span>
              <span class="cq-ch-loc">${esc(ch.location)}</span>
              ${rec ? `<span class="cq-ch-grade" style="color:${GRADE_COL[rec.grade] || "#f3ebd8"}">${rec.grade} · ${rec.score} PTS</span>` : ""}
            </div>
            <h3>${esc(ch.title)}</h3>
            <p class="cq-ch-speaker">${esc(ch.speaker)}</p>
            <p class="cq-ch-desc">${esc(ch.brief[0])}</p>
            <div class="cq-ch-obj">
              <span>Objective: ${esc(ch.objective)}</span>
              ${scObj ? `<span class="cq-ch-meta">${esc(S.cat.DESTINATIONS[scObj.destination].name)} · Budget ${fmt(scObj.budget)} M$</span>` : ""}
            </div>
          </div>
          <div class="cq-ch-act">
            ${locked
              ? `<span class="cq-ch-lock">Complete previous chapter to unlock</span>`
              : `<button class="cq-btn-amber" data-launch-ch="${ch.id}">${isDone ? "REPLAY MISSION" : "LAUNCH CHAPTER"} &gt;</button>`}
          </div>
        </article>`;
    }).join("");

    list.querySelectorAll("[data-launch-ch]").forEach((btn) => {
      btn.onclick = () => {
        const ch = STORY_CHAPTERS.find((c) => c.id === btn.dataset.launchCh);
        if (!ch) return;
        SFX.page();
        S.mode = "story";
        S.storyChapter = ch.id;
        S.noLetter = false;
        startMission(ch.scenario);
      };
    });
  }
  window.openStory = openStory;

  // Record story completion when a story mission finishes
  window.recordStoryResult = (res) => {
    if (S.mode !== "story" || !S.storyChapter || !res || !res.sim || !res.sim.launched) return;
    const done = getStoryDone();
    const prev = done[S.storyChapter];
    if (!prev || res.score.total > prev.score) {
      done[S.storyChapter] = { grade: res.score.grade, score: res.score.total, outcome: res.sim.outcome };
      store.set("storyDone", done);
    }
    refreshStatusBar();
  };

  // -------------------------------------------------------------------------- Prologue Film: The Last Signal
  const PROLOGUE_SCENES = [
    {
      title: "01 · DEEP SPACE NETWORK · 2026",
      caption: "Late autumn, 2026. Listening dishes across Earth swept a quiet outer-system band—until an unscheduled carrier pulse broke through the static.",
      draw(g, W, H, p, t) {
        earthLimb(g, W, H, H + 115, 160, t * 0.2);
        // Ground station pedestal + angled parabolic DSN dish
        g.fillStyle = "#0e1729"; g.fillRect(46, H - 38, 22, 38);
        g.fillStyle = "#1d2f4d"; g.fillRect(52, H - 44, 10, 6);
        for (let i = -14; i <= 14; i++) {
          const bx = 58 + i;
          const by = Math.round(H - 54 + i * 0.55 + (i * i) * 0.045);
          g.fillStyle = "#355a8a"; g.fillRect(bx, by + 1, 2, 3);
          g.fillStyle = "#9ec4ef"; g.fillRect(bx, by, 1, 2);
        }
        g.fillStyle = "#f3ebd8"; g.fillRect(63, H - 64, 3, 2);
        // Distant Jupiter source + incoming carrier pulse arcs
        g.fillStyle = "#d8a348"; g.fillRect(256, 28, 8, 8);
        g.fillStyle = "#f2dec4"; g.fillRect(257, 30, 6, 2);
        for (let w = 0; w < 3; w++) {
          const frac = ((t * 0.04 + w * 0.33) % 1);
          const px = Math.round(252 - frac * 182);
          const py = Math.round(32 + frac * (H - 96));
          g.fillStyle = `rgba(224, 163, 66, ${1 - frac * 0.6})`;
          g.fillRect(px - 2, py - 2, 4, 1);
          g.fillRect(px - 3, py - 1, 2, 3);
        }
      }
    },
    {
      title: "02 · ANOMALOUS TELEMETRY",
      caption: "Every 72 minutes, the signal repeated—too structured to be solar noise, triangulated precisely to Jupiter's icy moon, Europa.",
      draw(g, W, H, p, t) {
        // Oscilloscope carrier waveform
        g.fillStyle = "#0c1b30"; g.fillRect(20, 26, W - 40, 74);
        g.fillStyle = "#1c3860";
        for (let x = 20; x < W - 20; x += 20) g.fillRect(x, 26, 1, 74);
        for (let x = 22; x < W - 24; x += 2) {
          const amp = Math.sin(x * 0.12 + t * 0.25) * (Math.abs(x - W / 2) < 42 ? 22 : 4);
          g.fillStyle = Math.abs(x - W / 2) < 42 ? "#e0a342" : "#58b7c9";
          g.fillRect(x, Math.round(63 + amp), 2, 2);
        }
        g.fillStyle = "#f3ebd8"; g.fillRect(W / 2 - 1, 28, 2, 70);
      }
    },
    {
      title: "03 · PROJECT GENESIS FORMED",
      caption: "Turbobits Studio and NASA Mission Review Board launched Project Genesis: an engineering program to step outward from Earth, to the Moon, to Mars, and beyond.",
      draw(g, W, H, p, t) {
        // 4 planets stepping across orbital arc
        const bodies = [
          { x: 54, y: 92, r: 10, c: "#3c74b8" },
          { x: 118, y: 74, r: 7, c: "#9aa7b8" },
          { x: 192, y: 58, r: 9, c: "#c96240" },
          { x: 266, y: 40, r: 12, c: "#d9c2a3" }
        ];
        g.fillStyle = "rgba(138,184,235,0.4)";
        for (let x = 54; x < 266; x += 5) {
          const f = (x - 54) / 212;
          g.fillRect(x, Math.round(92 - f * 52 - Math.sin(f * Math.PI) * 10), 2, 1);
        }
        bodies.forEach((b) => {
          g.fillStyle = b.c; g.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
          g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(b.x - b.r, b.y - b.r, b.r, b.r);
        });
        const progX = Math.round(54 + p * 212);
        const progY = Math.round(92 - p * 52 - Math.sin(p * Math.PI) * 10);
        g.fillStyle = "#f3ebd8"; g.fillRect(progX - 2, progY - 2, 5, 4);
        g.fillStyle = "#e0a342"; g.fillRect(progX - 5, progY - 1, 3, 2);
      }
    },
    {
      title: "04 · THE RADIATION WALL",
      caption: "Sunlight at Jupiter is 27 times weaker. Radiation belts destroy unshielded electronics. Only disciplined spacecraft engineering will reach Europa intact.",
      draw(g, W, H, p, t) {
        // Jupiter & Europa + Spacecraft approaching
        g.fillStyle = "#c98556"; g.fillRect(210, 18, 86, 86);
        g.fillStyle = "#e8cfb2"; g.fillRect(210, 34, 86, 12); g.fillRect(210, 62, 86, 10);
        g.fillStyle = "#874d33"; g.fillRect(210, 48, 86, 8);
        // Europa icy moon
        g.fillStyle = "#dce6f2"; g.fillRect(156, 62, 18, 18);
        g.fillStyle = "#8ba8cc"; g.fillRect(158, 69, 14, 2); g.fillRect(162, 64, 2, 12);
        // Spacecraft
        const sx = Math.round(40 + p * 90), sy = 68;
        g.fillStyle = "#3d6fa8"; g.fillRect(sx - 14, sy - 2, 10, 5); g.fillRect(sx + 6, sy - 2, 10, 5);
        g.fillStyle = "#e0a342"; g.fillRect(sx - 4, sy - 4, 9, 8);
      }
    },
    {
      title: "05 · THE LAUNCH PAD AWAITS",
      caption: "Every gram, every watt, every bit of bandwidth counts. Step to the desk, Engineer—and answer The Last Signal.",
      draw(g, W, H, p, t) {
        drawPad(g, W, H - 24, 1 - Math.min(1, p * 2), t % 16 < 8, "falcon9", p < 0.35);
        const lift = Math.max(0, (p - 0.35) / 0.65);
        drawLV(g, "falcon9", 160, Math.round(H - 28 - 44 - lift * 95), { fire: p > 0.2, flicker: (t % 3) / 2 });
      }
    }
  ];

  let _prolTimer = null;
  let _prolPaused = false;
  let _prolIdx = 0;
  let _prolProg = 0;

  function renderPrologueFrame() {
    const cv = $("#prologueCanvas");
    if (!cv) return;
    const g = cv.getContext("2d");
    const W = 320, H = 180;
    const sc = PROLOGUE_SCENES[_prolIdx];
    const t = Math.round(_prolProg * 60);

    // Star backdrop
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050b16"); sky.addColorStop(1, "#122440");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const rnd = _rng(90 + _prolIdx);
    for (let i = 0; i < 65; i++) {
      g.fillStyle = i % 5 === 0 ? "#e0a342" : "#d9e6f7";
      g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * (H - 30)), 1, 1);
    }

    sc.draw(g, W, H, _prolProg, t);

    if ($("#prolTitle")) $("#prolTitle").textContent = sc.title;
    if ($("#prolCaption")) $("#prolCaption").textContent = sc.caption;
    if ($("#prolTimeline")) {
      $("#prolTimeline").innerHTML = PROLOGUE_SCENES.map((s, i) =>
        `<button class="cq-prol-seg ${i === _prolIdx ? "on" : i < _prolIdx ? "done" : ""}" data-ps="${i}" aria-label="Scene ${i + 1}"></button>`
      ).join("");
      $("#prolTimeline").querySelectorAll("[data-ps]").forEach((b) => {
        b.onclick = () => { _prolIdx = +b.dataset.ps; _prolProg = 0; renderPrologueFrame(); };
      });
    }
  }

  function stopPrologue() {
    clearInterval(_prolTimer);
    _prolTimer = null;
  }

  function openPrologue() {
    show("prologue");
    stopPrologue();
    _prolIdx = 0;
    _prolProg = 0;
    _prolPaused = reducedMotion();
    if ($("#prolPlayBtn")) $("#prolPlayBtn").textContent = _prolPaused ? "PLAY" : "PAUSE";
    renderPrologueFrame();

    _prolTimer = setInterval(() => {
      if (!_prolPaused && $("#prologue") && $("#prologue").classList.contains("active")) {
        _prolProg += 0.015;
        if (_prolProg >= 1) {
          _prolProg = 0;
          if (_prolIdx < PROLOGUE_SCENES.length - 1) {
            _prolIdx++;
            if (typeof SFX !== "undefined") SFX.beep(false);
          } else {
            _prolPaused = true;
            if ($("#prolPlayBtn")) $("#prolPlayBtn").textContent = "REPLAY";
          }
        }
        renderPrologueFrame();
      }
    }, 60);
  }
  window.openPrologue = openPrologue;
  window.stopPrologue = stopPrologue;

  // -------------------------------------------------------------------------- Wire Main Menu Interactions
  function initCosmoMenu() {
    hydrateIcons();
    drawStoryBanner($("#storyBanner"));
    drawLabBanner($("#labBanner"));

    // Top bar icon actions
    const wire = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
    wire("#navLabBtn", () => { SFX.page(); go("free"); });
    wire("#navHallBtn", () => { SFX.page(); go("hall"); });
    wire("#navProfileBtn", () => { SFX.page(); openProfileModal(); });
    wire("#navSettingsBtn", () => { SFX.page(); openSettingsModal(); });
    wire("#navAboutBtn", () => { SFX.page(); openAboutModal(); });
    wire("#sbProfileBtn", () => { SFX.page(); openProfileModal(); });

    // Profile modal
    wire("#profileSaveBtn", () => {
      const inp = $("#playerName");
      const val = inp ? inp.value.trim() : "";
      S.player = val;
      store.set("player", val);
      refreshStatusBar();
      $("#profileModal").classList.add("hidden");
      if (typeof _afterProfile === "function") {
        const cb = _afterProfile;
        _afterProfile = null;
        cb();
      }
    });
    wire("#profileCloseBtn", () => {
      _afterProfile = null;
      $("#profileModal").classList.add("hidden");
    });

    // Settings modal
    wire("#setSoundBtn", () => {
      const next = !store.get("sound", true);
      store.set("sound", next);
      $("#setSoundBtn").textContent = next ? "SOUND FX: ON" : "SOUND FX: OFF";
      if (typeof soundLabel === "function") soundLabel();
    });
    wire("#setResetTutBtn", () => {
      store.set("tutorialDone", false);
      refreshStatusBar();
      toast("Tutorial reset. Click Tutorial to replay guided mission.");
    });
    wire("#setResetCareerBtn", () => {
      $("#setResetConfirm").classList.remove("hidden");
    });
    wire("#setResetConfirmYes", () => {
      store.set("agency", null);
      store.set("storyDone", {});
      $("#setResetConfirm").classList.add("hidden");
      refreshStatusBar();
      toast("Agency career & story progress cleared.");
    });
    wire("#setResetConfirmNo", () => {
      $("#setResetConfirm").classList.add("hidden");
    });
    wire("#settingsCloseBtn", () => $("#settingsModal").classList.add("hidden"));

    // About modal
    wire("#aboutCloseBtn", () => $("#aboutModal").classList.add("hidden"));

    // Story Campaign screen buttons
    wire("#storyBackBtn", () => { SFX.page(); go("title"); });
    wire("#storyPrologueBtn", () => { SFX.page(); openPrologue(); });

    // Prologue controls
    wire("#prolPlayBtn", () => {
      if (_prolIdx === PROLOGUE_SCENES.length - 1 && _prolPaused) {
        _prolIdx = 0; _prolProg = 0; _prolPaused = false;
      } else {
        _prolPaused = !_prolPaused;
      }
      $("#prolPlayBtn").textContent = _prolPaused ? "PLAY" : "PAUSE";
    });
    wire("#prolPrevBtn", () => { _prolIdx = Math.max(0, _prolIdx - 1); _prolProg = 0; renderPrologueFrame(); });
    wire("#prolNextBtn", () => { _prolIdx = Math.min(PROLOGUE_SCENES.length - 1, _prolIdx + 1); _prolProg = 0; renderPrologueFrame(); });
    wire("#prolToStoryBtn", () => { stopPrologue(); SFX.page(); openStory(); });
    wire("#prolBackBtn", () => { stopPrologue(); SFX.page(); go("title"); });

    // Close modals when clicking backdrop
    ["#profileModal", "#settingsModal", "#aboutModal"].forEach((sel) => {
      const m = $(sel);
      if (m) m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    });

    refreshStatusBar();
    checkServerHealth();
    window.addEventListener("online", checkServerHealth);
    window.addEventListener("offline", checkServerHealth);
  }
  window.initCosmoMenu = initCosmoMenu;
  window.refreshCosmoBanners = () => {
    drawStoryBanner($("#storyBanner"));
    drawLabBanner($("#labBanner"));
    refreshStatusBar();
  };
})();
