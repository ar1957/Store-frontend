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
  noPaymentNeeded?: boolean
  onBeforeSubmit?: () => Promise<void>
}

// ── Processing overlay shown while order is being placed ──────────────────
function ProcessingOverlay() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "36px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        maxWidth: 340,
        textAlign: "center",
      }}>
        {/* Spinner */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "4px solid #e5e7eb",
          borderTopColor: "var(--color-primary, #111)",
          animation: "mhc-spin 0.8s linear infinite",
        }} />
        <style>{`
          @keyframes mhc-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 6 }}>
            Creating your visit request…
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
            Please wait while we securely process your order. Do not close this page.
          </div>
        </div>
      </div>
    </div>
  )
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
  disabled = false,
  noPaymentNeeded = false,
  onBeforeSubmit,
}) => {
  const notReady = !cart || disabled

  // Zero-total order (promo/gift card covers everything) — just place order directly
  if (noPaymentNeeded) {
    return (
      <ZeroTotalPaymentButton
        notReady={notReady}
        data-testid={dataTestId}
        onBeforeSubmit={onBeforeSubmit}
      />
    )
  }

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

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
      .catch((err) => {
        // 409 means cart is already being completed — treat as success and wait for redirect
        if (err?.message?.includes("409") || err?.message?.includes("conflicted") || err?.message?.includes("already being completed")) {
          return
        }
        setErrorMessage(err.message)
        setSubmitting(false)
      })
    // intentionally don't setSubmitting(false) on success — overlay stays
    // until the page navigates away to the confirmation page
  }

  const handlePayment = async () => {
    if (submitting) return
    setSubmitting(true)
    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    if (onBeforeSubmit) {
      try {
        await onBeforeSubmit()
      } catch {
        // address save failure is non-fatal — address may already be saved
      }
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
      {submitting && <ProcessingOverlay />}
      <Button
        disabled={isDisabled || submitting}
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

// Zero-total orders (promo code covers full amount) — no payment session needed
const ZeroTotalPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
}: {
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    if (submitting) return
    setSubmitting(true)
    if (onBeforeSubmit) {
      try { await onBeforeSubmit() } catch { /* non-fatal */ }
    }
    await placeOrder()
      .catch((err) => {
        if (err?.message?.includes("409") || err?.message?.includes("conflicted") || err?.message?.includes("already being completed")) {
          return
        }
        setErrorMessage(err.message)
        setSubmitting(false)
      })
  }

  return (
    <>
      {submitting && <ProcessingOverlay />}
      <Button
        disabled={notReady || submitting}
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
    if (submitting) return
    setSubmitting(true)
    await placeOrder()
      .catch((err) => {
        // 409 = already being completed, treat as success
        if (err?.message?.includes("409") || err?.message?.includes("conflicted") || err?.message?.includes("already being completed")) {
          return
        }
        setErrorMessage(err.message)
        setSubmitting(false)
      })
  }

  return (
    <>
      {submitting && <ProcessingOverlay />}
      <Button
        disabled={notReady || submitting}
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
