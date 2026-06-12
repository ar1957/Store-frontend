import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { useContext, useState, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { PaymentElement } from "@stripe/react-stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="justify-self-end text-ui-fg-base">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export interface AuthorizeNetCardData {
  cardNumber: string
  month: string
  year: string
  cardCode: string
}

export const AuthorizeNetCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  onCardDataChange,
}: Omit<PaymentContainerProps, "children"> & {
  onCardDataChange: (data: AuthorizeNetCardData) => void
}) => {
  const [card, setCard] = useState<AuthorizeNetCardData>({ cardNumber: "", month: "", year: "", cardCode: "" })

  const update = (field: keyof AuthorizeNetCardData, value: string) => {
    const next = { ...card, [field]: value }
    setCard(next)
    onCardDataChange(next)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    background: "#fff",
  }

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>Card number</label>
            <input
              style={inputStyle}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              value={card.cardNumber}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                const formatted = v.match(/.{1,4}/g)?.join(" ") || v
                update("cardNumber", formatted)
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>Month</label>
              <input
                style={inputStyle}
                placeholder="MM"
                maxLength={2}
                value={card.month}
                onChange={e => update("month", e.target.value.replace(/\D/g, "").slice(0, 2))}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>Year</label>
              <input
                style={inputStyle}
                placeholder="YYYY"
                maxLength={4}
                value={card.year}
                onChange={e => update("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>CVV</label>
              <input
                style={inputStyle}
                placeholder="123"
                maxLength={4}
                value={card.cardCode}
                onChange={e => update("cardCode", e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
        </div>
      )}
    </PaymentContainer>
  )
}

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <PaymentElement
              options={{ layout: "tabs" }}
              onChange={(e) => {
                setCardComplete(e.complete)
                setError(null)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
