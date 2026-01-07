const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Task Manager Backend is running");
});

// LOGIN (DEMO)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    return res.json({
      success: true,
      role: "admin",
      message: "Admin login successful"
    });
  }

  return res.json({
    success: true,
    role: "user",
    message: "User login successful"
  });
});

// ADD TASK (DEMO)
let tasks = [];

app.post("/tasks", (req, res) => {
  const task = req.body;
  task.id = tasks.length + 1;
  tasks.push(task);
  res.json({ success: true, task });
});

// GET TASKS
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

