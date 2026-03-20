import { headers } from "next/headers"
import { Tenant, DEFAULT_TENANT } from "../config/tenants"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

// Cache tenant config per domain for the duration of the request
const tenantCache = new Map<string, { tenant: Tenant; fetchedAt: number }>()
const CACHE_TTL = 60 * 1000 // 60 seconds

export async function getTenantFromHeaders(): Promise<Tenant> {
  const headersList = await headers()
  // Ensure we get the actual host even behind proxies
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:8000"
  return fetchTenant(host)
}

export async function fetchTenant(host: string): Promise<Tenant> {
  // 1. Check local cache
  const cached = tenantCache.get(host)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.tenant
  }

  try {
    // 2. Fetch from the specific public store endpoint
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      method: "GET",
      headers: { 
        "host": host,
        "Content-Type": "application/json",
        // Pass a placeholder key to satisfy Medusa's base store middleware
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "public"
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.error(`[useTenant] Failed to fetch for ${host}. Status: ${res.status}`)
      return DEFAULT_TENANT
    }

    const data = await res.json()
    
    // 3. Robust Data Mapping
    // Backend returns { tenant: { ... } }. We ensure the fallback if it's missing.
    if (!data || !data.tenant) {
        console.warn(`[useTenant] No tenant record found for ${host}, using default.`)
        return DEFAULT_TENANT
    }

    const tenant: Tenant = {
      ...data.tenant,
      // Ensure logo_url from UI Config maps to the expected 'logo' field if needed
      logo: data.tenant.logo_url || data.tenant.logo || DEFAULT_TENANT.logo,
    }

    // 4. Update Cache
    tenantCache.set(host, { tenant, fetchedAt: Date.now() })
    return tenant

  } catch (err) {
    console.error("[useTenant] Fatal error fetching tenant:", err)
    return DEFAULT_TENANT
  }
}