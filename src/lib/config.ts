import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(input: FetchInput, init?: FetchArgs): Promise<T> => {
  const headers = (init?.headers ?? {}) as Record<string, string>
  let activeKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (typeof window === "undefined") {
    // SERVER-SIDE: Try middleware-injected header first, then cookie fallback
    // (server actions don't carry request headers, but they can read cookies)
    try {
      const { headers: nextHeaders } = await import("next/headers")
      const h = await nextHeaders()
      const headerKey = h.get("x-tenant-api-key")
      if (headerKey) activeKey = headerKey
    } catch {}

    // Fallback to cookie for server actions (which lose request headers)
    if (activeKey === process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      try {
        const { cookies } = await import("next/headers")
        const c = await cookies()
        const cookieKey = c.get("x-tenant-api-key")?.value
        if (cookieKey) activeKey = cookieKey
      } catch {}
    }
  } else {
    // CLIENT-SIDE: Read from the cookie set by middleware
    const match = document.cookie.match(new RegExp('(^| )x-tenant-api-key=([^;]+)'))
    if (match) activeKey = match[2]
  }

  // FORCE: This ensures every request uses the specific Clinic Key
  headers["x-publishable-api-key"] = activeKey || ""
  
  try {
    const locale = await getLocaleHeader()
    headers["x-medusa-locale"] ??= locale["x-medusa-locale"] as string
  } catch {}

  return originalFetch(input, { ...init, headers })
}