"""
Smart AI-Powered Deadline Negotiator
Uses LLM to provide intelligent deadline analysis and suggestions
"""
import json
from datetime import datetime, timedelta
from typing import Dict
from utils.model_loader import ModelLoader
from logger.customlogger import CustomLogger

logger = CustomLogger().get_logger(__file__)

class SmartNegotiator:
    def __init__(self):
        self.model_loader = ModelLoader()
        self.llm = self.model_loader.load_llm()
    
    def analyze_deadline(self, plan_data: Dict, requested_deadline: str = None) -> Dict:
        """AI-powered deadline analysis"""
        try:
            # Extract plan info
            goal = plan_data.get("goal", "")
            tasks = plan_data.get("task_output", {}).get("tasks", [])
            scheduler = plan_data.get("scheduler_output")
            
            project_start = scheduler.project_start.isoformat()
            project_end = scheduler.project_end.isoformat()
            expected_days = scheduler.expected_calendar_days
            critical_path = scheduler.critical_path
            
            # Build task summary
            task_summary = []
            for t in tasks[:10]:  # Limit to 10 tasks
                task_summary.append({
                    "id": t.get("id"),
                    "title": t.get("title", ""),
                    "duration": t.get("duration_days", {}),
                    "critical": t.get("id") in critical_path
                })
            
            # AI Analysis Prompt
            prompt = f"""You are an expert project manager. Analyze this project deadline request.

PROJECT DETAILS:
Goal: {goal}
Current Schedule: {project_start} to {project_end} ({expected_days} days)
Requested Deadline: {requested_deadline or "Not specified"}
Critical Path Tasks: {len(critical_path)} tasks
Total Tasks: {len(tasks)}

TASK BREAKDOWN:
{json.dumps(task_summary, indent=2)}

ANALYZE:
1. Is the requested deadline feasible?
2. What are the main risks?
3. What specific actions can meet the deadline?
4. If not feasible, what's the earliest realistic date?

Return JSON:
{{
  "feasible": true/false,
  "confidence": 0-100,
  "analysis": "detailed explanation",
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": ["action1", "action2", "action3"],
  "alternative_deadline": "YYYY-MM-DD or null",
  "time_savings_possible": "X days by doing Y"
}}

Return ONLY valid JSON."""

            response = self.llm.invoke(prompt)
            content = response.content.strip()
            
            # Clean markdown
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            
            # Add actual project data
            result["current_schedule"] = {
                "start": project_start,
                "end": project_end,
                "duration_days": expected_days
            }
            result["requested_deadline"] = requested_deadline
            
            logger.info(f"AI Analysis: Feasible={result.get('feasible')}, Confidence={result.get('confidence')}%")
            
            return result
            
        except Exception as e:
            logger.error(f"Smart negotiation failed: {e}")
            # Fallback simple analysis
            return self._simple_fallback(plan_data, requested_deadline)
    
    def _simple_fallback(self, plan_data: Dict, requested_deadline: str) -> Dict:
        """Simple fallback if AI fails"""
        scheduler = plan_data.get("scheduler_output")
        project_end = scheduler.project_end
        
        if requested_deadline:
            req_date = datetime.fromisoformat(requested_deadline).date()
            feasible = req_date >= project_end
        else:
            feasible = True
            req_date = None
        
        return {
            "feasible": feasible,
            "confidence": 70,
            "analysis": "Basic analysis: " + ("Deadline is achievable" if feasible else "Deadline is too tight"),
            "risks": ["Limited analysis available"],
            "recommendations": ["Review critical path tasks", "Consider adding resources"],
            "alternative_deadline": (project_end + timedelta(days=7)).isoformat() if not feasible else None,
            "time_savings_possible": "5-10 days with optimization",
            "current_schedule": {
                "start": scheduler.project_start.isoformat(),
                "end": scheduler.project_end.isoformat(),
                "duration_days": scheduler.expected_calendar_days
            },
            "requested_deadline": requested_deadline
        }
