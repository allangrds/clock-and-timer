"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Layout, Globe, Play, Pause, TimerResetIcon as Reset, Clock, MessageSquare, X } from "lucide-react"

type Language = "pt" | "en"
type LayoutMode = "horizontal" | "vertical"
type TimeFormat = "24h" | "12h"

const translations = {
  pt: {
    clock: "Relógio",
    timer: "Timer",
    configureTimer: "Configurar Timer",
    timeUp: "Tempo esgotado!",
    start: "Iniciar",
    pause: "Pausar",
    reset: "Reiniciar",
    hours: "Horas",
    minutes: "Minutos",
    seconds: "Segundos",
    save: "Salvar",
    language: "English",
    layout: "Layout",
    settings: "Configurações",
    timeFormat: "Formato",
    message: "Message",
    writeMessage: "Escrever Mensagem",
    messageText: "Texto da Mensagem",
    fontSize: "Tamanho da Fonte (px)",
    showMessage: "Mostrar Mensagem",
    closeMessage: "Fechar Mensagem",
  },
  en: {
    clock: "Clock",
    timer: "Timer",
    configureTimer: "Configure Timer",
    timeUp: "Time's up!",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    save: "Save",
    language: "Português",
    layout: "Layout",
    settings: "Settings",
    timeFormat: "Format",
    message: "Message",
    writeMessage: "Write Message",
    messageText: "Message Text",
    fontSize: "Font Size (px)",
    showMessage: "Show Message",
    closeMessage: "Close Message",
  },
}

// Hook para calcular tamanho de fonte sincronizado para ambos os layouts
function useSyncedFontSize(
  clockText: string,
  timerText: string,
  clockContainerRef: React.RefObject<HTMLDivElement>,
  timerContainerRef: React.RefObject<HTMLDivElement>,
  layoutMode: LayoutMode,
) {
  const [fontSize, setFontSize] = useState(16)
  const clockMeasureRef = useRef<HTMLDivElement>(null)
  const timerMeasureRef = useRef<HTMLDivElement>(null)

  const calculateSyncedFontSize = useCallback(() => {
    if (
      !clockContainerRef.current ||
      !timerContainerRef.current ||
      !clockMeasureRef.current ||
      !timerMeasureRef.current
    )
      return

    const clockContainer = clockContainerRef.current
    const timerContainer = timerContainerRef.current
    const clockMeasurer = clockMeasureRef.current
    const timerMeasurer = timerMeasureRef.current

    // Obter dimensões dos containers
    const clockWidth = clockContainer.offsetWidth
    const timerWidth = timerContainer.offsetWidth
    const clockHeight = clockContainer.offsetHeight
    const timerHeight = timerContainer.offsetHeight

    // Para layout horizontal, usar o menor width; para vertical, usar o menor de ambos
    const minWidth = Math.min(clockWidth, timerWidth)
    const minHeight = Math.min(clockHeight, timerHeight)

    if (minWidth === 0 || minHeight === 0) return

    let optimalSize = 16
    let minSize = 16
    // Aumentar o tamanho máximo para layout horizontal
    let maxSize =
      layoutMode === "horizontal" ? Math.min(minWidth / 2, minHeight / 1.5) : Math.min(minWidth / 3, minHeight / 2)

    while (minSize <= maxSize) {
      const currentSize = Math.floor((minSize + maxSize) / 2)

      // Testar ambos os textos
      clockMeasurer.style.fontSize = `${currentSize}px`
      timerMeasurer.style.fontSize = `${currentSize}px`
      clockMeasurer.textContent = clockText
      timerMeasurer.textContent = timerText

      // Verificar se ambos cabem
      const clockFits = clockMeasurer.scrollWidth <= clockWidth && clockMeasurer.scrollHeight <= clockHeight
      const timerFits = timerMeasurer.scrollWidth <= timerWidth && timerMeasurer.scrollHeight <= timerHeight

      if (clockFits && timerFits) {
        optimalSize = currentSize
        minSize = currentSize + 1
      } else {
        maxSize = currentSize - 1
      }
    }

    setFontSize(Math.max(optimalSize, 16))
  }, [clockText, timerText, clockContainerRef, timerContainerRef, layoutMode])

  useEffect(() => {
    calculateSyncedFontSize()

    const resizeObserver = new ResizeObserver(calculateSyncedFontSize)
    if (clockContainerRef.current) {
      resizeObserver.observe(clockContainerRef.current)
    }
    if (timerContainerRef.current) {
      resizeObserver.observe(timerContainerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [calculateSyncedFontSize])

  useEffect(() => {
    calculateSyncedFontSize()
  }, [clockText, timerText, calculateSyncedFontSize])

  return { fontSize, clockMeasureRef, timerMeasureRef }
}

export default function ClockTimerDisplay() {
  const [language, setLanguage] = useState<Language>("pt")
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("horizontal")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(0) // 0 seconds default
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerFinished, setIsTimerFinished] = useState(false)
  const [configHours, setConfigHours] = useState(0)
  const [configMinutes, setConfigMinutes] = useState(0) // Corrected initial value
  const [configSeconds, setConfigSeconds] = useState(0)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24h")

  // Message states
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messageFontSize, setMessageFontSize] = useState(48)
  const [isMessageVisible, setIsMessageVisible] = useState(false)
  const [displayMessage, setDisplayMessage] = useState("")
  const [displayFontSize, setDisplayFontSize] = useState(48)

  const clockContainerRef = useRef<HTMLDivElement>(null)
  const timerContainerRef = useRef<HTMLDivElement>(null)

  const t = translations[language]

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const newValue = prev - 1
          if (newValue === 0 && !isTimerFinished) {
            setIsTimerFinished(true)
          }
          return newValue
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, isTimerFinished])

  const formatTime = (date: Date) => {
    if (timeFormat === "24h") {
      return date.toLocaleTimeString("pt-BR", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } else {
      return date.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    }
  }

  const formatTimer = (seconds: number) => {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const secs = absSeconds % 60

    const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    return isNegative ? `-${formatted}` : formatted
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "pt" ? "en" : "pt"))
  }

  const toggleLayout = () => {
    setLayoutMode((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))
  }

  const toggleTimeFormat = () => {
    setTimeFormat((prev) => (prev === "24h" ? "12h" : "24h"))
  }

  const startTimer = () => {
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(initialTimerSeconds)
    setIsTimerFinished(false)
  }

  const saveTimerConfig = () => {
    const totalSeconds = configHours * 3600 + configMinutes * 60 + configSeconds
    setInitialTimerSeconds(totalSeconds)
    setTimerSeconds(totalSeconds)
    setIsTimerFinished(false)
    setIsTimerRunning(false)
    setIsConfigOpen(false)
  }

  const showMessage = () => {
    if (messageText.trim()) {
      setDisplayMessage(messageText)
      setDisplayFontSize(messageFontSize)
      setIsMessageVisible(true)
      setIsMessageModalOpen(false)
    }
  }

  const closeMessage = () => {
    setIsMessageVisible(false)
  }

  const clockText = formatTime(currentTime)
  const timerText = formatTimer(timerSeconds)

  // Usar hooks diferentes dependendo do layout
  const {
    fontSize: syncedFontSize,
    clockMeasureRef: clockMeasureRefSynced,
    timerMeasureRef: timerMeasureRefSynced,
  } = useSyncedFontSize(clockText, timerText, clockContainerRef, timerContainerRef, layoutMode)

  const ClockComponent = () => (
    <div className="flex flex-col items-center space-y-2 md:space-y-4 w-full">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-light text-gray-600 uppercase tracking-wider">
        {t.clock}
      </h2>
      <div
        ref={clockContainerRef}
        className={`w-full flex justify-center items-center ${
          layoutMode === "vertical"
            ? "h-20 sm:h-24 md:h-32 lg:h-40 xl:h-48"
            : "h-36 sm:h-44 md:h-52 lg:h-60 xl:h-72 2xl:h-80"
        }`}
      >
        <div
          className="font-mono font-bold text-black tracking-wider whitespace-nowrap"
          style={{ fontSize: `${syncedFontSize}px` }}
        >
          {clockText}
        </div>
      </div>
      {/* Elemento oculto para medição */}
      <div
        ref={clockMeasureRefSynced}
        className="font-mono font-bold tracking-wider whitespace-nowrap opacity-0 absolute pointer-events-none"
        style={{ top: "-9999px" }}
      />
    </div>
  )

  const TimerComponent = () => (
    <div className="flex flex-col items-center space-y-2 md:space-y-4 w-full">
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-light text-gray-600 uppercase tracking-wider">
        {t.timer}
      </h2>
      {isTimerFinished && timerSeconds <= 0 && (
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-red-600 animate-pulse">
          {t.timeUp}
        </div>
      )}
      <div
        ref={timerContainerRef}
        className={`w-full flex justify-center items-center ${
          layoutMode === "vertical"
            ? "h-20 sm:h-24 md:h-32 lg:h-40 xl:h-48"
            : "h-36 sm:h-44 md:h-52 lg:h-60 xl:h-72 2xl:h-80"
        }`}
      >
        <div
          className={`font-mono font-bold tracking-wider whitespace-nowrap ${
            timerSeconds < 0 ? "text-red-600 animate-pulse" : "text-black"
          }`}
          style={{ fontSize: `${syncedFontSize}px` }}
        >
          {timerText}
        </div>
      </div>
      {/* Elemento oculto para medição */}
      <div
        ref={timerMeasureRefSynced}
        className="font-mono font-bold tracking-wider whitespace-nowrap opacity-0 absolute pointer-events-none"
        style={{ top: "-9999px" }}
      />
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center mt-4">
        {!isTimerRunning ? (
          <Button
            onClick={startTimer}
            size="lg"
            className="text-base sm:text-lg md:text-xl lg:text-2xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            {t.start}
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            size="lg"
            className="text-base sm:text-lg md:text-xl lg:text-2xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Pause className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            {t.pause}
          </Button>
        )}
        <Button
          onClick={resetTimer}
          size="lg"
          variant="outline"
          className="text-base sm:text-lg md:text-xl lg:text-2xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-gray-400 text-black hover:bg-gray-100 bg-transparent"
        >
          <Reset className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          {t.reset}
        </Button>
      </div>
    </div>
  )

  return (
    <div
      className="min-h-screen bg-white text-black overflow-x-hidden"
      style={{ paddingLeft: "50px", paddingRight: "50px", paddingTop: "1rem", paddingBottom: "2rem" }}
    >
      {/* Control buttons */}
      <div className="fixed top-4 right-4 z-10 flex flex-wrap gap-2" style={{ right: "54px" }}>
        <Button
          onClick={toggleLanguage}
          variant="outline"
          size="sm"
          className="bg-white border-gray-400 hover:bg-gray-100 text-black flex items-center space-x-1 px-3 py-2"
        >
          <Globe className="h-3 w-3" />
          <span className="text-xs font-medium hidden sm:inline">{t.language}</span>
        </Button>

        <Button
          onClick={toggleLayout}
          variant="outline"
          size="sm"
          className="bg-white border-gray-400 hover:bg-gray-100 text-black flex items-center space-x-1 px-3 py-2"
        >
          <Layout className="h-3 w-3" />
          <span className="text-xs font-medium hidden sm:inline">{t.layout}</span>
        </Button>

        <Button
          onClick={toggleTimeFormat}
          variant="outline"
          size="sm"
          className="bg-white border-gray-400 hover:bg-gray-100 text-black flex items-center space-x-1 px-3 py-2"
        >
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium hidden sm:inline">{t.timeFormat}</span>
        </Button>

        <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-gray-400 hover:bg-gray-100 text-black flex items-center space-x-1 px-3 py-2"
            >
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs font-medium hidden sm:inline">{t.message}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-300 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">{t.writeMessage}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="messageText" className="text-black">
                  {t.messageText}
                </Label>
                <Textarea
                  id="messageText"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t.messageText}
                  className="bg-white border-gray-300 text-black min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-black">
                  {t.fontSize}
                </Label>
                <Input
                  id="fontSize"
                  type="number"
                  min="12"
                  max="200"
                  value={messageFontSize}
                  onChange={(e) => setMessageFontSize(Number.parseInt(e.target.value) || 48)}
                  className="bg-white border-gray-300 text-black"
                />
              </div>
              <Button
                onClick={showMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!messageText.trim()}
              >
                {t.showMessage}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-gray-400 hover:bg-gray-100 text-black flex items-center space-x-1 px-3 py-2"
            >
              <Settings className="h-3 w-3" />
              <span className="text-xs font-medium hidden sm:inline">{t.settings}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-black">{t.configureTimer}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-black">
                    {t.hours}
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="23"
                    value={configHours}
                    onChange={(e) => setConfigHours(Number.parseInt(e.target.value) || 0)}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutes" className="text-black">
                    {t.minutes}
                  </Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={configMinutes}
                    onChange={(e) => setConfigMinutes(Number.parseInt(e.target.value) || 0)}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seconds" className="text-black">
                    {t.seconds}
                  </Label>
                  <Input
                    id="seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={configSeconds}
                    onChange={(e) => setConfigSeconds(Number.parseInt(e.target.value) || 0)}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </div>
              <Button onClick={saveTimerConfig} className="bg-blue-600 hover:bg-blue-700 text-white">
                {t.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Language indicator */}
      <div className="fixed top-4 left-4 text-2xl" style={{ left: "54px" }}>
        {language === "pt" ? "🇧🇷" : "🇺🇸"}
      </div>

      {/* Message overlay */}
      {isMessageVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full relative">
            <Button
              onClick={closeMessage}
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white border-gray-400 hover:bg-gray-100 text-black"
            >
              <X className="h-4 w-4" />
            </Button>
            <div
              className="text-black text-center break-words"
              style={{ fontSize: `${displayFontSize}px`, lineHeight: "1.2" }}
            >
              {displayMessage}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex items-center justify-center py-12 sm:py-16" style={{ minHeight: "calc(100vh - 8rem)" }}>
        {layoutMode === "horizontal" ? (
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 w-full h-full">
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <ClockComponent />
            </div>
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <TimerComponent />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 sm:space-y-8 lg:space-y-0 lg:space-x-6 xl:space-x-8 2xl:space-x-12 w-full h-full">
            <div className="flex-1 flex justify-center w-full min-w-0">
              <ClockComponent />
            </div>
            <div className="flex-1 flex justify-center w-full min-w-0">
              <TimerComponent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
