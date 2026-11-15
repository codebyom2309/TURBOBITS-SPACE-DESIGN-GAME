/* ============================================================================
   COSMO QUEST — AI MISSION ENGINEERING MENTOR (Client Controller)
   Context-aware, friendly aerospace engineering assistance powered by Groq &
   deterministic mission telemetry. Never mutates user spacecraft configuration.
   ============================================================================ */
(function () {
  "use strict";

  const MENTOR_STATE = {
    isOpen: false,
    loading: false,
    activeMissionId: null,
    sessionsByMission: {}, // scenario_id -> { conversationId, messages: [], lastAnalyzedSig: "", suggested: [] }
    modelLabel: "LLAMA-3.3-70B",
  };

  function formatModelBadge(model, source) {
    if (source && source !== "groq") return "ENG. CORE";
    const raw = String(model || "llama-3.3-70b-versatile").toUpperCase();
    return raw.replace(/-VERSATILE|-INSTANT|-PREVIEW/g, "").slice(0, 16);
  }

  const DEFAULT_QUICK_QUESTIONS = [
    { label: "Explain mission", q: "Explain this mission's goals, target world, and environment in simple, friendly words based on my current scenario." },
    { label: "Why instruments?", q: "Which instruments are required for this mission, why do we need them in simple terms, and what are their trade-offs?" },
    { label: "Why can't launch?", q: "Why can't I launch yet? Explain my critical blockers, missing parts, and warnings in simple step-by-step words." },
    { label: "Power & eclipse", q: "Explain my spacecraft solar power, eclipse shadow time, and battery capacity in simple words." },
    { label: "Save budget", q: "How can I reduce mission cost or balance my budget while still meeting all required science objectives?" },
    { label: "Explain sim", q: "Explain in simple words what happened in my mission simulation, which subsystem failed, and how to fix my design.", action: "explain_simulation" },
  ];

  const TAB_QUESTIONS = {
    orbit: "Explain my selected orbit for this destination in simple terms. How does orbital altitude or inclination affect coverage, eclipse shadow time, and engine fuel (delta-v)?",
    launch: "Evaluate my launch window and rocket selection in simple terms against my spacecraft total weight, destination energy, and reliability.",
    launch_vehicle: "Is my selected rocket strong enough for my spacecraft wet mass, destination energy, and reliability needs?",
    bus: "Explain in simple words if my selected spacecraft bus (body) fits my dry mass, instrument slots, and radiation shielding needs.",
    power: "Explain my solar panels, RTGs, and battery choice in simple words for this destination's distance from the Sun and shadow time.",
    adcs: "Does my Attitude Control (Pointing) system keep the spacecraft steady enough for my instruments and high-gain antenna, and does it work at this destination?",
    prop: "Explain my propulsion engine, fuel efficiency (Isp), and fuel weight against the mission's delta-v needs in simple words.",
    propulsion: "Explain my propulsion engine, fuel efficiency (Isp), and fuel weight against the mission's delta-v needs in simple words.",
    edl: "Analyze my Entry, Descent, and Landing (EDL) system in simple words for this world's gravity, atmosphere, and landed mass.",
    comms: "Explain my communications dish and ground station network in simple words—can we send all our science data home?",
    computer: "Does my flight computer have enough memory (GB) and radiation protection for this mission?",
    instr: "Evaluate my selected science instruments in simple words against the mission's required goals, weight/power budget, and pointing needs.",
    instruments: "Evaluate my selected science instruments in simple words against the mission's required goals, weight/power budget, and pointing needs.",
    partners: "Explain how international partner agencies help pay for hardware or add bonus instruments, and whether their schedule delay risk is safe.",
    manifest: "Analyze my multi-flight space station manifest, module prerequisites, power balance, and crew capacity in simple terms.",
    hull: "Evaluate my crewed capsule hull shape, astronaut seat capacity, and launch mass margin.",
    shield: "Is my thermal heatshield rated for this mission's reentry speed and reusability?",
    safety: "Analyze my launch abort system and landing recovery setup for astronaut safety.",
  };

  function getAppState() {
    if (typeof S !== "undefined" && S) return S;
    if (typeof window !== "undefined" && window.S) return window.S;
    return null;
  }

  function getStore() {
    if (typeof store !== "undefined" && store) return store;
    if (typeof window !== "undefined" && window.store) return window.store;
    return null;
  }

  function getFriendlyUserName() {
    const st = getAppState();
    const sr = getStore();
    const savedNick = sr ? sr.get("mentor_user_name", "") : "";
    const playerStr = (savedNick || (st && st.player) || (sr && sr.get("player", "")) || "").trim();
    if (!playerStr || /^(engineer|tester|guest|player|anonymous|lead|none|null)$/i.test(playerStr)) {
      return "bro/sis";
    }
    return playerStr.slice(0, 28);
  }

  function setFriendlyUserName(newName) {
    const cleaned = String(newName || "").trim().slice(0, 28);
    const sr = getStore();
    const st = getAppState();
    if (sr) {
      sr.set("mentor_user_name", cleaned);
      if (cleaned && !/^(bro\/sis|bro|sis)$/i.test(cleaned)) {
        sr.set("player", cleaned);
      }
    }
    if (st && cleaned && !/^(bro\/sis|bro|sis)$/i.test(cleaned)) {
      st.player = cleaned;
      const pInput = document.getElementById("playerName");
      if (pInput) pInput.value = cleaned;
    }
    syncUserNameUI();
    updateContextBar();
    renderConversation();
  }

  function syncUserNameUI() {
    const fname = getFriendlyUserName();
    const disp = el("aiUserNameDisplay");
    const inp = el("aiUserNameInput");
    if (disp) {
      disp.textContent = fname === "bro/sis" ? "Bro / Sis" : fname;
    }
    if (inp && document.activeElement !== inp) {
      inp.value = fname === "bro/sis" ? "" : fname;
    }
    document.querySelectorAll(".cq-ai-nick-btn").forEach(function (btn) {
      const nick = btn.getAttribute("data-ai-nick") || "";
      btn.classList.toggle("active", fname.toLowerCase() === nick.toLowerCase());
    });
  }

  function playSfx(method) {
    try {
      const sfxObj = (typeof SFX !== "undefined" && SFX) ? SFX : window.SFX;
      if (sfxObj && typeof sfxObj[method] === "function") {
        sfxObj[method]();
      }
    } catch (_) {}
  }

  function el(id) {
    return document.getElementById(id);
  }

  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function designSignature(d) {
    if (!d) return "";
    try {
      return JSON.stringify({
        scenario: d.scenario,
        orbit: d.orbit,
        window: d.window,
        launch_vehicle: d.launch_vehicle,
        bus: d.bus,
        solar: d.solar,
        rtg: d.rtg,
        battery: d.battery,
        adcs: d.adcs,
        propulsion: d.propulsion,
        edl: d.edl,
        comms: d.comms,
        ground: d.ground,
        computer: d.computer,
        instruments: d.instruments,
        partners: d.partners,
        years: d.years,
        manifest: d.manifest,
        shape: d.shape,
        seats: d.seats,
        heatshield: d.heatshield,
        abort: d.abort,
        landing: d.landing,
      });
    } catch (_) {
      return "";
    }
  }

  function getSession(missionId) {
    const st = getAppState();
    const mid = missionId || (st && st.design && st.design.scenario) || "wildfire";
    if (!MENTOR_STATE.sessionsByMission[mid]) {
      MENTOR_STATE.sessionsByMission[mid] = {
        conversationId: "cq-mentor-" + mid + "-" + Math.random().toString(36).slice(2, 9),
        messages: [],
        lastAnalyzedSig: "",
        suggested: [],
      };
    }
    return MENTOR_STATE.sessionsByMission[mid];
  }

  function getSelectedPartLabelForTab(st, tabId) {
    if (!st || !st.cat || !st.design) return "";
    const d = st.design;
    const c = st.cat;
    const destKey = (c.SCENARIOS[d.scenario] || {}).destination || "earth";
    switch (tabId) {
      case "orbit":
        return d.orbit && c.ORBITS[destKey] && c.ORBITS[destKey][d.orbit] ? c.ORBITS[destKey][d.orbit].name : "Not selected";
      case "launch":
      case "launch_vehicle":
        return d.launch_vehicle && c.LAUNCH_VEHICLES[d.launch_vehicle] ? c.LAUNCH_VEHICLES[d.launch_vehicle].name : "Not selected";
      case "bus":
        return d.bus && c.BUSES[d.bus] ? c.BUSES[d.bus].name : "Not selected";
      case "power": {
        const sName = d.solar && c.SOLAR_ARRAYS[d.solar] ? c.SOLAR_ARRAYS[d.solar].name : "No solar";
        const bName = d.battery && c.BATTERIES[d.battery] ? c.BATTERIES[d.battery].name : "No battery";
        return sName + (d.rtg ? " + " + d.rtg + "x RTG" : "") + " / " + bName;
      }
      case "adcs":
        return d.adcs && c.ADCS[d.adcs] ? c.ADCS[d.adcs].name : "Not selected";
      case "prop":
      case "propulsion":
        return d.propulsion && c.PROPULSION[d.propulsion] ? c.PROPULSION[d.propulsion].name : "Not selected";
      case "edl":
        return d.edl && c.EDL[d.edl] ? c.EDL[d.edl].name : "Not selected";
      case "comms": {
        const cm = d.comms && c.COMMS[d.comms] ? c.COMMS[d.comms].name : "No dish";
        const gr = d.ground && c.GROUND[d.ground] ? c.GROUND[d.ground].name : "No ground";
        return cm + " / " + gr;
      }
      case "computer":
        return d.computer && c.COMPUTERS[d.computer] ? c.COMPUTERS[d.computer].name : "Not selected";
      case "instr":
      case "instruments":
        return (d.instruments && d.instruments.length)
          ? d.instruments.map(function (k) { return (c.INSTRUMENTS[k] && c.INSTRUMENTS[k].name) || k; }).join(", ")
          : "0 instruments selected";
      case "partners":
        return (d.partners && d.partners.length) ? d.partners.length + " partner(s)" : "None";
      default:
        return "";
    }
  }

  function buildDefaultQuickLinks(st) {
    const links = [];
    const seen = {};
    function add(item) {
      if (!item || !item.label || seen[item.label] || links.length >= 6) return;
      seen[item.label] = true;
      links.push(item);
    }

    const ev = st && st.ev;
    if (ev && Array.isArray(ev.issues)) {
      ev.issues.filter(function (i) { return i.severity === "blocker"; }).slice(0, 3).forEach(function (b) {
        const t = (b.text || "").toLowerCase();
        if (t.indexOf("orbit") !== -1 || t.indexOf("landing site") !== -1) {
          add({ type: "field", tab: "orbit", field: "orbit", label: "Jump to Orbit Tab \u2192" });
        } else if (t.indexOf("launch vehicle") !== -1 || t.indexOf("rocket") !== -1) {
          add({ type: "field", tab: "launch", field: "launch_vehicle", label: "Jump to Rocket \u2192" });
        } else if (t.indexOf("launch date") !== -1) {
          add({ type: "field", tab: "launch", field: "window", label: "Jump to Launch Window \u2192" });
        } else if (t.indexOf("bus") !== -1 || t.indexOf("slot") !== -1) {
          add({ type: "field", tab: "bus", field: "bus", label: "Jump to Bus Tab \u2192" });
        } else if (t.indexOf("solar") !== -1) {
          add({ type: "field", tab: "power", field: "solar", label: "Jump to Solar Panels \u2192" });
        } else if (t.indexOf("battery") !== -1 || t.indexOf("eclipse") !== -1) {
          add({ type: "field", tab: "power", field: "battery", label: "Jump to Battery \u2192" });
        } else if (t.indexOf("pointing") !== -1 || t.indexOf("attitude") !== -1) {
          add({ type: "field", tab: "adcs", field: "adcs", label: "Jump to Pointing \u2192" });
        } else if (t.indexOf("propulsion") !== -1 || t.indexOf("engine") !== -1 || t.indexOf("propellant") !== -1) {
          add({ type: "field", tab: "prop", field: "propulsion", label: "Jump to Engine \u2192" });
        } else if (t.indexOf("instrument") !== -1 || t.indexOf("required goal") !== -1) {
          add({ type: "field", tab: "instr", field: "instruments", label: "Jump to Instruments \u2192" });
        } else if (t.indexOf("antenna") !== -1) {
          add({ type: "field", tab: "comms", field: "comms", label: "Jump to Antenna \u2192" });
        } else if (t.indexOf("ground") !== -1) {
          add({ type: "field", tab: "comms", field: "ground", label: "Jump to Ground Station \u2192" });
        } else if (t.indexOf("computer") !== -1 || t.indexOf("radiation") !== -1) {
          add({ type: "field", tab: "computer", field: "computer", label: "Jump to Computer \u2192" });
        }
      });
    }

    add({ type: "field", tab: "instr", field: "instruments", label: "Open Instruments \u2192" });
    add({ type: "field", tab: "power", field: "solar", label: "Open Power & Battery \u2192" });
    add({ type: "modal", target: "briefing", label: "Mission Briefing Dossier" });
    add({ type: "modal", target: "handbook", label: "Engineer's Handbook" });
    return links.slice(0, 6);
  }

  function renderQuickLinksBarHtml(links) {
    if (!Array.isArray(links) || !links.length) return "";
    const btns = links.map(function (lk) {
      const ltype = escHtml(lk.type || "tab");
      const tab = escHtml(lk.tab || "");
      const field = escHtml(lk.field || "");
      const target = escHtml(lk.target || "");
      const ask = escHtml(lk.question || "");
      const label = escHtml(lk.label || "Open \u2192");
      return (
        '<button type="button" class="cq-ai-qlink-btn" ' +
        'data-qlink-type="' + ltype + '" ' +
        'data-qlink-tab="' + tab + '" ' +
        'data-qlink-field="' + field + '" ' +
        'data-qlink-target="' + target + '" ' +
        'data-qlink-ask="' + ask + '">' +
        label +
        "</button>"
      );
    }).join("");
    return (
      '<div class="cq-ai-qlinks-bar">' +
      '<span class="cq-ai-qlinks-lbl">QUICK LINKS:</span>' +
      '<div class="cq-ai-qlinks-list">' + btns + "</div>" +
      "</div>"
    );
  }

  function parseInlineQuickLinks(lineHtml) {
    // Converts [[tab:bus|Open Bus Tab →]], [[modal:briefing|Open Briefing →]], [[ask:Question|Label]] into clickable buttons
    return lineHtml.replace(/\[\[([a-z_]+):([^|\]]+)\|([^\]]+)\]\]/gi, function (_, kind, targetSpec, label) {
      const k = String(kind || "").toLowerCase();
      const spec = String(targetSpec || "").trim();
      const lbl = String(label || "Open \u2192").trim();
      if (k === "tab" || k === "field") {
        const parts = spec.split(":");
        const rawTab = parts[0] === "instruments" ? "instr" : parts[0] === "propulsion" ? "prop" : parts[0];
        const rawField = parts[1] || "";
        return (
          '<button type="button" class="cq-ai-inline-link" data-qlink-type="field" data-qlink-tab="' +
          rawTab +
          '" data-qlink-field="' +
          rawField +
          '">' +
          lbl +
          "</button>"
        );
      }
      if (k === "modal") {
        return (
          '<button type="button" class="cq-ai-inline-link" data-qlink-type="modal" data-qlink-target="' +
          spec +
          '">' +
          lbl +
          "</button>"
        );
      }
      if (k === "ask") {
        return (
          '<button type="button" class="cq-ai-inline-link" data-qlink-type="ask" data-qlink-ask="' +
          spec +
          '">' +
          lbl +
          "</button>"
        );
      }
      return lbl;
    });
  }

  function formatMentorMarkdown(rawText) {
    const safe = escHtml(rawText || "");
    const lines = safe.split(/\r?\n/);
    const out = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        continue;
      }

      line = parseInlineQuickLinks(line);

      line = line
        .replace(/`([^`]+)`/g, '<code class="cq-ai-code">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");

      line = line
        .replace(/\[CRITICAL BLOCKER([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-bad">CRITICAL BLOCKER$1</span>')
        .replace(/\[WARNING([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-warn">WARNING$1</span>')
        .replace(/\[CALCULATED([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-calc">CALCULATED$1</span>')
        .replace(/\[MISSION REQUIREMENTS([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-req">MISSION REQUIREMENTS$1</span>')
        .replace(/\[MENTOR([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-rec">MENTOR$1</span>')
        .replace(/\[AEROSPACE CONCEPT([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-concept">AEROSPACE CONCEPT$1</span>')
        .replace(/\[SIMULATION([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-sim">SIMULATION$1</span>')
        .replace(/\[COMPONENT([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-calc">COMPONENT$1</span>')
        .replace(/\[ENGINEERING VALIDATION([^\]]*)\]/g, '<span class="cq-ai-tag cq-ai-tag-req">VALIDATION$1</span>');

      if (line.startsWith("#### ")) {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push('<h5 class="cq-ai-h5">' + line.slice(5) + "</h5>");
      } else if (line.startsWith("### ")) {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push('<h4 class="cq-ai-h4">' + line.slice(4) + "</h4>");
      } else if (line.startsWith("## ")) {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push('<h4 class="cq-ai-h4">' + line.slice(3) + "</h4>");
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList) {
          out.push('<ul class="cq-ai-ul">');
          inList = true;
        }
        out.push("<li>" + line.slice(2) + "</li>");
      } else {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        out.push('<p class="cq-ai-p">' + line + "</p>");
      }
    }
    if (inList) {
      out.push("</ul>");
    }
    return out.join("");
  }

  function handleQuickLinkAction(btn) {
    if (!btn) return;
    playSfx("click");
    const ltype = btn.getAttribute("data-qlink-type") || "field";
    const rawTab = btn.getAttribute("data-qlink-tab") || "";
    const field = btn.getAttribute("data-qlink-field") || "";
    const target = btn.getAttribute("data-qlink-target") || "";
    const askQ = btn.getAttribute("data-qlink-ask") || "";

    const tabMap = {
      instruments: "instr",
      propulsion: "prop",
      launch_vehicle: "launch",
    };
    const tabId = tabMap[rawTab] || rawTab;

    const isMob = document.documentElement.classList.contains("mobile") || window.innerWidth <= 820;

    if (ltype === "ask" && askQ) {
      askMentor(askQ, "chat");
      return;
    }
    if (ltype === "modal") {
      if (isMob) closeMentor();
      if (target === "briefing" && typeof window.openLetter === "function") {
        window.openLetter();
      } else if (target === "handbook" && typeof window.openHints === "function") {
        window.openHints();
      }
      return;
    }
    if (tabId) {
      if (isMob) closeMentor();
      if (field && typeof window.jumpToEngineeringField === "function") {
        window.jumpToEngineeringField(tabId, field);
      } else if (typeof window.goLab === "function") {
        window.goLab(tabId);
      }
      if (isMob) {
        const midCol = document.querySelector("#desk .col-mid");
        if (midCol && typeof midCol.scrollIntoView === "function") {
          setTimeout(function () {
            midCol.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 40);
        }
      }
    }
  }

  function updateContextBar() {
    const st = getAppState();
    if (!st || !st.cat || !st.design) return;
    const d = st.design;
    const ev = st.ev;
    const sc = st.cat.SCENARIOS[d.scenario];
    if (!sc) return;
    const dest = st.cat.DESTINATIONS[sc.destination] || {};

    syncUserNameUI();

    const missionEl = el("aiCtxMission");
    const readinessEl = el("aiCtxReadiness");
    const massEl = el("aiCtxMass");
    const powerEl = el("aiCtxPower");
    const budgetEl = el("aiCtxBudget");
    const scienceEl = el("aiCtxScience");
    const tabLabelEl = el("aiActiveTabLabel");
    const changeNoticeEl = el("aiCtxChangeNotice");
    const boothScenEl = el("boothAiScenario");
    const boothSumEl = el("boothAiSummary");

    const fullScenTitle = sc.name + " \u00B7 " + (dest.name || sc.destination) + " (" + (sc.kind || "orbiter").toUpperCase() + ")";
    const compactScenTitle = sc.name + " \u00B7 " + (dest.name || sc.destination);
    if (missionEl) {
      missionEl.textContent = compactScenTitle;
      missionEl.title = fullScenTitle;
    }
    if (boothScenEl) {
      boothScenEl.textContent = fullScenTitle;
    }

    const activeTab = st.tab || "orbit";
    const partLabel = getSelectedPartLabelForTab(st, activeTab);
    if (tabLabelEl) {
      tabLabelEl.textContent = "TAB: " + activeTab.replace(/_/g, " ").toUpperCase() + (partLabel ? " \u00B7 " + partLabel : "");
    }

    if (!ev) {
      if (budgetEl) budgetEl.textContent = "$0M / $" + sc.budget + "M";
      return;
    }

    const blockers = (ev.issues || []).filter(function (i) { return i.severity === "blocker"; });
    const warnings = (ev.issues || []).filter(function (i) { return i.severity === "warning"; });
    const fname = getFriendlyUserName();

    if (readinessEl) {
      if (ev.ok) {
        readinessEl.textContent = "READY FOR LAUNCH" + (warnings.length ? " (" + warnings.length + " WARN)" : "");
        readinessEl.className = "cq-ai-readiness-badge cq-ai-ready-ok";
      } else {
        readinessEl.textContent = blockers.length + " BLOCKER" + (blockers.length === 1 ? "" : "S") + " \u00B7 " + warnings.length + " WARN";
        readinessEl.className = "cq-ai-readiness-badge cq-ai-ready-bad";
      }
    }

    if (boothSumEl) {
      if (ev.ok) {
        boothSumEl.textContent = "Hey " + fname + "! Launch approved! " + (warnings.length ? warnings.length + " warning(s) active." : "All subsystems nominal.");
      } else {
        const topBlocker = blockers[0] ? blockers[0].text : "";
        boothSumEl.textContent = "Hey " + fname + "! " + blockers.length + " blocker(s) left. Next up: " + topBlocker;
      }
    }

    if (ev.kind === "program") {
      if (massEl) massEl.textContent = Math.round((ev.mass ? ev.mass.margin : 0) * 100) + "% margin";
      if (powerEl) powerEl.textContent = Math.round((ev.power ? ev.power.margin : 0) * 100) + "% margin";
    } else if (ev.mass && ev.power) {
      if (massEl) {
        const wet = ev.mass.wet != null && isFinite(ev.mass.wet) ? Math.round(ev.mass.wet) : Math.round(ev.mass.dry || 0);
        const cap = ev.mass.capacity ? Math.round(ev.mass.capacity) : 0;
        massEl.textContent = cap > 0 ? wet + "/" + cap + " kg" : Math.round(ev.mass.dry || 0) + " kg dry";
      }
      if (powerEl) {
        const netW = Math.round((ev.power.generation || 0) - (ev.power.load || 0));
        powerEl.textContent = (netW >= 0 ? "+" : "") + netW + " W";
      }
    }

    if (budgetEl && ev.cost) {
      budgetEl.textContent = "$" + Math.round(ev.cost.total || 0) + "M / $" + Math.round(ev.cost.budget || 0) + "M";
    }
    if (scienceEl && ev.science && Array.isArray(ev.science.goals)) {
      const goals = ev.science.goals;
      const avg = goals.length
        ? goals.reduce(function (s, g) { return s + (g.fraction || 0); }, 0) / goals.length
        : 0;
      scienceEl.textContent = Math.round(avg * 100) + "%";
    }

    const sess = getSession(d.scenario);
    const curSig = designSignature(d);
    if (changeNoticeEl) {
      if (sess.lastAnalyzedSig && sess.lastAnalyzedSig !== curSig && sess.messages.length > 0) {
        changeNoticeEl.classList.remove("hidden");
      } else {
        changeNoticeEl.classList.add("hidden");
      }
    }
  }

  function renderQuickQuestions() {
    const container = el("aiQuickQuestions");
    if (!container) return;
    container.innerHTML = "";

    const st = getAppState();
    const hasSim = Boolean(st && st.result && st.result.sim);
    DEFAULT_QUICK_QUESTIONS.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cq-ai-qbtn" + (item.action === "explain_simulation" && hasSim ? " cq-ai-qbtn-sim" : "");
      btn.textContent = item.label;
      btn.addEventListener("click", function () {
        playSfx("click");
        askMentor(item.q, item.action || "chat");
      });
      container.appendChild(btn);
    });
  }

  function buildLiveWelcomeHtml(st, mid) {
    const sc = (st && st.cat && st.cat.SCENARIOS[mid]) || {};
    const dest = (st && st.cat && sc.destination && st.cat.DESTINATIONS[sc.destination]) || {};
    const ev = (st && st.ev) || null;
    const fname = getFriendlyUserName();

    const blockers = ev && ev.issues ? ev.issues.filter(function (i) { return i.severity === "blocker"; }) : [];
    const warnings = ev && ev.issues ? ev.issues.filter(function (i) { return i.severity === "warning"; }) : [];
    const reqGoals = (sc.goals || []).filter(function (g) { return g.required; });
    const reqListHtml = reqGoals.map(function (g) {
      let pctStr = "";
      if (ev && ev.science && Array.isArray(ev.science.goals)) {
        const matchG = ev.science.goals.find(function (eg) { return eg.tag === g.tag; });
        if (matchG) pctStr = " (" + Math.round((matchG.fraction || 0) * 100) + "% covered)";
      }
      return "<li><strong>" + escHtml(g.label) + "</strong> <code class=\"cq-ai-code\">" + escHtml(g.tag) + "</code>" + pctStr + "</li>";
    }).join("");

    const activeTab = (st && st.tab) || "orbit";
    const activePart = getSelectedPartLabelForTab(st, activeTab);

    let statusHtml = "";
    if (!ev) {
      statusHtml = '<p class="cq-ai-p">Checking your spacecraft board right now...</p>';
    } else if (blockers.length > 0) {
      const top3 = blockers.slice(0, 3).map(function (b) {
        return "<li><span class=\"cq-ai-tag cq-ai-tag-bad\">BLOCKER</span> " + escHtml(b.text) + "</li>";
      }).join("");
      statusHtml =
        '<p class="cq-ai-p"><strong>Simple Status Check:</strong> Don\'t worry ' + escHtml(fname) + ', we just have <span class="cq-ai-tag cq-ai-tag-bad">' +
        blockers.length + " BLOCKER" + (blockers.length === 1 ? "" : "S") +
        "</span> to clear before launch (and <strong>" + warnings.length + " warning(s)</strong>):</p>" +
        '<ul class="cq-ai-ul">' + top3 + "</ul>";
    } else {
      statusHtml =
        '<p class="cq-ai-p"><span class="cq-ai-tag cq-ai-tag-rec">LAUNCH READY</span> Awesome work, <strong>' + escHtml(fname) + '</strong>! All required launch checks pass (' +
        warnings.length + " warning(s)). Ask me how to boost your science grade or save budget!</p>";
    }

    const defaultLinks = buildDefaultQuickLinks(st);
    const welcomeSpeech =
      "Hey " + (fname === "bro/sis" ? "my friend" : fname) + "! Welcome to " + (sc.name || "Mission") + ". " +
      (sc.pitch || "Let's build a spacecraft that completes all science goals within budget!") + " " +
      (blockers.length > 0
        ? "We have " + blockers.length + " blocker" + (blockers.length === 1 ? "" : "s") + " to clear before launch. Next up: " + (blockers[0] ? blockers[0].text : "")
        : "All required launch checks pass! Ask me how to boost your science grade or save budget.");

    return (
      '<div class="cq-ai-msg-head"><span>CHIEF ENGINEER VERA LIN \u00B7 FRIENDLY MENTOR</span>' +
      '<div class="cq-ai-msg-head-right">' +
      '<button type="button" class="cq-ai-listen-btn" data-ai-speak-key="welcome" data-ai-speak-text="' + escHtml(welcomeSpeech) + '">\uD83D\uDD0A LISTEN</button>' +
      '<span class="cq-ai-src-badge">' + escHtml(MENTOR_STATE.modelLabel) + "</span>" +
      "</div></div>" +
      '<div class="cq-ai-msg-body">' +
      '<h4 class="cq-ai-h4">HEY ' + escHtml(fname.toUpperCase()) + "! WELCOME TO " + escHtml((sc.name || "MISSION").toUpperCase()) + "</h4>" +
      '<p class="cq-ai-p"><strong>In Simple Words:</strong> ' + escHtml(sc.pitch || "Let's build a spacecraft that completes all science goals within budget!") + "</p>" +
      '<p class="cq-ai-p"><strong>Target World:</strong> <code class="cq-ai-code">' + escHtml(dest.name || "Orbit") + " (" + escHtml(dest.sun_au || 1) + " AU)</code> \u00B7 " +
      "Budget <code class=\"cq-ai-code\">$" + escHtml(sc.budget || 0) + "M</code> \u00B7 " +
      "Active Tab <code class=\"cq-ai-code\">" + escHtml(activeTab.toUpperCase()) + " (" + escHtml(activePart) + ")</code></p>" +
      (reqListHtml ? '<h5 class="cq-ai-h5">REQUIRED SCIENCE GOALS TO HIT:</h5><ul class="cq-ai-ul">' + reqListHtml + "</ul>" : "") +
      statusHtml +
      '<p class="cq-ai-p">Tap any <strong>Quick Link</strong> below to jump straight to a workbench tab, or ask me anything and I\'ll explain it simply!</p>' +
      renderQuickLinksBarHtml(defaultLinks) +
      "</div>"
    );
  }

  function renderConversation() {
    const logEl = el("aiChatHistory");
    if (!logEl) return;

    const st = getAppState();
    const mid = (st && st.design && st.design.scenario) || "wildfire";
    const sess = getSession(mid);
    const fname = getFriendlyUserName();
    logEl.innerHTML = "";

    if (sess.messages.length === 0 && !MENTOR_STATE.loading) {
      const welcome = document.createElement("div");
      welcome.className = "cq-ai-msg cq-ai-msg-mentor";
      welcome.innerHTML = buildLiveWelcomeHtml(st, mid);
      logEl.appendChild(welcome);
      logEl.scrollTop = 0;
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () {
          logEl.scrollTop = 0;
        });
      }
      if (window.VOX && typeof window.VOX.syncUI === "function") window.VOX.syncUI();
      return;
    }

    sess.messages.forEach(function (msg, idx) {
      const row = document.createElement("div");
      if (msg.role === "user") {
        row.className = "cq-ai-msg cq-ai-msg-user";
        row.innerHTML =
          '<div class="cq-ai-msg-head"><span>' + escHtml(fname.toUpperCase()) + " \u00B7 MISSION ARCHITECT</span></div>" +
          '<div class="cq-ai-msg-body"><p class="cq-ai-p">' + escHtml(msg.content) + "</p></div>";
      } else {
        row.className = "cq-ai-msg cq-ai-msg-mentor";
        const metaBadge = formatModelBadge(msg.model, msg.source);
        const qLinksHtml = renderQuickLinksBarHtml(msg.quick_links || buildDefaultQuickLinks(st));
        const speakKey = "msg-" + mid + "-" + idx;
        row.innerHTML =
          '<div class="cq-ai-msg-head"><span>CHIEF ENGINEER VERA LIN</span>' +
          '<div class="cq-ai-msg-head-right">' +
          '<button type="button" class="cq-ai-listen-btn" data-ai-speak-key="' + escHtml(speakKey) + '" data-ai-speak-idx="' + idx + '">\uD83D\uDD0A LISTEN</button>' +
          '<span class="cq-ai-src-badge" title="' + escHtml(msg.model || "Verified Engineering Engine") + '">' + metaBadge + "</span>" +
          "</div></div>" +
          '<div class="cq-ai-msg-body">' + formatMentorMarkdown(msg.content) + qLinksHtml + "</div>";
      }
      logEl.appendChild(row);
    });

    if (MENTOR_STATE.loading) {
      const loadingRow = document.createElement("div");
      loadingRow.className = "cq-ai-msg cq-ai-msg-mentor cq-ai-msg-loading";
      loadingRow.innerHTML =
        '<div class="cq-ai-msg-head"><span>CHIEF ENGINEER VERA LIN</span><span class="cq-ai-src-badge">THINKING...</span></div>' +
        '<div class="cq-ai-msg-body"><p class="cq-ai-p">Hang on ' + escHtml(fname) + ', checking your live spacecraft numbers and mission goals...</p></div>';
      logEl.appendChild(loadingRow);
    }

    logEl.scrollTop = logEl.scrollHeight;
  }

  async function askMentor(questionText, actionType) {
    if (MENTOR_STATE.loading) return;
    const st = getAppState();
    const designPayload = (st && st.design) ? st.design : { scenario: "wildfire" };
    const activeTab = (st && st.tab) || "orbit";
    const fname = getFriendlyUserName();

    const q = String(questionText || "").trim();
    const act = actionType || "chat";
    if (!q && act === "chat") return;

    const mid = designPayload.scenario || "wildfire";
    const sess = getSession(mid);
    const displayQ = q || (act === "explain_simulation"
      ? "Explain in simple words what happened in my mission simulation and how to fix my spacecraft."
      : "Perform a friendly, simple engineering audit of my current spacecraft configuration.");

    sess.messages.push({ role: "user", content: displayQ });
    MENTOR_STATE.loading = true;
    renderConversation();

    const sendBtn = el("aiSendBtn");
    if (sendBtn) sendBtn.disabled = true;

    try {
      const resp = await fetch("/api/ai/mission-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: displayQ,
          action: act,
          active_tab: activeTab,
          user_name: fname,
          conversation_id: sess.conversationId,
          design: designPayload,
          simulation: (st && st.result) || null,
        }),
      });
      const data = await resp.json();

      if (!resp.ok || !data || data.ok === false) {
        const errMsg = (data && data.error) || "Unable to reach AI Mission Engineering Mentor.";
        sess.messages.push({
          role: "assistant",
          content: "### TELEMETRY ADVISORY\n- " + errMsg,
          source: "error",
          quick_links: buildDefaultQuickLinks(st),
        });
        playSfx("error");
      } else {
        sess.conversationId = data.conversation_id || sess.conversationId;
        sess.lastAnalyzedSig = designSignature(designPayload);
        sess.messages.push({
          role: "assistant",
          content: data.answer || "No engineering analysis returned.",
          source: data.source || "groq",
          model: data.model || "llama-3.3-70b-versatile",
          quick_links: data.quick_links || buildDefaultQuickLinks(st),
        });
        const modelTag = el("aiMentorModelTag");
        if (modelTag && data.model) {
          MENTOR_STATE.modelLabel = formatModelBadge(data.model, data.source);
          modelTag.textContent = MENTOR_STATE.modelLabel;
          modelTag.title = data.source === "groq" ? "Groq · " + data.model : "Engineering Mentor Core";
        }
        const msgKey = "msg-" + mid + "-" + (sess.messages.length - 1);
        if (window.VOX && typeof window.VOX.speak === "function" && window.VOX.enabled()) {
          window.VOX.speak(data.answer || "", "mentor", { key: msgKey });
        } else {
          playSfx("ding");
        }
      }
    } catch (err) {
      sess.messages.push({
        role: "assistant",
        content: "### TELEMETRY LINK INTERRUPTED\n- Could not reach `/api/ai/mission-assistant`. Check your connection and try again.",
        source: "error",
        quick_links: buildDefaultQuickLinks(st),
      });
      playSfx("error");
    } finally {
      MENTOR_STATE.loading = false;
      if (sendBtn) sendBtn.disabled = false;
      updateContextBar();
      renderConversation();
      if (window.VOX && typeof window.VOX.syncUI === "function") window.VOX.syncUI();
    }
  }

  function setModeUI(openMentor) {
    MENTOR_STATE.isOpen = Boolean(openMentor);
    const drawer = el("aiMentorDrawer");
    const guideBtn = el("modeGuideBtn");
    const aiBtn = el("modeAiHelpBtn");
    const topBtn = el("aiMentorBtn");
    const boothAiView = el("boothAiView");
    const boothGuideWindow = el("boothGuideWindow");
    const clientName = el("clientName");
    const speech = el("speech");
    const boothEl = document.querySelector("#desk .booth");

    if (document.documentElement) {
      document.documentElement.classList.toggle("mentor-open-root", MENTOR_STATE.isOpen);
    }
    if (document.body) {
      document.body.classList.toggle("mentor-open", MENTOR_STATE.isOpen);
    }
    if (boothEl) {
      boothEl.classList.toggle("cq-booth-ai-active", MENTOR_STATE.isOpen);
    }
    if (boothGuideWindow) {
      boothGuideWindow.classList.toggle("hidden", MENTOR_STATE.isOpen);
    }
    if (clientName) {
      clientName.classList.toggle("hidden", MENTOR_STATE.isOpen);
    }
    if (speech) {
      speech.classList.toggle("hidden", MENTOR_STATE.isOpen);
    }
    if (drawer) {
      drawer.classList.toggle("hidden", !MENTOR_STATE.isOpen);
    }
    if (boothAiView) {
      boothAiView.classList.toggle("hidden", !MENTOR_STATE.isOpen);
    }
    if (guideBtn) {
      guideBtn.classList.toggle("active", !MENTOR_STATE.isOpen);
      guideBtn.setAttribute("aria-selected", MENTOR_STATE.isOpen ? "false" : "true");
    }
    if (aiBtn) {
      aiBtn.classList.toggle("active", MENTOR_STATE.isOpen);
      aiBtn.setAttribute("aria-selected", MENTOR_STATE.isOpen ? "true" : "false");
    }
    if (topBtn) {
      topBtn.classList.toggle("active", MENTOR_STATE.isOpen);
    }

    updateContextBar();
    if (MENTOR_STATE.isOpen) {
      renderQuickQuestions();
      renderConversation();
    }
  }

  function openMentor(initialQuestion, actionType) {
    playSfx("page");
    setModeUI(true);
    if (initialQuestion || actionType) {
      askMentor(initialQuestion || "", actionType || "chat");
    }
  }

  function closeMentor() {
    playSfx("page");
    setModeUI(false);
  }

  function toggleMentor() {
    if (MENTOR_STATE.isOpen) closeMentor();
    else openMentor();
  }

  function inspectActiveTab() {
    const st = getAppState();
    const activeTab = (st && st.tab) || "orbit";
    const partLabel = getSelectedPartLabelForTab(st, activeTab);
    const basePrompt = TAB_QUESTIONS[activeTab] || ("Explain my current " + activeTab + " selection in simple terms and highlight any trade-offs or mismatches.");
    const fullPrompt = basePrompt + (partLabel ? " (Currently on board for this tab: " + partLabel + ")" : "");
    openMentor(fullPrompt, "chat");
  }

  function explainSimulationFromNews() {
    if (typeof window.show === "function") {
      window.show("desk");
    }
    openMentor(
      "Explain in simple words what happened in my mission simulation, which stage and subsystem failed or degraded, and how I should modify my spacecraft design.",
      "explain_simulation"
    );
  }

  function onDesignOrEvalUpdated() {
    const st = getAppState();
    if (!st || !st.design) return;
    const mid = st.design.scenario || "wildfire";
    if (MENTOR_STATE.activeMissionId !== mid) {
      MENTOR_STATE.activeMissionId = mid;
    }
    updateContextBar();
    if (MENTOR_STATE.isOpen) {
      renderQuickQuestions();
      const sess = getSession(mid);
      if (sess.messages.length === 0 && !MENTOR_STATE.loading) {
        renderConversation();
      }
    }
  }

  async function checkAiBackendStatus() {
    try {
      const r = await fetch("/api/ai/status");
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.ok) {
        MENTOR_STATE.modelLabel = formatModelBadge(d.model, d.configured ? "groq" : "fallback");
        const modelTag = el("aiMentorModelTag");
        if (modelTag) {
          modelTag.textContent = MENTOR_STATE.modelLabel;
          modelTag.title = d.configured ? "Groq · " + (d.model || "llama-3.3-70b-versatile") : "Engineering Mentor Core";
        }
      }
    } catch (_) {}
  }

  function wireMentorUI() {
    const guideBtn = el("modeGuideBtn");
    const aiBtn = el("modeAiHelpBtn");
    const topBtn = el("aiMentorBtn");
    const closeBtn = el("aiMentorCloseBtn");
    const clearBtn = el("aiMentorClearBtn");
    const form = el("aiMentorForm");
    const input = el("aiQuestionInput");
    const inspectTabBtn = el("aiInspectTabBtn");
    const diagnoseBtn = el("aiDiagnoseBtn");
    const reanalyzeBtn = el("aiReanalyzeBtn");
    const newsMentorBtn = el("nMentorBtn");
    const boothAuditBtn = el("boothAiAuditBtn");
    const boothTabBtn = el("boothAiTabBtn");
    const logEl = el("aiChatHistory");
    const nameInput = el("aiUserNameInput");
    const nameSaveBtn = el("aiUserNameSaveBtn");

    if (guideBtn) {
      guideBtn.addEventListener("click", function () {
        closeMentor();
      });
    }
    if (aiBtn) {
      aiBtn.addEventListener("click", function () {
        openMentor();
      });
    }
    if (topBtn) {
      topBtn.addEventListener("click", function () {
        toggleMentor();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeMentor();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        const st = getAppState();
        const mid = (st && st.design && st.design.scenario) || "wildfire";
        delete MENTOR_STATE.sessionsByMission[mid];
        playSfx("paper");
        updateContextBar();
        renderConversation();
      });
    }
    if (inspectTabBtn) {
      inspectTabBtn.addEventListener("click", function () {
        inspectActiveTab();
      });
    }
    if (boothTabBtn) {
      boothTabBtn.addEventListener("click", function () {
        inspectActiveTab();
      });
    }
    if (diagnoseBtn) {
      diagnoseBtn.addEventListener("click", function () {
        openMentor(
          "Give me a friendly, simple-to-understand audit of my current spacecraft configuration for this mission, including required instruments, power/eclipse balance, delta-v, pointing, and budget.",
          "diagnose"
        );
      });
    }
    if (boothAuditBtn) {
      boothAuditBtn.addEventListener("click", function () {
        openMentor(
          "Give me a friendly, simple-to-understand audit of my current spacecraft configuration for this mission, including required instruments, power/eclipse balance, delta-v, pointing, and budget.",
          "diagnose"
        );
      });
    }
    if (reanalyzeBtn) {
      reanalyzeBtn.addEventListener("click", function () {
        askMentor(
          "I just updated my spacecraft configuration! Check my changes and tell me in simple words if my previous issues are fixed or what I should do next.",
          "diagnose"
        );
      });
    }
    if (newsMentorBtn) {
      newsMentorBtn.addEventListener("click", function () {
        explainSimulationFromNews();
      });
    }
    if (form && input) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        playSfx("click");
        askMentor(text, "chat");
      });
    }

    // Delegated click handler for inline quick links, bottom quick-link buttons, and per-message Listen/Stop buttons
    if (logEl) {
      logEl.addEventListener("click", function (ev) {
        const speakBtn = ev.target && ev.target.closest ? ev.target.closest("[data-ai-speak-key]") : null;
        if (speakBtn) {
          ev.preventDefault();
          if (!window.VOX) return;
          const key = speakBtn.getAttribute("data-ai-speak-key") || "";
          if (window.VOX.isSpeaking() && window.VOX.getActiveKey() === key) {
            window.VOX.stop();
            return;
          }
          const directTxt = speakBtn.getAttribute("data-ai-speak-text");
          if (directTxt) {
            window.VOX.speak(directTxt, "mentor", { key: key, force: true });
            return;
          }
          const idx = Number(speakBtn.getAttribute("data-ai-speak-idx"));
          const st = getAppState();
          const mid = (st && st.design && st.design.scenario) || "wildfire";
          const sess = getSession(mid);
          if (sess.messages[idx] && sess.messages[idx].content) {
            window.VOX.speak(sess.messages[idx].content, "mentor", { key: key, force: true });
          }
          return;
        }
        const btn = ev.target && ev.target.closest ? ev.target.closest("[data-qlink-type]") : null;
        if (btn) {
          ev.preventDefault();
          handleQuickLinkAction(btn);
        }
      });
    }

    const aiNarrateBtn = el("aiNarrateBtn");
    if (aiNarrateBtn) {
      aiNarrateBtn.addEventListener("click", function () {
        if (window.VOX) window.VOX.toggle();
      });
    }

    const quickToggleBtn = el("aiQuickToggleBtn");
    const quickListEl = el("aiQuickQuestions");
    if (quickToggleBtn && quickListEl) {
      quickToggleBtn.addEventListener("click", function () {
        const isCollapsed = quickListEl.classList.toggle("collapsed");
        quickToggleBtn.textContent = isCollapsed ? "SHOW \u25BE" : "HIDE \u25B4";
        quickToggleBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        playSfx("click");
      });
    }

    // Friendly Callsign / Name buttons ("Bro", "Sis", custom name input)
    document.querySelectorAll(".cq-ai-nick-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const nick = btn.getAttribute("data-ai-nick") || "bro/sis";
        playSfx("click");
        setFriendlyUserName(nick);
      });
    });

    if (nameSaveBtn && nameInput) {
      nameSaveBtn.addEventListener("click", function () {
        playSfx("click");
        setFriendlyUserName(nameInput.value.trim() || "bro/sis");
      });
      nameInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          playSfx("click");
          setFriendlyUserName(nameInput.value.trim() || "bro/sis");
        }
      });
    }

    syncUserNameUI();
    if (window.VOX && typeof window.VOX.syncUI === "function") window.VOX.syncUI();
    checkAiBackendStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireMentorUI);
  } else {
    wireMentorUI();
  }

  window.CQ_MENTOR = {
    open: openMentor,
    close: closeMentor,
    toggle: toggleMentor,
    ask: askMentor,
    inspectActiveTab: inspectActiveTab,
    explainSimulationFromNews: explainSimulationFromNews,
    onDesignOrEvalUpdated: onDesignOrEvalUpdated,
    setFriendlyUserName: setFriendlyUserName,
  };
})();
