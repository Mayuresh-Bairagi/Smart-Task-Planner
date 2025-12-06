const BASE_URL = "http://localhost:8000";

export async function createPlan(data) {
  const res = await fetch(`${BASE_URL}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plan");
  return await res.json();
}

export async function getPlan(planId) {
  const res = await fetch(`${BASE_URL}/plan/${planId}`);
  if (!res.ok) throw new Error("Failed to fetch plan");
  return await res.json();
}

export async function getGantt(planId) {
  const res = await fetch(`${BASE_URL}/plan/${planId}/gantt`);
  if (!res.ok) throw new Error("Failed to fetch Gantt data");
  return await res.json();
}

export async function negotiatePlan(planId, data) {
  const res = await fetch(`${BASE_URL}/plan/${planId}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Negotiation failed");
  return await res.json();
}
