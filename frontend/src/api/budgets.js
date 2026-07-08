const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/budgets`;

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Request failed.");
  }
  return data;
}

export function getAllBudgets() {
  return fetch(BASE_URL).then(handleResponse);
}

export function getBudget(month) {
  return fetch(`${BASE_URL}/${month}`).then(handleResponse);
}

export function setBudget(month, amount) {
  return fetch(`${BASE_URL}/${month}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  }).then(handleResponse);
}
