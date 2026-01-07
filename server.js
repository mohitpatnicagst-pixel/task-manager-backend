require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// DATABASE CONNECTION
// =====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =====================
// INIT TABLES
// =====================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Tables ready");
}

initDB();

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.send("Task Manager Backend Running ✅");
});

// =====================
// SIGNUP
// =====================
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ message: "Username & password required" });
  }

  try {
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, password]
    );

    res.json({ message: "User created" });
  } catch (err) {
    res.json({ message: "User already exists" });
  }
});

// =====================
// LOGIN
// =====================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND password=$2",
    [username, password]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    userId: result.rows[0].id
  });
});

// =====================
// ADD TASK
// =====================
app.post("/tasks", async (req, res) => {
  const { userId, title } = req.body;

  if (!userId || !title) {
    return res.json({ success: false });
  }

  await pool.query(
    "INSERT INTO tasks (user_id, title) VALUES ($1, $2)",
    [userId, title]
  );

  res.json({ success: true });
});

// =====================
// GET TASKS (USER-WISE)
// =====================
app.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id DESC",
    [userId]
  );

  res.json(result.rows);
});

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
