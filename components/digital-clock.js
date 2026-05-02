"use client"

import React, { useState, useEffect, useRef } from "react"
import { Clock, AlarmClock, Timer, TimerReset, Play, Pause, RotateCcw } from "lucide-react"

export default function DigitalClockWidget({ time, showSeconds }) {
    const [mode, setMode] = useState("clock") // clock, alarm, timer, stopwatch

    const [alarmTime, setAlarmTime] = useState("")
    const [alarmActive, setAlarmActive] = useState(false)

    const [timerSeconds, setTimerSeconds] = useState(5 * 60)
    const [timerActive, setTimerActive] = useState(false)
    const [inputMinutes, setInputMinutes] = useState(5)

    const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
    const [stopwatchActive, setStopwatchActive] = useState(false)

    const timerRef = useRef(null)

    const playSound = () => {
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
        } catch (e) { }
    }

    useEffect(() => {
        if (alarmActive && alarmTime) {
            const currentFormatted = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`
            if (currentFormatted === alarmTime && time.getSeconds() === 0) {
                playSound()
                setAlarmActive(false)
            }
        }
    }, [time, alarmActive, alarmTime])

    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        playSound()
                        setTimerActive(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else if (stopwatchActive) {
            timerRef.current = setInterval(() => {
                setStopwatchSeconds(prev => prev + 1)
            }, 1000)
        }

        return () => clearInterval(timerRef.current)
    }, [timerActive, stopwatchActive])

    const hours = time.getHours().toString().padStart(2, "0")
    const minutes = time.getMinutes().toString().padStart(2, "0")
    const seconds = time.getSeconds().toString().padStart(2, "0")

    const formatSecs = (s) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    const renderContent = () => {
        if (mode === "clock") {
            return (
                <div className="font-mono text-5xl font-bold tracking-tight text-primary drop-shadow-sm flex items-baseline">
                    {hours}:{minutes}
                    {showSeconds && (
                        <span className="text-2xl text-muted-foreground ml-1">:{seconds}</span>
                    )}
                </div>
            )
        } else if (mode === "alarm") {
            return (
                <div className="flex flex-col items-center gap-2">
                    <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm outline-none" disabled={alarmActive} />
                    <button onClick={() => { if (alarmTime) setAlarmActive(!alarmActive) }} className={`px-4 py-1 rounded text-xs font-medium transition-colors ${alarmActive ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                        {alarmActive ? 'Desactivar' : 'Activar Alarma'}
                    </button>
                </div>
            )
        } else if (mode === "timer") {
            const isInitial = !timerActive && timerSeconds === inputMinutes * 60;
            return (
                <div className="flex flex-col items-center gap-2 w-full px-4">
                    {isInitial || (!timerActive && timerSeconds === 0) ? (
                        <div className="flex items-center justify-center gap-2">
                            <input type="number" value={inputMinutes} onChange={e => { setInputMinutes(e.target.value); setTimerSeconds(parseInt(e.target.value || 0) * 60); }} min="1" className="bg-background border border-border rounded px-2 py-1.5 text-lg font-mono w-20 text-center outline-none focus:border-primary" />
                            <span className="text-sm text-muted-foreground font-medium">min</span>
                            <button onClick={() => { setTimerSeconds(parseInt(inputMinutes || 1) * 60); setTimerActive(true); }} className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 ml-1"><Play className="w-4 h-4 ml-0.5" /></button>
                        </div>
                    ) : (
                        <>
                            <div className="font-mono text-3xl font-bold tracking-tight text-primary">{formatSecs(timerSeconds)}</div>
                            <div className="flex gap-2">
                                <button onClick={() => setTimerActive(!timerActive)} className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20">
                                    {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                </button>
                                <button onClick={() => { setTimerActive(false); setTimerSeconds(parseInt(inputMinutes || 1) * 60) }} className="p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )
        } else if (mode === "stopwatch") {
            return (
                <div className="flex flex-col items-center gap-2 w-full px-4">
                    <div className="font-mono text-3xl font-bold tracking-tight text-primary">{formatSecs(stopwatchSeconds)}</div>
                    <div className="flex gap-2">
                        <button onClick={() => setStopwatchActive(!stopwatchActive)} className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20">
                            {stopwatchActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <button onClick={() => { setStopwatchActive(false); setStopwatchSeconds(0) }} className="p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="space-y-2 h-full flex flex-col p-2 relative">
            <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    {mode === "clock" && <Clock className="w-4 h-4" />}
                    {mode === "alarm" && <AlarmClock className="w-4 h-4" />}
                    {mode === "timer" && <Timer className="w-4 h-4" />}
                    {mode === "stopwatch" && <TimerReset className="w-4 h-4" />}
                    <span className="capitalize hidden sm:inline">{mode === 'clock' ? 'Reloj Digital' : mode === 'stopwatch' ? 'Cronómetro' : mode}</span>
                </h3>
                <div className="flex gap-1 bg-secondary/30 rounded p-0.5 ml-auto">
                    <button onClick={() => setMode('clock')} className={`p-1 rounded transition-colors ${mode === 'clock' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Clock className="w-3 h-3" /></button>
                    <button onClick={() => setMode('alarm')} className={`p-1 rounded transition-colors ${mode === 'alarm' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}><AlarmClock className="w-3 h-3" /></button>
                    <button onClick={() => setMode('timer')} className={`p-1 rounded transition-colors ${mode === 'timer' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Timer className="w-3 h-3" /></button>
                    <button onClick={() => setMode('stopwatch')} className={`p-1 rounded transition-colors ${mode === 'stopwatch' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}><TimerReset className="w-3 h-3" /></button>
                </div>
            </div>
            <div className="flex-grow flex items-center justify-center w-full aspect-video bg-accent/5 rounded-xl h-22">
                {renderContent()}
            </div>
        </div>
    )
}
