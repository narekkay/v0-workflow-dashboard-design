"use client"

import { useState } from "react"
import { Bell, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type NotificationType = "success" | "warning" | "error"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface NotificationsDropdownProps {
  notifications?: Notification[]
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Client créé avec succès",
    message: "Le client Jean Dupont a été ajouté au système",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Document en attente",
    message: "3 documents nécessitent votre validation",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: "3",
    type: "error",
    title: "Échec de l'envoi",
    message: "Impossible d'envoyer l'email à Marie Martin",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false,
  },
]

export function NotificationsDropdown({ notifications = defaultNotifications }: NotificationsDropdownProps) {
  const [notifs, setNotifs] = useState<Notification[]>(notifications)
  
  const unreadCount = notifs.filter(n => !n.read).length
  const latestThree = notifs.slice(0, 3)

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }

  const handleNotificationClick = (id: string) => {
    setNotifs(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        
        {latestThree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {latestThree.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="px-4 py-3 cursor-pointer flex items-start gap-3 focus:bg-muted/50"
                onClick={() => handleNotificationClick(notif.id)}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{notif.title}</p>
                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(notif.timestamp)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifs.length > 3 && (
          <div className="px-4 py-2 border-t">
            <button className="text-xs text-primary hover:underline w-full text-center">
              Voir toutes les notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
