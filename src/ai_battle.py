import json
from typing import List, Dict
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from logger.customlogger import CustomLogger
import os
from dotenv import load_dotenv

logger = CustomLogger().get_logger(__file__)

class AIBattle:
    def __init__(self):
        load_dotenv()
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
        # Initialize multiple AI models
        self.models = {
            "groq_llama": ChatGroq(api_key=self.groq_api_key, model="llama-3.3-70b-versatile"),
            "groq_mixtral": ChatGroq(api_key=self.groq_api_key, model="mixtral-8x7b-32768"),
            "gemini": ChatGoogleGenerativeAI(api_key=self.google_api_key, model="gemini-1.5-flash")
        }
        
        # Judge AI
        self.judge = ChatGroq(api_key=self.groq_api_key, model="llama-3.3-70b-versatile")
    
    def battle(self, goal: str, constraints: str) -> Dict:
        """Run AI battle: multiple models compete, judge picks winner"""
        logger.info(f"🔥 AI BATTLE STARTED for goal: {goal}")
        
        results = {}
        
        # Each AI creates a plan
        for model_name, model in self.models.items():
            try:
                logger.info(f"⚔️ {model_name} is generating plan...")
                plan = self._generate_plan(model, model_name, goal, constraints)
                results[model_name] = plan
            except Exception as e:
                logger.error(f"❌ {model_name} failed: {e}")
                results[model_name] = {"error": str(e)}
        
        # Judge evaluates all plans
        winner = self._judge_plans(results, goal, constraints)
        
        return {
            "battle_results": results,
            "winner": winner,
            "total_competitors": len(results)
        }
    
    def _generate_plan(self, model, model_name: str, goal: str, constraints: str) -> Dict:
        """Generate plan from a specific AI model"""
        prompt = f"""You are a project planning expert. Create a detailed project plan.

Goal: {goal}
Constraints: {constraints}

Provide a JSON response with:
1. tasks: List of 5-8 tasks with id, title, description, estimated_days
2. total_duration: Total project duration in days
3. key_risks: Top 3 risks
4. confidence_score: Your confidence (0-1)
5. unique_approach: What makes your plan special

Return ONLY valid JSON, no markdown."""

        response = model.invoke(prompt)
        content = response.content.strip()
        
        # Clean markdown if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        plan_data = json.loads(content)
        plan_data["model_name"] = model_name
        
        return plan_data
    
    def _judge_plans(self, results: Dict, goal: str, constraints: str) -> Dict:
        """Judge AI evaluates all plans and picks winner"""
        
        # Filter out failed models
        valid_results = {k: v for k, v in results.items() if "error" not in v}
        
        if not valid_results:
            return {"winner": "none", "reason": "All models failed"}
        
        judge_prompt = f"""You are an expert project management judge. Evaluate these AI-generated plans.

Goal: {goal}
Constraints: {constraints}

Plans to evaluate:
{json.dumps(valid_results, indent=2)}

Evaluate based on:
1. Completeness (are all necessary tasks included?)
2. Realism (are time estimates reasonable?)
3. Risk awareness (did they identify real risks?)
4. Innovation (unique approach?)
5. Clarity (is the plan clear and actionable?)

Return JSON with:
{{
  "winner": "model_name",
  "scores": {{"model_name": score_out_of_100}},
  "reasoning": "why this plan won",
  "strengths": ["strength1", "strength2"],
  "improvements": "what could be better"
}}

Return ONLY valid JSON."""

        try:
            response = self.judge.invoke(judge_prompt)
            content = response.content.strip()
            
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            judgment = json.loads(content)
            logger.info(f"🏆 WINNER: {judgment.get('winner', 'unknown')}")
            
            return judgment
        except Exception as e:
            logger.error(f"Judge failed: {e}")
            # Fallback: pick model with highest confidence
            best = max(valid_results.items(), key=lambda x: x[1].get("confidence_score", 0))
            return {
                "winner": best[0],
                "scores": {best[0]: 100},
                "reasoning": "Fallback: highest confidence score",
                "strengths": ["High confidence"],
                "improvements": "Judge AI failed"
            }
