export interface Recipe {
  id: string
  name: string
  ingredients: string[]
  cookTime: number // in seconds
  difficulty: "easy" | "medium" | "hard"
  points: number
}

export interface CookingState {
  currentRecipe: Recipe | null
  selectedIngredients: string[]
  cookingProgress: number
  isActive: boolean
  score: number
  completedOrders: number
  timeRemaining: number
}

export const RECIPES: Recipe[] = [
  {
    id: "pasta",
    name: "Pasta Carbonara",
    ingredients: ["pasta", "eggs", "bacon", "cheese"],
    cookTime: 8,
    difficulty: "easy",
    points: 100,
  },
  {
    id: "steak",
    name: "Grilled Steak",
    ingredients: ["beef", "salt", "pepper", "butter"],
    cookTime: 10,
    difficulty: "medium",
    points: 150,
  },
  {
    id: "salad",
    name: "Caesar Salad",
    ingredients: ["lettuce", "croutons", "cheese", "dressing"],
    cookTime: 5,
    difficulty: "easy",
    points: 80,
  },
  {
    id: "soup",
    name: "Tomato Soup",
    ingredients: ["tomato", "cream", "basil", "garlic"],
    cookTime: 12,
    difficulty: "medium",
    points: 120,
  },
  {
    id: "burger",
    name: "Gourmet Burger",
    ingredients: ["beef", "bun", "lettuce", "tomato", "cheese"],
    cookTime: 15,
    difficulty: "hard",
    points: 200,
  },
  {
    id: "pizza",
    name: "Margherita Pizza",
    ingredients: ["dough", "tomato", "cheese", "basil"],
    cookTime: 18,
    difficulty: "hard",
    points: 180,
  },
]

export const AVAILABLE_INGREDIENTS = [
  "pasta",
  "eggs",
  "bacon",
  "cheese",
  "beef",
  "salt",
  "pepper",
  "butter",
  "lettuce",
  "croutons",
  "dressing",
  "tomato",
  "cream",
  "basil",
  "garlic",
  "bun",
  "dough",
]

export class CookingGameController {
  private state: CookingState = {
    currentRecipe: null,
    selectedIngredients: [],
    cookingProgress: 0,
    isActive: false,
    score: 0,
    completedOrders: 0,
    timeRemaining: 0,
  }

  private cookingStartTime = 0
  private onStateChange?: (state: CookingState) => void

  constructor(onStateChange?: (state: CookingState) => void) {
    this.onStateChange = onStateChange
  }

  getState(): CookingState {
    return { ...this.state }
  }

  startNewOrder() {
    const randomRecipe = RECIPES[Math.floor(Math.random() * RECIPES.length)]
    this.state.currentRecipe = randomRecipe
    this.state.selectedIngredients = []
    this.state.cookingProgress = 0
    this.state.isActive = false
    this.state.timeRemaining = randomRecipe.cookTime
    this.notifyStateChange()
  }

  toggleIngredient(ingredient: string) {
    if (this.state.isActive) return

    const index = this.state.selectedIngredients.indexOf(ingredient)
    if (index > -1) {
      this.state.selectedIngredients.splice(index, 1)
    } else {
      this.state.selectedIngredients.push(ingredient)
    }
    this.notifyStateChange()
  }

  startCooking(currentTime: number): boolean {
    if (!this.state.currentRecipe || this.state.isActive) return false

    const recipe = this.state.currentRecipe
    const hasAllIngredients = recipe.ingredients.every((ing) => this.state.selectedIngredients.includes(ing))

    if (!hasAllIngredients) {
      return false
    }

    this.state.isActive = true
    this.state.cookingProgress = 0
    this.cookingStartTime = currentTime
    this.notifyStateChange()
    return true
  }

  update(currentTime: number) {
    if (!this.state.isActive || !this.state.currentRecipe) return

    const elapsed = currentTime - this.cookingStartTime
    const recipe = this.state.currentRecipe

    this.state.cookingProgress = Math.min((elapsed / recipe.cookTime) * 100, 100)
    this.state.timeRemaining = Math.max(recipe.cookTime - elapsed, 0)

    if (this.state.cookingProgress >= 100) {
      this.completeCooking()
    }

    this.notifyStateChange()
  }

  private completeCooking() {
    if (!this.state.currentRecipe) return

    const recipe = this.state.currentRecipe
    const hasExtraIngredients = this.state.selectedIngredients.length > recipe.ingredients.length

    let earnedPoints = recipe.points
    if (hasExtraIngredients) {
      earnedPoints = Math.floor(earnedPoints * 0.7) // 30% penalty for extra ingredients
    }

    this.state.score += earnedPoints
    this.state.completedOrders += 1
    this.state.isActive = false
    this.state.cookingProgress = 100

    this.notifyStateChange()
  }

  serveDish() {
    if (this.state.cookingProgress >= 100) {
      this.state.cookingProgress = 0
      this.notifyStateChange()
    }
  }

  reset() {
    this.state = {
      currentRecipe: null,
      selectedIngredients: [],
      cookingProgress: 0,
      isActive: false,
      score: 0,
      completedOrders: 0,
      timeRemaining: 0,
    }
    this.notifyStateChange()
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }
}
