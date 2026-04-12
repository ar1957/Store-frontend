import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  // The AWS ALB preserves the original Host header (shop.spaderx.com)
  // x-forwarded-host is not set by ALB by default
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "localhost:8000"
  let tenantApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  // Always forward the original host so server components can read it reliably
  requestHeaders.set("x-forwarded-host", host)
  requestHeaders.set("x-tenant-domain", host.split(":")[0])

  console.log("[Middleware]", request.method, request.nextUrl.pathname, "host:", host)
  console.log("[Middleware] all headers:", JSON.stringify(Object.fromEntries(request.headers.entries())))

  try {
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      headers: { 
        "host": host,
        "x-forwarded-host": host,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" 
      },
      cache: "no-store",
    })
    const data = await res.json()
    if (data?.tenant?.apiKey) {
      tenantApiKey = data.tenant.apiKey
    }
  } catch (e) {
    console.error("Middleware lookup failed:", e)
  }

  if (tenantApiKey) {
    requestHeaders.set("x-tenant-api-key", tenantApiKey)
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

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