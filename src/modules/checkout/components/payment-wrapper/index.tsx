"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import PayPalWrapper from "./paypal-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike, isPaypal } from "@lib/constants"

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

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children, noPaymentNeeded }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null)
  const [clinicClientSecret, setClinicClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/tenant-stripe-key")
        if (res.ok) {
          const data: TenantPaymentConfig = await res.json()

          if (data.stripeKey && data.paymentProvider !== "paypal") {
            setStripeKey(data.stripeKey)
            setStripePromise(loadStripe(data.stripeKey))

            // If cart has a total > 0, create a PaymentIntent using the clinic's own Stripe key
            // This bypasses Medusa's global STRIPE_API_KEY and uses the per-clinic key
            const cartAny = cart as any
            const total = cartAny?.total ?? 0

            if (total > 0 && !noPaymentNeeded) {
              try {
                const intentRes = await fetch(`/api/create-payment-intent`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    amount: total,
                    currency: cart.currency_code || "usd",
                    cartId: cart.id,
                  }),
                })
                if (intentRes.ok) {
                  const intentData = await intentRes.json()
                  const cs = intentData.clientSecret
                  if (cs && typeof cs === "string") {
                    setClinicClientSecret(cs)
                  }
                } else {
                  console.error("create-payment-intent failed:", await intentRes.text())
                }
              } catch (e) {
                console.error("Failed to create clinic payment intent", e)
              }
            }
          }

          if (data.paypalClientId && data.paymentProvider !== "stripe") {
            setPaypalClientId(data.paypalClientId)
          }
          return
        }
      } catch (err) {
        console.error("Failed to load payment config", err)
      }
      const fallbackKey = process.env.NEXT_PUBLIC_STRIPE_KEY
      if (fallbackKey) {
        setStripeKey(fallbackKey)
        setStripePromise(loadStripe(fallbackKey))
      }
    }
    loadConfig().finally(() => setLoading(false))
  }, [])

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const isPaypalSession = !noPaymentNeeded && isPaypal(paymentSession?.provider_id) && !!paymentSession

  // Use clinic's own client_secret if available, otherwise fall back to Medusa session
  // Ensure it's always a plain string
  const rawSecret = clinicClientSecret || paymentSession?.data?.client_secret
  const effectiveClientSecret = typeof rawSecret === "string"
    ? rawSecret
    : typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as any).clientSecret || undefined
      : undefined
  const isStripeSession = isStripeLike(paymentSession?.provider_id ?? (stripeKey ? "pp_stripe_stripe" : ""))
    && !!effectiveClientSecret

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

  if (!noPaymentNeeded && stripePromise && effectiveClientSecret) {
    // Build a synthetic payment session with the clinic's client_secret
    const syntheticSession = {
      ...(paymentSession || {}),
      provider_id: paymentSession?.provider_id || "pp_stripe_stripe",
      data: {
        ...(paymentSession?.data || {}),
        client_secret: effectiveClientSecret,
      },
    } as any

    return (
      <StripeWrapper
        paymentSession={syntheticSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper
