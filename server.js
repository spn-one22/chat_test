import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

// for prometheus (ESM)
import client from 'prom-client';
const register = new client.Registry();
client.collectDefaultMetrics({ register });

//

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const DB_HOST = process.env.DB_HOST || "mysql";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "appuser";
const DB_PASSWORD = process.env.DB_PASSWORD || "appsecret";
const DB_NAME = process.env.DB_NAME || "messenger";

const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || "").trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
  connectionLimit: 10, waitForConnections: true
});

async function waitForDb() {
  let tries = 0;
  while (tries < 60) {
    try {
      const c = await pool.getConnection();
      await c.query("SELECT 1");
      c.release();
      console.log("DB is ready");
      return;
    } catch {
      tries++;
      console.log("Waiting for DB...", tries);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("MySQL not ready");
}

async function getUserById(id){
  const [rows] = await pool.query("SELECT id, login, role, banned FROM users WHERE id=?", [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

async function ensureAdmin() {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) return;
  const [rows] = await pool.query("SELECT id, role, banned FROM users WHERE login=?", [ADMIN_LOGIN]);
  if (!Array.isArray(rows) || rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query("INSERT INTO users(login, password, role, banned) VALUES(?, ?, 'admin', 0)", [ADMIN_LOGIN, hash]);
    console.log(`Admin user created: ${ADMIN_LOGIN}`);
  } else {
    await pool.query("UPDATE users SET role='admin', banned=0 WHERE login=?", [ADMIN_LOGIN]);
  }
}

async function requireNotBanned(userId){
  const u = await getUserById(userId);
  if (!u || u.banned) throw new Error("banned");
}

// auth middleware
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, message:"Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok:false, message:"Invalid token" });
  }
}

// admin middleware (check DB each time to honor role changes)
async function requireAdmin(req, res, next){
  const u = await getUserById(req.user.id);
  if (!u || u.role !== 'admin') return res.status(403).json({ ok:false, message:"admin only" });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "FinalChat AdminPanel" }));

// register
app.post("/api/auth/register", async (req, res) => {
  const { login, password } = req.body || {};
  if (typeof login !== "string" || login.trim().length < 3) return res.status(400).json({ ok:false, message:"login too short" });
  if (typeof password !== "string" || password.length < 6) return res.status(400).json({ ok:false, message:"password too short" });
  try {
    const [exists] = await pool.query("SELECT id FROM users WHERE login = ?", [login.trim()]);
    if (Array.isArray(exists) && exists.length > 0) return res.status(400).json({ ok:false, message:"login already taken" });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query("INSERT INTO users(login, password, role, banned) VALUES(?, ?, 'user', 0)", [login.trim(), hash]);
    return res.status(201).json({ ok:true, data:{ id: r.insertId, login: login.trim() } });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// login
app.post("/api/auth/login", async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) return res.status(400).json({ ok:false, message:"login and password required" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE login = ?", [login.trim()]);
    const user = Array.isArray(rows) && rows[0];
    if (!user) return res.status(400).json({ ok:false, message:"invalid credentials" });
    if (user.banned) return res.status(403).json({ ok:false, message:"user banned" });
    const okPass = await bcrypt.compare(password, user.password);
    if (!okPass) return res.status(400).json({ ok:false, message:"invalid credentials" });
    const role = user.role || 'user';
    const token = jwt.sign({ id: user.id, login: user.login, role }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ ok:true, data:{ token, role } });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// list messages
app.get("/api/messages", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.text, DATE_FORMAT(m.createdAt, '%Y-%m-%d %H:%i') as createdAt,
              u.id as authorId, u.login as authorLogin
       FROM messages m JOIN users u ON u.id = m.userId
       ORDER BY m.id DESC
       LIMIT 200`
    );
    return res.json({ ok:true, data: rows });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// create message
app.post("/api/messages", auth, async (req, res) => {
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ ok:false, message:"text required" });
  try {
    try { await requireNotBanned(req.user.id); } catch { return res.status(403).json({ ok:false, message:"banned" }); }
    const [r] = await pool.query("INSERT INTO messages(text, userId) VALUES(?,?)", [text, req.user.id]);
    const [rows] = await pool.query(
      "SELECT id, text, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') as createdAt FROM messages WHERE id = ?",
      [r.insertId]
    );
    return res.status(201).json({ ok:true, data: rows[0] });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// edit (PATCH) - admin or owner
app.patch("/api/messages/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const text = (req.body?.text || "").toString().trim();
  if (!id || !text) return res.status(400).json({ ok:false, message:"id and text required" });

  try {
    const [rows] = await pool.query("SELECT userId FROM messages WHERE id = ?", [id]);
    const msg = Array.isArray(rows) && rows[0];
    if (!msg) return res.status(404).json({ ok:false, message:"not found" });

    const u = await getUserById(req.user.id);
    const isOwner = msg.userId === req.user.id;
    const isAdmin = u && u.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ ok:false, message:"forbidden" });
    if (isOwner && u && u.banned) return res.status(403).json({ ok:false, message:"banned" });

    // берём имя пользователя (подстрой под то, как у тебя хранится)
    //const editorName = u?.name || u?.username || `user_${u?.id}`;
    const editorName = u.login;
    const newText = `${text} [edited by ${editorName}]`;

    await pool.query("UPDATE messages SET text = ? WHERE id = ?", [newText, id]);
    return res.json({ ok:true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// delete - admin or owner
app.delete("/api/messages/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok:false, message:"id required" });
  try {
    const [rows] = await pool.query("SELECT userId FROM messages WHERE id = ?", [id]);
    const msg = Array.isArray(rows) && rows[0];
    if (!msg) return res.status(404).json({ ok:false, message:"not found" });

    const u = await getUserById(req.user.id);
    const isOwner = msg.userId === req.user.id;
    const isAdmin = u && u.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ ok:false, message:"forbidden" });

    await pool.query("DELETE FROM messages WHERE id = ?", [id]);
    return res.status(204).end();
  } catch(e) {
    console.error(e);
    return res.status(500).json({ ok:false, message:"server error" });
  }
});

// --- Admin API ---
app.get("/api/admin/users", auth, requireAdmin, async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const where = q ? "WHERE u.login LIKE ?" : "";
  const params = q ? [`%${q}%`] : [];
  const [rows] = await pool.query(
    `SELECT u.id, u.login, u.role, u.banned, DATE_FORMAT(u.createdAt,'%Y-%m-%d %H:%i') as createdAt,
            (SELECT COUNT(*) FROM messages m WHERE m.userId=u.id) as messages
     FROM users u ${where}
     ORDER BY u.id DESC
     LIMIT 500`, params);
  res.json({ ok:true, data: rows });
});

app.patch("/api/admin/users/:id", auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok:false, message:"id required" });
  const { role, banned } = req.body || {};
  if (req.user.id === id && (banned === true || role === 'user')) {
    return res.status(400).json({ ok:false, message:"cannot demote/ban yourself" });
  }
  if (role && !['user','admin'].includes(role)) return res.status(400).json({ ok:false, message:"invalid role" });
  const parts = [];
  const vals = [];
  if (typeof banned === 'boolean') { parts.push("banned=?"); vals.push(banned ? 1 : 0); }
  if (role) { parts.push("role=?"); vals.push(role); }
  if (!parts.length) return res.status(400).json({ ok:false, message:"nothing to update" });
  vals.push(id);
  const sql = "UPDATE users SET " + parts.join(", ") + " WHERE id=?";
  await pool.query(sql, vals);
  res.json({ ok:true });
});

app.delete("/api/admin/users/:id", auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok:false, message:"id required" });
  if (req.user.id === id) return res.status(400).json({ ok:false, message:"cannot delete yourself" });
  await pool.query("DELETE FROM users WHERE id=?", [id]);
  res.status(204).end();
});

// static UI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/", express.static(path.join(__dirname, "public")));

await waitForDb();
await ensureAdmin();
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));

// add endpoint /metrics (for prometheus)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
//
