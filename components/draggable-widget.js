"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { GripVertical, X } from "lucide-react"

export default function DraggableWidget({
  id,
  index,
  children,
  cardClass,
  onDragStart,
  onDragEnd,
  onDrop,
  onRemove,
  isDragging,
  isDraggable,
  animationDelay
}) {
  const [isOver, setIsOver] = useState(false)

  const handleDragStart = (e) => {
    if (!isDraggable) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData("widgetId", id)
    onDragStart?.(id)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (isDraggable) {
      setIsOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsOver(false)
    if (!isDraggable) return

    const widgetId = e.dataTransfer.getData("widgetId")
    // Pass the index of THIS widget as the target index
    onDrop?.(widgetId, index)
  }

  return (
    <Card
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${cardClass} 
        relative group
        transition-all duration-300 ease-out
        ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}
        ${isOver ? "ring-2 ring-primary/50" : ""}
        animate-in fade-in slide-in-from-bottom-2 duration-500
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
      `}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {isDraggable && (
        <>
          <div
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary/50 z-20"
            title="Arrastrar para mover"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer p-1 rounded hover:bg-destructive/10 z-20"
              title="Eliminar widget"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </>
      )}
      {children}
    </Card>
  )
}
