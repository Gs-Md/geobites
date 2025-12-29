export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:4000";

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

  const d = await handleJSON(res);

  if (!res.ok) {
    throw new Error(d.message || "Signup failed");
  }

  
  return d.user;
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const d = await handleJSON(res);

  if (!res.ok) {
    throw new Error(d.message || "Login failed");
  }

  
  return d.user;
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;

    const d = await handleJSON(res);
    if (d && d.authenticated) {
      return { email: d.email, name: d.name, role: d.role };
    }
    return null;
  } catch {
    return null;
  }
}

export default { signup, login, logout, getCurrentUser };