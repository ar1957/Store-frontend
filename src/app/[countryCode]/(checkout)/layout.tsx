import { headers } from "next/headers"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

export const dynamic = "force-dynamic"

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
  brand_color?: string | null
} | null

function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#111111" : "#ffffff"
}

async function fetchUiConfig(host: string): Promise<UiConfig> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    // NOTE: Do NOT set the "host" header — Node.js fetch ignores/overrides it.
    const res = await fetch(`${backendUrl}/store/clinics/ui-config`, {
      headers: {
        "x-forwarded-host": host,
        "x-tenant-domain": host.split(":")[0],
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
  const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host") || ""
  const tenantApiKey = reqHeaders.get("x-tenant-api-key") || ""
  const tenantDomain = reqHeaders.get("x-tenant-domain") || ""

  const uiConfig = await fetchUiConfig(host)
  const brandColor = uiConfig?.brand_color || "#111111"
  const brandTextColor = getContrastColor(brandColor)

  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --color-primary: ${brandColor};
            --button-text: ${brandTextColor};
            --button-inverted: ${brandColor};
            --button-inverted-hover: ${brandColor};
            --button-inverted-pressed: ${brandColor};
            --contrast-fg-primary: ${brandTextColor};
          }
          button.shadow-buttons-inverted,
          button[class*="shadow-buttons-inverted"] {
            background-color: ${brandColor} !important;
            color: ${brandTextColor} !important;
            border-radius: 16px !important;
            font-size: 14px !important;
          }
          button[class*="shadow-buttons-"] {
            border-radius: 16px !important;
            font-size: 14px !important;
          }
        `
      }} />
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
