from __future__ import annotations
from typing import List, Dict, Optional, Tuple, Iterable, Set
from pydantic import BaseModel, Field
from datetime import date, timedelta
import math
import random
import statistics
from collections import defaultdict

from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException
from model.model import Task, TaskSchedule, SchedulerOutput


class CalendarUtility:
    def __init__(self, logger):
        self.logger = logger

    def is_working_day(self, d: date, weekend: Iterable[int], holidays: Set[date]) -> bool:
        return (d.weekday() not in weekend) and (d not in holidays)

    def next_working_day(self, d: date, weekend: Iterable[int], holidays: Set[date]) -> date:
        while not self.is_working_day(d, weekend, holidays):
            d += timedelta(days=1)
        return d

    def add_working_days(self, start: date, n: int, weekend: Iterable[int], holidays: Set[date]) -> date:
        start = self.next_working_day(start, weekend, holidays)
        remaining = n - 1
        current = start

        while remaining > 0:
            current += timedelta(days=1)
            if self.is_working_day(current, weekend, holidays):
                remaining -= 1

        return current


class PERTScheduler:
    def __init__(self, tasks: List[Task], start_date: str,
                 weekend: Optional[List[int]] = None, holidays: Optional[List[str]] = None):
        try:
            self.logger = CustomLogger().get_logger(__file__)
            self.logger.info("Initializing PERTScheduler...")
            print(tasks)

            normalized = []
            for t in tasks:
                if isinstance(t, Task):
                    normalized.append(t)
                elif isinstance(t, dict):
                    normalized.append(Task(**t))
                else:
                    raise ValueError(f"Unsupported task type: {type(t)}")
                
            self.tasks: Dict[str, Task] = {t.id: t for t in normalized}

            self.start_date: date = date.fromisoformat(start_date)

            self.weekend = tuple(weekend) if weekend else (5, 6)
            self.holidays = {date.fromisoformat(h) for h in holidays} if holidays else set()

            self.cl = CalendarUtility(self.logger)

            self.order = self.topological_sort()

            self.logger.info("PERTScheduler initialized successfully.")

        except Exception as e:
            self.logger.error(f"Error initializing PERTScheduler: {e}")
            raise smartTaskPlannerException(f"Error initializing PERTScheduler: {e}")

    def topological_sort(self) -> List[str]:
        try:
            self.logger.info("Performing topological sort...")

            indeg = {tid: 0 for tid in self.tasks}

            for task in self.tasks.values():
                for dep in task.dependencies:
                    indeg[task.id] += 1

            q = [tid for tid, d in indeg.items() if d == 0]
            order = []

            while q:
                node = q.pop(0)
                order.append(node)
                for t in self.tasks.values():
                    if node in t.dependencies:
                        indeg[t.id] -= 1
                        if indeg[t.id] == 0:
                            q.append(t.id)

            if len(order) != len(self.tasks):
                raise ValueError("Dependency cycle detected.")

            self.logger.info(f"Topological sort completed: {order}")
            return order

        except Exception as e:
            self.logger.error(f"Topological sort failed: {e}")
            raise smartTaskPlannerException(f"Topological sort failed: {e}")

    def compute_forward_pass(self) -> Dict[str, Tuple[int, int]]:
        try:
            self.logger.info("Computing forward pass...")
            earliest = {}

            for tid in self.order:
                t = self.tasks[tid]
                duration = t.duration_days.working_days()

                es = 0 if not t.dependencies else max(earliest[d][1] + 1 for d in t.dependencies)
                ee = es + duration - 1
                earliest[tid] = (es, ee)

            self.logger.info("Forward pass completed.")
            return earliest

        except Exception as e:
            self.logger.error(f"Forward pass error: {e}")
            raise smartTaskPlannerException(f"Forward pass error: {e}")

    def compute_backward_pass(self, earliest: Dict[str, Tuple[int, int]]):
        try:
            self.logger.info("Computing backward pass...")

            latest = {}
            project_end = max(ee for es, ee in earliest.values())

            for tid in reversed(self.order):
                t = self.tasks[tid]
                duration = t.duration_days.working_days()
                children = [other.id for other in self.tasks.values() if tid in other.dependencies]

                if not children:
                    le = project_end
                else:
                    le = min(latest[ch][0] - 1 for ch in children)

                ls = le - duration + 1
                latest[tid] = (ls, le)

            self.logger.info("Backward pass completed.")
            return latest

        except Exception as e:
            self.logger.error(f"Backward pass error: {e}")
            raise smartTaskPlannerException(f"Backward pass error: {e}")

    def calendarize(self, earliest: Dict[str, Tuple[int, int]]):
        try:
            self.logger.info("Converting offsets to calendar dates...")

            schedule_calendar = {}

            for tid in self.order:
                es, ee = earliest[tid]
                duration = ee - es + 1

                start = self.start_date
                working_count = 0

                while working_count < es:
                    start += timedelta(days=1)
                    if self.cl.is_working_day(start, self.weekend, self.holidays):
                        working_count += 1

                end = self.cl.add_working_days(start, duration, self.weekend, self.holidays)

                schedule_calendar[tid] = (start, end)

            self.logger.info("Calendar mapping completed.")
            return schedule_calendar

        except Exception as e:
            self.logger.error(f"Calendar conversion error: {e}")
            raise smartTaskPlannerException(f"Calendar conversion error: {e}")

    def monte_carlo(self, n_samples: int = 2000):
        try:
            self.logger.info("Running Monte Carlo simulation...")

            project_lengths = []
            critical_counts = defaultdict(int)

            for _ in range(n_samples):
                sampled = {
                    tid: max(1, math.ceil(self.tasks[tid].duration_days.sample()))
                    for tid in self.tasks
                }
                sched = self.schedule_from_samples(sampled)

                start = self.start_date
                end = max(en for st, en in sched.values())
                length = (end - start).days + 1
                project_lengths.append(length)

                for tid, (_, en) in sched.items():
                    if en == end:
                        critical_counts[tid] += 1

            sorted_lengths = sorted(project_lengths)

            def pct(p): 
                idx = int(p * len(sorted_lengths))
                return sorted_lengths[min(idx, len(sorted_lengths)-1)]

            mc = {
                "mean_days": statistics.mean(project_lengths),
                "std_days": statistics.pstdev(project_lengths),
                "percentiles": {
                    "p10": pct(0.10),
                    "p25": pct(0.25),
                    "p50": pct(0.50),
                    "p75": pct(0.75),
                    "p90": pct(0.90),
                },
                "task_critical_fraction": {
                    tid: critical_counts[tid] / n_samples for tid in self.tasks
                },
                "samples": project_lengths
            }

            self.logger.info("Monte Carlo simulation completed.")
            return mc

        except Exception as e:
            self.logger.error(f"Monte Carlo failed: {e}")
            raise smartTaskPlannerException(f"Monte Carlo failed: {e}")

    def schedule_from_samples(self, sampled: Dict[str, int]):
        try:
            schedule = {}

            for tid in self.order:
                deps = self.tasks[tid].dependencies
                dur = sampled[tid]

                if not deps:
                    start = self.cl.next_working_day(self.start_date, self.weekend, self.holidays)
                else:
                    latest_dep_end = max(schedule[d][1] for d in deps)
                    candidate = latest_dep_end + timedelta(days=1)
                    start = self.cl.next_working_day(candidate, self.weekend, self.holidays)

                end = self.cl.add_working_days(start, dur, self.weekend, self.holidays)
                schedule[tid] = (start, end)

            return schedule

        except Exception as e:
            self.logger.error(f"Schedule simulation failed: {e}")
            raise smartTaskPlannerException(f"Schedule simulation failed: {e}")

    def run(self, run_monte_carlo=True) -> SchedulerOutput:
        try:
            self.logger.info("Running PERTScheduler...")

            earliest = self.compute_forward_pass()
            latest = self.compute_backward_pass(earliest)
            calendar_sched = self.calendarize(earliest)

            schedules: List[TaskSchedule] = []
            critical_path = []

            for tid in self.order:
                es, ee = earliest[tid]
                ls, le = latest[tid]
                slack = ls - es
                critical = (slack == 0)
                if critical:
                    critical_path.append(tid)

                start_date, end_date = calendar_sched[tid]

                schedules.append(TaskSchedule(
                    id=tid,
                    title=self.tasks[tid].title,
                    start=start_date,
                    end=end_date,
                    earliest_start=es,
                    earliest_end=ee,
                    latest_start=ls,
                    latest_end=le,
                    slack=slack,
                    critical=critical
                ))

            mc = self.monte_carlo() if run_monte_carlo else None

            project_end = max(s.end for s in schedules)
            expected_days = (project_end - self.start_date).days + 1

            self.logger.info("PERTScheduler completed successfully.")

            return SchedulerOutput(
                schedules=schedules,
                critical_path=critical_path,
                project_start=self.start_date,
                project_end=project_end,
                expected_calendar_days=expected_days,
                monte_carlo=mc
            )

        except Exception as e:
            self.logger.error(f"Scheduler run failure: {e}")
            raise smartTaskPlannerException(f"Scheduler run failure: {e}")
