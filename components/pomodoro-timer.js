"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Dumbbell, Pencil, Play, Pause, RotateCcw, Focus, Timer, Clock, Rocket } from "lucide-react"
import { savePomodoroLog } from "@/lib/pomodoro-store"

const activities = [
  { id: "study", label: "Estudiar", icon: BookOpen, color: "oklch(0.70 0.15 250)" },
  { id: "exercise", label: "Ejercitar", icon: Dumbbell, color: "oklch(0.70 0.18 150)" },
  { id: "draw", label: "Dibujar", icon: Pencil, color: "oklch(0.70 0.15 30)" },
]

export default function PomodoroTimer({ onPomodoroComplete, onPomodoroActive, onFocusToggle, isFocusMode }) {
  const [mode, setMode] = useState("pomodoro") // pomodoro, timer, stopwatch
  const [isActive, setIsActive] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  
  // States for Pomodoro
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60)
  const [isBreak, setIsBreak] = useState(false)
  
  // Custom Timer
  const [customTimerLength, setCustomTimerLength] = useState(15 * 60)
  const [timerLeft, setTimerLeft] = useState(15 * 60)
  
  // Stopwatch
  const [stopwatchTime, setStopwatchTime] = useState(0)

  const [elapsedTime, setElapsedTime] = useState(0)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  const WORK_TIME = 25 * 60
  const BREAK_TIME = 5 * 60
  const MIN_DURATION_TO_SAVE = 5 * 60

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5)
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.setValueAtTime(660, audioContext.currentTime)
        osc2.type = "sine"
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.8)
      }, 300)
    } catch (e) {
      console.error("Error playing notification sound:", e)
    }
  }, [])

  const showNotification = useCallback((title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png", tag: "pomodoro" })
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body, icon: "/icon-192.png", tag: "pomodoro" })
        }
      })
    }
  }, [])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Call onPomodoroActive when running state changes
  useEffect(() => {
      if (onPomodoroActive) {
          // Si está activo y no es descanso, activar sonido. Si es descanso, pausar.
          if (isActive && !isBreak) {
              onPomodoroActive(true)
          } else {
              onPomodoroActive(false)
          }
      }
  }, [isActive, isBreak, onPomodoroActive])

  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current && !isBreak) {
        startTimeRef.current = Date.now()
      }
      
      intervalRef.current = setInterval(() => {
        if (mode === "pomodoro") {
            setPomodoroTimeLeft((prev) => {
                if (prev <= 1) return 0;
                return prev - 1
            })
        } else if (mode === "timer") {
            setTimerLeft((prev) => {
                if (prev <= 1) return 0;
                return prev - 1
            })
        } else if (mode === "stopwatch") {
            setStopwatchTime((prev) => prev + 1)
        }

        if (!isBreak && mode === "pomodoro") {
          setElapsedTime((prev) => prev + 1)
        } else if (mode !== "pomodoro") {
          setElapsedTime((prev) => prev + 1)
        }
      }, 1000)
    }

    return () => clearInterval(intervalRef.current)
  }, [isActive, isBreak, mode])

  // Handle completions
  useEffect(() => {
      if (mode === "pomodoro" && isActive && pomodoroTimeLeft === 0) {
          if (!isBreak) {
            playNotificationSound()
            const activityLabel = activities.find(a => a.id === selectedActivity)?.label || "Actividad"
            showNotification("Pomodoro completado", `${activityLabel} terminado. Tiempo de descanso.`)
            
            if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity) {
              const durationMinutes = Math.round(elapsedTime / 60)
              savePomodoroLog(selectedActivity, durationMinutes)
              if (onPomodoroComplete) onPomodoroComplete()
            }
            setIsBreak(true)
            setPomodoroTimeLeft(BREAK_TIME)
            setElapsedTime(0)
            startTimeRef.current = null
          } else {
            playNotificationSound()
            showNotification("Descanso terminado", "Tiempo de volver al trabajo.")
            setIsBreak(false)
            setPomodoroTimeLeft(WORK_TIME)
            setIsActive(false)
          }
      } else if (mode === "timer" && isActive && timerLeft === 0) {
          playNotificationSound()
          showNotification("Temporizador terminado", "El tiempo ha finalizado.")
          if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity) {
              const durationMinutes = Math.round(elapsedTime / 60)
              savePomodoroLog(selectedActivity, durationMinutes)
              if (onPomodoroComplete) onPomodoroComplete()
          }
          setIsActive(false)
          setElapsedTime(0)
          startTimeRef.current = null
      }
  }, [pomodoroTimeLeft, timerLeft, isActive, mode, isBreak, elapsedTime, selectedActivity, onPomodoroComplete, playNotificationSound, showNotification])


  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    if (elapsedTime >= MIN_DURATION_TO_SAVE && selectedActivity && !isBreak) {
      const durationMinutes = Math.round(elapsedTime / 60)
      savePomodoroLog(selectedActivity, durationMinutes)
      if (onPomodoroComplete) onPomodoroComplete()
    }
    setIsActive(false)
    setIsBreak(false)
    setElapsedTime(0)
    startTimeRef.current = null

    if (mode === "pomodoro") setPomodoroTimeLeft(WORK_TIME)
    else if (mode === "timer") setTimerLeft(customTimerLength)
    else if (mode === "stopwatch") setStopwatchTime(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  let progress = 0;
  let displayTime = "00:00";
  
  if (mode === "pomodoro") {
      progress = isBreak ? (BREAK_TIME - pomodoroTimeLeft) / BREAK_TIME : (WORK_TIME - pomodoroTimeLeft) / WORK_TIME;
      displayTime = formatTime(pomodoroTimeLeft);
  } else if (mode === "timer") {
      progress = (customTimerLength - timerLeft) / customTimerLength;
      displayTime = formatTime(timerLeft);
  } else if (mode === "stopwatch") {
      progress = 0; // Stopwatch doesn't have a defined end
      displayTime = formatTime(stopwatchTime);
  }

  const currentActivity = activities.find((a) => a.id === selectedActivity)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-secondary/50 p-1 rounded-lg">
           <button onClick={() => {setMode("pomodoro"); resetTimer()} } className={`p-1.5 rounded-md text-xs font-medium transition-colors ${mode === "pomodoro" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Pomodoro</button>
           <button onClick={() => {setMode("timer"); resetTimer()}} className={`p-1.5 rounded-md text-xs font-medium transition-colors ${mode === "timer" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Timer</button>
           <button onClick={() => {setMode("stopwatch"); resetTimer()}} className={`p-1.5 rounded-md text-xs font-medium transition-colors ${mode === "stopwatch" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Cronómetro</button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
             {mode === "pomodoro" ? "Pomodoro" : mode === "timer" ? "Temporizador" : "Cronómetro"}
        </h3>
        {isBreak && mode === "pomodoro" && <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">Descanso</span>}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex gap-3 justify-center">
            {activities.map((activity) => {
              const Icon = activity.icon
              const isSelected = selectedActivity === activity.id
              return (
                <button
                  key={activity.id}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? 'shadow-sm ring-2 ring-offset-2 ring-offset-background' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                  onClick={() => setSelectedActivity(isSelected ? null : activity.id)}
                  style={isSelected ? { backgroundColor: activity.color, color: 'white', '--tw-ring-color': activity.color } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {activity.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-[7rem] leading-none font-mono font-bold tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-500" style={{ color: currentActivity?.color || "var(--foreground)" }}>{displayTime}</span>
            {mode === "timer" && (
                <div className="flex items-center gap-2 mt-8">
                    <button className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium hover:bg-secondary transition-colors" onClick={() => {setCustomTimerLength(5*60); setTimerLeft(5*60)}}>5m</button>
                    <button className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium hover:bg-secondary transition-colors" onClick={() => {setCustomTimerLength(15*60); setTimerLeft(15*60)}}>15m</button>
                    <button className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium hover:bg-secondary transition-colors" onClick={() => {setCustomTimerLength(30*60); setTimerLeft(30*60)}}>30m</button>
                    <button className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium hover:bg-secondary transition-colors" onClick={() => {setCustomTimerLength(60*60); setTimerLeft(60*60)}}>1h</button>
                </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-sm hover:scale-110 transition-transform bg-background" onClick={toggleTimer}>
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-sm hover:scale-110 transition-transform bg-background text-muted-foreground" onClick={resetTimer}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
