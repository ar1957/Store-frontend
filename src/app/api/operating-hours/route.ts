/**
 * GET /api/operating-hours
 * Proxies to the Medusa backend /store/operating-hours, which picks the correct
 * MHC host (dev vs prod) based on the clinic's api_env setting.
 * No Next.js cache — freshness is handled by the backend's 60s in-memory cache.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  try {
    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const res = await fetch(`${BACKEND}/store/operating-hours`, {
      headers: {
        "x-forwarded-host":       host,
        "x-publishable-api-key":  pubKey,
        "content-type":           "application/json",
      },
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch (err) {
    console.error("[operating-hours proxy]", err)
    // Fail open so patients are never blocked by a proxy error
    return NextResponse.json({
      isOpen:         true,
      schedule:       [],
      formattedHours: [],
      timezone:       "Pacific Time (PT)",
    })
  }
}
