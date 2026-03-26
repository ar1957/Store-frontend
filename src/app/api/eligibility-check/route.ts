/**
 * GET /api/eligibility-check?domain=...&productId=...
 *
 * Runs the eligibility check directly against Postgres — no Medusa backend
 * hop needed. This cuts latency from ~5s (browser→Next→Medusa→PG) to <100ms
 * (Next→PG directly).
 *
 * Result is cached for 60s per domain+product pair since eligibility config
 * changes rarely.
 */
import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// In-process cache: key = `${domain}:${productId}`, value = { result, expiresAt }
const cache = new Map<string, { result: boolean; expiresAt: number }>()
const CACHE_TTL = 60_000 // 60 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const domain = searchParams.get("domain") || ""
  const productId = searchParams.get("productId") || ""

  if (!domain || !productId) {
    return NextResponse.json({ requiresEligibility: false })
  }

  // Check in-process cache first
  const cacheKey = `${domain}:${productId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ requiresEligibility: cached.result })
  }

  try {
    // Build domain variants (with/without port, .local → production equivalent)
    const domainNoPort = domain.split(":")[0]
    const localBase = domainNoPort.replace(/\.local$/, "")
    const variants = Array.from(new Set([domain, domainNoPort]))

    // Single query: join clinic → product_treatment_map using the ANY operator
    // on the clinic.domains jsonb/array column, covering all domain variants.
    const result = await pool.query<{ requires_eligibility: boolean }>(`
      SELECT ptm.requires_eligibility
      FROM product_treatment_map ptm
      WHERE ptm.product_id = $1
        AND ptm.deleted_at IS NULL
        AND ptm.tenant_domain = ANY(
          SELECT unnest(c.domains)
          FROM clinic c
          WHERE c.deleted_at IS NULL
            AND (
              c.domains && $2::text[]
              OR EXISTS (
                SELECT 1 FROM unnest(c.domains) d
                WHERE split_part(d, ':', 1) = ANY($2::text[])
                   OR regexp_replace(split_part(d, ':', 1), '\\.(com|net|org|io)$', '') = $3
              )
            )
        )
      LIMIT 1
    `, [productId, variants, localBase])

    const requiresEligibility = result.rows[0]?.requires_eligibility === true

    // Cache the result
    cache.set(cacheKey, { result: requiresEligibility, expiresAt: Date.now() + CACHE_TTL })

    return NextResponse.json({ requiresEligibility })
  } catch (err) {
    console.error("[eligibility-check] DB error:", err)
    // Fall back to the Medusa backend on DB error
    try {
      const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const DEFAULT_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      const pubKey = req.headers.get("x-publishable-api-key") || DEFAULT_KEY
      const res = await fetch(
        `${BACKEND}/store/eligibility/check?domain=${encodeURIComponent(domain)}&productId=${encodeURIComponent(productId)}`,
        { headers: { "x-publishable-api-key": pubKey, "x-forwarded-host": domain }, cache: "no-store" }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ requiresEligibility: false })
    }
  }
}
