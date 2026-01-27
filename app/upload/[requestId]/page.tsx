"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { saveUploadedFile } from "@/app/actions/azure-upload"
import { Progress } from "@/components/ui/progress"

type UploadStatus = "pending" | "uploading" | "success" | "error"

export default function UploadPage() {
  const params = useParams()
  const requestId = params.requestId as string
  const [fileRequest, setFileRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<UploadStatus>("pending")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)

  useEffect(() => {
    loadFileRequest()
  }, [requestId])

  async function loadFileRequest() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("file_requests")
        .select("*, clients(first_name, last_name)")
        .eq("id", requestId)
        .single()

      if (error) throw error

      // Check if already completed
      if (data.status === "completed") {
        setStatus("success")
        setUploadedFileUrl(data.blob_url)
      }

      setFileRequest(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setStatus("pending")
      setProgress(0)
    }
  }

  async function handleUpload() {
    if (!selectedFile || !fileRequest) return

    console.log("[v0] Starting upload for file:", selectedFile.name)
    setStatus("uploading")
    setProgress(0)
    setError(null)

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Monitor upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setProgress(percentComplete)
        }
      })

      // Handle successful upload
      xhr.addEventListener("load", async () => {
        console.log("[v0] Upload response status:", xhr.status)

        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("[v0] Upload successful, saving to database...")

          try {
            // Save to database
            await saveUploadedFile(
              Number.parseInt(requestId),
              fileRequest.filename,
              selectedFile.name,
              fileRequest.blob_url, // URL without SAS token
              selectedFile.size,
              selectedFile.type,
            )

            setUploadedFileUrl(fileRequest.blob_url)
            setStatus("success")
            resolve()
          } catch (err: any) {
            console.error("[v0] Database save error:", err)
            setError("Upload réussi mais échec de l'enregistrement. Veuillez contacter le support.")
            setStatus("error")
            reject(err)
          }
        } else {
          const errorText = xhr.responseText
          console.error("[v0] Upload failed:", xhr.status, errorText)
          setError(`Erreur d'upload (${xhr.status}): ${errorText}`)
          setStatus("error")
          reject(new Error(errorText))
        }
      })

      // Handle network error
      xhr.addEventListener("error", () => {
        console.error("[v0] Network error during upload")
        setError("Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.")
        setStatus("error")
        reject(new Error("Network error"))
      })

      // Handle timeout
      xhr.addEventListener("timeout", () => {
        console.error("[v0] Upload timeout")
        setError("Le téléchargement a expiré. Veuillez réessayer avec une connexion plus stable.")
        setStatus("error")
        reject(new Error("Timeout"))
      })

      xhr.open("PUT", "/api/proxy-upload")
      xhr.setRequestHeader("x-upload-url", fileRequest.upload_link)
      xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream")
      xhr.timeout = 300000 // 5 minutes timeout

      console.log("[v0] Sending file through proxy...")
      xhr.send(selectedFile)
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !fileRequest) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Upload réussi
            </CardTitle>
            <CardDescription>Votre fichier a été téléchargé avec succès.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900">✓ Fichier uploadé</p>
              <p className="text-xs text-green-700 mt-1">{selectedFile?.name || fileRequest.filename}</p>
              <p className="text-xs text-green-600 mt-2">Statut: Complété</p>
            </div>

            {uploadedFileUrl && (
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Lien de consultation:</p>
                <a
                  href={uploadedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {uploadedFileUrl}
                </a>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Merci d'avoir soumis votre document. Vous pouvez fermer cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload de document</CardTitle>
          <CardDescription>
            Client: {fileRequest?.clients?.first_name} {fileRequest?.clients?.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Document demandé:</p>
            <p className="text-sm text-blue-700">{fileRequest?.filename}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionnez votre fichier</label>
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={status === "uploading"}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {selectedFile && status === "pending" && (
            <div className="rounded-md bg-gray-100 p-3 border border-gray-200">
              <p className="text-sm font-medium">Fichier sélectionné:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {status === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Upload en cours...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}

          {status === "error" ? (
            <Button onClick={handleUpload} disabled={!selectedFile} className="w-full bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || status === "uploading"}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Uploader le fichier
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
