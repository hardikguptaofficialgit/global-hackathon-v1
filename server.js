const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  const rooms = new Map()

  io.on("connection", (socket) => {
    console.log("[Server] Player connected:", socket.id)

    socket.on("join-room", ({ roomId, role, username }) => {
      console.log("[Server] Player joining room:", roomId, role, username)

      let room = rooms.get(roomId)

      if (!room) {
        room = {
          id: roomId,
          players: new Map(),
          createdAt: Date.now(),
        }
        rooms.set(roomId, room)
      }

      if (room.players.size >= 2) {
        socket.emit("room-full")
        return
      }

      const roleExists = Array.from(room.players.values()).some((p) => p.role === role)
      if (roleExists) {
        socket.emit("role-taken")
        return
      }

      const playerData = {
        id: socket.id,
        role,
        position: role === "chef" ? { x: 0, y: 1.6, z: -8 } : { x: -8, y: 1.6, z: 10 },
        rotation: { x: 0, y: 0 },
        username,
      }

      room.players.set(socket.id, playerData)
      socket.join(roomId)

      const otherPlayers = Array.from(room.players.values()).filter((p) => p.id !== socket.id)
      socket.emit("room-joined", {
        roomId,
        playerData,
        otherPlayers,
      })

      socket.to(roomId).emit("player-joined", playerData)

      console.log("[Server] Room state:", roomId, "Players:", room.players.size)
    })

    socket.on("player-move", ({ roomId, position, rotation }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.get(socket.id)
      if (!player) return

      player.position = position
      player.rotation = rotation

      socket.to(roomId).emit("player-moved", {
        id: socket.id,
        position,
        rotation,
      })
    })

    socket.on("player-action", ({ roomId, action, data }) => {
      socket.to(roomId).emit("player-action", {
        playerId: socket.id,
        action,
        data,
      })
    })

    socket.on("disconnect", () => {
      console.log("[Server] Player disconnected:", socket.id)

      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id)
          socket.to(roomId).emit("player-left", socket.id)

          if (room.players.size === 0) {
            rooms.delete(roomId)
            console.log("[Server] Room deleted:", roomId)
          }
        }
      })
    })
  })

  server
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
