import { NextRequest, NextResponse } from "next/server"
import { removeCartId } from "@lib/data/cookies"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartId } = body
    const tenantKey = request.cookies.get("x-tenant-api-key")?.value
      || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      || ""

    const res = await fetch(`${BACKEND_URL}/store/clinics/complete-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": tenantKey,
      },
      body: JSON.stringify({ cartId }),
      cache: "no-store",
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json(err, { status: res.status })
    }

    const data = await res.json()

    // Clear the httpOnly cart cookie — document.cookie can't do this from client JS
    await removeCartId()

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
