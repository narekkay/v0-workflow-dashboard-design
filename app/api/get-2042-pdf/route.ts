import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { blobs } = await list()

    // Find the 2042 template PDF
    const pdf2042 = blobs.find((blob) => blob.pathname.includes('2042-template.pdf'))

    if (!pdf2042) {
      return NextResponse.json(
        { error: 'PDF 2042 not found. Please upload it first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      url: pdf2042.url,
      filename: '2042-template.pdf',
      size: pdf2042.size,
    })
  } catch (error) {
    console.error('[v0] Error fetching 2042 PDF:', error)
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
  }
}
