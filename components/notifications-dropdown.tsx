"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
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
  notification_type?: string
  related_client_id?: string
  client_name?: string
}

interface NotificationsDropdownProps {
  notifications?: Notification[]
  onNotificationClick?: (notif: Notification) => void
  onClientClick?: (clientId: string) => void
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

export function NotificationsDropdown({ notifications, onNotificationClick, onClientClick }: NotificationsDropdownProps) {
  const [notifs, setNotifs] = useState<Notification[]>(notifications || defaultNotifications)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const supabase = createBrowserClient()
        
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)
        
        if (error) {
          console.error("[v0] Error fetching notifications:", error)
          setLoading(false)
          return
        }
        
        if (data) {
          // Fetch client names for notifications with related_client_id
          const clientIds = data.filter(n => n.related_client_id).map(n => n.related_client_id)
          const clientsMap = new Map<string, string>()
          
          if (clientIds.length > 0) {
            const { data: clientsData } = await supabase
              .from("clients")
              .select("id, first_name, last_name")
              .in("id", clientIds)
            
            if (clientsData) {
              clientsData.forEach(client => {
                clientsMap.set(client.id, `${client.first_name} ${client.last_name}`)
              })
            }
          }
          
          const mappedNotifications: Notification[] = data.map(notif => ({
            id: notif.id,
            type: notif.alert_type as NotificationType,
            title: notif.title,
            message: notif.content,
            timestamp: new Date(notif.created_at),
            read: notif.read_status,
            notification_type: notif.notification_type,
            related_client_id: notif.related_client_id,
            client_name: notif.related_client_id ? clientsMap.get(notif.related_client_id) : undefined,
          }))
          setNotifs(mappedNotifications)
        }
        
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching notifications:", err)
        // Keep default notifications on error
        setLoading(false)
      }
    }
    
    fetchNotifications()
  }, [])
  
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
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    
    if (diff < 1) return "À l'instant"
    if (diff < 60) return `il y a ${diff}min`
    if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
    return `il y a ${Math.floor(diff / 1440)}j`
  }
  
  const renderMessageWithClientLink = (message: string, clientId?: string, clientName?: string) => {
    if (!clientId || !clientName || !onClientClick) {
      return message
    }
    
    // Find the exact client name in the message
    const nameIndex = message.indexOf(clientName)
    
    if (nameIndex === -1) {
      return message
    }
    
    return (
      <>
        {message.substring(0, nameIndex)}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onClientClick(clientId)
          }}
          className="text-blue-600 underline cursor-pointer hover:text-blue-800"
        >
          {clientName}
        </span>
        {message.substring(nameIndex + clientName.length)}
      </>
    )
  }

  const handleNotificationClick = async (notif: Notification) => {
    setNotifs(prev => prev.map(n => 
      n.id === notif.id ? { ...n, read: true } : n
    ))
    
    // Update read status in database
    const supabase = createBrowserClient()
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("id", notif.id)
    
    // Call parent callback if provided
    if (onNotificationClick) {
      onNotificationClick(notif)
    }
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
                onClick={() => handleNotificationClick(notif)}
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
                    {renderMessageWithClientLink(notif.message, notif.related_client_id, notif.client_name)}
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
