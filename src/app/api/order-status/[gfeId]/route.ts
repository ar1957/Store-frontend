/**
 * GET /api/order-status/[gfeId]
 * POST /api/order-status/[gfeId]
 * Server-side proxy for order GFE status.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function handler(req: NextRequest, { params }: { params: Promise<{ gfeId: string }> }) {
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const { gfeId } = await params

  try {
    const res = await fetch(`${BACKEND}/store/orders/${gfeId}/status`, {
      method: req.method,
      headers: {
        "x-publishable-api-key": pubKey,
        "x-forwarded-host": host,
        "content-type": "application/json",
      },
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[order-status proxy] error:", err)
    return NextResponse.json({ message: "Status fetch failed" }, { status: 500 })
  }
}

export { handler as GET, handler as POST }
