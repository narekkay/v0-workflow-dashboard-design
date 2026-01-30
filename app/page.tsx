"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Settings, Archive, Home, User, FileText, FolderOpen, Users, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar, type ClientTab, type RevenueTab, type YearTab } from "@/components/sidebar"
import { ClientsTable } from "@/components/clients-table"
import { ClientTabs } from "@/components/client-tabs"
import { RevenueFullPage } from "@/components/revenue-full-page"
import { Form2042View } from "@/components/form-2042-view"
import { ChatWidget } from "@/components/chat-widget"
import { DashboardView } from "@/components/dashboard-view"
import { RevenueAmountEntry } from "@/components/revenue-amount-entry"
import { AddClientPage } from "@/components/add-client-page"
import type { Client, TaxProfile, Document } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { OnboardingView } from "@/components/onboarding-view"

type View = "clients" | "documents" | "settings" | "archives" | "dashboard"

const clientBaseTabs: ClientTab[] = [
  { id: "overview", label: "Aperçu général", icon: Home },
  { id: "profile", label: "Fiche client", icon: User },
  { id: "declarations", label: "Déclarations", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "foyer", label: "Foyer fiscal", icon: Users },
  { id: "partage", label: "Partage", icon: Share2 },
]

interface Tab {
  id: string
  type: "view" | "client" | "form2042" | "add-client" | "onboarding"
  label: string
  view?: View
  clientId?: string
}

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [tabs, setTabs] = useState<Tab[]>([{ id: "view-clients", type: "view", label: "Clients", view: "clients" }])
  const [activeTabId, setActiveTabId] = useState("view-clients")
  const [clientsData, setClientsData] = useState<
    Map<string, { client: Client; taxProfiles: TaxProfile[]; documents: Document[] }>
  >(new Map())
  const [revenueView, setRevenueView] = useState<{
    clientId: string
    clientName: string
    categoryName: string
    categoryId: number
    existingSubCategoryIds?: number[]
    revenueId?: string
  } | null>(null)
  const [amountEntryView, setAmountEntryView] = useState<{
    clientId: string
    clientName: string
    categoryId: number
    categoryName: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [shouldOpenRevenueModal, setShouldOpenRevenueModal] = useState(false)
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [activeClientTab, setActiveClientTab] = useState("overview")
  const [clientRevenueTabs, setClientRevenueTabs] = useState<RevenueTab[]>([])
  const [clientYearTabs, setClientYearTabs] = useState<YearTab[]>([])
  const [currentClientName, setCurrentClientName] = useState<string>("")

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const supabase = createClient()
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function loadClientData(clientId: string) {
    const supabase = createClient()
    const [{ data: clientData }, { data: profiles }, { data: docs }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("tax_profiles").select("*").eq("client_id", clientId),
      supabase.from("documents").select("*").eq("client_id", clientId),
    ])

    if (clientData) {
      setClientsData((prev) => {
        const newMap = new Map(prev)
        newMap.set(clientId, {
          client: clientData,
          taxProfiles: profiles || [],
          documents: docs || [],
        })
        return newMap
      })
    }
  }

  function handleClientSelect(client: Client) {
    // If onboarding not completed, open onboarding tab instead
    if (client.onboarding_form_completed === false) {
      const onboardingTabId = `onboarding-${client.id}`
      const existingOnboardingTab = tabs.find(t => t.id === onboardingTabId)
      
      if (!existingOnboardingTab) {
        setTabs(prev => [...prev, {
          id: onboardingTabId,
          type: "onboarding",
          label: `Onboarding ${client.first_name} ${client.last_name}`,
          clientId: client.id,
        }])
      }
      
      setActiveTabId(onboardingTabId)
      return
    }
    
    const existingTab = tabs.find((tab) => tab.type === "client" && tab.clientId === client.id)

    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const newTab: Tab = {
        id: `client-${client.id}`,
        type: "client",
        label: `${client.first_name} ${client.last_name}`,
        clientId: client.id,
      }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
      loadClientData(client.id)
    }
    setCurrentClientName(`${client.first_name} ${client.last_name}`)
    setActiveClientTab("overview")
    setClientRevenueTabs([])
    setClientYearTabs([])
  }

  function handleCloseTab(tabId: string) {
    const tabIndex = tabs.findIndex((t) => t.id === tabId)
    const newTabs = tabs.filter((t) => t.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId) {
      if (tabIndex > 0) {
        setActiveTabId(newTabs[tabIndex - 1].id)
      } else {
        setActiveTabId(newTabs[0]?.id || "view-clients")
      }
    }
  }

  function handleViewChange(view: View) {
    const existingTab = tabs.find((tab) => tab.type === "view" && tab.view === view)

    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const viewLabels: Record<View, string> = {
        clients: "Clients",
        documents: "Documents",
        settings: "Paramètres",
        archives: "Archives",
        dashboard: "Tableau de bord",
      }
      const newTab: Tab = {
        id: `view-${view}`,
        type: "view",
        label: viewLabels[view],
        view,
      }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
    }
  }

  function handleOpenRevenuePage(
    clientId: string,
    clientName: string,
    categoryName: string,
    categoryId: number,
    existingSubCategoryIds?: number[],
    revenueId?: string,
  ) {
    setRevenueView({ clientId, clientName, categoryName, categoryId, existingSubCategoryIds, revenueId })
  }

  function handleCloseRevenuePage(openModal = false) {
    setRevenueView(null)
    if (!openModal) {
      const clientTab = tabs.find((tab) => tab.type === "client" && tab.clientId === revenueView?.clientId)
      if (clientTab) {
        setActiveTabId(clientTab.id)
        loadClientData(clientTab.clientId!)
      }
    } else {
      setShouldOpenRevenueModal(openModal)
    }
  }

  function handleOpenAmountEntry(clientId: string, clientName: string, categoryId: number, categoryName: string) {
    setAmountEntryView({ clientId, clientName, categoryId, categoryName })
  }

  function handleCloseAmountEntry() {
    setAmountEntryView(null)
    const clientTab = tabs.find((tab) => tab.type === "client" && tab.clientId === amountEntryView?.clientId)
    if (clientTab) {
      setActiveTabId(clientTab.id)
    }
  }

  function handleDragStart(index: number) {
    setDraggedTabIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedTabIndex === null || draggedTabIndex === index) return

    setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedTabIndex === null || draggedTabIndex === index) return

    const newTabs = [...tabs]
    const draggedTab = newTabs[draggedTabIndex]
    newTabs.splice(draggedTabIndex, 1)
    newTabs.splice(index, 0, draggedTab)

    setTabs(newTabs)
    setDraggedTabIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDraggedTabIndex(null)
    setDragOverIndex(null)
  }

  function handleOpen2042View(clientId: string, clientName: string) {
    const newTab: Tab = {
      id: `form2042-${clientId}`,
      type: "form2042",
      label: `2042 - ${clientName}`,
      clientId,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const isClientView = activeTab?.type === "client"
  const isOnboardingView = activeTab?.type === "onboarding"

  return (
    <div className="flex h-screen">
      <Sidebar 
        onViewChange={handleViewChange}
        clientTabs={(isClientView || isOnboardingView) && clientBaseTabs.length > 0 ? clientBaseTabs : undefined}
        revenueTabs={isClientView ? clientRevenueTabs : undefined}
        yearTabs={isClientView ? clientYearTabs : undefined}
        activeClientTab={isClientView ? activeClientTab : undefined}
        onClientTabChange={isClientView ? setActiveClientTab : undefined}
        onCloseRevenueTab={isClientView ? (id) => setClientRevenueTabs(prev => prev.filter(t => t.id !== id)) : undefined}
        onCloseYearTab={isClientView ? (id) => setClientYearTabs(prev => prev.filter(t => t.id !== id)) : undefined}
        clientName={(isClientView || isOnboardingView) ? currentClientName : undefined}
        conventionSigned={
          (isClientView || isOnboardingView) && activeTab.clientId 
            ? clientsData.get(activeTab.clientId)?.client.convention_signed ?? false
            : undefined
        }
        onboardingCompleted={
          (isClientView || isOnboardingView) && activeTab.clientId 
            ? clientsData.get(activeTab.clientId)?.client.onboarding_form_completed ?? false
            : true
        }
      />
      {amountEntryView ? (
        <RevenueAmountEntry
          clientId={amountEntryView.clientId}
          clientName={amountEntryView.clientName}
          categoryId={amountEntryView.categoryId}
          categoryName={amountEntryView.categoryName}
          onClose={handleCloseAmountEntry}
        />
      ) : revenueView ? (
        <RevenueFullPage
          clientId={revenueView.clientId}
          clientName={revenueView.clientName}
          categoryName={revenueView.categoryName}
          categoryId={revenueView.categoryId}
          existingSubCategoryIds={revenueView.existingSubCategoryIds}
          revenueId={revenueView.revenueId}
          onClose={handleCloseRevenuePage}
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-1 border-b bg-background px-2">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  draggedTabIndex === index ? "opacity-50 scale-95" : "opacity-100 scale-100"
                } ${dragOverIndex === index && draggedTabIndex !== index ? "border-l-4 border-l-blue-500" : ""} ${
                  activeTabId === tab.id
                    ? "border-primary bg-muted/50 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(tab.id)
                  }}
                  className="rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            <div className="ml-auto pr-2 flex items-center gap-2">
              <NotificationsDropdown 
                onNotificationClick={(notif) => {
                  if (notif.notification_type === "onboarding_filled" && notif.related_client_id) {
                    // Open onboarding tab for the client
                    const client = clients.find(c => c.id === notif.related_client_id)
                    if (client) {
                      const tabId = `onboarding-${notif.related_client_id}`
                      const existingTab = tabs.find(t => t.id === tabId)
                      
                      if (!existingTab) {
                        setTabs([...tabs, {
                          id: tabId,
                          type: "onboarding",
                          label: `Onboarding ${client.first_name} ${client.last_name}`,
                          clientId: notif.related_client_id,
                        }])
                      }
                      
                      setActiveTabId(tabId)
                    }
                  }
                }}
                onClientClick={(clientId) => {
                  const client = clients.find(c => c.id === clientId)
                  if (client) {
                    handleClientSelect(client)
                  }
                }}
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewChange("archives")}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archives clients
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <main className={`flex-1 overflow-y-auto ${activeTab?.type === "client" ? "bg-slate-50" : "bg-muted/20"}`}>
            {activeTab?.type === "view" && activeTab.view === "clients" ? (
              <div className="p-6">
                <ClientsTable 
                  clients={clients} 
                  onClientSelect={handleClientSelect} 
                  onClientAdded={loadClients}
                  onAddClientClick={() => {
                    const newTab: Tab = {
                      id: `add-client-${Date.now()}`,
                      type: "add-client",
                      label: "Nouveau client",
                    }
                    setTabs([...tabs, newTab])
                    setActiveTabId(newTab.id)
                  }}
                />
              </div>
            ) : activeTab?.type === "view" && activeTab.view === "dashboard" ? (
              <DashboardView 
                clients={clients} 
                onClientSelect={handleClientSelect}
                onAddClient={() => {
                  const newTab: Tab = {
                    id: `add-client-${Date.now()}`,
                    type: "add-client",
                    label: "Nouveau client",
                  }
                  setTabs([...tabs, newTab])
                  setActiveTabId(newTab.id)
                }}
              />
            ) : activeTab?.type === "view" && activeTab.view === "documents" ? (
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-foreground">Documents</h2>
              </div>
            ) : activeTab?.type === "view" && activeTab.view === "settings" ? (
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-foreground">Paramètres</h2>
              </div>
            ) : activeTab?.type === "view" && activeTab.view === "archives" ? (
              <div className="p-6">
                <ClientsTable
                  clients={clients}
                  onClientSelect={handleClientSelect}
                  onClientAdded={loadClients}
                  onAddClientClick={() => {}}
                  showArchived={true}
                />
              </div>
            ) : activeTab?.type === "client" && activeTab.clientId ? (
              (() => {
                const data = clientsData.get(activeTab.clientId)
                if (!data) return <div className="p-6">Chargement...</div>

                return (
                  <ClientTabs
                    client={data.client}
                    taxProfiles={data.taxProfiles}
                    documents={data.documents}
                    onClose={() => handleCloseTab(activeTab.id)}
                    onRefresh={loadClientData}
                    onOpenRevenuePage={handleOpenRevenuePage}
                    onOpenRevenueDetail={() => {}}
                    shouldOpenRevenueModal={shouldOpenRevenueModal}
                    onRevenueModalClose={() => setShouldOpenRevenueModal(false)}
                    onOpen2042View={handleOpen2042View}
                    onOpenAmountEntry={handleOpenAmountEntry}
                    activeTab={activeClientTab}
                    onTabChange={setActiveClientTab}
                    revenueTabs={clientRevenueTabs}
                    onRevenueTabsChange={setClientRevenueTabs}
                    yearTabs={clientYearTabs}
                    onYearTabsChange={setClientYearTabs}
                  />
                )
              })()
            ) : activeTab?.type === "form2042" && activeTab.clientId ? (
              (() => {
                const data = clientsData.get(activeTab.clientId)
                if (!data) return <div className="p-6">Chargement...</div>

                return (
                  <Form2042View
                    clientId={activeTab.clientId}
                    clientName={`${data.client.first_name} ${data.client.last_name}`}
                  />
                )
              })()
            ) : activeTab?.type === "add-client" ? (
              <AddClientPage
                onSuccess={(createdClient) => {
                  loadClients()
                  handleCloseTab(activeTab.id)
                  // Navigate to the created client's dashboard
                  handleClientSelect(createdClient as Client)
                }}
                onCancel={() => handleCloseTab(activeTab.id)}
              />
            ) : activeTab?.type === "onboarding" && activeTab.clientId ? (
              <OnboardingView clientId={activeTab.clientId} />
            ) : null}
          </main>
        </div>
      )}
      <ChatWidget />
    </div>
  )
}
