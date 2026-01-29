import { PDFDocument, rgb } from 'pdf-lib'

/**
 * Injects a DocuSign anchor tag at the bottom-right corner of page 1 of a PDF
 * @param pdfBase64 - Base64 encoded PDF string
 * @returns Modified PDF as base64 string
 */
export async function injectDocuSignAnchor(pdfBase64: string): Promise<string> {
  try {
    // Load the PDF
    const pdfBytes = Buffer.from(pdfBase64, 'base64')
    const pdfDoc = await PDFDocument.load(pdfBytes)
    
    const pages = pdfDoc.getPages()
    if (pages.length === 0) {
      throw new Error('PDF has no pages')
    }
    
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    
    // Anchor text for DocuSign
    const anchorText = '<<SIG_CLIENT>>'
    
    // Position: bottom-right corner with 24pt margins
    // pdf-lib coordinates start at bottom-left
    const x = width - 24
    const y = 24
    
    // Draw the anchor text (invisible: 2pt size, white color)
    firstPage.drawText(anchorText, {
      x,
      y,
      size: 2,
      color: rgb(1, 1, 1), // White color
    })
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    return Buffer.from(modifiedPdfBytes).toString('base64')
  } catch (error) {
    console.error('[DocuSign] Error injecting anchor:', error)
    throw new Error('Failed to inject DocuSign anchor into PDF')
  }
}
