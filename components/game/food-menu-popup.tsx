"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ShoppingCart, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { gameDatabase } from "@/lib/game-database"

interface FoodMenuPopupProps {
  isOpen: boolean
  onClose: () => void
  onOrder: (items: { name: string; quantity: number; price: number }[]) => void
  onMenuDisplayed?: () => void
}

export function FoodMenuPopup({ isOpen, onClose, onOrder, onMenuDisplayed }: FoodMenuPopupProps) {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({})
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load menu items from database
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      const items = gameDatabase.getMenuItems()
      setMenuItems(items)
      setIsLoading(false)
      
      // Notify that menu is displayed
      if (onMenuDisplayed) {
        onMenuDisplayed()
      }
    }
  }, [isOpen, onMenuDisplayed])

  const handleQuantityChange = (itemName: string, quantity: number) => {
    if (quantity < 0) return
    
    const item = menuItems.find(item => item.name === itemName)
    if (item && quantity > item.available) return

    setSelectedItems(prev => ({
      ...prev,
      [itemName]: quantity
    }))
  }

  const handleOrder = () => {
    const orderItems = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([name, quantity]) => {
        const item = menuItems.find(item => item.name === name)!
        return {
          name,
          quantity,
          price: item.price * quantity
        }
      })

    if (orderItems.length > 0) {
      // Check availability in database
      const availabilityCheck = gameDatabase.checkAvailability(
        orderItems.map(item => ({ name: item.name, quantity: item.quantity }))
      )

      if (!availabilityCheck) {
        alert("Some items are no longer available. Please refresh and try again.")
        return
      }

      // Update inventory
      const inventoryUpdated = gameDatabase.updateInventory(
        orderItems.map(item => ({ name: item.name, quantity: item.quantity }))
      )

      if (inventoryUpdated) {
        onOrder(orderItems)
        setSelectedItems({}) // Clear selection after ordering
      } else {
        alert("Unable to process order. Please try again.")
      }
    }
  }

  const totalPrice = Object.entries(selectedItems).reduce((total, [name, quantity]) => {
    const item = menuItems.find(item => item.name === name)
    return total + (item ? item.price * quantity : 0)
  }, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative max-w-3xl w-full mx-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-amber-500/40 shadow-2xl shadow-amber-500/20">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200">
                Restaurant Menu
              </h2>
              <p className="text-sm text-amber-100/70">Please select your order</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-amber-100/70 hover:text-amber-50 hover:bg-amber-500/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-amber-100/80 text-center">Loading menu...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => {
                const currentQuantity = selectedItems[item.name] || 0
                const remainingAvailable = item.available - currentQuantity
                
                return (
                  <Card key={item.name} className="p-4 bg-neutral-800/50 border-amber-500/20 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-amber-50">{item.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-green-400">
                            <Clock className="w-4 h-4" />
                            <span>{remainingAvailable} available</span>
                          </div>
                        </div>
                        <p className="text-sm text-amber-100/70 mb-1">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-amber-100/60">
                          <span>Cooking Time: {item.cookingTime}min</span>
                          <span className="capitalize">{item.category}</span>
                        </div>
                        <div className="text-lg font-bold text-amber-400 mt-2">${item.price}</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.name, currentQuantity - 1)}
                            disabled={currentQuantity <= 0}
                            className="w-8 h-8 p-0 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-amber-50 font-semibold">
                            {currentQuantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.name, currentQuantity + 1)}
                            disabled={remainingAvailable <= 0}
                            className="w-8 h-8 p-0 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {totalPrice > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-600/20 to-amber-500/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-amber-50">Total:</span>
                <span className="text-xl font-bold text-amber-400">${totalPrice}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrder}
              disabled={totalPrice === 0 || isLoading}
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white disabled:opacity-50"
            >
              Place Order
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
