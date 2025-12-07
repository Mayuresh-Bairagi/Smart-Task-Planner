import { useState } from "react";
import { runAIBattle } from "../api/plannerApi";
import { motion } from "framer-motion";

export default function AIBattle() {
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  const handleBattle = async () => {
    if (!goal.trim()) return;
    
    setLoading(true);
    try {
      const result = await runAIBattle(goal, constraints);
      setBattleResult(result);
    } catch (err) {
      console.error(err);
      alert("Battle failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-red-900 to-orange-900 p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-10"
        >
          <h1 className="text-6xl font-black text-white mb-4">
            🔥 AI BATTLE MODE 🔥
          </h1>
          <p className="text-2xl text-orange-300">
            3 AI Models Compete • 1 Judge Decides • You Win
          </p>
        </motion.div>

        {/* Input Section */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl mb-8 border-2 border-orange-500">
          <textarea
            className="w-full p-4 rounded-lg bg-white/90 text-black mb-4"
            rows={3}
            placeholder="Enter your project goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          
          <input
            className="w-full p-3 rounded-lg bg-white/90 text-black mb-4"
            placeholder="Constraints (optional)"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />

          <button
            onClick={handleBattle}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-lg text-xl font-bold hover:from-orange-600 hover:to-red-700 transition transform hover:scale-105"
          >
            {loading ? "⚔️ BATTLE IN PROGRESS..." : "🚀 START AI BATTLE"}
          </button>
        </div>

        {/* Battle Results */}
        {battleResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Winner Announcement */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-2xl text-center border-4 border-yellow-300">
              <h2 className="text-4xl font-black text-white mb-2">
                🏆 WINNER: {battleResult.winner.winner?.toUpperCase()}
              </h2>
              <p className="text-xl text-white/90">
                Score: {battleResult.winner.scores?.[battleResult.winner.winner] || "N/A"}/100
              </p>
              <p className="text-white mt-4 text-lg">
                {battleResult.winner.reasoning}
              </p>
            </div>

            {/* All Competitors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(battleResult.battle_results).map(([model, plan]) => (
                <motion.div
                  key={model}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`p-6 rounded-xl border-4 ${
                    model === battleResult.winner.winner
                      ? "bg-yellow-500/20 border-yellow-400"
                      : "bg-white/10 border-white/30"
                  }`}
                >
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {model === battleResult.winner.winner ? "👑 " : ""}
                    {model.toUpperCase()}
                  </h3>
                  
                  {plan.error ? (
                    <p className="text-red-400">❌ Failed</p>
                  ) : (
                    <>
                      <p className="text-white/80 mb-2">
                        📅 Duration: {plan.total_duration} days
                      </p>
                      <p className="text-white/80 mb-2">
                        📋 Tasks: {plan.tasks?.length || 0}
                      </p>
                      <p className="text-white/80 mb-2">
                        💯 Confidence: {(plan.confidence_score * 100).toFixed(0)}%
                      </p>
                      <p className="text-orange-300 text-sm mt-3">
                        ✨ {plan.unique_approach}
                      </p>
                      
                      {/* Score */}
                      {battleResult.winner.scores?.[model] && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <p className="text-2xl font-bold text-yellow-400">
                            Score: {battleResult.winner.scores[model]}/100
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Judge's Analysis */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/30">
              <h3 className="text-2xl font-bold text-white mb-4">
                ⚖️ Judge's Analysis
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-orange-300 font-semibold">Strengths:</p>
                  <ul className="text-white/80 list-disc ml-6">
                    {battleResult.winner.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-orange-300 font-semibold">Improvements:</p>
                  <p className="text-white/80">{battleResult.winner.improvements}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
