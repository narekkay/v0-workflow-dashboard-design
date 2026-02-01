"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react"
import { uploadForm2042PDFFromFile } from "@/app/actions/upload-2042-action"

export function Form2042Settings() {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  async function handleUploadPDF() {
    setUploading(true)
    setStatus({ type: null, message: '' })

    try {
      const result = await uploadForm2042PDFFromFile()

      if (result.success) {
        setStatus({
          type: 'success',
          message: `✓ ${result.message} - URL: ${result.url}`
        })
      } else {
        setStatus({
          type: 'error',
          message: result.message || 'Failed to upload PDF'
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Erreur: ${String(error)}`
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion du formulaire 2042</CardTitle>
        <CardDescription>Upload et configuration du formulaire de déclaration 2042</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Formulaire 2042 PDF</h3>
          <p className="text-sm text-muted-foreground">
            Le formulaire 2042 sera affiché en visionneuse PDF dans la section "Déclarations"
          </p>
        </div>

        {status.type && (
          <Alert variant={status.type === 'success' ? 'default' : 'destructive'}>
            {status.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleUploadPDF} 
          disabled={uploading}
          className="gap-2 w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Uploader le formulaire 2042
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>• Le PDF sera stocké sur Vercel Blob (gratuit, sécurisé)</p>
          <p>• Tous les utilisateurs verront le même formulaire 2042</p>
          <p>• L'URL publique du PDF sera réutilisée si déjà uploadée</p>
        </div>
      </CardContent>
    </Card>
  )
}
