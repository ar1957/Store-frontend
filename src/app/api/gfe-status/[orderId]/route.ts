/**
 * GET /api/gfe-status/[orderId]
 * Server-side proxy — avoids CORS by forwarding to backend.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""

  try {
    const res = await fetch(`${BACKEND}/store/orders/${orderId}/gfe-status`, {
      headers: {
        "x-publishable-api-key": pubKey,
        "x-forwarded-host": host,
      },
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[gfe-status proxy] error:", err)
    return NextResponse.json({ virtualRoomUrl: null }, { status: 500 })
  }
}
