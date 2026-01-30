export async function generatePdfFromHtml(htmlContent: string, fileName: string): Promise<Blob> {
  // Create a temporary container completely isolated from page styles
  const container = document.createElement('div')
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    width: 210mm;
    padding: 20mm;
    font-family: Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    background-color: #ffffff;
    color: #000000;
    all: initial;
  `
  
  // Wrap content in a styled div to override all inherited styles
  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #000000; background: #ffffff;">
      ${htmlContent}
    </div>
  `
  document.body.appendChild(container)

  try {
    // Dynamically import jsPDF and html2canvas
    const { default: jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    // Convert to blob
    const pdfBlob = pdf.output('blob')
    
    return pdfBlob
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

export async function uploadPdfToBlob(pdfBlob: Blob, fileName: string): Promise<{ url: string; size: number }> {
  const formData = new FormData()
  formData.append('file', pdfBlob, `${fileName}.pdf`)

  const response = await fetch('/api/upload-pdf', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload PDF')
  }

  const data = await response.json()
  return data
}
