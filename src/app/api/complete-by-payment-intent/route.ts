/**
 * POST /api/complete-by-payment-intent
 *
 * Proxy to the backend endpoint that recovers a cart completion
 * after a Klarna/Stripe redirect where the cart cookie was lost.
 */
import { NextRequest, NextResponse } from "next/server"
import { removeCartId } from "@lib/data/cookies"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantKey = request.cookies.get("x-tenant-api-key")?.value
      || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      || ""

    const res = await fetch(`${BACKEND_URL}/store/clinics/complete-by-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": tenantKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json(err, { status: res.status })
    }

    const data = await res.json()

    // Clear cart cookie if order was created
    if (data.type === "order") {
      await removeCartId()
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
