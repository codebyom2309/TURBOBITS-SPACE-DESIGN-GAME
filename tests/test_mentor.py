"""Comprehensive test suite for the COSMO QUEST AI Mission Engineering Mentor (Phases 3–9).

Tests all 10 modular architectural components, all 15 required aerospace engineering
mentor scenarios, Groq API live/mocked fallback, API key redaction, and HTTP endpoints.
Compatible with both `pytest` and standard library `python3 -m unittest`.
"""

from __future__ import annotations

from http.server import ThreadingHTTPServer
import json
import os
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

from engine import catalog as C
from engine.mentor import (
    CONVERSATION_MANAGER,
    GroqAIService,
    MissionContextBuilder,
    handle_mission_assistant_request,
)
from engine.model import blank_design, default_design, evaluate
import server


def post_json(url: str, payload: dict) -> tuple[int, dict]:
    raw = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=raw,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


class TestAIMissionEngineeringMentor(unittest.TestCase):
    """Covers all 15 required test scenarios for the AI Mission Engineering Mentor."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        port = cls.srv.server_address[1]
        cls.base_url = f"http://127.0.0.1:{port}"
        cls.thread = threading.Thread(target=cls.srv.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.srv.shutdown()
        cls.srv.server_close()

    def test_01_why_required_instrument_is_needed(self) -> None:
        """Scenario 1: Asking why a required instrument is needed."""
        design = default_design("wildfire")
        status, res = handle_mission_assistant_request({
            "question": "Why is the Thermal Infrared Imager (tir) required for the Wildfire Watch mission?",
            "design": design,
        })
        self.assertEqual(status, 200)
        self.assertTrue(res["ok"])
        self.assertEqual(res["mission_id"], "wildfire")
        self.assertTrue("Thermal" in res["answer"] or "tir" in res["answer"].lower())
        self.assertIn("fire", json.dumps(res["sections"]["mission_requirements"]).lower())

    def test_02_why_unsuitable_instrument_is_rejected(self) -> None:
        """Scenario 2: Asking why an unsuitable instrument is rejected."""
        # Case A: Surface-only seismometer on an orbital wildfire mission
        design = default_design("wildfire")
        design["instruments"] = ["seis"]
        status, res = handle_mission_assistant_request({
            "question": "Why is the Seismometer (seis) unsuitable for this orbital mission?",
            "design": design,
        })
        self.assertEqual(status, 200)
        self.assertTrue("surface" in res["answer"].lower() or "orbit" in res["answer"].lower())

        # Case B: Optical camera on cloud-covered Venus
        venus_design = default_design("venus_clouds")
        venus_design["instruments"] = ["cam_hi"]
        status_v, res_v = handle_mission_assistant_request({
            "question": "Why does the High-Resolution Camera (cam_hi) fail on the Venus mission?",
            "design": venus_design,
        })
        self.assertEqual(status_v, 200)
        ans_low = res_v["answer"].lower()
        self.assertTrue("cloud" in ans_low or "radar" in ans_low or "sar" in ans_low)

    def test_03_asking_for_alternative_instrument(self) -> None:
        """Scenario 3: Asking for an alternative instrument when required objective is unmet."""
        design = default_design("wildfire")
        design["instruments"] = ["mag"]  # Magnetometer does not cover 'thermal'
        status, res = handle_mission_assistant_request({
            "question": "What alternative instrument should I select to meet the required wildfire objective?",
            "design": design,
        })
        self.assertEqual(status, 200)
        self.assertIn("thermal", res["sections"]["mission_requirements"]["unmet_required_tags"])
        recs_text = " ".join(res["sections"]["recommendations"]).lower()
        self.assertTrue("tir" in recs_text or "thermal" in recs_text)

    def test_04_asking_about_power_shortage(self) -> None:
        """Scenario 4: Asking about a power shortage and eclipse battery deficit."""
        design = default_design("europa")
        design["solar"] = "small"
        design["rtg"] = 0
        design["battery"] = "li_small"
        status, res = handle_mission_assistant_request({
            "question": "Why is my power margin negative at Europa and how do I fix my solar/RTG and battery?",
            "design": design,
        })
        self.assertEqual(status, 200)
        calc = res["sections"]["calculated_values"]
        self.assertLess(calc["power_margin_w"], 0)
        blockers = res["issue_breakdown"]["critical_blockers"]
        self.assertTrue(any(b["area"] == "power" for b in blockers))
        self.assertTrue("AU" in res["answer"] or "RTG" in res["answer"] or "power" in res["answer"].lower())

    def test_05_asking_about_budget_constraints(self) -> None:
        """Scenario 5: Asking about budget overrun and cost reduction trade-offs."""
        design = default_design("wildfire")
        design["launch_vehicle"] = "heavy"
        design["bus"] = "flagship"
        design["rtg"] = 2
        status, res = handle_mission_assistant_request({
            "question": "My mission is over budget. How can I reduce cost or use partner funding?",
            "design": design,
        })
        self.assertEqual(status, 200)
        calc = res["sections"]["calculated_values"]
        self.assertLess(calc["remaining_budget_m"], 0)
        self.assertGreater(len(res["issue_breakdown"]["budget_problems"]), 0)
        self.assertTrue(any("partner" in r.lower() or "esa" in r.lower() or "jaxa" in r.lower() for r in res["sections"]["recommendations"]))

    def test_06_asking_about_orbit_selection(self) -> None:
        """Scenario 6: Asking about orbit selection and Sun-Synchronous Orbit (SSO)."""
        design = default_design("wildfire")
        status, res = handle_mission_assistant_request({
            "question": "Explain how Sun-Synchronous Orbit (SSO) and orbital altitude affect coverage and eclipse.",
            "design": design,
        })
        self.assertEqual(status, 200)
        concept = res["sections"]["concept_explanation"]
        self.assertIsNotNone(concept)
        self.assertTrue("sso" in concept["id"] or "orbital_altitude" in concept["id"])
        self.assertIn("AEROSPACE CONCEPT", res["answer"])

    def test_07_asking_about_pointing_accuracy(self) -> None:
        """Scenario 7: Asking about pointing accuracy, reaction wheels, and magnetorquers."""
        design = default_design("lunar_ice")
        design["adcs"] = "magnetorquer"  # Magnetorquers fail at the Moon
        design["comms"] = "xhga"         # High-gain dish requires <= 0.5 deg pointing
        status, res = handle_mission_assistant_request({
            "question": "Why are magnetorquers failing for pointing my high-gain dish and camera at the Moon?",
            "design": design,
        })
        self.assertEqual(status, 200)
        blockers = res["issue_breakdown"]["critical_blockers"]
        self.assertTrue(any(b["area"] in ("adcs", "comms") for b in blockers))
        self.assertTrue("magnetic" in res["answer"].lower() or "reaction wheel" in res["answer"].lower())

    def test_08_asking_about_propulsion(self) -> None:
        """Scenario 8: Asking about propulsion, specific impulse (Isp), and delta-v."""
        design = default_design("mars_climate")
        design["propulsion"] = "coldgas"  # Cold gas Isp 70s cannot handle Mars orbit insertion
        status, res = handle_mission_assistant_request({
            "question": "Why is Cold Gas propulsion failing to provide enough delta-v for Mars orbit insertion?",
            "design": design,
        })
        self.assertEqual(status, 200)
        blockers = res["issue_breakdown"]["critical_blockers"]
        self.assertTrue(any(b["area"] == "propulsion" for b in blockers))
        self.assertTrue("delta-v" in res["answer"].lower() or "isp" in res["answer"].lower())

    def test_09_asking_about_missing_launch_requirements(self) -> None:
        """Scenario 9: Asking about missing launch requirements on an incomplete spacecraft."""
        design = blank_design("wildfire")
        status, res = handle_mission_assistant_request({
            "question": "Why can't I launch yet? What components am I missing?",
            "design": design,
        })
        self.assertEqual(status, 200)
        self.assertFalse(res["context_summary"]["approved"])
        self.assertGreaterEqual(res["context_summary"]["blocker_count"], 8)
        self.assertGreaterEqual(len(res["issue_breakdown"]["missing_components"]), 8)

    def test_10_asking_about_simulation_failure(self) -> None:
        """Scenario 10: Asking about a post-launch simulation failure."""
        design = default_design("mars_rover")
        failed_sim = {
            "launched": True,
            "outcome": "lost",
            "months_survived": 8,
            "months_planned": 32,
            "science_fraction": 0.0,
            "science_score": 0.0,
            "wheel_failures": 0,
            "launch_delay": 0,
            "events": [
                {"month": 0, "kind": "launch", "text": "Liftoff!", "why": "Nominal ascent.", "impact": "good"},
                {"month": 8, "kind": "landing_failure", "text": "Touchdown signal never came. The lander crashed.", "why": "Landing is hazardous.", "impact": "fatal"},
            ],
            "timeline": [
                {"month": 1, "phase": "cruise", "alive": True, "science_fraction": 0.0, "battery_pct": 1.0, "reserve": 20.0, "power_margin": 0.25, "rate": 1.0, "fuel_pct": 0.8, "data_gb": 0.0},
                {"month": 8, "phase": "science", "alive": False, "science_fraction": 0.0, "battery_pct": 0.98, "reserve": 20.0, "power_margin": 0.25, "rate": 0.0, "fuel_pct": 0.1, "data_gb": 0.0},
            ],
        }
        status, res = handle_mission_assistant_request({
            "question": "Why did my simulation fail at Month 8?",
            "action": "explain_simulation",
            "design": design,
            "simulation": {"sim": failed_sim, "score": {"total": 12, "grade": "F"}},
        })
        self.assertEqual(status, 200)
        self.assertIn("SIMULATION FAILURE", res["answer"])
        self.assertTrue("Month 8" in res["answer"] or "Entry, Descent & Landing" in res["answer"])

    def test_11_follow_up_questions_in_same_conversation(self) -> None:
        """Scenario 11: Asking follow-up questions in the same conversation session."""
        design = default_design("wildfire")
        status1, res1 = handle_mission_assistant_request({
            "question": "Explain my current power margin.",
            "design": design,
        })
        self.assertEqual(status1, 200)
        cid = res1["conversation_id"]
        self.assertTrue(cid.startswith("mentor-"))

        status2, res2 = handle_mission_assistant_request({
            "question": "What if I add more instruments?",
            "conversation_id": cid,
            "design": design,
        })
        self.assertEqual(status2, 200)
        self.assertEqual(res2["conversation_id"], cid)
        _, session = CONVERSATION_MANAGER.get_or_create(cid, "wildfire")
        self.assertEqual(len(session["messages"]), 4)

    def test_12_changing_configuration_and_asking_again(self) -> None:
        """Scenario 12: Changing spacecraft configuration between turns detects exact deltas."""
        design = default_design("wildfire")
        design["solar"] = "small"
        status1, res1 = handle_mission_assistant_request({
            "question": "Check my solar power.",
            "design": design,
        })
        cid = res1["conversation_id"]

        updated_design = dict(design)
        updated_design["solar"] = "medium"
        updated_design["instruments"] = list(design["instruments"]) + ["sar"]

        status2, res2 = handle_mission_assistant_request({
            "question": "I upgraded the solar array and added an instrument. How does it look now?",
            "conversation_id": cid,
            "design": updated_design,
        })
        self.assertEqual(status2, 200)
        self.assertTrue(res2["config_changed"])
        deltas_joined = " ".join(res2["config_deltas"])
        self.assertIn("Solar Array changed", deltas_joined)
        self.assertIn("sar", deltas_joined)

    def test_13_handling_unavailable_or_incomplete_data(self) -> None:
        """Scenario 13: Blank/incomplete spacecraft marks unchosen specs as 'unavailable' without crashing."""
        blank = blank_design("europa")
        ctx = MissionContextBuilder.build(blank, None, "What is my launch vehicle capacity and ADCS pointing?")
        self.assertEqual(ctx["spacecraft"]["launch_vehicle"]["name"], "unavailable")
        self.assertEqual(ctx["calculations"]["mass"]["launch_vehicle_capacity_kg"], "unavailable")
        self.assertEqual(ctx["calculations"]["pointing_and_slots"]["adcs_accuracy_deg"], "unavailable")
        self.assertFalse(ctx["simulation"]["available"])

    def test_14_handling_groq_api_failure_and_secret_redaction(self) -> None:
        """Scenario 14: Groq API failure falls back cleanly and never leaks GROQ_API_KEY."""
        fake_secret = "gsk_SUPER_SECRET_TEST_KEY_999999"

        def boom(*args, **kwargs):
            raise RuntimeError(f"Connection failed with auth token {fake_secret}")

        with patch.dict(os.environ, {"GROQ_API_KEY": fake_secret, "GROQ_MODEL": "llama-3.3-70b-versatile"}):
            with patch.object(GroqAIService, "_call_groq_api", side_effect=boom):
                status, res = handle_mission_assistant_request({
                    "question": "Explain why my power margin is low.",
                    "design": default_design("wildfire"),
                })
                self.assertEqual(status, 200)
                self.assertTrue(res["ok"])
                self.assertEqual(res["source"], "deterministic_fallback")
                serialized = json.dumps(res)
                self.assertNotIn(fake_secret, serialized)
                self.assertIn("[REDACTED]", res.get("fallback_reason") or "")

    def test_15_invalid_user_input_and_live_http_endpoints(self) -> None:
        """Scenario 15: Validates invalid inputs (400) and live HTTP endpoints."""
        status, res = post_json(f"{self.base_url}/api/ai/mission-assistant", {"question": "   "})
        self.assertEqual(status, 400)
        self.assertFalse(res["ok"])

        status_long, res_long = post_json(
            f"{self.base_url}/api/ai/mission-assistant",
            {"question": "x" * 1500},
        )
        self.assertEqual(status_long, 400)
        self.assertFalse(res_long["ok"])

        status_ok, res_ok = post_json(
            f"{self.base_url}/api/ai/mission-assistant",
            {
                "question": "Explain this mission's required instruments and budget.",
                "design": default_design("wildfire"),
            },
        )
        self.assertEqual(status_ok, 200)
        self.assertTrue(res_ok["ok"])
        self.assertEqual(res_ok["mission_id"], "wildfire")

        with urllib.request.urlopen(f"{self.base_url}/api/ai/status", timeout=5) as resp:
            st_data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(st_data["ok"])
            self.assertIn("model", st_data)
            self.assertNotIn("GROQ_API_KEY", json.dumps(st_data))
            self.assertFalse(str(st_data.get("model", "")).startswith("gsk_"))

    def test_16_env_key_in_model_sanitization_and_active_tab(self) -> None:
        """Scenario 16: Sanitizes GROQ_MODEL if a gsk_ key was pasted into it and includes active_tab in context."""
        from engine.mentor import get_groq_config
        with patch.dict(os.environ, {"GROQ_API_KEY": "", "GROQ_MODEL": "gsk_ACCIDENTAL_KEY_IN_MODEL_VAR_12345"}):
            api_key, model_id = get_groq_config()
            self.assertEqual(api_key, "gsk_ACCIDENTAL_KEY_IN_MODEL_VAR_12345")
            self.assertEqual(model_id, "llama-3.3-70b-versatile")
            self.assertFalse(model_id.startswith("gsk_"))

        status, res = handle_mission_assistant_request({
            "question": "Evaluate my Bus tab selection for this mission.",
            "active_tab": "bus",
            "design": default_design("wildfire"),
        })
        self.assertEqual(status, 200)
        self.assertEqual(res["mission_id"], "wildfire")
        self.assertEqual(res["mission_name"], "Wildfire Watch")
        self.assertEqual(res["user_name"], "bro/sis")
        self.assertIn("quick_links", res)
        self.assertTrue(len(res["quick_links"]) >= 2)

    def test_17_friendly_persona_and_quick_links(self) -> None:
        """Scenario 17: Uses user's name if provided, defaults to 'bro/sis' if blank, and returns quick links."""
        with patch.dict(os.environ, {"GROQ_API_KEY": "", "GROQ_MODEL": "llama-3.3-70b-versatile"}):
            # 1. With custom name
            st1, res1 = handle_mission_assistant_request({
                "question": "Explain this mission simply.",
                "user_name": "Kavita",
                "design": blank_design("wildfire"),
            })
            self.assertEqual(st1, 200)
            self.assertEqual(res1["user_name"], "Kavita")
            self.assertIn("Kavita", res1["answer"])
            self.assertTrue(any(lk["tab"] == "instr" for lk in res1["quick_links"] if lk.get("tab")))

            # 2. Without custom name -> defaults to bro/sis
            st2, res2 = handle_mission_assistant_request({
                "question": "Why can't I launch yet?",
                "user_name": "",
                "design": blank_design("wildfire"),
            })
            self.assertEqual(st2, 200)
            self.assertEqual(res2["user_name"], "bro/sis")
            self.assertIn("bro/sis", res2["answer"].lower())
            self.assertIn("[[", res2["answer"])


if __name__ == "__main__":
    unittest.main()
