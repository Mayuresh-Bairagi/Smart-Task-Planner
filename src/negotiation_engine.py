from datetime import date
from typing import Dict, Any, List, Optional
from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException


class NegotiationEngine:
    def __init__(self):
        try:
            self.logger = CustomLogger().get_logger(__file__)
            self.logger.info("NegotiationEngine initialized.")
        except Exception as e:
            raise smartTaskPlannerException(f"NegotiationEngine init failed: {e}")

    def analyze_feasibility(self, scheduler_output, deadline_iso: Optional[str] = None, threshold=0.7):
        try:
            self.logger.info("Running feasibility analysis.")
            mc = scheduler_output.monte_carlo or {}
            p50 = mc.get("percentiles", {}).get("p50")
            p90 = mc.get("percentiles", {}).get("p90")
            expected = scheduler_output.expected_calendar_days
            result = {"status": None, "expected": expected, "p50": p50, "p90": p90}

            if deadline_iso:
                dl = date.fromisoformat(deadline_iso)
                days_available = (dl - scheduler_output.project_start).days + 1
                result["days_available"] = days_available
                if expected <= days_available:
                    result["status"] = "feasible"
                elif p50 is not None and p50 <= days_available:
                    result["status"] = "risky"  
                else:
                    result["status"] = "not_feasible"
            else:
                result["status"] = "no_deadline"
                result["days_available"] = None

            self.logger.info(f"Feasibility: {result['status']}")
            return result

        except Exception as e:
            self.logger.error(f"Feasibility analysis failed: {e}")
            raise smartTaskPlannerException(f"Feasibility analysis failed: {e}")

    def detect_risk_hotspots(self, task_reasoning_output, scheduler_output) -> List[Dict[str, Any]]:

        try:
            self.logger.info("Detecting risk hotspots.")
            hotspots = []
            mc = scheduler_output.monte_carlo or {}
            critical_frac = mc.get("task_critical_fraction", {})
            for t in task_reasoning_output.tasks:
                score = 0
                reasons = []

                if getattr(t, "confidence", 1.0) < 0.75:
                    score += 1
                    reasons.append("low_confidence")

                a = t.duration_days.optimistic
                m = t.duration_days.most_likely
                b = t.duration_days.pessimistic
                if (b - a) > 0.5 * max(1.0, m):
                    score += 1
                    reasons.append("high_variance")

                if t.id in scheduler_output.critical_path:
                    score += 1
                    reasons.append("on_critical_path")

                if critical_frac.get(t.id, 0) > 0.25:
                    score += 1
                    reasons.append("frequently_critical")

                if score > 0:
                    hotspots.append({
                        "task_id": t.id,
                        "title": t.title,
                        "score": score,
                        "reasons": reasons,
                        "confidence": getattr(t, "confidence", None)
                    })
            self.logger.info(f"Found {len(hotspots)} hotspots.")
            return hotspots
        except Exception as e:
            self.logger.error(f"Risk detection failed: {e}")
            raise smartTaskPlannerException(f"Risk detection failed: {e}")

    def propose_options(self, task_reasoning_output, scheduler_output, feasibility_result) -> List[Dict[str, Any]]:
        try:
            self.logger.info("Proposing negotiation options.")
            options = []

            minimal_cut = []
            for t in task_reasoning_output.tasks:
                if t.id not in scheduler_output.critical_path and getattr(t, "confidence", 1.0) < 0.85:
                    minimal_cut.append(t.id)
            options.append({
                "id": "opt_scope_cut",
                "title": "Reduce scope (minimal cut)",
                "description": "Drop low-confidence non-critical tasks to compress schedule.",
                "tasks_to_remove": minimal_cut,
                "impact_estimate": "likely reduces duration modestly"
            })

            critical_tasks = [tid for tid in scheduler_output.critical_path]
            options.append({
                "id": "opt_add_dev",
                "title": "Add 1 developer (contractor)",
                "description": f"Add 1 developer to work on critical-path tasks ({len(critical_tasks)} tasks).",
                "devs_needed": 1,
                "impact_estimate": "estimated project duration reduction: ~15-30% (heuristic)",
                "cost_estimate_usd": None
            })

            p50 = feasibility_result.get("p50")
            days_needed = None
            if p50:
                days_needed = max(0, int(p50 - (feasibility_result.get("days_available") or 0)))
            options.append({
                "id": "opt_extend_deadline",
                "title": "Extend deadline",
                "description": "Extend the deadline to increase probability of on-time delivery.",
                "suggested_extension_days": days_needed,
                "impact_estimate": "increases chance to meet date to ~50% (p50) or more"
            })

            self.logger.info("Options generated.")
            return options

        except Exception as e:
            self.logger.error(f"Option generation failed: {e}")
            raise smartTaskPlannerException(f"Option generation failed: {e}")
