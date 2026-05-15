"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Cloud, CloudRain, Sun, Wind, Droplets, ThermometerSun, ThermometerSnowflake,
  CloudLightning, CloudSnow, CloudFog, MapPin, Search, RefreshCw, ChevronRight, ChevronLeft
} from "lucide-react"

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY

const WeatherWidget = ({ showLocation = true, showStats = true }) => {
  const [weatherData, setWeatherData] = useState(null)
  const [hourlyData, setHourlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showHourly, setShowHourly] = useState(false)
  const [coords, setCoords] = useState(null)

  const fetchWeather = useCallback(async (url, forecastUrl) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(url)
      if (!res.ok) throw new Error("No se pudo obtener el clima")
      const data = await res.json()
      setWeatherData(data)
      if (data.name) localStorage.setItem("comfy-homescreen-weather-loc", data.name)
      if (data.coord) setCoords(data.coord)

      // Fetch hourly forecast
      const fUrl = forecastUrl || `https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}&units=metric&lang=es&cnt=8`
      const fRes = await fetch(fUrl)
      if (fRes.ok) {
        const fData = await fRes.json()
        setHourlyData(fData.list || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadWeatherByLocation = useCallback(() => {
    const savedLoc = localStorage.getItem("comfy-homescreen-weather-loc")
    if (navigator.geolocation && !savedLoc) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords
          fetchWeather(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`,
          )
        },
        () => {
          fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=Buenos Aires&appid=${API_KEY}&units=metric&lang=es`)
        }
      )
    } else {
      const query = savedLoc || "Buenos Aires"
      fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=metric&lang=es`)
    }
  }, [fetchWeather])

  useEffect(() => { loadWeatherByLocation() }, [loadWeatherByLocation])

  const handleRefresh = () => {
    setRefreshing(true)
    if (coords) {
      fetchWeather(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=es`
      )
    } else {
      loadWeatherByLocation()
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(false)
    fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=${API_KEY}&units=metric&lang=es`)
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

  const formatHour = (dtTxt) => {
    // dtTxt is "2024-01-01 15:00:00"
    const date = new Date(dtTxt)
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
  }

  if (loading && !weatherData) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center justify-between">Clima <MapPin className="w-4 h-4" /></h3>
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-medium text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
          onClick={() => setIsSearching(!isSearching)}
        >
          Clima <Search className="w-3 h-3 ml-0.5" />
        </h3>
        <div className="flex items-center gap-2">
          {weatherData && showLocation && (
            <div className="text-xs text-muted-foreground truncate max-w-[100px] flex items-center gap-0.5" title={weatherData.name}>
              <MapPin className="w-3 h-3 flex-shrink-0" /> {weatherData.name}
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={handleRefresh}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              title="Actualizar clima"
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowHourly(!showHourly)}
              className={`p-1 rounded-md transition-colors ${showHourly ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
              title="Ver pronóstico por horas"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      {isSearching && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm rounded bg-background border border-border px-2 py-1 outline-none focus:border-primary"
            autoFocus
          />
          <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 rounded">Buscar</button>
        </form>
      )}

      {error && !weatherData ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : showHourly && hourlyData.length > 0 ? (
        /* Hourly forecast */
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button onClick={() => setShowHourly(false)} className="hover:text-foreground transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            Próximas horas
          </div>
          <div className="space-y-1.5">
            {hourlyData.slice(0, 8).map((item, i) => {
              const Icon = getWeatherIcon(item.weather[0]?.id)
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-10 font-mono flex-shrink-0">{formatHour(item.dt_txt)}</span>
                  <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="capitalize text-muted-foreground flex-1 truncate">{item.weather[0]?.description}</span>
                  <span className="font-semibold flex-shrink-0">{Math.round(item.main.temp)}°</span>
                  <span className="text-muted-foreground flex-shrink-0">{item.main.humidity}%</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Current weather */
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
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
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
