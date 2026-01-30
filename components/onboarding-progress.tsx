"use client"

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
  number: number
}

export function OnboardingProgress({
  conventionSent,
  conventionSigned,
  formPending,
  formCompleted,
}: OnboardingProgressProps) {
  console.log("[v0] OnboardingProgress props:", {
    conventionSent,
    conventionSigned,
    formPending,
    formCompleted,
  })

  const steps: Step[] = [
    { label: "Convention envoyée", completed: conventionSent, number: 1 },
    { label: "Convention signée", completed: conventionSigned, number: 2 },
    { label: "Formulaire d'onboarding en attente", completed: formPending, number: 3 },
    { label: "Formulaire d'onboarding rempli", completed: formCompleted, number: 4 },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" style={{ margin: '0 10%' }} />
        
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-3" style={{ flex: 1 }}>
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold transition-all z-10",
                  step.completed
                    ? "bg-green-600 text-white"
                    : "bg-background border-2 border-border text-muted-foreground"
                )}
              >
                {step.number}
              </div>
              <p
                className={cn(
                  "text-sm text-center font-medium max-w-[120px]",
                  step.completed ? "text-green-700" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
