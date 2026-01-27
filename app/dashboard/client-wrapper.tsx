"use client"

import { useRouter } from "next/navigation"
import { ClientsTable } from "@/components/clients-table"
import type { Client } from "@/lib/types"

interface ClientWrapperProps {
  initialClients: Client[]
}

export function ClientWrapper({ initialClients }: ClientWrapperProps) {
  const router = useRouter()

  return <ClientsTable clients={initialClients} onClientAdded={() => router.refresh()} />
}
