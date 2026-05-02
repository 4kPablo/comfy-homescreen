"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import AnalogClock from "@/components/analog-clock"
import MonthCalendar from "@/components/month-calendar"
import WeatherWidget from "@/components/weather-widget"
import TechNews from "@/components/tech-news"
import ProgressBars from "@/components/progress-bars"
import YoutubeWidget from "@/components/youtube-widget"
import ParticlesBg from "@/components/particles-bg"
import GradientBg from "@/components/backgrounds/gradient-bg"
import GridBg from "@/components/backgrounds/grid-bg"
import SpaceBg from "@/components/backgrounds/space-bg"
import PomodoroTimer from "@/components/pomodoro-timer"
import AmbientSounds from "@/components/ambient-sounds"
import HourlyChime from "@/components/hourly-chime"
import DraggableWidget from "@/components/draggable-widget"
import { getWidgetLayout, saveWidgetLayout, moveWidget } from "@/lib/widget-store"
import { getSettings, saveSettings } from "@/lib/settings-store"
import { Settings2, Check, Palette, X, Image as ImageIcon, ArrowLeft, Focus, Maximize, Minimize, Plus, Clock, Monitor, EyeOff } from "lucide-react"
import DigitalClockWidget from "@/components/digital-clock"

const AutoFitColumn = ({ children, isCustomizationMode, onDrop }) => {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return
    const checkScale = () => {
      const containerHeight = containerRef.current.clientHeight
      const contentHeight = contentRef.current.scrollHeight
      // We add a small buffer (e.g., 20px) to prevent exact boundary flickering
      if (contentHeight > containerHeight && contentHeight > 0) {
        setScale(containerHeight / contentHeight)
      } else {
        setScale(1)
      }
    }

    const resizeObserver = new ResizeObserver(checkScale)
    resizeObserver.observe(containerRef.current)
    resizeObserver.observe(contentRef.current)
    // Run once on mount
    checkScale()
    return () => resizeObserver.disconnect()
  }, [children])

  return (
    <div
      ref={containerRef}
      className={`w-72 flex-shrink-0 h-[80vh] flex flex-col justify-center transition-all duration-700 ${isCustomizationMode ? "border-2 border-dashed border-primary/20 rounded-xl p-2 bg-primary/5" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div
        ref={contentRef}
        className="w-full space-y-4 flex flex-col origin-center transition-transform duration-300"
        style={{ transform: scale < 1 ? `scale(${scale})` : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

const FocusLauncherWidget = ({ onFocusToggle }) => (
  <div
    onClick={onFocusToggle}
    className="flex flex-row items-center justify-center p-3 gap-2 h-full cursor-pointer group rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
  >
    <Focus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors opacity-50 group-hover:opacity-100" />
    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Entrar a Focus</span>
  </div>
)

const EMPTY_PROPS = {}

const widgetComponents = {
  "analog-clock": { component: AnalogClock, props: (state) => ({ time: state.currentTime, hideSeconds: state.isFocusMode || !state.showSeconds }) },
  "digital-clock": { component: DigitalClockWidget, props: (state) => ({ time: state.currentTime, showSeconds: state.showSeconds }) },
  "calendar": { component: MonthCalendar, props: (state) => ({ currentDate: state.currentTime, pomodoroRefresh: state.pomodoroRefresh }) },
  "ambient": { component: AmbientSounds, props: (state) => ({ ref: state.ambientRef }) },
  "weather": { component: WeatherWidget, props: (state) => ({ showLocation: state.weatherShowLocation, showStats: state.weatherShowStats }) },
  "pomodoro": { component: PomodoroTimer, props: (state) => ({ onPomodoroComplete: state.handlePomodoroComplete, onFocusToggle: state.handleFocusToggle, onPomodoroActive: state.handlePomodoroActive, isFocusMode: state.isFocusMode }) },
  "tech-news": { component: TechNews, props: () => EMPTY_PROPS },
  "progress-bars": { component: ProgressBars, props: (state) => ({ currentTime: state.currentTime }) },
  "youtube": { component: YoutubeWidget, props: (state) => ({ videoId: state.videoId, setVideoId: state.setVideoId, isVideoBackground: state.isVideoBackground, setIsVideoBackground: state.setIsVideoBackground }) },
}

// Configuración de Temas por Fondo
const THEME_CONFIG = {
  'particles': [
    { name: "Azul", primary: "oklch(0.65 0.18 220)", accent: "oklch(0.7 0.2 180)" },
    { name: "Púrpura", primary: "oklch(0.65 0.25 300)", accent: "oklch(0.7 0.2 280)" },
    { name: "Esmeralda", primary: "oklch(0.7 0.2 160)", accent: "oklch(0.75 0.22 150)" },
    { name: "Rosa", primary: "oklch(0.7 0.2 340)", accent: "oklch(0.75 0.22 330)" },
  ],
  'gradient-aurora': [
    { name: "Cyber", primary: "oklch(0.6 0.15 240)", accent: "oklch(0.7 0.25 160)" },
    { name: "Neon", primary: "oklch(0.65 0.25 310)", accent: "oklch(0.7 0.2 280)" },
    { name: "Glacier", primary: "oklch(0.75 0.1 200)", accent: "oklch(0.8 0.1 190)" },
    { name: "Fuego", primary: "oklch(0.65 0.22 30)", accent: "oklch(0.7 0.25 20)" },
  ],
  'gradient-forest': [
    { name: "Verde", primary: "oklch(0.8 0.15 145)", accent: "oklch(0.75 0.2 130)" },
    { name: "Coral", primary: "oklch(0.75 0.15 25)", accent: "oklch(0.8 0.2 15)" },
    { name: "Ámbar", primary: "oklch(0.8 0.18 70)", accent: "oklch(0.85 0.2 60)" },
    { name: "Lavanda", primary: "oklch(0.75 0.12 290)", accent: "oklch(0.8 0.15 280)" },
  ],
  'grid': [
    { name: "Vapor", primary: "oklch(0.65 0.25 300)", accent: "oklch(0.7 0.2 190)" },
    { name: "Retro", primary: "oklch(0.6 0.2 20)", accent: "oklch(0.8 0.3 350)" },
    { name: "Cyan", primary: "oklch(0.7 0.2 200)", accent: "oklch(0.75 0.22 190)" },
    { name: "Lime", primary: "oklch(0.75 0.2 130)", accent: "oklch(0.8 0.22 120)" },
  ],
  'space': [
    { name: "Sci-Fi", primary: "oklch(0.7 0.05 240)", accent: "oklch(0.8 0.1 200)" },
    { name: "Void", primary: "oklch(0.8 0 0)", accent: "oklch(0.6 0.2 260)" },
    { name: "Nebula", primary: "oklch(0.65 0.2 310)", accent: "oklch(0.7 0.22 300)" },
    { name: "Stellar", primary: "oklch(0.7 0.18 180)", accent: "oklch(0.75 0.2 170)" },
  ],
  'solid': [
    { name: "Azul", primary: "#3b82f6", accent: "#60a5fa", bg: "#1e293b" },
    { name: "Verde", primary: "#10b981", accent: "#34d399", bg: "#064e3b" },
    { name: "Púrpura", primary: "#a855f7", accent: "#c084fc", bg: "#2e1065" },
    { name: "Rosa", primary: "#ec4899", accent: "#f472b6", bg: "#500724" },
    { name: "Naranja", primary: "#f97316", accent: "#fb923c", bg: "#431407" },
    { name: "Cyan", primary: "#06b6d4", accent: "#22d3ee", bg: "#083344" },
    { name: "Amarillo", primary: "#eab308", accent: "#facc15", bg: "#422006" },
    { name: "Rojo", primary: "#ef4444", accent: "#f87171", bg: "#450a0a" },
  ]
}

const backgroundOptions = [
  { id: 'particles', name: 'Partículas' },
  { id: 'gradient-aurora', name: 'Aurora' },
  { id: 'gradient-forest', name: 'Bosque' },
  { id: 'grid', name: 'Retro Grid' },
  { id: 'space', name: 'Espacio' },
  { id: 'solid', name: 'Solido' },
]

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pomodoroRefresh, setPomodoroRefresh] = useState(0)
  const [hourlyPulse, setHourlyPulse] = useState(false)
  const [layout, setLayout] = useState({ left: [], right: [] })
  const [draggingWidget, setDraggingWidget] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [isCustomizationMode, setIsCustomizationMode] = useState(false)
  const [backgroundType, setBackgroundType] = useState('particles')
  const [customBgColor, setCustomBgColor] = useState('#1a1a1a')
  const [centralClockType, setCentralClockType] = useState('digital')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showSeconds, setShowSeconds] = useState(true)
  const [weatherShowLocation, setWeatherShowLocation] = useState(true)
  const [weatherShowStats, setWeatherShowStats] = useState(true)

  // Youtube State hoisted
  const [videoId, setVideoIdState] = useState("")
  const [isVideoBackground, setIsVideoBackground] = useState(false)
  const [isFullscreenViewport, setIsFullscreenViewport] = useState(false)
  const [youtubeFullscreen, setYoutubeFullscreen] = useState(false)

  const ambientRef = useRef(null)

  const setVideoId = useCallback((id) => {
    setVideoIdState(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("comfy-homescreen-youtube", id)
    }
  }, [])

  const currentHour = currentTime.getHours()
  const isNightMode = currentHour >= 0 && currentHour < 7

  useEffect(() => {
    setMounted(true)
    const savedLayout = getWidgetLayout()
    const migrateProgress = (col) => col.map(id => id === "progress" ? "progress-bars" : id)
    savedLayout.left = migrateProgress(savedLayout.left)
    savedLayout.right = migrateProgress(savedLayout.right)
    if (!savedLayout.left.includes("youtube") && !savedLayout.right.includes("youtube")) {
      savedLayout.left.push("youtube")
      saveWidgetLayout(savedLayout)
    }
    setLayout(savedLayout)

    const savedVideo = localStorage.getItem("comfy-homescreen-youtube")
    if (savedVideo) {
      setVideoIdState(savedVideo)
    }

    // Load visual settings
    const savedSettings = getSettings()
    setBackgroundType(savedSettings.backgroundType)
    setCustomBgColor(savedSettings.customBgColor)
    setCentralClockType(savedSettings.centralClockType || 'digital')
    setShowSeconds(savedSettings.showSeconds ?? true)
    setWeatherShowLocation(savedSettings.weatherShowLocation ?? true)
    setWeatherShowStats(savedSettings.weatherShowStats ?? true)

    // Apply saved theme
    const themes = THEME_CONFIG[savedSettings.backgroundType] || THEME_CONFIG['particles']
    const savedTheme = themes.find(t => t.name === savedSettings.themeName) || themes[0]
    if (savedTheme) {
      applyTheme(savedTheme, false) // false to avoid redundant save during load
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handlePomodoroComplete = useCallback(() => {
    setPomodoroRefresh((prev) => prev + 1)
  }, [])

  const handleHourlyChime = useCallback(() => {
    setHourlyPulse(true)
    setTimeout(() => setHourlyPulse(false), 2000)
  }, [])

  const handleFocusToggle = useCallback(() => {
    setIsFocusMode(prev => !prev)
  }, [])

  const handlePomodoroActive = useCallback((active) => {
    if (ambientRef.current) {
      if (active) {
        ambientRef.current.autoPlay()
      } else {
        ambientRef.current.autoPause()
      }
    }
  }, [])

  const handleDrop = useCallback((targetColumn, targetIndex) => (draggedWidgetId) => {
    const sourceColumn = layout.left.includes(draggedWidgetId) ? "left" : "right"

    // Allow reordering in same column or moving between columns
    const newLayout = moveWidget(draggedWidgetId, sourceColumn, targetColumn, layout, targetIndex)
    setLayout(newLayout)
    saveWidgetLayout(newLayout)
  }, [layout])

  const handleRemoveWidget = useCallback((widgetId) => {
    const newLayout = {
      left: layout.left.filter(id => id !== widgetId),
      right: layout.right.filter(id => id !== widgetId)
    }
    setLayout(newLayout)
    saveWidgetLayout(newLayout)
  }, [layout])

  const handleAddWidget = useCallback((widgetId) => {
    const targetColumn = layout.left.length <= layout.right.length ? "left" : "right"
    const newLayout = {
      ...layout,
      [targetColumn]: [...layout[targetColumn], widgetId]
    }
    setLayout(newLayout)
    saveWidgetLayout(newLayout)
  }, [layout])

  const handleClockTypeChange = (type) => {
    setCentralClockType(type)
    saveSettings({ centralClockType: type })
  }

  const applyTheme = (theme, shouldSave = true) => {
    document.documentElement.style.setProperty('--primary', theme.primary)
    document.documentElement.style.setProperty('--accent', theme.accent)
    document.documentElement.style.setProperty('--ring', theme.primary)
    if (theme.bg) {
      setCustomBgColor(theme.bg)
    }

    if (shouldSave) {
      saveSettings({
        themeName: theme.name,
        backgroundType: backgroundType,
        customBgColor: theme.bg || customBgColor,
        centralClockType: centralClockType
      })
    }
  }



  // Auto-switch theme when background changes
  const handleBackgroundChange = (type) => {
    setBackgroundType(type)
    const allowedThemes = THEME_CONFIG[type] || THEME_CONFIG['particles']
    if (allowedThemes.length > 0) {
      const defaultTheme = allowedThemes[0]
      applyTheme(defaultTheme, false)
      saveSettings({
        backgroundType: type,
        themeName: defaultTheme.name,
        customBgColor: defaultTheme.bg || customBgColor,
        centralClockType: centralClockType
      })
    }
  }

  const hours = currentTime.getHours().toString().padStart(2, "0")
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")
  const seconds = currentTime.getSeconds().toString().padStart(2, "0")
  const dateOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  }
  const formattedDate = currentTime.toLocaleDateString("es-ES", dateOptions)

  const cardClass = isNightMode
    ? "p-4 bg-black/60 backdrop-blur-sm border-border/50 transition-colors duration-500"
    : "p-4 bg-card/80 backdrop-blur-sm border-border transition-colors duration-500"

  const state = {
    currentTime,
    pomodoroRefresh,
    handlePomodoroComplete,
    isFocusMode,
    handleFocusToggle,
    handlePomodoroActive,
    ambientRef,
    videoId,
    setVideoId,
    isVideoBackground,
    setIsVideoBackground,
    showSeconds,
    weatherShowLocation,
    weatherShowStats
  }

  const renderWidget = (widgetId, index, column) => {
    const widgetConfig = widgetComponents[widgetId]
    if (!widgetConfig) return null

    if (widgetId === 'pomodoro') {
      return (
        <DraggableWidget
          key={widgetId}
          id={widgetId}
          index={index}
          cardClass={cardClass}
          onDragStart={setDraggingWidget}
          onDragEnd={() => setDraggingWidget(null)}
          onDrop={handleDrop(column, index)}
          isDragging={draggingWidget === widgetId}
          isDraggable={isCustomizationMode}
          animationDelay={100 + index * 50}
        >
          <FocusLauncherWidget onFocusToggle={state.handleFocusToggle} />
        </DraggableWidget>
      )
    }

    const Component = widgetConfig.component
    const props = widgetConfig.props(state)

    return (
      <DraggableWidget
        key={widgetId}
        id={widgetId}
        index={index}
        cardClass={cardClass}
        onDragStart={setDraggingWidget}
        onDragEnd={() => setDraggingWidget(null)}
        onDrop={handleDrop(column, index)}
        onRemove={isCustomizationMode ? handleRemoveWidget : undefined}
        isDragging={draggingWidget === widgetId}
        isDraggable={isCustomizationMode}
        animationDelay={100 + index * 50}
      >
        <Component {...props} />
      </DraggableWidget>
    )
  }

  const renderBackground = () => {
    switch (backgroundType) {
      case 'gradient-aurora': return <GradientBg type="aurora" />
      case 'gradient-forest': return <GradientBg type="forest" />
      case 'grid': return <GridBg />
      case 'space': return <SpaceBg />
      case 'solid': return null // Default bg color
      case 'particles':
      default: return <ParticlesBg />
    }
  }

  const currentThemes = THEME_CONFIG[backgroundType] || THEME_CONFIG['particles']

  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-primary text-2xl font-mono animate-pulse">Cargando...</div>
      </div>
    )
  }

  const availableWidgets = Object.keys(widgetComponents).filter(
    id => id !== "progress" && !layout.left.includes(id) && !layout.right.includes(id)
  )

  return (
    <div
      className={`h-screen overflow-hidden w-full flex flex-col items-center justify-center relative transition-colors duration-1000 ${isNightMode ? "bg-black" : "animated-bg"}`}
      style={backgroundType === 'solid' ? { backgroundColor: customBgColor } : {}}
    >
      {renderBackground()}
      <HourlyChime currentTime={currentTime} isNightMode={isNightMode} onChime={handleHourlyChime} />

      {/* Button to toggle Customization Mode */}
      {!isCustomizationMode && (
        <button
          onClick={() => setIsCustomizationMode(true)}
          className="absolute top-6 right-6 px-4 py-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:scale-105 transition-transform z-50 group flex items-center gap-2"
          title="Personalizar Interface"
        >
          <Settings2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {/* <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground"></span> */}
        </button>
      )}

      {/* Customization Toolbar */}
      {isCustomizationMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl border border-primary/20 p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-top-10 min-w-[300px]">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">Personalización</span>
            </div>
            <button
              onClick={() => setIsCustomizationMode(false)}
              className="p-1 hover:bg-destructive/10 rounded-full group"
            >
              <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Palette className="w-3 h-3" /> Temas (Ajustados al Fondo)
            </div>
            <div className="flex gap-2">
              {currentThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => applyTheme(theme)}
                  className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform shadow-sm"
                  style={{ background: theme.primary }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ImageIcon className="w-3 h-3" /> Fondos
            </div>
            <div className="grid grid-cols-3 gap-2">
              {backgroundOptions.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleBackgroundChange(bg.id)}
                  className={`text-xs p-2 rounded-md border transition-all ${backgroundType === bg.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                    }`}
                >
                  {bg.name}
                </button>
              ))}
            </div>
          </div>


          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="w-3 h-3" /> Tipo de Reloj Central
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleClockTypeChange('digital')}
                className={`flex items-center justify-center gap-1 text-xs p-2 rounded-md border transition-all ${centralClockType === 'digital'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                  }`}
              >
                <Monitor className="w-3 h-3" /> Digital
              </button>
              <button
                onClick={() => handleClockTypeChange('analog')}
                className={`flex items-center justify-center gap-1 text-xs p-2 rounded-md border transition-all ${centralClockType === 'analog'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                  }`}
              >
                <Clock className="w-3 h-3" /> Analógico
              </button>
              <button
                onClick={() => handleClockTypeChange('hidden')}
                className={`flex items-center justify-center gap-1 text-xs p-2 rounded-md border transition-all ${centralClockType === 'hidden'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                  }`}
              >
                <EyeOff className="w-3 h-3" /> Oculto
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Settings2 className="w-3 h-3" /> Ajustes de Widgets
            </div>
            <div className="flex flex-col gap-2 bg-secondary/30 p-2 rounded-lg border border-border">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={showSeconds} onChange={(e) => { setShowSeconds(e.target.checked); saveSettings({ showSeconds: e.target.checked }) }} className="rounded border-border" />
                Mostrar Segundos (Relojes)
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={weatherShowLocation} onChange={(e) => { setWeatherShowLocation(e.target.checked); saveSettings({ weatherShowLocation: e.target.checked }) }} className="rounded border-border" />
                Mostrar Ubicación (Clima)
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={weatherShowStats} onChange={(e) => { setWeatherShowStats(e.target.checked); saveSettings({ weatherShowStats: e.target.checked }) }} className="rounded border-border" />
                Mostrar Detalles (Clima)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Plus className="w-3 h-3" /> Agregar Widget
            </div>
            <div className="flex flex-wrap gap-2">
              {availableWidgets.length > 0 ? availableWidgets.map(widgetId => (
                <button
                  key={widgetId}
                  onClick={() => handleAddWidget(widgetId)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors capitalize flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {widgetId.replace('-', ' ')}
                </button>
              )) : (
                <span className="text-xs text-muted-foreground italic">Todos los widgets en uso</span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Arrastra los widgets para reordenarlos
          </div>
        </div>
      )}

      {isCustomizationMode && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setIsCustomizationMode(false)}></div>
      )}

      <div className={`w-full relative z-10 h-full flex transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCustomizationMode ? "scale-95" : ""}`}>
        {/* === MODO NORMAL === */}
        <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isFocusMode ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
          {/* Main Content Area */}
          <div className={`relative z-10 w-full h-full flex items-center justify-center pointer-events-none p-8`}>
            <div className={`w-full flex gap-8 h-full pt-24 pb-8 transition-all duration-700 pointer-events-auto ${videoId && !isVideoBackground ? "max-w-full px-2" : "max-w-[1400px] px-8"}`}>

              {/* Columna izquierda */}
              <AutoFitColumn
                isCustomizationMode={isCustomizationMode}
                onDrop={(e) => {
                  e.preventDefault()
                  const widgetId = e.dataTransfer.getData("widgetId")
                  if (widgetId) handleDrop("left", null)(widgetId)
                }}
              >
                {layout.left.map((widgetId, index) => renderWidget(widgetId, index, "left"))}
              </AutoFitColumn>

              {/* Centro - Reloj principal / Youtube */}
              <div className="flex-1 flex flex-col items-center justify-center">

                {videoId && (
                  <div className={
                    isVideoBackground
                      ? "fixed w-0 h-0 opacity-0 pointer-events-none"
                      : isFullscreenViewport
                        ? "fixed inset-0 z-[100] w-full h-full bg-black flex items-center justify-center"
                        : "w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative z-20 group"
                  }>
                    {!isVideoBackground && (
                      <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsFullscreenViewport(!isFullscreenViewport)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                          {isFullscreenViewport ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                        <button onClick={() => { setVideoId(""); setIsVideoBackground(false); setIsFullscreenViewport(false); }} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <iframe
                      id="main-youtube-frame"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={isFullscreenViewport ? "w-full h-full" : "absolute inset-0 w-full h-full"}
                    ></iframe>
                  </div>
                )}

                {(!videoId || isVideoBackground) && centralClockType !== 'hidden' ? (
                  <div className="text-center flex flex-col items-center">
                    {centralClockType === 'analog' ? (
                      <div className={`transition-all duration-500 mb-6 relative w-96 max-w-full ${hourlyPulse ? "scale-105" : ""}`}>
                        <AnalogClock time={currentTime} hideSeconds={isFocusMode || !showSeconds} className="w-full" />
                        {hourlyPulse && (
                          <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping opacity-50 z-[-1]" style={{ margin: '8%' }}></div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`font-mono text-9xl font-bold tracking-tight mb-3 transition-all duration-500 flex items-baseline ${hourlyPulse ? "text-accent scale-105 drop-shadow-[0_0_30px_var(--accent)]" : "text-primary"} ${backgroundType === 'space' ? "text-stroke-2" : "text-shadow-sm"}`}
                        style={backgroundType === 'space' ? { textShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2)', WebkitTextStroke: '2px rgba(255,255,255,0.3)' } : {}}
                      >
                        {hours}:{minutes}{showSeconds && <span className="text-4xl text-muted-foreground ml-2">{seconds}</span>}
                      </div>
                    )}
                    <div className={`text-2xl text-muted-foreground capitalize transition-all duration-300 ${backgroundType === 'space' ? "text-stroke-1 text-white/90" : "text-shadow-sm"}`}>
                      {formattedDate}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Columna derecha */}
              <AutoFitColumn
                isCustomizationMode={isCustomizationMode}
                onDrop={(e) => {
                  e.preventDefault()
                  const widgetId = e.dataTransfer.getData("widgetId")
                  if (widgetId) handleDrop("right", null)(widgetId)
                }}
              >
                {layout.right.map((widgetId, index) => renderWidget(widgetId, index, "right"))}
              </AutoFitColumn>
            </div>
          </div>
        </div>

        {/* === MODO FOCUS === */}
        <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-md transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isFocusMode ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}>
          <div className="w-full max-w-5xl flex flex-col min-h-[80vh] items-center">
            <div className="w-full flex items-center justify-between mb-10 px-8">
              <button onClick={() => setIsFocusMode(false)} className="px-5 py-2.5 border border-border bg-card/80 backdrop-blur-md rounded-full text-muted-foreground hover:text-foreground hover:bg-card transition-colors flex items-center gap-2 shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Salir del Modo Focus
              </button>

              <div className="text-3xl font-mono font-bold text-foreground">
                {hours}:{minutes}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Focus Activo
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full px-8 pb-10">
              <div className={`lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center min-h-[450px]`}>
                <div className="w-full max-w-2xl bg-card/30 backdrop-blur-sm p-8 rounded-3xl border border-border/50 shadow-xl">
                  <PomodoroTimer onPomodoroComplete={handlePomodoroComplete} onPomodoroActive={handlePomodoroActive} isFocusMode={true} />
                </div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-[75vh] overflow-y-auto no-scrollbar pr-2">
                <div className={`${cardClass} rounded-3xl p-6 shadow-xl`}>
                  <MonthCalendar currentDate={currentTime} pomodoroRefresh={pomodoroRefresh} isFocusMode={true} />
                </div>
                <div className={`${cardClass} rounded-3xl p-6 shadow-xl`}>
                  <AmbientSounds ref={ambientRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
