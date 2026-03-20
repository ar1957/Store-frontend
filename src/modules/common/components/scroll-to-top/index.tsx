/**
 * File: src/modules/common/components/scroll-to-top/index.tsx
 * Client component that scrolls to top on mount
 */
"use client"
import { useEffect } from "react"

export default function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])
  return null
}