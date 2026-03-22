/**
 * GET /api/eligibility-check?domain=...&productId=...
 * Server-side proxy to avoid CORS issues with direct browser→backend calls.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const domain = searchParams.get("domain") || ""
  const productId = searchParams.get("productId") || ""
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY

  if (!domain || !productId) {
    return NextResponse.json({ requiresEligibility: false })
  }

  try {
    const url = `${BACKEND}/store/eligibility/check?domain=${encodeURIComponent(domain)}&productId=${encodeURIComponent(productId)}`
    const res = await fetch(url, {
      headers: {
        "x-publishable-api-key": pubKey,
        "x-forwarded-host": domain,
      },
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[eligibility-check proxy] error:", err)
    return NextResponse.json({ requiresEligibility: false })
  }
}
