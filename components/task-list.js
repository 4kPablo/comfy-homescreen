"use client"

import React, { useState, useEffect, useRef } from "react"
import { ListTodo, Check, Plus, Trash2, Edit2, GripVertical, Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TaskList = () => {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState("")
  const [newTaskReminder, setNewTaskReminder] = useState("")
  const [showReminder, setShowReminder] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const timeoutsRef = useRef({})

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
    const saved = localStorage.getItem("comfy-tasks")
    if (saved) {
      const parsed = JSON.parse(saved)
      setTasks(parsed)
      setupReminders(parsed)
    }
  }, [])

  const setupReminders = (currentTasks) => {
    Object.values(timeoutsRef.current).forEach(clearTimeout)
    timeoutsRef.current = {}

    currentTasks.forEach(task => {
      if (!task.completed && task.reminderDatetime) {
        const reminderDate = new Date(task.reminderDatetime)
        const now = new Date()
        if (reminderDate > now) {
          const delay = reminderDate.getTime() - now.getTime()
          timeoutsRef.current[task.id] = setTimeout(() => {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Recordatorio de Tarea", { body: task.title, icon: "/icon-192.png" })
            }
          }, delay)
        }
      }
    })
  }

  const saveTasks = (newTasks) => {
    setTasks(newTasks)
    localStorage.setItem("comfy-tasks", JSON.stringify(newTasks))
    setupReminders(newTasks)
  }

  const addTask = () => {
    if (!newTask.trim()) return
    const newTaskObj = {
      id: Date.now().toString(),
      title: newTask.trim(),
      completed: false,
      reminderDatetime: newTaskReminder || null,
    }
    saveTasks([...tasks, newTaskObj])
    setNewTask("")
    setNewTaskReminder("")
    setShowReminder(false)
  }

  const toggleTask = (id) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id) => {
    saveTasks(tasks.filter(t => t.id !== id))
  }

  // Drag and drop
  const [draggedIdx, setDraggedIdx] = useState(null)

  const onDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    const newTasks = [...tasks]
    const draggedItem = newTasks[draggedIdx]
    newTasks.splice(draggedIdx, 1)
    newTasks.splice(index, 0, draggedItem)
    setDraggedIdx(index)
    setTasks(newTasks)
  }

  const onDragEnd = () => {
    setDraggedIdx(null)
    saveTasks(tasks)
  }

  // Format reminder for display
  const formatReminder = (dt) => {
    if (!dt) return null
    const d = new Date(dt)
    const date = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    return `${date} ${time}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-muted-foreground" />
          Tareas
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Check className="w-4 h-4 text-primary" /> : <Edit2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-0.5 max-h-[280px] overflow-y-auto pr-1">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-start gap-2 px-1 py-1.5 rounded-lg transition-colors group ${task.completed ? "opacity-50" : ""} hover:bg-secondary/40`}
            draggable={isEditing}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
          >
            {isEditing && (
              <div className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground shrink-0">
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            {!isEditing && (
              <button
                className={`w-3.5 h-3.5 mt-1 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground hover:border-primary"}`}
                onClick={() => toggleTask(task.id)}
              >
                {task.completed && <Check className="w-2.5 h-2.5" />}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <p className={`text-sm break-words transition-all leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </p>
              {task.reminderDatetime && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                  <Bell className="w-2.5 h-2.5 shrink-0" />
                  {formatReminder(task.reminderDatetime)}
                </p>
              )}
            </div>
            {isEditing && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteTask(task.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">No hay tareas pendientes</p>
        )}
      </div>

      {/* Add task row */}
      <div className="pt-2 border-t border-border space-y-1.5">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Nueva tarea..."
            className="h-8 text-sm flex-1"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={addTask}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Reminder toggle */}
        <button
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-0.5"
          onClick={() => setShowReminder(prev => !prev)}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showReminder ? "rotate-180" : ""}`} />
          Añadir recordatorio
        </button>

        {showReminder && (
          <input
            type="datetime-local"
            className="w-full h-8 text-xs bg-secondary/40 border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={newTaskReminder}
            onChange={(e) => setNewTaskReminder(e.target.value)}
            style={{ colorScheme: "dark" }}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(TaskList)
