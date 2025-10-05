"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  MapPin, 
  Users, 
  ChefHat, 
  Utensils, 
  Star, 
  Zap, 
  MessageCircle,
  Wifi,
  WifiOff,
  Target,
  Timer
} from "lucide-react"
import { useState, useEffect } from "react"

interface EnhancedHUDProps {
  role: "visitor" | "chef" | null
  isConnected: boolean
  roomId: string
  otherPlayersCount: number
  cookingScore?: number
  completedOrders?: number
  visitorState?: any
  chefState?: any
  cookingProgress?: number
  orderStatus?: string
  currentTable?: number
  timeRemaining?: number
  interactionHint?: string | null
}

export function EnhancedHUD({
  role,
  isConnected,
  roomId,
  otherPlayersCount,
  cookingScore = 0,
  completedOrders = 0,
  visitorState,
  chefState,
  cookingProgress = 0,
  orderStatus,
  currentTable,
  timeRemaining,
  interactionHint
}: EnhancedHUDProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Top Status Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-in slide-in-from-top-10 duration-500">
        <Card className="px-6 py-3 bg-neutral-900/95 backdrop-blur-md border-2 border-neutral-700/50 shadow-2xl shadow-black/70 rounded-full md:rounded-xl">
          <div className="flex items-center gap-6 md:gap-8">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-neutral-100 font-semibold text-sm hidden md:inline">
                {isConnected ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="w-px h-6 bg-neutral-700/50" />
            
            {/* Role Badge */}
            <div className="flex items-center gap-2">
              {role === "chef" ? (
                <ChefHat className="w-4 h-4 text-orange-400" />
              ) : (
                <Utensils className="w-4 h-4 text-blue-400" />
              )}
              <Badge 
                variant="outline" 
                className={`text-xs font-bold ${
                  role === "chef" 
                    ? "border-orange-500/50 text-orange-400 bg-orange-500/10" 
                    : "border-blue-500/50 text-blue-400 bg-blue-500/10"
                }`}
              >
                {role?.toUpperCase() || "SELECTING"}
              </Badge>
            </div>

            <div className="w-px h-6 bg-neutral-700/50" />
            
            {/* Room & Players */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-neutral-400 font-medium text-sm hidden sm:inline">
                  ROOM: <span className="text-neutral-100 font-mono font-bold tracking-widest">{roomId}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span className="text-neutral-100 font-bold text-lg">
                  {otherPlayersCount + 1}<span className="text-neutral-400 text-xs font-normal">/2</span>
                </span>
              </div>
            </div>

            {/* Chef Stats */}
            {role === "chef" && (
              <>
                <div className="w-px h-6 bg-neutral-700/50" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-neutral-100 font-bold">{cookingScore}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-neutral-100 font-bold">{completedOrders}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Visitor Status Panel */}
      {role === "visitor" && visitorState && (
        <div className="absolute top-20 left-4 animate-in slide-in-from-left-10 duration-500">
          <Card className="p-4 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-neutral-100 font-semibold text-sm">
                  Phase: {visitorState.phase?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              {currentTable && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-neutral-100 text-sm">
                    Table: {currentTable}
                  </span>
                </div>
              )}

              {orderStatus && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-neutral-100 text-sm">
                    Order: {orderStatus}
                  </span>
                </div>
              )}

              {cookingProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs">Cooking Progress</span>
                    <span className="text-neutral-400 text-xs">{Math.round(cookingProgress)}%</span>
                  </div>
                  <Progress value={cookingProgress} className="h-2" />
                </div>
              )}

              {timeRemaining && timeRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-red-400" />
                  <span className="text-neutral-100 text-sm">
                    Time: {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Chef Status Panel */}
      {role === "chef" && chefState && (
        <div className="absolute top-20 right-4 animate-in slide-in-from-right-10 duration-500">
          <Card className="p-4 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span className="text-neutral-100 font-semibold text-sm">
                  Chef Status
                </span>
              </div>
              
              {chefState.currentOrder && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-green-400" />
                    <span className="text-neutral-100 text-sm">
                      {chefState.currentOrder.dish}
                    </span>
                  </div>
                  
                  {cookingProgress > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-xs">Progress</span>
                        <span className="text-neutral-400 text-xs">{Math.round(cookingProgress)}%</span>
                      </div>
                      <Progress value={cookingProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-neutral-100 text-sm">
                  Score: {cookingScore}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Interaction Hint */}
      {interactionHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-10 duration-500">
          <Card className="px-4 py-2 bg-blue-900/95 backdrop-blur-md border border-blue-500/50 shadow-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-100 text-sm font-medium">
                {interactionHint}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Clock */}
      <div className="absolute top-4 right-4 animate-in slide-in-from-right-10 duration-500">
        <Card className="px-3 py-2 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 shadow-2xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-100 font-mono text-sm">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
