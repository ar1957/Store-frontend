"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { useAuthorizeNet } from "../payment-wrapper/authorizenet-wrapper"

interface AuthorizeNetPaymentButtonProps {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
  onBeforeSubmit?: () => Promise<void>
  cardData: {
    cardNumber: string
    month: string
    year: string
    cardCode: string
  }
  onCardError?: (msg: string) => void
}

async function completeCartViaClinicEndpoint(cartId: string): Promise<{ type: string; order?: any }> {
  const res = await fetch("/api/complete-cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(err.message || `complete-cart failed with status ${res.status}`)
  }
  return res.json()
}

const AuthorizeNetPaymentButton: React.FC<AuthorizeNetPaymentButtonProps> = ({
  cart,
  notReady,
  "data-testid": dataTestId,
  onBeforeSubmit,
  cardData,
  onCardError,
}) => {
  const config = useAuthorizeNet()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDisabled = notReady || !config || !cardData.cardNumber || !cardData.month || !cardData.year || !cardData.cardCode

  const handlePayment = async () => {
    if (submitting || !config) return
    setSubmitting(true)
    setErrorMessage(null)

    if (onBeforeSubmit) {
      try { await onBeforeSubmit() } catch {}
    }

    try {
      const domain = (window as any).__TENANT_DOMAIN__ || window.location.hostname
      const cartTotal = Math.round(((cart as any)?.total ?? 0) * 100)
      const isHttps = window.location.protocol === "https:"

      let chargeBody: Record<string, any> = {
        domain,
        amount: cartTotal,
        currency: cart.currency_code || "usd",
        cartId: cart.id,
      }

      if (isHttps && window.Accept) {
        // 1a. Production path — tokenize via Accept.js
        const opaqueData = await new Promise<{ dataDescriptor: string; dataValue: string }>((resolve, reject) => {
          const secureData = {
            authData: { clientKey: config.publicClientKey, apiLoginID: config.apiLoginId },
            cardData: {
              cardNumber: cardData.cardNumber.replace(/\s/g, ""),
              month: cardData.month,
              year: cardData.year,
              cardCode: cardData.cardCode,
            },
          }
          window.Accept.dispatchData(secureData, (response: any) => {
            if (response.messages.resultCode === "Error") {
              reject(new Error(response.messages.message?.[0]?.text || "Card tokenization failed"))
            } else {
              resolve(response.opaqueData)
            }
          })
        })
        chargeBody.opaqueDataDescriptor = opaqueData.dataDescriptor
        chargeBody.opaqueDataValue = opaqueData.dataValue
      } else {
        // 1b. Sandbox / local dev path — send raw card data to backend directly
        chargeBody.cardNumber = cardData.cardNumber
        chargeBody.cardMonth = cardData.month
        chargeBody.cardYear = cardData.year
        chargeBody.cardCode = cardData.cardCode
      }

      // 2. Send to backend to charge
      const chargeRes = await fetch("/api/create-authorizenet-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chargeBody),
      })

      if (!chargeRes.ok) {
        const err = await chargeRes.json().catch(() => ({ message: "Charge failed" }))
        setErrorMessage(err.message || "Payment failed")
        setSubmitting(false)
        return
      }

      // 3. Complete the cart → create order
      const result = await completeCartViaClinicEndpoint(cart.id)
      if (result?.type === "order" && result.order?.id) {
        const countryCode = result.order.shipping_address?.country_code?.toLowerCase() || "us"
        window.location.href = `/${countryCode}/order/${result.order.id}/confirmed`
        return
      }

      // Retry once
      await new Promise(r => setTimeout(r, 1500))
      const retry = await completeCartViaClinicEndpoint(cart.id).catch(() => null)
      if (retry?.type === "order" && retry.order?.id) {
        const cc = retry.order.shipping_address?.country_code?.toLowerCase() || "us"
        window.location.href = `/${cc}/order/${retry.order.id}/confirmed`
        return
      }

      setErrorMessage("Order created but could not redirect. Please check your email.")
      setSubmitting(false)
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.message?.includes("already")) {
        await new Promise(r => setTimeout(r, 2000))
        const cc = cart.shipping_address?.country_code?.toLowerCase() || "us"
        window.location.href = `/${cc}/account/orders`
        return
      }
      setErrorMessage(err.message || "Payment failed")
      setSubmitting(false)
    }
  }

  return (
    <>
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

export default AuthorizeNetPaymentButton
