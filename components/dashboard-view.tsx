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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Tableau de bord</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={onAddClient} size="icon" title="Nouveau client">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent uploads */}
        

        {/* Active cases */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Dossiers en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCases.map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onClientSelect(caseItem)}
              >
                <div className="min-w-0 flex-1 flex items-center gap-4">
                  <p className="text-sm font-medium min-w-[150px]">{caseItem.first_name} {caseItem.last_name}</p>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-emerald-500" 
                        style={{ width: `${caseItem.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[35px] text-right">{caseItem.progress}%</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {caseItem.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        
      </div>
    </div>
  )
}
