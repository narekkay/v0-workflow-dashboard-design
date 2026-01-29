import { PDFDocument, rgb } from 'pdf-lib'

/**
 * Injects a DocuSign anchor tag at the bottom-right corner of page 1 of a PDF
 * @param pdfBase64 - Base64 encoded PDF string
 * @returns Modified PDF as base64 string
 */
export async function injectDocuSignAnchor(pdfBase64: string): Promise<string> {
  try {
    console.log('[v0] Starting PDF anchor injection...')
    console.log('[v0] PDF base64 length:', pdfBase64.length)
    
    // Load the PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64')
    console.log('[v0] PDF bytes loaded:', pdfBytes.length, 'bytes')
    
    const pdfDoc = await PDFDocument.load(pdfBytes)
    console.log('[v0] PDF document loaded successfully')
    
    const pages = pdfDoc.getPages()
    console.log('[v0] PDF has', pages.length, 'page(s)')
    
    if (pages.length === 0) {
      throw new Error('PDF has no pages')
    }
    
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    console.log('[v0] First page dimensions:', { width, height })
    
    // Anchor text for DocuSign
    const anchorText = '<<SIG_CLIENT>>'
    
    // Position: bottom-right corner with 24pt margins
    // pdf-lib coordinates start at bottom-left
    const x = width - 24
    const y = 24
    console.log('[v0] Anchor position:', { x, y })
    
    // Draw the anchor text (invisible: 2pt size, white color)
    firstPage.drawText(anchorText, {
      x,
      y,
      size: 2,
      color: rgb(1, 1, 1), // White color
    })
    console.log('[v0] Anchor text drawn:', anchorText)
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    const modifiedBase64 = Buffer.from(modifiedPdfBytes).toString('base64')
    console.log('[v0] Modified PDF saved, new length:', modifiedBase64.length)
    
    return modifiedBase64
  } catch (error) {
    console.error('[v0] Error injecting anchor:', error)
    throw new Error('Failed to inject DocuSign anchor into PDF')
  }
}
