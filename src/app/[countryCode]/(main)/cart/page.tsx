import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  const cart = await retrieveCart(undefined, undefined, "no-store").catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  // Get the "shop" URL from UI config (same as Get Started button)
  let shopUrl = "/store"
  try {
    const reqHeaders = await headers()
    const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host") || ""
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backendUrl}/store/clinics/ui-config`, {
      headers: {
        host,
        "x-forwarded-host": host,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      shopUrl = data.config?.get_started_url || "/store"
    }
  } catch {}

  return <CartTemplate cart={cart} customer={customer} shopUrl={shopUrl} />
}
