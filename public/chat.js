console.log("chat.js loaded");
const API_BASE = window.API_BASE || "";
const api = (p) => `${API_BASE}/api${p}`;

const state = {
  token: localStorage.getItem("token") || "",
  login: localStorage.getItem("login") || "",
  role: localStorage.getItem("role") || "user"
};

function updateWho(){
  document.getElementById("who").textContent = state.token
    ? `Вошли как: ${state.login}${state.role==='admin'?' (admin)':''}`
    : "Гость (только чтение)";
  const link = document.getElementById("adminLink");
  if (state.role === 'admin') link.style.display = "inline-block";
}

async function loadMessages() {
  try {
    const r = await fetch(api("/messages"));
    const j = await r.json();
    const list = document.getElementById("list");
    list.innerHTML = "";
    if (j.ok && Array.isArray(j.data)) {
      j.data.forEach(m => {
        const el = document.createElement("div");
        el.className = "msg";
        const canEdit = state.token && (state.role === 'admin' || state.login === m.authorLogin);
        el.innerHTML = `
          <div style="grid-column: 1 / span 1">
            <div style="margin-bottom:6px">${escapeHtml(m.text)}</div>
            <div class="muted">#${m.id} • ${m.createdAt} • ${m.authorLogin}</div>
          </div>
          <div class="actions">
            <button ${canEdit?"":"disabled"} data-edit="${m.id}" title="Редактировать" type="button">✏️</button>
            <button ${canEdit?"":"disabled"} data-del="${m.id}" title="Удалить" type="button">🗑️</button>
          </div>
        `;
        list.appendChild(el);
      });
      list.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", e => {
        const id = Number(e.currentTarget.getAttribute("data-edit"));
        const parent = e.currentTarget.closest(".msg");
        const old = parent.querySelector("div > div").textContent;
        editMessage(id, old);
      }));
      list.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", e => {
        const id = Number(e.currentTarget.getAttribute("data-del"));
        deleteMessage(id);
      }));
    }
  } catch (e) {
    console.error("loadMessages error", e);
  }
}

async function sendMessage() {
  const inp = document.getElementById("msgText");
  const text = inp.value.trim();
  if (!text) return;
  if (!state.token) { alert("Чтобы писать, войдите на странице входа."); return; }
  try {
    const r = await fetch(api("/messages"), {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${state.token}` },
      body: JSON.stringify({ text })
    });
    const j = await r.json();
    if (j.ok) { inp.value=""; await loadMessages(); }
    else { alert(j.message || "Ошибка"); }
  } catch { alert("Ошибка сети"); }
}

async function editMessage(id, oldText) {
  if (!state.token) return;
  const text = prompt("Изменить сообщение:", oldText);
  if (text === null) return;
  try {
    const r = await fetch(api(`/messages/${id}`), {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${state.token}` },
      body: JSON.stringify({ text })
    });
    if (r.status === 403) { alert("Нет прав (или вы забанены)"); return; }
    if (r.ok) await loadMessages(); else { const j=await r.json().catch(()=>({})); alert(j.message||"Ошибка"); }
  } catch { alert("Ошибка сети"); }
}

async function deleteMessage(id) {
  if (!state.token) return;
  if (!confirm("Удалить сообщение?")) return;
  try {
    const r = await fetch(api(`/messages/${id}`), {
      method:"DELETE",
      headers:{ "Authorization": `Bearer ${state.token}` }
    });
    if (r.status === 403) { alert("Нет прав"); return; }
    if (r.status === 204) { await loadMessages(); return; }
    const j = await r.json().catch(()=>({}));
    if (!r.ok) alert(j.message || "Ошибка");
  } catch { alert("Ошибка сети"); }
}

function escapeHtml(s){ return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

document.getElementById("btnSend").onclick = sendMessage;
document.getElementById("btnRefresh").onclick = loadMessages;

updateWho();
loadMessages();
