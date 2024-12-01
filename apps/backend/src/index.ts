import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

app.use(express.static("public"));

interface Player {
  id: string;
  x: number;
  y: number;
  animationState?: string;
}

const players: Record<string, Player> = {};

io.on("connection", (socket) => {
  console.log(`User Connected : ${socket.id}`);

  socket.on("playerJoin", (playerData: Player) => {
    if (!players[socket.id]) {
      players[socket.id] = playerData;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });

  socket.on("movement", (playerData: Player & { animationState: string }) => {
    if (players[socket.id]) {
      players[socket.id] = {
        ...players[socket.id],
        x: playerData.x,
        y: playerData.y,
        animationState: playerData.animationState, // Update animation state
      };
      io.emit("updatePlayers", players); // Broadcast updated players
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
