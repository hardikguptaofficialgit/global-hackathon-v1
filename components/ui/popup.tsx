"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Popup({ isOpen, onClose, title, children, className = "" }: PopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'animate-in fade-in duration-300' : 'animate-out fade-out duration-300'}`}>
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className={`relative max-w-md w-full mx-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-amber-500/40 shadow-2xl shadow-amber-500/20 ${className}`}>
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200">
            {title}
          </h2>
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
          {children}
        </div>
      </Card>
    </div>
  )
}

interface TableBookingPopupProps {
  isOpen: boolean
  onClose: () => void
  onBookTable: (tableSize: number) => void
}

export function TableBookingPopup({ isOpen, onClose, onBookTable }: TableBookingPopupProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null)

  const handleBook = () => {
    if (selectedSize) {
      onBookTable(selectedSize)
      onClose()
    }
  }

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Book a Table">
      <div className="space-y-6">
        <p className="text-amber-100/80 text-center">How many guests will be dining with you?</p>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { size: 1, label: "1 Guest", icon: "👤" },
            { size: 2, label: "2 Guests", icon: "👥" },
            { size: 4, label: "4 Guests", icon: "👨‍👩‍👧‍👦" },
            { size: 6, label: "Family", icon: "👨‍👩‍👧‍👦👶" }
          ].map(({ size, label, icon }) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              onClick={() => setSelectedSize(size)}
              className={`h-16 flex flex-col gap-2 ${
                selectedSize === size
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
                  : "border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBook}
            disabled={!selectedSize}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white disabled:opacity-50"
          >
            Book Table
          </Button>
        </div>
      </div>
    </Popup>
  )
}

interface MenuPopupProps {
  isOpen: boolean
  onClose: () => void
  onOrder: (dish: string, price: number) => void
}

export function MenuPopup({ isOpen, onClose, onOrder }: MenuPopupProps) {
  const menuItems = [
    { name: "Pasta Carbonara", price: 18, description: "Classic Italian pasta with eggs, bacon, and cheese" },
    { name: "Grilled Steak", price: 28, description: "Premium beef with herbs and butter" },
    { name: "Caesar Salad", price: 14, description: "Fresh lettuce with croutons and parmesan" },
    { name: "Tomato Soup", price: 12, description: "Creamy tomato soup with basil" },
    { name: "Gourmet Burger", price: 22, description: "Beef patty with fresh vegetables and cheese" },
    { name: "Margherita Pizza", price: 20, description: "Traditional pizza with tomato and mozzarella" }
  ]

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Restaurant Menu" className="max-w-2xl">
      <div className="space-y-4">
        <p className="text-amber-100/80 text-center mb-6">Please select your order</p>
        
        <div className="grid gap-4">
          {menuItems.map((item, index) => (
            <Card key={index} className="p-4 bg-neutral-800/50 border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-50 mb-1">{item.name}</h3>
                  <p className="text-sm text-amber-100/70 mb-2">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-amber-400">${item.price}</span>
                  <Button
                    onClick={() => onOrder(item.name, item.price)}
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
                  >
                    Order
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
        >
          Close Menu
        </Button>
      </div>
    </Popup>
  )
}

interface RatingPopupProps {
  isOpen: boolean
  onClose: () => void
  onRate: (rating: number) => void
}

export function RatingPopup({ isOpen, onClose, onRate }: RatingPopupProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating)
      onClose()
    }
  }

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Rate Your Experience">
      <div className="space-y-6">
        <p className="text-amber-100/80 text-center">How would you rate your dining experience?</p>
        
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-4xl transition-colors"
            >
              {star <= (hoveredRating || rating) ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-amber-100/70">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white disabled:opacity-50"
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </Popup>
  )
}

interface OrderProgressPopupProps {
  isOpen: boolean
  orderName: string
  progress: number
  timeRemaining: number
}

export function OrderProgressPopup({ isOpen, orderName, progress, timeRemaining }: OrderProgressPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-4 z-40 animate-in slide-in-from-right-4 duration-300">
      <Card className="p-4 bg-gradient-to-r from-neutral-900/95 to-neutral-800/95 backdrop-blur-md border-amber-500/40 shadow-lg shadow-amber-500/20 min-w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-50">Order in Progress</h3>
            <span className="text-sm text-amber-100/70">{Math.ceil(timeRemaining)}s</span>
          </div>
          
          <div>
            <p className="text-sm text-amber-100/80 mb-2">{orderName}</p>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <p className="text-xs text-amber-100/60 text-center">
            Your order is being prepared by our chef
          </p>
        </div>
      </Card>
    </div>
  )
}
