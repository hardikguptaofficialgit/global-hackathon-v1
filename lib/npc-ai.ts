import { gameDatabase } from "./game-database"
import { getGeminiAI } from "./gemini-ai"

// Only import THREE on client side
let THREE: any = null
if (typeof window !== 'undefined') {
  THREE = require('three')
}

export interface NPCDialogue {
  text: string
  duration: number
  timestamp: number
}

export interface NPCState {
  id: string
  name: string
  type: "waiter" | "receptionist"
  position: any // THREE.Vector3
  targetPosition: any | null // THREE.Vector3 | null
  currentDialogue: NPCDialogue | null
  state: "idle" | "moving" | "interacting" | "busy" | "approaching_visitor" | "guiding_to_table" | "waiting_for_seat"
  lastInteraction: number
  aiState: "AI_IDLE" | "AI_BUSY" | "WAITING_FOR_CHEF" | "WAITING_FOR_ORDER" | "APPROACHING_VISITOR" | "GUIDING_TO_TABLE" | "WAITING_FOR_SEAT"
  conversationQueue: NPCDialogue[]
  proximityTrigger: boolean
  assignedTableId?: number
  visitorPosition?: any // THREE.Vector3
}

export class NPCAIController {
  private npcs: Map<string, NPCState> = new Map()
  private moveSpeed = 1.5

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeNPCs()
    }
  }

  private initializeNPCs() {
    if (!THREE) return

    // Initialize Waiter NPC
    this.npcs.set("waiter", {
      id: "waiter",
      name: "Waiter",
      type: "waiter",
      position: new THREE.Vector3(3, 0, -8),
      targetPosition: null,
      currentDialogue: null,
      state: "idle",
      lastInteraction: 0,
      aiState: "AI_IDLE",
      conversationQueue: [],
      proximityTrigger: false,
    })

    // Initialize Receptionist NPC
    this.npcs.set("receptionist", {
      id: "receptionist",
      name: "Receptionist",
      type: "receptionist",
      position: new THREE.Vector3(-8, 0, 10),
      targetPosition: null,
      currentDialogue: null,
      state: "idle",
      lastInteraction: 0,
      aiState: "AI_IDLE",
      conversationQueue: [],
      proximityTrigger: false,
    })
  }

  getNPCs(): Map<string, NPCState> {
    return this.npcs
  }

  getNPC(id: string): NPCState | undefined {
    return this.npcs.get(id)
  }

  update(delta: number, currentTime: number) {
    this.npcs.forEach((npc) => {
      // Update dialogue expiration
      if (npc.currentDialogue && currentTime - npc.currentDialogue.timestamp > npc.currentDialogue.duration) {
        npc.currentDialogue = null
      }

      // Update movement
      if (npc.state === "moving" && npc.targetPosition) {
        const direction = new THREE.Vector3().subVectors(npc.targetPosition, npc.position).normalize()

        const distance = npc.position.distanceTo(npc.targetPosition)

        if (distance < 0.1) {
          npc.position.copy(npc.targetPosition)
          npc.targetPosition = null
          npc.state = "idle"
        } else {
          npc.position.add(direction.multiplyScalar(this.moveSpeed * delta))
        }
      }

      // AI behavior based on type
      if (npc.type === "waiter") {
        this.updateWaiterBehavior(npc, currentTime)
      } else if (npc.type === "receptionist") {
        this.updateReceptionistBehavior(npc, currentTime)
      }
    })
  }

  private updateWaiterBehavior(npc: NPCState, currentTime: number) {
    // Waiter patrols between tables and kitchen
    if (npc.state === "idle" && currentTime - npc.lastInteraction > 5) {
      const patrolPoints = [
        new THREE.Vector3(3, 0, -8),
        new THREE.Vector3(-5, 0, -5),
        new THREE.Vector3(5, 0, -5),
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(5, 0, 0),
      ]

      const randomPoint = patrolPoints[Math.floor(Math.random() * patrolPoints.length)]
      npc.targetPosition = randomPoint
      npc.state = "moving"
      npc.lastInteraction = currentTime
    }
  }

  private updateReceptionistBehavior(npc: NPCState, currentTime: number) {
    // Receptionist stays at desk but occasionally shows dialogue
    if (npc.state === "idle" && !npc.currentDialogue && currentTime - npc.lastInteraction > 8) {
      const greetings = [
        "Welcome to DineVerse!",
        "Please wait to be seated.",
        "Hope you enjoy your meal!",
        "Table for two?",
      ]

      this.showDialogue(npc.id, greetings[Math.floor(Math.random() * greetings.length)], 3)
      npc.lastInteraction = currentTime
    }
  }

  // Enhanced AI methods for realistic flow
  triggerReceptionistGreeting(playerPosition: THREE.Vector3) {
    const receptionist = this.npcs.get("receptionist")
    if (!receptionist || receptionist.aiState !== "AI_IDLE") return

    const distance = receptionist.position.distanceTo(playerPosition)
    if (distance < 3) {
      receptionist.aiState = "AI_BUSY"
      this.showDialogue("receptionist", "Welcome to DineVerse! Would you like to book a table?", 4)
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        if (receptionist.aiState === "AI_BUSY") {
          receptionist.aiState = "AI_IDLE"
        }
      }, 2000)
    }
  }

  triggerWaiterFollowToTable(tablePosition: THREE.Vector3) {
    const waiter = this.npcs.get("waiter")
    if (!waiter) return

    waiter.targetPosition = new THREE.Vector3(tablePosition.x - 1, 0, tablePosition.z)
    waiter.state = "moving"
    waiter.aiState = "AI_BUSY"
    this.showDialogue("waiter", "Follow me to your table!", 3)
  }

  triggerWaiterOrderPickup() {
    const waiter = this.npcs.get("waiter")
    if (!waiter) return

    waiter.aiState = "WAITING_FOR_ORDER"
    this.showDialogue("waiter", "I'll take your order to the kitchen.", 3)
  }

  triggerWaiterOrderReady() {
    const waiter = this.npcs.get("waiter")
    if (!waiter || waiter.aiState !== "WAITING_FOR_CHEF") return

    waiter.aiState = "AI_BUSY"
    this.showDialogue("waiter", "Your order is ready! Enjoy your meal!", 4)
    
    setTimeout(() => {
      waiter.aiState = "AI_IDLE"
    }, 2000)
  }

  triggerWaiterServing() {
    const waiter = this.npcs.get("waiter")
    if (!waiter) return

    waiter.aiState = "AI_BUSY"
    this.showDialogue("waiter", "Here's your delicious meal!", 3)
    
    setTimeout(() => {
      waiter.aiState = "AI_IDLE"
    }, 2000)
  }

  // Event handlers for order flow
  onOrderReceived(orderId: string, dishName: string, tableId: number) {
    const waiter = this.npcs.get("waiter")
    if (!waiter) return

    waiter.aiState = "WAITING_FOR_CHEF"
    this.showDialogue("waiter", `New order: ${dishName}, Table ${tableId}. Time: 5 mins.`, 4)
  }

  onOrderReady(orderId: string) {
    const waiter = this.npcs.get("waiter")
    if (!waiter) return

    waiter.aiState = "WAITING_FOR_CHEF"
    this.showDialogue("waiter", "Order ready! Serving now.", 3)
  }

  // Proximity-based dialogue triggers
  checkProximityTriggers(playerPosition: THREE.Vector3, playerRole: "visitor" | "chef") {
    this.npcs.forEach((npc, npcId) => {
      const distance = npc.position.distanceTo(playerPosition)
      
      if (distance < 2.5 && npc.aiState === "AI_IDLE") {
        npc.proximityTrigger = true
        
        if (npcId === "receptionist" && playerRole === "visitor") {
          this.triggerReceptionistGreeting(playerPosition)
        }
      } else if (distance >= 2.5) {
        npc.proximityTrigger = false
        // Reset AI state after player walks away
        if (npc.aiState === "AI_BUSY") {
          setTimeout(() => {
            npc.aiState = "AI_IDLE"
          }, 2000)
        }
      }
    })
  }

  showDialogue(npcId: string, text: string, duration = 3) {
    const npc = this.npcs.get(npcId)
    if (npc) {
      npc.currentDialogue = {
        text,
        duration,
        timestamp: Date.now() / 1000,
      }
    }
  }

  async interactWithNPC(npcId: string, playerRole: "visitor" | "chef", currentTime: number) {
    const npc = this.npcs.get(npcId)
    if (!npc) return

    npc.state = "interacting"
    npc.lastInteraction = currentTime

    // Try to get AI response from Gemini
    const geminiAI = getGeminiAI()
    if (geminiAI) {
      try {
        const response = await geminiAI.generateNPCDialogue(npc.type, playerRole)
        if (response.success) {
          this.showDialogue(npcId, response.text, 4)
        } else {
          // Fallback to static responses
          this.showStaticDialogue(npcId, playerRole)
        }
      } catch (error) {
        console.error("Gemini AI Error:", error)
        // Fallback to static responses
        this.showStaticDialogue(npcId, playerRole)
      }
    } else {
      // No Gemini API key, use static responses
      this.showStaticDialogue(npcId, playerRole)
    }

    setTimeout(() => {
      if (npc.state === "interacting") {
        npc.state = "idle"
      }
    }, 2000)
  }

  private showStaticDialogue(npcId: string, playerRole: "visitor" | "chef") {
    const npc = this.npcs.get(npcId)
    if (!npc) return

    if (npc.type === "waiter") {
      if (playerRole === "visitor") {
        const responses = [
          "What would you like to order?",
          "Our special today is delicious!",
          "I'll be right back with your order.",
          "Enjoy your meal!",
        ]
        this.showDialogue(npcId, responses[Math.floor(Math.random() * responses.length)], 4)
      } else {
        const responses = [
          "Order ready for table 2!",
          "We need more dishes prepared.",
          "Customer is waiting for their food.",
        ]
        this.showDialogue(npcId, responses[Math.floor(Math.random() * responses.length)], 4)
      }
    } else if (npc.type === "receptionist") {
      if (playerRole === "visitor") {
        const responses = [
          "Welcome! Please follow me to your table.",
          "We have a lovely table available.",
          "Right this way, please!",
        ]
        this.showDialogue(npcId, responses[Math.floor(Math.random() * responses.length)], 4)
      } else {
        const responses = [
          "Good luck in the kitchen today!",
          "We have several customers waiting.",
          "Keep up the great work!",
        ]
        this.showDialogue(npcId, responses[Math.floor(Math.random() * responses.length)], 4)
      }
    }
  }

  // New method: Handle table booking and waiter approach
  onTableBooked(tableId: number, visitorPosition: any) {
    const waiter = this.npcs.get("waiter")
    if (waiter && THREE) {
      waiter.assignedTableId = tableId
      waiter.visitorPosition = visitorPosition.clone()
      waiter.aiState = "APPROACHING_VISITOR"
      waiter.state = "approaching_visitor"
      
      // Set target to approach visitor
      waiter.targetPosition = visitorPosition.clone()
      waiter.state = "moving" // Set to moving state
      
      // Add dialogue for approaching
      waiter.currentDialogue = {
        text: "Sir, please come this way.",
        duration: 4000,
        timestamp: Date.now()
      }
      
      // Update waiter state in database
      gameDatabase.updateWaiterState("approaching", tableId, "approaching_visitor")
      
      // After reaching visitor, guide to table
      setTimeout(() => {
        this.guideToTable(tableId)
      }, 3000)
    }
  }

  // New method: Guide visitor to table
  guideToTable(tableId: number) {
    const waiter = this.npcs.get("waiter")
    if (waiter && THREE) {
      // Get table position
      const tablePositions = [
        { id: 1, x: -6, z: -6 },
        { id: 2, x: 6, z: -6 },
        { id: 3, x: -6, z: -1 },
        { id: 4, x: 6, z: -1 },
        { id: 5, x: -6, z: 4 },
        { id: 6, x: 6, z: 4 }
      ]
      
      const tablePos = tablePositions.find(t => t.id === tableId)
      if (tablePos) {
        waiter.aiState = "GUIDING_TO_TABLE"
        waiter.state = "guiding_to_table"
        waiter.targetPosition = new THREE.Vector3(tablePos.x, 0, tablePos.z)
        waiter.state = "moving"
        
        // Update dialogue
        waiter.currentDialogue = {
          text: "Right this way to your table.",
          duration: 4000,
          timestamp: Date.now()
        }
        
        // Update waiter state in database
        gameDatabase.updateWaiterState("guiding", tableId, "guiding_to_table")
      }
    }
  }

  // New method: Handle visitor sitting down
  onVisitorSeated(tableId: number) {
    const waiter = this.npcs.get("waiter")
    if (waiter && waiter.assignedTableId === tableId) {
      waiter.aiState = "WAITING_FOR_SEAT"
      waiter.state = "waiting_for_seat"
      waiter.targetPosition = null
      
      // Add dialogue for menu offer
      waiter.currentDialogue = {
        text: "Sir, may I give you the menu?",
        duration: 4000,
        timestamp: Date.now()
      }
      
      // Update waiter state in database
      gameDatabase.updateWaiterState("waiting_for_seat", tableId, "offering_menu")
    }
  }

  // New method: Handle menu request
  onMenuRequested() {
    const waiter = this.npcs.get("waiter")
    if (waiter) {
      waiter.currentDialogue = {
        text: "Of course, sir. Here is your menu.",
        duration: 4000,
        timestamp: Date.now()
      }
      
      // Update waiter state in database
      gameDatabase.updateWaiterState("serving", waiter.assignedTableId || null, "showing_menu")
    }
  }
}
