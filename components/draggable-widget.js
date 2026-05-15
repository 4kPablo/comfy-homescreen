"use client"

import { Card } from "@/components/ui/card"
import { GripVertical, X } from "lucide-react"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function DraggableWidget({
  id,
  children,
  cardClass,
  onRemove,
  isDraggable,
  animationDelay,
  isOverlay = false
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable || isOverlay });

  const style = isOverlay ? {
    cursor: "grabbing",
    zIndex: 9999,
  } : {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.3 : 1,
    animationDelay: `${animationDelay}ms`
  };

  const activeDraggingStyle = isOverlay || isDragging;

  return (
    <div
      ref={isOverlay ? null : setNodeRef}
      style={style}
    >
      <Card
        className={`
          ${cardClass} 
          relative group
          transition-all duration-300 ease-out
          ${activeDraggingStyle ? "ring-2 ring-primary scale-105 shadow-2xl bg-primary/10" : "scale-100"}
          animate-in fade-in slide-in-from-bottom-2
        `}
      >
        {isDraggable && (
          <>
            <div
              {...(isOverlay ? {} : attributes)}
              {...(isOverlay ? {} : listeners)}
              className={`absolute top-2 left-2 duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-secondary/80 bg-secondary/40 backdrop-blur-sm z-20 shadow-sm ${isOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
              title="Arrastrar para mover"
            >
              <GripVertical className="w-4 h-4 text-foreground" />
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer p-1.5 rounded-md hover:bg-destructive/90 bg-destructive/50 backdrop-blur-sm text-white z-20 shadow-sm"
                title="Eliminar widget"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
        {children}
      </Card>
    </div>
  )
}
