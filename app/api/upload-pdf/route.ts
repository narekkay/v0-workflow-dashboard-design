import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const blob = await put(file.name, file, {
      access: "public",
      contentType: "application/pdf",
    })

    return NextResponse.json({
      url: blob.url,
      size: blob.size,
    })
  } catch (error) {
    console.error("[v0] PDF upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload PDF" },
      { status: 500 }
    )
  }
}
