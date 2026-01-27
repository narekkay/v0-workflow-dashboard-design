import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, body: emailBody } = body

    console.log("[v0] Request body received:", JSON.stringify({ to, subject, body: emailBody }, null, 2))

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    const endpoint = process.env.NEXT_PUBLIC_SEND_EMAIL_ENDPOINT

    if (!endpoint) {
      return NextResponse.json({ error: "Email endpoint not configured" }, { status: 500 })
    }

    const payload = { to, subject, body: emailBody }
    console.log("[v0] Sending to webhook:", endpoint)
    console.log("[v0] Webhook payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Webhook error:", errorText)
      return NextResponse.json({ error: "Failed to send email", details: errorText }, { status: response.status })
    }

    const result = await response.json().catch(() => ({}))
    console.log("[v0] Webhook response:", result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
