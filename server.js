import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs-extra";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// === Data storage ===
const DATA_FILE = "./data.json";
await fs.ensureFile(DATA_FILE);

let data = { bossTimers: [], uniqueTimers: [] };

try {
  const content = await fs.readFile(DATA_FILE, "utf8");
  if (content.trim().length) data = JSON.parse(content);
  else await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
} catch (err) {
  console.error("⚠️ Error loading data.json:", err);
}

function saveData() {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    .then(() => console.log("💾 Data saved"))
    .catch((err) => console.error("❌ Save error:", err));
}

// === Serve frontend ===
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// endpoint for manual fetch
app.get("/data", (req, res) => {
  res.json(data);
});

// === Socket.io realtime sync ===
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Send current data to client immediately
  socket.emit("init", data);

  // Handle updates for field timers
  socket.on("updateField", (newTimers) => {
    data.bossTimers = newTimers;
    saveData();
    io.emit("updateField", data.bossTimers);
  });

  // Handle updates for unique timers
  socket.on("updateUnique", (newTimers) => {
    data.uniqueTimers = newTimers;
    saveData();
    io.emit("updateUnique", data.uniqueTimers);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// === Server startup ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
