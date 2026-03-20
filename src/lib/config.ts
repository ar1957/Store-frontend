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
    // SERVER-SIDE: Read from the middleware-injected header
    try {
      const { headers: nextHeaders } = await import("next/headers")
      const h = await nextHeaders()
      activeKey = h.get("x-tenant-api-key") || activeKey
    } catch {}
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