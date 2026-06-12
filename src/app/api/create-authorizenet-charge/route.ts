import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const host = request.headers.get("host") || ""

    const tenantKey = request.cookies.get("x-tenant-api-key")?.value
      || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      || ""

    const res = await fetch(`${BACKEND_URL}/store/clinics/create-authorizenet-charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": tenantKey,
        "x-forwarded-host": host,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
