import { storage } from "../utils/storage.js";
import { redirectIfLoggedIn } from "../middleware/authGuard.js";
import { loginUser } from "../api/auth.js";

redirectIfLoggedIn();

const form = document.querySelector("#loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const email = fd.get("email");
  const password = fd.get("password");

  try {
    const data = await loginUser({ email, password });
    // Normalize shape
    const user = data?.user || data;
    const id = user?._id || user?.id || email;
    const displayName = user?.userName || user?.name || email;
    if (!id) throw new Error("Sai email hoặc mật khẩu");

    // Lưu token (nếu có) để dùng cho các API cần xác thực
    const accessToken = data?.accessToken || data?.token;
    storage.set("currentUser", { id, name: displayName, email, accessToken });
    window.location.href = "index.html";
  } catch (err) {
    alert(err?.message || "Sai email hoặc mật khẩu");
    console.error(err);
  }
});
