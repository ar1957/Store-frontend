"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Props {
  orderId: string
  metadata?: Record<string, any> | null
}

export default function VirtualRoomRedirect({ orderId, metadata }: Props) {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "us"
  const [virtualRoomUrl, setVirtualRoomUrl] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
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
        <a href={`/${countryCode}/order/status`} style={{ color: "var(--color-primary, #C9A84C)" }}>order status page</a>
        {" "}at any time.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  box: { background: "#fff", border: "2px solid var(--color-primary, #C9A84C)", borderRadius: 16, padding: "28px 24px", textAlign: "center", margin: "24px 0" },
  spinner: { fontSize: 32, marginBottom: 12 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 8px" },
  text: { fontSize: 14, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 },
  btn: { display: "inline-block", padding: "12px 28px", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none" },
  hint: { fontSize: 12, color: "#9ca3af", marginTop: 12 },
}