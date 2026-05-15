"use client"

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react"
import { Volume2, VolumeX, Book, Waves, CloudRain, Wind, TreePine } from "lucide-react"
import { Slider } from "@/components/ui/slider"

const sounds = [
  {
    id: "brown",
    label: "Ruido Blanco",
    icon: Waves,
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Brown_noise_15-00_69kbps.mp3"
  },
  {
    id: "rain",
    label: "Lluvia",
    icon: CloudRain,
    url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg"
  },
  {
    id: "library",
    label: "Biblioteca",
    icon: Book,
    url: "/ambiance-audio/library.mp3"
  },
  {
    id: "wind",
    label: "Viento",
    icon: Wind,
    url: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Howling_wind.ogg"
  },
  {
    id: "forest",
    label: "Bosque",
    icon: TreePine,
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/20090610_0_ambience.ogg"
  },
]

const AmbientSounds = forwardRef((props, ref) => {
  const [activeSound, setActiveSound] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    autoPlay: () => {
        if (!isPlaying && activeSound) {
            const sound = sounds.find(s => s.id === activeSound)
            if (sound) {
               const audio = new Audio(sound.url)
               audio.loop = true
               audio.volume = volume
               audio.play().catch(e => console.error("Error playing audio:", e))
               audioRef.current = audio
               setIsPlaying(true)
            }
        } else if (!isPlaying && !activeSound) {
            // default to rain if no sound was selected
            const sound = sounds[1]
            const audio = new Audio(sound.url)
            audio.loop = true
            audio.volume = volume
            audio.play().catch(e => console.error("Error playing audio:", e))
            audioRef.current = audio
            setActiveSound(sound.id)
            setIsPlaying(true)
        }
    },
    autoPause: () => {
        if (isPlaying && audioRef.current) {
           audioRef.current.pause()
           audioRef.current = null
           setIsPlaying(false)
        }
    }
  }), [isPlaying, activeSound, volume])

  const playSound = useCallback((sound) => {
    if (activeSound === sound.id) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setActiveSound(null)
      setIsPlaying(false)
      return
    }

    // Stop previous sound if any
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Play new sound
    const audio = new Audio(sound.url)
    audio.loop = true
    audio.volume = volume
    audio.play().catch(e => console.error("Error playing audio:", e))
    audioRef.current = audio

    setActiveSound(sound.id)
    setIsPlaying(true)
  }, [activeSound, volume])

  const handleVolumeChange = useCallback((newVolume) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-medium text-muted-foreground">Ambiente</h3>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {sounds.map((sound) => {
          const Icon = sound.icon
          const isActive = activeSound === sound.id
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => playSound(sound)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer
                ${isActive
                  ? "bg-primary/20 text-primary scale-105"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:scale-105"
                }
              `}
              title={sound.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <VolumeX className="w-3 h-3 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="flex-1 cursor-pointer"
        />
        <Volume2 className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
  )
})

AmbientSounds.displayName = "AmbientSounds"
export default React.memo(AmbientSounds)
