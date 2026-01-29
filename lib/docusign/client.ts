interface DocuSignConfig {
  integrationKey: string
  userId: string
  accountId: string
  privateKey: string
  basePath: string
}

interface Signer {
  name: string
  email: string
  recipientId: string
  routingOrder: string
}

interface CreateEnvelopeParams {
  pdfBase64: string
  fileName: string
  signer: Signer
}

interface EnvelopeResponse {
  envelopeId: string
  status: string
  uri: string
}

/**
 * Gets DocuSign configuration from environment variables
 */
function getDocuSignConfig(): DocuSignConfig {
  const config = {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
    userId: process.env.DOCUSIGN_USER_ID || '',
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
    privateKey: (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
  }

  if (!config.integrationKey || !config.userId || !config.accountId) {
    throw new Error('Missing required DocuSign environment variables')
  }

  return config
}

/**
 * Gets an OAuth access token using JWT
 * In production, you should cache this token and refresh when needed
 */
async function getAccessToken(): Promise<string> {
  const config = getDocuSignConfig()
  
  // For simplicity, we'll use a simple OAuth flow
  // In production, implement JWT OAuth or use the docusign-esign SDK
  
  // If you have a pre-generated access token, use it directly:
  const accessToken = process.env.DOCUSIGN_ACCESS_TOKEN
  
  if (!accessToken) {
    throw new Error('DOCUSIGN_ACCESS_TOKEN is required. Please generate one from your DocuSign account.')
  }
  
  return accessToken
}

/**
 * Creates and sends a DocuSign envelope with a single signer
 */
export async function createAndSendEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResponse> {
  const config = getDocuSignConfig()
  const accessToken = await getAccessToken()
  
  const { pdfBase64, fileName, signer } = params
  
  // Construct the envelope definition
  const envelopeDefinition = {
    emailSubject: `Veuillez signer: ${fileName}`,
    status: 'sent', // Send immediately
    documents: [
      {
        documentBase64: pdfBase64,
        documentId: '1',
        fileExtension: 'pdf',
        name: fileName,
      },
    ],
    recipients: {
      signers: [
        {
          email: signer.email,
          name: signer.name,
          recipientId: signer.recipientId,
          routingOrder: signer.routingOrder,
          tabs: {
            signHereTabs: [
              {
                anchorString: '<<SIG_CLIENT>>',
                anchorUnits: 'pixels',
                anchorXOffset: '0',
                anchorYOffset: '0',
                pageNumber: '1',
              },
            ],
          },
        },
      ],
    },
  }
  
  // Make the API request
  const url = `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DocuSign] API Error:', errorText)
      throw new Error(`DocuSign API error: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      envelopeId: result.envelopeId,
      status: result.status,
      uri: result.uri || '',
    }
  } catch (error) {
    console.error('[DocuSign] Error creating envelope:', error)
    throw new Error('Failed to create DocuSign envelope')
  }
}

/**
 * Gets the status of an envelope
 */
export async function getEnvelopeStatus(envelopeId: string): Promise<any> {
  const config = getDocuSignConfig()
  const accessToken = await getAccessToken()
  
  const url = `${config.basePath}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get envelope status: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[DocuSign] Error getting envelope status:', error)
    throw error
  }
}
