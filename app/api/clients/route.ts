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
  console.log('[v0] ========================================')
  console.log('[v0] POST /api/clients - Starting request')
  console.log('[v0] ========================================')
  
  try {
    const body: CreateClientRequest = await request.json()
    console.log('[v0] Request body received:', {
      name: body.name,
      email: body.email,
      fileName: body.fileName,
      pdfBase64Length: body.pdfBase64?.length || 0,
    })
    
    // Validate input
    if (!body.name || !body.email || !body.pdfBase64) {
      console.error('[v0] Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: name, email, pdfBase64' },
        { status: 400 }
      )
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.error('[v0] Validation failed: Invalid email format:', body.email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    console.log('[v0] ✓ Validation passed')
    console.log('[v0] Creating client and sending DocuSign envelope to:', body.email)
    
    // Step 1: Inject DocuSign anchor tag into PDF
    console.log('[v0] ========================================')
    console.log('[v0] STEP 1: Injecting DocuSign anchor tag')
    console.log('[v0] ========================================')
    const modifiedPdfBase64 = await injectDocuSignAnchor(body.pdfBase64)
    console.log('[v0] ✓ Anchor injection complete')
    
    // Step 2: Create and send DocuSign envelope
    console.log('[v0] ========================================')
    console.log('[v0] STEP 2: Creating DocuSign envelope')
    console.log('[v0] ========================================')
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
    
    console.log('[v0] ✓ DocuSign envelope created successfully')
    console.log('[v0] Envelope ID:', envelope.envelopeId)
    console.log('[v0] Envelope status:', envelope.status)
    
    // Generate a unique client ID (in production, you'd save this to database)
    const clientId = `client_${Date.now()}`
    console.log('[v0] Generated client ID:', clientId)
    
    console.log('[v0] ========================================')
    console.log('[v0] SUCCESS: Process completed')
    console.log('[v0] ========================================')
    
    const responseData = {
      clientId,
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      message: 'Client created and DocuSign envelope sent successfully',
    }
    console.log('[v0] Response data:', responseData)
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[v0] ========================================')
    console.error('[v0] ERROR in /api/clients')
    console.error('[v0] ========================================')
    console.error('[v0] Error details:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[v0] Error message:', errorMessage)
    if (errorStack) {
      console.error('[v0] Error stack:', errorStack)
    }
    
    return NextResponse.json(
      { error: 'Failed to create client or send envelope', details: errorMessage },
      { status: 500 }
    )
  }
}
