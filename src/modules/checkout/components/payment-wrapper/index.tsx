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

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [stripeKey, setStripeKey] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClinicStripeKey = async () => {
      try {
        const domain = window.location.hostname +
          (window.location.port ? `:${window.location.port}` : "")

        const res = await fetch(
          `${BACKEND}/store/clinics/tenant-config`, // Updated to your actual config endpoint
          { 
            headers: { 
              "host": domain,
              "x-publishable-api-key": PUB_KEY 
            } 
          }
        )

        if (res.ok) {
          const data = await res.json()
          // Accessing the key from your UI Config object
          const dbKey = data.tenant?.ui_config?.stripe_publishable_key
          
          if (dbKey) {
            setStripeKey(dbKey)
            setStripePromise(loadStripe(dbKey))
            return
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic stripe key", err)
      }

      // Fallback to environment variables
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

  if (isStripeSession && loading) {
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