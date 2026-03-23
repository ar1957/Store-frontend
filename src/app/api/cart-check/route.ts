/**
 * GET /api/cart-check?cartId=...
 * Lightweight server-side proxy — checks if a cart exists and has items.
 * Avoids direct browser→backend CORS fetch from product-actions.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cartId")
  if (!cartId) return NextResponse.json({ hasItems: false }, { status: 400 })

  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY

  try {
    const res = await fetch(`${BACKEND}/store/carts/${cartId}?fields=id,items`, {
      headers: { "x-publishable-api-key": pubKey },
      cache: "no-store",
    })
    if (!res.ok) return NextResponse.json({ hasItems: false })
    const data = await res.json()
    const hasItems = (data.cart?.items?.length ?? 0) > 0
    return NextResponse.json({ hasItems })
  } catch {
    // On backend error, assume cart is valid to avoid blocking the user
    return NextResponse.json({ hasItems: true })
  }
}
