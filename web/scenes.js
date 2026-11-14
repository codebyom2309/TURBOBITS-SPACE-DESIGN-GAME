// Animated pixel scenes: the title screen sky and the pieces of the launch sequence
// (Earth limb, launch vehicles per rocket type, launch pad). All drawn in code at 320x180.
"use strict";

// Curved Earth horizon seen from orbit. cy/R: circle centre and radius; off scrolls clouds/land.
function earthLimb(g, W, H, cy, R, off = 0, cx = W / 2) {
  const top = Math.max(0, Math.floor(cy - R - 4));
  for (let y = top; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > R + 3) continue;
    let col;
    if (d > R) col = d > R + 2 ? "#1b2a55" : d > R + 1 ? "#3a64b0" : "#7fb0f0";              // atmosphere glow
    else {
      const u = (x + off) / 23, v = y / 7;
      const land = Math.sin(u * 1.3 + Math.sin(v * 0.7) * 2) + Math.sin(u * 0.37 + v * 0.9) > 1.1;
      const cloud = Math.sin(u * 2.1 + v * 1.7 + off / 40) + Math.sin(u * 0.8 - v * 2.3) > 1.25;
      col = cloud ? "#e9eef2" : land ? "#4f7a34" : "#2f5a9c";
      if (R - d < 3 && (x + y) % 2 === 0) col = "#8fb3e8";                                        // haze at the edge
      if (x / W > 0.88 || (x / W > 0.8 && (x + y) % 2 === 0)) col = _darken(col, 0.45);                          // night side
    }
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
}

// Launch vehicles, drawn from the top (x = centre, y = nose). Returns the y of the engine bottom.
const LV_SHAPE = {
  electron: { h: 30, w: 4, body: "#2a2a2e", band: "#5b5b60", nose: "#2a2a2e", boosters: 0 },
  falcon9: { h: 44, w: 5, body: "#f4efe2", band: "#1d1a17", nose: "#f4efe2", boosters: 0 },
  vulcan: { h: 44, w: 6, body: "#d98a3a", band: "#f4efe2", nose: "#f4efe2", boosters: 2, bcol: "#e9e3d6", bh: 18 },
  falcon_heavy: { h: 44, w: 5, body: "#f4efe2", band: "#1d1a17", nose: "#f4efe2", boosters: 2, bcol: "#f4efe2", bh: 34, bw: 5 },
  sls: { h: 52, w: 7, body: "#d9792b", band: "#f4efe2", nose: "#f4efe2", boosters: 2, bcol: "#f4efe2", bh: 40, bw: 4 },
};
function drawLV(g, lv, x, y, { fire = false, boosters = true, flicker = 0 } = {}) {
  const S = LV_SHAPE[lv] || LV_SHAPE.falcon9, r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); };
  const w = S.w, h = S.h, x0 = x - Math.floor(w / 2), bot = y + h;
  r(x0 + 1, y, w - 2, 2, S.nose); r(x0, y + 2, w, 6, S.nose); r(x0, y + 8, w, h - 8, S.body);   // fairing + body
  r(x0, y + 8, w, 1, S.band); r(x0, y + Math.round(h * 0.45), w, 2, S.band);                       // stage bands
  r(x0 + w - 1, y + 2, 1, h - 2, "rgba(0,0,0,.25)"); r(x0, y + 2, 1, h - 2, "rgba(255,255,255,.25)");
  if (lv === "falcon9" || lv === "falcon_heavy") r(x0, y + 14, w, 2, "#1d1a17");                   // interstage
  r(x0 - 1, bot - 2, w + 2, 2, "#4b4b4b");                                                         // engine section
  if (S.boosters && boosters) {
    const bw = S.bw || 3, bh = S.bh;
    [x0 - bw - 1, x0 + w + 1].forEach((bx) => {
      r(bx, bot - bh, bw, bh, S.bcol); r(bx, bot - bh - 2, bw, 2, S.bcol === "#f4efe2" ? "#d8d0bc" : S.bcol);
      r(bx, bot - bh + 2, bw, 1, "#1d1a17"); if (fire) flame(g, bx + bw / 2, bot, flicker, 0.7);
    });
  }
  if (fire) flame(g, x, bot, flicker, w / 5);
  return bot;
}
function flame(g, x, y, f, s = 1) {
  const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); };
  const L = (10 + f * 8) * s, W = Math.max(2, 4 * s);
  r(x - W / 2 - 1, y, W + 2, L * 0.9, "#b3372d"); r(x - W / 2, y, W, L, "#d9792b"); r(x - W / 4, y, Math.max(1, W / 2), L * 0.75, "#ffd96b");
  for (let k = 1; k < 4; k++) r(x - 1, y + k * L / 4, 2, 1, "#fff6c8");                            // shock diamonds
}

// Launch pad scene; gy = ground line on screen. The tower, its swing arms and the hold-down clamps are sized to
// the rocket on the pad (lv), so even a small Electron is held until liftoff. armOut: 1 = attached, 0 = swung away.
function drawPad(g, W, gy, armOut, blinkOn, lv = "falcon9", clamped = true) {
  const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); };
  for (let x = 0; x < W; x += 2) {                                                                 // far hills
    const h = 8 + Math.sin(x / 23) * 5 + Math.sin(x / 7.3) * 2;
    r(x, gy - h, 2, h, "#2a3324");
  }
  r(0, gy, W, 60, "#34402a"); r(0, gy, W, 1, "#4a5a3a");
  r(120, gy - 2, 80, 3, "#7d7d7d"); r(150, gy + 1, 20, 6, "#1d1a17");                                // pad + flame trench
  const S = LV_SHAPE[lv] || LV_SHAPE.falcon9, top = gy - 4 - S.h, th = S.h + 14;
  const left = 160 - Math.floor(S.w / 2) - (S.boosters ? (S.bw || 3) + 1 : 0), right = 160 - Math.floor(S.w / 2) + S.w + (S.boosters ? (S.bw || 3) + 1 : 0);
  r(136, gy - th, 8, th - 2, "#5b534b");                                                           // tower, as tall as the rocket
  for (let y = gy - th + 2; y < gy - 4; y += 6) { r(136, y, 8, 1, "#3b342d"); r(137, y + 1, 1, 4, "#7d7d7d"); r(142, y + 1, 1, 4, "#7d7d7d"); }
  r(134, gy - th - 4, 12, 4, "#3b342d"); r(139, gy - th - 8, 2, 4, blinkOn ? "#ff3b2b" : "#5a1a14");
  const reach = left - 144;                                                                         // swing arms grab the rocket
  [top + 6, top + Math.round(S.h * 0.55)].forEach((ay, i) => {
    const len = Math.max(0, Math.round(reach * armOut)), droop = armOut < 1 ? Math.round((1 - armOut) * 3) : 0;
    if (len > 0) { r(144, ay + droop * (i + 1), len, 2, "#7d7d7d"); r(144 + len - 2, ay - 1 + droop * (i + 1), 2, 4, "#b9b9b9"); }
    else r(144, ay, 2, 4, "#7d7d7d");
  });
  r(left - 4, gy - 6, 3, 4, "#4b4b4b"); r(right + 1, gy - 6, 3, 4, "#4b4b4b");                       // hold-down clamps
  if (clamped) { r(left - 2, gy - 7, 3, 2, "#b9b9b9"); r(right, gy - 7, 3, 2, "#b9b9b9"); }
  else { r(left - 5, gy - 8, 2, 2, "#b9b9b9"); r(right + 3, gy - 8, 2, 2, "#b9b9b9"); }
  [100, 220].forEach((x) => { r(x, gy - 20, 2, 20, "#4b4b4b"); r(x - 2, gy - 22, 6, 2, blinkOn ? "#e8cf52" : "#5b534b"); }); // light masts
}

// ---------------------------------------------------------------------------- title screen
function titleScene(canvas) {
  if (typeof window.cosmoBgScene === "function") return window.cosmoBgScene(canvas);
  const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  const rnd = _rng(42), layers = [0.02, 0.06, 0.15].map((sp, i) => ({ sp, pts: Array.from({ length: [90, 50, 22][i] }, () => [rnd() * W, rnd() * H * 0.8, rnd()]) }));
  const sat = { x: -20 }, rockets = [], meteors = [], moon = new Image();
  moon.src = planet("moon", 22); g.imageSmoothingEnabled = false;
  let t = 0;
  function frame() {
    if (!document.getElementById("title").classList.contains("active") || document.hidden) return;
    t++;
    const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#07060b"); grd.addColorStop(1, "#141a33");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    layers.forEach((L, i) => L.pts.forEach((p) => {
      const x = ((p[0] - t * L.sp) % W + W) % W, tw = Math.sin(t / 9 + p[2] * 40) > 0.6;
      g.fillStyle = i === 2 ? (tw ? "#ffffff" : "#c9c4d8") : i === 1 ? "#8c8a99" : "#4c4a5a";
      g.fillRect(Math.floor(x), Math.floor(p[1]), i === 2 && tw ? 2 : 1, 1);
    }));
    if (moon.complete) g.drawImage(moon, 34, 22);
    earthLimb(g, W, H, H + 342, 370, t * 0.25);
  }
  clearInterval(titleScene._iv);
  titleScene._iv = setInterval(frame, 60);
  frame();
  return frame;
}

// Round mission patch / COSMO QUEST rocket-orbit emblem (56x56).
function missionPatch() {
  return sprite(56, 56, (r) => {
    const cx = 28, cy = 28;
    // Outer ring & dark space interior
    for (let y = 0; y < 56; y++) for (let x = 0; x < 56; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= 22.5) {
        if (d > 20.8) r(x, y, 1, 1, "#d8a348");
        else if (d > 19.4) r(x, y, 1, 1, "#101c33");
        else {
          const isEarth = y > 37 + Math.round(((x - cx) / 14) ** 2 * 3);
          r(x, y, 1, 1, isEarth ? "#2b62a6" : "#0b1528");
        }
      }
    }
    // Earth atmosphere highlight + green continent patch
    for (let x = 10; x < 46; x++) {
      const ey = 37 + Math.round(((x - cx) / 14) ** 2 * 3);
      if (Math.hypot(x - cx, ey - cy) < 19) {
        r(x, ey, 1, 1, "#7fb8f2");
        if (x > 16 && x < 24) r(x, ey + 2, 1, 3, "#4f8a42");
        if (x > 30 && x < 38) r(x, ey + 3, 1, 2, "#4f8a42");
      }
    }
    // Stars inside badge
    [[15, 16], [39, 14], [18, 24], [38, 23], [21, 13]].forEach(([x, y]) => r(x, y, 1, 1, "#f3ebd8"));
    r(19, 17, 1, 3, "#9ec4ef"); r(18, 18, 3, 1, "#9ec4ef");
    r(36, 17, 1, 3, "#f3ebd8"); r(35, 18, 3, 1, "#f3ebd8");
    // Back half of tilted orbital swoosh
    for (let a = Math.PI; a < Math.PI * 2; a += 0.04) {
      const rx = Math.round(cx + Math.cos(a) * 25), ry = Math.round(cy + 3 + Math.sin(a) * 7.5 - Math.cos(a) * 3);
      if (rx >= 0 && rx < 56 && ry >= 0 && ry < 56) r(rx, ry, 2, 2, a < Math.PI * 1.4 ? "#c94032" : "#e0a342");
    }
    // Exhaust plume on Earth horizon
    r(26, 33, 4, 4, "#f0b84a"); r(27, 32, 2, 4, "#fff2bd");
    r(24, 36, 8, 2, "#e8eff7"); r(22, 37, 12, 1, "#b8d2ef");
    // Rocket body
    r(27, 10, 2, 2, "#c94032");
    r(26, 12, 4, 3, "#c94032");
    r(26, 15, 4, 15, "#f4efe2");
    r(29, 15, 1, 15, "#cfc6b4");
    r(27, 18, 2, 3, "#3c74b8");
    r(24, 25, 2, 5, "#c94032"); r(30, 25, 2, 5, "#c94032");
    r(23, 28, 1, 3, "#c94032"); r(32, 28, 1, 3, "#c94032");
    r(26, 30, 4, 2, "#465063");
    // Front half of tilted orbital swoosh
    for (let a = 0; a <= Math.PI; a += 0.03) {
      const rx = Math.round(cx + Math.cos(a) * 25), ry = Math.round(cy + 3 + Math.sin(a) * 7.5 - Math.cos(a) * 3);
      if (rx >= 0 && rx < 56 && ry >= 0 && ry < 56) {
        r(rx, ry, 2, 2, Math.abs(a - Math.PI * 0.5) < 0.7 ? "#d94f3d" : "#e0a342");
      }
    }
  });
}
