"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Brain, Zap } from "lucide-react"
import { useState, useEffect } from "react"

interface ThoughtCloudProps {
  isVisible: boolean
  message: string
  npcName: string
  npcType: "waiter" | "receptionist" | "chef"
  position?: { x: number; y: number }
  duration?: number
  onComplete?: () => void
}

export function ThoughtCloud({
  isVisible,
  message,
  npcName,
  npcType,
  position = { x: 0, y: 0 },
  duration = 3000,
  onComplete
}: ThoughtCloudProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      setOpacity(1)
      
      const timer = setTimeout(() => {
        setOpacity(0)
        setTimeout(() => {
          setIsAnimating(false)
          onComplete?.()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onComplete])

  if (!isVisible && !isAnimating) return null

  const getNpcIcon = () => {
    switch (npcType) {
      case "waiter":
        return <MessageCircle className="w-4 h-4 text-blue-400" />
      case "receptionist":
        return <Brain className="w-4 h-4 text-purple-400" />
      case "chef":
        return <Zap className="w-4 h-4 text-orange-400" />
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getNpcColor = () => {
    switch (npcType) {
      case "waiter":
        return "border-blue-500/40 bg-blue-500/10"
      case "receptionist":
        return "border-purple-500/40 bg-purple-500/10"
      case "chef":
        return "border-orange-500/40 bg-orange-500/10"
      default:
        return "border-gray-500/40 bg-gray-500/10"
    }
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity,
        transform: isAnimating ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Card className={`p-4 max-w-xs shadow-2xl backdrop-blur-md ${getNpcColor()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getNpcIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-medium">
                {npcName}
              </Badge>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
            <p className="text-sm text-neutral-100 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        {/* Thought bubble tail */}
        <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-current opacity-20" />
      </Card>
    </div>
  )
}

interface FloatingHUDProps {
  isVisible: boolean
  title: string
  content: React.ReactNode
  position?: { x: number; y: number }
  type?: "info" | "warning" | "success" | "error"
  duration?: number
  onClose?: () => void
}

export function FloatingHUD({
  isVisible,
  title,
  content,
  position = { x: 0, y: 0 },
  type = "info",
  duration = 5000,
  onClose
}: FloatingHUDProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      setOpacity(1)
      
      const timer = setTimeout(() => {
        setOpacity(0)
        setTimeout(() => {
          setIsAnimating(false)
          onClose?.()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return "border-yellow-500/40 bg-yellow-500/10 text-yellow-100"
      case "success":
        return "border-green-500/40 bg-green-500/10 text-green-100"
      case "error":
        return "border-red-500/40 bg-red-500/10 text-red-100"
      default:
        return "border-blue-500/40 bg-blue-500/10 text-blue-100"
    }
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity,
        transform: isAnimating ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Card className={`p-4 max-w-sm shadow-2xl backdrop-blur-md ${getTypeStyles()}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
        <div className="text-sm">
          {content}
        </div>
      </Card>
    </div>
  )
}

interface ProgressHUDProps {
  isVisible: boolean
  title: string
  progress: number
  maxProgress: number
  position?: { x: number; y: number }
  color?: "blue" | "green" | "orange" | "red"
  showPercentage?: boolean
}

export function ProgressHUD({
  isVisible,
  title,
  progress,
  maxProgress,
  position = { x: 0, y: 0 },
  color = "blue",
  showPercentage = true
}: ProgressHUDProps) {
  if (!isVisible) return null

  const percentage = Math.min(100, Math.max(0, (progress / maxProgress) * 100))
  
  const getColorStyles = () => {
    switch (color) {
      case "green":
        return "bg-green-500 border-green-400"
      case "orange":
        return "bg-orange-500 border-orange-400"
      case "red":
        return "bg-red-500 border-red-400"
      default:
        return "bg-blue-500 border-blue-400"
    }
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <Card className="p-3 min-w-48 shadow-2xl backdrop-blur-md bg-neutral-900/95 border-neutral-700/50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-neutral-100">{title}</h4>
          {showPercentage && (
            <span className="text-xs text-neutral-400 font-mono">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getColorStyles()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{progress}</span>
          <span>{maxProgress}</span>
        </div>
      </Card>
    </div>
  )
}
