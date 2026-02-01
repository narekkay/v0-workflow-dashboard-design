"use client"

import { Button } from "@/components/ui/button"
import { Download, Maximize2 } from "lucide-react"

export type FormType = "2042" | "2042C" | "IFU" | "IFI"

interface Form2042ViewProps {
  clientId: string
  clientName: string
  formType?: FormType
}

// PDF URLs for each form type
const PDF_URLS: Record<FormType, { url: string; title: string; filename: string }> = {
  "2042": {
    url: "https://blobs.vusercontent.net/blob/2042_5122-XBUm2kKsL1pGe15lIttvZ1M05Xs6sS.pdf",
    title: "2042",
    filename: "2042.pdf"
  },
  "2042C": {
    url: "https://blobs.vusercontent.net/blob/formulaire%202042%20C-W2LtISHq9crX6CnFGz0MywbisJZUm3.pdf",
    title: "2042 C",
    filename: "2042_C.pdf"
  },
  "IFU": {
    url: "https://blobs.vusercontent.net/blob/formulaire%20IFU-OyburGxBbNyt9jx6jkBjkjBiR8WozS.pdf",
    title: "IFU",
    filename: "IFU.pdf"
  },
  "IFI": {
    url: "https://blobs.vusercontent.net/blob/formulaire%20IFI-XmYISc6D9nO5cHiZEOsZ9XLHCNiFvp.pdf",
    title: "IFI",
    filename: "IFI.pdf"
  }
}

export function Form2042View({ clientId, clientName, formType = "2042" }: Form2042ViewProps) {
  const pdfConfig = PDF_URLS[formType]
  
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfConfig.url
    link.download = pdfConfig.filename
    link.click()
  }
  const handleFullscreen = () => {
    window.open(pdfConfig.url, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between pb-4 border-b pt-4 px-6">
        <h1 className="text-3xl font-bold">{pdfConfig.title}</h1>
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
          src={pdfConfig.url}
          className="w-full h-full min-h-[800px] border-0 rounded-lg shadow-lg bg-white"
          title={`Formulaire ${pdfConfig.title}`}
        />
      </div>
    </div>
  )
}
