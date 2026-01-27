"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareSpaceDialogProps {
  clientId: string
  clientName: string
}

export function ShareSpaceDialog({ clientId, clientName }: ShareSpaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const shareableLink = `${typeof window !== "undefined" ? window.location.origin : ""}/share/documents/${clientId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Share2 className="h-4 w-4" />
          Partager l'espace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager l'espace documentaire</DialogTitle>
          <DialogDescription>
            Partagez ce lien avec {clientName} pour qu'il puisse déposer ses documents.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Input value={shareableLink} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant="outline" className="shrink-0 bg-transparent">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ce lien permet au client de visualiser et déposer des documents de manière sécurisée.
        </p>
      </DialogContent>
    </Dialog>
  )
}
