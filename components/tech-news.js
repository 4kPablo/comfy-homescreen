"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Newspaper, ChevronRight, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const TechNews = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [techNews, setTechNews] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const topStoriesRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
      const topStoryIds = await topStoriesRes.json()
      const storyIds = topStoryIds.slice(0, 15)

      const stories = await Promise.all(
        storyIds.map(async (id) => {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          return res.json()
        })
      )

      const formattedNews = stories.map((story) => {
        const hoursAgo = Math.floor((Date.now() / 1000 - story.time) / 3600)
        const timeText = hoursAgo < 1 ? "< 1h" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo / 24)}d`
        return {
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          time: timeText,
          score: story.score,
          comments: story.descendants || 0,
        }
      })

      setTechNews(formattedNews)
    } catch (error) {
      console.error("Error fetching news:", error)
      setTechNews([{ title: "Error al cargar noticias", url: "#", time: "", score: 0 }])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNews()
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(newsInterval)
  }, [fetchNews])

  const goNext = () => {
    if (techNews.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % techNews.length)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Tech News</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNews}
            disabled={loading}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-[60px] flex items-start transition-all duration-500">
        {loading && techNews.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : techNews.length > 0 ? (
          <div key={currentIndex} className="space-y-2 w-full animate-in fade-in slide-in-from-right-2 duration-300">
            <a
              href={techNews[currentIndex]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-start gap-1.5 group leading-snug"
            >
              <span className="flex-1 line-clamp-2">{techNews[currentIndex]?.title}</span>
              <ExternalLink className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{techNews[currentIndex]?.time}</span>
              <span className="opacity-50">|</span>
              <span>{techNews[currentIndex]?.score} pts</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin noticias</p>
        )}
      </div>
    </div>
  )
}

export default React.memo(TechNews)
