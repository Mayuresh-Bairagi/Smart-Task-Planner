import json
import os
from datetime import datetime
from typing import List, Dict, Optional
from logger.customlogger import CustomLogger

logger = CustomLogger().get_logger(__file__)

class HistoryManager:
    def __init__(self, storage_path: str = "data/plan_history.json"):
        self.storage_path = storage_path
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, 'w') as f:
                json.dump([], f)
    
    def save_plan(self, plan_id: str, goal: str, constraints: str, 
                  tasks: List[Dict], duration_days: int, task_count: int):
        """Save completed plan to history"""
        try:
            history = self._load_history()
            
            plan_record = {
                "plan_id": plan_id,
                "goal": goal,
                "constraints": constraints,
                "task_count": task_count,
                "duration_days": duration_days,
                "created_at": datetime.now().isoformat(),
                "tasks_summary": [{"id": t["id"], "title": t.get("title", "")} for t in tasks[:5]]
            }
            
            history.append(plan_record)
            
            with open(self.storage_path, 'w') as f:
                json.dump(history, f, indent=2)
            
            logger.info(f"Saved plan {plan_id} to history")
        except Exception as e:
            logger.error(f"Failed to save plan to history: {e}")
    
    def _load_history(self) -> List[Dict]:
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except:
            return []
    
    def find_similar_plans(self, goal: str, top_k: int = 3) -> List[Dict]:
        """Find similar plans based on goal similarity"""
        history = self._load_history()
        
        if not history:
            return []
        
        # Simple keyword matching
        goal_words = set(goal.lower().split())
        
        scored_plans = []
        for plan in history:
            plan_words = set(plan["goal"].lower().split())
            similarity = len(goal_words & plan_words) / max(len(goal_words), 1)
            
            if similarity > 0.2:
                scored_plans.append({
                    "plan": plan,
                    "similarity": similarity
                })
        
        scored_plans.sort(key=lambda x: x["similarity"], reverse=True)
        
        return [item["plan"] for item in scored_plans[:top_k]]
    
    def get_statistics(self) -> Dict:
        """Get overall statistics from history"""
        history = self._load_history()
        
        if not history:
            return {
                "total_plans": 0,
                "avg_duration": 0,
                "avg_tasks": 0
            }
        
        return {
            "total_plans": len(history),
            "avg_duration": sum(p["duration_days"] for p in history) / len(history),
            "avg_tasks": sum(p["task_count"] for p in history) / len(history)
        }
