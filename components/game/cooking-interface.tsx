"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChefHat, Clock, Star, CheckCircle2, XCircle, RotateCcw, Sparkles, Flame } from "lucide-react"
import type { CookingState } from "@/lib/cooking-game"
import { AVAILABLE_INGREDIENTS } from "@/lib/cooking-game"
import { useState, useMemo, useCallback } from "react"

interface CookingInterfaceProps {
  cookingState: CookingState
  onIngredientToggle: (ingredient: string) => void
  onStartCooking: () => void
  onServeDish: () => void
  onClose: () => void
  onRestart?: () => void
}

export function CookingInterface({
  cookingState,
  onIngredientToggle,
  onStartCooking,
  onServeDish,
  onClose,
  onRestart,
}: CookingInterfaceProps) {
  const { currentRecipe, selectedIngredients, cookingProgress, isActive, score, completedOrders, timeRemaining } =
    cookingState
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  if (!currentRecipe) return null

  const hasAllIngredients = currentRecipe.ingredients.every((ing) => selectedIngredients.includes(ing))
  const hasExtraIngredients = selectedIngredients.length > currentRecipe.ingredients.length
  const isCookingComplete = isActive && cookingProgress >= 100

  const handleRestart = useCallback(() => {
    if (onRestart) {
      onRestart()
      setShowRestartConfirm(false)
    }
  }, [onRestart])

  const memoizedIngredients = useMemo(() => {
    return AVAILABLE_INGREDIENTS.map((ingredient) => {
      const isSelected = selectedIngredients.includes(ingredient)
      const isRequired = currentRecipe.ingredients.includes(ingredient)
      return { ingredient, isSelected, isRequired }
    })
  }, [selectedIngredients, currentRecipe.ingredients])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-amber-500/40 p-8 max-h-[95vh] overflow-y-auto shadow-2xl shadow-amber-500/20 animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200 font-serif">
                Chef's Kitchen
              </h2>
              <p className="text-amber-100/70 text-sm font-medium">Prepare the perfect dish with precision</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onRestart && (
              <Button 
                onClick={() => setShowRestartConfirm(true)} 
                variant="outline" 
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" className="text-amber-100/60 hover:text-amber-50 hover:bg-amber-500/10">
              Close
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-neutral-800 to-neutral-700 border-amber-500/30 shadow-lg hover:shadow-amber-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-amber-100/80">Score</span>
            </div>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200">{score}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-neutral-800 to-neutral-700 border-green-500/30 shadow-lg hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-amber-100/80">Completed</span>
            </div>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-50 to-green-200">{completedOrders}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-neutral-800 to-neutral-700 border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-amber-100/80">Time Left</span>
            </div>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-50 to-blue-200">{Math.ceil(timeRemaining)}s</p>
          </Card>
        </div>

        {/* Current Recipe */}
        <Card className="p-8 bg-gradient-to-br from-amber-900/50 via-amber-800/30 to-amber-900/50 border-amber-500/40 mb-8 shadow-xl shadow-amber-500/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200 mb-3 font-serif">
                {currentRecipe.name}
              </h3>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    currentRecipe.difficulty === "easy"
                      ? "border-green-500/60 text-green-400 bg-green-500/10 px-3 py-1"
                      : currentRecipe.difficulty === "medium"
                        ? "border-yellow-500/60 text-yellow-400 bg-yellow-500/10 px-3 py-1"
                        : "border-red-500/60 text-red-400 bg-red-500/10 px-3 py-1"
                  }
                >
                  {currentRecipe.difficulty}
                </Badge>
                <Badge variant="outline" className="border-amber-500/60 text-amber-400 bg-amber-500/10 px-3 py-1">
                  {currentRecipe.points} pts
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-amber-100/80 font-semibold flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Required Ingredients:
            </p>
            <div className="flex flex-wrap gap-3">
              {currentRecipe.ingredients.map((ingredient) => {
                const isSelected = selectedIngredients.includes(ingredient)
                return (
                  <Badge
                    key={ingredient}
                    variant={isSelected ? "default" : "outline"}
                    className={
                      isSelected 
                        ? "bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400 px-4 py-2 shadow-lg shadow-green-500/30 animate-in zoom-in-50 duration-200" 
                        : "border-amber-600/50 text-amber-300 hover:border-amber-500 hover:bg-amber-500/10 px-4 py-2 transition-all duration-200"
                    }
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {ingredient}
                  </Badge>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Ingredient Selection */}
        {!isActive && (
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200 mb-6 flex items-center gap-3">
              <ChefHat className="w-5 h-5" />
              Select Ingredients
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {memoizedIngredients.map(({ ingredient, isSelected, isRequired }) => (
                <Button
                  key={ingredient}
                  onClick={() => onIngredientToggle(ingredient)}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={
                    isSelected
                      ? isRequired
                        ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30 animate-in zoom-in-50 duration-200"
                        : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 animate-in zoom-in-50 duration-200"
                      : "border-amber-600/40 text-amber-300 hover:bg-amber-600/20 hover:border-amber-500 hover:text-amber-200 transition-all duration-200"
                  }
                >
                  {ingredient}
                </Button>
              ))}
            </div>
            {hasExtraIngredients && (
              <div className="flex items-center gap-3 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Warning: Extra ingredients will reduce your score by 30%</span>
              </div>
            )}
          </div>
        )}

        {/* Cooking Progress */}
        {isActive && !isCookingComplete && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200 flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                Cooking...
              </h4>
              <span className="text-amber-100/80 font-bold text-lg">{Math.round(cookingProgress)}%</span>
            </div>
            <div className="relative">
              <Progress value={cookingProgress} className="h-4 bg-neutral-800 border border-amber-500/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Serve Dish button when cooking is complete */}
        {isCookingComplete && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="relative mb-4">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
                  <div className="absolute inset-0 w-20 h-20 bg-green-500/20 rounded-full mx-auto animate-ping"></div>
                </div>
                <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-50 to-green-200 mb-2 font-serif">
                  Dish Ready!
                </h4>
                <p className="text-amber-100/80 text-lg">Your {currentRecipe.name} is perfectly cooked</p>
              </div>
            </div>
            <Button
              onClick={onServeDish}
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-4 text-lg shadow-xl shadow-green-500/30 animate-in zoom-in-50 duration-300"
            >
              <ChefHat className="w-6 h-6 mr-3" />
              Serve Dish
            </Button>
          </div>
        )}

        {/* Action Button */}
        {!isActive && (
          <Button
            onClick={onStartCooking}
            disabled={!hasAllIngredients}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-amber-500/30 transition-all duration-300"
          >
            {hasAllIngredients ? (
              <>
                <Flame className="w-6 h-6 mr-3" />
                Start Cooking!
              </>
            ) : (
              "Select all required ingredients first"
            )}
          </Button>
        )}

        {/* Restart Confirmation Dialog */}
        {showRestartConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-60">
            <Card className="p-8 max-w-md bg-gradient-to-br from-neutral-900 to-neutral-800 border-red-500/40 shadow-2xl shadow-red-500/20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">Restart Game?</h3>
                <p className="text-amber-100/70 mb-6">
                  This will reset your score and start a new order. Are you sure?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleRestart}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                  >
                    Yes, Restart
                  </Button>
                  <Button
                    onClick={() => setShowRestartConfirm(false)}
                    variant="outline"
                    className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}
