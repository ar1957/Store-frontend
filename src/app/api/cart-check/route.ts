/**
 * GET /api/cart-check?cartId=...
 * Checks if a cart exists (regardless of whether it has items).
 * Used to detect stale eligibility cache after order placement
 * (order placement creates a new cart, making the old cartId invalid).
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cartId")
  if (!cartId) return NextResponse.json({ cartExists: false }, { status: 400 })

  const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY

  try {
    const res = await fetch(`${BACKEND}/store/carts/${cartId}?fields=id`, {
      headers: { "x-publishable-api-key": pubKey },
      cache: "no-store",
    })
    if (!res.ok) {
      // 404 = cart gone (new session after order placement)
      return NextResponse.json({ cartExists: false, hasItems: false })
    }
    const data = await res.json()
    const hasItems = (data.cart?.items?.length ?? 0) > 0
    return NextResponse.json({ cartExists: true, hasItems })
  } catch {
    // On backend error, assume cart is valid to avoid blocking the user
    return NextResponse.json({ cartExists: true, hasItems: true })
  }
}
