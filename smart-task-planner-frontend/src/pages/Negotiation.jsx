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
        <div className="space-y-6">

          {/* AI Verdict */}
          <div className={`p-8 rounded-xl shadow-lg border-4 ${
            result.feasible 
              ? "bg-green-50 border-green-500" 
              : "bg-red-50 border-red-500"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold">
                {result.feasible ? "✅ Deadline Achievable" : "⚠️ Deadline Too Tight"}
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">AI Confidence</p>
                <p className="text-4xl font-bold text-blue-600">{result.confidence}%</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-lg">{result.analysis}</p>
            </div>

            {result.current_schedule && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Current End Date</p>
                  <p className="font-bold">{result.current_schedule.end}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Requested Deadline</p>
                  <p className="font-bold">{result.requested_deadline || "Not set"}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-bold">{result.current_schedule.duration_days} days</p>
                </div>
              </div>
            )}
          </div>

          {/* Risks */}
          {result.risks && result.risks.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="text-2xl font-bold mb-3 text-red-600">🚨 Key Risks</h2>
              <ul className="space-y-2">
                {result.risks.map((risk, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="text-2xl font-bold mb-3 text-blue-600">💡 AI Recommendations</h2>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start bg-blue-50 p-3 rounded">
                    <span className="text-blue-600 font-bold mr-2">{i + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative Deadline */}
          {result.alternative_deadline && (
            <div className="bg-yellow-50 p-6 rounded-xl shadow border-2 border-yellow-400">
              <h2 className="text-2xl font-bold mb-2 text-yellow-800">📅 Suggested Alternative</h2>
              <p className="text-lg">Earliest realistic completion: <span className="font-bold">{result.alternative_deadline}</span></p>
              {result.time_savings_possible && (
                <p className="text-sm text-gray-600 mt-2">💡 {result.time_savings_possible}</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
