"use client"

import { Button } from "@/components/ui/button"
import { Download, Maximize2 } from "lucide-react"

interface Form2042CViewProps {
  clientId: string
  clientName: string
}

// Using external Vercel Blob URL - local /public files don't work reliably in v0 runtime
const PDF_URL = "https://blobs.vusercontent.net/blob/formulaire%202042%20C-W2LtISHq9crX6CnFGz0MywbisJZUm3.pdf"

export function Form2042CView({ clientId, clientName }: Form2042CViewProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = PDF_URL
    link.download = 'formulaire_2042_C.pdf'
    link.click()
  }
  const handleFullscreen = () => {
    window.open(PDF_URL, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between pb-4 border-b pt-4 px-6">
        <h1 className="text-3xl font-bold">2042 C</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Telecharger
          </Button>
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Plein ecran
          </Button>
        </div>
      </div>
      
      {/* PDF Viewer - using iframe with native browser PDF viewer */}
      <div className="flex-1 p-6 bg-muted/30">
        <iframe
          src={PDF_URL}
          className="w-full h-full min-h-[800px] border-0 rounded-lg shadow-lg bg-white"
          title="Formulaire 2042 C"
        />
      </div>
    </div>
  )
}
