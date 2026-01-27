"use server"
import { createClient } from "@/lib/supabase/server"

export async function generateAzureUploadUrl(filename: string, fileRequestId: string) {
  const storageAccount = process.env.AZURE_STORAGE_ACCOUNT
  const sasToken = process.env.AZURE_STORAGE_CONTAINER_SAS_TOKEN
  const containerName = "client-uploads"

  if (!storageAccount || !sasToken) {
    throw new Error("Azure Storage configuration missing")
  }

  // Generate unique blob name: {fileRequestId}/{timestamp}-{filename}
  const timestamp = Date.now()
  const blobName = `${fileRequestId}/${timestamp}-${filename}`

  const cleanSasToken = sasToken.startsWith("?") ? sasToken.substring(1) : sasToken
  const uploadUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}?${cleanSasToken}`
  const blobUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}`

  return {
    uploadUrl,
    blobUrl,
    blobName,
  }
}

export async function saveUploadedFile(
  fileRequestId: number,
  documentName: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  fileType: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("uploaded_files")
    .insert({
      file_request_id: fileRequestId,
      document_name: documentName,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      file_type: fileType,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error saving uploaded file:", error)
    throw error
  }

  // Update file_request status to completed
  await supabase.from("file_requests").update({ status: "completed" }).eq("id", fileRequestId)

  return data
}

export async function createFileRequest(
  clientId: string,
  filename: string,
  subCategoryId?: number,
): Promise<{ id: number; uploadUrl: string; blobName: string }> {
  const supabase = await createClient()

  // First create the file request to get an ID
  const { data: fileRequest, error: insertError } = await supabase
    .from("file_requests")
    .insert({
      client_id: clientId,
      filename,
      sub_category_id: subCategoryId,
      upload_link: "pending",
      status: "pending",
    })
    .select()
    .single()

  if (insertError || !fileRequest) {
    console.error("[v0] Error creating file request:", insertError)
    throw insertError
  }

  // Generate Azure upload URL using the file request ID
  const { uploadUrl, blobUrl, blobName } = await generateAzureUploadUrl(filename, fileRequest.id.toString())

  // Update file request with the upload URL and blob URL
  const { error: updateError } = await supabase
    .from("file_requests")
    .update({
      upload_link: uploadUrl,
      blob_url: blobUrl,
    })
    .eq("id", fileRequest.id)

  if (updateError) {
    console.error("[v0] Error updating file request with upload URL:", updateError)
    throw updateError
  }

  return {
    id: fileRequest.id,
    uploadUrl,
    blobName,
  }
}
