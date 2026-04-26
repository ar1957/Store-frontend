"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import PayPalWrapper from "./paypal-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isPaypal } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
  noPaymentNeeded?: boolean
}

interface TenantPaymentConfig {
  stripeKey: string | null
  paypalClientId: string | null
  paypalMode: string
  paymentProvider: string
}

// sessionStorage key for persisting PI across page refreshes
const piStorageKey = (cartId: string) => `mhc_pi_${cartId}`

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children, noPaymentNeeded }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [clinicClientSecret, setClinicClientSecret] = useState<string | null>(null)
  const [clinicPaymentIntentId, setClinicPaymentIntentId] = useState<string | null>(null)

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // cart.total is in dollars — multiply by 100 to convert to cents for Stripe
  const cartTotal = Math.round(((cart as any)?.total ?? 0) * 100)

  useEffect(() => {
    if (cartTotal <= 0) return
    setLoading(true)

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/tenant-stripe-key")
        if (!res.ok) return

        const data: TenantPaymentConfig = await res.json()
        if (!data.stripeKey || data.paymentProvider === "paypal") return

        setStripeKey(data.stripeKey)
        setStripePromise(loadStripe(data.stripeKey))

        if (!noPaymentNeeded) {
          // Check sessionStorage for an existing PI for this cart+amount
          // This prevents creating duplicate PIs on page refresh
          const storageKey = piStorageKey(cart.id)
          const stored = sessionStorage.getItem(storageKey)
          if (stored) {
            try {
              const { clientSecret, paymentIntentId, amount } = JSON.parse(stored)
              if (clientSecret && paymentIntentId && amount === cartTotal) {
                // Reuse existing PI — no new Stripe transaction created
                setClinicClientSecret(clientSecret)
                setClinicPaymentIntentId(paymentIntentId)
                return
              }
            } catch {
              // Corrupt storage — fall through to create new PI
            }
          }

          // No valid cached PI — create a new one
          // Pass the old PI ID (from storage) so backend can cancel it
          let previousPaymentIntentId: string | null = null
          if (stored) {
            try {
              previousPaymentIntentId = JSON.parse(stored)?.paymentIntentId || null
            } catch {}
          }
          sessionStorage.removeItem(piStorageKey(cart.id))

          const intentRes = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              domain: typeof window !== "undefined"
                ? ((window as any).__TENANT_DOMAIN__ || window.location.hostname)
                : "",
              amount: cartTotal,
              currency: cart.currency_code || "usd",
              cartId: cart.id,
              previousPaymentIntentId,
            }),
          })

          if (intentRes.ok) {
            const intentData = await intentRes.json()
            if (intentData.clientSecret && typeof intentData.clientSecret === "string") {
              setClinicClientSecret(intentData.clientSecret)
              setClinicPaymentIntentId(intentData.paymentIntentId || null)
              // Persist PI in sessionStorage so page refreshes reuse it
              sessionStorage.setItem(piStorageKey(cart.id), JSON.stringify({
                clientSecret: intentData.clientSecret,
                paymentIntentId: intentData.paymentIntentId,
                amount: cartTotal,
              }))
            }
          }
        }

        if (data.paypalClientId && data.paymentProvider !== "stripe") {
          setPaypalClientId(data.paypalClientId)
        }
      } catch (err) {
        console.error("[PaymentWrapper] error:", err)
      }
    }

    loadConfig().finally(() => setLoading(false))
  }, [cartTotal, cart.id])

  const isPaypalSession = !noPaymentNeeded && isPaypal(paymentSession?.provider_id) && !!paymentSession

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center border rounded-lg bg-gray-50 border-dashed">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading Secure Payment...</p>
        </div>
      </div>
    )
  }

  if (isPaypalSession && paypalClientId) {
    return (
      <PayPalWrapper paymentSession={paymentSession!}>
        {children}
      </PayPalWrapper>
    )
  }

  if (!noPaymentNeeded && stripePromise && clinicClientSecret) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
        clientSecret={clinicClientSecret}
        paymentIntentId={clinicPaymentIntentId}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper
