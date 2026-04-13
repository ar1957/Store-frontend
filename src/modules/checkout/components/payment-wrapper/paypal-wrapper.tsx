"use client"

import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type PayPalWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  children: React.ReactNode
}

export const PayPalContext = createContext(false)

const PayPalWrapper: React.FC<PayPalWrapperProps> = ({
  paymentSession,
  children,
}) => {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) {
    throw new Error(
      "PayPal client ID is missing. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable."
    )
  }

  const initialOptions = {
    clientId,
    currency: (paymentSession.currency_code || "usd").toUpperCase(),
    intent: "capture",
  }

  return (
    <PayPalContext.Provider value={true}>
      <PayPalScriptProvider options={initialOptions}>
        {children}
      </PayPalScriptProvider>
    </PayPalContext.Provider>
  )
}

export default PayPalWrapper
