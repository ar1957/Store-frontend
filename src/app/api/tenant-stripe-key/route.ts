import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:8000"

  try {
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      headers: {
        host,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ stripeKey: null })
    }

    const data = await res.json()
    const stripeKey = data?.tenant?.stripe_publishable_key || null
    return NextResponse.json({ stripeKey })
  } catch {
    return NextResponse.json({ stripeKey: null })
  }
}
