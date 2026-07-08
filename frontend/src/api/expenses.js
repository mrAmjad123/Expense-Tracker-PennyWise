const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/expenses`;

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.errors?.join(" ") || data?.error || "Request failed.";
    throw new Error(message);
  }
  return data;
}

export function getExpenses() {
  return fetch(BASE_URL).then(handleResponse);
}

export function getSummary(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return fetch(`${BASE_URL}/summary${query}`).then(handleResponse);
}

export function getCategories() {
  return fetch(`${BASE_URL}/categories`).then(handleResponse);
}

export function createExpense(payload) {
  return fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function updateExpense(id, payload) {
  return fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
}

export function deleteExpense(id) {
  return fetch(`${BASE_URL}/${id}`, { method: "DELETE" }).then(handleResponse);
}
