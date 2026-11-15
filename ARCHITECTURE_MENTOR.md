# COSMO QUEST — AI Mission Engineering Mentor Architecture Assessment

## 1. Existing Application Structure & State-Management Assessment

### 1.1 Runtime & Server Topology
- **Frontend (`web/`)**: Vanilla ES5/ES6 JavaScript single-page application styled with a warm retro pixel-art / technical manual aesthetic (`web/style.css`, `Silkscreen` and `VT323` fonts).
  - `web/index.html`: Contains all application screens (`#title`, `#story`, `#prologue`, `#select`, `#hq`, `#team`, `#desk`, `#launch`, `#news`, `#hall`).
  - `web/game.js`: Primary application state machine, UI renderer, deterministic advisor (`advisor()`, `recommend()`), and API client.
  - `web/cosmo.js`, `web/campaign.js`, `web/career.js`, `web/program.js`, `web/labs.js`: Narrative lore (`MISSION_STORY_ARC`, `GENESIS_STAGE_LORE`), career progression, and special mission modes.
- **Backend (`server.py`, `server.js`, `api/index.py`, `engine/`)**:
  - `server.js` runs on port `3000`, serves static assets from `web/`, spawns `server.py` on `PY_PORT` (`3010`), and proxies `/api/*` requests to Python.
  - `server.py` implements `ApiHandlerMixin` serving `/api/catalog`, `/api/evaluate`, `/api/launch`, `/api/montecarlo`, `/api/designs`, `/api/career/*`, and `/api/rooms/*`.
  - `engine/catalog.py`: Authoritative database of 25 scenarios (`SCENARIOS`), destinations (`DESTINATIONS`), orbits (`ORBITS`), launch vehicles (`LAUNCH_VEHICLES`), spacecraft buses (`BUSES`), solar arrays (`SOLAR_ARRAYS`), RTGs (`RTG`), batteries (`BATTERIES`), ADCS (`ADCS`), propulsion (`PROPULSION`), EDL systems (`EDL`), communications (`COMMS`), ground stations (`GROUND`), flight computers (`COMPUTERS`), science instruments (`INSTRUMENTS`), international partners (`PARTNERS`), station modules (`PAYLOADS`), and capsule hardware (`VEHICLE`).
  - `engine/model.py`: Authoritative deterministic physics and engineering evaluator (`normalize()`, `evaluate()`), supporting standard spacecraft (`orbiter`, `lander`, `rover`, `sample_return`), multi-flight space station programs (`_evaluate_program`), and crewed capsule vehicles (`_evaluate_vehicle`).
  - `engine/simulate.py`: Deterministic/seeded mission flight simulator (`simulate()`, `monte_carlo()`) producing month-by-month timeline telemetry, subsystem events, and outcome classification.
  - `engine/scoring.py`: Calculates 0–100 mission scores (`Science`, `Cost`, `Reliability`, `Engineering`), letter grades (`S` through `F`), and post-flight analysis.

### 1.2 Frontend State-Management (`S` in `web/game.js`)
| Data Domain | State Location | Authoritative Source |
| :--- | :--- | :--- |
| **Catalog & Specs** | `S.cat` | `GET /api/catalog` (`engine/catalog.py`) |
| **Current Mission** | `S.design.scenario` & `S.cat.scenarios[S.design.scenario]` | Selected mission scenario |
| **Spacecraft Configuration** | `S.design` (`orbit`, `window`, `launch_vehicle`, `bus`, `solar`, `rtg`, `battery`, `adcs`, `propulsion`, `edl`, `comms`, `ground`, `computer`, `instruments`, `partners`, `years`, `manifest`, `shape`, `seats`, `heatshield`, `abort`, `landing`) | User workbench selections |
| **Power, Mass, Data, Cost, Science, Radiation** | `S.ev.power`, `S.ev.mass`, `S.ev.data`, `S.ev.cost`, `S.ev.science`, `S.ev.radiation`, `S.ev.edl`, `S.ev.schedule` | `POST /api/evaluate` (`engine/model.py:evaluate`) |
| **Validation Errors & Warnings** | `S.ev.issues` (`severity`: `"blocker"` \| `"warning"` \| `"info"`, `area`, `text`, `why`, `field`) | `POST /api/evaluate` (`engine/model.py:evaluate`) |
| **Launch Readiness** | `S.ev.ok` (`True` when zero `"blocker"` issues exist) | `POST /api/evaluate` |
| **Simulation Results** | `S.result` (`sim.launched`, `sim.outcome`, `sim.events`, `sim.timeline`, `sim.months_survived`, `sim.science_fraction`, `score`) | `POST /api/launch` (`engine/simulate.py:simulate`) |

---

## 2. Groq AI Model Evaluation & Selection

### 2.1 Evaluated Groq Production Models
1. **`llama-3.3-70b-versatile` (Selected Default Primary Model)**
   - **Context Window**: 128,000 tokens (32,768 max output tokens).
   - **Reasoning & Instruction Following**: Strong multi-step engineering analysis, accurate adherence to structured numerical telemetry, and clear educational explanations.
   - **Latency**: ~280 tokens/sec on Groq LPUs—delivers detailed interactive engineering responses in ~1–2 seconds.
2. **`openai/gpt-oss-120b` (Primary Fallback Model)**
   - **Strengths**: High reasoning capability for complex multi-constraint trade-offs; serves as immediate fallback if `llama-3.3-70b-versatile` experiences transient rate limiting.
3. **`llama-3.1-8b-instant` (Secondary High-Availability Fallback Model)**
   - **Strengths**: Ultra-low latency (~560 tokens/sec) and high rate-limit headroom for emergency fallback.
4. **Deterministic Engineering Fallback (`deterministic_fallback`)**
   - When `GROQ_API_KEY` is absent in local/CI environments or external network connectivity is unavailable, the service synthesizes structured, mission-grounded engineering explanations directly from the 10-part deterministic analyzer pipeline so the mentor never fails or hallucinates.

### 2.2 Environment Configuration
```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 3. Modular AI Mission Engineering Architecture (`engine/mentor.py`)

The backend service is structured into 10 distinct logical modules inside `engine/mentor.py`:
1. **`SpacecraftStateCollector`**: Normalizes client `design` via `engine.model.normalize()` and runs `engine.model.evaluate()` server-side so client telemetry is always verified against the deterministic physics engine.
2. **`EngineeringDataNormalizer`**: Converts raw evaluation dicts into unit-annotated engineering telemetry across all three mission architectures (`standard`, `program`, `vehicle`), marking unselected or inapplicable metrics as `"unavailable"`.
3. **`MissionObjectiveAnalyzer`**: Maps scenario goals (`required` vs `optional`) against current science coverage (`tag_best`, `goal_status`), identifying unmet tags and compatible catalog instruments.
4. **`ComponentCompatibilityAnalyzer`**: Evaluates cross-subsystem constraints (instrument domain vs mission type, Venus optical block, pointing requirements vs ADCS accuracy, magnetorquers vs magnetic field, HGA dish pointing, EDL mass/world compatibility, launch vehicle capacity and human rating) and inspects any catalog component mentioned in the student's question.
5. **`EngineeringConstraintAnalyzer`**: Separates issues into `critical_blockers`, `missing_components`, `mission_objective_mismatches`, `budget_problems`, and `engineering_warnings`, and computes concrete upgrade paths with exact delta-cost, delta-mass, and delta-power numbers.
6. **`SimulationResultInterpreter`**: Parses post-launch simulation timelines, fatal/warning events, failure month/stage, and subsystem telemetry decay.
7. **`MissionContextBuilder`**: Aggregates all normalized mission, spacecraft, calculation, validation, compatibility, and simulation analyses into a single structured context payload.
8. **`ConversationContextManager`**: Maintains bounded session history keyed by `conversation_id` and `scenario`, tracking spacecraft configuration deltas between turns.
9. **`GroqAIService`**: Communicates with `https://api.groq.com/openai/v1/chat/completions` using `GROQ_API_KEY` and `GROQ_MODEL`, with model fallback and deterministic offline fallback.
10. **`AIResponseFormatter`**: Produces consistent structured JSON output with `answer`, `sections`, `context_summary`, `suggested_questions`, and `issue_breakdown`.

---

## 4. Security & Educational Guardrails
- **API Key Protection**: `GROQ_API_KEY` is read exclusively on the server (`engine/mentor.py`) and is never sent to the browser, logged, or exposed in error payloads.
- **Server-Side Authority**: The backend re-runs `normalize()` and `evaluate()` on every request rather than trusting client-calculated numbers.
- **User Control**: The AI Mentor never mutates `S.design` automatically; students review trade-offs and make all workbench changes themselves.
