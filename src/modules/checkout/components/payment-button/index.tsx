"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
  disabled?: boolean
  onBeforeSubmit?: () => Promise<void>
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
  disabled = false,
  onBeforeSubmit,
}) => {
  const notReady = !cart || disabled

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // ── CRITICAL: Only mount StripePaymentButton when client_secret exists.
  // Without client_secret, PaymentWrapper hasn't wrapped with <Elements>,
  // so useStripe() inside StripePaymentButton would throw.
  if (isStripeLike(paymentSession?.provider_id)) {
    if (!paymentSession?.data?.client_secret) {
      return <Button disabled size="large" className="w-full">Place order</Button>
    }
    return (
      <StripePaymentButton
        notReady={notReady}
        cart={cart}
        data-testid={dataTestId}
        onBeforeSubmit={onBeforeSubmit}
      />
    )
  }

  if (isManual(paymentSession?.provider_id)) {
    return (
      <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
    )
  }

  return <Button disabled size="large" className="w-full">Select a payment method</Button>
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const isDisabled = !stripe || !elements || notReady

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setSubmitting(false))
  }

  const handlePayment = async () => {
    setSubmitting(true)
    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    // Save address before confirming payment
    if (onBeforeSubmit) {
      await onBeforeSubmit()
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name: `${cart.billing_address?.first_name ?? ""} ${cart.billing_address?.last_name ?? ""}`,
            email: cart.email,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          setErrorMessage(error.message || "Payment failed")
          setSubmitting(false)
          return
        }
        if (
          paymentIntent?.status === "succeeded" ||
          paymentIntent?.status === "requires_capture"
        ) {
          onPaymentCompleted()
        }
      })
  }

  return (
    <>
      <Button
        disabled={isDisabled}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className="w-full"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      {errorMessage && <ErrorMessage error={errorMessage} />}
    </>
  )
}

const ManualTestPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)
    await placeOrder()
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setSubmitting(false))
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      {errorMessage && <ErrorMessage error={errorMessage} />}
    </>
  )
}

export default PaymentButton