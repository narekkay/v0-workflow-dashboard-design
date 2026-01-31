"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plug, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  connected: boolean
}

const integrations: Integration[] = [
  { id: "gmail", name: "Gmail", description: "Synchronisez vos emails et envois de documents", category: "Communication", connected: false },
  { id: "bofip", name: "Bofip", description: "Base officielle des impôts", category: "Documentation fiscale", connected: false },
  { id: "legifrance", name: "LegiFrance", description: "Service public de diffusion du droit", category: "Documentation juridique", connected: false },
  { id: "pappers", name: "Pappers", description: "Données légales et financières des entreprises", category: "Recherche d'entreprises", connected: false },
  { id: "navis", name: "Navis", description: "Plateforme de veille fiscale", category: "Veille fiscale", connected: false },
  { id: "wisetax", name: "Wisetax", description: "Solution de gestion fiscale", category: "Gestion fiscale", connected: false },
  { id: "revue-fiduciaire", name: "Revue Fiduciaire", description: "Documentation fiscale et sociale", category: "Documentation fiscale", connected: false },
  { id: "doctrine", name: "Doctrine", description: "Base de données juridique", category: "Documentation juridique", connected: false },
  { id: "lexbase", name: "Lexbase", description: "Plateforme juridique et fiscale", category: "Documentation juridique", connected: false },
  { id: "lexisnexis", name: "Lexisnexis", description: "Solutions juridiques professionnelles", category: "Documentation juridique", connected: false },
  { id: "lamyline", name: "Lamyline", description: "Documentation juridique Lamy", category: "Documentation juridique", connected: false },
  { id: "legifiscale", name: "LegiFiscale", description: "Documentation et veille fiscale", category: "Documentation fiscale", connected: false },
]

export function IntegrationsView() {
  const [apps, setApps] = useState<Integration[]>(integrations)

  const handleConnect = (id: string) => {
    setApps(prev => prev.map(app => 
      app.id === id ? { ...app, connected: true } : app
    ))
  }

  const handleDisconnect = (id: string) => {
    setApps(prev => prev.map(app => 
      app.id === id ? { ...app, connected: false } : app
    ))
  }

  const groupedApps = apps.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = []
    }
    acc[app.category].push(app)
    return acc
  }, {} as Record<string, Integration[]>)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Intégrations</h1>
          <p className="text-muted-foreground">
            Connectez vos outils préférés pour optimiser votre workflow
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedApps).map(([category, categoryApps]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryApps.map((app) => (
                  <Card key={app.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plug className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{app.name}</CardTitle>
                            {app.connected && (
                              <Badge variant="secondary" className="mt-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connecté
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {app.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {app.connected ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDisconnect(app.id)}
                        >
                          Déconnecter
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleConnect(app.id)}
                        >
                          Intégrer
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
