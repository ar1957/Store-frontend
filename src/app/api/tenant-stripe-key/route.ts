import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:8000"

  // Use the tenant API key from cookie (set by middleware) — falls back to default
  const tenantKey = request.cookies.get("x-tenant-api-key")?.value
    || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    || ""

  try {
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      headers: {
        host,
        "x-forwarded-host": host,
        "x-publishable-api-key": tenantKey,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ stripeKey: null, paypalClientId: null, paymentProvider: "stripe" })
    }

    const data = await res.json()
    const tenant = data?.tenant
    return NextResponse.json({
      stripeKey: tenant?.stripe_publishable_key || null,
      paypalClientId: tenant?.paypal_client_id || null,
      paypalMode: tenant?.paypal_mode || "sandbox",
      paymentProvider: tenant?.payment_provider || "stripe",
    })
  } catch {
    return NextResponse.json({ stripeKey: null, paypalClientId: null, paymentProvider: "stripe" })
  }
}
