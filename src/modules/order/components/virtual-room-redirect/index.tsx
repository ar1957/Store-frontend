"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Props {
  orderId: string
  metadata?: Record<string, any> | null
}

interface HoursStatus {
  isOpen: boolean
  formattedHours: string[]
  timezone: string
}

function ClosedMessage({ hours, timezone }: { hours: string[]; timezone: string }) {
  return (
    <div style={s.closedBox}>
      <div style={s.closedIcon}>🕐</div>
      <p style={s.closedTitle}>Providers are currently offline</p>
      <p style={s.closedText}>
        Our providers are not available right now. Please return during operating hours to connect.
      </p>
      {hours.length > 0 && (
        <div style={s.hoursGrid}>
          {hours.map((line, i) => (
            <span key={i} style={s.hoursLine}>{line}</span>
          ))}
          <span style={s.hoursTimezone}>{timezone}</span>
        </div>
      )}
    </div>
  )
}

export default function VirtualRoomRedirect({ orderId, metadata }: Props) {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "us"
  const [virtualRoomUrl, setVirtualRoomUrl] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [isPendingPharmacy, setIsPendingPharmacy] = useState(false)
  const [hoursStatus, setHoursStatus] = useState<HoursStatus | null>(null)

  // Fetch operating hours non-blocking
  useEffect(() => {
    fetch("/api/operating-hours")
      .then(r => r.json())
      .then(d => setHoursStatus(d))
      .catch(() => setHoursStatus({ isOpen: true, formattedHours: [], timezone: "Pacific Time (PT)" }))
  }, [])

  useEffect(() => {
    // Direct-to-pharmacy order — no GFE, no virtual room needed
    if (metadata?.workflowStatus === "pending_pharmacy") {
      setIsPendingPharmacy(true)
      setChecking(false)
      return
    }

    if (metadata?.virtualRoomUrl) {
      setVirtualRoomUrl(metadata.virtualRoomUrl)
      setChecking(false)
      return
    }

    // Poll for up to 90 seconds — AWS GFE API can take longer than local
    let attempts = 0
    const maxAttempts = 30

    const poll = async () => {
      try {
        const PUB_KEY = (typeof window !== "undefined" && (window as any).__TENANT_API_KEY__)
          || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

        const res = await fetch(`/api/gfe-status/${orderId}`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        })

        if (res.ok) {
          const data = await res.json()
          // Stop polling immediately if order is direct-to-pharmacy
          if (data.status === "pending_pharmacy") {
            setIsPendingPharmacy(true)
            setChecking(false)
            return
          }
          if (data.virtualRoomUrl) {
            setVirtualRoomUrl(data.virtualRoomUrl)
            setChecking(false)
            return
          }
        }
      } catch {
        // silent
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000)
      } else {
        setChecking(false)
      }
    }

    setTimeout(poll, 2000)
  }, [orderId, metadata])

  if (isPendingPharmacy) {
    return (
      <div style={s.box}>
        <div style={s.icon}>💊</div>
        <h3 style={s.title}>Order confirmed!</h3>
        <p style={s.text}>
          Your order is being prepared by our pharmacy and will ship soon.
          You can track your order on the{" "}
          <a href={`/${countryCode}/order/status`} style={{ color: "var(--color-primary, #C9A84C)" }}>order status page</a>.
        </p>
      </div>
    )
  }

  if (!virtualRoomUrl && !checking) {
    return (
      <div style={s.box}>
        <div style={s.spinner}>🩺</div>
        <p style={s.text}>
          Your consultation has been created. A provider will review your information shortly.
          You can check back on your{" "}
          <a href={`/${countryCode}/order/status`} style={{ color: "var(--color-primary, #C9A84C)" }}>order status page</a>
          {" "}for updates.
        </p>
      </div>
    )
  }

  if (checking) {
    return (
      <div style={s.box}>
        <div style={s.spinner}>⏳</div>
        <p style={s.text}>Preparing your virtual consultation…</p>
      </div>
    )
  }

  // Has virtualRoomUrl — check operating hours before showing button
  const isClosed = hoursStatus !== null && hoursStatus.isOpen === false

  return (
    <div style={s.box}>
      <div style={s.icon}>🩺</div>
      <h3 style={s.title}>Your consultation is ready!</h3>
      {isClosed ? (
        <ClosedMessage hours={hoursStatus!.formattedHours} timezone={hoursStatus!.timezone} />
      ) : (
        <>
          <p style={s.text}>
            A provider is waiting to review your information.
            Please join your virtual visit now to complete your order.
          </p>
          <a href={virtualRoomUrl!} style={s.btn}>
            Join Virtual Visit →
          </a>
          <p style={s.hint}>
            You can also access this link from your{" "}
            <a href={`/${countryCode}/order/status`} style={{ color: "var(--color-primary, #C9A84C)" }}>order status page</a>
            {" "}at any time.
          </p>
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  box:          { background: "#fff", border: "2px solid var(--color-primary, #C9A84C)", borderRadius: 16, padding: "28px 24px", textAlign: "center", margin: "24px 0" },
  spinner:      { fontSize: 32, marginBottom: 12 },
  icon:         { fontSize: 40, marginBottom: 12 },
  title:        { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" },
  text:         { fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 },
  btn:          { display: "inline-block", padding: "12px 28px", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none" },
  hint:         { fontSize: 12, color: "#9ca3af", marginTop: 12 },
  closedBox:    { background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "20px", marginTop: 8, textAlign: "center" },
  closedIcon:   { fontSize: 28, marginBottom: 8 },
  closedTitle:  { fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 6px" },
  closedText:   { fontSize: 13, color: "#78350f", margin: "0 0 14px", lineHeight: 1.6 },
  hoursGrid:    { display: "flex", flexDirection: "column", gap: 4, alignItems: "center" },
  hoursLine:    { fontSize: 13, fontWeight: 600, color: "#374151" },
  hoursTimezone:{ fontSize: 11, color: "#9ca3af", marginTop: 4 },
}
