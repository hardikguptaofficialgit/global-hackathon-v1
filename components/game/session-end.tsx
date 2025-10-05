"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  Trophy, 
  Clock, 
  ChefHat, 
  Utensils, 
  RotateCcw, 
  Home, 
  Share2,
  Download,
  Target,
  Zap,
  MessageCircle
} from "lucide-react"
import { useState, useEffect } from "react"

interface SessionStats {
  role: "visitor" | "chef"
  duration: number
  score: number
  ordersCompleted: number
  ordersReceived: number
  rating?: number
  experience: "excellent" | "good" | "average" | "poor"
  highlights: string[]
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: React.ReactNode
    unlocked: boolean
  }>
}

interface SessionEndProps {
  isOpen: boolean
  stats: SessionStats
  onReplay: () => void
  onExit: () => void
  onRate: (rating: number) => void
  onShare?: () => void
}

export function SessionEnd({
  isOpen,
  stats,
  onReplay,
  onExit,
  onRate,
  onShare
}: SessionEndProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Show rating section after a delay
      setTimeout(() => setShowRating(true), 1000)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  if (!isOpen && !isAnimating) return null

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-blue-400"
      case "average":
        return "text-yellow-400"
      case "poor":
        return "text-red-400"
      default:
        return "text-neutral-400"
    }
  }

  const getRoleIcon = () => {
    return stats.role === "chef" ? (
      <ChefHat className="w-6 h-6 text-orange-400" />
    ) : (
      <Utensils className="w-6 h-6 text-blue-400" />
    )
  }

  const achievements = [
    {
      id: "first_order",
      name: "First Order",
      description: "Complete your first order",
      icon: <Target className="w-4 h-4" />,
      unlocked: stats.ordersCompleted > 0
    },
    {
      id: "speed_chef",
      name: "Speed Chef",
      description: "Complete 3 orders in under 5 minutes",
      icon: <Zap className="w-4 h-4" />,
      unlocked: stats.ordersCompleted >= 3 && stats.duration < 300
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      description: "Achieve a perfect score",
      icon: <Star className="w-4 h-4" />,
      unlocked: stats.score >= 100
    },
    {
      id: "social_butterfly",
      name: "Social Butterfly",
      description: "Have 5+ conversations",
      icon: <MessageCircle className="w-4 h-4" />,
      unlocked: stats.highlights.some(h => h.includes("conversation"))
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Main Content */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Card className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 shadow-2xl">
          {/* Header */}
          <div className="p-8 border-b border-neutral-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-800/50 rounded-full">
                  {getRoleIcon()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-neutral-100">
                    Session Complete!
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    Great job as a {stats.role}!
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 ${getExperienceColor(stats.experience)} border-current`}
              >
                {stats.experience.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Duration */}
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-neutral-100">
                  {formatDuration(stats.duration)}
                </div>
                <div className="text-sm text-neutral-400">Duration</div>
              </div>

              {/* Score */}
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-neutral-100">
                  {stats.score}
                </div>
                <div className="text-sm text-neutral-400">Score</div>
              </div>

              {/* Orders */}
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-neutral-100">
                  {stats.ordersCompleted}
                </div>
                <div className="text-sm text-neutral-400">
                  {stats.role === "chef" ? "Orders Cooked" : "Orders Received"}
                </div>
              </div>

              {/* Rating */}
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-neutral-100">
                  {stats.rating || "N/A"}
                </div>
                <div className="text-sm text-neutral-400">Rating</div>
              </div>
            </div>

            {/* Highlights */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-neutral-100 mb-4">Session Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-neutral-200 text-sm">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-neutral-100 mb-4">Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      achievement.unlocked 
                        ? "bg-green-900/30 border border-green-500/30" 
                        : "bg-neutral-800/30 border border-neutral-700/30 opacity-50"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      achievement.unlocked ? "bg-green-500/20 text-green-400" : "bg-neutral-700/50 text-neutral-500"
                    }`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        achievement.unlocked ? "text-green-100" : "text-neutral-400"
                      }`}>
                        {achievement.name}
                      </div>
                      <div className={`text-sm ${
                        achievement.unlocked ? "text-green-200" : "text-neutral-500"
                      }`}>
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Section */}
            {showRating && !stats.rating && (
              <div className="mb-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-xl font-bold text-blue-100 mb-4">Rate Your Experience</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-3xl transition-colors duration-200"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-neutral-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <Button
                    onClick={() => onRate(rating)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Submit Rating
                  </Button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onReplay}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={onExit}
                variant="outline"
                className="flex-1 border-neutral-600 text-neutral-100 hover:bg-neutral-800 py-3"
              >
                <Home className="w-5 h-5 mr-2" />
                Main Menu
              </Button>
              {onShare && (
                <Button
                  onClick={onShare}
                  variant="outline"
                  className="border-neutral-600 text-neutral-100 hover:bg-neutral-800 py-3"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

interface SessionSummaryProps {
  stats: SessionStats
  onClose: () => void
}

export function SessionSummary({ stats, onClose }: SessionSummaryProps) {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Card className="p-4 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 shadow-2xl max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-neutral-100">Session Summary</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100"
          >
            ×
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Duration:</span>
            <span className="text-neutral-100">{Math.floor(stats.duration / 60)}m {stats.duration % 60}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Score:</span>
            <span className="text-neutral-100">{stats.score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Orders:</span>
            <span className="text-neutral-100">{stats.ordersCompleted}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
