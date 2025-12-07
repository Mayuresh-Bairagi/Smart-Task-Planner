from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException
from src.orchestrator import Orchestrator
from model.model import CreatePlanRequest, CreatePlanResponse, NegotiateRequest

logger = CustomLogger().get_logger(__file__)
app = FastAPI(title="Smart Task Planner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
)

orch = Orchestrator()

@app.post("/plan", response_model=CreatePlanResponse)
def create_plan(req: CreatePlanRequest):
    try:
        payload = orch.create_plan(
            goal=req.goal,
            constraints=req.constraints or "",
            start_date=req.start_date,
            weekend=req.weekend,
            holidays=req.holidays
        )
        return CreatePlanResponse(plan_id=payload["plan_id"], goal=payload["goal"], constraints=payload["constraints"])
    except smartTaskPlannerException as e:
        logger.error(f"Create plan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in create_plan")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/plan/{plan_id}")
def get_plan(plan_id: str):
    try:
        plan = orch.get_plan(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        scheduler = plan["scheduler_output"]
        return {
            "plan_id": plan_id,
            "goal": plan["goal"],
            "constraints": plan["constraints"],
            "critical_path": scheduler.critical_path,
            "project_start": scheduler.project_start.isoformat(),
            "project_end": scheduler.project_end.isoformat(),
            "expected_days": scheduler.expected_calendar_days,
            "monte_carlo": scheduler.monte_carlo,
            "schedules": [
                {
                    "id": s.id,
                    "title": s.title,
                    "start": s.start.isoformat(),
                    "end": s.end.isoformat(),
                    "slack": s.slack,
                    "critical": s.critical,
                }
                for s in scheduler.schedules
            ],
        }

    except smartTaskPlannerException as e:
        logger.error(f"Get plan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/plan/{plan_id}/negotiate")
def negotiate(plan_id: str, body: NegotiateRequest):
    try:
        result = orch.negotiate(plan_id, deadline=body.deadline)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Negotiation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled negotiation error")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggestions")
def get_suggestions(request: dict):
    try:
        goal = request.get("goal", "")
        if not goal:
            raise HTTPException(status_code=400, detail="Goal is required")
        
        result = orch.get_similar_plans(goal)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Get suggestions failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in get_suggestions")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/plan/{plan_id}/task/{task_id}/progress")
def update_progress(plan_id: str, task_id: str, request: dict):
    try:
        progress = request.get("progress", 0)
        if not 0 <= progress <= 100:
            raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        
        result = orch.update_task_progress(plan_id, task_id, progress)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Update progress failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in update_progress")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/plan/{plan_id}/details")
def update_plan_details(plan_id: str, request: dict):
    try:
        goal = request.get("goal")
        constraints = request.get("constraints")
        
        result = orch.update_plan_details(plan_id, goal, constraints)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Update plan details failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in update_plan_details")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/plan/{plan_id}/task/{task_id}/details")
def update_task_details(plan_id: str, task_id: str, request: dict):
    try:
        name = request.get("name")
        description = request.get("description")
        
        result = orch.update_task_details(plan_id, task_id, name, description)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Update task details failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in update_task_details")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/plan/{plan_id}/progress")
def get_progress_summary(plan_id: str):
    try:
        result = orch.get_progress_summary(plan_id)
        return result
    except smartTaskPlannerException as e:
        logger.error(f"Get progress summary failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unhandled error in get_progress_summary")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/plan/{plan_id}/gantt")
def get_gantt_data(plan_id: str):
    plan = orch.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    sched = plan["scheduler_output"].schedules
    task_map = plan.get("task_map", {})

    # Original task data (dicts returned by TaskReasoner)
    original_tasks = {t["id"]: t for t in plan["task_output"]["tasks"]}

    gantt_data = []
    for t in sched:
        raw = original_tasks.get(t.id, {})

        gantt_data.append({
            "id": t.id,
            "name": t.title,
            "description": raw.get("description"),
            "rationale": raw.get("rationale"),
            "assumptions": raw.get("assumptions"),
            "risks": raw.get("risks"),
            "confidence": raw.get("confidence"),
            "start": t.start.isoformat(),
            "end": t.end.isoformat(),
            "progress": 0,
            "dependencies": task_map.get(t.id, []),
            "custom_class": "critical" if t.critical else "normal",
        })

    return {"tasks": gantt_data}



if __name__ == "__main__":
    uvicorn.run("src.main_api:app", host="0.0.0.0", port=8000, reload=True)
