import { tenantBase } from "../utils/config.js";
const BASE = `${tenantBase()}/auth`;

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function registerUser(payload) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Đăng ký thất bại");
  // Expected shape: { success, message, data: { _id, email, userName?, name? } }
  return j?.data;
}

export async function loginUser(credentials) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Đăng nhập thất bại");
  return j?.data;
}


