import { storage } from "../utils/storage.js";
import { redirectIfLoggedIn } from "../middleware/authGuard.js";
import { registerUser } from "../api/auth.js";

redirectIfLoggedIn();

const form = document.querySelector("#registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = fd.get("name");
  const email = fd.get("email");
  const password = fd.get("password");

  try {
    const created = await registerUser({ email, password, fullName: name, name });
    // API may return either the user object directly or nested; normalize fields
    const user = created?.user || created;
    const id = user?._id || user?.id || email; // fallback theo docs (register có thể không trả id)
    const displayName = user?.userName || user?.name || name || email;
    if (!id) throw new Error("Đăng ký thất bại");

    // Cleanup any previous todos cache for safety
    storage.remove(`todos_${id}`);

    // Auto login
    storage.set("currentUser", { id, name: displayName, email });
    window.location.href = "index.html";
  } catch (err) {
    alert(err?.message || "Đăng ký thất bại");
    console.error(err);
  }
});
