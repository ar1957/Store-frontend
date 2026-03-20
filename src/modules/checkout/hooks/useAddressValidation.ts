/**
 * useAddressValidation hook
 * File: src/modules/checkout/hooks/useAddressValidation.ts
 *
 * Validates US ZIP code matches the selected state using zippopotam.us (free, no key needed).
 * Also ensures state matches the eligibility-selected state from sessionStorage.
 */

import { useState, useCallback } from "react"

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

// Reverse map: abbr → full name
const ABBR_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([full, abbr]) => [abbr, full])
)

export interface AddressValidationResult {
  valid: boolean
  error: string | null
  city?: string       // auto-filled from ZIP lookup
  stateAbbr?: string  // confirmed state abbr
}

export function useAddressValidation() {
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<AddressValidationResult | null>(null)

  // Get the state the patient selected in eligibility modal
  // Guard with typeof window to avoid SSR issues
  const getEligibilityState = (): string | null => {
    if (typeof window === "undefined") return null
    try {
      const raw = sessionStorage.getItem("mhc_eligibility_data")
      if (!raw) return null
      const data = JSON.parse(raw)
      return data.state || null // full state name e.g. "Texas"
    } catch { return null }
  }

  const validateZipAndState = useCallback(async (
    zip: string,
    selectedStateAbbr: string  // e.g. "TX" — from Medusa's address form province field
  ): Promise<AddressValidationResult> => {
    // Basic ZIP format check
    if (!/^\d{5}$/.test(zip)) {
      const r = { valid: false, error: "Please enter a valid 5-digit ZIP code." }
      setResult(r)
      return r
    }

    setValidating(true)
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) {
        const r = { valid: false, error: "ZIP code not found. Please check your ZIP code." }
        setResult(r)
        return r
      }

      const data = await res.json()
      const zipStateAbbr: string = data.places?.[0]?.["state abbreviation"] || ""
      const zipCity: string = data.places?.[0]?.["place name"] || ""

      // 1. Check ZIP matches selected state
      if (zipStateAbbr.toUpperCase() !== selectedStateAbbr.toUpperCase()) {
        const zipStateName = ABBR_TO_STATE[zipStateAbbr] || zipStateAbbr
        const selectedStateName = ABBR_TO_STATE[selectedStateAbbr.toUpperCase()] || selectedStateAbbr
        const r = {
          valid: false,
          error: `This ZIP code belongs to ${zipStateName}, but you selected ${selectedStateName}. Please correct your state or ZIP code.`,
        }
        setResult(r)
        return r
      }

      // 2. Check ZIP state matches eligibility-selected state
      const eligibilityState = getEligibilityState()
      if (eligibilityState) {
        const eligibilityAbbr = STATE_ABBR[eligibilityState] || eligibilityState
        if (zipStateAbbr.toUpperCase() !== eligibilityAbbr.toUpperCase()) {
          const r = {
            valid: false,
            error: `Your address must be in ${eligibilityState} — the state you selected during eligibility screening.`,
          }
          setResult(r)
          return r
        }
      }

      const r = { valid: true, error: null, city: zipCity, stateAbbr: zipStateAbbr }
      setResult(r)
      return r
    } catch {
      // Network error — allow through with warning rather than blocking
      const r = { valid: true, error: null }
      setResult(r)
      return r
    } finally {
      setValidating(false)
    }
  }, [])

  const reset = () => setResult(null)

  return { validateZipAndState, validating, result, reset }
}