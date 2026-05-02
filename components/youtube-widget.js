"use client"

import React, { useState } from "react"
import { Youtube, Search, Paste, X, ClipboardPaste, Play, Pause, Monitor, Volume2 } from "lucide-react"

const YoutubeWidget = ({ videoId, setVideoId, isVideoBackground, setIsVideoBackground }) => {
    const [url, setUrl] = useState("")
    const [isPlaying, setIsPlaying] = useState(true)

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

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            const id = extractVideoId(text)
            if (id && setVideoId) {
                setVideoId(id)
                setUrl("")
            }
        } catch (err) {
            console.error("No se pudo leer el portapapeles: ", err)
            alert("El navegador no permitió leer el portapapeles. Usa Ctrl+V para pegar manualmente.")
        }
    }

    return (
        <div className="space-y-3 h-full flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Youtube className="w-4 h-4 text-muted-foreground" /> YouTube
            </h3>

            {videoId ? (
                <div className="flex-grow w-full flex flex-col gap-2 p-3 border border-border rounded-xl bg-secondary/20">
                    <p className="text-[10px] text-muted-foreground text-center font-medium">
                        {isVideoBackground ? "Reproduciendo en segundo plano" : "Reproduciendo en primer plano"}
                    </p>
                    <div className="flex gap-2 w-full mt-auto">
                       <button onClick={togglePlay} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-1.5 rounded-md flex items-center justify-center transition-colors">
                           {isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4 ml-0.5"/>}
                       </button>
                       <button onClick={() => setIsVideoBackground(!isVideoBackground)} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-1.5 rounded-md flex items-center justify-center transition-colors" title="Alternar segundo plano">
                           {isVideoBackground ? <Monitor className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                       </button>
                    </div>
                    <button
                        onClick={() => { setVideoId(""); setIsVideoBackground(false); }}
                        className="text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 w-full py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors mt-1 font-medium"
                    >
                        <X className="w-3 h-3" /> Cerrar video
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-grow justify-center py-2">
                    <p className="text-xs text-muted-foreground">Pega un enlace para ver:</p>
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
                                <Search className="w-3 h-3" /> Buscar
                            </button>
                            <button type="button" onClick={handlePaste} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-2 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1" title="Pegar desde portapapeles">
                                <ClipboardPaste className="w-3 h-3" /> Pegar
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}

export default React.memo(YoutubeWidget)
