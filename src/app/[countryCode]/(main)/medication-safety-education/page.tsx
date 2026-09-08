import { headers } from "next/headers"
import { Metadata } from "next"
import MedicationSafetyEducationContent from "./content"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Medication Safety & Patient Education" }

async function getClinicName(host: string): Promise<string> {
  try {
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backend}/store/clinics/tenant-config`, {
      headers: { "x-forwarded-host": host, "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      cache: "no-store",
    })
    if (res.ok) { const data = await res.json(); return data?.tenant?.name || "Our Clinic" }
  } catch {}
  return "Our Clinic"
}

async function getContactPhone(host: string): Promise<string | null> {
  try {
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backend}/store/clinics/ui-config`, {
      headers: {
        "x-forwarded-host": host,
        "x-tenant-domain": host.split(":")[0],
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      cache: "no-store",
    })
    if (res.ok) { const data = await res.json(); return data?.config?.contact_phone || null }
  } catch {}
  return null
}

export default async function MedicationSafetyEducationPage() {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host") || ""
  const [clinic, phone] = await Promise.all([getClinicName(host), getContactPhone(host)])
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Medication Safety &amp; Patient Education</h1>
      <p className="text-lg text-ui-fg-muted mb-8">{clinic}</p>
      <MedicationSafetyEducationContent clinic={clinic} phone={phone} />
    </div>
  )
}
