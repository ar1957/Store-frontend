import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const host = request.headers.get("host") || ""
    const xForwardedHost = request.headers.get("x-forwarded-host") || ""

    // Use domain from body first (sent by client with __TENANT_DOMAIN__)
    // Fall back to x-forwarded-host (set by nginx on EB), then host
    const domain = body.domain || xForwardedHost.split(":")[0] || host.split(":")[0]

    console.log("[create-payment-intent] body.domain:", body.domain, "x-forwarded-host:", xForwardedHost, "host:", host, "resolved domain:", domain)

    if (!domain) {
      return NextResponse.json({ error: "Could not determine clinic domain" }, { status: 400 })
    }

    const tenantKey = request.cookies.get("x-tenant-api-key")?.value
      || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      || ""

    const res = await fetch(`${BACKEND_URL}/store/clinics/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": tenantKey,
        "x-forwarded-host": host,
      },
      body: JSON.stringify({
        domain,
        amount: body.amount,
        currency: body.currency || "usd",
        cartId: body.cartId,
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[create-payment-intent] Backend error:", res.status, text)
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    console.log("[create-payment-intent] Success:", data.paymentIntentId)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("[create-payment-intent proxy] Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
