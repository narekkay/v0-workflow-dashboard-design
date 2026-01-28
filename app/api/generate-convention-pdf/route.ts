import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, fileName } = await request.json()

    if (!htmlContent || !fileName) {
      return NextResponse.json(
        { error: "HTML content and fileName are required" },
        { status: 400 }
      )
    }

    // Save only the HTML content without wrapper (styles applied in modal/PDF generation)
    const blob = await put(`${fileName}.html`, htmlContent, {
      access: "public",
      contentType: "text/html",
    })

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        size: blob.size,
      },
    })
  } catch (error) {
    console.error("[v0] PDF generation error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate PDF" 
      },
      { status: 500 }
    )
  }
}
