import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { negotiatePlan } from "../api/plannerApi";

export default function Negotiation() {
  const { planId } = useParams();

  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleNegotiate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await negotiatePlan(planId, { deadline });
      setResult(res);
    } catch (err) {
      console.error(err);
      const errorMsg = err.message || "Negotiation failed. Check the deadline format (YYYY-MM-DD).";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen space-y-8">

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Negotiate Deadline</h1>

        <Link
          to={`/plan/${planId}`}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-900"
        >
          ⬅ Back to Plan
        </Link>
      </div>

      {/* Form */}
      <form
        onSubmit={handleNegotiate}
        className="bg-white shadow p-6 rounded-xl max-w-lg space-y-4"
      >
        <label className="block">
          <span className="font-semibold">Requested Deadline:</span>
          <input
            type="date"
            className="mt-2 p-2 border rounded w-full"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? "Checking…" : "Analyze Feasibility"}
        </button>

        {error && <p className="text-red-600 pt-2">{error}</p>}
      </form>

      {/* Results Section */}
      {result && (
        <div className="space-y-10">

          {/* Feasibility */}
          <div className="bg-white p-6 rounded-xl shadow space-y-2 border">
            <h2 className="text-2xl font-bold">Feasibility</h2>
            <p><b>Can meet deadline:</b> {result.feasibility.feasible ? "Yes" : "No"}</p>
            <p><b>Earliest possible:</b> {result.feasibility.earliest_end}</p>
            <p><b>Requested deadline:</b> {deadline}</p>
          </div>

          {/* Risk Hotspots */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-bold mb-3">Risk Hotspots</h2>

            {result.hotspots.length === 0 && <p>No major risks detected.</p>}

            <ul className="list-disc ml-6 space-y-1">
              {result.hotspots.map((h, i) => (
                <li key={i}>
                  <b>{h.task_id}:</b> {h.issue}
                </li>
              ))}
            </ul>
          </div>

          {/* Proposed Options */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-bold mb-3">Suggested Options</h2>

            {result.options.length === 0 && <p>No suggestions available.</p>}

            <ul className="list-disc ml-6 space-y-2">
              {result.options.map((o, i) => (
                <li key={i}>
                  <b>{o.type}:</b> {o.message}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
