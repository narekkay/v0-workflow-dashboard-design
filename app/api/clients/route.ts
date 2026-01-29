import { NextRequest, NextResponse } from 'next/server'
import { injectDocuSignAnchor } from '@/lib/pdf/anchor'
import { createAndSendEnvelope } from '@/lib/docusign/client'

interface CreateClientRequest {
  name: string
  email: string
  pdfBase64: string
  fileName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateClientRequest = await request.json()
    
    // Validate input
    if (!body.name || !body.email || !body.pdfBase64) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, pdfBase64' },
        { status: 400 }
      )
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    console.log('[v0] Creating client and sending DocuSign envelope to:', body.email)
    
    // Step 1: Inject DocuSign anchor tag into PDF
    console.log('[v0] Step 1: Injecting DocuSign anchor tag...')
    const modifiedPdfBase64 = await injectDocuSignAnchor(body.pdfBase64)
    
    // Step 2: Create and send DocuSign envelope
    console.log('[v0] Step 2: Creating DocuSign envelope...')
    const envelope = await createAndSendEnvelope({
      pdfBase64: modifiedPdfBase64,
      fileName: body.fileName || 'Convention à signer',
      signer: {
        name: body.name,
        email: body.email,
        recipientId: '1',
        routingOrder: '1',
      },
    })
    
    console.log('[v0] DocuSign envelope created:', envelope.envelopeId)
    
    // Generate a unique client ID (in production, you'd save this to database)
    const clientId = `client_${Date.now()}`
    
    return NextResponse.json({
      clientId,
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      message: 'Client created and DocuSign envelope sent successfully',
    })
  } catch (error) {
    console.error('[v0] Error in /api/clients:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to create client or send envelope', details: errorMessage },
      { status: 500 }
    )
  }
}
