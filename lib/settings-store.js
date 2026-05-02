"use client"

const STORAGE_KEY = "comfy-homescreen-settings"

const defaultSettings = {
  backgroundType: 'particles',
  themeName: 'Azul', // Default for particles
  customBgColor: '#1a1a1a',
  centralClockType: 'digital',
  showSeconds: true,
  weatherShowLocation: true,
  weatherShowStats: true,
}

export function getSettings() {
  if (typeof window === "undefined") return defaultSettings

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error("Error reading settings:", e)
  }

  return defaultSettings
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return

  try {
    const current = getSettings()
    const newSettings = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  } catch (e) {
    console.error("Error saving settings:", e)
  }
}
