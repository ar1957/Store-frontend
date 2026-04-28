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

// Timeline steps — "pharmacy_received" is a virtual sub-step of processing_pharmacy
const STATUS_STEPS = [
  { key: "pending_provider",    label: "Pending Provider Clearance", icon: "🩺" },
  { key: "pending_md_review",   label: "Pending Physician Review",   icon: "👨‍⚕️" },
  { key: "processing_pharmacy", label: "Processing by Pharmacy",     icon: "💊" },
  { key: "pharmacy_received",   label: "Order Received by Pharmacy", icon: "📋" },
  { key: "shipped",             label: "Medication Shipped",         icon: "📦" },
]

// Map real statuses to step index
function getStepIndex(status: string, pharmacyStatus?: string | null): number {
  if (status === "shipped") return 4
  if (status === "processing_pharmacy" || status === "pending_pharmacy") {
    return pharmacyStatus ? 3 : 2
  }
  if (status === "pending_md_review") return 1
  return 0 // pending_provider
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending_provider:    "Your information has been submitted. A provider will review your consultation shortly.",
  pending_md_review:   "Your case has been referred to our Medical Director for additional review.",
  processing_pharmacy: "Your prescription has been approved and is being prepared by our pharmacy.",
  pending_pharmacy:    "Your order is being prepared by our pharmacy and will ship soon.",
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
  pharmacyQueueId: string | null
  pharmacyStatus: string | null
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
  const [hoursStatus, setHoursStatus] = useState<{
    isOpen: boolean
    formattedHours: string[]
    timezone: string
  } | null>(null)

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

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Fetch operating hours once on mount (non-blocking)
  useEffect(() => {
    fetch("/api/operating-hours")
      .then(r => r.json())
      .then(d => setHoursStatus(d))
      .catch(() => setHoursStatus({ isOpen: true, formattedHours: [], timezone: "Pacific Time (PT)" }))
  }, [])

  // Auto-poll every 30s while pending provider (not needed for pending_pharmacy)
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
  const currentStepIdx = getStepIndex(data.status, data.pharmacyStatus)

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
          <p style={s.statusDescription}>{STATUS_DESCRIPTIONS[data.status] || data.statusDescription}</p>
        </div>

        {/* Progress timeline (not shown for refund) */}
        {!isRefundStatus && (
          <div style={s.timeline}>
            {STATUS_STEPS.map((step, i) => {
              // Skip "pharmacy_received" step if there's no pharmacy status yet
              if (step.key === "pharmacy_received" && !data.pharmacyStatus && data.status !== "shipped") return null
              // Skip "pending_md_review" step if order never went through MD review
              if (step.key === "pending_md_review" && currentStepIdx > 1 && data.status !== "pending_md_review") return null

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
                    {/* Show pharmacy queue ID + status on the pharmacy_received step */}
                    {step.key === "pharmacy_received" && active && data.pharmacyQueueId && (
                      <div style={s.pharmacyMeta}>
                        <span style={s.pharmacyMetaItem}>Order ID: <strong>{data.pharmacyQueueId}</strong></span>
                        {data.pharmacyStatus && (
                          <span style={s.pharmacyStatusBadge}>{data.pharmacyStatus}</span>
                        )}
                      </div>
                    )}
                    {/* Show tracking on shipped step */}
                    {step.key === "shipped" && active && data.tracking && (
                      <div style={s.pharmacyMeta}>
                        <span style={s.pharmacyMetaItem}>Tracking: <strong>{data.tracking.trackingNumber}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pharmacy info box — shown when at pharmacy */}
        {(data.status === "processing_pharmacy") && data.pharmacyQueueId && (
          <div style={s.infoBox}>
            <p style={s.infoTitle}>💊 Pharmacy Order Details</p>
            <div style={s.trackingRow}>
              <span style={s.trackingLabel}>Order / Queue ID</span>
              <span style={s.trackingValue}>{data.pharmacyQueueId}</span>
            </div>
            {data.pharmacyStatus && (
              <div style={s.trackingRow}>
                <span style={s.trackingLabel}>Status</span>
                <span style={{ ...s.trackingValue, color: "#065f46", fontWeight: 700 }}>{data.pharmacyStatus}</span>
              </div>
            )}
            <p style={s.infoNote}>We check for updates every 5 minutes. You'll be notified when your order ships.</p>
          </div>
        )}

        {/* Virtual room link — only when pending provider (not for direct-to-pharmacy orders) */}
        {data.status === "pending_provider" && data.virtualRoomUrl && (
          <div style={s.infoBox}>
            <p style={s.infoTitle}>📋 Complete Your Consultation</p>
            {hoursStatus !== null && hoursStatus.isOpen === false ? (
              <>
                <div style={s.closedBox}>
                  <span style={s.closedIcon}>🕐</span>
                  <p style={s.closedTitle}>Providers are currently offline</p>
                  <p style={s.closedText}>
                    Please return during operating hours below to connect with a provider.
                  </p>
                  {hoursStatus.formattedHours.length > 0 && (
                    <div style={s.hoursGrid}>
                      {hoursStatus.formattedHours.map((line, i) => (
                        <span key={i} style={s.hoursLine}>{line}</span>
                      ))}
                      <span style={s.hoursTimezone}>{hoursStatus.timezone}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <p style={s.infoText}>Your virtual visit is ready. Click below to connect with a provider.</p>
                <a href={data.virtualRoomUrl} target="_blank" rel="noopener noreferrer" style={s.btn}>
                  Join Virtual Visit →
                </a>
              </>
            )}
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
  pharmacyMeta: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 4, alignItems: "center" },
  pharmacyMetaItem: { fontSize: 12, color: "#374151" },
  pharmacyStatusBadge: { fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46", borderRadius: 20, padding: "2px 10px" },
  infoBox: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 16 },
  infoTitle: { fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 10px" },
  infoText: { fontSize: 13, color: "#6b7280", margin: "0 0 14px" },
  infoNote: { fontSize: 12, color: "#9ca3af", margin: "10px 0 0" },
  btn: { display: "block", textAlign: "center", padding: "12px 20px", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none", marginTop: 12 },
  trackingRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  trackingLabel: { fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" as const },
  trackingValue: { fontSize: 13, color: "#111", fontWeight: 600 },
  refreshRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 16 },
  lastChecked: { fontSize: 11, color: "#9ca3af" },
  refreshBtn: { padding: "8px 16px", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500 },
  refRow: { display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f3f4f6" },
  refLabel: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase" as const, fontWeight: 600 },
  refValue: { fontSize: 11, color: "#6b7280", fontFamily: "monospace" },
  loading:       { textAlign: "center", padding: 40, color: "#9ca3af" },
  error:         { textAlign: "center", padding: 40, color: "#dc2626" },
  closedBox:     { background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "16px", textAlign: "center" },
  closedIcon:    { fontSize: 24, display: "block", marginBottom: 6 },
  closedTitle:   { fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 4px" },
  closedText:    { fontSize: 13, color: "#78350f", margin: "0 0 12px", lineHeight: 1.6 },
  hoursGrid:     { display: "flex", flexDirection: "column", gap: 3, alignItems: "center" },
  hoursLine:     { fontSize: 13, fontWeight: 600, color: "#374151" },
  hoursTimezone: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
}
