console.log("admin.js loaded");
const API_BASE = window.API_BASE || "";
const api = (p) => `${API_BASE}/api${p}`;

const state = {
  token: localStorage.getItem("token") || "",
  role: localStorage.getItem("role") || "user",
};

if (state.role !== 'admin') {
  alert("Доступ только для админа"); window.location.href = "/"; throw new Error("forbidden");
}

async function fetchUsers(q=""){
  const url = q ? api(`/admin/users?q=${encodeURIComponent(q)}`) : api("/admin/users");
  const r = await fetch(url, { headers:{ "Authorization": `Bearer ${state.token}` }});
  if (r.status === 403) { alert("Требуются права администратора"); window.location.href="/"; return []; }
  const j = await r.json();
  return j.ok ? j.data : [];
}

function render(users){
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";
  document.getElementById("hint").textContent = `Найдено: ${users.length}`;
  users.forEach(u => {
    const tr = document.createElement("tr");
    const roleBadge = `<span class="badge ${u.role==='admin'?'ok':''}">${u.role}</span>`;
    const statusBadge = `<span class="badge ${u.banned?'danger':'ok'}">${u.banned?'banned':'active'}</span>`;
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${escapeHtml(u.login)}</td>
      <td>${roleBadge}</td>
      <td>${statusBadge}</td>
      <td>${u.messages}</td>
      <td>${u.createdAt}</td>
      <td class="actions">
        <button data-act="toggle-role" data-id="${u.id}" class="secondary" type="button">${u.role==='admin'?'Сделать user':'Сделать admin'}</button>
        <button data-act="toggle-ban" data-id="${u.id}" class="${u.banned?'secondary':'danger'}" type="button">${u.banned?'Разбанить':'Забанить'}</button>
        <button data-act="delete" data-id="${u.id}" class="danger" type="button">Удалить</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function patchUser(id, body){
  const r = await fetch(api(`/admin/users/${id}`), {
    method:"PATCH",
    headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${state.token}` },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) alert(j.message||"Ошибка");
  return r.ok;
}

async function deleteUser(id){
  const r = await fetch(api(`/admin/users/${id}`), {
    method:"DELETE",
    headers:{ "Authorization": `Bearer ${state.token}` }
  });
  if (r.status === 400) { const j=await r.json().catch(()=>({})); alert(j.message||"Ошибка"); return false; }
  if (!r.ok) { alert("Ошибка"); return false; }
  return true;
}

document.getElementById("tbody").addEventListener("click", async (e)=>{
  const btn = e.target.closest("button"); if (!btn) return;
  const id = Number(btn.getAttribute("data-id"));
  const act = btn.getAttribute("data-act");
  if (act === "toggle-role") {
    const makeAdmin = btn.textContent.includes("admin");
    if (makeAdmin) { await patchUser(id, { role:"admin" }); }
    else { await patchUser(id, { role:"user" }); }
  } else if (act === "toggle-ban") {
    const ban = btn.textContent.includes("Забанить");
    await patchUser(id, { banned: ban });
  } else if (act === "delete") {
    if (confirm("Удалить пользователя? Все его сообщения тоже удалятся.")) {
      await deleteUser(id);
    }
  }
  await run();
});

document.getElementById("btnSearch").onclick = async ()=>{
  await run(document.getElementById("q").value.trim());
};

function escapeHtml(s){ return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function run(q=""){
  const users = await fetchUsers(q);
  render(users);
}

run();
