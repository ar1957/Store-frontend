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
    // Reset secrets on cart total change so a fresh intent is created
    setClinicClientSecret(null)
    setClinicPaymentIntentId(null)
    setLoading(true)

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/tenant-stripe-key")
        if (res.ok) {
          const data: TenantPaymentConfig = await res.json()

          if (data.stripeKey && data.paymentProvider !== "paypal") {
            setStripeKey(data.stripeKey)
            setStripePromise(loadStripe(data.stripeKey))

            if (!noPaymentNeeded) {
              try {
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
                  }),
                })
                if (intentRes.ok) {
                  const intentData = await intentRes.json()
                  if (intentData.clientSecret && typeof intentData.clientSecret === "string") {
                    setClinicClientSecret(intentData.clientSecret)
                    setClinicPaymentIntentId(intentData.paymentIntentId || null)
                  }
                }
              } catch (e) {
                console.error("[PaymentWrapper] Failed to create payment intent", e)
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
  }, [cartTotal])

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
