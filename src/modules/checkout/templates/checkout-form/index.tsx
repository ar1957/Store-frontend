/**
 * Single-page checkout form — all sections visible at once
 * File: src/modules/checkout/templates/checkout-form/index.tsx
 */
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import SinglePageCheckout from "@modules/checkout/components/single-page-checkout"
import { headers } from "next/headers"
import { isStripeLike, isPaypal } from "@lib/constants"
import { Pool } from "pg"

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL })

async function getClinicConfig(host: string): Promise<{ paymentProvider: string; requiresPhone: boolean }> {
  try {
    const domain = host.split(":")[0]
    // A clinic can have multiple pharmacies now (clinic_pharmacy table) —
    // clinic.pharmacy_enabled/pharmacy_type are the legacy single-pharmacy
    // columns and are never touched once a clinic uses the admin Pharmacy
    // tab's multi-pharmacy CRUD, so check for any enabled RxVortex pharmacy
    // directly instead.
    const result = await pgPool.query(
      `SELECT payment_provider,
         EXISTS (
           SELECT 1 FROM clinic_pharmacy cp
           WHERE cp.clinic_id = clinic.id AND cp.pharmacy_type = 'rxvortex'
             AND cp.is_enabled = true AND cp.deleted_at IS NULL
         ) AS has_rxvortex
       FROM clinic
       WHERE ($1 = ANY(domains) OR $2 = ANY(SELECT split_part(d,':',1) FROM unnest(domains) AS d))
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [host, domain]
    )
    const row = result.rows[0]
    const provider = row?.payment_provider || "stripe"
    const requiresPhone = !!row?.has_rxvortex
    console.log(`[CheckoutForm] host=${host} payment_provider=${provider} requires_phone=${requiresPhone}`)
    return { paymentProvider: provider, requiresPhone }
  } catch (e) {
    console.error("[CheckoutForm] getClinicConfig error:", e)
    return { paymentProvider: "stripe", requiresPhone: false }
  }
}

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) return null

  const headersList = await headers()
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:8000"

  const [shippingMethods, paymentMethods, clinicConfig] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
    getClinicConfig(host),
  ])
  const paymentProvider = clinicConfig.paymentProvider
  const requiresPhone = clinicConfig.requiresPhone

  if (!shippingMethods || !paymentMethods) return null

  // Filter payment methods based on clinic's payment_provider setting
  const filteredPaymentMethods = paymentMethods.filter((method: any) => {
    if (paymentProvider === "stripe") return isStripeLike(method.id) || method.id?.startsWith("pp_system_default")
    if (paymentProvider === "paypal") return isPaypal(method.id)
    if (paymentProvider === "authorizenet") return isStripeLike(method.id) || method.id?.startsWith("pp_system_default")
    // "both" — show all
    return true
  })

  return (
    <SinglePageCheckout
      cart={cart}
      customer={customer}
      availableShippingMethods={shippingMethods}
      availablePaymentMethods={filteredPaymentMethods}
      paymentProvider={paymentProvider}
      requiresPhone={requiresPhone}
    />
  )
}
