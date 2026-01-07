require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// INIT TABLES
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title TEXT,
      completed BOOLEAN DEFAULT false,
      due_date DATE
    )
  `);

  console.log("Tables ready");
})();

// TEST
app.get("/", (req, res) => {
  res.send("Task Manager Backend Running ✅");
});

// SIGNUP
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    await pool.query(
      "INSERT INTO users(username,password) VALUES($1,$2)",
      [username, password]
    );
    res.json({ message: "User created" });
  } catch {
    res.json({ message: "User already exists" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const r = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND password=$2",
    [username, password]
  );

  if (r.rows.length === 0) return res.json({ success: false });

  res.json({
    success: true,
    userId: r.rows[0].id
  });
});

// ADD TASK
app.post("/tasks", async (req, res) => {
  const { userId, title, dueDate } = req.body;
  await pool.query(
    "INSERT INTO tasks(user_id,title,due_date) VALUES($1,$2,$3)",
    [userId, title, dueDate]
  );
  res.json({ success: true });
});

// GET TASKS
app.get("/tasks/:uid", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id DESC",
    [req.params.uid]
  );
  res.json(r.rows);
});

// COMPLETE TASK
app.put("/tasks/:id/complete", async (req, res) => {
  await pool.query(
    "UPDATE tasks SET completed=true WHERE id=$1",
    [req.params.id]
  );
  res.json({ success: true });
});

// DELETE TASK
app.delete("/tasks/:id", async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
