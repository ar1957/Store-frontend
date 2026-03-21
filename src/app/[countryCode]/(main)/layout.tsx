import { Metadata } from "next"
import { headers } from "next/headers"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

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
} | null

async function fetchUiConfig(host: string): Promise<UiConfig> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const url = `${backendUrl}/store/clinics/ui-config`

    const res = await fetch(url, {
      headers: {
        host,
        "x-forwarded-host": host,
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
  const tenantApiKey = reqHeaders.get("x-tenant-api-key") || ""
  const tenantDomain = reqHeaders.get("x-tenant-domain") || ""
  const host = reqHeaders.get("host") || ""

  // Fetch UI config for this clinic/domain
  const uiConfig = await fetchUiConfig(host)

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__TENANT_API_KEY__ = ${JSON.stringify(tenantApiKey)};
            window.__TENANT_DOMAIN__ = ${JSON.stringify(tenantDomain)};
          `,
        }}
      />
      <Nav
        logoUrl={uiConfig?.logo_url}
        getStartedUrl={uiConfig?.get_started_url}
        navLinks={uiConfig?.nav_links}
        clinicName={tenantDomain || host}
      />
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
    </>
  )
}