"use client"

/**
 * Patient Order Status Page
 * File: src/app/[countryCode]/(main)/order/status/[gfeId]/page.tsx
 *
 * Shows current order status with timeline and tracking info.
 * Auto-refreshes every 60s if still pending provider.
 */

import { useEffect, useState, useCallback, use } from "react"

const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const STATUS_STEPS = [
  { key: "pending_provider",    label: "Pending Provider Clearance", icon: "🩺" },
  { key: "pending_md_review",   label: "Pending Physician Review",   icon: "👨‍⚕️" },
  { key: "processing_pharmacy", label: "Processing by Pharmacy",     icon: "💊" },
  { key: "shipped",             label: "Medication Shipped",         icon: "📦" },
]

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending_provider:    "Your information has been submitted. A provider will review your consultation shortly.",
  pending_md_review:   "Your case has been referred to our Medical Director for additional review.",
  processing_pharmacy: "Your prescription has been approved and is being prepared by our pharmacy.",
  shipped:             "Your medication is on its way! See tracking info below.",
  refund_pending:      "A refund is being processed for your order.",
  refunded:            "Your refund has been issued. Please allow 5–7 business days.",
}

const CARRIERS: Record<string, string> = {
  usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  ups: "https://www.ups.com/track?tracknum=",
  fedex: "https://www.fedex.com/fedextrack/?trknbr=",
  dhl: "https://www.dhl.com/en/express/tracking.html?AWB=",
}

interface OrderStatus {
  gfeId: string
  status: string
  statusLabel: string
  statusDescription: string
  virtualRoomUrl: string | null
  tracking: { trackingNumber: string; carrier: string; shippedAt: string } | null
  timeline: Record<string, string | null>
}

export default function OrderStatusPage({ params: paramsPromise }: { params: Promise<{ gfeId: string }> }) {
  const params = use(paramsPromise)
  const [data, setData] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const pubKey = typeof window !== "undefined" ? ((window as any).__TENANT_API_KEY__ || PUB_KEY) : PUB_KEY
      const res = await fetch(`/api/order-status/${params.gfeId}`, {
        headers: { "x-publishable-api-key": pubKey },
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.message || "Order not found")
        return
      }
      const d = await res.json()
      setData(d)
      setLastChecked(new Date())
    } catch {
      setError("Failed to load order status")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [params.gfeId])

  const refreshFromProvider = async () => {
    setRefreshing(true)
    try {
      await fetchStatus()

      if (data?.status === "pending_provider") {
        const pubKey = typeof window !== "undefined" ? ((window as any).__TENANT_API_KEY__ || PUB_KEY) : PUB_KEY
        const res = await fetch(`/api/order-status/${params.gfeId}`, {
          method: "POST",
          headers: { "x-publishable-api-key": pubKey },
        })
        const d = await res.json()
        if (d.status && d.status !== data?.status) {
          await fetchStatus()
        }
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Auto-poll every 30s while pending provider
  useEffect(() => {
    if (!data || data.status !== "pending_provider") return
    const interval = setInterval(() => fetchStatus(), 30_000)
    return () => clearInterval(interval)
  }, [data?.status])

  if (loading) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.loading}>Loading your order status…</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.error}>{error}</div>
      </div>
    </div>
  )

  if (!data) return null

  const isRefundStatus = ["refund_pending", "refunded"].includes(data.status)
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === data.status)

  const trackingUrl = data.tracking
    ? (CARRIERS[data.tracking.carrier?.toLowerCase()] || "") + data.tracking.trackingNumber
    : null

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerIcon}>{isRefundStatus ? "↩️" : STATUS_STEPS[Math.max(0, currentStepIdx)]?.icon}</div>
          <h1 style={s.statusLabel}>{data.statusLabel}</h1>
          <p style={s.statusDescription}>{STATUS_DESCRIPTIONS[data.status]}</p>
        </div>

        {/* Progress timeline (not shown for refund) */}
        {!isRefundStatus && (
          <div style={s.timeline}>
            {STATUS_STEPS.map((step, i) => {
              const done = i < currentStepIdx
              const active = i === currentStepIdx
              const future = i > currentStepIdx
              return (
                <div key={step.key} style={s.timelineItem}>
                  <div style={{
                    ...s.timelineDot,
                    background: done ? "#22c55e" : active ? "#C9A84C" : "#e5e7eb",
                    border: active ? "3px solid #C9A84C" : "3px solid transparent",
                    boxShadow: active ? "0 0 0 4px #C9A84C22" : "none",
                  }}>
                    {done ? "✓" : step.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ ...s.timelineLine, background: done ? "#22c55e" : "#e5e7eb" }} />
                  )}
                  <div style={{ ...s.timelineLabel, color: future ? "#9ca3af" : "#111", fontWeight: active ? 700 : 400 }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Virtual room link — only when pending provider */}
        {data.status === "pending_provider" && data.virtualRoomUrl && (
          <div style={s.infoBox}>
            <p style={s.infoTitle}>📋 Complete Your Consultation</p>
            <p style={s.infoText}>Your virtual visit is ready. Click below to connect with a provider.</p>
            <a href={data.virtualRoomUrl} target="_blank" rel="noopener noreferrer" style={s.btn}>
              Join Virtual Visit →
            </a>
          </div>
        )}

        {/* Tracking info */}
        {data.tracking && (
          <div style={s.infoBox}>
            <p style={s.infoTitle}>📦 Tracking Information</p>
            <div style={s.trackingRow}>
              <span style={s.trackingLabel}>Carrier</span>
              <span style={s.trackingValue}>{data.tracking.carrier?.toUpperCase()}</span>
            </div>
            <div style={s.trackingRow}>
              <span style={s.trackingLabel}>Tracking #</span>
              <span style={s.trackingValue}>{data.tracking.trackingNumber}</span>
            </div>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={s.btn}>
                Track Package →
              </a>
            )}
          </div>
        )}

        {/* Refresh section */}
        <div style={s.refreshRow}>
          {lastChecked && (
            <span style={s.lastChecked}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button onClick={refreshFromProvider} disabled={refreshing} style={s.refreshBtn}>
            {refreshing ? "Checking…" : "↻ Check Status"}
          </button>
        </div>

        {/* Order reference */}
        <div style={s.refRow}>
          <span style={s.refLabel}>Reference ID</span>
          <span style={s.refValue}>{data.gfeId}</span>
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#f9fafb" },
  card: { background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 520, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" },
  header: { textAlign: "center", marginBottom: 32 },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  statusLabel: { fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 8px" },
  statusDescription: { fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 },
  timeline: { display: "flex", flexDirection: "column", gap: 0, marginBottom: 28 },
  timelineItem: { display: "flex", alignItems: "flex-start", gap: 14, position: "relative" },
  timelineDot: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff", zIndex: 1 },
  timelineLine: { position: "absolute", left: 17, top: 36, width: 2, height: 32, zIndex: 0 } as any,
  timelineLabel: { fontSize: 14, paddingTop: 8, paddingBottom: 24 },
  infoBox: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 16 },
  infoTitle: { fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 6px" },
  infoText: { fontSize: 13, color: "#6b7280", margin: "0 0 14px" },
  btn: { display: "block", textAlign: "center", padding: "12px 20px", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none" },
  trackingRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  trackingLabel: { fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" as const },
  trackingValue: { fontSize: 13, color: "#111", fontWeight: 600 },
  refreshRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 16 },
  lastChecked: { fontSize: 11, color: "#9ca3af" },
  refreshBtn: { padding: "8px 16px", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500 },
  refRow: { display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f3f4f6" },
  refLabel: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase" as const, fontWeight: 600 },
  refValue: { fontSize: 11, color: "#6b7280", fontFamily: "monospace" },
  loading: { textAlign: "center", padding: 40, color: "#9ca3af" },
  error: { textAlign: "center", padding: 40, color: "#dc2626" },
}