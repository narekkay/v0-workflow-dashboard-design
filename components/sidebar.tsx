"use client"

import { Users, FileText, ChevronLeft, ChevronRight, ChevronDown, Home, User, FolderOpen, Share2, Trash2, X, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { LucideIcon } from "lucide-react"

type View = "clients" | "documents" | "settings" | "dashboard"

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
        {!isCollapsed && <h1 className="text-lg font-semibold text-sidebar-foreground">FiscalPro</h1>}
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
          {navigation.map((item) => {
            return (
              <button
                key={item.name}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </button>
            )
          })}
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

            {/* ESPACE DECLARATIF category */}
            {!isCollapsed ? (
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
            )}

            {/* ESPACE CONTENTIEUX category */}
            {!isCollapsed && (
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
    </div>
  )
}
