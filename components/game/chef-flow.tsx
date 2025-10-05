"use client"

import { useEffect, useState } from "react"
import { ChefFlowController, type ChefState } from "@/lib/chef-flow"
import { getSocket } from "@/lib/socket-client"

interface ChefFlowProps {
  role: "visitor" | "chef" | null
  roomId: string
  playerPosition: { x: number; y: number; z: number }
  onStateChange?: (state: ChefState) => void
  onOrderReceived?: (order: any) => void
}

export function ChefFlow({ role, roomId, playerPosition, onStateChange, onOrderReceived }: ChefFlowProps) {
  const [chefController] = useState(() => new ChefFlowController(onStateChange, onOrderReceived))
  const [chefState, setChefState] = useState<ChefState>(chefController.getState())
  const [showTutorial, setShowTutorial] = useState(false)

  const socket = getSocket()

  useEffect(() => {
    if (role !== "chef") return

    // Socket event listeners
    const handleOrderReceived = (data: { orderId: string; dish: string; tableId: number; estimatedTime: number; items: any[] }) => {
      chefController.receiveOrder({
        id: data.orderId,
        dish: data.dish,
        tableId: data.tableId,
        orderTime: Date.now(),
        estimatedTime: data.estimatedTime,
        ingredients: data.items || [], // Items from order
        difficulty: "medium" // Default difficulty
      })
      setChefState(chefController.getState())
    }

    const handleSessionEnded = (data: any) => {
      // Handle session end - could show stats
      console.log("Session ended:", data)
    }

    socket.on("order-received", handleOrderReceived)
    socket.on("session-ended", handleSessionEnded)

    return () => {
      socket.off("order-received", handleOrderReceived)
      socket.off("session-ended", handleSessionEnded)
    }
  }, [role, roomId, socket, chefController])

  useEffect(() => {
    if (role !== "chef") return

    // Check kitchen proximity
    const isInKitchen = chefController.checkKitchenProximity(playerPosition)
    
    if (isInKitchen && !chefState.isInKitchen) {
      chefController.enterKitchen()
      setChefState(chefController.getState())
      
      if (!chefState.tutorialCompleted) {
        setShowTutorial(true)
      }
    } else if (!isInKitchen && chefState.isInKitchen) {
      chefController.exitKitchen()
      setChefState(chefController.getState())
    }
  }, [playerPosition, role, chefState.isInKitchen, chefState.tutorialCompleted, chefController])

  useEffect(() => {
    if (role !== "chef" || chefState.phase !== "cooking") return

    // Update cooking progress
    const interval = setInterval(() => {
      chefController.updateCookingProgress(Date.now())
      setChefState(chefController.getState())
    }, 100)

    return () => clearInterval(interval)
  }, [role, chefState.phase, chefController])

  const handleTutorialComplete = () => {
    chefController.completeTutorial()
    setChefState(chefController.getState())
    setShowTutorial(false)
    
    // Notify server that chef is ready
    socket.emit("tutorial-completed", { roomId })
  }

  const handleStartCooking = () => {
    chefController.startCooking()
    setChefState(chefController.getState())
    
    // Update order status to cooking
    if (chefState.currentOrder) {
      socket.emit("order-status-update", {
        roomId,
        orderId: chefState.currentOrder.id,
        status: "cooking"
      })
    }
  }

  const handleServeOrder = () => {
    if (chefState.currentOrder) {
      const completionTime = Date.now() - chefState.currentOrder.orderTime
      const wasOnTime = completionTime <= (chefState.currentOrder.estimatedTime * 1000) // Convert to milliseconds
      
      chefController.serveOrder()
      setChefState(chefController.getState())
      
      // Emit order completion with timing
      socket.emit("order-completed", {
        roomId,
        orderId: chefState.currentOrder.id,
        completionTime,
        wasOnTime
      })
      
      // Update order status to served
      socket.emit("order-status-update", {
        roomId,
        orderId: chefState.currentOrder.id,
        status: "served"
      })
    }
  }

  if (role !== "chef") return null

  return (
    <>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-amber-500/40 rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200 mb-4 text-center">
              Chef Tutorial
            </h2>
            <div className="space-y-4 text-amber-100/80">
              <p>Welcome to the kitchen! Here's how to cook:</p>
              <ul className="space-y-2 text-sm">
                <li>• Use mouse to chop, mix, cook, and serve</li>
                <li>• Follow the recipe instructions carefully</li>
                <li>• Watch the timer - don't overcook!</li>
                <li>• Serve orders quickly to keep customers happy</li>
              </ul>
              <p className="text-center text-amber-200 font-semibold">
                Ready to start cooking?
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTutorialComplete}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300"
              >
                Start Cooking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Notification */}
      {chefState.currentOrder && chefState.phase === "cooking" && (
        <div className="fixed top-20 right-4 z-40 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-gradient-to-r from-red-600/95 to-red-500/95 backdrop-blur-md rounded-lg p-4 shadow-lg min-w-80">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">New Order!</h3>
                <span className="text-sm text-red-100">Table {chefState.currentOrder.tableId}</span>
              </div>
              
              <div>
                <p className="text-sm text-red-100 mb-2">{chefState.currentOrder.dish}</p>
                <div className="w-full bg-red-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${chefState.cookingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-red-100 mt-1">
                  Time remaining: {Math.ceil(chefState.timeRemaining)}s
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleStartCooking}
                  disabled={chefState.cookingProgress > 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Cooking
                </button>
                <button
                  onClick={handleServeOrder}
                  disabled={chefState.cookingProgress < 100}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Serve Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Indicators */}
      {chefState.phase === "waiting_for_order" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-green-600/95 to-green-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Waiting for orders... Go to the kitchen when ready!
            </p>
          </div>
        </div>
      )}

      {chefState.phase === "serving" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-blue-600/95 to-blue-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Order ready! Click "Serve Order" to complete
            </p>
          </div>
        </div>
      )}
    </>
  )
}
