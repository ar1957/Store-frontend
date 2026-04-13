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
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/tenant-stripe-key")
        if (res.ok) {
          const data = await res.json()
          if (data.stripeKey && data.paymentProvider !== "paypal") {
            setStripeKey(data.stripeKey)
            setStripePromise(loadStripe(data.stripeKey))
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

  // Per official Medusa PayPal docs: only wrap with PayPalWrapper when a PayPal session exists
  if (isPaypal(paymentSession?.provider_id) && paymentSession) {
    return (
      <PayPalWrapper paymentSession={paymentSession}>
        {children}
      </PayPalWrapper>
    )
  }

  const isStripeSession =
    isStripeLike(paymentSession?.provider_id) &&
    !!paymentSession?.data?.client_secret

  if (isStripeSession && stripePromise) {
    return (
      <StripeWrapper paymentSession={paymentSession} stripeKey={stripeKey} stripePromise={stripePromise}>
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper
