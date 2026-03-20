/**
 * Single-page checkout form — all sections visible at once
 * File: src/modules/checkout/templates/checkout-form/index.tsx
 */
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import SinglePageCheckout from "@modules/checkout/components/single-page-checkout"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) return null

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) return null

  return (
    <SinglePageCheckout
      cart={cart}
      customer={customer}
      availableShippingMethods={shippingMethods}
      availablePaymentMethods={paymentMethods}
    />
  )
}