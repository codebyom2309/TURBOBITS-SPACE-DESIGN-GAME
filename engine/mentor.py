"""COSMO QUEST — AI Mission Engineering Mentor service.

Implements a 10-part modular engineering mentor architecture:
  1. SpacecraftStateCollector
  2. EngineeringDataNormalizer
  3. MissionObjectiveAnalyzer
  4. ComponentCompatibilityAnalyzer
  5. EngineeringConstraintAnalyzer
  6. SimulationResultInterpreter
  7. MissionContextBuilder
  8. ConversationContextManager
  9. GroqAIService
 10. AIResponseFormatter

All engineering calculations are produced deterministically by engine.model.evaluate()
and engine.catalog; the AI service interprets those authoritative numbers for educational
guidance and never overrides the deterministic validation engine.
"""

from __future__ import annotations

import json
import math
import os
import re
import time
import urllib.error
import urllib.request
import uuid
from typing import Any

from . import catalog as C
from .model import edl_use, evaluate, kind_of, normalize

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
FALLBACK_GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "llama-3.1-8b-instant",
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MAX_QUESTION_LEN = 1200
MAX_HISTORY_TURNS = 8
MAX_CONVERSATIONS = 250


def get_groq_config() -> tuple[str, str]:
    """Returns (api_key, model_id) while sanitizing accidental key/model swaps in env vars."""
    raw_key = os.environ.get("GROQ_API_KEY", "").strip()
    raw_model = os.environ.get("GROQ_MODEL", "").strip()

    # If GROQ_API_KEY is empty but user pasted their gsk_ key into GROQ_MODEL, recover it
    if not raw_key and raw_model.startswith("gsk_"):
        raw_key = raw_model

    # Never allow a secret key (gsk_...) or invalid string to be used as a model identifier
    if not raw_model or raw_model.startswith("gsk_") or " " in raw_model or len(raw_model) > 80:
        model_id = DEFAULT_GROQ_MODEL
    else:
        model_id = raw_model

    return raw_key, model_id


# ---------------------------------------------------------------------------
# AEROSPACE CONCEPT KNOWLEDGE BASE (Dual-Layer: Simple + Technical)
# ---------------------------------------------------------------------------

AEROSPACE_CONCEPTS: dict[str, dict[str, Any]] = {
    "delta_v": {
        "title": "Delta-v (Velocity Change Budget)",
        "keywords": ["delta-v", "delta v", "dv", "propellant", "rocket equation", "tsiolkovsky", "isp", "specific impulse", "fuel"],
        "simple": (
            "Delta-v (change in velocity, measured in m/s) is your spacecraft's maneuvering currency. "
            "Every orbital change—entering orbit, landing, fighting atmospheric drag, or station-keeping—spends a fixed amount of delta-v."
        ),
        "technical": (
            "Governed by the Tsiolkovsky Rocket Equation: dv = Isp * g0 * ln(m_wet / m_dry), where g0 = 9.80665 m/s². "
            "Higher specific impulse (Isp, e.g., Ion drive vs Cold Gas at 70 s) reduces propellant mass exponentially for large velocity changes, "
            "whereas heavier dry mass increases the propellant required to achieve the same orbit insertion and station-keeping dv."
        ),
    },
    "orbital_altitude": {
        "title": "Orbital Altitude & Regime Selection",
        "keywords": ["orbital altitude", "orbit", "leo", "meo", "geo", "heo", "l1", "l2", "altitude", "swath", "revisit"],
        "simple": (
            "Your orbit acts like the camera lens distance: low orbits get close-up, sharp views of a narrow strip, "
            "while high orbits see an entire hemisphere continuously from far away."
        ),
        "technical": (
            "Lower orbital altitude increases spatial resolution for nadir optical/radar payloads and lowers launch insertion dv, "
            "but increases eclipse duration (`eclipse_h`) and atmospheric drag station-keeping (`dv_per_year`). Higher orbits "
            "reduce eclipse fraction and increase continuous coverage (`coverage`), at the cost of higher insertion dv and launch energy."
        ),
    },
    "sso": {
        "title": "Sun-Synchronous Orbit (SSO)",
        "keywords": ["sso", "sun-synchronous", "sun synchronous", "dawn-dusk", "polar", "local solar time", "lighting angle"],
        "simple": (
            "A Sun-Synchronous Orbit is a near-polar Earth orbit that passes over every spot on Earth at the exact same local solar time each day, "
            "so shadows and sunlight stay consistent for comparing climate, ice, or wildfire images."
        ),
        "technical": (
            "At ~600–800 km altitude and ~98° retrograde inclination, Earth's equatorial oblateness (J2 perturbation) precesses the orbital plane "
            "by ~0.9856°/day—matching Earth's mean motion around the Sun. This locks the local solar lighting angle and provides global latitude coverage."
        ),
    },
    "reaction_wheels": {
        "title": "Reaction Wheels & Attitude Control (ADCS)",
        "keywords": ["reaction wheel", "pointing", "attitude", "adcs", "star tracker", "magnetorquer", "momentum", "desaturation", "slewing", "deg"],
        "simple": (
            "Reaction wheels are precision electric flywheels inside the spacecraft. When a motor spins a wheel one way, "
            "the spacecraft gently rotates the opposite way—letting telescopes and antennas point steadily without burning fuel."
        ),
        "technical": (
            "By conservation of angular momentum (L = I * omega), internal momentum exchange torques the spacecraft bus with high pointing stability "
            "(0.1° with Reaction Wheels, 0.01° with Star Tracker + Fine Wheels, vs 2.0° with Magnetorquers). Note that Magnetorquers require a planetary "
            "magnetosphere (`magnetic: True`) to push against and cannot operate at non-magnetic bodies like the Moon, Mars, or Venus."
        ),
    },
    "thermal_infrared": {
        "title": "Thermal Infrared & Cryo-Cooled Instruments",
        "keywords": ["thermal", "infrared", "tir", "cryo", "bolometer", "fire", "hot-spot", "emissivity", "spectrometer"],
        "simple": (
            "Thermal infrared sensors measure heat energy emitted directly by surfaces, clouds, or wildfires—allowing them to detect hotspots "
            "through smoke and in total darkness where normal visible-light cameras are blind."
        ),
        "technical": (
            "Operating in mid-wave and thermal IR bands (3–14 µm), thermal imagers and cooled spectrometers measure blackbody spectral radiance "
            "(Planck's law). They require stable pointing (`pointing_deg`) and unobstructed spectral windows (dense cloud decks like Venus block "
            "orbital optical/IR cameras, requiring Synthetic Aperture Radar or atmospheric entry probes)."
        ),
    },
    "orbiter_vs_lander": {
        "title": "Orbiter vs. Lander / Rover Architecture",
        "keywords": ["orbiter", "lander", "rover", "edl", "surface", "in-situ", "sample return", "airbag", "sky crane", "sky-crane", "heatshield", "parachute"],
        "simple": (
            "An orbiter surveys an entire world from space over many years, whereas a lander or rover touches down on a single site "
            "to drill, analyze soil directly, or listen for quakes."
        ),
        "technical": (
            "Orbital missions (`surface: False` destination) use `where: 'orbit'` or `'any'` remote-sensing payloads without EDL mass overhead. "
            "Surface missions (`lander`, `rover`, `sample_return`) require an Entry, Descent, and Landing (EDL) system (`max_landed >= landed_mass`, "
            "matching `needs_atmosphere` to the target world) and carry `where: 'surface'` or `'any'` in-situ instruments."
        ),
    },
    "high_gain_antenna": {
        "title": "High-Gain Antenna (HGA) & Deep Space Link Budget",
        "keywords": ["high-gain", "hga", "antenna", "comms", "downlink", "x-band", "ka-band", "uhf", "dsn", "data rate", "gb/day"],
        "simple": (
            "A High-Gain Antenna focuses radio waves into a tight spotlight beam aimed at Earth. It lets distant spacecraft transmit "
            "huge amounts of science data across millions of kilometers, but it must be pointed very accurately."
        ),
        "technical": (
            "Free-space path loss scales with distance squared (`1 / earth_au²`). Parabolic X-Band (`xhga`) and Ka-Band (`kahga`) High-Gain Dishes "
            "focus RF energy into a narrow beamwidth to maximize Mbps at deep-space distances when paired with the Deep Space Network (DSN 34m/70m). "
            "Because the beamwidth is narrow, HGAs require spacecraft ADCS pointing accuracy <= 0.5°."
        ),
    },
    "power_and_eclipse": {
        "title": "Solar Flux Inverse-Square Law, Eclipse & Battery Sizing",
        "keywords": ["power", "solar", "battery", "eclipse", "rtg", "au", "watt", "wh", "inverse-square", "shadow"],
        "simple": (
            "Solar panels make electricity in sunlight, and batteries keep the spacecraft alive when it passes into a planet's dark shadow (eclipse). "
            "Further from the Sun, sunlight gets much weaker, so outer-planet missions often need nuclear RTGs."
        ),
        "technical": (
            "Solar irradiance scales by the inverse-square law (`1 / sun_au²`): at Mars (1.52 AU) sunlight is 43% of Earth's; at Jupiter (5.2 AU) "
            "it is 3.7%. During orbital shadow (`eclipse_need_wh = eclipse_h * max(0, load_w - rtg_w)`), usable battery capacity "
            "(`wh * BATTERY_DOD`) must exceed `eclipse_need_wh`, or RTGs must supply continuous radioisotope decay power."
        ),
    },
}


# ---------------------------------------------------------------------------
# 1. SPACECRAFT STATE COLLECTOR
# ---------------------------------------------------------------------------

class SpacecraftStateCollector:
    """Collects and verifies the user's spacecraft configuration against the deterministic engine."""

    @staticmethod
    def collect(raw_design: dict[str, Any] | None, client_sim: dict[str, Any] | None = None) -> dict[str, Any]:
        safe_input = dict(raw_design) if isinstance(raw_design, dict) else {}
        norm_design = normalize(safe_input)
        evaluation = evaluate(norm_design)
        scenario_id = norm_design.get("scenario", "wildfire")
        scenario = C.SCENARIOS.get(scenario_id) or next(iter(C.SCENARIOS.values()))
        dest_key = scenario.get("destination", "earth")
        destination = C.DESTINATIONS.get(dest_key, {})
        difficulty = C.DIFFICULTY.get(norm_design.get("difficulty", "normal"), C.DIFFICULTY["normal"])

        return {
            "raw_design": safe_input,
            "design": norm_design,
            "evaluation": evaluation,
            "scenario_id": scenario_id,
            "scenario": scenario,
            "dest_key": dest_key,
            "destination": destination,
            "difficulty": difficulty,
            "client_sim": client_sim if isinstance(client_sim, dict) else None,
        }


# ---------------------------------------------------------------------------
# 2. ENGINEERING DATA NORMALIZER
# ---------------------------------------------------------------------------

class EngineeringDataNormalizer:
    """Normalizes mission, spacecraft, and calculated engineering telemetry with explicit units."""

    @staticmethod
    def _component_summary(cat_dict: dict[str, dict], key: str | None) -> dict[str, Any]:
        if not key or key not in cat_dict:
            return {"id": None, "name": "unavailable", "status": "not_selected"}
        item = dict(cat_dict[key])
        item["id"] = key
        item["status"] = "selected"
        return item

    @classmethod
    def normalize_data(cls, collected: dict[str, Any]) -> dict[str, Any]:
        d = collected["design"]
        ev = collected["evaluation"]
        sc = collected["scenario"]
        dest_key = collected["dest_key"]
        dest = collected["destination"]
        diff = collected["difficulty"]
        kind = ev.get("kind", kind_of(collected["scenario_id"]))

        budget_base = sc.get("budget", 0)
        budget_limit = round(budget_base * diff.get("budget_mult", 1.0), 1)

        # A. Mission Information
        req_goals = [g for g in sc.get("goals", []) if g.get("required")]
        opt_goals = [g for g in sc.get("goals", []) if not g.get("required")]
        req_tags = [g["tag"] for g in req_goals]
        is_surface_dest = bool(dest.get("surface", False))
        blind_set = set(dest.get("blind", []))

        matching_req_instruments: dict[str, list[str]] = {}
        for g in req_goals:
            tag = g["tag"]
            matches = []
            for iid, inst in C.INSTRUMENTS.items():
                if tag in inst.get("tags", []):
                    where = inst.get("where", "any")
                    if where == "orbit" and is_surface_dest:
                        continue
                    if where == "surface" and not is_surface_dest:
                        continue
                    if iid in blind_set:
                        continue
                    matches.append(f"{inst['name']} ({iid})")
            matching_req_instruments[tag] = matches

        orbits_for_dest = C.ORBITS.get(dest_key, {})

        mission_info = {
            "mission_id": collected["scenario_id"],
            "mission_name": sc.get("name", "Unknown Mission"),
            "destination_id": dest_key,
            "destination_name": dest.get("name", "Unknown"),
            "mission_category": sc.get("category", "Campaign"),
            "mission_type": kind,
            "mission_kind": kind,
            "difficulty_id": d.get("difficulty", "normal"),
            "difficulty_name": diff.get("name", "Flight Engineer"),
            "sandbox": bool(d.get("sandbox", False)),
            "client_name": sc.get("client", "Mission Director"),
            "client_title": sc.get("role", ""),
            "pitch": sc.get("pitch", ""),
            "briefing": sc.get("letter", ""),
            "planned_years": d.get("years", sc.get("min_years", 2)),
            "min_years_required": sc.get("min_years", 2),
            "budget_limit_m": budget_limit,
            "base_budget_m": budget_base,
            "required_objectives": req_goals,
            "optional_objectives": opt_goals,
            "required_science_tags": req_tags,
            "compatible_instruments_by_required_tag": matching_req_instruments,
            "environmental_constraints": {
                "sun_distance_au": dest.get("sun_au", 1.0),
                "earth_distance_au": dest.get("earth_au", 0.0),
                "solar_flux_pct_of_earth": round(100.0 / (max(0.1, dest.get("sun_au", 1.0)) ** 2), 1),
                "radiation_level": dest.get("radiation", 1),
                "radiation_label": C.RADIATION_LABEL.get(dest.get("radiation", 1), "Low"),
                "atmosphere": bool(dest.get("atmosphere", False)),
                "magnetic_field": bool(dest.get("magnetic", False)),
                "surface_mission": is_surface_dest,
                "blocked_instruments": list(blind_set),
                "blocked_reason": dest.get("blind_why", ""),
                "available_orbits": list(orbits_for_dest.keys()),
            },
        }

        # Science coverage fraction across goals
        sci = ev.get("science", {})
        sci_goals = sci.get("goals", [])
        avg_goal_frac = (
            sum(g.get("fraction", 0.0) for g in sci_goals) / len(sci_goals)
            if sci_goals else 0.0
        )

        # B & C. Spacecraft Configuration & Engineering Calculations by Mission Kind
        if kind == "program":
            prog = ev.get("program", {})
            cost = ev.get("cost", {})
            manifest = d.get("manifest", [])
            spacecraft_config = {
                "architecture": "multi_flight_station_program",
                "manifest_flights": manifest,
                "flight_count": len(manifest),
                "selected_partners": d.get("partners", []),
            }
            calculations = {
                "mass": {
                    "launch_mass_margin_ratio": round(ev.get("mass", {}).get("margin", 0.0), 2),
                },
                "power": {
                    "power_margin_ratio": round(ev.get("power", {}).get("margin", 0.0), 2),
                },
                "cost": {
                    "total_cost_m": round(cost.get("total", 0), 1),
                    "budget_limit_m": round(cost.get("budget", budget_limit), 1),
                    "remaining_budget_m": round(cost.get("budget", budget_limit) - cost.get("total", 0), 1),
                    "reserve_ratio": round(cost.get("reserve", 0.0), 3),
                    "breakdown_m": cost.get("items", {}),
                },
                "science": {
                    "coverage_fraction": round(avg_goal_frac, 3),
                    "estimated_score": round(sci.get("score", 0), 1),
                    "goals": sci_goals,
                },
                "program_details": prog,
            }
            return {
                "mission": mission_info,
                "spacecraft": spacecraft_config,
                "calculations": calculations,
            }

        if kind == "vehicle":
            veh = ev.get("vehicle", {})
            mass = ev.get("mass", {})
            cost = ev.get("cost", {})
            spacecraft_config = {
                "architecture": "crewed_capsule_vehicle",
                "hull_shape": cls._component_summary(C.VEHICLE["shape"], d.get("shape")),
                "seats": cls._component_summary(C.VEHICLE["seats"], d.get("seats")),
                "heatshield": cls._component_summary(C.VEHICLE["heatshield"], d.get("heatshield")),
                "abort_system": cls._component_summary(C.VEHICLE["abort"], d.get("abort")),
                "landing_system": cls._component_summary(C.VEHICLE["landing"], d.get("landing")),
                "launch_vehicle": cls._component_summary(C.LAUNCH_VEHICLES, d.get("launch_vehicle")),
            }
            calculations = {
                "mass": {
                    "dry_mass_kg": round(mass.get("dry", 0), 1),
                    "wet_mass_kg": round(mass.get("wet", 0), 1),
                    "launch_mass_kg": round(mass.get("wet", 0), 1),
                    "launch_vehicle_capacity_kg": round(mass.get("capacity", 0), 1),
                    "launch_mass_margin_kg": round(mass.get("capacity", 0) - mass.get("wet", 0), 1),
                },
                "power": {
                    "power_margin_w": "nominal (capsule battery/fuel-cell)",
                },
                "capsule_telemetry": veh,
                "cost": {
                    "total_cost_m": round(cost.get("total", 0), 1),
                    "budget_limit_m": round(cost.get("budget", budget_limit), 1),
                    "remaining_budget_m": round(cost.get("budget", budget_limit) - cost.get("total", 0), 1),
                    "reserve_ratio": round(cost.get("reserve", 0.0), 3),
                    "breakdown_m": cost.get("items", {}),
                },
                "science": {
                    "coverage_fraction": round(avg_goal_frac, 3),
                    "estimated_score": round(sci.get("score", 0), 1),
                    "goals": sci_goals,
                },
            }
            return {
                "mission": mission_info,
                "spacecraft": spacecraft_config,
                "calculations": calculations,
            }

        # Standard Spacecraft (orbiter, lander, rover, sample_return)
        selected_instruments = []
        for iid in d.get("instruments", []):
            if iid in C.INSTRUMENTS:
                inst = dict(C.INSTRUMENTS[iid])
                inst["id"] = iid
                selected_instruments.append(inst)

        selected_partners = []
        for pid in d.get("partners", []):
            if pid in C.PARTNERS:
                part = dict(C.PARTNERS[pid])
                part["id"] = pid
                selected_partners.append(part)

        use = edl_use(collected["scenario_id"])
        rtg_count = int(d.get("rtg") or 0)
        rtg_summary = {
            "count": rtg_count,
            "name": f"{rtg_count}x {C.RTG['name']}" if rtg_count > 0 else "0x RTG (none)",
            "total_power_w": rtg_count * C.RTG["power"],
            "total_mass_kg": rtg_count * C.RTG["mass"],
            "total_cost_m": rtg_count * C.RTG["cost"],
        }

        spacecraft_config = {
            "architecture": "spacecraft_bus",
            "orbit": cls._component_summary(orbits_for_dest, d.get("orbit")),
            "launch_window": d.get("window") or "unavailable",
            "launch_vehicle": cls._component_summary(C.LAUNCH_VEHICLES, d.get("launch_vehicle")),
            "bus": cls._component_summary(C.BUSES, d.get("bus")),
            "solar_array": cls._component_summary(C.SOLAR_ARRAYS, d.get("solar")),
            "rtg": rtg_summary,
            "battery": cls._component_summary(C.BATTERIES, d.get("battery")),
            "adcs": cls._component_summary(C.ADCS, d.get("adcs")),
            "propulsion": cls._component_summary(C.PROPULSION, d.get("propulsion")),
            "edl": cls._component_summary(C.EDL, d.get("edl")) if use else {"id": None, "name": "Not required (orbital mission)", "status": "not_applicable"},
            "comms": cls._component_summary(C.COMMS, d.get("comms")),
            "ground_station": cls._component_summary(C.GROUND, d.get("ground")),
            "computer": cls._component_summary(C.COMPUTERS, d.get("computer")),
            "selected_instruments": selected_instruments,
            "selected_instrument_ids": [i["id"] for i in selected_instruments],
            "selected_partners": selected_partners,
            "planned_years": d.get("years", sc.get("min_years", 2)),
        }

        mass = ev.get("mass", {})
        power = ev.get("power", {})
        data = ev.get("data", {})
        rad = ev.get("radiation", {})
        cost = ev.get("cost", {})
        edl_info = ev.get("edl", {})
        sched = ev.get("schedule", {})
        bus_obj = C.BUSES.get(d.get("bus"), {})
        adcs_obj = C.ADCS.get(d.get("adcs"), {})
        orbit_info = ev.get("orbit_info", {})

        wet_val = mass.get("wet", 0)
        wet_clean = round(wet_val, 1) if isinstance(wet_val, (int, float)) and math.isfinite(wet_val) else "infinite (exceeds rocket equation limit)"
        prop_val = mass.get("propellant", 0)
        prop_clean = round(prop_val, 1) if isinstance(prop_val, (int, float)) and math.isfinite(prop_val) else "infinite (ISP too low for required dv)"
        cap_val = mass.get("capacity", 0)
        margin_kg = round(cap_val - wet_val, 1) if isinstance(wet_val, (int, float)) and math.isfinite(wet_val) else -99999

        gen_w = round(power.get("generation", 0.0), 1)
        load_w = round(power.get("load", 0.0), 1)
        net_power_w = round(gen_w - load_w, 1)
        bat_usable = round(power.get("battery_usable_wh", 0.0), 1)
        ec_need = round(power.get("eclipse_need_wh", 0.0), 1)

        calculations = {
            "mass": {
                "dry_mass_kg": round(mass.get("dry", 0.0), 1) if math.isfinite(mass.get("dry", 0.0)) else "infinite",
                "bus_max_dry_kg": bus_obj.get("max_dry", "unavailable"),
                "landed_mass_kg": round(mass.get("parts", {}).get("Bus structure", 0) + sum(v for k, v in mass.get("parts", {}).items() if k not in ("Bus structure", "Landing system", "Return capsule")), 1),
                "edl_mass_kg": round(mass.get("edl", 0.0), 1),
                "edl_max_landed_kg": C.EDL.get(d.get("edl"), {}).get("max_landed", "unavailable") if use else "not_applicable",
                "propellant_mass_kg": prop_clean,
                "wet_mass_kg": wet_clean,
                "launch_mass_kg": wet_clean,
                "launch_vehicle_capacity_kg": cap_val if d.get("launch_vehicle") else "unavailable",
                "launch_mass_margin_kg": margin_kg if d.get("launch_vehicle") else "unavailable",
                "launch_mass_margin_pct": round(mass.get("margin", 0.0) * 100, 1) if d.get("launch_vehicle") else "unavailable",
                "delta_v_required_ms": round(mass.get("dv", 0.0), 1),
            },
            "power": {
                "sunlit_solar_w": round(power.get("sunlit", 0.0), 1),
                "rtg_generated_w": round(power.get("rtg", 0.0), 1),
                "total_generated_w": gen_w,
                "total_consumed_w": load_w,
                "power_margin_w": net_power_w,
                "power_margin_pct": round(power.get("margin", 0.0) * 100, 1),
                "eclipse_duration_h": orbit_info.get("eclipse_h", 0.0),
                "eclipse_fraction": orbit_info.get("eclipse_frac", 0.0),
                "eclipse_energy_required_wh": ec_need,
                "battery_usable_wh": bat_usable,
                "battery_margin_wh": round(bat_usable - ec_need, 1),
                "Subsystem_loads_w": {k: round(v, 1) for k, v in power.get("loads", {}).items()},
            },
            "pointing_and_slots": {
                "instrument_slots_used": len(selected_instruments) + len(selected_partners),
                "instrument_slots_capacity": bus_obj.get("slots", "unavailable"),
                "adcs_accuracy_deg": adcs_obj.get("pointing_deg", "unavailable"),
                "strictest_instrument_req_deg": min([i.get("pointing_deg", 10.0) for i in selected_instruments], default="not_applicable"),
                "high_gain_dish_req_deg": 0.5 if d.get("comms") in ("xhga", "kahga") else "not_applicable",
            },
            "communications": {
                "downlink_capacity_gb_day": round(data.get("downlink_gb_day", 0.0), 2),
                "science_data_produced_gb_day": round(data.get("generated_gb_day", 0.0), 2),
                "downlink_return_ratio_pct": round(data.get("return", 1.0) * 100, 1),
                "contact_hours_per_day": round(data.get("contact_hours", 0.0), 1),
                "onboard_storage_need_gb": round(data.get("storage_need_gb", 0.0), 1),
                "onboard_storage_cap_gb": data.get("storage_gb", "unavailable"),
            },
            "radiation": {
                "environment_level": rad.get("env", 1),
                "environment_label": C.RADIATION_LABEL.get(rad.get("env", 1), "Low"),
                " spacecraft_tolerance_level": rad.get("tolerance", 0),
                "deficit_levels": rad.get("deficit", 0),
                "mission_survival_probability_pct": round(rad.get("survival", 1.0) * 100, 1),
            },
            "schedule": {
                "selected_window": sched.get("window", {}).get("label") if sched.get("window") else "unavailable",
                "build_months": sched.get("window", {}).get("build_months") if sched.get("window") else "unavailable",
                "slip_probability_pct": round(sched.get("slip", 0.0) * 100, 1),
                "cruise_years": ev.get("cruise_years", 0.0),
                "science_years": ev.get("years", 1),
                "effective_years": ev.get("effective_years", 1),
            },
            "cost": {
                "total_cost_m": round(cost.get("total", 0.0), 1),
                "budget_limit_m": round(cost.get("budget", budget_limit), 1),
                "remaining_budget_m": round(cost.get("budget", budget_limit) - cost.get("total", 0.0), 1),
                "reserve_pct": round(cost.get("reserve", 0.0) * 100, 1),
                "partner_savings_m": round(ev.get("partners", {}).get("saving", 0.0), 1),
                "breakdown_m": {k: round(v, 1) for k, v in cost.get("items", {}).items()},
            },
            "science": {
                "coverage_fraction": round(avg_goal_frac, 3),
                "estimated_score": round(sci.get("score", 0.0), 1),
                "goals": sci_goals,
                "per_instrument_points": {k: round(v, 1) for k, v in sci.get("per_instrument", {}).items()},
            },
        }

        return {
            "mission": mission_info,
            "spacecraft": spacecraft_config,
            "calculations": calculations,
        }


# ---------------------------------------------------------------------------
# 3. MISSION OBJECTIVE ANALYZER
# ---------------------------------------------------------------------------

class MissionObjectiveAnalyzer:
    """Analyzes required vs optional mission objectives and recommends matching instruments."""

    @staticmethod
    def analyze(collected: dict[str, Any], normalized: dict[str, Any]) -> dict[str, Any]:
        sc = collected["scenario"]
        dest = collected["destination"]
        ev = collected["evaluation"]
        d = collected["design"]
        kind = ev.get("kind", kind_of(collected["scenario_id"]))
        sci = ev.get("science", {})
        goals = sci.get("goals", [])

        met_required = []
        unmet_required = []
        weak_objectives = []
        optional_status = []

        for g in goals:
            frac = g.get("fraction", 0.0)
            entry = {
                "tag": g.get("tag"),
                "label": g.get("label"),
                "required": bool(g.get("required")),
                "coverage_pct": round(frac * 100, 1),
                "met": bool(g.get("met", frac >= 0.5)),
                "weight": g.get("weight", 25),
            }
            if g.get("required"):
                if not entry["met"]:
                    unmet_required.append(entry)
                else:
                    met_required.append(entry)
                    if frac < 0.85:
                        weak_objectives.append(entry)
            else:
                optional_status.append(entry)

        # Recommend specific catalog instruments for unmet or weak tags
        recommended_instruments = []
        if kind not in ("program", "vehicle"):
            is_surface_dest = bool(dest.get("surface", False))
            blind_set = set(dest.get("blind", []))
            selected_set = set(d.get("instruments", []))
            target_tags = [g["tag"] for g in unmet_required] + [g["tag"] for g in weak_objectives]
            seen_inst = set()

            for tag in target_tags:
                candidates = []
                for iid, inst in C.INSTRUMENTS.items():
                    if iid in selected_set or iid in seen_inst:
                        continue
                    if tag not in inst.get("tags", []):
                        continue
                    where = inst.get("where", "any")
                    if where == "orbit" and is_surface_dest:
                        continue
                    if where == "surface" and not is_surface_dest:
                        continue
                    if iid in blind_set:
                        continue
                    candidates.append((inst.get("value", 20), -inst["cost"], iid, inst))

                candidates.sort(reverse=True)
                for val_pts, _, iid, inst in candidates[:2]:
                    seen_inst.add(iid)
                    recommended_instruments.append({
                        "id": iid,
                        "name": inst["name"],
                        "satisfies_tag": tag,
                        "value_points": val_pts,
                        "mass_kg": inst["mass"],
                        "power_w": inst["power"],
                        "cost_m": inst["cost"],
                        "data_mbps": inst["data_mbps"],
                        "req_pointing_deg": inst["pointing_deg"],
                        "where": inst.get("where", "any"),
                        "desc": inst.get("blurb", inst.get("desc", "")),
                    })

        overall_pct = round(
            (sum(g.get("fraction", 0.0) for g in goals) / len(goals) * 100.0) if goals else 0.0,
            1,
        )

        return {
            "all_required_met": len(unmet_required) == 0,
            "met_required_objectives": met_required,
            "unmet_required_objectives": unmet_required,
            "weak_required_objectives": weak_objectives,
            "optional_objectives": optional_status,
            "overall_science_coverage_pct": overall_pct,
            "recommended_instruments_for_gaps": recommended_instruments,
        }


# ---------------------------------------------------------------------------
# 4. COMPONENT COMPATIBILITY ANALYZER
# ---------------------------------------------------------------------------

class ComponentCompatibilityAnalyzer:
    """Evaluates component suitability and inspects any catalog item mentioned in a student's query."""

    @classmethod
    def analyze(cls, collected: dict[str, Any], question: str = "") -> dict[str, Any]:
        d = collected["design"]
        sc = collected["scenario"]
        dest = collected["destination"]
        ev = collected["evaluation"]
        kind = ev.get("kind", kind_of(collected["scenario_id"]))

        mismatches: list[dict[str, Any]] = []
        if kind not in ("program", "vehicle"):
            is_surface_dest = bool(dest.get("surface", False))
            blind_set = set(dest.get("blind", []))
            adcs_obj = C.ADCS.get(d.get("adcs"))
            adcs_acc = adcs_obj["pointing_deg"] if adcs_obj else 99.0
            bus_obj = C.BUSES.get(d.get("bus"))
            req_tags = {g["tag"] for g in sc.get("goals", []) if g.get("required")}
            all_goal_tags = {g["tag"] for g in sc.get("goals", [])}

            # Check each selected instrument
            for iid in d.get("instruments", []):
                inst = C.INSTRUMENTS.get(iid)
                if not inst:
                    continue
                inst_tags = set(inst.get("tags", []))
                where = inst.get("where", "any")

                if where == "orbit" and is_surface_dest:
                    mismatches.append({
                        "component_id": iid,
                        "component_name": inst["name"],
                        "category": "instrument_domain",
                        "reason": f"{inst['name']} only works from orbit (`where: 'orbit'`), but {sc['name']} lands on {dest['name']}.",
                        "mission_requires": f"Surface or dual-use payload (`where: 'surface'` or `'any'`) for {dest['name']}",
                        "component_provides": "Orbital-only observations (zero science on surface)",
                    })
                elif where == "surface" and not is_surface_dest:
                    mismatches.append({
                        "component_id": iid,
                        "component_name": inst["name"],
                        "category": "instrument_domain",
                        "reason": f"{inst['name']} requires surface contact (`where: 'surface'`), which produces zero science from orbit.",
                        "mission_requires": "Orbital remote-sensing or fields/particles payload (`where: 'orbit'` or `'any'`)",
                        "component_provides": "In-situ surface contact measurement only",
                    })

                if iid in blind_set:
                    mismatches.append({
                        "component_id": iid,
                        "component_name": inst["name"],
                        "category": "environmental_constraint",
                        "reason": f"{inst['name']} cannot see through {dest['name']}'s atmosphere: {dest.get('blind_why', 'opaque clouds block view')}.",
                        "mission_requires": "Cloud-penetrating radar (`sar`), sounder, or magnetometer",
                        "component_provides": "Optical/IR wavelengths blocked by clouds",
                    })

                if not (inst_tags & all_goal_tags):
                    mismatches.append({
                        "component_id": iid,
                        "component_name": inst["name"],
                        "category": "objective_mismatch",
                        "reason": f"{inst['name']} provides tags {sorted(inst_tags)}, none of which match {sc['name']}'s science goals {sorted(all_goal_tags)}.",
                        "mission_requires": f"Required science tags: {sorted(req_tags)}",
                        "component_provides": f"Science tags: {sorted(inst_tags)} ({inst['mass']} kg, {inst['power']} W, ${inst['cost']}M)",
                    })

                if adcs_obj and adcs_acc > inst.get("pointing_deg", 10.0):
                    mismatches.append({
                        "component_id": iid,
                        "component_name": inst["name"],
                        "category": "pointing_mismatch",
                        "reason": f"{inst['name']} needs <= {inst['pointing_deg']}° pointing stability, but {adcs_obj['name']} only gives {adcs_acc}° (blurring data quality).",
                        "mission_requires": f"ADCS pointing accuracy <= {inst['pointing_deg']}°",
                        "component_provides": f"Current ADCS ({adcs_obj['name']}) accuracy: {adcs_acc}°",
                    })

            # Check ADCS vs Magnetic Field
            if adcs_obj and adcs_obj.get("needs_magnetic") and not dest.get("magnetic", False):
                mismatches.append({
                    "component_id": d.get("adcs"),
                    "component_name": adcs_obj["name"],
                    "category": "environmental_constraint",
                    "reason": f"{adcs_obj['name']} requires a planetary magnetic field to push against, which {dest['name']} lacks (`magnetic: False`).",
                    "mission_requires": "Reaction Wheels (`wheels`, 0.1°) or Star Tracker + Fine Wheels (`precision`, 0.01°)",
                    "component_provides": "Magnetic torque coils only (ineffective without magnetosphere)",
                })

            # Check High-Gain Dish vs Pointing
            if d.get("comms") in ("xhga", "kahga") and adcs_obj and adcs_acc > 0.5:
                comms_obj = C.COMMS[d["comms"]]
                mismatches.append({
                    "component_id": d["comms"],
                    "component_name": comms_obj["name"],
                    "category": "pointing_mismatch",
                    "reason": f"{comms_obj['name']} has a narrow radio beam requiring <= 0.5° pointing, but {adcs_obj['name']} only points to {adcs_acc}°.",
                    "mission_requires": "Reaction Wheels (0.1°) or Star Tracker + Fine Wheels (0.01°)",
                    "component_provides": f"{adcs_obj['name']} ({adcs_acc}°)",
                })

            # Check Bus dry mass & slots
            if bus_obj:
                dry = ev.get("mass", {}).get("dry", 0)
                if math.isfinite(dry) and dry > bus_obj["max_dry"]:
                    mismatches.append({
                        "component_id": d.get("bus"),
                        "component_name": bus_obj["name"],
                        "category": "mass_limit",
                        "reason": f"Spacecraft dry mass ({dry:.0f} kg) exceeds {bus_obj['name']} structural limit ({bus_obj['max_dry']} kg).",
                        "mission_requires": f"Bus with max_dry >= {dry:.0f} kg (or lighter payload/propellant tanks)",
                        "component_provides": f"{bus_obj['name']} max_dry: {bus_obj['max_dry']} kg",
                    })

        mentioned_items = cls._inspect_mentioned_catalog_items(question, collected)

        return {
            "active_mismatches": mismatches,
            "mentioned_catalog_items": mentioned_items,
        }

    @classmethod
    def _inspect_mentioned_catalog_items(cls, question: str, collected: dict[str, Any]) -> list[dict[str, Any]]:
        if not question:
            return []
        q_low = question.lower()
        sc = collected["scenario"]
        dest_key = collected["dest_key"]
        dest = collected["destination"]
        d = collected["design"]
        is_surface_dest = bool(dest.get("surface", False))
        blind_set = set(dest.get("blind", []))
        req_tags = {g["tag"] for g in sc.get("goals", []) if g.get("required")}
        all_tags = {g["tag"] for g in sc.get("goals", [])}

        found: list[dict[str, Any]] = []

        # Check instruments by id or name tokens
        for iid, inst in C.INSTRUMENTS.items():
            name_low = inst["name"].lower()
            distinct_words = [
                w for w in re.split(r"[^a-z0-9]+", name_low)
                if len(w) >= 4 and w not in ("high", "unit", "suite", "package", "analyzer", "sensor", "imager", "camera", "sounder", "probe")
            ]
            matched = (
                re.search(rf"\b{re.escape(iid)}\b", q_low)
                or name_low in q_low
                or any(re.search(rf"\b{re.escape(w)}\b", q_low) for w in distinct_words)
            )
            if not matched:
                continue

            inst_tags = set(inst.get("tags", []))
            where = inst.get("where", "any")
            suitability_issues = []
            if where == "orbit" and is_surface_dest:
                suitability_issues.append(f"Orbital-only instrument (`where: 'orbit'`), incompatible with surface mission {sc['name']} at {dest['name']}.")
            if where == "surface" and not is_surface_dest:
                suitability_issues.append(f"Surface-only instrument (`where: 'surface'`), incompatible with orbital mission {sc['name']}.")
            if iid in blind_set:
                suitability_issues.append(f"Blocked by {dest['name']}'s atmosphere: {dest.get('blind_why', 'opaque clouds block view')}.")
            if not (inst_tags & all_tags):
                suitability_issues.append(
                    f"Provides science tags {sorted(inst_tags)}, which do not match {sc['name']}'s mission goals {sorted(all_tags)} (required: {sorted(req_tags)})."
                )

            alternatives = []
            for alt_id, alt in C.INSTRUMENTS.items():
                if alt_id == iid:
                    continue
                alt_tags = set(alt.get("tags", []))
                if not (alt_tags & req_tags):
                    continue
                alt_where = alt.get("where", "any")
                if alt_where == "orbit" and is_surface_dest:
                    continue
                if alt_where == "surface" and not is_surface_dest:
                    continue
                if alt_id in blind_set:
                    continue
                alternatives.append(
                    f"{alt['name']} ({alt_id}: tags={alt['tags']}, {alt['mass']} kg, {alt['power']} W, ${alt['cost']}M, pointing<={alt['pointing_deg']}°)"
                )

            found.append({
                "catalog_type": "instrument",
                "id": iid,
                "name": inst["name"],
                "currently_selected": iid in d.get("instruments", []),
                "specs": {
                    "mass_kg": inst["mass"],
                    "power_w": inst["power"],
                    "data_mbps": inst["data_mbps"],
                    "cost_m": inst["cost"],
                    "req_pointing_deg": inst["pointing_deg"],
                    "tags": inst["tags"],
                    "where": where,
                },
                "suitable_for_mission": len(suitability_issues) == 0,
                "suitability_issues": suitability_issues,
                "mission_alternatives": alternatives[:4],
                "desc": inst.get("blurb", inst.get("desc", "")),
            })

        # Also check subsystems mentioned by name/id
        subsystem_catalogs = [
            ("bus", C.BUSES),
            ("solar_array", C.SOLAR_ARRAYS),
            ("battery", C.BATTERIES),
            ("adcs", C.ADCS),
            ("propulsion", C.PROPULSION),
            ("edl", C.EDL),
            ("comms", C.COMMS),
            ("ground_station", C.GROUND),
            ("computer", C.COMPUTERS),
            ("launch_vehicle", C.LAUNCH_VEHICLES),
            ("orbit", C.ORBITS.get(dest_key, {})),
        ]
        for cat_name, cat_dict in subsystem_catalogs:
            for cid, item in cat_dict.items():
                if cid == "none" or not isinstance(item, dict):
                    continue
                name_low = item.get("name", "").lower()
                if re.search(rf"\b{re.escape(cid)}\b", q_low) or (len(name_low) >= 5 and name_low in q_low):
                    found.append({
                        "catalog_type": cat_name,
                        "id": cid,
                        "name": item.get("name"),
                        "specs": {k: v for k, v in item.items() if k not in ("name", "desc")},
                        "desc": item.get("desc", ""),
                    })

        return found[:8]


# ---------------------------------------------------------------------------
# 5. ENGINEERING CONSTRAINT ANALYZER
# ---------------------------------------------------------------------------

class EngineeringConstraintAnalyzer:
    """Categorizes validation issues and computes concrete, budget-aware engineering upgrades."""

    @classmethod
    def analyze(cls, collected: dict[str, Any], normalized: dict[str, Any]) -> dict[str, Any]:
        ev = collected["evaluation"]
        d = collected["design"]
        sc = collected["scenario"]
        dest = collected["destination"]
        issues = ev.get("issues", [])

        critical_blockers = []
        missing_components = []
        objective_mismatches = []
        budget_problems = []
        engineering_warnings = []

        for iss in issues:
            sev = iss.get("severity", "info")
            area = iss.get("area", "")
            text = iss.get("text", "")
            why = iss.get("why", "")
            field = iss.get("field", "")

            entry = {
                "severity": sev,
                "area": area,
                "text": text,
                "why": why,
                "field": field,
            }

            if area == "missing":
                missing_components.append(entry)
            if area == "science":
                objective_mismatches.append(entry)
            if area == "cost":
                budget_problems.append(entry)

            if sev == "blocker":
                critical_blockers.append(entry)
            elif sev == "warning":
                engineering_warnings.append(entry)

        upgrades = cls._compute_upgrade_options(d, ev, sc, dest)

        return {
            "launch_readiness": {
                "approved": bool(ev.get("ok", False)),
                "status_label": "APPROVED FOR LAUNCH" if ev.get("ok") else "LAUNCH HOLD — CRITICAL BLOCKERS PRESENT",
                "blocker_count": len(critical_blockers),
                "warning_count": len(engineering_warnings),
            },
            "critical_blockers": critical_blockers,
            "missing_components": missing_components,
            "mission_objective_mismatches": objective_mismatches,
            "budget_problems": budget_problems,
            "engineering_warnings": engineering_warnings,
            "upgrade_recommendations": upgrades,
        }

    @staticmethod
    def _compute_upgrade_options(d: dict[str, Any], ev: dict[str, Any], sc: dict[str, Any], dest: dict[str, Any]) -> list[dict[str, Any]]:
        kind = ev.get("kind", sc.get("kind", "orbiter"))
        if kind in ("program", "vehicle"):
            return []

        recs: list[dict[str, Any]] = []
        cost_obj = ev.get("cost", {})
        cost_margin = cost_obj.get("budget", 0) - cost_obj.get("total", 0)
        power = ev.get("power", {})
        mass = ev.get("mass", {})
        au = max(0.2, dest.get("sun_au", 1.0))
        solar_factor = 1.0 / (au ** 2)

        # 1. Power deficit or low margin upgrade options
        gen_w = power.get("generation", 0)
        load_w = power.get("load", 0)
        p_margin_ratio = power.get("margin", 0)
        if gen_w < load_w or p_margin_ratio < 0.2:
            cur_solar = C.SOLAR_ARRAYS.get(d.get("solar") or "none", C.SOLAR_ARRAYS["none"])
            for sid, s_item in C.SOLAR_ARRAYS.items():
                if s_item["power_1au"] <= cur_solar["power_1au"]:
                    continue
                gain_w = round((s_item["power_1au"] - cur_solar["power_1au"]) * solar_factor, 1)
                if gain_w <= 0:
                    continue
                delta_cost = s_item["cost"] - cur_solar["cost"]
                delta_mass = s_item["mass"] - cur_solar["mass"]
                recs.append({
                    "subsystem": "solar",
                    "option_id": sid,
                    "option_name": s_item["name"],
                    "benefit": f"+{gain_w} W sunlit output at {dest['name']} ({au:g} AU)",
                    "delta_cost_m": delta_cost,
                    "delta_mass_kg": delta_mass,
                    "fits_remaining_budget": delta_cost <= cost_margin,
                })
            if au >= 1.4 and int(d.get("rtg") or 0) < C.RTG["max"]:
                next_rtg = int(d.get("rtg") or 0) + 1
                delta_cost = C.RTG["cost"]
                delta_mass = C.RTG["mass"]
                recs.append({
                    "subsystem": "rtg",
                    "option_id": f"rtg_{next_rtg}",
                    "option_name": f"Add 1x {C.RTG['name']} (Total {next_rtg})",
                    "benefit": f"+{C.RTG['power']} W continuous nuclear power + {C.RTG['waste_heat_w']} W heater savings at {au:g} AU",
                    "delta_cost_m": delta_cost,
                    "delta_mass_kg": delta_mass,
                    "fits_remaining_budget": delta_cost <= cost_margin,
                })

        # 2. Battery deficit in eclipse
        bat_usable = power.get("battery_usable_wh", 0)
        ec_need = power.get("eclipse_need_wh", 0)
        if ec_need > bat_usable * 0.9 and ec_need > 0:
            cur_bat = C.BATTERIES.get(d.get("battery") or "", {"wh": 0, "cost": 0, "mass": 0})
            for bid, b_item in C.BATTERIES.items():
                if b_item["wh"] <= cur_bat.get("wh", 0):
                    continue
                usable_wh = round(b_item["wh"] * C.BATTERY_DOD, 1)
                delta_cost = b_item["cost"] - cur_bat.get("cost", 0)
                delta_mass = b_item["mass"] - cur_bat.get("mass", 0)
                recs.append({
                    "subsystem": "battery",
                    "option_id": bid,
                    "option_name": b_item["name"],
                    "benefit": f"{usable_wh} Wh usable capacity vs {round(ec_need, 1)} Wh eclipse demand",
                    "delta_cost_m": delta_cost,
                    "delta_mass_kg": delta_mass,
                    "fits_remaining_budget": delta_cost <= cost_margin,
                })

        # 3. Propulsion upgrade if delta-v or propellant issue
        prop_issues = [i for i in ev.get("issues", []) if i.get("area") == "propulsion"]
        if prop_issues:
            cur_prop = C.PROPULSION.get(d.get("propulsion") or "none", C.PROPULSION["none"])
            for pid, p_item in C.PROPULSION.items():
                if pid == "none" or p_item["isp"] <= cur_prop.get("isp", 0):
                    continue
                delta_cost = p_item["cost"] - cur_prop.get("cost", 0)
                recs.append({
                    "subsystem": "propulsion",
                    "option_id": pid,
                    "option_name": p_item["name"],
                    "benefit": f"Higher efficiency Isp {p_item['isp']} s for required {round(mass.get('dv', 0))} m/s delta-v",
                    "delta_cost_m": delta_cost,
                    "delta_mass_kg": p_item["mass"] - cur_prop.get("mass", 0),
                    "fits_remaining_budget": delta_cost <= cost_margin,
                })

        # 4. Launch vehicle capacity upgrade
        wet = mass.get("wet", 0)
        cap = mass.get("capacity", 0)
        if (not math.isfinite(wet) or wet > cap or cap == 0) and d.get("orbit"):
            lv_target = ev.get("orbit_info", {}).get("lv_target", "leo")
            cur_lv = C.LAUNCH_VEHICLES.get(d.get("launch_vehicle") or "", {"cost": 0})
            for lvid, lv_item in C.LAUNCH_VEHICLES.items():
                target_cap = lv_item["capacity"].get(lv_target, 0)
                if target_cap <= cap or (math.isfinite(wet) and target_cap < wet):
                    continue
                delta_cost = lv_item["cost"] - cur_lv.get("cost", 0)
                recs.append({
                    "subsystem": "launch_vehicle",
                    "option_id": lvid,
                    "option_name": lv_item["name"],
                    "benefit": f"Lifts up to {target_cap} kg to {C.LV_TARGET_LABEL.get(lv_target, lv_target)}",
                    "delta_cost_m": delta_cost,
                    "delta_mass_kg": 0,
                    "fits_remaining_budget": delta_cost <= cost_margin,
                })

        # 5. Budget overrun mitigation via International Partners or Cheaper Launch Vehicle (prioritized when over budget)
        if cost_margin < 0:
            selected_partners = set(d.get("partners", []))
            partner_recs = []
            for pid, p_item in C.PARTNERS.items():
                if pid not in selected_partners:
                    partner_recs.append({
                        "subsystem": "partners",
                        "option_id": pid,
                        "option_name": p_item["name"],
                        "benefit": f"Partner agency covers {int(p_item['share']*100)}% of spacecraft hardware cost and contributes a bonus instrument/tracking",
                        "delta_cost_m": -round(cost_obj.get("total", 100) * p_item["share"], 1),
                        "delta_mass_kg": 0,
                        "fits_remaining_budget": True,
                    })
            recs = partner_recs[:2] + recs

        return recs[:8]


# ---------------------------------------------------------------------------
# 6. SIMULATION RESULT INTERPRETER
# ---------------------------------------------------------------------------

class SimulationResultInterpreter:
    """Interprets post-launch simulation events, timeline telemetry, and failure root causes."""

    @staticmethod
    def interpret(collected: dict[str, Any]) -> dict[str, Any]:
        sim = collected.get("client_sim")
        if not sim or not isinstance(sim, dict):
            return {
                "available": False,
                "status": "not_run_yet",
                "summary": "Simulation has not been executed for this design yet. Complete pre-flight validation and press Approve & Launch to simulate mission operations.",
            }

        sim_data = sim.get("sim", sim) if isinstance(sim.get("sim"), dict) else sim
        score_data = sim.get("score", {}) if isinstance(sim.get("score"), dict) else {}

        launched = bool(sim_data.get("launched", False))
        outcome = str(sim_data.get("outcome", "unknown"))
        events = sim_data.get("events", [])
        timeline = sim_data.get("timeline", [])
        months_survived = sim_data.get("months_survived", 0)
        months_planned = sim_data.get("months_planned", 0)

        fatal_events = [e for e in events if e.get("impact") == "fatal"]
        bad_events = [e for e in events if e.get("impact") == "bad"]

        failed_month = None
        failed_stage = "None (Nominal Operations)"
        failed_subsystem = "none"
        root_cause = "Spacecraft completed its planned timeline without fatal mission loss."
        design_fixes: list[str] = []

        primary_event = fatal_events[0] if fatal_events else (bad_events[0] if bad_events else None)
        if not launched or outcome == "not_launched":
            failed_stage = "Pre-Launch Design Review (T-0)"
            failed_subsystem = "validation_blockers"
            root_cause = "Spacecraft was rejected at pre-launch review due to unresolved critical engineering blockers."
            design_fixes.append("Resolve all red Critical Blockers on the Review Sheet before launching.")
        elif primary_event:
            failed_month = primary_event.get("month", primary_event.get("t", 0))
            ev_kind = primary_event.get("kind", "")
            text = primary_event.get("text", primary_event.get("title", ""))
            why = primary_event.get("why", primary_event.get("detail", ""))
            txt_low = f"{ev_kind} {text} {why}".lower()

            if ev_kind == "launch_failure" or (failed_month == 0 and "launch" in txt_low):
                failed_stage = "Stage 1 — Launch & Ascent (Month 0)"
                failed_subsystem = "launch_vehicle"
                root_cause = f"{text} ({why})"
                design_fixes.append("Avoid rushed launch windows (`risk_mult`) so full pre-launch integration testing is completed.")
            elif ev_kind == "insertion_failure" or "insertion" in txt_low or "propellant" in txt_low or "delta-v" in txt_low:
                failed_stage = f"Stage 2 — Orbit Insertion Burn (Month {failed_month})"
                failed_subsystem = "propulsion"
                root_cause = f"{text} ({why})"
                design_fixes.append("Ensure adequate propulsion Isp, un-rushed launch window testing, and positive delta-v margin.")
            elif ev_kind in ("landing_failure", "capsule") or "touchdown" in txt_low or "lander" in txt_low or "parachute" in txt_low:
                failed_stage = f"Stage 3 — Entry, Descent & Landing (Month {failed_month})"
                failed_subsystem = "edl"
                root_cause = f"{text} ({why})"
                design_fixes.append("Upgrade the landing system (e.g., Sky Crane or Hazard-Avoidance Lander) or choose a safer landing site orbit.")
            elif ev_kind in ("battery", "power", "solar_storm") or "eclipse" in txt_low or "battery" in txt_low:
                failed_stage = f"Stage 4 — Orbital Power & Eclipse Operations (Month {failed_month})"
                failed_subsystem = "power_and_battery"
                root_cause = f"{text} ({why})"
                design_fixes.append("Select a higher-capacity battery (`wh`) to absorb 3%/year cell fade during eclipses, and keep >= 25% power margin.")
            elif ev_kind == "wheel" or "wheel" in txt_low or "pointing" in txt_low:
                failed_stage = f"Stage 4 — Attitude Control & Pointing (Month {failed_month})"
                failed_subsystem = "adcs"
                root_cause = f"{text} ({why})"
                design_fixes.append("Upgrade ADCS to Star Tracker + Fine Wheels (`precision`) or use the Flagship Bus (`flagship`) so a spare 4th reaction wheel is carried.")
            elif ev_kind in ("radiation", "radiation_reset") or "radiation" in txt_low:
                failed_stage = f"Stage 4 — Radiation Environment & Avionics (Month {failed_month})"
                failed_subsystem = "computer_radiation"
                root_cause = f"{text} ({why})"
                design_fixes.append("Upgrade to the RAD750 radiation-hardened computer (`rad750`) and/or a heavier shielded spacecraft bus.")
            elif ev_kind in ("budget_cut", "slip") or "reserve" in txt_low:
                failed_stage = f"Program Operations & Budget Reserve (Month {failed_month})"
                failed_subsystem = "budget_reserve"
                root_cause = f"{text} ({why})"
                design_fixes.append("Keep at least 15–20% unspent budget reserve and avoid rushed launch windows or excessive partner delay risk.")
            else:
                failed_stage = f"Mission Operations (Month {failed_month})"
                failed_subsystem = ev_kind or "general_systems"
                root_cause = f"{text} ({why})"
                design_fixes.append("Increase subsystem margins across power, radiation shielding, and budget reserve.")

        telemetry_summary: dict[str, Any] = {}
        if timeline:
            first_pt = timeline[0]
            last_pt = timeline[-1]
            min_power_margin = min((pt.get("power_margin", 0.0) for pt in timeline), default=0.0)
            min_bat = min((pt.get("battery_pct", pt.get("battery", 1.0)) for pt in timeline), default=1.0)
            telemetry_summary = {
                "initial_power_margin_pct": round(first_pt.get("power_margin", 0.0) * 100, 1),
                "minimum_power_margin_pct": round(min_power_margin * 100, 1),
                "final_power_margin_pct": round(last_pt.get("power_margin", 0.0) * 100, 1),
                "minimum_battery_health_pct": round(min_bat * 100, 1),
                "final_battery_health_pct": round(last_pt.get("battery_pct", last_pt.get("battery", 0.0)) * 100, 1),
                "final_fuel_pct": round((last_pt.get("fuel_pct") or 0.0) * 100, 1) if last_pt.get("fuel_pct") is not None else "not_applicable",
                "final_reserve_m": round(last_pt.get("reserve", 0.0), 1),
                "total_data_downlinked_gb": round(last_pt.get("data_gb", 0.0), 1),
            }

        return {
            "available": True,
            "launched": launched,
            "outcome": outcome,
            "months_survived": months_survived,
            "months_planned": months_planned,
            "science_fraction_pct": round(sim_data.get("science_fraction", 0.0) * 100, 1),
            "science_score": round(sim_data.get("science_score", 0.0), 1),
            "total_score": score_data.get("total", "unavailable"),
            "grade": score_data.get("grade", "unavailable"),
            "wheel_failures": sim_data.get("wheel_failures", 0),
            "launch_delay_months": sim_data.get("launch_delay", 0),
            "failed_month": failed_month,
            "failed_stage": failed_stage,
            "failed_subsystem": failed_subsystem,
            "root_cause": root_cause,
            "recommended_design_fixes": design_fixes,
            "fatal_events": fatal_events,
            "degradation_events": bad_events,
            "all_events": events[:12],
            "telemetry_indicators": telemetry_summary,
        }


# ---------------------------------------------------------------------------
# 7. MISSION CONTEXT BUILDER
# ---------------------------------------------------------------------------

class MissionContextBuilder:
    """Builds the unified, authoritative engineering context for every AI Mentor request."""

    @staticmethod
    def build(raw_design: dict[str, Any] | None, client_sim: dict[str, Any] | None = None, question: str = "") -> dict[str, Any]:
        collected = SpacecraftStateCollector.collect(raw_design, client_sim)
        normalized = EngineeringDataNormalizer.normalize_data(collected)
        objectives = MissionObjectiveAnalyzer.analyze(collected, normalized)
        compatibility = ComponentCompatibilityAnalyzer.analyze(collected, question)
        constraints = EngineeringConstraintAnalyzer.analyze(collected, normalized)
        simulation = SimulationResultInterpreter.interpret(collected)

        return {
            "mission": normalized["mission"],
            "spacecraft": normalized["spacecraft"],
            "calculations": normalized["calculations"],
            "objectives": objectives,
            "compatibility": compatibility,
            "validation": constraints,
            "simulation": simulation,
            "_raw_design": collected["design"],
            "_raw_eval": collected["evaluation"],
        }


# ---------------------------------------------------------------------------
# 8. CONVERSATION CONTEXT MANAGER
# ---------------------------------------------------------------------------

class ConversationContextManager:
    """Manages mission-scoped conversation history and detects configuration changes between turns."""

    def __init__(self) -> None:
        self._store: dict[str, dict[str, Any]] = {}

    def get_or_create(self, conversation_id: str | None, mission_id: str) -> tuple[str, dict[str, Any]]:
        cid = (conversation_id or "").strip() or f"mentor-{uuid.uuid4().hex[:12]}"
        if len(self._store) > MAX_CONVERSATIONS and cid not in self._store:
            oldest_key = min(self._store.keys(), key=lambda k: self._store[k].get("updated_at", 0))
            self._store.pop(oldest_key, None)

        session = self._store.get(cid)
        if not session or session.get("mission_id") != mission_id:
            session = {
                "conversation_id": cid,
                "mission_id": mission_id,
                "messages": [],
                "last_snapshot": None,
                "updated_at": time.time(),
            }
            self._store[cid] = session
        return cid, session

    @staticmethod
    def compute_config_delta(prev_snap: dict[str, Any] | None, cur_ctx: dict[str, Any]) -> list[str]:
        if not prev_snap:
            return []
        deltas: list[str] = []
        prev_d = prev_snap.get("design", {})
        cur_d = cur_ctx.get("_raw_design", {})

        watched_fields = [
            ("orbit", "Orbit"),
            ("launch_vehicle", "Launch Vehicle"),
            ("bus", "Spacecraft Bus"),
            ("solar", "Solar Array"),
            ("rtg", "RTG Count"),
            ("battery", "Battery"),
            ("adcs", "Attitude Control (ADCS)"),
            ("propulsion", "Propulsion"),
            ("edl", "EDL System"),
            ("comms", "Communications"),
            ("ground", "Ground Station"),
            ("computer", "Flight Computer"),
            ("window", "Launch Window"),
        ]
        for key, label in watched_fields:
            if prev_d.get(key) != cur_d.get(key):
                deltas.append(f"{label} changed from '{prev_d.get(key)}' to '{cur_d.get(key)}'")

        prev_inst = set(prev_d.get("instruments", []))
        cur_inst = set(cur_d.get("instruments", []))
        if prev_inst != cur_inst:
            added = sorted(cur_inst - prev_inst)
            removed = sorted(prev_inst - cur_inst)
            if added:
                deltas.append(f"Added instruments: {', '.join(added)}")
            if removed:
                deltas.append(f"Removed instruments: {', '.join(removed)}")

        prev_sim = prev_snap.get("sim_outcome")
        cur_sim = cur_ctx.get("simulation", {}).get("outcome") if cur_ctx.get("simulation", {}).get("available") else None
        if prev_sim != cur_sim and cur_sim:
            deltas.append(f"New simulation result recorded: {cur_sim}")

        return deltas

    def record_turn(
        self,
        conversation_id: str,
        mission_id: str,
        user_question: str,
        assistant_answer: str,
        cur_ctx: dict[str, Any],
    ) -> None:
        _, session = self.get_or_create(conversation_id, mission_id)
        session["messages"].append({"role": "user", "content": user_question})
        session["messages"].append({"role": "assistant", "content": assistant_answer})
        if len(session["messages"]) > MAX_HISTORY_TURNS * 2:
            session["messages"] = session["messages"][-(MAX_HISTORY_TURNS * 2):]
        session["last_snapshot"] = {
            "design": dict(cur_ctx.get("_raw_design", {})),
            "sim_outcome": cur_ctx.get("simulation", {}).get("outcome") if cur_ctx.get("simulation", {}).get("available") else None,
        }
        session["updated_at"] = time.time()


CONVERSATION_MANAGER = ConversationContextManager()


def resolve_friendly_name(raw_name: Any) -> str:
    """Resolves the player's friendly callsign/name or defaults to warm 'bro/sis'."""
    if not isinstance(raw_name, str):
        return "bro/sis"
    cleaned = raw_name.strip()
    if not cleaned or cleaned.lower() in ("engineer", "tester", "guest", "player", "anonymous", "lead", "none", "null"):
        return "bro/sis"
    return cleaned[:32]


# ---------------------------------------------------------------------------
# 9. GROQ AI SERVICE & DETERMINISTIC FALLBACK SYNTHESIZER
# ---------------------------------------------------------------------------

class GroqAIService:
    """Handles Groq API calls with model fallback and deterministic engineering fallback."""

    SYSTEM_PROMPT = """You are CHIEF ENGINEER VERA LIN, a warm, friendly, and encouraging AI Mission Engineering Mentor inside COSMO QUEST (by Team Turbobits).
Speak like a supportive older sister or best lab partner sitting right next to the user at the spacecraft engineering desk!

WARM TONE, PERSONAL GREETING & SIMPLE EXPLANATION RULES:
1. GREET BY NAME OR 'BRO / SIS': Check `user_name` in `LIVE MISSION_ENGINEERING_CONTEXT`. If `user_name` is a real name (like "Kavita" or "Aarav"), greet and address them warmly by name (e.g., "Hey Kavita!"). If `user_name` is `"bro/sis"`, address them warmly as "bro/sis" (or "brother/sis", e.g., "Hey bro/sis! Don't worry, let's fix this together!").
2. EXPLAIN SIMPLY FIRST (NO JARGON OVERLOAD): Always start with a super clear, simple, everyday explanation ("In simple words...") using easy analogies (like comparing a spacecraft bus to a backpack, solar panels + batteries to a phone charger + power bank in the dark, delta-v to fuel in the tank for braking into orbit, or pointing accuracy to holding a camera steady for a zoom shot) BEFORE diving into the engineering numbers.
3. GROUND IN ACTUAL DATA ONLY: Cite the exact numbers and units (kg, W, Wh, m/s, deg, Gb/day, $M) from `MISSION_ENGINEERING_CONTEXT` (`calculations`, `spacecraft`, `objectives`, `compatibility`, `validation`, and `simulation`). Never invent component specs. If a subsystem is `"unavailable"` or `"not_selected"`, kindly tell them they haven't picked that part yet.
4. INCLUDE CLICKABLE QUICK LINKS: Whenever you suggest checking or changing a subsystem tab or opening a guide, include inline clickable quick links using this exact tag format:
   - `[[tab:launch|Open Launch Tab →]]`
   - `[[tab:orbit|Open Orbit Tab →]]`
   - `[[tab:bus|Open Bus Tab →]]`
   - `[[tab:power|Open Power & Battery Tab →]]`
   - `[[tab:adcs|Open Pointing (ADCS) Tab →]]`
   - `[[tab:prop|Open Propulsion Tab →]]`
   - `[[tab:edl|Open Landing (EDL) Tab →]]`
   - `[[tab:comms|Open Comms Tab →]]`
   - `[[tab:computer|Open Computer Tab →]]`
   - `[[tab:instr|Open Instruments Tab →]]`
   - `[[tab:partners|Open Partners Tab →]]`
   - `[[modal:briefing|Open Mission Briefing →]]`
   - `[[modal:handbook|Open Engineer's Handbook →]]`
5. DISTINGUISH CLEARLY BETWEEN:
   - [CRITICAL BLOCKER] (prevents launch) vs [WARNING] (can launch, but risky)
   - [CALCULATED TELEMETRY] vs [MISSION REQUIREMENTS] vs [MENTOR RECOMMENDATION] vs [AEROSPACE CONCEPT]
6. USER AGENCY & COMPACT FORMAT: Never claim you automatically changed their design. Keep answers friendly, encouraging, scannable with short `###` headings and `-` bullets, and under 270 words."""

    @classmethod
    def generate_response(
        cls,
        question: str,
        context: dict[str, Any],
        history: list[dict[str, str]],
        config_deltas: list[str],
        action_type: str = "chat",
        active_tab: str = "",
        user_name: str = "bro/sis",
    ) -> dict[str, Any]:
        api_key, configured_model = get_groq_config()
        friendly_name = resolve_friendly_name(user_name)

        matched_concepts = cls._match_concepts(question, context)
        deterministic_sections = cls._build_structured_sections(question, context, matched_concepts, config_deltas)

        if not api_key:
            fallback_answer = cls._synthesize_deterministic_answer(
                question, context, matched_concepts, config_deltas, deterministic_sections, friendly_name
            )
            return {
                "answer": fallback_answer,
                "sections": deterministic_sections,
                "model": configured_model,
                "source": "deterministic_fallback",
                "fallback_reason": "GROQ_API_KEY not configured in environment; using deterministic engineering mentor engine.",
            }

        prompt_context = {
            "user_name": friendly_name,
            "active_workbench_tab": active_tab or "overview",
            "mission": context["mission"],
            "spacecraft": context["spacecraft"],
            "calculations": context["calculations"],
            "objectives": context["objectives"],
            "compatibility": context["compatibility"],
            "validation": context["validation"],
            "simulation": context["simulation"],
            "recent_configuration_changes": config_deltas,
            "relevant_aerospace_concepts": matched_concepts,
            "action_type": action_type,
        }

        messages: list[dict[str, str]] = [
            {"role": "system", "content": cls.SYSTEM_PROMPT},
            {
                "role": "system",
                "content": "LIVE MISSION_ENGINEERING_CONTEXT JSON:\n" + json.dumps(prompt_context, ensure_ascii=False),
            },
        ]
        for msg in history[-6:]:
            if msg.get("role") in ("user", "assistant") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({
            "role": "user",
            "content": f"[User ({friendly_name}) asks]: {question}\n(Remember: Greet {friendly_name} warmly, explain simply in plain English first, cite exact live telemetry numbers, and include 1-3 inline [[tab:...|...]] quick links!)",
        })

        model_chain = [configured_model] + [m for m in FALLBACK_GROQ_MODELS if m != configured_model]
        last_error = ""

        for candidate_model in model_chain:
            try:
                answer_text = cls._call_groq_api(api_key, candidate_model, messages)
                if answer_text:
                    return {
                        "answer": answer_text,
                        "sections": deterministic_sections,
                        "model": candidate_model,
                        "source": "groq",
                        "fallback_reason": None,
                    }
            except Exception as exc:
                safe_err = str(exc).replace(api_key, "[REDACTED]")
                last_error = f"{candidate_model}: {safe_err}"
                continue

        fallback_answer = cls._synthesize_deterministic_answer(
            question, context, matched_concepts, config_deltas, deterministic_sections, friendly_name
        )
        return {
            "answer": fallback_answer,
            "sections": deterministic_sections,
            "model": configured_model,
            "source": "deterministic_fallback",
            "fallback_reason": f"Groq API temporarily unavailable ({last_error or 'network/rate-limit'}); served verified deterministic engineering analysis.",
        }

    @staticmethod
    def _call_groq_api(api_key: str, model: str, messages: list[dict[str, str]], timeout: float = 14.0) -> str:
        payload = json.dumps({
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 950,
            "top_p": 0.9,
        }).encode("utf-8")

        req = urllib.request.Request(
            GROQ_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "CosmoQuest-MissionEngineeringMentor/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            choices = data.get("choices", [])
            if not choices:
                raise RuntimeError("Empty choices from Groq API")
            content = choices[0].get("message", {}).get("content", "").strip()
            if not content:
                raise RuntimeError("Empty message content from Groq API")
            return content

    @staticmethod
    def _match_concepts(question: str, context: dict[str, Any]) -> list[dict[str, str]]:
        q_low = (question or "").lower()
        matched: list[dict[str, str]] = []

        for cid, cdata in AEROSPACE_CONCEPTS.items():
            if any(kw in q_low for kw in cdata["keywords"]):
                matched.append({
                    "id": cid,
                    "title": cdata["title"],
                    "simple": cdata["simple"],
                    "technical": cdata["technical"],
                })

        if not matched:
            val = context.get("validation", {})
            blockers_text = " ".join(b.get("text", "") + " " + b.get("area", "") for b in val.get("critical_blockers", [])).lower()
            if "power" in blockers_text or "battery" in blockers_text or "eclipse" in blockers_text:
                c = AEROSPACE_CONCEPTS["power_and_eclipse"]
                matched.append({"id": "power_and_eclipse", "title": c["title"], "simple": c["simple"], "technical": c["technical"]})
            if "propulsion" in blockers_text or "cold gas" in blockers_text:
                c = AEROSPACE_CONCEPTS["delta_v"]
                matched.append({"id": "delta_v", "title": c["title"], "simple": c["simple"], "technical": c["technical"]})
            if "pointing" in blockers_text or "adcs" in blockers_text or "magnetorquer" in blockers_text:
                c = AEROSPACE_CONCEPTS["reaction_wheels"]
                matched.append({"id": "reaction_wheels", "title": c["title"], "simple": c["simple"], "technical": c["technical"]})
            if not matched:
                m_type = context.get("mission", {}).get("mission_type", "orbiter")
                key = "orbiter_vs_lander" if m_type in ("lander", "rover", "sample_return") else "orbital_altitude"
                c = AEROSPACE_CONCEPTS[key]
                matched.append({"id": key, "title": c["title"], "simple": c["simple"], "technical": c["technical"]})

        return matched[:2]

    @staticmethod
    def _build_structured_sections(
        question: str,
        context: dict[str, Any],
        matched_concepts: list[dict[str, str]],
        config_deltas: list[str],
    ) -> dict[str, Any]:
        m = context["mission"]
        calc = context["calculations"]
        val = context["validation"]
        obj = context["objectives"]
        sim = context["simulation"]

        mass = calc.get("mass", {})
        power = calc.get("power", {})
        cost = calc.get("cost", {})

        calculated_values = {
            "dry_mass_kg": mass.get("dry_mass_kg", "unavailable"),
            "launch_mass_kg": mass.get("launch_mass_kg", "unavailable"),
            "launch_capacity_kg": mass.get("launch_vehicle_capacity_kg", "unavailable"),
            "delta_v_required_ms": mass.get("delta_v_required_ms", "unavailable"),
            "power_generated_w": power.get("total_generated_w", "unavailable"),
            "power_consumed_w": power.get("total_consumed_w", "unavailable"),
            "power_margin_w": power.get("power_margin_w", "unavailable"),
            "battery_usable_wh": power.get("battery_usable_wh", "unavailable"),
            "eclipse_need_wh": power.get("eclipse_energy_required_wh", "unavailable"),
            "total_cost_m": cost.get("total_cost_m", "unavailable"),
            "budget_limit_m": cost.get("budget_limit_m", m.get("budget_limit_m", "unavailable")),
            "remaining_budget_m": cost.get("remaining_budget_m", "unavailable"),
            "science_coverage_pct": obj.get("overall_science_coverage_pct", 0.0),
        }

        mission_requirements = {
            "mission_name": m.get("mission_name"),
            "destination": m.get("destination_name"),
            "mission_type": m.get("mission_type"),
            "required_science_tags": m.get("required_science_tags", []),
            "unmet_required_tags": [g["tag"] for g in obj.get("unmet_required_objectives", [])],
            "budget_limit_m": m.get("budget_limit_m"),
            "sun_distance_au": m.get("environmental_constraints", {}).get("sun_distance_au", 1.0),
        }

        recommendations = [
            f"{u['option_name']} ({u['subsystem']}): {u['benefit']} [Delta Cost: {'+' if u['delta_cost_m'] >= 0 else ''}${u['delta_cost_m']}M]"
            for u in val.get("upgrade_recommendations", [])[:4]
        ]
        for inst in obj.get("recommended_instruments_for_gaps", [])[:3]:
            recommendations.append(
                f"Add {inst['name']} (`{inst['id']}`) to cover required `{inst['satisfies_tag']}` objective "
                f"({inst['mass_kg']} kg, {inst['power_w']} W, ${inst['cost_m']}M, req pointing <= {inst['req_pointing_deg']}°)."
            )
        if sim.get("available") and sim.get("recommended_design_fixes"):
            for fix in sim["recommended_design_fixes"]:
                if fix not in recommendations:
                    recommendations.insert(0, fix)

        return {
            "calculated_values": calculated_values,
            "mission_requirements": mission_requirements,
            "recommendations": recommendations[:6],
            "concept_explanation": matched_concepts[0] if matched_concepts else None,
            "config_deltas": config_deltas,
        }

    @classmethod
    def _synthesize_deterministic_answer(
        cls,
        question: str,
        context: dict[str, Any],
        matched_concepts: list[dict[str, str]],
        config_deltas: list[str],
        sections: dict[str, Any],
        friendly_name: str = "bro/sis",
    ) -> str:
        """Synthesizes a warm, friendly, simple-first engineering mentor response directly from verified telemetry."""
        q_low = (question or "").lower()
        m = context["mission"]
        sc_cfg = context["spacecraft"]
        calc = context["calculations"]
        obj = context["objectives"]
        compat = context["compatibility"]
        val = context["validation"]
        sim = context["simulation"]

        lines: list[str] = []
        lines.append(f"### HEY {friendly_name.upper()}! LET'S BREAK THIS DOWN SIMPLY — {m['mission_name'].upper()} ({m['destination_name']})")

        if config_deltas:
            lines.append("**Nice work updating the board:** " + "; ".join(config_deltas))

        # Friendly, plain-English simple summary first
        blockers = val.get("critical_blockers", [])
        warnings = val.get("engineering_warnings", [])
        if blockers:
            top_b = blockers[0]
            lines.append(
                f"- **In Simple Words:** Right now, {friendly_name}, our spacecraft has **{len(blockers)} critical blocker(s)** stopping us from launching. "
                f"The biggest thing to fix first is **{top_b['text']}** ({top_b['why']}). Let's tackle it step by step!"
            )
        else:
            lines.append(
                f"- **In Simple Words:** Awesome job, {friendly_name}! Your spacecraft meets all primary launch rules for **{m['mission_name']}** "
                f"with **{len(warnings)} warning(s)**. We can either launch now or fine-tune your margins for an even higher grade!"
            )

        # 1. Simulation failure / flight outcome analysis
        asks_sim = any(w in q_low for w in ("simulation", "simulated", "flight", "failed", "failure", "crash", "lost", "month", "scrubbed", "outcome", "what happened"))
        if asks_sim and sim.get("available"):
            lines.append("#### [SIMULATION FAILURE & TELEMETRY ANALYSIS]")
            lines.append(
                f"- **Flight Outcome:** **{sim['outcome'].upper()}** (Survived **{sim['months_survived']} / {sim['months_planned']} months**, "
                f"Science Return: **{sim['science_fraction_pct']}%**, Score: **{sim['total_score']}**)"
            )
            lines.append(f"- **Failure Stage & Subsystem:** {sim['failed_stage']} (`{sim['failed_subsystem']}`)")
            lines.append(f"- **Root Cause (Plain & Clear):** {sim['root_cause']}")
            t_ind = sim.get("telemetry_indicators", {})
            if t_ind:
                lines.append(
                    f"- **Telemetry Indicators:** Min Power Margin `{t_ind.get('minimum_power_margin_pct')}%`, "
                    f"Min Battery Health `{t_ind.get('minimum_battery_health_pct')}%`, "
                    f"Remaining Reserve `${t_ind.get('final_reserve_m')}M`, "
                    f"Wheel Failures `{sim.get('wheel_failures', 0)}`."
                )
            if sim.get("recommended_design_fixes"):
                lines.append("#### [MENTOR DESIGN FIX]")
                for fix in sim["recommended_design_fixes"]:
                    lines.append(f"- {fix}")

        # 2. Specific catalog component compatibility analysis
        mentioned = compat.get("mentioned_catalog_items", [])
        if mentioned:
            lines.append("#### [COMPONENT COMPATIBILITY & SPECIFICATION ANALYSIS]")
            for item in mentioned[:3]:
                if item["catalog_type"] == "instrument":
                    sp = item["specs"]
                    status_str = "SUITABLE" if item["suitable_for_mission"] else "UNSUITABLE / MISMATCHED"
                    lines.append(
                        f"- **{item['name']} (`{item['id']}`)** — **{status_str}** | "
                        f"Specs: `{sp['mass_kg']} kg`, `{sp['power_w']} W`, `{sp['data_mbps']} Mbps`, `${sp['cost_m']}M`, "
                        f"Pointing `<= {sp['req_pointing_deg']}°`, Tags: `{sp['tags']}` [[tab:instr|Open Instruments Tab →]]"
                    )
                    if item["suitability_issues"]:
                        for issue in item["suitability_issues"]:
                            lines.append(f"  - **Why Mismatched:** {issue}")
                    else:
                        matched_req = set(sp["tags"]) & set(m.get("required_science_tags", []))
                        if matched_req:
                            lines.append(
                                f"  - **Why Required/Helpful:** Directly satisfies `{sorted(matched_req)}` objective(s) for {m['mission_name']}."
                            )
                    if item.get("mission_alternatives"):
                        lines.append(f"  - **Compatible Alternatives for {m['mission_name']}:** " + "; ".join(item["mission_alternatives"][:2]))
                else:
                    lines.append(f"- **{item['name']} (`{item['id']}`)** [{item['catalog_type']}]: {item.get('desc', '')} | Specs: `{item['specs']}`")

        # 3. Mission Objectives & Science Coverage
        lines.append("#### [MISSION REQUIREMENTS & SCIENCE OBJECTIVES]")
        req_goals = m.get("required_objectives", [])
        req_summary = ", ".join(f"{g['label']} (`{g['tag']}`)" for g in req_goals) or "General Mission Goals"
        lines.append(f"- **Required Objectives:** {req_summary} (Current Science Coverage: **{obj['overall_science_coverage_pct']}%**) [[modal:briefing|Open Mission Briefing →]]")
        if obj["unmet_required_objectives"]:
            unmet_str = ", ".join(f"{g['label']} (`{g['tag']}`)" for g in obj["unmet_required_objectives"])
            lines.append(f"- **Unmet Required Targets:** {unmet_str} [[tab:instr|Jump to Instruments Tab →]]")
            for rec_inst in obj.get("recommended_instruments_for_gaps", [])[:3]:
                lines.append(
                    f"  - **Recommended Payload:** **{rec_inst['name']} (`{rec_inst['id']}`)** covers `{rec_inst['satisfies_tag']}` "
                    f"(`{rec_inst['mass_kg']} kg`, `{rec_inst['power_w']} W`, `${rec_inst['cost_m']}M`, pointing `<= {rec_inst['req_pointing_deg']}°`)."
                )
        else:
            lines.append("- **Objective Status:** All required primary science goals are covered (>= 50% threshold).")

        # 4. Calculated Telemetry Summary
        lines.append("#### [CALCULATED SPACECRAFT TELEMETRY]")
        mass = calc.get("mass", {})
        power = calc.get("power", {})
        cost = calc.get("cost", {})
        if m["mission_kind"] == "program":
            lines.append(
                f"- **Station Program:** `{sc_cfg.get('flight_count')}` flights | "
                f"Power Margin `{power.get('power_margin_ratio')}` | "
                f"Cost `${cost.get('total_cost_m')}M / ${cost.get('budget_limit_m')}M` (Remaining `${cost.get('remaining_budget_m')}M`) [[tab:manifest|Open Manifest Tab →]]"
            )
        elif m["mission_kind"] == "vehicle":
            vt = calc.get("capsule_telemetry", {})
            lines.append(
                f"- **Crewed Capsule:** Launch Mass `{mass.get('launch_mass_kg')} / {mass.get('launch_vehicle_capacity_kg')} kg` | "
                f"Loss Risk `1 in {vt.get('one_in', 'N/A')}` | "
                f"Cost `${cost.get('total_cost_m')}M / ${cost.get('budget_limit_m')}M` (Remaining `${cost.get('remaining_budget_m')}M`)"
            )
        else:
            lines.append(
                f"- **Mass & Delta-v:** Dry Mass `{mass.get('dry_mass_kg')} kg` (Bus Max `{mass.get('bus_max_dry_kg')} kg`), "
                f"Wet/Launch Mass `{mass.get('launch_mass_kg')} / {mass.get('launch_vehicle_capacity_kg')} kg` (Margin `{mass.get('launch_mass_margin_kg')} kg`), "
                f"Required Delta-v `{mass.get('delta_v_required_ms')} m/s` (Propellant `{mass.get('propellant_mass_kg')} kg`) [[tab:bus|Bus Tab →]] [[tab:prop|Engine Tab →]]"
            )
            lines.append(
                f"- **Power & Eclipse:** Generated `{power.get('total_generated_w')} W` vs Load `{power.get('total_consumed_w')} W` "
                f"(Net `{power.get('power_margin_w')} W` / `{power.get('power_margin_pct')}%` at `{m['environmental_constraints']['sun_distance_au']} AU`); "
                f"Usable Battery `{power.get('battery_usable_wh')} Wh` vs Eclipse Need `{power.get('eclipse_energy_required_wh')} Wh` [[tab:power|Power Tab →]]"
            )
            pt = calc.get("pointing_and_slots", {})
            comm = calc.get("communications", {})
            lines.append(
                f"- **Pointing, Data & Budget:** ADCS `{pt.get('adcs_accuracy_deg')}°` (Strictest Inst Req `{pt.get('strictest_instrument_req_deg')}°`) [[tab:adcs|Pointing Tab →]], "
                f"Downlink `{comm.get('downlink_capacity_gb_day')} Gb/day` vs `{comm.get('science_data_produced_gb_day')} Gb/day` produced [[tab:comms|Comms Tab →]], "
                f"Budget `${cost.get('total_cost_m')}M / ${cost.get('budget_limit_m')}M` (Remaining: `${cost.get('remaining_budget_m')}M`)."
            )

        # 5. Validation Diagnosis (Blockers vs Warnings) & Mentor Recommendations
        lines.append(f"#### [ENGINEERING VALIDATION — {val['launch_readiness']['status_label']}]")
        if val["critical_blockers"]:
            for b in val["critical_blockers"][:5]:
                lines.append(f"- **[CRITICAL BLOCKER — {b['area'].upper()}]** {b['text']} — *{b['why']}*")
        if val["engineering_warnings"]:
            for w in val["engineering_warnings"][:4]:
                lines.append(f"- **[WARNING — {w['area'].upper()}]** {w['text']} — *{w['why']}*")
        if not val["critical_blockers"] and not val["engineering_warnings"]:
            lines.append("- **All Subsystems Nominal:** Zero launch blockers or engineering warnings detected.")

        if sections.get("recommendations"):
            lines.append("#### [MENTOR TRADE-OFF RECOMMENDATIONS]")
            for rec in sections["recommendations"][:4]:
                lines.append(f"- {rec}")

        # 6. Aerospace Concept Layer (Simple + Technical)
        if matched_concepts:
            c = matched_concepts[0]
            lines.append(f"#### [AEROSPACE CONCEPT — {c['title'].upper()}]")
            lines.append(f"- **Simple Analogy:** {c['simple']}")
            lines.append(f"- **Technical Physics:** {c['technical']}")

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# 10. AI RESPONSE FORMATTER
# ---------------------------------------------------------------------------

class AIResponseFormatter:
    """Formats the AI mentor response, telemetry summary badges, dynamic quick questions, and interactive quick links."""

    AREA_TO_TAB_MAP = {
        "launch": ("launch", "launch_vehicle", "Jump to Launch Vehicle →"),
        "window": ("launch", "window", "Jump to Launch Window →"),
        "schedule": ("orbit", "orbit", "Jump to Orbit Selection →"),
        "orbit": ("orbit", "orbit", "Jump to Orbit Selection →"),
        "bus": ("bus", "bus", "Jump to Spacecraft Bus →"),
        "power": ("power", "solar", "Jump to Power & Battery →"),
        "adcs": ("adcs", "adcs", "Jump to Pointing (ADCS) →"),
        "propulsion": ("prop", "propulsion", "Jump to Engine & Propulsion →"),
        "edl": ("edl", "edl", "Jump to Landing (EDL) →"),
        "comms": ("comms", "comms", "Jump to Communications →"),
        "radiation": ("computer", "computer", "Jump to Flight Computer →"),
        "computer": ("computer", "computer", "Jump to Flight Computer →"),
        "science": ("instr", "instruments", "Jump to Science Instruments →"),
        "cost": ("partners", "partners", "Jump to Partner Agencies →"),
        "partners": ("partners", "partners", "Jump to Partner Agencies →"),
        "program": ("manifest", "manifest", "Jump to Station Manifest →"),
    }

    @classmethod
    def format_response(
        cls,
        conversation_id: str,
        context: dict[str, Any],
        ai_result: dict[str, Any],
        config_deltas: list[str],
        user_name: str = "bro/sis",
        active_tab: str = "",
    ) -> dict[str, Any]:
        m = context["mission"]
        calc = context["calculations"]
        val = context["validation"]
        obj = context["objectives"]
        sim = context["simulation"]

        mass = calc.get("mass", {})
        power = calc.get("power", {})
        cost = calc.get("cost", {})

        if m["mission_kind"] == "program":
            mass_status = f"Margin {mass.get('launch_mass_margin_ratio', 0)}"
            power_status = f"Margin {power.get('power_margin_ratio', 0)}"
        else:
            lm = mass.get("launch_mass_kg", 0)
            lcap = mass.get("launch_vehicle_capacity_kg", 0)
            mass_status = f"{lm}/{lcap} kg" if isinstance(lm, (int, float)) and isinstance(lcap, (int, float)) and lcap else f"{mass.get('dry_mass_kg', 0)} kg dry"
            pm = power.get("power_margin_w", 0)
            power_status = f"{pm:+g} W margin" if isinstance(pm, (int, float)) else str(pm)

        rem_b = cost.get("remaining_budget_m", 0)
        budget_status = f"${cost.get('total_cost_m', 0)}M / ${cost.get('budget_limit_m', 0)}M ({'+' if isinstance(rem_b, (int, float)) and rem_b >= 0 else ''}${rem_b}M)"

        context_summary = {
            "mission_id": m["mission_id"],
            "mission_name": m["mission_name"],
            "destination_name": m["destination_name"],
            "mission_type": m["mission_type"],
            "mass_status": mass_status,
            "power_status": power_status,
            "budget_status": budget_status,
            "science_status": f"{obj.get('overall_science_coverage_pct', 0)}% goals",
            "readiness_status": val["launch_readiness"]["status_label"],
            "approved": val["launch_readiness"]["approved"],
            "blocker_count": val["launch_readiness"]["blocker_count"],
            "warning_count": val["launch_readiness"]["warning_count"],
            "sim_status": sim.get("outcome") if sim.get("available") else "Not launched yet",
        }

        suggested_questions = cls._generate_suggested_questions(context)
        quick_links = cls._generate_quick_links(context, active_tab)

        return {
            "ok": True,
            "conversation_id": conversation_id,
            "user_name": resolve_friendly_name(user_name),
            "mission_id": m["mission_id"],
            "mission_name": m["mission_name"],
            "model": ai_result["model"],
            "source": ai_result["source"],
            "fallback_reason": ai_result.get("fallback_reason"),
            "answer": ai_result["answer"],
            "sections": ai_result["sections"],
            "context_summary": context_summary,
            "issue_breakdown": {
                "critical_blockers": val["critical_blockers"],
                "missing_components": val["missing_components"],
                "mission_objective_mismatches": val["mission_objective_mismatches"],
                "budget_problems": val["budget_problems"],
                "engineering_warnings": val["engineering_warnings"],
            },
            "suggested_questions": suggested_questions,
            "quick_links": quick_links,
            "config_changed": len(config_deltas) > 0,
            "config_deltas": config_deltas,
        }

    @classmethod
    def _generate_quick_links(cls, context: dict[str, Any], active_tab: str = "") -> list[dict[str, str]]:
        """Builds context-aware clickable Quick Links to Engineering Desk tabs, fields, and reference modals."""
        links: list[dict[str, str]] = []
        seen_labels: set[str] = set()

        def add_link(item: dict[str, str]) -> None:
            lbl = item.get("label", "")
            if lbl and lbl not in seen_labels and len(links) < 6:
                seen_labels.add(lbl)
                links.append(item)

        val = context.get("validation", {})
        obj = context.get("objectives", {})
        compat = context.get("compatibility", {})

        # 1. Unmet required science objectives -> Jump to Instruments
        if obj.get("unmet_required_objectives"):
            add_link({
                "type": "field",
                "tab": "instr",
                "field": "instruments",
                "label": "Jump to Instruments →",
            })

        # 2. Critical blockers -> Jump to exact subsystem tab & field
        for b in val.get("critical_blockers", []):
            area = str(b.get("area") or "").lower()
            text_low = str(b.get("text") or "").lower()
            if "battery" in text_low or "eclipse" in text_low:
                add_link({"type": "field", "tab": "power", "field": "battery", "label": "Jump to Battery →"})
            elif "solar" in text_low:
                add_link({"type": "field", "tab": "power", "field": "solar", "label": "Jump to Solar Array →"})
            elif "orbit" in text_low:
                add_link({"type": "field", "tab": "orbit", "field": "orbit", "label": "Jump to Orbit Tab →"})
            elif "rocket" in text_low or "launch vehicle" in text_low:
                add_link({"type": "field", "tab": "launch", "field": "launch_vehicle", "label": "Jump to Launch Vehicle →"})
            elif "bus" in text_low or "slot" in text_low:
                add_link({"type": "field", "tab": "bus", "field": "bus", "label": "Jump to Spacecraft Bus →"})
            elif "pointing" in text_low or "attitude" in text_low:
                add_link({"type": "field", "tab": "adcs", "field": "adcs", "label": "Jump to Pointing (ADCS) →"})
            elif "propulsion" in text_low or "engine" in text_low or "propellant" in text_low:
                add_link({"type": "field", "tab": "prop", "field": "propulsion", "label": "Jump to Propulsion →"})
            elif "antenna" in text_low:
                add_link({"type": "field", "tab": "comms", "field": "comms", "label": "Jump to Antenna →"})
            elif "ground" in text_low:
                add_link({"type": "field", "tab": "comms", "field": "ground", "label": "Jump to Ground Network →"})
            elif "computer" in text_low or "radiation" in text_low:
                add_link({"type": "field", "tab": "computer", "field": "computer", "label": "Jump to Flight Computer →"})
            elif area in cls.AREA_TO_TAB_MAP:
                t_id, f_id, lbl = cls.AREA_TO_TAB_MAP[area]
                add_link({"type": "field", "tab": t_id, "field": f_id, "label": lbl})

        # 3. Mentioned catalog items -> Jump to their tab
        for item in compat.get("mentioned_catalog_items", []):
            ctype = item.get("catalog_type")
            if ctype == "instrument":
                add_link({"type": "field", "tab": "instr", "field": "instruments", "label": "Jump to Instruments →"})
            elif ctype in cls.AREA_TO_TAB_MAP:
                t_id, f_id, lbl = cls.AREA_TO_TAB_MAP[ctype]
                add_link({"type": "field", "tab": t_id, "field": f_id, "label": lbl})

        # 4. Always provide helpful reference shortcuts (Mission Briefing & Engineer's Handbook)
        add_link({"type": "modal", "target": "briefing", "label": "Mission Briefing Dossier"})
        add_link({"type": "modal", "target": "handbook", "label": "Engineer's Handbook"})

        return links[:6]

    @staticmethod
    def _generate_suggested_questions(context: dict[str, Any]) -> list[str]:
        questions: list[str] = []
        val = context["validation"]
        obj = context["objectives"]
        sim = context["simulation"]

        if sim.get("available") and sim.get("outcome") != "success":
            questions.append("Explain simply why my simulation failed and how to fix it.")
        if val["critical_blockers"]:
            questions.append("Why can't I launch yet? Explain my blockers in simple words.")
        if obj["unmet_required_objectives"]:
            missing_tag = obj["unmet_required_objectives"][0]["tag"]
            questions.append(f"Which instrument should I pick to cover the '{missing_tag}' goal?")

        standard = [
            "Explain this mission simply and what I need to build.",
            "Why is this instrument needed, and what are its trade-offs?",
            "Explain my power and battery balance in simple words.",
            "How can I save budget without losing required science?",
            "Check if my pointing, engine delta-v, and antenna work together.",
        ]
        for q in standard:
            if q not in questions:
                questions.append(q)

        return questions[:6]


# ---------------------------------------------------------------------------
# PUBLIC ENTRYPOINT FOR API HANDLER
# ---------------------------------------------------------------------------

def handle_mission_assistant_request(payload: dict[str, Any] | None) -> tuple[int, dict[str, Any]]:
    """Validates and executes a POST /api/ai/mission-assistant request."""
    if not isinstance(payload, dict):
        return 400, {"ok": False, "error": "Request body must be a JSON object."}

    raw_question = payload.get("question", "")
    if not isinstance(raw_question, str):
        return 400, {"ok": False, "error": "Field 'question' must be a string."}

    question = raw_question.strip()
    action_type = str(payload.get("action") or "chat").strip()

    if not question:
        if action_type == "diagnose":
            question = "Analyze my current spacecraft configuration, mission objectives, and any blockers or warnings in simple, friendly terms."
        elif action_type == "explain_simulation":
            question = "Explain simply what happened in my mission simulation, why it succeeded or failed, and how to improve the design."
        else:
            return 400, {"ok": False, "error": "Please enter an engineering question for the AI Mission Mentor."}

    if len(question) > MAX_QUESTION_LEN:
        return 400, {
            "ok": False,
            "error": f"Question is too long ({len(question)} characters). Maximum allowed is {MAX_QUESTION_LEN} characters.",
        }

    raw_design = payload.get("design")
    if raw_design is not None and not isinstance(raw_design, dict):
        return 400, {"ok": False, "error": "Field 'design' must be a JSON object when provided."}

    client_sim = payload.get("simulation") or payload.get("sim") or payload.get("result")
    if client_sim is not None and not isinstance(client_sim, dict):
        client_sim = None

    context = MissionContextBuilder.build(raw_design, client_sim, question)
    mission_id = context["mission"]["mission_id"]
    active_tab = str(payload.get("active_tab") or "").strip()
    user_name = resolve_friendly_name(payload.get("user_name") or payload.get("player"))

    conversation_id, session = CONVERSATION_MANAGER.get_or_create(
        payload.get("conversation_id"), mission_id
    )
    config_deltas = CONVERSATION_MANAGER.compute_config_delta(session.get("last_snapshot"), context)

    ai_result = GroqAIService.generate_response(
        question=question,
        context=context,
        history=session.get("messages", []),
        config_deltas=config_deltas,
        action_type=action_type,
        active_tab=active_tab,
        user_name=user_name,
    )

    CONVERSATION_MANAGER.record_turn(
        conversation_id=conversation_id,
        mission_id=mission_id,
        user_question=question,
        assistant_answer=ai_result["answer"],
        cur_ctx=context,
    )

    formatted = AIResponseFormatter.format_response(
        conversation_id=conversation_id,
        context=context,
        ai_result=ai_result,
        config_deltas=config_deltas,
        user_name=user_name,
        active_tab=active_tab,
    )
    return 200, formatted

