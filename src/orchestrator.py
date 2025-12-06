import uuid
from typing import Dict, Any
from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException

from src.task_reasoning import TaskResoning   
from src.scheduler import PERTScheduler       
from src.negotiation_engine import NegotiationEngine  


class Orchestrator:
    def __init__(self):
        try:
            self.logger = CustomLogger().get_logger(__file__)
            self.task_reasoner = TaskResoning()
            self.negotiator = NegotiationEngine()
            self.plans: Dict[str, Dict[str, Any]] = {}
            self.logger.info("Orchestrator initialized.")
        except Exception as e:
            raise smartTaskPlannerException(f"Orchestrator init failed: {e}")

    def create_plan(self, goal: str, constraints: str, start_date: str, weekend=None, holidays=None) -> Dict[str, Any]:
        try:
            self.logger.info("Running TaskReasoning for goal.")
            tasks = self.task_reasoner.generate_tasks(goal=goal, constraints=constraints)

            # Build dependency mapping (unchanged)
            task_map = {t["id"]: t["dependencies"] for t in tasks["tasks"]}

            self.logger.info("Running PERTScheduler.")
            print(tasks)

            # FIXED: pass list of Task objects, not the entire dict
            scheduler = PERTScheduler(
                tasks=tasks["tasks"],
                start_date=start_date,
                weekend=weekend,
                holidays=holidays
            )

            scheduler_out = scheduler.run(run_monte_carlo=True)

            plan_id = str(uuid.uuid4())
            payload = {
                "plan_id": plan_id,
                "goal": goal,
                "constraints": constraints,
                "task_output": tasks,
                "scheduler_output": scheduler_out,
                "task_map": task_map,
            }
            self.plans[plan_id] = payload
            self.logger.info(f"Plan created: {plan_id}")
            return payload

        except Exception as e:
            self.logger.error(f"Plan creation failed: {e}")
            raise smartTaskPlannerException(f"Plan creation failed: {e}")

    def get_plan(self, plan_id: str):
        try:
            return self.plans.get(plan_id)
        except Exception as e:
            raise smartTaskPlannerException(f"Get plan failed: {e}")

    def negotiate(self, plan_id: str, deadline: str = None):
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                raise smartTaskPlannerException("Plan not found")

            task_out = plan["task_output"]
            sched_out = plan["scheduler_output"]

            feasibility = self.negotiator.analyze_feasibility(sched_out, deadline_iso=deadline)
            hotspots = self.negotiator.detect_risk_hotspots(task_out, sched_out)
            options = self.negotiator.propose_options(task_out, sched_out, feasibility)

            result = {
                "plan_id": plan_id,
                "feasibility": feasibility,
                "hotspots": hotspots,
                "options": options
            }
            plan["last_negotiation"] = result
            return result

        except Exception as e:
            raise smartTaskPlannerException(f"Negotiation failed: {e}")
