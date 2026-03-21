/**
 * Single-page checkout
 * File: src/modules/checkout/components/single-page-checkout/index.tsx
 */
"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession, setShippingMethod, saveShippingAddress, retrieveCart } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, useToggleState } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentButton from "@modules/checkout/components/payment-button"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import { StripeCardContainer } from "@modules/checkout/components/payment-container"
import MedusaRadio from "@modules/common/components/radio"
import ShippingAddress from "@modules/checkout/components/shipping-address"
import BillingAddress from "@modules/checkout/components/billing_address"
import compareAddresses from "@lib/util/compare-addresses"
import { useEffect, useRef, useState } from "react"

type Props = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  availableShippingMethods: HttpTypes.StoreCartShippingOption[]
  availablePaymentMethods: any[]
}

export default function SinglePageCheckout({
  cart,
  customer,
  availableShippingMethods,
  availablePaymentMethods,
}: Props) {

  // ── Address ────────────────────────────────────────────────────────
  const addressFormRef = useRef<HTMLFormElement>(null)

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  // Track address fields for completeness check
  const [addressFields, setAddressFields] = useState({
    first_name: cart.shipping_address?.first_name || "",
    last_name: cart.shipping_address?.last_name || "",
    address_1: cart.shipping_address?.address_1 || "",
    email: cart.email || "",
  })

  const addressComplete = !!(
    (cart.shipping_address?.first_name || addressFields.first_name) &&
    (cart.shipping_address?.address_1 || addressFields.address_1) &&
    (cart.email || addressFields.email)
  )

  // ── Shipping ───────────────────────────────────────────────────────
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  useEffect(() => {
    setIsLoadingPrices(true)
    const promises = availableShippingMethods
      .filter(sm => sm.price_type === "calculated")
      .map(sm => calculatePriceForShippingOption(sm.id, cart.id))
    if (promises.length) {
      Promise.allSettled(promises).then(res => {
        const map: Record<string, number> = {}
        res.filter(r => r.status === "fulfilled")
           .forEach((p: any) => (map[p.value?.id || ""] = p.value?.amount))
        setCalculatedPricesMap(map)
        setIsLoadingPrices(false)
      })
    } else {
      setIsLoadingPrices(false)
    }
  }, [])

  const handleSetShipping = async (id: string) => {
    setShippingError(null)
    setShippingLoading(true)
    setShippingMethodId(id)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .then(() => retrieveCart(undefined, "*shipping_methods").then(fc => { if (fc) setLiveCart(prev => ({ ...prev, shipping_methods: fc.shipping_methods })) }))
      .catch(err => setShippingError(err.message))
      .finally(() => setShippingLoading(false))
  }

  // ── Payment ────────────────────────────────────────────────────────
  const [liveCart, setLiveCart] = useState<HttpTypes.StoreCart>(cart)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const activeSession = liveCart.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? availablePaymentMethods[0]?.id ?? ""
  )
  const [cardComplete, setCardComplete] = useState(false)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const paymentInitialized = useRef(false)
  useEffect(() => {
    if (paymentInitialized.current) return
    if (activeSession) { paymentInitialized.current = true; return }
    if (!selectedPaymentMethod || !isStripeLike(selectedPaymentMethod)) return
    paymentInitialized.current = true
    setPaymentLoading(true)
    initiatePaymentSession(liveCart, { provider_id: selectedPaymentMethod })
      .then(() => retrieveCart(
        undefined,
        "*payment_collection, *payment_collection.payment_sessions, *shipping_methods"
      ))
      .then((freshCart) => { if (freshCart) setLiveCart(freshCart) })
      .catch(() => {})
      .finally(() => setPaymentLoading(false))
  }, [])

  const handlePaymentMethod = async (method: string) => {
    setPaymentError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      setPaymentLoading(true)
      await initiatePaymentSession(liveCart, { provider_id: method })
        .catch(err => { setPaymentError(err.message); return null })
      const freshCart = await retrieveCart(
        undefined,
        "*payment_collection, *payment_collection.payment_sessions, *shipping_methods"
      ).catch(() => null)
      if (freshCart) setLiveCart(freshCart)
      setPaymentLoading(false)
    }
  }

  // ── Consent ────────────────────────────────────────────────────────
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentPrivacy, setConsentPrivacy] = useState(false)

  const cartAny = liveCart as any
  const paidByGiftcard = cartAny?.gift_cards?.length > 0 && cartAny?.total === 0

  const canPlaceOrder =
    addressComplete &&
    (liveCart.shipping_methods?.length ?? 0) > 0 &&
    (paidByGiftcard || (activeSession && (isStripeLike(selectedPaymentMethod) ? cardComplete : true))) &&
    consentTerms &&
    consentPrivacy

  return (
    <PaymentWrapper cart={liveCart}>
    <div className="w-full flex flex-col gap-y-8">

      {/* ── SECTION 1: Shipping Address ── */}
      <section className="bg-white">
        <h2 className="text-3xl-regular font-semibold mb-6">Shipping Address</h2>
        <form ref={addressFormRef}>
        <ShippingAddress
          customer={customer}
          checked={sameAsBilling}
          onChange={toggleSameAsBilling}
          cart={cart}
          onFieldChange={(field: string, value: string) =>
            setAddressFields(p => ({ ...p, [field]: value }))
          }
        />
        {!sameAsBilling && (
          <div className="mt-8">
            <h2 className="text-3xl-regular font-semibold pb-6">Billing Address</h2>
            <BillingAddress cart={cart} />
          </div>
        )}
        </form>
        <hr className="mt-8" />
      </section>

      {/* ── SECTION 2: Shipping Method ── */}
      <section className="bg-white">
        <h2 className="text-3xl-regular font-semibold mb-2">Delivery Method</h2>
        <p className="text-ui-fg-muted text-sm mb-6">How would you like your order delivered?</p>
        <RadioGroup value={shippingMethodId} onChange={v => v && handleSetShipping(v)}>
          {availableShippingMethods.map(option => {
            const isDisabled =
              option.price_type === "calculated" &&
              !isLoadingPrices &&
              typeof calculatedPricesMap[option.id] !== "number"
            return (
              <Radio
                key={option.id}
                value={option.id}
                disabled={isDisabled}
                className={clx(
                  "flex items-center justify-between cursor-pointer py-4 border rounded-lg px-6 mb-2 hover:shadow-borders-interactive-with-active",
                  {
                    "border-ui-border-interactive bg-ui-bg-field-component": option.id === shippingMethodId,
                    "cursor-not-allowed opacity-50": isDisabled,
                  }
                )}
              >
                <div className="flex items-center gap-x-4">
                  <MedusaRadio checked={option.id === shippingMethodId} />
                  <span>{option.name}</span>
                </div>
                <span className="font-medium">
                  {option.price_type === "flat" ? (
                    convertToLocale({ amount: option.amount!, currency_code: cart.currency_code })
                  ) : calculatedPricesMap[option.id] ? (
                    convertToLocale({ amount: calculatedPricesMap[option.id], currency_code: cart.currency_code })
                  ) : isLoadingPrices ? <Loader /> : "-"}
                </span>
              </Radio>
            )
          })}
        </RadioGroup>
        {shippingError && <ErrorMessage error={shippingError} />}
        <hr className="mt-8" />
      </section>

      {/* ── SECTION 3: Payment ── */}
      <section className="bg-white">
        <h2 className="text-3xl-regular font-semibold mb-6">Payment</h2>
          {paymentLoading ? (
            <div className="w-full h-24 flex items-center justify-center border rounded-lg bg-gray-50 border-dashed">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-medium">Setting up payment...</p>
              </div>
            </div>
          ) : (
            <>
              {!paidByGiftcard && availablePaymentMethods.length > 0 && (
                <RadioGroup value={selectedPaymentMethod} onChange={handlePaymentMethod}>
                  {availablePaymentMethods.map(method => (
                    <div key={method.id}>
                      {isStripeLike(method.id) ? (
                        <StripeCardContainer
                          paymentProviderId={method.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                          paymentInfoMap={paymentInfoMap}
                          setCardBrand={setCardBrand}
                          setError={setPaymentError}
                          setCardComplete={setCardComplete}
                        />
                      ) : (
                        <div
                          className={clx(
                            "flex items-center gap-x-4 cursor-pointer py-4 border rounded-lg px-6 mb-2",
                            { "border-ui-border-interactive": method.id === selectedPaymentMethod }
                          )}
                          onClick={() => handlePaymentMethod(method.id)}
                        >
                          <MedusaRadio checked={method.id === selectedPaymentMethod} />
                          <span>{paymentInfoMap[method.id]?.title || method.id}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}
              {paidByGiftcard && <p className="text-ui-fg-subtle text-sm">Paying with gift card</p>}
            </>
          )}
        {paymentError && <ErrorMessage error={paymentError} />}
        <hr className="mt-8" />
      </section>

      {/* ── SECTION 4: Consent + Place Order ── */}
      <section className="bg-white pb-8">
        <p className="text-sm text-ui-fg-muted mb-6">
          Your personal data will be used to process your order, support your experience
          throughout this website, and for other purposes described in our{" "}
          <a href="/privacy-policy" className="text-ui-fg-interactive hover:underline">privacy policy</a>.
        </p>

        <div className="flex flex-col gap-y-4 mb-6">
          <label className="flex items-start gap-x-3 cursor-pointer">
            <input type="checkbox" checked={consentTerms}
              onChange={e => setConsentTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-ui-fg-interactive flex-shrink-0" />
            <span className="text-sm text-ui-fg-base">
              I have read and agree to the website{" "}
              <a href="/terms" className="text-ui-fg-interactive hover:underline">terms and conditions</a>{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <label className="flex items-start gap-x-3 cursor-pointer">
            <input type="checkbox" checked={consentPrivacy}
              onChange={e => setConsentPrivacy(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-ui-fg-interactive flex-shrink-0" />
            <span className="text-sm text-ui-fg-base">
              I consent to the{" "}
              <a href="/privacy-policy" className="text-ui-fg-interactive hover:underline">privacy policy</a>,{" "}
              <a href="/telehealth" className="text-ui-fg-interactive hover:underline">telehealth</a>,{" "}
              <a href="/terms" className="text-ui-fg-interactive hover:underline">terms and conditions</a>,{" "}
              <a href="/purchase-terms" className="text-ui-fg-interactive hover:underline">purchase terms</a>,{" "}
              <a href="/glp1-waiver" className="text-ui-fg-interactive hover:underline">GLP-1 treatment laboratory testing waiver</a>, and{" "}
              <a href="/shipping-policy" className="text-ui-fg-interactive hover:underline">shipping, refund and return policy</a>.
            </span>
          </label>
        </div>

        {!canPlaceOrder && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="font-medium mb-1">Before placing your order, please complete:</p>
            <ul className="list-disc list-inside space-y-1">
              {!addressComplete && <li>Shipping address</li>}
              {(liveCart.shipping_methods?.length ?? 0) === 0 && <li>Delivery method</li>}
              {!paidByGiftcard && !activeSession && <li>Payment details</li>}
              {isStripeLike(selectedPaymentMethod) && !cardComplete && activeSession && <li>Card details</li>}
              {!consentTerms && <li>Accept terms and conditions</li>}
              {!consentPrivacy && <li>Consent to privacy policy and telehealth terms</li>}
            </ul>
          </div>
        )}

        <div className={!canPlaceOrder ? "opacity-50 pointer-events-none" : ""}>
          {activeSession ? (
            <PaymentButton
              cart={liveCart}
              data-testid="submit-order-button"
              onBeforeSubmit={async () => {
                if (addressFormRef.current) {
                  const formData = new FormData(addressFormRef.current)
                  if (sameAsBilling) formData.set("same_as_billing", "on")
                  await saveShippingAddress(formData)
                }
              }}
            />
            ) : (
            <button disabled className="w-full rounded-lg bg-gray-300 text-white py-3 font-semibold cursor-not-allowed">
              Place order
            </button>
          )}
        </div>
      </section>

    </div>
    </PaymentWrapper>
  )
}