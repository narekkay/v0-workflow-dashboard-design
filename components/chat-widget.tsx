"use client"

import React from "react"

import { useState } from "react"
import { MessageCircle, X, Send, RotateCcw, Bot, LayoutGrid, Maximize2, Minimize2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatWidgetProps {
  userName?: string
}

export function ChatWidget({ userName = "Dupont" }: ChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionId] = useState(() => Date.now().toString())
const initialMessage: Message = {
    id: "1",
    content: `Bonjour Maître ${userName},\nUne question sur un client ?\nUn process flou ?\nJe suis la pour vous aider ☀️`,
    role: "assistant",
    timestamp: new Date(),
  }

  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [inputValue, setInputValue] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const searchFilters = [
    { 
      id: "legifiscal", 
      name: "LegiFiscal", 
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legifiscal-AkGgTX8PLSiPQ56iV63Wp8rHD1aQ9k.png" 
    },
    { 
      id: "wisetax", 
      name: "Wisetax", 
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-wisetax-b9mBRHRm5WaMBHxGivAX0d9svbowq9.svg" 
    },
    { 
      id: "lexisai", 
      name: "Lexis+AI", 
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lexisai-9p9fE4pHIptNh6nPAlnPeQGvfWzu4T.png" 
    },
  ]

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Merci pour votre question. Je suis la pour vous accompagner dans la gestion de vos dossiers fiscaux. N'hesitez pas a me poser des questions sur vos clients ou declarations.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([{ ...initialMessage, id: Date.now().toString(), timestamp: new Date() }])
  }

  const handleSaveHistory = async () => {
    try {
      // Save chat history to database
      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages: messages.map(msg => ({
            message_id: msg.id,
            content: msg.content,
            role: msg.role,
            selected_filter: selectedFilter,
            timestamp: msg.timestamp,
          })),
        }),
      })

      if (response.ok) {
        console.log('[v0] Chat history saved successfully')
        alert('Historique sauvegardé avec succès!')
      } else {
        console.error('[v0] Failed to save chat history')
        alert('Erreur lors de la sauvegarde de l\'historique')
      }
    } catch (error) {
      console.error('[v0] Error saving chat history:', error)
      alert('Erreur lors de la sauvegarde de l\'historique')
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 border bg-card shadow-2xl overflow-hidden transition-all duration-300 ease-in-out",
          isFullscreen 
            ? "inset-4 rounded-lg" 
            : "bottom-24 right-6 w-80 sm:w-96 rounded-2xl animate-in slide-in-from-bottom-4 fade-in"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-sm">Assistant Fiscalia</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleSaveHistory}
                title="Sauvegarder l'historique"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleReset}
                title="Nouvelle conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className={cn(
            "overflow-y-auto p-4 space-y-3 bg-muted/30 relative transition-all duration-300 ease-in-out",
            isFullscreen ? "h-[calc(100vh-12rem)]" : "h-80"
          )}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {/* Selected Filter Logo */}
            {selectedFilter && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-card border rounded-full px-3 py-1.5 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={searchFilters.find(f => f.id === selectedFilter)?.logo}
                    alt={searchFilters.find(f => f.id === selectedFilter)?.name}
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {searchFilters.find(f => f.id === selectedFilter)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-card">
            <div className="flex items-center gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                      Rechercher dans:
                    </div>
                    {searchFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setSelectedFilter(selectedFilter === filter.id ? null : filter.id)
                          setIsFilterOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors",
                          selectedFilter === filter.id && "bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2",
                          selectedFilter === filter.id ? "border-primary" : "border-transparent"
                        )}>
                          <img
                            src={filter.logo}
                            alt={filter.name}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <span className="text-sm font-medium">{filter.name}</span>
                        {selectedFilter === filter.id && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                placeholder="Ecrivez votre message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-muted/50 border-0 focus-visible:ring-1"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {selectedFilter && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Recherche dans: {searchFilters.find(f => f.id === selectedFilter)?.name}</span>
                <button
                  onClick={() => setSelectedFilter(null)}
                  className="text-primary hover:underline"
                >
                  Effacer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105",
          isOpen
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  )
}
