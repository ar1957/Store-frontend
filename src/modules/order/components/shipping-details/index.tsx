/**
 * File: src/modules/order/components/shipping-details/index.tsx
 * Shows shipping address and method on order confirmation page
 * Fixes: correct address format, state instead of country, city/zip order
 */
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { Text } from "@medusajs/ui"

// Map state abbreviation back to full name for display
const ABBR_TO_STATE: Record<string, string> = {
  "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
  "CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia",
  "HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas",
  "KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts",
  "MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana",
  "NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico",
  "NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma",
  "OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina",
  "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
  "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming",
  "DC":"District of Columbia",
}

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

export default function ShippingDetails({ order }: ShippingDetailsProps) {
  const addr = order.shipping_address
  const method = order.shipping_methods?.at(-1)

  const stateName = addr?.province
    ? (ABBR_TO_STATE[addr.province.toUpperCase()] || addr.province)
    : null

  return (
    <div className="flex flex-col gap-y-2">
      <Text className="txt-medium-plus text-ui-fg-base font-semibold">Delivery</Text>
      <div className="flex items-start gap-x-8">

        {/* Shipping Address */}
        <div className="flex flex-col w-1/3" data-testid="shipping-address-summary">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Shipping Address</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {addr?.first_name} {addr?.last_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {addr?.address_1}{addr?.address_2 ? `, ${addr.address_2}` : ""}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {addr?.city}{stateName ? `, ${stateName}` : ""} {addr?.postal_code}
          </Text>
          {/* Country intentionally hidden — US only */}
        </div>

        {/* Contact */}
        <div className="flex flex-col w-1/3" data-testid="shipping-contact-summary">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Contact</Text>
          {addr?.phone && (
            <Text className="txt-medium text-ui-fg-subtle">{addr.phone}</Text>
          )}
          <Text className="txt-medium text-ui-fg-subtle">{order.email}</Text>
        </div>

        {/* Shipping Method */}
        <div className="flex flex-col w-1/3" data-testid="shipping-method-summary">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Method</Text>
          {method && (
            <Text className="txt-medium text-ui-fg-subtle">
              {method.name}{" "}
              {convertToLocale({
                amount: method.amount ?? 0,
                currency_code: order.currency_code,
              })}
            </Text>
          )}
        </div>

      </div>
    </div>
  )
}