"use client"

import React, { useState, useEffect } from "react"
import { ExternalLink, Edit2, GripVertical, Trash2, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DEFAULT_LINKS = [
  { id: "1", title: "YouTube", url: "https://youtube.com" },
  { id: "2", title: "GitHub", url: "https://github.com" },
]

const QuickLinks = () => {
  const [links, setLinks] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [newLink, setNewLink] = useState({ title: "", url: "" })

  useEffect(() => {
    const saved = localStorage.getItem("comfy-quick-links")
    if (saved) {
      setLinks(JSON.parse(saved))
    } else {
      setLinks(DEFAULT_LINKS)
    }
  }, [])

  const saveLinks = (newLinks) => {
    setLinks(newLinks)
    localStorage.setItem("comfy-quick-links", JSON.stringify(newLinks))
  }

  const addLink = () => {
    if (!newLink.title || !newLink.url) return
    let url = newLink.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    saveLinks([...links, { id: Date.now().toString(), title: newLink.title, url }])
    setNewLink({ title: "", url: "" })
  }

  const deleteLink = (id) => {
    saveLinks(links.filter(l => l.id !== id))
  }

  const [draggedIdx, setDraggedIdx] = useState(null)

  const onDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    const newLinks = [...links]
    const draggedItem = newLinks[draggedIdx]
    newLinks.splice(draggedIdx, 1)
    newLinks.splice(index, 0, draggedItem)
    setDraggedIdx(index)
    setLinks(newLinks)
  }

  const onDragEnd = () => {
    setDraggedIdx(null)
    saveLinks(links)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
          Accesos Rápidos
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Check className="w-4 h-4 text-primary" /> : <Edit2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-1">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors group"
            draggable={isEditing}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
          >
            {isEditing && (
              <div className="cursor-grab text-muted-foreground hover:text-foreground shrink-0">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            {!isEditing && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=32`}
                alt=""
                className="w-4 h-4 rounded-sm shrink-0"
                style={{ filter: "grayscale(1) brightness(0.7) contrast(1.2)", opacity: 0.75 }}
              />
            )}

            {isEditing ? (
              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                <span className="text-sm font-medium truncate flex-1">{link.title}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteLink(link.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors flex-1 truncate">
                {link.title}
              </a>
            )}
          </div>
        ))}
        {links.length === 0 && !isEditing && (
          <p className="text-xs text-muted-foreground py-2">No hay accesos rápidos</p>
        )}
      </div>

      {isEditing && (
        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <Input
            placeholder="Nombre (ej: YouTube)"
            className="h-8 text-sm"
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              placeholder="URL (ej: youtube.com)"
              className="h-8 text-sm flex-1"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
            />
            <Button size="sm" className="h-8 px-2" onClick={addLink}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(QuickLinks)
