"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Users, Clock, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { gameDatabase } from "@/lib/game-database"

interface ReceptionMenuProps {
  onClose: () => void
  onBookTable: (tableSize: number) => void
}

export function ReceptionMenu({ onClose, onBookTable }: ReceptionMenuProps) {
  const [selectedTableSize, setSelectedTableSize] = useState<number | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availableTables, setAvailableTables] = useState<any[]>([])

  // Check table availability using database
  useEffect(() => {
    setIsCheckingAvailability(true)
    
    // Simulate brief loading
    const timer = setTimeout(() => {
      const tables = gameDatabase.getTables()
      setAvailableTables(tables)
      setIsCheckingAvailability(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleBookTable = () => {
    if (selectedTableSize) {
      // Find available table using database
      const availableTable = gameDatabase.findAvailableTable(selectedTableSize)
      if (availableTable) {
        // Reserve the table
        const success = gameDatabase.reserveTable(availableTable.id, "visitor")
        if (success) {
          onBookTable(selectedTableSize)
        } else {
          alert("Table is no longer available. Please try again.")
        }
      } else {
        alert("No tables available for your party size. Please try a different size.")
      }
    }
  }

  const getAvailableTablesForSize = (size: number) => {
    return availableTables.filter(table => 
      !table.isOccupied && table.capacity >= size
    )
  }

  const getWaitTimeForSize = (size: number) => {
    const unavailableTables = availableTables.filter(table => 
      table.capacity >= size && table.isOccupied
    )
    
    if (unavailableTables.length === 0) return 0
    return Math.min(...unavailableTables.map(table => 15)) // 15 min wait time
  }

  const tableSizeOptions = [
    { size: 1, label: "1 Guest", icon: "👤", description: "Single diner" },
    { size: 2, label: "2 Guests", icon: "👥", description: "Couple" },
    { size: 4, label: "4 Guests", icon: "👨‍👩‍👧‍👦", description: "Small group" },
    { size: 6, label: "6+ Guests", icon: "👨‍👩‍👧‍👦👶", description: "Large group" }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative max-w-2xl w-full mx-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-amber-500/40 shadow-2xl shadow-amber-500/20">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-50 to-amber-200">
                Welcome to DineVerse
              </h2>
              <p className="text-sm text-amber-100/70">Book Your Table</p>
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
          {isCheckingAvailability ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-amber-100/80 text-center">Checking table availability...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-amber-100/80 text-lg mb-2">How many guests will be dining with you?</p>
                <p className="text-amber-100/60 text-sm">We'll find the perfect table for your party</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {tableSizeOptions.map(({ size, label, icon, description }) => {
                  const availableTables = getAvailableTablesForSize(size)
                  const waitTime = getWaitTimeForSize(size)
                  const isAvailable = availableTables.length > 0
                  
                  return (
                    <Button
                      key={size}
                      variant={selectedTableSize === size ? "default" : "outline"}
                      onClick={() => setSelectedTableSize(size)}
                      disabled={!isAvailable}
                      className={`h-20 flex flex-col gap-2 relative ${
                        selectedTableSize === size
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
                          : isAvailable
                          ? "border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
                          : "border-neutral-600/30 text-neutral-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <div className="text-center">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs opacity-75">{description}</div>
                      </div>
                      
                      {/* Availability indicator */}
                      <div className="absolute top-2 right-2">
                        {isAvailable ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                      
                      {/* Wait time indicator */}
                      {!isAvailable && waitTime > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                            ~{waitTime}min wait
                          </div>
                        </div>
                      )}
                    </Button>
                  )
                })}
              </div>

              {/* Table availability summary */}
              {selectedTableSize && (
                <div className="bg-neutral-800/50 border border-amber-500/20 rounded-lg p-4">
                  <h3 className="text-amber-50 font-semibold mb-2">Table Availability</h3>
                  <div className="space-y-2">
                    {availableTables
                      .filter(table => table.capacity >= selectedTableSize)
                      .map(table => (
                        <div key={table.id} className="flex items-center justify-between text-sm">
                          <span className="text-amber-100/80">
                            Table {table.id} ({table.capacity} seats)
                          </span>
                          <div className="flex items-center gap-2">
                            {!table.isOccupied ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">Available</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-400">Occupied</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-amber-600/50 text-amber-600 hover:bg-amber-600/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBookTable}
                  disabled={!selectedTableSize || getAvailableTablesForSize(selectedTableSize).length === 0}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white disabled:opacity-50"
                >
                  Book Table
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
