"use client"

/**
 * LegalPage — shared layout for all legal/policy pages.
 * Replaces {{CLINIC_NAME}} in content with the actual clinic name.
 */
import { useEffect, useState } from "react"

type Props = {
  title: string
  content: string // HTML string with {{CLINIC_NAME}} placeholders
}

export default function LegalPage({ title, content }: Props) {
  const [clinicName, setClinicName] = useState("Our Clinic")

  useEffect(() => {
    // Read clinic name from the tenant config injected by middleware
    const name = (window as any).__TENANT_NAME__ || document.title.split(" – ")[0] || "Our Clinic"
    setClinicName(name)
  }, [])

  const rendered = content.replace(/\{\{CLINIC_NAME\}\}/g, clinicName)

  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-ui-fg-base">{title}</h1>
      <div
        className="prose prose-sm max-w-none text-ui-fg-subtle"
        style={{ lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}
