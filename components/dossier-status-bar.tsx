"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DossierStats {
  totalExpected: number
  exploitable: number
  incomplete: number
  missingBlocking: number
  lastReminderAt?: string
}

interface DossierStatusBarProps {
  stats: DossierStats
  onRelance: () => void
  isRelancing?: boolean
}

export function DossierStatusBar({ stats, onRelance, isRelancing }: DossierStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatus = () => {
    if (stats.missingBlocking > 0) return "blocked"
    if (stats.incomplete > 0) return "incomplete"
    return "completable"
  }

  const status = getStatus()

  const statusConfig = {
    blocked: {
      label: "Bloquée",
      icon: AlertTriangle,
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      iconClass: "text-red-600",
    },
    incomplete: {
      label: "Incomplète",
      icon: AlertCircle,
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
      iconClass: "text-orange-600",
    },
    completable: {
      label: "Complétable",
      icon: CheckCircle2,
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      iconClass: "text-green-600",
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return "Jamais"
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString("fr-FR")
  }

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-slate-400">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Version courte - toujours visible */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-5 w-5", config.iconClass)} />
                  <span className="font-medium text-sm">Déclaration 2042 + annexes</span>
                </div>
                <Badge variant="outline" className={config.badgeClass}>
                  {config.label}
                </Badge>
                {stats.missingBlocking > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-red-600 cursor-help">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Bloquants : {stats.missingBlocking}</span>
                        <Info className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bloquant = empêche la complétion automatique</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.missingBlocking > 0 && (
                  <Button size="sm" onClick={onRelance} disabled={isRelancing}>
                    {isRelancing ? "Relance en cours..." : "Relancer les docs bloquants"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="gap-1">
                  {isExpanded ? "Masquer" : "Voir le détail"}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Version détaillée - dépliable */}
            {isExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t">
                <div className="text-center">
                  <p className="text-2xl font-semibold">{stats.totalExpected}</p>
                  <p className="text-xs text-muted-foreground">Documents attendus</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-2xl font-semibold text-green-600">{stats.exploitable}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        Exploitables <Info className="h-3 w-3" />
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exploité = données extraites + affectées</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-orange-600">{stats.incomplete}</p>
                  <p className="text-xs text-muted-foreground">Incomplets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">{stats.missingBlocking}</p>
                  <p className="text-xs text-muted-foreground">Manquants bloquants</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{formatRelativeDate(stats.lastReminderAt)}</p>
                  <p className="text-xs text-muted-foreground">Dernière relance</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
