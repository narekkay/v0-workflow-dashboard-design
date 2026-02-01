'use server'

import { put, list } from '@vercel/blob'
import { readFile } from 'fs/promises'
import path from 'path'

export async function uploadForm2042PDFFromFile() {
  try {
    // Check if 2042 PDF already exists in Blob
    const { blobs } = await list()
    const existingPDF = blobs.find((blob) => blob.pathname.includes('2042-template.pdf'))

    if (existingPDF) {
      console.log('[v0] 2042 PDF already exists in Blob at:', existingPDF.url)
      return { success: true, url: existingPDF.url, message: 'PDF already uploaded' }
    }

    // Read the PDF file from the project
    const pdfPath = path.join(process.cwd(), 'public', '2042.pdf')
    let fileBuffer: Buffer

    try {
      fileBuffer = await readFile(pdfPath)
    } catch (err) {
      console.log('[v0] PDF not found at public/2042.pdf, trying alternative path')
      // Return message that admin needs to upload manually
      return { 
        success: false, 
        message: 'Please upload the 2042 PDF. Use the upload endpoint or admin panel.',
        uploadUrl: '/api/upload-2042'
      }
    }

    // Upload to Vercel Blob
    const blob = await put('2042-template.pdf', fileBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    })

    console.log('[v0] 2042 PDF uploaded successfully to:', blob.url)
    return { success: true, url: blob.url, message: 'PDF uploaded successfully' }
  } catch (error) {
    console.error('[v0] Error uploading 2042 PDF:', error)
    return { 
      success: false, 
      message: 'Error uploading PDF. Please upload manually.',
      error: String(error)
    }
  }
}
