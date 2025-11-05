export const API_BASE = "https://api-class-o1lo.onrender.com/api";
export const TENANT = "todo";

export function tenantBase() {
  return `${API_BASE}/${TENANT}`;
}
