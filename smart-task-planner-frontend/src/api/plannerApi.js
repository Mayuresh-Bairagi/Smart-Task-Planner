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
    throw new Error("Failed to fetch plan");
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
    throw new Error("Negotiation failed");
  }

  return res.json();
}
