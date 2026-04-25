"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useRef, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import PayPalWrapper from "./paypal-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike, isPaypal } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
  noPaymentNeeded?: boolean
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children, noPaymentNeeded }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [clinicClientSecret, setClinicClientSecret] = useState<string | null>(null)
  const [clinicPaymentIntentId, setClinicPaymentIntentId] = useState<string | null>(null)
  const intentCartTotal = useRef<number | null>(null)

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const isStripeActive = isStripeLike(paymentSession?.provider_id)

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

  // Reset intent when Stripe is no longer the active method
  useEffect(() => {
    if (!isStripeActive) {
      setClinicClientSecret(null)
      setClinicPaymentIntentId(null)
      intentCartTotal.current = null
    }
  }, [isStripeActive])

  // Create per-clinic payment intent when Stripe is active
  useEffect(() => {
    if (!isStripeActive || !cart.id || !cart.total || cart.total <= 0) return
    // Skip if we already have an intent for this exact cart total
    if (intentCartTotal.current === cart.total && clinicClientSecret) return
    intentCartTotal.current = cart.total

    const createIntent = async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: cart.total,
            currency: cart.region?.currency_code || "usd",
            cartId: cart.id,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setClinicClientSecret(data.clientSecret || null)
          setClinicPaymentIntentId(data.paymentIntentId || null)
        }
      } catch (err) {
        console.error("[PaymentWrapper] Failed to create payment intent", err)
      }
    }

    createIntent()
  }, [isStripeActive, cart.id, cart.total])

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

  if (!noPaymentNeeded && isPaypal(paymentSession?.provider_id) && paymentSession) {
    return (
      <PayPalWrapper paymentSession={paymentSession}>
        {children}
      </PayPalWrapper>
    )
  }

  if (isStripeActive && stripePromise) {
    return (
      <StripeWrapper
        paymentSession={paymentSession!}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
        clientSecret={clinicClientSecret || ""}
        paymentIntentId={clinicPaymentIntentId}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper
