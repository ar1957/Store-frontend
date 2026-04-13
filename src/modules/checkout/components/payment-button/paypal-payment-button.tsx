"use client"

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PayPalPaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
}

const PayPalPaymentButton: React.FC<PayPalPaymentButtonProps> = ({
  cart,
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [{ isResolved }] = usePayPalScriptReducer()

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const onPaymentCompleted = async () => {
    if (onBeforeSubmit) {
      try { await onBeforeSubmit() } catch { /* non-fatal */ }
    }
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const getPayPalOrderId = (): string | null => {
    if (!paymentSession?.data) return null
    return (
      (paymentSession.data.order_id as string) ||
      (paymentSession.data.id as string) ||
      null
    )
  }

  const createOrder = async () => {
    setSubmitting(true)
    setErrorMessage(null)
    const existingOrderId = getPayPalOrderId()
    if (existingOrderId) return existingOrderId
    throw new Error("PayPal order not found. Please refresh and try again.")
  }
  const onApprove = async (data: { orderID: string }, actions: any) => {
    try {
      setSubmitting(true)
      setErrorMessage(null)

      // Capture the PayPal order — this changes status from APPROVED to COMPLETED
      // which the plugin maps to CAPTURED, allowing Medusa to authorize the session
      await actions?.order?.capture()

      await onPaymentCompleted()
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to process PayPal payment")
      setSubmitting(false)
    }
  }

  const onError = (err: Record<string, unknown>) => {
    setErrorMessage((err.message as string) || "An error occurred with PayPal payment")
    setSubmitting(false)
  }

  const onCancel = () => {
    setSubmitting(false)
    setErrorMessage("PayPal payment was cancelled")
  }

  if (!isResolved) {
    return (
      <>
        <Button disabled size="large" isLoading data-testid={dataTestId}>
          Loading PayPal...
        </Button>
        <ErrorMessage error={errorMessage} data-testid="paypal-payment-error-message" />
      </>
    )
  }

  return (
    <>
      <div className="mb-4">
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
          style={{ layout: "horizontal", color: "black", shape: "rect", label: "buynow" }}
          disabled={notReady || submitting}
          data-testid={dataTestId}
        />
      </div>
      <ErrorMessage error={errorMessage} data-testid="paypal-payment-error-message" />
    </>
  )
}

export default PayPalPaymentButton
