"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
  clientSecret?: string
}

// Context holds the clientSecret string (or false if not ready)
export const StripeContext = createContext<string | false>(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
  clientSecret: clientSecretProp,
}) => {
  // Use explicitly passed clientSecret first, then fall back to session data
  const rawSecret = clientSecretProp || paymentSession?.data?.client_secret
  const clientSecret = typeof rawSecret === "string"
    ? rawSecret
    : typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as any).clientSecret
      : undefined

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "var(--color-primary, #111)",
        borderRadius: "8px",
        fontFamily: "Inter, sans-serif",
      },
    },
  }

  if (!stripeKey || !stripePromise || !clientSecret) {
    return (
      <div className="w-full h-40 flex items-center justify-center border rounded-lg bg-gray-50 border-dashed">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Securing Payment Session...</p>
        </div>
      </div>
    )
  }

  return (
    <StripeContext.Provider value={clientSecret}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper