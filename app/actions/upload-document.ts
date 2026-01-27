"use server"

import { put } from "@vercel/blob"

export async function uploadDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File
    
    if (!file) {
      return { success: false, error: "Aucun fichier fourni" }
    }

    // Validate file type
    if (!file.type.includes("pdf")) {
      return { success: false, error: "Seuls les fichiers PDF sont acceptés" }
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "La taille maximale est de 10 Mo" }
    }

    // Upload to Vercel Blob - token is secure on server
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return {
      success: true,
      data: {
        name: file.name,
        size: file.size,
        url: blob.url,
        type: file.type,
      },
    }
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur d'upload",
    }
  }
}
