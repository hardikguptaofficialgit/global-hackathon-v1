export interface EventTiming {
  event: string
  delay: number
  description: string
  dependencies?: string[]
  autoTrigger?: boolean
}

export interface GameSession {
  startTime: number
  events: Map<string, EventTiming>
  completedEvents: Set<string>
  currentPhase: string
  onEventTrigger?: (event: string, data?: any) => void
}

export class EventTimingController {
  private session: GameSession
  private timers: Map<string, NodeJS.Timeout> = new Map()

  constructor(onEventTrigger?: (event: string, data?: any) => void) {
    this.session = {
      startTime: Date.now(),
      events: new Map(),
      completedEvents: new Set(),
      currentPhase: "entrance",
      onEventTrigger
    }
    
    this.initializeEventTiming()
  }

  private initializeEventTiming() {
    // Realistic order flow timing matrix
    const eventTimings: EventTiming[] = [
      {
        event: "visitor_enters_reception",
        delay: 0,
        description: "Visitor enters reception zone",
        autoTrigger: true
      },
      {
        event: "receptionist_greeting",
        delay: 0,
        description: "Receptionist greets visitor",
        dependencies: ["visitor_enters_reception"],
        autoTrigger: true
      },
      {
        event: "table_booking_popup",
        delay: 2000,
        description: "Show table booking popup",
        dependencies: ["receptionist_greeting"],
        autoTrigger: true
      },
      {
        event: "table_assigned",
        delay: 0,
        description: "Table assigned to visitor",
        dependencies: ["table_booking_popup"]
      },
      {
        event: "waiter_follow_to_table",
        delay: 5000,
        description: "Waiter leads visitor to table",
        dependencies: ["table_assigned"],
        autoTrigger: true
      },
      {
        event: "visitor_seated",
        delay: 1000,
        description: "Visitor sits at table",
        dependencies: ["waiter_follow_to_table"]
      },
      {
        event: "menu_popup",
        delay: 1000,
        description: "Menu popup appears",
        dependencies: ["visitor_seated"],
        autoTrigger: true
      },
      {
        event: "order_placed",
        delay: 0,
        description: "Order sent to kitchen",
        dependencies: ["menu_popup"]
      },
      {
        event: "chef_receives_order",
        delay: 500,
        description: "Chef receives order notification",
        dependencies: ["order_placed"],
        autoTrigger: true
      },
      {
        event: "cooking_starts",
        delay: 0,
        description: "Cooking timer begins",
        dependencies: ["chef_receives_order"]
      },
      {
        event: "cooking_progress_update",
        delay: 1000,
        description: "Update cooking progress",
        dependencies: ["cooking_starts"],
        autoTrigger: true
      },
      {
        event: "order_ready",
        delay: 0,
        description: "Order completed by chef",
        dependencies: ["cooking_starts"]
      },
      {
        event: "waiter_serves_food",
        delay: 2000,
        description: "Waiter serves food to visitor",
        dependencies: ["order_ready"],
        autoTrigger: true
      },
      {
        event: "rating_popup",
        delay: 2000,
        description: "Rating popup appears",
        dependencies: ["waiter_serves_food"],
        autoTrigger: true
      },
      {
        event: "session_complete",
        delay: 0,
        description: "Session ends",
        dependencies: ["rating_popup"]
      }
    ]

    eventTimings.forEach(event => {
      this.session.events.set(event.event, event)
    })
  }

  // Start the event timing sequence
  startSession() {
    this.session.startTime = Date.now()
    this.session.currentPhase = "entrance"
    this.session.completedEvents.clear()
    
    // Start with the first event
    this.triggerEvent("visitor_enters_reception")
  }

  // Trigger an event and schedule dependent events
  triggerEvent(eventId: string, data?: any) {
    const event = this.session.events.get(eventId)
    if (!event || this.session.completedEvents.has(eventId)) return

    // Mark event as completed
    this.session.completedEvents.add(eventId)
    
    // Trigger the event callback
    if (this.session.onEventTrigger) {
      this.session.onEventTrigger(eventId, data)
    }

    // Schedule dependent events
    this.scheduleDependentEvents(eventId)
    
    // Schedule auto-triggered events
    if (event.autoTrigger) {
      this.scheduleAutoTriggeredEvents(eventId)
    }

    console.log(`Event triggered: ${eventId} - ${event.description}`)
  }

  private scheduleDependentEvents(eventId: string) {
    for (const [id, event] of this.session.events) {
      if (event.dependencies?.includes(eventId) && !this.session.completedEvents.has(id)) {
        const delay = event.delay
        const timer = setTimeout(() => {
          this.triggerEvent(id)
          this.timers.delete(id)
        }, delay)
        
        this.timers.set(id, timer)
      }
    }
  }

  private scheduleAutoTriggeredEvents(eventId: string) {
    const event = this.session.events.get(eventId)
    if (!event) return

    // Find events that depend on this one and are auto-triggered
    for (const [id, dependentEvent] of this.session.events) {
      if (dependentEvent.dependencies?.includes(eventId) && 
          dependentEvent.autoTrigger && 
          !this.session.completedEvents.has(id)) {
        
        const delay = dependentEvent.delay
        const timer = setTimeout(() => {
          this.triggerEvent(id)
          this.timers.delete(id)
        }, delay)
        
        this.timers.set(id, timer)
      }
    }
  }

  // Manual event triggering (for user actions)
  triggerManualEvent(eventId: string, data?: any) {
    const event = this.session.events.get(eventId)
    if (!event) return

    // Check if all dependencies are met
    const dependenciesMet = event.dependencies?.every(dep => 
      this.session.completedEvents.has(dep)
    ) ?? true

    if (dependenciesMet) {
      this.triggerEvent(eventId, data)
    } else {
      console.warn(`Event ${eventId} cannot be triggered - dependencies not met`)
    }
  }

  // Update session phase
  updatePhase(newPhase: string) {
    this.session.currentPhase = newPhase
  }

  // Get current session state
  getSessionState() {
    return {
      currentPhase: this.session.currentPhase,
      completedEvents: Array.from(this.session.completedEvents),
      activeTimers: this.timers.size,
      sessionDuration: Date.now() - this.session.startTime
    }
  }

  // Check if event can be triggered
  canTriggerEvent(eventId: string): boolean {
    const event = this.session.events.get(eventId)
    if (!event) return false

    return event.dependencies?.every(dep => 
      this.session.completedEvents.has(dep)
    ) ?? true
  }

  // Get next available events
  getNextAvailableEvents(): string[] {
    const available: string[] = []
    
    for (const [id, event] of this.session.events) {
      if (!this.session.completedEvents.has(id) && this.canTriggerEvent(id)) {
        available.push(id)
      }
    }
    
    return available
  }

  // Reset session
  resetSession() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    
    // Reset session state
    this.session.startTime = Date.now()
    this.session.completedEvents.clear()
    this.session.currentPhase = "entrance"
  }

  // Cleanup
  destroy() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }

  // Utility methods
  getEventTiming(eventId: string): EventTiming | undefined {
    return this.session.events.get(eventId)
  }

  getAllEvents(): Map<string, EventTiming> {
    return new Map(this.session.events)
  }

  isEventCompleted(eventId: string): boolean {
    return this.session.completedEvents.has(eventId)
  }

  getSessionDuration(): number {
    return Date.now() - this.session.startTime
  }
}
