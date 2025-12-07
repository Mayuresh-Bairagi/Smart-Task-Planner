import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlan, getGantt, updateTaskProgress, updatePlanDetails, updateTaskDetails, getProgressSummary } from "../api/plannerApi";
import GanttChart from "../components/GanttChart";
import TaskCalendar from "../components/TaskCalendar";
import { motion } from "framer-motion";

export default function PlanView() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editGoal, setEditGoal] = useState("");
  const [editConstraints, setEditConstraints] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [progressSummary, setProgressSummary] = useState(null);

  const loadData = async () => {
    try {
      const p = await getPlan(planId);
      const g = await getGantt(planId);
      const ps = await getProgressSummary(planId);
      console.log("Gantt Data:", g);

      setPlan(p);
      setTasks(g.tasks);
      setProgressSummary(ps);
    } catch (e) {
      console.error("Plan load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [planId]);

  const handleProgressUpdate = async (taskId, newProgress) => {
    setUpdating(taskId);
    try {
      await updateTaskProgress(planId, taskId, newProgress);
      await loadData();
    } catch (e) {
      console.error("Progress update failed", e);
      alert("Failed to update progress");
    } finally {
      setUpdating(null);
    }
  };

  const handlePlanUpdate = async () => {
    try {
      await updatePlanDetails(planId, editGoal, editConstraints);
      await loadData();
      setEditMode(false);
    } catch (e) {
      console.error("Plan update failed", e);
      alert("Failed to update plan");
    }
  };

  const startEdit = () => {
    setEditGoal(plan.goal || "");
    setEditConstraints(plan.constraints || "");
    setEditMode(true);
  };

  const startTaskEdit = (task) => {
    setEditingTask(task.id);
    setEditTaskName(task.name);
    setEditTaskDesc(task.description || "");
  };

  const handleTaskUpdate = async (taskId) => {
    try {
      await updateTaskDetails(planId, taskId, editTaskName, editTaskDesc);
      await loadData();
      setEditingTask(null);
    } catch (e) {
      console.error("Task update failed", e);
      alert("Failed to update task");
    }
  };

  if (loading) return <div className="p-10 text-xl">Loading…</div>;

  return (
    <div className="p-10 space-y-10 min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100">

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-white/40"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            📘 Project Plan Overview
          </h1>
          <div className="flex gap-3">
            <button
              onClick={startEdit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 transition text-white rounded-lg"
            >
              ✏️ Edit Plan
            </button>
            <Link 
              to={`/plan/${planId}/negotiate`}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl shadow-lg"
            >
              Negotiate Deadline
            </Link>
          </div>
        </div>

        {editMode && (
          <div className="mt-4 p-4 bg-white rounded-lg space-y-3">
            <div>
              <label className="block font-semibold mb-1">Goal:</label>
              <input
                type="text"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Constraints:</label>
              <input
                type="text"
                value={editConstraints}
                onChange={(e) => setEditConstraints(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlanUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                💾 Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!editMode && (
          <div className="mt-4 space-y-2">
            <p><b>Goal:</b> {plan.goal}</p>
            <p><b>Constraints:</b> {plan.constraints || "None"}</p>
          </div>
        )}
      </motion.div>

      {/* PROGRESS MONITOR */}
      {progressSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg text-white"
        >
          <h2 className="text-2xl font-bold mb-4">📊 Progress Monitor</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{progressSummary.avg_progress}%</p>
              <p className="text-sm">Overall</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{progressSummary.completed}</p>
              <p className="text-sm">✅ Done</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{progressSummary.in_progress}</p>
              <p className="text-sm">🔄 In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{progressSummary.not_started}</p>
              <p className="text-sm">⏳ Not Started</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Critical Path", value: plan.critical_path.join(" → "), color: "from-red-500 to-red-700" },
          { title: "Start Date", value: plan.project_start, color: "from-green-500 to-green-700" },
          { title: "End Date", value: plan.project_end, color: "from-blue-500 to-blue-700" },
          { title: "Expected Days", value: plan.expected_days || plan.expected_calendar_days || "N/A", color: "from-purple-500 to-purple-700" }
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

      {/* GANTT CHART */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/40"
      >
        <h2 className="text-2xl font-bold mb-4">📊 Timeline (Gantt Chart)</h2>
        <GanttChart tasks={tasks} holidays={plan.holidays || []} />
      </motion.div>

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
                {editingTask === t.id ? (
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    className="text-xl font-bold border-b-2 border-blue-500 flex-1 mr-2"
                  />
                ) : (
                  <h3 className="text-xl font-bold">{t.name}</h3>
                )}
                <div className="flex gap-2 items-center">
                  {editingTask === t.id ? (
                    <>
                      <button
                        onClick={() => handleTaskUpdate(t.id)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        💾
                      </button>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startTaskEdit(t)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      ✏️
                    </button>
                  )}
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
              </div>

              {editingTask === t.id ? (
                <textarea
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  rows={2}
                />
              ) : (
                t.description && <p className="text-gray-700 mb-2">{t.description}</p>
              )}
              <p><b>ID:</b> {t.id}</p>
              <p><b>Start:</b> {t.start}</p>
              <p><b>End:</b> {t.end}</p>
              <p><b>Dependencies:</b> {t.dependencies?.join(", ") || "None"}</p>
              {t.confidence && <p><b>Confidence:</b> {(t.confidence * 100).toFixed(0)}%</p>}
              {t.risks && <p className="text-red-600 text-sm mt-2"><b>Risks:</b> {t.risks}</p>}

              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">Progress: {t.progress}%</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={t.progress}
                    onChange={(e) => handleProgressUpdate(t.id, parseInt(e.target.value))}
                    disabled={updating === t.id}
                    className="w-32"
                  />
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all"
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
