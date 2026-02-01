"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Download, Maximize2 } from "lucide-react"
import { Loader2 } from "lucide-react"

// Dynamic import for SSR safety
const PDFViewer = dynamic(() => import("@/components/pdf-viewer").then(mod => ({ default: mod.PDFViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Chargement...</span>
    </div>
  ),
})

interface Form2042ViewProps {
  clientId: string
  clientName: string
}

const PDF_URL = "/documents/2042_5122.pdf"

export function Form2042View({ clientId, clientName }: Form2042ViewProps) {
  const [zoom, setZoom] = useState(100)
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = PDF_URL
    link.download = '2042_5122.pdf'
    link.click()
  }
  const handleFullscreen = () => {
    window.open(PDF_URL, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between pb-4 border-b pt-4 px-6">
        <h1 className="text-3xl font-bold">2042</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
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
      
      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-6 bg-muted/30">
        <PDFViewer pdfUrl={PDF_URL} zoom={zoom} />
      </div>
    </div>
  )
}
