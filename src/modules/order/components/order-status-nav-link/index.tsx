/**
 * Order Status Nav Link
 * 
 * Add this wherever you want in your navbar.
 * Works in both server and client components.
 * 
 * Usage in nav:
 *   import OrderStatusNavLink from "@modules/order/components/order-status-nav-link"
 *   <OrderStatusNavLink countryCode={countryCode} />
 * 
 * Or just paste this directly as a Link:
 *   <Link href={`/${countryCode}/order/status`}>Track Order</Link>
 */

import Link from "next/link"

export default function OrderStatusNavLink({ countryCode }: { countryCode: string }) {
  return (
    <Link
      href={`/${countryCode}/order/status`}
      className="text-sm font-medium text-ui-fg-base hover:text-ui-fg-interactive transition-colors"
    >
      Track Order
    </Link>
  )
}