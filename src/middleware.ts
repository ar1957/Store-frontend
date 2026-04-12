import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  // Behind AWS EB + nginx, the original domain (shop.spaderx.com) is forwarded
  // as X-Forwarded-Host by our nginx config (.platform/nginx/conf.d/elasticbeanstalk/host-header.conf)
  // Locally, host header works directly.
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:8000"

  let tenantApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  requestHeaders.set("x-forwarded-host", host)
  requestHeaders.set("x-tenant-domain", host.split(":")[0])

  console.log("[Middleware]", request.method, request.nextUrl.pathname, "host:", host)

  try {
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      headers: {
        "x-forwarded-host": host,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
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
