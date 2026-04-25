"use client"

import { isManual, isPaypal, isStripeLike } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useContext, useState } from "react"
import ErrorMessage from "../error-message"
import { StripeContext, StripeContextValue } from "../payment-wrapper/stripe-wrapper"
import PayPalPaymentButton from "./paypal-payment-button"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

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
        cart={cart}
      />
    )
  }

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

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
      <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} cart={cart} />
    )
  }

  return <Button disabled size="large" className="w-full">Select a payment method</Button>
}

/**
 * Calls our custom /store/clinics/complete-cart endpoint instead of the
 * standard Medusa cart.complete(). This bypasses authorizePaymentSessionsStep
 * which would re-validate the PaymentIntent using the global STRIPE_API_KEY —
 * the wrong Stripe account for per-clinic payments.
 */
async function completeCartViaClinicEndpoint(cartId: string): Promise<{ type: string; order?: any }> {
  const res = await fetch(`${BACKEND_URL}/store/clinics/complete-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUB_KEY,
    },
    body: JSON.stringify({ cartId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(err.message || `complete-cart failed with status ${res.status}`)
  }
  return res.json()
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

  const onPaymentCompleted = async (cartId: string) => {
    try {
      const result = await completeCartViaClinicEndpoint(cartId)
      if (result?.type === "order" && result.order) {
        const countryCode = result.order.shipping_address?.country_code?.toLowerCase() || "us"
        // Remove the cart cookie so next session starts fresh
        document.cookie = "_medusa_cart_id=; max-age=0; path=/"
        window.location.href = `/${countryCode}/order/${result.order.id}/confirmed`
        return
      }
      // Fallback — shouldn't happen
      setErrorMessage("Order created but could not redirect. Please check your email.")
      setSubmitting(false)
    } catch (err: any) {
      // 409 = already being completed
      if (err?.message?.includes("409") || err?.message?.includes("already")) {
        await new Promise(r => setTimeout(r, 2000))
        const cc = cart.shipping_address?.country_code?.toLowerCase() || "us"
        window.location.href = `/${cc}/account/orders`
        return
      }
      setErrorMessage(err.message || "Failed to complete order")
      setSubmitting(false)
    }
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
        // address save failure is non-fatal
      }
    }

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

      // Use our custom endpoint instead of cart.complete() to avoid
      // Medusa re-validating the PaymentIntent with the wrong Stripe key
      await onPaymentCompleted(cart.id)
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

const ZeroTotalPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
  cart,
}: {
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
  cart: HttpTypes.StoreCart
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    if (submitting) return
    setSubmitting(true)
    if (onBeforeSubmit) {
      try { await onBeforeSubmit() } catch { /* non-fatal */ }
    }
    try {
      const result = await completeCartViaClinicEndpoint(cart.id)
      if (result?.type === "order" && result.order) {
        const countryCode = result.order.shipping_address?.country_code?.toLowerCase() || "us"
        document.cookie = "_medusa_cart_id=; max-age=0; path=/"
        window.location.href = `/${countryCode}/order/${result.order.id}/confirmed`
        return
      }
      setErrorMessage("Order created but could not redirect.")
      setSubmitting(false)
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.message?.includes("already")) {
        await new Promise(r => setTimeout(r, 2000))
        window.location.href = "/us/account/orders"
        return
      }
      setErrorMessage(err.message)
      setSubmitting(false)
    }
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
  cart,
}: {
  notReady: boolean
  "data-testid"?: string
  cart: HttpTypes.StoreCart
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await completeCartViaClinicEndpoint(cart.id)
      if (result?.type === "order" && result.order) {
        const countryCode = result.order.shipping_address?.country_code?.toLowerCase() || "us"
        document.cookie = "_medusa_cart_id=; max-age=0; path=/"
        window.location.href = `/${countryCode}/order/${result.order.id}/confirmed`
        return
      }
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.message?.includes("already")) return
      setErrorMessage(err.message)
      setSubmitting(false)
    }
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
