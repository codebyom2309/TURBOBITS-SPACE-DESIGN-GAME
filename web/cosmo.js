// COSMO QUEST: Main menu environment, pixel-art banners, Story Campaign (Project Genesis: The Last Signal),
// 78-second Animated Prologue Film, Stage Cinematic Cutscenes, Narrative Mission Debriefing, top bar modals, and live status bar.
"use strict";

(() => {
  const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------------------------------------------------------- Project Genesis Narrative Metadata (Stages & Key Characters)
  const GENESIS_STAGE_LORE = {
    stage1: {
      lead: "Chief Dana Okafor · Horizon Earth Observation Directorate",
      look: { skin: "#8d5a3b", skinD: "#6b4229", hair: "#1e1a17", hairStyle: "short", coat: "#3a4b3c", shirt: "#dfd3b8", badge: true },
      pillar: "EARTHSENTINEL GRID",
      pillarShort: "Earth Grid",
      unlockFacility: "Global Thermal & Cyclone Sentinel Constellation",
      introTitle: "STAGE 01 · PROTECTING EARTH FROM ORBIT",
      introLines: [
        "Late 2026. Megafires, intensifying cyclones, and marine heatwaves are straining terrestrial monitoring networks across five continents.",
        "Before the Horizon Coalition can turn its instruments toward the 1.42 GHz anomaly at Jupiter, we must stabilize our homeworld's observation grid.",
        "Your assignment: deploy thermal wildfire sentries, geostationary storm trackers, and polar ocean altimeters to close Earth's blind spots."
      ],
      completionEvent: "EarthSentinel Grid operational. Continuous planetary telemetry locked. Orbital Operations cleared for deployment.",
      nextStageHook: "With Earth's monitoring network online, the Coalition authorizes Stage 02: permanent crewed and robotic orbital infrastructure."
    },
    stage2: {
      lead: "Dr. Elena Vance · Deep Space Network & Orbital Relay Lead",
      look: { skin: "#d9a57c", skinD: "#b07f5a", hair: "#2b2018", hairStyle: "bun", coat: "#2c3b55", shirt: "#e9e3d6", glasses: true, badge: true },
      pillar: "ORBITAL RELAY & STATION",
      pillarShort: "Orbital Hub",
      unlockFacility: "Low-Earth Logistics & Optical Relay Ring",
      introTitle: "STAGE 02 · BUILDING ORBITAL INFRASTRUCTURE",
      introLines: [
        "Ground dishes alone lose lock on the 1.42 GHz carrier whenever Jupiter dips behind Earth's horizon or solar interference spikes.",
        "We need a permanent foothold in Low Earth Orbit: logistics resupply, reusable crew transport, debris mitigation, and high-bandwidth optical relays.",
        "Assemble the orbital backbone that every lunar and interplanetary mission will depend upon."
      ],
      completionEvent: "Orbital Outpost and Relay Constellation commissioned. Uninterrupted 24-hour cislunar tracking established.",
      nextStageHook: "Orbital staging is ready. The Horizon Council authorizes Stage 03: returning to the Lunar South Pole."
    },
    stage3: {
      lead: "Dr. Mei Tanaka · Lunar Resources & Cislunar Operations",
      look: { skin: "#e3c19c", skinD: "#b8957a", hair: "#16141a", hairStyle: "bun", coat: "#e8e4dc", shirt: "#3d6fa8", glasses: true },
      pillar: "CISLUNAR & SHACKLETON BASE",
      pillarShort: "Lunar Base",
      unlockFacility: "Shackleton Polar Ice Depot & Far-Side Radio Array",
      introTitle: "STAGE 03 · RETURNING TO THE MOON",
      introLines: [
        "Harmonic analysis of The Last Signal reveals dispersion signatures matching deep subsurface water-ice resonance.",
        "To test our ice-sounding instruments—and to harvest propellant outside Earth's gravity well—we must establish a permanent base at the Lunar South Pole.",
        "Map the shadowed craters, land in rough polar terrain, rove across Shackleton Rim, and sustain a crewed lunar surface habitat."
      ],
      completionEvent: "Shackleton Polar Base active. Lunar water-ice extraction and far-side radio shielding verified.",
      nextStageHook: "Cislunar operations proven. Stage 04 opens the deep-space corridor through the Near-Earth and Main Asteroid Belt."
    },
    stage4: {
      lead: "Dr. Vikram Rao · Planetary Defence & Deep-Space Navigation",
      look: { skin: "#9a6848", skinD: "#744c33", hair: "#1f1b18", hairStyle: "short", coat: "#4a3d31", shirt: "#ece4d4", beard: true, badge: true },
      pillar: "DEEP-SPACE & BELT CORRIDOR",
      pillarShort: "Belt Corridor",
      unlockFacility: "Solar-Electric Propulsion & Sample Curation Vault",
      introTitle: "STAGE 04 · ASTEROIDS & PLANETARY DEFENCE",
      introLines: [
        "Beyond the Moon, spacecraft face multi-year solar cruises, microgravity proximity operations, and inverse-square signal attenuation.",
        "We must survey carbonaceous rubble-pile asteroids, return pristine regolith samples to Earth, and validate kinetic planetary defence.",
        "Master high-Isp ion propulsion and autonomous optical navigation across millions of kilometres."
      ],
      completionEvent: "Deep-space navigation corridor and asteroid resource catalog complete. High-efficiency propulsion qualified for outer planets.",
      nextStageHook: "With interplanetary cruise mastery achieved, the Horizon Coalition greenlights Stage 05: the Mars Campaign."
    },
    stage5: {
      lead: "Dr. Luis Herrera · Mars Exploration & Relay Directorate",
      look: { skin: "#c99a74", skinD: "#9e7454", hair: "#3b2a1e", hairStyle: "curly", coat: "#4b5a3a", shirt: "#e0d8c6", beard: true },
      pillar: "MARS RELAY & EXPEDITION",
      pillarShort: "Mars Network",
      unlockFacility: "Areostationary Ka-Band Relay & Jezero Surface Camp",
      introTitle: "STAGE 05 · ESTABLISHING MARS OPERATIONS",
      introLines: [
        "Whenever Earth passes behind the Sun relative to Jupiter, our listening window goes dark. A high-gain relay network at Mars bridges that conjunction gap.",
        "At the same time, Mars is humanity's proving ground for atmospheric entry, powered sky-crane landings, astrobiology rovers, and multi-window crewed expeditions.",
        "Build the Martian infrastructure that anchors the inner and outer solar system."
      ],
      completionEvent: "Mars Relay Network and Crewed Surface Expedition operational. Outer-system conjunction blind spot eliminated.",
      nextStageHook: "All five inner pillars stand ready. Stage 06 awaits: cross the asteroid belt and investigate The Last Signal at Europa."
    },
    stage6: {
      lead: "Dr. Ingrid Solberg · Outer Planets & Project Genesis Flagship",
      look: { skin: "#efd2bd", skinD: "#c9a891", hair: "#d8c27a", hairStyle: "long", coat: "#2c3b55", shirt: "#e9e3d6", glasses: true, badge: true },
      pillar: "OUTER SYSTEM & EUROPA ARRAY",
      pillarShort: "Europa Array",
      unlockFacility: "Jovian Radiation Vault & Sub-Ice Acoustic Decoder",
      introTitle: "STAGE 06 · THE OUTER SOLAR SYSTEM & THE LAST SIGNAL",
      introLines: [
        "Everything the Horizon Coalition has built—Earth observation, orbital staging, lunar propellant, deep-space ion drives, and Mars relays—converges here.",
        "Station a precision infrared telescope at L2, brave Venus's crushing clouds, fly an RTG rotorcraft on Titan, and send our radiation-hardened flagship into Jupiter's belt.",
        "Orbit Europa, sound its 20-kilometre ice crust, and resolve the scientific mystery of the 1.42 GHz carrier."
      ],
      completionEvent: "PROJECT GENESIS COMPLETE: Europa ice-penetrating radar confirms a natural hydrothermal piezo-electromagnetic resonator above a vast saline ocean—humanity's greatest scientific discovery.",
      nextStageHook: "The Last Signal has been decoded. Humanity now possesses an interplanetary scientific infrastructure spanning from Earth to Jupiter."
    }
  };

  function getStageLore(stId) {
    const norm = stId && /^s(\d)$/.test(stId) ? `stage${stId.slice(1)}` : stId;
    return GENESIS_STAGE_LORE[norm] || GENESIS_STAGE_LORE.stage1;
  }

  // Specific narrative story context per mission so every single one of the 25 missions advances the plot
  const MISSION_STORY_ARC = {
    wildfire: {
      why: "First live test of the Horizon telemetry chain: detect forest ignitions from sun-synchronous orbit before smoke plumes blind ground stations.",
      discovery: "Orbital thermal calibration reveals upper-atmosphere ionospheric ripples interfering with deep-space reception.",
      infra: "EarthSentinel Node 01 (Thermal Fire Watch)"
    },
    storm_watch: {
      why: "Anchor a geostationary weather sentinel 35,786 km above the equator to track rapid cyclone intensification and protect coastal launch pads.",
      discovery: "Continuous microwave sounding isolates clean Ka-band atmospheric windows for deep-space downlink.",
      infra: "EarthSentinel Node 02 (Geostationary Weather Eye)"
    },
    ocean_biosphere: {
      why: "Complete Stage 01 by mapping global ocean colour, chlorophyll shifts, and polar sea ice across warming basins.",
      discovery: "Global ocean carbon and sea-ice models lock in planetary baselines for the Horizon Climate Archive.",
      infra: "EarthSentinel Node 03 (Ocean Biosphere Monitor)"
    },
    gnss_constellation: {
      why: "Establish nanosecond orbital timing and continuous geostationary relay so global stations never lose outer-system lock.",
      discovery: "Synchronized crosslinks eliminate regional ground-station handoff blind spots.",
      infra: "Horizon Geostationary Timing & Relay Ring"
    },
    space_debris: {
      why: "Survey crowded orbital corridors with active radar to clear safe launch lanes for crewed Horizon infrastructure.",
      discovery: "Autonomous radar tracking isolates centimeter-scale debris hazards before heavy-lift flights.",
      infra: "LEO Debris Surveillance Shield"
    },
    iss_resupply: {
      why: "Keep the Low-Earth orbital laboratory supplied and crewed for 24 months while Project Genesis hardware is tested in microgravity.",
      discovery: "Zero-G fluid transfer trials validate long-duration propellant storage.",
      infra: "LEO Logistics & Resupply Corridor"
    },
    crew_transport: {
      why: "Design a reusable, crew-rated spacecraft meeting the strict 1-in-270 safety threshold for regular orbital crew transfers.",
      discovery: "Reusable thermal protection systems cut crew rotation costs by 42%.",
      infra: "Horizon Crew Transport Fleet"
    },
    orbital_outpost: {
      why: "Assemble the Horizon Orbital Outpost module by module to serve as our permanent staging port above Earth.",
      discovery: "Closed-loop life support and high-voltage solar trusses pass 30-month endurance verification.",
      infra: "Horizon Orbital Outpost (LEO Hub)"
    },
    lunar_ice: {
      why: "Scan permanently shadowed craters at the Lunar South Pole with neutron and radar instruments to locate water-ice reserves.",
      discovery: "High-purity water ice (6.4% by mass) confirmed on the floor of Shackleton and Faustini craters.",
      infra: "Lunar Polar Ice Atlas"
    },
    landing_scout: {
      why: "Photomap boulder fields and slope hazards to sub-metre resolution so crewed and robotic landers touch down safely.",
      discovery: "Three sunlit ridge landing zones identified within 800 metres of shadowed ice traps.",
      infra: "Shackleton Precision Hazard Map"
    },
    lunar_relay: {
      why: "Place a long-endurance polar communications and laser-topography satellite in lunar orbit to link Shackleton Base to Earth.",
      discovery: "Continuous south-pole line-of-sight relay removes cislunar blackout windows.",
      infra: "Cislunar Polar Relay Satellite"
    },
    lunar_lander: {
      why: "Touch down on the Lunar South Pole on throttleable rocket engines and drill directly into cryogenic regolith.",
      discovery: "Isotopic analysis of lunar ice matches ancient cometary volatiles—and mirrors the harmonic spacing in the 1.42 GHz signal.",
      infra: "Shackleton Surface Drill Station"
    },
    lunar_base: {
      why: "Construct and supply the crewed Shackleton Surface Habitat across five cislunar launch windows.",
      discovery: "In-situ water electrolysis produces the first lunar-derived liquid oxygen and hydrogen.",
      infra: "Shackleton Crewed Lunar Base"
    },
    asteroid_prospector: {
      why: "Rendezvous with a carbonaceous near-Earth asteroid to test low-gravity proximity flight and map hydrated minerals.",
      discovery: "Rubble-pile interior structure mapped via radio-science gravity tomography.",
      infra: "Near-Earth Asteroid Survey Node"
    },
    kinetic_impactor: {
      why: "Validate autonomous high-speed terminal guidance and measure momentum transfer on a hazardous near-Earth binary asteroid.",
      discovery: "Orbital period altered by 33 minutes—confirming humanity's planetary defence capability.",
      infra: "Kinetic Deflection & Tracking Shield"
    },
    asteroid_sample: {
      why: "Touch an asteroid surface, collect pristine pre-solar grains, and fly a reentry capsule back to Earth.",
      discovery: "Returned amino-acid precursors confirm prebiotic chemistry across the proto-planetary disk.",
      infra: "Curated Extraterrestrial Sample Vault"
    },
    metallic_psyche: {
      why: "Push past 2.5 AU on high-Isp ion thrusters to survey a battered iron-nickel core where sunlight drops below 16%.",
      discovery: "Metallic core magnetometry and deep-space ion navigation qualified for outer-system transit.",
      infra: "Main-Belt Deep Space Navigation Beacon"
    },
    mars_climate: {
      why: "Establish our first Martian orbital weather and Ka-band relay station to bridge solar conjunction blackouts.",
      discovery: "Global dust-storm vertical profiles allow predictive compensation for Ka-band atmospheric attenuation.",
      infra: "Mars Orbital Weather & Relay Node"
    },
    mars_areosat: {
      why: "Map buried Martian water-ice glaciers with ice-penetrating radar and strengthen surface relay bandwidth.",
      discovery: "Subsurface radar reveals continuous mid-latitude glacial ice reservoirs.",
      infra: "Areostationary Ice & Relay Grid"
    },
    mars_rover: {
      why: "Deliver a heavy astrobiology rover to Jezero Crater via sky crane and drill ancient lakebed mudstones.",
      discovery: "Organic carbon rings and iron-phosphate nodules preserved in 3.7-billion-year-old lacustrine strata.",
      infra: "Jezero Astrobiology Surface Lab"
    },
    mars_base: {
      why: "Execute a multi-window crewed Mars surface program—pre-deploying habitats and supplies before astronauts land.",
      discovery: "500-sol human surface stay completed with zero life-support contingencies.",
      infra: "Horizon Mars Base Alpha"
    },
    venus_clouds: {
      why: "Peer through Venus's sulfuric-acid clouds with synthetic aperture radar to understand runaway greenhouse tipping points.",
      discovery: "Active volcanic heat flux measured across Venusian coronae, refining Earth climate resilience models.",
      infra: "Inner-Planet Comparative Climate Archive"
    },
    exoplanet_hunter: {
      why: "Station an ultra-stable infrared observatory at Sun-Earth L2 to lock onto the exact Jovian coordinates of The Last Signal.",
      discovery: "Infrared spectroscopy pinpoints the 1.42 GHz emission to a thermal fracture zone in Europa's southern hemisphere.",
      infra: "L2 Deep-Space Infrared Observatory"
    },
    europa: {
      why: "Survive Jupiter's lethal radiation belts, map Europa's fractured ice shell, and isolate the 1.42 GHz carrier source.",
      discovery: "Beneath 18 km of ice, tidal flexing across a hydrothermal vent generates a natural 72-minute 1.42 GHz electromagnetic resonance.",
      infra: "Europa Sub-Ice Observatory (The Last Signal Decoded)"
    },
    titan_orbiter: {
      why: "PROJECT GENESIS GRAND FINALE: Sample cryovolcanic plumes and map subsurface ocean chemistry across outer-system icy moons.",
      discovery: "FINAL DISCOVERY: Complex prebiotic organics in icy ocean plumes confirm habitable niches throughout the outer Solar System.",
      infra: "Outer-System Cryovolcanic Plume Network"
    }
  };

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
      r(7, 2, 2, 2, "#f3ebd8"); r(6, 4, 4, 1, "#f3ebd8"); r(5, 6, 6, 6, "#d9e6f7");
      r(3, 4, 2, 2, "#9ec4ef"); r(2, 7, 3, 5, "#6b8fb8");
      r(11, 4, 2, 2, "#9ec4ef"); r(11, 7, 3, 5, "#6b8fb8");
    },
    teamhub: (r) => {
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
    },
    download: (r) => {
      r(7, 2, 2, 6, "#f0be64");
      r(4, 6, 8, 2, "#f0be64"); r(5, 8, 6, 1, "#f0be64"); r(6, 9, 4, 1, "#f0be64"); r(7, 10, 2, 1, "#f0be64");
      r(3, 12, 10, 2, "#f3ebd8"); r(3, 10, 2, 2, "#f3ebd8"); r(11, 10, 2, 2, "#f3ebd8");
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

  // -------------------------------------------------------------------------- Full-Bleed Animated Space + Earth Horizon Background (Main Menu Only)
  function cosmoBgScene(canvas) {
    if (!canvas) return () => {};
    const g = canvas.getContext("2d");
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const VH = 360;
    let VW = 640;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const cw = Math.max(320, rect.width || window.innerWidth);
      const ch = Math.max(200, rect.height || window.innerHeight);
      const targetW = Math.max(220, Math.min(860, Math.round(VH * (cw / ch))));
      if (canvas.width !== targetW || canvas.height !== VH) {
        canvas.width = targetW;
        canvas.height = VH;
      }
      VW = targetW;
      g.imageSmoothingEnabled = false;
    }
    resizeCanvas();

    const rnd = _rng(2026);
    const starsList = [];
    for (let i = 0; i < 210; i++) {
      starsList.push({
        nx: rnd(),
        ny: rnd() * 0.78,
        layer: i < 110 ? 0 : i < 175 ? 1 : 2,
        phase: rnd() * Math.PI * 2,
        speedScale: 0.7 + rnd() * 0.6,
        cross: i > 192,
        sz: i < 130 ? 1 : i < 190 ? 1.5 : 2,
        col: i % 9 === 0 ? "#f7d794" : i % 4 === 0 ? "#a9ccf5" : "#eef4ff"
      });
    }

    // Crisp detailed small-pixel Moon (60x60) with multi-tone shading, craters & dithered terminator
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 60; moonCanvas.height = 60;
    {
      const S = 60, R = 26, CX = 30, CY = 30;
      const mg = moonCanvas.getContext("2d");
      const craters = [[20, 21, 5], [36, 31, 4], [25, 40, 3.5], [38, 19, 2.5], [16, 32, 2.5]];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x + 0.5 - CX, dy = y + 0.5 - CY, dist = Math.hypot(dx, dy);
        if (dist > R) continue;
        const lit = (-dx * 0.65 - dy * 0.45) / R;
        const dither = ((x + y) & 1) * 0.08 - 0.04;
        const lv = lit + dither;
        let col = lv > 0.44 ? "#dce4f0" : lv > 0.14 ? "#b4bfd1" : lv > -0.14 ? "#8591a6" : lv > -0.44 ? "#525c73" : "#252d40";
        for (const [cx, cy, cr] of craters) {
          const cd = Math.hypot(x - cx, y - cy);
          if (cd < cr) {
            if (cd > cr - 1.1 && lit > -0.25) col = "#dce4f0";
            else col = lit > 0.15 ? "#8b97ab" : "#3f485c";
          }
        }
        if (R - dist < 1.2 && lit > 0.1) col = "#eef4ff";
        mg.fillStyle = col;
        mg.fillRect(x, y, 1, 1);
      }
    }

    // Crisp detailed small-pixel Jupiter (138x138) with swirled bands, Great Red Spot & dithered terminator
    const jupiterCanvas = document.createElement("canvas");
    jupiterCanvas.width = 138; jupiterCanvas.height = 138;
    {
      const S = 138, R = 65, CX = 69, CY = 69;
      const jg = jupiterCanvas.getContext("2d");
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x + 0.5 - CX, dy = y + 0.5 - CY, dist = Math.hypot(dx, dy);
        if (dist > R) continue;
        const swirl = Math.sin(x * 0.09 + y * 0.04) * 2.2 + Math.cos(x * 0.18 - y * 0.08) * 1.0;
        const band = Math.sin((y + swirl) * 0.29);
        let col = band > 0.55 ? "#f2dec4" : band > 0.2 ? "#e0b889" : band > -0.15 ? "#cc8f5e" : band > -0.55 ? "#b06e46" : "#874d33";
        const grs = ((x - 84) / 11) ** 2 + ((y - 84) / 6.5) ** 2;
        if (grs < 1) col = grs < 0.4 ? "#df6a3d" : "#c7542e";
        const shade = (-dx * 0.72 - dy * 0.35) / R;
        const dither = ((x + y) & 1) * 0.07 - 0.035;
        if (shade + dither < -0.40) col = "#241e2c";
        else if (shade + dither < -0.10) col = _darken(col, 0.5);
        else if (dist > R - 2 && shade > 0.08) col = "#f5e6d0";
        jg.fillStyle = col;
        jg.fillRect(x, y, 1, 1);
      }
    }

    // Pre-baked crisp detailed small-pixel Earth continents & cloud deck tiles (512x120)
    const TW = 512, TH = 120;
    const landTile = document.createElement("canvas");
    landTile.width = TW; landTile.height = TH;
    const cloudTile = document.createElement("canvas");
    cloudTile.width = TW; cloudTile.height = TH;
    {
      const lg = landTile.getContext("2d");
      const cg = cloudTile.getContext("2d");
      for (let y = 0; y < TH; y++) {
        const v = y / 11;
        for (let x = 0; x < TW; x++) {
          const lon = (x / TW) * Math.PI * 2;
          const lVal =
            Math.sin(lon * 3.0 + Math.sin(v * 0.65) * 1.8) +
            Math.sin(lon * 1.0 + v * 0.8) +
            Math.cos(lon * 7.0 - v * 1.9) * 0.26;
          let lc;
          if (lVal > 1.32) lc = "#629452";
          else if (lVal > 1.02) lc = "#488242";
          else if (lVal > 0.86) lc = "#39703a";
          else if (lVal > 0.72) lc = "#367bc2";
          else if (lVal > 0.25) lc = "#22559c";
          else lc = "#1a4280";
          lg.fillStyle = lc;
          lg.fillRect(x, y, 1, 1);

          const cVal =
            Math.sin(lon * 4.0 + v * 1.45) +
            Math.sin(lon * 2.0 - v * 1.75) +
            Math.cos(lon * 9.0 + v * 3.1) * 0.24;
          if (cVal > 1.24) {
            cg.fillStyle = "#edf5fc";
            cg.fillRect(x, y, 1, 1);
          } else if (cVal > 1.10) {
            cg.fillStyle = "#b8cee6";
            cg.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    const meteors = [];
    let tSec = 0;
    let lastTs = 0;
    let meteorCooldown = 1.6;

    function drawFrame(dtSec = 0) {
      const titleEl = document.getElementById("title");
      const active = titleEl && titleEl.classList.contains("active");
      if (!active || document.hidden) return false;

      resizeCanvas();
      const W = canvas.width, H = canvas.height;
      const S = H / 220; // Preserves exact proportions at finer 360p pixel grid
      const anim = !reducedMotion();
      if (anim) {
        tSec += dtSec;
        const follow = 1 - Math.exp(-dtSec * 6.5);
        ptr.x += (ptr.tx - ptr.x) * follow;
        ptr.y += (ptr.ty - ptr.y) * follow;
      }

      // Stepped deep-space night sky backdrop
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#060d18");
      sky.addColorStop(0.55, "#0c1a30");
      sky.addColorStop(1, "#142a4b");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);

      // Crisp small-pixel twinkling stars with 60fps smooth drift & gentle alpha fade
      for (const s of starsList) {
        const speed = s.layer === 0 ? 1.0 : s.layer === 1 ? 2.4 : 4.8;
        const pxOff = ptr.x * (s.layer + 1) * 2.2;
        const pyOff = ptr.y * (s.layer + 1) * 1.6;
        const sx = Math.round((((s.nx * W - (anim ? tSec * speed : 0) + pxOff) % W) + W) % W);
        const sy = Math.round(s.ny * H + pyOff);
        const tw = anim ? (0.5 + 0.5 * Math.sin(tSec * 1.9 * s.speedScale + s.phase)) : 0.8;
        g.globalAlpha = s.layer === 0 ? 0.3 + tw * 0.55 : s.layer === 1 ? 0.5 + tw * 0.45 : 0.7 + tw * 0.3;
        g.fillStyle = s.col;
        const pxSz = s.sz > 1.3 ? 2 : 1;
        g.fillRect(sx, sy, pxSz, pxSz);
        if (s.cross && tw > 0.48) {
          g.globalAlpha = 0.45 * tw;
          g.fillRect(sx - 2, sy, 1, 1); g.fillRect(sx + 2, sy, 1, 1);
          g.fillRect(sx, sy - 2, 1, 1); g.fillRect(sx, sy + 2, 1, 1);
        }
      }
      g.globalAlpha = 1;

      // Crisp small-pixel shooting stars gliding smoothly at 60fps
      if (anim) {
        meteorCooldown -= dtSec;
        if (meteorCooldown <= 0 && meteors.length < 2) {
          meteors.push({ x: W * (0.18 + rnd() * 0.62), y: H * (0.06 + rnd() * 0.26), life: 1.0 });
          meteorCooldown = 2.4 + rnd() * 3.4;
        }
      }
      for (const m of meteors) {
        for (let k = 0; k < 12; k++) {
          g.fillStyle = `rgba(243,235,216,${(1 - k / 12) * m.life})`;
          g.fillRect(Math.round(m.x - k * 2.5), Math.round(m.y - k * 1.0), k < 3 ? 2 : 1, 1);
        }
        if (anim) {
          m.x += 105 * dtSec;
          m.y += 42 * dtSec;
          m.life -= dtSec * 0.95;
        }
      }
      while (meteors.length && meteors[0].life <= 0) meteors.shift();

      const narrow = W < 300;
      const moonX = (narrow ? 4 : W * 0.06) + ptr.x * 4;
      const moonY = H * (narrow ? 0.12 : 0.11) + (anim ? Math.sin(tSec * 0.75) * 2.5 : 0) + ptr.y * 3;
      g.drawImage(moonCanvas, moonX, moonY);

      const jupX = W - (narrow ? 72 : 98) + ptr.x * 5.5;
      const jupY = H * (narrow ? 0.02 : 0.04) + (anim ? Math.cos(tSec * 0.62) * 2.5 : 0) + ptr.y * 4;
      g.drawImage(jupiterCanvas, jupX, jupY);

      // Orbiting pixel moonlet near Jupiter
      const smAng = anim ? tSec * 0.55 : 0.4;
      const smX = Math.round(jupX - 13 + Math.cos(smAng) * 5);
      const smY = Math.round(jupY + 76 + Math.sin(smAng) * 3);
      g.fillStyle = "#9aa7b8"; g.fillRect(smX, smY, 7, 7);
      g.fillStyle = "#cfd8e3"; g.fillRect(smX, smY, 5, 5);
      g.fillStyle = "#4d586b"; g.fillRect(smX + 4, smY + 3, 3, 4);

      if (narrow) {
        const scrim = g.createLinearGradient(0, 68, 0, 155);
        scrim.addColorStop(0, "rgba(6, 13, 24, 0)");
        scrim.addColorStop(0.5, "rgba(6, 13, 24, 0.55)");
        scrim.addColorStop(1, "rgba(6, 13, 24, 0)");
        g.fillStyle = scrim;
        g.fillRect(0, 68, W, 87);
      }

      // Dotted orbital arc + smoothly drifting pixel probe
      g.fillStyle = "rgba(130, 178, 235, 0.44)";
      for (let x = 4; x < Math.max(80, W * 0.22); x += 6) {
        const ay = Math.round(H * 0.37 - Math.sin(x * 0.024) * 8);
        g.fillRect(x, ay, 3, 1);
      }
      const satPhase = anim ? (Math.sin(tSec * 0.42) * 0.5 + 0.5) : 0.48;
      const satX = Math.max(26, W * 0.035) + satPhase * Math.max(40, W * 0.11);
      const satY = H * 0.36 - Math.sin(satX * 0.024) * 8;
      g.save();
      g.translate(satX, satY);
      g.scale(S, S);
      g.fillStyle = "#24508f";
      g.fillRect(-11, -3, 7, 4); g.fillRect(-9, -4, 6, 3);
      g.fillRect(5, 0, 7, 4); g.fillRect(6, -1, 6, 3);
      g.fillStyle = "#6cb0f5";
      g.fillRect(-10, -3, 5, 2); g.fillRect(6, 0, 5, 2);
      g.fillStyle = "#192d4f"; g.fillRect(-4, -1, 8, 2);
      g.fillStyle = "#d8a348"; g.fillRect(-3, -3, 7, 6);
      g.fillStyle = "#f3ebd8"; g.fillRect(-1, -2, 3, 3);
      g.fillStyle = "#9ec4ef"; g.fillRect(0, -6, 1, 3);
      const beaconA = anim ? (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * 4.2))) : 1;
      g.fillStyle = `rgba(232, 74, 60, ${beaconA})`;
      g.fillRect(2, -4, 1, 1);
      g.restore();

      // Crisp small-pixel Curved Earth Horizon (3-step atmosphere bands + 60fps scrolling pixel continents/clouds)
      const R = Math.round(Math.max(440, W * 0.88));
      const ecx = Math.round(W * 0.5);
      const ecy = H + R - Math.round(H * 0.25);
      const topY = Math.max(0, ecy - R);

      [
        [R + 5, "#1b386b"],
        [R + 3, "#4284d6"],
        [R + 1, "#9bd0ff"],
      ].forEach(([ar, acol]) => {
        g.fillStyle = acol;
        g.beginPath();
        g.arc(ecx, ecy, ar, Math.PI * 1.15, Math.PI * 1.85);
        g.lineTo(ecx, H);
        g.closePath();
        g.fill();
      });

      g.save();
      g.beginPath();
      g.arc(ecx, ecy, R, 0, Math.PI * 2);
      g.clip();

      const landShift = anim ? (tSec * 4.2) % TW : 14;
      const cloudShift = anim ? (tSec * 9.0) % TW : 28;
      const stripH = H - topY + 4;
      for (let tx = -landShift; tx < W; tx += TW) {
        g.drawImage(landTile, tx, topY, TW, stripH);
      }
      for (let tx = -cloudShift; tx < W; tx += TW) {
        g.drawImage(cloudTile, tx, topY, TW, stripH);
      }

      // Crisp inner sky haze + left/right dusk shading
      g.strokeStyle = "rgba(134, 190, 247, 0.55)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(ecx, ecy, R - 1.5, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();

      const duskGrad = g.createLinearGradient(0, 0, W, 0);
      duskGrad.addColorStop(0, "rgba(8, 16, 34, 0.58)");
      duskGrad.addColorStop(0.20, "rgba(8, 16, 34, 0)");
      duskGrad.addColorStop(0.80, "rgba(8, 16, 34, 0)");
      duskGrad.addColorStop(1, "rgba(8, 16, 34, 0.58)");
      g.fillStyle = duskGrad;
      g.fillRect(0, topY, W, stripH);
      g.restore();

      // Sunlit horizon pixel glint
      const sunX = Math.round(W * 0.52), sunY = topY + 4;
      g.fillStyle = "rgba(255, 232, 168, 0.45)"; g.fillRect(sunX - 18, sunY, 36, 4);
      g.fillStyle = "rgba(255, 244, 200, 0.88)"; g.fillRect(sunX - 9, sunY, 18, 3);
      g.fillStyle = "#fffdf0"; g.fillRect(sunX - 4, sunY - 1, 8, 3);

      // Foreground Deck, Gantry Tower, Smoothly Scanning Dish & Observatory (crisp small pixels)
      g.save();
      g.scale(S, S);
      const LW = W / S, LH = 220;
      const baseTop = LH - 28;
      g.fillStyle = "#0a1220"; g.fillRect(0, LH - 14, LW, 14);
      g.fillStyle = "#192a45"; g.fillRect(0, LH - 15, LW, 2);
      g.fillStyle = "#314e78";
      for (let x = 0; x < LW; x += 10) g.fillRect(x, LH - 18, 1, 3);
      g.fillRect(0, LH - 18, LW, 1);

      // Left launch gantry tower
      const tx = Math.round(LW * 0.025);
      g.fillStyle = "#0e1729"; g.fillRect(tx, baseTop - 40, 18, 54);
      g.fillStyle = "#2b426b"; g.fillRect(tx - 2, baseTop - 41, 22, 3);
      g.fillStyle = "#1d2e4c";
      for (let yy = baseTop - 36; yy < LH - 16; yy += 6) {
        g.fillRect(tx + 2, yy, 14, 1);
        g.fillRect(tx + 2, yy, 2, 5);
        g.fillRect(tx + 14, yy, 2, 5);
      }
      g.fillStyle = "#d96b38"; g.fillRect(tx + 10, baseTop - 25, 4, 11);
      g.fillStyle = "#ffd980"; g.fillRect(tx + 11, baseTop - 22, 2, 4);
      g.fillStyle = "#2b426b"; g.fillRect(tx + 18, baseTop - 28, 12, 2);
      g.fillStyle = "#15233b"; g.fillRect(tx + 18, LH - 22, 34, 8);
      g.fillStyle = "#f7c96a"; g.fillRect(tx + 24, LH - 18, 5, 2); g.fillRect(tx + 38, LH - 18, 6, 2);
      const towerPulse = anim ? (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * 3.0))) : 1;
      g.fillStyle = `rgba(240, 156, 56, ${towerPulse})`; g.fillRect(tx + 4, baseTop - 44, 3, 3);
      g.fillStyle = `rgba(232, 74, 60, ${towerPulse})`; g.fillRect(tx + 11, baseTop - 44, 3, 3);

      // Smoothly tracking deep-space dish with crisp stepped pixel dish curve
      const dx = Math.round(LW * 0.66);
      const dishTilt = anim ? Math.sin(tSec * 0.72) * 0.14 : 0;
      g.fillStyle = "#132038"; g.fillRect(dx - 16, LH - 24, 34, 10);
      g.fillStyle = "#f7c96a"; g.fillRect(dx - 10, LH - 19, 5, 3); g.fillRect(dx + 2, LH - 19, 6, 3);
      g.fillStyle = "#1b2d4a"; g.fillRect(dx - 3, LH - 29, 6, 6);
      g.save();
      g.translate(dx, LH - 29);
      g.rotate(dishTilt);
      for (let i = -9; i <= 9; i++) {
        const bx = i;
        const by = Math.round(-6 - i * 0.45 + (i * i) * 0.05);
        g.fillStyle = "#2d4c7a"; g.fillRect(bx, by + 1, 2, 2);
        g.fillStyle = "#8cb7eb"; g.fillRect(bx, by, 1, 1);
      }
      g.fillStyle = "#c9d9ed";
      g.fillRect(-3, -11, 1, 5);
      g.fillRect(1, -11, 1, 4);
      g.fillStyle = "#f3ebd8"; g.fillRect(-3, -12, 3, 2);
      g.restore();

      // Right operations complex & TurboBits badge
      const cx0 = Math.round(LW * 0.74);
      g.fillStyle = "#101c30"; g.fillRect(cx0, LH - 36, Math.max(60, LW - cx0 - 4), 22);
      g.fillStyle = "#1d2f4d"; g.fillRect(cx0 + 18, LH - 49, Math.max(36, LW - cx0 - 20), 13);
      g.fillStyle = "#2d4870"; g.fillRect(cx0, LH - 37, Math.max(60, LW - cx0 - 4), 1);
      g.fillStyle = "#2d4870"; g.fillRect(cx0 + 18, LH - 50, Math.max(36, LW - cx0 - 20), 1);
      g.fillStyle = "#9ec4ef"; g.fillRect(cx0 + 25, LH - 52, 5, 3); g.fillRect(cx0 + 33, LH - 52, 5, 3);
      g.fillStyle = "#f3ebd8"; g.fillRect(cx0 + 26, LH - 53, 3, 1); g.fillRect(cx0 + 34, LH - 53, 3, 1);
      g.fillStyle = "#d98a36"; g.fillRect(cx0 + 5, LH - 26, 16, 11);
      g.fillStyle = "#ffd980";
      for (let ry = LH - 24; ry < LH - 16; ry += 2) g.fillRect(cx0 + 7, ry, 12, 1);
      g.fillStyle = "#f7c96a";
      g.fillRect(cx0 + 23, LH - 45, 4, 3); g.fillRect(cx0 + 30, LH - 45, 4, 3); g.fillRect(cx0 + 37, LH - 45, 4, 3);
      const lx = cx0 + 28, ly = LH - 32;
      if (lx + 10 < LW) {
        g.fillStyle = "#f3ebd8"; g.fillRect(lx, ly, 4, 4);
        g.fillStyle = "#d94f3d"; g.fillRect(lx + 5, ly, 4, 4);
        g.fillStyle = "#e0a342"; g.fillRect(lx, ly + 5, 4, 4);
        g.fillStyle = "#c94032"; g.fillRect(lx + 5, ly + 5, 4, 4);
        g.fillStyle = "#9cb5d4"; g.fillRect(lx - 3, ly + 11, 15, 1);
      }
      const rxSpire = Math.min(LW - 8, cx0 + 48);
      g.fillStyle = "#6c96c7"; g.fillRect(rxSpire, LH - 62, 1, 14);
      g.fillStyle = "#c94032"; g.fillRect(rxSpire, LH - 58, 1, 3);
      const spireA = anim ? (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * 3.6 + 1))) : 1;
      g.fillStyle = `rgba(232, 74, 60, ${spireA})`; g.fillRect(rxSpire, LH - 64, 2, 2);
      g.restore();
      return true;
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
    if (cosmoBgScene._rafId) cancelAnimationFrame(cosmoBgScene._rafId);
    drawFrame(0);

    function loop(ts) {
      if (!lastTs) lastTs = ts;
      const dtSec = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
      lastTs = ts;
      if (drawFrame(dtSec) && !reducedMotion()) {
        cosmoBgScene._rafId = requestAnimationFrame(loop);
      } else {
        cosmoBgScene._rafId = 0;
      }
    }
    if (!reducedMotion()) {
      cosmoBgScene._rafId = requestAnimationFrame(loop);
    }
    return () => drawFrame(0);
  }
  window.cosmoBgScene = cosmoBgScene;

  // -------------------------------------------------------------------------- Story Campaign Card Banner (Sunset Launchpad)
  function drawStoryBanner(canvas) {
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = 180, H = 64;
    canvas.width = W; canvas.height = H;
    let tSec = 0;
    let lastTs = 0;

    function frame(dtSec = 0) {
      const titleEl = document.getElementById("title");
      if (!titleEl || !titleEl.classList.contains("active") || document.hidden) return false;
      tSec += dtSec;
      const skyCols = ["#3d4675", "#515485", "#6e618d", "#966d85", "#c27f75", "#e09b6b", "#f2bd78"];
      const bandH = Math.ceil(H / skyCols.length);
      skyCols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bandH, W, bandH); });

      const drawBillow = (bx, by, bw, bh) => {
        g.fillStyle = "#91637c"; g.fillRect(bx, by + 4, bw, bh);
        g.fillStyle = "#c78272"; g.fillRect(bx + 2, by + 2, bw - 4, bh - 2);
        g.fillStyle = "#f2b677"; g.fillRect(bx + 4, by, bw - 8, 3);
      };
      drawBillow(-4, 34, 44, 16);
      drawBillow(18, 40, 32, 12);
      drawBillow(112, 36, 42, 15);
      drawBillow(140, 26, 44, 24);

      g.fillStyle = "#1c1f36"; g.fillRect(0, 50, W, 14);
      g.fillStyle = "#2d3252"; g.fillRect(0, 48, W, 3);

      g.fillStyle = "#161a2e"; g.fillRect(38, 12, 3, 38); g.fillRect(48, 8, 10, 42);
      g.fillStyle = "#354166";
      for (let y = 10; y < 48; y += 5) {
        g.fillRect(49, y, 8, 1);
        g.fillRect(50, y, 1, 4); g.fillRect(55, y, 1, 4);
      }
      g.fillStyle = "#4d5d8c"; g.fillRect(58, 18, 14, 2); g.fillRect(58, 30, 12, 2);

      const rx = 78, ry = 13;
      const flk = reducedMotion() ? 0.5 : (0.5 + 0.5 * Math.sin(tSec * 24));
      g.fillStyle = "#e87835"; g.fillRect(rx - 3, ry + 29, 14, 10 + flk * 2.5);
      g.fillStyle = "#ffd96b"; g.fillRect(rx - 1, ry + 29, 10, 8 + flk * 1.5);
      g.fillStyle = "#fff8dc"; g.fillRect(rx + 2, ry + 29, 4, 6);
      g.fillStyle = `rgba(247, 212, 145, ${0.72 + flk * 0.16})`;
      g.fillRect(rx - 14 - flk * 1.5, 47, 36 + flk * 3, 5);
      g.fillStyle = "rgba(218, 138, 94, 0.7)";
      g.fillRect(rx - 20, 50, 48, 4);

      g.fillStyle = "#222940"; g.fillRect(rx + 3, ry - 5, 2, 5);
      g.fillStyle = "#f4efe2"; g.fillRect(rx + 1, ry, 6, 4);
      g.fillStyle = "#f4efe2"; g.fillRect(rx, ry + 4, 8, 23);
      g.fillStyle = "#cfd6e0"; g.fillRect(rx + 5, ry + 4, 3, 23);
      g.fillStyle = "#1b2438"; g.fillRect(rx, ry + 9, 8, 2); g.fillRect(rx, ry + 18, 8, 2);
      g.fillStyle = "#c94032"; g.fillRect(rx - 2, ry + 21, 2, 6); g.fillRect(rx + 8, ry + 21, 2, 6);
      g.fillStyle = "#4b556b"; g.fillRect(rx, ry + 27, 8, 2);
      return true;
    }

    clearInterval(drawStoryBanner._iv);
    if (drawStoryBanner._rafId) cancelAnimationFrame(drawStoryBanner._rafId);
    frame(0);
    function loop(ts) {
      if (!lastTs) lastTs = ts;
      const dtSec = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
      lastTs = ts;
      if (frame(dtSec) && !reducedMotion()) {
        drawStoryBanner._rafId = requestAnimationFrame(loop);
      } else {
        drawStoryBanner._rafId = 0;
      }
    }
    if (!reducedMotion()) drawStoryBanner._rafId = requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------- Mission Design Lab Banner (Spacecraft Blueprint)
  function drawLabBanner(canvas) {
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = 180, H = 64;
    canvas.width = W; canvas.height = H;
    let tSec = 0;
    let lastTs = 0;

    function frame(dtSec = 0) {
      const titleEl = document.getElementById("title");
      if (!titleEl || !titleEl.classList.contains("active") || document.hidden) return false;
      tSec += dtSec;
      g.fillStyle = "#0d1f3b"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#17345e";
      for (let x = 0; x < W; x += 10) g.fillRect(x, 0, 1, H);
      for (let y = 0; y < H; y += 10) g.fillRect(0, y, W, 1);

      const cx = 90, cy = 32;
      g.fillStyle = "rgba(158, 196, 239, 0.55)";
      for (let x = 14; x < W - 14; x += 5) g.fillRect(x, cy, 3, 1);
      g.fillRect(cx - 56, cy - 2, 1, 5);
      g.fillRect(cx + 56, cy - 2, 1, 5);

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
      g.fillStyle = "#e6f0fc";
      g.fillRect(cx - 14, cy - 1, 6, 3); g.fillRect(cx + 8, cy - 1, 6, 3);
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 9, cy - 12, 18, 24);
      g.fillStyle = "#5c7a9e"; g.fillRect(cx - 7, cy - 10, 14, 20);
      g.fillStyle = "#183354"; g.fillRect(cx - 5, cy - 7, 10, 14);
      g.fillStyle = "#f3ebd8"; g.fillRect(cx - 3, cy - 4, 6, 8);
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 5, cy - 16, 10, 4);
      g.fillStyle = "#3c74b8"; g.fillRect(cx - 3, cy - 15, 6, 2);
      g.fillStyle = "#9bb4d4"; g.fillRect(cx - 4, cy + 12, 8, 3);
      g.fillStyle = "#e6f0fc"; g.fillRect(cx - 2, cy + 15, 4, 2);

      if (!reducedMotion()) {
        const scanX = (tSec * 36) % W;
        const sg = g.createLinearGradient(scanX - 6, 0, scanX + 6, 0);
        sg.addColorStop(0, "rgba(138, 184, 235, 0)");
        sg.addColorStop(0.5, "rgba(138, 184, 235, 0.22)");
        sg.addColorStop(1, "rgba(138, 184, 235, 0)");
        g.fillStyle = sg;
        g.fillRect(scanX - 6, 0, 12, H);
      }
      return true;
    }

    clearInterval(drawLabBanner._iv);
    if (drawLabBanner._rafId) cancelAnimationFrame(drawLabBanner._rafId);
    frame(0);
    function loop(ts) {
      if (!lastTs) lastTs = ts;
      const dtSec = Math.min(0.1, Math.max(0, (ts - lastTs) / 1000));
      lastTs = ts;
      if (frame(dtSec) && !reducedMotion()) {
        drawLabBanner._rafId = requestAnimationFrame(loop);
      } else {
        drawLabBanner._rafId = 0;
      }
    }
    if (!reducedMotion()) drawLabBanner._rafId = requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------- Live Game State Helpers
  function getStoryDone() {
    const sd = store.get("storyDone", {});
    const ag = typeof agency === "function" ? agency() : null;
    const careerDone = (ag && ag.done) || {};
    const freeProg = typeof progress === "function" ? progress() : {};
    // Merge storyDone with career/free completions so any mission flown counts seamlessly
    const merged = { ...sd };
    // Map legacy ch1..ch5 if present
    const legacyMap = { ch1: "wildfire", ch2: "lunar_ice", ch3: "mars_climate", ch4: "exoplanet_hunter", ch5: "europa" };
    Object.entries(legacyMap).forEach(([chId, sc]) => {
      if (sd[chId] && (!merged[sc] || sd[chId].score > merged[sc].score)) {
        merged[sc] = sd[chId];
      }
    });
    Object.entries(careerDone).forEach(([sc, rec]) => {
      if (!merged[sc] || rec.score > merged[sc].score) merged[sc] = rec;
    });
    Object.entries(freeProg).forEach(([sc, rec]) => {
      if (!merged[sc] || rec.score > merged[sc].score) merged[sc] = rec;
    });
    return merged;
  }
  window.getStoryDone = getStoryDone;

  function calcResearchPoints() {
    const a = typeof agency === "function" ? agency() : null;
    const prog = typeof progress === "function" ? progress() : {};
    const sd = getStoryDone();
    const techPts = a ? Math.max(0, (a.tech || []).length - 1) * 15 : 0;
    const medalPts = a ? (a.medals || []).length * 30 : 0;
    const freePts = Object.keys(prog || {}).length * 10;
    const storyPts = Object.keys(sd || {}).filter((k) => !k.startsWith("ch")).length * 25;
    return techPts + medalPts + freePts + storyPts;
  }

  let _onlineState = navigator.onLine;
  async function checkServerHealth() {
    if (!navigator.onLine) {
      _onlineState = false;
      refreshStatusBar();
      return;
    }
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      if (!r.ok) {
        _onlineState = false;
      } else {
        const d = await r.json().catch(() => ({}));
        _onlineState = d.status !== "offline";
      }
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
    const totalDone = (window.CAREER_STAGES || []).reduce(
      (acc, st) => acc + st.missions.filter((m) => sd[m.id] && PASS.includes(sd[m.id].grade)).length,
      0
    );
    const stats = $("#profileStats");
    if (stats) {
      const rank = a ? (a.rep >= 60 ? "Flight Director" : a.rep >= 30 ? "Senior Systems Lead" : "Mission Engineer") : "Cadet Engineer";
      stats.innerHTML = `
        <div class="cq-stat-row"><span>Rank</span><b>${esc(rank)}</b></div>
        <div class="cq-stat-row"><span>Research Points</span><b>${calcResearchPoints()} RP</b></div>
        <div class="cq-stat-row"><span>Agency Funds</span><b>${a ? `${fmt(a.funds)} M$` : "150 M$ (Initial)"}</b></div>
        <div class="cq-stat-row"><span>Project Genesis</span><b>${totalDone} / 25 Missions</b></div>
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

  // -------------------------------------------------------------------------- Project Genesis: 6-Stage, 25-Mission Connected Story Campaign
  let _activeGenesisStage = "stage1";
  let _cutsceneTimer = null;

  function normStageId(id) {
    if (!id) return id;
    return /^s(\d)$/.test(id) ? `stage${id.slice(1)}` : id;
  }

  function isGenesisStageUnlocked(idx, stages, doneMap) {
    if (idx <= 0) return true;
    const prev = stages[idx - 1];
    const reqs = prev.missions.filter((m) => !m.optional);
    return reqs.every((m) => doneMap[m.id] && PASS.includes(doneMap[m.id].grade));
  }

  function isGenesisStageComplete(st, doneMap) {
    const reqs = st.missions.filter((m) => !m.optional);
    return reqs.every((m) => doneMap[m.id] && PASS.includes(doneMap[m.id].grade));
  }

  function openStageCutscene(stageId) {
    const targetId = normStageId(stageId);
    const stages = window.CAREER_STAGES || [];
    const st = stages.find((s) => s.id === targetId) || stages[0];
    if (!st) return;
    const lore = getStageLore(st.id);
    const modal = $("#stageCutsceneModal");
    if (!modal) return;

    if ($("#scModalKicker")) $("#scModalKicker").textContent = `HORIZON COALITION · STAGE ${st.num} TRANSMISSION`;
    if ($("#scModalTitle")) $("#scModalTitle").textContent = lore.introTitle;
    if ($("#scModalBody")) {
      $("#scModalBody").innerHTML = `
        <div class="cq-sc-lead">
          <img class="px cq-sc-avatar" src="${portrait(lore.look, "neutral")}" alt="${esc(lore.lead)}">
          <div>
            <b>${esc(lore.lead)}</b>
            <span>${esc(st.region)} · Target: ${esc(lore.unlockFacility)}</span>
          </div>
        </div>
        <div class="cq-sc-paragraphs">
          ${lore.introLines.map((ln) => `<p>${esc(ln)}</p>`).join("")}
        </div>
      `;
    }
    modal.classList.remove("hidden");

    const cv = $("#scModalCanvas");
    if (!cv) return;
    const g = cv.getContext("2d");
    const W = 320, H = 140;
    cv.width = W; cv.height = H;
    g.imageSmoothingEnabled = false;
    let tick = 0;

    const drawCutsceneFrame = () => {
      if (modal.classList.contains("hidden")) {
        clearInterval(_cutsceneTimer);
        return;
      }
      tick++;
      g.fillStyle = "#060e1c";
      g.fillRect(0, 0, W, H);
      const stNum = parseInt(st.num, 10) || 1;
      const rnd = _rng(300 + stNum);
      for (let i = 0; i < 60; i++) {
        g.fillStyle = i % 6 === 0 ? "#e0a342" : "#dce9f8";
        g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * (H - 28)), 1, 1);
      }

      if (st.id === "stage1") {
        earthLimb(g, W, H, H + 115, 165, tick * 0.25);
        const sx = 80 + Math.round(Math.sin(tick * 0.04) * 65);
        g.fillStyle = "rgba(92, 184, 214, 0.24)";
        g.fillRect(sx - 12, 46, 24, 65);
        g.fillStyle = "#e85d3c";
        g.fillRect(110, 102, 5, 3); g.fillRect(156, 98, 6, 3); g.fillRect(198, 106, 5, 3);
        g.fillStyle = "#2d63a8"; g.fillRect(sx - 16, 40, 11, 5); g.fillRect(sx + 6, 40, 11, 5);
        g.fillStyle = "#e0a342"; g.fillRect(sx - 4, 38, 9, 9);
      } else if (st.id === "stage2") {
        earthLimb(g, W, H, H + 125, 165, tick * 0.15);
        g.fillStyle = "#d9e3f0"; g.fillRect(116, 54, 88, 6); g.fillRect(152, 42, 16, 30);
        g.fillStyle = "#24528a";
        [120, 134, 174, 188].forEach((x) => { g.fillRect(x, 30, 10, 22); g.fillRect(x, 62, 10, 22); });
        const dockX = Math.min(104, 48 + (tick % 80));
        g.fillStyle = "#f4efe2"; g.fillRect(dockX, 54, 10, 6);
        g.fillStyle = "#e0a342"; g.fillRect(dockX - 3, 56, 3, 2);
      } else if (st.id === "stage3") {
        g.fillStyle = "#2a5d9e"; g.fillRect(256, 18, 18, 18);
        g.fillStyle = "#488242"; g.fillRect(260, 22, 7, 6);
        g.fillStyle = "#6c7380"; g.fillRect(0, 92, W, 48);
        g.fillStyle = "#192233"; g.fillRect(68, 98, 110, 42);
        g.fillStyle = "#7fd0f5"; g.fillRect(92, 114, 64, 4);
        g.fillStyle = "#e0a342"; g.fillRect(198, 76, 18, 14);
        g.fillStyle = "#dce9f8"; g.fillRect(230, 80, 28, 12);
      } else if (st.id === "stage4") {
        g.fillStyle = "#6e655c"; g.fillRect(204, 42, 56, 44);
        g.fillStyle = "#8c8275"; g.fillRect(210, 46, 40, 28);
        const px = 76 + Math.round(Math.sin(tick * 0.03) * 18);
        g.fillStyle = "#2d63a8"; g.fillRect(px - 22, 58, 18, 6); g.fillRect(px + 12, 58, 18, 6);
        g.fillStyle = "#e0a342"; g.fillRect(px - 3, 55, 14, 12);
        g.fillStyle = "#6fe0ec"; g.fillRect(px - 12, 60, 9, 2);
      } else if (st.id === "stage5") {
        const mSky = g.createLinearGradient(0, 0, 0, H);
        mSky.addColorStop(0, "#1d1016"); mSky.addColorStop(0.65, "#6b2f24"); mSky.addColorStop(1, "#b85d3b");
        g.fillStyle = mSky; g.fillRect(0, 0, W, H);
        g.fillStyle = "#944328"; g.fillRect(0, 96, W, 44);
        const rx = 90 + (tick % 110);
        g.fillStyle = "#f4efe2"; g.fillRect(rx, 82, 22, 10);
        g.fillStyle = "#222"; g.fillRect(rx + 2, 92, 5, 5); g.fillRect(rx + 15, 92, 5, 5);
        g.fillStyle = "#e0a342"; g.fillRect(216, 80, 36, 16);
      } else {
        g.fillStyle = "#c98556"; g.fillRect(224, 14, 82, 82);
        g.fillStyle = "#e8cfb2"; g.fillRect(224, 28, 82, 10); g.fillRect(224, 54, 82, 10);
        g.fillStyle = "#dce6f2"; g.fillRect(156, 56, 24, 24);
        g.fillStyle = "#7aa2cc"; g.fillRect(159, 66, 18, 2);
        const rPulse = (tick * 2) % 44;
        g.strokeStyle = `rgba(111, 224, 236, ${1 - rPulse / 44})`;
        g.strokeRect(168 - rPulse, 68 - rPulse, rPulse * 2, rPulse * 2);
        g.fillStyle = "#2d63a8"; g.fillRect(62, 62, 18, 5); g.fillRect(92, 62, 18, 5);
        g.fillStyle = "#e0a342"; g.fillRect(80, 58, 12, 12);
      }

      g.fillStyle = "rgba(8, 16, 30, 0.86)";
      g.fillRect(0, H - 20, W, 20);
      g.fillStyle = "#e0a342";
      g.font = "8px Silkscreen, monospace";
      g.fillText(`PILLAR: ${lore.pillar}   SIGNAL: 1.42 GHZ / 72M`, 8, H - 7);
    };

    clearInterval(_cutsceneTimer);
    drawCutsceneFrame();
    if (!reducedMotion()) {
      _cutsceneTimer = setInterval(drawCutsceneFrame, 80);
    }
  }
  window.openStageCutscene = openStageCutscene;

  function openStory(forceStageId = null) {
    if (
      !store.get("genesisPrologueSeen", false) &&
      location.hash !== "#selftest" &&
      !(typeof S !== "undefined" && S.noSave)
    ) {
      store.set("genesisPrologueSeen", true);
      openPrologue();
      return;
    }

    show("story");
    const stages = window.CAREER_STAGES || [];
    if (!stages.length) return;
    const done = getStoryDone();

    if (forceStageId) {
      _activeGenesisStage = forceStageId === "all" ? "all" : normStageId(forceStageId);
    } else if (!_activeGenesisStage || (_activeGenesisStage !== "all" && !stages.some((s) => s.id === _activeGenesisStage))) {
      let pick = stages[0].id;
      stages.forEach((st, idx) => {
        if (isGenesisStageUnlocked(idx, stages, done)) pick = st.id;
      });
      _activeGenesisStage = pick;
    }

    // 1. Render Horizon Coalition World Infrastructure Bar (6 Pillars)
    const worldBar = $("#genesisWorldBar");
    const completedMissions = stages.reduce(
      (acc, st) => acc + st.missions.filter((m) => done[m.id] && PASS.includes(done[m.id].grade)).length,
      0
    );
    const signalClarifiedPct = Math.min(100, Math.round((completedMissions / 25) * 100));
    if ($("#genesisProgressText")) $("#genesisProgressText").textContent = `${completedMissions} / 25 MISSIONS`;
    if ($("#genesisSignalHud")) {
      $("#genesisSignalHud").innerHTML = `<span>1.42 GHz SIGNAL</span><b>${signalClarifiedPct}% DECODED</b>`;
    }
    if (worldBar) {
      worldBar.innerHTML = `
        <div class="cq-gw-top">
          <div class="cq-gw-title">
            <span class="cq-kicker">INTERPLANETARY SURVIVAL INFRASTRUCTURE · LIVE WORLD STATE</span>
            <h4>HORIZON COALITION SOLAR SYSTEM NETWORK (${completedMissions} / 25 MISSIONS OPERATIONAL)</h4>
          </div>
          <div class="cq-gw-signal">
            <span>1.42 GHz EUROPA SIGNAL RESOLUTION</span>
            <div class="cq-gw-sigbar"><i style="width:${signalClarifiedPct}%"></i></div>
            <b>${signalClarifiedPct}% DECODED</b>
          </div>
        </div>
        <div class="cq-gw-pillars">
          ${stages.map((st, idx) => {
            const lore = getStageLore(st.id);
            const reqDone = st.missions.filter((m) => !m.optional && done[m.id] && PASS.includes(done[m.id].grade)).length;
            const reqTotal = st.missions.filter((m) => !m.optional).length;
            const allDone = st.missions.filter((m) => done[m.id] && PASS.includes(done[m.id].grade)).length;
            const unlocked = isGenesisStageUnlocked(idx, stages, done);
            const complete = reqDone >= reqTotal;
            const statusTxt = complete ? "ONLINE" : unlocked ? `BUILDING (${allDone}/${st.missions.length})` : "LOCKED";
            return `
              <div class="cq-gw-pillar ${complete ? "online" : unlocked ? "active" : "locked"}" data-pick-gstage="${st.id}">
                <div class="cq-gwp-head">
                  <span class="cq-gwp-num">S${st.num}</span>
                  <span class="cq-gwp-state">${statusTxt}</span>
                </div>
                <b>${esc(lore.pillarShort)}</b>
                <small>${esc(lore.unlockFacility)}</small>
              </div>
            `;
          }).join("")}
        </div>
      `;
      worldBar.querySelectorAll("[data-pick-gstage]").forEach((el) => {
        el.onclick = () => {
          SFX.click();
          openStory(el.dataset.pickGstage);
        };
      });
    }

    // 2. Render 6-Stage Journey Track
    const stageTrack = $("#genesisStageTrack");
    if (stageTrack) {
      stageTrack.innerHTML = `
        <div class="cq-gtrack-bar">
          ${stages.map((st, idx) => {
            const unlocked = isGenesisStageUnlocked(idx, stages, done);
            const complete = isGenesisStageComplete(st, done);
            const doneCount = st.missions.filter((m) => done[m.id] && PASS.includes(done[m.id].grade)).length;
            const isSel = _activeGenesisStage === st.id;
            return `
              <button type="button" class="cq-gstage-tab ${isSel ? "on" : ""} ${complete ? "done" : ""} ${unlocked ? "" : "locked"}" data-gstage-tab="${st.id}">
                <span class="cq-gst-top">
                  <b>STAGE ${st.num}</b>
                  <i>${complete ? "COMPLETE" : unlocked ? `${doneCount}/${st.missions.length}` : "LOCKED"}</i>
                </span>
                <span class="cq-gst-name">${esc(st.name)}</span>
              </button>
            `;
          }).join("")}
          <button type="button" class="cq-gstage-tab ${_activeGenesisStage === "all" ? "on" : ""}" data-gstage-tab="all">
            <span class="cq-gst-top"><b>ALL 6 STAGES</b><i>25 FILES</i></span>
            <span class="cq-gst-name">Full Campaign Map</span>
          </button>
        </div>
      `;
      stageTrack.querySelectorAll("[data-gstage-tab]").forEach((btn) => {
        btn.onclick = () => {
          SFX.click();
          openStory(btn.dataset.gstageTab);
        };
      });
    }

    // 3. Render Selected Stage(s) Narrative Dossier & Connected Missions
    const list = $("#storyChapters");
    if (!list) return;

    const visibleStages = _activeGenesisStage === "all"
      ? stages
      : stages.filter((st) => st.id === _activeGenesisStage);

    list.innerHTML = visibleStages.map((st) => {
      const idx = stages.indexOf(st);
      const unlocked = isGenesisStageUnlocked(idx, stages, done);
      const complete = isGenesisStageComplete(st, done);
      const lore = getStageLore(st.id);
      const doneCount = st.missions.filter((m) => done[m.id] && PASS.includes(done[m.id].grade)).length;
      const bannerSrc = typeof stageLandscape === "function" ? stageLandscape(st.num) : "";

      const missionCards = st.missions.map((m) => {
        const scObj = S.cat && S.cat.SCENARIOS ? S.cat.SCENARIOS[m.id] : null;
        if (!scObj) return "";
        const rec = done[m.id];
        const passed = rec && PASS.includes(rec.grade);
        const arc = MISSION_STORY_ARC[m.id] || {
          why: m.whyNecessary || scObj.pitch,
          discovery: scObj.story,
          infra: scObj.name
        };
        const client = typeof CLIENTS !== "undefined" && CLIENTS[m.id] ? CLIENTS[m.id] : { name: lore.lead, org: "Horizon Coalition", look: lore.look };
        const artSrc = typeof missionLandscape === "function" ? missionLandscape(m.id) : "";

        return `
          <article class="cq-chapter cq-genesis-card ${!unlocked ? "locked" : ""} ${passed ? "done" : ""}" data-ch="${m.id}">
            <div class="cq-gcard-artwrap">
              ${artSrc ? `<img class="px cq-gcard-art" src="${artSrc}" alt="${esc(scObj.name)}">` : ""}
              <div class="cq-gcard-badges">
                <span class="cq-ch-num">MISSION ${m.num}</span>
                <span class="cq-gcard-req ${!m.optional ? "req" : "opt"}">${!m.optional ? "CORE CAMPAIGN" : "BONUS"}</span>
                ${rec ? `<span class="cq-ch-grade" style="background:${GRADE_COL[rec.grade] || "#3a6b33"}">${rec.grade} · ${rec.score} PTS</span>` : ""}
              </div>
            </div>
            <div class="cq-ch-body">
              <div class="cq-ch-head">
                <span class="cq-ch-loc">${esc(S.cat.DESTINATIONS[scObj.destination].name)} · ${esc(KIND_LABEL[scObj.kind || "orbiter"])}</span>
                <span class="cq-ch-meta">Budget ${fmt(scObj.budget)} M$ · +${m.reward || 110} M$ / +${m.rep || 4} REP</span>
              </div>
              <h3>${esc((scObj.name || m.id).toUpperCase())}</h3>
              <div class="cq-gcard-client">
                <img class="px cq-gcard-Director" src="${portrait(client.look, passed ? "happy" : "neutral")}" alt="${esc(client.name)}">
                <div>
                  <b>${esc(client.name)} · ${esc(client.org)}</b>
                  <p>"${esc(arc.why)}"</p>
                </div>
              </div>
              <div class="cq-ch-obj">
                <div><b>Primary Objectives:</b> ${scObj.goals.map((g) => `${esc(g.label)}${g.required ? "*" : ""}`).join(" · ")}</div>
                <div><b>Infrastructure / Discovery:</b> ${passed ? `<span class="cq-disc-unlocked">UNLOCKED — ${esc(arc.discovery)}</span>` : `<span>Unlocks: ${esc(arc.infra)}</span>`}</div>
              </div>
            </div>
            <div class="cq-ch-act">
              ${!unlocked
                ? `<span class="cq-ch-lock">${icon("lock", 14)} Complete all Core Missions in Stage ${stages[idx - 1].num} to unlock</span>`
                : `
                  <button type="button" class="btn cq-gcard-brief-btn" data-brief-sc="${m.id}">MISSION BRIEFING</button>
                  <button type="button" class="cq-btn-amber" data-launch-ch="${m.id}">${passed ? "REPLAY MISSION" : "DESIGN & LAUNCH"} &gt;</button>
                `}
            </div>
          </article>
        `;
      }).join("");

      return `
        <section class="cq-genesis-stage-block ${complete ? "stage-complete" : ""} ${!unlocked ? "stage-locked" : ""}">
          <div class="cq-gstage-hero">
            ${bannerSrc ? `<img class="px cq-gstage-banner" src="${bannerSrc}" alt="${esc(st.name)}">` : ""}
            <div class="cq-gstage-hero-body">
              <div class="cq-gstage-kicker-row">
                <span class="cq-kicker">STAGE ${st.num} · ${esc(st.region)}</span>
                <span class="cq-gstage-bonus">STAGE COMPLETION BONUS: +${st.rewardFunds || 90} M$ · +${st.rewardRep || 6} REP</span>
              </div>
              <h3>${esc(st.name)} (${doneCount} / ${st.missions.length} COMPLETED)</h3>
              <p class="cq-gstage-summary">${esc(lore.introLines[0])} ${esc(lore.introLines[1])}</p>
              <div class="cq-gstage-leadbar">
                <img class="px cq-gstage-lead-img" src="${portrait(lore.look, complete ? "happy" : "neutral")}" alt="${esc(lore.lead)}">
                <div class="cq-gstage-lead-txt">
                  <b>${esc(lore.lead)}</b>
                  <span>"${esc(complete ? lore.completionEvent : lore.introLines[2])}"</span>
                </div>
                <button type="button" class="btn small cq-watch-cutscene-btn" data-cutscene-stage="${st.id}">WATCH STAGE BRIEFING</button>
              </div>
              ${complete ? `<div class="cq-stage-complete-banner">${icon("check", 14)} <b>STAGE COMPLETE:</b> ${esc(lore.completionEvent)} <em>${esc(lore.nextStageHook)}</em></div>` : ""}
            </div>
          </div>
          <div class="cq-genesis-missions-list">
            ${missionCards}
          </div>
        </section>
      `;
    }).join("");

    // Wire stage cutscene buttons
    list.querySelectorAll("[data-cutscene-stage]").forEach((btn) => {
      btn.onclick = () => {
        SFX.page();
        openStageCutscene(btn.dataset.cutsceneStage);
      };
    });

    // Wire standalone briefing buttons
    list.querySelectorAll("[data-brief-sc]").forEach((btn) => {
      btn.onclick = () => {
        const sc = btn.dataset.briefSc;
        SFX.page();
        if (typeof openStandaloneBriefing === "function") {
          openStandaloneBriefing(sc, () => {
            S.mode = "story";
            S.storyChapter = sc;
            S.noLetter = true;
            startMission(sc);
          });
        }
      };
    });

    // Wire mission launch buttons
    list.querySelectorAll("[data-launch-ch]").forEach((btn) => {
      btn.onclick = () => {
        const sc = btn.dataset.launchCh;
        if (!S.cat || !S.cat.SCENARIOS || !S.cat.SCENARIOS[sc]) return;
        SFX.page();
        S.mode = "story";
        S.storyChapter = sc;
        S.noLetter = false;
        startMission(sc);
      };
    });
  }
  window.openStory = openStory;

  // Record story completion when a story mission finishes
  window.recordStoryResult = (res) => {
    if (!res || !res.sim || !res.sim.launched || !res.design) return;
    const sc = res.design.scenario;
    const raw = store.get("storyDone", {});
    const prev = raw[sc];
    if (!prev || res.score.total > prev.score) {
      raw[sc] = { grade: res.score.grade, score: res.score.total, outcome: res.sim.outcome };
      store.set("storyDone", raw);
    }
    refreshStatusBar();
  };

  // -------------------------------------------------------------------------- Comprehensive Narrative Mission Debriefing (#genesisDebriefPanel)
  function renderGenesisDebrief(res) {
    const panel = $("#genesisDebriefPanel");
    if (!panel || !res || !res.evaluation || !res.sim || !res.score) return;

    const scKey = res.design.scenario;
    const scObj = res.evaluation.scenario || {};
    const sim = res.sim;
    const score = res.score;
    const ev = res.evaluation;
    const mMeta = (window.MISSION_META && window.MISSION_META[scKey]) || { num: "01", stageNum: "01", stageId: "stage1", stageName: "Earth Operations", reward: 110, rep: 4 };
    const stageTitle = mMeta.stageName || mMeta.stageTitle || "Horizon Operations";
    const arc = MISSION_STORY_ARC[scKey] || { why: scObj.pitch || "", discovery: scObj.story || "", infra: scObj.name || scKey };
    const lore = getStageLore(mMeta.stageId || "stage1");

    const passed = PASS.includes(score.grade) && sim.outcome === "success";
    const outcomeBadge = sim.outcome === "success"
      ? `MISSION SUCCESS · GRADE ${score.grade} (${score.total} PTS)`
      : sim.outcome === "partial"
      ? `PARTIAL MISSION · GRADE ${score.grade} (${score.total} PTS)`
      : `MISSION FAILURE (${String(sim.outcome || "FAILED").toUpperCase()}) · GRADE ${score.grade}`;

    const goalsHtml = (ev.science && ev.science.goals ? ev.science.goals : []).map((g) => {
      const achieved = g.met && sim.science_fraction >= 0.5;
      return `
        <div class="cq-deb-goal ${achieved ? "met" : "missed"}">
          <span class="cq-deb-gstatus">${achieved ? "ACHIEVED" : "MISSED"}</span>
          <div class="cq-deb-gbody">
            <b>${esc(g.label)}${g.required ? " (Required)" : " (Optional)"}</b>
            <small>Planned coverage: ${pct(g.fraction)} · Flight science return: ${pct(sim.science_fraction)}</small>
          </div>
        </div>
      `;
    }).join("");

    const flightEvents = sim.events.filter((e) => e.kind !== "end").slice(0, 6);
    const eventsHtml = flightEvents.length
      ? flightEvents.map((e) => `<li class="imp-${esc(e.impact || "neutral")}"><b>Month ${e.month}:</b> ${esc(e.text)}</li>`).join("")
      : `<li>Nominal flight profile across all ${sim.months_survived} operational months.</li>`;

    const reserveLeft = sim.timeline && sim.timeline.length ? sim.timeline[sim.timeline.length - 1].reserve : (sim.reserve_start || 0);
    const rpEarned = passed ? (score.grade === "S" ? 40 : score.grade === "A" ? 30 : 20) : 5;

    const allMissions = (window.CAREER_STAGES || []).flatMap((st) => st.missions);
    const curIdx = allMissions.findIndex((m) => m.id === scKey);
    const nextM = curIdx >= 0 && curIdx + 1 < allMissions.length ? allMissions[curIdx + 1] : null;
    const nextSc = nextM && S.cat && S.cat.SCENARIOS ? S.cat.SCENARIOS[nextM.id] : null;

    panel.innerHTML = `
      <div class="cq-debrief-card">
        <div class="cq-debrief-head">
          <div>
            <span class="cq-kicker">HORIZON COALITION · OFFICIAL POST-FLIGHT ENGINEERING &amp; NARRATIVE DEBRIEF</span>
            <h3>MISSION ${mMeta.num}: ${esc((scObj.name || scKey).toUpperCase())} — ${esc(stageTitle.toUpperCase())}</h3>
          </div>
          <span class="cq-debrief-outcome ${passed ? "ok" : "bad"}">${esc(outcomeBadge)}</span>
        </div>

        <div class="cq-debrief-grid">
          <div class="cq-deb-sec">
            <h5>1. OBJECTIVES ACHIEVED VS. MISSED</h5>
            <div class="cq-deb-goals-list">${goalsHtml}</div>
          </div>

          <div class="cq-deb-sec">
            <h5>2. ENGINEERING &amp; SUBSYSTEM PERFORMANCE</h5>
            <div class="cq-deb-kv">
              <div><span>SURVIVAL DURATION</span><b>${sim.months_survived} / ${sim.months_planned} Months</b></div>
              <div><span>SCIENCE DELIVERED</span><b>${pct(sim.science_fraction)} (${score.parts.science}/${score.max.science} pts)</b></div>
              <div><span>MASS &amp; POWER MARGINS</span><b>${ev.mass && ev.mass.margin != null ? pct(ev.mass.margin) : "N/A"} mass · ${ev.power ? pct(ev.power.margin) : "N/A"} power</b></div>
              <div><span>BUDGET &amp; RESERVE</span><b>${fmt(ev.cost.total)} / ${fmt(ev.cost.budget)} M$ (${fmt(reserveLeft)} M$ left)</b></div>
            </div>
          </div>

          <div class="cq-deb-sec">
            <h5>3. IMPORTANT FLIGHT TELEMETRY EVENTS</h5>
            <ul class="cq-deb-events">${eventsHtml}</ul>
          </div>

          <div class="cq-deb-sec">
            <h5>4. SCIENTIFIC DISCOVERIES &amp; INFRASTRUCTURE UNLOCKED</h5>
            <p class="cq-deb-Body"><b>Scientific Finding:</b> ${passed ? esc(arc.discovery) : "Telemetry incomplete—re-fly mission with higher reliability or science margin to confirm primary findings."}</p>
            <p class="cq-deb-Body"><b>Infrastructure Node:</b> ${passed ? `<span class="cq-disc-unlocked">${esc(arc.infra)} COMMISSIONED</span>` : `${esc(arc.infra)} (Pending successful mission)`}</p>
            <p class="cq-deb-Body"><b>Rewards &amp; Funding:</b> ${passed ? `+${mMeta.reward || 110} M$ Coalition Grant · +${mMeta.rep || 4} Agency Reputation · +${rpEarned} RP` : `+${rpEarned} RP (Diagnostic telemetry credit)`}</p>
          </div>
        </div>

        <div class="cq-debrief-next">
          <div>
            <span class="cq-kicker">CAMPAIGN CONSEQUENCES &amp; NEXT STORY DEVELOPMENT</span>
            <p>${passed
              ? (nextSc
                  ? `With ${esc(scObj.name)} operational, ${esc(lore.lead.split("·")[0].trim())} has cleared your team for Mission ${nextM.num}: ${esc(nextSc.name)} (${esc(S.cat.DESTINATIONS[nextSc.destination].name)}).`
                  : `PROJECT GENESIS COMPLETE! You have decoded The Last Signal and completed the entire 25-mission Solar System infrastructure campaign.`)
              : `Horizon Coalition Review Board requests design revisions on ${esc(scObj.name)} before advancing the ${esc(lore.pillarShort)} pillar.`}</p>
          </div>
          ${passed && nextSc ? `<button type="button" class="cq-btn-amber" id="debriefNextMissionBtn">PROCEED TO ${esc(nextSc.name.toUpperCase())} &gt;</button>` : ""}
        </div>
      </div>
    `;

    const nextBtn = $("#debriefNextMissionBtn");
    if (nextBtn && nextM) {
      nextBtn.onclick = () => {
        SFX.page();
        if (S.mode !== "career") S.mode = "story";
        S.storyChapter = nextM.id;
        S.noLetter = false;
        startMission(nextM.id);
      };
    }
  }
  window.renderGenesisDebrief = renderGenesisDebrief;

  // -------------------------------------------------------------------------- 78-Second Animated Prologue Film (delegated to /web/prologue.js)
  // openPrologue and stopPrologue are provided globally by window.PrologueFilm in prologue.js.

  // -------------------------------------------------------------------------- Wire Main Menu, Prologue & Campaign Interactions
  function initCosmoMenu() {
    hydrateIcons();
    drawStoryBanner($("#storyBanner"));
    drawLabBanner($("#labBanner"));

    const wire = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
    wire("#navLabBtn", () => { SFX.page(); go("free"); });
    wire("#navHallBtn", () => { SFX.page(); go("hall"); });
    wire("#navProfileBtn", () => { SFX.page(); openProfileModal(); });
    wire("#navSettingsBtn", () => { SFX.page(); openSettingsModal(); });
    wire("#navAboutBtn", () => { SFX.page(); openAboutModal(); });
    wire("#sbProfileBtn", () => { SFX.page(); openProfileModal(); });

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
      store.set("genesisPrologueSeen", false);
      $("#setResetConfirm").classList.add("hidden");
      refreshStatusBar();
      toast("Agency career & story progress cleared.");
    });
    wire("#setResetConfirmNo", () => {
      $("#setResetConfirm").classList.add("hidden");
    });
    wire("#settingsCloseBtn", () => $("#settingsModal").classList.add("hidden"));
    wire("#aboutCloseBtn", () => $("#aboutModal").classList.add("hidden"));

    // Story Campaign screen buttons
    wire("#storyBackBtn", () => { SFX.page(); go("title"); });
    wire("#storyPrologueBtn", () => { SFX.page(); openPrologue(); });
    wire("#storyHqBtn", () => { SFX.page(); go("career"); });

    // Stage Cutscene Modal close buttons
    const closeStageCutscene = () => {
      clearInterval(_cutsceneTimer);
      if ($("#stageCutsceneModal")) $("#stageCutsceneModal").classList.add("hidden");
    };
    wire("#scModalClose", closeStageCutscene);
    wire("#scModalContinue", closeStageCutscene);

    // Prologue controls (delegated to window.PrologueFilm)
    wire("#prolPlayBtn", () => window.PrologueFilm && window.PrologueFilm.togglePlay());
    wire("#prolReplayBtn", () => window.PrologueFilm && window.PrologueFilm.replayCurrentScene());
    wire("#prolFinalReplayBtn", () => window.PrologueFilm && window.PrologueFilm.replayFilm());
    wire("#prolSubBtn", () => window.PrologueFilm && window.PrologueFilm.toggleSubtitles());
    wire("#prolPrevBtn", () => window.PrologueFilm && window.PrologueFilm.prevScene());
    wire("#prolNextBtn", () => window.PrologueFilm && window.PrologueFilm.nextScene());
    wire("#prolSkipBtn", () => {
      store.set("genesisPrologueSeen", true);
      if (window.PrologueFilm) window.PrologueFilm.stop();
      SFX.page();
      openStory("stage1");
    });
    wire("#prolEnterMcBtn", () => {
      store.set("genesisPrologueSeen", true);
      if (window.PrologueFilm) window.PrologueFilm.stop();
      SFX.page();
      openStory("stage1");
    });
    wire("#prolToStoryBtn", () => {
      store.set("genesisPrologueSeen", true);
      if (window.PrologueFilm) window.PrologueFilm.stop();
      SFX.page();
      openStory();
    });
    wire("#prolBackBtn", () => {
      if (window.PrologueFilm) window.PrologueFilm.stop();
      SFX.page();
      go("title");
    });

    document.addEventListener("keydown", (e) => {
      const pEl = $("#prologue");
      if (!pEl || !pEl.classList.contains("active") || !window.PrologueFilm) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") { e.preventDefault(); window.PrologueFilm.togglePlay(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); window.PrologueFilm.prevScene(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); window.PrologueFilm.nextScene(); }
      else if (e.key === "r" || e.key === "R") { window.PrologueFilm.replayCurrentScene(); }
      else if (e.key === "c" || e.key === "C") { window.PrologueFilm.toggleSubtitles(); }
    });

    ["#profileModal", "#settingsModal", "#aboutModal", "#stageCutsceneModal"].forEach((sel) => {
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
