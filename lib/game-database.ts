// Local Database System for DineVerse Game
export interface TableData {
  id: number
  x: number
  z: number
  capacity: number
  isOccupied: boolean
  reservedBy: string | null
  reservedAt: number | null
  currentOrder: string | null
}

export interface MenuItem {
  id: string
  name: string
  price: number
  available: number
  description: string
  category: "food" | "beverage"
  cookingTime: number // in minutes
}

export interface OrderData {
  id: string
  tableId: number
  items: { name: string; quantity: number; price: number }[]
  totalPrice: number
  status: "pending" | "cooking" | "ready" | "served" | "cancelled"
  orderTime: number
  estimatedTime: number
  assignedChef: string | null
}

export interface WaiterData {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  state: "idle" | "approaching" | "guiding" | "serving" | "busy"
  assignedTable: number | null
  currentTask: string | null
}

class GameDatabase {
  private tables: Map<number, TableData> = new Map()
  private menuItems: Map<string, MenuItem> = new Map()
  private orders: Map<string, OrderData> = new Map()
  private waiter: WaiterData
  private listeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeTables()
    this.initializeMenu()
    this.initializeWaiter()
  }

  private initializeTables() {
    const tablePositions = [
      { id: 1, x: -6, z: -6, capacity: 4 },
      { id: 2, x: 6, z: -6, capacity: 4 },
      { id: 3, x: -6, z: -1, capacity: 2 },
      { id: 4, x: 6, z: -1, capacity: 2 },
      { id: 5, x: -6, z: 4, capacity: 6 },
      { id: 6, x: 6, z: 4, capacity: 6 }
    ]

    tablePositions.forEach(table => {
      this.tables.set(table.id, {
        id: table.id,
        x: table.x,
        z: table.z,
        capacity: table.capacity,
        isOccupied: false,
        reservedBy: null,
        reservedAt: null,
        currentOrder: null
      })
    })
  }

  private initializeMenu() {
    const items: MenuItem[] = [
      {
        id: "burger",
        name: "Burger",
        price: 15,
        available: 5,
        description: "Juicy beef patty with fresh vegetables",
        category: "food",
        cookingTime: 8
      },
      {
        id: "pizza",
        name: "Pizza",
        price: 18,
        available: 5,
        description: "Classic margherita with mozzarella",
        category: "food",
        cookingTime: 12
      },
      {
        id: "cold_coffee",
        name: "Cold Coffee",
        price: 8,
        available: 10,
        description: "Refreshing iced coffee drink",
        category: "beverage",
        cookingTime: 3
      }
    ]

    items.forEach(item => {
      this.menuItems.set(item.id, item)
    })
  }

  private initializeWaiter() {
    this.waiter = {
      id: "waiter_1",
      name: "James",
      position: { x: 3, y: 0, z: -8 },
      state: "idle",
      assignedTable: null,
      currentTask: null
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Table management
  getTables(): TableData[] {
    return Array.from(this.tables.values())
  }

  getTable(id: number): TableData | null {
    return this.tables.get(id) || null
  }

  findAvailableTable(requiredCapacity: number): TableData | null {
    for (const table of this.tables.values()) {
      if (!table.isOccupied && table.capacity >= requiredCapacity) {
        return table
      }
    }
    return null
  }

  reserveTable(tableId: number, reservedBy: string): boolean {
    const table = this.tables.get(tableId)
    if (table && !table.isOccupied) {
      table.isOccupied = true
      table.reservedBy = reservedBy
      table.reservedAt = Date.now()
      this.emit('table-reserved', { table, reservedBy })
      return true
    }
    return false
  }

  releaseTable(tableId: number): boolean {
    const table = this.tables.get(tableId)
    if (table && table.isOccupied) {
      table.isOccupied = false
      table.reservedBy = null
      table.reservedAt = null
      table.currentOrder = null
      this.emit('table-released', { table })
      return true
    }
    return false
  }

  // Menu management
  getMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values())
  }

  getMenuItem(id: string): MenuItem | null {
    return this.menuItems.get(id) || null
  }

  checkAvailability(items: { name: string; quantity: number }[]): boolean {
    for (const item of items) {
      const menuItem = Array.from(this.menuItems.values()).find(m => m.name === item.name)
      if (!menuItem || menuItem.available < item.quantity) {
        return false
      }
    }
    return true
  }

  updateInventory(items: { name: string; quantity: number }[]): boolean {
    if (!this.checkAvailability(items)) {
      return false
    }

    for (const item of items) {
      const menuItem = Array.from(this.menuItems.values()).find(m => m.name === item.name)
      if (menuItem) {
        menuItem.available -= item.quantity
        this.emit('inventory-updated', { item: menuItem, quantity: item.quantity })
      }
    }
    return true
  }

  // Order management
  createOrder(tableId: number, items: { name: string; quantity: number; price: number }[]): OrderData | null {
    const table = this.tables.get(tableId)
    if (!table || table.isOccupied === false) {
      return null
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0)
    const estimatedTime = items.reduce((sum, item) => {
      const menuItem = Array.from(this.menuItems.values()).find(m => m.name === item.name)
      return sum + (menuItem ? menuItem.cookingTime * item.quantity : 0)
    }, 0)

    const order: OrderData = {
      id: orderId,
      tableId,
      items,
      totalPrice,
      status: "pending",
      orderTime: Date.now(),
      estimatedTime,
      assignedChef: null
    }

    this.orders.set(orderId, order)
    table.currentOrder = orderId
    this.emit('order-created', order)
    return order
  }

  getOrder(orderId: string): OrderData | null {
    return this.orders.get(orderId) || null
  }

  getOrdersByTable(tableId: number): OrderData[] {
    return Array.from(this.orders.values()).filter(order => order.tableId === tableId)
  }

  updateOrderStatus(orderId: string, status: OrderData["status"], assignedChef?: string): boolean {
    const order = this.orders.get(orderId)
    if (order) {
      order.status = status
      if (assignedChef) {
        order.assignedChef = assignedChef
      }
      this.emit('order-status-updated', { order, status })
      return true
    }
    return false
  }

  // Waiter management
  getWaiter(): WaiterData {
    return { ...this.waiter }
  }

  updateWaiterState(state: WaiterData["state"], assignedTable?: number, currentTask?: string): void {
    this.waiter.state = state
    if (assignedTable !== undefined) {
      this.waiter.assignedTable = assignedTable
    }
    if (currentTask !== undefined) {
      this.waiter.currentTask = currentTask
    }
    this.emit('waiter-state-updated', this.waiter)
  }

  updateWaiterPosition(position: { x: number; y: number; z: number }): void {
    this.waiter.position = position
    this.emit('waiter-position-updated', this.waiter)
  }

  // Utility methods
  getGameState() {
    return {
      tables: this.getTables(),
      menuItems: this.getMenuItems(),
      orders: Array.from(this.orders.values()),
      waiter: this.getWaiter()
    }
  }

  reset() {
    this.tables.clear()
    this.orders.clear()
    this.initializeTables()
    this.initializeMenu()
    this.initializeWaiter()
    this.emit('game-reset')
  }
}

// Singleton instance
export const gameDatabase = new GameDatabase()
