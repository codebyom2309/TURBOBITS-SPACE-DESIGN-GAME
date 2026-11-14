// COSMO QUEST — Mission Landscapes, 6-Stage 25-Mission Career Campaign,
// Deep Individual Mission Briefing Dossiers, Free Design Browsing & Hall of Fame.
"use strict";

(() => {
  // --------------------------------------------------------------------------
  // 1. 6-STAGE, 25-MISSION CAMPAIGN SPECIFICATION & PREREQUISITE GRAPH
  // --------------------------------------------------------------------------
  const CAREER_STAGES = [
    {
      id: "stage1",
      num: "01",
      name: "EARTH OPERATIONS",
      region: "Low & Geostationary Earth Orbit (1.0 AU)",
      difficulty: "Beginner",
      rewardFunds: 90,
      rewardRep: 6,
      intro: "Establish your agency's orbital telemetry backbone around Earth. Master sun-synchronous lighting, eclipse battery sizing, and continuous weather watch.",
      learn: [
        "How orbital altitude trades spatial resolution against ground swath coverage.",
        "Why Sun-synchronous polar orbits pass over every latitude at consistent local solar lighting.",
        "Sizing solar arrays and Li-ion batteries to survive 36-minute Low Earth Orbit shadow eclipses.",
        "Matching thermal, optical, and spectral instruments to Earth-observation science goals."
      ],
      missions: [
        {
          id: "wildfire",
          num: "01",
          stageNum: "01",
          optional: false,
          prereq: [],
          rep: 0,
          reward: 110,
          launchSite: "Vandenberg SLC-4E · Polar Corridor",
          whyNecessary: "Megafires destroy millions of hectares of forest before ground watchtowers spot the smoke. Daily orbital thermal detection catches ignition hotspots within hours.",
          constraints: "Tight 180 M$ starter budget; requires daily global revisit (SSO) and both thermal hotspot detection and optical burn-scar mapping.",
          risks: "Atmospheric drag in low orbits without station-keeping thrusters; insufficient ground station passes to downlink daily imagery."
        },
        {
          id: "storm_watch",
          num: "02",
          stageNum: "01",
          optional: false,
          prereq: ["wildfire"],
          rep: 0,
          reward: 140,
          launchSite: "Cape Canaveral SLC-40 · Equatorial Transfer",
          whyNecessary: "Atlantic tropical cyclones intensify rapidly between low-orbit passes. Only an unblinking high-altitude weather sentinel can track eye-wall formation minute by minute.",
          constraints: "Reaching Geostationary Orbit (35,786 km) demands 1,500 m/s of onboard insertion delta-v and a 5-year operational lifetime.",
          risks: "Selecting cold-gas or no propulsion leaves the spacecraft stranded in transfer orbit; coarse resolution from 35,786 km penalizes small cameras."
        },
        {
          id: "ocean_biosphere",
          num: "03",
          stageNum: "01",
          optional: true,
          prereq: ["wildfire"],
          rep: 4,
          reward: 135,
          launchSite: "Vandenberg SLC-4E · Sun-Synchronous",
          whyNecessary: "Marine phytoplankton and polar ice sheets regulate Earth's carbon cycle. Scientists need weekly hyperspectral ocean-color and sea-ice maps.",
          constraints: "Requires high-data-rate IR spectroscopy (30 Mbps) paired with an X-band downlink and commercial polar ground stations.",
          risks: "Data bottleneck if flying a low-gain UHF patch antenna with a high-bitrate imaging spectrometer."
        }
      ]
    },
    {
      id: "stage2",
      num: "02",
      name: "ORBITAL OPERATIONS",
      region: "LEO Logistics, MEO/GEO & Human Spaceflight",
      difficulty: "Intermediate – Advanced",
      rewardFunds: 180,
      rewardRep: 10,
      intro: "Scale from single satellites to orbital infrastructure, debris radar tracking, reusable crew shuttles, and multi-launch modular space stations.",
      learn: [
        "High-energy geostationary insertion and magnetospheric radiation belt monitoring.",
        "Radar power budgeting for Synthetic Aperture Radar (SAR) in Earth orbit.",
        "Reusable crewed spacecraft engineering: hull aerodynamics, heat shields, and launch escape systems.",
        "Multi-launch orbital assembly: sequencing core modules, solar trusses, habitats, and cargo resupply."
      ],
      missions: [
        {
          id: "gnss_constellation",
          num: "04",
          stageNum: "02",
          optional: false,
          prereq: [["storm_watch", "ocean_biosphere"]],
          rep: 6,
          reward: 155,
          launchSite: "Kourou ELA-3 / Cape Canaveral · GTO",
          whyNecessary: "Global aviation and orbital rendezvous depend on nanosecond navigation timing and continuous hemispheric weather relay from geostationary altitude.",
          constraints: "5-year station-keeping requirement in GEO with magnetospheric field calibration and atmospheric sounding.",
          risks: "Propellant depletion over a 5-year GEO tour if using low-Isp thrusters."
        },
        {
          id: "space_debris",
          num: "05",
          stageNum: "02",
          optional: true,
          prereq: [["storm_watch", "ocean_biosphere"]],
          rep: 8,
          reward: 170,
          launchSite: "Vandenberg Polar Complex · High-Inclination LEO",
          whyNecessary: "Hypervelocity debris fragments threaten every crewed mission in Low Earth Orbit. Active radar mapping and Van Allen belt profiling clear the path for human stations.",
          constraints: "Synthetic Aperture Radar draws 180 W during observation passes; requires a Medium bus and Medium solar array.",
          risks: "Power brownouts during radar sweeps or insufficient onboard storage between ground contacts."
        },
        {
          id: "iss_resupply",
          num: "06",
          stageNum: "02",
          optional: false,
          prereq: ["gnss_constellation"],
          rep: 10,
          reward: 240,
          launchSite: "Kennedy Space Center LC-39A · ISS Inclination 51.6°",
          whyNecessary: "Keep the International Space Station continuously inhabited and stocked with food, water, oxygen, and science cargo across 8 launch windows.",
          constraints: "Crews of 4 must rotate every 6 months on crew-rated rockets; supply reserves must never drop to zero.",
          risks: "Cargo launch failure without a buffer month of supplies forces an emergency station evacuation."
        },
        {
          id: "crew_transport",
          num: "07",
          stageNum: "02",
          optional: true,
          prereq: ["iss_resupply"],
          rep: 15,
          reward: 320,
          launchSite: "Cape Canaveral LC-40 / LC-39A · Crew Corridor",
          whyNecessary: "Design an indigenous reusable crew spacecraft capable of flying 40 astronaut seats to orbit over five years at low per-seat cost.",
          constraints: "Hard crew-safety rule: Loss of Crew probability must be safer than 1 in 270 flights. Launcher must be human-rated.",
          risks: "Omitting a launch escape system or flying fragile heat-shield tiles without inspection drives loss-of-crew risk past board limits."
        },
        {
          id: "orbital_outpost",
          num: "08",
          stageNum: "02",
          optional: false,
          prereq: ["iss_resupply"],
          rep: 18,
          reward: 380,
          launchSite: "Kennedy Space Center LC-39A · Heavy Lift Pad",
          whyNecessary: "Assemble a next-generation modular space station in Low Earth Orbit piece by piece—Core, Truss, Habitat, and Research Lab—and sustain 24 crew-months aboard.",
          constraints: "Strict assembly order: Core must fly before Truss/Habitat, and Habitat + Power must be on orbit before the first crew launches.",
          risks: "Launching astronauts before life support and power trusses are docked results in immediate mission rejection."
        }
      ]
    },
    {
      id: "stage3",
      num: "03",
      name: "LUNAR EXPLORATION",
      region: "Cislunar Space & Lunar South Pole (384,400 km)",
      difficulty: "Intermediate – Advanced",
      rewardFunds: 240,
      rewardRep: 14,
      intro: "Leave Earth's protective magnetic field for the Moon. Map permanently shadowed ice craters, scout boulder-free landing zones, touch down on the airless surface, and supply Artemis Base Camp.",
      learn: [
        "Trans-Lunar Injection (TLI) mass limits and lunar orbit capture delta-v (~700–900 m/s).",
        "Why magnetorquers fail beyond Earth's magnetic field, requiring reaction wheels and star trackers.",
        "Deep Space Network (DSN) communications across cislunar distances.",
        "Powered retro-rocket descent onto an airless world and surviving frigid lunar nights."
      ],
      missions: [
        {
          id: "lunar_ice",
          num: "09",
          stageNum: "03",
          optional: false,
          prereq: ["wildfire"],
          rep: 8,
          reward: 160,
          launchSite: "Cape Canaveral · Trans-Lunar Injection",
          whyNecessary: "Water ice trapped in permanently shadowed south-pole craters can provide drinking water, oxygen, and rocket propellant for lunar astronauts.",
          constraints: "Optical cameras cannot see inside dark craters—requires a Neutron Spectrometer or UV LAMP spectrograph plus Laser Altimeter.",
          risks: "Low Lunar Orbit requires 150 m/s/yr of fuel to fight lunar mascon gravity anomalies; frozen elliptical orbit saves fuel."
        },
        {
          id: "landing_scout",
          num: "10",
          stageNum: "03",
          optional: false,
          prereq: ["lunar_ice"],
          rep: 14,
          reward: 190,
          launchSite: "Cape Canaveral · Polar Lunar Transfer",
          whyNecessary: "Before human landers touch down near Shackleton Crater, commanders need desk-sized boulder maps and precise slope altimetry.",
          constraints: "High-resolution telescope camera (HiRISE-class) requires 0.005° precision pointing and a high-gain X-band dish to return 120 Mbps.",
          risks: "Standard reaction wheels (0.05°) blur the telescope imagery; low-gain antennas lose 80% of the science data."
        },
        {
          id: "lunar_relay",
          num: "11",
          stageNum: "03",
          optional: true,
          prereq: ["lunar_ice"],
          rep: 14,
          reward: 185,
          launchSite: "Cape Canaveral · Cislunar Transfer",
          whyNecessary: "Establish a long-endurance polar communications and laser-topography orbiter to keep south-pole expeditions in continuous contact with Earth.",
          constraints: "4-year mission duration requiring stable frozen or halo lunar orbit and radiation-tolerant avionics.",
          risks: "Choosing an unstable low polar orbit burns excessive propellant over a 4-year service tour."
        },
        {
          id: "lunar_lander",
          num: "12",
          stageNum: "03",
          optional: false,
          prereq: ["landing_scout"],
          rep: 20,
          reward: 240,
          launchSite: "Kennedy Space Center · Direct Lunar Descent",
          whyNecessary: "Maps from orbit aren't enough—touch down on the lunar south pole, drill into the frozen regolith, and bake the samples to confirm water ice.",
          constraints: "The Moon has no atmosphere: parachutes and airbags are useless. Requires a retro-rocket descent stage and surface drill.",
          risks: "Equatorial sites suffer 354-hour nights at -170°C that freeze battery-only landers; shadowed craters require RTG nuclear power."
        },
        {
          id: "lunar_base",
          num: "13",
          stageNum: "03",
          optional: false,
          prereq: ["lunar_lander", "orbital_outpost"],
          rep: 32,
          reward: 440,
          launchSite: "Kennedy Space Center LC-39B · Heavy Lunar Logistics",
          whyNecessary: "Turn the south-pole habitat into a permanent human outpost with nuclear/solar surface power, pressurized rovers, and regular crew rotations.",
          constraints: "Requires a 10 kW surface power tower before a crew of 4 can survive the two-week lunar night.",
          risks: "Under-sizing surface power or missing a lunar cargo delivery leaves the base crew rationing in darkness."
        }
      ]
    },
    {
      id: "stage4",
      num: "04",
      name: "ASTEROID & PLANETARY DEFENCE",
      region: "Near-Earth & Main-Belt Asteroids (1.3–2.7 AU)",
      difficulty: "Intermediate – Advanced",
      rewardFunds: 280,
      rewardRep: 16,
      intro: "Venture into deep interplanetary space where microgravity, multi-year cruises, and inverse-square signal loss test every subsystem—then bring pristine asteroid samples home to Earth.",
      learn: [
        "Proximity operations around microgravity bodies where spacecraft hover or ride the day-night terminator.",
        "Deep-space telecommunications using high-gain X/Ka-band dishes and 34m/70m DSN antennas.",
        "Touch-and-Go (TAGSAM) sample collection and Earth atmospheric re-entry capsule mass/delta-v budgeting.",
        "Planetary defense impactor telemetry and metallic protoplanet core magnetometry."
      ],
      missions: [
        {
          id: "asteroid_prospector",
          num: "14",
          stageNum: "04",
          optional: false,
          prereq: ["lunar_ice"],
          rep: 16,
          reward: 195,
          launchSite: "Cape Canaveral · Deep-Space Escape Trajectory",
          whyNecessary: "A 500-meter near-Earth asteroid crosses Earth's orbital neighborhood every few decades. Characterize its mineralogy, spin state, and water content.",
          constraints: "At 1.4 AU, solar flux drops to 51% of Earth's and radio signals weaken by 2.25×. Requires continuous station-keeping thrusters.",
          risks: "Fast flybys save fuel but capture only 5% of the science; hovering or terminator orbits require bipropellant or monopropellant."
        },
        {
          id: "kinetic_impactor",
          num: "15",
          stageNum: "04",
          optional: true,
          prereq: ["asteroid_prospector"],
          rep: 22,
          reward: 230,
          launchSite: "Vandenberg / Cape Canaveral · Interplanetary Intercept",
          whyNecessary: "Verify humanity's planetary defense capability by observing a hypervelocity kinetic deflection test, mapping the impact crater, and measuring the momentum transfer.",
          constraints: "Demands telescope-grade 0.005° precision pointing, laser altimetry, and Ka-band high-gain telemetry across 1.5 AU.",
          risks: "Missing the optimal launch window reduces launcher payload capacity and increases cruise duration."
        },
        {
          id: "asteroid_sample",
          num: "16",
          stageNum: "04",
          optional: false,
          prereq: ["asteroid_prospector"],
          rep: 26,
          reward: 280,
          launchSite: "Cape Canaveral SLC-41 · Sample Return Trajectory",
          whyNecessary: "Orbital spectrometers can't match terrestrial laboratories. Touch the asteroid for five seconds, capture pristine carbon-rich regolith, and parachute it into the Utah desert.",
          constraints: "Must carry a Touch-and-Go sampler arm, an Earth return capsule, and extra propellant for the 380 m/s Earth-return burn.",
          risks: "Single-chute return capsules carry a higher re-entry parachute failure risk than dual-chute large capsules."
        },
        {
          id: "metallic_psyche",
          num: "17",
          stageNum: "04",
          optional: true,
          prereq: ["asteroid_sample"],
          rep: 30,
          reward: 295,
          launchSite: "Kennedy Space Center LC-39A · Main-Belt Transfer",
          whyNecessary: "Explore a battered iron-nickel asteroid—the exposed metallic core of an early planetesimal—to study planetary core formation directly.",
          constraints: "3-year science tour plus 2.2-year cruise requiring magnetometer boom, plasma detector, IR spectrometer, and laser altimeter.",
          risks: "Long 5.2-year total flight duration ages solar arrays and demands generous mass and power margins."
        }
      ]
    },
    {
      id: "stage5",
      num: "05",
      name: "MARS EXPLORATION",
      region: "Martian Orbit & Surface (1.52 AU · 26-Month Synodic Windows)",
      difficulty: "Advanced – Expert",
      rewardFunds: 360,
      rewardRep: 20,
      intro: "Conquer the Red Planet. Navigate strict 26-month planetary launch windows, profile global dust storms, land a nuclear-powered astrobiology rover in an ancient river delta, and lead the first human expedition to Mars.",
      learn: [
        "Planetary synodic launch windows (every 26 months for Mars) and schedule slip penalties.",
        "Aerobraking and orbital capture at 1.52 AU where solar power is only 43% of Earth's.",
        "Atmospheric Entry, Descent, and Landing (EDL) with heat shields, parachutes, and Sky Crane.",
        "Pre-deploying surface habitats and nuclear power a full window ahead of human Mars crews."
      ],
      missions: [
        {
          id: "mars_climate",
          num: "18",
          stageNum: "05",
          optional: false,
          prereq: [["landing_scout", "asteroid_prospector"]],
          rep: 22,
          reward: 250,
          launchSite: "Cape Canaveral · Mars Hohmann Transfer (26-mo Window)",
          whyNecessary: "Planet-encircling Martian dust storms threaten every surface lander. Profile the atmosphere from orbit and sound for buried subsurface water ice.",
          constraints: "Sunlight at Mars is 43% of Earth's; cold space requires survival heaters; 2.5 AU radio link requires Ka-band or high-gain X-band.",
          risks: "Rushing the earliest launch window increases development cost and risks a 26-month synodic slip."
        },
        {
          id: "mars_areosat",
          num: "19",
          stageNum: "05",
          optional: true,
          prereq: ["mars_climate"],
          rep: 28,
          reward: 285,
          launchSite: "Cape Canaveral · Low Mars Aerobraking Transfer",
          whyNecessary: "Map buried Martian water-ice glaciers with ice-penetrating radar and provide high-bandwidth orbital relay for incoming surface missions.",
          constraints: "Ice-penetrating radar requires a low 300 km circular orbit (aerobraking) and large 6 kW solar wings.",
          risks: "In high elliptical or areostationary orbits, subsurface radar cannot penetrate the ground."
        },
        {
          id: "mars_rover",
          num: "20",
          stageNum: "05",
          optional: false,
          prereq: ["mars_climate", "lunar_lander"],
          rep: 36,
          reward: 350,
          launchSite: "Cape Canaveral SLC-41 · Mars Direct Entry",
          whyNecessary: "Land a mobile astrobiology laboratory inside an ancient lake-bed delta to drill mudstones and search for 3.5-billion-year-old biosignatures.",
          constraints: "Martian dust coats solar panels at 8%/year—MMRTG nuclear power and a Sky Crane descent system are strongly recommended.",
          risks: "Ancient river deltas have cliffs and boulders (7% base landing risk); airbags cannot support a heavy rover."
        },
        {
          id: "mars_base",
          num: "21",
          stageNum: "05",
          optional: false,
          prereq: ["mars_rover", "lunar_base"],
          rep: 50,
          reward: 650,
          launchSite: "Kennedy Space Center LC-39A/B · Multi-Window Mars Fleet",
          whyNecessary: "Humanity's greatest engineering leap: send four astronauts on a 7-month transit to live and explore on the Martian surface for 16 months.",
          constraints: "Mars Habitat and Surface Power Plant MUST land in Window 1 (26 months before the crew) and two Mars Transit Stages must be assembled in orbit.",
          risks: "Launching the crew in the same window as the habitat or running short of surface supplies is a fatal blocker."
        }
      ]
    },
    {
      id: "stage6",
      num: "06",
      name: "DEEP SPACE EXPLORATION",
      region: "Venus, Sun-Earth L2 & The Jovian Ice Moons (0.7–5.2 AU)",
      difficulty: "Advanced – Expert",
      rewardFunds: 500,
      rewardRep: 28,
      intro: "Push to the extremes of the Solar System: pierce Venus's crushing greenhouse clouds with radar, station a cryogenic infrared observatory at L2, and brave Jupiter's lethal radiation belts to explore the subsurface oceans of Europa and beyond.",
      learn: [
        "Operating in extreme thermal environments: intense solar flux at Venus (0.72 AU) vs deep cryogenic cold at L2 and Jupiter (5.2 AU).",
        "Sub-arcsecond pointing (0.005°) for exoplanet transit photometry and infrared spectroscopy.",
        "Surviving Level 3–4 radiation belts using titanium flagship vaults and RAD750-class computers.",
        "Combining giant 18 kW solar arrays with plutonium MMRTGs and 70m Deep Space Network priority dishes."
      ],
      missions: [
        {
          id: "venus_clouds",
          num: "22",
          stageNum: "06",
          optional: false,
          prereq: [["landing_scout", "asteroid_prospector"]],
          rep: 20,
          reward: 230,
          launchSite: "Cape Canaveral · Inner-System Venus Transfer",
          whyNecessary: "Venus is Earth's twin gone wrong: 465°C surface temperatures under opaque sulfuric acid clouds. Use synthetic aperture radar to map its volcanoes through the clouds.",
          constraints: "Optical cameras cannot see through Venus's cloud deck—Synthetic Aperture Radar (SAR) in a low polar orbit is required for surface topography.",
          risks: "High elliptical orbits cannot resolve surface radar targets; 19-month synodic slip if partner hardware is delayed."
        },
        {
          id: "exoplanet_hunter",
          num: "23",
          stageNum: "06",
          optional: false,
          prereq: ["lunar_ice"],
          rep: 24,
          reward: 290,
          launchSite: "Kourou / Cape Canaveral · Sun-Earth L2 Halo Transfer",
          whyNecessary: "Station a cold infrared space telescope 1.5 million km from Earth at Sun-Earth L2 to detect rocky exoplanets and analyze their atmospheric water vapor.",
          constraints: "Cold Infrared Telescope (400 kg, 250 M$) requires a Halo orbit at L2, Precision ADCS (0.005°), and station-keeping propulsion.",
          risks: "Without thrusters, an unstable L2 Halo orbit drifts away within 6 months."
        },
        {
          id: "europa",
          num: "24",
          stageNum: "06",
          optional: false,
          prereq: ["mars_climate", "exoplanet_hunter"],
          rep: 40,
          reward: 480,
          launchSite: "Kennedy Space Center LC-39A · Jupiter Direct / Gravity Assist",
          whyNecessary: "Beneath Europa's fractured ice shell lies a global saltwater ocean twice the volume of Earth's seas. Fly repeated low passes to measure ice thickness and magnetic induction.",
          constraints: "At 5.2 AU, sunlight is 27× weaker (3.7% of Earth); Jupiter's radiation belt is Level 3–4, requiring a Flagship bus vault + RAD750 computer.",
          risks: "Low Europa Orbit (Level 4 radiation, 2,400 m/s capture) fries unshielded avionics; Repeated Flybys (Clipper-style) balance survival and science."
        },
        {
          id: "titan_orbiter",
          num: "25",
          stageNum: "06",
          optional: true,
          prereq: ["europa"],
          rep: 46,
          reward: 540,
          launchSite: "Kennedy Space Center LC-39B · Outer-System Heavy Transfer",
          whyNecessary: "The crowning robotic flagship of your career: fly directly through cryovolcanic plumes of an outer-system ocean world to sample organic molecules and map the ocean floor.",
          constraints: "Requires three mandatory science goals: Mass Spectrometer + IR Spectrometer for plume organics, Ice-Penetrating Radar, and Magnetometer.",
          risks: "High instrument power draw at 5.2 AU demands both Giant Solar Arrays and 3 MMRTG nuclear units plus DSN 70m priority tracking."
        }
      ]
    }
  ];

  const ALL_MISSIONS = CAREER_STAGES.flatMap((st) =>
    st.missions.map((m) => ({ ...m, stageId: st.id, stageName: st.name, stageRegion: st.region }))
  );
  const MISSION_META = Object.fromEntries(ALL_MISSIONS.map((m) => [m.id, m]));

  window.CAREER_STAGES = CAREER_STAGES;
  window.ALL_MISSIONS = ALL_MISSIONS;
  window.MISSION_META = MISSION_META;

  // --------------------------------------------------------------------------
  // 2. PROCEDURAL PIXEL-ART LANDSCAPE ILLUSTRATIONS FOR ALL 25 MISSIONS
  //    No circular planet thumbnails as primary card art! Every mission gets
  //    a bespoke 160x68 wide landscape pixel-art scene.
  // --------------------------------------------------------------------------
  const _artCache = {};
  const _stageArtCache = {};

  function drawStarfield(g, W, H, seed, count = 42, skyTop = "#050b16", skyBot = "#0f203c") {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    const rnd = _rng(seed);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rnd() * W);
      const y = Math.floor(rnd() * (H * 0.85));
      g.fillStyle = i % 7 === 0 ? "#ffd97d" : i % 3 === 0 ? "#9ec4ef" : "#eef4ff";
      g.fillRect(x, y, 1, 1);
    }
  }

  function drawSat(g, cx, cy, opts = {}) {
    const { wingW = 14, wingCol = "#2b6cb0", wingHi = "#63b3ed", busW = 8, busH = 8, busCol = "#e0a342", dish = false, beamCol = null, beamTo = null } = opts;
    if (beamCol && beamTo) {
      g.fillStyle = beamCol;
      for (let i = 0; i < 16; i++) {
        const f = i / 16;
        const bx = Math.round(cx + (beamTo[0] - cx) * f);
        const by = Math.round(cy + (beamTo[1] - cy) * f);
        const bw = Math.max(1, Math.round(1 + f * (opts.beamSpread || 12)));
        g.fillRect(bx - Math.floor(bw / 2), by, bw, 1);
      }
    }
    // Solar wings
    if (wingW > 0) {
      g.fillStyle = "#d9e6f7";
      g.fillRect(cx - busW / 2 - wingW - 2, cy - 3, wingW, 6);
      g.fillRect(cx + busW / 2 + 2, cy - 3, wingW, 6);
      g.fillStyle = wingCol;
      g.fillRect(cx - busW / 2 - wingW - 1, cy - 2, wingW - 2, 4);
      g.fillRect(cx + busW / 2 + 3, cy - 2, wingW - 2, 4);
      g.fillStyle = wingHi;
      for (let x = 2; x < wingW - 3; x += 4) {
        g.fillRect(cx - busW / 2 - wingW + x, cy - 2, 2, 2);
        g.fillRect(cx + busW / 2 + 2 + x, cy - 2, 2, 2);
      }
    }
    // Bus
    g.fillStyle = busCol;
    g.fillRect(Math.round(cx - busW / 2), Math.round(cy - busH / 2), busW, busH);
    g.fillStyle = "#f4efe2";
    g.fillRect(Math.round(cx - busW / 2), Math.round(cy - busH / 2), busW, 1);
    if (dish) {
      g.fillStyle = "#dce9f8";
      g.fillRect(cx - 4, cy + Math.round(busH / 2) + 1, 8, 2);
      g.fillRect(cx, cy + Math.round(busH / 2), 1, 3);
    }
  }

  function missionLandscape(sc) {
    if (_artCache[sc]) return _artCache[sc];
    const W = 160, H = 68;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

    switch (sc) {
      case "wildfire": {
        drawStarfield(g, W, H, 101, 36, "#060e1c", "#182942");
        // Curved forested Earth horizon + glowing wildfire plumes
        for (let y = 42; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 44 + Math.round(((x - 80) * (x - 80)) / 900);
            if (y < cY) continue;
            r(x, y, 1, 1, y === cY ? "#63b3ed" : (x + y) % 5 === 0 ? "#1e4e3a" : "#285e3b");
          }
        }
        // Wildfire smoke & orange hotspots
        [[46, 52], [68, 49], [105, 53]].forEach(([fx, fy], idx) => {
          r(fx - 3, fy, 7, 3, "#e04f33");
          r(fx - 1, fy + 1, 3, 2, "#ffd96b");
          for (let k = 1; k <= 6; k++) {
            r(fx - 2 + k * 2, fy - k * 2, 5 + k, 2, k < 3 ? "rgba(232,120,53,0.75)" : "rgba(160,168,180,0.45)");
          }
          void idx;
        });
        drawSat(g, 76, 18, { wingW: 16, busCol: "#d8a348", beamCol: "rgba(255, 110, 74, 0.22)", beamTo: [68, 50], beamSpread: 26 });
        break;
      }
      case "storm_watch": {
        drawStarfield(g, W, H, 102, 38, "#050c18", "#0e2240");
        // Deep blue Atlantic limb + white spiraling hurricane vortex
        for (let y = 40; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 42 + Math.round(((x - 80) * (x - 80)) / 850);
            if (y >= cY) r(x, y, 1, 1, y === cY ? "#86c5ff" : "#1a4980");
          }
        }
        // Spiraling cyclone arms & eye
        const ex = 88, ey = 54;
        for (let a = 0; a < 90; a++) {
          const rad = 3 + (a / 90) * 24;
          const ang = a * 0.22;
          const px = Math.round(ex + Math.cos(ang) * rad * 1.4);
          const py = Math.round(ey + Math.sin(ang) * rad * 0.45);
          if (py > 43 && py < H) r(px, py, 3, 2, a < 35 ? "#ffffff" : "#cbd5e0");
        }
        r(ex - 2, ey - 1, 4, 2, "#102a4c"); // hurricane eye
        drawSat(g, 84, 15, { wingW: 18, busCol: "#e0a342", dish: true, beamCol: "rgba(134, 197, 255, 0.2)", beamTo: [88, 53], beamSpread: 32 });
        break;
      }
      case "ocean_biosphere": {
        drawStarfield(g, W, H, 103, 35, "#050d1a", "#0d2a4a");
        for (let y = 40; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 42 + Math.round(((x - 80) * (x - 80)) / 850);
            if (y < cY) continue;
            const ice = x < 28 || x > 132;
            const bloom = Math.sin(x * 0.14 + y * 0.3) > 0.35;
            r(x, y, 1, 1, y === cY ? "#7fd0f5" : ice ? "#e6f2ff" : bloom ? "#2bb5a0" : "#154880");
          }
        }
        drawSat(g, 80, 17, { wingW: 15, busCol: "#63b3ed", beamCol: "rgba(43, 181, 160, 0.24)", beamTo: [80, 52], beamSpread: 28 });
        break;
      }
      case "gnss_constellation": {
        drawStarfield(g, W, H, 104, 45, "#040914", "#0c1c36");
        // Distant curved Earth + orbital navigation arcs & timing rings
        for (let y = 48; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 50 + Math.round(((x - 80) * (x - 80)) / 700);
            if (y >= cY) r(x, y, 1, 1, y === cY ? "#7bc1ff" : "#1c4b82");
          }
        }
        for (let x = 8; x < W - 8; x += 4) r(x, Math.round(24 - Math.sin((x / W) * Math.PI) * 8), 2, 1, "rgba(224,163,66,0.55)");
        // Concentric timing pulses
        [8, 14, 20].forEach((rad) => {
          for (let a = 0.2; a < Math.PI - 0.2; a += 0.2) {
            r(80 + Math.cos(a) * rad * 1.3, 20 + Math.sin(a) * rad * 0.8, 1, 1, "#63b3ed");
          }
        });
        drawSat(g, 80, 18, { wingW: 16, busCol: "#e0a342", dish: true });
        break;
      }
      case "space_debris": {
        drawStarfield(g, W, H, 105, 40, "#050b16", "#112240");
        // Earth limb + radar sweep cone + tracked debris streaks
        for (let y = 48; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 50 + Math.round(((x - 80) * (x - 80)) / 780);
            if (y >= cY) r(x, y, 1, 1, y === cY ? "#6cb2eb" : "#183a66");
          }
        }
        drawSat(g, 52, 22, { wingW: 14, busCol: "#cbd5e0", beamCol: "rgba(104, 211, 145, 0.22)", beamTo: [116, 32], beamSpread: 22 });
        // Debris streaks & red target reticles
        [[102, 24], [118, 33], [94, 38], [128, 21]].forEach(([dx, dy]) => {
          r(dx - 4, dy, 4, 1, "#a0aec0");
          r(dx, dy - 1, 3, 3, "#e53e3e");
          r(dx + 1, dy, 1, 1, "#ffd96b");
        });
        break;
      }
      case "iss_resupply": {
        drawStarfield(g, W, H, 106, 38, "#050b16", "#11274a");
        // Earth horizon below
        for (let y = 52; y < H; y++) r(0, y, W, 1, y === 52 ? "#8bd3ff" : "#1e4e8c");
        // ISS truss & large copper/blue solar wings on right
        r(88, 22, 52, 2, "#a0aec0");
        r(104, 18, 18, 10, "#dce9f8");
        r(110, 14, 8, 18, "#cbd5e0");
        [92, 100, 126, 134].forEach((sx) => {
          r(sx, 6, 5, 15, "#c87d32"); r(sx + 1, 7, 3, 13, "#e09f41");
          r(sx, 25, 5, 15, "#c87d32"); r(sx + 1, 26, 3, 13, "#e09f41");
        });
        // Approaching cargo/crew dragon craft on left with docking corridor line
        for (let x = 48; x < 100; x += 4) r(x, 23, 2, 1, "#68d391");
        r(34, 19, 10, 8, "#f4efe2"); r(44, 20, 3, 6, "#cbd5e0");
        r(36, 12, 4, 7, "#2b6cb0"); r(36, 27, 4, 7, "#2b6cb0");
        r(30, 22, 4, 2, "#ffd96b"); // RCS thruster puff
        break;
      }
      case "crew_transport": {
        drawStarfield(g, W, H, 107, 36, "#070f20", "#1c355e");
        // Ascending crew capsule / shuttle separating from upper stage above Earth
        for (let y = 52; y < H; y++) r(0, y, W, 1, y === 52 ? "#9bd0ff" : "#1b467a");
        // Upper booster stage receding left
        r(32, 34, 22, 8, "#cbd5e0"); r(30, 35, 4, 6, "#2d3748");
        // Bright exhaust plume
        r(56, 26, 14, 6, "#e87835"); r(62, 27, 10, 4, "#ffd96b"); r(66, 28, 6, 2, "#ffffff");
        // Sleek crewed spacecraft (capsule + service trunk + windows)
        r(72, 23, 14, 12, "#dce9f8");
        r(86, 24, 12, 10, "#f4efe2");
        r(98, 26, 6, 6, "#ffffff");
        r(91, 26, 4, 3, "#3182ce"); // crew viewport
        r(74, 15, 8, 8, "#2b6cb0"); r(74, 35, 8, 8, "#2b6cb0");
        break;
      }
      case "orbital_outpost": {
        drawStarfield(g, W, H, 108, 42, "#050b16", "#0e2342");
        for (let y = 54; y < H; y++) r(0, y, W, 1, y === 54 ? "#7bc1ff" : "#163d6b");
        // Modular space station under assembly + robotic arm + incoming hab module
        r(48, 26, 68, 2, "#90cdf4"); // main truss
        [52, 60, 102, 110].forEach((sx) => {
          r(sx, 8, 6, 17, "#2b6cb0"); r(sx + 1, 9, 4, 15, "#4299e1");
          r(sx, 29, 6, 17, "#2b6cb0"); r(sx + 1, 30, 4, 15, "#4299e1");
        });
        r(70, 22, 24, 10, "#f4efe2"); // core + hab
        r(78, 14, 10, 8, "#e2e8f0"); // docked lab
        r(75, 25, 3, 3, "#ffd96b"); r(84, 25, 3, 3, "#ffd96b"); // lit crew ports
        // Robotic arm grappling new module on left
        r(64, 18, 8, 2, "#e0a342"); r(58, 14, 6, 2, "#e0a342");
        r(34, 12, 18, 8, "#edf2f7");
        break;
      }
      case "lunar_ice": {
        drawStarfield(g, W, H, 109, 44, "#04070e", "#0c1322");
        // Cratered lunar south pole horizon with deep black shadowed crater + cyan ice glint
        for (let x = 0; x < W; x++) {
          const h = 44 + Math.round(Math.sin(x * 0.08) * 4);
          r(x, h, 1, H - h, "#718096");
          r(x, h, 1, 2, "#cbd5e0");
        }
        // Permanently shadowed crater pit in center
        r(54, 46, 52, 18, "#090d16");
        r(64, 54, 10, 3, "#63b3ed"); r(80, 56, 14, 3, "#7fd0f5"); // water ice deposits
        drawSat(g, 80, 16, { wingW: 15, busCol: "#e0a342", beamCol: "rgba(99, 179, 237, 0.28)", beamTo: [80, 55], beamSpread: 28 });
        break;
      }
      case "landing_scout": {
        drawStarfield(g, W, H, 110, 42, "#04070e", "#0d1626");
        // Detailed lunar ridges, boulders & green lidar scan grid
        for (let x = 0; x < W; x++) {
          const h = 42 + Math.round(Math.cos(x * 0.06) * 5 + Math.sin(x * 0.2) * 2);
          r(x, h, 1, H - h, "#8a95a8");
          if (x % 6 === 0 && h < 50) r(x, h, 4, 1, "#68d391"); // laser altimeter grid
        }
        // Target landing ellipse on flat peak
        for (let x = 62; x <= 98; x += 2) r(x, 52, 1, 1, "#ffd96b");
        drawSat(g, 78, 16, { wingW: 16, busCol: "#dce9f8", dish: true, beamCol: "rgba(104, 211, 145, 0.22)", beamTo: [80, 52], beamSpread: 24 });
        break;
      }
      case "lunar_relay": {
        drawStarfield(g, W, H, 111, 46, "#040812", "#0b162b");
        // Small blue Earth in upper left + Moon limb on right + relay beams
        r(20, 14, 10, 10, "#2b6cb0"); r(22, 15, 5, 4, "#48bb78"); r(21, 13, 8, 1, "#90cdf4");
        for (let x = 70; x < W; x++) {
          const h = 42 + Math.round(((x - 130) * (x - 130)) / 180);
          if (h < H) r(x, h, 1, H - h, "#94a0b3");
        }
        // Surface beacon on lunar ridge
        r(126, 38, 4, 5, "#e0a342"); r(127, 35, 2, 3, "#63b3ed");
        // Relay lines: Earth <-> Relay Sat <-> Lunar Surface
        for (let i = 0; i < 12; i++) {
          r(28 + i * 4, 18 + i * 0.3, 2, 1, "#63b3ed");
          r(82 + i * 3.6, 22 + i * 1.4, 2, 1, "#ffd96b");
        }
        drawSat(g, 78, 22, { wingW: 14, busCol: "#e0a342", dish: true });
        break;
      }
      case "lunar_lander": {
        drawStarfield(g, W, H, 112, 42, "#04070e", "#0a101d");
        // Small Earth above horizon
        r(132, 14, 8, 8, "#3182ce"); r(134, 16, 4, 3, "#68d391");
        // Lunar surface
        for (let x = 0; x < W; x++) {
          const h = 48 + Math.round(Math.sin(x * 0.09) * 3);
          r(x, h, 1, H - h, "#718096");
          r(x, h, 1, 2, "#a0aec0");
        }
        // Descending lunar lander with retro-rocket plume & landing legs
        const lx = 78, ly = 26;
        r(lx - 2, ly + 8, 4, 10, "#ffd96b"); r(lx - 4, ly + 12, 8, 6, "rgba(232,120,53,0.7)");
        r(lx - 14, 48, 28, 3, "rgba(203,213,224,0.65)"); // kicked up lunar dust
        r(lx - 7, ly - 6, 14, 12, "#e0a342"); // gold foil descent stage
        r(lx - 5, ly - 10, 10, 4, "#f4efe2");
        r(lx - 12, ly + 4, 5, 4, "#cbd5e0"); r(lx + 7, ly + 4, 5, 4, "#cbd5e0"); // legs
        r(lx - 18, ly - 4, 10, 3, "#2b6cb0"); r(lx + 8, ly - 4, 10, 3, "#2b6cb0"); // solar wings
        break;
      }
      case "lunar_base": {
        drawStarfield(g, W, H, 113, 44, "#04070e", "#0b1322");
        r(24, 12, 9, 9, "#3182ce"); r(26, 14, 4, 4, "#68d391");
        for (let x = 0; x < W; x++) {
          const h = 46 + Math.round(Math.sin(x * 0.06) * 2);
          r(x, h, 1, H - h, "#64748b");
          r(x, h, 1, 2, "#94a3b8");
        }
        // Pressurized lunar habitats, airlock tunnel, vertical solar towers & rover
        r(46, 34, 24, 13, "#f4efe2"); r(50, 31, 16, 3, "#cbd5e0");
        r(52, 38, 4, 4, "#ffd96b"); r(60, 38, 4, 4, "#ffd96b");
        r(70, 40, 12, 6, "#94a3b8");
        r(82, 36, 18, 11, "#e2e8f0"); r(86, 40, 4, 3, "#ffd96b");
        // Tall polar vertical solar array towers
        r(28, 20, 6, 26, "#2b6cb0"); r(30, 20, 2, 26, "#63b3ed");
        r(114, 22, 6, 24, "#2b6cb0"); r(116, 22, 2, 24, "#63b3ed");
        // Pressurized rover on right
        r(128, 40, 12, 5, "#f4efe2"); r(136, 41, 3, 2, "#63b3ed");
        r(129, 45, 3, 3, "#1a202c"); r(136, 45, 3, 3, "#1a202c");
        break;
      }
      case "asteroid_prospector": {
        drawStarfield(g, W, H, 114, 48, "#04060d", "#0c1224");
        // Craggy tumbling near-Earth asteroid on right
        const ax = 112, ay = 34;
        r(ax - 24, ay - 14, 46, 28, "#6b6257");
        r(ax - 20, ay - 18, 36, 34, "#857a6c");
        r(ax - 12, ay - 12, 28, 22, "#9e9283");
        // Craters & sunlit facet
        r(ax - 8, ay - 6, 8, 7, "#524a40"); r(ax + 6, ay + 2, 9, 8, "#524a40");
        r(ax + 8, ay - 10, 12, 16, "#423c34");
        drawSat(g, 46, 30, { wingW: 16, busCol: "#e0a342", dish: true, beamCol: "rgba(196, 142, 224, 0.24)", beamTo: [96, 34], beamSpread: 20 });
        break;
      }
      case "kinetic_impactor": {
        drawStarfield(g, W, H, 115, 46, "#04060d", "#141229");
        // Asteroid target + bright kinetic impact ejecta cone
        const ax = 116, ay = 36;
        r(ax - 20, ay - 14, 40, 28, "#786e62");
        r(ax - 14, ay - 18, 28, 34, "#94887a");
        // Bright impact flash & ejecta rays shooting left-upward
        r(ax - 22, ay - 4, 8, 8, "#ffffff");
        r(ax - 26, ay - 7, 12, 14, "#ffd96b");
        for (let i = 0; i < 14; i++) {
          r(ax - 24 - i * 3, ay - 2 - i * 1.3, 3, 2, i < 6 ? "#ff9a3c" : "#cbd5e0");
          r(ax - 24 - i * 2.8, ay + 2 + i * 1.1, 3, 2, i < 6 ? "#ff9a3c" : "#cbd5e0");
        }
        drawSat(g, 42, 22, { wingW: 14, busCol: "#dce9f8", dish: true });
        break;
      }
      case "asteroid_sample": {
        drawStarfield(g, W, H, 116, 44, "#04060d", "#0e1424");
        // Rubble-pile asteroid surface close-up + TAGSAM arm touching down
        for (let x = 0; x < W; x++) {
          const h = 48 + Math.round(Math.sin(x * 0.12) * 3);
          r(x, h, 1, H - h, "#5c5449");
          if (x % 5 === 0) r(x, h - 1, 3, 2, "#8c8173");
        }
        // Spacecraft hovering with extended sampler arm & kicked-up pebble cloud
        r(79, 26, 2, 22, "#cbd5e0"); // TAGSAM arm
        r(75, 46, 10, 3, "#e0a342"); // sampler head
        [[68, 42], [72, 38], [88, 40], [92, 44]].forEach(([px, py]) => r(px, py, 2, 2, "#d6cfc2"));
        drawSat(g, 80, 20, { wingW: 18, busCol: "#e0a342", dish: true });
        break;
      }
      case "metallic_psyche": {
        drawStarfield(g, W, H, 117, 48, "#050712", "#141b33");
        // Metallic iron-nickel world with glinting silver/gold crater rims & magnetic field arcs
        const ax = 108, ay = 34;
        for (let k = -24; k <= 24; k += 8) {
          r(ax - 32, ay + k * 0.6, 8, 1, "rgba(240, 127, 160, 0.55)");
          r(ax + 26, ay + k * 0.6, 8, 1, "rgba(240, 127, 160, 0.55)");
        }
        r(ax - 22, ay - 15, 44, 30, "#718096");
        r(ax - 18, ay - 18, 36, 36, "#a0aec0");
        r(ax - 12, ay - 12, 18, 14, "#e2e8f0"); // metallic glint
        r(ax - 4, ay + 2, 10, 8, "#4a5568");
        drawSat(g, 44, 28, { wingW: 18, wingCol: "#2c5282", busCol: "#e0a342", dish: true });
        break;
      }
      case "mars_climate": {
        drawStarfield(g, W, H, 118, 38, "#080710", "#241318");
        // Rusty Mars limb + swirling golden dust storm front
        for (let y = 40; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const cY = 42 + Math.round(((x - 80) * (x - 80)) / 820);
            if (y < cY) continue;
            const storm = x > 65 && x < 135 && Math.sin(x * 0.1 + y * 0.25) > 0.1;
            r(x, y, 1, 1, y === cY ? "#f6ad55" : storm ? "#dd8b47" : "#b85533");
          }
        }
        drawSat(g, 74, 17, { wingW: 17, busCol: "#e0a342", dish: true, beamCol: "rgba(246, 173, 85, 0.22)", beamTo: [95, 52], beamSpread: 28 });
        break;
      }
      case "mars_areosat": {
        drawStarfield(g, W, H, 119, 40, "#080710", "#21121a");
        // Mars crust cross-section with buried blue subsurface glacier layer
        for (let x = 0; x < W; x++) {
          const h = 42 + Math.round(Math.sin(x * 0.07) * 2);
          r(x, h, 1, H - h, "#b85533");
          if (x > 40 && x < 120) r(x, 54, 1, 6, "#63b3ed"); // buried water-ice glacier
        }
        drawSat(g, 80, 16, { wingW: 18, busCol: "#e0a342", dish: true, beamCol: "rgba(99, 179, 237, 0.25)", beamTo: [80, 56], beamSpread: 34 });
        break;
      }
      case "mars_rover": {
        // Warm butterscotch Martian sky & terraced Jezero delta cliffs
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#7c422b");
        sky.addColorStop(0.65, "#c87d4b");
        sky.addColorStop(1, "#e6ac77");
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // Distant delta mesas
        for (let x = 0; x < W; x++) {
          const mh = 34 + Math.round(Math.sin(x * 0.05) * 5);
          r(x, mh, 1, H - mh, "#9c4a2d");
        }
        r(0, 44, W, H - 44, "#b85d38");
        // Six-wheeled Perseverance-class rover with mastcam, RTG & red laser beam hitting rock
        const rx = 64, ry = 44;
        r(rx - 14, ry - 10, 26, 7, "#f4efe2");
        r(rx - 18, ry - 12, 6, 6, "#cbd5e0"); // angled MMRTG
        r(rx + 6, ry - 22, 3, 12, "#cbd5e0"); r(rx + 3, ry - 25, 8, 4, "#ffffff"); // Mastcam
        [-12, -2, 8].forEach((wx) => { r(rx + wx, ry - 2, 6, 6, "#1a202c"); r(rx + wx + 1, ry - 1, 4, 4, "#718096"); });
        // Robotic arm + laser zap on layered outcrop rock
        r(rx + 12, ry - 7, 12, 2, "#e0a342");
        r(rx + 24, ry - 6, 14, 1, "#ff5252");
        r(rx + 36, ry - 10, 18, 12, "#6e321d"); r(rx + 38, ry - 7, 3, 3, "#ffd96b");
        break;
      }
      case "mars_base": {
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#4a221c");
        sky.addColorStop(0.6, "#9c4a32");
        sky.addColorStop(1, "#d4845a");
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        for (let x = 0; x < W; x++) {
          const mh = 38 + Math.round(Math.cos(x * 0.04) * 4);
          r(x, mh, 1, H - mh, "#8c3d25");
        }
        r(0, 46, W, H - 46, "#a84a2c");
        // Mars surface habitat dome, nuclear/solar array, Mars Ascent Vehicle & astronauts
        r(34, 32, 28, 14, "#f4efe2"); r(38, 28, 20, 4, "#e2e8f0");
        r(42, 36, 5, 4, "#ffd96b"); r(51, 36, 5, 4, "#ffd96b");
        // Tall Mars Ascent Vehicle rocket on pad right
        r(112, 16, 10, 30, "#f4efe2"); r(114, 11, 6, 5, "#c94032"); r(110, 42, 14, 4, "#4a5568");
        // Two astronauts walking in white suits
        r(78, 40, 3, 6, "#ffffff"); r(78, 40, 3, 2, "#e0a342");
        r(86, 40, 3, 6, "#ffffff"); r(86, 40, 3, 2, "#e0a342");
        break;
      }
      case "venus_clouds": {
        drawStarfield(g, W, H, 122, 34, "#0d0914", "#2e1f14");
        // Thick golden sulfuric cloud bands + volcanic peak below + SAR radar beam
        for (let y = 36; y < H; y++) {
          const band = Math.sin(y * 0.45) > 0;
          r(0, y, W, 1, y < 44 ? (band ? "#ecc94b" : "#d69e2e") : y < 54 ? "#b7791f" : "#744210");
        }
        // Hidden volcanic dome under clouds illuminated by radar
        r(64, 52, 32, 16, "#5f370e"); r(72, 48, 16, 6, "#975a16");
        drawSat(g, 80, 15, { wingW: 14, busCol: "#e0a342", dish: true, beamCol: "rgba(255, 217, 107, 0.28)", beamTo: [80, 54], beamSpread: 32 });
        break;
      }
      case "exoplanet_hunter": {
        drawStarfield(g, W, H, 123, 56, "#03060f", "#091024");
        // Distant orange star with dark transiting exoplanet disc + atmosphere ring on right
        const sx = 124, sy = 28;
        r(sx - 14, sy - 14, 28, 28, "rgba(246,173,85,0.25)");
        r(sx - 10, sy - 10, 20, 20, "#f6ad55");
        r(sx - 7, sy - 7, 14, 14, "#fffaf0");
        r(sx - 3, sy - 2, 7, 7, "#050814"); // transiting planet silhouette
        r(sx - 4, sy - 3, 9, 1, "#63b3ed"); r(sx - 4, sy + 5, 9, 1, "#63b3ed"); // atmospheric light ring
        // JWST-like L2 infrared observatory with silver sunshield & gold segmented mirror
        r(24, 38, 38, 3, "#cbd5e0"); r(28, 41, 30, 2, "#94a3b8"); r(32, 43, 22, 2, "#64748b");
        r(38, 22, 10, 16, "#ecc94b"); r(40, 24, 6, 12, "#ffd96b"); // gold mirror segments
        r(48, 28, 10, 2, "#cbd5e0"); // secondary mirror tripod
        break;
      }
      case "europa": {
        drawStarfield(g, W, H, 124, 48, "#030712", "#09152b");
        // Looming banded Jupiter on upper left
        for (let y = 4; y < 40; y++) {
          for (let x = 4; x < 44; x++) {
            if (Math.hypot(x - 24, y - 22) <= 18) {
              r(x, y, 1, 1, y % 5 < 2 ? "#d69e6a" : y % 5 < 4 ? "#b06e46" : "#e8cfb2");
            }
          }
        }
        // Fractured cyan-white Europa ice shell + erupting water plume
        for (let x = 0; x < W; x++) {
          const h = 48 + Math.round(((x - 80) * (x - 80)) / 900);
          r(x, h, 1, H - h, "#e2f1ff");
          if ((x * 7) % 23 === 0) r(x, h + 2, 6, 1, "#9c4221"); // reddish lineae fractures
        }
        // Water vapor plume erupting from ice crack
        for (let k = 0; k < 10; k++) {
          r(98 - k, 46 - k * 2, 2 + k * 2, 2, "rgba(144, 205, 244, 0.45)");
        }
        drawSat(g, 86, 18, { wingW: 24, busCol: "#dce9f8", dish: true, beamCol: "rgba(99, 179, 237, 0.25)", beamTo: [98, 50], beamSpread: 22 });
        break;
      }
      case "titan_orbiter": {
        drawStarfield(g, W, H, 125, 50, "#030610", "#0d1a30");
        // Ringed giant planet on upper left + icy moon horizon with multiple cryo-geysers
        r(14, 18, 28, 2, "#cbd5e0");
        r(22, 12, 12, 12, "#ecc94b"); r(24, 14, 8, 8, "#f6e05e");
        for (let x = 0; x < W; x++) {
          const h = 46 + Math.round(Math.sin(x * 0.06) * 2);
          r(x, h, 1, H - h, "#90cdf4");
          r(x, h, 1, 3, "#ebf8ff");
        }
        // Multiple cryovolcanic plumes
        [64, 96, 118].forEach((px) => {
          for (let k = 0; k < 11; k++) r(px - k, 44 - k * 2, 2 + k * 2, 2, "rgba(190, 227, 248, 0.45)");
        });
        drawSat(g, 84, 16, { wingW: 22, busCol: "#e0a342", dish: true, beamCol: "rgba(236, 201, 75, 0.22)", beamTo: [96, 46], beamSpread: 24 });
        break;
      }
      default: {
        drawStarfield(g, W, H, 999, 40, "#050b16", "#0f203c");
        drawSat(g, 80, 28, { wingW: 16, busCol: "#e0a342", dish: true });
      }
    }

    const url = cv.toDataURL();
    _artCache[sc] = url;
    return url;
  }

  function stageLandscape(stageNum) {
    if (_stageArtCache[stageNum]) return _stageArtCache[stageNum];
    const map = {
      "01": "wildfire",
      "02": "orbital_outpost",
      "03": "lunar_lander",
      "04": "asteroid_sample",
      "05": "mars_rover",
      "06": "europa"
    };
    const url = missionLandscape(map[stageNum] || "wildfire");
    _stageArtCache[stageNum] = url;
    return url;
  }

  function podiumBadge(rank) {
    const cols = {
      1: { hi: "#fff3b0", main: "#f6c945", shade: "#b8861b", rib: "#c94032" },
      2: { hi: "#ffffff", main: "#cbd5e0", shade: "#718096", rib: "#2b6cb0" },
      3: { hi: "#fbd38d", main: "#dd8b47", shade: "#8c4a1d", rib: "#38a169" }
    }[rank] || { hi: "#cbd5e0", main: "#718096", shade: "#4a5568", rib: "#2b6cb0" };
    return sprite(24, 24, (r) => {
      // Ribbon
      r(8, 2, 3, 6, cols.rib); r(13, 2, 3, 6, cols.rib);
      // Trophy cup / medallion
      r(5, 7, 14, 9, cols.main);
      r(6, 8, 12, 6, cols.hi);
      r(3, 8, 2, 5, cols.shade); r(19, 8, 2, 5, cols.shade);
      r(8, 16, 8, 2, cols.shade);
      r(10, 18, 4, 3, cols.main);
      r(6, 21, 12, 2, cols.shade);
      // Rank pip inside cup
      if (rank === 1) r(11, 9, 2, 5, "#744210");
      else if (rank === 2) { r(9, 9, 2, 5, "#2d3748"); r(13, 9, 2, 5, "#2d3748"); }
      else { r(8, 9, 2, 5, "#5f370e"); r(11, 9, 2, 5, "#5f370e"); r(14, 9, 2, 5, "#5f370e"); }
    });
  }

  window.missionLandscape = missionLandscape;
  window.stageLandscape = stageLandscape;
  window.podiumBadge = podiumBadge;

  // --------------------------------------------------------------------------
  // 3. MISSION SELECTION & FREE DESIGN CONTROLLER (#select)
  // --------------------------------------------------------------------------
  const selectFilters = {
    search: "",
    dest: "all",
    kind: "all",
    diff: "all",
    sort: "order"
  };

  const DEST_GROUP_OF = {
    earth: "earth",
    moon: "moon",
    moon_surface: "moon",
    mars: "mars",
    mars_surface: "mars",
    venus: "venus",
    asteroid: "asteroid",
    l2: "l2",
    europa: "europa"
  };
  const DEST_GROUP_LABEL = {
    all: "All Destinations",
    earth: "Earth Orbit",
    moon: "The Moon",
    asteroid: "Asteroids",
    mars: "Mars",
    venus: "Venus",
    l2: "Sun-Earth L2",
    europa: "Outer System / Europa"
  };

  function getBestRecord(sc) {
    const prog = typeof progress === "function" ? progress() : {};
    const a = typeof agency === "function" ? agency() : null;
    const careerDone = a && a.done ? a.done[sc] : null;
    const freeDone = prog[sc];
    const drw = typeof drawer !== "undefined" ? drawer.of(sc).find((d) => d.flight) : null;
    const cands = [careerDone, freeDone, drw ? drw.flight : null].filter(Boolean);
    if (!cands.length) return null;
    return cands.sort((x, y) => (y.score || 0) - (x.score || 0))[0];
  }

  function renderSelectScreen() {
    if (!S || !S.cat) return;
    const isCareer = S.mode === "career";
    const titleEl = $("#selectTitle");
    if (titleEl) {
      titleEl.textContent = isCareer
        ? "CAREER ARCHIVE · MISSION CATALOG"
        : "MISSION DESIGN LAB · FREE DESIGN SANDBOX";
    }
    const sbWrap = $("#sandboxWrap");
    if (sbWrap) sbWrap.classList.toggle("hidden", S.mode !== "free");

    const diff = store.get("difficulty", "normal");
    const diffSeg = $("#difficultySeg");
    if (diffSeg) {
      diffSeg.innerHTML = Object.entries(S.cat.DIFFICULTY).map(([k, d]) =>
        `<button type="button" class="cq-seg-btn ${k === diff ? "on" : ""}" data-d="${k}">${esc(d.name)}</button>`
      ).join("");
      diffSeg.querySelectorAll("button").forEach((b) => {
        b.onclick = () => {
          store.set("difficulty", b.dataset.d);
          if (b.dataset.d === "normal") S._engIntroDismissed = {};
          renderSelectScreen();
        };
      });
    }

    // Hydrate filter controls if present
    const searchInp = $("#selectSearch");
    const destSel = $("#selectDestFilter");
    const kindSel = $("#selectKindFilter");
    const diffSel = $("#selectDiffFilter");
    const sortSel = $("#selectSort");

    if (searchInp && searchInp.value !== selectFilters.search) searchInp.value = selectFilters.search;
    if (destSel && !destSel.dataset.wired) {
      destSel.dataset.wired = "1";
      destSel.innerHTML = Object.entries(DEST_GROUP_LABEL).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
      destSel.onchange = () => { selectFilters.dest = destSel.value; renderSelectCards(); };
    }
    if (kindSel && !kindSel.dataset.wired) {
      kindSel.dataset.wired = "1";
      kindSel.innerHTML = `<option value="all">All Categories</option>` +
        Object.entries(KIND_LABEL).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
      kindSel.onchange = () => { selectFilters.kind = kindSel.value; renderSelectCards(); };
    }
    if (diffSel && !diffSel.dataset.wired) {
      diffSel.dataset.wired = "1";
      diffSel.innerHTML = `
        <option value="all">All Difficulties</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
        <option value="Expert">Expert</option>`;
      diffSel.onchange = () => { selectFilters.diff = diffSel.value; renderSelectCards(); };
    }
    if (sortSel && !sortSel.dataset.wired) {
      sortSel.dataset.wired = "1";
      sortSel.innerHTML = `
        <option value="order">Sort: Campaign Order (01–25)</option>
        <option value="diff">Sort: Difficulty (Easy → Expert)</option>
        <option value="budget_asc">Sort: Budget (Low → High)</option>
        <option value="budget_desc">Sort: Budget (High → Low)</option>
        <option value="name">Sort: Mission Name (A → Z)</option>`;
      sortSel.onchange = () => { selectFilters.sort = sortSel.value; renderSelectCards(); };
    }
    if (searchInp && !searchInp.dataset.wired) {
      searchInp.dataset.wired = "1";
      searchInp.oninput = () => { selectFilters.search = searchInp.value.trim().toLowerCase(); renderSelectCards(); };
    }
    const resetBtn = $("#selectResetFilters");
    if (resetBtn && !resetBtn.dataset.wired) {
      resetBtn.dataset.wired = "1";
      resetBtn.onclick = () => {
        selectFilters.search = ""; selectFilters.dest = "all"; selectFilters.kind = "all"; selectFilters.diff = "all"; selectFilters.sort = "order";
        if (searchInp) searchInp.value = "";
        if (destSel) destSel.value = "all";
        if (kindSel) kindSel.value = "all";
        if (diffSel) diffSel.value = "all";
        if (sortSel) sortSel.value = "order";
        renderSelectCards();
      };
    }

    renderSelectCards();
  }

  function renderSelectCards() {
    const folders = $("#folders");
    if (!folders || !S || !S.cat) return;
    const DIFF_RANK = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };

    let list = ALL_MISSIONS.filter((m) => S.cat.SCENARIOS[m.id]);
    if (selectFilters.search) {
      const q = selectFilters.search;
      list = list.filter((m) => {
        const sc = S.cat.SCENARIOS[m.id];
        const dest = S.cat.DESTINATIONS[sc.destination].name;
        const kind = KIND_LABEL[sc.kind || "orbiter"];
        return sc.name.toLowerCase().includes(q) || sc.pitch.toLowerCase().includes(q) ||
          dest.toLowerCase().includes(q) || kind.toLowerCase().includes(q) || m.stageName.toLowerCase().includes(q);
      });
    }
    if (selectFilters.dest !== "all") {
      list = list.filter((m) => DEST_GROUP_OF[S.cat.SCENARIOS[m.id].destination] === selectFilters.dest);
    }
    if (selectFilters.kind !== "all") {
      list = list.filter((m) => (S.cat.SCENARIOS[m.id].kind || "orbiter") === selectFilters.kind);
    }
    if (selectFilters.diff !== "all") {
      list = list.filter((m) => S.cat.SCENARIOS[m.id].difficulty === selectFilters.diff);
    }

    if (selectFilters.sort === "diff") {
      list.sort((a, b) => (DIFF_RANK[S.cat.SCENARIOS[a.id].difficulty] || 0) - (DIFF_RANK[S.cat.SCENARIOS[b.id].difficulty] || 0));
    } else if (selectFilters.sort === "budget_asc") {
      list.sort((a, b) => S.cat.SCENARIOS[a.id].budget - S.cat.SCENARIOS[b.id].budget);
    } else if (selectFilters.sort === "budget_desc") {
      list.sort((a, b) => S.cat.SCENARIOS[b.id].budget - S.cat.SCENARIOS[a.id].budget);
    } else if (selectFilters.sort === "name") {
      list.sort((a, b) => S.cat.SCENARIOS[a.id].name.localeCompare(S.cat.SCENARIOS[b.id].name));
    }

    const countEl = $("#selectCount");
    if (countEl) countEl.textContent = `${list.length} OF ${ALL_MISSIONS.length} MISSIONS`;

    if (!list.length) {
      folders.innerHTML = `<div class="cq-empty-state">No missions match your current filters. Click <b>RESET</b> to view all 25 space missions.</div>`;
      return;
    }

    folders.innerHTML = list.map((m) => {
      const k = m.id;
      const s = S.cat.SCENARIOS[k];
      const dest = S.cat.DESTINATIONS[s.destination];
      const kind = KIND_LABEL[s.kind || "orbiter"];
      const best = getBestRecord(k);
      const hasDraft = typeof drawer !== "undefined" && drawer.of(k).length > 0;
      const diffCls = s.difficulty.toLowerCase();

      return `
        <article class="folder cq-mcard" data-sc="${k}">
          <div class="cq-mcard-art">
            <img class="px cq-mcard-banner" src="${missionLandscape(k)}" alt="${esc(s.name)} illustration" loading="lazy">
            <span class="cq-mcard-num">MISSION ${m.num} &middot; STAGE ${m.stageNum}</span>
            <span class="cq-mcard-kind">${esc(kind.toUpperCase())}</span>
            ${best ? `<span class="f-best cq-mcard-grade" style="background:${GRADE_COL[best.grade] || "#2b6cb0"}">${esc(best.grade)} &middot; ${best.score}</span>` : ""}
          </div>
          <div class="cq-mcard-body">
            <div class="cq-mcard-badges">
              <span class="cq-badge-dest">${esc(dest.name)}</span>
              <span class="cq-badge-diff cq-diff-${diffCls}">${esc(s.difficulty)}</span>
            </div>
            <h3 class="f-name cq-mcard-title">${esc(s.name)}</h3>
            <p class="cq-mcard-pitch">${esc(s.pitch)}</p>
            <div class="cq-mcard-specs">
              <div class="cq-spec-cell"><span>BUDGET</span><b>${fmt(s.budget)} M$</b></div>
              <div class="cq-spec-cell"><span>DURATION</span><b>${s.min_years}+ YR</b></div>
              <div class="cq-spec-cell"><span>STATUS</span><b class="${best ? "st-done" : hasDraft ? "st-prog" : "st-open"}">${best ? `GRADE ${best.grade}` : hasDraft ? "DRAFT SAVED" : "UNLOCKED"}</b></div>
            </div>
            <div class="cq-mcard-actions">
              <button type="button" class="cq-btn-hud cq-btn-sm" data-brief-sc="${k}">BRIEFING</button>
              <button type="button" class="cq-btn-amber cq-btn-sm" data-launch-sc="${k}">ENGINEER &gt;</button>
            </div>
          </div>
        </article>`;
    }).join("");

    folders.querySelectorAll(".folder").forEach((card) => {
      card.onclick = (e) => {
        const briefBtn = e.target.closest("[data-brief-sc]");
        if (briefBtn) {
          e.stopPropagation();
          SFX.page();
          openStandaloneBriefing(briefBtn.dataset.briefSc, "free");
          return;
        }
        if (card.classList.contains("locked")) return SFX.error();
        SFX.page();
        startMission(card.dataset.sc);
      };
    });
  }

  window.renderSelectScreen = renderSelectScreen;

  // --------------------------------------------------------------------------
  // 4. SIX-STAGE CAREER CAMPAIGN CONTROLLER (#hq)
  // --------------------------------------------------------------------------
  let _activeStageId = "stage1"; // "stage1".."stage6" or "all"

  function careerMissionStatus(m) {
    const a = typeof agency === "function" ? agency() : null;
    if (!a) return { state: "available", open: true, why: "" };
    const rec = a.done ? a.done[m.id] : null;
    if (rec && PASS.includes(rec.grade)) {
      return { state: "completed", open: true, rec, label: `COMPLETED · ${rec.grade} (${rec.score})` };
    }
    // Check prerequisites
    const missing = (m.prereq || []).filter((req) => {
      const grp = Array.isArray(req) ? req : [req];
      return !grp.some((k) => a.done && a.done[k] && PASS.includes(a.done[k].grade));
    });
    if (missing.length) {
      const names = missing.map((req) => {
        const grp = Array.isArray(req) ? req : [req];
        return grp.map((k) => (S.cat.SCENARIOS[k] ? S.cat.SCENARIOS[k].name : k)).join(" or ");
      }).join(" + ");
      return { state: "locked", open: false, why: `Requires: ${names}`, label: "LOCKED" };
    }
    if (a.rep < (m.rep || 0)) {
      return { state: "locked", open: false, why: `Requires Agency Reputation ${m.rep} (now ${a.rep})`, label: `LOCKED · REP ${m.rep}` };
    }
    // Check if failed previously in career log or done with F
    const failedInLog = (a.log || []).some((l) => S.cat.SCENARIOS[m.id] && l.text.startsWith(S.cat.SCENARIOS[m.id].name + ": F"));
    if ((rec && !PASS.includes(rec.grade)) || failedInLog) {
      return { state: "failed", open: true, rec, label: "FAILED · RETRY READY" };
    }
    // Check if player has an active draft in drawer
    const hasDraft = typeof drawer !== "undefined" && drawer.of(m.id).length > 0;
    if (hasDraft || (S.design && S.design.scenario === m.id && S.mode === "career")) {
      return { state: "in_progress", open: true, label: "IN PROGRESS" };
    }
    return { state: "available", open: true, label: "AVAILABLE" };
  }

  function checkAndGrantStageRewards(a) {
    if (!a) return;
    a.stageRewards = a.stageRewards || [];
    let changed = false;
    for (const st of CAREER_STAGES) {
      if (a.stageRewards.includes(st.id)) continue;
      const reqMissions = st.missions.filter((m) => !m.optional);
      const allDone = reqMissions.every((m) => a.done && a.done[m.id] && PASS.includes(a.done[m.id].grade));
      if (allDone) {
        a.stageRewards.push(st.id);
        a.funds += st.rewardFunds;
        a.rep = Math.min(100, a.rep + st.rewardRep);
        a.log.push({ month: a.month, text: `Stage ${st.num} (${st.name}) conquered: +${st.rewardFunds} M$, +${st.rewardRep} rep` });
        changed = true;
      }
    }
    if (changed && typeof saveAgency === "function") saveAgency(a);
  }

  function renderCareerCampaign() {
    if (!S || !S.cat || typeof agency !== "function") return;
    const a = agency();
    checkAndGrantStageRewards(a);

    // 1. Render 6-Stage Progression Map (#hqStageMap)
    const mapEl = $("#hqStageMap");
    if (mapEl) {
      const totalDone = ALL_MISSIONS.filter((m) => a.done && a.done[m.id] && PASS.includes(a.done[m.id].grade)).length;
      const stagesHtml = CAREER_STAGES.map((st, idx) => {
        const doneCount = st.missions.filter((m) => a.done && a.done[m.id] && PASS.includes(a.done[m.id].grade)).length;
        const availCount = st.missions.filter((m) => careerMissionStatus(m).open).length;
        const isStageUnlocked = availCount > 0 || doneCount > 0;
        const isStageComplete = st.missions.filter((m) => !m.optional).every((m) => a.done && a.done[m.id] && PASS.includes(a.done[m.id].grade));
        const pctDone = Math.round((doneCount / st.missions.length) * 100);
        const isSel = _activeStageId === st.id;

        return `
          <div class="cq-stage-node ${isSel ? "active" : ""} ${isStageComplete ? "completed" : isStageUnlocked ? "unlocked" : "locked"}" data-stage-id="${st.id}">
            <div class="cq-snode-art">
              <img class="px" src="${stageLandscape(st.num)}" alt="${esc(st.name)}">
              <span class="cq-snode-num">STAGE ${st.num}</span>
              <button type="button" class="cq-learn-btn" data-learn-stage="${st.id}" title="What players will learn in Stage ${st.num}" aria-label="What players will learn in Stage ${st.num}">?</button>
            </div>
            <div class="cq-snode-body">
              <div class="cq-snode-title">${esc(st.name)}</div>
              <div class="cq-snode-meta">${doneCount}/${st.missions.length} Missions &middot; +${st.rewardFunds} M$</div>
              <div class="cq-snode-bar"><i style="width:${pctDone}%"></i></div>
            </div>
            <div class="cq-learn-popover hidden" id="learnPop_${st.id}">
              <div class="cq-learn-head">
                <strong>STAGE ${st.num} &middot; WHAT YOU WILL LEARN</strong>
                <button type="button" class="cq-learn-close" data-close-learn="${st.id}">&times;</button>
              </div>
              <ul>${st.learn.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
            </div>
          </div>
          ${idx < CAREER_STAGES.length - 1 ? `<div class="cq-stage-connector ${isStageComplete ? "done" : ""}" aria-hidden="true"><span>&rarr;</span></div>` : ""}`;
      }).join("");

      mapEl.innerHTML = `
        <div class="cq-campaign-topbar">
          <div>
            <span class="cq-kicker">SIX-STAGE SOLAR SYSTEM CAMPAIGN &middot; ${totalDone} / 25 COMPLETED</span>
            <h3>CAREER PROGRESSION MAP</h3>
          </div>
          <div class="cq-stage-tabs">
            <button type="button" class="cq-seg-btn ${_activeStageId === "all" ? "on" : ""}" data-stage-id="all">ALL 6 STAGES (25)</button>
            ${CAREER_STAGES.map((st) => `<button type="button" class="cq-seg-btn ${_activeStageId === st.id ? "on" : ""}" data-stage-id="${st.id}">S${st.num}</button>`).join("")}
          </div>
        </div>
        <div class="cq-stage-track">${stagesHtml}</div>`;

      mapEl.querySelectorAll("[data-stage-id]").forEach((el) => {
        el.onclick = (e) => {
          if (e.target.closest("[data-learn-stage]") || e.target.closest(".cq-learn-popover")) return;
          SFX.page();
          _activeStageId = el.dataset.stageId;
          renderCareerCampaign();
        };
      });

      // Wire `?` learning-objectives buttons (hover on desktop + tap on mobile)
      mapEl.querySelectorAll("[data-learn-stage]").forEach((btn) => {
        const stId = btn.dataset.learnStage;
        const pop = document.getElementById(`learnPop_${stId}`);
        if (!pop) return;
        btn.onclick = (e) => {
          e.stopPropagation();
          const wasHidden = pop.classList.contains("hidden");
          mapEl.querySelectorAll(".cq-learn-popover").forEach((p) => p.classList.add("hidden"));
          if (wasHidden) pop.classList.remove("hidden");
        };
      });
      mapEl.querySelectorAll("[data-close-learn]").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const pop = document.getElementById(`learnPop_${btn.dataset.closeLearn}`);
          if (pop) pop.classList.add("hidden");
        };
      });
    }

    // 2. Render Stage Detail & Mission Cards (#hqStageView)
    const stageView = $("#hqStageView");
    if (stageView) {
      const stagesToRender = _activeStageId === "all"
        ? CAREER_STAGES
        : [CAREER_STAGES.find((s) => s.id === _activeStageId) || CAREER_STAGES[0]];

      stageView.innerHTML = stagesToRender.map((st) => {
        const doneCount = st.missions.filter((m) => a.done && a.done[m.id] && PASS.includes(a.done[m.id].grade)).length;
        const rewarded = (a.stageRewards || []).includes(st.id);

        const cardsHtml = st.missions.map((m) => {
          const k = m.id;
          const sc = S.cat.SCENARIOS[k];
          const dest = S.cat.DESTINATIONS[sc.destination];
          const status = careerMissionStatus(m);
          const needTech = status.open && typeof researchNeeded === "function" ? researchNeeded(k) : [];
          const diffCls = sc.difficulty.toLowerCase();

          return `
            <article class="cq-career-card st-${status.state}" data-career-sc="${k}">
              <div class="cq-mcard-art">
                <img class="px cq-mcard-banner" src="${missionLandscape(k)}" alt="${esc(sc.name)}">
                <span class="cq-mcard-num">M${m.num} ${m.optional ? "&middot; OPTIONAL" : "&middot; CORE"}</span>
                <span class="cq-mcard-kind">${esc(KIND_LABEL[sc.kind || "orbiter"].toUpperCase())}</span>
                <span class="cq-status-pill pill-${status.state}">${esc(status.label)}</span>
              </div>
              <div class="cq-mcard-body">
                <div class="cq-mcard-badges">
                  <span class="cq-badge-dest">${esc(dest.name)}</span>
                  <span class="cq-badge-diff cq-diff-${diffCls}">${esc(sc.difficulty)}</span>
                </div>
                <h4 class="cq-mcard-title">${esc(sc.name)}</h4>
                <p class="cq-mcard-pitch">${esc(sc.pitch)}</p>
                <div class="cq-mcard-specs">
                  <div class="cq-spec-cell"><span>BUDGET</span><b>${fmt(sc.budget)} M$</b></div>
                  <div class="cq-spec-cell"><span>REWARD</span><b>+${fmt(m.reward)} M$</b></div>
                  <div class="cq-spec-cell"><span>PREREQ</span><b>${m.prereq.length ? m.prereq.map((r) => (Array.isArray(r) ? r.map((x) => `M${MISSION_META[x].num}`).join("/") : `M${MISSION_META[r].num}`)).join(", ") : "STAGE START"}</b></div>
                </div>
                ${!status.open ? `<div class="cq-lock-reason">${icon("lock", 12)} <span>${esc(status.why)}</span></div>` : ""}
                ${needTech.length ? `<div class="cq-tech-needed" data-open-rs="${needTech[0]}">${icon("bolt", 12)} <span>Recommended R&amp;D: ${needTech.map((t) => esc(TECH[t].name)).join(", ")}</span></div>` : ""}
                <div class="cq-mcard-actions">
                  <button type="button" class="cq-btn-hud cq-btn-sm" data-career-brief="${k}">BRIEFING</button>
                  <button type="button" class="cq-btn-amber cq-btn-sm" data-career-launch="${k}" ${!status.open ? "disabled" : ""}>${status.state === "completed" ? "REFLY >" : "ENGINEER >"}</button>
                </div>
              </div>
            </article>`;
        }).join("");

        return `
          <div class="cq-stage-section" data-stage-sec="${st.id}">
            <div class="cq-stage-header">
              <img class="px cq-stage-banner-img" src="${stageLandscape(st.num)}" alt="${esc(st.name)}">
              <div class="cq-stage-header-info">
                <div class="cq-stage-header-top">
                  <span class="cq-kicker">STAGE ${st.num} &middot; ${esc(st.region.toUpperCase())}</span>
                  <span class="cq-stage-reward ${rewarded ? "claimed" : ""}">${rewarded ? "STAGE REWARD CLAIMED" : `STAGE BONUS: +${st.rewardFunds} M$ · +${st.rewardRep} REP`}</span>
                </div>
                <h3>${esc(st.name)} <small>(${doneCount} / ${st.missions.length} Completed &middot; ${esc(st.difficulty)})</small></h3>
                <p>${esc(st.intro)}</p>
              </div>
              <div class="cq-stage-learn-box">
                <button type="button" class="cq-learn-trigger" data-banner-learn="${st.id}">
                  <span class="cq-q-icon">?</span>
                  <span>WHAT YOU WILL LEARN</span>
                </button>
                <div class="cq-banner-learn-panel hidden" id="bannerLearn_${st.id}">
                  <ul>${st.learn.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
                </div>
              </div>
            </div>
            <div class="cq-stage-missions-grid">${cardsHtml}</div>
          </div>`;
      }).join("");

      // Wire Stage Banner `?` learning button
      stageView.querySelectorAll("[data-banner-learn]").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const p = document.getElementById(`bannerLearn_${btn.dataset.bannerLearn}`);
          if (p) p.classList.toggle("hidden");
        };
      });

      // Wire R&D shortcut on cards
      stageView.querySelectorAll("[data-open-rs]").forEach((el) => {
        el.onclick = (e) => {
          e.stopPropagation();
          if (typeof openResearch === "function") openResearch(el.dataset.openRs);
        };
      });

      // Wire Mission Briefing & Launch actions
      stageView.querySelectorAll("[data-career-brief]").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          SFX.page();
          openStandaloneBriefing(btn.dataset.careerBrief, "career");
        };
      });

      stageView.querySelectorAll(".cq-career-card").forEach((card) => {
        card.onclick = (e) => {
          if (e.target.closest("[data-career-brief]") || e.target.closest("[data-open-rs]")) return;
          const sc = card.dataset.careerSc;
          const m = MISSION_META[sc];
          const status = careerMissionStatus(m);
          if (!status.open) {
            SFX.error();
            return toast(`${icon("lock")} ${esc(status.why)}`);
          }
          SFX.page();
          S.mode = "career";
          startMission(sc);
        };
      });
    }
  }

  window.renderCareerCampaign = renderCareerCampaign;
  window.careerMissionStatus = careerMissionStatus;

  // --------------------------------------------------------------------------
  // 5. DEEP INDIVIDUAL MISSION BRIEFING DOSSIER (#letter & Standalone Modal)
  // --------------------------------------------------------------------------
  function buildBriefingDetailsHTML(scKey) {
    if (!S || !S.cat || !S.cat.SCENARIOS[scKey]) return "";
    const sc = S.cat.SCENARIOS[scKey];
    const dest = S.cat.DESTINATIONS[sc.destination];
    const meta = MISSION_META[scKey] || {
      num: "01", stageNum: "01", stageName: "SPACE OPERATIONS",
      launchSite: "Cape Canaveral Space Force Station",
      whyNecessary: sc.story,
      constraints: `Complete all required objectives within the ${fmt(sc.budget)} M$ budget.`,
      risks: "Maintain at least 10–15% mass and 20% power margins."
    };
    const orbits = Object.values(S.cat.ORBITS[sc.destination] || {});
    const sunPct = Math.round((1 / (dest.sun_au ** 2)) * 100);
    const radLabel = S.cat.RADIATION_LABEL[dest.radiation] || `Level ${dest.radiation}`;
    const needTech = typeof inCareer === "function" && inCareer() && typeof researchNeeded === "function" ? researchNeeded(scKey) : [];
    const kind = KIND_LABEL[sc.kind || "orbiter"];

    // Payload / spacecraft requirements based on mission kind
    let sysReq = "Spacecraft Bus, Solar/RTG Power, Battery, Attitude Control (ADCS), Propulsion, Antenna & Ground Network, Flight Computer, and Science Instruments.";
    if (sc.kind === "lander") sysReq = "Powered Descent / Landing System (EDL), Surface Landing Site selection, Thermal/Night Survival Power, Comms Link, and Surface Payload Instruments.";
    else if (sc.kind === "rover") sysReq = "Atmospheric Entry & Sky Crane / Retro EDL, Rover Mobility & Mast/Drill Suite, Nuclear RTG or Dust-Tolerant Power, and Mars Relay / DSN Link.";
    else if (sc.kind === "sample_return") sysReq = "Proximity Asteroid Rendezvous Propulsion, Touch-and-Go Sampler Arm (TAGSAM), Earth Return Capsule, and Round-Trip Delta-v Propellant.";
    else if (sc.kind === "program") sysReq = `Multi-Launch Program Manifest (${sc.program.slots} launch slots, ${sc.program.stay}-month crew rotations, ${S.cat.SUPPLY_KG_PER_CREW_MONTH} kg/crew-month consumables).`;
    else if (sc.kind === "vehicle") sysReq = `Reusable Crew Vehicle Architecture (${sc.vehicle.seats_needed} seats over ${sc.vehicle.years} years, Launch Escape System, Re-entry Heat Shield, Human-Rated Launcher).`;

    return `
      <div class="cq-dossier-grid">
        <div class="cq-dossier-banner">
          <img class="px cq-dossier-art" src="${missionLandscape(scKey)}" alt="${esc(sc.name)}">
          <div class="cq-dossier-banner-info">
            <div class="cq-dossier-tags">
              <span class="cq-tag-pill">STAGE ${meta.stageNum} &middot; MISSION ${meta.num}</span>
              <span class="cq-tag-pill cq-tag-amber">${esc(kind.toUpperCase())}</span>
              <span class="cq-tag-pill">${esc(dest.name.toUpperCase())}</span>
              <span class="cq-tag-pill">${esc(sc.difficulty.toUpperCase())}</span>
            </div>
            <p class="cq-dossier-pitch">${esc(sc.pitch)}</p>
          </div>
        </div>

        <div class="cq-dossier-cols">
          <div class="cq-dossier-col">
            <div class="cq-dossier-sec">
              <h5>MISSION BACKGROUND &amp; NECESSITY</h5>
              <p>${esc(meta.whyNecessary)}</p>
              <p class="cq-dossier-sub">${esc(sc.story)}</p>
            </div>

            <div class="cq-dossier-sec">
              <h5>PRIMARY MISSION OBJECTIVES</h5>
              <div class="cq-dossier-goals">
                ${sc.goals.map((g) => `
                  <div class="cq-dgoal">
                    <span class="cq-dgoal-req ${g.required ? "req" : "opt"}">${g.required ? "REQUIRED *" : "SECONDARY"}</span>
                    <div class="cq-dgoal-txt">
                      <b>${esc(g.label)}</b>
                      <small>Tag: ${esc(g.tag.toUpperCase())} &middot; Weight: ${g.weight}% &middot; Target: ${g.target} pts</small>
                    </div>
                  </div>`).join("")}
              </div>
            </div>

            <div class="cq-dossier-sec">
              <h5>SPACECRAFT &amp; PAYLOAD ARCHITECTURE</h5>
              <p>${esc(sysReq)}</p>
            </div>
          </div>

          <div class="cq-dossier-col">
            <div class="cq-dossier-sec">
              <h5>ENVIRONMENTAL &amp; ORBITAL TELEMETRY</h5>
              <div class="cq-env-grid">
                <div><span>DESTINATION</span><b>${esc(dest.name)}</b></div>
                <div><span>SOLAR FLUX</span><b>${sunPct}% of Earth (${dest.sun_au} AU)</b></div>
                <div><span>EARTH DISTANCE</span><b>${dest.earth_au === 0 ? "Local Orbit (<0.01 AU)" : `${dest.earth_au} AU (Deep Space)`}</b></div>
                <div><span>RADIATION BELT</span><b>Lvl ${dest.radiation} &middot; ${esc(radLabel)}</b></div>
                <div><span>ATMOSPHERE</span><b>${dest.atmosphere ? "Yes (Aero/Chute Viable)" : "Vacuum (Rocket Descent Only)"}</b></div>
                <div><span>MAGNETIC FIELD</span><b>${dest.magnetic ? "Strong (Magnetorquers OK)" : "None (Wheels/Thrusters Req.)"}</b></div>
              </div>
            </div>

            <div class="cq-dossier-sec">
              <h5>LAUNCH &amp; ENGINEERING CONSTRAINTS</h5>
              <ul class="cq-dossier-list">
                <li><b>Launch Complex:</b> ${esc(meta.launchSite)}</li>
                <li><b>Budget Cap:</b> ${fmt(sc.budget)} M$ (Standard) &middot; Minimum Science Phase: ${sc.min_years}+ years</li>
                <li><b>Available Orbits/Sites:</b> ${orbits.map((o) => esc(o.name.split(" (")[0])).join(" · ")}</li>
                <li><b>Key Constraints:</b> ${esc(meta.constraints)}</li>
                <li><b>Failure Risks:</b> ${esc(meta.risks)}</li>
                ${needTech.length ? `<li class="cq-tech-warn"><b>Recommended R&amp;D Tech:</b> ${needTech.map((t) => esc(TECH[t].name)).join(", ")}</li>` : ""}
              </ul>
            </div>
          </div>
        </div>
      </div>`;
  }

  function enhanceLetterModal(scKey) {
    const extraEl = $("#letterDossierExtra");
    if (extraEl) {
      extraEl.innerHTML = buildBriefingDetailsHTML(scKey);
    }
    const backBtn = $("#letterBackBtn");
    if (backBtn) {
      backBtn.onclick = () => {
        $("#letter").classList.add("hidden");
        if (S.mode === "career") openHQ();
        else if (S.mode === "story" && typeof openStory === "function") openStory();
        else openSelect();
      };
    }
  }

  function openStandaloneBriefing(scKey, mode = "free") {
    const modal = $("#briefingModal");
    if (!modal || !S || !S.cat || !S.cat.SCENARIOS[scKey]) return;
    const sc = S.cat.SCENARIOS[scKey];
    const c = CLIENTS[scKey];
    const meta = MISSION_META[scKey] || { num: "01", stageNum: "01" };

    $("#bmTitle").textContent = `MISSION BRIEFING DOSSIER · MISSION ${meta.num} · ${sc.name.toUpperCase()}`;
    if (c) {
      $("#bmPortrait").src = portrait(c.look, "neutral");
      $("#bmClientName").textContent = c.name;
      $("#bmClientOrg").textContent = c.org;
      $("#bmClientLetter").innerHTML = c.letter.map((p) => `<p>${esc(p)}</p>`).join("") + `<p class="sig">${esc(c.name)}</p>`;
    }
    $("#bmDossierContent").innerHTML = buildBriefingDetailsHTML(scKey);
    modal.classList.remove("hidden");

    $("#bmCloseBtn").onclick = () => modal.classList.add("hidden");
    $("#bmCancelBtn").onclick = () => modal.classList.add("hidden");
    $("#bmProceedBtn").onclick = () => {
      modal.classList.add("hidden");
      S.mode = mode;
      const prevNoLetter = S.noLetter;
      S.noLetter = true;
      startMission(scKey);
      S.noLetter = prevNoLetter;
    };
  }

  window.enhanceLetterModal = enhanceLetterModal;
  window.openStandaloneBriefing = openStandaloneBriefing;

  // --------------------------------------------------------------------------
  // 6. HALL OF FAME & FLIGHT RECORDS CONTROLLER (#hall)
  // --------------------------------------------------------------------------
  let _hallCat = "all";
  let _hallSc = "wildfire";

  function summarizeDesign(d) {
    if (!d || !S || !S.cat) return "Classified Architecture";
    const sc = S.cat.SCENARIOS[d.scenario];
    if (!sc) return "Custom Spacecraft";
    if (sc.kind === "program") {
      const n = (d.manifest || []).length;
      return `${n} Scheduled Launches · ${d.partners && d.partners.length ? `Partners: ${d.partners.map((p) => p.toUpperCase()).join("+")}` : "Solo Agency"}`;
    }
    if (sc.kind === "vehicle") {
      const sh = d.shape && S.cat.VEHICLE.shape[d.shape] ? S.cat.VEHICLE.shape[d.shape].name : "Crew Vehicle";
      const lv = d.launch_vehicle && S.cat.LAUNCH_VEHICLES[d.launch_vehicle] ? S.cat.LAUNCH_VEHICLES[d.launch_vehicle].name.split(" (")[0] : "";
      return `${sh} · ${lv}`;
    }
    const lv = d.launch_vehicle && S.cat.LAUNCH_VEHICLES[d.launch_vehicle] ? S.cat.LAUNCH_VEHICLES[d.launch_vehicle].name.split(" (")[0] : "Launcher";
    const bus = d.bus && S.cat.BUSES[d.bus] ? S.cat.BUSES[d.bus].name.split(" (")[0] : "Bus";
    const nI = (d.instruments || []).length;
    return `${lv} · ${bus} · ${nI} Instrument${nI === 1 ? "" : "s"}`;
  }

  async function renderHallScreen(sc) {
    if (!S || !S.cat) return;
    if (typeof sc === "string" && S.cat.SCENARIOS[sc]) _hallSc = sc;
    else if (!_hallSc || !S.cat.SCENARIOS[_hallSc]) _hallSc = (S.design && S.design.scenario) || "wildfire";

    // Filter scenarios by category
    const visibleMissions = ALL_MISSIONS.filter((m) => {
      const s = S.cat.SCENARIOS[m.id];
      return s && (_hallCat === "all" || (s.kind || "orbiter") === _hallCat);
    });
    if (!visibleMissions.some((m) => m.id === _hallSc) && visibleMissions.length) {
      _hallSc = visibleMissions[0].id;
    }

    // 1. Category filter pills (#hallCatTabs)
    const catEl = $("#hallCatTabs");
    if (catEl) {
      const cats = [["all", "All Categories"], ...Object.entries(KIND_LABEL)];
      catEl.innerHTML = cats.map(([k, lbl]) =>
        `<button type="button" class="cq-seg-btn ${_hallCat === k ? "on" : ""}" data-hcat="${k}">${esc(lbl)}</button>`
      ).join("");
      catEl.querySelectorAll("button").forEach((b) => {
        b.onclick = () => { _hallCat = b.dataset.hcat; renderHallScreen(_hallSc); };
      });
    }

    // 2. Desktop scenario pills (#hallTabs) + compact mobile/desktop select (#hallScenarioSelect)
    const tabsEl = $("#hallTabs");
    if (tabsEl) {
      tabsEl.innerHTML = visibleMissions.map((m) => {
        const s = S.cat.SCENARIOS[m.id];
        return `<button type="button" class="btn ${m.id === _hallSc ? "on" : ""}" data-sc="${m.id}">${m.num}. ${esc(s.name)}</button>`;
      }).join("");
      tabsEl.querySelectorAll("button").forEach((b) => {
        b.onclick = () => openHall(b.dataset.sc);
      });
    }
    const selEl = $("#hallScenarioSelect");
    if (selEl) {
      selEl.innerHTML = visibleMissions.map((m) => {
        const s = S.cat.SCENARIOS[m.id];
        return `<option value="${m.id}" ${m.id === _hallSc ? "selected" : ""}>Mission ${m.num} · ${esc(s.name)} (${esc(KIND_LABEL[s.kind || "orbiter"])})</option>`;
      }).join("");
      selEl.onchange = () => openHall(selEl.value);
    }

    // 3. Selected Mission Showcase Banner (#hallMissionBanner)
    const scObj = S.cat.SCENARIOS[_hallSc];
    const destObj = S.cat.DESTINATIONS[scObj.destination];
    const meta = MISSION_META[_hallSc] || { num: "01", stageNum: "01", stageName: "SPACE OPERATIONS" };
    const bannerEl = $("#hallMissionBanner");
    if (bannerEl) {
      bannerEl.innerHTML = `
        <img class="px cq-hall-banner-img" src="${missionLandscape(_hallSc)}" alt="${esc(scObj.name)}">
        <div class="cq-hall-banner-info">
          <div class="cq-hall-banner-tags">
            <span class="cq-kicker">MISSION ${meta.num} &middot; STAGE ${meta.stageNum}</span>
            <span class="cq-badge-dest">${esc(destObj.name)}</span>
            <span class="cq-badge-diff cq-diff-${scObj.difficulty.toLowerCase()}">${esc(scObj.difficulty)}</span>
          </div>
          <h3>${esc(scObj.name)}</h3>
          <p>${esc(scObj.pitch)}</p>
        </div>
        <div class="cq-hall-banner-act">
          <button type="button" class="cq-btn-amber" id="hallLaunchMissionBtn">DESIGN &amp; CHALLENGE &gt;</button>
        </div>`;
      const challengeBtn = $("#hallLaunchMissionBtn");
      if (challengeBtn) {
        challengeBtn.onclick = () => {
          S.mode = "free";
          startMission(_hallSc);
        };
      }
    }

    // 4. Fetch Leaderboard Rows
    let rows = [];
    try {
      rows = await api(`leaderboard?scenario=${encodeURIComponent(_hallSc)}&n=15`);
    } catch {
      rows = [];
    }

    // Summary stats in header
    const allLocal = typeof drawer !== "undefined" ? drawer.all().filter((d) => d.flight) : [];
    const topScore = rows.length ? Math.max(...rows.map((r) => r.score || 0)) : 0;
    const sGrades = rows.filter((r) => r.grade === "S").length;
    const statsEl = $("#hallSummaryStats");
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="cq-hstat"><span>MISSION RECORDS</span><b>${rows.length}</b></div>
        <div class="cq-hstat"><span>RECORD SCORE</span><b>${topScore} PTS</b></div>
        <div class="cq-hstat"><span>S-RANK FLIGHTS</span><b>${sGrades}</b></div>
        <div class="cq-hstat"><span>YOUR FLIGHTS</span><b>${allLocal.length}</b></div>`;
    }

    // 5. Render Top 3 Podium (#hallPodium)
    const podiumEl = $("#hallPodium");
    if (podiumEl) {
      const top3 = rows.slice(0, 3);
      if (!top3.length) {
        podiumEl.innerHTML = "";
      } else {
        podiumEl.innerHTML = top3.map((r, idx) => {
          const rank = idx + 1;
          const diffName = (S.cat.DIFFICULTY[r.difficulty] || {}).name || r.difficulty;
          return `
            <div class="cq-podium-card rank-${rank}">
              <div class="cq-podium-head">
                <img class="px cq-podium-trophy" src="${podiumBadge(rank)}" width="32" height="32" alt="Rank ${rank}">
                <div>
                  <span class="cq-podium-rank">${rank === 1 ? "1ST PLACE · GOLD RECORD" : rank === 2 ? "2ND PLACE · SILVER RECORD" : "3RD PLACE · BRONZE RECORD"}</span>
                  <h4 class="cq-podium-player">${esc(r.player || r.name || "ANONYMOUS")}</h4>
                </div>
                <div class="cq-podium-grade" style="background:${GRADE_COL[r.grade] || "#2b6cb0"}">${esc(r.grade)}</div>
              </div>
              <div class="cq-podium-specs">${esc(summarizeDesign(r.design))}</div>
              <div class="cq-podium-foot">
                <span class="cq-podium-diff">${esc(diffName.toUpperCase())}</span>
                <b class="cq-podium-score">${r.score} PTS</b>
                <button type="button" class="cq-btn-hud cq-btn-sm" data-podium-i="${idx}">FLY DESIGN</button>
              </div>
            </div>`;
        }).join("");
        podiumEl.querySelectorAll("[data-podium-i]").forEach((b) => {
          b.onclick = () => {
            const row = rows[Number(b.dataset.podiumI)];
            if (row && row.design) { S.mode = "free"; startMission(_hallSc, row.design); }
          };
        });
      }
    }

    // 6. Render Full Ranked List (#hallList) — preserves .hrow and [data-i]
    const listEl = $("#hallList");
    if (listEl) {
      listEl.innerHTML = rows.length
        ? rows.map((r, i) => {
            const diffName = (S.cat.DIFFICULTY[r.difficulty] || {}).name || r.difficulty;
            return `
              <div class="hrow cq-hrow ${i < 3 ? `top-${i + 1}` : ""}">
                <b class="cq-hrank">#${i + 1}</b>
                <div class="cq-hwho">
                  <span class="cq-hplayer">${esc(r.player || r.name)}</span>
                  <small class="cq-harch">${esc(summarizeDesign(r.design))}</small>
                </div>
                <span class="cq-hdiff">${esc(diffName)}</span>
                <b class="cq-hgrade" style="background:${GRADE_COL[r.grade] || "#2b6cb0"}">${esc(r.grade)}</b>
                <span class="cq-hscore">${r.score} pts</span>
                <button type="button" class="btn small cq-hfly" data-i="${i}">Fly it</button>
              </div>`;
          }).join("")
        : `<div class="cq-empty-state">No ranked flights recorded for this mission yet. Launch a mission to claim 1st place!</div>`;

      listEl.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          S.mode = "free";
          startMission(_hallSc, rows[Number(b.dataset.i)].design);
        };
      });
    }
  }

  window.renderHallScreen = renderHallScreen;
})();
