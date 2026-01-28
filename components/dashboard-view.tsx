"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Users, FolderOpen, Clock, Upload, Activity, Search, UserPlus } from "lucide-react"
import { Plus } from "lucide-react" // Added import for Plus
import type { Client } from "@/lib/types"

interface DashboardViewProps {
  clients: Client[]
  onClientSelect: (client: Client) => void
  onAddClient: () => void
}

export function DashboardView({ clients, onClientSelect, onAddClient }: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Simulate recent uploads (in real app, this would come from database)
  const recentUploads = [
    { id: 1, name: "Avis_imposition_2024.pdf", client: "Martin Dupont", date: "Il y a 2h" },
    { id: 2, name: "Bulletin_salaire_dec.pdf", client: "Sophie Bernard", date: "Il y a 5h" },
    { id: 3, name: "Releve_bancaire.pdf", client: "Jean Moreau", date: "Hier" },
  ]

  // Get all clients with status (simulated active cases)
  const allActiveCases = clients.map(client => ({
    ...client,
    status: Math.random() > 0.5 ? "En cours" : "En attente",
    progress: Math.floor(Math.random() * 60) + 40,
  }))

  // Filter active cases based on search query
  const activeCases = allActiveCases.filter(caseItem => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const firstName = caseItem.first_name?.toLowerCase() || ""
    const lastName = caseItem.last_name?.toLowerCase() || ""
    return firstName.includes(query) || lastName.includes(query)
  })

  // Simulate recent client activity
  const recentActivity = [
    { id: 1, client: "Martin Dupont", action: "Document uploade", time: "Il y a 30min" },
    { id: 2, client: "Sophie Bernard", action: "Formulaire complete", time: "Il y a 1h" },
    { id: 3, client: "Jean Moreau", action: "Connexion espace client", time: "Il y a 2h" },
    { id: 4, client: "Marie Lefebvre", action: "Message envoye", time: "Il y a 3h" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="text-center text-muted-foreground py-12">
        <p>Page non disponible</p>
      </div>
    </div>
  )
}
