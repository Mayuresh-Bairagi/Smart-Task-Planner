import uuid
from typing import Dict, Any
from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException

from src.task_reasoning import TaskResoning   
from src.scheduler import PERTScheduler       
from src.negotiation_engine import NegotiationEngine
from src.history_manager import HistoryManager
from src.smart_negotiator import SmartNegotiator  


class Orchestrator:
    def __init__(self):
        try:
            self.logger = CustomLogger().get_logger(__file__)
            self.task_reasoner = TaskResoning()
            self.negotiator = NegotiationEngine()
            self.smart_negotiator = SmartNegotiator()
            self.history_manager = HistoryManager()
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
            
            # Save to history
            self.history_manager.save_plan(
                plan_id=plan_id,
                goal=goal,
                constraints=constraints,
                tasks=tasks["tasks"],
                duration_days=scheduler_out.expected_calendar_days,
                task_count=len(tasks["tasks"])
            )
            
            self.logger.info(f"Plan created: {plan_id}")
            return payload

        except Exception as e:
            self.logger.error(f"Plan creation failed: {e}")
            raise smartTaskPlannerException(f"Plan creation failed: {e}")

    def get_plan(self, plan_id: str):
        try:
            plan = self.plans.get(plan_id)
            if not plan:
                self.logger.warning(f"Plan {plan_id} not found. Total plans in memory: {len(self.plans)}")
            return plan
        except Exception as e:
            raise smartTaskPlannerException(f"Get plan failed: {e}")

    def negotiate(self, plan_id: str, deadline: str = None):
        """Smart AI-powered deadline negotiation"""
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                available_plans = list(self.plans.keys())
                self.logger.error(f"Plan {plan_id} not found. Available: {available_plans}")
                raise ValueError(f"Plan not found. Available plans: {len(available_plans)}. Did you restart the server? Plans are stored in memory.")

            # Use new smart negotiator
            result = self.smart_negotiator.analyze_deadline(plan, deadline)
            result["plan_id"] = plan_id
            
            plan["last_negotiation"] = result
            return result

        except Exception as e:
            raise smartTaskPlannerException(f"Negotiation failed: {e}")
    
    def get_similar_plans(self, goal: str):
        """Get similar plans from history"""
        try:
            similar = self.history_manager.find_similar_plans(goal)
            stats = self.history_manager.get_statistics()
            return {
                "similar_plans": similar,
                "statistics": stats
            }
        except Exception as e:
            raise smartTaskPlannerException(f"Failed to get similar plans: {e}")
    
    def update_task_progress(self, plan_id: str, task_id: str, progress: int):
        """Update progress for a specific task"""
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                available_plans = list(self.plans.keys())
                self.logger.error(f"Plan {plan_id} not found. Available: {available_plans}")
                raise smartTaskPlannerException(f"Plan not found. Available plans: {len(available_plans)}. Did you restart the server?")
            
            # Update progress in task_output
            for task in plan["task_output"]["tasks"]:
                if task["id"] == task_id:
                    task["progress"] = progress
                    break
            
            self.logger.info(f"Updated task {task_id} progress to {progress}%")
            return {"success": True, "task_id": task_id, "progress": progress}
        except Exception as e:
            raise smartTaskPlannerException(f"Failed to update progress: {e}")
    
    def update_plan_details(self, plan_id: str, goal: str = None, constraints: str = None):
        """Update plan goal and constraints"""
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                raise smartTaskPlannerException("Plan not found")
            
            if goal:
                plan["goal"] = goal
            if constraints:
                plan["constraints"] = constraints
            
            self.logger.info(f"Updated plan {plan_id} details")
            return {"success": True, "plan_id": plan_id}
        except Exception as e:
            raise smartTaskPlannerException(f"Failed to update plan: {e}")
    
    def update_task_details(self, plan_id: str, task_id: str, name: str = None, description: str = None):
        """Update task name and description"""
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                raise smartTaskPlannerException("Plan not found")
            
            for task in plan["task_output"]["tasks"]:
                if task["id"] == task_id:
                    if name:
                        task["title"] = name
                    if description:
                        task["description"] = description
                    break
            
            self.logger.info(f"Updated task {task_id} details")
            return {"success": True, "task_id": task_id}
        except Exception as e:
            raise smartTaskPlannerException(f"Failed to update task: {e}")
    
    def get_progress_summary(self, plan_id: str):
        """Get overall progress summary"""
        try:
            plan = self.get_plan(plan_id)
            if not plan:
                raise smartTaskPlannerException("Plan not found")
            
            tasks = plan["task_output"]["tasks"]
            total_tasks = len(tasks)
            total_progress = sum(t.get("progress", 0) for t in tasks)
            avg_progress = total_progress / total_tasks if total_tasks > 0 else 0
            
            completed = sum(1 for t in tasks if t.get("progress", 0) == 100)
            in_progress = sum(1 for t in tasks if 0 < t.get("progress", 0) < 100)
            not_started = sum(1 for t in tasks if t.get("progress", 0) == 0)
            
            return {
                "total_tasks": total_tasks,
                "avg_progress": round(avg_progress, 1),
                "completed": completed,
                "in_progress": in_progress,
                "not_started": not_started
            }
        except Exception as e:
            raise smartTaskPlannerException(f"Failed to get progress summary: {e}")
