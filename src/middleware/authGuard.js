import { storage } from "../utils/storage.js";

export function requireAuth() {
  const user = storage.get("currentUser");
  if (!user) {
    window.location.href = "login.html";
  }
}

export function redirectIfLoggedIn() {
  const user = storage.get("currentUser");
  if (user) {
    window.location.href = "index.html";
  }
}
