import { useState } from "react";
import { createPlan } from "../api/plannerApi";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [startDate, setStartDate] = useState("2025-12-01");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
          Smart Task Planner
        </h1>

        {error && <div className="text-red-600">{error}</div>}

        <textarea
          className="w-full p-4 border rounded-lg"
          rows={4}
          placeholder="Enter your project goal..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

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
