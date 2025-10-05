export interface FailsafeConfig {
  maxLatency: number
  retryAttempts: number
  timeoutDuration: number
  autoReconnect: boolean
  enableLocalPrediction: boolean
}

export interface ErrorState {
  type: "connection" | "order" | "table" | "chef_disconnect" | "visitor_leave" | "server_lag"
  message: string
  timestamp: number
  resolved: boolean
}

export class FailsafeManager {
  private config: FailsafeConfig = {
    maxLatency: 300,
    retryAttempts: 3,
    timeoutDuration: 5000,
    autoReconnect: true,
    enableLocalPrediction: true
  }

  private errors: ErrorState[] = []
  private retryCounters: Map<string, number> = new Map()
  private onError?: (error: ErrorState) => void
  private onRecovery?: (errorType: string) => void

  constructor(onError?: (error: ErrorState) => void, onRecovery?: (errorType: string) => void) {
    this.onError = onError
    this.onRecovery = onRecovery
  }

  // Connection failsafes
  handleConnectionLoss() {
    const error: ErrorState = {
      type: "connection",
      message: "Connection lost. Attempting to reconnect...",
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.attemptReconnection()
  }

  private attemptReconnection() {
    const retryKey = "connection"
    const attempts = this.retryCounters.get(retryKey) || 0
    
    if (attempts < this.config.retryAttempts) {
      this.retryCounters.set(retryKey, attempts + 1)
      
      setTimeout(() => {
        // Simulate reconnection attempt
        this.simulateReconnection()
      }, 2000)
    } else {
      this.addError({
        type: "connection",
        message: "Failed to reconnect after multiple attempts. Please refresh the page.",
        timestamp: Date.now(),
        resolved: false
      })
    }
  }

  private simulateReconnection() {
    // In a real implementation, this would attempt to reconnect to the socket
    const success = Math.random() > 0.3 // 70% success rate for demo
    
    if (success) {
      this.resolveError("connection")
      this.retryCounters.delete("connection")
    } else {
      this.attemptReconnection()
    }
  }

  // Order failsafes
  handleChefDisconnect(orderId: string) {
    const error: ErrorState = {
      type: "chef_disconnect",
      message: "Chef disconnected mid-order. Order canceled and refunded.",
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.cancelOrder(orderId)
  }

  handleVisitorLeave(orderId: string) {
    const error: ErrorState = {
      type: "visitor_leave",
      message: "Visitor left before food arrived. Order canceled.",
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.cancelOrder(orderId)
  }

  private cancelOrder(orderId: string) {
    // In a real implementation, this would notify the server to cancel the order
    console.log(`Order ${orderId} canceled due to player disconnect`)
    
    setTimeout(() => {
      this.resolveError("chef_disconnect")
      this.resolveError("visitor_leave")
    }, 2000)
  }

  // Server lag failsafes
  handleServerLag(latency: number) {
    if (latency > this.config.maxLatency) {
      const error: ErrorState = {
        type: "server_lag",
        message: `High latency detected (${latency}ms). Enabling local prediction mode.`,
        timestamp: Date.now(),
        resolved: false
      }
      
      this.addError(error)
      this.enableLocalPrediction()
    }
  }

  private enableLocalPrediction() {
    if (this.config.enableLocalPrediction) {
      console.log("Local prediction mode enabled")
      
      setTimeout(() => {
        this.resolveError("server_lag")
      }, 5000)
    }
  }

  // Table booking failsafes
  handleTableDoubleBooking(tableId: number, playerId: string) {
    const error: ErrorState = {
      type: "table",
      message: `Table ${tableId} double-booking detected. Resolving conflict...`,
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.resolveTableConflict(tableId, playerId)
  }

  private resolveTableConflict(tableId: number, playerId: string) {
    // Server-authoritative conflict resolution
    console.log(`Resolving table conflict for table ${tableId}, player ${playerId}`)
    
    setTimeout(() => {
      this.resolveError("table")
    }, 1000)
  }

  // Cooking timeout failsafes
  handleCookingTimeout(orderId: string) {
    const error: ErrorState = {
      type: "order",
      message: "Cooking timeout. Visitor gets free dish + chef penalty.",
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.handleTimeoutCompensation(orderId)
  }

  private handleTimeoutCompensation(orderId: string) {
    console.log(`Order ${orderId} timed out. Applying compensation.`)
    
    setTimeout(() => {
      this.resolveError("order")
    }, 2000)
  }

  // Conversation overlap failsafes
  handleConversationOverlap(npcId: string) {
    const error: ErrorState = {
      type: "order",
      message: `Conversation overlap detected for ${npcId}. Queueing dialogue.`,
      timestamp: Date.now(),
      resolved: false
    }
    
    this.addError(error)
    this.queueDialogue(npcId)
  }

  private queueDialogue(npcId: string) {
    console.log(`Queuing dialogue for ${npcId}`)
    
    setTimeout(() => {
      this.resolveError("order")
    }, 1000)
  }

  // Utility methods
  private addError(error: ErrorState) {
    this.errors.push(error)
    if (this.onError) {
      this.onError(error)
    }
  }

  private resolveError(type: string) {
    const error = this.errors.find(e => e.type === type && !e.resolved)
    if (error) {
      error.resolved = true
      if (this.onRecovery) {
        this.onRecovery(type)
      }
    }
  }

  getActiveErrors(): ErrorState[] {
    return this.errors.filter(e => !e.resolved)
  }

  getErrorHistory(): ErrorState[] {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
    this.retryCounters.clear()
  }

  // Configuration
  updateConfig(newConfig: Partial<FailsafeConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): FailsafeConfig {
    return { ...this.config }
  }
}
