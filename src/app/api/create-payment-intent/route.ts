import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const host = request.headers.get("host") || ""
    const xForwardedHost = request.headers.get("x-forwarded-host") || ""

    // Use x-forwarded-host (real clinic domain) if available, otherwise host
    // Also accept domain from body as override (sent by client with __TENANT_DOMAIN__)
    const domain = body.domain || xForwardedHost.split(":")[0] || host.split(":")[0]

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
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("[create-payment-intent proxy] Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
