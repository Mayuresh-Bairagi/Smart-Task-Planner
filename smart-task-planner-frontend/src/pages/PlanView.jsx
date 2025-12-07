import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlan, getGantt } from "../api/plannerApi";
import GanttChart from "../components/GanttChart";
import TaskCalendar from "../components/TaskCalendar";
import { motion } from "framer-motion";

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
        console.log("Gantt Data:", g);

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
    <div className="p-10 space-y-10 min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100">

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/40"
      >
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          📘 Project Plan Overview
        </h1>

        <Link 
          to={`/plan/${planId}/negotiate`}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl shadow-lg"
        >
          Negotiate Deadline
        </Link>
      </motion.div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Critical Path", value: plan.critical_path.join(" → "), color: "from-red-500 to-red-700" },
          { title: "Start Date", value: plan.project_start, color: "from-green-500 to-green-700" },
          { title: "End Date", value: plan.project_end, color: "from-blue-500 to-blue-700" },
          { title: "Expected Days", value: plan.expected_calendar_days, color: "from-purple-500 to-purple-700" }
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-xl shadow-lg text-white bg-gradient-to-br ${card.color}`}
          >
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* GANTT CHART
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/40"
      >
        <h2 className="text-2xl font-bold mb-4">📊 Timeline (Gantt Chart)</h2>
        <GanttChart tasks={tasks} />
      </motion.div> */}

      {/* CALENDAR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <TaskCalendar tasks={tasks} />
      </motion.div>

      {/* TASK CARDS */}
      <div>
        <h2 className="text-3xl font-bold mb-4">🧩 Task Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-xl shadow-lg border hover:shadow-2xl transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">{t.name}</h3>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    t.custom_class === "critical"
                      ? "bg-red-200 text-red-700"
                      : "bg-green-200 text-green-700"
                  }`}
                >
                  {t.custom_class === "critical" ? "Critical" : "Normal"}
                </span>
              </div>

              <p><b>ID:</b> {t.id}</p>
              <p><b>Start:</b> {t.start}</p>
              <p><b>End:</b> {t.end}</p>
              <p><b>Dependencies:</b> {t.dependencies?.join(", ") || "None"}</p>

              <div className="mt-3">
                <p className="font-semibold">Progress:</p>
                <div className="w-full bg-gray-200 h-3 rounded-full mt-1">
                  <div
                    className="h-3 rounded-full bg-blue-600"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
