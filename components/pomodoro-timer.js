"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen, Dumbbell, Pencil, Play, Pause, RotateCcw, Plus, Trash2,
  Check, X, Edit2, Bike, Coffee, Code, Music, Heart, Star, Zap, Moon, SkipForward
} from "lucide-react"
import { savePomodoroLog } from "@/lib/pomodoro-store"

// Available icons for activity customization
const ICON_OPTIONS = [
  { id: "BookOpen", icon: BookOpen, label: "Libro" },
  { id: "Dumbbell", icon: Dumbbell, label: "Pesas" },
  { id: "Pencil", icon: Pencil, label: "Lápiz" },
  { id: "Code", icon: Code, label: "Código" },
  { id: "Music", icon: Music, label: "Música" },
  { id: "Bike", icon: Bike, label: "Bici" },
  { id: "Coffee", icon: Coffee, label: "Café" },
  { id: "Heart", icon: Heart, label: "Salud" },
  { id: "Star", icon: Star, label: "Meta" },
  { id: "Zap", icon: Zap, label: "Energía" },
  { id: "Moon", icon: Moon, label: "Descanso" },
]

const COLOR_OPTIONS = [
  "oklch(0.70 0.15 250)", // Blue
  "oklch(0.70 0.18 150)", // Green
  "oklch(0.70 0.15 30)",  // Orange
  "oklch(0.70 0.2 300)",  // Purple
  "oklch(0.70 0.2 0)",    // Red
  "oklch(0.75 0.18 200)", // Teal
  "oklch(0.75 0.2 60)",   // Yellow
  "oklch(0.70 0.15 330)", // Pink
]

const DEFAULT_ACTIVITIES = [
  { id: "study", label: "Estudiar", iconId: "BookOpen", color: "oklch(0.70 0.15 250)", mode: "pomodoro" },
  { id: "exercise", label: "Ejercitar", iconId: "Dumbbell", color: "oklch(0.70 0.18 150)", mode: "pomodoro" },
  { id: "draw", label: "Dibujar", iconId: "Pencil", color: "oklch(0.70 0.15 30)", mode: "pomodoro" },
]

const STORAGE_KEY = "pomodoroActivities"
const MODES_KEY = "pomodoroActivityModes"

function loadActivities() {
  if (typeof window === "undefined") return DEFAULT_ACTIVITIES
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { }
  return DEFAULT_ACTIVITIES
}

function saveActivitiesStore(acts) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(acts))
}

function getIconComponent(iconId) {
  return ICON_OPTIONS.find(o => o.id === iconId)?.icon || BookOpen
}

function ActivityEditor({ draft, setDraft, onSave, onCancel }) {
  return (
    <div className="bg-secondary/20 border border-border rounded-2xl p-4 space-y-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Nombre</label>
        <input
          value={draft.label}
          onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
          placeholder="Nombre de la actividad"
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          maxLength={20}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Modo</label>
        <div className="grid grid-cols-3 gap-1">
          {[["pomodoro", "Pomodoro"], ["timer", "Timer"], ["stopwatch", "Cronómetro"]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setDraft(d => ({ ...d, mode: val }))}
              className={`text-xs py-1.5 rounded-lg border transition-colors ${draft.mode === val ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-transparent hover:bg-secondary/80"}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setDraft(d => ({ ...d, color: c }))}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${draft.color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Ícono</label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setDraft(d => ({ ...d, iconId: id }))}
              className={`p-1.5 rounded-lg border transition-colors ${draft.iconId === id ? "bg-primary/20 border-primary" : "border-transparent bg-secondary/50 hover:bg-secondary"}`}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors">
          <Check className="w-3 h-3" /> Guardar
        </button>
        <button onClick={onCancel} className="px-4 bg-secondary text-muted-foreground rounded-lg py-2 text-xs hover:bg-secondary/80 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function PomodoroTimer({ onPomodoroComplete, onPomodoroActive, isFocusMode }) {
  const [activities, setActivities] = useState(loadActivities)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [isManaging, setIsManaging] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newDraft, setNewDraft] = useState({ label: "", iconId: "BookOpen", color: COLOR_OPTIONS[0], mode: "pomodoro" })

  // Timer state
  const [isActive, setIsActive] = useState(false)
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60)
  const [isBreak, setIsBreak] = useState(false)
  const [customTimerLength, setCustomTimerLength] = useState(15 * 60)
  const [timerLeft, setTimerLeft] = useState(15 * 60)
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  const WORK_TIME = 25 * 60
  const BREAK_TIME = 5 * 60
  const MIN_DURATION_TO_SAVE = 5 * 60

  const currentActivity = activities.find(a => a.id === selectedActivity)
  const mode = currentActivity?.mode || "pomodoro"

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const makeNote = (freq, start, dur) => {
        const osc = audioContext.createOscillator()
        const g = audioContext.createGain()
        osc.connect(g); g.connect(audioContext.destination)
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + start)
        osc.type = "sine"
        g.gain.setValueAtTime(0.3, audioContext.currentTime + start)
        g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + start + dur)
        osc.start(audioContext.currentTime + start)
        osc.stop(audioContext.currentTime + start + dur)
      }
      makeNote(880, 0, 0.5)
      makeNote(440, 0.3, 0.8)
      makeNote(660, 0.6, 0.8)
    } catch (e) { }
  }, [])

  const showNotification = useCallback((title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png", tag: "pomodoro" })
    }
  }, [])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (onPomodoroActive) {
      onPomodoroActive(isActive && !isBreak)
    }
  }, [isActive, isBreak, onPomodoroActive])

  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current && !isBreak) startTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        if (mode === "pomodoro") setPomodoroTimeLeft(p => Math.max(0, p - 1))
        else if (mode === "timer") setTimerLeft(p => Math.max(0, p - 1))
        else if (mode === "stopwatch") setStopwatchTime(p => p + 1)
        if (!isBreak) setElapsedTime(p => p + 1)
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, isBreak, mode])

  useEffect(() => {
    if (mode === "pomodoro" && isActive && pomodoroTimeLeft === 0) {
      playNotificationSound()
      if (!isBreak) {
        showNotification("Pomodoro completado", `Tiempo de descanso.`)
        if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity) {
          savePomodoroLog(selectedActivity, Math.round(elapsedTime / 60))
          if (onPomodoroComplete) onPomodoroComplete()
        }
        setIsBreak(true); setPomodoroTimeLeft(BREAK_TIME)
        setElapsedTime(0); startTimeRef.current = null
      } else {
        showNotification("Descanso terminado", "Volver al trabajo.")
        setIsBreak(false); setPomodoroTimeLeft(WORK_TIME); setIsActive(false)
      }
    } else if (mode === "timer" && isActive && timerLeft === 0) {
      playNotificationSound()
      showNotification("Temporizador terminado", "El tiempo ha finalizado.")
      if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity) {
        savePomodoroLog(selectedActivity, Math.round(elapsedTime / 60))
        if (onPomodoroComplete) onPomodoroComplete()
      }
      setIsActive(false); setElapsedTime(0); startTimeRef.current = null
    }
  }, [pomodoroTimeLeft, timerLeft, isActive, mode, isBreak, elapsedTime, selectedActivity])

  const resetTimer = (nextMode = mode) => {
    if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity && !isBreak) {
      savePomodoroLog(selectedActivity, Math.round(elapsedTime / 60))
      if (onPomodoroComplete) onPomodoroComplete()
    }
    setIsActive(false); setIsBreak(false); setElapsedTime(0); startTimeRef.current = null
    if (nextMode === "pomodoro") setPomodoroTimeLeft(WORK_TIME)
    else if (nextMode === "timer") setTimerLeft(customTimerLength)
    else if (nextMode === "stopwatch") setStopwatchTime(0)
  }

  const handleActivitySelect = (id) => {
    if (isManaging) return
    const isSelected = selectedActivity === id
    setSelectedActivity(isSelected ? null : id)
    resetTimer(isSelected ? mode : (activities.find(a => a.id === id)?.mode || "pomodoro"))
  }

  const updateActivity = (id, changes) => {
    const updated = activities.map(a => a.id === id ? { ...a, ...changes } : a)
    setActivities(updated)
    saveActivitiesStore(updated)
    if (selectedActivity === id && changes.mode) {
      resetTimer(changes.mode)
    }
  }

  const deleteActivity = (id) => {
    const updated = activities.filter(a => a.id !== id)
    setActivities(updated)
    saveActivitiesStore(updated)
    if (selectedActivity === id) setSelectedActivity(null)
  }

  const addActivity = () => {
    if (!newDraft.label.trim()) return
    const id = `custom_${Date.now()}`
    const updated = [...activities, { ...newDraft, id, label: newDraft.label.trim() }]
    setActivities(updated)
    saveActivitiesStore(updated)
    setIsCreating(false)
    setNewDraft({ label: "", iconId: "BookOpen", color: COLOR_OPTIONS[0], mode: "pomodoro" })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  let progress = 0, displayTime = "00:00"
  if (mode === "pomodoro") {
    progress = isBreak ? (BREAK_TIME - pomodoroTimeLeft) / BREAK_TIME : (WORK_TIME - pomodoroTimeLeft) / WORK_TIME
    displayTime = formatTime(pomodoroTimeLeft)
  } else if (mode === "timer") {
    progress = (customTimerLength - timerLeft) / customTimerLength
    displayTime = formatTime(timerLeft)
  } else if (mode === "stopwatch") {
    displayTime = formatTime(stopwatchTime)
  }

  // Activity editor panel is defined at module level to avoid re-mount on every render

  return (
    <div className="space-y-4">
      {/* Activity bar */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          {activities.map((activity) => {
            const Icon = getIconComponent(activity.iconId)
            const isSelected = selectedActivity === activity.id
            const isEditing = editingId === activity.id
            return (
              <div key={activity.id} className="relative group/act">
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected ? 'shadow-sm ring-2 ring-offset-2 ring-offset-background' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                  onClick={() => isManaging ? null : handleActivitySelect(activity.id)}
                  style={isSelected ? { backgroundColor: activity.color, color: 'white', '--tw-ring-color': activity.color } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {activity.label}
                </button>
                {isManaging && (
                  <div className="absolute -top-2 -right-2 flex gap-0.5">
                    <button
                      onClick={() => { setEditingId(activity.id); setEditDraft({ ...activity }) }}
                      className="w-5 h-5 bg-secondary border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="w-5 h-5 bg-secondary border border-border rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={() => setIsManaging(!isManaging)}
            className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${isManaging ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
            title="Administrar actividades"
          >
            {isManaging ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Edit existing */}
        {isManaging && editingId && editDraft && (
          <ActivityEditor
            draft={editDraft}
            setDraft={setEditDraft}
            onSave={() => { updateActivity(editingId, editDraft); setEditingId(null) }}
            onCancel={() => setEditingId(null)}
          />
        )}

        {/* Create new */}
        {isManaging && !editingId && (
          isCreating ? (
            <ActivityEditor
              draft={newDraft}
              setDraft={setNewDraft}
              onSave={addActivity}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Nueva actividad
            </button>
          )
        )}

        {isBreak && mode === "pomodoro" && (
          <span className="inline-flex text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">Descanso</span>
        )}
      </div>

      {/* Timer display */}
      <div className="space-y-6 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center py-6">
          <span
            className="text-[7rem] leading-none font-mono font-bold tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-500"
            style={{ color: currentActivity?.color || "var(--foreground)" }}
          >
            {displayTime}
          </span>
          {mode === "timer" && !isActive && (
            <div className="flex items-center gap-2 mt-8">
              {[[5, "5m"], [15, "15m"], [30, "30m"], [60, "1h"]].map(([mins, lbl]) => (
                <button
                  key={mins}
                  className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium hover:bg-secondary transition-colors"
                  onClick={() => { setCustomTimerLength(mins * 60); setTimerLeft(mins * 60) }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-sm hover:scale-110 transition-transform bg-background" onClick={() => setIsActive(!isActive)}>
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-sm hover:scale-110 transition-transform bg-background text-muted-foreground" onClick={() => resetTimer()}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          {isBreak && mode === "pomodoro" && (
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-sm hover:scale-110 transition-transform bg-background text-muted-foreground" onClick={() => {
              setIsBreak(false)
              setPomodoroTimeLeft(WORK_TIME)
              setIsActive(true)
            }} title="Saltear descanso">
              <SkipForward className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
