import { useState, useEffect } from "react";
import { createPlan, getSuggestions } from "../api/plannerApi";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [startDate, setStartDate] = useState("2025-12-01");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (goal.trim().length > 10) {
        fetchSuggestions();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [goal]);

  const fetchSuggestions = async () => {
    try {
      const result = await getSuggestions(goal);
      setSuggestions(result);
      setShowSuggestions(result.similar_plans.length > 0);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    }
  };

  const handleSubmit = async () => {
    if (!goal.trim()) {
      setError("Goal cannot be empty.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        goal,
        constraints,
        start_date: startDate,
        weekend: [5, 6],
        holidays: ["2025-12-25"],
      };

      const result = await createPlan(payload);

      window.location.href = `/plan/${result.plan_id}`;
    } catch (err) {
      setError("Failed to create plan. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center text-blue-700">
          🎯 Smart Task Planner
        </h1>
        <p className="text-center text-gray-600">AI-powered project planning with historical insights</p>

        {error && <div className="text-red-600 mt-4">{error}</div>}

        <div className="relative">
          <textarea
            className="w-full p-4 border rounded-lg"
            rows={4}
            placeholder="Enter your project goal... (AI will suggest similar projects)"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          
          {showSuggestions && suggestions && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">💡 AI Suggestions from {suggestions.statistics.total_plans} past projects:</h3>
              
              {suggestions.similar_plans.map((plan, idx) => (
                <div key={idx} className="mb-2 p-3 bg-white rounded border">
                  <p className="font-semibold text-sm">{plan.goal}</p>
                  <p className="text-xs text-gray-600">📅 {plan.duration_days} days • 📋 {plan.task_count} tasks</p>
                </div>
              ))}
              
              <p className="text-xs text-gray-500 mt-2">
                📊 Average: {Math.round(suggestions.statistics.avg_duration)} days, {Math.round(suggestions.statistics.avg_tasks)} tasks
              </p>
            </div>
          )}
        </div>

        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Constraints (optional)"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
        />

        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Start Date
          </label>
          <input
            type="date"
            className="p-3 border rounded-lg"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg hover:bg-blue-700 transition"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>
    </div>
  );
}
