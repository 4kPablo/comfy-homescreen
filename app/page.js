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
import QuickLinks from "@/components/quick-links"
import TaskList from "@/components/task-list"
import { getWidgetLayout, saveWidgetLayout, moveWidget } from "@/lib/widget-store"
import { getSettings, saveSettings } from "@/lib/settings-store"
import { Settings2, Check, Palette, X, Image as ImageIcon, ArrowLeft, Focus, Maximize, Minimize, Plus, Clock, Monitor, EyeOff, LayoutTemplate, Download, Upload, Bell, Play } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import DigitalClockWidget from "@/components/digital-clock"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { playChimeSound, playAlarmSound } from "@/components/hourly-chime"
import TimePicker from "@/components/shadcn-studio/date-picker/date-picker-09"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
const AutoFitColumn = ({ id, items, children, isCustomizationMode, position }) => {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  const { setNodeRef } = useDroppable({ id })

  const setRefs = useCallback(
    (node) => {
      containerRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return
    const checkScale = () => {
      if (isCustomizationMode) {
        setScale(1)
        return
      }
      const containerHeight = containerRef.current.clientHeight
      const contentHeight = contentRef.current.scrollHeight
      if (contentHeight > containerHeight && contentHeight > 0) {
        setScale(containerHeight / contentHeight)
      } else {
        setScale(1)
      }
    }

    const resizeObserver = new ResizeObserver(checkScale)
    resizeObserver.observe(containerRef.current)
    resizeObserver.observe(contentRef.current)
    checkScale()
    return () => resizeObserver.disconnect()
  }, [children, isCustomizationMode])

  return (
    <div
      ref={setRefs}
      className={`flex-shrink-0 h-[80vh] flex flex-col justify-center transition-all duration-700 ${isCustomizationMode ? "border-2 border-dashed border-primary/20 rounded-xl p-2 bg-primary/5" : ""}`}
      style={{ width: '19rem' }}
    >
      <div
        ref={contentRef}
        className={`w-full space-y-4 flex flex-col transition-transform duration-300 ${position === 'left' ? 'origin-left' : 'origin-right'}`}
        style={{ transform: scale < 1 ? `scale(${scale})` : 'none' }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
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
  "clock": { component: DigitalClockWidget, props: (state) => ({ time: state.currentTime, showSeconds: state.widgetShowSeconds, clockStyle: state.widgetClockStyle, alarmSoundType: state.alarmSoundType, timerSoundType: state.timerSoundType }) },
  "calendar": { component: MonthCalendar, props: (state) => ({ currentDate: state.currentTime, pomodoroRefresh: state.pomodoroRefresh }) },
  "ambient": { component: AmbientSounds, props: (state) => ({ ref: state.ambientRef }) },
  "weather": { component: WeatherWidget, props: (state) => ({ showLocation: state.weatherShowLocation, showStats: state.weatherShowStats }) },
  "pomodoro": { component: PomodoroTimer, props: (state) => ({ onPomodoroComplete: state.handlePomodoroComplete, onFocusToggle: state.handleFocusToggle, onPomodoroActive: state.handlePomodoroActive, isFocusMode: state.isFocusMode }) },
  "tech-news": { component: TechNews, props: () => EMPTY_PROPS },
  "progress-bars": { component: ProgressBars, props: (state) => ({ currentTime: state.currentTime }) },
  "youtube": { component: YoutubeWidget, props: (state) => ({ 
    videoId: state.videoId, 
    setVideoId: state.setVideoId, 
    isVideoBackground: state.isVideoBackground, 
    setIsVideoBackground: state.setIsVideoBackground, 
    isFullscreenViewport: state.isFullscreenViewport, 
    setIsFullscreenViewport: state.setIsFullscreenViewport,
    youtubePlaylistExpanded: state.youtubePlaylistExpanded,
    setYoutubePlaylistExpanded: state.setYoutubePlaylistExpanded
  }) },
  "quick-links": { component: QuickLinks, props: () => EMPTY_PROPS },
  "task-list": { component: TaskList, props: () => EMPTY_PROPS },
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
    { name: "OLED", primary: "#ffffff", accent: "#888888", bg: "#000000" },
    { name: "Azul", primary: "#3b82f6", accent: "#60a5fa", bg: "#1e293b" },
    { name: "Verde", primary: "#10b981", accent: "#34d399", bg: "#064e3b" },
    { name: "Púrpura", primary: "#a855f7", accent: "#c084fc", bg: "#2e1065" },
    { name: "Rosa", primary: "#ec4899", accent: "#f472b6", bg: "#500724" },
    { name: "Naranja", primary: "#f97316", accent: "#fb923c", bg: "#431407" },
    { name: "Cyan", primary: "#06b6d4", accent: "#22d3ee", bg: "#083344" },
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCustomizationMode, setIsCustomizationMode] = useState(false)
  const [showUI, setShowUI] = useState(false)
  const [hideSidebars, setHideSidebars] = useState(false)
  const [backgroundType, setBackgroundType] = useState('particles')
  const [customBgColor, setCustomBgColor] = useState('#1a1a1a')
  const [centralClockType, setCentralClockType] = useState('digital')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showSeconds, setShowSeconds] = useState(true)
  const [widgetShowSeconds, setWidgetShowSeconds] = useState(true)
  const [widgetClockStyle, setWidgetClockStyle] = useState('digital')
  const [weatherShowLocation, setWeatherShowLocation] = useState(true)
  const [weatherShowStats, setWeatherShowStats] = useState(true)
  const [chimeEnabled, setChimeEnabled] = useState(true)
  const [chimeSilentFrom, setChimeSilentFrom] = useState(0)
  const [chimeSilentTo, setChimeSilentTo] = useState(7)
  const [chimeSoundType, setChimeSoundType] = useState('chime')
  const [alarmSoundType, setAlarmSoundType] = useState('beep')
  const [timerSoundType, setTimerSoundType] = useState('beep')
  const [particleColor, setParticleColor] = useState('80, 160, 255')
  const [particleBgColor, setParticleBgColor] = useState('#00050f')

  // Youtube State hoisted
  const [videoId, setVideoIdState] = useState("")
  const [isVideoBackground, setIsVideoBackground] = useState(false)
  const [isFullscreenViewport, setIsFullscreenViewport] = useState(false)
  const [youtubeFullscreen, setYoutubeFullscreen] = useState(false)
  const [youtubePlaylistExpanded, setYoutubePlaylistExpanded] = useState(false)

  const ambientRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setDraggingWidget(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = layout.left.includes(activeId) ? "left" : "right";
    const overContainer = layout.left.includes(overId) ? "left" : layout.right.includes(overId) ? "right" : overId;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLayout((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.indexOf(activeId);
      const overIndex = overItems.indexOf(overId);

      let newIndex;
      if (overId in prev) { // dropped on empty column
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter((item) => item !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeItems[activeIndex],
          ...overItems.slice(newIndex, overItems.length),
        ],
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingWidget(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = layout.left.includes(activeId) ? "left" : "right";
    const overContainer = layout.left.includes(overId) ? "left" : layout.right.includes(overId) ? "right" : overId;

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = layout[activeContainer].indexOf(activeId);
      const overIndex = layout[overContainer].indexOf(overId);

      if (activeIndex !== overIndex) {
        const newLayout = {
          ...layout,
          [overContainer]: arrayMove(layout[overContainer], activeIndex, overIndex),
        };
        setLayout(newLayout);
        saveWidgetLayout(newLayout);
      } else {
        saveWidgetLayout(layout);
      }
    } else {
       saveWidgetLayout(layout);
    }
  };

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
    const migrateProgress = (col) => col.map(id => {
      if (id === "progress") return "progress-bars"
      if (id === "analog-clock" || id === "digital-clock") return "clock"
      return id
    })
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
    setWidgetShowSeconds(savedSettings.widgetShowSeconds ?? true)
    setWidgetClockStyle(savedSettings.widgetClockStyle || 'digital')
    setWeatherShowLocation(savedSettings.weatherShowLocation ?? true)
    setWeatherShowStats(savedSettings.weatherShowStats ?? true)
    setChimeEnabled(savedSettings.chimeEnabled ?? true)
    setChimeSilentFrom(savedSettings.chimeSilentFrom ?? 0)
    setChimeSilentTo(savedSettings.chimeSilentTo ?? 7)
    setChimeSoundType(savedSettings.chimeSoundType || 'chime')
    setAlarmSoundType(savedSettings.alarmSoundType || 'beep')
    setTimerSoundType(savedSettings.timerSoundType || 'beep')
    setParticleColor(savedSettings.particleColor || '80, 160, 255')
    setParticleBgColor(savedSettings.particleBgColor || '#00050f')

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

  const handleExportData = () => {
    const data = {
      settings: getSettings(),
      layout: getWidgetLayout(),
      pomodoro: localStorage.getItem('homescreen_pomodoros'),
      pomodoroActivityModes: localStorage.getItem('pomodoroActivityModes'),
      pomodoroActivities: localStorage.getItem('pomodoroActivities'),
      youtube: localStorage.getItem('comfy-homescreen-youtube')
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "comfy-homescreen-backup.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.settings) localStorage.setItem("comfy-homescreen-settings", JSON.stringify(data.settings))
        if (data.layout) localStorage.setItem("comfy-homescreen-widget-layout", JSON.stringify(data.layout))
        if (data.pomodoro) localStorage.setItem("homescreen_pomodoros", data.pomodoro)
        if (data.pomodoroActivityModes) localStorage.setItem("pomodoroActivityModes", data.pomodoroActivityModes)
        if (data.pomodoroActivities) localStorage.setItem("pomodoroActivities", data.pomodoroActivities)
        if (data.youtube) localStorage.setItem("comfy-homescreen-youtube", data.youtube)
        
        toast.success("Configuración importada exitosamente. Recargando...")
        setTimeout(() => window.location.reload(), 1500)
      } catch (err) {
        toast.error("Error al importar: archivo inválido")
      }
    }
    reader.readAsText(file)
  }

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
    // Ensure legible text on primary-colored buttons
    const isLight = theme.primary === '#ffffff' || theme.primary === 'white'
    document.documentElement.style.setProperty('--primary-foreground', isLight ? '#000000' : '')
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
    widgetShowSeconds,
    widgetClockStyle,
    weatherShowLocation,
    weatherShowStats,
    alarmSoundType,
    timerSoundType,
    isFullscreenViewport,
    setIsFullscreenViewport,
    youtubePlaylistExpanded,
    setYoutubePlaylistExpanded
  }

  const renderWidget = (widgetId, index, column, isOverlay = false) => {
    const widgetConfig = widgetComponents[widgetId]
    if (!widgetConfig) return null

    const isHidden = !isOverlay && youtubePlaylistExpanded && widgetId !== 'youtube' && layout[column].includes('youtube');
    const finalCardClass = `${cardClass} ${isHidden ? "hidden" : ""}`;

    if (widgetId === 'pomodoro') {
      return (
        <DraggableWidget
          key={widgetId}
          id={widgetId}
          cardClass={finalCardClass}
          isDraggable={isCustomizationMode}
          animationDelay={100 + index * 50}
          isOverlay={isOverlay}
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
        cardClass={finalCardClass}
        onRemove={isCustomizationMode ? handleRemoveWidget : undefined}
        isDraggable={isCustomizationMode}
        animationDelay={100 + index * 50}
        isOverlay={isOverlay}
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
      case 'solid': return null
      case 'particles':
      default: return <ParticlesBg particleColor={particleColor} />
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
      style={backgroundType === 'solid' ? { backgroundColor: customBgColor } : backgroundType === 'particles' ? { backgroundColor: particleBgColor } : {}}
      onMouseMove={() => setShowUI(true)}
      onMouseLeave={() => setShowUI(false)}
    >
      {renderBackground()}
      <Toaster />
      <HourlyChime currentTime={currentTime} enabled={chimeEnabled} silentFrom={chimeSilentFrom} silentTo={chimeSilentTo} soundType={chimeSoundType} onChime={handleHourlyChime} />

      {/* Buttons to toggle Drawer and Sidebars */}
      {!isCustomizationMode && !isFullscreenViewport && (
        <div className={`absolute top-6 right-6 flex items-center gap-4 transition-all duration-500 z-50 ${showUI ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
          <button
            onClick={() => setHideSidebars(!hideSidebars)}
            className="px-4 py-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:scale-105 transition-transform group flex items-center justify-center"
            title={hideSidebars ? "Mostrar paneles laterales" : "Ocultar paneles laterales"}
          >
            {hideSidebars ? <LayoutTemplate className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /> : <EyeOff className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />}
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:scale-105 transition-transform group flex items-center justify-center"
            title="Ajustes y Personalización"
          >
            <Settings2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      )}

      {/* Button to finish Customization Mode */}
      {isCustomizationMode && (
        <button
          onClick={() => setIsCustomizationMode(false)}
          className="absolute top-6 right-6 px-4 py-2 bg-primary text-primary-foreground backdrop-blur-md border border-border rounded-full shadow-lg hover:scale-105 transition-transform z-50 group flex items-center gap-2"
          title="Terminar Edición"
        >
          <Check className="w-5 h-5" /> Terminar Edición
        </button>
      )}

      {/* Settings Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="sm:max-w-md w-full h-full border-l">
          <div className="mx-auto w-full max-w-3xl p-6 flex flex-col h-full overflow-hidden">
            <DrawerHeader className="px-0 pt-0 pb-2 border-b border-border/50 flex flex-row items-center justify-between flex-shrink-0">
              <div>
                <DrawerTitle className="text-xl flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Personalización
                </DrawerTitle>
                <DrawerDescription>
                  Configura el aspecto visual, añade widgets o reordénalos.
                </DrawerDescription>
              </div>
              <button
                onClick={() => {
                  setIsDrawerOpen(false)
                  setIsCustomizationMode(true)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm whitespace-nowrap flex-shrink-0"
              >
                <LayoutTemplate className="w-4 h-4" /> Editar Widgets
              </button>
            </DrawerHeader>

            <div className="flex flex-col gap-6 overflow-y-auto flex-1 pb-6 mt-6">

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Palette className="w-3 h-3" /> Temas (Ajustados al Fondo)
            </div>
            <div className="flex gap-2 flex-wrap">
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
            {backgroundType === 'particles' && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1.5">Color de Partículas y Fondo</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Azul',    value: '80, 160, 255',  bg: '#00050f' },
                    { label: 'Violeta', value: '160, 100, 255', bg: '#04010d' },
                    { label: 'Verde',   value: '60, 210, 120',  bg: '#010804' },
                    { label: 'Rosa',    value: '255, 100, 170', bg: '#0a0105' },
                    { label: 'Naranja', value: '255, 140, 50',  bg: '#080300' },
                    { label: 'Cyan',    value: '50, 210, 220',  bg: '#01080a' },
                    { label: 'Dorado',  value: '230, 180, 40',  bg: '#080600' },
                  ].map(({ label, value, bg }) => (
                    <button
                      key={value}
                      onClick={() => { setParticleColor(value); setParticleBgColor(bg); saveSettings({ particleColor: value, particleBgColor: bg }) }}
                      className={`text-xs px-2 py-1 rounded-full border transition-all ${particleColor === value ? 'border-foreground bg-secondary' : 'border-border bg-secondary/30 hover:bg-secondary/60'}`}
                      style={{ color: `rgb(${value})` }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <Clock className="w-3 h-3" /> Estilo de Widget Reloj
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {setWidgetClockStyle('digital'); saveSettings({ widgetClockStyle: 'digital' })}}
                className={`flex items-center justify-center gap-1 text-xs p-2 rounded-md border transition-all ${widgetClockStyle === 'digital'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                  }`}
              >
                <Monitor className="w-3 h-3" /> Digital
              </button>
              <button
                onClick={() => {setWidgetClockStyle('analog'); saveSettings({ widgetClockStyle: 'analog' })}}
                className={`flex items-center justify-center gap-1 text-xs p-2 rounded-md border transition-all ${widgetClockStyle === 'analog'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                  }`}
              >
                <Clock className="w-3 h-3" /> Analógico
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Bell className="w-3 h-3" /> Sonido por Hora
            </div>
            <div className="flex flex-col gap-3 bg-secondary/30 p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs">Activado</span>
                <Switch checked={chimeEnabled} onCheckedChange={(v) => { setChimeEnabled(v); saveSettings({ chimeEnabled: v }) }} />
              </div>
              {chimeEnabled && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Sonido</span>
                    <div className="flex gap-1">
                      {[['chime', 'Campana'], ['bell', 'Timbre'], ['digital', 'Digital']].map(([val, lbl]) => (
                        <div key={val} className="flex-1 flex gap-0.5">
                          <button onClick={() => { setChimeSoundType(val); saveSettings({ chimeSoundType: val }) }}
                            className={`flex-1 text-xs py-1.5 rounded-l-md border transition-colors ${chimeSoundType === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-transparent hover:bg-secondary/80'}`}>
                            {lbl}
                          </button>
                          <button onClick={() => playChimeSound(val)}
                            className="px-1.5 py-1.5 bg-secondary/70 hover:bg-secondary border border-transparent rounded-r-md transition-colors text-muted-foreground hover:text-foreground" title="Escuchar">
                            <Play className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <TimePicker
                      id="chime-silent-from"
                      label="Silencio desde"
                      value={`${String(chimeSilentFrom).padStart(2,'0')}:00`}
                      onChange={v => { const h = parseInt(v.split(':')[0]); setChimeSilentFrom(h); saveSettings({ chimeSilentFrom: h }) }}
                    />
                    <TimePicker
                      id="chime-silent-to"
                      label="Silencio hasta"
                      value={`${String(chimeSilentTo).padStart(2,'0')}:00`}
                      onChange={v => { const h = parseInt(v.split(':')[0]); setChimeSilentTo(h); saveSettings({ chimeSilentTo: h }) }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Bell className="w-3 h-3" /> Sonidos de Alarma y Timer
            </div>
            <div className="flex flex-col gap-2 bg-secondary/30 p-3 rounded-lg border border-border">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Alarma</span>
                <div className="flex gap-1">
                  {[['beep', 'Beep'], ['siren', 'Sirena'], ['chime', 'Campana']].map(([val, lbl]) => (
                    <div key={val} className="flex-1 flex gap-0.5">
                      <button onClick={() => { setAlarmSoundType(val); saveSettings({ alarmSoundType: val }) }}
                        className={`flex-1 text-xs py-1.5 rounded-l-md border transition-colors ${alarmSoundType === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-transparent hover:bg-secondary/80'}`}>
                        {lbl}
                      </button>
                      <button onClick={() => playAlarmSound(val)}
                        className="px-1.5 py-1.5 bg-secondary/70 hover:bg-secondary border border-transparent rounded-r-md transition-colors text-muted-foreground hover:text-foreground" title="Escuchar">
                        <Play className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Timer</span>
                <div className="flex gap-1">
                  {[['beep', 'Beep'], ['siren', 'Sirena'], ['chime', 'Campana']].map(([val, lbl]) => (
                    <div key={val} className="flex-1 flex gap-0.5">
                      <button onClick={() => { setTimerSoundType(val); saveSettings({ timerSoundType: val }) }}
                        className={`flex-1 text-xs py-1.5 rounded-l-md border transition-colors ${timerSoundType === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-transparent hover:bg-secondary/80'}`}>
                        {lbl}
                      </button>
                      <button onClick={() => playAlarmSound(val)}
                        className="px-1.5 py-1.5 bg-secondary/70 hover:bg-secondary border border-transparent rounded-r-md transition-colors text-muted-foreground hover:text-foreground" title="Escuchar">
                        <Play className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Settings2 className="w-3 h-3" /> Ajustes de Widgets
            </div>
            <div className="flex flex-col gap-3 bg-secondary/30 p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs">Segundos en Reloj Central</span>
                <Switch checked={showSeconds} onCheckedChange={(v) => { setShowSeconds(v); saveSettings({ showSeconds: v }) }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Segundos en Widget Reloj</span>
                <Switch checked={widgetShowSeconds} onCheckedChange={(v) => { setWidgetShowSeconds(v); saveSettings({ widgetShowSeconds: v }) }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Mostrar Ubicación (Clima)</span>
                <Switch checked={weatherShowLocation} onCheckedChange={(v) => { setWeatherShowLocation(v); saveSettings({ weatherShowLocation: v }) }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Mostrar Detalles (Clima)</span>
                <Switch checked={weatherShowStats} onCheckedChange={(v) => { setWeatherShowStats(v); saveSettings({ weatherShowStats: v }) }} />
              </div>
            </div>
          </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Plus className="w-4 h-4" /> Agregar Widget
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

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Settings2 className="w-3 h-3" /> Datos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportData}
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 rounded-md flex items-center justify-center gap-2 transition-colors text-xs font-medium"
                  >
                    <Download className="w-3 h-3" /> Exportar
                  </button>
                  <label className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 rounded-md flex items-center justify-center gap-2 transition-colors text-xs font-medium cursor-pointer mb-0">
                    <Upload className="w-3 h-3" /> Importar
                    <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                  </label>
                </div>
              </div>

            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <div className={`w-full relative z-10 h-full flex transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCustomizationMode ? "scale-95" : ""}`}>
        {/* === MODO NORMAL === */}
        <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isFocusMode ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
          {/* Main Content Area */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className={`relative z-10 w-full h-full flex items-center justify-center pointer-events-none p-8`}>
              <div className={`w-full flex gap-4 h-full pt-24 pb-8 transition-all duration-700 pointer-events-auto ${videoId && !isVideoBackground ? "max-w-[1800px] px-4" : "max-w-[1400px] px-8"}`}>

              {/* Columna izquierda */}
              <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${hideSidebars ? "-translate-x-[150%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
                <AutoFitColumn
                  id="left"
                  items={layout.left}
                  isCustomizationMode={isCustomizationMode}
                  position="left"
                >
                  {layout.left.map((widgetId, index) => renderWidget(widgetId, index, "left"))}
                </AutoFitColumn>
              </div>

              {/* Centro - Reloj principal / Youtube */}
              <div className="flex-1 flex flex-col items-center justify-center">

                {videoId && (
                  <div className={
                    isVideoBackground
                      ? "fixed w-0 h-0 opacity-0 pointer-events-none"
                      : isFullscreenViewport
                        ? "fixed inset-0 z-[100] w-full h-full bg-black flex items-center justify-center"
                        : "w-full max-w-6xl xl:max-w-7xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative z-20 group"
                  }>
                    {!isVideoBackground && (
                      <div className={`absolute top-4 right-4 z-[110] flex items-center gap-2 transition-opacity ${isFullscreenViewport ? "opacity-100 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl" : "opacity-0 group-hover:opacity-100"}`}>
                        {isFullscreenViewport && (
                           <div className="text-white/90 font-mono text-sm font-medium mr-2">
                             {hours}:{minutes}
                           </div>
                        )}
                        <button onClick={() => setIsFullscreenViewport(!isFullscreenViewport)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors" title="Pantalla completa en ventana">
                          {isFullscreenViewport ? <Minimize className="w-4 h-4" /> : <Maximize className="w-5 h-5" />}
                        </button>
                        <button onClick={() => { setVideoId(""); setIsVideoBackground(false); setIsFullscreenViewport(false); }} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors" title="Cerrar video">
                          <X className={isFullscreenViewport ? "w-4 h-4" : "w-5 h-5"} />
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
                        {hours}:{minutes}{showSeconds && <span className="text-4xl text-muted-foreground ml-2">:{seconds}</span>}
                      </div>
                    )}
                    <div className={`text-2xl text-muted-foreground capitalize transition-all duration-300 ${backgroundType === 'space' ? "text-stroke-1 text-white/90" : "text-shadow-sm"}`}>
                      {formattedDate}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Columna derecha */}
              <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${hideSidebars ? "translate-x-[150%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"} ${isCustomizationMode ? "min-w-[280px]" : ""}`}>
                <AutoFitColumn
                  id="right"
                  items={layout.right}
                  isCustomizationMode={isCustomizationMode}
                  position="right"
                >
                  {layout.right.map((widgetId, index) => renderWidget(widgetId, index, "right"))}
                </AutoFitColumn>
              </div>

            </div>
          </div>
            
          <DragOverlay dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {draggingWidget ? renderWidget(draggingWidget, 0, layout.left.includes(draggingWidget) ? 'left' : 'right', true) : null}
          </DragOverlay>
            
          </DndContext>
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

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full px-8 pb-10 max-w-6xl mx-auto">
              <div className="w-full max-w-2xl bg-card/30 backdrop-blur-sm p-8 rounded-3xl border border-border/50 shadow-xl">
                <PomodoroTimer onPomodoroComplete={handlePomodoroComplete} onPomodoroActive={handlePomodoroActive} isFocusMode={true} />
              </div>
              <div className="flex flex-col gap-6 w-full max-w-xs xl:max-w-sm">
                <div className={`${cardClass} rounded-3xl p-6 shadow-xl w-full`}>
                  <MonthCalendar currentDate={currentTime} pomodoroRefresh={pomodoroRefresh} isFocusMode={true} />
                </div>
                <div className={`${cardClass} rounded-3xl p-6 shadow-xl w-full`}>
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
