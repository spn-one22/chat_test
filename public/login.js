console.log("login.js loaded");
const API_BASE = window.API_BASE || "";
const api = (p) => `${API_BASE}/api${p}`;

async function register() {
  const login = document.getElementById("regLogin").value.trim();
  const password = document.getElementById("regPass").value;
  const msg = document.getElementById("regMsg");
  msg.textContent = "";
  try {
    const r = await fetch(api("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });
    const j = await r.json();
    if (j.ok) msg.innerHTML = '<div class="ok">Аккаунт создан — можно войти</div>';
    else msg.innerHTML = `<div class="alert">${j.message || "Ошибка регистрации"}</div>`;
  } catch { msg.innerHTML = '<div class="alert">Ошибка сети</div>'; }
}

async function loginFn() {
  const login = document.getElementById("logLogin").value.trim();
  const password = document.getElementById("logPass").value;
  const msg = document.getElementById("logMsg");
  msg.textContent = "";
  try {
    const r = await fetch(api("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password })
    });
    const j = await r.json();
    if (j.ok) {
      localStorage.setItem("token", j.data.token);
      localStorage.setItem("login", login);
      localStorage.setItem("role", j.data.role || "user");
      window.location.href = "chat.html";
    } else {
      msg.innerHTML = `<div class="alert">${j.message || "Неверные данные"}</div>`;
    }
  } catch { msg.innerHTML = '<div class="alert">Ошибка сети</div>'; }
}

document.getElementById("btnRegister").onclick = register;
document.getElementById("btnLogin").onclick = loginFn;
