"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface PerformanceMonitorProps {
  isVisible?: boolean
}

export function PerformanceMonitor({ isVisible = false }: PerformanceMonitorProps) {
  const [fps, setFps] = useState(0)
  const [memory, setMemory] = useState<{ used: number; total: number } | null>(null)

  useEffect(() => {
    if (!isVisible) return

    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const updatePerformance = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime

        // Memory usage (if available)
        if ('memory' in performance) {
          const memInfo = (performance as any).memory
          setMemory({
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024)
          })
        }
      }

      animationId = requestAnimationFrame(updatePerformance)
    }

    updatePerformance()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="absolute top-4 right-4 z-50">
      <Card className="p-3 bg-black/80 backdrop-blur-sm border-green-500/30">
        <div className="text-xs text-green-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${fps >= 55 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>FPS: {fps}</span>
          </div>
          {memory && (
            <div className="text-green-300">
              Memory: {memory.used}MB / {memory.total}MB
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
