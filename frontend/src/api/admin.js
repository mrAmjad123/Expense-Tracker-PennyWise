const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/admin`;

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.errors?.join(" ") || data?.error || "Request failed.";
    throw new Error(message);
  }
  return data;
}

export function getUsers() {
  return fetch(`${BASE_URL}/users`, { credentials: "include" }).then(handleResponse);
}

export function setSuspended(userId, suspended) {
  return fetch(`${BASE_URL}/users/${userId}/suspend`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ suspended }),
  }).then(handleResponse);
}

export function deleteUser(userId) {
  return fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  }).then(handleResponse);
}
