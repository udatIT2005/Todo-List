import { tenantBase } from "../utils/config.js";
const BASE = `${tenantBase()}/todos`;

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function fetchTodos(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE}?${query}` : BASE;
  const res = await fetch(url);
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Lỗi lấy todo");
  // API trả { success, message, data: [...] }
  return j?.data || [];
}

export async function createTodo(payload) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Lỗi tạo todo");
  return j?.data;
}

export async function updateTodo(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Lỗi cập nhật todo");
  return j?.data;
}

export async function deleteTodo(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || "Lỗi xóa todo");
  return j?.data;
}
