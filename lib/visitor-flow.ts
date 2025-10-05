import { gameDatabase } from "./game-database"

export interface VisitorState {
  phase: "entrance" | "reception" | "booking" | "waiter_approaching" | "walking_to_table" | "at_table" | "seated" | "menu_requested" | "ordering" | "waiting" | "served" | "rating" | "complete"
  currentTable: number | null
  selectedTableSize: number | null
  currentOrder: {
    dish: string
    price: number
    orderTime: number
  } | null
  rating: number | null
  isAtReception: boolean
  isSeated: boolean
  proximityToNPC: string | null
  waiterApproached: boolean
  menuRequested: boolean
}

export interface TableData {
  id: number
  x: number
  z: number
  capacity: number
  isOccupied: boolean
  reservedBy: string | null
}

export interface OrderData {
  id: string
  dish: string
  price: number
  tableId: number
  orderTime: number
  status: "pending" | "cooking" | "ready" | "served"
  estimatedTime: number
}

export class VisitorFlowController {
  private state: VisitorState = {
    phase: "entrance",
    currentTable: null,
    selectedTableSize: null,
    currentOrder: null,
    rating: null,
    isAtReception: false,
    isSeated: false,
    proximityToNPC: null,
    waiterApproached: false,
    menuRequested: false
  }

  private tables: Map<number, TableData> = new Map()
  private orders: Map<string, OrderData> = new Map()
  private onStateChange?: (state: VisitorState) => void
  private onOrderUpdate?: (order: OrderData) => void
  private onReceptionMenuTrigger?: () => void

  constructor(
    onStateChange?: (state: VisitorState) => void, 
    onOrderUpdate?: (order: OrderData) => void,
    onReceptionMenuTrigger?: () => void
  ) {
    this.onStateChange = onStateChange
    this.onOrderUpdate = onOrderUpdate
    this.onReceptionMenuTrigger = onReceptionMenuTrigger
    this.initializeTables()
  }

  private initializeTables() {
    // Initialize table data from database
    const dbTables = gameDatabase.getTables()
    dbTables.forEach(table => {
      this.tables.set(table.id, {
        id: table.id,
        x: table.x,
        z: table.z,
        capacity: table.capacity,
        isOccupied: table.isOccupied,
        reservedBy: table.reservedBy
      })
    })
  }

  getState(): VisitorState {
    return { ...this.state }
  }

  getTables(): Map<number, TableData> {
    return new Map(this.tables)
  }

  getOrders(): Map<string, OrderData> {
    return new Map(this.orders)
  }

  // Phase transitions
  enterReception() {
    if (this.state.phase === "entrance") {
      this.state.phase = "reception"
      this.state.isAtReception = true
      this.notifyStateChange()
    }
  }

  startBooking(tableSize: number) {
    if (this.state.phase === "reception") {
      this.state.phase = "booking"
      this.state.selectedTableSize = tableSize
      this.notifyStateChange()
    }
  }

  assignTable(tableId: number) {
    // Reserve the table using database
    const success = gameDatabase.reserveTable(tableId, "visitor")
    if (success) {
      const table = this.tables.get(tableId)
      if (table) {
        table.isOccupied = true
        table.reservedBy = "visitor"
      }
      
      this.state.currentTable = tableId
      this.state.phase = "waiter_approaching"
      this.state.waiterApproached = true
      this.notifyStateChange()
      
      // Trigger waiter approach automatically after a brief delay
      setTimeout(() => {
        this.waiterApproached()
      }, 1000)
    }
  }

  // New method: Handle waiter approaching
  waiterApproached() {
    if (this.state.phase === "waiter_approaching") {
      this.state.phase = "walking_to_table"
      this.notifyStateChange()
    }
  }

  // New method: Handle reaching the table
  reachedTable() {
    if (this.state.phase === "walking_to_table") {
      this.state.phase = "at_table"
      this.notifyStateChange()
    }
  }

  // New method: Handle sitting down (J key)
  sitDown() {
    if (this.state.phase === "at_table") {
      this.state.phase = "seated"
      this.state.isSeated = true
      this.notifyStateChange()
    }
  }

  // New method: Handle menu request
  requestMenu() {
    if (this.state.phase === "seated") {
      this.state.phase = "menu_requested"
      this.state.menuRequested = true
      this.notifyStateChange()
      
      // Automatically transition to ordering phase after a brief delay
      setTimeout(() => {
        this.menuShown()
      }, 1500)
    }
  }

  // New method: Handle menu shown
  menuShown() {
    if (this.state.phase === "menu_requested") {
      this.state.phase = "ordering"
      this.notifyStateChange()
    }
  }

  seatAtTable() {
    if (this.state.phase === "walking_to_table") {
      this.state.phase = "seated"
      this.state.isSeated = true
      this.notifyStateChange()
    }
  }

  startOrdering() {
    if (this.state.phase === "seated") {
      this.state.phase = "ordering"
      this.notifyStateChange()
    }
  }

  placeOrder(items: { name: string; quantity: number; price: number }[]) {
    if (this.state.phase === "ordering" && this.state.currentTable) {
      // Create order in database
      const order = gameDatabase.createOrder(this.state.currentTable, items)
      if (order) {
        const orderId = order.id
        const orderData: OrderData = {
          id: orderId,
          dish: items.map(item => `${item.quantity}x ${item.name}`).join(", "),
          price: items.reduce((sum, item) => sum + item.price, 0),
          tableId: this.state.currentTable,
          orderTime: Date.now(),
          status: "pending",
          estimatedTime: order.estimatedTime
        }

        this.orders.set(orderId, orderData)
        this.state.currentOrder = { 
          dish: orderData.dish, 
          price: orderData.price, 
          orderTime: orderData.orderTime 
        }
        this.state.phase = "waiting"
        this.notifyStateChange()
        this.notifyOrderUpdate(orderData)
      }
    }
  }

  updateOrderStatus(orderId: string, status: OrderData["status"]) {
    const order = this.orders.get(orderId)
    if (order) {
      order.status = status
      this.notifyOrderUpdate(order)

      if (status === "served" && this.state.currentOrder?.dish === order.dish) {
        this.state.phase = "served"
        this.notifyStateChange()
      }
    }
  }

  submitRating(rating: number) {
    if (this.state.phase === "served") {
      this.state.rating = rating
      this.state.phase = "complete"
      this.notifyStateChange()
    }
  }

  // Utility methods
  private getEstimatedCookingTime(dish: string): number {
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

  findAvailableTable(tableSize: number): TableData | null {
    for (const table of this.tables.values()) {
      if (!table.isOccupied && table.capacity >= tableSize) {
        return table
      }
    }
    return null
  }

  checkProximityToNPC(playerPosition: { x: number; y: number; z: number }): string | null {
    const npcPositions = {
      receptionist: { x: -8, z: 10 },
      waiter: { x: 3, z: -8 }
    }

    for (const [npcId, pos] of Object.entries(npcPositions)) {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - pos.x, 2) + 
        Math.pow(playerPosition.z - pos.z, 2)
      )
      
      if (distance < 3) {
        return npcId
      }
    }

    return null
  }

  checkProximityToTable(playerPosition: { x: number; y: number; z: number }): number | null {
    for (const table of this.tables.values()) {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - table.x, 2) + 
        Math.pow(playerPosition.z - table.z, 2)
      )
      
      if (distance < 2 && table.id === this.state.currentTable) {
        return table.id
      }
    }

    return null
  }

  // Check if visitor is at reception
  checkReceptionProximity(playerPosition: { x: number; y: number; z: number }): boolean {
    const receptionPosition = { x: 0, y: 0, z: -8 }
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - receptionPosition.x, 2) + 
      Math.pow(playerPosition.z - receptionPosition.z, 2)
    )
    
    if (distance < 3 && this.state.phase === "reception") {
      if (this.onReceptionMenuTrigger) {
        this.onReceptionMenuTrigger()
      }
      return true
    }
    
    return false
  }

  // Check if visitor is at their assigned table
  checkTableProximity(playerPosition: { x: number; y: number; z: number }): boolean {
    if (!this.state.currentTable) return false

    const tablePositions = [
      { id: 1, x: -6, z: -6 },
      { id: 2, x: 6, z: -6 },
      { id: 3, x: -6, z: -1 },
      { id: 4, x: 6, z: -1 },
      { id: 5, x: -6, z: 4 },
      { id: 6, x: 6, z: 4 }
    ]
    
    const tablePos = tablePositions.find(t => t.id === this.state.currentTable)
    if (tablePos) {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - tablePos.x, 2) + 
        Math.pow(playerPosition.z - tablePos.z, 2)
      )
      
      if (distance < 3 && this.state.phase === "walking_to_table") {
        this.reachedTable()
        return true
      }
    }
    
    return false
  }

  reset() {
    this.state = {
      phase: "entrance",
      currentTable: null,
      selectedTableSize: null,
      currentOrder: null,
      rating: null,
      isAtReception: false,
      isSeated: false,
      proximityToNPC: null,
      waiterApproached: false,
      menuRequested: false
    }

    // Reset tables
    this.tables.forEach(table => {
      table.isOccupied = false
      table.reservedBy = null
    })

    this.orders.clear()
    this.notifyStateChange()
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  private notifyOrderUpdate(order: OrderData) {
    if (this.onOrderUpdate) {
      this.onOrderUpdate(order)
    }
  }
}
