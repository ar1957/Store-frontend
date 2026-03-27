"use client"

import { addToCart, retrieveCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import EligibilityModal from "@modules/products/components/eligibility-modal"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const DEFAULT_PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function getTenantPubKey(): string {
  if (typeof window === "undefined") return DEFAULT_PUB_KEY
  // Prefer key injected by server middleware (always correct for current tenant)
  if ((window as any).__TENANT_API_KEY__) return (window as any).__TENANT_API_KEY__
  return DEFAULT_PUB_KEY
}

// Session key for caching eligibility answers across products
const ELIGIBILITY_SESSION_KEY = "mhc_eligibility_data"

function getCachedEligibility(cartId?: string): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem(ELIGIBILITY_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // If cartId provided AND cache has a _cartId, validate they match
    // If cache has no _cartId (saved without cart), treat as valid only if no cartId check
    if (cartId && parsed._cartId && parsed._cartId !== cartId) {
      sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY)
      return null
    }
    // If cache has no _cartId but we have a cartId, update cache with cartId
    if (cartId && !parsed._cartId) {
      parsed._cartId = cartId
      sessionStorage.setItem(ELIGIBILITY_SESSION_KEY, JSON.stringify(parsed))
    }
    return parsed
  } catch { return null }
}

function setCachedEligibility(data: Record<string, any>, cartId?: string) {
  try {
    const toStore = cartId ? { ...data, _cartId: cartId } : data
    sessionStorage.setItem(ELIGIBILITY_SESSION_KEY, JSON.stringify(toStore))
  } catch {}
}

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  cartId?: string
  cartItemCount?: number
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  cartId: initialCartId,
  cartItemCount = 0,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("mhc_adding_to_cart") === "1"
  )

  // If we remounted on the product page with the flag set, it means navigation
  // was cancelled or failed — clear the lock so the button works again
  useEffect(() => {
    if (sessionStorage.getItem("mhc_adding_to_cart") === "1") {
      // Give router.push a moment to fire; if we're still here after 3s, clear it
      const t = setTimeout(() => {
        sessionStorage.removeItem("mhc_adding_to_cart")
        setIsAdding(false)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [])
  const [showEligibility, setShowEligibility] = useState(false)
  const [requiresEligibility, setRequiresEligibility] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [alreadyScreened, setAlreadyScreened] = useState(false)
  // True while either eligibility-check or cart-check is still in flight
  const [buttonReady, setButtonReady] = useState(false)

  const countryCode = (useParams().countryCode as string) || "us"

  // Get the domain for tenant detection
  // Prefer __TENANT_DOMAIN__ injected by middleware (correct for all clinics including new ones)
  // Fall back to window.location.hostname for local dev
  const domain = typeof window !== "undefined"
    ? ((window as any).__TENANT_DOMAIN__ || window.location.hostname + (window.location.port ? `:${window.location.port}` : ""))
    : "localhost:8000"

  // Run eligibility check and cart check in parallel, mark button ready when both done.
  // Until buttonReady is true the button stays disabled so the user can't click
  // "Add to cart" before we know it should say "Continue".
  useEffect(() => {
    let cancelled = false

    const checkEligibility = async (): Promise<{ needs: boolean; screened: boolean }> => {
      const pubKey = getTenantPubKey()
      const url = `/api/eligibility-check?domain=${encodeURIComponent(domain)}&productId=${encodeURIComponent(product.id)}`
      try {
        const res = await fetch(url, { headers: { "x-publishable-api-key": pubKey } })
        const data = await res.json()
        if (res.ok && data.requiresEligibility === true) {
          // Product needs eligibility — check cache while we're here
          const cached = getCachedEligibility(initialCartId || undefined)
          return { needs: true, screened: !!cached }
        }
        return { needs: false, screened: false }
      } catch {
        return { needs: false, screened: false }
      }
    }

    const checkCart = async (needs: boolean, screenedFromCache: boolean): Promise<boolean> => {
      // Cart check is only needed to detect stale cache after order placement.
      // If no cartId is available yet, trust the cache as-is.
      if (!needs || !screenedFromCache) return screenedFromCache
      if (!initialCartId) return screenedFromCache
      try {
        const res = await fetch(`/api/cart-check?cartId=${initialCartId}`, {
          headers: { "x-publishable-api-key": getTenantPubKey() },
        })
        if (!res.ok) {
          // Cart not found — likely a new session after order placement, clear cache
          sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY)
          return false
        }
        const data = await res.json()
        // Only clear cache if the cart explicitly doesn't exist (404-like).
        // An empty cart is fine — user may have answered eligibility but not added yet.
        // We only invalidate if the cart ID itself is gone (new cart after order).
        if (data.cartExists === false) {
          sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY)
          return false
        }
        return true
      } catch {
        return true // trust cache on network error
      }
    }

    const run = async () => {
      const { needs, screened: screenedFromCache } = await checkEligibility()
      if (cancelled) return
      const finalScreened = await checkCart(needs, screenedFromCache)
      if (cancelled) return
      setRequiresEligibility(needs)
      setAlreadyScreened(finalScreened)
      setEligibilityChecked(true)
      setButtonReady(true)
    }

    run()
    return () => { cancelled = true }
  }, [product.id, domain, initialCartId])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null
    if (params.get("v_id") === value) return
    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }
    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) return true
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Standard add to cart (used after eligibility is cleared)
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    // Guard against re-entry after revalidateTag causes component remount
    if (sessionStorage.getItem("mhc_adding_to_cart") === "1") return null
    sessionStorage.setItem("mhc_adding_to_cart", "1")
    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      router.push(`/${countryCode}/cart`)
      // don't clear the flag or stop spinner — navigation takes over
    } catch {
      sessionStorage.removeItem("mhc_adding_to_cart")
      setIsAdding(false)
    }
  }

  // Button click — show eligibility modal or add to cart directly
  const handleButtonClick = () => {
    if (requiresEligibility && !alreadyScreened) {
      setShowEligibility(true)
    } else if (requiresEligibility && alreadyScreened) {
      // Already screened — re-save cached eligibility to cart then add
      const cached = getCachedEligibility(initialCartId || undefined)
      if (cached) {
        handleEligibilityApproved(cached)
      } else {
        // Cache gone — show modal again
        setAlreadyScreened(false)
        setShowEligibility(true)
      }
    } else {
      handleAddToCart()
    }
  }

  // After eligibility modal completes — save answers to cart metadata then add to cart
  const handleEligibilityApproved = async (eligibilityData: Record<string, any>) => {
    setIsAdding(true)

    try {
      // 1. Add to cart first (creates cart if needed)
      await addToCart({
        variantId: selectedVariant!.id,
        quantity: 1,
        countryCode,
      })

      // 2. Use cart ID passed from server (via ProductActionsWrapper)
      // If not available yet (first ever cart), fetch it — retry a few times
      // since addToCart may need a moment to create and set the cookie
      let cartId = initialCartId
      if (!cartId) {
        // Cart cookie is httpOnly — must retrieve via server action, not client fetch
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(r => setTimeout(r, 800))
          try {
            const cart = await retrieveCart()
            if (cart?.id) {
              cartId = cart.id
              break
            }
          } catch {}
        }
      }

      if (!cartId) {
        // Cart was added but we can't get the ID — navigate to cart anyway
        // The item is in the cart, user can proceed from there
        console.warn("Could not retrieve cart ID after addToCart — navigating to cart anyway")
        router.push(`/${countryCode}/cart`)
        return
      }

      // 3. Save eligibility answers to cart metadata via proxy (avoids CORS)
      const res = await fetch(`/api/eligibility-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": getTenantPubKey(),
        },
        body: JSON.stringify({ eligibilityData, cartId }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error("Failed to save eligibility:", err)
      }

      // 4. Cache eligibility answers for this session (skip modal on next eligible product)
      setCachedEligibility(eligibilityData, cartId || undefined)

      // 5. Navigate directly to cart
      router.push(`/${countryCode}/cart`)
    } catch (e) {
      console.error("Error saving eligibility to cart:", e)
      router.push(`/${countryCode}/cart`)
    } finally {
      setIsAdding(false)
    }
  }

  const buttonLabel = useMemo(() => {
    if (!selectedVariant && !options) return "Select variant"
    if (!inStock || !isValidVariant) return "Out of stock"
    if (requiresEligibility && !alreadyScreened) return "Continue"
    return "Add to cart"
  }, [selectedVariant, options, inStock, isValidVariant, requiresEligibility, alreadyScreened])

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                  />
                </div>
              ))}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleButtonClick}
          disabled={
            !buttonReady ||
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding || !buttonReady}
          data-testid="add-product-button"
        >
          {buttonLabel}
        </Button>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleButtonClick}
          isAdding={isAdding || !buttonReady}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>

      {/* Eligibility Modal */}
      {showEligibility && (
        <EligibilityModal
          productId={product.id}
          productTitle={product.title ?? ""}
          clinicDomain={domain}
          onClose={() => setShowEligibility(false)}
          onApproved={handleEligibilityApproved}
        />
      )}
    </>
  )
}