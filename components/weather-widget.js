"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Cloud, CloudRain, Sun, Wind, Droplets, ThermometerSun, ThermometerSnowflake, CloudLightning, CloudSnow, CloudFog, MapPin, Search } from "lucide-react"

const WeatherWidget = ({ showLocation = true, showStats = true }) => {
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchWeather = useCallback(async (url) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(url)
      if (!res.ok) throw new Error("No se pudo obtener el clima")
      const data = await res.json()
      setWeatherData(data)
      if (data.name) {
         localStorage.setItem("comfy-homescreen-weather-loc", data.name)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadWeatherByLocation = useCallback(() => {
     const savedLoc = localStorage.getItem("comfy-homescreen-weather-loc")
     if (navigator.geolocation && !savedLoc) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
             fetchWeather(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=7e830ff11112110f77c5a4cb846c970d&units=metric&lang=es`)
          },
          () => {
             fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=Buenos Aires&appid=7e830ff11112110f77c5a4cb846c970d&units=metric&lang=es`)
          }
        )
     } else {
         const query = savedLoc || "Buenos Aires"
         fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=7e830ff11112110f77c5a4cb846c970d&units=metric&lang=es`)
     }
  }, [fetchWeather])

  useEffect(() => {
    loadWeatherByLocation()
  }, [loadWeatherByLocation])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(false)
    fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=7e830ff11112110f77c5a4cb846c970d&units=metric&lang=es`)
    setSearchQuery("")
  }

  const getWeatherIcon = (id) => {
    if (!id) return Cloud
    if (id >= 200 && id < 300) return CloudLightning
    if (id >= 300 && id < 600) return CloudRain
    if (id >= 600 && id < 700) return CloudSnow
    if (id >= 700 && id < 800) return CloudFog
    if (id === 800) return Sun
    return Cloud
  }

  if (loading && !weatherData) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">Clima <MapPin className="w-4 h-4"/></h3>
        <div className="animate-pulse flex space-x-4">
           <div className="rounded-full bg-secondary h-12 w-12"></div>
           <div className="flex-1 space-y-4 py-1">
             <div className="h-4 bg-secondary rounded w-3/4"></div>
             <div className="h-4 bg-secondary rounded w-1/2"></div>
           </div>
        </div>
      </div>
    )
  }

  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.weather[0].id) : Cloud

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setIsSearching(!isSearching)}>
             Clima <Search className="w-3 h-3 ml-1" />
         </h3>
         {weatherData && showLocation && (
             <div className="text-xs text-muted-foreground truncate max-w-[120px] flex items-center gap-1" title={weatherData.name}>
                 <MapPin className="w-3 h-3" /> {weatherData.name}
             </div>
         )}
      </div>

      {isSearching && (
          <form onSubmit={handleSearch} className="flex gap-2">
             <input type="text" placeholder="Buscar ciudad..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-sm rounded bg-background border border-border px-2 py-1 outline-none focus:border-primary" autoFocus />
             <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 rounded">Buscar</button>
          </form>
      )}
      
      {error && !weatherData ? (
          <div className="text-sm text-destructive">{error}</div>
      ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-xl">
                <WeatherIcon className="w-8 h-8 text-accent" />
              </div>
              <div>
                <div className="text-4xl font-bold">{Math.round(weatherData?.main?.temp)}°</div>
                <div className="text-sm text-muted-foreground capitalize">{weatherData?.weather[0]?.description}</div>
              </div>
            </div>
            
            {showStats && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Máxima</div>
                    <div className="text-lg font-semibold">{Math.round(weatherData?.main?.temp_max)}°</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThermometerSnowflake className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Mínima</div>
                    <div className="text-lg font-semibold">{Math.round(weatherData?.main?.temp_min)}°</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Humedad</div>
                    <div className="text-lg font-semibold">{weatherData?.main?.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">Viento</div>
                    <div className="text-lg font-semibold">{(weatherData?.wind?.speed * 3.6).toFixed(1)} km/h</div>
                  </div>
                </div>
              </div>
            )}
          </>
      )}
    </div>
  )
}

export default React.memo(WeatherWidget)
