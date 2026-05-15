"use client"

import React, { useState, useEffect } from "react"
import { Youtube, Search, X, Play, Pause, Monitor, Volume2, Bookmark, Save, Pencil, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const SortableVideoItem = ({ video, onPlay, onRename, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1 }
    
    return (
        <div ref={setNodeRef} style={style} className="relative flex items-center p-2 pr-2 rounded-md bg-secondary/30 hover:bg-secondary/50 border border-border group/item overflow-hidden">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground opacity-50 group-hover/item:opacity-100 transition-opacity shrink-0">
                <GripVertical className="w-3 h-3" />
            </div>
            
            <HoverCard openDelay={1000}>
              <HoverCardTrigger asChild>
                <div className="flex-1 truncate text-xs font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => onPlay(video.videoId)}>
                    {video.title}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 z-[100] border-border bg-card/95 backdrop-blur-sm" side="top">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{video.title}</h4>
                  {video.author && <p className="text-xs text-muted-foreground">Canal: {video.author}</p>}
                  {video.createdAt && (
                      <p className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50 mt-2">
                        Añadido el: {new Date(video.createdAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>

            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2 w-32 opacity-0 group-hover/item:opacity-100 transition-opacity bg-gradient-to-l from-background/95 via-background/80 to-transparent pointer-events-none">
                <div className="flex gap-1 pointer-events-auto pl-10">
                    <button onClick={() => onRename(video)} className="p-1 text-muted-foreground hover:text-primary transition-colors bg-secondary/80 rounded backdrop-blur-sm" title="Renombrar">
                        <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(video)} className="p-1 text-muted-foreground hover:text-destructive transition-colors bg-secondary/80 rounded backdrop-blur-sm" title="Eliminar">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

const YoutubeWidget = ({ videoId, setVideoId, isVideoBackground, setIsVideoBackground, isFullscreenViewport, setIsFullscreenViewport, youtubePlaylistExpanded, setYoutubePlaylistExpanded }) => {
    const [url, setUrl] = useState("")
    const [isPlaying, setIsPlaying] = useState(true)
    const [savedVideos, setSavedVideos] = useState([])
    const [videoToRename, setVideoToRename] = useState(null)
    const [newTitle, setNewTitle] = useState("")

    useEffect(() => {
        const saved = localStorage.getItem('comfy-youtube-playlist')
        if (saved) setSavedVideos(JSON.parse(saved))
    }, [])

    const savePlaylist = (list) => {
        setSavedVideos(list)
        localStorage.setItem('comfy-youtube-playlist', JSON.stringify(list))
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSavedVideos((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const reordered = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('comfy-youtube-playlist', JSON.stringify(reordered));
                return reordered;
            });
        }
    }

    const sendCommand = (func) => {
        const iframe = document.getElementById('main-youtube-frame')
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*')
        }
    }

    const togglePlay = () => {
        if (isPlaying) {
            sendCommand('pauseVideo')
            setIsPlaying(false)
        } else {
            sendCommand('playVideo')
            setIsPlaying(true)
        }
    }

    const extractVideoId = (inputUrl) => {
        try {
            const parsedObj = new URL(inputUrl)
            if (parsedObj.hostname.includes("youtube.com")) {
                return parsedObj.searchParams.get("v") || inputUrl
            }
            if (parsedObj.hostname.includes("youtu.be")) {
                return parsedObj.pathname.substring(1) || inputUrl
            }
            return inputUrl
        } catch (e) {
            return inputUrl
        }
    }

    const handleSubmit = (e) => {
        if (e) e.preventDefault()
        const id = extractVideoId(url)
        if (id && setVideoId) {
            setVideoId(id)
            setUrl("")
        }
    }

    const handleSaveVideo = () => {
        if (!url.trim()) return
        const id = extractVideoId(url)
        if (!id) return
        
        toast.promise(
            fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`).then(res => res.json()),
            {
                loading: 'Obteniendo información del video...',
                success: (data) => {
                    const title = data.title || "Video Guardado"
                    const author = data.author_name || ""
                    const newVideo = { id: crypto.randomUUID(), url, videoId: id, title, author, createdAt: Date.now() }
                    setSavedVideos(prev => {
                        const newList = [...prev, newVideo]
                        localStorage.setItem('comfy-youtube-playlist', JSON.stringify(newList))
                        return newList
                    })
                    setUrl("")
                    return `Guardado: ${title}`
                },
                error: () => {
                    const title = "Video Guardado"
                    const newVideo = { id: crypto.randomUUID(), url, videoId: id, title, createdAt: Date.now() }
                    setSavedVideos(prev => {
                        const newList = [...prev, newVideo]
                        localStorage.setItem('comfy-youtube-playlist', JSON.stringify(newList))
                        return newList
                    })
                    setUrl("")
                    return "Video guardado (sin título original)"
                }
            }
        )
    }

    const handleRenameClick = (video) => {
        setVideoToRename(video)
        setNewTitle(video.title)
    }

    const saveRename = () => {
        if (newTitle.trim() && videoToRename) {
            const newList = savedVideos.map(v => v.id === videoToRename.id ? { ...v, title: newTitle.trim() } : v)
            savePlaylist(newList)
            toast.success("Nombre actualizado")
        }
        setVideoToRename(null)
    }

    const handleDelete = (video) => {
        const index = savedVideos.findIndex(v => v.id === video.id)
        const newList = [...savedVideos]
        newList.splice(index, 1)
        savePlaylist(newList)
        
        toast("Video eliminado", {
            description: video.title,
            action: {
                label: "Deshacer",
                onClick: () => {
                    setSavedVideos(prev => {
                        const restored = [...prev]
                        restored.splice(index, 0, video)
                        localStorage.setItem('comfy-youtube-playlist', JSON.stringify(restored))
                        return restored
                    })
                }
            },
            duration: 5000
        })
    }

    const handlePlaySaved = (vId) => {
        setVideoId(vId)
        if (youtubePlaylistExpanded) setYoutubePlaylistExpanded(false)
    }

    return (
        <div className={`space-y-3 flex flex-col relative ${youtubePlaylistExpanded ? "h-auto max-h-[75vh]" : "h-full"}`}>
            <div className="flex justify-between items-center w-full">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-muted-foreground" /> YouTube
                </h3>
                <button onClick={() => setYoutubePlaylistExpanded(!youtubePlaylistExpanded)} className={`p-1 rounded-md transition-colors ${youtubePlaylistExpanded ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`} title="Lista de reproducción">
                    <Bookmark className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {!youtubePlaylistExpanded ? (
                    videoId ? (
                        <div className="flex-grow w-full flex flex-col gap-2 p-3 border border-border rounded-xl bg-secondary/20 h-full">
                            <p className="text-[10px] text-muted-foreground text-center font-medium">
                                {isVideoBackground ? "Reproduciendo en segundo plano" : "Reproduciendo en primer plano"}
                            </p>
                            <div className="flex gap-2 w-full mt-auto">
                               <button onClick={togglePlay} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-1.5 rounded-md flex items-center justify-center transition-colors" title={isPlaying ? "Pausar" : "Reproducir"}>
                                   {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4 ml-0.5"/>}
                               </button>
                               <button onClick={() => setIsVideoBackground(!isVideoBackground)} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-1.5 rounded-md flex items-center justify-center transition-colors" title={isVideoBackground ? "Volver a primer plano" : "Reproducir en segundo plano"}>
                                   {isVideoBackground ? <Monitor className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                               </button>
                               <button onClick={() => {if(setIsFullscreenViewport) setIsFullscreenViewport(!isFullscreenViewport)}} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-1.5 rounded-md flex items-center justify-center transition-colors" title="Pantalla completa en ventana">
                                   <Monitor className="w-4 h-4"/>
                               </button>
                               <button onClick={() => { setVideoId(""); setIsVideoBackground(false); if(setIsFullscreenViewport) setIsFullscreenViewport(false); }} className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 py-1.5 rounded-md flex items-center justify-center transition-colors" title="Cerrar video">
                                   <X className="w-4 h-4" />
                               </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-grow justify-center py-2 h-full">
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    className="w-full text-xs bg-background border border-border rounded px-3 py-2 outline-none focus:border-primary transition-colors"
                                    placeholder="Enlace de YouTube..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 rounded px-2 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                        <Play className="w-3 h-3" /> Reproducir
                                    </button>
                                    <button type="button" onClick={handleSaveVideo} className="flex-1 bg-secondary/30 text-secondary-foreground hover:bg-secondary rounded px-2 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                        <Save className="w-3 h-3" /> Guardar
                                    </button>
                                </div>
                            </div>
                        </form>
                    )
                ) : (
                    <div className="flex-1 flex flex-col mt-1 overflow-hidden">
                        {savedVideos.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                                <Bookmark className="w-8 h-8 opacity-20" />
                                <p className="text-xs">No hay videos guardados</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                       <SortableContext items={savedVideos.map(v=>v.id)} strategy={verticalListSortingStrategy}>
                                           {savedVideos.map(video => (
                                               <SortableVideoItem key={video.id} video={video} onPlay={handlePlaySaved} onRename={handleRenameClick} onDelete={handleDelete} />
                                           ))}
                                       </SortableContext>
                                    </DndContext>
                                </div>
                                <div className="text-center pt-2 text-[10px] text-muted-foreground font-medium border-t border-border/50">
                                    {savedVideos.length} {savedVideos.length === 1 ? 'video guardado' : 'videos guardados'}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={!!videoToRename} onOpenChange={(open) => !open && setVideoToRename(null)}>
                <DialogContent className="max-w-xs p-4 gap-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm">Renombrar Video</DialogTitle>
                    </DialogHeader>
                    <Input 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)} 
                        placeholder="Nuevo título"
                        className="text-xs"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveRename() }}
                    />
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" size="sm" onClick={() => setVideoToRename(null)}>Cancelar</Button>
                        <Button size="sm" onClick={saveRename}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default React.memo(YoutubeWidget)
