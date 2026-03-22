/**
 * GET /api/eligibility-states?domain=...
 * Server-side proxy to avoid CORS issues.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain") || ""
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY

  if (!domain) return NextResponse.json({ locations: [] })

  try {
    const res = await fetch(
      `${BACKEND}/store/eligibility/states?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          "x-publishable-api-key": pubKey,
          "x-forwarded-host": domain,
        },
        cache: "no-store",
      }
    )
    const data = await res.json()
    if (!res.ok) {
      console.error("[eligibility-states proxy] backend error:", res.status, data)
    }
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch (err) {
    console.error("[eligibility-states proxy] error:", err)
    return NextResponse.json({ locations: [], message: String(err) }, { status: 500 })
  }
}
