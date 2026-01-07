const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================= USERS ================= */

// Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const check = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    if (check.rows.length > 0) {
      return res.json({ message: "User already exists" });
    }

    await pool.query(
      "INSERT INTO users(username,password) VALUES($1,$2)",
      [username, password]
    );
    res.json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND password=$2",
    [username, password]
  );
  if (result.rows.length === 0) {
    return res.json({ success: false });
  }
  res.json({ success: true, userId: result.rows[0].id });
});

/* ================= TASKS ================= */

// Add Task
app.post("/tasks", async (req, res) => {
  const { userId, title, dueDate } = req.body;
  await pool.query(
    "INSERT INTO tasks(user_id,title,due_date) VALUES($1,$2,$3)",
    [userId, title, dueDate]
  );
  res.json({ success: true });
});

// Get Tasks
app.get("/tasks/:userId", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id DESC",
    [req.params.userId]
  );
  res.json(result.rows);
});

// Update completed
app.put("/tasks/:id", async (req, res) => {
  await pool.query(
    "UPDATE tasks SET completed = NOT completed WHERE id=$1",
    [req.params.id]
  );
  res.json({ success: true });
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

app.get("/", (req, res) => {
  res.send("Task Manager Backend Running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
