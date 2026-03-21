import { headers } from "next/headers"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }
type SocialLink = { platform: string; url: string }
type UiConfig = {
  nav_links?: NavLink[]
  footer_links?: NavLink[]
  bottom_links?: NavLink[]
  logo_url?: string | null
  get_started_url?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  contact_address?: string | null
  social_links?: SocialLink[]
  certification_image_url?: string | null
} | null

async function fetchUiConfig(host: string): Promise<UiConfig> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backendUrl}/store/clinics/ui-config`, {
      headers: {
        host,
        "x-forwarded-host": host,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        "content-type": "application/json",
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.config || null
  } catch {
    return null
  }
}

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const reqHeaders = await headers()
  const host = reqHeaders.get("host") || ""
  const tenantApiKey = reqHeaders.get("x-tenant-api-key") || ""
  const tenantDomain = reqHeaders.get("x-tenant-domain") || ""

  const uiConfig = await fetchUiConfig(host)

  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <Nav
        logoUrl={uiConfig?.logo_url}
        getStartedUrl={uiConfig?.get_started_url}
        navLinks={uiConfig?.nav_links}
        clinicName={tenantDomain || host}
      />
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <Footer
        footerLinks={uiConfig?.footer_links}
        bottomLinks={uiConfig?.bottom_links}
        logoUrl={uiConfig?.logo_url}
        clinicName={tenantDomain || host}
        contactPhone={uiConfig?.contact_phone}
        contactEmail={uiConfig?.contact_email}
        contactAddress={uiConfig?.contact_address}
        socialLinks={uiConfig?.social_links}
        certificationImageUrl={uiConfig?.certification_image_url}
      />
    </div>
  )
}
