/**
 * GET /api/orders-lookup?email=...&orderId=...
 * Server-side proxy — forwards x-forwarded-host so backend resolves correct clinic.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""

  const params = new URLSearchParams()
  if (searchParams.get("email")) params.set("email", searchParams.get("email")!)
  if (searchParams.get("orderId")) params.set("orderId", searchParams.get("orderId")!)

  try {
    const res = await fetch(`${BACKEND}/store/orders/lookup?${params}`, {
      headers: {
        "x-publishable-api-key": pubKey,
        "x-forwarded-host": host,
      },
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[orders-lookup proxy] error:", err)
    return NextResponse.json({ message: "Lookup failed" }, { status: 500 })
  }
}
