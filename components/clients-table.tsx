"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Users, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Archive, PanelRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Client } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { AddClientDialog } from "@/components/add-client-dialog"
import { ClientDrawer } from "@/components/client-drawer"

interface ClientsTableProps {
  clients: Client[]
  onClientSelect: (client: Client) => void
  onClientAdded: () => void
  onAddClientClick: () => void
  showArchived?: boolean
}

type StatusFilter = "all" | "action" | "incomplete" | "complete"
type ViewMode = "list" | "priorities"

// Utility functions for UI-only computations
// Use client ID to deterministically assign progress so 80% of clients show as completed
function computeProgress(client: Client): number {
  // Use a hash of the client id to get a deterministic value
  const hash = client.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const mod = hash % 10
  
  // 80% of clients (mod 0-7) get high progress (80-100%)
  // 20% of clients (mod 8-9) get lower progress
  if (mod <= 7) {
    return 80 + (mod * 2.5) // 80%, 82.5%, 85%, 87.5%, 90%, 92.5%, 95%, 97.5%
  } else if (mod === 8) {
    return 55 // Incomplete
  } else {
    return 30 // Action required
  }
}

function computeStatus(client: Client): "complete" | "incomplete" | "action" | "onboarding" {
  // Check if onboarding is not completed
  if (client.onboarding_form_completed === false) {
    return "onboarding"
  }
  
  const progress = computeProgress(client)
  if (progress >= 75) return "complete"
  if (progress >= 50) return "incomplete"
  return "action"
}

function getStatusBadgeConfig(status: string) {
  switch (status) {
    case "onboarding":
      return { label: "Onboarding", className: "bg-blue-50 text-blue-700 border-blue-200" }
    case "complete":
      return { label: "Complet", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    case "incomplete":
      return { label: "Incomplet", className: "bg-amber-50 text-amber-700 border-amber-200" }
    case "action":
      return { label: "Action requise", className: "bg-orange-50 text-orange-700 border-orange-200" }
    default:
      return { label: "Actif", className: "bg-slate-50 text-slate-700 border-slate-200" }
  }
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return "bg-emerald-500"
  if (progress >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function ClientsTable({ clients, onClientSelect, onClientAdded, onAddClientClick, showArchived = false }: ClientsTableProps) {
  const [displayClients, setDisplayClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<"name" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [drawerClient, setDrawerClient] = useState<Client | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [clientToArchive, setClientToArchive] = useState<Client | null>(null)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const handleArchiveClient = async () => {
    if (!clientToArchive) return

    const supabase = createClient()
    const { error } = await supabase.from("clients").update({ archived: !showArchived }).eq("id", clientToArchive.id)

    if (!error) {
      setShowArchiveDialog(false)
      setClientToArchive(null)
      onClientAdded()
    }
  }

  useEffect(() => {
    async function loadDisplayClients() {
      setIsLoading(true)
      if (showArchived) {
        const supabase = createClient()
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("archived", true)
          .order("created_at", { ascending: false })
        setDisplayClients(data || [])
      } else {
        setDisplayClients(clients)
      }
      setIsLoading(false)
    }
    loadDisplayClients()
  }, [clients, showArchived])

  const handleSort = (column: "name" | "status") => {
    if (sortColumn === column) {
      // Toggle direction or reset
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        setSortColumn(null)
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: "name" | "status") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-foreground" />
    ) : (
      <ArrowDown className="h-4 w-4 text-foreground" />
    )
  }

  const filteredClients = useMemo(() => {
    let result = displayClients

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          `${client.first_name} ${client.last_name}`.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.phone && client.phone.includes(query))
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((client) => computeStatus(client) === statusFilter)
    }

    // View mode - priorities shows non "complete" first
    if (viewMode === "priorities") {
      result = [...result].sort((a, b) => {
        const statusA = computeStatus(a)
        const statusB = computeStatus(b)
        if (statusA === "complete" && statusB !== "complete") return 1
        if (statusA !== "complete" && statusB === "complete") return -1
        return 0
      })
    }

    // Sort logic
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let comparison = 0
        
        if (sortColumn === "name") {
          const nameA = a.last_name.toLowerCase()
          const nameB = b.last_name.toLowerCase()
          comparison = nameA.localeCompare(nameB)
        } else if (sortColumn === "status") {
          const statusA = computeStatus(a)
          const statusB = computeStatus(b)
          const statusOrder = { action: 0, incomplete: 1, complete: 2 }
          comparison = statusOrder[statusA] - statusOrder[statusB]
        }
        
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [displayClients, searchQuery, statusFilter, viewMode, sortColumn, sortDirection])



  const filterChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "action", label: "Action requise" },
    { key: "incomplete", label: "Incomplet" },
    { key: "complete", label: "Complet" },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Tableau de bord
            </h1>
          </div>
          
          {!showArchived && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              
              <Button onClick={onAddClientClick} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau client
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-4 px-6 font-semibold">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Client
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 font-semibold">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Statut
                    {getSortIcon("status")}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="py-5 px-6"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                // Empty state
                <TableRow>
                    <TableCell colSpan={3} className="py-16 px-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">
                        {searchQuery || statusFilter !== "all"
                          ? "Aucun client trouve"
                          : "Aucun client pour l'instant"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        {searchQuery || statusFilter !== "all"
                          ? "Essayez de modifier vos criteres de recherche ou filtres."
                          : "Ajoutez votre premier client pour demarrer un dossier fiscal."}
                      </p>
                      {!showArchived && !searchQuery && statusFilter === "all" && (
                        <Button onClick={() => setIsDialogOpen(true)} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Nouveau client
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const progress = computeProgress(client)
                  const status = showArchived ? "archived" : computeStatus(client)
                  const statusConfig = showArchived
                    ? { label: "Archive", className: "bg-slate-100 text-slate-600 border-slate-200" }
                    : getStatusBadgeConfig(status)

                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => onClientSelect(client)}
                    >
                      {/* Client */}
                      <TableCell className="py-5 px-6">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {getInitials(client.first_name, client.last_name)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {client.last_name.toUpperCase()} {client.first_name}
                                </p>
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Tel:</span> {client.phone || "Non renseigne"}</p>
                              <p><span className="font-medium">Adresse:</span> {client.address || "Non renseignee"}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Statut */}
                      <TableCell className="py-5 px-6">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className={`${statusConfig.className} font-medium`}>
                              {statusConfig.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {status === "complete" && "Le dossier est complet"}
                              {status === "incomplete" && "Certaines informations sont manquantes"}
                              {status === "action" && "Des actions sont requises sur ce dossier"}
                              {status === "archived" && "Ce client est archive"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-5 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDrawerClient(client)
                                  setDrawerOpen(true)
                                }}
                              >
                                <PanelRight className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Détails du dossier</TooltipContent>
                          </Tooltip>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setClientToArchive(client)
                                  setShowArchiveDialog(true)
                                }}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                {showArchived ? "Désarchiver" : "Archiver"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Client Dialog */}
        {isDialogOpen && (
          <AddClientDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onClientAdded={onClientAdded} />
        )}

        {/* Archive Dialog */}
        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{showArchived ? "Désarchiver ce client ?" : "Archiver ce client ?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {showArchived
                  ? `Le client ${clientToArchive?.first_name} ${clientToArchive?.last_name} sera restauré dans la liste des clients actifs.`
                  : `Le client ${clientToArchive?.first_name} ${clientToArchive?.last_name} sera déplacé vers les archives.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchiveClient}>
                {showArchived ? "Désarchiver" : "Archiver"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Client Details Drawer */}
        <ClientDrawer
          client={drawerClient}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </TooltipProvider>
  )
}
