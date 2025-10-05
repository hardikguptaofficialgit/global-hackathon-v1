"use client"

import { useEffect, useState } from "react"
import { GameScene } from "./game-scene"

export function ClientGameScene() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-amber-100/80">Loading DineVerse...</p>
        </div>
      </div>
    )
  }

  return <GameScene />
}
