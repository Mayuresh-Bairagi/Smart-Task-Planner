from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date
import math
import random


class DurationEstimate(BaseModel):
    optimistic: float = Field(..., ge=0.1)
    most_likely: float = Field(..., ge=0.1)
    pessimistic: float = Field(..., ge=0.1)

    def working_days(self) -> int:
        return max(1, math.ceil(self.most_likely))

    def sample(self) -> float:
        return random.triangular(
            self.optimistic,
            self.pessimistic,
            self.most_likely
        )


class Task(BaseModel):
    id: str
    title: str
    description: str
    rationale: str
    assumptions: List[str]
    risks: List[str]
    duration_days: DurationEstimate
    dependencies: List[str]
    confidence: float = Field(..., ge=0, le=1)


class Metadata(BaseModel):
    model: Optional[str] = None
    generated_at: Optional[str] = None


class TaskReasoningOutput(BaseModel):
    tasks: List[Task] = Field(..., min_length=1)
    metadata: Optional[Metadata] = None


class TaskSchedule(BaseModel):
    id: str
    title: str
    start: date
    end: date
    earliest_start: int
    earliest_end: int
    latest_start: int
    latest_end: int
    slack: int
    critical: bool


class SchedulerInput(BaseModel):
    tasks: List[Task]
    start_date: str
    holidays: Optional[List[str]] = None
    weekend: Optional[List[int]] = None


class SchedulerOutput(BaseModel):
    schedules: List[TaskSchedule]
    critical_path: List[str]
    project_start: date
    project_end: date
    expected_calendar_days: float
    monte_carlo: Optional[Dict] = None


class CreatePlanRequest(BaseModel):
    goal: str
    constraints: Optional[str] = ""
    start_date: str = "2025-12-01"  # MUST be ISO
    weekend: Optional[List[int]] = [5, 6]
    holidays: Optional[List[str]] = []

class CreatePlanResponse(BaseModel):
    plan_id: str
    goal: str
    constraints: Optional[str]

class NegotiateRequest(BaseModel):
    deadline: Optional[str] = None  # ISO string (YYYY-MM-DD) or None
