import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:8000"
  const tenantKey = request.cookies.get("x-tenant-api-key")?.value
    || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    || ""

  try {
    const body = await request.json()
    const xForwardedHost = request.headers.get("x-forwarded-host") || ""
    const domain = body.domain || xForwardedHost.split(":")[0] || host.split(":")[0]

    const res = await fetch(`${BACKEND_URL}/store/clinics/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host,
        "x-forwarded-host": host,
        "x-publishable-api-key": tenantKey,
      },
      body: JSON.stringify({ ...body, domain }),
      cache: "no-store",
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ message: "Failed to create payment intent" }, { status: 500 })
  }
}
