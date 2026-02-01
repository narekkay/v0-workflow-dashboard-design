import { put, list } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Vercel Blob with a specific filename
    const blob = await put('forms/2042-c.pdf', file, {
      access: 'public',
    })

    return NextResponse.json({
      url: blob.url,
      filename: '2042-c.pdf',
    })
  } catch (error) {
    console.error('[v0] Upload 2042 C error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
