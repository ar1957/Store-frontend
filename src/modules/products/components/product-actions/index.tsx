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

// Tenant key map — mirrors tenants.ts so client-side fetches use correct key
const TENANT_KEYS: Record<string, string> = {
  "localhost:8000":                  "pk_0d04e5f39f21233de48aae0826522a81a13223024535549c62bdeca3a904b54d",
  "spaderx.local:8000":             "pk_c05a977ce3aa7edbe18eb8627d240cc79e3b85a56a77758e5852fe419a796d9b",
  "spaderx.com":                    "pk_c05a977ce3aa7edbe18eb8627d240cc79e3b85a56a77758e5852fe419a796d9b",
  "myclassywellness.local:8000":    "pk_9b161fb22ef604acba9c3a9f5559297c57f1de3dba630653e356157984961374",
  "myclassywellness.com":           "pk_9b161fb22ef604acba9c3a9f5559297c57f1de3dba630653e356157984961374",
  "contour-wellness.local:8000":    "pk_f034439d37fa0d6da706d0eccd8ce5499532b67ba17af9bdf64fefe864abefdb",
  "contour-wellness.com":           "pk_f034439d37fa0d6da706d0eccd8ce5499532b67ba17af9bdf64fefe864abefdb",
}

function getTenantPubKey(): string {
  if (typeof window === "undefined") return DEFAULT_PUB_KEY
  // Prefer key injected by server middleware (always correct)
  if ((window as any).__TENANT_API_KEY__) return (window as any).__TENANT_API_KEY__
  // Fallback to hardcoded map
  return TENANT_KEYS[window.location.host] || DEFAULT_PUB_KEY
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
  const [isAdding, setIsAdding] = useState(false)
  const [showEligibility, setShowEligibility] = useState(false)
  const [requiresEligibility, setRequiresEligibility] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [alreadyScreened, setAlreadyScreened] = useState(false)

  const countryCode = (useParams().countryCode as string) || "us"

  // Get the domain for tenant detection
  const domain = typeof window !== "undefined"
    ? window.location.hostname + (window.location.port ? `:${window.location.port}` : "")
    : "localhost:8000"

  // Single cart check that handles all cases:
  // 1. No cartId yet (SSR) — wait, do nothing
  // 2. Cart has items — validate cache against cartId, set alreadyScreened
  // 3. Cart empty or not found — clear cache
  useEffect(() => {
    if (!initialCartId) return
    const checkCart = async () => {
      try {
        const res = await fetch(`${BACKEND}/store/carts/${initialCartId}`, {
          headers: { "x-publishable-api-key": getTenantPubKey() },
          credentials: "include",
        })
        if (!res.ok) {
          // Cart gone (order placed) — clear cache
          sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY)
          setAlreadyScreened(false)
          setEligibilityChecked(false)
        } else {
          const data = await res.json()
          const itemCount = data.cart?.items?.length ?? 0
          if (itemCount === 0) {
            // Empty cart — clear cache
            sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY)
            setAlreadyScreened(false)
            setEligibilityChecked(false)
          } else {
            // Cart has items — check if cache is valid for this cart
            const cached = getCachedEligibility(initialCartId)
            setAlreadyScreened(!!cached)
          }
        }
      } catch {}
    }
    checkCart()
  }, [initialCartId])

  // Check if this product requires eligibility screening
  useEffect(() => {
    if (eligibilityChecked) return
    const checkEligibility = async () => {
      try {
        const res = await fetch(
          `${BACKEND}/store/eligibility/check?domain=${domain}&productId=${product.id}`,
          { headers: { "x-publishable-api-key": getTenantPubKey() } }
        )
        if (res.ok) {
          const data = await res.json()
          const needs = data.requiresEligibility === true
          setRequiresEligibility(needs)
          if (needs && getCachedEligibility(initialCartId || undefined)) {
            setAlreadyScreened(true)
          }
        }
      } catch {
        setRequiresEligibility(false)
      } finally {
        setEligibilityChecked(true)
      }
    }
    checkEligibility()
  }, [product.id, domain, eligibilityChecked])

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
    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      router.push(`/${countryCode}/cart`)
    } finally {
      setIsAdding(false)
    }
  }

  // Button click — show eligibility modal or add to cart directly
  const handleButtonClick = () => {
    if (requiresEligibility && !alreadyScreened) {
      setShowEligibility(true)
    } else if (requiresEligibility && alreadyScreened) {
      // Already screened — just add to cart directly, no need to re-save metadata
      handleAddToCart()
    } else {
      handleAddToCart()
    }
  }

  // After eligibility modal completes — save answers to cart metadata then add to cart
  const handleEligibilityApproved = async (eligibilityData: Record<string, any>) => {
    setShowEligibility(false)
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
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 500))
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
        console.error("Could not retrieve cart ID")
        router.push(`/${countryCode}/cart`)
        return
      }

      // 3. Save eligibility answers to cart metadata via backend
      const res = await fetch(`${BACKEND}/store/carts/eligibility-metadata`, {
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
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
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
          isAdding={isAdding}
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