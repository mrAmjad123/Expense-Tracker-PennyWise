const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/auth`;

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.errors?.join(" ") || data?.error || "Request failed.";
    throw new Error(message);
  }
  return data;
}

export function signup({ name, email, password, recaptchaToken }) {
  return fetch(BASE_URL + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password, recaptchaToken }),
  }).then(handleResponse);
}

export function login({ email, password, recaptchaToken }) {
  return fetch(BASE_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, recaptchaToken }),
  }).then(handleResponse);
}

export function logout() {
  return fetch(BASE_URL + "/logout", {
    method: "POST",
    credentials: "include",
  }).then(handleResponse);
}

export function getMe() {
  return fetch(BASE_URL + "/me", { credentials: "include" }).then(handleResponse);
}

export function changePassword({ currentPassword, newPassword }) {
  return fetch(BASE_URL + "/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(handleResponse);
}

export function deleteAccount({ currentPassword }) {
  return fetch(BASE_URL + "/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword }),
  }).then(handleResponse);
}

export function forgotPassword({ email }) {
  return fetch(BASE_URL + "/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).then(handleResponse);
}

export function resetPassword({ token, newPassword }) {
  return fetch(BASE_URL + "/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  }).then(handleResponse);
}

export function verifyOtp({ email, otp }) {
  return fetch(BASE_URL + "/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, otp }),
  }).then(handleResponse);
}

export function resendOtp({ email }) {
  return fetch(BASE_URL + "/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).then(handleResponse);
}
