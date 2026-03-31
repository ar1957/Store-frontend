import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import React, { useState, useEffect } from "react"
import { usePlacesWidget } from "react-google-autocomplete"

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
]

const BillingAddress = ({
  cart,
  onFormDataChange,
}: {
  cart: HttpTypes.StoreCart | null
  onFormDataChange?: (data: Record<string, string>) => void
}) => {
  const [formData, setFormData] = useState<any>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "us",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY || (typeof window !== "undefined" ? ((window as any).__GOOGLE_PLACES_KEY__ || "") : "")

  const { ref: placesRef } = usePlacesWidget({
    apiKey: googleKey || undefined,
    onPlaceSelected: (place: any) => {
      if (!place.address_components) return
      let num = "", route = "", city = "", state = "", zip = ""
      for (const c of place.address_components) {
        if (c.types.includes("street_number")) num = c.long_name
        if (c.types.includes("route")) route = c.short_name
        if (c.types.includes("locality")) city = c.long_name
        if (c.types.includes("administrative_area_level_1")) state = c.short_name
        if (c.types.includes("postal_code")) zip = c.long_name
      }
      const addr1 = (num + " " + route).trim()
      const newData = {
        ...formData,
        "billing_address.address_1": addr1,
        "billing_address.city": city,
        "billing_address.province": state,
        "billing_address.postal_code": zip,
      }
      setFormData(newData)
      onFormDataChange?.(newData)
    },
    options: {
      types: ["address"],
      componentRestrictions: { country: "us" },
    },
  })

  useEffect(() => {
    onFormDataChange?.(formData)
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const newData = { ...formData, [e.target.name]: e.target.value }
    setFormData(newData)
    onFormDataChange?.(newData)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <div className="flex flex-col w-full">
          <div className="flex relative z-0 w-full txt-compact-medium">
            <input
              ref={placesRef as any}
              name="billing_address.address_1"
              placeholder=" "
              autoComplete="off"
              value={formData["billing_address.address_1"]}
              onChange={handleChange}
              required
              data-testid="billing-address-input"
              className="pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover"
            />
            <label className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle">
              Address<span className="text-rose-500">*</span>
            </label>
          </div>
        </div>
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label="City"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
        />
        <input
          type="hidden"
          name="billing_address.country_code"
          value="us"
        />
        <div className="flex flex-col w-full">
          <select
            name="billing_address.province"
            autoComplete="address-level1"
            value={formData["billing_address.province"]}
            onChange={handleChange}
            required
            data-testid="billing-province-input"
            className="flex w-full appearance-none rounded-md border border-ui-border-base bg-ui-bg-field px-4 py-[10px] text-base text-ui-fg-base placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none"
          >
            <option value="">State *</option>
            {US_STATES.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>{name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress