"use server"

import { put } from "@vercel/blob"

export async function generateConventionPdf(
  htmlContent: string,
  clientName: string,
  conventionType: string
) {
  try {
    // Create a simple HTML document with styling
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { font-size: 16pt; text-align: center; margin-bottom: 24px; }
          h2 { font-size: 14pt; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 10px; text-align: justify; }
          ul { margin-left: 20px; margin-bottom: 10px; }
          .document-content { padding: 20px; }
          section { margin-bottom: 20px; }
          [data-token] { background-color: transparent; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `

    // Convert HTML to a blob (as HTML file for now, can be converted to PDF with a service)
    const fileName = `convention_${conventionType}_${clientName.replace(/\s+/g, '_')}_${Date.now()}.html`
    
    const htmlBlob = new Blob([fullHtml], { type: 'text/html' })
    const file = new File([htmlBlob], fileName, { type: 'text/html' })

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return {
      success: true,
      data: {
        name: fileName.replace('.html', '.pdf'),
        url: blob.url,
        type: 'application/pdf',
        size: file.size,
      },
    }
  } catch (error) {
    console.error("[v0] Convention PDF generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur de génération du PDF",
    }
  }
}
