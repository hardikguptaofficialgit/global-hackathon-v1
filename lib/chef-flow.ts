export interface ChefState {
  phase: "spawn" | "tutorial" | "waiting_for_order" | "cooking" | "serving" | "complete"
  currentOrder: {
    id: string
    dish: string
    tableId: number
    orderTime: number
    estimatedTime: number
  } | null
  cookingProgress: number
  timeRemaining: number
  score: number
  completedOrders: number
  isInKitchen: boolean
  tutorialCompleted: boolean
}

export interface OrderRequest {
  id: string
  dish: string
  tableId: number
  orderTime: number
  estimatedTime: number
  ingredients: string[]
  difficulty: "easy" | "medium" | "hard"
}

export class ChefFlowController {
  private state: ChefState = {
    phase: "spawn",
    currentOrder: null,
    cookingProgress: 0,
    timeRemaining: 0,
    score: 0,
    completedOrders: 0,
    isInKitchen: false,
    tutorialCompleted: false
  }

  private onStateChange?: (state: ChefState) => void
  private onOrderReceived?: (order: OrderRequest) => void
  private cookingStartTime = 0

  constructor(onStateChange?: (state: ChefState) => void, onOrderReceived?: (order: OrderRequest) => void) {
    this.onStateChange = onStateChange
    this.onOrderReceived = onOrderReceived
  }

  getState(): ChefState {
    return { ...this.state }
  }

  // Phase transitions
  startTutorial() {
    if (this.state.phase === "spawn") {
      this.state.phase = "tutorial"
      this.notifyStateChange()
    }
  }

  completeTutorial() {
    if (this.state.phase === "tutorial") {
      this.state.phase = "waiting_for_order"
      this.state.tutorialCompleted = true
      this.notifyStateChange()
    }
  }

  enterKitchen() {
    this.state.isInKitchen = true
    this.notifyStateChange()
  }

  exitKitchen() {
    this.state.isInKitchen = false
    this.notifyStateChange()
  }

  receiveOrder(order: OrderRequest) {
    if (this.state.phase === "waiting_for_order") {
      this.state.currentOrder = {
        id: order.id,
        dish: order.dish,
        tableId: order.tableId,
        orderTime: order.orderTime,
        estimatedTime: order.estimatedTime
      }
      this.state.phase = "cooking"
      this.state.timeRemaining = order.estimatedTime
      this.cookingStartTime = Date.now()
      this.notifyStateChange()
      this.notifyOrderReceived(order)
    }
  }

  startCooking() {
    if (this.state.phase === "cooking" && this.state.currentOrder) {
      this.cookingStartTime = Date.now()
      this.state.cookingProgress = 0
      this.notifyStateChange()
    }
  }

  updateCookingProgress(currentTime: number) {
    if (this.state.phase === "cooking" && this.state.currentOrder) {
      const elapsed = (currentTime - this.cookingStartTime) / 1000 // Convert to seconds
      const progress = Math.min((elapsed / this.state.currentOrder.estimatedTime) * 100, 100)
      
      this.state.cookingProgress = progress
      this.state.timeRemaining = Math.max(this.state.currentOrder.estimatedTime - elapsed, 0)

      if (progress >= 100) {
        this.completeCooking()
      }

      this.notifyStateChange()
    }
  }

  private completeCooking() {
    if (!this.state.currentOrder) return

    // Calculate score based on speed and accuracy
    const timeBonus = Math.max(0, this.state.currentOrder.estimatedTime - this.state.timeRemaining)
    const baseScore = this.getDishScore(this.state.currentOrder.dish)
    const earnedScore = baseScore + Math.floor(timeBonus * 10)

    this.state.score += earnedScore
    this.state.completedOrders += 1
    this.state.phase = "serving"
    this.notifyStateChange()
  }

  serveOrder() {
    if (this.state.phase === "serving") {
      this.state.currentOrder = null
      this.state.cookingProgress = 0
      this.state.timeRemaining = 0
      this.state.phase = "waiting_for_order"
      this.notifyStateChange()
    }
  }

  // Utility methods
  private getDishScore(dish: string): number {
    const scores: { [key: string]: number } = {
      "Pasta Carbonara": 100,
      "Grilled Steak": 150,
      "Caesar Salad": 80,
      "Tomato Soup": 120,
      "Gourmet Burger": 200,
      "Margherita Pizza": 180
    }
    return scores[dish] || 100
  }

  checkKitchenProximity(playerPosition: { x: number; y: number; z: number }): boolean {
    const kitchenPosition = { x: 0, z: -12 }
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - kitchenPosition.x, 2) + 
      Math.pow(playerPosition.z - kitchenPosition.z, 2)
    )
    return distance < 6
  }

  reset() {
    this.state = {
      phase: "spawn",
      currentOrder: null,
      cookingProgress: 0,
      timeRemaining: 0,
      score: 0,
      completedOrders: 0,
      isInKitchen: false,
      tutorialCompleted: false
    }
    this.cookingStartTime = 0
    this.notifyStateChange()
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  private notifyOrderReceived(order: OrderRequest) {
    if (this.onOrderReceived) {
      this.onOrderReceived(order)
    }
  }
}
