"use client"

import { useState, useEffect } from "react"
import { Download, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PDF2042ViewerProps {
  clientId: string
  clientName: string
}

export function PDF2042Viewer({ clientId, clientName }: PDF2042ViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPDFUrl()
  }, [])

  async function fetchPDFUrl() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/get-2042-pdf')
      
      if (!response.ok) {
        throw new Error('Failed to fetch 2042 PDF')
      }
      
      const data = await response.json()
      setPdfUrl(data.url)
    } catch (err) {
      console.error('[v0] Error fetching PDF:', err)
      setError('Impossible de charger le formulaire 2042. Veuillez contacter le support.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!pdfUrl) return
    
    try {
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `2042-${clientName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[v0] Error downloading PDF:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du formulaire 2042...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={fetchPDFUrl} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Le formulaire 2042 n'a pas encore été uploadé.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-3xl font-bold">2042 - Formulaire de déclaration</h1>
        <Button 
          onClick={handleDownload} 
          className="gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        <div className="mx-auto max-w-4xl bg-white shadow-lg rounded">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full"
            style={{ minHeight: '800px' }}
            title="Formulaire 2042"
          />
        </div>
      </div>
    </div>
  )
}
