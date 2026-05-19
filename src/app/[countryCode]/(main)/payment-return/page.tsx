"use client"

/**
 * /[countryCode]/payment-return
 *
 * Dedicated landing page for Stripe/Klarna redirect returns.
 * Stripe appends ?payment_intent=pi_xxx&payment_intent_client_secret=...
 * to the return_url after the customer completes payment externally.
 *
 * This page:
 * 1. Reads the payment_intent from the URL
 * 2. Calls our backend to find the cart and complete it
 * 3. Redirects to the order confirmed page on success
 * 4. Shows a clear error with retry option on failure
 */

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent")
    const redirectStatus = searchParams.get("redirect_status")
    const cartId = searchParams.get("cart_id") // backup in case PI metadata lookup fails

    if (!paymentIntent) {
      setStatus("error")
      setMessage("No payment information found. Please contact support.")
      return
    }

    // Klarna sets redirect_status=succeeded on success
    if (redirectStatus && redirectStatus !== "succeeded") {
      setStatus("error")
      setMessage(`Payment was not completed (status: ${redirectStatus}). You have not been charged. Please try again.`)
      return
    }

    completeOrder(paymentIntent, cartId || undefined)
  }, [])

  const completeOrder = async (paymentIntentId: string, cartId?: string, attempt = 1) => {
    try {
      const res = await fetch("/api/complete-by-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, cartId }),
      })

      // 409 = already being completed — retry after delay
      if (res.status === 409) {
        if (attempt < 4) {
          await new Promise(r => setTimeout(r, 2000))
          return completeOrder(paymentIntentId, cartId, attempt + 1)
        }
        setStatus("error")
        setMessage("Your order is taking longer than expected. Please check your email for confirmation or contact support.")
        return
      }

      const data = await res.json()

      if (data.type === "order" && data.order?.id) {
        setStatus("success")
        // Redirect to order confirmed page
        const countryCode = window.location.pathname.split("/")[1] || "us"
        window.location.href = `/${countryCode}/order/${data.order.id}/confirmed`
        return
      }

      setStatus("error")
      setMessage("Your payment was received but we could not create your order. Please contact support with your payment confirmation.")
    } catch (err: any) {
      setStatus("error")
      setMessage("A network error occurred. Please contact support — your payment may have been processed.")
    }
  }

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        padding: "48px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}>
        {status === "processing" && (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "4px solid #e5e7eb",
              borderTopColor: "#111",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 24px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#111" }}>
              Completing your order…
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              Your payment was received. Please wait while we finalize your order.
              Do not close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 28,
            }}>
              ✓
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#065f46" }}>
              Order confirmed!
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Redirecting you to your order…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 28,
            }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#dc2626" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
              {message}
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#111",
                color: "#fff",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Return to Home
            </a>
          </>
        )}
      </div>
    </div>
  )
}
