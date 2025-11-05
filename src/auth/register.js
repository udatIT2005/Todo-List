import { storage } from "../utils/storage.js";
import { redirectIfLoggedIn } from "../middleware/authGuard.js";

redirectIfLoggedIn();

const form = document.querySelector("#registerForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const user = {
    id: Date.now().toString(),
    name: fd.get("name"),
    email: fd.get("email"),
    password: fd.get("password"),
  };

  // lưu vào localStorage: danh sách users
  const users = storage.get("users") || [];
  if (users.find((u) => u.email === user.email)) {
    alert("Email đã được sử dụng");
    return;
  }
  users.push(user);
  storage.set("users", users);

  // tự động login sau đăng ký
  storage.set("currentUser", {
    id: user.id,
    name: user.name,
    email: user.email,
  });
  window.location.href = "index.html";
});
