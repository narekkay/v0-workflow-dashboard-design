"use client"

import { LayoutDashboardIcon,Users, FileText, ChevronLeft, ChevronRight, ChevronDown, Home, User, FolderOpen, Share2, Trash2, X, LayoutDashboard, LogOut, ExternalLink, Plug } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { LucideIcon } from "lucide-react"

type View = "clients" | "documents" | "settings" | "dashboard" | "integrations"

const navigation: Array<{ name: string; view: View; icon: typeof Users }> = [
  { name: "Tableau de bord", view: "dashboard", icon: LayoutDashboard },
  { name: "Clients", view: "clients", icon: Users },
]

export interface ClientTab {
  id: string
  label: string
  icon: LucideIcon
}

export interface RevenueTab {
  id: string
  categoryName: string
}

export interface YearTab {
  id: string
  year: number
}

interface SidebarProps {
  onViewChange: (view: View) => void
  clientTabs?: ClientTab[]
  revenueTabs?: RevenueTab[]
  yearTabs?: YearTab[]
  activeClientTab?: string
  onClientTabChange?: (tabId: string) => void
  onCloseRevenueTab?: (tabId: string) => void
  onCloseYearTab?: (tabId: string) => void
  clientName?: string
  clientId?: string
  conventionSigned?: boolean
  onboardingCompleted?: boolean
}

export function Sidebar({ 
  onViewChange, 
  clientTabs, 
  revenueTabs = [], 
  yearTabs = [], 
  activeClientTab, 
  onClientTabChange,
  onCloseRevenueTab,
  onCloseYearTab,
  clientName,
  clientId,
  conventionSigned = true,
  onboardingCompleted = true,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [declaratifOpen, setDeclaratifOpen] = useState(true)
  const [contentieuxOpen, setContentieuxOpen] = useState(true)

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 items-center border-b px-6 justify-between">
        {!isCollapsed && <h1 className="text-lg font-semibold text-sidebar-foreground">Fiscalia</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("rounded-md p-1.5 hover:bg-sidebar-accent transition-colors", isCollapsed && "mx-auto")}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <button
            onClick={() => onViewChange("dashboard")}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Tableau de bord" : undefined}
          >
            <LayoutDashboardIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Tableau de bord</span>}
          </button>
          
          <button
            onClick={() => onViewChange("clients")}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Clients" : undefined}
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Clients</span>}
          </button>
          
          <button
            onClick={() => onViewChange("integrations")}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed && "justify-center",
            )}
            title={isCollapsed ? "Intégrations" : undefined}
          >
            <Plug className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Intégrations</span>}
          </button>
        </div>

        {/* Client tabs section */}
        {clientTabs && clientTabs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-sidebar-border">
            {/* Client name */}
            {!isCollapsed && clientName && (
              <div className="px-3 py-2 text-sm font-medium text-sidebar-foreground truncate">
                {clientName}
              </div>
            )}

            {/* Client Portal Button */}
            {!isCollapsed && clientId && (
              <a
                href={`/memberview/${clientId}`}
                className="flex items-center gap-2 mx-3 mt-2 px-3 py-2 text-sm rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span>Portail client</span>
              </a>
            )}

            {/* ESPACE DECLARATIF or ONBOARDING */}
            {!isCollapsed ? (
              onboardingCompleted ? (
                // Show ESPACE DECLARATIF when onboarding completed
                <Collapsible open={declaratifOpen} onOpenChange={setDeclaratifOpen} className="mt-4">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                    <h4 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide">ESPACE DECLARATIF</h4>
                    <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", declaratifOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-2">
                      {[...clientTabs].sort((a, b) => {
                        const getOrder = (label: string) => {
                          const lower = label.toLowerCase()
                          if (lower.includes("apercu") || lower.includes("général") || lower.includes("general")) return 0
                          if (lower.includes("fiche")) return 1
                          if (lower.includes("foyer")) return 2
                          if (lower.includes("declaration") || lower.includes("déclaration")) return 3
                          if (lower.includes("document")) return 4
                          if (lower.includes("partage")) return 5
                          return 999
                        }
                        return getOrder(a.label) - getOrder(b.label)
                      }).map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => onClientTabChange?.(tab.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              activeClientTab === tab.id
                                ? "bg-primary/10 text-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Revenue tabs */}
                    {revenueTabs.length > 0 && (
                      <div className="mt-4">
                        <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">
                          Revenus
                        </div>
                        <div className="space-y-1">
                          {revenueTabs.map((tab) => (
                            <div
                              key={tab.id}
                              className={cn(
                                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                activeClientTab === tab.id
                                  ? "bg-primary/10 text-primary"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                              onClick={() => onClientTabChange?.(tab.id)}
                            >
                              <span className="truncate flex-1">{tab.categoryName}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onCloseRevenueTab?.(tab.id)
                                }}
                                className="rounded-sm opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent/50 p-1 transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Year tabs */}
                    {yearTabs.length > 0 && (
                      <div className="mt-4">
                        <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">
                          Annees
                        </div>
                        <div className="space-y-1">
                          {yearTabs.map((tab) => (
                            <div
                              key={tab.id}
                              className={cn(
                                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                activeClientTab === tab.id
                                  ? "bg-primary/10 text-primary"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                              onClick={() => onClientTabChange?.(tab.id)}
                            >
                              <span className="truncate flex-1">Annee {tab.year}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onCloseYearTab?.(tab.id)
                                }}
                                className="rounded-sm opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent/50 p-1 transition-all"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                // Show ONBOARDING when onboarding not completed
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide px-3 py-2">
                    ONBOARDING
                  </h4>
                </div>
              )
            ) : onboardingCompleted ? (
              <div className="space-y-1">
                {clientTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onClientTabChange?.(tab.id)}
                      className={cn(
                        "flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors",
                        activeClientTab === tab.id
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                      title={tab.label}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            ) : null}

            {/* ESPACE CONTENTIEUX category */}
            {!isCollapsed && onboardingCompleted && (
              <Collapsible open={contentieuxOpen} onOpenChange={setContentieuxOpen} className="mt-4">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                  <h4 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide">ESPACE CONTENTIEUX</h4>
                  <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", contentieuxOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 py-4 text-sm text-muted-foreground italic">
                    Aucun contentieux en cours
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                isCollapsed && "justify-center"
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    Maître Dupont
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    avocat@fiscalia.com
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => {
                // Handle logout
                window.location.href = '/logout'
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
