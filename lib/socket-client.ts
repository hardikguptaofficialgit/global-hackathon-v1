import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    // In development, connect to the Next.js dev server
    // In production, this would connect to your deployed server
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"

    socket = io(url, {
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("[v0] Connected to server:", socket?.id)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Disconnected from server")
    })

    socket.on("connect_error", (error) => {
      console.error("[v0] Connection error:", error)
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
