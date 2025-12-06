import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlan, getGantt } from "../api/plannerApi";
import GanttChart from "../components/GanttChart";
import TaskCalendar from "../components/TaskCalendar";

export default function PlanView() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await getPlan(planId);
        const g = await getGantt(planId);

        setPlan(p);
        setTasks(g.tasks);
      } catch (e) {
        console.error("Plan load failed", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [planId]);

  if (loading) return <div className="p-10 text-xl">Loading…</div>;

  return (
    <div className="p-10 space-y-10 bg-gray-100 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold">📘 Project Plan</h1>
        <Link to={`/plan/${planId}/negotiate`} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow">
          Negotiate Deadline
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card"> 
          <h3>Critical Path</h3>
          <p>{plan.critical_path.join(" → ")}</p>
        </div>
        <div className="card">
          <h3>Start Date</h3>
          <p>{plan.project_start}</p>
        </div>
        <div className="card">
          <h3>End Date</h3>
          <p>{plan.project_end}</p>
        </div>
        <div className="card">
          <h3>Expected Days</h3>
          <p>{plan.expected_calendar_days}</p>
        </div>
      </div>

      {/* Gantt Chart */}
      <GanttChart tasks={tasks} />

      {/* Calendar */}
      <TaskCalendar tasks={tasks} />

      {/* Task Cards */}
      <div>
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {tasks.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-xl shadow border">
              <h3 className="text-xl font-bold">{t.name}</h3>
              <p><b>ID:</b> {t.id}</p>
              <p><b>Start:</b> {t.start}</p>
              <p><b>End:</b> {t.end}</p>
              <p><b>Dependencies:</b> {t.dependencies.join(", ") || "None"}</p>
              <p className={t.custom_class === "critical" ? "text-red-600 font-bold" : ""}>
                <b>Critical:</b> {t.custom_class === "critical" ? "Yes" : "No"}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
