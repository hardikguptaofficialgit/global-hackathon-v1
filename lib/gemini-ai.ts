export interface GeminiResponse {
  text: string
  success: boolean
  error?: string
}

export class GeminiAI {
  private apiKey: string
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateNPCDialogue(
    npcType: "waiter" | "receptionist",
    playerRole: "visitor" | "chef",
    context: string = ""
  ): Promise<GeminiResponse> {
    try {
      const prompt = this.createPrompt(npcType, playerRole, context)
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text.trim()
        return { text, success: true }
      } else {
        throw new Error("No valid response from Gemini API")
      }
    } catch (error) {
      console.error("Gemini API Error:", error)
      return {
        text: this.getFallbackResponse(npcType, playerRole),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  private createPrompt(npcType: string, playerRole: string, context: string): string {
    const basePrompt = `You are a ${npcType} in a virtual restaurant game called DineVerse. A ${playerRole} is interacting with you. Generate a short, friendly, and contextually appropriate response (1-2 sentences max). Keep it casual and game-appropriate.`

    if (context) {
      return `${basePrompt} Context: ${context}`
    }

    const roleSpecificPrompts = {
      waiter: {
        visitor: "The customer is looking to order food or ask about the menu.",
        chef: "You're communicating with the chef about orders or kitchen needs."
      },
      receptionist: {
        visitor: "The customer is checking in or asking about seating.",
        chef: "You're greeting the chef or discussing restaurant operations."
      }
    }

    const specificContext = roleSpecificPrompts[npcType as keyof typeof roleSpecificPrompts]?.[playerRole as keyof typeof roleSpecificPrompts.waiter] || ""
    
    return `${basePrompt} ${specificContext}`
  }

  private getFallbackResponse(npcType: string, playerRole: string): string {
    const fallbacks = {
      waiter: {
        visitor: "Welcome! What can I get for you today?",
        chef: "Ready for the next order, chef!"
      },
      receptionist: {
        visitor: "Welcome to DineVerse! Please follow me.",
        chef: "Good luck in the kitchen today!"
      }
    }

    return fallbacks[npcType as keyof typeof fallbacks]?.[playerRole as keyof typeof fallbacks.waiter] || "Hello there!"
  }
}

// Singleton instance
let geminiInstance: GeminiAI | null = null

export function getGeminiAI(): GeminiAI | null {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      geminiInstance = new GeminiAI(apiKey)
    }
  }
  return geminiInstance
}
