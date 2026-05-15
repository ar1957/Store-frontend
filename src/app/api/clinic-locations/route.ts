/**
 * GET /api/clinic-locations
 * Fetches active locations for the current clinic
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(req: NextRequest) {
  try {
    const tenantKey = req.cookies.get("x-tenant-api-key")?.value
      || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      || ""

    const res = await fetch(`${BACKEND_URL}/store/clinics/locations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": tenantKey,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json(err, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
