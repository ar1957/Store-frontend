import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const host = request.headers.get("host") || "localhost:8000"
  let tenantApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  try {
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      headers: { 
        "host": host, 
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" 
      },
      cache: "no-store", // never cache — each host must get its own tenant key
    })
    const data = await res.json()
    if (data?.tenant?.apiKey) {
      tenantApiKey = data.tenant.apiKey
    }
  } catch (e) {
    console.error("Middleware lookup failed:", e)
  }

  // 1. Set Header for Server Components (Products)
  if (tenantApiKey) {
    requestHeaders.set("x-tenant-api-key", tenantApiKey)
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // 2. Set Cookie for Client Components (Payment/Stripe)
  if (tenantApiKey) {
    response.cookies.set("x-tenant-api-key", tenantApiKey, {
      path: "/",
      sameSite: "lax",
      httpOnly: false, 
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}