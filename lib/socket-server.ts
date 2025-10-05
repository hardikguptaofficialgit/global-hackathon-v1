import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

export interface OrderData {
  id: string
  dish: string
  price: number
  tableId: number
  orderTime: number
  status: "pending" | "cooking" | "ready" | "served"
  estimatedTime: number
}

export interface TableData {
  id: number
  x: number
  z: number
  capacity: number
  isOccupied: boolean
  reservedBy: string | null
}

export interface PlayerData {
  id: string
  role: "visitor" | "chef"
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number }
  username: string
}

export interface RoomData {
  id: string
  players: Map<string, PlayerData>
  orders: Map<string, OrderData>
  tables: Map<number, TableData>
  createdAt: number
}

const rooms = new Map<string, RoomData>()

function initializeRoomTables(room: RoomData) {
  const tablePositions = [
    { id: 1, x: -6, z: -6, capacity: 4 },
    { id: 2, x: 6, z: -6, capacity: 4 },
    { id: 3, x: -6, z: -1, capacity: 2 },
    { id: 4, x: 6, z: -1, capacity: 2 },
    { id: 5, x: -6, z: 4, capacity: 6 },
    { id: 6, x: 6, z: 4, capacity: 6 }
  ]

  tablePositions.forEach(table => {
    room.tables.set(table.id, {
      id: table.id,
      x: table.x,
      z: table.z,
      capacity: table.capacity,
      isOccupied: false,
      reservedBy: null
    })
  })
}

function getEstimatedCookingTime(dish: string): number {
  const cookingTimes: { [key: string]: number } = {
    "Pasta Carbonara": 8,
    "Grilled Steak": 10,
    "Caesar Salad": 5,
    "Tomato Soup": 12,
    "Gourmet Burger": 15,
    "Margherita Pizza": 18
  }
  return cookingTimes[dish] || 10
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[v0] Player connected:", socket.id)

    // Join or create room
    socket.on(
      "join-room",
      ({ roomId, role, username }: { roomId: string; role: "visitor" | "chef"; username: string }) => {
        console.log("[v0] Player joining room:", roomId, role, username)

        let room = rooms.get(roomId)

        if (!room) {
          room = {
            id: roomId,
            players: new Map(),
            orders: new Map(),
            tables: new Map(),
            createdAt: Date.now(),
          }
          rooms.set(roomId, room)
          initializeRoomTables(room)
        }

        // Check if room is full or role is taken
        if (room.players.size >= 2) {
          socket.emit("room-full")
          return
        }

        const roleExists = Array.from(room.players.values()).some((p) => p.role === role)
        if (roleExists) {
          socket.emit("role-taken")
          return
        }

        // Add player to room
        const playerData: PlayerData = {
          id: socket.id,
          role,
          position: role === "chef" ? { x: 0, y: 1.6, z: -8 } : { x: -8, y: 1.6, z: 10 },
          rotation: { x: 0, y: 0 },
          username,
        }

        room.players.set(socket.id, playerData)
        socket.join(roomId)

        // Send current players to new player
        const otherPlayers = Array.from(room.players.values()).filter((p) => p.id !== socket.id)
        socket.emit("room-joined", {
          roomId,
          playerData,
          otherPlayers,
        })

        // Notify others about new player
        socket.to(roomId).emit("player-joined", playerData)

        console.log("[v0] Room state:", roomId, "Players:", room.players.size)
      },
    )

    // Player movement
    socket.on(
      "player-move",
      ({
        roomId,
        position,
        rotation,
      }: { roomId: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number } }) => {
        const room = rooms.get(roomId)
        if (!room) return

        const player = room.players.get(socket.id)
        if (!player) return

        player.position = position
        player.rotation = rotation

        // Broadcast to other players in room
        socket.to(roomId).emit("player-moved", {
          id: socket.id,
          position,
          rotation,
        })
      },
    )

    // Player action (for interactions)
    socket.on("player-action", ({ roomId, action, data }: { roomId: string; action: string; data: any }) => {
      socket.to(roomId).emit("player-action", {
        playerId: socket.id,
        action,
        data,
      })
    })

    // Table booking
    socket.on("book-table", ({ roomId, tableSize }: { roomId: string; tableSize: number }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.get(socket.id)
      if (!player || player.role !== "visitor") return

      // Find available table
      let availableTable: TableData | null = null
      for (const table of room.tables.values()) {
        if (!table.isOccupied && table.capacity >= tableSize) {
          availableTable = table
          break
        }
      }

      if (availableTable) {
        availableTable.isOccupied = true
        availableTable.reservedBy = socket.id
        
        socket.emit("table-assigned", {
          tableId: availableTable.id,
          position: { x: availableTable.x, z: availableTable.z }
        })
        
        socket.to(roomId).emit("table-booked", {
          tableId: availableTable.id,
          playerId: socket.id
        })
      } else {
        socket.emit("table-unavailable", { message: "No tables available, please wait" })
      }
    })

    // Order placement
    socket.on("place-order", ({ roomId, items, tableId }: { roomId: string; items: { dish: string; quantity: number; price: number }[]; tableId: number }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.get(socket.id)
      if (!player || player.role !== "visitor") return

      const orderId = `order_${Date.now()}_${socket.id}`
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0)
      const estimatedTime = items.reduce((sum, item) => sum + (getEstimatedCookingTime(item.dish) * item.quantity), 0)
      
      const order: OrderData = {
        id: orderId,
        dish: items.map(item => `${item.quantity}x ${item.dish}`).join(", "),
        price: totalPrice,
        tableId,
        orderTime: Date.now(),
        status: "pending",
        estimatedTime
      }

      room.orders.set(orderId, order)
      
      // Notify chef
      const chef = Array.from(room.players.values()).find(p => p.role === "chef")
      if (chef) {
        socket.to(chef.id).emit("order-received", {
          orderId,
          dish: order.dish,
          tableId,
          estimatedTime: order.estimatedTime,
          items: items
        })
      }

      socket.emit("order-placed", { orderId })
    })

    // Order status updates
    socket.on("order-status-update", ({ roomId, orderId, status }: { roomId: string; orderId: string; status: OrderData["status"] }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const order = room.orders.get(orderId)
      if (!order) return

      order.status = status
      
      // Notify visitor
      const visitor = Array.from(room.players.values()).find(p => p.role === "visitor")
      if (visitor) {
        socket.to(visitor.id).emit("order-status-changed", {
          orderId,
          status,
          dish: order.dish
        })
      }

      if (status === "served") {
        room.orders.delete(orderId)
      }
    })

    // Rating submission
    socket.on("submit-rating", ({ roomId, rating }: { roomId: string; rating: number }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.get(socket.id)
      if (!player || player.role !== "visitor") return

      socket.to(roomId).emit("rating-submitted", {
        playerId: socket.id,
        rating
      })
    })

    // Chef tutorial completion
    socket.on("tutorial-completed", ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit("chef-ready", { playerId: socket.id })
    })

    // Visitor sitting down
    socket.on("visitor-sat-down", ({ roomId, tableId }: { roomId: string; tableId: number }) => {
      socket.to(roomId).emit("visitor-seated", { playerId: socket.id, tableId })
    })

    // Menu request
    socket.on("menu-requested", ({ roomId, tableId }: { roomId: string; tableId: number }) => {
      socket.to(roomId).emit("menu-request", { playerId: socket.id, tableId })
    })

    // Order completion with timing
    socket.on("order-completed", ({ roomId, orderId, completionTime, wasOnTime }: { roomId: string; orderId: string; completionTime: number; wasOnTime: boolean }) => {
      const room = rooms.get(roomId)
      if (!room) return

      const order = room.orders.get(orderId)
      if (!order) return

      order.status = "ready"
      
      // Notify visitor
      const visitor = Array.from(room.players.values()).find(p => p.role === "visitor")
      if (visitor) {
        socket.to(visitor.id).emit("order-ready", {
          orderId,
          dish: order.dish,
          wasOnTime,
          completionTime
        })
      }
    })

    // Session end
    socket.on("end-session", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (room) {
        // Save game stats
        const gameStats = {
          roomId,
          players: Array.from(room.players.values()),
          orders: Array.from(room.orders.values()),
          completedAt: Date.now()
        }
        
        // Emit session end to all players
        socket.to(roomId).emit("session-ended", gameStats)
        socket.emit("session-ended", gameStats)
        
        // Clean up room
        rooms.delete(roomId)
      }
    })

    // Disconnect
    socket.on("disconnect", () => {
      console.log("[v0] Player disconnected:", socket.id)

      // Remove player from all rooms
      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id)
          socket.to(roomId).emit("player-left", socket.id)

          // Clean up empty rooms
          if (room.players.size === 0) {
            rooms.delete(roomId)
            console.log("[v0] Room deleted:", roomId)
          }
        }
      })
    })
  })

  return io
}
