/**
 * POST /api/eligibility-metadata
 * Server-side proxy to avoid CORS issues.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function POST(req: NextRequest) {
  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY
  const body = await req.json()

  try {
    const res = await fetch(`${BACKEND}/store/carts/eligibility-metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": pubKey,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("[eligibility-metadata proxy] error:", err)
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
