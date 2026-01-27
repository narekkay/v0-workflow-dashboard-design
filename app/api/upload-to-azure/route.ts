export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("[v0] Upload API called")

    const body = await request.json()
    const { fileData, fileName, fileType, requestId } = body

    console.log("[v0] File:", fileName, "Request ID:", requestId)

    if (!fileData || !requestId || !fileName) {
      return Response.json({ error: "Missing file data or request ID" }, { status: 400 })
    }

    // Get Azure credentials from environment
    const accountName = process.env.AZURE_STORAGE_ACCOUNT
    const accountKey = process.env.AZURE_STORAGE_KEY
    const containerName = "client-uploads"

    console.log("[v0] Azure account:", accountName)

    if (!accountName || !accountKey) {
      return Response.json({ error: "Azure credentials not configured" }, { status: 500 })
    }

    // Get file request to get the blob name
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: fileRequest, error: dbError } = await supabase
      .from("file_requests")
      .select("filename, client_id")
      .eq("id", requestId)
      .single()

    console.log("[v0] File request:", fileRequest, "Error:", dbError)

    if (dbError || !fileRequest) {
      return Response.json({ error: "File request not found" }, { status: 404 })
    }

    const blobName = `${requestId}-${encodeURIComponent(fileRequest.filename)}`
    console.log("[v0] Blob name:", blobName)

    const buffer = Buffer.from(fileData, "base64")
    const contentLength = buffer.length
    const blobType = fileType || "application/octet-stream"

    // Create the string to sign for Shared Key authentication
    const date = new Date().toUTCString()
    const version = "2021-12-02"

    const stringToSign = `PUT\n\n\n${contentLength}\n\n${blobType}\n\n\n\n\n\n\nx-ms-blob-type:BlockBlob\nx-ms-date:${date}\nx-ms-version:${version}\n/${accountName}/${containerName}/${blobName}`

    const crypto = await import("crypto")
    const signature = crypto
      .createHmac("sha256", Buffer.from(accountKey, "base64"))
      .update(stringToSign, "utf8")
      .digest("base64")

    const authorization = `SharedKey ${accountName}:${signature}`

    // Upload to Azure using REST API
    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`

    console.log("[v0] Uploading to:", uploadUrl)

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "x-ms-date": date,
        "x-ms-version": version,
        "Content-Type": blobType,
        "Content-Length": contentLength.toString(),
        Authorization: authorization,
      },
      body: buffer,
    })

    console.log("[v0] Upload response status:", uploadResponse.status)

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] Azure upload failed:", errorText)
      return Response.json({ error: `Azure upload failed: ${errorText}` }, { status: 500 })
    }

    console.log("[v0] Successfully uploaded blob:", blobName)

    return Response.json({ success: true, blobName })
  } catch (error: any) {
    console.error("[v0] Upload API error:", error.message, error.stack)
    return Response.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}
