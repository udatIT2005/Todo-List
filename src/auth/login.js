import { storage } from "../utils/storage.js";
import { redirectIfLoggedIn } from "../middleware/authGuard.js";

redirectIfLoggedIn();

const form = document.querySelector("#loginForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const email = fd.get("email");
  const password = fd.get("password");

  const users = storage.get("users") || [];
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) {
    alert("Sai email hoặc mật khẩu");
    return;
  }

  storage.set("currentUser", { id: u.id, name: u.name, email: u.email });
  window.location.href = "index.html";
});
