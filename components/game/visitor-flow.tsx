"use client"

import { useEffect, useState } from "react"
import { VisitorFlowController, type VisitorState } from "@/lib/visitor-flow"
import { TableBookingPopup, MenuPopup, RatingPopup, OrderProgressPopup } from "@/components/ui/popup"
import { FoodMenuPopup } from "./food-menu-popup"
import { getSocket } from "@/lib/socket-client"

interface VisitorFlowProps {
  role: "visitor" | "chef" | null
  roomId: string
  playerPosition: { x: number; y: number; z: number }
  onStateChange?: (state: VisitorState) => void
  onReceptionMenuTrigger?: () => void
}

export function VisitorFlow({ role, roomId, playerPosition, onStateChange, onReceptionMenuTrigger }: VisitorFlowProps) {
  const [visitorController] = useState(() => {
    console.log("🎮 Initializing Visitor Controller")
    return new VisitorFlowController(onStateChange)
  })
  const [visitorState, setVisitorState] = useState<VisitorState>(visitorController.getState())
  const [showBookingPopup, setShowBookingPopup] = useState(false)
  const [showMenuPopup, setShowMenuPopup] = useState(false)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const [showFoodMenuPopup, setShowFoodMenuPopup] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<{ dish: string; progress: number; timeRemaining: number } | null>(null)

  const socket = getSocket()

  useEffect(() => {
    if (role !== "visitor") return

    // Socket event listeners
    const handleTableAssigned = (data: { tableId: number; position: { x: number; z: number } }) => {
      console.log("✅ Table assigned from server:", data.tableId)
      visitorController.assignTable(data.tableId)
      const newState = visitorController.getState()
      setVisitorState(newState)
      console.log("📊 Visitor state updated:", newState.phase, "Table:", newState.currentTable)
    }

    const handleTableUnavailable = (data: { message: string }) => {
      alert(data.message)
    }

    const handleOrderStatusChanged = (data: { orderId: string; status: string; dish: string }) => {
      visitorController.updateOrderStatus(data.orderId, data.status as any)
      setVisitorState(visitorController.getState())

      if (data.status === "served") {
        setCurrentOrder(null)
        setShowRatingPopup(true)
      }
    }

    // Keyboard event listener for M key to open menu
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyM" && visitorState.phase === "seated") {
        handleMenuRequest()
      }
    }

    socket.on("table-assigned", handleTableAssigned)
    socket.on("table-unavailable", handleTableUnavailable)
    socket.on("order-status-changed", handleOrderStatusChanged)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      socket.off("table-assigned", handleTableAssigned)
      socket.off("table-unavailable", handleTableUnavailable)
      socket.off("order-status-changed", handleOrderStatusChanged)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [role, roomId, socket, visitorController, visitorState.phase])

  useEffect(() => {
    if (role !== "visitor") return

    // Check door proximity for automatic entrance transition
    const doorCrossed = visitorController.checkDoorProximity(playerPosition)
    if (doorCrossed) {
      const newState = visitorController.getState()
      setVisitorState(newState)
      console.log("🚪 Door crossed, new phase:", newState.phase)
    }

    // Check proximity to NPCs and tables
    const proximityToNPC = visitorController.checkProximityToNPC(playerPosition)
    const proximityToTable = visitorController.checkProximityToTable(playerPosition)

    // Check if visitor is at reception desk and trigger menu
    const receptionDeskDistance = Math.sqrt(
      Math.pow(playerPosition.x - (-10), 2) + 
      Math.pow(playerPosition.z - 12, 2)
    )
    
    if (receptionDeskDistance < 5 && visitorState.phase === "reception" && onReceptionMenuTrigger) {
      console.log("📍 At reception desk, triggering menu")
      onReceptionMenuTrigger()
    }

    // Check if visitor is at their assigned table
    if (visitorState.currentTable && visitorState.phase === "walking_to_table") {
      const tablePositions = [
        { id: 1, x: -6, z: -6 },
        { id: 2, x: 6, z: -6 },
        { id: 3, x: -6, z: -1 },
        { id: 4, x: 6, z: -1 },
        { id: 5, x: -6, z: 4 },
        { id: 6, x: 6, z: 4 }
      ]
      
      const tablePos = tablePositions.find(t => t.id === visitorState.currentTable)
      if (tablePos) {
        const distance = Math.sqrt(
          Math.pow(playerPosition.x - tablePos.x, 2) + 
          Math.pow(playerPosition.z - tablePos.z, 2)
        )
        
        if (distance < 3) {
          console.log("🪑 Reached table", visitorState.currentTable)
          visitorController.reachedTable()
          const newState = visitorController.getState()
          setVisitorState(newState)
          console.log("📊 New phase:", newState.phase)
        }
      }
    }

    // Check if visitor is seated and ready to order
    if (visitorState.phase === "at_table") {
      // Visitor can sit down by pressing J key (handled in game scene)
    }

    // Handle menu request from game scene
    if (visitorState.phase === "menu_requested" && !showFoodMenuPopup) {
      setTimeout(() => {
        setShowFoodMenuPopup(true)
        visitorController.menuShown()
        setVisitorState(visitorController.getState())
      }, 1500)
    }
  }, [playerPosition, role, visitorState.phase, visitorState.currentTable, visitorController, onReceptionMenuTrigger, showFoodMenuPopup])

  const handleBookTable = (tableSize: number) => {
    visitorController.startBooking(tableSize)
    setVisitorState(visitorController.getState())
    
    // Emit booking request to server
    socket.emit("book-table", { roomId, tableSize })
  }

  const handleOrder = (dish: string, price: number) => {
    if (visitorState.currentTable) {
      visitorController.placeOrder(dish, price)
      setVisitorState(visitorController.getState())
      
      // Emit order to server
      socket.emit("place-order", { roomId, dish, price, tableId: visitorState.currentTable })
      
      // Start tracking order progress
      setCurrentOrder({
        dish,
        progress: 0,
        timeRemaining: visitorController.getOrders().get(visitorState.currentOrder?.dish || "")?.estimatedTime || 10
      })
    }
  }

  const handleRate = (rating: number) => {
    visitorController.submitRating(rating)
    setVisitorState(visitorController.getState())
    
    // Emit rating to server
    socket.emit("submit-rating", { roomId, rating })
  }

  // New handlers for waiter interaction flow
  const handleFoodOrder = (items: { name: string; quantity: number; price: number }[]) => {
    if (visitorState.currentTable && items.length > 0) {
      // Create order for each item
      items.forEach(item => {
        visitorController.placeOrder(item.name, item.price)
      })
      
      setVisitorState(visitorController.getState())
      setShowFoodMenuPopup(false)
      
      // Emit order to server
      socket.emit("place-order", { 
        roomId, 
        items: items.map(item => ({ dish: item.name, quantity: item.quantity, price: item.price })),
        tableId: visitorState.currentTable 
      })
      
      // Notify waiter about order placement
      const orderDetails = {
        dish: items.map(item => `${item.name} (${item.quantity})`).join(", "),
        tableId: visitorState.currentTable
      }
      
      // This would trigger waiter notification
      console.log("Order placed:", orderDetails)
      
      // Start tracking order progress
      const totalTime = items.reduce((total, item) => total + (item.quantity * 5), 0) // 5 minutes per item
      setCurrentOrder({
        dish: items.map(item => `${item.name} (${item.quantity})`).join(", "),
        progress: 0,
        timeRemaining: totalTime
      })
    }
  }

  const handleMenuRequest = () => {
    visitorController.requestMenu()
    setVisitorState(visitorController.getState())
    
    // Show the food menu popup after a brief delay to simulate waiter bringing menu
    setTimeout(() => {
      setShowFoodMenuPopup(true)
      visitorController.menuShown()
      setVisitorState(visitorController.getState())
    }, 1500)
  }

  // Update order progress
  useEffect(() => {
    if (!currentOrder) return

    const interval = setInterval(() => {
      setCurrentOrder(prev => {
        if (!prev) return null
        
        const newTimeRemaining = Math.max(prev.timeRemaining - 1, 0)
        const progress = ((10 - newTimeRemaining) / 10) * 100
        
        return {
          ...prev,
          progress,
          timeRemaining: newTimeRemaining
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentOrder])

  if (role !== "visitor") return null

  return (
    <>
      {/* Table Booking Popup */}
      <TableBookingPopup
        isOpen={showBookingPopup && visitorState.phase === "booking"}
        onClose={() => setShowBookingPopup(false)}
        onBookTable={handleBookTable}
      />

      {/* Menu Popup */}
      <MenuPopup
        isOpen={showMenuPopup && visitorState.phase === "ordering"}
        onClose={() => setShowMenuPopup(false)}
        onOrder={handleOrder}
      />

      {/* Rating Popup */}
      <RatingPopup
        isOpen={showRatingPopup}
        onClose={() => setShowRatingPopup(false)}
        onRate={handleRate}
      />

      {/* Order Progress */}
      <OrderProgressPopup
        isOpen={!!currentOrder && visitorState.phase === "waiting"}
        orderName={currentOrder?.dish || ""}
        progress={currentOrder?.progress || 0}
        timeRemaining={currentOrder?.timeRemaining || 0}
      />

      {/* Food Menu Popup */}
      <FoodMenuPopup
        isOpen={showFoodMenuPopup && (visitorState.phase === "ordering" || visitorState.phase === "menu_requested")}
        onClose={() => setShowFoodMenuPopup(false)}
        onOrder={handleFoodOrder}
        onMenuDisplayed={() => {
          // Notify waiter that menu is displayed
          console.log("Menu displayed to visitor")
        }}
      />

      {/* Phase Indicators */}
      {visitorState.phase === "entrance" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-gradient-to-r from-blue-600/95 to-blue-500/95 backdrop-blur-md rounded-lg px-8 py-4 shadow-2xl border border-blue-400/30">
            <p className="text-white font-bold text-xl text-center">
              🎉 Welcome to DineVerse!
            </p>
            <p className="text-blue-100 text-center mt-2">
              Approach the restaurant entrance.
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "reception" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-amber-600/95 to-amber-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Walk to Reception Desk
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "walking_to_table" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-green-600/95 to-green-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Follow the waiter to your table
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "waiter_approaching" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-blue-600/95 to-blue-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              The waiter is approaching...
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "at_table" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-green-600/95 to-green-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Press J to sit down
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "seated" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-purple-600/95 to-purple-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Press E to request the menu
            </p>
          </div>
        </div>
      )}

      {visitorState.phase === "menu_requested" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-gradient-to-r from-orange-600/95 to-orange-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              The waiter is bringing your menu...
            </p>
          </div>
        </div>
      )}

      {/* Table Allocation Display */}
      {visitorState.currentTable && (
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-gradient-to-r from-green-600/95 to-green-500/95 backdrop-blur-md rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <p className="text-white font-semibold text-sm">
                Table {visitorState.currentTable} - Reserved
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Key Hint */}
      {visitorState.phase === "seated" && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-gradient-to-r from-purple-600/95 to-purple-500/95 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg">
            <p className="text-white font-semibold text-center">
              Press M to open the menu
            </p>
          </div>
        </div>
      )}
    </>
  )
}
