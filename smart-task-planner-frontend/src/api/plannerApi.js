// src/api/plannerApi.js

const API = "http://localhost:8000";  // backend base URL

// ------------------ CREATE PLAN ------------------
export async function createPlan(data) {
  const res = await fetch(`${API}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Create Plan Error:", t);
    throw new Error("Failed to create plan");
  }

  return res.json();
}

// ------------------ GET PLAN ------------------
export async function getPlan(planId) {
  const res = await fetch(`${API}/plan/${planId}`);

  if (!res.ok) {
    const t = await res.text();
    console.error("Get Plan Error:", t);
    try {
      const errorData = JSON.parse(t);
      throw new Error(errorData.detail || "Failed to fetch plan");
    } catch {
      throw new Error(t || "Failed to fetch plan");
    }
  }

  return res.json();
}

// ------------------ GET GANTT DATA ------------------
export async function getGantt(planId) {
  const res = await fetch(`${API}/plan/${planId}/gantt`);

  if (!res.ok) {
    const t = await res.text();
    console.error("Get Gantt Error:", t);
    throw new Error("Failed to fetch Gantt data");
  }

  return res.json();
}

// ------------------ AI BATTLE MODE ------------------
export async function runAIBattle(goal, constraints) {
  const res = await fetch(`${API}/ai-battle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, constraints }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("AI Battle Error:", t);
    throw new Error("AI Battle failed");
  }

  return res.json();
}

// ------------------ UPDATE TASK DETAILS ------------------
export async function updateTaskDetails(planId, taskId, name, description) {
  const res = await fetch(`${API}/plan/${planId}/task/${taskId}/details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Update Task Details Error:", t);
    throw new Error("Failed to update task details");
  }

  return res.json();
}

// ------------------ GET PROGRESS SUMMARY ------------------
export async function getProgressSummary(planId) {
  const res = await fetch(`${API}/plan/${planId}/progress`);

  if (!res.ok) {
    const t = await res.text();
    console.error("Get Progress Summary Error:", t);
    throw new Error("Failed to get progress summary");
  }

  return res.json();
}

// ------------------ UPDATE PLAN DETAILS ------------------
export async function updatePlanDetails(planId, goal, constraints) {
  const res = await fetch(`${API}/plan/${planId}/details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, constraints }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Update Plan Details Error:", t);
    throw new Error("Failed to update plan details");
  }

  return res.json();
}

// ------------------ UPDATE TASK PROGRESS ------------------
export async function updateTaskProgress(planId, taskId, progress) {
  const res = await fetch(`${API}/plan/${planId}/task/${taskId}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Update Progress Error:", t);
    throw new Error("Failed to update progress");
  }

  return res.json();
}

// ------------------ GET AI SUGGESTIONS ------------------
export async function getSuggestions(goal) {
  const res = await fetch(`${API}/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Get Suggestions Error:", t);
    return { similar_plans: [], statistics: { total_plans: 0, avg_duration: 0, avg_tasks: 0 } };
  }

  return res.json();
}

// ------------------ NEGOTIATE DEADLINE ------------------
export async function negotiatePlan(planId, body) {
  const res = await fetch(`${API}/plan/${planId}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Negotiate Error:", t);
    try {
      const errorData = JSON.parse(t);
      throw new Error(errorData.detail || "Negotiation failed");
    } catch {
      throw new Error(t || "Negotiation failed");
    }
  }

  return res.json();
}
