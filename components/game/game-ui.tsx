"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Users, Trophy, Target, Loader2, ChefHat, Utensils, Zap, Code } from "lucide-react"

// --- Interface remains the same ---
interface GameUIProps {
  isLocked: boolean
  role: "visitor" | "chef" | null
  onRoleSelect: (role: "visitor" | "chef") => void
  roomId: string
  onRoomIdChange: (roomId: string) => void
  isConnected: boolean
  otherPlayersCount: number
  interactionHint?: string | null
  cookingScore?: number
  completedOrders?: number
}
// ----------------------------------

// --- Utility Components for Visual Flair ---

// A sleek separator line
const Separator = () => (
    <div className="w-px h-6 bg-neutral-700/50" />
)

// A modern, glowing badge
const RoleBadge: React.FC<{ role: "visitor" | "chef" }> = ({ role }) => {
    const isChef = role === "chef"
    const icon = isChef ? <ChefHat className="w-4 h-4 mr-2" /> : <Utensils className="w-4 h-4 mr-2" />
    const color = isChef ? "bg-amber-600 border-amber-400/50 shadow-amber-500/30" : "bg-teal-600 border-teal-400/50 shadow-teal-500/30"
    
    return (
        <span className={`inline-flex items-center text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${color} text-white shadow-lg`}>
            {icon}
            {role}
        </span>
    )
}
// -------------------------------------------


export function GameUI({
  isLocked,
  role,
  onRoleSelect,
  roomId,
  onRoomIdChange,
  isConnected,
  otherPlayersCount,
  interactionHint,
  cookingScore,
  completedOrders,
}: GameUIProps) {
  const [selectedRole, setSelectedRole] = useState<"visitor" | "chef" | null>(null)
  const [inputRoomId, setInputRoomId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  // Use a longer, smoother welcome transition
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 2800)
    return () => clearTimeout(timer)
  }, [])

  const handleJoinRoom = async () => {
    if (selectedRole && inputRoomId.trim()) {
      setIsJoining(true)
      // Longer delay for "smooth as butter" feel
      await new Promise(resolve => setTimeout(resolve, 800))
      onRoomIdChange(inputRoomId.trim())
      onRoleSelect(selectedRole)
      setIsJoining(false)
    }
  }

  // --- Theme Colors ---
  const DARK_BG = "bg-neutral-900/95 backdrop-blur-md"
  const CARD_STYLE = "p-8 max-w-lg w-full bg-neutral-900 border border-neutral-800/80 shadow-3xl shadow-black/50 transition-all duration-300 rounded-xl"
  const ACCENT_PRIMARY = "text-amber-400" // Action, Focus, Chef
  const ACCENT_SECONDARY = "text-teal-400" // Visitor, Detail
  const PRIMARY_TEXT = "text-neutral-50"
  const SECONDARY_TEXT = "text-neutral-400"
  // --------------------

  // Role button base classes for a modern, slightly lifted look
  const roleButtonBase = "py-4 flex flex-col items-center justify-center transition-all duration-300 border-2 rounded-lg text-lg font-bold"
  
  const chefButtonClass = (isSelected: boolean) => 
    isSelected
      ? "bg-amber-600 border-amber-400/50 text-white shadow-xl shadow-amber-700/40 transform scale-[1.02]"
      : "bg-neutral-800 border-neutral-700 text-amber-400 hover:bg-neutral-700/50 hover:border-amber-500/50"
      
  const visitorButtonClass = (isSelected: boolean) =>
    isSelected
      ? "bg-teal-600 border-teal-400/50 text-white shadow-xl shadow-teal-700/40 transform scale-[1.02]"
      : "bg-neutral-800 border-neutral-700 text-teal-400 hover:bg-neutral-700/50 hover:border-teal-500/50"


  return (
    <>
      {/* 1. Enhanced Welcome Screen (More dramatic, high-contrast) */}
      {showWelcome && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-2xl z-[60] animate-in fade-in duration-2000">
          <div className="text-center p-6">
            <h1 className="text-8xl md:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-500 to-amber-300 font-sans mb-8 animate-pulse-slow drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
              DineVerse
            </h1>
            <p className={`text-xl md:text-3xl ${ACCENT_SECONDARY} tracking-widest font-light uppercase animate-in slide-in-from-bottom-10 duration-1500 delay-500`}>
              Cooperative Culinary Command
            </p>
          </div>
        </div>
      )}

      {/* 2. Professional Join Screen (Slightly larger, better-spaced) */}
      {!role && !showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50 animate-in fade-in duration-500">
          <Card className={`${CARD_STYLE} animate-in slide-in-from-bottom-12 duration-700`}>
            <h1 className={`text-5xl font-extrabold ${PRIMARY_TEXT} mb-3 text-center`}>
              CONNECT
            </h1>
            <p className={`${SECONDARY_TEXT} text-center mb-8 text-lg`}>Initiate your cooperative session.</p>

            <div className="space-y-8">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className={`text-sm ${ACCENT_PRIMARY} font-extrabold uppercase block tracking-wider`}>Select Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRole("visitor")}
                    disabled={isJoining}
                    className={`${roleButtonBase} ${visitorButtonClass(selectedRole === "visitor")}`}
                  >
                    <Utensils className="w-6 h-6 mb-2" /> 
                    <span>VISITOR</span>
                  </button>
                  <button
                    onClick={() => setSelectedRole("chef")}
                    disabled={isJoining}
                    className={`${roleButtonBase} ${chefButtonClass(selectedRole === "chef")}`}
                  >
                    <ChefHat className="w-6 h-6 mb-2" /> 
                    <span>CHEF</span>
                  </button>
                </div>
              </div>

              {/* Room Code Input */}
              <div className="space-y-3">
                <label className={`text-sm ${ACCENT_PRIMARY} font-extrabold uppercase block tracking-wider`}>Room Identifier</label>
                <Input
                  type="text"
                  placeholder="DINER-789"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} // Restrict and uppercase
                  className="bg-neutral-800 border-neutral-700 text-xl text-center p-3 text-neutral-50 placeholder:text-neutral-500 focus:border-amber-500/80 transition-all duration-300 font-mono tracking-widest h-14"
                  maxLength={15}
                />
                <p className="text-xs text-neutral-500 mt-1">Use a unique code to start a new room or join an existing one.</p>
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoinRoom}
                disabled={!selectedRole || !inputRoomId.trim() || isJoining}
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold disabled:opacity-30 shadow-2xl shadow-amber-700/30 transition-all duration-300 h-14 text-xl uppercase tracking-widest"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    ESTABLISHING CONNECTION...
                  </>
                ) : (
                  "INITIATE DINEVERSE"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}


      {/* 3. Professional In-Game HUD (when locked) */}
      {role && isLocked && (
        <>
          {/* Top Info Bar (Floating, Tech-Inspired Panel) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-10 duration-500">
            <Card className={`px-8 py-3 ${DARK_BG} border-2 border-neutral-700/50 shadow-2xl shadow-black/70 rounded-full md:rounded-xl`}>
              <div className="flex items-center gap-6 md:gap-8">
                
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" : "bg-red-500 shadow-lg shadow-red-500/50"}`}
                    />
                    <span className={`${PRIMARY_TEXT} font-semibold text-sm hidden md:inline`}>STATUS: <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "ONLINE" : "OFFLINE"}</span></span>
                </div>

                <Separator />
                
                {/* Role Status */}
                <RoleBadge role={role} />

                <Separator />
                
                {/* Players & Room ID */}
                <div className="flex items-center gap-4">
                  <Code className={`w-5 h-5 ${ACCENT_PRIMARY}`} />
                  <span className={`${SECONDARY_TEXT} font-medium text-sm hidden sm:inline`}>
                    ROOM: <span className={`${PRIMARY_TEXT} font-mono font-bold tracking-widest`}>{roomId}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${ACCENT_SECONDARY}`} />
                    <span className={`${PRIMARY_TEXT} font-bold text-lg`}>
                      {otherPlayersCount + 1}<span className={`${SECONDARY_TEXT} text-xs font-normal`}>/2</span>
                    </span>
                  </div>
                </div>
                
                {/* Chef Score/Orders */}
                {role === "chef" && cookingScore !== undefined && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400 drop-shadow-lg shadow-amber-500" />
                        <span className={`${PRIMARY_TEXT} font-extrabold text-xl`}>{cookingScore}</span>
                        <span className={`${SECONDARY_TEXT} text-xs font-normal`}>SCORE</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal-400 drop-shadow-lg shadow-teal-500" />
                        <span className={`${PRIMARY_TEXT} font-extrabold text-xl`}>{completedOrders || 0}</span>
                        <span className={`${SECONDARY_TEXT} text-xs font-normal`}>ORDERS</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Interaction Hint (High-Visibility, Action-Focused) */}
          {interactionHint && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-6 duration-300">
              <Card className="px-6 py-3 bg-amber-600 border-2 border-amber-400 shadow-3xl shadow-amber-800/80 rounded-full animate-pulse-light">
                <p className="text-white font-extrabold text-lg tracking-wide uppercase">{interactionHint}</p>
              </Card>
            </div>
          )}

          {/* Controls/Keybinds UI (Minimalist, Hacked-together aesthetic) */}
          <div className="absolute bottom-4 left-4 z-30 animate-in slide-in-from-left-8 duration-500">
            <Card className={`px-5 py-3 ${DARK_BG} border-2 border-neutral-700/50 shadow-xl rounded-lg`}>
              <h4 className={`text-xs uppercase font-extrabold tracking-widest mb-3 ${ACCENT_SECONDARY}`}>System Controls</h4>
              <div className="flex flex-col gap-2 text-sm text-neutral-400">
                {[
                  ["W A S D", "Movement"],
                  ["E", "Interact / Use"],
                  ...(role === "chef" ? [["F", "Open Kitchen"] as [string, string]] : []),
                  ...(role === "visitor" ? [
                    ["J", "Sit Down"] as [string, string],
                    ["M", "Open Menu"] as [string, string]
                  ] : []),
                  ["ESC", "Toggle Cursor"],
                  ["P", "Debug View"],
                ].map(([key, action]) => (
                  <div className="flex items-center justify-between gap-5" key={key}>
                    <span className="font-medium text-neutral-300">{action}</span>
                    <kbd className="px-3 py-1 bg-neutral-800 rounded-md text-amber-400 font-mono text-xs shadow-inner shadow-black/50 min-w-[55px] text-center border border-neutral-700/50">{key}</kbd>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Modern Crosshair (Finer lines, more geometric) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="relative w-10 h-10 opacity-90 transition-all duration-100">
              {/* Horizontal line segments */}
              <div className="absolute top-1/2 left-1/2 w-3 h-0.5 bg-amber-400/80 rounded-full -translate-y-1/2 -translate-x-[calc(100%+4px)]" />
              <div className="absolute top-1/2 left-1/2 w-3 h-0.5 bg-amber-400/80 rounded-full -translate-y-1/2 translate-x-[4px]" />
              {/* Vertical line segments */}
              <div className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-amber-400/80 rounded-full -translate-x-1/2 -translate-y-[calc(100%+4px)]" />
              <div className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-amber-400/80 rounded-full -translate-x-1/2 translate-y-[4px]" />
              {/* Center Dot with a glow effect */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-amber-500/80 animate-pulse-fast" />
            </div>
          </div>
        </>
      )}
    </>
  )
}

// NOTE: Custom Tailwind classes like `animate-pulse-slow`, `animate-pulse-fast`, 
// and `shadow-3xl` need to be defined in your `tailwind.config.js` or global CSS
// for the full effect. The provided code assumes you would define them like this:
/*
// tailwind.config.js
theme: {
  extend: {
    animation: {
      'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    keyframes: {
      'pulse-slow': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.6' },
      },
      'pulse-light': {
        '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 10px rgba(252, 211, 77, 0.5)' },
        '50%': { transform: 'scale(1.03)', boxShadow: '0 0 20px rgba(252, 211, 77, 0.8)' },
      }
    }
  }
}
*/