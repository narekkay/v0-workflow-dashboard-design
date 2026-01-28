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

    // Create a complete HTML document with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            h2 {
              color: #555;
              margin-top: 30px;
            }
            section {
              margin-bottom: 30px;
            }
            @media print {
              body {
                margin: 0;
                padding: 20mm;
              }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `

    // Upload HTML as blob (we'll display it as text in the modal)
    const blob = await put(`${fileName}.html`, fullHtml, {
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
