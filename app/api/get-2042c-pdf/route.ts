import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // List all blobs and find the 2042 C form
    const { blobs } = await list({
      prefix: 'forms/2042-c',
    })

    if (blobs.length === 0) {
      return NextResponse.json({ error: '2042 C PDF not found' }, { status: 404 })
    }

    // Return the most recent one (sorted by uploadedAt)
    const latestBlob = blobs.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]

    return NextResponse.json({
      url: latestBlob.url,
      filename: '2042-c.pdf',
    })
  } catch (error) {
    console.error('[v0] Get 2042 C PDF error:', error)
    return NextResponse.json({ error: 'Failed to get PDF' }, { status: 500 })
  }
}
