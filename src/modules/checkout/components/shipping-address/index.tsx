import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useRef, useState } from "react"
import AddressSelect from "../address-select"
import { usePlacesWidget } from "react-google-autocomplete"

const STATE_ABBR: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
}

const ABBR_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([full, abbr]) => [abbr.toLowerCase(), full])
)

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

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  onFieldChange,
  onFormDataChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  onFieldChange?: (field: string, value: string) => void
  onFormDataChange?: (data: Record<string, string>) => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "us",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || customer?.email || "",
  })

  const [zipError, setZipError] = useState<string | null>(null)
  const [zipValidating, setZipValidating] = useState(false)
  const [eligibilityState, setEligibilityState] = useState<string | null>(null)

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
      if (eligibilityState) {
        const eligAbbr = (STATE_ABBR[eligibilityState] || eligibilityState).toUpperCase()
        setZipError(state.toUpperCase() !== eligAbbr
          ? "Your address must be in " + eligibilityState + " - the state you selected during screening."
          : null)
      }
      setFormData(p => {
        const nd = { ...p, "shipping_address.address_1": addr1, "shipping_address.city": city, "shipping_address.province": state, "shipping_address.postal_code": zip }
        return nd
      })
      // Call parent callbacks AFTER setFormData, not inside it
      onFieldChange?.("address_1", addr1)
      onFormDataChange?.({ ...formData, "shipping_address.address_1": addr1, "shipping_address.city": city, "shipping_address.province": state, "shipping_address.postal_code": zip })
    },
    options: {
      types: ["address"],
      componentRestrictions: { country: "us" },
    },
  })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mhc_eligibility_data")
      const state = raw ? JSON.parse(raw)?.state || null : null
      setEligibilityState(state)
      if (state) {
        const abbr = STATE_ABBR[state] || ""
        if (abbr) setFormData(p => ({ ...p, "shipping_address.province": abbr }))
      }
    } catch {}
  }, [])

  const validateZip = async (zip: string, province: string) => {
    if (!/^\d{5}$/.test(zip)) { setZipError("Please enter a valid 5-digit ZIP code."); return }
    if (!province) return
    setZipValidating(true)
    try {
      const res = await fetch("https://api.zippopotam.us/us/" + zip)
      if (!res.ok) { setZipError("ZIP code not found."); return }
      const data = await res.json()
      const zipStateAbbr = (data.places?.[0]?.["state abbreviation"] || "").toLowerCase()
      const zipCity = data.places?.[0]?.["place name"] || ""
      const enteredAbbr = province.toLowerCase()
      if (zipStateAbbr && enteredAbbr && zipStateAbbr !== enteredAbbr) {
        const zipStateName = ABBR_TO_STATE[zipStateAbbr] || zipStateAbbr.toUpperCase()
        const enteredName = ABBR_TO_STATE[enteredAbbr] || enteredAbbr.toUpperCase()
        setZipError("This ZIP code is in " + zipStateName + ", but you entered " + enteredName + ". Please correct your state or ZIP.")
        return
      }
      if (eligibilityState) {
        const eligibilityAbbr = (STATE_ABBR[eligibilityState] || eligibilityState).toLowerCase()
        if (zipStateAbbr && zipStateAbbr !== eligibilityAbbr) {
          setZipError("Your address must be in " + eligibilityState + " - the state you selected during screening.")
          return
        }
      }
      setZipError(null)
      if (!formData["shipping_address.city"] && zipCity) {
        setFormData(p => ({ ...p, "shipping_address.city": zipCity }))
      }
    } catch {
      setZipError(null)
    } finally {
      setZipValidating(false)
    }
  }

  const countriesInRegion = useMemo(() => cart?.region?.countries?.map((c) => c.iso_2), [cart?.region])
  const addressesInRegion = useMemo(
    () => customer?.addresses.filter((a) => a.country_code && countriesInRegion?.includes(a.country_code)),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (address?: HttpTypes.StoreCartAddress, email?: string) => {
    address && setFormData((prev: Record<string, any>) => ({
      ...prev,
      "shipping_address.first_name": address?.first_name || prev["shipping_address.first_name"] || "",
      "shipping_address.last_name": address?.last_name || prev["shipping_address.last_name"] || "",
      "shipping_address.address_1": address?.address_1 || prev["shipping_address.address_1"] || "",
      "shipping_address.postal_code": prev["shipping_address.postal_code"] || "",
      "shipping_address.city": prev["shipping_address.city"] || "",
      "shipping_address.country_code": "us",
      "shipping_address.phone": address?.phone || prev["shipping_address.phone"] || "",
    }))
    email && setFormData((prev: Record<string, any>) => ({ ...prev, email }))
  }

  const hasInitialized = React.useRef(false)
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    if (cart && !cart.email && customer?.email) {
      setFormData(p => ({ ...p, email: customer.email! }))
    }
  }, [])

  useEffect(() => { onFormDataChange?.(formData) }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    setFormData(newData)
    onFieldChange?.(name.replace("shipping_address.", ""), value)
    onFormDataChange?.(newData)
    if (name === "shipping_address.province" || name === "shipping_address.postal_code") setZipError(null)
  }

  const handleZipBlur = () => {
    const zip = formData["shipping_address.postal_code"]
    const province = formData["shipping_address.province"]
    if (zip) validateZip(zip, province)
  }

  return (
    <>
      {eligibilityState && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
          Your shipping address must be in <strong>{eligibilityState}</strong> - the state you selected during screening.
        </div>
      )}

      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">{`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}</p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={mapKeys(formData, (_, key) => key.replace("shipping_address.", "")) as HttpTypes.StoreCartAddress}
            onSelect={setFormAddress}
          />
        </Container>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" name="shipping_address.first_name" autoComplete="given-name" value={formData["shipping_address.first_name"]} onChange={handleChange} required data-testid="shipping-first-name-input" />
        <Input label="Last name" name="shipping_address.last_name" autoComplete="family-name" value={formData["shipping_address.last_name"]} onChange={handleChange} required data-testid="shipping-last-name-input" />
        <div className="flex flex-col w-full">
          <div className="flex relative z-0 w-full txt-compact-medium">
            <input
              ref={placesRef as any}
              name="shipping_address.address_1"
              placeholder=" "
              autoComplete="off"
              value={formData["shipping_address.address_1"]}
              onChange={handleChange}
              required
              data-testid="shipping-address-input"
              className="pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover"
            />
            <label className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle">
              Address<span className="text-rose-500">*</span>
            </label>
          </div>
        </div>
        <Input label="City" name="shipping_address.city" autoComplete="address-level2" value={formData["shipping_address.city"]} onChange={handleChange} required data-testid="shipping-city-input" />
        <div className="flex flex-col">
          <Input label="ZIP Code" name="shipping_address.postal_code" autoComplete="postal-code" value={formData["shipping_address.postal_code"]} onChange={handleChange} onBlur={handleZipBlur} required data-testid="shipping-postal-code-input" />
          {zipValidating && <p className="text-xs text-gray-400 mt-1">Validating ZIP...</p>}
          {zipError && <p className="text-xs text-red-500 mt-1">{zipError}</p>}
        </div>
        <input type="hidden" name="shipping_address.country_code" value="us" />
        <div className="flex flex-col w-full">
          <input type="hidden" name="shipping_address.province" value={formData["shipping_address.province"]} />
          {eligibilityState ? (
            <div className="flex w-full rounded-md border border-ui-border-base bg-ui-bg-field-component px-4 py-[10px] text-base text-ui-fg-base">
              <span className="text-ui-fg-muted text-sm mr-2">State</span>
              <span className="font-medium">{eligibilityState}</span>
              <span className="ml-auto text-xs text-ui-fg-muted">locked from screening</span>
            </div>
          ) : (
            <select autoComplete="address-level1" value={formData["shipping_address.province"]} onChange={e => setFormData(p => ({ ...p, "shipping_address.province": e.target.value }))} required data-testid="shipping-province-input" className="flex w-full appearance-none rounded-md border border-ui-border-base bg-ui-bg-field px-4 py-[10px] text-base text-ui-fg-base placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none">
              <option value="">State *</option>
              {US_STATES.map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="my-8">
        <Checkbox label="Billing address same as shipping address" name="same_as_billing" checked={checked} onChange={onChange} data-testid="billing-address-checkbox" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input label="Email" name="email" type="email" title="Enter a valid email address." autoComplete="email" value={formData.email} onChange={handleChange} required data-testid="shipping-email-input" />
        <Input label="Phone" name="shipping_address.phone" autoComplete="tel" value={formData["shipping_address.phone"]} onChange={handleChange} data-testid="shipping-phone-input" />
      </div>
    </>
  )
}

export default ShippingAddress
