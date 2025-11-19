export const API_BASE = process.env.REACT_APP_API_BASE || "";

async function handleJSON(res) {
  const text = await res.text();
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

export async function signup({ name, email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const d = await handleJSON(res).catch(() => ({}));
    throw new Error(d.message || "Signup failed");
  }
  return handleJSON(res);
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const d = await handleJSON(res).catch(() => ({}));
    throw new Error(d.message || "Login failed");
  }
  return handleJSON(res);
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    // ignore
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const d = await handleJSON(res);
    if (d && d.authenticated) return { email: d.email, name: d.name, role: d.role };
    return null;
  } catch (e) {
    return null;
  }
}

export default { signup, login, logout, getCurrentUser };