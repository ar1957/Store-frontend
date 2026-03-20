"use client"

/**
 * VirtualRoomRedirect component
 * File: src/modules/order/components/virtual-room-redirect/index.tsx
 *
 * Drop this into the order confirmation page.
 * If the order has a virtualRoomUrl in metadata, shows a prompt to join.
 */

import { useEffect, useState } from "react"

interface Props {
  orderId: string
  metadata?: Record<string, any> | null
}

export default function VirtualRoomRedirect({ orderId, metadata }: Props) {
  const [virtualRoomUrl, setVirtualRoomUrl] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if order already has virtualRoomUrl in metadata
    if (metadata?.virtualRoomUrl) {
      setVirtualRoomUrl(metadata.virtualRoomUrl)
      setChecking(false)
      return
    }

    // Poll for up to 30 seconds waiting for subscriber to create GFE
    let attempts = 0
    const maxAttempts = 10

    const poll = async () => {
      try {
        const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

        const res = await fetch(`${BACKEND}/store/orders/${orderId}/gfe-status`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        })

        if (res.ok) {
          const data = await res.json()
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

    setTimeout(poll, 3000) // Start polling after 3s delay
  }, [orderId, metadata])

  if (!virtualRoomUrl && !checking) return null

  if (checking) {
    return (
      <div style={s.box}>
        <div style={s.spinner}>⏳</div>
        <p style={s.text}>Preparing your virtual consultation…</p>
      </div>
    )
  }

  return (
    <div style={s.box}>
      <div style={s.icon}>🩺</div>
      <h3 style={s.title}>Your consultation is ready!</h3>
      <p style={s.text}>
        A provider is waiting to review your information.
        Please join your virtual visit now to complete your order.
      </p>
      <a href={virtualRoomUrl!} style={s.btn}>
        Join Virtual Visit →
      </a>
      <p style={s.hint}>
        You can also access this link from your{" "}
        <a href={`/order/status`} style={{ color: "#C9A84C" }}>order status page</a>
        {" "}at any time.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  box: { background: "#fff", border: "2px solid #C9A84C", borderRadius: 16, padding: "28px 24px", textAlign: "center", margin: "24px 0" },
  spinner: { fontSize: 32, marginBottom: 12 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" },
  text: { fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 },
  btn: { display: "inline-block", padding: "12px 28px", background: "#C9A84C", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none" },
  hint: { fontSize: 12, color: "#9ca3af", marginTop: 12 },
}