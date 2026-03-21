import { headers, cookies } from "next/headers"
import { Tenant, DEFAULT_TENANT } from "../config/tenants"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function getTenantFromHeaders(): Promise<Tenant> {
  const headersList = await headers()
  const cookiesList = await cookies()
  const headerHost = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:8000"
  const cookieDomain = cookiesList.get("_mhc_clinic_domain")?.value || ""
  // If header host is localhost, fall back to the cookie set by placeOrder()
  const host = (headerHost && !headerHost.startsWith("localhost")) ? headerHost : (cookieDomain || headerHost)
  return fetchTenant(host)
}

export async function fetchTenant(host: string): Promise<Tenant> {
  try {
    // NOTE: Do NOT set "host" header — Node.js fetch ignores it (forbidden header).
    // Use x-forwarded-host so the backend can identify the clinic correctly.
    const res = await fetch(`${BACKEND_URL}/store/clinics/tenant-config`, {
      method: "GET",
      headers: { 
        "x-forwarded-host": host,
        "x-tenant-domain": host.split(":")[0],
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "public"
      },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`[useTenant] Failed to fetch for ${host}. Status: ${res.status}`)
      return DEFAULT_TENANT
    }

    const data = await res.json()
    
    if (!data || !data.tenant) {
      console.warn(`[useTenant] No tenant record found for ${host}, using default.`)
      return DEFAULT_TENANT
    }

    const tenant: Tenant = {
      ...data.tenant,
      logo: data.tenant.logo_url || data.tenant.logo || DEFAULT_TENANT.logo,
    }

    return tenant

  } catch (err) {
    console.error("[useTenant] Fatal error fetching tenant:", err)
    return DEFAULT_TENANT
  }
}