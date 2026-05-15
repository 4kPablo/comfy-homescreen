"use client"

const STORAGE_KEY = "comfy-homescreen-widget-layout"

const defaultLayout = {
  left: ["analog-clock", "calendar", "weather", "quick-links"],
  right: ["pomodoro", "tech-news", "task-list", "progress-bars", "ambient"],
}

export function getWidgetLayout() {
  if (typeof window === "undefined") return defaultLayout

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error("Error reading widget layout:", e)
  }

  return defaultLayout
}

export function saveWidgetLayout(layout) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch (e) {
    console.error("Error saving widget layout:", e)
  }
}

export function moveWidget(widgetId, fromColumn, toColumn, layout, destinationIndex = null) {
  const newLayout = {
    left: [...layout.left],
    right: [...layout.right],
  }

  // Remove from source
  const sourceIndex = newLayout[fromColumn].indexOf(widgetId)
  if (sourceIndex > -1) {
    newLayout[fromColumn].splice(sourceIndex, 1)
  }

  // Add to destination
  if (destinationIndex !== null && destinationIndex !== undefined) {
    if (fromColumn === toColumn && destinationIndex > sourceIndex) {
      // If moving down in same column, the index might shift after removal (though we removed first, so it's tricky)
      // Actually, we removed it, so the indices shifted up. 
      // If we simply insert at destinationIndex, it should be fine as long as we treat destinationIndex as "intended position"
      newLayout[toColumn].splice(destinationIndex, 0, widgetId)
    } else {
      newLayout[toColumn].splice(destinationIndex, 0, widgetId)
    }
  } else {
    // If no index specified (e.g. dropped on container), add to end
    newLayout[toColumn].push(widgetId)
  }

  return newLayout
}
