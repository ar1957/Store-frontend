import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import VirtualRoomRedirect from "@modules/order/components/virtual-room-redirect"
import ScrollToTop from "@modules/common/components/scroll-to-top"
import ClearEligibility from "@modules/common/components/clear-eligibility"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import { HttpTypes } from "@medusajs/types"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }
type SocialLink = { platform: string; url: string }

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
  clinicDomain?: string | null
}

function getContrastColor(hex: string): string {
  const clean = (hex || "#111111").replace("#", "").padEnd(6, "0")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#111111" : "#ffffff"
}

async function fetchClinicConfig(domain: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backendUrl}/store/clinics/ui-config`, {
      headers: {
        "x-forwarded-host": domain,
        "x-tenant-domain": domain.split(":")[0],
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
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

export default async function OrderCompletedTemplate({
  order,
  clinicDomain,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  // Fetch clinic config using the domain from order metadata — bypasses broken header chain
  const uiConfig = clinicDomain ? await fetchClinicConfig(clinicDomain) : null
  const brandColor = uiConfig?.brand_color || null
  const brandTextColor = brandColor ? getContrastColor(brandColor) : null

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      {/* Hide the layout's nav/footer — we render our own below with the correct clinic */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-layout-nav], [data-layout-footer] { display: none !important; }
          ${brandColor ? `
          :root {
            --color-primary: ${brandColor} !important;
            --button-text: ${brandTextColor} !important;
            --color-accent: ${brandColor} !important;
          }
          ` : ""}
        `
      }} />

      {/* Correct clinic Nav */}
      <Nav
        logoUrl={uiConfig?.logo_url}
        getStartedUrl={uiConfig?.get_started_url}
        navLinks={uiConfig?.nav_links}
        clinicName={clinicDomain || ""}
      />

      <ScrollToTop />
      <ClearEligibility />
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Thank you!</span>
            <span>Your order was placed successfully.</span>
          </Heading>
          <OrderDetails order={order} />

          <VirtualRoomRedirect
            orderId={order.id}
            metadata={order.metadata as Record<string, any> | null}
          />

          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>

      {/* Correct clinic Footer */}
      <Footer
        footerLinks={uiConfig?.footer_links}
        bottomLinks={uiConfig?.bottom_links}
        logoUrl={uiConfig?.logo_url}
        clinicName={clinicDomain || ""}
        contactPhone={uiConfig?.contact_phone}
        contactEmail={uiConfig?.contact_email}
        contactAddress={uiConfig?.contact_address}
        socialLinks={uiConfig?.social_links}
        certificationImageUrl={uiConfig?.certification_image_url}
      />
    </div>
  )
}
