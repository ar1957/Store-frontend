"use client"

import { isManual, isPaypal, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useContext, useState } from "react"
import ErrorMessage from "../error-message"
import { StripeContext, StripeContextValue } from "../payment-wrapper/stripe-wrapper"
import PayPalPaymentButton from "./paypal-payment-button"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
  disabled?: boolean
  noPaymentNeeded?: boolean
  onBeforeSubmit?: () => Promise<void>
  selectedPaymentMethod?: string
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
  selectedPaymentMethod,
}) => {
  const notReady = !cart || disabled

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

  // Use selectedPaymentMethod prop first (it's already validated against available methods)
  // Only fall back to session provider if no selectedPaymentMethod given
  const activeProvider = selectedPaymentMethod || paymentSession?.provider_id || ""

  if (isStripeLike(activeProvider)) {
    return (
      <StripePaymentButton
        notReady={notReady}
        cart={cart}
        data-testid={dataTestId}
        onBeforeSubmit={onBeforeSubmit}
      />
    )
  }

  if (isPaypal(activeProvider)) {
    // Only render PayPalPaymentButton when a PayPal session exists
    // (PayPalButtons requires PayPalScriptProvider which is only mounted when session exists)
    if (!paymentSession || !isPaypal(paymentSession.provider_id)) {
      return <Button disabled size="large" className="w-full">Setting up PayPal…</Button>
    }
    return (
      <PayPalPaymentButton
        notReady={notReady}
        cart={cart}
        data-testid={dataTestId}
        onBeforeSubmit={onBeforeSubmit}
      />
    )
  }
  if (isManual(activeProvider)) {
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
  const stripeCtx = useContext(StripeContext)

  // Don't render until inside Elements provider (context is false outside provider)
  if (!stripeCtx) {
    return <Button disabled size="large" className="w-full">Place order</Button>
  }

  return (
    <StripePaymentButtonInner
      cart={cart}
      notReady={notReady}
      data-testid={dataTestId}
      onBeforeSubmit={onBeforeSubmit}
      clientSecret={stripeCtx.clientSecret}
      paymentIntentId={stripeCtx.paymentIntentId}
    />
  )
}

const StripePaymentButtonInner = ({
  cart,
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
  clientSecret,
  paymentIntentId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
  clientSecret: string
  paymentIntentId: string | null
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stripe = useStripe()
  const elements = useElements()

  const isDisabled = !stripe || !elements || notReady

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch(async (err) => {
        // 409 = already being completed — order exists, redirect to orders page
        if (err?.message?.includes("409") || err?.message?.includes("conflicted") || err?.message?.includes("already being completed")) {
          await new Promise(r => setTimeout(r, 2000))
          const cc = cart.shipping_address?.country_code?.toLowerCase() || "us"
          window.location.href = `/${cc}/account/orders`
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
    if (!stripe || !elements || !cart) {
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

    // Submit the Elements form first (required for Payment Element)
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || "Payment failed")
      setSubmitting(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment_return=1`,
        payment_method_data: {
          billing_details: {
            name: `${cart.billing_address?.first_name ?? ""} ${cart.billing_address?.last_name ?? ""}`,
            email: cart.email ?? undefined,
          },
        },
      },
      redirect: "if_required",
    })

    if (error) {
      setErrorMessage(error.message || "Payment failed")
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
      // Mark the Medusa payment session as authorized using the per-clinic intent,
      // so authorizePaymentSessionsStep in cart.complete() skips global Stripe re-verification
      try {
        const authRes = await fetch("/api/mark-payment-authorized", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: cart.id, paymentIntentId }),
        })
        if (!authRes.ok) {
          const err = await authRes.json()
          setErrorMessage(err.message || "Failed to authorize payment")
          setSubmitting(false)
          return
        }
      } catch {
        setErrorMessage("Failed to authorize payment — please contact support")
        setSubmitting(false)
        return
      }
      onPaymentCompleted()
    }
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
      .catch(async (err) => {
        if (err?.message?.includes("409") || err?.message?.includes("conflicted") || err?.message?.includes("already being completed")) {
          await new Promise(r => setTimeout(r, 2000))
          window.location.href = "/us/account/orders"
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

// PayPal payment button — must be rendered inside PaypalWrapper (PayPalScriptProvider)
// Implemented in separate file to avoid hook-outside-provider errors
// const PayPalPaymentButton = ... (see paypal-payment-button.tsx)

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
