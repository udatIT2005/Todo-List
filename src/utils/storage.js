// Lưu / đọc localStorage - sử dụng để quản lý user & session local
export const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};
