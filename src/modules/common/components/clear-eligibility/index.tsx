/**
 * File: src/modules/common/components/clear-eligibility/index.tsx
 * Clears eligibility cache when order is confirmed
 */
"use client"
import { useEffect } from "react"

export default function ClearEligibility() {
  useEffect(() => {
    sessionStorage.removeItem("mhc_eligibility_data")
  }, [])
  return null
}