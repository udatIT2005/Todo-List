import { requireAuth } from "./middleware/authGuard.js";
import { storage } from "./utils/storage.js";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "./api/todo.js";

requireAuth();

const user = storage.get("currentUser");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");
const todoListEl = document.getElementById("todoList");
const todoForm = document.getElementById("todoForm");
const hideCompleted = document.getElementById("hideCompleted");
const sortByEl = document.getElementById("sortBy");

userLabel.textContent = user ? `Xin chào, ${user.name || user.email}` : "";

logoutBtn.addEventListener("click", () => {
  storage.remove("currentUser");
  window.location.href = "login.html";
});

let todosCache = [];

// Lấy todos từ localStorage theo userId
function getTodosForUser(userId) {
  const key = `todos_${userId}`;
  return storage.get(key) || [];
}

// Lưu todos vào localStorage theo userId
function saveTodosForUser(userId, todos) {
  const key = `todos_${userId}`;
  storage.set(key, todos);
}

async function loadAndRender() {
  if (!user || !user.id) {
    todosCache = [];
    renderList();
    return;
  }

  // Ưu tiên load từ localStorage của user hiện tại
  const localTodos = getTodosForUser(user.id);
  const hasLocalTodos = Array.isArray(localTodos) && localTodos.length > 0;

  if (hasLocalTodos) {
    todosCache = localTodos;
    renderList();
  } else {
    todosCache = [];
    renderList();
  }

  try {
    const todos = await fetchTodos({ ownerEmail: user.email });
    const todosArray = Array.isArray(todos) ? todos : [];
    const filtered = todosArray.filter((t) => {
      const ownerId =
        t.ownerId ||
        t.userId ||
        t.user_id ||
        t.createdById ||
        t.owner ||
        t.user?.id ||
        t.user?._id;
      const ownerEmail = t.ownerEmail || t.email || t.user?.email;
      return ownerId === user.id || ownerEmail === user.email;
    });

    // Cập nhật localStorage và hiển thị
    saveTodosForUser(user.id, filtered);
    todosCache = filtered;
    renderList();
  } catch (err) {
    console.error(err);
  }
}

function renderList() {
  let list = [...todosCache];

  // hide completed
  if (hideCompleted.checked) {
    list = list.filter((t) => !t.isCompleted && t.completed !== true);
  }

  // sort
  const sortBy = sortByEl.value;
  list.sort((a, b) => {
    if (sortBy === "priority") return (a.priority || 0) - (b.priority || 0);
    if (sortBy === "dueDate")
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    if (sortBy === "createdAt")
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  todoListEl.innerHTML = list.map(todoToHtml).join("");
  attachListEvents();
}

function todoToHtml(t) {
  const id = t._id || t.id || "";
  const name = escapeHtml(t.name || t.title || "");
  const pr = t.priority ?? "";
  const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "";
  const done = t.isCompleted || t.completed;
  return `
    <li class="todo-item" data-id="${id}">
      <div class="todo-left">
        <input type="checkbox" class="toggle-complete" ${
          done ? "checked" : ""
        }/>
        <div>
          <div><strong>${name}</strong></div>
          <div class="todo-meta">Ưu tiên: ${pr} • Hạn: ${due}</div>
        </div>
      </div>
      <div class="todo-actions">
        <button class="btn btn-sm btn-edit" data-id="${id}">Sửa</button>
        <button class="btn btn-sm btn-delete" data-id="${id}">Xóa</button>
      </div>
    </li>
  `;
}

function attachListEvents() {
  document.querySelectorAll(".toggle-complete").forEach((chk) => {
    chk.onchange = async (e) => {
      const li = e.target.closest("li.todo-item");
      const id = li.dataset.id;
      const todo = todosCache.find((t) => (t._id || t.id) === id);
      if (!todo) return;
      const payload = {
        ...todo,
        isCompleted: e.target.checked,
        ownerId: user?.id,
        ownerEmail: user?.email,
      };
      try {
        await updateTodo(id, payload);
        todo.isCompleted = e.target.checked;
        if (user && user.id) {
          saveTodosForUser(user.id, todosCache);
        }
        renderList();
      } catch (err) {
        alert("Cập nhật thất bại");
        console.error(err);
      }
    };
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.onclick = async (e) => {
      const id = e.target.dataset.id;
      if (!confirm("Bạn có chắc muốn xóa?")) return;
      try {
        await deleteTodo(id);
        todosCache = todosCache.filter((t) => (t._id || t.id) !== id);
        if (user && user.id) {
          saveTodosForUser(user.id, todosCache);
        }
        renderList();
      } catch (err) {
        alert("Xóa thất bại");
        console.error(err);
      }
    };
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.onclick = (e) => {
      const id = e.target.dataset.id;
      const todo = todosCache.find((t) => (t._id || t.id) === id);
      if (!todo) return;
      todoForm.name.value = todo.name || "";
      todoForm.dueDate.value = todo.dueDate ? todo.dueDate.split("T")[0] : "";
      todoForm.priority.value = todo.priority ?? "1";
      todoForm.dataset.editId = id;
      todoForm.querySelector("button[type='submit']").textContent = "Cập nhật";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = todoForm.name.value.trim();
  const dueDate = todoForm.dueDate.value || null;
  const priority = Number(todoForm.priority.value || 1);
  if (!name) return alert("Nhập tên công việc");

  const editId = todoForm.dataset.editId;
  if (editId) {
    // update
    const todo = todosCache.find((t) => (t._id || t.id) === editId);
    if (!todo) return alert("Không tìm thấy todo để cập nhật");
    const payload = {
      ...todo,
      name,
      dueDate,
      priority,
      ownerId: user?.id,
      ownerEmail: user?.email,
    };
    try {
      await updateTodo(editId, payload);
      // reload list
      await loadAndRender();
      resetForm();
    } catch (err) {
      alert("Cập nhật thất bại");
      console.error(err);
      // Cập nhật local cache nếu API lỗi
      const todo = todosCache.find((t) => (t._id || t.id) === editId);
      if (todo && user && user.id) {
        Object.assign(todo, payload);
        saveTodosForUser(user.id, todosCache);
        renderList();
      }
    }
    return;
  }

  const payload = {
    name,
    description: "",
    priority,
    dueDate,
    ownerId: user?.id,
    ownerEmail: user?.email,
  };
  try {
    const created = await createTodo(payload);
    await loadAndRender();
    resetForm();
  } catch (err) {
    alert("Tạo todo thất bại");
    console.error(err);
    await loadAndRender();
  }
});

function resetForm() {
  todoForm.reset();
  delete todoForm.dataset.editId;
  todoForm.querySelector("button[type='submit']").textContent = "Thêm";
}

hideCompleted.onchange = renderList;
sortByEl.onchange = renderList;

loadAndRender();
