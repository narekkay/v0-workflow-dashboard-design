'use client'

export async function generateAndUploadConventionPdf(
  htmlContent: string,
  fileName: string
): Promise<{ url: string; size: number }> {
  const response = await fetch('/api/generate-convention-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      htmlContent,
      fileName,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate PDF')
  }

  return response.json()
}
