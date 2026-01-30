"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingProgressProps {
  conventionSent: boolean
  conventionSigned: boolean
  formPending: boolean
  formCompleted: boolean
}

interface Step {
  label: string
  completed: boolean
}

export function OnboardingProgress({
  conventionSent,
  conventionSigned,
  formPending,
  formCompleted,
}: OnboardingProgressProps) {
  const steps: Step[] = [
    { label: "Convention envoyée", completed: conventionSent },
    { label: "Convention signée", completed: conventionSigned },
    { label: "Formulaire d'onboarding en attente", completed: formPending },
    { label: "Formulaire d'onboarding rempli", completed: formCompleted },
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-full h-24 rounded-lg border-2 flex items-center justify-center transition-all",
                step.completed
                  ? "bg-green-50 border-green-500"
                  : "bg-muted border-border"
              )}
            >
              {step.completed ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <p
              className={cn(
                "text-sm text-center font-medium",
                step.completed ? "text-green-700" : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
