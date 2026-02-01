"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react"
import { uploadForm2042PDFFromFile } from "@/app/actions/upload-2042-action"

export function Form2042Settings() {
  const [uploading2042, setUploading2042] = useState(false)
  const [uploading2042C, setUploading2042C] = useState(false)
  const [status2042, setStatus2042] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [status2042C, setStatus2042C] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  async function handleUpload2042() {
    setUploading2042(true)
    setStatus2042({ type: null, message: '' })

    try {
      const result = await uploadForm2042PDFFromFile()

      if (result.success) {
        setStatus2042({
          type: 'success',
          message: `✓ ${result.message} - URL: ${result.url}`
        })
      } else {
        setStatus2042({
          type: 'error',
          message: result.message || 'Failed to upload PDF'
        })
      }
    } catch (error) {
      setStatus2042({
        type: 'error',
        message: `Erreur: ${String(error)}`
      })
    } finally {
      setUploading2042(false)
    }
  }

  async function handleUpload2042C() {
    setUploading2042C(true)
    setStatus2042C({ type: null, message: '' })

    try {
      // Read the 2042-c.pdf from public folder
      const response = await fetch('/2042-c.pdf')
      const blob = await response.blob()
      const file = new File([blob], '2042-c.pdf', { type: 'application/pdf' })

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload-2042c', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload 2042 C')
      }

      const result = await uploadResponse.json()
      setStatus2042C({
        type: 'success',
        message: `✓ Formulaire 2042 C uploadé avec succès - URL: ${result.url}`
      })
    } catch (error) {
      setStatus2042C({
        type: 'error',
        message: `Erreur: ${String(error)}`
      })
    } finally {
      setUploading2042C(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 2042 Card */}
      <Card>
        <CardHeader>
          <CardTitle>Formulaire 2042</CardTitle>
          <CardDescription>Déclaration principale des revenus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Formulaire 2042 PDF</h3>
            <p className="text-sm text-muted-foreground">
              Le formulaire 2042 sera affiché en visionneuse PDF dans la section "Déclarations"
            </p>
          </div>

          {status2042.type && (
            <Alert variant={status2042.type === 'success' ? 'default' : 'destructive'}>
              {status2042.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{status2042.message}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload2042} 
            disabled={uploading2042}
            className="gap-2 w-full"
          >
            {uploading2042 ? (
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
            <p>• Stocké sur Vercel Blob (gratuit, sécurisé)</p>
            <p>• Visible par tous les utilisateurs</p>
          </div>
        </CardContent>
      </Card>

      {/* 2042 C Card */}
      <Card>
        <CardHeader>
          <CardTitle>Formulaire 2042 C</CardTitle>
          <CardDescription>Déclaration complémentaire des revenus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Formulaire 2042 C PDF</h3>
            <p className="text-sm text-muted-foreground">
              Le formulaire 2042 C sera affiché en visionneuse PDF dans la section "Déclarations"
            </p>
          </div>

          {status2042C.type && (
            <Alert variant={status2042C.type === 'success' ? 'default' : 'destructive'}>
              {status2042C.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{status2042C.message}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload2042C} 
            disabled={uploading2042C}
            className="gap-2 w-full"
          >
            {uploading2042C ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Uploader le formulaire 2042 C
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>• Stocké sur Vercel Blob (gratuit, sécurisé)</p>
            <p>• Visible par tous les utilisateurs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
