import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

// In-memory cache for tenant API keys — avoids hitting the backend on every request
// TTL: 60 seconds. Edge-safe (no external dependencies).
const tenantCache = new Map<string, { apiKey: string; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

// Patterns that only appear in scanner/bot probe traffic, never in legitimate storefront URLs
const SCANNER_EXT =
  /\.(php|bak|old|tmp|swp|save|orig|backup|sql|cfg|ini|pem|crt|key|p12|lz4|xz|sh|rb|py|inc|properties|aspx|asp|jsp|cgi|log)$/i
const SCANNER_PATH =
  /^\/(wp-admin|wp-login|phpmyadmin|xmlrpc|\.env|\.git|\.aws|\.ssh|\.ssl|actuator|cgi-bin|setup\.cgi)/i

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Short-circuit scanner probes before any logging or backend calls.
  // Returning 308 (3xx) keeps these out of EB's 4xx health metric.
  if (
    SCANNER_EXT.test(pathname) ||
    SCANNER_PATH.test(pathname) ||
    pathname.includes("/../") ||
    pathname.endsWith("~")
  ) {
    return NextResponse.redirect(new URL("/us/store", request.url), 308)
  }

  const requestHeaders = new Headers(request.headers)

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:8000"

  let tenantApiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  requestHeaders.set("x-forwarded-host", host)
  requestHeaders.set("x-tenant-domain", host.split(":")[0])

  console.log("[Middleware]", request.method, request.nextUrl.pathname, "host:", host)

  // Check cache first
  const cached = tenantCache.get(host)
  if (cached && Date.now() < cached.expiresAt) {
    tenantApiKey = cached.apiKey
  } else {
    try {
      const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
        headers: {
          "x-forwarded-host": host,
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        next: { revalidate: 60 }, // Next.js cache for 60s
      })
      const data = await res.json()
      if (data?.tenant?.apiKey) {
        tenantApiKey = data.tenant.apiKey
        tenantCache.set(host, { apiKey: tenantApiKey, expiresAt: Date.now() + CACHE_TTL_MS })
      }
    } catch (e) {
      console.error("Middleware lookup failed:", e)
    }
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
