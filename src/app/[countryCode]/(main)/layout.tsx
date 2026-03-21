import { Metadata } from "next"
import { headers, cookies } from "next/headers"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

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

/** Returns #111111 or #ffffff depending on which has better contrast against the given hex color */
function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  // Relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#111111" : "#ffffff"
}

async function fetchUiConfig(host: string): Promise<UiConfig> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    // NOTE: Do NOT set the "host" header — Node.js fetch ignores/overrides it.
    // Use x-forwarded-host and x-tenant-domain so the backend can identify the clinic.
    const url = `${backendUrl}/store/clinics/ui-config`

    console.log("[Main Layout] fetchUiConfig for host:", host)

    const res = await fetch(url, {
      headers: {
        "x-forwarded-host": host,
        "x-tenant-domain": host.split(":")[0],
        "x-publishable-api-key": publishableKey,
        "content-type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("[UI Config] Response not ok:", res.status)
      return null
    }

    const data = await res.json()
    return data.config || null
  } catch (err) {
    console.error("[UI Config] Fetch error:", err)
    return null
  }
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  const reqHeaders = await headers()
  const reqCookies = await cookies()
  const tenantApiKey = reqHeaders.get("x-tenant-api-key") || ""
  const tenantDomain = reqHeaders.get("x-tenant-domain") || ""
  // Prefer x-forwarded-host (set by middleware) so redirects don't lose the clinic domain
  const headerHost = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host") || ""
  // Fall back to cookie set by placeOrder() — reliable after server-action redirects
  const cookieDomain = reqCookies.get("_mhc_clinic_domain")?.value || ""
  // Use header host unless it's localhost (which means the redirect lost the real host)
  const host = (headerHost && !headerHost.startsWith("localhost")) ? headerHost : (cookieDomain || headerHost)

  console.log("[Main Layout] x-forwarded-host:", reqHeaders.get("x-forwarded-host"), "cookie domain:", cookieDomain, "resolved host:", host)

  // Fetch UI config for this clinic/domain
  const uiConfig = await fetchUiConfig(host)
  const brandColor = uiConfig?.brand_color || "#111111"
  const brandTextColor = getContrastColor(brandColor)

  return (
    <>
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
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__TENANT_API_KEY__ = ${JSON.stringify(tenantApiKey)};
            window.__TENANT_DOMAIN__ = ${JSON.stringify(tenantDomain)};
          `,
        }}
      />
      <div data-layout-nav>
        <Nav
          logoUrl={uiConfig?.logo_url}
          getStartedUrl={uiConfig?.get_started_url}
          navLinks={uiConfig?.nav_links}
          clinicName={tenantDomain || host}
        />
      </div>
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <div data-layout-footer>
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
    </>
  )
}