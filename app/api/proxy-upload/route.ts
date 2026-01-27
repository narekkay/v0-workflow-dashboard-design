import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function PUT(request: NextRequest) {
  try {
    const uploadUrl = request.headers.get("x-upload-url")

    if (!uploadUrl) {
      return NextResponse.json({ error: "Missing upload URL" }, { status: 400 })
    }

    // Get the file data from request body
    const fileBuffer = await request.arrayBuffer()

    // Upload to Azure on behalf of the client (bypassing CORS)
    const azureResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": request.headers.get("content-type") || "application/octet-stream",
        "Content-Length": fileBuffer.byteLength.toString(),
      },
      body: fileBuffer,
    })

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text()
      console.error("[v0] Azure upload failed:", azureResponse.status, errorText)
      return NextResponse.json(
        { error: `Azure upload failed: ${azureResponse.status}` },
        { status: azureResponse.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Proxy upload error:", error)
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
