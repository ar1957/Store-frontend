"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClinicStripeKey = async () => {
      try {
        // Call our own Next.js API route — it can read the host header correctly
        // (browsers block setting 'host' directly in client-side fetch)
        const res = await fetch("/api/tenant-stripe-key")
        if (res.ok) {
          const data = await res.json()
          if (data?.stripeKey) {
            setStripeKey(data.stripeKey)
            setStripePromise(loadStripe(data.stripeKey))
            return
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic stripe key", err)
      }

      // Fallback to environment variable
      const fallbackKey = process.env.NEXT_PUBLIC_STRIPE_KEY ||
        process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

      if (fallbackKey) {
        setStripeKey(fallbackKey)
        setStripePromise(loadStripe(fallbackKey))
      }
    }

    loadClinicStripeKey().finally(() => setLoading(false))
  }, [])

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const isStripeSession =
    isStripeLike(paymentSession?.provider_id) &&
    !!paymentSession?.data?.client_secret

  // Show spinner while fetching the Stripe key — regardless of whether
  // the payment session exists yet. This prevents children rendering
  // before stripePromise is ready, which causes the disabled button race.
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

  if (isStripeSession && stripePromise) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise} // Fixed prop name to match stripe-wrapper.tsx
      >
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper