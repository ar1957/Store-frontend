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

async function getClinicPaymentProvider(host: string): Promise<string> {
  try {
    const domain = host.split(":")[0]
    const result = await pgPool.query(
      `SELECT payment_provider FROM clinic
       WHERE ($1 = ANY(domains) OR $2 = ANY(SELECT split_part(d,':',1) FROM unnest(domains) AS d))
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [host, domain]
    )
    const provider = result.rows[0]?.payment_provider || "stripe"
    console.log(`[CheckoutForm] host=${host} payment_provider=${provider}`)
    return provider
  } catch (e) {
    console.error("[CheckoutForm] getClinicPaymentProvider error:", e)
    return "stripe"
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

  const [shippingMethods, paymentMethods, paymentProvider] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
    getClinicPaymentProvider(host),
  ])

  if (!shippingMethods || !paymentMethods) return null

  // Filter payment methods based on clinic's payment_provider setting
  const filteredPaymentMethods = paymentMethods.filter((method: any) => {
    if (paymentProvider === "stripe") return isStripeLike(method.id) || method.id?.startsWith("pp_system_default")
    if (paymentProvider === "paypal") return isPaypal(method.id)
    // "both" — show all
    return true
  })

  return (
    <SinglePageCheckout
      cart={cart}
      customer={customer}
      availableShippingMethods={shippingMethods}
      availablePaymentMethods={filteredPaymentMethods}
    />
  )
}
