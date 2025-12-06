from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException
from src.orchestrator import Orchestrator
from model.model import CreatePlanRequest, CreatePlanResponse, NegotiateRequest

logger = CustomLogger().get_logger(__file__)
app = FastAPI(title="Smart Task Planner API")

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
        return {
            "plan_id": plan_id,
            "goal": plan["goal"],
            "constraints": plan["constraints"],
            "critical_path": plan["scheduler_output"].critical_path,
            "project_start": plan["scheduler_output"].project_start.isoformat(),
            "project_end": plan["scheduler_output"].project_end.isoformat(),
            "expected_days": plan["scheduler_output"].expected_calendar_days,
            "monte_carlo": plan["scheduler_output"].monte_carlo
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


@app.get("/plan/{plan_id}/gantt")
def get_gantt_data(plan_id: str):
    plan = orch.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    sched = plan["scheduler_output"].schedules

    gantt_data = []
    for t in sched:
        gantt_data.append({
            "id": t.id,
            "name": t.title,
            "start": t.start.isoformat(),
            "end": t.end.isoformat(),
            "progress": 0,
            "dependencies": plan["task_output"].tasks_dict.get(t.id, {}).get("dependencies", []),
            "custom_class": "critical" if t.critical else "normal"
        })

    return {"tasks": gantt_data}



if __name__ == "__main__":
    uvicorn.run("src.main_api:app", host="0.0.0.0", port=8000, reload=True)
