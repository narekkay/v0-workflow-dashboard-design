"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { OnboardingProgress } from "./onboarding-progress"
import type { Client } from "@/lib/types"

interface OnboardingViewProps {
  clientId: string
}

export function OnboardingView({ clientId }: OnboardingViewProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClient() {
      const supabase = createClient()
      // Force cache bypass by adding timestamp to headers
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error loading client for onboarding:", error)
      } else if (data) {
        console.log("[v0] Fresh client data loaded:", {
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          convention_sent: data.convention_sent,
          convention_signed: data.convention_signed,
          onboarding_form_pending: data.onboarding_form_pending,
          onboarding_form_completed: data.onboarding_form_completed,
        })
        setClient(data)
      }
      setLoading(false)
    }

    loadClient()
  }, [clientId])

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!client) {
    return <div className="p-6">Client introuvable</div>
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          Onboarding {client.first_name} {client.last_name}
        </h2>
        <p className="text-muted-foreground">
          Suivez la progression de l'onboarding du client
        </p>
      </div>
      
      <OnboardingProgress
        conventionSent={client.convention_sent ?? false}
        conventionSigned={client.convention_signed ?? false}
        formPending={client.onboarding_form_pending ?? false}
        formCompleted={client.onboarding_form_completed ?? false}
      />
      
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-2">Actions disponibles</h3>
        <p className="text-sm text-muted-foreground">
          Contenu de gestion d'onboarding à venir
        </p>
      </div>
    </div>
  )
}
