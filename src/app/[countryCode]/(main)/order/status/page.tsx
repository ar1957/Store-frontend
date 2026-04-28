"use client"

/**
 * Patient Order Lookup Page
 * File: src/app/[countryCode]/(main)/order/status/page.tsx
 *
 * Patients enter email OR order ID to find all their orders.
 * Each result links to the full status page for that order.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_provider:    { label: "Pending Provider Clearance", color: "#92400e", bg: "#fef3c7", icon: "🩺" },
  pending_md_review:   { label: "Pending Physician Review",   color: "#1e40af", bg: "#dbeafe", icon: "👨‍⚕️" },
  processing_pharmacy: { label: "Processing by Pharmacy",     color: "#065f46", bg: "#d1fae5", icon: "💊" },
  pending_pharmacy:    { label: "Being Prepared by Pharmacy", color: "#065f46", bg: "#d1fae5", icon: "💊" },
  shipped:             { label: "Medication Shipped",         color: "#1e3a5f", bg: "#e0f2fe", icon: "📦" },
  refund_pending:      { label: "Refund Processing",          color: "#7c2d12", bg: "#ffedd5", icon: "↩️" },
  refunded:            { label: "Refund Issued",              color: "#374151", bg: "#f3f4f6", icon: "✅" },
}

interface OrderResult {
  orderId: string
  gfeId: string | null
  status: string
  statusLabel: string
  providerName: string | null
  virtualRoomUrl?: string | null
  pharmacyQueueId?: string | null
  pharmacyStatus?: string | null
  tracking: { trackingNumber: string; carrier: string; shippedAt: string } | null
  createdAt: string
}

export default function OrderLookupPage() {
  const params = useParams()
  const countryCode = params?.countryCode as string || "us"

  const [searchType, setSearchType] = useState<"email" | "orderId">("email")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<OrderResult[] | null>(null)
  const [error, setError] = useState("")
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [roomUrls, setRoomUrls] = useState<Record<string, string>>({})
  const [connectMsg, setConnectMsg] = useState<Record<string, string>>({})
  const [hoursStatus, setHoursStatus] = useState<{
    isOpen: boolean
    formattedHours: string[]
    timezone: string
  } | null>(null)

  useEffect(() => {
    fetch("/api/operating-hours")
      .then(r => r.json())
      .then(d => setHoursStatus(d))
      .catch(() => setHoursStatus({ isOpen: true, formattedHours: [], timezone: "Pacific Time (PT)" }))
  }, [])

  const handleSearch = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    setOrders(null)

    try {
      const param = searchType === "email"
        ? `email=${encodeURIComponent(input.trim())}`
        : `orderId=${encodeURIComponent(input.trim())}`

      const pubKey = typeof window !== "undefined" ? ((window as any).__TENANT_API_KEY__ || "") : ""
      const res = await fetch(`/api/orders-lookup?${param}`, {
        headers: { "x-publishable-api-key": pubKey },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "No orders found")
        return
      }

      setOrders(data.orders || [])
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleConnect = async (order: OrderResult) => {
    if (!order.gfeId) return

    // Use virtualRoomUrl from lookup if available
    const url = order.virtualRoomUrl || roomUrls[order.gfeId]
    if (url) {
      window.open(url, "_blank")
      return
    }

    // Fallback: POST to refresh status and get URL
    setConnectingId(order.gfeId)
    setConnectMsg(prev => ({ ...prev, [order.gfeId!]: "" }))
    try {
      const pubKey = typeof window !== "undefined" ? ((window as any).__TENANT_API_KEY__ || "") : ""
      const res = await fetch(`/api/order-status/${order.gfeId}`, {
        method: "POST",
        headers: { "x-publishable-api-key": pubKey },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.virtualRoomUrl) {
          setRoomUrls(prev => ({ ...prev, [order.gfeId!]: data.virtualRoomUrl }))
          window.open(data.virtualRoomUrl, "_blank")
          return
        }
      }
      // No room URL yet — provider hasn't opened the session
      setConnectMsg(prev => ({ ...prev, [order.gfeId!]: "Your provider hasn't opened the session yet. Please check back shortly." }))
    } catch {
      setConnectMsg(prev => ({ ...prev, [order.gfeId!]: "Could not connect. Please try again." }))
    }
    finally { setConnectingId(null) }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.icon}>📦</div>
          <h1 style={s.title}>Track Your Order</h1>
          <p style={s.subtitle}>Enter your email address or order ID to view your order status.</p>
        </div>

        {/* Search Card */}
        <div style={s.card}>
          {/* Toggle */}
          <div style={s.toggle}>
            <button
              onClick={() => { setSearchType("email"); setInput(""); setOrders(null); setError("") }}
              style={{ ...s.toggleBtn, ...(searchType === "email" ? s.toggleActive : {}) }}>
              Search by Email
            </button>
            <button
              onClick={() => { setSearchType("orderId"); setInput(""); setOrders(null); setError("") }}
              style={{ ...s.toggleBtn, ...(searchType === "orderId" ? s.toggleActive : {}) }}>
              Search by Order ID
            </button>
          </div>

          {/* Input */}
          <div style={s.inputRow}>
            <input
              style={s.input}
              type={searchType === "email" ? "email" : "text"}
              placeholder={searchType === "email" ? "your@email.com" : "e.g. 01J8..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading || !input.trim()}
              style={{ ...s.searchBtn, opacity: (!input.trim() || loading) ? 0.6 : 1 }}>
              {loading ? "Searching…" : "Find Orders"}
            </button>
          </div>

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Results */}
        {orders && orders.length > 0 && (
          <div style={s.results}>
            <div style={s.resultsHeader}>
              Found {orders.length} order{orders.length !== 1 ? "s" : ""}
            </div>
            {orders.map((order, i) => {
              const meta = STATUS_META[order.status] || { label: order.statusLabel, color: "#374151", bg: "#f3f4f6", icon: "📋" }
              return (
                <div key={i} style={s.orderCard}>
                  <div style={s.orderCardTop}>
                    <div>
                      <div style={s.orderId}>Order #{order.orderId.slice(-8).toUpperCase()}</div>
                      <div style={s.orderDate}>
                        Placed {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                      </div>
                    </div>
                    {order.status === "pending_provider" && hoursStatus !== null && hoursStatus.isOpen === false ? (
                      <span style={{ ...s.badge, background: "#fef3c7", color: "#92400e" }}>
                        🕐 Providers Offline
                      </span>
                    ) : order.status === "pending_provider" ? (
                      <button
                        onClick={() => handleConnect(order)}
                        disabled={connectingId === order.gfeId}
                        style={{ ...s.badge, ...s.badgeBtn, background: meta.bg, color: meta.color, cursor: "pointer" }}>
                        {connectingId === order.gfeId ? "⏳ Connecting…" : "🩺 Connect Me With a Provider"}
                      </button>
                    ) : (
                      <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                    )}
                  </div>

                  {order.status === "pending_provider" && hoursStatus?.isOpen === false && (
                    <div style={s.closedBox}>
                      <p style={s.closedTitle}>Our providers are not available right now.</p>
                      <p style={s.closedText}>Please return during operating hours to connect:</p>
                      {hoursStatus.formattedHours.map((line, i) => (
                        <div key={i} style={s.hoursLine}>{line}</div>
                      ))}
                      {hoursStatus.formattedHours.length > 0 && (
                        <div style={s.hoursTimezone}>{hoursStatus.timezone}</div>
                      )}
                    </div>
                  )}

                  {order.providerName && (
                    <div style={s.detail}>Provider: <strong>{order.providerName}</strong></div>
                  )}

                  {order.status === "processing_pharmacy" && order.pharmacyQueueId && (
                    <div style={s.pharmacyBox}>
                      <span style={s.pharmacyId}>Order ID: <strong>{order.pharmacyQueueId}</strong></span>
                      {order.pharmacyStatus && (
                        <span style={s.pharmacyBadge}>{order.pharmacyStatus}</span>
                      )}
                    </div>
                  )}

                  {order.gfeId && connectMsg[order.gfeId] && (
                    <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                      ⏳ {connectMsg[order.gfeId]}
                    </div>
                  )}

                  {order.tracking && (
                    <div style={s.trackingBox}>
                      <span>📦 {order.tracking.carrier}: </span>
                      <strong>{order.tracking.trackingNumber}</strong>
                    </div>
                  )}

                  {order.gfeId ? (
                    <Link
                      href={`/${countryCode}/order/status/${order.gfeId}`}
                      style={s.viewBtn}>
                      View Full Status →
                    </Link>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
                      Order processing — full status will be available shortly.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {orders && orders.length === 0 && (
          <div style={s.emptyBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>No orders found for that {searchType === "email" ? "email address" : "order ID"}.</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Double-check the spelling and try again, or contact support.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: "40px 16px" },
  container: { maxWidth: 600, margin: "0 auto" },
  header: { textAlign: "center", marginBottom: 32 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 8px" },
  subtitle: { fontSize: 15, color: "#6b7280", margin: 0 },
  card: { background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 },
  toggle: { display: "flex", gap: 8, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4 },
  toggleBtn: { flex: 1, padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#6b7280", transition: "all 0.15s" },
  toggleActive: { background: "#fff", color: "#111", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: "11px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", color: "#111" },
  searchBtn: { padding: "11px 20px", background: "#111", color: "#fff", border: "none", borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  errorBox: { marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", display: "flex", gap: 8, alignItems: "center" },
  results: { display: "flex", flexDirection: "column", gap: 16 },
  resultsHeader: { fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  orderCard: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  orderCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12, flexWrap: "wrap" },
  orderId: { fontSize: 15, fontWeight: 700, color: "#111" },
  orderDate: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  badge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  badgeBtn: { border: "none", transition: "opacity 0.15s", outline: "none", fontFamily: "inherit" },
  detail: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  trackingBox: { fontSize: 13, color: "#374151", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", marginBottom: 12 },
  viewBtn: { display: "inline-block", marginTop: 12, padding: "9px 18px", background: "#111", color: "#fff", borderRadius: 16, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  emptyBox: { background: "#fff", borderRadius: 14, padding: 32, textAlign: "center", color: "#374151", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  pharmacyBox: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const },
  pharmacyId: { fontSize: 12, color: "#374151" },
  pharmacyBadge:  { fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46", borderRadius: 20, padding: "2px 10px" },
  closedBox:      { background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 10 },
  closedTitle:    { fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 2px" },
  closedText:     { fontSize: 12, color: "#78350f", margin: "0 0 8px" },
  hoursLine:      { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 2 },
  hoursTimezone:  { fontSize: 11, color: "#9ca3af", marginTop: 4 },
}