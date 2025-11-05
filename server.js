import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs-extra";
import cors from "cors";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const DATA_FILE = "./data.json";

// Ensure file exists
await fs.ensureFile(DATA_FILE);
let data = { bossTimers: [], uniqueTimers: [] };

try {
  const content = await fs.readFile(DATA_FILE, "utf8");
  if (content) data = JSON.parse(content);
} catch (err) {
  console.log("Init file error:", err);
}

function saveData() {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Serve frontend
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/data", (req, res) => res.json(data));

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("init", data);

  socket.on("updateField", (newTimers) => {
    data.bossTimers = newTimers;
    saveData();
    io.emit("updateField", data.bossTimers);
  });

  socket.on("updateUnique", (newTimers) => {
    data.uniqueTimers = newTimers;
    saveData();
    io.emit("updateUnique", data.uniqueTimers);
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("✅ Server running on port", PORT));
